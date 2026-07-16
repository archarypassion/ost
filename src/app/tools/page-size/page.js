"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };
const TYPE_COLOR = {
  stylesheet: '#3b82f6', script: '#f59e0b', image: '#10b981',
  font: '#a855f7', video: '#ef4444', audio: '#ec4899',
  fetch: '#6366f1', track: '#64748b', other: '#9ca3af',
};

export default function PageSizePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/page-size', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      <div className="tool-header"><h1>Page Size Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Measuring…' : 'Measure Page'}</button>
        </form>
        <p className="tool-description">
          Fetch the HTML and probe every linked stylesheet, script, image, font, and media file in
          parallel — measuring real bytes (using HEAD when supported) — to give you the actual page
          weight users download.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} filter={filter} setFilter={setFilter} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data, filter, setFilter }) {
  const { htmlSize, totalPageSize, totalPageSizeFormatted, totalExternalSize, externalResourceCount,
    byType, resources, issues, summary, truncated, htmlSizeFormatted, totalExternalSizeFormatted } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const types = Object.entries(byType).sort((a, b) => b[1].size - a[1].size);

  const filtered = filter === 'all' ? resources : resources.filter((r) => r.type === filter);
  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>Total page weight: {totalPageSizeFormatted}</strong>
        <span>· HTML {htmlSizeFormatted} · resources {totalExternalSizeFormatted} · {externalResourceCount} request{externalResourceCount === 1 ? '' : 's'}</span>
      </div>

      <h3 className="result-section-title">Composition</h3>
      <div className="ps-stack">
        <div className="ps-stack-bar">
          <div className="ps-stack-segment" style={{ width: `${(htmlSize / Math.max(totalPageSize, 1)) * 100}%`, background: '#0ea5e9' }} title={`HTML: ${htmlSizeFormatted}`} />
          {types.map(([type, info]) => (
            info.size > 0 && <div key={type} className="ps-stack-segment" style={{ width: `${(info.size / Math.max(totalPageSize, 1)) * 100}%`, background: TYPE_COLOR[type] || '#9ca3af' }} title={`${type}: ${info.sizeFormatted}`} />
          ))}
        </div>
        <div className="ps-legend">
          <div className="ps-legend-item"><span className="ps-legend-dot" style={{ background: '#0ea5e9' }} /> HTML — {htmlSizeFormatted}</div>
          {types.map(([type, info]) => (
            <div key={type} className="ps-legend-item">
              <span className="ps-legend-dot" style={{ background: TYPE_COLOR[type] || '#9ca3af' }} />
              {type} — {info.sizeFormatted} ({info.count} request{info.count === 1 ? '' : 's'})
              {info.errors > 0 && <span className="ps-legend-errors"> · {info.errors} error{info.errors === 1 ? '' : 's'}</span>}
            </div>
          ))}
        </div>
      </div>

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

      <div className="ps-resources-head">
        <h3 className="result-section-title" style={{ marginBottom: 0 }}>Resources ({resources.length}{truncated ? '+ truncated to 60' : ''})</h3>
        <select className="kd-top-label" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.25rem 0.5rem', borderRadius: 6, background: 'var(--code-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="all">All types</option>
          {types.map(([t]) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="ps-resource-list">
        {filtered.map((r, idx) => (
          <div key={idx} className="ps-resource-row">
            <span className="ps-resource-type" style={{ background: `${TYPE_COLOR[r.type] || '#9ca3af'}20`, color: TYPE_COLOR[r.type] || '#9ca3af' }}>{r.type}</span>
            <span className="result-value-mono ps-resource-url">{r.url}</span>
            <span className={`status-pill kind-${kindOf(r.status)}`}>{r.error ? 'ERR' : (r.status || '—')}</span>
            <span className="ps-resource-size">{r.sizeFormatted}</span>
            {r.error && <div className="bulk-error" style={{ paddingLeft: 0 }}>{r.error}</div>}
          </div>
        ))}
      </div>
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

function Article() {
  return (
    <article className="tool-article">
      <h2>Page Weight: Why Bytes Still Matter</h2>
      <p>Page size is one of the most critical factors affecting website performance, user experience, and <strong>mobile SEO</strong>. According to <a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive</a>, the median web page now ships approximately 2.4 MB to mobile devices. That weight is paid for by your users — every byte costs them battery, data, and time. Google's <strong>Core Web Vitals</strong> don't directly measure size, but Largest Contentful Paint (LCP) and Interaction to Next Paint (INP) correlate strongly with how heavy your page is.</p>

      <p>The <strong>Page Size Checker</strong> provides you with a comprehensive breakdown of exactly what contributes to your page weight, helping you identify optimization opportunities that can dramatically improve load times and user satisfaction.</p>

      <h2>What This Tool Measures</h2>
      <p>Our <strong>Page Size Checker</strong> downloads the HTML, then walks through every <code>&lt;link&gt;</code>, <code>&lt;script&gt;</code>, <code>&lt;img&gt;</code>, <code>srcset</code>, <code>&lt;source&gt;</code>, video/audio source, preload, and icon link. For each external resource we send a HEAD request (falling back to GET when servers reject HEAD) and record the response's actual size. Inline data: URIs are listed but not counted.</p>

      <p>Understanding your page size is essential for creating a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a>, you can ensure your site delivers a fast, responsive experience on all devices.</p>

      <h3>What This Tool Measures</h3>
      <ul>
        <li><strong>HTML Size:</strong> The decompressed size of your main HTML document</li>
        <li><strong>CSS Stylesheets:</strong> All linked CSS files that style your page</li>
        <li><strong>JavaScript Files:</strong> All scripts that add interactivity and functionality</li>
        <li><strong>Images:</strong> All image assets including those in <code>srcset</code> and <code>&lt;source&gt;</code> elements</li>
        <li><strong>Fonts:</strong> Web fonts loaded from external sources</li>
        <li><strong>Media Files:</strong> Video and audio content</li>
        <li><strong>Preload Resources:</strong> Assets loaded early to improve performance</li>
      </ul>

      <h2>Performance Budgets That Work</h2>
      <p>For mobile-first sites a useful budget is roughly: HTML ≤ 100 KB, total CSS ≤ 100 KB, total JS ≤ 350 KB (parsed/compressed), images ≤ 1 MB on the initial viewport, and a total weight under 1.5 MB. Heavier pages are still possible to make fast — but they require very deliberate optimisation.</p>

      <p>Use our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> to measure how your page size affects load times, and <a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Checker</a> to verify your compression settings.</p>

      <h2>Why Page Size Matters for SEO</h2>
      <p>Page size directly impacts several key SEO factors:</p>

      <h3>1. Loading Speed</h3>
      <p>Larger pages take longer to load, especially on mobile networks. Google has confirmed that page speed is a ranking factor, with <strong>Core Web Vitals</strong> playing an increasingly important role in search rankings. According to <a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev</a>, improving page speed can significantly boost your search visibility.</p>

      <h3>2. User Experience</h3>
      <p>Users expect pages to load in under 3 seconds. Research from <a href="https://www.thinkwithgoogle.com/marketing-strategies/app-and-mobile/mobile-page-speed-load-time/" target="_blank" rel="noopener noreferrer">Think with Google</a> shows that 53% of mobile users abandon sites that take longer than 3 seconds to load. Large page sizes directly contribute to slow load times and high bounce rates.</p>

      <h3>3. Mobile-First Indexing</h3>
      <p>With Google's <strong>mobile-first indexing</strong>, the mobile version of your site determines your rankings. Mobile connections are often slower than desktop, making page size even more critical for <strong>mobile SEO</strong> success.</p>

      <h2>Common Page Size Issues and Solutions</h2>

      <h3>1. Unoptimized Images</h3>
      <p><strong>The Problem:</strong> Images often account for 50-80% of total page weight.</p>
      <p><strong>The Fix:</strong> Compress images using modern formats like WebP or AVIF. Implement <strong>responsive images</strong> with <code>srcset</code> to serve appropriately sized images for different devices. Use our <a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> to check your responsive image implementation.</p>

      <h3>2. Bloated JavaScript</h3>
      <p><strong>The Problem:</strong> Large JavaScript bundles slow down parsing and execution.</p>
      <p><strong>The Fix:</strong> Implement code splitting, lazy loading, and tree shaking. Remove unused libraries and use smaller alternatives when possible. Our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> can help identify performance issues.</p>

      <h3>3. Uncompressed Resources</h3>
      <p><strong>The Problem:</strong> Resources are served without compression.</p>
      <p><strong>The Fix:</strong> Enable Gzip or Brotli compression on your server. Verify your configuration with our <a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Checker</a>.</p>

      <h3>4. Multiple Font Weights and Formats</h3>
      <p><strong>The Problem:</strong> Loading many font weights and formats adds significant weight.</p>
      <p><strong>The Fix:</strong> Limit font weights to 2-3 per font family. Use <code>font-display: swap</code> to ensure text remains visible during font loading. Consider using system fonts for <strong>mobile-friendly websites</strong>.</p>

      <h2>How to Optimize Your Page Size</h2>

      <h3>1. Audit Your Resources</h3>
      <p>Start by running our <strong>Page Size Checker</strong> to identify your largest resources. Look for opportunities to remove, replace, or optimize the biggest offenders. Our <a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Tool</a> provides detailed breakdowns by resource type.</p>

      <h3>2. Implement Lazy Loading</h3>
      <p>Lazy loading defers the loading of offscreen images and content until users scroll to them. This significantly reduces initial page weight and improves perceived performance. <a href="https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading" target="_blank" rel="noopener noreferrer">MDN Web Docs</a> provides comprehensive guidance on implementing lazy loading.</p>

      <h3>3. Use Modern Image Formats</h3>
      <p>WebP and AVIF offer superior compression compared to JPEG and PNG. <a href="https://developers.google.com/speed/webp" target="_blank" rel="noopener noreferrer">Google's WebP documentation</a> demonstrates how these formats can reduce image sizes by 25-35% without quality loss.</p>

      <h3>4. Minify and Bundle</h3>
      <p>Minify CSS and JavaScript to remove unnecessary characters. Bundle multiple files to reduce HTTP requests. Use tools like <a href="https://webpack.js.org/" target="_blank" rel="noopener noreferrer">Webpack</a> or <a href="https://esbuild.github.io/" target="_blank" rel="noopener noreferrer">esbuild</a> for efficient bundling and minification.</p>

      <h3>5. Enable Caching</h3>
      <p>Implement browser caching to serve cached resources to returning visitors. This reduces server requests and improves load times for repeat visits. Use our <a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> to verify your caching headers.</p>

      <h2>Monitoring Page Size Over Time</h2>
      <p>Page size tends to grow as new features are added. Regular monitoring with our <strong>Page Size Checker</strong> helps you:</p>
      <ul>
        <li>Track size regressions before they impact performance</li>
        <li>Validate optimization efforts</li>
        <li>Maintain performance budgets</li>
        <li>Ensure your <strong>mobile-friendly website</strong> stays lightweight</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> to see how size changes affect load times, and <a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> to ensure optimizations don't create redirect chains.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is the Page Size Checker?</h3>
      <p>The <strong>Page Size Checker</strong> is a tool that analyzes your webpage's total weight by measuring the size of HTML, CSS, JavaScript, images, fonts, and other resources. It provides a detailed breakdown of what contributes to your page's load time.</p>

      <h3>How does page size affect SEO?</h3>
      <p>Page size is directly correlated with load speed, which is a confirmed ranking factor for <strong>mobile SEO</strong>. Larger pages take longer to load, leading to higher bounce rates and lower engagement. Google's <strong>Core Web Vitals</strong> include metrics that are directly impacted by page size.</p>

      <h3>What is a good page size for mobile?</h3>
      <p>For optimal <strong>mobile SEO</strong>, aim for a total page size under 1.5 MB. Individual budgets should target: HTML under 100 KB, CSS under 100 KB, JavaScript under 350 KB, and initial viewport images under 1 MB. Use our <strong>Page Size Checker</strong> to benchmark your site.</p>

      <h3>Why are images the largest part of my page?</h3>
      <p>Images typically account for 50-80% of total page weight. This is normal but requires careful optimization. Use <strong>responsive images</strong> with <code>srcset</code>, compress images, and serve modern formats like WebP. Our <a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> can help identify image optimization opportunities.</p>

      <h3>How do I reduce my page size?</h3>
      <p>Start by running our <strong>Page Size Checker</strong> to identify the largest resources. Then: compress images, minify CSS/JS, enable Gzip/Brotli compression, implement lazy loading, and use code splitting. Regularly monitor your progress with our <a href="https://opensourcetools.online/tools/page-size" target="_blank" rel="noopener noreferrer">Page Size Tool</a>.</p>

      <h3>What's the difference between page size and page speed?</h3>
      <p>Page size refers to the total bytes downloaded, while page speed measures how fast those bytes are delivered and rendered. A small page on a slow server can be slower than a larger page on a fast CDN. Use our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> together with the <strong>Page Size Checker</strong> for a complete picture.</p>

      <h3>How often should I check my page size?</h3>
      <p>Check your page size with our <strong>Page Size Checker</strong> whenever you add new features, update your theme, or deploy significant changes. For e-commerce or high-traffic sites, weekly monitoring is recommended to catch size regressions early.</p>

      <h3>Does Gzip compression affect my page size measurement?</h3>
      <p>Our <strong>Page Size Checker</strong> measures actual bytes transferred. If your server uses Gzip or Brotli compression (verify with our <a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Checker</a>), the tool reports the compressed size—which is what users actually download.</p>

      <h2>Conclusion</h2>
      <p>Page size is one of the most influential factors in website performance, user experience, and <strong>mobile SEO</strong>. Our <strong>Page Size Checker</strong> provides the detailed analysis you need to identify optimization opportunities and maintain a fast, <strong>mobile-friendly website</strong>.</p>

      <p>Remember that page size optimization is an ongoing process. Regular monitoring with our <strong>Page Size Checker</strong>, combined with our <a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> and <a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Checker</a>, will help you maintain optimal performance and satisfy Google's <strong>Core Web Vitals</strong> requirements.</p>

      <p>Start optimizing your page size today—test your website now and deliver the fast, efficient experience that modern users expect and Google rewards.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Page Size Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/gzip-checker" target="_blank" rel="noopener noreferrer">Gzip Compression Checker</a> - Verify compression settings</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize content</li>
        <li><a href="https://opensourcetools.online/tools/ssl-checker" target="_blank" rel="noopener noreferrer">SSL Certificate Checker</a> - Ensure secure connections</li>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Monitor server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Optimize URL forwarding</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Validator</a> - Ensure discoverability</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/link-checker" target="_blank" rel="noopener noreferrer">Link Checker</a> - Ensure all links work</li>
        <li><a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Tool</a> - Measure content depth</li>
        <li><a href="https://opensourcetools.online/tools/keyword-density" target="_blank" rel="noopener noreferrer">Keyword Density Tool</a> - Optimize content relevance</li>
        <li><a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Inspector</a> - Optimize social sharing</li>
        <li><a href="https://opensourcetools.online/tools/robots-txt" target="_blank" rel="noopener noreferrer">Robots.txt Tester</a> - Verify crawler directives</li>
      </ul>

      <p>For further reading on web performance optimization, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/speed" target="_blank" rel="noopener noreferrer">Google Page Speed Insights</a></li>
        <li><a href="https://web.dev/performance/" target="_blank" rel="noopener noreferrer">web.dev Performance Guides</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/Performance" target="_blank" rel="noopener noreferrer">MDN Web Performance Documentation</a></li>
        <li><a href="https://httparchive.org/reports/state-of-the-web" target="_blank" rel="noopener noreferrer">HTTP Archive Web Almanac</a></li>
      </ul>
    </article>
  );
}