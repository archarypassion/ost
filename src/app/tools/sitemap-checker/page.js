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
      <div className="tool-header"><h1>XML Sitemap Checker</h1></div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter domain or sitemap URL (e.g. example.com or example.com/sitemap.xml)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Analyzing...' : 'Check Sitemap'}
          </button>
        </form>
        <p className="tool-description">
          Fetches the sitemap, validates the XML, counts URLs, expands sitemap indexes, supports gzip, and flags
          common issues (duplicates, off-domain URLs, future <code>lastmod</code> dates, invalid priority, oversize files).
        </p>

        {error && <div className="result-error">{error}</div>}

        {data && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>XML Sitemaps: Your Blueprint for Getting Every Page Discovered and Indexed</h2>
          <p>An XML sitemap is essentially a roadmap you hand to search engines, saying "here are all the important pages on my website, and here's some additional context about each one." It doesn't guarantee that every URL in your sitemap will be crawled or indexed — Google makes its own decisions about that — but it dramatically increases the likelihood that your pages will be discovered, especially on larger sites where some content might be several clicks away from the homepage and therefore harder for crawlers to find through link following alone.</p>
          <p>For small websites with a handful of pages, a sitemap is less critical — Google will usually find all your content through normal crawling. But for sites with hundreds or thousands of pages, a well-structured XML sitemap is genuinely essential infrastructure.</p>
          <h3>The Basic Structure of an XML Sitemap</h3>
          <p>At its simplest, an XML sitemap is a list of URLs wrapped in XML markup. Each URL entry (called a <code>&lt;url&gt;</code> element) contains at minimum the page's location (<code>&lt;loc&gt;</code>) and optionally includes metadata like the last modification date (<code>&lt;lastmod&gt;</code>), how frequently the page changes (<code>&lt;changefreq&gt;</code>), and the page's priority relative to other pages on the site (<code>&lt;priority&gt;</code>).</p>
          <p>However, be aware that Google has publicly stated it largely ignores <code>changefreq</code> and <code>priority</code> values in sitemaps because site owners routinely set them inaccurately (everyone marks everything as high priority). The <code>lastmod</code> date, on the other hand, is actively used by Google — if it's accurate and consistent, it helps Googlebot prioritize re-crawling updated content more efficiently.</p>
          <h3>Sitemap Index Files</h3>
          <p>A single XML sitemap file has a maximum limit of 50,000 URLs and 50 MB (uncompressed). Large websites frequently need to split their content across multiple sitemap files. A sitemap index file is a special sitemap that simply lists the locations of all your individual sitemap files. This lets you have a main entry point at <code>/sitemap.xml</code> that search engines can reference, while your actual URL lists are organized into logical sub-sitemaps — one for blog posts, one for product pages, one for category pages, and so on.</p>
          <h3>Specialized Sitemaps: Images and Videos</h3>
          <p>Beyond standard page sitemaps, Google supports specialized sitemap extensions for images and videos. An image sitemap tells Google about images embedded in your pages that it might miss during normal crawling — particularly images loaded via JavaScript or displayed in ways that aren't easily parseable from the HTML source. A video sitemap provides metadata about video content including title, description, thumbnail URL, and duration, helping Google Surface your videos in video search results.</p>
          <h3>Keeping Your Sitemap Accurate</h3>
          <p>The most damaging thing you can do with a sitemap is include URLs that return errors. If your sitemap lists 500 URLs and 200 of them return 404 errors, you're explicitly pointing Google to broken pages. This wastes crawl budget and signals poor site maintenance. Most modern CMS platforms (WordPress, Shopify, etc.) generate sitemaps automatically and keep them updated, but it's worth auditing periodically to make sure only live, indexable pages are included. Use our XML Sitemap Checker to quickly scan any domain's sitemap and catch issues before they affect your crawl efficiency.</p>
        </article>
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  let bannerClass, BannerIcon, headline;
  if (!data.found) {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = data.message || `Sitemap not found (HTTP ${data.httpStatus}).`;
  } else if (data.summary?.issues?.some((i) => i.severity === 'error')) {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = `Sitemap parsed with errors — ${data.summary.urlCount} URLs.`;
  } else if (data.type === 'sitemapindex') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = `Sitemap index — ${data.childSitemaps.length} child sitemap${data.childSitemaps.length === 1 ? '' : 's'}.`;
  } else {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = `Sitemap valid — ${data.summary.urlCount.toLocaleString()} URL${data.summary.urlCount === 1 ? '' : 's'}.`;
  }

  return (
    <div className="result-box">
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>{headline}</span>
      </div>

      <div>
        <div className="result-section-title">Overview</div>
        <div className="result-grid">
          <ResultRow label="Sitemap URL" mono>
            <a href={data.sitemapUrl} target="_blank" rel="noreferrer" className="sitemap-link">
              {data.sitemapUrl}
            </a>
          </ResultRow>
          {data.discoveredVia && (
            <ResultRow label="Discovered via">{data.discoveredVia}</ResultRow>
          )}
          {data.finalUrl && data.finalUrl !== data.sitemapUrl && (
            <ResultRow label="Final URL" mono>{data.finalUrl}</ResultRow>
          )}
          <ResultRow label="HTTP Status"><strong>{data.httpStatus}</strong></ResultRow>
          {data.contentType && <ResultRow label="Content-Type">{data.contentType}</ResultRow>}
          {data.found && <ResultRow label="Type">{prettyType(data.type)}</ResultRow>}
          {data.found && (
            <ResultRow label="Size">
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
              <ResultRow label="Total URLs">{data.summary.urlCount.toLocaleString()}</ResultRow>
              <ResultRow label="Has Images">
                <YesNo on={data.summary.hasImages}>
                  {data.summary.hasImages ? `Yes (${data.summary.totalImages})` : 'No'}
                </YesNo>
              </ResultRow>
              <ResultRow label="Has Videos">
                <YesNo on={data.summary.hasVideos}>
                  {data.summary.hasVideos ? `Yes (${data.summary.totalVideos})` : 'No'}
                </YesNo>
              </ResultRow>
              {data.summary.latestLastmod && (
                <ResultRow label="Latest lastmod">{formatDate(data.summary.latestLastmod)}</ResultRow>
              )}
              {data.summary.earliestLastmod && (
                <ResultRow label="Earliest lastmod">{formatDate(data.summary.earliestLastmod)}</ResultRow>
              )}
            </>
          )}
          {data.found && data.type === 'sitemapindex' && (
            <ResultRow label="Child Sitemaps">{data.childSitemaps.length}</ResultRow>
          )}
        </div>
      </div>

      {data.found && data.summary?.issues?.length > 0 && (
        <div>
          <div className="result-section-title">Issues</div>
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
            Child Sitemaps {data.childSitemapsTruncated && (
              <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-secondary)', fontWeight: 400 }}>
                (showing first 20)
              </span>
            )}
          </div>
          <div className="child-table">
            <div className="child-row head">
              <span>Sitemap</span>
              <span>URLs</span>
              <span>Status</span>
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
            URL Sample <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-secondary)', fontWeight: 400 }}>
              (first {data.sampleUrls.length} of {data.summary.urlCount.toLocaleString()})
            </span>
          </div>
          <div className="url-table">
            <div className="url-table-row head">
              <span>URL</span>
              <span>Lastmod</span>
              <span>Imgs</span>
              <span>Videos</span>
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
          <div className="result-section-title">Redirect Chain</div>
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
