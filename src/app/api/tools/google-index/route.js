import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const TOOL_USER_AGENT = 'OpenSourceTools-IndexChecker/1.0 (+https://www.opensourcetools.online)';
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

async function fetchWithRedirects(initialUrl, signal, userAgent) {
  const chain = [];
  let currentUrl = initialUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      },
    });
    chain.push({ url: currentUrl, status: res.status });

    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get('location');
    if (isRedirect && location) {
      if (i === MAX_REDIRECTS) throw new ValidationError(`Too many redirects.`);
      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new ValidationError('Invalid redirect URL.');
      }
      const host = new URL(nextUrl).hostname;
      if (isPrivateHost(host)) throw new ValidationError('Redirect target blocked.');
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

function parseRobotsDirectives(value) {
  if (!value) return [];
  return String(value)
    .toLowerCase()
    .split(',')
    .map((s) => s.trim().split(':').pop().trim())
    .filter(Boolean);
}

async function checkPage(url, signal) {
  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(url, signal, TOOL_USER_AGENT);
    const xRobotsTag = res.headers.get('x-robots-tag');
    const contentType = res.headers.get('content-type') || '';
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);
    const out = {
      reached: true,
      httpStatus: res.status,
      finalUrl,
      contentType,
      isHtml,
      redirectChain: chain,
      title: null,
      robotsContent: null,
      googlebotContent: null,
      xRobotsTag: xRobotsTag || null,
      canonical: null,
      directives: [...parseRobotsDirectives(xRobotsTag)],
    };
    if (!isHtml || res.status >= 400) {
      try { await res.body?.cancel(); } catch {}
      return out;
    }
    const html = await readBoundedText(res);
    const $ = cheerio.load(html);
    out.title = $('title').first().text().trim() || null;
    $('meta[name]').each((_, el) => {
      const name = String($(el).attr('name') || '').toLowerCase().trim();
      const content = $(el).attr('content');
      if (name === 'robots' && !out.robotsContent) out.robotsContent = content || null;
      if (name === 'googlebot' && !out.googlebotContent) out.googlebotContent = content || null;
    });
    const canonicalHref = $('link[rel="canonical"]').first().attr('href');
    if (canonicalHref) {
      try {
        out.canonical = new URL(canonicalHref, finalUrl).toString();
      } catch {
        out.canonical = canonicalHref;
      }
    }
    out.directives = [
      ...parseRobotsDirectives(out.xRobotsTag),
      ...parseRobotsDirectives(out.robotsContent),
      ...parseRobotsDirectives(out.googlebotContent),
    ];
    return out;
  } catch (err) {
    return {
      reached: false,
      error: err?.name === 'AbortError'
        ? 'Page fetch timed out.'
        : err?.cause?.code === 'ENOTFOUND' || err?.code === 'ENOTFOUND'
          ? 'DNS lookup failed.'
          : err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED'
            ? 'Connection refused.'
            : err?.cause?.code === 'CERT_HAS_EXPIRED'
              ? 'SSL certificate expired.'
              : 'Could not reach the page.',
    };
  }
}

function globToRegex(pattern) {
  let re = '';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '$') re += '$';
    else re += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re);
}

function pickGroup(robotsText, agent = 'googlebot') {
  if (!robotsText) return null;
  const lines = robotsText.split(/\r?\n/);
  const groups = [];
  let cur = null;
  let lastWasUA = false;
  for (let raw of lines) {
    const line = raw.replace(/(^|\s)#.*$/, '').trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === 'user-agent') {
      if (!cur || !lastWasUA) {
        cur = { agents: [value.toLowerCase()], rules: [] };
        groups.push(cur);
      } else {
        cur.agents.push(value.toLowerCase());
      }
      lastWasUA = true;
      continue;
    }
    lastWasUA = false;
    if (!cur) continue;
    if (field === 'allow' || field === 'disallow') {
      cur.rules.push({ type: field, pattern: value });
    }
  }
  const a = agent.toLowerCase();
  return (
    groups.find((g) => g.agents.includes(a)) ||
    groups.find((g) => g.agents.includes('*')) ||
    null
  );
}

