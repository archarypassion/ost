"use client";
import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function GoogleIndexChecker() {
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
      const res = await fetch('/api/tools/google-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Something went wrong.');
      else setData(json);
    } catch {
      setError('Network error — could not reach the checker service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header"><h1>🔍 Google Index Checker</h1></div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter page URL (e.g. example.com/some-page)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Checking...' : '🔍 Check Index'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Combines on-page indexability signals (HTTP status, <code>noindex</code>, <code>X-Robots-Tag</code>,
          canonical, robots.txt) with a best-effort Google <code>site:</code> query to estimate whether a URL is indexed.
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
  const v = data.verdict;
  let bannerClass, BannerIcon, headline;
  if (v.state === 'indexed') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = '✅ Indexed in Google';
  } else if (v.state === 'likely-indexed') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = '✅ Likely indexable — no blocking signals detected';
  } else if (v.state === 'not-indexed') {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = '❌ Not indexed (or won\'t be)';
  } else if (v.state === 'conflicting') {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = '⚠️ Conflicting signals — Google may still serve a stale result';
  } else {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = '⚠️ Inconclusive';
  }

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>
          {headline}
          <span className={`confidence-badge ${v.confidence}`}>
            {v.confidence} confidence
          </span>
        </span>
      </div>

      <div>
        <div className="result-section-title">📋 Why</div>
        <div className="signal-list">
          {v.reasons.map((r, i) => {
            const Icon = r.kind === 'good' ? CheckCircle2 : r.kind === 'warn' ? AlertTriangle : XCircle;
            return (
              <div key={i} className={`signal-item ${r.kind}`}>
                <Icon size={16} className="signal-icon" />
                <span className="signal-text">{r.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <PageBlock page={data.page} url={data.url} />
      <RobotsBlock robots={data.robots} />
      <GoogleBlock google={data.google} />

      <div className="disclaimer">
        💡 Google removed the public <code>cache:</code> operator in 2024 and actively blocks server-side scraping. For
        a definitive answer, use the{' '}
        <a
          href={`https://search.google.com/search-console`}
          target="_blank"
          rel="noreferrer"
        >
          Google Search Console URL Inspection tool
        </a>
        {' '}— it requires verified ownership of the property but reports the exact indexing status Google has for your URL.
      </div>
    </div>
  );
}

function PageBlock({ page, url }) {
  return (
    <div>
      <div className="result-section-title">📄 On-Page Signals</div>
      <div className="result-grid" style={{ width: '100%' }}>
        <ResultRow label="📍 Requested URL" mono>{url}</ResultRow>
        {page.reached === false && (
          <ResultRow label="📊 Status">
            <span style={{ color: '#EF4444', fontWeight: 600 }}>Unreachable — {page.error}</span>
          </ResultRow>
        )}
        {page.reached && (
          <>
            <ResultRow label="📊 HTTP Status">
              <strong style={{ color: page.httpStatus >= 400 ? '#EF4444' : page.httpStatus >= 300 ? '#F59E0B' : '#10B981' }}>
                {page.httpStatus}
              </strong>
            </ResultRow>
            {page.finalUrl && page.finalUrl !== url && (
              <ResultRow label="📍 Final URL" mono>{page.finalUrl}</ResultRow>
            )}
            {page.title && <ResultRow label="📌 Page Title">{page.title}</ResultRow>}
            <ResultRow label='🤖 <meta name="robots">'>
              <Mono>{page.robotsContent || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label='🤖 <meta name="googlebot">'>
              <Mono>{page.googlebotContent || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label="📡 X-Robots-Tag">
              <Mono>{page.xRobotsTag || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label="🔗 Canonical URL" mono>
              {page.canonical || <Italic>Not declared</Italic>}
            </ResultRow>
          </>
        )}
      </div>
    </div>
  );
}

function RobotsBlock({ robots }) {
  return (
    <div>
      <div className="result-section-title">🤖 robots.txt Check (Googlebot)</div>
      <div className="result-grid" style={{ width: '100%' }}>
        <ResultRow label="📄 robots.txt found">
          {robots.exists ? <span style={{ color: '#10B981' }}>✅ Yes</span> : <Italic>No (HTTP {robots.status || '—'})</Italic>}
        </ResultRow>
        <ResultRow label="🔗 Path allowed for Googlebot">
          <span style={{ color: robots.allowed ? '#10B981' : '#EF4444', fontWeight: 600 }}>
            {robots.allowed ? '✅ Yes' : '❌ No (Disallowed)'}
          </span>
        </ResultRow>
        {robots.matched && (
          <ResultRow label="📌 Matched rule"><Mono>{robots.matched}</Mono></ResultRow>
        )}
      </div>
    </div>
  );
}

function GoogleBlock({ google }) {
  return (
    <div>
      <div className="result-section-title">🔍 Google site: Query</div>
      <div className="result-grid" style={{ width: '100%' }}>
        <ResultRow label="📊 Query verdict">
          <span style={{
            color: google.verdict === 'indexed' ? '#10B981'
              : google.verdict === 'not-indexed' ? '#EF4444'
                : '#F59E0B',
            fontWeight: 600,
          }}>
            {google.verdict}
          </span>
        </ResultRow>
        {google.reason && (
          <ResultRow label="📌 Reason"><span>{google.reason}</span></ResultRow>
        )}
        {google.resultCount !== undefined && google.resultCount !== null && (
          <ResultRow label="📊 Result count">{google.resultCount.toLocaleString()}</ResultRow>
        )}
        {google.searchUrl && (
          <ResultRow label="🔗 Open in Google">
            <a href={google.searchUrl} target="_blank" rel="noreferrer" className="sitemap-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              View results <ExternalLink size={12} />
            </a>
          </ResultRow>
        )}
      </div>
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

function Mono({ children }) {
  return <code style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.8125rem' }}>{children}</code>;
}

function Italic({ children }) {
  return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{children}</span>;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Google Index Checker: How to Know If Google Can See Your Pages</h2>
      <p>Publishing content is only half the battle. If Google hasn't indexed your pages, they simply won't appear in search results — no matter how well-written, optimized, or link-rich they are. Indexing is the prerequisite for ranking, and yet it's surprising how often important pages fail to get indexed, and site owners don't notice for weeks or months.</p>

      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/indexing-overview" target="_blank" rel="noopener noreferrer">Google Search Central</a>, indexing is the process of adding web pages into Google's search database. Our <strong>Google Index Checker</strong> helps you determine whether your pages have been indexed and identifies any issues that might be preventing indexation.</p>

      <h2>What This Tool Does</h2>
      <p>Google removed its public <code>cache:</code> operator in 2024 and actively blocks server-side scraping of its results pages with CAPTCHAs and rate limits. That means no third-party tool — including this one — can guarantee a definitive index status without using Google Search Console's URL Inspection API (which requires verified property ownership). What our tool does instead is combine the indexability signals that we <em>can</em> read directly: HTTP status, the page's robots meta tag, the X-Robots-Tag response header, the canonical URL declaration, and whether robots.txt blocks Googlebot from the path. We then attempt a Google <code>site:</code> query as a supplementary signal. The result is a confidence-rated verdict that's far more useful than a yes/no — and importantly, transparent about what we can and can't know.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> and <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a>, you can ensure your site is properly configured for Google's crawlers.</p>

      <h2>Why Pages Don't Get Indexed</h2>
      <p>There are many reasons a page might fail to get indexed. The most common ones involve deliberate signals that are accidentally misconfigured. A noindex meta tag left on from a development environment is the classic culprit — the page is blocked from indexing by a tag that should have been removed before launch. Similarly, a robots.txt Disallow rule that prevents Googlebot from crawling the page means the noindex tag (if present) can never even be read.</p>
      <p>Other causes include pages with very thin or duplicate content that Google doesn't consider worth indexing, pages that are deeply buried in a site structure with few or no internal links pointing to them, and pages that are genuinely new and simply haven't been crawled yet. Google doesn't index pages the moment they're published — on newer or lower-authority sites, it can take days or even weeks for a new page to be crawled and indexed.</p>

      <h2>How to Check If a Page Is Indexed</h2>
      <p>The classic manual method is to search for <code>site:yourdomain.com/your-page-url</code> in Google. If the URL appears in the results, it's indexed. If it doesn't, it may not be indexed — though note that the site: operator isn't perfectly reliable and should be treated as an indicator rather than a guarantee. Google Search Console's URL Inspection tool is the most accurate source — it shows the exact indexing status as Google sees it, including whether a page is indexed, whether it was recently crawled, and if there are any issues preventing indexation.</p>

      <h2>Indexability Signals You Need to Understand</h2>

      <h3>1. HTTP Status Codes</h3>
      <p><strong>200 OK</strong> pages can be indexed. <strong>301/302</strong> redirects should point to indexable pages. <strong>404</strong> and <strong>410</strong> pages will be removed from the index. Use our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> to verify your server responses.</p>

      <h3>2. Robots Meta Tags</h3>
      <p><code>&lt;meta name="robots" content="noindex"&gt;</code> prevents indexing. <code>&lt;meta name="robots" content="nofollow"&gt;</code> prevents link following. Ensure these are correctly configured for your pages.</p>

      <h3>3. X-Robots-Tag Header</h3>
      <p>The <code>X-Robots-Tag</code> HTTP header can also control indexing, especially for non-HTML files. Check both meta tags and HTTP headers for consistency.</p>

      <h3>4. Canonical Tags</h3>
      <p>A canonical tag pointing to a different URL doesn't block indexing, but it tells Google which version to prioritize. Ensure your canonicals point to indexable pages.</p>

      <h3>5. robots.txt</h3>
      <p>robots.txt can block crawling entirely. If Googlebot can't crawl the page, it can't read the meta tags or index the content. Use our <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> to verify your configuration.</p>

      <h2>Getting Pages Indexed Faster</h2>
      <p>If you've published new content and want to accelerate indexing, there are a few reliable tactics:</p>
      <ul>
        <li><strong>Submit to Google Search Console:</strong> Use the URL Inspection tool's "Request Indexing" button to add it to Google's priority crawl queue.</li>
        <li><strong>Use Internal Linking:</strong> Link new pages from already-indexed pages on your site. Internal linking is the primary way Googlebot discovers new content.</li>
        <li><strong>Update Your Sitemap:</strong> Include new URLs in your XML sitemap and resubmit it to Google Search Console.</li>
        <li><strong>Improve Page Authority:</strong> Pages with higher authority are crawled more frequently. Build internal and external links to important pages.</li>
        <li><strong>Update Content Regularly:</strong> Regularly updated pages are crawled more frequently. Keep your content fresh and relevant.</li>
      </ul>

      <h2>Common Indexing Issues and Solutions</h2>

      <h3>1. Accidental Noindex</h3>
      <p><strong>The Problem:</strong> Noindex meta tag left on from development or testing.</p>
      <p><strong>The Fix:</strong> Remove the noindex tag from pages you want indexed. Use our <a href="https://opensourcetools.online/tools/noindex-checker" target="_blank" rel="noopener noreferrer">Noindex Checker</a> to identify pages with noindex tags.</p>

      <h3>2. Robots.txt Blocking</h3>
      <p><strong>The Problem:</strong> robots.txt Disallow rule blocking Googlebot from crawling.</p>
      <p><strong>The Fix:</strong> Update robots.txt to allow crawling of important pages. Use our <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> to verify your rules.</p>

      <h3>3. Thin or Duplicate Content</h3>
      <p><strong>The Problem:</strong> Content quality issues causing Google to skip indexing.</p>
      <p><strong>The Fix:</strong> Improve content quality, add depth and value, and ensure uniqueness. Use our <a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> and <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for content optimization.</p>

      <h3>4. Orphan Pages</h3>
      <p><strong>The Problem:</strong> Pages with no internal links pointing to them.</p>
      <p><strong>The Fix:</strong> Add internal links from other pages on your site. Use our <a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> to identify linking opportunities.</p>

      <h2>Best Practices for Google Indexing</h2>

      <h3>1. Create High-Quality Content</h3>
      <p>Google prioritizes high-quality, valuable content. Focus on creating content that genuinely helps users and addresses their needs.</p>

      <h3>2. Maintain a Clean Site Structure</h3>
      <p>Organize your site logically with clear navigation and internal linking. This helps Googlebot discover and index all important pages.</p>

      <h3>3. Use XML Sitemaps</h3>
      <p>Submit comprehensive XML sitemaps to Google Search Console. Include all important pages and update them regularly.</p>

      <h3>4. Monitor Indexing Status</h3>
      <p>Regularly check your indexing status using our <strong>Google Index Checker</strong> and Google Search Console. Identify and fix issues promptly.</p>

      <h3>5. Optimize for Mobile</h3>
      <p>With <strong>mobile-first indexing</strong>, Google primarily uses the mobile version of your site for indexing. Ensure your <strong>mobile-friendly website</strong> is fully accessible to Googlebot.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Page Checks</h3>
      <p>Enter any URL to check its indexability. The tool analyzes HTTP status, robots meta tags, X-Robots-Tag, canonicals, robots.txt, and attempts a Google site: query.</p>

      <h3>Post-Launch Verification</h3>
      <p>After publishing new pages, use our tool to verify they're indexable. Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> for comprehensive verification.</p>

      <h2>Monitoring Indexing Over Time</h2>
      <p>Regular monitoring with our <strong>Google Index Checker</strong> helps you:</p>
      <ul>
        <li>Detect indexing issues introduced during updates</li>
        <li>Verify new pages are being indexed</li>
        <li>Identify pages that have been removed from the index</li>
        <li>Maintain <strong>mobile-friendly websites</strong> with proper indexing</li>
        <li>Protect your search visibility</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> and <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> for comprehensive indexing management.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Google Index Checker?</h3>
      <p>A <strong>Google Index Checker</strong> is a tool that analyzes a webpage's indexability signals and attempts to determine whether it has been indexed by Google. It checks HTTP status, robots meta tags, X-Robots-Tag, canonicals, robots.txt, and performs a Google site: query.</p>

      <h3>Why is my page not indexed?</h3>
      <p>Common reasons include: noindex meta tag, robots.txt blocking, HTTP errors, thin content, duplicate content, orphan pages, or new content that hasn't been crawled yet. Use our <strong>Google Index Checker</strong> to identify the specific issue.</p>

      <h3>How do I get my page indexed faster?</h3>
      <p>Submit URLs through Google Search Console's URL Inspection tool, add internal links from indexed pages, include URLs in your sitemap, and ensure high-quality content.</p>

      <h3>What is the difference between crawled and indexed?</h3>
      <p><strong>Crawled</strong> means Googlebot has visited the page. <strong>Indexed</strong> means the page has been added to Google's search database. A page can be crawled but not indexed (e.g., with a noindex tag).</p>

      <h3>Does a 301 redirect pass indexing signals?</h3>
      <p>Yes, 301 redirects pass PageRank and indexing signals to the target URL. However, redirect chains should be minimized. Use our <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to verify your redirects.</p>

      <h2>Conclusion</h2>
      <p>Google indexing is the prerequisite for search visibility. Our <strong>Google Index Checker</strong> provides the analysis you need to identify indexing issues and ensure your pages are discoverable by Google.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, regular indexing checks are essential for maintaining search visibility. Use our <strong>Google Index Checker</strong> as part of your routine maintenance to catch issues early and maintain strong search presence.</p>

      <p>Start checking your indexing status today—use our <strong>Google Index Checker</strong> to audit your site, identify issues, and ensure your pages are properly indexed for both users and search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Google Index Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/noindex-checker" target="_blank" rel="noopener noreferrer">Noindex Checker</a> - Identify noindex tags</li>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Verify server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Analyze redirect chains</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize your content</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
      </ul>

      <p>For further reading on Google indexing and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/indexing-overview" target="_blank" rel="noopener noreferrer">Google Search Central: Indexing Overview</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag" target="_blank" rel="noopener noreferrer">Google Search Central: Robots Meta Tag</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/robots-txt" target="_blank" rel="noopener noreferrer">Google Search Central: robots.txt</a></li>
        <li><a href="https://moz.com/learn/seo/indexation" target="_blank" rel="noopener noreferrer">Moz Indexation Guide</a></li>
        <li><a href="https://www.semrush.com/blog/google-indexing/" target="_blank" rel="noopener noreferrer">Semrush Google Indexing Guide</a></li>
      </ul>
    </article>
  );
}