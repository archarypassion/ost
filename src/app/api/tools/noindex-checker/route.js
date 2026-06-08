import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const USER_AGENT = 'Tool4Utility-NoindexChecker/1.0 (+https://tool4utility.com)';

const KNOWN_DIRECTIVES = new Set([
  'all',
  'noindex',
  'nofollow',
  'none',
  'noarchive',
  'nosnippet',
  'noimageindex',
  'notranslate',
  'indexifembedded',
  'unavailable_after',
  'max-snippet',
  'max-image-preview',
  'max-video-preview',
]);

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

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function parseRobotsContent(value) {
  if (!value) return { directives: [], raw: null };
  const raw = String(value).trim();
  if (!raw) return { directives: [], raw: null };
  const directives = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, ...rest] = part.split(':');
      return {
        name: name.trim().toLowerCase(),
        value: rest.length ? rest.join(':').trim() : null,
      };
    });
  return { directives, raw };
}

function parseXRobotsTag(headerValue) {
  if (!headerValue) return { entries: [], raw: null };
  const raw = String(headerValue).trim();
  if (!raw) return { entries: [], raw: null };

  const entries = [];
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    let bot = '*';
    let directiveStr = part;

    if (colonIdx > -1) {
      const maybeBot = part.slice(0, colonIdx).trim();
      const rest = part.slice(colonIdx + 1).trim();
      if (maybeBot && !KNOWN_DIRECTIVES.has(maybeBot.toLowerCase())) {
        bot = maybeBot;
        directiveStr = rest;
      }
    }

    const [name, ...valueRest] = directiveStr.split('=');
    const directive = {
      bot,
      name: (name || directiveStr).trim().toLowerCase(),
      value: valueRest.length ? valueRest.join('=').trim() : null,
    };
    entries.push(directive);
  }
  return { entries, raw };
}

function hasNoindexDirective(items) {
  return items.some(
    (d) => d.name === 'noindex' || d.name === 'none'
  );
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
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      },
    });

    chain.push({ url: currentUrl, status: res.status });

    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get('location');

    if (isRedirect && location) {
      if (i === MAX_REDIRECTS) {
        throw new ValidationError(
          `Too many redirects (more than ${MAX_REDIRECTS}).`
        );
      }
      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new ValidationError('Server returned an invalid redirect URL.');
      }
      const nextHost = new URL(nextUrl).hostname;
      if (isPrivateHost(nextHost)) {
        throw new ValidationError(
          'Redirect target is a private/loopback host and was blocked.'
        );
      }
      try {
        await res.body?.cancel();
      } catch {}
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
      try {
        await reader.cancel();
      } catch {}
      break;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(received > MAX_BODY_BYTES ? MAX_BODY_BYTES : received);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset + chunk.byteLength > merged.length) {
      merged.set(chunk.subarray(0, merged.length - offset), offset);
      break;
    }
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const charset = (response.headers.get('content-type') || '')
    .toLowerCase()
    .match(/charset=([^;]+)/);
  const encoding = charset ? charset[1].trim() : 'utf-8';
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(merged);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(merged);
  }
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  let url;
  try {
    url = normalizeUrl(body?.url);
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(url, ctrl.signal);

    const xRobotsParsed = parseXRobotsTag(res.headers.get('x-robots-tag'));
    const contentType = res.headers.get('content-type') || '';
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);

    let robotsParsed = { directives: [], raw: null };
    let googlebotParsed = { directives: [], raw: null };
    let pageTitle = null;

    if (isHtml) {
      const html = await readBoundedText(res);
      const $ = cheerio.load(html);
      pageTitle = $('title').first().text().trim() || null;

      $('meta[name]').each((_, el) => {
        const name = String($(el).attr('name') || '').toLowerCase().trim();
        const content = $(el).attr('content');
        if (name === 'robots' && !robotsParsed.raw) {
          robotsParsed = parseRobotsContent(content);
        } else if (name === 'googlebot' && !googlebotParsed.raw) {
          googlebotParsed = parseRobotsContent(content);
        }
      });
    } else {
      try {
        await res.body?.cancel();
      } catch {}
    }

    const allDirectiveNames = [
      ...xRobotsParsed.entries
        .filter((e) => e.bot === '*' || /^googlebot$/i.test(e.bot))
        .map((e) => e.name),
      ...robotsParsed.directives.map((d) => d.name),
      ...googlebotParsed.directives.map((d) => d.name),
    ];

    const noindex = hasNoindexDirective(
      [...xRobotsParsed.entries, ...robotsParsed.directives, ...googlebotParsed.directives]
    );
    const nofollow = allDirectiveNames.includes('nofollow') || allDirectiveNames.includes('none');

    const sources = [];
    if (xRobotsParsed.raw) sources.push('x-robots-tag header');
    if (robotsParsed.raw) sources.push('<meta name="robots">');
    if (googlebotParsed.raw) sources.push('<meta name="googlebot">');

    const result = {
      url,
      finalUrl,
      httpStatus: res.status,
      contentType: contentType || null,
      isHtml,
      pageTitle,
      hasNoindex: noindex,
      hasNofollow: nofollow,
      indexable: !noindex && res.status >= 200 && res.status < 400,
      robotsContent: robotsParsed.raw,
      googlebotContent: googlebotParsed.raw,
      xRobotsTag: xRobotsParsed.raw,
      directives: [...new Set(allDirectiveNames)].sort(),
      redirectChain: chain,
      sources,
    };

    void logToolHistory({ url: result.url, toolName: 'Noindex Tag Checker', result });

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
      return Response.json(
        { error: 'Could not resolve that domain (DNS lookup failed).' },
        { status: 502 }
      );
    }
    if (err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED') {
      return Response.json(
        { error: 'Connection refused by the target server.' },
        { status: 502 }
      );
    }
    if (err?.cause?.code === 'CERT_HAS_EXPIRED') {
      return Response.json(
        { error: 'The site’s SSL certificate has expired.' },
        { status: 502 }
      );
    }
    console.error('[noindex-checker] unexpected error:', err);
    return Response.json(
      { error: 'Failed to fetch the URL. Please check it and try again.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
