import { logToolHistory } from '@/lib/mongodb';
import { ValidationError, normalizeUrl, fetchWithRedirects, networkErrorToMessage } from '@/lib/fetch-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 10_000;

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

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';

    const og = {};
    const twitter = {};
    let metaDescription = '';

    const metaRegex = /<meta\s+[^>]*>/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      const tag = match[0];
      const property = tag.match(/property=["']?([^"'>\s]+)["']?/i);
      const name = tag.match(/name=["']?([^"'>\s]+)["']?/i);
      const content = tag.match(/content=["']?([^"'>]*)["']?/i);

      if (content && content[1]) {
        const val = content[1].trim();
        if (property && property[1].startsWith('og:')) {
          og[property[1].slice(3)] = val;
        } else if (name && name[1].startsWith('twitter:')) {
          twitter[name[1].slice(8)] = val;
        } else if (name && name[1].toLowerCase() === 'description') {
          metaDescription = val;
        }
      }
    }

    const resolvedOgImage = og.image ? resolveUrl(og.image, finalUrl) : null;
    const resolvedTwitterImage = twitter.image ? resolveUrl(twitter.image, finalUrl) : resolvedOgImage;

    const domain = new URL(finalUrl).hostname;

    const result = {
      targetUrl,
      finalUrl,
      domain,
      title: og.title || twitter.title || pageTitle,
      description: og.description || twitter.description || metaDescription,
      image: resolvedOgImage || resolvedTwitterImage,
      siteName: og.site_name || domain,
      twitterCardType: twitter.card || 'summary_large_image',
      og,
      twitter,
    };

    void logToolHistory({ url: targetUrl, toolName: 'Social Share Multi-Preview', result });
    return Response.json(result);
  } catch (err) {
    const m = networkErrorToMessage(err);
    return Response.json({ error: m?.error || err.message || 'Failed to fetch social metadata.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
