import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';
import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, isPrivateHost, readBoundedBytes } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 15_000;
const RESOURCE_TIMEOUT_MS = 8_000;
const MAX_RESOURCE_PROBES = 12;
const USER_AGENT = 'Tool4Utility-PageSpeed/1.0 (+https://tool4utility.com)';

function instrumentedRequest(target, { method = 'GET', maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const visit = (urlStr, redirectsLeft) => {
      let parsed;
      try { parsed = new URL(urlStr); } catch { return reject(new ValidationError('Invalid URL.')); }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return reject(new ValidationError('Only http(s) URLs are supported.'));
      if (isPrivateHost(parsed.hostname)) return reject(new ValidationError('Private host blocked.'));
      const lib = parsed.protocol === 'https:' ? https : http;
      const isHttps = parsed.protocol === 'https:';
      const t = { start: performance.now() };
      const req = lib.request(parsed, {
        method,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*', 'Accept-Encoding': 'gzip, deflate, br' },
        timeout: REQUEST_TIMEOUT_MS,
      });
      req.on('socket', (socket) => {
        socket.on('lookup', () => { t.dnsDone = performance.now(); });
        socket.on('connect', () => { t.tcpDone = performance.now(); });
        if (isHttps) socket.on('secureConnect', () => { t.tlsDone = performance.now(); });
      });
      req.on('response', (res) => {
        t.responseStart = performance.now();
        const chunks = [];
        let received = 0;
        res.on('data', (chunk) => {
          chunks.push(chunk);
          received += chunk.length;
        });
        res.on('end', () => {
          t.responseEnd = performance.now();
          // Handle redirects after capturing timings
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
            let next;
            try { next = new URL(res.headers.location, urlStr).toString(); }
            catch { return reject(new ValidationError('Invalid redirect URL.')); }
            return visit(next, redirectsLeft - 1);
          }
          resolve({
            url: urlStr,
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
            timings: t,
          });
        });
        res.on('error', reject);
      });
      req.on('timeout', () => { req.destroy(new Error('AbortError')); });
      req.on('error', reject);
      req.end();
    };
    visit(target, maxRedirects);
  });
}

function timingsBreakdown(t) {
  return {
    dnsMs: t.dnsDone ? +(t.dnsDone - t.start).toFixed(2) : null,
    tcpMs: t.tcpDone && t.dnsDone ? +(t.tcpDone - t.dnsDone).toFixed(2) : null,
    tlsMs: t.tlsDone && t.tcpDone ? +(t.tlsDone - t.tcpDone).toFixed(2) : null,
    ttfbMs: t.responseStart && (t.tlsDone || t.tcpDone) ? +(t.responseStart - (t.tlsDone || t.tcpDone)).toFixed(2) : null,
    downloadMs: t.responseEnd && t.responseStart ? +(t.responseEnd - t.responseStart).toFixed(2) : null,
    totalMs: t.responseEnd ? +(t.responseEnd - t.start).toFixed(2) : null,
    fromConnectMs: t.responseStart && t.start ? +(t.responseStart - t.start).toFixed(2) : null,
  };
}

function gradeTimings(b) {
  const g = {};
  // Common targets:
  // - DNS < 100ms is good
  // - TCP < 100ms is good
  // - TLS < 200ms is good
  // - TTFB < 200ms great, < 600 ok, > 800 slow
  // - Total < 1s great, < 2.5s ok, > 4s slow
  g.ttfb = b.ttfbMs == null ? null : (b.ttfbMs < 200 ? 'pass' : b.ttfbMs < 600 ? 'warn' : 'fail');
  g.total = b.totalMs == null ? null : (b.totalMs < 1000 ? 'pass' : b.totalMs < 2500 ? 'warn' : 'fail');
  g.dns = b.dnsMs == null ? null : (b.dnsMs < 100 ? 'pass' : b.dnsMs < 300 ? 'warn' : 'fail');
  g.tls = b.tlsMs == null ? null : (b.tlsMs < 200 ? 'pass' : b.tlsMs < 500 ? 'warn' : 'fail');
  return g;
}

