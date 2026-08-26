import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;

const SECURITY_HEADERS_SPEC = [
  {
    name: 'Strict-Transport-Security',
    label: 'HSTS (HTTP Strict Transport Security)',
    weight: 25,
    required: true,
    evaluate: (val) => {
      if (!val) return { pass: false, severity: 'high', score: 0, message: 'Missing HSTS header. Connections are vulnerable to SSL-stripping man-in-the-middle attacks.' };
      const maxAgeMatch = val.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const hasSubdomains = /includeSubDomains/i.test(val);
      const hasPreload = /preload/i.test(val);

      if (maxAge >= 31536000 && hasSubdomains && hasPreload) {
        return { pass: true, severity: 'good', score: 25, message: 'Optimal configuration (max-age ≥ 1 year, includeSubDomains, preload).' };
      }
      if (maxAge >= 15552000) {
        return { pass: true, severity: 'medium', score: 20, message: 'HSTS is active, but consider adding includeSubDomains and preload for HSTS preload list eligibility.' };
      }
      return { pass: true, severity: 'low', score: 12, message: 'HSTS max-age is short (< 6 months). Recommended: max-age=31536000.' };
    },
  },
  {
    name: 'Content-Security-Policy',
    label: 'Content Security Policy (CSP)',
    weight: 25,
    required: true,
    evaluate: (val) => {
      if (!val) return { pass: false, severity: 'high', score: 0, message: 'Missing CSP header. Protects against Cross-Site Scripting (XSS) and data injection attacks.' };
      const hasDefaultSrc = /default-src/i.test(val);
      const hasUnsafeInline = /'unsafe-inline'/i.test(val);
      const hasUnsafeEval = /'unsafe-eval'/i.test(val);

      if (hasDefaultSrc && !hasUnsafeInline && !hasUnsafeEval) {
        return { pass: true, severity: 'good', score: 25, message: 'Strong CSP with restrictive source directives and no unsafe execution flags.' };
      }
      if (hasUnsafeInline || hasUnsafeEval) {
        return { pass: true, severity: 'medium', score: 15, message: 'CSP is present but contains unsafe-inline or unsafe-eval flags which weaken XSS protection.' };
      }
      return { pass: true, severity: 'low', score: 20, message: 'CSP header detected and operational.' };
    },
  },
  {
    name: 'X-Frame-Options',
    label: 'X-Frame-Options (Clickjacking Protection)',
    weight: 15,
    required: true,
    evaluate: (val) => {
      if (!val) return { pass: false, severity: 'medium', score: 0, message: 'Missing X-Frame-Options header. Page may be embedded in iframes on malicious sites (clickjacking).' };
      const upper = val.toUpperCase();
      if (upper === 'DENY') return { pass: true, severity: 'good', score: 15, message: 'DENY — Page cannot be embedded in frames anywhere.' };
      if (upper === 'SAMEORIGIN') return { pass: true, severity: 'good', score: 15, message: 'SAMEORIGIN — Page can only be embedded on the same origin.' };
      return { pass: true, severity: 'low', score: 10, message: `Configured: ${val}` };
    },
  },
  {
    name: 'X-Content-Type-Options',
    label: 'X-Content-Type-Options (MIME Sniffing)',
    weight: 15,
    required: true,
    evaluate: (val) => {
      if (!val) return { pass: false, severity: 'medium', score: 0, message: 'Missing X-Content-Type-Options header. Browsers may MIME-sniff response bodies into executable scripts.' };
      if (/nosniff/i.test(val)) return { pass: true, severity: 'good', score: 15, message: 'nosniff — Strict MIME type validation enforced.' };
      return { pass: false, severity: 'medium', score: 5, message: 'Invalid value; should be "nosniff".' };
    },
  },
  {
    name: 'Referrer-Policy',
    label: 'Referrer-Policy',
    weight: 10,
    required: true,
    evaluate: (val) => {
      if (!val) return { pass: false, severity: 'low', score: 0, message: 'Missing Referrer-Policy header. May leak sensitive path parameters in Referer header to external origins.' };
      const good = ['strict-origin-when-cross-origin', 'no-referrer', 'same-origin', 'strict-origin'];
      if (good.includes(val.toLowerCase().trim())) {
        return { pass: true, severity: 'good', score: 10, message: `${val} — Strong privacy protection for cross-origin navigation.` };
      }
      return { pass: true, severity: 'low', score: 6, message: `${val} — Active referrer policy.` };
    },
  },
  {
    name: 'Permissions-Policy',
    label: 'Permissions-Policy (Feature Policy)',
    weight: 10,
    required: false,
    evaluate: (val) => {
      if (!val) return { pass: false, severity: 'low', score: 0, message: 'Missing Permissions-Policy. Used to disable camera, microphone, geolocation, and payment APIs in browser.' };
      return { pass: true, severity: 'good', score: 10, message: 'Permissions-Policy active, restricting browser API capabilities.' };
    },
  },
];

const LEAKY_HEADERS = ['x-powered-by', 'server', 'x-aspnet-version', 'x-runtime'];

function calculateGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
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
    return Response.json({ error: 'Invalid URL provided.' }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(targetUrl, ctrl.signal, { method: 'GET' });
    try { await res.body?.cancel(); } catch {}

    const rawHeaders = {};
    for (const [k, v] of res.headers.entries()) {
      rawHeaders[k.toLowerCase()] = v;
    }

    let totalScore = 0;
    const headerResults = SECURITY_HEADERS_SPEC.map((spec) => {
      const headerVal = rawHeaders[spec.name.toLowerCase()] || null;
      const evaluation = spec.evaluate(headerVal);
      totalScore += evaluation.score;
      return {
        name: spec.name,
        label: spec.label,
        value: headerVal,
        present: Boolean(headerVal),
        pass: evaluation.pass,
        severity: evaluation.severity,
        scoreEarned: evaluation.score,
        maxScore: spec.weight,
        message: evaluation.message,
      };
    });

    const infoLeaks = LEAKY_HEADERS
      .filter((h) => Boolean(rawHeaders[h]))
      .map((h) => ({ header: h, value: rawHeaders[h] }));

    if (infoLeaks.length > 0) {
      totalScore = Math.max(0, totalScore - infoLeaks.length * 5);
    }

    const grade = calculateGrade(totalScore);

    const result = {
      url: targetUrl,
      finalUrl,
      status: res.status,
      score: totalScore,
      grade,
      headers: headerResults,
      infoLeaks,
      redirectChain: chain,
    };

    void logToolHistory({ url: targetUrl, toolName: 'Security Headers Checker', result });
    return Response.json(result);
  } catch (err) {
    const m = networkErrorToMessage(err);
    return Response.json({ error: m?.error || err.message || 'Failed to fetch security headers.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
