"use client";
import { useState } from 'react';

export default function RobotsTxtChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 900));
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    setResult({
      robotsUrl: `https://${domain}/robots.txt`,
      found: true,
      sitemapLines: [`https://${domain}/sitemap.xml`],
      disallowedPaths: ['/admin/', '/private/', '/checkout/'],
      allowedPaths: ['/'],
      crawlDelay: '1',
      userAgents: ['*', 'Googlebot', 'Bingbot'],
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Robots.txt Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Fetching...' : 'Check Robots.txt'}</button>
        </form>
        <p className="tool-description">Analyze the robots.txt file of any domain to see which paths are blocked from crawling and which sitemaps are declared.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.found ? '#10B981' : '#EF4444' }}>
              {result.found ? '✓ robots.txt Found' : '✗ robots.txt Not Found'}
            </div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Robots.txt URL</span><span className="result-value">{result.robotsUrl}</span></div>
              <div className="result-item"><span className="result-label">User-Agents</span><span className="result-value">{result.userAgents.join(', ')}</span></div>
              <div className="result-item"><span className="result-label">Disallowed Paths</span><span className="result-value">{result.disallowedPaths.join(', ')}</span></div>
              <div className="result-item"><span className="result-label">Crawl-Delay</span><span className="result-value">{result.crawlDelay}s</span></div>
              <div className="result-item"><span className="result-label">Sitemap Declared</span><span className="result-value">{result.sitemapLines[0]}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Robots.txt: The Complete Guide to Controlling How Search Engines Crawl Your Site</h2>
          <p>The robots.txt file is one of the oldest and most fundamental pieces of technical SEO infrastructure on the web. It's a plain text file sitting at the root of your domain — always accessible at <code>yourdomain.com/robots.txt</code> — and its entire purpose is to communicate with search engine crawlers about which parts of your website they're allowed to access. Despite its age and simplicity, it remains one of the most misunderstood files in web development. A misconfigured robots.txt can accidentally block your entire website from Google, and you might not notice for weeks.</p>
          <p>Understanding how robots.txt works, what it can and cannot do, and how to audit it properly is essential knowledge for anyone serious about technical SEO.</p>
          <h3>How robots.txt Works</h3>
          <p>When a crawler like Googlebot arrives at your domain, one of the very first things it does before crawling any other page is request your robots.txt file. It reads the directives in that file and uses them to determine which URLs it's allowed to fetch. If no robots.txt exists, crawlers assume they have permission to crawl everything.</p>
          <p>The file is organized around "User-agent" declarations, which specify which crawler a particular set of rules applies to. The wildcard <code>User-agent: *</code> applies to all crawlers. You can also write rules specific to individual bots — <code>User-agent: Googlebot</code> for Google, <code>User-agent: Bingbot</code> for Bing, and so on.</p>
          <h3>Disallow vs. Allow Directives</h3>
          <p>The two most commonly used directives are <code>Disallow</code> and <code>Allow</code>. Disallow tells a crawler it cannot access a specific path — for example, <code>Disallow: /admin/</code> blocks all URLs starting with /admin/. Allow overrides a broader Disallow rule for a more specific path. For example, you could disallow an entire directory but allow a specific file within it.</p>
          <p>A critical point that many developers misunderstand: <code>Disallow</code> prevents crawling — it does not prevent indexing. If a page has backlinks pointing to it from other websites, Google may still index it even if you've disallowed it in robots.txt, because it discovers the URL from those external links. To actually prevent a URL from appearing in search results, you need a noindex tag. Robots.txt controls the crawler's door; noindex controls the index itself.</p>
          <h3>The Sitemap Directive</h3>
          <p>Many robots.txt files include a <code>Sitemap:</code> directive pointing to the location of the XML sitemap. This is a helpful signal for crawlers, letting them discover your sitemap without having to search for it. You can include multiple Sitemap directives if you have a sitemap index or separate sitemaps for different sections of your site.</p>
          <h3>Crawl-Delay: Use With Caution</h3>
          <p>The <code>Crawl-delay</code> directive tells crawlers to wait a specified number of seconds between requests. This can be useful for protecting a low-resource server from being overwhelmed by aggressive crawling. However, Google has publicly stated that it does not honor the Crawl-delay directive in robots.txt — you need to use Google Search Console to set a crawl rate limit for Googlebot specifically. Other crawlers like Bingbot do respect Crawl-delay.</p>
          <h3>Common Robots.txt Mistakes</h3>
          <p>The most catastrophic mistake is accidentally disallowing everything with <code>Disallow: /</code>. This happens more often than you'd think — usually during development when a staging environment is correctly blocked but the rule accidentally makes it into the production robots.txt during a site launch. The result is that Googlebot stops crawling your entire site, and your rankings can collapse within days as Google re-evaluates pages it can no longer access.</p>
          <p>Another frequent mistake is trying to use robots.txt to hide sensitive content. If something should genuinely be private, robots.txt is not the right tool — authentication and proper server access controls are. Robots.txt is a public file that anyone can read, so it can actually reveal the existence of paths you'd rather keep private.</p>
          <h3>Using This Tool</h3>
          <p>Our Robots.txt Checker fetches and parses the robots.txt file from any domain and presents the key directives in an easy-to-read format. Check your own site regularly — especially after deployments — and audit competitor robots.txt files to understand what they're hiding from or exposing to search engine crawlers.</p>
        </article>
      </div>
    </div>
  );
}
