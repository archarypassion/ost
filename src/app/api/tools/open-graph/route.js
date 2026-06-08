import * as cheerio from 'cheerio';
import { imageSize } from 'image-size';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const IMAGE_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const USER_AGENT = 'Tool4Utility-OpenGraphChecker/1.0 (+https://tool4utility.com)';
// Facebook crawler UA — some sites only emit OG tags when they detect this
const FB_CRAWLER_UA = 'facebookexternalhit/1.1 (+https://www.facebook.com/externalhit_uatext.php)';

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

async function fetchWithRedirects(initialUrl, signal, headers = {}) {
  const chain = [];
  let currentUrl = initialUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        ...headers,
      },
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

async function readBoundedText(response, maxBytes = MAX_BODY_BYTES) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      try { await reader.cancel(); } catch {}
      break;
    }
    chunks.push(value);
  }
  const total = received > maxBytes ? maxBytes : received;
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

async function readBoundedBytes(response, maxBytes = MAX_IMAGE_BYTES) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      try { await reader.cancel(); } catch {}
      break;
    }
    chunks.push(value);
  }
  const total = received > maxBytes ? maxBytes : received;
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
  return merged;
}

function parseTags(html, finalUrl) {
  const $ = cheerio.load(html);

  const og = {};
  const ogStructured = { 'og:image': [], 'og:video': [], 'og:audio': [] };
  let lastStructured = null;

  $('meta').each((_, el) => {
    const property = (el.attribs.property || '').toLowerCase();
    const name = (el.attribs.name || '').toLowerCase();
    const content = el.attribs.content;
    if (!content) return;

    if (property.startsWith('og:') || property.startsWith('article:') || property.startsWith('book:') || property.startsWith('profile:') || property.startsWith('music:') || property.startsWith('video:')) {
      // First occurrence wins for the simple map
      if (og[property] === undefined) og[property] = content;

      // Track structured arrays for og:image, og:video, og:audio
      const m = property.match(/^(og:(image|video|audio))(?::(.+))?$/);
      if (m) {
        const root = m[1];
        const subkey = m[3];
        if (!subkey) {
          // Root URL — start a new structured object
          const obj = { url: content };
          ogStructured[root].push(obj);
          lastStructured = obj;
        } else if (lastStructured && root === (lastStructured._root || root)) {
          lastStructured[subkey] = content;
        } else {
          // Sub-key without a preceding root — synthesize a placeholder
          const obj = { [subkey]: content };
          ogStructured[root].push(obj);
          lastStructured = obj;
        }
      } else {
        lastStructured = null;
      }
    } else if (name.startsWith('twitter:')) {
      // og: namespace and twitter: namespace are independent — don't reset lastStructured here
    } else {
      lastStructured = null;
    }
  });

  const twitter = {};
  $('meta').each((_, el) => {
    const name = (el.attribs.name || '').toLowerCase();
    const property = (el.attribs.property || '').toLowerCase();
    const content = el.attribs.content;
    if (!content) return;
    // Some sites use property="twitter:..." instead of name=
    if (name.startsWith('twitter:') && twitter[name] === undefined) twitter[name] = content;
    else if (property.startsWith('twitter:') && twitter[property] === undefined) twitter[property] = content;
  });

  const fallbackTitle = $('head title').first().text().trim() || null;
  const fallbackDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const canonical = (() => {
    const c = $('link[rel="canonical"]').attr('href');
    if (!c) return null;
    try { return new URL(c, finalUrl).toString(); }
    catch { return c; }
  })();

  // Resolve image URLs to absolute
  for (const list of [ogStructured['og:image'], ogStructured['og:video'], ogStructured['og:audio']]) {
    for (const obj of list) {
      if (obj.url) {
        try { obj.absoluteUrl = new URL(obj.url, finalUrl).toString(); }
        catch { obj.absoluteUrl = obj.url; }
      }
      if (obj.secure_url) {
        try { obj.absoluteSecureUrl = new URL(obj.secure_url, finalUrl).toString(); }
        catch { obj.absoluteSecureUrl = obj.secure_url; }
      }
    }
  }

  return {
    og,
    ogStructured,
    twitter,
    fallback: { title: fallbackTitle, description: fallbackDescription, canonical },
  };
}