function isPathAllowed(robotsText, url) {
  const group = pickGroup(robotsText, 'googlebot');
  if (!group) return { allowed: true, matched: null };
  const path = (() => {
    try {
      const u = new URL(url);
      return u.pathname + u.search;
    } catch {
      return '/';
    }
  })();

  let best = null;
  for (const rule of group.rules) {
    if (rule.pattern === '' && rule.type === 'disallow') continue;
    let matchLen;
    let matched = false;
    if (rule.pattern === '') {
      matched = true;
      matchLen = 0;
    } else {
      try {
        const re = globToRegex(rule.pattern);
        const m = re.exec(path);
        if (m) {
          matched = true;
          matchLen = rule.pattern.length;
        }
      } catch {
        continue;
      }
    }
    if (matched) {
      if (!best || matchLen > best.length) {
        best = { type: rule.type, pattern: rule.pattern, length: matchLen };
      }
    }
  }
  if (!best) return { allowed: true, matched: null };
  return { allowed: best.type === 'allow', matched: `${best.type}: ${best.pattern || '(empty)'}` };
}

async function checkRobotsTxt(targetUrl, signal) {
  try {
    const origin = new URL(targetUrl).origin;
    const res = await fetch(`${origin}/robots.txt`, {
      method: 'GET',
      redirect: 'follow',
      signal,
      headers: { 'User-Agent': TOOL_USER_AGENT, Accept: '*/*' },
    });
    if (!res.ok) {
      try { await res.body?.cancel(); } catch {}
      return { exists: false, status: res.status, allowed: true, matched: null };
    }
    const text = await res.text();
    const verdict = isPathAllowed(text, targetUrl);
    return { exists: true, status: res.status, ...verdict };
  } catch {
    return { exists: false, error: 'Could not fetch robots.txt.', allowed: true, matched: null };
  }
}

async function checkGoogleSiteQuery(targetUrl, signal) {
  const query = `site:${targetUrl}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us&num=10&pws=0`;
  try {
    const res = await fetch(searchUrl, {
      method: 'GET',
      redirect: 'follow',
      signal,
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    if (!res.ok) {
      try { await res.body?.cancel(); } catch {}
      return {
        attempted: true,
        status: res.status,
        verdict: 'inconclusive',
        reason: `Google returned HTTP ${res.status}.`,
        searchUrl,
      };
    }
    const html = await res.text();
    const lower = html.toLowerCase();
    if (
      lower.includes('our systems have detected unusual traffic') ||
      lower.includes('captcha') ||
      lower.includes('to continue, please type the characters below')
    ) {
      return {
        attempted: true,
        status: res.status,
        verdict: 'inconclusive',
        reason: 'Google blocked the request (CAPTCHA / unusual traffic).',
        searchUrl,
      };
    }
    if (
      lower.includes('did not match any documents') ||
      lower.includes('no results found for') ||
      /no information is available for this page/i.test(html)
    ) {
      return {
        attempted: true,
        status: res.status,
        verdict: 'not-indexed',
        reason: 'Google returned no results for site: query.',
        searchUrl,
      };
    }
    const $ = cheerio.load(html);
    let resultCount = null;
    const stats = $('#result-stats').text() || $('#resultStats').text() || '';
    const m = stats.replace(/[,\s]/g, '').match(/About([0-9]+)results/i) || stats.match(/([0-9,]+)\s*results/i);
    if (m) resultCount = Number(m[1].replace(/[,\s]/g, '')) || null;
    let organicLinks = 0;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (/^\/url\?q=https?:\/\//i.test(href) || /^https?:\/\//i.test(href)) {
        organicLinks++;
      }
    });
    if (resultCount !== null && resultCount > 0) {
      return {
        attempted: true,
        status: res.status,
        verdict: 'indexed',
        reason: `Google returned approximately ${resultCount.toLocaleString()} result${resultCount === 1 ? '' : 's'}.`,
        resultCount,
        searchUrl,
      };
    }
    if (resultCount === 0) {
      return {
        attempted: true,
        status: res.status,
        verdict: 'not-indexed',
        reason: 'Google returned 0 results for site: query.',
        resultCount: 0,
        searchUrl,
      };
    }
    if (organicLinks > 0) {
      return {
        attempted: true,
        status: res.status,
        verdict: 'indexed',
        reason: 'Google returned organic results (count parsing failed but links present).',
        searchUrl,
      };
    }
    return {
      attempted: true,
      status: res.status,
      verdict: 'inconclusive',
      reason: 'Could not parse Google’s response page.',
      searchUrl,
    };
  } catch (err) {
    return {
      attempted: true,
      verdict: 'inconclusive',
      reason: err?.name === 'AbortError' ? 'Google query timed out.' : 'Failed to query Google.',
      searchUrl,
    };
  }
}

