import { gunzipSync } from 'node:zlib';
import { XMLParser } from 'fast-xml-parser';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const MAX_INDEX_CHILDREN_TO_FETCH = 20;
const MAX_SAMPLE_URLS = 50;
const USER_AGENT = 'Tool4Utility-SitemapChecker/1.0 (+https://tool4utility.com)';

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '0.0.0.0') return true;
  if (h === '169.254.169.254') return true;
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

function buildSitemapUrl(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('Please provide a URL or domain.');
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
  const wasBareDomain = parsed.pathname === '/' || parsed.pathname === '';
  if (wasBareDomain) {
    parsed.pathname = '/sitemap.xml';
  }
  return { url: parsed.toString(), wasBareDomain, origin: parsed.origin };
}

async function discoverViaRobotsTxt(origin, signal) {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      method: 'GET',
      redirect: 'follow',
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    });
    if (!res.ok) {
      try { await res.body?.cancel(); } catch {}
      return [];
    }
    const text = await res.text();
    const sitemaps = [];
    for (const line of text.split(/\r?\n/)) {
      const cleaned = line.replace(/(^|\s)#.*$/, '').trim();
      if (!cleaned) continue;
      const m = /^sitemap\s*:\s*(.+)$/i.exec(cleaned);
      if (m) {
        const url = m[1].trim();
        if (/^https?:\/\//i.test(url)) sitemaps.push(url);
      }
    }
    return [...new Set(sitemaps)];
  } catch {
    return [];
  }
}

async function fetchWithRedirects(initialUrl, signal) {
  const chain = [];
  let currentUrl = initialUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
      },
    });

    chain.push({ url: currentUrl, status: res.status });

    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get('location');

    if (isRedirect && location) {
      if (i === MAX_REDIRECTS) {
        throw new ValidationError(`Too many redirects (more than ${MAX_REDIRECTS}).`);
      }
      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new ValidationError('Server returned an invalid redirect URL.');
      }
      const nextHost = new URL(nextUrl).hostname;
      if (isPrivateHost(nextHost)) {
        throw new ValidationError('Redirect target is a private/loopback host and was blocked.');
      }
      try { await res.body?.cancel(); } catch {}
      currentUrl = nextUrl;
      continue;
    }
    return { res, chain, finalUrl: currentUrl };
  }
  throw new ValidationError('Too many redirects.');
}

async function readBoundedBytes(response) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(0);
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
  return merged;
}

function maybeDecompress(bytes, urlForHints, contentType) {
  if (bytes.length < 2) return bytes;
  const isGzipMagic = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const looksGzip =
    isGzipMagic ||
    /\.gz($|\?)/i.test(urlForHints) ||
    /(application\/(x-)?gzip)/i.test(contentType || '');
  if (!looksGzip) return bytes;
  try {
    return gunzipSync(bytes);
  } catch {
    return bytes;
  }
}

