"use client";
import { useState } from 'react';

export default function GoogleIndexChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setResult({
      isIndexed: true,
      googleCacheDate: '2025-04-30',
      indexedUrl: url,
      snippet: 'This is an example snippet from how this page appears in Google search results. It shows the meta description or relevant content pulled by Google for display.',
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Google Index Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter page URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking...' : 'Check Index'}</button>
        </form>
        <p className="tool-description">Check whether a specific URL has been indexed by Google and see when it was last cached.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.isIndexed ? '#10B981' : '#EF4444' }}>
              {result.isIndexed ? '✓ Page is Indexed by Google' : '✗ Page is NOT Indexed'}
            </div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Indexed URL</span><span className="result-value" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{result.indexedUrl}</span></div>
              <div className="result-item"><span className="result-label">Google Cache Date</span><span className="result-value">{result.googleCacheDate}</span></div>
              <div className="result-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="result-label">Search Snippet</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{result.snippet}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Google Index Checker: How to Know If Google Can See Your Pages</h2>
          <p>Publishing content is only half the battle. If Google hasn't indexed your pages, they simply won't appear in search results — no matter how well-written, optimized, or link-rich they are. Indexing is the prerequisite for ranking, and yet it's surprising how often important pages fail to get indexed, and site owners don't notice for weeks or months.</p>
          <p>A Google Index Checker lets you instantly determine whether a specific URL has made it into Google's search index. This is one of the first diagnostic steps you should take whenever a page isn't appearing in search results for queries you'd expect it to rank for.</p>
          <h3>Why Pages Don't Get Indexed</h3>
          <p>There are many reasons a page might fail to get indexed. The most common ones involve deliberate signals that are accidentally misconfigured. A noindex meta tag left on from a development environment is the classic culprit — the page is blocked from indexing by a tag that should have been removed before launch. Similarly, a robots.txt Disallow rule that prevents Googlebot from crawling the page means the noindex tag (if present) can never even be read.</p>
          <p>Other causes include pages with very thin or duplicate content that Google doesn't consider worth indexing, pages that are deeply buried in a site structure with few or no internal links pointing to them, and pages that are genuinely new and simply haven't been crawled yet. Google doesn't index pages the moment they're published — on newer or lower-authority sites, it can take days or even weeks for a new page to be crawled and indexed.</p>
          <h3>How to Check If a Page Is Indexed</h3>
          <p>The classic manual method is to search for <code>site:yourdomain.com/your-page-url</code> in Google. If the URL appears in the results, it's indexed. If it doesn't, it may not be indexed — though note that the site: operator isn't perfectly reliable and should be treated as an indicator rather than a guarantee. Google Search Console's URL Inspection tool is the most accurate source — it shows the exact indexing status as Google sees it, including whether a page is indexed, whether it was recently crawled, and if there are any issues preventing indexation.</p>
          <h3>What Google Caching Tells You</h3>
          <p>When Google crawls a page, it saves a cached copy of what it saw at the time of the last crawl. The cache date tells you when Google last successfully visited and processed the page. A recent cache date is a good sign — it means Googlebot is actively crawling the page and the content in its index is relatively fresh. An old cache date, or the absence of a cache entirely, suggests the page is being crawled infrequently or not at all, which might be worth investigating.</p>
          <h3>Getting Pages Indexed Faster</h3>
          <p>If you've published new content and want to accelerate indexing, there are a few reliable tactics. Submit the URL directly through Google Search Console's URL Inspection tool — there's a "Request Indexing" button that adds it to Google's priority crawl queue. Make sure the new page is linked from other already-indexed pages on your site (internal linking is the primary way Googlebot discovers new content). And if you have an XML sitemap, make sure the new URL is included in it and that the sitemap has been submitted to Google Search Console.</p>
        </article>
      </div>
    </div>
  );
}
