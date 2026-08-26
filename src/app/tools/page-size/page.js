"use client";
import { useState } from 'react';
import Link from 'next/link';

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
      <h2>Web Asset Payload Architecture &amp; Performance Budgets</h2>
      <p>
        Total page weight measures the cumulative uncompressed and over-the-wire byte payload downloaded by a browser to construct a webpage. Excessive page weight slows down network transmission, exhausts CPU parsing threads on mobile devices, and degrades Core Web Vitals (Largest Contentful Paint &amp; Interaction to Next Paint).
      </p>

      <h2>Recommended Production Performance Budgets</h2>

      <p>
        According to modern performance engineering standards (HTTP Archive &amp; Web.dev), high-performing pages should adhere to these baseline weight budgets:
      </p>
      <ul>
        <li><strong>HTML Document:</strong> &le; 100 KB uncompressed (maintains lean DOM depth &lt; 1,500 nodes).</li>
        <li><strong>Critical CSS:</strong> &le; 75 KB transfer weight (reduces render-blocking style parsing).</li>
        <li><strong>JavaScript Execution:</strong> &le; 300 KB compressed (minimizes main-thread hydration and scripting locks).</li>
        <li><strong>Hero Images &amp; Media:</strong> &le; 500 KB total for initial viewport assets (using modern formats like AVIF or WebP).</li>
        <li><strong>Web Fonts:</strong> &le; 100 KB total (subsetted WOFF2 fonts using <code>font-display: swap</code>).</li>
        <li><strong>Target Total Wire Size:</strong> &le; 1.5 MB for desktop, &le; 1.0 MB for mobile.</li>
      </ul>

      <h2>Asset-by-Asset Payload Breakdown</h2>

      <h3>1. Next-Gen Image Compression</h3>
      <p>
        Images frequently represent 60% to 80% of total transfer weight. Modern formats like <strong>AVIF</strong> and <strong>WebP</strong> provide 30% to 50% better compression than legacy JPEG/PNG without perceptual degradation. Always define responsive <code>srcset</code> attributes to avoid sending desktop-sized images to mobile screens.
      </p>

      <h3>2. JavaScript Code Splitting &amp; Tree Shaking</h3>
      <p>
        Every kilobyte of JavaScript must be downloaded, uncompressed, parsed, compiled, and executed. Splitting bundles into route-level chunks ensures users only download code necessary for the current view.
      </p>

      <h3>3. Server-Level Compression</h3>
      <p>
        Verify that all text assets (CSS, JS, SVG, HTML) are compressed with Brotli or Gzip using our <Link href="/tools/gzip-checker">Gzip &amp; Brotli Checker</Link>.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>How does this tool measure page weight?</h3>
      <p>
        The tool parses the initial HTML response, extracts every linked stylesheet (<code>&lt;link rel="stylesheet"&gt;</code>), script (<code>&lt;script src&gt;</code>), image (<code>&lt;img src/srcset&gt;</code>), font, and media file, and sends concurrent <code>HEAD</code> and <code>GET</code> requests to measure their exact byte footprint.
      </p>

      <h3>Why does heavy page weight hurt mobile search rankings?</h3>
      <p>
        Google indexes websites using mobile-first crawlers that emulate mid-tier mobile hardware on cellular connections. Large asset weights delay Largest Contentful Paint (LCP) and cause mobile user abandonment.
      </p>

      <h3>How can I measure the actual render time of my page?</h3>
      <p>
        Use our <Link href="/tools/page-speed">Page Speed Checker</Link> to inspect server response timing (TTFB) and full page load latency.
      </p>
    </article>
  );
}