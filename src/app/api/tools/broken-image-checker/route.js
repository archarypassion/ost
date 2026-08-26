import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 12_000;

function resolveUrl(src, baseUrl) {
  try {
    return new URL(src, baseUrl).toString();
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
    const isHttpsPage = finalUrl.startsWith('https://');

    const imgRegex = /<img\s+[^>]*>/gi;
    const rawImages = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null && rawImages.length < 30) {
      const tag = match[0];
      const srcMatch = tag.match(/src=["']?([^"'>\s]+)["']?/i);
      const altMatch = tag.match(/alt=["']?([^"'>]*)["']?/i);
      const loadingMatch = tag.match(/loading=["']?([^"'>]+)["']?/i);

      if (srcMatch && srcMatch[1]) {
        const rawSrc = srcMatch[1];
        if (!rawSrc.startsWith('data:')) {
          const resolved = resolveUrl(rawSrc, finalUrl);
          if (resolved) {
            rawImages.push({
              tag,
              rawSrc,
              url: resolved,
              alt: altMatch ? altMatch[1] : null,
              hasAlt: altMatch !== null && altMatch[1].trim().length > 0,
              isMissingAlt: altMatch === null || altMatch[1].trim().length === 0,
              isMixedContent: isHttpsPage && resolved.startsWith('http://'),
              loading: loadingMatch ? loadingMatch[1] : null,
            });
          }
        }
      }
    }

    // Probe images in parallel
    const probed = await Promise.all(
      rawImages.map(async (img) => {
        try {
          const headRes = await fetch(img.url, { method: 'HEAD', signal: ctrl.signal });
          const contentType = headRes.headers.get('content-type') || '';
          const contentLength = headRes.headers.get('content-length') || null;
          return {
            ...img,
            status: headRes.status,
            ok: headRes.ok,
            contentType,
            contentLength: contentLength ? parseInt(contentLength, 10) : null,
          };
        } catch {
          return {
            ...img,
            status: 0,
            ok: false,
            error: 'Failed to fetch image.',
          };
        }
      })
    );

    const brokenImages = probed.filter((i) => !i.ok);
    const missingAltImages = probed.filter((i) => i.isMissingAlt);
    const mixedContentImages = probed.filter((i) => i.isMixedContent);

    const result = {
      targetUrl,
      finalUrl,
      totalImages: probed.length,
      brokenCount: brokenImages.length,
      missingAltCount: missingAltImages.length,
      mixedContentCount: mixedContentImages.length,
      images: probed,
    };

    void logToolHistory({ url: targetUrl, toolName: 'Broken Image & Alt Checker', result });
    return Response.json(result);
  } catch (err) {
    const m = networkErrorToMessage(err);
    return Response.json({ error: m?.error || err.message || 'Failed to inspect page images.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
