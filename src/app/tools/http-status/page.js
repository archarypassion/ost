"use client";
import { useState } from 'react';

const KIND_CLASS = { success: 'success', redirect: 'warning', 'client-error': 'danger', 'server-error': 'danger', unknown: 'warning' };

export default function HttpStatusPage() {
  const [mode, setMode] = useState('single');
  const [url, setUrl] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [method, setMethod] = useState('GET');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const body = mode === 'bulk'
        ? { method, urls: bulkText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) }
        : { method, url: url.trim() };
      const res = await fetch('/api/tools/http-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok && !json?.results) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl || json?.url) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>HTTP Status Checker</h1></div>
      <div className="tool-card">
        <div className="mode-tabs">
          <button
            type="button"
            className={`mode-tab ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            🔗 Single URL
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
          >
            📋 Bulk Check (up to 25)
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'single' ? (
            <div className="search-bar">
              <input
                type="text"
                placeholder="https://example.com/page"
                className="search-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" className="check-btn" disabled={loading}>
                {loading ? '⏳ Checking…' : '🚀 Check Status'}
              </button>
            </div>
          ) : (
            <div className="bulk-input-area">
              <div className="bulk-header">
                <span className="bulk-label">Enter URLs (one per line)</span>
                <span className="bulk-count">{bulkText.split(/\r?\n/).filter(s => s.trim()).length} / 25 URLs</span>
              </div>
              <textarea
                className="wc-textarea"
                placeholder={`https://example.com/\nhttps://example.com/page2\nhttps://example.com/page3`}
                value={bulkText}
                onChange={(e) => {
                  const lines = e.target.value.split(/\r?\n/).filter(s => s.trim());
                  if (lines.length <= 25) {
                    setBulkText(e.target.value);
                  }
                }}
                required
              />
              <button type="submit" className="check-btn" style={{ marginTop: '0.75rem' }} disabled={loading}>
                {loading ? '⏳ Checking All…' : '🔍 Check All URLs'}
              </button>
            </div>
          )}
        </form>

        <div className="kd-options">
          <label className="kd-top-label">
            <span className="label-text">HTTP Method:</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET (downloads content)</option>
              <option value="HEAD">HEAD (headers only, faster)</option>
            </select>
          </label>
          <span className="method-hint">
            💡 HEAD is faster for large pages
          </span>
        </div>

        <p className="tool-description">
          🔄 Follow redirects, see every hop's status code with timing, and inspect the final response's
          headers. Bulk mode lets you check up to 25 URLs at once — ideal for verifying redirect maps after
          a site migration.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data?.mode === 'single' && <SingleResult d={data} />}
        {data?.mode === 'bulk' && <BulkResult d={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function SingleResult({ d }) {
  if (d.error) {
    return (
      <div className="result-box">
        <div className="result-banner danger"><strong>❌ {d.error}</strong></div>
      </div>
    );
  }
  const kind = d.finalKind;
  return (
    <div className="result-box">
      <div className={`result-banner ${KIND_CLASS[kind]}`}>
        <strong>✅ HTTP {d.finalStatus} {d.finalStatusText}</strong>
        <span>· {d.method} · ⏱️ {d.totalElapsedMs} ms total · 🔄 {d.redirectChain.length - 1} redirect{d.redirectChain.length === 2 ? '' : 's'}</span>
      </div>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">📌 Requested URL</span><span className="result-value-mono">{d.url}</span></div>
        <div className="result-item"><span className="result-label">📍 Final URL</span><span className="result-value-mono">{d.finalUrl}</span></div>
        <div className="result-item"><span className="result-label">💡 What this means</span><span className="result-value">{d.finalMeaning}</span></div>
      </div>

      {d.redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">🔄 Redirect chain ({d.redirectChain.length} hops)</h3>
          <ol className="redirect-chain">
            {d.redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className={`status-pill kind-${KIND_CLASS[statusKindClient(hop.status)]}`}>HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
                <span className="redirect-meta">⏱️ {hop.elapsedMs} ms{hop.location ? ` → ${hop.location}` : ''}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <h3 className="result-section-title">📋 Final response headers ({d.finalHeaders.length})</h3>
      <div className="header-list">
        {d.finalHeaders.map((h, idx) => (
          <div key={idx} className="header-row">
            <code className="header-name">{h.name}</code>
            <span className="header-value">{h.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkResult({ d }) {
  return (
    <div className="result-box">
      <div className="result-banner success">
        <strong>✅ {d.count} URL{d.count === 1 ? '' : 's'} checked</strong>
        <span>
          {' '}· ✅ {d.counts.success || 0} OK · 🔄 {d.counts.redirect || 0} redirect · ❌ {d.counts['client-error'] || 0} 4xx · ⚠️ {d.counts['server-error'] || 0} 5xx · ❌ {d.counts.errors || 0} errors
        </span>
      </div>
      <div className="bulk-list">
        {d.results.map((r, idx) => (
          <div key={idx} className="bulk-row">
            {r.error ? (
              <>
                <span className="status-pill kind-danger">❌ ERR</span>
                <span className="result-value-mono">{r.url}</span>
                <span className="bulk-error">⚠️ {r.error}</span>
              </>
            ) : (
              <>
                <span className={`status-pill kind-${KIND_CLASS[r.finalKind]}`}>{r.finalStatus}</span>
                <span className="result-value-mono">{r.url}</span>
                <span className="bulk-meta">
                  ⏱️ {r.totalElapsedMs} ms{r.redirectChain.length > 1 ? ` · 🔄 ${r.redirectChain.length - 1} redirect${r.redirectChain.length === 2 ? '' : 's'}` : ''}
                  {r.finalUrl !== r.url ? ` → ${r.finalUrl}` : ''}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function statusKindClient(s) {
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTTP Status Codes: A Practical Guide for SEO and Website Health</h2>
      <p>Every web request returns a three-digit status code. They're invisible to ordinary users but they decide whether search engines can index a page and whether visitors get the experience you intend. Understanding HTTP status codes is essential for maintaining a <strong>mobile-friendly website</strong> and ensuring optimal <strong>mobile SEO</strong> performance.</p>

      <p>According to <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status" target="_blank" rel="noopener noreferrer">MDN Web Docs</a>, HTTP status codes are standardized responses from servers that indicate the result of a client's request. Proper status code implementation is crucial for <strong>Core Web Vitals</strong> and overall site health.</p>

      <h2>What This Tool Does</h2>
      <p>Our <strong>HTTP Status Checker</strong> follows redirects, shows every hop's status code with timing, and displays the final response headers. Single URL mode is perfect for debugging specific pages, while bulk mode lets you check up to 25 URLs at once — ideal for verifying redirect maps after a site migration.</p>

      <p>This tool is essential for any SEO audit. Combined with our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a>, you can ensure your redirect chains are optimized for both users and search engines.</p>

      <h2>The Codes That Matter Most</h2>

      <h3>200 OK — The Gold Standard</h3>
      <p>The <strong>200 OK</strong> status code is what every live page should return. It indicates that the request was successful and the server has returned the requested content. For <strong>mobile-friendly websites</strong>, ensuring all important pages return 200 is essential for <strong>mobile SEO</strong>.</p>

      <h3>301 Moved Permanently — SEO's Best Friend</h3>
      <p>The <strong>301</strong> permanent redirect passes the vast majority of ranking signals from the old URL to the new one. According to <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google Search Central</a>, 301 redirects are the preferred method for permanently moving content.</p>

      <h3>302 Found / 307 Temporary Redirect — Use with Caution</h3>
      <p>These temporary redirects should only be used when the move is genuinely temporary. Unlike 301 redirects, they don't pass full link equity. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to identify temporary redirects that should be permanent.</p>

      <h3>308 Permanent Redirect — Method Preserving</h3>
      <p>The <strong>308</strong> permanent redirect is similar to 301 but preserves the HTTP method (POST stays POST). It's less common but increasingly supported.</p>

      <h3>404 Not Found — Manage Your Broken Links</h3>
      <p>Having a few 404s is normal on any large site. However, many 404s on previously ranking URLs represent lost value. Use our <a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> to identify broken internal links and fix them.</p>

      <h3>410 Gone — The Explicit "Gone" Signal</h3>
      <p>The <strong>410</strong> status code explicitly tells search engines that the content has been permanently removed. According to <a href="https://developers.google.com/search/docs/crawling-indexing/remove-content" target="_blank" rel="noopener noreferrer">Google's documentation</a>, Google drops 410 pages faster than 404s.</p>

      <h3>500 / 502 / 503 — Server-Side Problems</h3>
      <p>These server error codes indicate problems on the server side. If Googlebot sees these frequently, your crawl rate will drop. Monitor these with our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> and address issues promptly.</p>

      <h2>How HTTP Status Codes Impact SEO</h2>

      <h3>1. Crawl Budget and Indexing</h3>
      <p>Search engines allocate a crawl budget to each site. Status codes like 404, 410, and 500 waste crawl budget and slow down indexing of valuable content. By using our <strong>HTTP Status Checker</strong>, you can identify and fix these issues.</p>

      <h3>2. Link Equity and PageRank</h3>
      <p>Proper 301 redirects pass link equity (PageRank) from the old URL to the new one. Incorrect use of 302 or meta refresh can dilute this value. Our tool helps you verify your redirect implementation.</p>

      <h3>3. User Experience and Mobile SEO</h3>
      <p>Broken links and server errors create poor user experiences, leading to higher bounce rates. This negatively impacts <strong>Core Web Vitals</strong> and <strong>mobile SEO</strong> performance. <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a> emphasizes the importance of reliable server responses.</p>

      <h3>4. Mobile-First Indexing</h3>
      <p>With <strong>mobile-first indexing</strong>, Google primarily crawls and indexes the mobile version of your site. If mobile pages return errors or incorrect redirects, your rankings will suffer. Use our tool to verify your mobile URLs are responding correctly.</p>

      <h2>Common HTTP Status Issues and Solutions</h2>

      <h3>1. Unintended 301 Redirects</h3>
      <p><strong>The Problem:</strong> Permanent redirects that were meant to be temporary.</p>
      <p><strong>The Fix:</strong> Review your redirects and change 301s to 302/307 for temporary changes. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to audit your redirect configuration.</p>

      <h3>2. Redirect Chains</h3>
      <p><strong>The Problem:</strong> Multiple redirects (e.g., URL A → B → C) slow down page loads.</p>
      <p><strong>The Fix:</strong> Update your redirects to point directly to the final destination. Use our <strong>HTTP Status Checker</strong> to identify chains and our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> to measure the impact.</p>

      <h3>3. Soft 404 Errors</h3>
      <p><strong>The Problem:</strong> Pages that return 200 but display a "not found" message.</p>
      <p><strong>The Fix:</strong> Ensure missing pages return proper 404 or 410 status codes. <a href="https://developers.google.com/search/docs/crawling-indexing/http-errors" target="_blank" rel="noopener noreferrer">Google's guidelines</a> recommend proper status codes for error pages.</p>

      <h3>4. Mixed HTTP/HTTPS Statuses</h3>
      <p><strong>The Problem:</strong> Some pages load over HTTP while others use HTTPS.</p>
      <p><strong>The Fix:</strong> Implement 301 redirects from HTTP to HTTPS for all pages. Verify with our <a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Checker</a> and <a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a>.</p>

      <h2>Best Practices for HTTP Status Implementation</h2>

      <h3>1. Use 301 Redirects for Permanent Moves</h3>
      <p>When moving content permanently, use 301 redirects to preserve SEO value. Google recommends 301 for permanent moves according to <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google Search Central</a>.</p>

      <h3>2. Minimize Redirect Chains</h3>
      <p>Each redirect adds latency. Keep redirect chains to a maximum of 3 hops, and ideally zero. Our <strong>HTTP Status Checker</strong> shows you every hop in the chain.</p>

      <h3>3. Implement Proper 404 Pages</h3>
      <p>Return a 404 status code for missing pages, and include helpful navigation to guide users to relevant content. This improves user experience while accurately signaling page status to search engines.</p>

      <h3>4. Monitor Server Errors</h3>
      <p>Regularly check for 500-level errors. These indicate server problems that need immediate attention. Use our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> as part of your monitoring routine.</p>

      <h3>5. Set Correct Canonical URLs</h3>
      <p>Even with proper redirects, set canonical URLs to indicate the preferred version. Our <a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> helps verify your canonical implementation.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single URL Mode</h3>
      <p>Perfect for debugging specific pages. Enter a URL, and the tool follows redirects, times each hop, and shows every final response header. Switch the method to HEAD to test without downloading the body — useful for very large pages.</p>

      <h3>Bulk Mode</h3>
      <p>Ideal for sanity-checking a redirect map after a migration. Paste up to 25 URLs and see their status codes at a glance. This is especially useful when combined with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> and <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a>.</p>

      <h2>Monitoring Status Codes Over Time</h2>
      <p>Regular monitoring with our <strong>HTTP Status Checker</strong> helps you:</p>
      <ul>
        <li>Detect broken links before they impact users</li>
        <li>Verify redirect chains remain optimized</li>
        <li>Identify server errors early</li>
        <li>Maintain SEO value through proper redirects</li>
        <li>Ensure <strong>mobile-friendly websites</strong> are fully accessible</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive site audits.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is an HTTP Status Checker?</h3>
      <p>An <strong>HTTP Status Checker</strong> is a tool that examines the status codes returned by web servers for specific URLs. It follows redirects, shows timing information, and provides detailed information about the final response.</p>

      <h3>How does HTTP status affect SEO?</h3>
      <p>HTTP status codes directly impact <strong>mobile SEO</strong> by influencing crawlability, indexation, and link equity. Proper status codes (200, 301) help search engines understand your site structure, while errors (404, 500) can harm rankings and user experience.</p>

      <h3>What's the difference between 301 and 302 redirects?</h3>
      <p><strong>301</strong> redirects are permanent and pass full link equity. <strong>302</strong> redirects are temporary and don't pass full ranking signals. Use 301 for permanent moves and 302 for temporary ones. Our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> can help identify which type you're using.</p>

      <h3>Are redirect chains bad for SEO?</h3>
      <p>Redirect chains (e.g., A→B→C) can slow down page loads and potentially dilute link equity. They also waste crawl budget. Keep redirects direct and chains minimal. Our <strong>HTTP Status Checker</strong> shows you every hop in the chain.</p>

      <h3>How many redirects are too many?</h3>
      <p>For optimal performance, avoid redirect chains longer than 3 hops. Each redirect adds latency, especially on mobile networks. <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a> recommends minimizing redirects for better <strong>Core Web Vitals</strong>.</p>

      <h3>Should I use 301 or 308 redirects?</h3>
      <p>Both are permanent redirects. The difference is that 308 preserves the HTTP method (POST stays POST), while 301 may change POST to GET. For most SEO purposes, 301 is sufficient and more widely supported.</p>

      <h3>What should I do with 404 pages?</h3>
      <p>For missing pages, return a 404 status code with a helpful user experience (navigation, search). For pages that are permanently gone, consider 410. For pages that have moved, implement 301 redirects. Use our <a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> to identify broken internal links.</p>

      <h3>How do I fix server errors (500, 502, 503)?</h3>
      <p>Server errors indicate problems on your server. Check server logs, increase server resources, optimize database queries, and ensure your hosting can handle traffic spikes. Our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> can help identify performance bottlenecks.</p>

      <h2>Conclusion</h2>
      <p>Understanding and properly implementing HTTP status codes is fundamental to website health, user experience, and <strong>mobile SEO</strong> success. Our <strong>HTTP Status Checker</strong> provides the detailed analysis you need to identify issues, verify redirects, and maintain optimal server responses.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper HTTP status codes are essential for <strong>Core Web Vitals</strong> and search engine visibility. Regular monitoring with our <strong>HTTP Status Checker</strong> helps you catch issues early and maintain a healthy, well-optimized site.</p>

      <p>Start monitoring your HTTP statuses today—use our <strong>HTTP Status Checker</strong> to audit your site, identify issues, and ensure your server is responding correctly to both users and search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>HTTP Status Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Analyze redirect chains in detail</li>
        <li><a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> - Identify broken internal links</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Certificate Checker</a> - Ensure secure connections</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Checker</a> - Analyze page weight</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize content</li>
      </ul>

      <p>For further reading on HTTP status codes and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status" target="_blank" rel="noopener noreferrer">MDN HTTP Status Code Documentation</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/http-errors" target="_blank" rel="noopener noreferrer">Google Search Central: HTTP Errors</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google Search Central: 301 Redirects</a></li>
        <li><a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev Performance Guides</a></li>
        <li><a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive Web Almanac</a></li>
      </ul>
    </article>
  );
}