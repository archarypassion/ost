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
    slug: 'robots-generator',
    name: 'Robots.txt Generator',
    group: 'Indexation',
    description: 'Generate production-ready robots.txt rules for Googlebot, Bingbot & AI crawlers.',
    metaDescription:
      'Create custom robots.txt files with crawler permissions, disallow rules, and sitemaps. Free robots.txt generator with AI bot blocking presets.',
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
    slug: 'meta-description-generator',
    name: 'Meta Description Generator',
    group: 'On-Page',
    description: 'Generate CTR-optimized meta descriptions with live 600px Google SERP pixel previews.',
    metaDescription:
      'Craft search-optimized meta descriptions with live Google desktop and mobile SERP preview simulator. Free meta description generator.',
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
    slug: 'social-preview',
    name: 'Social Share Multi-Preview',
    group: 'On-Page',
    description: 'Preview how any webpage appears when shared across Facebook, X, LinkedIn, WhatsApp & Slack.',
    metaDescription:
      'Inspect social media card previews across Facebook, Twitter, LinkedIn, and WhatsApp in one view. Free social share previewer.',
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
    slug: 'schema-generator',
    name: 'JSON-LD Schema Generator',
    group: 'On-Page',
    description: 'Build structured data for Articles, FAQs, Products, Local Business & Organizations.',
    metaDescription:
      'Generate valid JSON-LD structured data markup for Google rich snippets. Free schema generator for Article, FAQ, Product, and Organization schemas.',
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
    slug: 'hreflang-generator',
    name: 'Hreflang Tag Generator',
    group: 'On-Page',
    description: 'Generate multi-language and multi-regional hreflang tags and XML sitemaps.',
    metaDescription:
      'Create reciprocal hreflang tags for multilingual SEO with ISO 639-1 language codes. Free hreflang tag and XML sitemap generator.',
  },
  {
    slug: 'broken-image-checker',
    name: 'Broken Image & Alt Checker',
    group: 'On-Page',
    description: 'Crawl webpage images to flag 404 broken links, missing alt text, and mixed content.',
    metaDescription:
      'Find broken images, missing alt tags, and HTTP mixed content on any webpage. Free image SEO and accessibility auditor.',
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
  {
    slug: 'readability-checker',
    name: 'Readability Score Analyzer',
    group: 'On-Page',
    description: 'Calculate Flesch-Kincaid, Gunning Fog, Coleman-Liau, SMOG, and ARI grade levels.',
    metaDescription:
      'Analyze content readability with Flesch Reading Ease, Gunning Fog, and SMOG formulas. Free readability score checker for copywriters and SEOs.',
  },
  {
    slug: 'slug-generator',
    name: 'URL Slug Generator',
    group: 'On-Page',
    description: 'Convert article titles into clean, SEO-friendly URL slugs with stop-word filters.',
    metaDescription:
      'Generate clean, human-readable URL slugs for SEO. Remove stop words, normalize accents, and format keywords for search engine friendly links.',
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
  {
    slug: 'utm-builder',
    name: 'UTM Campaign Builder',
    group: 'Links & Redirects',
    description: 'Build Google Analytics 4 tracking URLs with campaign source, medium and presets.',
    metaDescription:
      'Generate custom UTM tracking links for Google Analytics 4 campaigns. Free UTM builder with presets for Google Ads, Facebook, and Email marketing.',
  },
  {
    slug: 'url-encoder',
    name: 'URL Encoder / Decoder',
    group: 'Links & Redirects',
    description: 'Encode and decode URLs, query parameters and UTF-8 characters under RFC 3986.',
    metaDescription:
      'Percent-encode or decode URLs, URI components, and query strings. Free URL encoder / decoder tool with real-time conversion and query parameter parser.',
  },
  {
    slug: 'keyword-mixer',
    name: 'Keyword Mixer Tool',
    group: 'Links & Redirects',
    description: 'Combine and cross-multiply keyword lists into Broad, Phrase, and Exact match variants for PPC & SEO.',
    metaDescription:
      'Generate keyword permutations and match types for Google Ads and SEO campaigns. Free keyword mixer and permutation tool.',
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
  {
    slug: 'color-contrast',
    name: 'Color Contrast Checker',
    group: 'Performance',
    description: 'Calculate WCAG 2.1 AA and AAA contrast ratios for accessibility and UI compliance.',
    metaDescription:
      'Test text and UI color contrast ratios against WCAG 2.1 AA and AAA accessibility standards. Free color contrast checker with live preview.',
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
    slug: 'security-headers',
    name: 'Security Headers Checker',
    group: 'Domain & Server',
    description: 'Audit HSTS, CSP, X-Frame-Options, Permissions-Policy and security grades.',
    metaDescription:
      'Inspect HTTP security headers and get an actionable OWASP grade (A+ to F). Free security headers checker with copyable Nginx and Apache configs.',
  },
  {
    slug: 'dmarc-checker',
    name: 'DMARC & SPF Validator',
    group: 'Domain & Server',
    description: 'Validate DNS DMARC policy, SPF records and email authentication health.',
    metaDescription:
      'Verify DMARC and SPF DNS records for any domain. Free DMARC checker — catch spoofing vulnerabilities and deliverability issues.',
  },
  {
    slug: 'dns-propagation',
    name: 'DNS Propagation Checker',
    group: 'Domain & Server',
    description: 'Check global DNS record resolution across Cloudflare, Google, Quad9, and OpenDNS.',
    metaDescription:
      'Check if DNS changes have propagated globally. Free DNS propagation checker for A, AAAA, MX, CNAME, and TXT records across worldwide resolvers.',
  },
  {
    slug: 'http-protocol-checker',
    name: 'HTTP/2 & HTTP/3 Checker',
    group: 'Domain & Server',
    description: 'Detect whether a server supports modern ALPN HTTP/2 and QUIC / HTTP/3 protocols.',
    metaDescription:
      'Test web server protocol support for HTTP/2, HTTP/3, and QUIC. Free HTTP protocol checker with TLS ALPN handshake analysis.',
  },
  {
    slug: 'cookie-checker',
    name: 'HTTP Cookie & SameSite Inspector',
    group: 'Domain & Server',
    description: 'Inspect Set-Cookie headers for Secure, HttpOnly, SameSite, and expiration security flags.',
    metaDescription:
      'Inspect HTTP response cookies for security and privacy compliance. Free cookie checker for Secure, HttpOnly, and SameSite flags.',
  },
  {
    slug: 'favicon-checker',
    name: 'Favicon & Manifest Checker',
    group: 'Domain & Server',
    description: 'Validate favicon.ico, Apple touch icons, SVG favicons, and web app manifests.',
    metaDescription:
      'Check favicon and Web App Manifest implementation across all device sizes. Free favicon checker and validator.',
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
  // Developer Utilities
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    group: 'Developer Utilities',
    description: 'Format, validate, minify and inspect JSON structures with instant syntax error locating.',
    metaDescription:
      'Prettify, minify, validate and repair JSON documents in real-time. Free JSON formatter with tree view, syntax highlighting, and error diagnostics.',
  },
  {
    slug: 'case-converter',
    name: 'Text Case Converter',
    group: 'Developer Utilities',
    description: 'Convert text to Title Case, UPPERCASE, lowercase, camelCase, kebab-case, snake_case, and PascalCase.',
    metaDescription:
      'Convert text between uppercase, lowercase, title case, camelCase, snake_case, and kebab-case. Free online text case converter.',
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder / Decoder',
    group: 'Developer Utilities',
    description: 'Encode text and images to Base64 data URIs and decode Base64 strings in real-time.',
    metaDescription:
      'Encode and decode Base64 strings, text, and images to data URIs. Free Base64 encoder and decoder tool with file upload support.',
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester & Explainer',
    group: 'Developer Utilities',
    description: 'Test JavaScript regular expressions with real-time match highlights, capture groups, and presets.',
    metaDescription:
      'Test regular expressions online with live match highlighting and capture group tables. Free JavaScript regex tester and builder.',
  },
  {
    slug: 'markdown-previewer',
    name: 'Markdown to HTML Live Preview',
    group: 'Developer Utilities',
    description: 'Edit GitHub Flavored Markdown (GFM) with live HTML rendering, raw HTML generation, and copy.',
    metaDescription:
      'Convert Markdown to clean HTML in real-time with live side-by-side preview. Free online Markdown to HTML editor.',
  },
  {
    slug: 'css-minifier',
    name: 'CSS Minifier & Formatter',
    group: 'Developer Utilities',
    description: 'Minify and beautify CSS stylesheets with compression size metrics and download.',
    metaDescription:
      'Compress and minify CSS stylesheets or beautify minified code. Free CSS minifier with byte savings calculation.',
  },
  {
    slug: 'uuid-generator',
    name: 'UUID / GUID Generator',
    group: 'Developer Utilities',
    description: 'Generate bulk random v4 and time-ordered v7 UUIDs with custom formatting.',
    metaDescription:
      'Generate cryptographically random UUID v4 and time-ordered UUID v7 strings. Free bulk UUID / GUID generator.',
  },
  {
    slug: 'hash-generator',
    name: 'Cryptographic Hash Generator',
    group: 'Developer Utilities',
    description: 'Compute SHA-256, SHA-512, SHA-384, SHA-1, and MD5 hashes in the browser using Web Crypto.',
    metaDescription:
      'Generate SHA-256, SHA-512, SHA-1, and MD5 hashes in real-time using native browser cryptography. Free hash generator.',
  },
  {
    slug: 'text-deduplicator',
    name: 'Text & Keyword Deduplicator',
    group: 'Developer Utilities',
    description: 'Remove duplicate lines from text and keyword lists with sorting and trimming options.',
    metaDescription:
      'Remove duplicate lines, sort alphabetically, and clean keyword lists. Free text deduplicator tool.',
  },
  {
    slug: 'lorem-generator',
    name: 'Lorem Ipsum Generator',
    group: 'Developer Utilities',
    description: 'Generate custom placeholder dummy text by paragraphs, words, sentences, and HTML tags.',
    metaDescription:
      'Generate dummy Lorem Ipsum placeholder text for web design, mockups, and typography. Free Lorem Ipsum generator.',
  },
  {
    slug: 'cors-checker',
    name: 'CORS & Access-Control Checker',
    group: 'Developer Utilities',
    description: 'Probe API endpoints for Access-Control-Allow-Origin, headers, and preflight CORS compatibility.',
    metaDescription:
      'Test CORS headers on any API endpoint. Free CORS checker for Access-Control-Allow-Origin, methods, and preflight requests.',
  },
  {
    slug: 'html-entity',
    name: 'HTML Entity Encoder',
    group: 'Developer Utilities',
    description: 'Convert characters to Named, Decimal and Hex HTML entities and decode encoded markup.',
    metaDescription:
      'Encode and decode HTML entities in real-time. Free HTML entity converter — prevent XSS vulnerabilities and format special characters.',
  },
];

/** Display order on the home page (must match each tool’s `group`). */
export const HOME_GROUP_ORDER = [
  'Indexation',
  'On-Page',
  'Links & Redirects',
  'Performance',
  'Domain & Server',
  'Developer Utilities',
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
  'Developer Utilities': {
    title: 'Developer Utilities',
    description: 'Essential web development, encoding, and data manipulation tools.',
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
