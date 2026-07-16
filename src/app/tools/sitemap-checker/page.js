"use client";
import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function SitemapChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/sitemap-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
      } else {
        setData(json);
      }
    } catch {
      setError('Network error — could not reach the checker service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header"><h1>🗺️ XML Sitemap Checker</h1></div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter domain or sitemap URL (e.g. example.com or example.com/sitemap.xml)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Analyzing...' : '🔍 Check Sitemap'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Fetches the sitemap, validates the XML, counts URLs, expands sitemap indexes, supports gzip, and flags
          common issues (duplicates, off-domain URLs, future <code>lastmod</code> dates, invalid priority, oversize files).
        </p>

        {error && <div className="result-error">{error}</div>}

        {data && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  let bannerClass, BannerIcon, headline;
  if (!data.found) {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = data.message || `⚠️ Sitemap not found (HTTP ${data.httpStatus}).`;
  } else if (data.summary?.issues?.some((i) => i.severity === 'error')) {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = `❌ Sitemap parsed with errors — ${data.summary.urlCount} URLs.`;
  } else if (data.type === 'sitemapindex') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = `✅ Sitemap index — ${data.childSitemaps.length} child sitemap${data.childSitemaps.length === 1 ? '' : 's'}.`;
  } else {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = `✅ Sitemap valid — ${data.summary.urlCount.toLocaleString()} URL${data.summary.urlCount === 1 ? '' : 's'}.`;
  }

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>{headline}</span>
      </div>

      <div>
        <div className="result-section-title">📊 Overview</div>
        <div className="result-grid" style={{ width: '100%' }}>
          <ResultRow label="📍 Sitemap URL" mono>
            <a href={data.sitemapUrl} target="_blank" rel="noreferrer" className="sitemap-link">
              {data.sitemapUrl}
            </a>
          </ResultRow>
          {data.discoveredVia && (
            <ResultRow label="🔍 Discovered via">{data.discoveredVia}</ResultRow>
          )}
          {data.finalUrl && data.finalUrl !== data.sitemapUrl && (
            <ResultRow label="📍 Final URL" mono>{data.finalUrl}</ResultRow>
          )}
          <ResultRow label="📊 HTTP Status"><strong>{data.httpStatus}</strong></ResultRow>
          {data.contentType && <ResultRow label="📄 Content-Type">{data.contentType}</ResultRow>}
          {data.found && <ResultRow label="📋 Type">{prettyType(data.type)}</ResultRow>}
          {data.found && (
            <ResultRow label="📦 Size">
              {formatBytes(data.bytes)}
              {data.wasCompressed && (
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  (gzipped: {formatBytes(data.rawBytes)})
                </span>
              )}
            </ResultRow>
          )}
          {data.found && data.type === 'urlset' && (
            <>
              <ResultRow label="📊 Total URLs">{data.summary.urlCount.toLocaleString()}</ResultRow>
              <ResultRow label="🖼️ Has Images">
                <YesNo on={data.summary.hasImages}>
                  {data.summary.hasImages ? `Yes (${data.summary.totalImages})` : 'No'}
                </YesNo>
              </ResultRow>
              <ResultRow label="🎬 Has Videos">
                <YesNo on={data.summary.hasVideos}>
                  {data.summary.hasVideos ? `Yes (${data.summary.totalVideos})` : 'No'}
                </YesNo>
              </ResultRow>
              {data.summary.latestLastmod && (
                <ResultRow label="📅 Latest lastmod">{formatDate(data.summary.latestLastmod)}</ResultRow>
              )}
              {data.summary.earliestLastmod && (
                <ResultRow label="📅 Earliest lastmod">{formatDate(data.summary.earliestLastmod)}</ResultRow>
              )}
            </>
          )}
          {data.found && data.type === 'sitemapindex' && (
            <ResultRow label="📋 Child Sitemaps">{data.childSitemaps.length}</ResultRow>
          )}
        </div>
      </div>

      {data.found && data.summary?.issues?.length > 0 && (
        <div>
          <div className="result-section-title">📋 Issues</div>
          <div className="issue-list">
            {data.summary.issues.slice(0, 25).map((issue, i) => (
              <div key={i} className={`issue-item ${issue.severity}`}>
                <span className="issue-tag">{issue.severity}</span>
                <span>{issue.message}</span>
              </div>
            ))}
            {data.summary.issues.length > 25 && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                …and {data.summary.issues.length - 25} more
              </div>
            )}
          </div>
        </div>
      )}

      {data.found && data.type === 'sitemapindex' && data.childSitemaps.length > 0 && (
        <div>
          <div className="result-section-title">
            📋 Child Sitemaps {data.childSitemapsTruncated && (
              <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-secondary)', fontWeight: 400 }}>
                (showing first 20)
              </span>
            )}
          </div>
          <div className="child-table">
            <div className="child-row head">
              <span>📍 Sitemap</span>
              <span>📊 URLs</span>
              <span>📊 Status</span>
            </div>
            {data.childSitemaps.map((c, i) => (
              <div key={i} className="child-row">
                <span className="child-loc">
                  <a href={c.loc} target="_blank" rel="noreferrer" className="sitemap-link">{c.loc}</a>
                  {c.lastmod && (
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                      lastmod: {c.lastmod}
                    </span>
                  )}
                </span>
                <span className="child-meta">
                  {c.error ? '—' : c.nestedIndex ? `index (${c.childCount})` : c.urlCount?.toLocaleString() ?? '—'}
                </span>
                <span className={`child-meta ${c.error ? 'error' : ''}`}>
                  {c.error ? c.error : c.status ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.found && data.type !== 'sitemapindex' && data.sampleUrls?.length > 0 && (
        <div>
          <div className="result-section-title">
            📋 URL Sample <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-secondary)', fontWeight: 400 }}>
              (first {data.sampleUrls.length} of {data.summary.urlCount.toLocaleString()})
            </span>
          </div>
          <div className="url-table">
            <div className="url-table-row head">
              <span>📍 URL</span>
              <span>📅 Lastmod</span>
              <span>🖼️ Imgs</span>
              <span>🎬 Videos</span>
            </div>
            {data.sampleUrls.map((u, i) => (
              <div key={i} className="url-table-row">
                <span className="url-table-loc">
                  <a href={u.loc} target="_blank" rel="noreferrer">{u.loc}</a>
                </span>
                <span className="url-table-meta">{u.lastmod || '—'}</span>
                <span className="url-table-meta">{u.images || '—'}</span>
                <span className="url-table-meta">{u.videos || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.redirectChain && data.redirectChain.length > 1 && (
        <div>
          <div className="result-section-title">🔄 Redirect Chain</div>
          <div className="redirect-chain">
            {data.redirectChain.map((hop, i) => (
              <div key={`${hop.url}-${i}`} className="redirect-hop">
                <span className="redirect-hop-status">{hop.status}</span>
                <span>{hop.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, children, mono = false }) {
  return (
    <div className="result-item">
      <span className="result-label">{label}</span>
      <span className={`result-value ${mono ? 'result-value-mono' : ''}`}>
        {children}
      </span>
    </div>
  );
}

function YesNo({ on, children }) {
  return (
    <span style={{ color: on ? '#10B981' : 'var(--text-secondary)', fontWeight: 500 }}>
      {children}
    </span>
  );
}

function formatBytes(n) {
  if (!Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return iso;
  }
}

function prettyType(t) {
  switch (t) {
    case 'urlset': return 'URL Set (standard sitemap)';
    case 'sitemapindex': return 'Sitemap Index';
    case 'text': return 'Plain Text Sitemap';
    case 'feed': return 'RSS / Atom Feed';
    default: return t;
  }
}

function Article() {
  return (
    <article className="tool-article">
      <h2>XML Sitemaps: Your Blueprint for Getting Every Page Discovered and Indexed</h2>
      <p>An XML sitemap is essentially a roadmap you hand to search engines, saying "here are all the important pages on my website, and here's some additional context about each one." It doesn't guarantee that every URL in your sitemap will be crawled or indexed — Google makes its own decisions about that — but it dramatically increases the likelihood that your pages will be discovered, especially on larger sites where some content might be several clicks away from the homepage and therefore harder for crawlers to find through link following alone.</p>

      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview" target="_blank" rel="noopener noreferrer">Google Search Central</a>, sitemaps help search engines understand your website structure and prioritize crawling. Our <strong>Sitemap Checker</strong> helps you validate your sitemap and identify issues that could prevent proper indexing.</p>

      <h2>What This Tool Does</h2>
      <p>Fetches the sitemap, validates the XML, counts URLs, expands sitemap indexes, supports gzip, and flags common issues (duplicates, off-domain URLs, future <code>lastmod</code> dates, invalid priority, oversize files).</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> and <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a>, you can ensure your site is properly configured for Google's crawlers.</p>

      <h2>Why Sitemaps Matter for SEO</h2>

      <h3>1. Improved Crawl Efficiency</h3>
      <p>Sitemaps help search engines discover pages they might otherwise miss, especially on larger sites. This is particularly important for <strong>mobile SEO</strong> where mobile-first indexing requires all important pages to be discoverable.</p>

      <h3>2. Priority Signals</h3>
      <p>While Google largely ignores <code>changefreq</code> and <code>priority</code> values, the <code>lastmod</code> date is actively used to help Googlebot prioritize re-crawling updated content more efficiently.</p>

      <h3>3. Image and Video Discovery</h3>
      <p>Specialized sitemap extensions for images and videos help Google discover media content that might be loaded via JavaScript or in ways that aren't easily parseable from the HTML source.</p>

      <h2>The Basic Structure of an XML Sitemap</h2>
      <p>At its simplest, an XML sitemap is a list of URLs wrapped in XML markup. Each URL entry (called a <code>&lt;url&gt;</code> element) contains at minimum the page's location (<code>&lt;loc&gt;</code>) and optionally includes metadata like the last modification date (<code>&lt;lastmod&gt;</code>), how frequently the page changes (<code>&lt;changefreq&gt;</code>), and the page's priority relative to other pages on the site (<code>&lt;priority&gt;</code>).</p>
      <p>However, be aware that Google has publicly stated it largely ignores <code>changefreq</code> and <code>priority</code> values in sitemaps because site owners routinely set them inaccurately (everyone marks everything as high priority). The <code>lastmod</code> date, on the other hand, is actively used by Google — if it's accurate and consistent, it helps Googlebot prioritize re-crawling updated content more efficiently.</p>

      <h2>Sitemap Index Files</h2>
      <p>A single XML sitemap file has a maximum limit of 50,000 URLs and 50 MB (uncompressed). Large websites frequently need to split their content across multiple sitemap files. A sitemap index file is a special sitemap that simply lists the locations of all your individual sitemap files. This lets you have a main entry point at <code>/sitemap.xml</code> that search engines can reference, while your actual URL lists are organized into logical sub-sitemaps — one for blog posts, one for product pages, one for category pages, and so on.</p>

      <h2>Specialized Sitemaps: Images and Videos</h2>
      <p>Beyond standard page sitemaps, Google supports specialized sitemap extensions for images and videos. An image sitemap tells Google about images embedded in your pages that it might miss during normal crawling — particularly images loaded via JavaScript or displayed in ways that aren't easily parseable from the HTML source. A video sitemap provides metadata about video content including title, description, thumbnail URL, and duration, helping Google surface your videos in video search results.</p>

      <h2>Common Sitemap Issues and How to Fix Them</h2>

      <h3>1. Sitemap Not Found</h3>
      <p><strong>The Problem:</strong> The sitemap URL returns a 404 or isn't accessible.</p>
      <p><strong>The Fix:</strong> Verify the sitemap URL is correct. Common locations are <code>/sitemap.xml</code>, <code>/sitemap_index.xml</code>, or <code>/sitemap/sitemap.xml</code>. Submit the correct URL to Google Search Console.</p>

      <h3>2. Off-Domain URLs</h3>
      <p><strong>The Problem:</strong> Sitemap contains URLs from different domains.</p>
      <p><strong>The Fix:</strong> Sitemaps should only contain URLs from the same domain. Remove off-domain URLs or create separate sitemaps for each domain.</p>

      <h3>3. Duplicate URLs</h3>
      <p><strong>The Problem:</strong> The same URL appears multiple times in the sitemap.</p>
      <p><strong>The Fix:</strong> Remove duplicates to avoid confusion. Most CMS platforms should handle this automatically.</p>

      <h3>4. Future lastmod Dates</h3>
      <p><strong>The Problem:</strong> <code>lastmod</code> dates in the future confuse search engines.</p>
      <p><strong>The Fix:</strong> Ensure lastmod dates are accurate and not set to future dates.</p>

      <h3>5. Invalid Priority Values</h3>
      <p><strong>The Problem:</strong> Priority values outside the 0.0-1.0 range.</p>
      <p><strong>The Fix:</strong> Use valid priority values between 0.0 and 1.0.</p>

      <h2>Best Practices for XML Sitemaps</h2>

      <h3>1. Keep Sitemaps Updated</h3>
      <p>Automatically regenerate sitemaps when content changes. Most modern CMS platforms (WordPress, Shopify, etc.) generate sitemaps automatically and keep them updated.</p>

      <h3>2. Submit to Google Search Console</h3>
      <p>Submit your sitemap URL in Google Search Console to help Google discover and index your content faster.</p>

      <h3>3. Use Sitemap Indexes for Large Sites</h3>
      <p>For sites with more than 50,000 URLs, use sitemap index files to organize your sitemaps logically.</p>

      <h3>4. Include Only Indexable URLs</h3>
      <p>Only include URLs that return 200 OK and are meant to be indexed. Avoid including URLs with noindex tags, canonical to other pages, or 4xx/5xx status codes.</p>

      <h3>5. Include Images and Videos</h3>
      <p>Use specialized sitemap extensions for images and videos to help Google discover rich media content.</p>

      <h2>Keeping Your Sitemap Accurate</h2>
      <p>The most damaging thing you can do with a sitemap is include URLs that return errors. If your sitemap lists 500 URLs and 200 of them return 404 errors, you're explicitly pointing Google to broken pages. This wastes crawl budget and signals poor site maintenance. Most modern CMS platforms generate sitemaps automatically and keep them updated, but it's worth auditing periodically to make sure only live, indexable pages are included. Use our <strong>Sitemap Checker</strong> to quickly scan any domain's sitemap and catch issues before they affect your crawl efficiency.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Domain Check</h3>
      <p>Enter any domain to automatically discover the sitemap. The tool checks common locations like <code>/sitemap.xml</code> and <code>/sitemap_index.xml</code>.</p>

      <h3>Direct Sitemap URL Check</h3>
      <p>Enter a specific sitemap URL for direct validation. This is useful for verifying individual sitemaps in a sitemap index.</p>

      <h3>Post-Update Verification</h3>
      <p>After updating your sitemap, use our tool to verify it's valid. Combine with our <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> to ensure pages are being indexed.</p>

      <h2>Monitoring Sitemaps Over Time</h2>
      <p>Regular monitoring with our <strong>Sitemap Checker</strong> helps you:</p>
      <ul>
        <li>Detect sitemap issues introduced during updates</li>
        <li>Verify all important pages are included</li>
        <li>Identify broken or duplicate URLs</li>
        <li>Maintain <strong>mobile-friendly websites</strong> with proper sitemaps</li>
        <li>Protect your crawl efficiency</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> and <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> for comprehensive crawl management.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Sitemap Checker?</h3>
      <p>A <strong>Sitemap Checker</strong> is a tool that validates XML sitemaps, checks for errors, counts URLs, and identifies common issues like duplicates, off-domain URLs, and invalid priority values.</p>

      <h3>Why do I need a sitemap?</h3>
      <p>Sitemaps help search engines discover your content, especially on larger sites where some pages might be several clicks away from the homepage. They also provide metadata like last modification dates.</p>

      <h3>What is the maximum size of a sitemap?</h3>
      <p>A single XML sitemap file has a maximum limit of 50,000 URLs and 50 MB (uncompressed). For larger sites, use sitemap index files.</p>

      <h3>How do I submit my sitemap to Google?</h3>
      <p>Submit your sitemap URL through Google Search Console under the "Sitemaps" section. This helps Google discover and index your content faster.</p>

      <h3>What should I include in my sitemap?</h3>
      <p>Include only canonical, indexable pages that return 200 OK. Avoid including URLs with noindex tags, canonical to other pages, or 4xx/5xx status codes.</p>

      <h2>Conclusion</h2>
      <p>XML sitemaps are essential infrastructure for ensuring search engines discover and index your content efficiently. Our <strong>Sitemap Checker</strong> provides the detailed validation you need to identify issues and maintain a healthy sitemap.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, regular sitemap validation is essential for maintaining search visibility. Use our <strong>Sitemap Checker</strong> as part of your routine maintenance to catch issues early and maintain strong search presence.</p>

      <p>Start validating your sitemap today—use our <strong>Sitemap Checker</strong> to audit your site, identify issues, and ensure your content is properly discoverable by search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Sitemap Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> - Check indexing status</li>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Verify server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Analyze redirect chains</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize your content</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
      </ul>

      <p>For further reading on sitemaps and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview" target="_blank" rel="noopener noreferrer">Google Search Central: Sitemaps</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap" target="_blank" rel="noopener noreferrer">Google Search Central: Build a Sitemap</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/sitemap-index" target="_blank" rel="noopener noreferrer">Google Search Central: Sitemap Index</a></li>
        <li><a href="https://www.semrush.com/blog/xml-sitemap/" target="_blank" rel="noopener noreferrer">Semrush XML Sitemap Guide</a></li>
        <li><a href="https://moz.com/learn/seo/xml-sitemap" target="_blank" rel="noopener noreferrer">Moz XML Sitemap Guide</a></li>
      </ul>
    </article>
  );
}