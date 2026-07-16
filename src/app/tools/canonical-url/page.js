"use client";
import { useState } from 'react';

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
      <h2>Canonical URLs: How to Solve Duplicate Content Without Losing Rankings</h2>
      <p>The same content reachable from multiple URLs is endemic on the web. Trailing slashes, tracking parameters, HTTP vs HTTPS, www vs non-www, print and AMP variants — all create technical duplicates. The <code>&lt;link rel="canonical"&gt;</code> tag is how you tell Google which URL to treat as the master copy and consolidate ranking signals to.</p>

      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls" target="_blank" rel="noopener noreferrer">Google Search Central</a>, proper canonicalization is essential for consolidating link signals and preventing duplicate content issues. Our <strong>Canonical URL Checker</strong> helps you identify and fix canonicalization issues before they impact your <strong>mobile SEO</strong> and <strong>Core Web Vitals</strong>.</p>

      <h2>What This Tool Does</h2>
      <p>Paste any URL above. We follow redirects, parse every canonical signal on the page, and then probe the canonical target itself — fetching it, reading its own canonical, and reporting whether the chain stops cleanly. Run it on key landing pages, on URL variations (<code>example.com</code> vs <code>example.com/</code> vs <code>www.example.com</code>) and on parameterised URLs to catch silent canonicalisation bugs before they cost rankings.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> and <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a>, you can ensure your canonical URLs are properly configured for both users and search engines.</p>

      <h2>Why Canonical URLs Matter for SEO</h2>

      <h3>1. Consolidating Link Signals</h3>
      <p>When duplicate content exists across multiple URLs, link equity (PageRank) gets divided. A canonical URL consolidates all signals to a single master URL, maximizing ranking potential. <a href="https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls" target="_blank" rel="noopener noreferrer">Google recommends</a> using canonical tags to indicate the preferred version.</p>

      <h3>2. Preventing Duplicate Content Issues</h3>
      <p>Search engines may penalize sites with significant duplicate content. Canonical tags help you control which version appears in search results, preventing duplicate content dilution.</p>

      <h3>3. Mobile-First Indexing</h3>
      <p>With <strong>mobile-first indexing</strong>, Google primarily crawls and indexes the mobile version. Proper canonicalization ensures the correct mobile URL receives ranking credit. Our <a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> can help ensure your mobile pages are properly configured.</p>

      <h2>Understanding Canonical URL Types</h2>

      <h3>1. Self-Referencing Canonical (Best Practice)</h3>
      <p>A self-referencing canonical — where every page declares its own URL as canonical — is best practice. It explicitly signals "this is the original version" and protects you if Google later finds the same content on a syndication partner or under a tracking parameter.</p>

      <h3>2. Cross-Page Canonical</h3>
      <p>When a page declares a different URL as its canonical, it's a cross-page canonical. This is useful for consolidating similar pages, but ensure the target page is the most authoritative version.</p>

      <h3>3. No Canonical Declared</h3>
      <p>Pages without a canonical tag leave Google to choose the canonical URL. This can lead to unexpected results. Use our <strong>Canonical URL Checker</strong> to identify pages missing canonicals.</p>

      <h2>Where Canonicals Come From</h2>
      <p>Most sites use the HTML <code>&lt;link rel="canonical"&gt;</code> tag in the <code>&lt;head&gt;</code>. But canonicals can also be sent via the HTTP <code>Link</code> response header — useful for non-HTML files like PDFs that have no <code>&lt;head&gt;</code> to inject into. We check both sources and flag conflicts when the two disagree (Google ignores the page-level canonical when this happens).</p>

      <h2>Common Canonical Issues and How to Fix Them</h2>

      <h3>1. Multiple Canonical Tags</h3>
      <p><strong>The Problem:</strong> Multiple canonical tags in the same HTML — Google ignores the page-level canonical entirely.</p>
      <p><strong>The Fix:</strong> Ensure only one canonical tag is present on each page. Use our <strong>Canonical URL Checker</strong> to identify duplicates.</p>

      <h3>2. Canonical + Noindex</h3>
      <p><strong>The Problem:</strong> Canonical and noindex on the same page — contradictory signals; Google may drop both.</p>
      <p><strong>The Fix:</strong> Remove noindex from canonicalized pages, or remove the canonical from noindex pages.</p>

      <h3>3. Canonical Points to a Redirect</h3>
      <p><strong>The Problem:</strong> Canonical points to a URL that redirects — Google follows it, but prefers a direct canonical to the final URL.</p>
      <p><strong>The Fix:</strong> Update the canonical to point directly to the final URL, not through a redirect.</p>

      <h3>4. Canonical to 4xx/5xx Pages</h3>
      <p><strong>The Problem:</strong> Canonical points to a page that returns an error — broken canonicalisation; ranking signals are lost.</p>
      <p><strong>The Fix:</strong> Fix the target page or update the canonical to a working URL.</p>

      <h3>5. Canonical Loops</h3>
      <p><strong>The Problem:</strong> Page A → B → A — Google ignores both.</p>
      <p><strong>The Fix:</strong> Break the loop by ensuring the canonical chain ends cleanly at a single URL.</p>

      <h3>6. Cross-Domain Canonicals</h3>
      <p><strong>The Problem:</strong> Canonical points to a different domain — fine for syndication, dangerous when accidental (a copy-pasted template can wipe out a whole site's rankings overnight).</p>
      <p><strong>The Fix:</strong> Only use cross-domain canonicals when intentionally syndicating content. Otherwise, ensure canonicals point to your own domain.</p>

      <h2>Best Practices for Canonical URL Implementation</h2>

      <h3>1. Use Absolute URLs</h3>
      <p>Always use absolute URLs (starting with <code>https://</code>) for canonical tags. Relative URLs can cause confusion and lead to incorrect canonicalization.</p>

      <h3>2. Implement Self-Referencing Canonicals</h3>
      <p>Every page should have a self-referencing canonical tag. This is the safest approach and prevents duplicate content issues.</p>

      <h3>3. Keep Canonical Chains Clean</h3>
      <p>Avoid redirect chains in canonical URLs. The canonical should point directly to the final, canonical URL without intermediate redirects.</p>

      <h3>4. Use Consistent URL Format</h3>
      <p>Use consistent URL format (www vs non-www, HTTP vs HTTPS) throughout your site. Our <a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> helps identify inconsistencies.</p>

      <h3>5. Monitor Canonical Changes</h3>
      <p>Regularly monitor canonical URLs using our <strong>Canonical URL Checker</strong>. Changes during site migrations or updates should be verified to ensure they don't break.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Page Checking</h3>
      <p>Enter any URL to check its canonical configuration. The tool follows redirects, parses HTML and HTTP header canonicals, and probes the target page.</p>

      <h3>Test URL Variations</h3>
      <p>Test different URL variations (with/without trailing slash, www, tracking parameters) to ensure all versions canonicalize correctly to the preferred URL.</p>

      <h3>Post-Migration Verification</h3>
      <p>After site migrations, use our tool to verify all canonicals are correct. Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> and <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> for comprehensive verification.</p>

      <h2>Monitoring Canonical URLs Over Time</h2>
      <p>Regular monitoring with our <strong>Canonical URL Checker</strong> helps you:</p>
      <ul>
        <li>Detect canonical changes introduced during updates</li>
        <li>Verify cross-domain canonicals are intentional</li>
        <li>Identify broken canonical targets</li>
        <li>Ensure <strong>mobile-friendly websites</strong> have correct canonicals</li>
        <li>Maintain link equity through proper canonicalization</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> for comprehensive site audits.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Canonical URL Checker?</h3>
      <p>A <strong>Canonical URL Checker</strong> is a tool that analyzes a webpage's canonical configuration. It checks HTML and HTTP header canonicals, follows redirects, and probes the canonical target to ensure proper implementation.</p>

      <h3>How does canonicalization affect SEO?</h3>
      <p>Canonicalization consolidates link signals to a single URL, preventing duplicate content issues and maximizing ranking potential. Proper canonicalization is essential for <strong>mobile SEO</strong> and maintaining search visibility.</p>

      <h3>What is a self-referencing canonical?</h3>
      <p>A self-referencing canonical is when a page declares its own URL as the canonical. This is considered best practice and protects against accidental duplicate content issues.</p>

      <h3>What happens if I have multiple canonical tags?</h3>
      <p>Google ignores the page-level canonical entirely when multiple tags are present. Ensure only one canonical tag per page. Our tool detects and reports multiple canonical tags.</p>

      <h3>Should I use HTTP or HTTPS in canonicals?</h3>
      <p>Always use HTTPS in canonical URLs where available. This ensures secure browsing and aligns with <strong>Core Web Vitals</strong> and <strong>mobile SEO</strong> best practices.</p>

      <h3>What is a canonical loop?</h3>
      <p>A canonical loop occurs when Page A canonicals to Page B, and Page B canonicals back to Page A. Google ignores both canonicals, losing ranking signals. Our tool detects and reports canonical loops.</p>

      <h2>Conclusion</h2>
      <p>Proper canonical URL implementation is fundamental to website health, <strong>mobile SEO</strong>, and search visibility. Our <strong>Canonical URL Checker</strong> provides the detailed analysis you need to identify issues, fix broken canonicals, and maintain a healthy, well-optimized site.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper canonicalization is essential for <strong>Core Web Vitals</strong> and search engine visibility. Use our <strong>Canonical URL Checker</strong> as part of your routine maintenance to catch issues early and maintain a healthy site.</p>

      <p>Start checking your canonical URLs today—use our <strong>Canonical URL Checker</strong> to audit your site, identify issues, and ensure your canonical URLs are properly configured for both users and search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Canonical URL Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Verify server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Analyze redirect chains</li>
        <li><a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> - Optimize metadata</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize content</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Certificate Checker</a> - Ensure secure connections</li>
      </ul>

      <p>For further reading on canonicalization and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls" target="_blank" rel="noopener noreferrer">Google Search Central: Canonicalization</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/rel-canonical" target="_blank" rel="noopener noreferrer">Google Search Central: rel=canonical</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/canonical" target="_blank" rel="noopener noreferrer">MDN rel=canonical Documentation</a></li>
        <li><a href="https://moz.com/learn/seo/canonicalization" target="_blank" rel="noopener noreferrer">Moz Canonicalization Guide</a></li>
        <li><a href="https://www.semrush.com/blog/canonical-tag/" target="_blank" rel="noopener noreferrer">Semrush Canonical Tag Guide</a></li>
      </ul>
    </article>
  );
}