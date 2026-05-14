import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, readBoundedBytes, networkErrorToMessage, isPrivateHost } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 18_000;
const RESOURCE_TIMEOUT_MS = 8_000;
const MAX_RESOURCES = 60; // probe at most this many linked resources
const MAX_PARALLEL = 8;
const USER_AGENT = 'TrueSEO-PageSizeChecker/1.0 (+https://trueseo.tools)';

function classifyResource(url, type) {
  const u = url.toLowerCase();
  if (type) return type;
  if (/\.(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp)(\?|$)/i.test(u)) return 'image';
  if (/\.(css)(\?|$)/i.test(u)) return 'stylesheet';
  if (/\.(js|mjs)(\?|$)/i.test(u)) return 'script';
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(u)) return 'font';
  if (/\.(mp4|webm|ogv|mov|m4v)(\?|$)/i.test(u)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|flac)(\?|$)/i.test(u)) return 'audio';
  return 'other';
}

function extractResources($, baseUrl) {
  const items = [];
  const push = (rawHref, type) => {
    if (!rawHref) return;
    if (rawHref.startsWith('data:') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      items.push({ url: rawHref, absoluteUrl: rawHref, type, inline: true });
      return;
    }
    let absolute;
    try { absolute = new URL(rawHref, baseUrl).toString(); }
    catch { return; }
    items.push({ url: rawHref, absoluteUrl: absolute, type });
  };

  $('link[rel="stylesheet"][href]').each((_, el) => push($(el).attr('href'), 'stylesheet'));
  $('script[src]').each((_, el) => push($(el).attr('src'), 'script'));
  $('img[src]').each((_, el) => push($(el).attr('src'), 'image'));
  $('img[srcset]').each((_, el) => {
    const ss = $(el).attr('srcset') || '';
    for (const part of ss.split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u) push(u, 'image');
    }
  });
  $('source[src], source[srcset]').each((_, el) => {
    const ss = $(el).attr('srcset') || $(el).attr('src') || '';
    for (const part of ss.split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u) push(u, 'image');
    }
  });
  $('video[src], audio[src]').each((_, el) => {
    const tag = el.name === 'audio' ? 'audio' : 'video';
    push($(el).attr('src'), tag);
  });
  $('link[rel="preload"][href]').each((_, el) => {
    const as = ($(el).attr('as') || 'other').toLowerCase();
    push($(el).attr('href'), as);
  });
  $('link[rel*="icon"][href]').each((_, el) => push($(el).attr('href'), 'image'));
  $('link[rel="manifest"][href]').each((_, el) => push($(el).attr('href'), 'other'));

  // Deduplicate by absolute URL
  const seen = new Set();
  return items.filter((it) => {
    if (it.inline) return true;
    if (seen.has(it.absoluteUrl)) return false;
    seen.add(it.absoluteUrl);
    return true;
  });
}

async function probeResource(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return { url, error: 'invalid url' }; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { url, skipped: 'non-http' };
  if (isPrivateHost(parsed.hostname)) return { url, error: 'blocked private host' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RESOURCE_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    let res;
    try {
      res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': 'identity', 'Accept': '*/*' },
      });
    } catch {
      // Some servers reject HEAD — fall back to GET with manual cancel after headers
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': 'identity', 'Accept': '*/*' },
      });
    }
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10) || null;
    let size = contentLength;
    if (size === null) {
      // Read the body to measure (capped)
      const bytes = await readBoundedBytes(res, 5 * 1024 * 1024);
      size = bytes.byteLength;
    } else {
      try { await res.body?.cancel(); } catch {}
    }
    return {
      url, status: res.status,
      contentType: res.headers.get('content-type') || null,
      size,
      contentEncoding: res.headers.get('content-encoding') || null,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (err) {
    return { url, error: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'fetch failed') };
  } finally {
    clearTimeout(timer);
  }
}

