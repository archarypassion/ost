import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 1 * 1024 * 1024;
const USER_AGENT = 'TrueSEO-RobotsTxtChecker/1.0 (+https://trueseo.tools)';

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

function buildRobotsUrl(input) {
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
  return `${parsed.protocol}//${parsed.host}/robots.txt`;
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
        Accept: 'text/plain,*/*;q=0.5',
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
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

const KNOWN_FIELDS = new Set([
  'user-agent',
  'allow',
  'disallow',
  'sitemap',
  'crawl-delay',
  'request-rate',
  'visit-time',
  'host',
  'clean-param',
  'noindex',
]);

function parseRobotsTxt(text) {
  const lines = text.split(/\r?\n/);
  const groups = [];
  const sitemaps = [];
  const otherDirectives = [];
  const errors = [];

  let currentGroup = null;
  let lastFieldWasUserAgent = false;
  let lineNumber = 0;

  for (const rawLine of lines) {
    lineNumber += 1;

    const noBom = rawLine.replace(/^\uFEFF/, '');
    const noComment = noBom.replace(/(^|\s)#.*$/, '');
    const line = noComment.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      errors.push({ line: lineNumber, text: rawLine, message: 'Missing colon — line ignored.' });
      continue;
    }

    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (!field) {
      errors.push({ line: lineNumber, text: rawLine, message: 'Empty field name.' });
      continue;
    }

    if (field === 'user-agent') {
      if (currentGroup && lastFieldWasUserAgent) {
        currentGroup.agents.push(value);
      } else {
        currentGroup = { agents: [value], rules: [], crawlDelay: null, otherFields: [] };
        groups.push(currentGroup);
      }
      lastFieldWasUserAgent = true;
      continue;
    }

    lastFieldWasUserAgent = false;

    if (field === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === 'allow' || field === 'disallow') {
      if (!currentGroup) {
        errors.push({
          line: lineNumber,
          text: rawLine,
          message: `${field} appeared before any User-agent directive — ignored.`,
        });
        continue;
      }
      currentGroup.rules.push({ type: field, value, line: lineNumber });
      continue;
    }

    if (field === 'crawl-delay') {
      if (!currentGroup) {
        errors.push({ line: lineNumber, text: rawLine, message: 'Crawl-delay before any User-agent.' });
        continue;
      }
      const num = Number(value);
      currentGroup.crawlDelay = Number.isFinite(num) ? num : value;
      continue;
    }

    if (KNOWN_FIELDS.has(field)) {
      if (currentGroup) currentGroup.otherFields.push({ field, value, line: lineNumber });
      else otherDirectives.push({ field, value, line: lineNumber });
      continue;
    }

    errors.push({ line: lineNumber, text: rawLine, message: `Unknown directive "${field}".` });
  }

  return { groups, sitemaps: [...new Set(sitemaps)], otherDirectives, errors };
}

function summarize(parsed) {
  const allDisallowed = new Set();
  const allAllowed = new Set();
  const userAgents = new Set();
  let entirelyBlockedForAll = false;

  for (const g of parsed.groups) {
    g.agents.forEach((a) => userAgents.add(a));
    const isStarGroup = g.agents.includes('*');

    for (const rule of g.rules) {
      if (rule.type === 'disallow') {
        if (rule.value === '/' && isStarGroup) entirelyBlockedForAll = true;
        if (rule.value) allDisallowed.add(rule.value);
      } else if (rule.type === 'allow' && rule.value) {
        allAllowed.add(rule.value);
      }
    }
  }

  return {
    userAgents: [...userAgents],
    disallowedPaths: [...allDisallowed].sort(),
    allowedPaths: [...allAllowed].sort(),
    entirelyBlockedForAll,
    sitemaps: parsed.sitemaps,
  };
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  let robotsUrl;
  try {
    robotsUrl = buildRobotsUrl(body?.url);
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(robotsUrl, ctrl.signal);
    const contentType = res.headers.get('content-type') || null;

    if (res.status === 404 || res.status === 410) {
      try {
        await res.body?.cancel();
      } catch {}
      const result = {
        robotsUrl,
        finalUrl,
        httpStatus: res.status,
        contentType,
        found: false,
        bytes: 0,
        raw: '',
        groups: [],
        sitemaps: [],
        summary: {
          userAgents: [],
          disallowedPaths: [],
          allowedPaths: [],
          entirelyBlockedForAll: false,
          sitemaps: [],
        },
        otherDirectives: [],
        parseErrors: [],
        redirectChain: chain,
        message: 'No robots.txt found — crawlers may access the entire site by default.',
      };
      void logToolHistory({ url: result.robotsUrl, toolName: 'Robots.txt Checker', result });
      return Response.json(result);
    }

    if (res.status >= 400) {
      try {
        await res.body?.cancel();
      } catch {}
      return Response.json(
        {
          error: `The server returned HTTP ${res.status} when fetching robots.txt.`,
          robotsUrl,
          finalUrl,
          httpStatus: res.status,
          redirectChain: chain,
        },
        { status: 502 }
      );
    }

    const text = await readBoundedText(res);
    const parsed = parseRobotsTxt(text);
    const summary = summarize(parsed);

    const result = {
      robotsUrl,
      finalUrl,
      httpStatus: res.status,
      contentType,
      found: true,
      bytes: text.length,
      raw: text,
      groups: parsed.groups,
      sitemaps: parsed.sitemaps,
      summary,
      otherDirectives: parsed.otherDirectives,
      parseErrors: parsed.errors,
      redirectChain: chain,
    };

    void logToolHistory({ url: result.robotsUrl, toolName: 'Robots.txt Checker', result });
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
    console.error('[robots-txt] unexpected error:', err);
    return Response.json(
      { error: 'Failed to fetch robots.txt. Please check the URL and try again.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
