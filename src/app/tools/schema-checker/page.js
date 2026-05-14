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
        <h1>Schema Markup Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            placeholder="https://example.com or example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Detecting…' : 'Check Schema'}
          </button>
        </form>
        <p className="tool-description">
          Detect every JSON-LD, Microdata, and RDFa block on a page, validate each item against Google’s rich-result
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
    ? 'No structured data found on this page'
    : parseErrors
    ? `${parseErrors} JSON-LD block${parseErrors === 1 ? '' : 's'} failed to parse`
    : summary.fail
    ? `${summary.fail} required field${summary.fail === 1 ? '' : 's'} missing across items`
    : summary.warn
    ? `${summary.warn} recommended field${summary.warn === 1 ? '' : 's'} missing`
    : `${itemCount} JSON-LD item${itemCount === 1 ? '' : 's'} look valid`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {jsonLdBlocks} JSON-LD block{jsonLdBlocks === 1 ? '' : 's'} · {itemCount} item{itemCount === 1 ? '' : 's'} · {microdata.count} microdata · {rdfa.count} RDFa</span>
      </div>

      <div className="schema-summary">
        <SummaryCard label="JSON-LD blocks" value={jsonLdBlocks} sub={parseErrors ? `${parseErrors} parse error${parseErrors === 1 ? '' : 's'}` : 'all parsed cleanly'} tone={parseErrors ? 'danger' : 'success'} />
        <SummaryCard label="Items with @type" value={itemCount} sub={`across ${Object.keys(typeCounts).length} type${Object.keys(typeCounts).length === 1 ? '' : 's'}`} tone="default" />
        <SummaryCard label="Rich-result eligible" value={richResultEligibleTypes.length} sub={richResultEligibleTypes.length ? richResultEligibleTypes.join(', ') : 'none'} tone={richResultEligibleTypes.length ? 'success' : 'default'} />
        <SummaryCard label="Microdata / RDFa" value={microdata.count + rdfa.count} sub={`microdata: ${microdata.count} · rdfa: ${rdfa.count}`} tone="default" />
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <>
          <h3 className="result-section-title">Detected types</h3>
          <div className="schema-type-cloud">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <span
                  key={type}
                  className={`schema-type-chip ${RICH_RESULT_TYPES.has(type) ? 'rich' : ''}`}
                  title={RICH_RESULT_TYPES.has(type) ? 'Eligible for Google rich results' : ''}
                >
                  {type}{count > 1 ? ` ×${count}` : ''}
                </span>
              ))}
          </div>
        </>
      )}

      {richResultBlockedTypes.length > 0 && (
        <div className="schema-blocked-banner">
          <strong>Blocked from rich results:</strong> {richResultBlockedTypes.join(', ')} — required fields are missing. See the items below for details.
        </div>
      )}

      {items.length > 0 && (
        <>
          <h3 className="result-section-title">Items ({items.length})</h3>
          <div className="schema-items">
            {items.map((it, idx) => <ItemCard key={idx} item={it} index={idx} />)}
          </div>
        </>
      )}

      {microdata.count > 0 && (
        <>
          <h3 className="result-section-title">Microdata ({microdata.count})</h3>
          <div className="schema-mini-list">
            {microdata.items.map((m, idx) => (
              <div key={idx} className="schema-mini-row">
                <span className="schema-mini-label">{m.type || '(no type)'}</span>
                {m.itemtype && <code className="schema-mini-url">{m.itemtype}</code>}
              </div>
            ))}
          </div>
          <div className="schema-note">Microdata is detected but not deeply validated. Google supports it; JSON-LD is preferred for new implementations.</div>
        </>
      )}

      {rdfa.count > 0 && (
        <>
          <h3 className="result-section-title">RDFa ({rdfa.count})</h3>
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
          <h3>No structured data detected.</h3>
          <p>This page has no JSON-LD <code>&lt;script&gt;</code> tags, no Microdata <code>itemscope</code> attributes, and no RDFa <code>typeof</code> attributes. Adding schema markup makes pages eligible for Google rich results — start with <code>@type: Article</code> for content pages or <code>@type: Product</code> for commerce pages.</p>
        </div>
      )}

      <div className="schema-disclaimer">
        Validation here mirrors Google’s required/recommended properties for the most common rich-result types. For
        the official verdict, run the same URL through Google’s {' '}
        <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(data.finalUrl || data.url)}`} target="_blank" rel="noreferrer">Rich Results Test</a>.
      </div>

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">Redirect chain</h3>
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
            {status === 'pass' ? '✓' : status === 'warn' ? '!' : '✕'}
          </span>
          <div>
            <div className="schema-item-types">
              {item.types.map((t, i) => (
                <span key={i} className={`schema-item-type ${RICH_RESULT_TYPES.has(t) ? 'rich' : ''}`}>{t}</span>
              ))}
              {isRichEligible && status === 'pass' && (
                <span className="schema-item-badge">eligible for rich results</span>
              )}
            </div>
            <div className="schema-item-meta">
              {item.format} · block #{item.block + 1}{item.path && item.path !== 'root' ? ` · ${item.path}` : ''}
              {' · '}
              {item.summary.pass} pass · {item.summary.warn} warn · {item.summary.fail} fail
            </div>
          </div>
        </div>
        <button type="button" className="schema-item-toggle">{expanded ? '−' : '+'}</button>
      </div>

      {expanded && (
        <div className="schema-item-body">
          {item.parseError && (
            <div className="schema-parse-error">
              <strong>Parse error:</strong> {item.parseError}
              <details style={{ marginTop: '0.5rem' }}>
                <summary>Raw JSON-LD</summary>
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
              <summary>Raw JSON-LD</summary>
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
      <p>Schema markup is structured data — code you add to your pages that explicitly tells search engines what your content <em>means</em>, not just what it says. Standard HTML tells Google a string is a heading. Schema tells Google it’s a <code>Product</code> with a price, a <code>Recipe</code> with a cooking time, or a <code>FAQ</code> with questions and answers. That extra precision unlocks rich results — the visually enhanced search listings with stars, prices, accordions, and step-by-step previews that consistently outperform plain blue links.</p>
      <h3>JSON-LD is the format Google prefers</h3>
      <p>Schema can be encoded as JSON-LD, Microdata, or RDFa. Google supports all three but recommends JSON-LD for new implementations. JSON-LD lives in a <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> tag and is decoupled from your HTML — easier to maintain, easier to template, harder to break with markup changes.</p>
      <h3>The most impactful types</h3>
      <p><strong>Article / NewsArticle / BlogPosting</strong> for editorial content. <strong>Product</strong> with price + availability for e-commerce. <strong>FAQPage</strong> can double your search-result footprint with an accordion. <strong>HowTo</strong> renders step-by-step previews. <strong>Recipe</strong> shows cooking time and ratings. <strong>Event</strong> shows dates and venues. <strong>LocalBusiness</strong> powers map cards. <strong>BreadcrumbList</strong> replaces the URL line in SERPs with your site hierarchy.</p>
      <h3>The errors that cost you rich results</h3>
      <p>Missing required properties is the #1 failure mode. A <code>Recipe</code> without an <code>image</code>, an <code>Article</code> without a <code>datePublished</code>, a <code>FAQPage</code> Question without an <code>acceptedAnswer.text</code> — any of these disqualifies the page even when the rest of the schema is correct. The second most common: schema describing content that isn’t visible on the page (cloaking with structured data is a manual-action risk).</p>
      <h3>How to use this tool</h3>
      <p>Paste any URL above. We fetch the live HTML, extract every JSON-LD block, walk into <code>@graph</code> arrays and nested objects, and validate each item against Google’s requirements for its type. We also detect Microdata and RDFa so you know they exist — but JSON-LD gets the deep validation. After fixing issues here, run the same URL through Google’s Rich Results Test for the official verdict.</p>
    </article>
  );
}
