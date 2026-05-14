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
          download — using Node’s low-level socket events for sub-millisecond accuracy. Then probes the
          top scripts, stylesheets and images for size. Server-side measurement, so it doesn’t depend on
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
      <h2>What This Tool Measures (and What It Can’t)</h2>
      <p>This tool uses Node’s low-level socket events to give you the real network timings of your page request: DNS resolution, TCP connect, TLS handshake, time-to-first-byte (TTFB), and total HTML download. These numbers are what your origin server is actually responsible for — they don’t depend on your browser, plugins, or device.</p>
      <h3>What this tool does NOT measure</h3>
      <p>Core Web Vitals (LCP, CLS, INP), JavaScript execution time, render-blocking CSS, layout shifts, third-party tag impact, and anything about the visual rendering of the page. Those require a real browser. Use Google PageSpeed Insights, WebPageTest, or Chrome DevTools’ Performance panel for that.</p>
      <h3>How to use the numbers</h3>
      <ul>
        <li><strong>TTFB &gt; 600 ms</strong> almost always points at the origin (slow database queries, cold serverless starts, lack of edge caching).</li>
        <li><strong>TLS &gt; 500 ms</strong> indicates older TLS configuration — TLS 1.3 plus session resumption can shave 100–300 ms.</li>
        <li><strong>DNS &gt; 300 ms</strong> means your DNS provider is slow or you’re not using anycast.</li>
        <li><strong>Total page bytes &gt; 3 MB</strong> is a budget-buster on mobile; investigate images, fonts, and JavaScript first.</li>
      </ul>
    </article>
  );
}
