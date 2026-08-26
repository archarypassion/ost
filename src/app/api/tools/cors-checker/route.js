import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 10_000;

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

  const testOrigin = (body?.origin || 'https://example.com').trim();
  const requestMethod = (body?.method || 'GET').toUpperCase();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    // 1. Send Preflight OPTIONS request
    let preflightHeaders = {};
    let preflightStatus = 0;
    try {
      const optRes = await fetch(targetUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': testOrigin,
          'Access-Control-Request-Method': requestMethod,
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
        signal: ctrl.signal,
      });
      preflightStatus = optRes.status;
      for (const [k, v] of optRes.headers.entries()) {
        preflightHeaders[k.toLowerCase()] = v;
      }
      try { await optRes.body?.cancel(); } catch {}
    } catch {}

    // 2. Send Actual Request with Origin header
    const mainRes = await fetch(targetUrl, {
      method: requestMethod === 'OPTIONS' ? 'GET' : requestMethod,
      headers: {
        'Origin': testOrigin,
        'User-Agent': 'Mozilla/5.0 (compatible; OpenSourceTools CORS Auditor/1.0)',
      },
      signal: ctrl.signal,
    });
    try { await mainRes.body?.cancel(); } catch {}

    const responseHeaders = {};
    for (const [k, v] of mainRes.headers.entries()) {
      responseHeaders[k.toLowerCase()] = v;
    }

    const allowOrigin = responseHeaders['access-control-allow-origin'] || preflightHeaders['access-control-allow-origin'] || null;
    const allowMethods = responseHeaders['access-control-allow-methods'] || preflightHeaders['access-control-allow-methods'] || null;
    const allowHeaders = responseHeaders['access-control-allow-headers'] || preflightHeaders['access-control-allow-headers'] || null;
    const allowCredentials = responseHeaders['access-control-allow-credentials'] || preflightHeaders['access-control-allow-credentials'] || null;
    const maxAge = responseHeaders['access-control-max-age'] || preflightHeaders['access-control-max-age'] || null;

    let status = 'blocked';
    const warnings = [];
    const findings = [];

    if (allowOrigin) {
      if (allowOrigin === '*' || allowOrigin === testOrigin) {
        status = 'allowed';
        findings.push({ level: 'good', text: `Access-Control-Allow-Origin permits ${allowOrigin}.` });
      } else {
        status = 'restricted';
        warnings.push(`Origin ${testOrigin} is not permitted (Server allows: ${allowOrigin}).`);
      }

      if (allowOrigin === '*' && allowCredentials === 'true') {
        warnings.push('Security Vulnerability: Wildcard (*) origin is incompatible with credentials in strict browsers.');
      }
    } else {
      warnings.push('Missing Access-Control-Allow-Origin header. Cross-origin browser requests will be blocked.');
    }

    if (allowMethods) {
      findings.push({ level: 'good', text: `Allowed Methods: ${allowMethods}` });
    }

    const result = {
      url: targetUrl,
      testOrigin,
      requestMethod,
      statusCode: mainRes.status,
      preflightStatusCode: preflightStatus,
      corsStatus: status,
      headers: {
        allowOrigin,
        allowMethods,
        allowHeaders,
        allowCredentials,
        maxAge,
      },
      allHeaders: responseHeaders,
      findings,
      warnings,
    };

    void logToolHistory({ url: targetUrl, toolName: 'CORS & Access-Control Checker', result });
    return Response.json(result);
  } catch (err) {
    const m = networkErrorToMessage(err);
    return Response.json({ error: m?.error || err.message || 'CORS inspection failed.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
