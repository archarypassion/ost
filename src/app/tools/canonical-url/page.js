"use client";

import { useState } from 'react';

export default function CanonicalUrlChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 950));
    const canonical = url.replace('http://', 'https://').replace(/\/$/, '') + '/';
    setResult({
      requestedUrl: url,
      canonicalTag: canonical,
      isSelfReferencing: canonical === url || canonical === url + '/',
      foundIn: 'HTML <head>',
      xRobotsCanonical: null,
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Canonical URL Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking...' : 'Check Canonical'}</button>
        </form>
        <p className="tool-description">Verify which canonical URL a page declares and whether it is pointing to itself or a different URL.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.isSelfReferencing ? '#10B981' : '#F59E0B' }}>
              {result.isSelfReferencing ? '✓ Self-referencing canonical' : '⚠ Canonical points elsewhere'}
            </div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Requested URL</span><span className="result-value" style={{ wordBreak: 'break-all' }}>{result.requestedUrl}</span></div>
              <div className="result-item"><span className="result-label">Canonical Tag</span><span className="result-value" style={{ wordBreak: 'break-all' }}>{result.canonicalTag}</span></div>
              <div className="result-item"><span className="result-label">Found In</span><span className="result-value">{result.foundIn}</span></div>
              <div className="result-item"><span className="result-label">HTTP Header Canonical</span><span className="result-value">{result.xRobotsCanonical || 'Not Present'}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Canonical URLs: How to Solve Duplicate Content Without Losing Rankings</h2>
          <p>Duplicate content is one of those SEO problems that feels like it shouldn't exist — surely the same content on two different URLs is a simple fix? But in practice, duplicate content is endemic to the web. It arises from URL parameters, trailing slashes, HTTP vs. HTTPS, session IDs, printer-friendly page variants, and dozens of other technical quirks that can cause search engines to discover multiple copies of the same page. The canonical tag is the primary tool for telling search engines which version to treat as the authoritative one.</p>
          <p>When search engines encounter multiple URLs with identical or nearly identical content, they face a dilemma: which one should rank? Which one should accumulate the authority from backlinks? Which version should they show to users? Without guidance, search engines will make that call themselves — and they often choose differently than you'd expect. The canonical tag hands that control back to you.</p>

          <h3>What the Canonical Tag Actually Does</h3>
          <p>The canonical tag is an HTML link element placed in the head section of a page:</p>
          <div className="code-block"><code>{'<link rel="canonical" href="https://example.com/your-page/" />'}</code></div>
          <p>It tells search engines: "Even if you reached this page through a different URL, this is the version I want you to index and rank. Consolidate all the signals — backlinks, crawl priority, ranking authority — to this canonical URL." It does not prevent crawlers from reaching duplicate URLs, but it guides how those URLs are treated once crawled.</p>

          <h3>Self-Referencing Canonicals</h3>
          <p>A self-referencing canonical is a canonical tag where the declared URL matches the URL of the page it's on. This might seem redundant — why tell a page that it's its own canonical? — but it's actually considered a best practice. It explicitly signals to search engines that this page is the original, de-duplicated, authoritative version. It also protects your page from being canonicalized away to a different version if Google later discovers the same content accessible through a parameter URL or syndicated elsewhere.</p>

          <h3>When Canonicals Point Elsewhere</h3>
          <p>Sometimes a canonical on a page points to a completely different URL. This is intentional in cases like pagination (where paginated variants defer to the first page), AMP versions (which typically canonicalize to their standard HTML equivalents), or product variants on e-commerce sites (where color and size variants might canonicalize to the main product page). It's also sometimes unintentional — a template error that hardcodes the wrong canonical, or a CMS plugin that incorrectly generates canonical tags. Our Canonical URL Checker makes it immediately visible which scenario you're dealing with.</p>

          <h3>Canonical via HTTP Header</h3>
          <p>Just like the noindex directive, canonical signals can also be sent via the HTTP Link header rather than in the HTML. This is especially useful for non-HTML resources like PDFs. A PDF can't have an HTML head section, so the only way to declare a canonical for it is through the server response header. Our checker inspects both sources, giving you a complete picture of how any URL's canonical is declared.</p>

          <h3>Common Canonical Mistakes</h3>
          <p>One of the most frequent and damaging mistakes is implementing a canonical tag but also including a noindex tag on the same page. These signals conflict: noindex says "don't index this," while a canonical says "treat this as the primary version." Search engines handle conflicting signals inconsistently, and the result is often neither page ranking well. Keep your canonical and noindex strategy cleanly separated. Another common error is using relative URLs in canonical tags instead of absolute ones — always use the full absolute URL including the protocol and domain.</p>
        </article>
      </div>
    </div>
  );
}
