import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const USER_AGENT = 'OpenSourceTools-MetaTagsChecker/1.0 (+https://www.opensourcetools.online)';

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '0.0.0.0' || h === '169.254.169.254') return true;
  if (h === '[::1]' || h === '::1') return true;
  if (/^\[?fc[0-9a-f]{2}:/i.test(h)) return true;
  if (/^\[?fe80:/i.test(h)) return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  return false;
}

function normalizeUrl(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('Please provide a URL.');
  }
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let parsed;
  try { parsed = new URL(raw); }
  catch { throw new ValidationError('That doesn’t look like a valid URL.'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError('Only http:// and https:// URLs are supported.');
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new ValidationError('Private, loopback, and link-local hosts are blocked.');
  }
  return parsed.toString();
}

async function fetchWithRedirects(initialUrl, signal) {
  const chain = [];
  let currentUrl = initialUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' },
    });
    chain.push({ url: currentUrl, status: res.status });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return { res, chain, finalUrl: currentUrl };
      if (i === MAX_REDIRECTS) throw new ValidationError('Too many redirects.');
      let nextUrl;
      try { nextUrl = new URL(location, currentUrl).toString(); }
      catch { throw new ValidationError('Invalid redirect URL.'); }
      const nextHost = new URL(nextUrl).hostname;
      if (isPrivateHost(nextHost)) throw new ValidationError('Redirect target blocked.');
      try { await res.body?.cancel(); } catch {}
      currentUrl = nextUrl;
      continue;
    }
    return { res, chain, finalUrl: currentUrl };
  }
  throw new ValidationError('Too many redirects.');
}

async function readBoundedText(response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      try { await reader.cancel(); } catch {}
      break;
    }
    chunks.push(value);
  }
  const total = received > MAX_BODY_BYTES ? MAX_BODY_BYTES : received;
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset + chunk.byteLength > total) {
      merged.set(chunk.subarray(0, total - offset), offset);
      break;
    }
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const charset = (response.headers.get('content-type') || '').toLowerCase().match(/charset=([^;]+)/);
  const encoding = charset ? charset[1].trim() : 'utf-8';
  try { return new TextDecoder(encoding, { fatal: false }).decode(merged); }
  catch { return new TextDecoder('utf-8', { fatal: false }).decode(merged); }
}

const SEO_NAMES = new Set(['description', 'robots', 'googlebot', 'bingbot', 'keywords', 'author', 'generator', 'application-name', 'rating', 'referrer']);
const MOBILE_NAMES = new Set(['viewport', 'theme-color', 'color-scheme', 'mobile-web-app-capable', 'apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style', 'apple-mobile-web-app-title', 'msapplication-tilecolor', 'msapplication-tileimage', 'format-detection']);
const VERIFICATION_NAMES = new Set(['google-site-verification', 'msvalidate.01', 'yandex-verification', 'p:domain_verify', 'baidu-site-verification', 'pinterest', 'norton-safeweb-site-verification']);

function categorizeMetaTag(attrs) {
  if (attrs.charset !== undefined) return 'technical';
  if (attrs['http-equiv']) return 'technical';
  const name = (attrs.name || '').toLowerCase();
  const property = (attrs.property || '').toLowerCase();
  if (property.startsWith('og:') || property.startsWith('article:') || property.startsWith('book:') || property.startsWith('profile:') || property.startsWith('music:') || property.startsWith('video:') || property === 'fb:app_id') {
    return 'opengraph';
  }
  if (name.startsWith('twitter:')) return 'twitter';
  if (SEO_NAMES.has(name)) return 'seo';
  if (MOBILE_NAMES.has(name)) return 'mobile';
  if (VERIFICATION_NAMES.has(name)) return 'verification';
  if (attrs.itemprop) return 'microdata';
  return 'other';
}

function categorizeLinkTag(rel) {
  const r = (rel || '').toLowerCase();
  if (r === 'canonical') return 'seo';
  if (r === 'alternate') return 'seo';
  if (r === 'next' || r === 'prev') return 'seo';
  if (r.includes('icon')) return 'icons';
  if (r === 'manifest') return 'icons';
  if (r === 'preconnect' || r === 'dns-prefetch' || r === 'preload' || r === 'prefetch' || r === 'modulepreload') return 'performance';
  if (r === 'stylesheet') return 'stylesheet';
  return 'other';
}

