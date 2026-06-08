import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 15_000;

const USER_AGENTS = {
  default: 'Tool4Utility-RedirectChecker/1.0 (+https://tool4utility.com)',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
};

function classifyHop(hop, prev) {
  const tags = [];
  if (hop.status === 301) tags.push({ kind: 'good', label: '301 permanent' });
  else if (hop.status === 308) tags.push({ kind: 'good', label: '308 permanent (preserves method)' });
  else if (hop.status === 302) tags.push({ kind: 'warn', label: '302 temporary — use 301 for permanent moves' });
  else if (hop.status === 303) tags.push({ kind: 'info', label: '303 See Other' });
  else if (hop.status === 307) tags.push({ kind: 'info', label: '307 temporary (preserves method)' });
  else if (hop.status >= 200 && hop.status < 300) tags.push({ kind: 'good', label: 'Final response' });
  else if (hop.status >= 400) tags.push({ kind: 'bad', label: `Error ${hop.status}` });

  if (prev && hop.url) {
    try {
      const a = new URL(prev.url);
      const b = new URL(hop.url);
      if (a.protocol === 'https:' && b.protocol === 'http:') tags.push({ kind: 'bad', label: 'HTTPS → HTTP downgrade' });
      if (a.protocol === 'http:' && b.protocol === 'https:') tags.push({ kind: 'good', label: 'HTTP → HTTPS upgrade' });
      const aHost = a.hostname.replace(/^www\./, '');
      const bHost = b.hostname.replace(/^www\./, '');
      if (aHost === bHost && a.hostname !== b.hostname) {
        tags.push({ kind: 'info', label: a.hostname.startsWith('www.') ? 'www → non-www' : 'non-www → www' });
      }
      if (a.hostname === b.hostname && a.protocol === b.protocol && a.pathname !== b.pathname) {
        if (a.pathname.replace(/\/$/, '') === b.pathname.replace(/\/$/, '')) {
          tags.push({ kind: 'info', label: a.pathname.endsWith('/') ? 'trailing slash removed' : 'trailing slash added' });
        }
      }
      if (aHost !== bHost) tags.push({ kind: 'info', label: `cross-domain to ${b.hostname}` });
    } catch {}
  }
  return tags;
}

function buildIssues(chain, finalStatus) {
  const issues = [];
  const hops = chain.length;
  if (hops > 1 && finalStatus >= 200 && finalStatus < 300) {
    if (hops - 1 >= 3) issues.push({ severity: 'warn', message: `${hops - 1} redirects in the chain — long chains slow crawlers and lose ~5–10% of link equity per extra hop. Update incoming links to point to the final URL.` });
  }
  // Loop detection
  const seen = new Set();
  for (const hop of chain) {
    if (seen.has(hop.url)) {
      issues.push({ severity: 'fail', message: `Redirect loop detected (${hop.url} appears twice).` });
      break;
    }
    seen.add(hop.url);
  }
  // Mixed types
  const types = new Set(chain.slice(0, -1).map((h) => h.status));
  if (types.has(301) && types.has(302)) {
    issues.push({ severity: 'warn', message: 'Chain mixes 301 (permanent) and 302 (temporary) redirects — pick one consistently.' });
  }
  if (types.has(302) && finalStatus >= 200 && finalStatus < 300 && !types.has(301)) {
    issues.push({ severity: 'warn', message: 'Permanent move appears to be served via 302 — change to 301 to pass full ranking signals.' });
  }
  // HTTPS downgrade anywhere?
  for (let i = 1; i < chain.length; i++) {
    try {
      const a = new URL(chain[i - 1].url);
      const b = new URL(chain[i].url);
      if (a.protocol === 'https:' && b.protocol === 'http:') {
        issues.push({ severity: 'fail', message: `HTTPS → HTTP downgrade at hop ${i + 1} (${chain[i].url}). This can break browsers and lose ranking signals.` });
        break;
      }
    } catch {}
  }
  if (finalStatus >= 400) {
    issues.push({ severity: 'fail', message: `Chain ends at HTTP ${finalStatus} — broken redirect.` });
  }
  if (hops === 1 && finalStatus >= 200 && finalStatus < 300) {
    issues.push({ severity: 'pass', message: 'No redirects — page responded directly.' });
  }
  if (hops > 1 && hops - 1 <= 2 && finalStatus >= 200 && finalStatus < 300 && !issues.some((i) => i.severity === 'fail' || i.severity === 'warn')) {
    const used = new Set(chain.slice(0, -1).map((h) => h.status));
    const onlyPermanent = used.has(301) || used.has(308);
    issues.push({
      severity: 'pass',
      message: `Chain of ${hops - 1} redirect${hops === 2 ? '' : 's'} ending in HTTP ${finalStatus}${onlyPermanent ? ' using permanent redirects' : ''}.`,
    });
  }
  return issues;
}

async function traceWithUA(url, ctrl, userAgent) {
  try {
    const startedAt = Date.now();
    const { res, chain, finalUrl } = await fetchWithRedirects(url, ctrl.signal, { method: 'GET', userAgent });
    const totalElapsedMs = Date.now() - startedAt;
    try { await res.body?.cancel(); } catch {}
    return {
      finalUrl,
      finalStatus: res.status,
      finalStatusText: res.statusText,
      totalElapsedMs,
      chain,
    };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    const m = networkErrorToMessage(err);
    return { error: m?.error || (err?.message || 'Failed to fetch.') };
  }
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
  const compareUserAgents = body?.compareUserAgents === true;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const primary = await traceWithUA(url, ctrl, USER_AGENTS.default);
    if (primary.error) return Response.json({ url, error: primary.error }, { status: 502 });

    const annotatedChain = primary.chain.map((hop, idx) => ({
      ...hop,
      index: idx,
      tags: classifyHop(hop, idx > 0 ? primary.chain[idx - 1] : null),
    }));
    const issues = buildIssues(primary.chain, primary.finalStatus);

    let comparisons = null;
    if (compareUserAgents) {
      const [bot, mobile] = await Promise.all([
        traceWithUA(url, ctrl, USER_AGENTS.googlebot),
        traceWithUA(url, ctrl, USER_AGENTS.mobile),
      ]);
      comparisons = {
        googlebot: bot.error ? bot : { finalUrl: bot.finalUrl, finalStatus: bot.finalStatus, hops: bot.chain.length, chain: bot.chain.map((h) => ({ url: h.url, status: h.status })) },
        mobile: mobile.error ? mobile : { finalUrl: mobile.finalUrl, finalStatus: mobile.finalStatus, hops: mobile.chain.length, chain: mobile.chain.map((h) => ({ url: h.url, status: h.status })) },
      };
    }

    const summary = {
      hops: primary.chain.length - 1,
      finalStatus: primary.finalStatus,
      finalUrl: primary.finalUrl,
      totalElapsedMs: primary.totalElapsedMs,
      pass: issues.filter((i) => i.severity === 'pass').length,
      warn: issues.filter((i) => i.severity === 'warn').length,
      fail: issues.filter((i) => i.severity === 'fail').length,
    };

    const result = {
      url,
      finalUrl: primary.finalUrl,
      finalStatus: primary.finalStatus,
      finalStatusText: primary.finalStatusText,
      totalElapsedMs: primary.totalElapsedMs,
      chain: annotatedChain,
      issues,
      summary,
      comparisons,
    };
    void logToolHistory({ url, toolName: 'Redirect Checker', result });
    return Response.json(result);
  } finally { clearTimeout(timer); }
}
