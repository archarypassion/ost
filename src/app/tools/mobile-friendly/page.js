"use client";
import { useState } from 'react';

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
      <h2>Mobile-First Means More Than Responsive</h2>
      <p>Google has been mobile-first indexing for years now: the mobile version of your page is the one Googlebot evaluates. A site that looks great on desktop but renders at desktop width on phones with overflowing tables and 8-pixel text will rank as poorly as if it were broken outright.</p>
      <h3>Signals that matter</h3>
      <ul>
        <li><strong>Viewport meta with width=device-width.</strong> Without it the browser assumes a 980px desktop layout.</li>
        <li><strong>Responsive images.</strong> srcset/sizes serve appropriately sized assets for each device.</li>
        <li><strong>No fixed-width containers.</strong> A single <code>width: 1200px</code> can break the entire layout.</li>
        <li><strong>Input types.</strong> Using <code>type=&quot;email&quot;</code> or <code>tel</code> shows a friendlier mobile keyboard.</li>
        <li><strong>Touch icons and theme-color.</strong> Polish for installed/pinned web apps.</li>
      </ul>
      <h3>Limitations of static analysis</h3>
      <p>This tool reads the served HTML — it does not run JavaScript. If your layout is built entirely in client-side React or by a framework that hydrates after load, the signals above may live in inline styles or runtime CSS instead. Consider this a fast first-pass; pair it with Chrome DevTools and Lighthouse for the full picture.</p>
    </article>
  );
}