function bytesToString(bytes) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function ensureArray(val) {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

function parseLooseDate(s) {
  if (!s || typeof s !== 'string') return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function detectFormat(text, contentType) {
  const trimmed = text.trim();
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) return 'xml';
  if (/^https?:\/\//im.test(trimmed)) return 'text';
  if (/text\/plain/i.test(contentType || '')) return 'text';
  return 'unknown';
}

function parseTextSitemap(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const urls = lines.filter((l) => /^https?:\/\//i.test(l));
  return {
    type: 'text',
    urlEntries: urls.map((u) => ({ loc: u })),
    childSitemaps: [],
  };
}

function parseXmlSitemap(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    trimValues: true,
    removeNSPrefix: false,
  });

  let parsed;
  try {
    parsed = parser.parse(xmlText);
  } catch (err) {
    throw new ValidationError(`Invalid XML: ${err.message || 'parse error'}`);
  }

  if (parsed.sitemapindex) {
    const entries = ensureArray(parsed.sitemapindex.sitemap).map((s) => ({
      loc: typeof s.loc === 'string' ? s.loc : s.loc?.['#text'] || '',
      lastmod: typeof s.lastmod === 'string' ? s.lastmod : s.lastmod?.['#text'] || null,
    })).filter((s) => s.loc);
    return {
      type: 'sitemapindex',
      urlEntries: [],
      childSitemaps: entries,
    };
  }

  if (parsed.urlset) {
    const entries = ensureArray(parsed.urlset.url).map((u) => {
      const images = ensureArray(u['image:image'] || u.image).map((i) => ({
        loc: i['image:loc'] || i.loc || (typeof i === 'string' ? i : null),
      })).filter((i) => i.loc);

      const videos = ensureArray(u['video:video'] || u.video).map((v) => ({
        title: v['video:title'] || v.title || null,
        loc: v['video:content_loc'] || v['video:player_loc'] || null,
      }));

      const news = u['news:news'] || u.news || null;
      const alternates = ensureArray(u['xhtml:link']).map((l) => ({
        hreflang: l['@_hreflang'] || null,
        href: l['@_href'] || null,
      })).filter((l) => l.href);

      return {
        loc: typeof u.loc === 'string' ? u.loc : u.loc?.['#text'] || '',
        lastmod: typeof u.lastmod === 'string' ? u.lastmod : u.lastmod?.['#text'] || null,
        changefreq: typeof u.changefreq === 'string' ? u.changefreq : null,
        priority: typeof u.priority === 'string' ? u.priority : null,
        images,
        videos,
        news,
        alternates,
      };
    }).filter((u) => u.loc);

    return { type: 'urlset', urlEntries: entries, childSitemaps: [] };
  }

  if (parsed.rss || parsed.feed) {
    const items = ensureArray(parsed.rss?.channel?.item || parsed.feed?.entry).map((item) => ({
      loc: item.link?.['@_href'] || (typeof item.link === 'string' ? item.link : '') || item.guid || '',
      lastmod: item.pubDate || item.updated || null,
    })).filter((i) => i.loc);
    return { type: 'feed', urlEntries: items, childSitemaps: [] };
  }

  throw new ValidationError(
    'XML root is not <urlset>, <sitemapindex>, <rss>, or <feed>.'
  );
}

async function fetchAndParse(url, signal) {
  const { res, chain, finalUrl } = await fetchWithRedirects(url, signal);

  const contentType = res.headers.get('content-type') || '';
  if (res.status >= 400) {
    try { await res.body?.cancel(); } catch {}
    return { found: false, status: res.status, contentType, chain, finalUrl };
  }

  const rawBytes = await readBoundedBytes(res);
  const decompressed = maybeDecompress(rawBytes, finalUrl, contentType);
  const text = bytesToString(decompressed);
  const format = detectFormat(text, contentType);

  let parsed;
  if (format === 'text') {
    parsed = parseTextSitemap(text);
  } else if (format === 'xml') {
    parsed = parseXmlSitemap(text);
  } else {
    throw new ValidationError(
      `Response doesn’t look like a sitemap (content-type: ${contentType || 'unknown'}).`
    );
  }

  return {
    found: true,
    status: res.status,
    contentType,
    chain,
    finalUrl,
    bytes: decompressed.length,
    rawBytes: rawBytes.length,
    wasCompressed: rawBytes.length !== decompressed.length,
    ...parsed,
  };
}

function summarize(parsed, sitemapUrl) {
  const issues = [];
  let earliestLastmod = null;
  let latestLastmod = null;
  let totalImages = 0;
  let totalVideos = 0;
  const seen = new Set();
  const duplicates = [];
  let offDomain = 0;
  const sitemapHost = (() => {
    try { return new URL(sitemapUrl).hostname; } catch { return null; }
  })();

  const now = Date.now();

  for (const u of parsed.urlEntries) {
    if (seen.has(u.loc)) {
      duplicates.push(u.loc);
    } else {
      seen.add(u.loc);
    }
    if (sitemapHost) {
      try {
        const h = new URL(u.loc).hostname;
        if (h !== sitemapHost) offDomain++;
      } catch {
        issues.push({ severity: 'warn', message: `Malformed URL: ${u.loc}` });
      }
    }
    const d = parseLooseDate(u.lastmod);
    if (d) {
      if (!earliestLastmod || d < earliestLastmod) earliestLastmod = d;
      if (!latestLastmod || d > latestLastmod) latestLastmod = d;
      if (d.getTime() > now + 24 * 3600 * 1000) {
        issues.push({ severity: 'warn', message: `Future lastmod date on ${u.loc}: ${u.lastmod}` });
      }
    } else if (u.lastmod) {
      issues.push({ severity: 'warn', message: `Unparseable lastmod on ${u.loc}: ${u.lastmod}` });
    }
    totalImages += u.images?.length || 0;
    totalVideos += u.videos?.length || 0;

    if (u.priority) {
      const p = Number(u.priority);
      if (!Number.isFinite(p) || p < 0 || p > 1) {
        issues.push({ severity: 'warn', message: `Invalid priority "${u.priority}" on ${u.loc}` });
      }
    }
  }

  if (duplicates.length > 0) {
    issues.push({
      severity: 'warn',
      message: `${duplicates.length} duplicate URL${duplicates.length === 1 ? '' : 's'} detected.`,
    });
  }
  if (offDomain > 0) {
    issues.push({
      severity: 'warn',
      message: `${offDomain} URL${offDomain === 1 ? '' : 's'} on a different host than the sitemap.`,
    });
  }
  if (parsed.type === 'urlset' && parsed.urlEntries.length > 50_000) {
    issues.push({
      severity: 'error',
      message: `Sitemap contains ${parsed.urlEntries.length} URLs — exceeds the 50,000 limit.`,
    });
  }

  return {
    urlCount: parsed.urlEntries.length,
    childSitemapCount: parsed.childSitemaps.length,
    earliestLastmod: earliestLastmod ? earliestLastmod.toISOString() : null,
    latestLastmod: latestLastmod ? latestLastmod.toISOString() : null,
    hasImages: totalImages > 0,
    hasVideos: totalVideos > 0,
    totalImages,
    totalVideos,
    duplicates: duplicates.length,
    offDomainCount: offDomain,
    issues,
  };
}

async function fetchChildCounts(children, signal) {
  const subset = children.slice(0, MAX_INDEX_CHILDREN_TO_FETCH);
  const results = await Promise.allSettled(
    subset.map(async (child) => {
      const parsed = await fetchAndParse(child.loc, signal);
      if (!parsed.found) {
        return { loc: child.loc, lastmod: child.lastmod, status: parsed.status, error: `HTTP ${parsed.status}` };
      }
      if (parsed.type === 'sitemapindex') {
        return {
          loc: child.loc,
          lastmod: child.lastmod,
          status: parsed.status,
          nestedIndex: true,
          childCount: parsed.childSitemaps.length,
        };
      }
      return {
        loc: child.loc,
        lastmod: child.lastmod,
        status: parsed.status,
        urlCount: parsed.urlEntries.length,
        bytes: parsed.bytes,
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      loc: subset[i].loc,
      lastmod: subset[i].lastmod,
      error: r.reason?.message || 'Failed to fetch',
    };
  });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  let sitemapUrl, wasBareDomain, origin;
  try {
    ({ url: sitemapUrl, wasBareDomain, origin } = buildSitemapUrl(body?.url));
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    let parsed = await fetchAndParse(sitemapUrl, ctrl.signal);
    let discoveredVia = null;
    let attemptedUrls = [sitemapUrl];

    if (!parsed.found && wasBareDomain && (parsed.status === 404 || parsed.status === 406 || parsed.status === 410)) {
      const discovered = await discoverViaRobotsTxt(origin, ctrl.signal);
      for (const candidate of discovered) {
        const candidateHost = (() => { try { return new URL(candidate).hostname; } catch { return null; }})();
        if (!candidateHost || isPrivateHost(candidateHost)) continue;
        attemptedUrls.push(candidate);
        const next = await fetchAndParse(candidate, ctrl.signal);
        if (next.found) {
          parsed = next;
          sitemapUrl = candidate;
          discoveredVia = 'robots.txt';
          break;
        }
      }
    }

    if (!parsed.found) {
      let message;
      if (parsed.status === 404 || parsed.status === 410) {
        message = wasBareDomain
          ? 'Sitemap not found at /sitemap.xml. We also checked robots.txt for a Sitemap: directive but found no working entry. Try entering the full sitemap URL directly.'
          : 'Sitemap not found at this URL.';
      } else if (parsed.status === 406) {
        message = wasBareDomain
          ? 'The server rejected our request at /sitemap.xml (HTTP 406). robots.txt also has no Sitemap: directive. This site may not publish a sitemap, or it may be at a non-standard URL.'
          : 'The server rejected our request (HTTP 406 Not Acceptable).';
      } else {
        message = `The server returned HTTP ${parsed.status} when fetching the sitemap.`;
      }
      const result = {
        sitemapUrl,
        finalUrl: parsed.finalUrl,
        httpStatus: parsed.status,
        contentType: parsed.contentType || null,
        found: false,
        redirectChain: parsed.chain,
        attemptedUrls,
        message,
      };
      void logToolHistory({
        url: result.sitemapUrl,
        toolName: 'XML Sitemap Checker',
        result: { ...result, sampleUrls: undefined, allUrls: undefined },
      });
      return Response.json(result, { status: parsed.status >= 500 ? 502 : 200 });
    }

    const summary = summarize(parsed, sitemapUrl);
    const sampleUrls = parsed.urlEntries.slice(0, MAX_SAMPLE_URLS).map((u) => ({
      loc: u.loc,
      lastmod: u.lastmod,
      images: u.images?.length || 0,
      videos: u.videos?.length || 0,
    }));

    let childSitemaps = parsed.childSitemaps;
    if (parsed.type === 'sitemapindex' && childSitemaps.length > 0) {
      childSitemaps = await fetchChildCounts(childSitemaps, ctrl.signal);
    }

    const result = {
      sitemapUrl,
      finalUrl: parsed.finalUrl,
      httpStatus: parsed.status,
      contentType: parsed.contentType || null,
      found: true,
      type: parsed.type,
      bytes: parsed.bytes,
      rawBytes: parsed.rawBytes,
      wasCompressed: parsed.wasCompressed,
      summary,
      sampleUrls,
      childSitemaps,
      childSitemapsTruncated:
        parsed.type === 'sitemapindex' && parsed.childSitemaps.length > MAX_INDEX_CHILDREN_TO_FETCH,
      redirectChain: parsed.chain,
      discoveredVia,
      attemptedUrls,
    };

    void logToolHistory({
      url: result.sitemapUrl,
      toolName: 'XML Sitemap Checker',
      result: { ...result, sampleUrls: undefined, allUrls: undefined },
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    if (err?.name === 'AbortError') {
      return Response.json(
        { error: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` },
        { status: 504 }
      );
    }
    if (err?.cause?.code === 'ENOTFOUND' || err?.code === 'ENOTFOUND') {
      return Response.json({ error: 'Could not resolve that domain (DNS lookup failed).' }, { status: 502 });
    }
    if (err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED') {
      return Response.json({ error: 'Connection refused by the target server.' }, { status: 502 });
    }
    if (err?.cause?.code === 'CERT_HAS_EXPIRED') {
      return Response.json({ error: 'The site’s SSL certificate has expired.' }, { status: 502 });
    }
    console.error('[sitemap-checker] unexpected error:', err);
    return Response.json(
      { error: 'Failed to fetch the sitemap. Please check the URL and try again.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
