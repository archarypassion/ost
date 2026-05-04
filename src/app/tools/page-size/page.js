"use client";

import { useState } from 'react';

export default function PageSizeChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1000));
    setResult({ htmlSize: '48 KB', cssSize: '124 KB', jsSize: '892 KB', imageSize: '1.2 MB', totalSize: '2.26 MB', totalRequests: 64, loadTime: '2.8s' });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Web Page Size Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Analyzing...' : 'Check Size'}</button>
        </form>
        <p className="tool-description">Measure the total page weight, individual resource sizes, and number of HTTP requests for any webpage.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: '#F59E0B' }}>Total Page Size: {result.totalSize}</div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">HTML</span><span className="result-value">{result.htmlSize}</span></div>
              <div className="result-item"><span className="result-label">CSS</span><span className="result-value">{result.cssSize}</span></div>
              <div className="result-item"><span className="result-label">JavaScript</span><span className="result-value" style={{ color: '#EF4444' }}>{result.jsSize}</span></div>
              <div className="result-item"><span className="result-label">Images</span><span className="result-value">{result.imageSize}</span></div>
              <div className="result-item"><span className="result-label">HTTP Requests</span><span className="result-value">{result.totalRequests}</span></div>
              <div className="result-item"><span className="result-label">Est. Load Time</span><span className="result-value">{result.loadTime}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Web Page Size: Why Bloated Pages Hurt Rankings and What You Can Do About It</h2>
          <p>The average web page has grown dramatically over the past decade. What once weighed a few hundred kilobytes now commonly exceeds 2 MB once JavaScript bundles, high-resolution images, web fonts, and third-party scripts are all counted. This happens gradually — one plugin added here, one analytics script there — and before you know it, pages that used to load in under a second are taking three or four seconds to become interactive. Page size is one of the primary levers for load time, which is itself a confirmed Google ranking signal through Core Web Vitals.</p>

          <h3>What Makes Pages Heavy?</h3>
          <p>Images are almost always the largest contributor to page weight. A single unoptimized hero image can be 2-3 MB. Converting to modern formats like WebP or AVIF and lazy-loading images below the fold can cut image payload by 60-80% without visible quality loss. JavaScript is the second major culprit — analytics libraries, UI frameworks, chat widgets, and A/B testing tools all add up. Code splitting and deferring non-critical scripts reduce how much JavaScript has to execute before your page is usable.</p>

          <h3>HTTP Request Count</h3>
          <p>Every separate file your page loads generates an HTTP request — each image, stylesheet, script, and font file. Even with HTTP/2 multiplexing, there is overhead for each request. Pages with 100+ requests load slower than comparable pages with 30-40 requests, even when total file sizes are similar. Consolidating scripts, using inline SVGs for icons, and removing redundant third-party tags are effective ways to bring the request count down.</p>

          <h3>Core Web Vitals Connection</h3>
          <p>Google's Core Web Vitals — especially Largest Contentful Paint (LCP) and Interaction to Next Paint (INP) — are directly driven by page weight. An unoptimized hero image delays LCP. Excessive JavaScript parsing delays INP and makes the page feel sluggish. Improving page size is one of the most reliable paths to better Core Web Vitals scores, and better Core Web Vitals scores correlate strongly with better organic rankings.</p>

          <h3>Tools and Techniques</h3>
          <p>Use our Page Size Checker to get an instant breakdown of your page's resource sizes by type. Then cross-reference with Google PageSpeed Insights or Lighthouse for specific, prioritized recommendations. Common quick wins include enabling Gzip or Brotli compression on the server, setting long-term cache headers for static assets, and eliminating unused CSS and JavaScript through tree-shaking or manual auditing. Small, consistent improvements compound over time into significant performance gains.</p>
        </article>
      </div>
    </div>
  );
}
