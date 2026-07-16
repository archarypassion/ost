"use client";
import { useState } from 'react';

const SEVERITY_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEVERITY_LABEL = { pass: 'Good', warn: 'Recommend', fail: 'Required', info: 'Info' };

const RICH_RESULT_TYPES = new Set([
  'Article', 'NewsArticle', 'BlogPosting',
  'Product', 'FAQPage', 'HowTo', 'Recipe',
  'Event', 'LocalBusiness', 'VideoObject', 'BreadcrumbList', 'Review',
]);

export default function SchemaCheckerPage() {
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
      const res = await fetch('/api/tools/schema-checker', {
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
        <h1>📊 Schema Markup Checker</h1>
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
            {loading ? '⏳ Detecting…' : '🔍 Check Schema'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Detect every JSON-LD, Microdata, and RDFa block on a page, validate each item against Google's rich-result
          requirements, and see exactly which schema types are eligible for enhanced search listings.
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
  const { itemCount, jsonLdBlocks, parseErrors, typeCounts, items, microdata, rdfa, richResultEligibleTypes, richResultBlockedTypes, summary, redirectChain } = data;

  const totalDetected = itemCount + microdata.count + rdfa.count;
  const banner = summary.fail || parseErrors ? 'danger' : summary.warn ? 'warning' : (totalDetected ? 'success' : 'warning');
  const bannerText = totalDetected === 0
    ? '⚠️ No structured data found on this page'
    : parseErrors
      ? `❌ ${parseErrors} JSON-LD block${parseErrors === 1 ? '' : 's'} failed to parse`
      : summary.fail
        ? `❌ ${summary.fail} required field${summary.fail === 1 ? '' : 's'} missing across items`
        : summary.warn
          ? `⚠️ ${summary.warn} recommended field${summary.warn === 1 ? '' : 's'} missing`
          : `✅ ${itemCount} JSON-LD item${itemCount === 1 ? '' : 's'} look valid`;

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {jsonLdBlocks} JSON-LD block{jsonLdBlocks === 1 ? '' : 's'} · {itemCount} item{itemCount === 1 ? '' : 's'} · {microdata.count} microdata · {rdfa.count} RDFa</span>
      </div>

      <div className="schema-summary" style={{ width: '100%' }}>
        <SummaryCard label="📦 JSON-LD blocks" value={jsonLdBlocks} sub={parseErrors ? `${parseErrors} parse error${parseErrors === 1 ? '' : 's'}` : 'all parsed cleanly'} tone={parseErrors ? 'danger' : 'success'} />
        <SummaryCard label="📋 Items with @type" value={itemCount} sub={`across ${Object.keys(typeCounts).length} type${Object.keys(typeCounts).length === 1 ? '' : 's'}`} tone="default" />
        <SummaryCard label="⭐ Rich-result eligible" value={richResultEligibleTypes.length} sub={richResultEligibleTypes.length ? richResultEligibleTypes.join(', ') : 'none'} tone={richResultEligibleTypes.length ? 'success' : 'default'} />
        <SummaryCard label="📄 Microdata / RDFa" value={microdata.count + rdfa.count} sub={`microdata: ${microdata.count} · rdfa: ${rdfa.count}`} tone="default" />
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <>
          <h3 className="result-section-title">🏷️ Detected types</h3>
          <div className="schema-type-cloud">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <span
                  key={type}
                  className={`schema-type-chip ${RICH_RESULT_TYPES.has(type) ? 'rich' : ''}`}
                  title={RICH_RESULT_TYPES.has(type) ? '⭐ Eligible for Google rich results' : ''}
                >
                  {type}{count > 1 ? ` ×${count}` : ''}
                  {RICH_RESULT_TYPES.has(type) && ' ⭐'}
                </span>
              ))}
          </div>
        </>
      )}

      {richResultBlockedTypes.length > 0 && (
        <div className="schema-blocked-banner">
          <strong>❌ Blocked from rich results:</strong> {richResultBlockedTypes.join(', ')} — required fields are missing. See the items below for details.
        </div>
      )}

      {items.length > 0 && (
        <>
          <h3 className="result-section-title">📋 Items ({items.length})</h3>
          <div className="schema-items" style={{ width: '100%' }}>
            {items.map((it, idx) => <ItemCard key={idx} item={it} index={idx} />)}
          </div>
        </>
      )}

      {microdata.count > 0 && (
        <>
          <h3 className="result-section-title">📄 Microdata ({microdata.count})</h3>
          <div className="schema-mini-list">
            {microdata.items.map((m, idx) => (
              <div key={idx} className="schema-mini-row">
                <span className="schema-mini-label">{m.type || '(no type)'}</span>
                {m.itemtype && <code className="schema-mini-url">{m.itemtype}</code>}
              </div>
            ))}
          </div>
          <div className="schema-note">💡 Microdata is detected but not deeply validated. Google supports it; JSON-LD is preferred for new implementations.</div>
        </>
      )}

      {rdfa.count > 0 && (
        <>
          <h3 className="result-section-title">📄 RDFa ({rdfa.count})</h3>
          <div className="schema-mini-list">
            {rdfa.items.map((m, idx) => (
              <div key={idx} className="schema-mini-row">
                <span className="schema-mini-label">{m.type || '(no type)'}</span>
                {m.vocab && <code className="schema-mini-url">vocab: {m.vocab}</code>}
              </div>
            ))}
          </div>
        </>
      )}

      {totalDetected === 0 && (
        <div className="schema-empty">
          <h3>⚠️ No structured data detected.</h3>
          <p>This page has no JSON-LD <code>&lt;script&gt;</code> tags, no Microdata <code>itemscope</code> attributes, and no RDFa <code>typeof</code> attributes. Adding schema markup makes pages eligible for Google rich results — start with <code>@type: Article</code> for content pages or <code>@type: Product</code> for commerce pages.</p>
        </div>
      )}

      <div className="schema-disclaimer">
        💡 Validation here mirrors Google's required/recommended properties for the most common rich-result types. For
        the official verdict, run the same URL through Google's {' '}
        <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(data.finalUrl || data.url)}`} target="_blank" rel="noreferrer">Rich Results Test</a>.
      </div>

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

function SummaryCard({ label, value, sub, tone }) {
  return (
    <div className={`schema-summary-card tone-${tone}`}>
      <div className="schema-summary-label">{label}</div>
      <div className="schema-summary-value">{value}</div>
      <div className="schema-summary-sub">{sub}</div>
    </div>
  );
}

function ItemCard({ item, index }) {
  const [expanded, setExpanded] = useState(index < 3); // Auto-expand first 3
  const isRichEligible = item.types.some((t) => RICH_RESULT_TYPES.has(t));
  const status = item.parseError
    ? 'fail'
    : item.summary.fail
      ? 'fail'
      : item.summary.warn
        ? 'warn'
        : 'pass';

  return (
    <div className={`schema-item sev-${status}`}>
      <div className="schema-item-head" onClick={() => setExpanded(!expanded)}>
        <div className="schema-item-head-left">
          <span className={`schema-item-icon sev-${status}`}>
            {status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌'}
          </span>
          <div>
            <div className="schema-item-types">
              {item.types.map((t, i) => (
                <span key={i} className={`schema-item-type ${RICH_RESULT_TYPES.has(t) ? 'rich' : ''}`}>{t}</span>
              ))}
              {isRichEligible && status === 'pass' && (
                <span className="schema-item-badge">⭐ eligible for rich results</span>
              )}
            </div>
            <div className="schema-item-meta">
              {item.format} · block #{item.block + 1}{item.path && item.path !== 'root' ? ` · ${item.path}` : ''}
              {' · '}
              ✅ {item.summary.pass} pass · ⚠️ {item.summary.warn} warn · ❌ {item.summary.fail} fail
            </div>
          </div>
        </div>
        <button type="button" className="schema-item-toggle">{expanded ? '−' : '+'}</button>
      </div>

      {expanded && (
        <div className="schema-item-body">
          {item.parseError && (
            <div className="schema-parse-error">
              <strong>❌ Parse error:</strong> {item.parseError}
              <details style={{ marginTop: '0.5rem' }}>
                <summary>📄 Raw JSON-LD</summary>
                <pre className="schema-raw">{item.raw}</pre>
              </details>
            </div>
          )}

          {item.checks && item.checks.length > 0 && (
            <ul className="schema-check-list">
              {item.checks.map((c, idx) => (
                <li key={idx} className={`schema-check sev-${c.severity}`}>
                  <span className={`schema-check-icon sev-${c.severity}`}>{SEVERITY_ICON[c.severity]}</span>
                  <div className="schema-check-body">
                    <div className="schema-check-head">
                      <code className="schema-check-prop">{c.prop}</code>
                      <span className={`schema-check-label sev-${c.severity}`}>{SEVERITY_LABEL[c.severity]}</span>
                    </div>
                    <div className="schema-check-msg">{c.message}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {item.data && (
            <details className="schema-raw-details">
              <summary>📄 Raw JSON-LD</summary>
              <pre className="schema-raw">{JSON.stringify(item.data, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Schema Markup: The Structured Data Layer That Unlocks Rich Results</h2>
      <p>Schema markup is structured data — code you add to your pages that explicitly tells search engines what your content <em>means</em>, not just what it says. Standard HTML tells Google a string is a heading. Schema tells Google it's a <code>Product</code> with a price, a <code>Recipe</code> with a cooking time, or a <code>FAQ</code> with questions and answers. That extra precision unlocks rich results — the visually enhanced search listings with stars, prices, accordions, and step-by-step previews that consistently outperform plain blue links.</p>

      <p>According to <a href="https://developers.google.com/search/docs/appearance/structured-data" target="_blank" rel="noopener noreferrer">Google Search Central</a>, structured data is one of the most effective ways to enhance your search presence. Our <strong>Schema Markup Checker</strong> helps you validate your implementation and identify issues before they impact your <strong>mobile SEO</strong> and rich result eligibility.</p>

      <h2>What This Tool Does</h2>
      <p>Paste any URL above. We fetch the live HTML, extract every JSON-LD block, walk into <code>@graph</code> arrays and nested objects, and validate each item against Google's requirements for its type. We also detect Microdata and RDFa so you know they exist — but JSON-LD gets the deep validation. After fixing issues here, run the same URL through Google's Rich Results Test for the official verdict.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a>, you can ensure your site is fully optimized for search engines.</p>

      <h2>Why Schema Markup Matters for SEO</h2>

      <h3>1. Unlocks Rich Results</h3>
      <p>Rich results (formerly called rich snippets) are enhanced search listings that include additional visual elements like star ratings, prices, images, and more. These consistently outperform plain blue links in click-through rates. <a href="https://developers.google.com/search/docs/appearance/rich-results" target="_blank" rel="noopener noreferrer">Google's rich results documentation</a> explains the requirements.</p>

      <h3>2. Improves Mobile SEO</h3>
      <p>Rich results are especially important for <strong>mobile-friendly websites</strong>. Mobile search results often show rich results more prominently, making them a key factor in <strong>mobile SEO</strong> success.</p>

      <h3>3. Provides Context to Search Engines</h3>
      <p>Schema markup helps search engines understand your content's context and meaning. This can lead to better indexing and more relevant search results.</p>

      <h2>JSON-LD is the Format Google Prefers</h2>
      <p>Schema can be encoded as JSON-LD, Microdata, or RDFa. Google supports all three but recommends JSON-LD for new implementations. JSON-LD lives in a <code>&lt;script type="application/ld+json"&gt;</code> tag and is decoupled from your HTML — easier to maintain, easier to template, harder to break with markup changes.</p>

      <h2>The Most Impactful Schema Types</h2>

      <ul>
        <li><strong>📝 Article / NewsArticle / BlogPosting</strong> for editorial content</li>
        <li><strong>🛍️ Product</strong> with price + availability for e-commerce</li>
        <li><strong>❓ FAQPage</strong> can double your search-result footprint with an accordion</li>
        <li><strong>📋 HowTo</strong> renders step-by-step previews</li>
        <li><strong>🍳 Recipe</strong> shows cooking time and ratings</li>
        <li><strong>📅 Event</strong> shows dates and venues</li>
        <li><strong>🏪 LocalBusiness</strong> powers map cards</li>
        <li><strong>🔗 BreadcrumbList</strong> replaces the URL line in SERPs with your site hierarchy</li>
      </ul>

      <h2>Common Schema Errors That Cost You Rich Results</h2>

      <h3>1. Missing Required Properties</h3>
      <p>Missing required properties is the #1 failure mode. A <code>Recipe</code> without an <code>image</code>, an <code>Article</code> without a <code>datePublished</code>, a <code>FAQPage</code> Question without an <code>acceptedAnswer.text</code> — any of these disqualifies the page even when the rest of the schema is correct.</p>

      <h3>2. Content Not Visible on Page</h3>
      <p>Schema describing content that isn't visible on the page (cloaking with structured data) is a manual-action risk. Always ensure your schema accurately reflects visible page content.</p>

      <h3>3. Invalid Schema Types</h3>
      <p>Using unsupported or invalid schema types can prevent rich results. Always use types from <a href="https://schema.org/docs/full.html" target="_blank" rel="noopener noreferrer">Schema.org</a> that are supported by Google.</p>

      <h3>4. Multiple Inconsistent Schemas</h3>
      <p>Having multiple schemas that contradict each other can confuse search engines. Ensure consistency across your structured data.</p>

      <h2>Best Practices for Schema Markup Implementation</h2>

      <h3>1. Use JSON-LD</h3>
      <p>Google recommends JSON-LD for schema markup. It's easier to maintain and less likely to break with HTML changes. Our <strong>Schema Markup Checker</strong> prioritizes JSON-LD validation.</p>

      <h3>2. Include All Required Properties</h3>
      <p>Review Google's requirements for each schema type. Ensure all required properties are present and valid. Our tool highlights missing required fields.</p>

      <h3>3. Keep Schema Up to Date</h3>
      <p>Schema markup should reflect current page content. Update schemas when you update content to maintain accuracy.</p>

      <h3>4. Test with Official Tools</h3>
      <p>After implementing schema, test with our <strong>Schema Markup Checker</strong> and Google's <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Rich Results Test</a> for the official verdict.</p>

      <h3>5. Monitor Schema Performance</h3>
      <p>Monitor your rich results in Google Search Console. Track which pages are generating rich results and identify opportunities for improvement.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Single Page Checking</h3>
      <p>Enter any URL to check its schema markup. The tool extracts JSON-LD, Microdata, and RDFa, validating each against Google's rich-result requirements.</p>

      <h3>Identify Issues</h3>
      <p>The tool highlights missing required fields and recommended improvements. Fix these issues to improve rich result eligibility.</p>

      <h3>Verify After Changes</h3>
      <p>After making schema updates, re-run our tool to verify fixes. Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive optimization.</p>

      <h2>Monitoring Schema Markup Over Time</h2>
      <p>Regular monitoring with our <strong>Schema Markup Checker</strong> helps you:</p>
      <ul>
        <li>Detect schema issues introduced during updates</li>
        <li>Verify rich result eligibility remains valid</li>
        <li>Identify new schema opportunities</li>
        <li>Maintain <strong>mobile-friendly websites</strong> with proper structured data</li>
        <li>Protect your rich result visibility</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> and <a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> for comprehensive site optimization.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is Schema Markup Checker?</h3>
      <p>A <strong>Schema Markup Checker</strong> is a tool that analyzes a webpage's structured data, validating JSON-LD, Microdata, and RDFa against Google's rich-result requirements. It identifies missing required fields and recommends improvements.</p>

      <h3>Why is schema markup important for SEO?</h3>
      <p>Schema markup unlocks rich results in search listings, improving click-through rates and <strong>mobile SEO</strong>. It helps search engines understand content context, leading to better indexing and visibility.</p>

      <h3>What is JSON-LD?</h3>
      <p>JSON-LD (JavaScript Object Notation for Linked Data) is Google's preferred format for schema markup. It's included in a <code>&lt;script&gt;</code> tag and is easier to maintain than Microdata or RDFa.</p>

      <h3>What are rich results?</h3>
      <p>Rich results are enhanced search listings with additional visual elements like star ratings, prices, images, and accordions. They consistently outperform plain blue links in click-through rates.</p>

      <h3>What is the most important schema type?</h3>
      <p>It depends on your content. <strong>Article</strong> is most important for publishers, <strong>Product</strong> for e-commerce, <strong>FAQPage</strong> for Q&A content, and <strong>LocalBusiness</strong> for local SEO.</p>

      <h3>How do I fix schema errors?</h3>
      <p>Review missing required fields and recommended improvements. Add missing properties, correct invalid values, and ensure schema accurately reflects page content. Use our <strong>Schema Markup Checker</strong> to verify fixes.</p>

      <h2>Conclusion</h2>
      <p>Schema markup is one of the most effective ways to enhance your search presence and unlock rich results. Our <strong>Schema Markup Checker</strong> provides the detailed validation you need to ensure your structured data is properly implemented and eligible for rich results.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper schema markup is essential for <strong>mobile SEO</strong> and search visibility. Use our <strong>Schema Markup Checker</strong> as part of your routine maintenance to catch issues early and maintain rich result eligibility.</p>

      <p>Start validating your schema markup today—use our <strong>Schema Markup Checker</strong> to audit your site, identify issues, and ensure your structured data is properly implemented for both users and search engines.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Schema Markup Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Comprehensive content analysis</li>
        <li><a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> - Optimize metadata</li>
        <li><a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Inspector</a> - Optimize social sharing</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
      </ul>

      <p>For further reading on schema markup and structured data, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/appearance/structured-data" target="_blank" rel="noopener noreferrer">Google Search Central: Structured Data</a></li>
        <li><a href="https://developers.google.com/search/docs/appearance/rich-results" target="_blank" rel="noopener noreferrer">Google Search Central: Rich Results</a></li>
        <li><a href="https://schema.org/docs/full.html" target="_blank" rel="noopener noreferrer">Schema.org Full Documentation</a></li>
        <li><a href="https://moz.com/learn/seo/schema-structured-data" target="_blank" rel="noopener noreferrer">Moz Schema Guide</a></li>
        <li><a href="https://www.semrush.com/blog/schema-markup/" target="_blank" rel="noopener noreferrer">Semrush Schema Markup Guide</a></li>
      </ul>
    </article>
  );
}