function extract(html, finalUrl) {
  const $ = cheerio.load(html);

  const titles = $('head title').map((_, el) => $(el).text().trim()).get();
  const title = titles[0] || null;

  const metaTags = [];
  $('meta').each((_, el) => {
    const attrs = el.attribs || {};
    const out = { ...attrs };
    if (attrs.charset !== undefined) out._kind = 'charset';
    else if (attrs['http-equiv']) out._kind = 'http-equiv';
    else if (attrs.property) out._kind = 'property';
    else if (attrs.name) out._kind = 'name';
    else if (attrs.itemprop) out._kind = 'itemprop';
    else out._kind = 'unknown';
    out._category = categorizeMetaTag(attrs);
    metaTags.push(out);
  });

  const linkTags = [];
  $('head link[rel]').each((_, el) => {
    const attrs = el.attribs || {};
    const out = { ...attrs };
    out._category = categorizeLinkTag(attrs.rel);
    if (out.href) {
      try { out._absoluteHref = new URL(out.href, finalUrl).toString(); }
      catch { out._absoluteHref = out.href; }
    }
    linkTags.push(out);
  });

  const htmlLang = $('html').attr('lang') || null;
  const htmlDir = $('html').attr('dir') || null;

  const seoEssentials = {
    title,
    titleLength: title ? title.length : 0,
    titleCount: titles.length,
    description: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'description')?.content || null,
    descriptionCount: metaTags.filter((m) => (m.name || '').toLowerCase() === 'description').length,
    keywords: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'keywords')?.content || null,
    robots: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'robots')?.content || null,
    googlebot: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'googlebot')?.content || null,
    canonical: (() => {
      const c = linkTags.find((l) => (l.rel || '').toLowerCase() === 'canonical');
      return c?._absoluteHref || c?.href || null;
    })(),
    viewport: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'viewport')?.content || null,
    charset: (() => {
      const m = metaTags.find((x) => x.charset !== undefined);
      if (m) return m.charset;
      const httpEq = metaTags.find((x) => (x['http-equiv'] || '').toLowerCase() === 'content-type');
      if (httpEq?.content) {
        const cs = httpEq.content.match(/charset=([^;]+)/i);
        if (cs) return cs[1].trim();
      }
      return null;
    })(),
    htmlLang,
    htmlDir,
    author: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'author')?.content || null,
    generator: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'generator')?.content || null,
    themeColor: pickFirst(metaTags, (m) => (m.name || '').toLowerCase() === 'theme-color')?.content || null,
  };

  const opengraph = {};
  const twitter = {};
  for (const m of metaTags) {
    const prop = (m.property || '').toLowerCase();
    if (prop && m.content && !opengraph[prop]) opengraph[prop] = m.content;
    const name = (m.name || '').toLowerCase();
    if (name.startsWith('twitter:') && m.content && !twitter[name]) twitter[name] = m.content;
  }

  const grouped = {
    seo: metaTags.filter((m) => m._category === 'seo'),
    opengraph: metaTags.filter((m) => m._category === 'opengraph'),
    twitter: metaTags.filter((m) => m._category === 'twitter'),
    mobile: metaTags.filter((m) => m._category === 'mobile'),
    technical: metaTags.filter((m) => m._category === 'technical'),
    verification: metaTags.filter((m) => m._category === 'verification'),
    microdata: metaTags.filter((m) => m._category === 'microdata'),
    other: metaTags.filter((m) => m._category === 'other'),
  };

  const linksGrouped = {
    seo: linkTags.filter((l) => l._category === 'seo'),
    icons: linkTags.filter((l) => l._category === 'icons'),
    performance: linkTags.filter((l) => l._category === 'performance'),
    stylesheet: linkTags.filter((l) => l._category === 'stylesheet'),
    other: linkTags.filter((l) => l._category === 'other'),
  };

  const issues = [];
  if (!title) issues.push({ severity: 'fail', message: 'No <title> tag found.' });
  else if (titles.length > 1) issues.push({ severity: 'warn', message: `Multiple <title> tags (${titles.length}).` });
  else if (title.length < 15) issues.push({ severity: 'warn', message: `Title is short (${title.length} chars). Aim for 30–60.` });
  else if (title.length > 60) issues.push({ severity: 'warn', message: `Title is ${title.length} chars — may be truncated in SERPs (60 is safer).` });

  if (!seoEssentials.description) {
    issues.push({ severity: 'fail', message: 'No meta description found.' });
  } else {
    if (seoEssentials.descriptionCount > 1) {
      issues.push({ severity: 'warn', message: `Multiple meta descriptions (${seoEssentials.descriptionCount}).` });
    }
    const dl = seoEssentials.description.length;
    if (dl < 70) issues.push({ severity: 'warn', message: `Description is short (${dl} chars). Aim for 120–160.` });
    else if (dl > 165) issues.push({ severity: 'warn', message: `Description is ${dl} chars — may be truncated.` });
  }

  if (!seoEssentials.viewport) issues.push({ severity: 'fail', message: 'No viewport meta tag — page won’t render correctly on mobile.' });
  if (!seoEssentials.canonical) issues.push({ severity: 'warn', message: 'No <link rel="canonical"> declared.' });
  if (!seoEssentials.charset) issues.push({ severity: 'warn', message: 'No charset declared.' });
  if (!seoEssentials.htmlLang) issues.push({ severity: 'warn', message: 'No lang attribute on <html>.' });

  const hasOg = opengraph['og:title'] && opengraph['og:description'] && opengraph['og:image'];
  if (!hasOg) {
    const missing = ['og:title', 'og:description', 'og:image'].filter((k) => !opengraph[k]);
    issues.push({ severity: 'warn', message: `Missing Open Graph tags: ${missing.join(', ')}.` });
  }

  const noindex = (seoEssentials.robots || '').toLowerCase().includes('noindex')
    || (seoEssentials.googlebot || '').toLowerCase().includes('noindex');
  if (noindex) issues.push({ severity: 'fail', message: 'Page declares "noindex" in robots/googlebot meta.' });

  return {
    seoEssentials,
    opengraph,
    twitter,
    metaTagsGrouped: grouped,
    linkTagsGrouped: linksGrouped,
    counts: {
      meta: metaTags.length,
      link: linkTags.length,
      titles: titles.length,
    },
    issues,
  };
}

