import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 10_000;

function parseSingleCookie(raw) {
  const parts = raw.split(';').map((p) => p.trim());
  const [first, ...attributes] = parts;
  const eqIdx = first.indexOf('=');
  const name = eqIdx !== -1 ? first.slice(0, eqIdx) : first;
  const value = eqIdx !== -1 ? first.slice(eqIdx + 1) : '';

  const parsed = {
    name,
    value,
    raw,
    secure: false,
    httpOnly: false,
    sameSite: null,
    domain: null,
    path: null,
    expires: null,
    maxAge: null,
  };

  for (const attr of attributes) {
    const attrEq = attr.indexOf('=');
    const attrName = attrEq !== -1 ? attr.slice(0, attrEq).toLowerCase() : attr.toLowerCase();
    const attrVal = attrEq !== -1 ? attr.slice(attrEq + 1) : '';

    if (attrName === 'secure') parsed.secure = true;
    else if (attrName === 'httponly') parsed.httpOnly = true;
    else if (attrName === 'samesite') parsed.sameSite = attrVal || 'Lax';
    else if (attrName === 'domain') parsed.domain = attrVal;
    else if (attrName === 'path') parsed.path = attrVal;
    else if (attrName === 'expires') parsed.expires = attrVal;
    else if (attrName === 'max-age') parsed.maxAge = parseInt(attrVal, 10) || null;
  }

  return parsed;
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

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { res, finalUrl } = await fetchWithRedirects(targetUrl, ctrl.signal, { method: 'GET' });
    try { await res.body?.cancel(); } catch {}

    const isHttps = finalUrl.startsWith('https://');
    const rawCookies = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);

    const cookies = rawCookies.map(parseSingleCookie);
    const warnings = [];

    cookies.forEach((c) => {
      if (isHttps && !c.secure) {
        warnings.push(`Cookie "${c.name}" is missing the "Secure" flag on an HTTPS endpoint.`);
      }
      if (!c.httpOnly && /sess|auth|token|jwt|id/i.test(c.name)) {
        warnings.push(`Sensitive cookie "${c.name}" is missing "HttpOnly" (Vulnerable to XSS theft).`);
      }
      if (!c.sameSite) {
        warnings.push(`Cookie "${c.name}" is missing the "SameSite" attribute (Vulnerable to CSRF).`);
      } else if (c.sameSite.toLowerCase() === 'none' && !c.secure) {
        warnings.push(`Cookie "${c.name}" sets SameSite=None without Secure flag (Rejected by modern browsers).`);
      }
    });

    const result = {
      targetUrl,
      finalUrl,
      cookieCount: cookies.length,
      isHttps,
      cookies,
      warnings,
    };

    void logToolHistory({ url: targetUrl, toolName: 'HTTP Cookie & SameSite Inspector', result });
    return Response.json(result);
  } catch (err) {
    const m = networkErrorToMessage(err);
    return Response.json({ error: m?.error || err.message || 'Failed to inspect cookies.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