async function probeResource(url) {
  let parsed;
  try { parsed = new URL(url); }
  catch { return { url, error: 'invalid' }; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { url, skipped: 'non-http' };
  if (isPrivateHost(parsed.hostname)) return { url, error: 'blocked' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RESOURCE_TIMEOUT_MS);
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'HEAD', redirect: 'follow', signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': 'gzip, deflate, br' },
    });
    let size = parseInt(res.headers.get('content-length') || '0', 10) || null;
    if (size === null) {
      const r2 = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': USER_AGENT } });
      const bytes = await readBoundedBytes(r2, 2 * 1024 * 1024);
      size = bytes.byteLength;
    } else {
      try { await res.body?.cancel(); } catch {}
    }
    return { url, status: res.status, size, ms: +(performance.now() - start).toFixed(1), contentType: res.headers.get('content-type') || null };
  } catch (err) {
    return { url, error: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'fetch failed') };
  } finally { clearTimeout(timer); }
}

async function probeTopResources($, baseUrl) {
  const items = new Set();
  $('script[src]').each((_, el) => { const s = $(el).attr('src'); if (s) items.add(s); });
  $('link[rel="stylesheet"][href]').each((_, el) => { const s = $(el).attr('href'); if (s) items.add(s); });
  $('img[src]').each((_, el) => { const s = $(el).attr('src'); if (s) items.add(s); });
  const list = [...items].slice(0, MAX_RESOURCE_PROBES);
  const absolutes = list.map((u) => { try { return new URL(u, baseUrl).toString(); } catch { return null; } }).filter(Boolean);
  return Promise.all(absolutes.map(probeResource));
}

function computeScore(b, htmlSize, resourceProbes) {
  // Heuristic 0–100 score weighted by TTFB, total, and total transfer size
  let score = 100;
  if (b.ttfbMs != null) {
    if (b.ttfbMs > 200) score -= Math.min(30, (b.ttfbMs - 200) / 30);
  }
  if (b.totalMs != null) {
    if (b.totalMs > 1000) score -= Math.min(30, (b.totalMs - 1000) / 100);
  }
  const totalBytes = htmlSize + (resourceProbes || []).reduce((s, r) => s + (r.size || 0), 0);
  if (totalBytes > 1_500_000) score -= Math.min(20, (totalBytes - 1_500_000) / 100_000);
  if (b.tlsMs != null && b.tlsMs > 500) score -= Math.min(10, (b.tlsMs - 500) / 50);
  return Math.max(0, Math.round(score));
}

