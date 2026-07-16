"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };
const TAG_KIND = { good: 'kind-success', warn: 'kind-redirect', bad: 'kind-danger', info: 'kind-unknown' };

function classifyStatus(s) {
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

export default function RedirectCheckerPage() {
  const [url, setUrl] = useState('');
  const [compareUA, setCompareUA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/redirect-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), compareUserAgents: compareUA }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>🔄 Redirect Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input
            type="text"
            placeholder="https://example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Tracing…' : '🔍 Trace Redirects'}
          </button>
        </form>

        <div className="og-toggle-wrapper">
          <label className="og-toggle">
            <input type="checkbox" checked={compareUA} onChange={(e) => setCompareUA(e.target.checked)} />
            <span>🤖 Also fetch as Googlebot and Mobile Safari (detect crawler-specific redirects)</span>
          </label>
          <span className="toggle-hint">💡 Helps detect cloaking or user-agent-specific redirects</span>
        </div>

        <p className="tool-description">
          🔄 Trace every hop in a redirect chain, classify each step (301 vs 302, HTTPS upgrade, www toggle,
          trailing-slash, cross-domain) and surface SEO problems — long chains, mixed types, downgrades, loops.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { chain, issues, summary, comparisons } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const bannerText = summary.fail
    ? `❌ ${summary.fail} issue${summary.fail === 1 ? '' : 's'} in the redirect chain`
    : summary.warn
      ? `⚠️ ${summary.warn} warning${summary.warn === 1 ? '' : 's'}`
      : summary.hops === 0
        ? '✅ No redirect — page responded directly'
        : `✅ ${summary.hops} redirect${summary.hops === 1 ? '' : 's'} — chain looks healthy`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {summary.hops} hop{summary.hops === 1 ? '' : 's'} · final HTTP {summary.finalStatus} · ⏱️ {summary.totalElapsedMs} ms total</span>
      </div>

      <h3 className="result-section-title">🔄 Chain ({chain.length} step{chain.length === 1 ? '' : 's'})</h3>
      <ol className="rc-chain">
        {chain.map((hop, idx) => (
          <li key={idx} className="rc-step">
            <div className="rc-step-head">
              <span className="rc-step-num">#{idx + 1}</span>
              <span className={`status-pill kind-${classifyStatus(hop.status)}`}>HTTP {hop.status}</span>
              <span className="rc-step-time">⏱️ {hop.elapsedMs} ms</span>
            </div>
            <div className="rc-step-url result-value-mono">📍 {hop.url}</div>
            {hop.location && idx < chain.length - 1 && (
              <div className="rc-step-location">
                <span className="rc-arrow">⬇️</span>
                <span className="result-value-mono">{hop.location}</span>
              </div>
            )}
            {hop.tags && hop.tags.length > 0 && (
              <div className="rc-step-tags">
                {hop.tags.map((t, i) => <span key={i} className={`status-pill ${TAG_KIND[t.kind]}`}>{t.label}</span>)}
              </div>
            )}
          </li>
        ))}
      </ol>

      {issues.length > 0 && (
        <>
          <h3 className="result-section-title">📋 Findings</h3>
          <ul className="og-check-list">
            {issues.map((c, idx) => (
              <li key={idx} className={`og-check-row sev-${c.severity}`}>
                <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
                <div className="og-check-body">
                  <div className="og-check-head">
                    <span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span>
                  </div>
                  <div className="og-check-message">{c.message}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {comparisons && (
        <>
          <h3 className="result-section-title">🤖 User-agent comparison</h3>
          <UAComparison label="Googlebot" v={comparisons.googlebot} />
          <UAComparison label="Mobile Safari" v={comparisons.mobile} />
        </>
      )}
    </div>
  );
}

function UAComparison({ label, v }) {
  if (v.error) {
    return (
      <div className="rc-ua-row">
        <strong>{label}:</strong>
        <span className="bulk-error" style={{ paddingLeft: 0 }}>❌ {v.error}</span>
      </div>
    );
  }
  return (
    <div className="rc-ua-row">
      <strong>{label}</strong>
      <div className="rc-ua-meta">
        <span className={`status-pill kind-${classifyStatus(v.finalStatus)}`}>HTTP {v.finalStatus}</span>
        <span>🔄 {v.hops - 1} redirect{v.hops === 2 ? '' : 's'}</span>
      </div>
      <div className="rc-ua-final result-value-mono">📍 {v.finalUrl}</div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Redirects: Where Sites Quietly Lose Rankings</h2>
      <p>Redirects are how the web survives renames, restructures, HTTPS migrations, and consolidations. They're also where ranking signals leak away if you're not careful. A handful of common mistakes — using 302 instead of 301 for a permanent move, chains of three or more hops, downgrading from HTTPS to HTTP at any step, or accidentally creating a loop — can quietly drop a site's organic visibility for months before anyone notices.</p>

      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google Search Central</a>, proper redirect implementation is essential for maintaining search visibility during site migrations. Our <strong>Redirect Checker</strong> helps you identify and fix these issues before they impact your <strong>mobile SEO</strong> and <strong>Core Web Vitals</strong>.</p>

      <h2>What This Tool Does</h2>
      <p>Our <strong>Redirect Checker</strong> follows every redirect, times each hop, classifies the type (permanent vs temporary, scheme upgrade, www toggle, slash toggle, cross-domain) and calls out the issues that hurt SEO. Toggle the user-agent comparison to detect cases where bots are sent down a different path than humans — a smell of cloaking or fragile redirect logic.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a>, you can ensure your redirects are properly configured for both users and search engines.</p>

      <h2>301 vs 302 vs 308: Understanding Redirect Types</h2>

      <h3>301 Moved Permanently</h3>
      <p>The <strong>301</strong> redirect is permanent and passes nearly all PageRank to the new URL. According to <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google's documentation</a>, 301 redirects preserve the vast majority of ranking signals. For an HTTPS migration, a www toggle, or a permanent move always use 301.</p>

      <h3>302 Found / 307 Temporary Redirect</h3>
      <p>The <strong>302</strong> redirect is temporary and Google is more conservative about transferring signals through it. Only use 302 when the move is genuinely temporary. Our <strong>Redirect Checker</strong> identifies when 302s should be 301s.</p>

      <h3>308 Permanent Redirect</h3>
      <p>The <strong>308</strong> redirect is permanent <em>and</em> preserves the request method (POST stays POST). Use 308 when method preservation matters. It's less common but increasingly supported.</p>

      <h2>Why Redirect Chains Matter for SEO</h2>

      <h3>1. Page Speed and Core Web Vitals</h3>
      <p>Each extra hop in a redirect chain adds latency for users. This directly impacts <strong>Core Web Vitals</strong>, particularly Largest Contentful Paint (LCP). <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a> recommends minimizing redirects for optimal performance. Use our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> to measure the impact.</p>

      <h3>2. Link Equity and PageRank</h3>
      <p>Industry research suggests roughly 5–10% of equity dissipates per extra hop. Updating <em>incoming</em> links to point to the final URL is one of the highest-leverage technical SEO tasks you can do after a migration.</p>

      <h3>3. Crawl Budget</h3>
      <p>Redirect chains waste crawl budget. Googlebot spends time following redirects instead of indexing new content. <a href="https://developers.google.com/search/docs/crawling-indexing/redirects" target="_blank" rel="noopener noreferrer">Google Search Central</a> recommends keeping redirects direct.</p>

      <h3>4. Mobile-First Indexing</h3>
      <p>With <strong>mobile-first indexing</strong>, Google primarily crawls and indexes the mobile version of your site. If mobile URLs have different redirect chains than desktop, your <strong>mobile SEO</strong> can suffer. Our <strong>Redirect Checker</strong> helps identify these discrepancies.</p>

      <h2>Common Redirect Issues and How to Fix Them</h2>

      <h3>1. Using 302 Instead of 301</h3>
      <p><strong>The Problem:</strong> Temporary redirects used for permanent moves, diluting link equity.</p>
      <p><strong>The Fix:</strong> Change 302s to 301s for permanent redirects. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to identify these issues.</p>

      <h3>2. Long Redirect Chains</h3>
      <p><strong>The Problem:</strong> Multiple redirects (e.g., A → B → C → D) slow down page loads.</p>
      <p><strong>The Fix:</strong> Update redirects to point directly to the final destination. Our tool shows you every hop in the chain.</p>

      <h3>3. HTTPS to HTTP Downgrades</h3>
      <p><strong>The Problem:</strong> Redirecting from secure HTTPS to insecure HTTP at any point.</p>
      <p><strong>The Fix:</strong> Ensure all redirects maintain HTTPS. Use our <a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Checker</a> to verify your HTTPS configuration.</p>

      <h3>4. Mixed www/non-www Redirects</h3>
      <p><strong>The Problem:</strong> Inconsistent handling of www vs non-www versions.</p>
      <p><strong>The Fix:</strong> Choose a preferred domain and redirect the other version consistently. Use our <a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> to verify.</p>

      <h3>5. Redirect Loops</h3>
      <p><strong>The Problem:</strong> A → B → A creates an infinite loop.</p>
      <p><strong>The Fix:</strong> Review your redirect configuration and break the loop. Our tool detects and reports loops.</p>

      <h2>Best Practices for Redirect Implementation</h2>

      <h3>1. Use 301 for Permanent Moves</h3>
      <p>For any permanent URL change, use 301 redirects. They preserve SEO value and signal to search engines that the move is permanent. <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google recommends 301</a> for permanent moves.</p>

      <h3>2. Minimize Redirect Chains</h3>
      <p>Keep redirect chains to a maximum of 3 hops, and ideally zero. Each redirect adds latency and can dilute link equity. Our <strong>Redirect Checker</strong> helps you identify and fix chains.</p>

      <h3>3. Maintain HTTPS Throughout</h3>
      <p>Always redirect to HTTPS, never away from it. This ensures security and maintains user trust. Use our <a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Checker</a> to verify your certificates.</p>

      <h3>4. Update Internal Links</h3>
      <p>After implementing redirects, update internal links to point directly to the final URL. This reduces redirect chains and improves site performance. Use our <a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> to identify internal links that need updating.</p>

      <h3>5. Set Correct Canonical URLs</h3>
      <p>Even with proper redirects, set canonical URLs to indicate the preferred version. Our <a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> helps verify your implementation.</p>

      <h2>User-Agent Specific Redirects: Hidden SEO Risks</h2>
      <p>Some websites serve different redirects based on the user-agent. This can be a sign of cloaking, which violates <a href="https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines#cloaking" target="_blank" rel="noopener noreferrer">Google's Webmaster Guidelines</a>. Our <strong>Redirect Checker</strong> includes a user-agent comparison feature that checks:</p>
      <ul>
        <li><strong>Googlebot:</strong> How Google's crawler sees your redirects</li>
        <li><strong>Mobile Safari:</strong> How mobile users experience your redirects</li>
      </ul>
      <p>If these differ significantly, you may have a problem that needs investigation.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single URL Testing</h3>
      <p>Enter any URL to trace its redirect chain. The tool follows every hop, times each step, and identifies issues. Perfect for debugging specific pages after a site migration.</p>

      <h3>User-Agent Comparison</h3>
      <p>Enable the user-agent comparison to detect if Googlebot or mobile users experience different redirects. This is crucial for maintaining <strong>mobile-friendly websites</strong>.</p>

      <h3>Post-Migration Verification</h3>
      <p>After implementing a site migration, use our tool to verify that all redirects are working correctly. Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> to ensure all pages are discoverable.</p>

      <h2>Monitoring Redirects Over Time</h2>
      <p>Regular monitoring with our <strong>Redirect Checker</strong> helps you:</p>
      <ul>
        <li>Detect redirect issues introduced during updates</li>
        <li>Verify redirect chains remain optimized</li>
        <li>Identify changes in user-agent specific behavior</li>
        <li>Maintain SEO value through proper redirects</li>
        <li>Ensure <strong>mobile-friendly websites</strong> redirect correctly</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> and <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive site audits.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Redirect Checker?</h3>
      <p>A <strong>Redirect Checker</strong> is a tool that traces the full redirect chain of a URL, showing every hop, timing, and status code. It identifies SEO issues like long chains, mixed types, and loops that can impact search rankings.</p>

      <h3>How do redirects affect SEO?</h3>
      <p>Redirects directly impact <strong>mobile SEO</strong> by affecting crawlability, link equity, and user experience. Proper 301 redirects preserve rankings, while 302s, chains, and loops can harm visibility. <a href="https://developers.google.com/search/docs/crawling-indexing/redirects" target="_blank" rel="noopener noreferrer">Google's guidelines</a> emphasize proper redirect implementation.</p>

      <h3>What's the difference between 301 and 302 redirects?</h3>
      <p><strong>301</strong> redirects are permanent and pass full link equity. <strong>302</strong> redirects are temporary and don't pass full ranking signals. Use 301 for permanent moves and 302 for temporary ones. Our <strong>Redirect Checker</strong> identifies which type you're using.</p>

      <h3>Are redirect chains bad for SEO?</h3>
      <p>Yes, redirect chains can slow down page loads, dilute link equity, and waste crawl budget. Keep redirects direct and chains minimal. Our tool shows you every hop in the chain.</p>

      <h3>How many redirects are acceptable?</h3>
      <p>For optimal performance, keep redirect chains to 3 hops or fewer. Each redirect adds latency, especially on mobile networks. <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a> recommends minimizing redirects for better <strong>Core Web Vitals</strong>.</p>

      <h3>What is a redirect loop?</h3>
      <p>A redirect loop occurs when URL A redirects to B, and B redirects back to A, creating an infinite cycle. This prevents users and search engines from accessing your content. Our tool detects and reports redirect loops.</p>

      <h3>Should I use 301 or 308 redirects?</h3>
      <p>Both are permanent redirects. The difference is that 308 preserves the HTTP method (POST stays POST), while 301 may change POST to GET. For most SEO purposes, 301 is sufficient and more widely supported.</p>

      <h3>Why should I care about user-agent specific redirects?</h3>
      <p>User-agent specific redirects can indicate cloaking, which violates <a href="https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines#cloaking" target="_blank" rel="noopener noreferrer">Google's Webmaster Guidelines</a>. Our user-agent comparison feature helps you detect if bots and users see different redirects.</p>

      <h2>Conclusion</h2>
      <p>Proper redirect implementation is fundamental to website health, user experience, and <strong>mobile SEO</strong> success. Our <strong>Redirect Checker</strong> provides the detailed analysis you need to identify issues, optimize chains, and maintain link equity.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper redirects are essential for <strong>Core Web Vitals</strong> and search engine visibility. Regular monitoring with our <strong>Redirect Checker</strong> helps you catch issues early and maintain a healthy, well-optimized site.</p>

      <p>Start monitoring your redirects today—use our <strong>Redirect Checker</strong> to audit your site, identify issues, and ensure your redirects are properly configured for both users and search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Redirect Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Verify server responses</li>
        <li><a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> - Identify broken internal links</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Certificate Checker</a> - Ensure secure connections</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize content</li>
      </ul>

      <p>For further reading on redirects and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google Search Central: 301 Redirects</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/redirects" target="_blank" rel="noopener noreferrer">Google Search Central: Redirects Overview</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections" target="_blank" rel="noopener noreferrer">MDN HTTP Redirections</a></li>
        <li><a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev Performance Guides</a></li>
        <li><a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive Web Almanac</a></li>
      </ul>
    </article>
  );
}