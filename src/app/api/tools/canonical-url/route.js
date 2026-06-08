import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const USER_AGENT = 'Tool4Utility-CanonicalChecker/1.0 (+https://tool4utility.com)';

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
    chain.push({ url: currentUrl, status: res.status, location: res.headers.get('location') });
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

// Parse RFC 5988 Link header — handles comma-separated values, quoted commas in URLs
function parseLinkHeader(header) {
  if (!header) return [];
  const links = [];
  // Split on commas that are NOT inside angle brackets or quotes
  let depth = 0;
  let inQuotes = false;
  let buf = '';
  const parts = [];
  for (const ch of header) {
    if (ch === '"' && !inQuotes) inQuotes = true;
    else if (ch === '"' && inQuotes) inQuotes = false;
    else if (ch === '<' && !inQuotes) depth++;
    else if (ch === '>' && !inQuotes) depth--;
    if (ch === ',' && depth === 0 && !inQuotes) {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf.trim());

  for (const part of parts) {
    const m = part.match(/^<([^>]+)>\s*;\s*(.+)$/);
    if (!m) continue;
    const url = m[1];
    const params = {};
    const paramStr = m[2];
    const paramRegex = /(\w+)\s*=\s*(?:"([^"]*)"|([^;,\s]+))/g;
    let pm;
    while ((pm = paramRegex.exec(paramStr)) !== null) {
      params[pm[1].toLowerCase()] = pm[2] !== undefined ? pm[2] : pm[3];
    }
    links.push({ url, params });
  }
  return links;
}

function getCanonicalsFromLinkHeader(linkHeader) {
  return parseLinkHeader(linkHeader)
    .filter((l) => (l.params.rel || '').toLowerCase().split(/\s+/).includes('canonical'))
    .map((l) => l.url);
}

function normalizeForComparison(urlStr) {
  try {
    const u = new URL(urlStr);
    // Lowercase host, drop default port, strip fragment, keep query as-is
    u.hostname = u.hostname.toLowerCase();
    if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
      u.port = '';
    }
    u.hash = '';
    return u.toString();
  } catch { return urlStr; }
}

function compareUrls(a, b) {
  if (!a || !b) return { equal: false, reasons: ['one is null'] };
  const na = normalizeForComparison(a);
  const nb = normalizeForComparison(b);
  if (na === nb) return { equal: true, reasons: [] };
  let pa, pb;
  try { pa = new URL(na); } catch { return { equal: false, reasons: ['cannot parse a'] }; }
  try { pb = new URL(nb); } catch { return { equal: false, reasons: ['cannot parse b'] }; }
  const reasons = [];
  if (pa.protocol !== pb.protocol) reasons.push(`protocol differs (${pa.protocol} vs ${pb.protocol})`);
  if (pa.hostname !== pb.hostname) {
    if (pa.hostname.replace(/^www\./, '') === pb.hostname.replace(/^www\./, '')) {
      reasons.push(`www differs (${pa.hostname} vs ${pb.hostname})`);
    } else {
      reasons.push(`hostname differs (${pa.hostname} vs ${pb.hostname})`);
    }
  }
  if (pa.pathname !== pb.pathname) {
    if (pa.pathname.replace(/\/$/, '') === pb.pathname.replace(/\/$/, '')) {
      reasons.push(`trailing slash differs ("${pa.pathname}" vs "${pb.pathname}")`);
    } else {
      reasons.push(`path differs ("${pa.pathname}" vs "${pb.pathname}")`);
    }
  }
  if (pa.search !== pb.search) reasons.push(`query differs ("${pa.search}" vs "${pb.search}")`);
  return { equal: false, reasons };
}