function pickFirst(items, predicate) {
  for (const item of items) if (predicate(item)) return item;
  return null;
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
    const xRobotsTag = res.headers.get('x-robots-tag');
    const contentType = res.headers.get('content-type') || '';
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);

    if (res.status >= 400) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({
        url, finalUrl, httpStatus: res.status, contentType,
        error: `Server returned HTTP ${res.status}.`,
        redirectChain: chain,
      }, { status: 502 });
    }

    if (!isHtml) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({
        url, finalUrl, httpStatus: res.status, contentType,
        error: `Content-Type is "${contentType || 'unknown'}" — this tool only works on HTML pages.`,
        redirectChain: chain,
      }, { status: 400 });
    }

    const html = await readBoundedText(res);
    const extracted = extract(html, finalUrl);

    if (xRobotsTag && xRobotsTag.toLowerCase().includes('noindex')) {
      extracted.issues.push({ severity: 'fail', message: `X-Robots-Tag header declares "noindex": ${xRobotsTag}` });
    }

    const result = {
      url,
      finalUrl,
      httpStatus: res.status,
      contentType,
      xRobotsTag: xRobotsTag || null,
      redirectChain: chain,
      ...extracted,
    };
    void logToolHistory({ url: result.url, toolName: 'Meta Tags Checker', result });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    if (err?.name === 'AbortError') {
      return Response.json({ error: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` }, { status: 504 });
    }
    if (err?.cause?.code === 'ENOTFOUND' || err?.code === 'ENOTFOUND') {
      return Response.json({ error: 'Could not resolve that domain (DNS lookup failed).' }, { status: 502 });
    }
    if (err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED') {
      return Response.json({ error: 'Connection refused.' }, { status: 502 });
    }
    if (err?.cause?.code === 'CERT_HAS_EXPIRED') {
      return Response.json({ error: 'The site’s SSL certificate has expired.' }, { status: 502 });
    }
    console.error('[meta-tags] unexpected error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
