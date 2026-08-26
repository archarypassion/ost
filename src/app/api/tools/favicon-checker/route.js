import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 10_000;

function resolveUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  let targetUrl;
  try {
    targetUrl = normalizeUrl(body?.url || '');
  } catch (err) {
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 400 });
    return Response.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { res, finalUrl } = await fetchWithRedirects(targetUrl, ctrl.signal, { method: 'GET' });
    const html = await res.text();

    const origin = new URL(finalUrl).origin;
    const candidates = new Map();

    // Default expected locations
    candidates.set(resolveUrl('/favicon.ico', origin), { type: 'Default /favicon.ico', rel: 'favicon.ico' });
    candidates.set(resolveUrl('/apple-touch-icon.png', origin), { type: 'Apple Touch Icon (Default)', rel: 'apple-touch-icon' });
    candidates.set(resolveUrl('/favicon.svg', origin), { type: 'Vector SVG Favicon', rel: 'icon' });

    // HTML link tags inspection
    const linkRegex = /<link\s+[^>]*rel=["']?([^"'>\s]+)["']?[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const tag = match[0];
      const relMatch = tag.match(/rel=["']?([^"'>]+)["']?/i);
      const hrefMatch = tag.match(/href=["']?([^"'>]+)["']?/i);
      const sizesMatch = tag.match(/sizes=["']?([^"'>]+)["']?/i);

      if (relMatch && hrefMatch) {
        const rel = relMatch[1].toLowerCase();
        if (rel.includes('icon') || rel.includes('apple-touch') || rel.includes('manifest')) {
          const resolved = resolveUrl(hrefMatch[1], finalUrl);
          if (resolved) {
            candidates.set(resolved, {
              type: rel.includes('apple') ? 'Apple Touch Icon' : rel.includes('manifest') ? 'Web Manifest' : 'HTML Declared Icon',
              rel,
              sizes: sizesMatch ? sizesMatch[1] : undefined,
            });
          }
        }
      }
    }

    // Probe candidates in parallel
    const candidateList = Array.from(candidates.entries()).filter(([u]) => Boolean(u));
    const results = await Promise.all(
      candidateList.map(async ([iconUrl, meta]) => {
        try {
          const headRes = await fetch(iconUrl, { method: 'HEAD', signal: ctrl.signal });
          const contentType = headRes.headers.get('content-type') || '';
          return {
            url: iconUrl,
            status: headRes.status,
            ok: headRes.ok,
            type: meta.type,
            rel: meta.rel,
            sizes: meta.sizes || null,
            contentType,
            contentLength: headRes.headers.get('content-length') || null,
          };
        } catch {
          return {
            url: iconUrl,
            status: 0,
            ok: false,
            type: meta.type,
            rel: meta.rel,
            sizes: meta.sizes || null,
            error: 'Connection error',
          };
        }
      })
    );

    const validIcons = results.filter((r) => r.ok);
    const hasFaviconIco = results.some((r) => r.url.endsWith('/favicon.ico') && r.ok);
    const hasAppleTouch = results.some((r) => r.rel?.includes('apple') && r.ok);

    const result = {
      targetUrl,
      finalUrl,
      totalProbed: results.length,
      validIconsCount: validIcons.length,
      hasFaviconIco,
      hasAppleTouch,
      icons: results,
    };

    void logToolHistory({ url: targetUrl, toolName: 'Favicon & Manifest Checker', result });
    return Response.json(result);
  } catch (err) {
    const m = networkErrorToMessage(err);
    return Response.json({ error: m?.error || err.message || 'Failed to inspect favicons.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
