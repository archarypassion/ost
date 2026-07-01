// Single source of truth for every public tool route on the site.
// The home page renders these grouped, and app/sitemap.js emits one entry per tool.

export const SITE_NAME = 'opensourcetools.online';
export const SITE_URL = 'https://www.opensourcetools.online';
export const SITE_TAGLINE = 'Premium SEO & web diagnostics tools for modern developers and marketers.';

/** Public contact for help, privacy questions, and abuse reports. */
export const CONTACT_EMAIL = 'sourabhmalame@gmail.com';

/** Shown on legal pages (avoid client date hydration quirks). */
export const LEGAL_LAST_UPDATED = 'May 12, 2026';

export const STATIC_PAGES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changeFrequency: 'yearly' },
];

// Every implemented tool. Order is significant for the home page UI.
// Each entry has: slug, name, description, metaDescription (SEO), group (used for the home grouping).
export const TOOLS = [
  // Indexation
  {
    slug: 'noindex-checker',
    name: 'Noindex Checker',
    group: 'Indexation',
    description: 'Detect noindex directives in HTML and X-Robots-Tag headers.',
    metaDescription:
      'Check if a page has a noindex tag in HTML or X-Robots-Tag headers. Free noindex checker for SEO audits — instant results, no sign-up.',
  },
  {
    slug: 'robots-txt',
    name: 'Robots.txt Checker',
    group: 'Indexation',
    description: 'Parse and audit your robots.txt rules and sitemaps.',
    metaDescription:
      'Analyze robots.txt for crawl rules, disallow paths, and sitemap URLs. Free robots.txt tester — find blocking errors before Googlebot does.',
  },
  {
    slug: 'sitemap-checker',
    name: 'XML Sitemap Checker',
    group: 'Indexation',
    description: 'Validate XML sitemaps, indexes, RSS/Atom feeds and gzip variants.',
    metaDescription:
      'Validate XML sitemaps, sitemap indexes, and URL counts. Free sitemap checker — catch broken URLs, format errors, and missing entries.',
  },
  {
    slug: 'google-index',
    name: 'Google Index Checker',
    group: 'Indexation',
    description: 'Combine on-page, robots, and Google site: signals into one verdict.',
    metaDescription:
      'Check if Google can index a URL — robots.txt, noindex, canonicals, and site: signals in one report. Free Google index status checker.',
  },
  // On-page
  {
    slug: 'on-page-seo',
    name: 'On-Page SEO Checker',
    group: 'On-Page',
    description: '17-point on-page audit with a 0–100 SEO score.',
    metaDescription:
      'Run a 17-point on-page SEO audit with a 0–100 score. Check titles, headings, meta tags, images, and links — free, instant results.',
  },
  {
    slug: 'meta-tags',
    name: 'Meta Tags Checker',
    group: 'On-Page',
    description: 'Inspect every meta and link tag, grouped by SEO purpose.',
    metaDescription:
      'Inspect title, meta description, robots, canonical, and social tags on any URL. Free meta tags checker with SERP and social previews.',
  },
  {
    slug: 'open-graph',
    name: 'Open Graph Checker',
    group: 'On-Page',
    description: 'Validate Open Graph & Twitter cards with platform-specific previews.',
    metaDescription:
      'Validate Open Graph and Twitter Card tags with live Facebook, X, and LinkedIn previews. Free OG checker — fix broken social share images.',
  },
  {
    slug: 'schema-checker',
    name: 'Schema Markup Checker',
    group: 'On-Page',
    description: 'Validate JSON-LD against Google rich-result requirements.',
    metaDescription:
      'Validate JSON-LD structured data against Google rich result rules. Free schema markup checker — find missing fields and eligibility issues.',
  },
  {
    slug: 'canonical-url',
    name: 'Canonical URL Checker',
    group: 'On-Page',
    description: 'Audit canonical links from HTML and Link headers, follow targets.',
    metaDescription:
      'Audit canonical tags in HTML and HTTP headers. Free canonical URL checker — detect duplicates, chains, and mismatched canonical targets.',
  },
  {
    slug: 'keyword-density',
    name: 'Keyword Density Checker',
    group: 'On-Page',
    description: 'Top words, bigrams and trigrams with density percentages.',
    metaDescription:
      'Analyze keyword density, top words, bigrams, and trigrams on any page. Free keyword density tool for content and SEO optimization.',
  },
  {
    slug: 'word-count',
    name: 'Word Count Checker',
    group: 'On-Page',
    description: 'Words, characters, sentences, reading time and Flesch readability.',
    metaDescription:
      'Count words, characters, sentences, and reading time. Free word count checker with Flesch readability score for writers and SEOs.',
  },
  // Links & redirects
  {
    slug: 'link-checker',
    name: 'Broken Link Checker',
    group: 'Links & Redirects',
    description: 'Probe every link on a page in parallel, classify broken vs healthy.',
    metaDescription:
      'Find broken links on any page — internal and external URLs checked in parallel. Free broken link checker for site audits and QA.',
  },
  {
    slug: 'redirect-checker',
    name: 'Redirect Checker',
    group: 'Links & Redirects',
    description: 'Trace every hop, classify 301/302/scheme/host changes, surface SEO issues.',
    metaDescription:
      'Trace redirect chains hop by hop — 301, 302, HTTPS, and host changes. Free redirect checker for migrations and SEO troubleshooting.',
  },
  {
    slug: 'http-status',
    name: 'HTTP Status Checker',
    group: 'Links & Redirects',
    description: 'Single + bulk status checks with full response headers.',
    metaDescription:
      'Check HTTP status codes for single URLs or bulk lists. Free HTTP status checker — see 200, 301, 404, 500 responses and full headers.',
  },
  // Performance
  {
    slug: 'gzip-checker',
    name: 'Gzip / Brotli Checker',
    group: 'Performance',
    description: 'Measure real wire-bytes vs decompressed size and savings.',
    metaDescription:
      'Test Gzip and Brotli compression on any URL. Free compression checker — measure wire size, savings, and Content-Encoding headers.',
  },
  {
    slug: 'page-size',
    name: 'Page Size Checker',
    group: 'Performance',
    description: 'Total page weight by resource type with composition chart.',
    metaDescription:
      'Measure total page weight and resource breakdown by type. Free page size checker — find heavy images, scripts, and CSS slowing your site.',
  },
  {
    slug: 'page-speed',
    name: 'Page Speed Checker',
    group: 'Performance',
    description: 'Real network timings: DNS, TCP, TLS, TTFB, total download.',
    metaDescription:
      'Measure real page speed — DNS, TLS, TTFB, and total download time. Free page speed checker with network timing breakdown per URL.',
  },
  {
    slug: 'mobile-friendly',
    name: 'Mobile Friendly Test',
    group: 'Performance',
    description: 'Audit viewport, responsive images, fonts and touch readiness.',
    metaDescription:
      'Test mobile-friendliness — viewport, tap targets, font sizes, and responsive images. Free mobile friendly checker for any URL.',
  },
  // Domain & server
  {
    slug: 'ssl-checker',
    name: 'SSL Certificate Checker',
    group: 'Domain & Server',
    description: 'Real TLS handshake, certificate chain, hostname match, key strength.',
    metaDescription:
      'Check SSL certificate expiry, chain, hostname match, and TLS version. Free SSL checker — catch trust errors before visitors do.',
  },
  {
    slug: 'domain-age',
    name: 'Domain Age Checker',
    group: 'Domain & Server',
    description: 'WHOIS-driven creation date, registrar, expiry and statuses.',
    metaDescription:
      'Look up domain age, creation date, registrar, and expiry via WHOIS. Free domain age checker — verify trust and renewal dates instantly.',
  },
  {
    slug: 'ip-lookup',
    name: 'IP Lookup',
    group: 'Domain & Server',
    description: 'DNS sweep, reverse DNS, IP geolocation and ASN ownership.',
    metaDescription:
      'Resolve domain to IP with DNS records, geolocation, ASN, and reverse DNS. Free IP lookup tool — A, AAAA, MX, TXT, and more.',
  },
];

