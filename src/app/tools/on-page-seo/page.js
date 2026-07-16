"use client";

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function OnPageSEO() {
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
      const res = await fetch('/api/tools/on-page-seo', {
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
      <div className="tool-header"><h1>📊 On-Page SEO Checker</h1></div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter page URL (e.g. example.com/about)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Fetches the page and runs ~17 on-page SEO checks: title, meta description, headings, images,
          canonical, viewport, language, Open Graph, Twitter Card, structured data, indexability, content length,
          and more. Returns a weighted 0–100 score with per-check explanations.
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
  const score = data.score;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'Poor';

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className="score-dial" style={{ width: '100%' }}>
        <div
          className="score-circle"
          style={{ '--score': score, '--color': color }}
        >
          <div className="score-circle-text">
            {score}
            <small>/ 100</small>
          </div>
        </div>
        <div className="score-summary">
          <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {label}
          </div>
          <div className="score-counts">
            <div className="score-count">
              <span className="score-count-dot pass" /> {data.counts.passed} passed
            </div>
            <div className="score-count">
              <span className="score-count-dot warn" /> {data.counts.warnings} warnings
            </div>
            <div className="score-count">
              <span className="score-count-dot fail" /> {data.counts.failed} failed
            </div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {data.counts.total} checks across {data.checks.length} signals
          </div>
        </div>
      </div>

      <div>
        <div className="result-section-title">📄 Page Summary</div>
        <div className="result-grid" style={{ width: '100%' }}>
          <ResultRow label="📍 URL" mono>
            <a href={data.url} target="_blank" rel="noreferrer" className="sitemap-link">{data.url}</a>
          </ResultRow>
          {data.finalUrl !== data.url && <ResultRow label="📍 Final URL" mono>{data.finalUrl}</ResultRow>}
          <ResultRow label="📊 HTTP Status">
            <strong>{data.httpStatus}</strong>
          </ResultRow>
          <ResultRow label="📌 Title">{data.signals.title || <Italic>Missing</Italic>}</ResultRow>
          <ResultRow label="📝 Meta description">
            {data.signals.description ? (
              <span style={{ display: 'block', textAlign: 'right' }}>{data.signals.description}</span>
            ) : <Italic>Missing</Italic>}
          </ResultRow>
          <ResultRow label="📊 H1 / H2 / H3">
            {data.signals.headings.h1Count} / {data.signals.headings.h2Count} / {data.signals.headings.h3Count}
          </ResultRow>
          <ResultRow label="🖼️ Images (missing alt)">
            <span>
              {data.signals.images.total}{' '}
              {data.signals.images.missingAlt > 0 && (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>
                  ({data.signals.images.missingAlt} missing alt)
                </span>
              )}
            </span>
          </ResultRow>
          <ResultRow label="📝 Word count">{data.signals.wordCount.toLocaleString()}</ResultRow>
          <ResultRow label="🔗 Links (internal/external)">
            {data.signals.links.internal} / {data.signals.links.external}
          </ResultRow>
          <ResultRow label="🔗 Canonical" mono>
            {data.signals.canonical || <Italic>Not declared</Italic>}
          </ResultRow>
          <ResultRow label="🌐 Lang">
            {data.signals.htmlLang || <Italic>Not set</Italic>}
          </ResultRow>
          <ResultRow label="📱 Viewport">
            <Mono>{data.signals.viewport || 'Not set'}</Mono>
          </ResultRow>
          {data.signals.jsonld.length > 0 && (
            <ResultRow label="📊 Structured data">
              <div className="tag-cloud">
                {[...new Set(data.signals.jsonld.flatMap((b) => b.types))].map((t) => (
                  <span key={t} className="ua-chip">{t}</span>
                ))}
              </div>
            </ResultRow>
          )}
        </div>
      </div>

      <div>
        <div className="result-section-title">✅ Checks ({data.checks.length})</div>
        <div className="check-list">
          {data.checks.map((c, i) => {
            const Icon = c.severity === 'pass' ? CheckCircle2 : c.severity === 'warn' ? AlertTriangle : XCircle;
            return (
              <div key={i} className="check-row">
                <Icon size={18} className={`check-icon ${c.severity}`} />
                <div className="check-body">
                  <div className="check-name">{c.name}</div>
                  <div className="check-message">{c.message}</div>
                  {c.detail && <div className="check-detail">{c.detail}</div>}
                </div>
                <div className="check-weight">w {c.weight}</div>
              </div>
            );
          })}
        </div>
      </div>

      {(Object.keys(data.signals.openGraph).length > 0 || Object.keys(data.signals.twitterCard).length > 0) && (
        <div>
          <div className="result-section-title">📱 Social Tags</div>
          <div className="result-grid" style={{ width: '100%' }}>
            {Object.entries(data.signals.openGraph).map(([k, v]) => (
              <ResultRow key={k} label={k}><Mono>{v}</Mono></ResultRow>
            ))}
            {Object.entries(data.signals.twitterCard).map(([k, v]) => (
              <ResultRow key={k} label={k}><Mono>{v}</Mono></ResultRow>
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

function Mono({ children }) {
  return <code style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.8125rem' }}>{children}</code>;
}

function Italic({ children }) {
  return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{children}</span>;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>On-Page SEO: The Complete Practical Guide for Getting It Right</h2>
      <p>Most conversations about SEO quickly drift toward link building, domain authority, and backlink profiles. And while all of that matters, there's a foundational layer that determines whether any of those off-page efforts will ever pay off — and that's on-page SEO. If your pages aren't properly optimized from the inside, no amount of external authority is going to push them to the top of search results.</p>

      <p>According to <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noopener noreferrer">Google's SEO Starter Guide</a>, on-page optimization is the foundation of good SEO. Our <strong>On-Page SEO Checker</strong> helps you identify and fix issues that could be holding your pages back from ranking well in search results.</p>

      <h2>What This Tool Does</h2>
      <p>Our <strong>On-Page SEO Checker</strong> pulls the key signals from any URL and presents them in an easy-to-read format so you can instantly spot gaps. Check your pages before publishing, and run regular audits on your highest-traffic URLs to make sure nothing has drifted out of spec. Even a small technical slip — a missing title tag after a CMS update, a template change that accidentally removes meta descriptions — can have a meaningful negative impact on your organic performance.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Checker</a> and <a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a>, you can ensure your site is fully optimized for search engines.</p>

      <h2>Why On-Page SEO Still Matters More Than Ever</h2>
      <p>Some people assume that Google has become so sophisticated that it doesn't really need you to follow on-page optimization rules anymore. That's only partially true. Google's natural language processing has improved dramatically, yes — but that doesn't mean you should throw out the structured signals it uses to categorize and rank your content. Think of on-page optimization as giving Google a clear roadmap rather than making it guess. The easier you make it to understand your content, the more confidently it can rank you for the right searches.</p>

      <h2>Title Tags: Your Most Important On-Page Element</h2>
      <p>The HTML title tag is arguably the single most important on-page SEO element. It tells both Google and the user exactly what a page is about before they've even clicked on it. It's the blue clickable text you see in search results, and it's what appears in the browser tab when someone is on your page.</p>
      <p>Best practices for title tags haven't changed much over the years. Keep them between 50 and 60 characters so they don't get truncated in SERPs. Put your primary keyword as close to the beginning as feels natural. Include your brand name, especially if it carries some recognition — typically at the end separated by a pipe or dash. And don't stuff it with keywords; that stopped working years ago and now actively hurts you.</p>

      <p>According to <a href="https://moz.com/learn/seo/title-tag" target="_blank" rel="noopener noreferrer">Moz</a>, the title tag is the most important on-page SEO factor. Use our <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Checker</a> to verify your title tags are properly optimized.</p>

      <h2>Meta Descriptions: Click-Through Rates Depend On These</h2>
      <p>Meta descriptions don't directly influence ranking, but they dramatically influence click-through rate — and click-through rate does influence ranking indirectly. A well-written meta description is essentially your 155-character sales pitch. It should accurately summarize the page content, include your target keyword (Google will bold it in search results if it matches the query), and end with a subtle call to action when it makes sense.</p>
      <p>The frustrating reality is that Google will sometimes rewrite your meta description if it thinks something else on your page better answers the user's query. But that doesn't mean you should skip writing one. Pages without meta descriptions look unfinished, and Google will grab a random snippet of text from your page that might not be flattering.</p>

      <h2>Heading Structure: More Than Just Visual Formatting</h2>
      <p>Headings — H1 through H6 — create both visual hierarchy for readers and semantic structure for crawlers. Your H1 should appear exactly once per page and should clearly state the page's primary topic, ideally including the main target keyword. Your H2 tags break your content into logical sections. H3 tags further subdivide those sections.</p>
      <p>Common mistakes include having zero H1 tags (usually a template or CMS issue), having multiple H1 tags on the same page, and using headings purely for visual styling rather than semantic meaning. Some developers use CSS to make a paragraph look like a heading without actually using heading tags — this is invisible to search engines and a missed opportunity.</p>

      <h2>Image Optimization: Alt Text Is Not Optional</h2>
      <p>Every meaningful image on your page should have a descriptive alt attribute. Alt text serves two critical purposes: it tells screen readers what an image depicts (a major accessibility concern), and it tells search engines what the image shows. Without alt text, an image is essentially invisible to crawlers and contributes nothing to your page's relevance for visual search queries.</p>
      <p>Alt text should be descriptive but concise. Describe what's in the image naturally. Avoid alt text like "image123.jpg" or stuffing it with keywords: "buy cheap blue widgets blue widget sale best widgets." A good rule of thumb: write it as if you're describing the image to someone who can't see it.</p>

      <h2>Content Quality and Word Count</h2>
      <p>There's an ongoing debate in the SEO community about minimum word counts. The honest answer is there's no magic number — a search query like "what time is it in Tokyo" can be perfectly answered in a single sentence. But for competitive informational queries, more depth usually correlates with higher rankings because it signals to Google that you've thoroughly covered the topic.</p>
      <p>What matters far more than raw word count is topical depth and relevance. Does your page answer the user's question fully? Does it address the related questions they might have? Does it provide unique insight that other pages don't? Pages that genuinely satisfy user intent — regardless of length — are the ones that tend to rank and stay ranked.</p>

      <p>Use our <a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> and <a href="https://opensourcetools.online/tools/keyword-density" target="_blank" rel="noopener noreferrer">Keyword Density Tool</a> to optimize your content length and keyword usage.</p>

      <h2>Common On-Page SEO Issues and Solutions</h2>

      <h3>1. Missing or Duplicate Title Tags</h3>
      <p><strong>The Problem:</strong> Pages without unique title tags or with duplicate titles across pages.</p>
      <p><strong>The Fix:</strong> Add unique, descriptive title tags (50-60 characters) to every page. Use our <strong>On-Page SEO Checker</strong> to identify missing or duplicate titles.</p>

      <h3>2. Missing or Short Meta Descriptions</h3>
      <p><strong>The Problem:</strong> Pages without meta descriptions or descriptions under 120 characters.</p>
      <p><strong>The Fix:</strong> Write compelling meta descriptions (120-160 characters) that include your primary keyword.</p>

      <h3>3. Poor Heading Structure</h3>
      <p><strong>The Problem:</strong> Missing H1 tags, multiple H1 tags, or skipped heading levels.</p>
      <p><strong>The Fix:</strong> Use one H1 per page, follow with H2 for sections, and H3 for subsections.</p>

      <h3>4. Images Without Alt Text</h3>
      <p><strong>The Problem:</strong> Missing alt attributes on images.</p>
      <p><strong>The Fix:</strong> Add descriptive alt text to all meaningful images.</p>

      <h3>5. Missing Viewport Tag</h3>
      <p><strong>The Problem:</strong> No viewport meta tag for mobile optimization.</p>
      <p><strong>The Fix:</strong> Add <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> to every page.</p>

      <h2>Best Practices for On-Page SEO</h2>

      <h3>1. Start with Keyword Research</h3>
      <p>Identify the keywords your target audience uses to find content like yours. Use these keywords naturally throughout your content, titles, and headings.</p>

      <h3>2. Write for Humans First</h3>
      <p>While search engines matter, your content should always prioritize human readers. Write naturally, answer questions fully, and provide unique value.</p>

      <h3>3. Optimize for Mobile</h3>
      <p>With <strong>mobile-first indexing</strong>, Google primarily uses the mobile version of your site for ranking. Ensure your <strong>mobile-friendly website</strong> has all the same on-page optimization as your desktop version.</p>

      <h3>4. Use Internal Linking</h3>
      <p>Link to relevant pages within your site to distribute link equity and help users discover more content. Use descriptive anchor text.</p>

      <h3>5. Monitor Performance</h3>
      <p>Regularly audit your on-page SEO using our <strong>On-Page SEO Checker</strong>. Track changes in rankings and click-through rates to measure your optimization success.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Page Audits</h3>
      <p>Enter any URL to get a comprehensive on-page SEO analysis. The tool checks title tags, meta descriptions, headings, images, canonical tags, viewport, language, Open Graph, Twitter Cards, structured data, content length, and more.</p>

      <h3>Post-Launch Verification</h3>
      <p>After publishing new pages or updating content, use our tool to verify all on-page elements are properly optimized. Combine with our <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Checker</a> for comprehensive verification.</p>

      <h2>Monitoring On-Page SEO Over Time</h2>
      <p>Regular monitoring with our <strong>On-Page SEO Checker</strong> helps you:</p>
      <ul>
        <li>Detect optimization issues introduced during updates</li>
        <li>Identify content gaps and improvement opportunities</li>
        <li>Ensure <strong>mobile-friendly websites</strong> maintain optimization</li>
        <li>Track your SEO score and improvement over time</li>
        <li>Stay ahead of Google's evolving requirements</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> and <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> for comprehensive site optimization.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is an On-Page SEO Checker?</h3>
      <p>An <strong>On-Page SEO Checker</strong> is a tool that analyzes a webpage's on-page optimization elements including title tags, meta descriptions, headings, images, content, and technical SEO factors. It provides a score and actionable recommendations.</p>

      <h3>What does the On-Page SEO score mean?</h3>
      <p>The score is a weighted average of all checks performed. A score above 80 is considered Excellent, 60-79 is Good, 40-59 needs work, and below 40 is Poor. The score reflects how well your page is optimized for search engines.</p>

      <h3>How do I improve my On-Page SEO score?</h3>
      <p>Review the checks section to see specific issues and recommendations. Common improvements include: adding missing title tags or meta descriptions, optimizing heading structure, adding alt text to images, and improving content length and quality.</p>

      <h3>What is the ideal title tag length?</h3>
      <p>Aim for 50-60 characters for optimal display in search results. Longer titles get truncated in SERPs. Include your primary keyword near the beginning.</p>

      <h3>What is the ideal meta description length?</h3>
      <p>Aim for 120-160 characters for optimal display in search results. Include your primary keyword and a compelling call to action.</p>

      <h3>How important is content length for SEO?</h3>
      <p>Content length varies by query intent. For informational queries, longer, more comprehensive content often ranks better. For transactional or local queries, concise content can outperform. Focus on quality and satisfying user intent.</p>

      <h2>Conclusion</h2>
      <p>On-page SEO is the foundation of search engine visibility. Our <strong>On-Page SEO Checker</strong> provides the comprehensive analysis you need to identify issues, optimize your content, and improve your search rankings.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, regular on-page optimization is essential for <strong>mobile SEO</strong> and search visibility. Use our <strong>On-Page SEO Checker</strong> as part of your routine maintenance to catch issues early and maintain strong search presence.</p>

      <p>Start optimizing your on-page SEO today—use our <strong>On-Page SEO Checker</strong> to audit your site, identify issues, and ensure your pages are fully optimized for both search engines and users.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>On-Page SEO Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Checker</a> - Detailed meta tag analysis</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Checker</a> - Optimize social sharing</li>
        <li><a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> - Measure content length</li>
        <li><a href="https://opensourcetools.online/tools/keyword-density" target="_blank" rel="noopener noreferrer">Keyword Density Tool</a> - Optimize keyword usage</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
      </ul>

      <p>For further reading on on-page SEO and optimization, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noopener noreferrer">Google SEO Starter Guide</a></li>
        <li><a href="https://moz.com/learn/seo/on-page-seo" target="_blank" rel="noopener noreferrer">Moz On-Page SEO Guide</a></li>
        <li><a href="https://www.semrush.com/blog/on-page-seo/" target="_blank" rel="noopener noreferrer">Semrush On-Page SEO Guide</a></li>
        <li><a href="https://yoast.com/on-page-seo/" target="_blank" rel="noopener noreferrer">Yoast On-Page SEO Guide</a></li>
        <li><a href="https://backlinko.com/on-page-seo" target="_blank" rel="noopener noreferrer">Backlinko On-Page SEO Guide</a></li>
      </ul>
    </article>
  );
}