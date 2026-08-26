"use client";
import { useState } from 'react';
import Link from 'next/link';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

export default function MobileFriendlyPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/mobile-friendly', {
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
      <div className="tool-header"><h1>Mobile Friendly Test</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Testing…' : 'Test Page'}</button>
        </form>
        <p className="tool-description">
          We fetch the page using a Pixel 7 user-agent and analyse the HTML for the signals that decide
          mobile friendliness — viewport configuration, image responsiveness, fixed-width containers,
          tap-target hints, web app manifest, and input types.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { verdict, summary, checks, signals } = data;
  const banner = verdict === 'not-mobile-friendly' ? 'danger' : verdict === 'mostly-friendly' ? 'warning' : 'success';
  const bannerText =
    verdict === 'mobile-friendly' ? 'Mobile-friendly — no blocking issues' :
      verdict === 'mostly-friendly' ? 'Mostly mobile-friendly — some warnings' :
        'Not mobile-friendly — needs fixes';

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {summary.pass} pass · {summary.warn} warn · {summary.fail} fail · {summary.info} info</span>
      </div>

      <div className="mf-preview-wrap">
        <div className="mf-preview-frame">
          <div className="mf-preview-notch" />
          <div className="mf-preview-screen">
            <div className="mf-viewport-line">
              <strong>viewport</strong>
              <code>{signals.viewportContent || '— missing —'}</code>
            </div>
            <ul className="mf-feature-list">
              <li className={signals.viewport?.width === 'device-width' ? 'ok' : 'no'}>device-width</li>
              <li className={signals.themeColor ? 'ok' : 'no'}>theme-color</li>
              <li className={signals.hasTouchIcon ? 'ok' : 'no'}>apple-touch-icon</li>
              <li className={signals.hasManifest ? 'ok' : 'no'}>web manifest</li>
            </ul>
          </div>
        </div>
        <div className="mf-summary">
          <h3 className="result-section-title" style={{ marginTop: 0 }}>Signals</h3>
          <div className="result-grid">
            <div className="result-item"><span className="result-label">Images (total)</span><span className="result-value">{signals.images.total}</span></div>
            <div className="result-item"><span className="result-label">Images with srcset</span><span className="result-value">{signals.images.withSrcset}</span></div>
            <div className="result-item"><span className="result-label">Fixed-width images</span><span className="result-value">{signals.images.fixedWidth}</span></div>
            <div className="result-item"><span className="result-label">Fixed-width containers</span><span className="result-value">{signals.fixedWidthContainers}</span></div>
            <div className="result-item"><span className="result-label">Inputs (good types)</span><span className="result-value">{signals.inputs.good} / {signals.inputs.total}</span></div>
            <div className="result-item"><span className="result-label">Flash objects</span><span className="result-value">{signals.flashCount}</span></div>
          </div>
        </div>
      </div>

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
      <h2>Mobile Viewport Architecture &amp; Touch Interface Standards</h2>
      <p>
        Since Google migrated fully to mobile-first indexing, search crawlers evaluate the smartphone rendering of a webpage as the definitive source for ranking, indexing, and structured data extraction. Pages failing mobile usability standards suffer significant organic search visibility penalties.
      </p>

      <h2>Core Mobile Usability Signals</h2>

      <h3>1. Viewport Meta Tag Configuration</h3>
      <p>
        The HTML <code>&lt;meta name="viewport"&gt;</code> directive instructs mobile browsers how to map CSS pixels to device screen dimensions:
      </p>
      <pre className="code-pre">
        <code>{`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`}</code>
      </pre>
      <p>
        Omitting this tag forces mobile browsers to render the page in a virtual 980px desktop viewport, rendering typography illegible without manual pinch-to-zoom.
      </p>

      <h3>2. Tap Target Sizing (WCAG 2.5.5 Compliance)</h3>
      <p>
        Interactive elements (buttons, links, form inputs) must have a minimum touch bounding box of <strong>48&times;48 CSS pixels</strong> with at least 8px of negative space between adjacent targets. Undersized tap targets lead to high interaction error rates on touchscreens.
      </p>

      <h3>3. Eliminating Fixed-Width Layout Constraints</h3>
      <p>
        Hardcoding fixed pixel dimensions (e.g. <code>width: 1200px</code> or <code>min-width: 960px</code>) causes horizontal viewport overflow. Modern mobile layouts require fluid CSS Flexbox or CSS Grid structures:
      </p>
      <pre className="code-pre">
        <code>{`/* Fluid container constraint */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}`}</code>
      </pre>

      <h3>4. HTML5 Contextual Mobile Keyboards</h3>
      <p>
        Declaring semantic <code>type</code> and <code>inputmode</code> attributes on <code>&lt;input&gt;</code> elements triggers the optimal virtual software keyboard:
      </p>
      <ul>
        <li><code>&lt;input type="email" autocomplete="email" /&gt;</code> &mdash; Displays <code>@</code> and domain shortcuts.</li>
        <li><code>&lt;input type="tel" inputmode="tel" /&gt;</code> &mdash; Opens the numerical telephone keypad.</li>
        <li><code>&lt;input type="number" inputmode="numeric" /&gt;</code> &mdash; Opens the digit keypad for numeric entry.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Does Google maintain a separate desktop search index?</h3>
      <p>
        No. Google uses a single unified search index populated exclusively by Googlebot Smartphone crawlers. Desktop rankings are determined by the mobile-rendered DOM.
      </p>

      <h3>How does responsive design differ from adaptive serving?</h3>
      <p>
        Responsive design serves the same HTML and CSS to all devices, adapting layout dynamically via CSS media queries. Adaptive serving uses server-side user-agent sniffing to return different HTML. Google strongly recommends responsive design.
      </p>

      <h3>How can I test the mobile download speed of my pages?</h3>
      <p>
        Audit resource payloads and transfer sizes using our <Link href="/tools/page-size">Page Size Checker</Link> and test server response latencies with our <Link href="/tools/page-speed">Page Speed Checker</Link>.
      </p>
    </article>
  );
}