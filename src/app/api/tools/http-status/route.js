import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;

function statusKind(s) {
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

function statusMeaning(s) {
  const map = {
    200: 'OK — request succeeded.',
    201: 'Created — resource was created (typical for POST).',
    204: 'No Content — request succeeded, no body returned.',
    206: 'Partial Content — partial range returned.',
    301: 'Moved Permanently — passes ~all ranking signals to the new URL.',
    302: 'Found (temporary redirect) — Google still passes signals but slower than 301.',
    303: 'See Other — redirect after a POST.',
    304: 'Not Modified — client cache is still valid (conditional request).',
    307: 'Temporary Redirect — preserves the request method.',
    308: 'Permanent Redirect — preserves the request method, like 301.',
    400: 'Bad Request — malformed request.',
    401: 'Unauthorized — authentication required.',
    403: 'Forbidden — server refuses to authorize.',
    404: 'Not Found — URL doesn’t exist on the server.',
    405: 'Method Not Allowed — try a different HTTP method.',
    410: 'Gone — resource permanently removed; Google de-indexes faster than for 404.',
    429: 'Too Many Requests — rate limited.',
    451: 'Unavailable for Legal Reasons.',
    500: 'Internal Server Error — application crash, plugin failure, etc.',
    502: 'Bad Gateway — upstream server is unreachable.',
    503: 'Service Unavailable — server overloaded or maintenance. Pair with Retry-After.',
    504: 'Gateway Timeout — upstream server didn’t respond in time.',
  };
  return map[s] || `HTTP ${s}.`;
}

function collectHeaders(res) {
  const out = [];
  for (const [name, value] of res.headers.entries()) out.push({ name, value });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function checkOne(rawUrl, method, signal) {
  let url;
  try { url = normalizeUrl(rawUrl); }
  catch (err) {
    if (err instanceof ValidationError) return { url: rawUrl, error: err.message };
    return { url: rawUrl, error: 'Invalid URL.' };
  }
  const startedAt = Date.now();
  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(url, signal, { method });
    const totalElapsedMs = Date.now() - startedAt;
    const headers = collectHeaders(res);
    try { await res.body?.cancel(); } catch {}
    return {
      url, finalUrl,
      method,
      requestedAt: startedAt,
      totalElapsedMs,
      finalStatus: res.status,
      finalStatusText: res.statusText,
      finalKind: statusKind(res.status),
      finalMeaning: statusMeaning(res.status),
      redirectChain: chain,
      finalHeaders: headers,
    };
  } catch (err) {
    if (err instanceof ValidationError) return { url, error: err.message };
    const m = networkErrorToMessage(err);
    return { url, error: m?.error || (err?.message || 'Failed to fetch.') };
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const method = ['GET', 'HEAD'].includes((body?.method || '').toUpperCase()) ? body.method.toUpperCase() : 'GET';

  if (Array.isArray(body?.urls) && body.urls.length > 0) {
    const list = body.urls.slice(0, 25); // cap to 25 per request
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS * 2);
    try {
      const results = await Promise.all(list.map((u) => checkOne(u, method, ctrl.signal)));
      const counts = results.reduce((acc, r) => {
        if (r.error) acc.errors++;
        else acc[r.finalKind] = (acc[r.finalKind] || 0) + 1;
        return acc;
      }, { errors: 0 });
      const result = { mode: 'bulk', method, count: results.length, counts, results };
      void logToolHistory({ url: list[0], toolName: 'HTTP Status Checker (bulk)', result });
      return Response.json(result);
    } finally { clearTimeout(timer); }
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const single = await checkOne(body?.url, method, ctrl.signal);
    if (single.error) {
      return Response.json({ mode: 'single', method, ...single }, { status: single.url?.startsWith('http') ? 502 : 400 });
    }
    const result = { mode: 'single', method, ...single };
    void logToolHistory({ url: single.url, toolName: 'HTTP Status Checker', result });
    return Response.json(result);
  } finally { clearTimeout(timer); }
}