/** Display order on the home page (must match each tool’s `group`). */
export const HOME_GROUP_ORDER = [
  'Indexation',
  'On-Page',
  'Links & Redirects',
  'Performance',
  'Domain & Server',
];

/** Section titles and blurbs shown on the landing page. */
export const HOME_GROUP_META = {
  Indexation: {
    title: 'Indexation Tools',
    description: 'Verify what search engines can see on your website.',
  },
  'On-Page': {
    title: 'On-Page SEO Tools',
    description: 'Analyze and optimize your content structure for higher rankings.',
  },
  'Links & Redirects': {
    title: 'Link & Redirect Tools',
    description: 'Find broken links, trace redirects, and check server responses.',
  },
  Performance: {
    title: 'Performance Tools',
    description: 'Measure speed, compression, and mobile readiness.',
  },
  'Domain & Server': {
    title: 'Domain & Server Tools',
    description: 'Inspect certificates, DNS, and domain registration data.',
  },
};

/**
 * Build the grouped tool list for the home page. Pass a map of slug → Lucide icon component.
 * @param {Record<string, import('react').ComponentType<{ size?: number; className?: string }>>} iconBySlug
 */
export function buildHomeToolCategories(iconBySlug) {
  return HOME_GROUP_ORDER.map((groupKey) => {
    const meta = HOME_GROUP_META[groupKey];
    const tools = TOOLS.filter((t) => t.group === groupKey).map((t) => ({
      name: t.name,
      path: `/tools/${t.slug}`,
      description: t.description,
      icon: iconBySlug[t.slug],
    }));
    return { title: meta.title, description: meta.description, tools };
  });
}

export function getToolBySlug(slug) {
  return TOOLS.find((t) => t.slug === slug) || null;
}

export function getSiteUrl() {
  // Vercel automatically provides VERCEL_URL (host only, no scheme) for preview deployments.
  // For production we read NEXT_PUBLIC_SITE_URL which you control in your Vercel project settings.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}
