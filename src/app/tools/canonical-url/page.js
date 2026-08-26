"use client";
import { useState } from 'react';
import Link from 'next/link';

const SEVERITY_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEVERITY_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

const VERDICT_LABEL = {
  'self-referencing': '✅ Self-referencing canonical',
  'cross-page': '🔄 Canonical points to another URL',
  'no-canonical': '⚠️ No canonical declared',
};

export default function CanonicalUrlCheckerPage() {
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
      const res = await fetch('/api/tools/canonical-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>🔗 Canonical URL Checker</h1>
      </div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="https://example.com/page or example.com/page"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Checking…' : '🔍 Check Canonical'}
          </button>
        </form>
        <p className="tool-description">
          🔍 We inspect the page's HTML <code>&lt;link rel="canonical"&gt;</code> tag, parse
          its HTTP <code>Link</code> header, follow the canonical target one hop, and detect conflicts —
          duplicate tags, mismatched HTML/header values, redirect chains, noindex collisions, and loops.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { summary, verdict, primaryCanonical, htmlCanonicals, htmlCanonicalsRaw, linkHeaderCanonicals, target, checks, redirectChain, finalUrl, title, metaRobots, xRobotsTag, contentType, httpStatus } = data;

  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : (verdict === 'self-referencing' ? 'success' : 'warning');
  const bannerText = summary.fail
    ? `❌ ${summary.fail} blocking issue${summary.fail === 1 ? '' : 's'} — ${VERDICT_LABEL[verdict]}`
    : verdict === 'self-referencing'
      ? '✅ Self-referencing canonical — best-practice setup'
      : verdict === 'cross-page'
        ? '🔄 Canonical points to another URL'
        : '⚠️ No canonical declared';

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· ✅ {summary.pass} pass · ⚠️ {summary.warn} warn · ❌ {summary.fail} fail · ℹ️ {summary.info} info</span>
      </div>

      <div className="canonical-flow" style={{ width: '100%' }}>
        <div className="canonical-flow-card">
          <div className="canonical-flow-label">📍 Requested URL</div>
          <div className="result-value-mono">{data.url}</div>
        </div>
        <div className="canonical-flow-arrow" aria-hidden="true">➡️</div>
        <div className="canonical-flow-card">
          <div className="canonical-flow-label">📍 Final URL after redirects</div>
          <div className="result-value-mono">{finalUrl}</div>
          <div className="canonical-flow-meta">HTTP {httpStatus}{redirectChain.length > 1 ? ` · 🔄 ${redirectChain.length - 1} redirect${redirectChain.length === 2 ? '' : 's'}` : ''}</div>
        </div>
        <div className="canonical-flow-arrow" aria-hidden="true">➡️</div>
        <div className={`canonical-flow-card canonical-flow-canonical verdict-${verdict}`}>
          <div className="canonical-flow-label">📌 Canonical declared</div>
          <div className="result-value-mono">{primaryCanonical || <em className="muted">— none —</em>}</div>
          <div className="canonical-flow-meta">{VERDICT_LABEL[verdict]}</div>
        </div>
      </div>

      <h3 className="result-section-title">📋 Sources</h3>
      <div className="result-grid" style={{ width: '100%' }}>
        <div className="result-item">
          <span className="result-label">📝 HTML <code>&lt;link rel="canonical"&gt;</code></span>
          <span className="result-value-mono">
            {htmlCanonicals.length === 0
              ? <em className="muted">— none —</em>
              : htmlCanonicalsRaw.map((raw, idx) => (
                <div key={idx}>{raw}{raw !== htmlCanonicals[idx] && <span className="canonical-resolved"> → {htmlCanonicals[idx]}</span>}</div>
              ))}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">📡 HTTP <code>Link</code> header</span>
          <span className="result-value-mono">
            {linkHeaderCanonicals.length === 0
              ? <em className="muted">— not present —</em>
              : linkHeaderCanonicals.map((u, idx) => <div key={idx}>{u}</div>)}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">📌 Page title</span>
          <span className="result-value">{title || <em className="muted">—</em>}</span>
        </div>
        <div className="result-item">
          <span className="result-label">🤖 Robots meta</span>
          <span className="result-value">{metaRobots || <em className="muted">—</em>}</span>
        </div>
        <div className="result-item">
          <span className="result-label">📡 X-Robots-Tag header</span>
          <span className="result-value">{xRobotsTag || <em className="muted">—</em>}</span>
        </div>
        <div className="result-item">
          <span className="result-label">📄 Content-Type</span>
          <span className="result-value">{contentType || <em className="muted">—</em>}</span>
        </div>
      </div>

      <h3 className="result-section-title">✅ Checks ({checks.length})</h3>
      <ul className="og-check-list">
        {checks.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEVERITY_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head">
                <code className="og-check-tag">{c.tag}</code>
                <span className={`og-check-label sev-${c.severity}`}>{SEVERITY_LABEL[c.severity]}</span>
              </div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>

      {target && <TargetBlock target={target} />}

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">🔄 Redirect chain</h3>
          <ol className="redirect-chain">
            {redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className="redirect-status">HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
                {hop.location && <span className="redirect-location">➡️ {hop.location}</span>}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function TargetBlock({ target }) {
  if (target.error) {
    return (
      <>
        <h3 className="result-section-title">🎯 Canonical target probe</h3>
        <div className="canonical-target-error">
          <strong>❌ Could not reach the canonical target.</strong>
          <div style={{ marginTop: 6 }} className="result-value-mono">{target.requested}</div>
          <div style={{ marginTop: 6 }}>{target.error}</div>
        </div>
      </>
    );
  }
  return (
    <>
      <h3 className="result-section-title">🎯 Canonical target probe</h3>
      <div className="canonical-target" style={{ width: '100%' }}>
        <div className="result-grid" style={{ width: '100%' }}>
          <div className="result-item">
            <span className="result-label">🎯 Target URL</span>
            <span className="result-value-mono">{target.requested}</span>
          </div>
          <div className="result-item">
            <span className="result-label">📍 Final URL (after target redirects)</span>
            <span className="result-value-mono">{target.finalUrl}</span>
          </div>
          <div className="result-item">
            <span className="result-label">📊 HTTP status</span>
            <span className="result-value">{target.httpStatus}</span>
          </div>
          <div className="result-item">
            <span className="result-label">📄 Content-Type</span>
            <span className="result-value">{target.contentType || '—'}</span>
          </div>
          <div className="result-item">
            <span className="result-label">📌 Target page title</span>
            <span className="result-value">{target.title || '—'}</span>
          </div>
          <div className="result-item">
            <span className="result-label">📌 Target's own canonical</span>
            <span className="result-value-mono">
              {target.htmlCanonicals[0] || target.linkHeaderCanonicals[0] || <em className="muted">— none —</em>}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">🤖 Target robots</span>
            <span className="result-value">{target.metaRobots || target.xRobotsTag || <em className="muted">—</em>}</span>
          </div>
        </div>
        {target.redirectChain && target.redirectChain.length > 1 && (
          <>
            <div className="canonical-target-subtitle">🔄 Target redirect chain</div>
            <ol className="redirect-chain">
              {target.redirectChain.map((hop, idx) => (
                <li key={idx}>
                  <span className="redirect-status">HTTP {hop.status}</span>
                  <span className="result-value-mono">{hop.url}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Canonical URL Architecture: Preventing Duplicate Content & Consolidating Equity</h2>
      <p>
        The canonical link element (<code>&lt;link rel="canonical" href="..." /&gt;</code>), standardized under <a href="https://www.rfc-editor.org/rfc/rfc6596.html" target="_blank" rel="noopener noreferrer">IETF RFC 6596</a>, informs search engines which URL represents the authoritative "master" version of duplicate or near-identical pages.
      </p>

      <h2>Why Canonicalization is Crucial for Technical SEO</h2>

      <p>
        The same page content is frequently accessible via multiple URL variations:
      </p>
      <ul>
        <li>Protocol and host variations: <code>http://example.com</code> vs <code>https://example.com</code> vs <code>https://www.example.com</code></li>
        <li>Trailing slash variations: <code>/about</code> vs <code>/about/</code></li>
        <li>Query and tracking parameters: <code>/product?color=blue&amp;sort=price</code> vs <code>/product</code> vs <code>/product?utm_source=newsletter</code></li>
        <li>Pagination and filter matrices in e-commerce catalogs</li>
      </ul>

      <p>
        Without explicit canonical tags, search engine crawlers split PageRank equity across variations and may choose an unintended URL to index.
      </p>

      <h2>Implementation Methods</h2>

      <h3>1. HTML <code>&lt;head&gt;</code> Element</h3>
      <pre className="code-pre">
        <code>{`<!-- Place in the <head> of https://example.com/blog/article-name/ -->
<link rel="canonical" href="https://example.com/blog/article-name" />`}</code>
      </pre>

      <h3>2. HTTP <code>Link</code> Response Header (For PDFs & Downloads)</h3>
      <p>
        For non-HTML resources (such as whitepapers or PDF documents), declare the canonical version in the HTTP response headers:
      </p>
      <pre className="code-pre">
        <code>{`Link: <https://example.com/whitepapers/seo-guide.html>; rel="canonical"`}</code>
      </pre>

      <h2>Self-Referencing vs. Cross-Domain Canonicals</h2>

      <h3>Self-Referencing Canonicals (Standard Practice)</h3>
      <p>
        Every unique, indexable page should include a self-referencing canonical pointing to its own clean, parameterized-free URL. This ensures that if scrapers, tracking links, or session IDs append parameters, search engines recognize the clean original.
      </p>

      <h3>Cross-Domain Canonicals (Content Syndication)</h3>
      <p>
        If you syndicate articles to Medium, Substack, or partner blogs, a cross-domain canonical pointing back to your original domain passes search ranking credit to your website and prevents the syndication partner from outranking your original article.
      </p>

      <h2>Critical Implementation Traps</h2>

      <ul>
        <li>
          <strong>Canonical + Noindex Conflict:</strong> Never put <code>rel="canonical"</code> to URL A and <code>noindex</code> on the same page. The directives contradict each other and cause search engines to ignore the canonical signal.
        </li>
        <li>
          <strong>Canonical Pointing to a Redirect:</strong> The canonical target must return an immediate <code>200 OK</code>. If the target returns a 301/302, search engines must follow a chain (check with our <Link href="/tools/redirect-checker">Redirect Checker</Link>).
        </li>
        <li>
          <strong>Relative vs. Absolute URLs:</strong> Always specify the complete absolute URL including <code>https://</code>. Relative paths like <code>href="/product"</code> can resolve incorrectly during site migrations or CDN proxying.
        </li>
        <li>
          <strong>Multiple Canonical Tags:</strong> If HTML contains more than one canonical tag (often caused by CMS plugins conflicting with themes), Google ignores all canonical tags on the page.
        </li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Is the canonical tag a directive or a hint?</h3>
      <p>
        Google treats <code>rel="canonical"</code> as a strong hint rather than a strict directive. If Google detects that the canonical target differs drastically in content, or if other signals (internal links, sitemaps, redirects) contradict it, Google may select a different canonical URL.
      </p>

      <h3>Should paginated pages canonicalize to page 1?</h3>
      <p>
        No. Paginated pages (e.g. <code>/blog?page=2</code>) should have self-referencing canonicals to their own URL, or canonicalize to a "View All" page if one exists. Canonicalizing page 2 to page 1 causes Googlebot to stop indexing content listed on subsequent pages.
      </p>

      <h3>What is the difference between a 301 redirect and a canonical tag?</h3>
      <p>
        A 301 redirect automatically forwards human users and search bots to a new destination URL. A canonical tag leaves the page visible to users while telling search engine crawlers to credit ranking signals to the canonical destination.
      </p>
    </article>
  );
}