"use client";
import { useState } from 'react';

const SEVERITY_ICON = { pass: '✓', warn: '!', fail: '✕' };
const SEVERITY_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue' };

export default function MetaTagsCheckerPage() {
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
      const res = await fetch('/api/tools/meta-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl || json?.redirectChain) setData(json);
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
        <h1>🏷️ Meta Tags Checker</h1>
      </div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="https://example.com or example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Fetching…' : '🔍 Check Meta Tags'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Extract every <code>&lt;meta&gt;</code> and <code>&lt;link&gt;</code> tag, see a Google SERP preview,
          inspect Open Graph and Twitter Card tags, and spot length issues at a glance.
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
  const { seoEssentials, opengraph, twitter, metaTagsGrouped, linkTagsGrouped, counts, issues, redirectChain, xRobotsTag } = data;
  const failCount = issues.filter((i) => i.severity === 'fail').length;
  const warnCount = issues.filter((i) => i.severity === 'warn').length;
  const banner = failCount ? 'danger' : warnCount ? 'warning' : 'success';
  const bannerText = failCount
    ? `❌ ${failCount} issue${failCount === 1 ? '' : 's'} found`
    : warnCount
      ? `⚠️ ${warnCount} warning${warnCount === 1 ? '' : 's'}`
      : '✅ All essential meta tags look good';

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {counts.meta} meta · {counts.link} link · 1 title</span>
      </div>

      <SerpPreview essentials={seoEssentials} finalUrl={data.finalUrl} />

      <h3 className="result-section-title">📌 SEO essentials</h3>
      <div className="essentials-grid" style={{ width: '100%' }}>
        <LengthCard
          label="Title"
          value={seoEssentials.title}
          length={seoEssentials.titleLength}
          recommendedMin={30}
          recommendedMax={60}
          truncationLimit={60}
          missingMessage="No <title> tag"
        />
        <LengthCard
          label="Meta description"
          value={seoEssentials.description}
          length={seoEssentials.description?.length || 0}
          recommendedMin={120}
          recommendedMax={160}
          truncationLimit={165}
          missingMessage="No description"
        />
      </div>

      <div className="result-grid" style={{ marginTop: '1rem', width: '100%' }}>
        <Field label="🔗 Canonical" value={seoEssentials.canonical} mono />
        <Field label="🤖 Robots" value={seoEssentials.robots} />
        <Field label="🤖 Googlebot" value={seoEssentials.googlebot} />
        <Field label="📡 X-Robots-Tag" value={xRobotsTag} />
        <Field label="📱 Viewport" value={seoEssentials.viewport} mono />
        <Field label="🔤 Charset" value={seoEssentials.charset} />
        <Field label="🌐 HTML lang" value={seoEssentials.htmlLang} />
        <Field label="📝 HTML dir" value={seoEssentials.htmlDir} />
        <Field label="✍️ Author" value={seoEssentials.author} />
        <Field label="⚙️ Generator" value={seoEssentials.generator} />
        <Field label="🎨 Theme color" value={seoEssentials.themeColor} />
        <Field label="🔑 Keywords" value={seoEssentials.keywords} />
      </div>

      {issues.length > 0 && (
        <>
          <h3 className="result-section-title">📋 Issues & warnings</h3>
          <ul className="issue-list">
            {issues.map((issue, idx) => (
              <li key={idx} className={`issue-item ${issue.severity === 'fail' ? 'error' : 'warn'}`}>
                <span className="issue-tag">{SEVERITY_ICON[issue.severity]} {SEVERITY_LABEL[issue.severity]}</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <SocialPreview opengraph={opengraph} twitter={twitter} finalUrl={data.finalUrl} />

      <h3 className="result-section-title">📋 All meta tags ({counts.meta})</h3>
      <CategoryBlock title="📌 SEO" tags={metaTagsGrouped.seo} kind="meta" />
      <CategoryBlock title="📱 Open Graph" tags={metaTagsGrouped.opengraph} kind="meta" />
      <CategoryBlock title="🐦 Twitter Card" tags={metaTagsGrouped.twitter} kind="meta" />
      <CategoryBlock title="📱 Mobile / PWA" tags={metaTagsGrouped.mobile} kind="meta" />
      <CategoryBlock title="⚙️ Technical (charset, http-equiv)" tags={metaTagsGrouped.technical} kind="meta" />
      <CategoryBlock title="✅ Site verification" tags={metaTagsGrouped.verification} kind="meta" />
      <CategoryBlock title="📄 Microdata" tags={metaTagsGrouped.microdata} kind="meta" />
      <CategoryBlock title="📌 Other" tags={metaTagsGrouped.other} kind="meta" />

      <h3 className="result-section-title">🔗 Link tags ({counts.link})</h3>
      <CategoryBlock title="📌 SEO (canonical, alternate, etc.)" tags={linkTagsGrouped.seo} kind="link" />
      <CategoryBlock title="🖼️ Icons & manifest" tags={linkTagsGrouped.icons} kind="link" />
      <CategoryBlock title="⚡ Performance hints" tags={linkTagsGrouped.performance} kind="link" />
      <CategoryBlock title="🎨 Stylesheets" tags={linkTagsGrouped.stylesheet} kind="link" />
      <CategoryBlock title="📌 Other" tags={linkTagsGrouped.other} kind="link" />

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">🔄 Redirect chain</h3>
          <ol className="redirect-chain">
            {redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className="redirect-status">HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function SerpPreview({ essentials, finalUrl }) {
  const title = essentials.title || 'Untitled page';
  const description = essentials.description || 'No description provided.';
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const truncatedDesc = description.length > 160 ? description.slice(0, 157) + '…' : description;

  let displayUrl = finalUrl || '';
  try {
    const u = new URL(finalUrl);
    displayUrl = `${u.hostname}${u.pathname.replace(/\/$/, '')}`;
  } catch { }

  return (
    <>
      <h3 className="result-section-title">🔍 Google SERP preview</h3>
      <div className="serp-preview">
        <div className="serp-url">{displayUrl}</div>
        <div className="serp-title">{truncatedTitle}</div>
        <div className="serp-description">{truncatedDesc}</div>
      </div>
    </>
  );
}

function SocialPreview({ opengraph, twitter, finalUrl }) {
  const ogKeys = Object.keys(opengraph);
  const twKeys = Object.keys(twitter);
  if (!ogKeys.length && !twKeys.length) return null;

  const ogTitle = opengraph['og:title'];
  const ogDesc = opengraph['og:description'];
  const ogImage = opengraph['og:image'] || opengraph['og:image:url'];
  const ogSite = opengraph['og:site_name'];

  let host = '';
  try { host = new URL(finalUrl).hostname; } catch { }

  return (
    <>
      <h3 className="result-section-title">📱 Social preview</h3>
      <div className="social-grid" style={{ width: '100%' }}>
        {(ogTitle || ogDesc || ogImage) ? (
          <div className="social-card">
            <div className="social-card-label">📘 Open Graph (Facebook / LinkedIn / WhatsApp)</div>
            {ogImage && (
              <div className="social-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAbs(ogImage, finalUrl)} alt="Open Graph image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
            <div className="social-card-body">
              <div className="social-card-host">{ogSite || host}</div>
              <div className="social-card-title">{ogTitle || '(no og:title)'}</div>
              <div className="social-card-desc">{ogDesc || '(no og:description)'}</div>
            </div>
          </div>
        ) : null}

        {twKeys.length > 0 && (
          <div className="social-card">
            <div className="social-card-label">🐦 Twitter Card ({twitter['twitter:card'] || 'summary'})</div>
            {(twitter['twitter:image'] || ogImage) && (
              <div className="social-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAbs(twitter['twitter:image'] || ogImage, finalUrl)} alt="Twitter card image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
            <div className="social-card-body">
              <div className="social-card-host">{twitter['twitter:site'] || host}</div>
              <div className="social-card-title">{twitter['twitter:title'] || ogTitle || '(no twitter:title)'}</div>
              <div className="social-card-desc">{twitter['twitter:description'] || ogDesc || '(no twitter:description)'}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function resolveAbs(href, base) {
  if (!href) return '';
  try { return new URL(href, base).toString(); }
  catch { return href; }
}

function LengthCard({ label, value, length, recommendedMin, recommendedMax, truncationLimit, missingMessage }) {
  if (!value) {
    return (
      <div className="length-card length-card-empty">
        <div className="length-card-label">{label}</div>
        <div className="length-card-missing">{missingMessage}</div>
      </div>
    );
  }
  const overTruncation = length > truncationLimit;
  const tooShort = length < recommendedMin;
  const status = overTruncation ? 'over' : tooShort ? 'short' : 'good';
  const pct = Math.min(100, Math.round((length / truncationLimit) * 100));
  return (
    <div className="length-card">
      <div className="length-card-head">
        <span className="length-card-label">{label}</span>
        <span className={`length-card-count ${status}`}>{length} chars</span>
      </div>
      <div className="length-card-value">{value}</div>
      <div className="length-bar">
        <div className={`length-bar-fill ${status}`} style={{ width: `${pct}%` }} />
        <div className="length-bar-marker" style={{ left: `${(recommendedMin / truncationLimit) * 100}%` }} title={`min ${recommendedMin}`} />
        <div className="length-bar-marker" style={{ left: `${(recommendedMax / truncationLimit) * 100}%` }} title={`recommended ${recommendedMax}`} />
      </div>
      <div className="length-card-hint">
        Recommended {recommendedMin}–{recommendedMax} · Truncation around {truncationLimit}
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="result-item">
      <span className="result-label">{label}</span>
      <span className={mono ? 'result-value-mono' : 'result-value'}>{value || <em className="muted">—</em>}</span>
    </div>
  );
}

function CategoryBlock({ title, tags, kind }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="meta-category">
      <h4 className="meta-category-title">{title} <span className="meta-count">({tags.length})</span></h4>
      <div className="meta-tag-list">
        {tags.map((tag, idx) => (
          <RawTag key={idx} attrs={tag} kind={kind} />
        ))}
      </div>
    </div>
  );
}

function RawTag({ attrs, kind }) {
  const skip = new Set(['_kind', '_category', '_absoluteHref']);
  const tagName = kind === 'link' ? 'link' : 'meta';
  const pairs = Object.entries(attrs).filter(([k]) => !skip.has(k));
  return (
    <code className="meta-tag-code">
      &lt;{tagName}
      {pairs.map(([k, v]) => (
        <span key={k}>
          {' '}<span className="meta-attr-key">{k}</span>=<span className="meta-attr-val">&quot;{String(v)}&quot;</span>
        </span>
      ))}
      {' '}/&gt;
    </code>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Meta Tags Explained: The Hidden HTML That Controls How Search Engines and Social Networks See You</h2>
      <p>Meta tags are snippets of HTML that live inside the <code>&lt;head&gt;</code> of a page. Visitors never see them, but they tell search engines, social networks, and browsers how to handle, display, and index your page. Getting them right is the foundation of technical SEO.</p>

      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/meta-tags" target="_blank" rel="noopener noreferrer">Google Search Central</a>, proper meta tag implementation is essential for search engine understanding and user engagement. Our <strong>Meta Tags Checker</strong> helps you verify your tags and ensure your content is properly optimized for both search engines and social platforms.</p>

      <h2>What This Tool Does</h2>
      <p>Paste any URL above and we'll fetch the live HTML, extract every meta and link tag, group them by category, and warn you about length issues, duplicates, and missing essentials. Run it on your own pages before launch — and on competitors to learn what they're telling search engines that you're not.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a>, you can ensure your site is fully optimized for all platforms.</p>

      <h2>The Title Tag</h2>
      <p>Technically a separate element rather than a meta tag, the <code>&lt;title&gt;</code> is the single most important on-page SEO signal. It's what shows up as the headline in Google search results and in browser tabs. Aim for 30–60 characters; longer titles get truncated in SERPs.</p>

      <p>According to <a href="https://moz.com/learn/seo/title-tag" target="_blank" rel="noopener noreferrer">Moz</a>, the title tag is the most important on-page SEO factor. It should include your primary keyword and provide a compelling reason to click.</p>

      <h2>Meta Description</h2>
      <p><code>&lt;meta name="description"&gt;</code> doesn't directly affect rankings, but it heavily influences click-through rate. Google bolds matching keywords from the searcher's query in the snippet. Aim for 120–160 characters with a clear value proposition.</p>

      <h2>Robots and Canonical</h2>
      <p><code>&lt;meta name="robots"&gt;</code> tells search engines whether to index the page and follow its links. <code>&lt;link rel="canonical"&gt;</code> declares the preferred URL when the same content is reachable through multiple paths — critical for sites with filters, tracking parameters, or print versions.</p>

      <h2>Open Graph &amp; Twitter Card</h2>
      <p><code>og:title</code>, <code>og:description</code>, and <code>og:image</code> control how a page renders when shared on Facebook, LinkedIn, WhatsApp, Slack, Discord, and most messaging apps. Twitter (now X) reads <code>twitter:card</code>, falling back to OG. Without an explicit image, social platforms guess — and they usually guess badly.</p>

      <h2>Viewport and Charset</h2>
      <p><code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> is mandatory for <strong>mobile-friendly rendering</strong> — and Google now indexes the mobile version of your site first (<strong>mobile-first indexing</strong>). <code>&lt;meta charset="UTF-8"&gt;</code> avoids garbled characters on international content.</p>

      <h2>Common Meta Tag Issues and How to Fix Them</h2>

      <h3>1. Missing Title Tag</h3>
      <p><strong>The Problem:</strong> No <code>&lt;title&gt;</code> tag in the page head.</p>
      <p><strong>The Fix:</strong> Add a unique, descriptive title tag (30-60 characters) to every page.</p>

      <h3>2. Missing or Short Meta Description</h3>
      <p><strong>The Problem:</strong> No description or description under 120 characters.</p>
      <p><strong>The Fix:</strong> Write a compelling description (120-160 characters) that includes your primary keyword.</p>

      <h3>3. Missing Viewport Tag</h3>
      <p><strong>The Problem:</strong> No viewport meta tag, causing poor <strong>mobile SEO</strong>.</p>
      <p><strong>The Fix:</strong> Add <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> to every page.</p>

      <h3>4. Duplicate Meta Tags</h3>
      <p><strong>The Problem:</strong> Multiple identical meta tags on the same page.</p>
      <p><strong>The Fix:</strong> Remove duplicates and ensure only one of each meta tag type exists.</p>

      <h2>Best Practices for Meta Tag Implementation</h2>

      <h3>1. Use Unique Tags Per Page</h3>
      <p>Every page should have unique title and description tags. Duplicate tags across pages can confuse search engines and reduce click-through rates.</p>

      <h3>2. Include Target Keywords</h3>
      <p>Include your primary target keyword in the title tag and meta description for better relevance.</p>

      <h3>3. Keep Titles Under 60 Characters</h3>
      <p>Longer titles get truncated in search results. Keep titles under 60 characters for full display.</p>

      <h3>4. Write Compelling Descriptions</h3>
      <p>Descriptions should be compelling and action-oriented. Include a clear value proposition and call to action.</p>

      <h3>5. Implement Open Graph Tags</h3>
      <p>Add Open Graph tags for better social sharing. Our <a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Checker</a> can help validate your implementation.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Page Checking</h3>
      <p>Enter any URL to check its meta tags. The tool extracts all meta and link tags, groups them by category, and highlights issues.</p>

      <h3>Competitor Analysis</h3>
      <p>Analyze competitor pages to understand their meta tag strategy. Learn what they're telling search engines and social platforms.</p>

      <h3>Post-Launch Verification</h3>
      <p>After launching new pages or updating content, use our tool to verify tags are correct. Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive verification.</p>

      <h2>Monitoring Meta Tags Over Time</h2>
      <p>Regular monitoring with our <strong>Meta Tags Checker</strong> helps you:</p>
      <ul>
        <li>Detect tag changes introduced during updates</li>
        <li>Identify missing or duplicate tags</li>
        <li>Verify tag length and quality</li>
        <li>Maintain <strong>mobile-friendly websites</strong> with proper tags</li>
        <li>Protect your search visibility</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> and <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> for comprehensive site optimization.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Meta Tags Checker?</h3>
      <p>A <strong>Meta Tags Checker</strong> is a tool that analyzes a webpage's meta and link tags, validating them against SEO best practices. It checks title length, description length, viewport, robots, canonical, and social tags.</p>

      <h3>Why are meta tags important for SEO?</h3>
      <p>Meta tags tell search engines what your page is about, how to display it, and whether to index it. They directly impact click-through rates and search visibility, making them essential for <strong>mobile SEO</strong>.</p>

      <h3>What is the ideal title tag length?</h3>
      <p>Google typically displays the first 50-60 characters of a title tag. Aim for 30-60 characters to ensure your full title appears in search results.</p>

      <h3>What is the ideal meta description length?</h3>
      <p>Google typically displays 155-160 characters of a meta description. Aim for 120-160 characters for optimal display in search results.</p>

      <h3>What is the viewport meta tag?</h3>
      <p>The viewport meta tag controls how your page renders on mobile devices. <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code> is essential for <strong>mobile-friendly websites</strong>.</p>

      <h2>Conclusion</h2>
      <p>Proper meta tag implementation is fundamental to technical SEO, user engagement, and <strong>mobile SEO</strong> success. Our <strong>Meta Tags Checker</strong> provides the detailed analysis you need to ensure your tags are properly configured and optimized.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper meta tags are essential for search visibility and click-through rates. Use our <strong>Meta Tags Checker</strong> as part of your routine maintenance to catch issues early and maintain strong search presence.</p>

      <p>Start checking your meta tags today—use our <strong>Meta Tags Checker</strong> to audit your site, identify issues, and ensure your tags are properly optimized for both search engines and social platforms.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Meta Tags Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Comprehensive content analysis</li>
        <li><a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Checker</a> - Optimize social sharing</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Optimize URL forwarding</li>
      </ul>

      <p>For further reading on meta tags and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/meta-tags" target="_blank" rel="noopener noreferrer">Google Search Central: Meta Tags</a></li>
        <li><a href="https://moz.com/learn/seo/title-tag" target="_blank" rel="noopener noreferrer">Moz Title Tag Guide</a></li>
        <li><a href="https://www.semrush.com/blog/meta-description/" target="_blank" rel="noopener noreferrer">Semrush Meta Description Guide</a></li>
        <li><a href="https://yoast.com/meta-tags/" target="_blank" rel="noopener noreferrer">Yoast Meta Tags Guide</a></li>
        <li><a href="https://developers.facebook.com/docs/sharing/webmasters/" target="_blank" rel="noopener noreferrer">Facebook Open Graph Documentation</a></li>
      </ul>
    </article>
  );
}