function buildIssues(b, grades, htmlSize, totalBytes) {
  const c = [];
  if (b.ttfbMs == null) c.push({ severity: 'info', message: 'Could not measure TTFB.' });
  else if (grades.ttfb === 'pass') c.push({ severity: 'pass', message: `Time to First Byte was ${b.ttfbMs} ms — fast.` });
  else if (grades.ttfb === 'warn') c.push({ severity: 'warn', message: `Time to First Byte was ${b.ttfbMs} ms — aim for under 200 ms (server, app, or CDN can be optimised).` });
  else c.push({ severity: 'fail', message: `Time to First Byte was ${b.ttfbMs} ms — slow. Investigate origin response time, database queries, or cold starts.` });

  if (b.totalMs != null) {
    if (grades.total === 'pass') c.push({ severity: 'pass', message: `Total HTML download took ${b.totalMs} ms.` });
    else if (grades.total === 'warn') c.push({ severity: 'warn', message: `Total HTML download took ${b.totalMs} ms — over the 1 s target.` });
    else c.push({ severity: 'fail', message: `Total HTML download took ${b.totalMs} ms — well over the 2.5 s threshold.` });
  }

  if (b.dnsMs != null && b.dnsMs > 300) c.push({ severity: 'warn', message: `DNS resolution took ${b.dnsMs} ms — consider a CDN with anycast DNS.` });
  if (b.tlsMs != null && b.tlsMs > 500) c.push({ severity: 'warn', message: `TLS handshake took ${b.tlsMs} ms — TLS 1.3 + session resumption / OCSP stapling can shave 100–300 ms.` });

  if (htmlSize > 250 * 1024) c.push({ severity: 'warn', message: `HTML payload was ${(htmlSize / 1024).toFixed(0)} KB — heavy HTML delays first paint.` });
  if (totalBytes > 3 * 1024 * 1024) c.push({ severity: 'warn', message: `Sampled total transfer was ${(totalBytes / 1024 / 1024).toFixed(2)} MB — over typical performance budgets.` });
  return c;
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

  try {
    const inst = await instrumentedRequest(url);
    const breakdown = timingsBreakdown(inst.timings);
    const grades = gradeTimings(breakdown);

    if (inst.status >= 400) {
      return Response.json({ url, finalUrl: inst.url, httpStatus: inst.status, error: `Server returned HTTP ${inst.status}.`, timings: breakdown }, { status: 502 });
    }

    let htmlSize = inst.body.length;
    const contentEncoding = inst.headers['content-encoding'] || null;
    let html = '';
    try {
      // The body we got is whatever the server sent; if compressed we need to inflate. Node's http
      // doesn’t auto-decompress, so do it ourselves to parse HTML below.
      if (contentEncoding === 'gzip') {
        const zlib = await import('node:zlib');
        const buf = zlib.gunzipSync(inst.body);
        html = buf.toString('utf8');
        htmlSize = buf.length;
      } else if (contentEncoding === 'br') {
        const zlib = await import('node:zlib');
        const buf = zlib.brotliDecompressSync(inst.body);
        html = buf.toString('utf8');
        htmlSize = buf.length;
      } else if (contentEncoding === 'deflate') {
        const zlib = await import('node:zlib');
        const buf = zlib.inflateSync(inst.body);
        html = buf.toString('utf8');
        htmlSize = buf.length;
      } else {
        html = inst.body.toString('utf8');
      }
    } catch {
      html = inst.body.toString('utf8');
    }

    let resourceProbes = [];
    let parsedOk = false;
    if ((inst.headers['content-type'] || '').match(/text\/html|application\/xhtml/i)) {
      const $ = cheerio.load(html);
      resourceProbes = await probeTopResources($, inst.url);
      parsedOk = true;
    }

    const totalBytes = htmlSize + resourceProbes.reduce((s, r) => s + (r.size || 0), 0);
    const score = computeScore(breakdown, htmlSize, resourceProbes);
    const issues = buildIssues(breakdown, grades, htmlSize, totalBytes);
    issues.unshift({ severity: score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail', message: `Heuristic performance score: ${score}/100. (Note: this is a server-side simulation, not a Lighthouse score.)` });

    const result = {
      url, finalUrl: inst.url, httpStatus: inst.status,
      contentType: inst.headers['content-type'] || null,
      contentEncoding,
      score,
      timings: breakdown,
      grades,
      htmlSize,
      bytesOnWire: inst.body.length,
      resourceProbes,
      totalBytes,
      issues,
      summary: {
        pass: issues.filter((i) => i.severity === 'pass').length,
        warn: issues.filter((i) => i.severity === 'warn').length,
        fail: issues.filter((i) => i.severity === 'fail').length,
      },
      note: 'This tool measures real server-to-server timings (DNS, TCP, TLS, TTFB, download). It does not simulate browser rendering, CSS/JS parse cost, or Core Web Vitals — those require a real browser. Pair this with Google PageSpeed Insights for the full picture.',
    };

    void logToolHistory({ url, toolName: 'Page Speed Checker', result });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    if (err?.message === 'AbortError') return Response.json({ error: 'Request timed out.' }, { status: 504 });
    if (err?.code === 'ENOTFOUND') return Response.json({ error: 'DNS lookup failed.' }, { status: 502 });
    if (err?.code === 'ECONNREFUSED') return Response.json({ error: 'Connection refused.' }, { status: 502 });
    console.error('[page-speed] error:', err);
    return Response.json({ error: err?.message || 'Failed to fetch the URL.' }, { status: 502 });
  }
}
