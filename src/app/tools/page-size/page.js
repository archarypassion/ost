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
      <p>The HTTP Archive’s long-running data shows that the median web page now ships ~2.4 MB to mobile devices. That weight is paid for by your users — every byte costs them battery, data, and time. Google’s Core Web Vitals don’t directly measure size, but Largest Contentful Paint and Interaction to Next Paint correlate strongly with how heavy your page is.</p>
      <h3>What this tool measures</h3>
      <p>We download the HTML, then walk every <code>&lt;link&gt;</code>, <code>&lt;script&gt;</code>, <code>&lt;img&gt;</code>, <code>srcset</code>, <code>&lt;source&gt;</code>, video/audio source, preload, and icon link. For each external resource we send a HEAD request (falling back to GET when servers reject HEAD) and record the response’s actual size. Inline data: URIs are listed but not counted.</p>
      <h3>Performance budgets that work</h3>
      <p>For mobile-first sites a useful budget is roughly: HTML ≤ 100 KB, total CSS ≤ 100 KB, total JS ≤ 350 KB (parsed/compressed), images ≤ 1 MB on the initial viewport, and a total weight under 1.5 MB. Heavier pages are still possible to make fast — but they require very deliberate optimisation (HTTP/3, Brotli, lazy-loading, image responsive variants, font subsetting).</p>
    </article>
  );
}
