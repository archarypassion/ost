"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

export default function GzipCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/gzip-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>Gzip Compression Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking…' : 'Check Compression'}</button>
        </form>
        <p className="tool-description">
          We fetch your page advertising support for gzip, deflate, and Brotli — measure how many bytes
          arrive on the wire, decompress them, and compare with the uncompressed size to show your real
          transfer savings. We also do an identity-encoding probe to catch misconfigured servers.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { summary, contentEncoding, contentType, bytesOnWire, uncompressedSize, savingsBytes, savingsPct, ratio, formatted, identityCheck, varyHeader, checks } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const bannerText = !contentEncoding
    ? 'No compression — server is sending uncompressed bytes'
    : `Compressed with ${contentEncoding} — ${savingsPct?.toFixed(1)}% smaller on the wire`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· wire: {formatted.wire} · uncompressed: {formatted.uncompressed}{ratio ? ` · ratio ${ratio}×` : ''}</span>
      </div>

      <div className="gz-bars">
        <div className="gz-bar-row">
          <div className="gz-bar-label">On the wire ({contentEncoding || 'identity'})</div>
          <div className="gz-bar"><div className="gz-bar-fill compressed" style={{ width: `${(bytesOnWire / Math.max(uncompressedSize, bytesOnWire)) * 100}%` }} /></div>
          <div className="gz-bar-num">{formatted.wire}</div>
        </div>
        <div className="gz-bar-row">
          <div className="gz-bar-label">Uncompressed</div>
          <div className="gz-bar"><div className="gz-bar-fill uncompressed" style={{ width: '100%' }} /></div>
          <div className="gz-bar-num">{formatted.uncompressed}</div>
        </div>
        {savingsBytes !== null && (
          <div className="gz-savings">Saves <strong>{formatted.savings}</strong> per request{savingsPct !== null ? ` (${savingsPct.toFixed(1)}%)` : ''}.</div>
        )}
      </div>

      <h3 className="result-section-title">Details</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">Content-Encoding</span><span className="result-value">{contentEncoding || '— none —'}</span></div>
        <div className="result-item"><span className="result-label">Content-Type</span><span className="result-value">{contentType || '—'}</span></div>
        <div className="result-item"><span className="result-label">Vary header</span><span className="result-value">{varyHeader || '—'}</span></div>
        <div className="result-item"><span className="result-label">Wire bytes</span><span className="result-value">{bytesOnWire.toLocaleString()} B</span></div>
        <div className="result-item"><span className="result-label">Uncompressed bytes</span><span className="result-value">{uncompressedSize.toLocaleString()} B</span></div>
        <div className="result-item"><span className="result-label">Compression ratio</span><span className="result-value">{ratio ? `${ratio}×` : '—'}</span></div>
      </div>

      {identityCheck && (
        <>
          <h3 className="result-section-title">Identity-encoding probe</h3>
          <div className="gz-identity">
            <div>
              <strong>Accept-Encoding: identity</strong> request returned <code>{identityCheck.contentEncoding || 'no encoding'}</code> in {identityCheck.bytes.toLocaleString()} bytes.
            </div>
            {identityCheck.servedCompressedAnyway && (
              <div className="gz-identity-warn">⚠ Server sent compressed bytes despite <code>identity</code> being requested — non-conformant behaviour.</div>
            )}
          </div>
        </>
      )}

      <h3 className="result-section-title">Findings</h3>
      <ul className="og-check-list">
        {checks.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head"><span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span></div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTTP Compression: The Easiest Performance Win Most Sites Still Miss</h2>
      <p>HTTP compression — gzip, deflate, or Brotli — can shrink HTML, CSS, and JavaScript responses by 60–80% on the wire. That translates directly into faster page loads, lower bandwidth bills, and better <strong>Core Web Vitals</strong> scores. Yet a surprising number of production sites still ship uncompressed assets, especially API endpoints and dynamic HTML.</p>

      <p>According to <a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive</a>, nearly 30% of websites still don't serve compressed responses for their HTML content. This represents a massive missed opportunity for improving <strong>mobile SEO</strong> and user experience. Our <strong>Gzip Compression Checker</strong> helps you identify whether your site is optimized for compression and how much you could save.</p>

      <h2>Why Compression Matters for Website Performance</h2>
      <p>Compression is one of the most effective performance optimizations available. Here's why it matters:</p>

      <h3>1. Faster Page Load Times</h3>
      <p>Smaller files transfer faster over networks. When you compress your HTML, CSS, and JavaScript, users experience significantly faster load times. This is especially critical for mobile users who may be on slower 3G or 4G connections. <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a> recommends enabling compression as a core performance best practice.</p>

      <h3>2. Reduced Bandwidth Costs</h3>
      <p>Every byte you save on compression reduces your hosting bandwidth costs. For high-traffic sites, this can translate to significant monthly savings. Combined with our <a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Checker</a>, you can identify exactly how much you could save.</p>

      <h3>3. Improved Core Web Vitals</h3>
      <p>Compression directly impacts Largest Contentful Paint (LCP) by reducing the time needed to download critical resources. Google's <strong>Core Web Vitals</strong> include LCP as a key ranking factor, making compression essential for <strong>mobile SEO</strong> success.</p>

      <h3>4. Better Mobile-First Indexing</h3>
      <p>With <strong>mobile-first indexing</strong>, Google prioritizes the mobile version of your site. Mobile networks are often slower and more expensive than desktop connections, making compression even more critical for <strong>mobile-friendly websites</strong>.</p>

      <h2>gzip vs Brotli: Which Compression Should You Use?</h2>
      <p>gzip has been universally supported since 2000 and remains the most widely adopted compression algorithm. Brotli (announced 2015) typically compresses 15–25% smaller than gzip for HTML and CSS at equivalent CPU cost. Most modern CDNs (<a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">Cloudflare</a>, <a href="https://www.fastly.com/" target="_blank" rel="noopener noreferrer">Fastly</a>, <a href="https://aws.amazon.com/cloudfront/" target="_blank" rel="noopener noreferrer">AWS CloudFront</a>, <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer">Vercel</a>) support Brotli out of the box. Enable it.</p>

      <p>Use our <strong>Gzip Compression Checker</strong> to verify which compression algorithms your server supports and whether Brotli is properly enabled. You can also check your <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed</a> to see the impact of compression on load times.</p>

      <h2>What This Tool Does</h2>
      <p>We bypass Node's automatic decompression and read the raw bytes directly from the socket — that gives us the actual transfer size, not what some library reports. We then decompress and measure the original payload, so the savings number you see is the literal byte difference visitors experience. We also probe with <code>Accept-Encoding: identity</code> to catch servers that are misconfigured.</p>

      <h3>The Identity-Encoding Probe</h3>
      <p>This unique test checks whether your server respects the <code>Accept-Encoding: identity</code> header, which requests uncompressed content. Some servers incorrectly send compressed responses even when identity is requested, indicating misconfiguration. Our <strong>Gzip Compression Checker</strong> identifies these issues so you can fix them.</p>

      <h2>Common Findings and How to Fix Them</h2>

      <h3>1. No Compression Detected</h3>
      <p><strong>The Problem:</strong> Your server is sending uncompressed responses.</p>
      <p><strong>The Fix:</strong> Enable compression in your server configuration. For nginx, add <code>gzip on;</code> to your config. For Apache, enable <code>mod_deflate</code>. If using a CDN, enable compression in your settings. Verify your fix with our <a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Checker</a>.</p>

      <h3>2. Weak Compression (Under 50% Savings)</h3>
      <p><strong>The Problem:</strong> Compression is enabled but using low compression levels.</p>
      <p><strong>The Fix:</strong> Increase compression levels. For nginx, set <code>gzip_comp_level 6</code> (levels 1-9). For Brotli, set appropriate quality levels. Higher levels improve compression but increase CPU usage — find the right balance for your server.</p>

      <h3>3. Incorrect Content Types</h3>
      <p><strong>The Problem:</strong> Only HTML is compressed, but CSS, JS, and API responses are not.</p>
      <p><strong>The Fix:</strong> Configure your server to compress all text-based content. For nginx, use <code>gzip_types text/plain text/css application/javascript application/json application/xml</code>.</p>

      <h3>4. Missing Vary Header</h3>
      <p><strong>The Problem:</strong> The <code>Vary: Accept-Encoding</code> header is missing, potentially causing cache issues.</p>
      <p><strong>The Fix:</strong> Add <code>Vary: Accept-Encoding</code> to your server configuration. This ensures proxies and browsers cache the correct compressed version.</p>

      <h2>Compression Best Practices for Mobile-Friendly Websites</h2>

      <h3>1. Enable Brotli for Modern Browsers</h3>
      <p>Brotli offers superior compression to gzip. All modern browsers support it. Configure your server to serve Brotli when the client supports it, falling back to gzip for older browsers.</p>

      <h3>2. Compress All Text-Based Resources</h3>
      <p>Compress HTML, CSS, JavaScript, JSON, XML, SVG, and web fonts. Do not compress images (already compressed), video, or audio files.</p>

      <h3>3. Use Appropriate Compression Levels</h3>
      <p>For gzip, levels 4-6 offer good balance of speed and compression. For Brotli, quality 4-6 is recommended for dynamic content, while quality 11 can be used for static assets.</p>

      <h3>4. Leverage CDN Compression</h3>
      <p>CDNs automatically handle compression, often with Brotli support. Use a CDN to offload compression processing and ensure optimal settings. Our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> can help measure the effectiveness of your CDN configuration.</p>

      <h3>5. Pre-Compress Static Assets</h3>
      <p>For static assets, pre-compress files during your build process and serve the compressed versions directly. This reduces server CPU usage and improves response times.</p>

      <h2>Monitoring Compression Over Time</h2>
      <p>Regular monitoring with our <strong>Gzip Compression Checker</strong> helps you:</p>
      <ul>
        <li>Verify compression remains enabled after server updates</li>
        <li>Identify misconfigurations introduced during deployments</li>
        <li>Track compression ratios to ensure optimal settings</li>
        <li>Maintain performance standards for <strong>mobile SEO</strong></li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Checker</a> to see how compression affects your total page weight, and <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> to monitor server responses.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is the Gzip Compression Checker?</h3>
      <p>The <strong>Gzip Compression Checker</strong> is a tool that analyzes your website's compression settings. It measures how many bytes arrive on the wire, decompresses them, and compares with the uncompressed size to show your real transfer savings. It also checks for Brotli support and identifies misconfigurations.</p>

      <h3>Why is compression important for SEO?</h3>
      <p>Compression reduces file sizes, leading to faster page loads. Faster pages improve user experience, reduce bounce rates, and positively impact <strong>Core Web Vitals</strong> — all of which are ranking factors for <strong>mobile SEO</strong>. Google has confirmed that page speed is a ranking signal.</p>

      <h3>What's the difference between gzip and Brotli?</h3>
      <p>Gzip is the older, more widely supported compression algorithm. Brotli is newer and typically compresses 15-25% better than gzip for HTML and CSS. Most modern browsers support Brotli, and we recommend enabling it alongside gzip for maximum compatibility.</p>

      <h3>How much can compression save?</h3>
      <p>Text-based content like HTML, CSS, and JavaScript can be compressed by 60-80%. This means a 100 KB file might only be 20-40 KB on the wire. Our <strong>Gzip Compression Checker</strong> shows you the exact savings for your site.</p>

      <h3>How do I enable compression on my server?</h3>
      <p>For nginx, add <code>gzip on;</code> and configure gzip types. For Apache, enable <code>mod_deflate</code>. For CDNs like Cloudflare, enable compression in the dashboard. After enabling, verify with our <a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Checker</a>.</p>

      <h3>Does compression work for images and videos?</h3>
      <p>Images (JPEG, PNG, WebP) and videos (MP4, WebM) are already compressed. Applying gzip or Brotli to these formats provides minimal savings and wastes server CPU. Only compress text-based content.</p>

      <h3>What does the Vary header do?</h3>
      <p>The <code>Vary: Accept-Encoding</code> header tells caches to serve different versions based on the client's compression preferences. Without it, users might receive the wrong compressed version. Our tool checks for this header and warns if it's missing.</p>

      <h3>Why does my server still show no compression?</h3>
      <p>Common reasons include: misconfigured server settings, CDN settings overriding origin, content type not in compression list, or the server doesn't support compression. Use our <strong>Gzip Compression Checker</strong> to identify the exact issue.</p>

      <h2>Conclusion</h2>
      <p>HTTP compression is one of the most impactful and easiest optimizations you can make for your website. Our <strong>Gzip Compression Checker</strong> provides you with the detailed analysis you need to ensure your server is properly compressed, saving bandwidth and improving <strong>Core Web Vitals</strong> scores.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-heavy blog, enabling compression is essential for <strong>mobile SEO</strong> success. Every byte saved translates to faster load times, happier users, and better search rankings.</p>

      <p>Start optimizing today—use our <strong>Gzip Compression Checker</strong> to identify issues, implement the recommended fixes, and verify your improvements. Combine with our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> and <a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Checker</a> for a complete performance optimization strategy.</p>

      <h3>Related Tools for Comprehensive Website Optimization</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Gzip Compression Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Checker</a> - Analyze total page weight</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize your content</li>
        <li><a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Certificate Checker</a> - Ensure secure connections</li>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Monitor server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Optimize URL forwarding</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
      </ul>

      <p>For further reading on compression and web performance, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/speed" target="_blank" rel="noopener noreferrer">Google Page Speed Insights</a></li>
        <li><a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev Performance Guides</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding" target="_blank" rel="noopener noreferrer">MDN Content-Encoding Documentation</a></li>
        <li><a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive Web Almanac</a></li>
        <li><a href="https://www.cloudflare.com/learning/performance/compress-content/" target="_blank" rel="noopener noreferrer">Cloudflare Compression Guide</a></li>
      </ul>
    </article>
  );
}