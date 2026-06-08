import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const USER_AGENT = 'Tool4Utility-OnPageChecker/1.0 (+https://tool4utility.com)';

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
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError('That doesn’t look like a valid URL.');
  }
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
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(merged);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(merged);
  }
}

function extractSignals(html, finalUrl) {
  const $ = cheerio.load(html);

  const titles = $('head title').map((_, el) => $(el).text().trim()).get();
  const title = titles[0] || null;

  const descriptions = $('meta[name="description" i]')
    .map((_, el) => $(el).attr('content'))
    .get()
    .filter(Boolean);
  const description = descriptions[0] || null;

  const robotsContent = $('meta[name="robots" i]').first().attr('content') || null;
  const googlebotContent = $('meta[name="googlebot" i]').first().attr('content') || null;
  const viewport = $('meta[name="viewport" i]').first().attr('content') || null;
  const charset =
    $('meta[charset]').first().attr('charset') ||
    ($('meta[http-equiv="Content-Type" i]').first().attr('content') || '').match(/charset=([^;]+)/i)?.[1] ||
    null;
  const author = $('meta[name="author" i]').first().attr('content') || null;
  const keywords = $('meta[name="keywords" i]').first().attr('content') || null;

  const canonicalHref = $('link[rel="canonical" i]').first().attr('href') || null;
  let canonical = canonicalHref;
  if (canonicalHref) {
    try { canonical = new URL(canonicalHref, finalUrl).toString(); } catch {}
  }

  const htmlLang = $('html').attr('lang') || null;
  const hreflang = $('link[rel="alternate"][hreflang]')
    .map((_, el) => ({
      hreflang: $(el).attr('hreflang'),
      href: $(el).attr('href'),
    }))
    .get();

  const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
  for (const tag of Object.keys(headings)) {
    $(tag).each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt) headings[tag].push(txt);
    });
  }

  const images = $('img').map((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || null;
    const alt = $(el).attr('alt');
    return { src, alt: alt === undefined ? null : alt };
  }).get();
  const imagesMissingAlt = images.filter((i) => i.alt === null);
  const imagesEmptyAlt = images.filter((i) => i.alt === '');

  const finalHost = (() => {
    try { return new URL(finalUrl).hostname; } catch { return null; }
  })();
  const links = $('a[href]').map((_, el) => {
    const href = $(el).attr('href');
    let absolute = href;
    let host = null;
    try {
      const u = new URL(href, finalUrl);
      absolute = u.toString();
      host = u.hostname;
    } catch {}
    const rel = ($(el).attr('rel') || '').toLowerCase();
    return {
      href: absolute,
      isInternal: host === finalHost,
      nofollow: rel.split(/\s+/).includes('nofollow'),
    };
  }).get();
  const internalLinks = links.filter((l) => l.isInternal).length;
  const externalLinks = links.length - internalLinks;
  const nofollowLinks = links.filter((l) => l.nofollow).length;

  const og = {};
  $('meta[property^="og:" i]').each((_, el) => {
    const prop = ($(el).attr('property') || '').toLowerCase();
    const content = $(el).attr('content');
    if (prop && content && !og[prop]) og[prop] = content;
  });

  const twitter = {};
  $('meta[name^="twitter:" i]').each((_, el) => {
    const name = ($(el).attr('name') || '').toLowerCase();
    const content = $(el).attr('content');
    if (name && content && !twitter[name]) twitter[name] = content;
  });

  const jsonldBlocks = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text();
    try {
      const parsed = JSON.parse(text);
      const types = collectJsonLdTypes(parsed);
      jsonldBlocks.push({ types, raw: text.length > 4000 ? text.slice(0, 4000) + '…' : text });
    } catch {
      jsonldBlocks.push({ types: ['<invalid JSON-LD>'], raw: text.length > 4000 ? text.slice(0, 4000) + '…' : text });
    }
  });

  $('article script, footer script, aside script').remove();
  $('script, style, noscript').remove();
  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = visibleText ? visibleText.split(/\s+/).filter(Boolean).length : 0;
  const htmlSize = html.length;
  const textSize = visibleText.length;
  const textRatio = htmlSize > 0 ? textSize / htmlSize : 0;

  const favicon =
    $('link[rel="icon"]').first().attr('href') ||
    $('link[rel="shortcut icon" i]').first().attr('href') ||
    $('link[rel="apple-touch-icon" i]').first().attr('href') ||
    null;

  return {
    title,
    titleCount: titles.length,
    titleLength: title ? title.length : 0,
    description,
    descriptionLength: description ? description.length : 0,
    descriptionCount: descriptions.length,
    robotsContent,
    googlebotContent,
    viewport,
    charset,
    author,
    keywords,
    canonical,
    htmlLang,
    hreflang,
    headings: {
      h1Count: headings.h1.length,
      h1Texts: headings.h1.slice(0, 5),
      h2Count: headings.h2.length,
      h2Texts: headings.h2.slice(0, 10),
      h3Count: headings.h3.length,
      h4Count: headings.h4.length,
      h5Count: headings.h5.length,
      h6Count: headings.h6.length,
    },
    images: {
      total: images.length,
      missingAlt: imagesMissingAlt.length,
      emptyAlt: imagesEmptyAlt.length,
      sampleMissing: imagesMissingAlt.slice(0, 5).map((i) => i.src),
    },
    links: {
      total: links.length,
      internal: internalLinks,
      external: externalLinks,
      nofollow: nofollowLinks,
    },
    openGraph: og,
    twitterCard: twitter,
    jsonld: jsonldBlocks,
    wordCount,
    htmlSize,
    textRatio,
    favicon,
  };
}

