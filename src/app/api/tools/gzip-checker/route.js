import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, isPrivateHost } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const USER_AGENT = 'OpenSourceTools-GzipChecker/1.0 (+https://www.opensourcetools.online)';

// Raw HTTP fetch that does NOT decode the body — we want the wire bytes.
function rawFetch(targetUrl, { acceptEncoding = 'gzip, deflate, br', maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const chain = [];
    const visit = (urlStr, redirectsLeft) => {
      let parsed;
      try { parsed = new URL(urlStr); } catch (e) { return reject(new ValidationError('Invalid URL.')); }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return reject(new ValidationError('Only http(s) URLs are supported.'));
      if (isPrivateHost(parsed.hostname)) return reject(new ValidationError('Private host blocked.'));
      const lib = parsed.protocol === 'https:' ? https : http;
      const startedAt = Date.now();
      const req = lib.request(parsed, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'Accept-Encoding': acceptEncoding,
          'Connection': 'close',
        },
        timeout: REQUEST_TIMEOUT_MS,
      }, (res) => {
        chain.push({ url: urlStr, status: res.statusCode, location: res.headers.location || null });
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectsLeft <= 0) {
            res.resume();
            return reject(new ValidationError('Too many redirects.'));
          }
          let nextUrl;
          try { nextUrl = new URL(res.headers.location, urlStr).toString(); }
          catch { res.resume(); return reject(new ValidationError('Invalid redirect URL.')); }
          res.resume();
          return visit(nextUrl, redirectsLeft - 1);
        }
        // Collect raw bytes
        const chunks = [];
        let received = 0;
        res.on('data', (chunk) => {
          received += chunk.length;
          if (received > MAX_BODY_BYTES) {
            chunks.push(chunk.subarray(0, MAX_BODY_BYTES - (received - chunk.length)));
            res.destroy();
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const elapsedMs = Date.now() - startedAt;
          resolve({
            finalUrl: urlStr,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body,
            bytesOnWire: body.length,
            chain,
            elapsedMs,
            truncated: received > MAX_BODY_BYTES,
          });
        });
        res.on('error', reject);
      });
      req.on('timeout', () => { req.destroy(new Error('AbortError')); });
      req.on('error', reject);
      req.end();
    };
    visit(targetUrl, maxRedirects);
  });
}

