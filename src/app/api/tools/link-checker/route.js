import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, readBoundedText, networkErrorToMessage, isPrivateHost } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 25_000;
const LINK_TIMEOUT_MS = 7_000;
const MAX_LINKS = 100;
const MAX_PARALLEL = 10;
const USER_AGENT = 'TrueSEO-LinkChecker/1.0 (+https://trueseo.tools)';

function classifyLink(href) {
  if (!href) return 'invalid';
  if (href.startsWith('mailto:')) return 'mailto';
  if (href.startsWith('tel:')) return 'tel';
  if (href.startsWith('javascript:')) return 'javascript';
  if (href.startsWith('#')) return 'anchor';
  if (href.startsWith('data:')) return 'data';
  return 'http';
}

function extractLinks($, baseUrl, baseHost) {
  const items = [];
  const seen = new Set();
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    const rel = ($(el).attr('rel') || '').trim();
    const target = ($(el).attr('target') || '').trim();
    const text = ($(el).text() || '').trim().slice(0, 120);
    const kind = classifyLink(href);
    let absolute = href;
    let host = null;
    let internal = null;
    if (kind === 'http') {
      try {
        const u = new URL(href, baseUrl);
        absolute = u.toString();
        host = u.hostname;
        internal = host === baseHost;
      } catch { /* invalid */ }
    }
    const key = `${kind}::${absolute}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ href, absoluteUrl: absolute, kind, internal, host, rel, target, text });
  });
  return items;
}

async function checkOneLink(url) {
  let parsed;
  try { parsed = new URL(url); }
  catch { return { error: 'Invalid URL' }; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { skipped: 'non-http' };
  if (isPrivateHost(parsed.hostname)) return { error: 'Blocked private host' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LINK_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    let res;
    try {
      res = await fetch(url, {
        method: 'HEAD', redirect: 'follow', signal: ctrl.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept': '*/*' },
      });
      // Some sites return 405 for HEAD; retry GET
      if (res.status === 405 || res.status === 501) {
        try { await res.body?.cancel(); } catch {}
        res = await fetch(url, {
          method: 'GET', redirect: 'follow', signal: ctrl.signal,
          headers: { 'User-Agent': USER_AGENT, 'Accept': '*/*', 'Range': 'bytes=0-0' },
        });
      }
    } catch (err) {
      if (err?.name === 'AbortError') return { error: 'Timed out' };
      throw err;
    }
    try { await res.body?.cancel(); } catch {}
    return {
      status: res.status,
      finalUrl: res.url || url,
      redirected: !!res.url && res.url !== url,
      contentType: res.headers.get('content-type') || null,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (err) {
    return { error: err?.name === 'AbortError' ? 'Timed out' : (err?.cause?.code || err?.message || 'Fetch failed') };
  } finally { clearTimeout(timer); }
}

async function checkAllInPool(urls, concurrency = MAX_PARALLEL) {
  const out = new Array(urls.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= urls.length) break;
      out[idx] = await checkOneLink(urls[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return out;
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

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(url, ctrl.signal);
    const contentType = res.headers.get('content-type') || '';
    if (res.status >= 400) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({ url, finalUrl, httpStatus: res.status, contentType, error: `Server returned HTTP ${res.status}.`, redirectChain: chain }, { status: 502 });
    }
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({ url, finalUrl, httpStatus: res.status, contentType, error: `Content-Type is "${contentType}" — this tool only works on HTML pages.`, redirectChain: chain }, { status: 400 });
    }
    const html = await readBoundedText(res);
    const $ = cheerio.load(html);
    const baseHost = new URL(finalUrl).hostname;
    const links = extractLinks($, finalUrl, baseHost);

    const httpLinks = links.filter((l) => l.kind === 'http');
    const probeable = httpLinks.slice(0, MAX_LINKS);
    const truncated = httpLinks.length > MAX_LINKS;
    const probes = await checkAllInPool(probeable.map((l) => l.absoluteUrl));
    const checked = probeable.map((l, i) => ({ ...l, ...probes[i] }));

    let ok = 0, redirected = 0, broken = 0, errors = 0;
    for (const r of checked) {
      if (r.error) errors++;
      else if (r.status >= 200 && r.status < 300) ok++;
      else if (r.status >= 300 && r.status < 400) redirected++;
      else broken++;
    }

    const internal = checked.filter((l) => l.internal === true);
    const external = checked.filter((l) => l.internal === false);
    const nonHttp = links.filter((l) => l.kind !== 'http');

    const issues = [];
    const brokenList = checked.filter((l) => !l.error && l.status >= 400);
    const errorList = checked.filter((l) => l.error);
    if (brokenList.length > 0) issues.push({ severity: 'fail', message: `${brokenList.length} broken link${brokenList.length === 1 ? '' : 's'} (4xx/5xx).` });
    if (errorList.length > 0) issues.push({ severity: 'warn', message: `${errorList.length} link${errorList.length === 1 ? '' : 's'} couldn’t be checked (timeout, DNS, etc).` });

    const noFollowExternalCount = external.filter((l) => /\b(nofollow|sponsored|ugc)\b/i.test(l.rel)).length;
    const targetBlankNoOpener = checked.filter((l) => l.target === '_blank' && !/\bnoopener\b/i.test(l.rel)).length;
    if (targetBlankNoOpener > 0) issues.push({ severity: 'warn', message: `${targetBlankNoOpener} link${targetBlankNoOpener === 1 ? '' : 's'} use target="_blank" without rel="noopener" — minor security/perf risk.` });
    if (issues.length === 0) issues.push({ severity: 'pass', message: `All ${checked.length} link${checked.length === 1 ? '' : 's'} probed successfully.` });

    const payload = {
      url, finalUrl, httpStatus: res.status, contentType,
      redirectChain: chain,
      counts: {
        total: links.length,
        http: httpLinks.length,
        nonHttp: nonHttp.length,
        internal: internal.length,
        external: external.length,
        ok, redirected, broken, errors,
        noFollowExternal: noFollowExternalCount,
        targetBlankNoOpener,
        truncated,
      },
      links: checked,
      nonHttp,
      issues,
      summary: {
        pass: issues.filter((i) => i.severity === 'pass').length,
        warn: issues.filter((i) => i.severity === 'warn').length,
        fail: issues.filter((i) => i.severity === 'fail').length,
      },
    };

    void logToolHistory({ url, toolName: 'Link Checker', result: payload });
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    const m = networkErrorToMessage(err);
    if (m) return Response.json({ error: m.error }, { status: m.status });
    console.error('[link-checker] error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
