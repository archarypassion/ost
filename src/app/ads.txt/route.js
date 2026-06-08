/**
 * Serves https://www.opensourcetools.online/ads.txt for Google AdSense.
 * Set NEXT_PUBLIC_ADSENSE_ADS_TXT_LINE in Vercel (full line, e.g.
 * `google.com, pub-xxxxxxxxxxxxxxxx, DIRECT, f08c47fec0942fa0`).
 * If unset, returns 404 so crawlers do not cache a wrong publisher id.
 */
export async function GET() {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_ADS_TXT_LINE?.trim();
  if (!raw) {
    return new Response(null, { status: 404 });
  }
  const body = raw.endsWith('\n') ? raw : `${raw}\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
