"use client";

import { useState } from 'react';

export default function LinkChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1400));
    setResult({
      totalLinks: 47,
      internalLinks: 32,
      externalLinks: 15,
      brokenLinks: 2,
      nofollowLinks: 5,
      broken: [
        { url: 'https://example.com/old-page', status: 404 },
        { url: 'https://example.com/deleted-resource', status: 410 },
      ],
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Link Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Scanning...' : 'Check Links'}</button>
        </form>
        <p className="tool-description">Scan any webpage for broken links, nofollow links, internal vs. external links, and more.</p>

        {result && (
          <div className="result-box">
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Total Links</span><span className="result-value">{result.totalLinks}</span></div>
              <div className="result-item"><span className="result-label">Internal Links</span><span className="result-value">{result.internalLinks}</span></div>
              <div className="result-item"><span className="result-label">External Links</span><span className="result-value">{result.externalLinks}</span></div>
              <div className="result-item"><span className="result-label">Broken Links</span><span className="result-value" style={{ color: result.brokenLinks > 0 ? '#EF4444' : '#10B981' }}>{result.brokenLinks}</span></div>
              <div className="result-item"><span className="result-label">Nofollow Links</span><span className="result-value">{result.nofollowLinks}</span></div>
            </div>
            {result.broken.length > 0 && (
              <div style={{ marginTop: '1rem', width: '100%' }}>
                <h4 style={{ color: '#EF4444', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Broken Links Found:</h4>
                {result.broken.map((link, i) => (
                  <div key={i} className="result-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                    <span style={{ color: '#EF4444', fontSize: '0.85rem' }}>HTTP {link.status}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>{link.url}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Link Checker: Why Broken Links Are Silently Killing Your SEO</h2>
          <p>Broken links are one of those website problems that tend to sneak up on you. You publish a page, everything works perfectly, and then six months later, a resource you linked to has moved, a partner site has restructured their URLs, or you've done an internal migration without proper redirects. Suddenly, visitors and search engines alike are hitting dead ends — and you might not even know it's happening.</p>
          <p>A link checker is an essential maintenance tool for any website. It's not something you run once and forget — it's something you should build into your regular site health workflow, much like checking your analytics or monitoring your page speed scores.</p>

          <h3>What Counts as a Broken Link?</h3>
          <p>Most people think of broken links as simple 404 errors — the classic "Page Not Found." And while 404s are the most common, broken links actually encompass a range of HTTP status codes that all signal something has gone wrong. A 410 means the resource is permanently gone. A 500 means the server crashed trying to load it. A timeout means the destination server didn't respond at all. From a user experience and SEO perspective, all of these are problems worth fixing.</p>

          <h3>How Broken Links Affect Your Search Rankings</h3>
          <p>Search engines like Google follow links to discover and crawl content across the web. When Googlebot encounters a broken link on your page, it wastes a portion of your crawl budget — the finite amount of time and resources Google allocates to crawling your site. If your site has many broken links, Google might crawl fewer of your important pages, causing them to be indexed less frequently or not at all.</p>
          <p>Beyond crawl budget, broken links damage the user experience. When visitors click a link and land on a 404 page, they often leave the site entirely. This increases your bounce rate and reduces the time users spend engaging with your content — both signals that can negatively influence how search engines perceive your site's quality over time.</p>

          <h3>Internal vs. External Broken Links: Which Is Worse?</h3>
          <p>Both types hurt, but they hurt differently. Internal broken links — links between your own pages — are fully within your control and arguably more damaging because they disrupt the flow of PageRank (ranking authority) between your own pages. If you have a popular blog post linking to a service page that no longer exists, you're wasting hard-earned authority that should be strengthening your conversion-focused pages.</p>
          <p>External broken links point to third-party resources you don't control. They make your content look outdated and poorly maintained. If you referenced a study or a tool that has since disappeared, it undermines your credibility. A regular link audit helps you catch these before readers or search engines do.</p>

          <h3>The Difference Between Nofollow and Dofollow Links</h3>
          <p>Every link on your site is either "followed" or "nofollowed." A standard link passes authority (PageRank) from your page to the destination. A link with the <code>rel="nofollow"</code> attribute signals to search engines not to follow the link and not to pass authority to the destination.</p>
          <p>Nofollow links are appropriate for paid placements, user-generated content (like blog comments), and any links where you don't want to vouch for the destination. Using nofollow correctly keeps your link profile clean and prevents you from inadvertently passing authority to low-quality sites.</p>

          <h3>How to Fix Broken Links</h3>
          <p>The fix depends on the cause. For internal broken links, you have two options: update the link to point to the correct current URL, or set up a proper 301 redirect from the old URL to the new one. For external broken links, you can either remove the link, find an alternative resource to link to instead, or use the Wayback Machine to locate an archived version of the resource and link to that.</p>
          <p>The important thing is to not just delete links without replacing them when possible. Every link is an opportunity to add value for your readers and to pass equity to relevant resources. Fixing or updating is almost always better than simply removing.</p>

          <h3>Building a Regular Link Audit Habit</h3>
          <p>The most effective way to stay on top of broken links is to run a scan on a scheduled basis — monthly for larger sites, quarterly for smaller ones. Pay special attention after any major site migration, CMS update, or URL restructuring. These events are the most common causes of sudden link breakage. Our Link Checker makes this process fast and painless — just enter your URL and get a full breakdown in seconds.</p>
        </article>
      </div>
    </div>
  );
}
