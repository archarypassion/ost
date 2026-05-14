import tls from 'node:tls';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeDomain } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONNECT_TIMEOUT_MS = 10_000;

function tlsConnect(host, port, servername, rejectUnauthorized) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host, port, servername,
      rejectUnauthorized,
      timeout: CONNECT_TIMEOUT_MS,
      ALPNProtocols: ['h2', 'http/1.1'],
    }, () => {
      const peer = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();
      const alpn = socket.alpnProtocol;
      socket.end();
      resolve({ ok: true, cert: peer, protocol, cipher, alpn, authorized: socket.authorized, authError: socket.authorizationError ? String(socket.authorizationError) : null });
    });
    socket.on('error', (err) => {
      resolve({ ok: false, error: err?.message || String(err), code: err?.code || null });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'TLS handshake timed out.', code: 'ETIMEDOUT' });
    });
  });
}

function summariseCert(cert) {
  if (!cert || !Object.keys(cert).length) return null;
  const subject = cert.subject || {};
  const issuer = cert.issuer || {};
  const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
  const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
  const now = new Date();
  const daysUntilExpiry = validTo ? Math.floor((validTo - now) / (1000 * 60 * 60 * 24)) : null;
  const altNames = (cert.subjectaltname || '').split(',').map((s) => s.trim()).filter(Boolean);

  // Build chain (issuerCertificate forms a linked list; final cert references itself)
  const chain = [];
  let walker = cert;
  const seen = new Set();
  while (walker && walker.fingerprint && !seen.has(walker.fingerprint)) {
    seen.add(walker.fingerprint);
    chain.push({
      subject: walker.subject?.CN || walker.subject?.O || '(unknown)',
      issuer: walker.issuer?.CN || walker.issuer?.O || '(unknown)',
      validFrom: walker.valid_from || null,
      validTo: walker.valid_to || null,
      fingerprint256: walker.fingerprint256 || null,
      bits: walker.bits || null,
      keyAlgorithm: walker.asn1Curve || walker.pubkey?.algorithm || (walker.bits ? `RSA-${walker.bits}` : null),
    });
    if (walker.issuerCertificate && walker.issuerCertificate.fingerprint !== walker.fingerprint) {
      walker = walker.issuerCertificate;
    } else break;
  }

  return {
    subject: {
      commonName: subject.CN || null,
      organisation: subject.O || null,
      country: subject.C || null,
    },
    issuer: {
      commonName: issuer.CN || null,
      organisation: issuer.O || null,
      country: issuer.C || null,
    },
    serial: cert.serialNumber || null,
    validFrom: cert.valid_from || null,
    validTo: cert.valid_to || null,
    daysUntilExpiry,
    expired: daysUntilExpiry !== null && daysUntilExpiry < 0,
    notYetValid: validFrom && validFrom > now,
    altNames,
    fingerprint: cert.fingerprint || null,
    fingerprint256: cert.fingerprint256 || null,
    keyBits: cert.bits || null,
    sigAlg: cert.sigalg || null,
    chain,
    chainLength: chain.length,
  };
}

function hostMatchesCert(host, certSummary) {
  if (!certSummary) return false;
  const candidates = new Set();
  if (certSummary.subject?.commonName) candidates.add(certSummary.subject.commonName);
  for (const alt of certSummary.altNames) {
    const m = alt.match(/^DNS:(.+)$/i);
    if (m) candidates.add(m[1].trim());
  }
  for (const candidate of candidates) {
    if (matchHostname(host, candidate)) return true;
  }
  return false;
}

function matchHostname(host, pattern) {
  if (!host || !pattern) return false;
  host = host.toLowerCase();
  pattern = pattern.toLowerCase();
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    if (host === suffix) return false;
    if (!host.endsWith('.' + suffix)) return false;
    const left = host.slice(0, host.length - suffix.length - 1);
    return left.length > 0 && !left.includes('.');
  }
  return host === pattern;
}