// Lightweight canonical extraction from a target URL — single hop, no recursion
async function probeCanonicalTarget(targetUrl, signal) {
  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(targetUrl, signal);
    const linkHeader = res.headers.get('link');
    const xRobots = res.headers.get('x-robots-tag');
    const contentType = res.headers.get('content-type') || '';
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);

    let htmlCanonicals = [];
    let metaRobots = null;
    let title = null;
    if (isHtml && res.status < 400) {
      try {
        const html = await readBoundedText(res);
        const $ = cheerio.load(html);
        $('link[rel="canonical"], link[rel="Canonical"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href) {
            try { htmlCanonicals.push(new URL(href, finalUrl).toString()); }
            catch { htmlCanonicals.push(href); }
          }
        });
        metaRobots = $('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content') || null;
        title = $('head title').first().text().trim() || null;
      } catch {}
    } else {
      try { await res.body?.cancel(); } catch {}
    }

    const linkHeaderCanonicals = getCanonicalsFromLinkHeader(linkHeader).map((u) => {
      try { return new URL(u, finalUrl).toString(); } catch { return u; }
    });

    return {
      requested: targetUrl,
      finalUrl,
      redirectChain: chain,
      httpStatus: res.status,
      contentType,
      isHtml,
      title,
      htmlCanonicals,
      linkHeaderCanonicals,
      metaRobots,
      xRobotsTag: xRobots,
    };
  } catch (err) {
    if (err?.name === 'AbortError') return { requested: targetUrl, error: 'Request timed out.' };
    if (err instanceof ValidationError) return { requested: targetUrl, error: err.message };
    if (err?.cause?.code === 'ENOTFOUND') return { requested: targetUrl, error: 'DNS lookup failed.' };
    if (err?.cause?.code === 'ECONNREFUSED') return { requested: targetUrl, error: 'Connection refused.' };
    return { requested: targetUrl, error: err?.message || 'Failed to fetch.' };
  }
}

