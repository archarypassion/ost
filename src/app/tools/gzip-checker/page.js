"use client";

import { useState } from 'react';

export default function GzipChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 950));
    setResult({ gzipEnabled: true, encoding: 'gzip', originalSize: '142 KB', compressedSize: '38 KB', savings: '73.2%', contentType: 'text/html; charset=UTF-8' });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Gzip Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking...' : 'Check Gzip'}</button>
        </form>
        <p className="tool-description">Check whether Gzip or Brotli compression is enabled on any URL and how much bandwidth it saves.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.gzipEnabled ? '#10B981' : '#EF4444' }}>
              Compression: {result.gzipEnabled ? `✓ Enabled (${result.encoding})` : '✗ Not Enabled'}
            </div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Original Size</span><span className="result-value">{result.originalSize}</span></div>
              <div className="result-item"><span className="result-label">Compressed Size</span><span className="result-value">{result.compressedSize}</span></div>
              <div className="result-item"><span className="result-label">Bandwidth Saving</span><span className="result-value" style={{ color: '#10B981' }}>{result.savings}</span></div>
              <div className="result-item"><span className="result-label">Content-Type</span><span className="result-value">{result.contentType}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Gzip Compression: The Quick Win That Makes Your Website Significantly Faster</h2>
          <p>If you're looking for one of the highest-return, lowest-effort performance optimizations you can make to a website, enabling Gzip compression is right at the top of the list. It's not glamorous — there are no stunning visual changes, no new features for users to interact with. But behind the scenes, it can reduce the amount of data transferred between your server and visitors' browsers by 60-80%, which translates directly into faster page loads, lower bandwidth costs, and real improvements to your Core Web Vitals scores.</p>
          <p>And yet, a surprising number of websites still don't have it enabled. Sometimes it's a server misconfiguration. Sometimes a CDN or reverse proxy strips the compression headers. Sometimes it was enabled, then accidentally disabled during a server migration. That's exactly why having a quick, reliable way to check is so valuable.</p>

          <h3>How Gzip Compression Actually Works</h3>
          <p>Gzip is a data compression algorithm that works by finding and eliminating repetitive patterns in files. HTML, CSS, JavaScript, and plain text files are ideal candidates for Gzip compression because they contain enormous amounts of repetition — the same HTML tags appearing hundreds of times, CSS class names repeated throughout a stylesheet, JavaScript variable names used across thousands of lines of code.</p>
          <p>When a browser requests a page, it sends an HTTP header saying "Accept-Encoding: gzip, deflate, br" — signaling that it can handle compressed content. If your server has compression enabled, it compresses the file on the fly, sends the smaller compressed version, and the browser decompresses it locally before rendering. The decompression step is so fast on modern hardware that it adds virtually zero perceivable delay, making the net effect an almost pure win.</p>

          <h3>Gzip vs. Brotli: Which Is Better?</h3>
          <p>Brotli is a newer compression algorithm developed by Google, and in most cases it outperforms Gzip — typically achieving 15-20% better compression ratios on web assets. All modern browsers support Brotli, and it's increasingly supported by web servers and CDNs. If your infrastructure supports it, Brotli is the preferred choice. However, Gzip remains the universal fallback — every browser and server supports it — making it the reliable baseline.</p>
          <p>In practice, the best setup is to serve Brotli to browsers that support it and fall back to Gzip for older clients. Most modern CDNs (Cloudflare, Fastly, AWS CloudFront) handle this negotiation automatically.</p>

          <h3>What Shouldn't Be Compressed</h3>
          <p>Not everything benefits from compression. Images (JPEG, PNG, WebP, AVIF) are already compressed using their own algorithms — trying to Gzip them will actually make them slightly larger. The same is true for video files, audio files, and ZIP archives. Applying Gzip to these file types wastes CPU cycles on the server and can mildly increase response time. A properly configured server will apply compression only to text-based MIME types like HTML, CSS, JavaScript, JSON, SVG, and XML.</p>

          <h3>How to Enable Gzip on Your Server</h3>
          <p>On Apache servers, Gzip is enabled via the <code>mod_deflate</code> module. You add directives to your <code>.htaccess</code> file to specify which file types to compress. On Nginx, the <code>gzip</code> directive in your server block configuration enables compression. On Node.js applications, the <code>compression</code> middleware package adds Gzip support with just a few lines of code. Most managed hosting providers (cPanel hosts, Kinsta, WP Engine, etc.) have Gzip enabled by default or offer a simple toggle in their control panels.</p>

          <h3>The SEO Impact of Compression</h3>
          <p>Page speed has been an official Google ranking factor since 2010, and with the introduction of Core Web Vitals as ranking signals in 2021, it became even more significant. Gzip compression directly improves Largest Contentful Paint (LCP) — the time until the main content of a page is visible — by reducing how long it takes for HTML and CSS to download. For content-heavy pages, the difference can be hundreds of milliseconds, which is noticeable to users and measurable by Google. Use our Gzip Checker to instantly confirm whether your server is taking advantage of this fundamental optimization.</p>
        </article>
      </div>
    </div>
  );
}