function buildChecks(host, summary, conn, secondary) {
  const c = [];
  if (!summary) {
    c.push({ severity: 'fail', message: 'No certificate was presented.' });
    return c;
  }
  if (summary.expired) c.push({ severity: 'fail', message: `Certificate expired ${Math.abs(summary.daysUntilExpiry)} days ago.` });
  else if (summary.daysUntilExpiry !== null && summary.daysUntilExpiry <= 14) c.push({ severity: 'fail', message: `Certificate expires in ${summary.daysUntilExpiry} day${summary.daysUntilExpiry === 1 ? '' : 's'} — renew immediately.` });
  else if (summary.daysUntilExpiry !== null && summary.daysUntilExpiry <= 30) c.push({ severity: 'warn', message: `Certificate expires in ${summary.daysUntilExpiry} days — schedule renewal.` });
  else if (summary.daysUntilExpiry !== null) c.push({ severity: 'pass', message: `Certificate is valid for another ${summary.daysUntilExpiry} days.` });

  if (summary.notYetValid) c.push({ severity: 'fail', message: 'Certificate is not yet valid (notBefore is in the future).' });

  if (hostMatchesCert(host, summary)) c.push({ severity: 'pass', message: `Hostname "${host}" matches the certificate.` });
  else c.push({ severity: 'fail', message: `Hostname "${host}" does not match any DNS name on the certificate (CN: ${summary.subject?.commonName || '—'}).` });

  if (conn?.authorized) c.push({ severity: 'pass', message: `Certificate is trusted by Node.js’s root store (issued by ${summary.issuer?.commonName || summary.issuer?.organisation || '—'}).` });
  else c.push({ severity: 'fail', message: `Certificate is NOT trusted: ${conn?.authError || 'unknown reason'}.` });

  if (conn?.protocol) {
    const p = conn.protocol;
    if (p === 'TLSv1.3') c.push({ severity: 'pass', message: 'Negotiated TLS 1.3 — modern and fast.' });
    else if (p === 'TLSv1.2') c.push({ severity: 'pass', message: 'Negotiated TLS 1.2 — acceptable. Enable TLS 1.3 for better performance.' });
    else c.push({ severity: 'fail', message: `Negotiated ${p} — deprecated. Disable TLS ≤ 1.1 immediately.` });
  }

  if (conn?.cipher?.name) {
    const name = conn.cipher.name;
    if (/RC4|3DES|DES|MD5|EXPORT|NULL|EXP/i.test(name)) c.push({ severity: 'fail', message: `Negotiated weak cipher "${name}" — disable on the server.` });
    else c.push({ severity: 'pass', message: `Cipher: ${name} (${conn.cipher.version})` });
  }

  if (summary.sigAlg && /sha1|md5/i.test(summary.sigAlg)) c.push({ severity: 'fail', message: `Certificate signed with weak algorithm "${summary.sigAlg}".` });

  if (summary.keyBits && summary.keyBits < 2048 && /rsa/i.test(summary.keyAlgorithm || '')) {
    c.push({ severity: 'fail', message: `RSA key is only ${summary.keyBits} bits — use ≥ 2048.` });
  }

  if (secondary && !secondary.ok && conn?.ok) {
    c.push({ severity: 'warn', message: `TLS 1.0/1.1-only fallback failed (good — old protocols disabled): ${secondary.error}` });
  }
  return c;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  let host;
  try { host = normalizeDomain(body?.url || body?.domain); }
  catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
  const port = 443;

  try {
    const startedAt = Date.now();
    const conn = await tlsConnect(host, port, host, true);
    const elapsedMs = Date.now() - startedAt;

    // If trust failed, reconnect with rejectUnauthorized:false to still inspect the cert
    let certConn = conn;
    if (!conn.ok || (!conn.authorized && !conn.cert)) {
      certConn = await tlsConnect(host, port, host, false);
    }
    const summary = summariseCert(certConn?.cert);
    const checks = buildChecks(host, summary, certConn);

    const payload = {
      host, port,
      elapsedMs,
      protocol: certConn.protocol || null,
      cipher: certConn.cipher || null,
      alpn: certConn.alpn || null,
      authorized: certConn.authorized || false,
      authError: certConn.authError || null,
      cert: summary,
      checks,
      summary: {
        pass: checks.filter((c) => c.severity === 'pass').length,
        warn: checks.filter((c) => c.severity === 'warn').length,
        fail: checks.filter((c) => c.severity === 'fail').length,
      },
    };

    if (!conn.ok && !certConn.ok) {
      return Response.json({ host, error: conn.error || certConn.error || 'TLS connection failed.', code: conn.code || certConn.code || null }, { status: 502 });
    }

    void logToolHistory({ url: host, toolName: 'SSL Certificate Checker', result: payload });
    return Response.json(payload);
  } catch (err) {
    console.error('[ssl] error:', err);
    return Response.json({ error: err?.message || 'TLS connection failed.' }, { status: 502 });
  }
}
