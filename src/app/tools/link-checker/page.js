"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

function kindOf(s) {
  if (!s) return 'unknown';
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

export default function LinkCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/link-checker', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>🔗 Broken Link Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input
            type="text"
            placeholder="https://example.com/blog/post"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Crawling links…' : '🔍 Check Links'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Extract every <code>&lt;a href&gt;</code> on the page and probe each one in parallel. We report
          status codes, redirects, broken targets, and SEO-relevant attributes (rel, nofollow, target).
          We check up to 100 unique HTTP links per page.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} filter={filter} setFilter={setFilter} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data, filter, setFilter }) {
  const { counts, links, nonHttp, issues, summary } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const filtered = links.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'broken') return l.error || (l.status && l.status >= 400);
    if (filter === 'redirect') return l.status >= 300 && l.status < 400;
    if (filter === 'internal') return l.internal === true;
    if (filter === 'external') return l.internal === false;
    return true;
  });

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>
          {counts.broken + counts.errors > 0
            ? `❌ ${counts.broken + counts.errors} link${counts.broken + counts.errors === 1 ? '' : 's'} need attention`
            : `✅ All ${counts.http} HTTP link${counts.http === 1 ? '' : 's'} look healthy`}
        </strong>
        <span>· ✅ {counts.ok} ok · ⚠️ {counts.redirected} redirected · ❌ {counts.broken} broken · ❌ {counts.errors} errors</span>
      </div>

      <h3 className="result-section-title">📊 Links found</h3>
      <div className="wc-grid">
        <Stat label="📌 Total" value={counts.total} highlight />
        <Stat label="🌐 HTTP/HTTPS" value={counts.http} />
        <Stat label="🏠 Internal" value={counts.internal} />
        <Stat label="🌍 External" value={counts.external} />
        <Stat label="📧 Email / Tel / Anchor" value={counts.nonHttp} />
        <Stat label="🔒 External nofollow" value={counts.noFollowExternal} />
      </div>

      {counts.truncated && <div className="result-warning">⚠️ Showing first 100 unique HTTP links — page contains more. Use a desktop crawler for full audits.</div>}

      <h3 className="result-section-title">📋 Findings</h3>
      <ul className="og-check-list">
        {issues.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head"><span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span></div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="ps-resources-head">
        <h3 className="result-section-title" style={{ marginBottom: 0 }}>🔗 HTTP links ({filtered.length})</h3>
        <div className="og-tabs" style={{ marginBottom: 0 }}>
          {[['all', 'All'], ['broken', 'Broken'], ['redirect', 'Redirects'], ['internal', 'Internal'], ['external', 'External']].map(([k, label]) => (
            <button key={k} type="button" className={`og-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="ps-resource-list">
        {filtered.map((l, idx) => (
          <div key={idx} className="lc-row">
            <span className={`status-pill kind-${kindOf(l.status)}`}>{l.error ? '❌ ERR' : (l.status || '—')}</span>
            <span className="lc-internal-tag">{l.internal ? '🏠 internal' : '🌍 external'}</span>
            <div className="lc-link-body">
              <span className="lc-link-text">{l.text || <em>(no anchor text)</em>}</span>
              <a href={l.absoluteUrl} className="result-value-mono lc-link-url" target="_blank" rel="noopener noreferrer">{l.absoluteUrl}</a>
              <div className="lc-link-meta">
                {l.redirected && <span>→ {l.finalUrl}</span>}
                {l.rel && <span> · rel="{l.rel}"</span>}
                {l.target && <span> · target="{l.target}"</span>}
                {l.error && <span className="bulk-error" style={{ paddingLeft: 0 }}> · {l.error}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nonHttp.length > 0 && (
        <>
          <h3 className="result-section-title">📧 Non-HTTP links ({nonHttp.length})</h3>
          <div className="ps-resource-list">
            {nonHttp.slice(0, 30).map((l, idx) => (
              <div key={idx} className="lc-row">
                <span className="ps-resource-type" style={{ background: '#9ca3af20', color: '#6b7280' }}>{l.kind}</span>
                <div className="lc-link-body">
                  <span className="lc-link-text">{l.text || <em>(no anchor text)</em>}</span>
                  <span className="result-value-mono lc-link-url">{l.href}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`wc-stat ${highlight ? 'highlight' : ''}`}>
      <div className="wc-stat-label">{label}</div>
      <div className="wc-stat-value">{value}</div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Broken Links: A Slow Drain on Your Authority</h2>
      <p>Internal broken links waste crawl budget and hurt the user experience. External broken links to dead resources are usually the bigger problem — they signal to search engines that your content isn't maintained. Both should be fixed regularly, ideally as part of a quarterly content audit.</p>

      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable" target="_blank" rel="noopener noreferrer">Google Search Central</a>, broken links can negatively impact your site's crawlability and user experience. Our <strong>Broken Link Checker</strong> helps you identify and fix these issues before they harm your <strong>mobile SEO</strong> and <strong>Core Web Vitals</strong>.</p>

      <h2>What This Tool Checks</h2>
      <p>For each unique <code>&lt;a href&gt;</code> on the page we send a HEAD request (with a GET fallback for servers that reject HEAD). We follow redirects and report the final status code. The results are split into internal vs external, ok vs broken, and you can filter the list to focus on what matters.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> and <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a>, you can ensure your links are properly configured for both users and search engines.</p>

      <h2>Why Broken Links Matter for SEO</h2>

      <h3>1. User Experience and Mobile SEO</h3>
      <p>Broken links frustrate users and increase bounce rates. For <strong>mobile-friendly websites</strong>, this is especially damaging as mobile users have less patience for errors. <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a> emphasizes the importance of providing a smooth user experience.</p>

      <h3>2. Crawl Budget</h3>
      <p>Internal broken links waste crawl budget. Googlebot follows links to find new content. When it hits broken links, it wastes time that could be spent crawling valuable pages. <a href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable" target="_blank" rel="noopener noreferrer">Google's documentation</a> emphasizes the importance of crawlable links.</p>

      <h3>3. PageRank and Link Equity</h3>
      <p>External broken links signal to search engines that your content isn't maintained. While you don't control external sites, linking to dead resources can damage your perceived authority. Our <strong>Broken Link Checker</strong> helps you identify and replace these links.</p>

      <h3>4. Core Web Vitals</h3>
      <p>Redirect chains and broken links can impact <strong>Core Web Vitals</strong>, particularly LCP and FID. Each redirect adds latency, and broken links cause 404 errors that waste time. Use our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> to measure the impact.</p>

      <h2>Types of Link Issues and How to Fix Them</h2>

      <h3>1. Internal 404 Errors</h3>
      <p><strong>The Problem:</strong> Internal links pointing to pages that don't exist.</p>
      <p><strong>The Fix:</strong> Correct the path or implement a 301 redirect to the correct page. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to verify your redirects.</p>

      <h3>2. External 404 Errors</h3>
      <p><strong>The Problem:</strong> External links pointing to pages that no longer exist.</p>
      <p><strong>The Fix:</strong> Replace the link with a current source, use the <a href="https://archive.org/" target="_blank" rel="noopener noreferrer">Internet Archive</a>, or remove the reference. For external 403/redirect-to-homepage cases, the source has often moved their content; track it down or update.</p>

      <h3>3. Redirect Chains</h3>
      <p><strong>The Problem:</strong> Links that go through multiple redirects before reaching the destination.</p>
      <p><strong>The Fix:</strong> Update links to point directly to the final URL. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to identify and fix chains.</p>

      <h3>4. Timeout Errors</h3>
      <p><strong>The Problem:</strong> Links that take too long to respond or time out completely.</p>
      <p><strong>The Fix:</strong> Retry once before assuming the site is down. If it persists, consider replacing the link or using a cached version.</p>

      <h3>5. Mixed Content Issues</h3>
      <p><strong>The Problem:</strong> HTTP links on HTTPS pages (or vice versa).</p>
      <p><strong>The Fix:</strong> Update all links to use HTTPS where possible. Use our <a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Checker</a> to verify your HTTPS configuration.</p>

      <h2>Best Practices for Link Management</h2>

      <h3>1. Regular Link Audits</h3>
      <p>Conduct quarterly link audits to identify and fix broken links. Use our <strong>Broken Link Checker</strong> as part of your routine maintenance. This is especially important for <strong>mobile-friendly websites</strong> where user experience is paramount.</p>

      <h3>2. Use Meaningful Anchor Text</h3>
      <p>Use descriptive anchor text that tells users and search engines what the linked page is about. Avoid generic text like "click here." This improves <strong>mobile SEO</strong> and accessibility.</p>

      <h3>3. Implement 301 Redirects</h3>
      <p>When moving content, implement 301 redirects to preserve link equity. <a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google recommends 301</a> for permanent moves.</p>

      <h3>4. Update Internal Links</h3>
      <p>After implementing redirects, update internal links to point directly to the final URL. This reduces redirect chains and improves site performance. Use our <a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Broken Link Checker</a> to identify links that need updating.</p>

      <h3>5. Use NoFollow for External Links</h3>
      <p>Use <code>rel="nofollow"</code> for external links you don't want to endorse. This helps manage link equity and comply with <a href="https://developers.google.com/search/docs/advanced/guidelines/qualify-outbound-links" target="_blank" rel="noopener noreferrer">Google's guidelines</a>.</p>

      <h2>Internal vs External Links: Understanding the Difference</h2>

      <h3>Internal Links</h3>
      <p>Internal links connect pages within your own domain. They help users navigate your site, distribute link equity, and establish site architecture. Broken internal links waste crawl budget and should be fixed immediately.</p>

      <h3>External Links</h3>
      <p>External links point to other domains. They provide context and reference for your content. However, linking to dead resources can damage your credibility. Regular checking with our <strong>Broken Link Checker</strong> helps maintain quality.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Page Checking</h3>
      <p>Enter any URL to check all links on that page. The tool extracts every <code>&lt;a href&gt;</code>, verifies each link, and classifies them as internal or external. This is perfect for content audits.</p>

      <h3>Filtering Results</h3>
      <p>Use the filter tabs to focus on specific link types: All, Broken, Redirects, Internal, or External. This helps prioritize fixes based on severity and type.</p>

      <h3>Post-Content Update Verification</h3>
      <p>After updating content, use our tool to verify all links are working. Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive content audits.</p>

      <h2>Understanding Link Attributes and Their SEO Impact</h2>

      <h3>NoFollow Links</h3>
      <p>The <code>rel="nofollow"</code> attribute tells search engines not to pass link equity to the linked page. Use this for untrusted content or paid links. Our tool identifies nofollow links to help you manage your link profile.</p>

      <h3>Target Attributes</h3>
      <p>The <code>target="_blank"</code> attribute opens links in a new tab. This can improve user experience but should be used judiciously. Our tool reports target attributes to help you audit your link behavior.</p>

      <h3>Anchor Text</h3>
      <p>Anchor text provides context to search engines about the linked page. Descriptive anchor text improves <strong>mobile SEO</strong> and user experience. Our tool shows you anchor text to help identify generic or unhelpful links.</p>

      <h2>Monitoring Links Over Time</h2>
      <p>Regular monitoring with our <strong>Broken Link Checker</strong> helps you:</p>
      <ul>
        <li>Detect broken links before they impact users</li>
        <li>Identify redirect chains that need optimization</li>
        <li>Maintain quality external references</li>
        <li>Ensure <strong>mobile-friendly websites</strong> have working links</li>
        <li>Protect your site's authority and credibility</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a>, <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a>, and <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> for comprehensive site maintenance.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Broken Link Checker?</h3>
      <p>A <strong>Broken Link Checker</strong> is a tool that crawls a webpage, extracts all links, and verifies each one. It identifies broken links, redirect chains, and classifies links as internal or external.</p>

      <h3>Why should I check my links?</h3>
      <p>Broken links harm user experience, waste crawl budget, and can damage your site's authority. Regular link checking is essential for maintaining a <strong>mobile-friendly website</strong> and good <strong>mobile SEO</strong>.</p>

      <h3>What is the difference between internal and external links?</h3>
      <p><strong>Internal links</strong> connect pages within your own domain. <strong>External links</strong> point to pages on other domains. Both need regular checking.</p>

      <h3>How often should I check my links?</h3>
      <p>Conduct quarterly link audits using our <strong>Broken Link Checker</strong>. For e-commerce or high-traffic sites, consider monthly checks. Always check after content updates or migrations.</p>

      <h3>What causes broken links?</h3>
      <p>Common causes include: pages being moved without redirects, deleted content, domain changes, server errors, and external sites going offline.</p>

      <h3>How do I fix broken external links?</h3>
      <p>For external links, find a current source (use the <a href="https://archive.org/" target="_blank" rel="noopener noreferrer">Internet Archive</a>), replace with a working alternative, or remove the reference. For external 403/redirect-to-homepage cases, track down the moved content or update.</p>

      <h3>What's a redirect chain, and why is it bad?</h3>
      <p>A redirect chain occurs when a link goes through multiple redirects before reaching the destination. This adds latency and can dilute link equity. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to identify and fix chains.</p>

      <h3>Does Google penalize broken links?</h3>
      <p>Google doesn't directly penalize broken links, but they harm user experience and crawlability. <a href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable" target="_blank" rel="noopener noreferrer">Google's guidelines</a> recommend fixing broken links for better site health.</p>

      <h3>What is nofollow and when should I use it?</h3>
      <p><code>rel="nofollow"</code> tells search engines not to pass link equity. Use it for user-generated content, paid links, or untrusted sources. Our tool identifies nofollow links to help you manage your link profile.</p>

      <h2>Conclusion</h2>
      <p>Regular link checking is fundamental to website health, user experience, and <strong>mobile SEO</strong> success. Our <strong>Broken Link Checker</strong> provides the detailed analysis you need to identify issues, fix broken links, and maintain a healthy, well-optimized site.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, regular link audits are essential for maintaining <strong>Core Web Vitals</strong> and search engine visibility. Use our <strong>Broken Link Checker</strong> as part of your routine maintenance to catch issues early and maintain a healthy site.</p>

      <p>Start checking your links today—use our <strong>Broken Link Checker</strong> to audit your site, identify issues, and ensure all your links are working properly for both users and search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Broken Link Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Verify server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Analyze redirect chains</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize content</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Checker</a> - Analyze page weight</li>
        <li><a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Compression Checker</a> - Verify compression</li>
      </ul>

      <p>For further reading on link management and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable" target="_blank" rel="noopener noreferrer">Google Search Central: Links and Crawlable Pages</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/301-redirects" target="_blank" rel="noopener noreferrer">Google Search Central: 301 Redirects</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a" target="_blank" rel="noopener noreferrer">MDN HTML &lt;a&gt; Element Documentation</a></li>
        <li><a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev Performance Guides</a></li>
        <li><a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive Web Almanac</a></li>
        <li><a href="https://archive.org/" target="_blank" rel="noopener noreferrer">Internet Archive - Wayback Machine</a></li>
      </ul>
    </article>
  );
}