function collectJsonLdTypes(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdTypes(item, out);
    return out;
  }
  if (node['@type']) {
    if (Array.isArray(node['@type'])) out.push(...node['@type']);
    else out.push(node['@type']);
  }
  if (node['@graph']) collectJsonLdTypes(node['@graph'], out);
  return out;
}

function check(name, weight, severity, message, detail = null) {
  return { name, weight, severity, message, detail };
}

function runChecks(s, ctx) {
  const checks = [];

  if (s.title) {
    if (s.titleCount > 1) {
      checks.push(check('Title tag', 4, 'warn', `Multiple title tags found (${s.titleCount}). Use exactly one.`, s.title));
    } else if (s.titleLength < 15) {
      checks.push(check('Title tag', 4, 'warn', `Title is too short (${s.titleLength} chars). Aim for 30–60.`, s.title));
    } else if (s.titleLength > 70) {
      checks.push(check('Title tag', 4, 'warn', `Title is too long (${s.titleLength} chars) — likely truncated in SERPs.`, s.title));
    } else if (s.titleLength > 60) {
      checks.push(check('Title tag', 4, 'warn', `Title is ${s.titleLength} chars — may be truncated in some SERPs (60 is safer).`, s.title));
    } else {
      checks.push(check('Title tag', 4, 'pass', `Title length is ${s.titleLength} chars (good).`, s.title));
    }
  } else {
    checks.push(check('Title tag', 4, 'fail', 'No <title> tag found. This is the single most important on-page SEO element.'));
  }

  if (s.description) {
    if (s.descriptionCount > 1) {
      checks.push(check('Meta description', 3, 'warn', `Multiple meta descriptions (${s.descriptionCount}). Use only one.`, s.description));
    } else if (s.descriptionLength < 70) {
      checks.push(check('Meta description', 3, 'warn', `Description is short (${s.descriptionLength} chars). Aim for 120–160.`, s.description));
    } else if (s.descriptionLength > 165) {
      checks.push(check('Meta description', 3, 'warn', `Description is too long (${s.descriptionLength} chars) — likely truncated.`, s.description));
    } else {
      checks.push(check('Meta description', 3, 'pass', `Description length is ${s.descriptionLength} chars (good).`, s.description));
    }
  } else {
    checks.push(check('Meta description', 3, 'fail', 'No meta description found. Google will auto-generate one from page content.'));
  }

  const h1 = s.headings.h1Count;
  if (h1 === 1) {
    checks.push(check('H1 heading', 3, 'pass', 'Exactly one H1 tag found.', s.headings.h1Texts[0]));
  } else if (h1 === 0) {
    checks.push(check('H1 heading', 3, 'fail', 'No H1 tag found. Every page should have one clear H1.'));
  } else {
    checks.push(check('H1 heading', 3, 'warn', `Found ${h1} H1 tags. Pages should typically have exactly one.`, s.headings.h1Texts.join(' | ')));
  }

  if (s.headings.h2Count === 0 && s.wordCount > 300) {
    checks.push(check('Heading structure', 1, 'warn', 'No H2 tags found on a content-rich page. Use H2s to structure your content.'));
  } else if (s.headings.h2Count > 0) {
    checks.push(check('Heading structure', 1, 'pass', `${s.headings.h2Count} H2 tag${s.headings.h2Count === 1 ? '' : 's'} found.`));
  }

  if (s.images.total === 0) {
    checks.push(check('Image alt text', 2, 'pass', 'No images on this page.'));
  } else if (s.images.missingAlt === 0) {
    checks.push(check('Image alt text', 2, 'pass', `All ${s.images.total} images have an alt attribute.`));
  } else {
    const ratio = s.images.missingAlt / s.images.total;
    const sev = ratio > 0.5 ? 'fail' : 'warn';
    checks.push(check('Image alt text', 2, sev, `${s.images.missingAlt} of ${s.images.total} images are missing alt attributes.`));
  }

  if (s.viewport) {
    const ok = /width\s*=\s*device-width/i.test(s.viewport);
    checks.push(check(
      'Mobile viewport',
      2,
      ok ? 'pass' : 'warn',
      ok ? 'Responsive viewport meta tag found.' : 'Viewport tag is present but missing "width=device-width".',
      s.viewport
    ));
  } else {
    checks.push(check('Mobile viewport', 2, 'fail', 'No <meta name="viewport"> — page won’t render correctly on mobile.'));
  }

  if (s.htmlLang) {
    checks.push(check('Language declaration', 1, 'pass', `<html lang="${s.htmlLang}"> set.`));
  } else {
    checks.push(check('Language declaration', 1, 'warn', 'No lang attribute on <html>. Helps screen readers and Google.'));
  }

  if (s.canonical) {
    let same = false;
    try { same = new URL(s.canonical).toString() === new URL(ctx.finalUrl).toString(); } catch {}
    checks.push(check(
      'Canonical URL',
      2,
      same ? 'pass' : 'warn',
      same ? 'Self-referential canonical URL.' : 'Canonical URL points to a different URL — Google may index that one instead.',
      s.canonical
    ));
  } else {
    checks.push(check('Canonical URL', 2, 'warn', 'No <link rel="canonical"> declared. Recommended on every page.'));
  }

  const noindex = (s.robotsContent || '').toLowerCase().includes('noindex')
    || (s.googlebotContent || '').toLowerCase().includes('noindex')
    || (ctx.xRobotsTag || '').toLowerCase().includes('noindex');
  if (noindex) {
    checks.push(check('Indexability', 4, 'fail', 'Page declares "noindex" — search engines won’t add it to the index.'));
  } else {
    checks.push(check('Indexability', 4, 'pass', 'No "noindex" directive found.'));
  }

  if (s.openGraph['og:title'] && s.openGraph['og:description'] && s.openGraph['og:image']) {
    checks.push(check('Open Graph tags', 2, 'pass', 'og:title, og:description, and og:image are all present.'));
  } else {
    const missing = ['og:title', 'og:description', 'og:image'].filter((k) => !s.openGraph[k]);
    checks.push(check('Open Graph tags', 2, 'warn', `Missing Open Graph tags: ${missing.join(', ')}. Affects social previews.`));
  }

  if (s.twitterCard['twitter:card']) {
    checks.push(check('Twitter Card', 1, 'pass', `twitter:card="${s.twitterCard['twitter:card']}" set.`));
  } else {
    checks.push(check('Twitter Card', 1, 'warn', 'No twitter:card meta tag — Twitter/X will fall back to OG tags.'));
  }

  if (s.jsonld.length > 0) {
    const allTypes = [...new Set(s.jsonld.flatMap((b) => b.types))];
    checks.push(check('Structured data', 2, 'pass', `${s.jsonld.length} JSON-LD block${s.jsonld.length === 1 ? '' : 's'} found.`, allTypes.join(', ')));
  } else {
    checks.push(check('Structured data', 2, 'warn', 'No JSON-LD structured data found. Schema.org markup helps rich results.'));
  }

  if (s.wordCount < 100) {
    checks.push(check('Content length', 2, 'warn', `Only ${s.wordCount} words on the page. Thin content rarely ranks.`));
  } else if (s.wordCount < 300) {
    checks.push(check('Content length', 2, 'warn', `${s.wordCount} words. Aim for 300+ for informational pages.`));
  } else {
    checks.push(check('Content length', 2, 'pass', `${s.wordCount.toLocaleString()} words.`));
  }

  if (s.textRatio < 0.05 && s.htmlSize > 50_000) {
    checks.push(check('Text-to-HTML ratio', 1, 'warn', `Very low text ratio (${(s.textRatio * 100).toFixed(1)}%). Page is mostly markup/scripts.`));
  } else if (s.textRatio > 0) {
    checks.push(check('Text-to-HTML ratio', 1, 'pass', `${(s.textRatio * 100).toFixed(1)}% of HTML is visible text.`));
  }

  if (s.favicon) {
    checks.push(check('Favicon', 1, 'pass', 'Favicon link declared.'));
  } else {
    checks.push(check('Favicon', 1, 'warn', 'No favicon declared.'));
  }

  if (s.charset) {
    checks.push(check('Charset', 1, 'pass', `Charset "${s.charset}".`));
  } else {
    checks.push(check('Charset', 1, 'warn', 'No charset declared. UTF-8 is recommended.'));
  }

  if (s.links.total > 0) {
    if (s.links.internal === 0 && s.links.external > 0) {
      checks.push(check('Internal linking', 1, 'warn', 'No internal links found. Internal links help Google discover pages.'));
    } else if (s.links.internal > 0) {
      checks.push(check('Internal linking', 1, 'pass', `${s.links.internal} internal, ${s.links.external} external link${s.links.external === 1 ? '' : 's'}.`));
    }
  }

  return checks;
}