function computeVerdict({ page, robots, google }) {
  const reasons = [];

  if (!page.reached) {
    reasons.push({ kind: 'error', text: page.error || 'Page is unreachable.' });
    return { state: 'not-indexed', confidence: 'high', reasons };
  }
  if (page.httpStatus >= 400) {
    reasons.push({ kind: 'error', text: `Page returned HTTP ${page.httpStatus} — Google won’t index error pages.` });
    return { state: 'not-indexed', confidence: 'high', reasons };
  }

  reasons.push({
    kind: 'good',
    text: `Page is reachable (HTTP ${page.httpStatus}).`,
  });

  const hasNoindex = page.directives.includes('noindex') || page.directives.includes('none');
  if (hasNoindex) {
    reasons.push({
      kind: 'error',
      text: 'Page declares "noindex" via meta tag or X-Robots-Tag header.',
    });
  } else {
    reasons.push({
      kind: 'good',
      text: 'No "noindex" directive in meta tag or X-Robots-Tag header.',
    });
  }

  if (robots.exists && !robots.allowed) {
    reasons.push({
      kind: 'error',
      text: `Blocked by robots.txt for Googlebot (${robots.matched}).`,
    });
  } else if (robots.exists) {
    reasons.push({
      kind: 'good',
      text: 'robots.txt allows Googlebot on this path.',
    });
  } else {
    reasons.push({
      kind: 'good',
      text: 'No robots.txt found — crawling is allowed by default.',
    });
  }

  let canonicalConflict = false;
  if (page.canonical && page.finalUrl) {
    try {
      const a = new URL(page.canonical).toString();
      const b = new URL(page.finalUrl).toString();
      if (a !== b) {
        canonicalConflict = true;
        reasons.push({
          kind: 'warn',
          text: `Canonical URL points elsewhere: ${page.canonical} — Google may index that URL instead of this one.`,
        });
      } else {
        reasons.push({
          kind: 'good',
          text: 'Canonical URL is self-referential.',
        });
      }
    } catch {}
  }

  const blocked = hasNoindex || (robots.exists && !robots.allowed);

  if (google.attempted && google.verdict === 'indexed') {
    reasons.push({ kind: 'good', text: google.reason });
    return {
      state: blocked ? 'conflicting' : 'indexed',
      confidence: blocked ? 'low' : 'medium',
      reasons,
    };
  }
  if (google.attempted && google.verdict === 'not-indexed') {
    reasons.push({ kind: 'error', text: google.reason });
    return { state: 'not-indexed', confidence: 'medium', reasons };
  }

  if (blocked) {
    return { state: 'not-indexed', confidence: 'medium', reasons };
  }

  if (google.attempted && google.verdict === 'inconclusive') {
    reasons.push({
      kind: 'warn',
      text: google.reason + ' Use Google Search Console for a definitive answer.',
    });
  }

  return {
    state: canonicalConflict ? 'inconclusive' : 'likely-indexed',
    confidence: 'low',
    reasons,
  };
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
    const [page, robots, google] = await Promise.all([
      checkPage(url, ctrl.signal),
      checkRobotsTxt(url, ctrl.signal),
      checkGoogleSiteQuery(url, ctrl.signal),
    ]);

    const verdict = computeVerdict({ page, robots, google });

    const result = { url, verdict, page, robots, google };
    void logToolHistory({ url: result.url, toolName: 'Google Index Checker', result });
    return Response.json(result);
  } catch (err) {
    if (err?.name === 'AbortError') {
      return Response.json(
        { error: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` },
        { status: 504 }
      );
    }
    console.error('[google-index] unexpected error:', err);
    return Response.json({ error: 'Failed to check the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
