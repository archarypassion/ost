import * as cheerio from 'cheerio';
import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, readBoundedText, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 14_000;
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 12; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function parseViewport(content) {
  if (!content) return null;
  const out = {};
  for (const part of content.split(',')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k.trim().toLowerCase()] = (rest.join('=') || '').trim();
  }
  return out;
}

function gatherSignals(html, finalUrl) {
  const $ = cheerio.load(html);
  const viewportContent = $('meta[name="viewport"]').attr('content') || null;
  const viewport = parseViewport(viewportContent);

  // Image probes
  const imgs = $('img');
  let imagesWithFixedWidth = 0, imagesTotal = 0, imagesResponsive = 0, imagesWithSrcset = 0;
  imgs.each((_, el) => {
    imagesTotal++;
    const w = $(el).attr('width');
    const style = $(el).attr('style') || '';
    if (w && /^\d+$/.test(w)) imagesWithFixedWidth++;
    if (/width\s*:\s*\d+px/i.test(style)) imagesWithFixedWidth++;
    if (/max-width\s*:\s*100%/i.test(style)) imagesResponsive++;
    if ($(el).attr('srcset')) imagesWithSrcset++;
  });

  // Inline-style fixed widths on common containers
  let fixedWidthContainers = 0;
  $('[style]').each((_, el) => {
    const s = $(el).attr('style') || '';
    if (/width\s*:\s*\d{3,4}px/i.test(s)) fixedWidthContainers++;
  });

  // Link/button density - tap targets are too close if many small adjacent links
  const linkCount = $('a').length;
  const buttonCount = $('button').length;

  // Font-size heuristic: collect inline font-size declarations
  const smallFontUses = [];
  $('[style]').each((_, el) => {
    const s = $(el).attr('style') || '';
    const m = s.match(/font-size\s*:\s*(\d+(?:\.\d+)?)\s*(px|pt)/i);
    if (m) {
      const val = parseFloat(m[1]);
      const unit = m[2].toLowerCase();
      const px = unit === 'pt' ? val * 1.333 : val;
      if (px < 12) smallFontUses.push(px);
    }
  });

  // Detect horizontal-scroll smell: any element with width > 600 in inline style on small viewports
  const horizontalScrollSmell = $('[style*="min-width"]').toArray().some((el) => {
    const s = $(el).attr('style') || '';
    const m = s.match(/min-width\s*:\s*(\d+)px/i);
    return m && parseInt(m[1], 10) > 700;
  });

  // Touch enhancements
  const hasTouchIcon = $('link[rel*="apple-touch-icon"]').length > 0;
  const hasManifest = $('link[rel="manifest"]').length > 0;
  const themeColor = $('meta[name="theme-color"]').attr('content') || null;
  const appleMobileCapable = $('meta[name="apple-mobile-web-app-capable"]').attr('content') || null;

  // Form input types
  let badInputTypes = 0, goodInputTypes = 0, totalInputs = 0;
  $('input').each((_, el) => {
    totalInputs++;
    const t = ($(el).attr('type') || 'text').toLowerCase();
    if (['email', 'tel', 'number', 'date', 'time', 'url', 'search'].includes(t)) goodInputTypes++;
    else if (t === 'text') badInputTypes++;
  });

  // Flash detection (yes, still seen sometimes)
  const flashCount = $('object[type*="flash"], embed[type*="flash"]').length;

  return {
    viewportContent, viewport,
    images: { total: imagesTotal, fixedWidth: imagesWithFixedWidth, responsive: imagesResponsive, withSrcset: imagesWithSrcset },
    fixedWidthContainers,
    linkCount, buttonCount,
    smallFontUses,
    horizontalScrollSmell,
    hasTouchIcon, hasManifest, themeColor, appleMobileCapable,
    inputs: { total: totalInputs, good: goodInputTypes, bad: badInputTypes },
    flashCount,
    htmlSize: html.length,
  };
}

