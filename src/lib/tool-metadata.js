import { getToolBySlug, getSiteUrl, SITE_NAME } from '@/lib/tools-catalog';

/**
 * Build Next.js Metadata for a tool page (/tools/[slug]).
 * @param {string} slug
 */
export function buildToolMetadata(slug) {
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const description = tool.metaDescription || tool.description;
  const title = tool.name;
  const path = `/tools/${slug}`;
  const url = `${getSiteUrl()}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${title} · ${SITE_NAME}`,
      description,
    },
  };
}