function buildChecks({ page, target, requestedUrl }) {
  const checks = [];

  const allCanonicals = [...page.htmlCanonicals, ...page.linkHeaderCanonicals];
  const distinctCanonicals = [...new Set(allCanonicals.map(normalizeForComparison))];
  const primaryCanonical = page.htmlCanonicals[0] || page.linkHeaderCanonicals[0] || null;

  // 1. Canonical declared at all?
  if (allCanonicals.length === 0) {
    checks.push({ severity: 'warn', tag: 'canonical', message: 'No canonical declared. Google will pick one for you.' });
    return { checks, primaryCanonical, verdict: 'no-canonical' };
  } else {
    checks.push({ severity: 'pass', tag: 'canonical', message: `Canonical declared in ${page.htmlCanonicals.length ? 'HTML' : ''}${page.htmlCanonicals.length && page.linkHeaderCanonicals.length ? ' and ' : ''}${page.linkHeaderCanonicals.length ? 'HTTP Link header' : ''}.` });
  }

  // 2. Multiple <link rel="canonical">?
  if (page.htmlCanonicals.length > 1) {
    const distinctHtml = [...new Set(page.htmlCanonicals.map(normalizeForComparison))];
    if (distinctHtml.length > 1) {
      checks.push({ severity: 'fail', tag: 'canonical', message: `Multiple conflicting canonical tags in HTML (${distinctHtml.length}). Google ignores the page-level canonical when they conflict.` });
    } else {
      checks.push({ severity: 'warn', tag: 'canonical', message: `${page.htmlCanonicals.length} duplicate canonical tags in HTML — they all resolve to the same URL but only one is needed.` });
    }
  }

  // 3. HTML canonical vs HTTP Link canonical conflict
  if (page.htmlCanonicals.length > 0 && page.linkHeaderCanonicals.length > 0) {
    const htmlNorm = normalizeForComparison(page.htmlCanonicals[0]);
    const linkNorm = normalizeForComparison(page.linkHeaderCanonicals[0]);
    if (htmlNorm !== linkNorm) {
      checks.push({ severity: 'fail', tag: 'canonical', message: `HTML canonical (${page.htmlCanonicals[0]}) and HTTP Link canonical (${page.linkHeaderCanonicals[0]}) disagree.` });
    } else {
      checks.push({ severity: 'pass', tag: 'canonical', message: 'HTML canonical and HTTP Link canonical match.' });
    }
  }

  // 4. Self-referencing? Compare canonical to requested URL AND final URL (post-redirect)
  const cmpRequested = compareUrls(requestedUrl, primaryCanonical);
  const cmpFinal = compareUrls(page.finalUrl, primaryCanonical);

  let verdict;
  if (cmpRequested.equal) {
    checks.push({ severity: 'pass', tag: 'self-reference', message: 'Canonical matches the requested URL exactly (self-referencing).' });
    verdict = 'self-referencing';
  } else if (cmpFinal.equal) {
    checks.push({ severity: 'pass', tag: 'self-reference', message: 'Canonical matches the final URL after redirects (self-referencing post-redirect).' });
    verdict = 'self-referencing';
  } else {
    verdict = 'cross-page';
    let absoluteCanonical;
    try { absoluteCanonical = new URL(primaryCanonical).toString(); }
    catch { absoluteCanonical = null; }

    if (!absoluteCanonical) {
      checks.push({ severity: 'fail', tag: 'canonical-url', message: `Canonical URL is malformed: "${primaryCanonical}".` });
    } else {
      const reasonText = cmpRequested.reasons.join('; ');
      checks.push({ severity: 'info', tag: 'canonical', message: `Canonical points elsewhere (${reasonText || 'different URL'}). Page is canonicalising to a different URL.` });
    }
  }

  // 5. Trailing slash mismatch (subset of cross-page where only the slash differs)
  if (verdict === 'cross-page' && cmpRequested.reasons.length === 1 && cmpRequested.reasons[0].includes('trailing slash')) {
    checks.push({ severity: 'warn', tag: 'trailing-slash', message: 'Only difference is a trailing slash — confirm both versions resolve the same on your server.' });
  }

  // 6. Was the canonical originally a relative URL?
  const firstHtml = page.htmlCanonicalsRaw?.[0];
  if (firstHtml && !/^https?:\/\//i.test(firstHtml)) {
    checks.push({ severity: 'warn', tag: 'canonical-format', message: `HTML canonical is relative ("${firstHtml}"). Spec requires absolute URLs — works in practice but fragile across mirrors.` });
  }

  // 7. Canonical to off-host
  if (primaryCanonical) {
    try {
      const reqHost = new URL(requestedUrl).hostname.toLowerCase();
      const canHost = new URL(primaryCanonical).hostname.toLowerCase();
      if (canHost && reqHost && canHost.replace(/^www\./, '') !== reqHost.replace(/^www\./, '')) {
        checks.push({ severity: 'warn', tag: 'cross-domain', message: `Canonical points to a different domain (${canHost}). Used for syndication, but make sure you intended this.` });
      }
    } catch {}
  }

  // 8. Canonical + noindex on the same page → conflicting signals
  const robotsRaw = `${page.metaRobots || ''} ${page.xRobotsTag || ''}`.toLowerCase();
  if (/\bnoindex\b|\bnone\b/.test(robotsRaw)) {
    checks.push({ severity: 'fail', tag: 'noindex-conflict', message: `Page is "noindex" while also declaring a canonical — conflicting signals. Google may drop both.` });
  }

  // 9. Was the page itself reached via redirects? Canonical should typically be the final URL.
  if (page.redirectChain.length > 1) {
    if (cmpRequested.equal) {
      checks.push({ severity: 'warn', tag: 'redirect-canonical', message: 'Page redirects yet canonical points to the requested (pre-redirect) URL — consider canonicalising to the final URL instead.' });
    }
  }

  // 10. Target probe results
  if (target && verdict === 'cross-page') {
    if (target.error) {
      checks.push({ severity: 'fail', tag: 'canonical-target', message: `Canonical target unreachable: ${target.error}` });
    } else if (target.httpStatus >= 400) {
      checks.push({ severity: 'fail', tag: 'canonical-target', message: `Canonical target returns HTTP ${target.httpStatus} — broken canonicalisation.` });
    } else {
      // Did following the canonical involve a redirect? That's bad — canonical chains.
      if (target.redirectChain.length > 1) {
        checks.push({ severity: 'warn', tag: 'canonical-redirect', message: `Canonical target redirects (${target.redirectChain.length} hops). Google prefers a direct canonical; consider updating it to the final URL: ${target.finalUrl}.` });
      } else {
        checks.push({ severity: 'pass', tag: 'canonical-target', message: `Canonical target reachable (HTTP ${target.httpStatus}).` });
      }

      // Does the target self-reference?
      const targetCanonical = target.htmlCanonicals[0] || target.linkHeaderCanonicals[0] || null;
      if (targetCanonical) {
        const targetSelfCmp = compareUrls(target.finalUrl, targetCanonical);
        if (targetSelfCmp.equal) {
          checks.push({ severity: 'pass', tag: 'canonical-chain', message: 'Canonical target is self-referencing — chain stops cleanly.' });
        } else {
          // Does the target's canonical point back to the original page? That's a loop.
          const loopCmp = compareUrls(target.finalUrl ? requestedUrl : '', targetCanonical);
          if (loopCmp.equal) {
            checks.push({ severity: 'fail', tag: 'canonical-loop', message: `Canonical loop: the target page's canonical points back here.` });
          } else {
            checks.push({ severity: 'warn', tag: 'canonical-chain', message: `Canonical target itself canonicalises elsewhere (to ${targetCanonical}). Google may pick that final URL instead.` });
          }
        }
      } else {
        checks.push({ severity: 'warn', tag: 'canonical-chain', message: 'Canonical target has no canonical of its own. Add a self-referencing canonical to be explicit.' });
      }

      // Target noindex check
      const targetRobots = `${target.metaRobots || ''} ${target.xRobotsTag || ''}`.toLowerCase();
      if (/\bnoindex\b|\bnone\b/.test(targetRobots)) {
        checks.push({ severity: 'fail', tag: 'canonical-target-noindex', message: 'Canonical target declares "noindex" — you’re canonicalising to a page Google won’t index.' });
      }
    }
  }

  return { checks, primaryCanonical, verdict };
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
    const linkHeader = res.headers.get('link');
    const xRobotsTag = res.headers.get('x-robots-tag');
    const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);

    if (res.status >= 400) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({
        url, finalUrl, httpStatus: res.status, contentType,
        error: `Server returned HTTP ${res.status}.`,
        redirectChain: chain,
      }, { status: 502 });
    }

    const linkHeaderCanonicals = getCanonicalsFromLinkHeader(linkHeader).map((u) => {
      try { return new URL(u, finalUrl).toString(); } catch { return u; }
    });

    let htmlCanonicalsRaw = [];
    let htmlCanonicals = [];
    let metaRobots = null;
    let title = null;

    if (isHtml) {
      const html = await readBoundedText(res);
      const $ = cheerio.load(html);
      $('link[rel="canonical"], link[rel="Canonical"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href !== undefined && href !== null) {
          htmlCanonicalsRaw.push(href);
          try { htmlCanonicals.push(new URL(href, finalUrl).toString()); }
          catch { htmlCanonicals.push(href); }
        }
      });
      metaRobots = $('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content') || null;
      title = $('head title').first().text().trim() || null;
    } else {
      try { await res.body?.cancel(); } catch {}
      // Non-HTML resources can still have HTTP Link canonical (e.g. PDFs)
      if (linkHeaderCanonicals.length === 0) {
        return Response.json({
          url, finalUrl, httpStatus: res.status, contentType,
          error: `Content-Type is "${contentType || 'unknown'}" — no HTML canonical to inspect, and no HTTP Link canonical was found.`,
          redirectChain: chain,
        }, { status: 400 });
      }
    }

    const page = {
      requested: url,
      finalUrl,
      redirectChain: chain,
      httpStatus: res.status,
      contentType,
      isHtml,
      title,
      htmlCanonicalsRaw,
      htmlCanonicals,
      linkHeaderCanonicals,
      metaRobots,
      xRobotsTag,
    };

    const primaryCanonical = htmlCanonicals[0] || linkHeaderCanonicals[0] || null;

    let target = null;
    if (primaryCanonical) {
      // Probe target only if it differs from the page itself (avoid redundant fetch)
      const cmpFinal = compareUrls(finalUrl, primaryCanonical);
      if (!cmpFinal.equal) {
        target = await probeCanonicalTarget(primaryCanonical, ctrl.signal);
      }
    }

    const { checks, verdict } = buildChecks({ page, target, requestedUrl: url });

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
      redirectChain: chain,
      title,
      metaRobots,
      xRobotsTag,
      htmlCanonicals,
      htmlCanonicalsRaw,
      linkHeaderCanonicals,
      primaryCanonical,
      verdict,
      target,
      checks,
      summary,
    };
    void logToolHistory({ url: result.url, toolName: 'Canonical URL Checker', result });
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
    console.error('[canonical-url] unexpected error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
