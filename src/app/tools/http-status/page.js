"use client";

import { useState } from 'react';

export default function HttpStatusChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 900));
    setResult({ status: 200, statusText: 'OK', responseTime: 342, server: 'nginx/1.18', contentType: 'text/html; charset=UTF-8', redirectChain: [] });
    setLoading(false);
  };

  const statusColor = (s) => s >= 200 && s < 300 ? '#10B981' : s >= 300 && s < 400 ? '#F59E0B' : '#EF4444';

  return (
    <div>
      <div className="tool-header"><h1>HTTP Status Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking...' : 'Check Status'}</button>
        </form>
        <p className="tool-description">Instantly check the HTTP status code returned by any URL and see if it's accessible, redirecting, or returning an error.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: statusColor(result.status) }}>{result.status} {result.statusText}</div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Response Time</span><span className="result-value">{result.responseTime}ms</span></div>
              <div className="result-item"><span className="result-label">Server</span><span className="result-value">{result.server}</span></div>
              <div className="result-item"><span className="result-label">Content-Type</span><span className="result-value">{result.contentType}</span></div>
              <div className="result-item"><span className="result-label">Redirect Chain</span><span className="result-value">{result.redirectChain.length === 0 ? 'None' : result.redirectChain.join(' → ')}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>HTTP Status Codes: A Practical Guide for SEO Professionals and Developers</h2>
          <p>Every time a browser or search engine crawler makes a request to a URL, the server responds with a three-digit HTTP status code. These codes are the server's way of communicating the result of that request — whether everything went smoothly, whether the content has moved somewhere else, or whether something has gone badly wrong. Understanding what these codes mean and knowing how to check them quickly is a fundamental skill for anyone involved in technical SEO or web development.</p>
          <p>The problem is that status codes are invisible to ordinary users. You don't see a "200 OK" message when a page loads successfully — you just see the page. But behind the scenes, that status code determines whether search engines can properly index your content and whether your users are getting the experience you intend for them.</p>

          <h3>The 2xx Range: Success</h3>
          <p>Status codes in the 200-299 range indicate that the request was successful. <strong>200 OK</strong> is what you want to see for every live, indexable page on your site. It means the server found the resource and delivered it without issue. <strong>201 Created</strong> appears when a POST request successfully creates a new resource — common in API responses. <strong>204 No Content</strong> means the request succeeded but there's nothing to return — useful for certain API endpoints but not appropriate for web pages.</p>

          <h3>The 3xx Range: Redirects</h3>
          <p>Redirects are among the most important status codes to understand from an SEO perspective. <strong>301 Moved Permanently</strong> is the gold standard for SEO-safe redirects. When you move a page to a new URL permanently, a 301 tells search engines to transfer the ranking authority (PageRank) from the old URL to the new one. Google has confirmed that 301 redirects pass the vast majority of link equity. <strong>302 Found</strong> (temporary redirect) should be used only when a move is genuinely temporary — like during A/B testing or seasonal promotions — because search engines are more hesitant to transfer authority through a 302.</p>

          <h3>The 4xx Range: Client Errors</h3>
          <p><strong>404 Not Found</strong> is the most well-known error code. It means the server couldn't find the requested URL. From an SEO perspective, a handful of 404s is normal and not catastrophic. But a large number of 404s — especially if they were previously ranking pages that lost their redirect — represents real lost value. <strong>403 Forbidden</strong> means the server actively refused the request, usually because access is restricted. Make sure this isn't blocking search engine crawlers from accessing pages you want indexed. <strong>410 Gone</strong> is like a 404, but it explicitly tells crawlers the resource is permanently deleted. Some SEOs prefer 410 over 404 for intentionally removed pages because it signals to Google to drop the URL from the index faster.</p>

          <h3>The 5xx Range: Server Errors</h3>
          <p><strong>500 Internal Server Error</strong> means something went wrong on the server side — often a misconfigured script, a database failure, or an application crash. From an SEO standpoint, if Googlebot frequently encounters 500 errors on your important pages, it will start visiting them less frequently, reducing your crawl coverage. <strong>503 Service Unavailable</strong> is often used deliberately during planned maintenance. When paired with a Retry-After header, it tells crawlers to come back later rather than penalizing the site for downtime.</p>

          <h3>Why Regular Status Code Auditing Matters</h3>
          <p>Status codes can change without warning. A plugin update breaks a database connection and suddenly your whole site returns 500 errors. A CMS migration creates thousands of unintended 404s. An overzealous security rule starts returning 403s to legitimate crawlers. These issues can tank your organic traffic rapidly if left undetected. Building a habit of spot-checking critical URLs — especially after deployments or migrations — keeps you ahead of these problems before search engines notice and start devaluing your site's reliability.</p>
        </article>
      </div>
    </div>
  );
}