function computeScore(checks) {
  let max = 0;
  let earned = 0;
  for (const c of checks) {
    max += c.weight * 2;
    if (c.severity === 'pass') earned += c.weight * 2;
    else if (c.severity === 'warn') earned += c.weight;
    // 'fail' = 0
  }
  if (max === 0) return 0;
  return Math.round((earned / max) * 100);
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
        url,
        finalUrl,
        httpStatus: res.status,
        contentType,
        error: `Server returned HTTP ${res.status}.`,
        redirectChain: chain,
      }, { status: 502 });
    }

    if (!isHtml) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({
        url,
        finalUrl,
        httpStatus: res.status,
        contentType,
        error: `Content-Type is "${contentType || 'unknown'}" — this tool only analyzes HTML pages.`,
        redirectChain: chain,
      }, { status: 400 });
    }

    const html = await readBoundedText(res);
    const signals = extractSignals(html, finalUrl);
    const checks = runChecks(signals, { finalUrl, xRobotsTag });
    const score = computeScore(checks);

    const passed = checks.filter((c) => c.severity === 'pass').length;
    const warnings = checks.filter((c) => c.severity === 'warn').length;
    const failed = checks.filter((c) => c.severity === 'fail').length;

    const result = {
      url,
      finalUrl,
      httpStatus: res.status,
      contentType,
      xRobotsTag,
      score,
      counts: { passed, warnings, failed, total: checks.length },
      checks,
      signals,
      redirectChain: chain,
    };
    void logToolHistory({
      url: result.url,
      toolName: 'On-Page SEO Checker',
      result: { ...result, signals: { ...result.signals, jsonld: undefined } },
    });
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
    console.error('[on-page-seo] unexpected error:', err);
    return Response.json({ error: 'Failed to analyze the page.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
