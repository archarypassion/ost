import { getSiteUrl } from '@/lib/tools-catalog';

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't waste crawl budget on the API routes — they're for tool use, not for indexing.
        disallow: ['/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