async function probeInPool(items, concurrency = MAX_PARALLEL) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      results[i] = await probeResource(items[i].absoluteUrl);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function fmtBytes(n) {
  if (!n && n !== 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
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
    const htmlBytes = await readBoundedBytes(res);
    const htmlSize = htmlBytes.byteLength;
    const html = new TextDecoder('utf-8', { fatal: false }).decode(htmlBytes);
    const $ = cheerio.load(html);
    const items = extractResources($, finalUrl);
    const inlineItems = items.filter((i) => i.inline);
    const externalItems = items.filter((i) => !i.inline).slice(0, MAX_RESOURCES);
    const truncated = items.filter((i) => !i.inline).length > MAX_RESOURCES;

    const probes = await probeInPool(externalItems);
    const resources = externalItems.map((it, i) => ({ ...it, ...probes[i] }));

    const byType = {};
    let totalExternal = 0;
    for (const r of resources) {
      const t = classifyResource(r.absoluteUrl, r.type);
      byType[t] = byType[t] || { count: 0, size: 0, errors: 0 };
      byType[t].count++;
      if (r.error || r.skipped) byType[t].errors++;
      else byType[t].size += r.size || 0;
      if (r.size) totalExternal += r.size;
    }

    const totalPage = htmlSize + totalExternal;

    const payload = {
      url, finalUrl, httpStatus: res.status, contentType,
      redirectChain: chain,
      htmlSize,
      htmlSizeFormatted: fmtBytes(htmlSize),
      externalResourceCount: resources.length,
      externalResourcesProbed: resources.length,
      truncated,
      totalExternalSize: totalExternal,
      totalExternalSizeFormatted: fmtBytes(totalExternal),
      totalPageSize: totalPage,
      totalPageSizeFormatted: fmtBytes(totalPage),
      byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, { count: v.count, errors: v.errors, size: v.size, sizeFormatted: fmtBytes(v.size) }])),
      resources: resources.map((r) => ({
        url: r.absoluteUrl,
        type: classifyResource(r.absoluteUrl, r.type),
        status: r.status || null,
        size: r.size || null,
        sizeFormatted: r.size ? fmtBytes(r.size) : '—',
        contentType: r.contentType || null,
        contentEncoding: r.contentEncoding || null,
        elapsedMs: r.elapsedMs || null,
        error: r.error || null,
        skipped: r.skipped || null,
      })),
      inlineCount: inlineItems.length,
    };

    // Build issues
    const issues = [];
    if (htmlSize > 250 * 1024) issues.push({ severity: 'warn', message: `HTML alone is ${fmtBytes(htmlSize)} — large HTML hurts time-to-interactive. Consider trimming inline JSON/CSS.` });
    if (totalPage > 5 * 1024 * 1024) issues.push({ severity: 'fail', message: `Total page weight is ${fmtBytes(totalPage)} — well above the 1.5–3 MB recommended limit. Mobile performance will suffer.` });
    else if (totalPage > 3 * 1024 * 1024) issues.push({ severity: 'warn', message: `Total page weight is ${fmtBytes(totalPage)} — over the 3 MB threshold most performance budgets target.` });
    if (resources.length > 80) issues.push({ severity: 'warn', message: `${resources.length} external resources — many requests increase setup overhead. Consider bundling.` });
    if (byType.image?.size > 1.5 * 1024 * 1024) issues.push({ severity: 'warn', message: `Images sum to ${byType.image.sizeFormatted} — compress (WebP/AVIF) or lazy-load below-the-fold images.` });
    if (byType.script?.size > 700 * 1024) issues.push({ severity: 'warn', message: `JavaScript sums to ${byType.script.sizeFormatted} — heavy JS is a top cause of poor INP scores.` });
    if (issues.length === 0) issues.push({ severity: 'pass', message: `Page weighs ${fmtBytes(totalPage)} across ${resources.length + 1} requests — within typical performance budgets.` });
    payload.issues = issues;
    payload.summary = {
      pass: issues.filter((i) => i.severity === 'pass').length,
      warn: issues.filter((i) => i.severity === 'warn').length,
      fail: issues.filter((i) => i.severity === 'fail').length,
    };

    void logToolHistory({ url, toolName: 'Page Size Checker', result: payload });
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    const m = networkErrorToMessage(err);
    if (m) return Response.json({ error: m.error }, { status: m.status });
    console.error('[page-size] error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
