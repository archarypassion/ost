import tls from 'node:tls';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function testAlpn(hostname, port = 443) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      ALPNProtocols: ['h2', 'http/1.1'],
      timeout: 6000,
    }, () => {
      const elapsedMs = Date.now() - startedAt;
      const alpn = socket.alpnProtocol || null;
      const cipher = socket.getCipher();
      const tlsVersion = socket.getProtocol();
      socket.end();
      resolve({
        ok: true,
        alpn,
        elapsedMs,
        cipher: cipher ? cipher.name : null,
        tlsVersion,
      });
    });

    socket.on('error', (err) => {
      resolve({ ok: false, error: err.message, alpn: null });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'TLS connection timed out', alpn: null });
    });
  });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  let targetUrl;
  try {
    targetUrl = normalizeUrl(body?.url || '');
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    return Response.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  const u = new URL(targetUrl);
  const hostname = u.hostname;
  const port = parseInt(u.port, 10) || (u.protocol === 'https:' ? 443 : 80);

  try {
    const alpnResult = await testAlpn(hostname, port);

    // Fetch headers for Alt-Svc inspection
    let altSvc = null;
    let serverHeader = null;
    try {
      const headRes = await fetch(targetUrl, { method: 'HEAD', redirect: 'follow' });
      altSvc = headRes.headers.get('alt-svc') || null;
      serverHeader = headRes.headers.get('server') || null;
      try { await headRes.body?.cancel(); } catch {}
    } catch {}

    const hasHttp2 = alpnResult.alpn === 'h2';
    const hasHttp3 = altSvc ? /h3|quic/i.test(altSvc) : false;

    const result = {
      url: targetUrl,
      hostname,
      port,
      negotiatedProtocol: alpnResult.alpn || (alpnResult.ok ? 'http/1.1' : 'unknown'),
      protocols: {
        http11: true,
        http2: hasHttp2,
        http3: hasHttp3,
      },
      tls: {
        version: alpnResult.tlsVersion || null,
        cipher: alpnResult.cipher || null,
        handshakeElapsedMs: alpnResult.elapsedMs || null,
      },
      altSvcHeader: altSvc,
      serverHeader,
      error: alpnResult.ok ? null : alpnResult.error,
    };

    void logToolHistory({ url: targetUrl, toolName: 'HTTP/2 & HTTP/3 Checker', result });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message || 'Protocol check failed.' }, { status: 502 });
  }
}