async function probeImage(absoluteUrl, signal) {
  if (!absoluteUrl) return null;
  let parsed;
  try { parsed = new URL(absoluteUrl); }
  catch { return { url: absoluteUrl, error: 'Invalid image URL.' }; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { url: absoluteUrl, error: 'Image protocol not supported.' };
  }
  if (isPrivateHost(parsed.hostname)) {
    return { url: absoluteUrl, error: 'Image host blocked.' };
  }

  try {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    const timer = setTimeout(() => ctrl.abort(), IMAGE_TIMEOUT_MS);

    let res;
    try {
      res = await fetch(absoluteUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
        },
      });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }

    const contentType = res.headers.get('content-type') || '';
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10) || null;
    if (!res.ok) {
      try { await res.body?.cancel(); } catch {}
      return { url: absoluteUrl, status: res.status, contentType, error: `Image returned HTTP ${res.status}.` };
    }

    const bytes = await readBoundedBytes(res);
    let dims = null;
    let format = null;
    try {
      const result = imageSize(bytes);
      if (result?.width && result?.height) {
        dims = { width: result.width, height: result.height };
        format = result.type || null;
      }
    } catch {
      // SVG — try to read viewBox/width/height
      if (/svg/i.test(contentType) || absoluteUrl.toLowerCase().endsWith('.svg')) {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        const wMatch = text.match(/<svg[^>]*\swidth\s*=\s*["']?([\d.]+)/i);
        const hMatch = text.match(/<svg[^>]*\sheight\s*=\s*["']?([\d.]+)/i);
        const vbMatch = text.match(/<svg[^>]*\sviewBox\s*=\s*["']\s*[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)/i);
        if (wMatch && hMatch) dims = { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
        else if (vbMatch) dims = { width: parseFloat(vbMatch[1]), height: parseFloat(vbMatch[2]) };
        format = 'svg';
      }
    }

    return {
      url: absoluteUrl,
      status: res.status,
      contentType,
      contentLength: contentLength ?? bytes.byteLength,
      bytesRead: bytes.byteLength,
      truncated: bytes.byteLength >= MAX_IMAGE_BYTES,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      format: format || (contentType.split(';')[0] || null),
    };
  } catch (err) {
    if (err?.name === 'AbortError') return { url: absoluteUrl, error: 'Image fetch timed out.' };
    if (err?.cause?.code === 'ENOTFOUND') return { url: absoluteUrl, error: 'Image host could not be resolved.' };
    return { url: absoluteUrl, error: err?.message || 'Failed to fetch image.' };
  }
}

function validate({ og, ogStructured, twitter, fallback }, finalUrl, imageProbe) {
  const checks = [];

  const required = ['og:title', 'og:type', 'og:image', 'og:url'];
  for (const key of required) {
    if (key === 'og:image') {
      if (ogStructured['og:image'].length === 0) {
        checks.push({ severity: 'fail', tag: key, message: 'Required: og:image is missing.' });
      } else {
        checks.push({ severity: 'pass', tag: key, message: `og:image declared (${ogStructured['og:image'].length}).` });
      }
    } else if (!og[key]) {
      checks.push({ severity: 'fail', tag: key, message: `Required: ${key} is missing.` });
    } else {
      checks.push({ severity: 'pass', tag: key, message: `${key} declared.` });
    }
  }

  // og:title length
  if (og['og:title']) {
    const len = og['og:title'].length;
    if (len > 95) checks.push({ severity: 'warn', tag: 'og:title', message: `og:title is ${len} chars (truncated around 88–95 in feeds).` });
    else if (len < 10) checks.push({ severity: 'warn', tag: 'og:title', message: `og:title is short (${len} chars).` });
    else checks.push({ severity: 'pass', tag: 'og:title', message: `Length ${len} chars looks good.` });
  }

  // og:description recommended
  if (!og['og:description']) {
    checks.push({ severity: 'warn', tag: 'og:description', message: 'Recommended: og:description is missing.' });
  } else {
    const len = og['og:description'].length;
    if (len > 200) checks.push({ severity: 'warn', tag: 'og:description', message: `og:description is ${len} chars (truncated around 200 in some feeds).` });
    else if (len < 30) checks.push({ severity: 'warn', tag: 'og:description', message: `og:description is short (${len} chars).` });
    else checks.push({ severity: 'pass', tag: 'og:description', message: `Description ${len} chars looks good.` });
  }

  if (!og['og:site_name']) checks.push({ severity: 'warn', tag: 'og:site_name', message: 'Recommended: og:site_name not set.' });
  else checks.push({ severity: 'pass', tag: 'og:site_name', message: `og:site_name = "${og['og:site_name']}".` });

  if (!og['og:locale']) checks.push({ severity: 'info', tag: 'og:locale', message: 'Optional: og:locale not set (defaults to en_US).' });

  // og:url should match the canonical or final URL
  if (og['og:url']) {
    try {
      const ogUrl = new URL(og['og:url'], finalUrl).toString();
      const final = finalUrl;
      if (ogUrl !== final && fallback.canonical && ogUrl !== fallback.canonical) {
        checks.push({ severity: 'warn', tag: 'og:url', message: `og:url (${ogUrl}) doesn’t match the final URL or canonical.` });
      } else {
        checks.push({ severity: 'pass', tag: 'og:url', message: 'og:url matches the page URL.' });
      }
    } catch {
      checks.push({ severity: 'warn', tag: 'og:url', message: 'og:url is not a valid URL.' });
    }
  }

  // og:type
  if (og['og:type']) {
    const validTypes = ['website', 'article', 'book', 'profile', 'video.movie', 'video.episode', 'video.tv_show', 'video.other', 'music.song', 'music.album', 'music.playlist', 'music.radio_station', 'product', 'product.group', 'product.item', 'object'];
    if (!validTypes.some((t) => og['og:type'].toLowerCase() === t || og['og:type'].toLowerCase().startsWith(t + '.'))) {
      checks.push({ severity: 'info', tag: 'og:type', message: `og:type "${og['og:type']}" is non-standard.` });
    } else {
      checks.push({ severity: 'pass', tag: 'og:type', message: `og:type = "${og['og:type']}".` });
    }
  }

  // Image quality
  if (imageProbe) {
    if (imageProbe.error) {
      checks.push({ severity: 'fail', tag: 'og:image', message: `og:image is unreachable: ${imageProbe.error}` });
    } else {
      const w = imageProbe.width;
      const h = imageProbe.height;
      if (w && h) {
        if (w >= 1200 && h >= 630) {
          checks.push({ severity: 'pass', tag: 'og:image', message: `Image is ${w}×${h} — meets recommended 1200×630.` });
        } else if (w >= 600 && h >= 315) {
          checks.push({ severity: 'warn', tag: 'og:image', message: `Image is ${w}×${h} — below recommended 1200×630, will look fuzzy on Retina.` });
        } else if (w >= 200 && h >= 200) {
          checks.push({ severity: 'warn', tag: 'og:image', message: `Image is ${w}×${h} — below the 600×315 minimum for large previews; may render as a small thumbnail.` });
        } else {
          checks.push({ severity: 'fail', tag: 'og:image', message: `Image is ${w}×${h} — too small. Some platforms will refuse to display it.` });
        }

        const ratio = w / h;
        if (Math.abs(ratio - 1.91) > 0.5 && Math.abs(ratio - 1) > 0.5) {
          checks.push({ severity: 'info', tag: 'og:image', message: `Aspect ratio ${ratio.toFixed(2)}:1 — Facebook recommends 1.91:1 (1200×630).` });
        }
      } else {
        checks.push({ severity: 'warn', tag: 'og:image', message: 'Could not detect image dimensions (unsupported format?).' });
      }

      if (imageProbe.contentLength && imageProbe.contentLength > 8 * 1024 * 1024) {
        checks.push({ severity: 'warn', tag: 'og:image', message: `Image is ${(imageProbe.contentLength / 1024 / 1024).toFixed(1)} MB — Facebook caps at 8MB.` });
      }
    }

    // og:image:width / og:image:height advertised vs measured
    const first = ogStructured['og:image'][0];
    if (first?.width && imageProbe.width && parseInt(first.width, 10) !== imageProbe.width) {
      checks.push({ severity: 'warn', tag: 'og:image:width', message: `Declared width ${first.width} ≠ actual ${imageProbe.width}.` });
    }
    if (first?.height && imageProbe.height && parseInt(first.height, 10) !== imageProbe.height) {
      checks.push({ severity: 'warn', tag: 'og:image:height', message: `Declared height ${first.height} ≠ actual ${imageProbe.height}.` });
    }
    if (first && !first.alt) {
      checks.push({ severity: 'info', tag: 'og:image:alt', message: 'No og:image:alt — recommended for accessibility.' });
    }
  }

  // Twitter Card validation
  const card = twitter['twitter:card'];
  if (!card) {
    checks.push({ severity: 'warn', tag: 'twitter:card', message: 'twitter:card not set — Twitter will fall back to OG tags but explicit is better.' });
  } else if (!['summary', 'summary_large_image', 'app', 'player'].includes(card)) {
    checks.push({ severity: 'warn', tag: 'twitter:card', message: `Unknown twitter:card "${card}".` });
  } else {
    checks.push({ severity: 'pass', tag: 'twitter:card', message: `twitter:card = "${card}".` });
  }
  if (card === 'summary_large_image' || card === 'summary') {
    if (!twitter['twitter:title'] && !og['og:title']) {
      checks.push({ severity: 'fail', tag: 'twitter:title', message: 'Twitter card needs a title (no twitter:title or og:title).' });
    }
    if (!twitter['twitter:description'] && !og['og:description']) {
      checks.push({ severity: 'warn', tag: 'twitter:description', message: 'Twitter card needs a description.' });
    }
    if (!twitter['twitter:image'] && ogStructured['og:image'].length === 0) {
      checks.push({ severity: 'warn', tag: 'twitter:image', message: 'Twitter card needs an image.' });
    }
  }

  return checks;
}

function buildPreviews({ og, ogStructured, twitter, fallback }, finalUrl, imageProbe) {
  let host = '';
  try { host = new URL(finalUrl).hostname.replace(/^www\./, ''); } catch {}

  const title = og['og:title'] || twitter['twitter:title'] || fallback.title || '(Untitled)';
  const description = og['og:description'] || twitter['twitter:description'] || fallback.description || '';
  const image = imageProbe && !imageProbe.error
    ? imageProbe.url
    : (ogStructured['og:image'][0]?.absoluteUrl || twitter['twitter:image'] || null);
  const siteName = og['og:site_name'] || host;

  return {
    facebook: { siteName, title, description, image, host },
    linkedin: { siteName, title, description, image, host },
    twitter: {
      card: twitter['twitter:card'] || (image ? 'summary_large_image' : 'summary'),
      site: twitter['twitter:site'] || null,
      creator: twitter['twitter:creator'] || null,
      title: twitter['twitter:title'] || og['og:title'] || fallback.title || '(Untitled)',
      description: twitter['twitter:description'] || og['og:description'] || fallback.description || '',
      image: twitter['twitter:image'] || image,
      host,
    },
    whatsapp: { siteName, title, description, image, host },
    discord: { siteName, title, description, image, host, color: og['theme-color'] || null },
  };
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
  const useFbUa = body?.useFacebookCrawler === true;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = useFbUa ? { 'User-Agent': FB_CRAWLER_UA } : {};
    const { res, chain, finalUrl } = await fetchWithRedirects(url, ctrl.signal, headers);
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
    const parsed = parseTags(html, finalUrl);

    // Probe the first og:image (or twitter:image) — the one social platforms actually use
    const primaryImage = parsed.ogStructured['og:image'][0]?.absoluteUrl
      || (() => {
        const t = parsed.twitter['twitter:image'];
        if (!t) return null;
        try { return new URL(t, finalUrl).toString(); } catch { return t; }
      })();
    const imageProbe = primaryImage ? await probeImage(primaryImage, ctrl.signal) : null;

    const checks = validate(parsed, finalUrl, imageProbe);
    const previews = buildPreviews(parsed, finalUrl, imageProbe);

    const summary = {
      pass: checks.filter((c) => c.severity === 'pass').length,
      warn: checks.filter((c) => c.severity === 'warn').length,
      fail: checks.filter((c) => c.severity === 'fail').length,
      info: checks.filter((c) => c.severity === 'info').length,
    };

    const result = {
      url,
      finalUrl,
      httpStatus: res.status,
      contentType,
      crawlerUserAgent: useFbUa ? FB_CRAWLER_UA : USER_AGENT,
      redirectChain: chain,
      og: parsed.og,
      twitter: parsed.twitter,
      ogStructured: parsed.ogStructured,
      fallback: parsed.fallback,
      imageProbe,
      checks,
      summary,
      previews,
    };
    void logToolHistory({ url: result.url, toolName: 'Open Graph Checker', result });
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
    console.error('[open-graph] unexpected error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
