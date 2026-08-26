"use client";
import { useState } from 'react';
import Link from 'next/link';
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
      <h2>XML Sitemap Protocol & Indexation Best Practices</h2>
      <p>
        An XML sitemap acts as an explicit indexation roadmap for search engines. It provides search engine crawlers with a structured directory of canonical URLs, modification timestamps (<code>&lt;lastmod&gt;</code>), and optional media extensions (images, videos, or news articles).
      </p>

      <h2>Sitemap Protocol Specifications & Limits</h2>

      <p>
        Standardized under the <a href="https://www.sitemaps.org/protocol.html" target="_blank" rel="noopener noreferrer">Sitemaps.org standard</a> and supported by all major search engines:
      </p>

      <ul>
        <li><strong>Single File Limit:</strong> A standard <code>&lt;urlset&gt;</code> can contain a maximum of <strong>50,000 URLs</strong> and cannot exceed <strong>50 MB</strong> uncompressed.</li>
        <li><strong>Compression:</strong> Sitemaps can be gzip-compressed (e.g., <code>sitemap.xml.gz</code>) to save server bandwidth; search engines automatically decompress them.</li>
        <li><strong>Character Encoding:</strong> Must use UTF-8 encoding with entity escaping (e.g., <code>&amp;amp;</code> for <code>&amp;</code>, <code>&amp;quot;</code> for <code>&quot;</code>).</li>
      </ul>

      <h2>Sitemap Index Architecture (<code>&lt;sitemapindex&gt;</code>)</h2>
      <p>
        Websites containing more than 50,000 URLs, or with distinct content categories, must split records across multiple sitemap files referenced by a parent sitemap index:
      </p>
      <pre className="code-pre">
        <code>{`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.example.com/sitemap-posts.xml</loc>
    <lastmod>2026-08-20T10:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://www.example.com/sitemap-products.xml</loc>
    <lastmod>2026-08-25T14:30:00+00:00</lastmod>
  </sitemap>
</sitemapindex>`}</code>
      </pre>

      <h2>The Critical Role of <code>&lt;lastmod&gt;</code></h2>
      <p>
        Google officially disregards <code>&lt;priority&gt;</code> and <code>&lt;changefreq&gt;</code> tags because webmasters historically inflated them. However, Google <strong>actively uses the <code>&lt;lastmod&gt;</code> timestamp</strong> to determine whether content has been modified and requires re-crawling.
      </p>
      <p>
        <strong>Rule:</strong> Only update <code>&lt;lastmod&gt;</code> when meaningful content changes occur. Setting all URLs to today's date automatically will cause search engines to distrust your timestamps.
      </p>

      <h2>Common Sitemap Errors & How to Fix Them</h2>

      <h3>1. Including Non-Canonical or Redirecting URLs</h3>
      <p>
        A sitemap should strictly contain <strong>HTTP 200 indexable canonical URLs</strong>. Never include URLs that return:
      </p>
      <ul>
        <li>301/302 redirects (verify with our <Link href="/tools/redirect-checker">Redirect Checker</Link>)</li>
        <li>404/410 errors (verify with our <Link href="/tools/http-status">HTTP Status Checker</Link>)</li>
        <li>URLs marked with <Link href="/tools/noindex-checker">noindex directives</Link></li>
        <li>URLs with cross-page <Link href="/tools/canonical-url">canonical tags</Link> pointing elsewhere</li>
      </ul>

      <h3>2. Off-Domain URL Declarations</h3>
      <p>
        Sitemaps cannot contain URLs on domains or subdomains other than the one hosting the sitemap, unless cross-domain ownership is verified inside search engine webmaster tools.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>Where should I place my sitemap?</h3>
      <p>
        Place your main sitemap at the domain root (e.g., <code>https://example.com/sitemap.xml</code>) and reference its absolute URL inside your <Link href="/tools/robots-txt">robots.txt</Link> file using the <code>Sitemap:</code> directive.
      </p>

      <h3>How do I submit my sitemap to Google?</h3>
      <p>
        Log into Google Search Console, navigate to <strong>Index &gt; Sitemaps</strong>, enter your sitemap filename, and click Submit. This triggers Googlebot to queue the file for parsing.
      </p>

      <h3>Does having a sitemap guarantee that all my pages will be indexed?</h3>
      <p>
        No. A sitemap assists in URL discovery, but search engines ultimately determine indexation based on content quality, technical accessibility, and authority. Use our <Link href="/tools/google-index">Google Index Checker</Link> to inspect specific URL indexation signals.
      </p>
    </article>
  );
}