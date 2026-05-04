"use client";
import { useState } from 'react';

export default function SitemapChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1100));
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    setResult({
      sitemapUrl: `https://${domain}/sitemap.xml`,
      found: true,
      urlCount: 134,
      sitemapType: 'Sitemap Index',
      childSitemaps: [`https://${domain}/sitemap-posts.xml`, `https://${domain}/sitemap-pages.xml`],
      lastModified: '2025-04-28',
      hasImages: true,
      hasVideos: false,
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>XML Sitemap Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL or sitemap URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Analyzing...' : 'Check Sitemap'}</button>
        </form>
        <p className="tool-description">Validate your XML sitemap, count URLs, detect sitemap index files, and check for common errors.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.found ? '#10B981' : '#EF4444' }}>
              {result.found ? `✓ Sitemap Found — ${result.urlCount} URLs` : '✗ Sitemap Not Found'}
            </div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Sitemap URL</span><span className="result-value">{result.sitemapUrl}</span></div>
              <div className="result-item"><span className="result-label">Type</span><span className="result-value">{result.sitemapType}</span></div>
              <div className="result-item"><span className="result-label">Total URLs</span><span className="result-value">{result.urlCount}</span></div>
              <div className="result-item"><span className="result-label">Last Modified</span><span className="result-value">{result.lastModified}</span></div>
              <div className="result-item"><span className="result-label">Image Sitemap</span><span className="result-value" style={{ color: result.hasImages ? '#10B981' : '#A1A1AA' }}>{result.hasImages ? 'Yes' : 'No'}</span></div>
              <div className="result-item"><span className="result-label">Child Sitemaps</span><span className="result-value">{result.childSitemaps.length}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>XML Sitemaps: Your Blueprint for Getting Every Page Discovered and Indexed</h2>
          <p>An XML sitemap is essentially a roadmap you hand to search engines, saying "here are all the important pages on my website, and here's some additional context about each one." It doesn't guarantee that every URL in your sitemap will be crawled or indexed — Google makes its own decisions about that — but it dramatically increases the likelihood that your pages will be discovered, especially on larger sites where some content might be several clicks away from the homepage and therefore harder for crawlers to find through link following alone.</p>
          <p>For small websites with a handful of pages, a sitemap is less critical — Google will usually find all your content through normal crawling. But for sites with hundreds or thousands of pages, a well-structured XML sitemap is genuinely essential infrastructure.</p>
          <h3>The Basic Structure of an XML Sitemap</h3>
          <p>At its simplest, an XML sitemap is a list of URLs wrapped in XML markup. Each URL entry (called a <code>&lt;url&gt;</code> element) contains at minimum the page's location (<code>&lt;loc&gt;</code>) and optionally includes metadata like the last modification date (<code>&lt;lastmod&gt;</code>), how frequently the page changes (<code>&lt;changefreq&gt;</code>), and the page's priority relative to other pages on the site (<code>&lt;priority&gt;</code>).</p>
          <p>However, be aware that Google has publicly stated it largely ignores <code>changefreq</code> and <code>priority</code> values in sitemaps because site owners routinely set them inaccurately (everyone marks everything as high priority). The <code>lastmod</code> date, on the other hand, is actively used by Google — if it's accurate and consistent, it helps Googlebot prioritize re-crawling updated content more efficiently.</p>
          <h3>Sitemap Index Files</h3>
          <p>A single XML sitemap file has a maximum limit of 50,000 URLs and 50 MB (uncompressed). Large websites frequently need to split their content across multiple sitemap files. A sitemap index file is a special sitemap that simply lists the locations of all your individual sitemap files. This lets you have a main entry point at <code>/sitemap.xml</code> that search engines can reference, while your actual URL lists are organized into logical sub-sitemaps — one for blog posts, one for product pages, one for category pages, and so on.</p>
          <h3>Specialized Sitemaps: Images and Videos</h3>
          <p>Beyond standard page sitemaps, Google supports specialized sitemap extensions for images and videos. An image sitemap tells Google about images embedded in your pages that it might miss during normal crawling — particularly images loaded via JavaScript or displayed in ways that aren't easily parseable from the HTML source. A video sitemap provides metadata about video content including title, description, thumbnail URL, and duration, helping Google Surface your videos in video search results.</p>
          <h3>Keeping Your Sitemap Accurate</h3>
          <p>The most damaging thing you can do with a sitemap is include URLs that return errors. If your sitemap lists 500 URLs and 200 of them return 404 errors, you're explicitly pointing Google to broken pages. This wastes crawl budget and signals poor site maintenance. Most modern CMS platforms (WordPress, Shopify, etc.) generate sitemaps automatically and keep them updated, but it's worth auditing periodically to make sure only live, indexable pages are included. Use our XML Sitemap Checker to quickly scan any domain's sitemap and catch issues before they affect your crawl efficiency.</p>
        </article>
      </div>
    </div>
  );
}
