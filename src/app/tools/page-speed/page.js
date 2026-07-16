"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

function fmtMs(n) { return n == null ? '—' : `${n} ms`; }
function fmtBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function gradeColor(g) {
  if (g === 'pass') return '#10b981';
  if (g === 'warn') return '#f59e0b';
  if (g === 'fail') return '#ef4444';
  return '#9ca3af';
}

export default function PageSpeedPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/page-speed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.timings) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>Page Speed Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Measuring…' : 'Measure'}</button>
        </form>
        <p className="tool-description">
          Measures the real network timings of the request — DNS, TCP, TLS, time-to-first-byte, and total
          download — using Node's low-level socket events for sub-millisecond accuracy. Then probes the
          top scripts, stylesheets and images for size. Server-side measurement, so it doesn't depend on
          your browser.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { score, timings: t, grades, htmlSize, bytesOnWire, resourceProbes, totalBytes, issues, summary, contentEncoding, note } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const max = Math.max(t.totalMs || 0, 100);
  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>Heuristic score: {score}/100</strong>
        <span>· total {fmtMs(t.totalMs)} · TTFB {fmtMs(t.ttfbMs)} · {fmtBytes(totalBytes)} sampled</span>
      </div>

      <h3 className="result-section-title">Network timings</h3>
      <div className="ps2-timings">
        <Bar label="DNS lookup" ms={t.dnsMs} max={max} grade={grades.dns} />
        <Bar label="TCP connect" ms={t.tcpMs} max={max} grade="info" />
        <Bar label="TLS handshake" ms={t.tlsMs} max={max} grade={grades.tls} />
        <Bar label="Time to first byte" ms={t.ttfbMs} max={max} grade={grades.ttfb} highlight />
        <Bar label="HTML download" ms={t.downloadMs} max={max} grade="info" />
        <Bar label="Total" ms={t.totalMs} max={max} grade={grades.total} />
      </div>

      <h3 className="result-section-title">Sizes</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">HTML on the wire</span><span className="result-value">{fmtBytes(bytesOnWire)}{contentEncoding ? ` (${contentEncoding})` : ''}</span></div>
        <div className="result-item"><span className="result-label">HTML decompressed</span><span className="result-value">{fmtBytes(htmlSize)}</span></div>
        <div className="result-item"><span className="result-label">Sampled resources</span><span className="result-value">{resourceProbes.length}</span></div>
        <div className="result-item"><span className="result-label">Total bytes (HTML + sampled)</span><span className="result-value">{fmtBytes(totalBytes)}</span></div>
      </div>

      {resourceProbes.length > 0 && (
        <>
          <h3 className="result-section-title">Resource probes ({resourceProbes.length})</h3>
          <div className="ps-resource-list">
            {resourceProbes.map((r, idx) => (
              <div key={idx} className="ps2-resource">
                <span className={`status-pill kind-${r.error ? 'danger' : kindOf(r.status)}`}>{r.error ? 'ERR' : (r.status || '—')}</span>
                <span className="result-value-mono ps-resource-url">{r.url}</span>
                <span className="ps-resource-size">{fmtBytes(r.size)}</span>
                <span className="ps-resource-size">{r.ms ? `${r.ms} ms` : '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="result-section-title">Findings</h3>
      <ul className="og-check-list">
        {issues.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head"><span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span></div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="ps2-note">{note}</div>
    </div>
  );
}

function kindOf(s) {
  if (!s) return 'unknown';
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

function Bar({ label, ms, max, grade, highlight }) {
  const pct = ms == null ? 0 : Math.min(100, (ms / max) * 100);
  return (
    <div className={`ps2-bar-row ${highlight ? 'highlight' : ''}`}>
      <div className="ps2-bar-label">{label}</div>
      <div className="ps2-bar"><div className="ps2-bar-fill" style={{ width: `${pct}%`, background: gradeColor(grade) }} /></div>
      <div className="ps2-bar-num">{fmtMs(ms)}</div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Understanding Page Speed: Why Every Millisecond Matters</h2>
      <p>Page speed is a critical factor in <strong>mobile SEO</strong> and overall user experience. Google has made it clear that <strong>Core Web Vitals</strong>—which include loading performance metrics like Largest Contentful Paint (LCP)—are essential ranking signals. Our <strong>Page Speed Checker</strong> provides you with the foundational metrics you need to understand your server's performance and identify bottlenecks.</p>

      <p>Research from <a href="https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/mobile-page-speed-load-time/" target="_blank" rel="noopener noreferrer">Think with Google</a> shows that as page load time increases from 1 to 3 seconds, bounce rate increases by 32%. At 5 seconds, it jumps to 90%. This means every millisecond you shave off your load time can significantly impact your conversion rates and search rankings.</p>

      <h2>What This Tool Measures (and What It Can't)</h2>
      <p>This tool uses Node's low-level socket events to give you the real network timings of your page request: DNS resolution, TCP connect, TLS handshake, time-to-first-byte (TTFB), and total HTML download. These numbers are what your origin server is actually responsible for — they don't depend on your browser, plugins, or device.</p>

      <h3>What this tool does NOT measure</h3>
      <p><strong>Core Web Vitals</strong> (LCP, CLS, INP), JavaScript execution time, render-blocking CSS, layout shifts, third-party tag impact, and anything about the visual rendering of the page. Those require a real browser. Use <a href="https://developers.google.com/speed/pagespeed/insights/" target="_blank" rel="noopener noreferrer">Google PageSpeed Insights</a>, <a href="https://www.webpagetest.org/" target="_blank" rel="noopener noreferrer">WebPageTest</a>, or Chrome DevTools' Performance panel for that.</p>

      <p>For comprehensive page analysis, combine our <strong>Page Speed Checker</strong> with our <a href="https://opensourcetools.online/tools/mobile-friendly">Mobile Friendly Test</a> to ensure your site performs well on all devices, and use our <a href="https://opensourcetools.online/tools/page-size">Page Size Checker</a> to understand the total weight of your resources.</p>

      <h3>How to use the numbers</h3>
      <ul>
        <li><strong>TTFB &gt; 600 ms</strong> almost always points at the origin (slow database queries, cold serverless starts, lack of edge caching). Consider using a <a href="https://opensourcetools.online/tools/gzip-checker">Gzip Checker</a> to ensure your server is properly compressing responses.</li>
        <li><strong>TLS &gt; 500 ms</strong> indicates older TLS configuration — TLS 1.3 plus session resumption can shave 100–300 ms. Verify your <a href="https://opensourcetools.online/tools/ssl-checker">SSL Certificate</a> configuration for optimal performance.</li>
        <li><strong>DNS &gt; 300 ms</strong> means your DNS provider is slow or you're not using anycast. Check your domain configuration with our <a href="https://opensourcetools.online/tools/ip-lookup">IP Lookup Tool</a> to verify your DNS setup.</li>
        <li><strong>Total page bytes &gt; 3 MB</strong> is a budget-buster on mobile; investigate images, fonts, and JavaScript first. Use our <a href="https://opensourcetools.online/tools/page-size">Page Size Tool</a> to identify the largest resources.</li>
      </ul>

      <h2>The Importance of Server-Side Performance Testing</h2>
      <p>While browser-based testing tools like <a href="https://developers.google.com/web/tools/lighthouse" target="_blank" rel="noopener noreferrer">Lighthouse</a> are valuable, they measure the complete user experience including network conditions, device capabilities, and browser rendering. Our <strong>Page Speed Checker</strong> focuses exclusively on server-side metrics, providing a pure view of your infrastructure's performance.</p>

      <p>This distinction is crucial because server-side issues are often masked by browser caching or CDN edge nodes. By identifying slow DNS resolution, TLS handshake delays, or high TTFB, you can pinpoint exactly where your server optimization efforts should be focused.</p>

      <h2>Understanding Network Timings in Detail</h2>

      <h3>DNS Lookup</h3>
      <p>DNS resolution is the first step in loading any web page. Your browser must convert the domain name (e.g., example.com) into an IP address. Slow DNS can add hundreds of milliseconds to your page load time. Use a reputable DNS provider with global anycast networks to minimize this delay.</p>

      <h3>TCP Connection</h3>
      <p>TCP is the foundational protocol of the internet. The three-way handshake (SYN, SYN-ACK, ACK) establishes the connection between your browser and the server. While usually fast, network congestion or packet loss can increase this time significantly.</p>

      <h3>TLS Handshake</h3>
      <p>For HTTPS connections, the TLS handshake adds additional overhead. Modern TLS 1.3 reduces the round trips required for a secure connection from 2 (with TLS 1.2) to just 1, significantly improving mobile performance. Our <a href="https://opensourcetools.online/tools/ssl-checker">SSL Checker</a> can help you verify your TLS configuration.</p>

      <h3>Time to First Byte (TTFB)</h3>
      <p>TTFB measures the time between sending the HTTP request and receiving the first byte of the response. It encompasses server processing time, database queries, and application logic execution. According to <a href="https://web.dev/ttfb/" target="_blank" rel="noopener noreferrer">web.dev</a>, TTFB should be under 600ms for a good user experience.</p>

      <h2>Optimizing Your Page Speed</h2>

      <h3>1. Implement Gzip or Brotli Compression</h3>
      <p>Compression reduces the size of your HTML, CSS, and JavaScript files. Brotli typically offers 20-30% better compression than Gzip. Use our <a href="https://opensourcetools.online/tools/gzip-checker">Gzip Checker</a> to verify your compression settings and ensure your server is properly configured.</p>

      <h3>2. Optimize Images</h3>
      <p>Images are often the largest resources on any page. Implement <strong>responsive images</strong> using <code>srcset</code> and <code>sizes</code> attributes, use modern formats like WebP or AVIF, and enable lazy loading. Our <a href="https://opensourcetools.online/tools/mobile-friendly">Mobile Friendly Test</a> checks for responsive image implementation.</p>

      <h3>3. Leverage Browser Caching</h3>
      <p>Set appropriate cache headers to reduce server requests for returning visitors. Static assets with far-future expiration dates (e.g., 1 year) should be versioned so users always get updated content when you deploy changes.</p>

      <h3>4. Minimize HTTP Requests</h3>
      <p>Each resource loaded (CSS, JavaScript, images, fonts) requires a separate HTTP request. Combine CSS and JavaScript files, use CSS sprites for icons, and inline critical CSS to reduce render-blocking resources.</p>

      <h3>5. Use a Content Delivery Network (CDN)</h3>
      <p>CDNs distribute your content across multiple global servers, reducing latency by serving resources from locations closer to your users. <a href="https://www.cloudflare.com/learning/performance/what-is-cdn/" target="_blank" rel="noopener noreferrer">Cloudflare explains</a> how CDNs significantly improve page load times.</p>

      <h2>The Relationship Between Page Speed and Core Web Vitals</h2>
      <p><strong>Core Web Vitals</strong> are Google's set of user-centered metrics that quantify real-world user experience. They include:</p>
      <ul>
        <li><strong>Largest Contentful Paint (LCP):</strong> Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.</li>
        <li><strong>First Input Delay (FID):</strong> Measures interactivity. Pages should have an FID of less than 100 milliseconds.</li>
        <li><strong>Cumulative Layout Shift (CLS):</strong> Measures visual stability. Pages should maintain a CLS of less than 0.1.</li>
      </ul>

      <p>While our <strong>Page Speed Checker</strong> focuses on server metrics, these indicators are directly influenced by your server's performance. Slow TTFB directly impacts LCP, while large page sizes affect FID as JavaScript loads and executes. Use our <a href="https://opensourcetools.online/tools/on-page-seo">On-Page SEO Checker</a> to ensure your content is optimized for both users and search engines.</p>

      <h2>Common Page Speed Issues and Solutions</h2>

      <h3>1. Unoptimized Server Configuration</h3>
      <p><strong>The Problem:</strong> High TTFB indicates server-side processing delays.</p>
      <p><strong>The Fix:</strong> Enable server-side caching, optimize database queries, and consider using a faster hosting provider. Use our <a href="https://opensourcetools.online/tools/page-speed">Page Speed Tool</a> to measure improvements after each change.</p>

      <h3>2. Large Resource Sizes</h3>
      <p><strong>The Problem:</strong> Total page bytes exceed 3 MB.</p>
      <p><strong>The Fix:</strong> Compress images, minify CSS and JavaScript, and remove unused code. Our <a href="https://opensourcetools.online/tools/page-size">Page Size Checker</a> can help identify the largest offenders.</p>

      <h3>3. Render-Blocking Resources</h3>
      <p><strong>The Problem:</strong> CSS and JavaScript block page rendering.</p>
      <p><strong>The Fix:</strong> Inline critical CSS, use <code>async</code> or <code>defer</code> for JavaScript, and load non-critical resources after the initial render.</p>

      <h3>4. Missing Gzip Compression</h3>
      <p><strong>The Problem:</strong> Resources are sent uncompressed.</p>
      <p><strong>The Fix:</strong> Enable Gzip or Brotli compression on your server. Use our <a href="https://opensourcetools.online/tools/gzip-checker">Gzip Checker</a> to verify your configuration.</p>

      <h2>Monitoring Page Speed Over Time</h2>
      <p>Page speed is not a one-time fix but an ongoing commitment to performance excellence. Regular monitoring helps you:</p>
      <ul>
        <li>Detect performance regressions after code deployments</li>
        <li>Identify seasonal traffic impacts on server performance</li>
        <li>Validate the effectiveness of optimization efforts</li>
        <li>Maintain compliance with Google's evolving performance standards</li>
      </ul>

      <p>Our <strong>Page Speed Checker</strong> is designed for quick, repeatable testing. Combine it with our <a href="https://opensourcetools.online/tools/http-status">HTTP Status Checker</a> to monitor server health, <a href="https://opensourcetools.online/tools/redirect-checker">Redirect Checker</a> to ensure efficient URL forwarding, and <a href="https://opensourcetools.online/tools/sitemap-checker">Sitemap Validator</a> to verify all pages are discoverable.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is the Page Speed Checker?</h3>
      <p>The <strong>Page Speed Checker</strong> is a server-side tool that measures real network timings including DNS, TCP, TLS, TTFB, and total download time. It provides objective, browser-independent metrics for your site's server performance.</p>

      <h3>How does page speed affect SEO?</h3>
      <p>Page speed is a confirmed ranking factor for both desktop and mobile searches. Faster pages provide better user experiences, leading to lower bounce rates, higher engagement, and improved <strong>mobile SEO</strong> performance. Google's <strong>Core Web Vitals</strong> are directly tied to page speed metrics.</p>

      <h3>What is a good TTFB for mobile?</h3>
      <p>According to <a href="https://web.dev/ttfb/" target="_blank" rel="noopener noreferrer">web.dev</a>, a good TTFB is under 600ms. For the best mobile experience, aim for under 200ms. Use our <strong>Page Speed Checker</strong> to measure your current TTFB and identify optimization opportunities.</p>

      <h3>Why is TLS handshake important for page speed?</h3>
      <p>The TLS handshake establishes a secure HTTPS connection. Slow TLS handshakes add significant delay to page loads, especially on mobile networks. Modern TLS 1.3 reduces this overhead. Verify your configuration with our <a href="https://opensourcetools.online/tools/ssl-checker">SSL Checker</a>.</p>

      <h3>How do I interpret the Page Speed Checker results?</h3>
      <p>The tool provides a heuristic score from 0-100, network timing breakdowns, and resource probes. Higher scores indicate better performance. Review the findings section for specific optimization recommendations tailored to your site's issues.</p>

      <h3>Can I use this tool for mobile speed testing?</h3>
      <p>While our <strong>Page Speed Checker</strong> measures server-side performance independently of device, we recommend combining it with our <a href="https://opensourcetools.online/tools/mobile-friendly">Mobile Friendly Test</a> for a complete mobile performance picture.</p>

      <h3>How often should I test my page speed?</h3>
      <p>Test your page speed with our <strong>Page Speed Checker</strong> after any significant code changes, server migrations, or CMS updates. For critical sites, consider weekly testing to catch performance regressions early.</p>

      <h3>What other tools can help with page speed optimization?</h3>
      <p>Beyond our <strong>Page Speed Checker</strong>, we recommend using <a href="https://opensourcetools.online/tools/gzip-checker">Gzip Checker</a> for compression verification, <a href="https://opensourcetools.online/tools/page-size">Page Size Checker</a> for resource analysis, and <a href="https://opensourcetools.online/tools/mobile-friendly">Mobile Friendly Test</a> for overall mobile optimization.</p>

      <h2>Conclusion</h2>
      <p>Page speed is fundamental to user experience, <strong>mobile SEO</strong>, and conversion optimization. Our <strong>Page Speed Checker</strong> provides the objective, server-side metrics you need to identify and fix performance bottlenecks. By understanding your DNS, TLS, TTFB, and total load times, you can systematically improve your site's performance and deliver the fast, responsive experience users expect.</p>

      <p>Remember that page speed optimization is an ongoing process. Regular testing with our <strong>Page Speed Checker</strong>, combined with other tools like <a href="https://opensourcetools.online/tools/mobile-friendly">Mobile Friendly Test</a>, <a href="https://opensourcetools.online/tools/page-size">Page Size Checker</a>, and <a href="https://opensourcetools.online/tools/gzip-checker">Gzip Checker</a>, will help you maintain optimal performance and stay ahead of Google's performance requirements.</p>

      <p>Start optimizing today—test your page speed now and unlock the full potential of your website's performance. Every millisecond you save improves user experience, boosts search rankings, and increases conversions.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Page Speed Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly">Mobile Friendly Test</a> - Ensure your site performs well on all devices</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo">On-Page SEO Checker</a> - Optimize your content for search engines</li>
        <li><a href="https://opensourcetools.online/tools/page-size">Page Size Checker</a> - Identify largest resources affecting load time</li>
        <li><a href="https://opensourcetools.online/tools/gzip-checker">Gzip Compression Checker</a> - Verify proper server compression</li>
        <li><a href="https://opensourcetools.online/tools/ssl-checker">SSL Certificate Checker</a> - Ensure secure, efficient connections</li>
        <li><a href="https://opensourcetools.online/tools/http-status">HTTP Status Checker</a> - Monitor server response codes</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker">Redirect Checker</a> - Optimize URL forwarding efficiency</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url">Canonical URL Checker</a> - Prevent duplicate content issues</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker">Sitemap Validator</a> - Ensure all pages are discoverable</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt">Robots.txt Tester</a> - Verify crawler directives</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/word-count">Word Count Tool</a> - Measure content depth</li>
        <li><a href="https://opensourcetools.online/tools/keyword-density">Keyword Density Tool</a> - Optimize content relevance</li>
        <li><a href="https://opensourcetools.online/tools/link-checker">Link Checker</a> - Ensure all internal links work</li>
        <li><a href="https://opensourcetools.online/tools/open-graph">Open Graph Inspector</a> - Optimize social sharing</li>
      </ul>

      <p>For further reading on web performance optimization, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/speed" target="_blank" rel="noopener noreferrer">Google Page Speed Insights</a></li>
        <li><a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev Performance Guides</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/Performance" target="_blank" rel="noopener noreferrer">MDN Web Performance Documentation</a></li>
        <li><a href="https://www.w3.org/standards/techs/webperf" target="_blank" rel="noopener noreferrer">W3C Web Performance Standards</a></li>
      </ul>
    </article>
  );
}