function tryDecompress(body, encoding) {
  if (!encoding) return { ok: true, bytes: body, encoding: null };
  const enc = encoding.toLowerCase().trim();
  try {
    if (enc === 'gzip') return { ok: true, bytes: zlib.gunzipSync(body), encoding: 'gzip' };
    if (enc === 'deflate') {
      try { return { ok: true, bytes: zlib.inflateSync(body), encoding: 'deflate' }; }
      catch { return { ok: true, bytes: zlib.inflateRawSync(body), encoding: 'deflate-raw' }; }
    }
    if (enc === 'br') return { ok: true, bytes: zlib.brotliDecompressSync(body), encoding: 'brotli' };
    return { ok: false, error: `Unknown Content-Encoding "${encoding}".`, encoding: enc };
  } catch (err) {
    return { ok: false, error: `Failed to decompress (${enc}): ${err?.message || err}.`, encoding: enc };
  }
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function buildChecks(payload) {
  const c = [];
  const enc = payload.contentEncoding;
  if (enc) {
    c.push({ severity: 'pass', message: `Content-Encoding: ${enc} — compression is enabled.` });
  } else {
    c.push({ severity: 'fail', message: 'No Content-Encoding header — the server is not compressing the response. Enable gzip or brotli to cut transfer size by 60–80%.' });
  }
  if (payload.savingsPct !== null) {
    if (payload.savingsPct >= 70) c.push({ severity: 'pass', message: `${payload.savingsPct.toFixed(1)}% smaller on the wire — excellent compression ratio.` });
    else if (payload.savingsPct >= 50) c.push({ severity: 'pass', message: `${payload.savingsPct.toFixed(1)}% smaller on the wire — good compression.` });
    else if (payload.savingsPct > 0) c.push({ severity: 'warn', message: `${payload.savingsPct.toFixed(1)}% smaller on the wire — compression seems weak; check that the server isn’t double-compressing or using minimal levels.` });
  }
  if (enc === 'gzip' && payload.uncompressedSize > 50_000) {
    c.push({ severity: 'info', message: 'Brotli typically beats gzip by 15–25% — consider enabling Brotli for HTML and CSS if your CDN supports it.' });
  }
  if (payload.contentType && /image\//i.test(payload.contentType)) {
    c.push({ severity: 'info', message: 'This is an image. Already-compressed formats (JPEG, PNG, WebP) gain little from gzip; raw SVG benefits.' });
  }
  return c;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  let url;
  try { url = normalizeUrl(body?.url); }
  catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }

  try {
    const compressed = await rawFetch(url, { acceptEncoding: 'gzip, deflate, br' });
    const ce = compressed.headers['content-encoding'] || null;
    const contentType = compressed.headers['content-type'] || '';
    if (compressed.status >= 400) {
      return Response.json({
        url, finalUrl: compressed.finalUrl, httpStatus: compressed.status,
        contentType,
        error: `Server returned HTTP ${compressed.status}.`,
        redirectChain: compressed.chain,
      }, { status: 502 });
    }

    let uncompressedBytes = compressed.body;
    let decompressInfo = { ok: true, encoding: null };
    if (ce) {
      decompressInfo = tryDecompress(compressed.body, ce);
      if (decompressInfo.ok) uncompressedBytes = decompressInfo.bytes;
    }

    // Also do an explicit identity request to verify the original (uncompressed) size
    // matches what we got after decompressing. This catches misconfigured servers that
    // still send compressed bytes when identity is requested.
    let identityCheck = null;
    try {
      const identity = await rawFetch(url, { acceptEncoding: 'identity' });
      const identityCE = identity.headers['content-encoding'] || null;
      identityCheck = {
        status: identity.status,
        contentEncoding: identityCE,
        bytes: identity.bytesOnWire,
        servedCompressedAnyway: !!identityCE,
      };
    } catch { /* identity probe is best-effort */ }

    const compressedSize = ce ? compressed.bytesOnWire : null;
    const uncompressedSize = uncompressedBytes.length;
    const savingsBytes = compressedSize !== null ? uncompressedSize - compressedSize : null;
    const savingsPct = compressedSize !== null && uncompressedSize > 0 ? (savingsBytes / uncompressedSize) * 100 : null;
    const ratio = compressedSize !== null && compressedSize > 0 ? +(uncompressedSize / compressedSize).toFixed(2) : null;

    const payload = {
      url,
      finalUrl: compressed.finalUrl,
      httpStatus: compressed.status,
      contentType,
      contentEncoding: ce,
      varyHeader: compressed.headers['vary'] || null,
      transferEncoding: compressed.headers['transfer-encoding'] || null,
      bytesOnWire: compressed.bytesOnWire,
      uncompressedSize,
      compressedSize,
      savingsBytes,
      savingsPct,
      ratio,
      decompressOk: decompressInfo.ok,
      decompressError: decompressInfo.ok ? null : decompressInfo.error,
      identityCheck,
      chain: compressed.chain,
      elapsedMs: compressed.elapsedMs,
      formatted: {
        wire: fmtBytes(compressed.bytesOnWire),
        uncompressed: fmtBytes(uncompressedSize),
        savings: savingsBytes !== null ? fmtBytes(savingsBytes) : null,
      },
    };
    payload.checks = buildChecks(payload);
    payload.summary = {
      pass: payload.checks.filter((c) => c.severity === 'pass').length,
      warn: payload.checks.filter((c) => c.severity === 'warn').length,
      fail: payload.checks.filter((c) => c.severity === 'fail').length,
      info: payload.checks.filter((c) => c.severity === 'info').length,
    };

    void logToolHistory({ url, toolName: 'Gzip Compression Checker', result: payload });
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    if (err?.message === 'AbortError') return Response.json({ error: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` }, { status: 504 });
    if (err?.code === 'ENOTFOUND') return Response.json({ error: 'DNS lookup failed.' }, { status: 502 });
    if (err?.code === 'ECONNREFUSED') return Response.json({ error: 'Connection refused.' }, { status: 502 });
    console.error('[gzip] error:', err);
    return Response.json({ error: err?.message || 'Failed to fetch the URL.' }, { status: 502 });
  }
}
