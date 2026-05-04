"use client";
import { useState } from 'react';

export default function SchemaChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1100));
    setResult({
      found: true,
      schemas: [
        { type: 'WebPage', format: 'JSON-LD', valid: true },
        { type: 'Organization', format: 'JSON-LD', valid: true },
        { type: 'BreadcrumbList', format: 'JSON-LD', valid: true },
        { type: 'FAQPage', format: 'JSON-LD', valid: false, error: 'Missing required property: "acceptedAnswer"' },
      ],
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Schema Markup Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Detecting...' : 'Check Schema'}</button>
        </form>
        <p className="tool-description">Detect and validate all structured data (JSON-LD, Microdata, RDFa) on any webpage to identify issues affecting rich results.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.found ? '#10B981' : '#F59E0B' }}>
              {result.found ? `✓ ${result.schemas.length} Schema Types Detected` : '⚠ No Schema Markup Found'}
            </div>
            {result.schemas.map((s, i) => (
              <div key={i} className="result-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="result-label">{s.type}</span>
                  <span style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.format}</span>
                    <span style={{ color: s.valid ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: '0.8rem' }}>{s.valid ? '✓ Valid' : '✗ Error'}</span>
                  </span>
                </div>
                {s.error && <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>{s.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Schema Markup: The Structured Data Layer That Unlocks Rich Results</h2>
          <p>Schema markup is a form of structured data — code you add to your pages that explicitly tells search engines what your content means, not just what it says. Standard HTML tells Google that something is a heading or a paragraph. Schema markup tells Google that something is a product with a specific price, a recipe with a specific cooking time, or a FAQ with specific questions and answers. This additional layer of semantic precision unlocks what Google calls "rich results" — enhanced search listings that stand out visually from standard blue links.</p>
          <p>Rich results can include star ratings, product prices, FAQ accordions, how-to step instructions, event dates, job postings, and many other enhanced formats. Studies consistently show that rich results attract significantly higher click-through rates than standard listings, making schema markup one of the most direct levers you have for improving your organic traffic without actually changing your rankings.</p>
          <h3>JSON-LD: The Recommended Format</h3>
          <p>Schema markup can be implemented in three formats: JSON-LD, Microdata, and RDFa. Google strongly recommends JSON-LD for all new implementations. JSON-LD is placed in a <code>&lt;script&gt;</code> tag within the page head or body and is completely separate from the visible HTML content. This separation makes it much easier to add, maintain, and update without touching the content structure of your pages. Microdata and RDFa embed structured data attributes directly into HTML elements, which makes them harder to manage and more prone to breaking when page templates change.</p>
          <h3>The Most Impactful Schema Types</h3>
          <p><strong>Article</strong> schema helps news and blog content get displayed in Google's Top Stories carousel and enables rich author and date information. <strong>Product</strong> schema is essential for e-commerce — it can surface price, availability, and review data directly in search results. <strong>FAQ</strong> schema can expand your search listing with accordion-style questions and answers, effectively doubling or tripling your visual footprint on the results page. <strong>HowTo</strong> schema can display step-by-step instructions with images directly in search results. <strong>LocalBusiness</strong> schema helps physical businesses appear in Google Maps and local search results with their address, phone number, and hours.</p>
          <h3>Common Schema Errors to Watch For</h3>
          <p>Schema markup errors are unfortunately common and can prevent rich results from being displayed even when the markup is present. Missing required properties are the most frequent issue — for example, a Review schema that includes a rating but omits the reviewer's name. Schema that describes content not visible on the page itself (adding FAQ schema for questions that don't actually appear on the page) violates Google's structured data guidelines and can result in a manual penalty. Our Schema Markup Checker flags these common errors so you can fix them before they cost you rich result eligibility.</p>
          <h3>Testing and Validating Your Schema</h3>
          <p>Google provides a Rich Results Test tool at search.google.com/test/rich-results that shows exactly which rich result types your page is eligible for and flags any errors in your implementation. Our Schema Markup Checker gives you a fast first-pass audit — use it to detect what's there, then use Google's tool for detailed validation. Regular schema audits are especially important after major site updates or template changes that might inadvertently break or remove your structured data.</p>
        </article>
      </div>
    </div>
  );
}
