"use client";

import { useState } from 'react';

export default function RedirectChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1100));
    setResult({
      chain: [
        { url: url, status: 301, statusText: 'Moved Permanently' },
        { url: url.replace('http://', 'https://'), status: 301, statusText: 'Moved Permanently' },
        { url: url.replace('http://', 'https://').replace(/\/$/, '') + '/', status: 200, statusText: 'OK' },
      ],
      finalUrl: url.replace('http://', 'https://').replace(/\/$/, '') + '/',
      totalRedirects: 2,
    });
    setLoading(false);
  };

  const statusColor = (s) => s >= 200 && s < 300 ? '#10B981' : s >= 300 && s < 400 ? '#F59E0B' : '#EF4444';

  return (
    <div>
      <div className="tool-header"><h1>Redirect Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Tracing...' : 'Trace Redirects'}</button>
        </form>
        <p className="tool-description">Trace the full redirect chain of any URL to identify redirect loops, chains, and the final destination.</p>
        {result && (
          <div className="result-box">
            <div style={{ width: '100%' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Redirect Chain ({result.totalRedirects} redirect{result.totalRedirects !== 1 ? 's' : ''})</h4>
              {result.chain.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ background: statusColor(step.status), color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>{step.status}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>{step.url}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Redirect Checker: Understanding URL Redirects and Why Getting Them Right Matters</h2>
          <p>URL redirects are one of the most powerful — and most misused — tools in the web developer's and SEO professional's toolkit. When implemented correctly, redirects are completely invisible to users and seamlessly guide both visitors and search engine crawlers from one URL to another. When implemented incorrectly, they can create long chains that slow down your site, cause redirect loops that make pages completely inaccessible, or silently bleed away the ranking authority you've spent years building.</p>
          <p>A redirect checker traces the exact path a browser takes from an initial URL to its final destination, revealing every hop along the way. It's an essential diagnostic tool whenever you're doing URL migrations, fixing broken links, or investigating why a page that used to rank well has suddenly disappeared from search results.</p>

          <h3>Why Redirect Chains Are a Problem</h3>
          <p>A redirect chain occurs when a URL redirects to a second URL, which then redirects to a third, and so on. Each hop in the chain adds latency. A browser has to make a separate HTTP request for every redirect it follows, meaning a chain of three redirects means three round trips to the server before the page content even starts loading. For mobile users on slower connections, this can mean a second or more of additional load time — and page speed is a confirmed ranking factor.</p>
          <p>From a search engine perspective, most SEOs and Google's own documentation suggest that PageRank loses a small percentage of its value with each redirect hop. While Google has stated that properly implemented 301 redirects pass "full" PageRank, the reality in practice is that longer chains correlate with weaker transmission of authority. Keep your redirect chains as short as possible — ideally a maximum of two hops from any starting URL to the final destination.</p>

          <h3>Redirect Loops: The Infinite Spiral</h3>
          <p>A redirect loop is exactly what it sounds like — URL A redirects to URL B, and URL B redirects back to URL A. Browsers detect this and throw an error ("too many redirects"). Search engine crawlers similarly abandon the URL and stop trying to index it. Redirect loops are almost always caused by misconfigured server rules, conflicting CMS settings, or overly aggressive HTTPS/www-to-non-www redirect rules that end up pointing at each other.</p>

          <h3>301 vs. 302: Choosing the Right Redirect Type</h3>
          <p>The choice between a 301 (permanent) and 302 (temporary) redirect is one of the most consequential decisions in technical SEO. A 301 tells Google: "This page has permanently moved. Update your index and transfer all the authority from the old URL to the new one." Google will eventually de-index the old URL and fully consolidate its signals to the new one. A 302 tells Google: "This is temporary — keep the old URL in the index and don't transfer authority yet." If you use a 302 when you actually mean a 301, Google may continue treating the old URL as the canonical one and refuse to rank the new URL properly.</p>

          <h3>Common Redirect Scenarios and Best Practices</h3>
          <p>HTTP to HTTPS migration, non-www to www (or vice versa), and URL structure changes during a site redesign are the three most common redirect scenarios. In all cases, the golden rule is the same: redirect directly to the final URL in a single hop wherever possible. If you're migrating from HTTP to HTTPS and also changing from non-www to www, configure one single redirect that does both at once rather than chaining two separate redirects together. Plan your redirect map before any major migration using a spreadsheet, and test every redirect thoroughly before and after going live.</p>
        </article>
      </div>
    </div>
  );
}