function buildChecks(s) {
  const c = [];
  // Viewport
  if (!s.viewportContent) {
    c.push({ severity: 'fail', message: 'Missing <meta name="viewport"> — page will render at desktop width on mobile devices.' });
  } else {
    const v = s.viewport || {};
    if (v.width === 'device-width') c.push({ severity: 'pass', message: `Viewport width=device-width is set (${s.viewportContent}).` });
    else c.push({ severity: 'fail', message: `Viewport doesn’t set width=device-width — got "${s.viewportContent}".` });
    if (v['initial-scale']) c.push({ severity: 'pass', message: `initial-scale="${v['initial-scale']}" is declared.` });
    if (v['user-scalable'] === 'no' || v['maximum-scale'] === '1.0' || v['maximum-scale'] === '1') {
      c.push({ severity: 'warn', message: 'Viewport disables user zoom — accessibility issue. Remove user-scalable=no / maximum-scale.' });
    }
  }

  // Charset (text rendering on mobile)
  // (charset is checked separately — kept simple here)

  // Images
  if (s.images.total > 0 && s.images.fixedWidth / s.images.total > 0.3) {
    c.push({ severity: 'warn', message: `${s.images.fixedWidth}/${s.images.total} images use fixed pixel widths — they may overflow narrow screens.` });
  }
  if (s.images.total > 0 && s.images.withSrcset / s.images.total < 0.2 && s.images.total >= 5) {
    c.push({ severity: 'info', message: `Only ${s.images.withSrcset}/${s.images.total} images use srcset — responsive images load faster on mobile.` });
  }

  // Fixed-width containers
  if (s.fixedWidthContainers > 0) {
    c.push({ severity: 'warn', message: `${s.fixedWidthContainers} element${s.fixedWidthContainers === 1 ? ' uses' : 's use'} an inline width ≥ 100 px — likely cause of horizontal scroll on mobile.` });
  }

  // Small fonts
  if (s.smallFontUses.length >= 3) {
    c.push({ severity: 'warn', message: `${s.smallFontUses.length} inline font-size rules below 12 px — text will be hard to read on mobile.` });
  }

  // Touch enhancements
  if (s.hasTouchIcon) c.push({ severity: 'pass', message: 'Apple touch icon is declared — users can pin the page to home screen with a proper icon.' });
  else c.push({ severity: 'info', message: 'No <link rel="apple-touch-icon"> — add one so iOS home-screen shortcuts look polished.' });

  if (s.themeColor) c.push({ severity: 'pass', message: `theme-color is set to ${s.themeColor} — Chrome on Android will tint the address bar.` });
  else c.push({ severity: 'info', message: 'No theme-color meta — adding one improves the visual experience in Chrome for Android.' });

  if (s.hasManifest) c.push({ severity: 'pass', message: 'Web app manifest detected — supports install-to-home-screen on Android.' });

  // Input types
  if (s.inputs.bad > 0) {
    c.push({ severity: 'info', message: `${s.inputs.bad} text input${s.inputs.bad === 1 ? '' : 's'} use type="text" — using type="email/tel/number/date" gives mobile users the right keyboard.` });
  }

  // Flash
  if (s.flashCount > 0) {
    c.push({ severity: 'fail', message: `${s.flashCount} Flash object${s.flashCount === 1 ? '' : 's'} detected — Flash is unsupported on every modern browser.` });
  }

  // Horizontal scroll
  if (s.horizontalScrollSmell) {
    c.push({ severity: 'warn', message: 'Inline min-width >700px detected — likely causes horizontal scrolling on mobile.' });
  }

  if (c.filter((x) => x.severity === 'fail').length === 0 && c.filter((x) => x.severity === 'warn').length === 0) {
    c.push({ severity: 'pass', message: 'No mobile-blocking issues detected.' });
  }
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

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const { res, chain, finalUrl } = await fetchWithRedirects(url, ctrl.signal, { userAgent: MOBILE_UA });
    const contentType = res.headers.get('content-type') || '';
    if (res.status >= 400) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({ url, finalUrl, httpStatus: res.status, contentType, error: `Server returned HTTP ${res.status}.`, redirectChain: chain }, { status: 502 });
    }
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      try { await res.body?.cancel(); } catch {}
      return Response.json({ url, finalUrl, httpStatus: res.status, contentType, error: `Content-Type is "${contentType}" — this tool only works on HTML pages.`, redirectChain: chain }, { status: 400 });
    }
    const html = await readBoundedText(res);
    const signals = gatherSignals(html, finalUrl);
    const checks = buildChecks(signals);
    const summary = {
      pass: checks.filter((c) => c.severity === 'pass').length,
      warn: checks.filter((c) => c.severity === 'warn').length,
      fail: checks.filter((c) => c.severity === 'fail').length,
      info: checks.filter((c) => c.severity === 'info').length,
    };
    const verdict = summary.fail > 0 ? 'not-mobile-friendly' : (summary.warn > 0 ? 'mostly-friendly' : 'mobile-friendly');

    const payload = {
      url, finalUrl, httpStatus: res.status, contentType,
      redirectChain: chain,
      userAgent: MOBILE_UA,
      verdict, summary, checks,
      signals: {
        viewport: signals.viewport,
        viewportContent: signals.viewportContent,
        images: signals.images,
        fixedWidthContainers: signals.fixedWidthContainers,
        smallFontCount: signals.smallFontUses.length,
        themeColor: signals.themeColor,
        hasTouchIcon: signals.hasTouchIcon,
        hasManifest: signals.hasManifest,
        inputs: signals.inputs,
        flashCount: signals.flashCount,
      },
    };
    void logToolHistory({ url, toolName: 'Mobile Friendly Test', result: payload });
    return Response.json(payload);
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    const m = networkErrorToMessage(err);
    if (m) return Response.json({ error: m.error }, { status: m.status });
    console.error('[mobile-friendly] error:', err);
    return Response.json({ error: 'Failed to fetch the URL.' }, { status: 502 });
  } finally { clearTimeout(timer); }
}
