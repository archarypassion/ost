"use client";
import { useState } from 'react';

const KIND_CLASS = { success: 'success', redirect: 'warning', 'client-error': 'danger', 'server-error': 'danger', unknown: 'warning' };

export default function HttpStatusPage() {
  const [mode, setMode] = useState('single');
  const [url, setUrl] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [method, setMethod] = useState('GET');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const body = mode === 'bulk'
        ? { method, urls: bulkText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) }
        : { method, url: url.trim() };
      const res = await fetch('/api/tools/http-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok && !json?.results) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl || json?.url) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>HTTP Status Checker</h1></div>
      <div className="tool-card">
        <div className="mode-tabs">
          <button type="button" className={`mode-tab ${mode === 'single' ? 'active' : ''}`} onClick={() => setMode('single')}>Single URL</button>
          <button type="button" className={`mode-tab ${mode === 'bulk' ? 'active' : ''}`} onClick={() => setMode('bulk')}>Bulk (up to 25)</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'single' ? (
            <div className="search-bar">
              <input type="text" placeholder="https://example.com/page" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
              <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking…' : 'Check Status'}</button>
            </div>
          ) : (
            <>
              <textarea className="wc-textarea" placeholder={`https://example.com/\nhttps://example.com/page2\nhttps://example.com/page3`} value={bulkText} onChange={(e) => setBulkText(e.target.value)} required />
              <button type="submit" className="check-btn" style={{ marginTop: '0.75rem' }} disabled={loading}>{loading ? 'Checking…' : 'Check All'}</button>
            </>
          )}
        </form>

        <div className="kd-options">
          <label className="kd-top-label">
            Method:
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="HEAD">HEAD</option>
            </select>
          </label>
        </div>

        <p className="tool-description">
          Follow redirects, see every hop’s status code with timing, and inspect the final response&apos;s
          headers. Bulk mode lets you check up to 25 URLs at once — ideal for verifying redirect maps after
          a migration.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data?.mode === 'single' && <SingleResult d={data} />}
        {data?.mode === 'bulk' && <BulkResult d={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function SingleResult({ d }) {
  if (d.error) {
    return (
      <div className="result-box">
        <div className="result-banner danger"><strong>{d.error}</strong></div>
      </div>
    );
  }
  const kind = d.finalKind;
  return (
    <div className="result-box">
      <div className={`result-banner ${KIND_CLASS[kind]}`}>
        <strong>HTTP {d.finalStatus} {d.finalStatusText}</strong>
        <span>· {d.method} · {d.totalElapsedMs} ms total · {d.redirectChain.length - 1} redirect{d.redirectChain.length === 2 ? '' : 's'}</span>
      </div>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">Requested URL</span><span className="result-value-mono">{d.url}</span></div>
        <div className="result-item"><span className="result-label">Final URL</span><span className="result-value-mono">{d.finalUrl}</span></div>
        <div className="result-item"><span className="result-label">What this means</span><span className="result-value">{d.finalMeaning}</span></div>
      </div>

      {d.redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">Redirect chain ({d.redirectChain.length} hops)</h3>
          <ol className="redirect-chain">
            {d.redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className={`status-pill kind-${KIND_CLASS[statusKindClient(hop.status)]}`}>HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
                <span className="redirect-meta">{hop.elapsedMs} ms{hop.location ? ` → ${hop.location}` : ''}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <h3 className="result-section-title">Final response headers ({d.finalHeaders.length})</h3>
      <div className="header-list">
        {d.finalHeaders.map((h, idx) => (
          <div key={idx} className="header-row">
            <code className="header-name">{h.name}</code>
            <span className="header-value">{h.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkResult({ d }) {
  return (
    <div className="result-box">
      <div className="result-banner success">
        <strong>{d.count} URL{d.count === 1 ? '' : 's'} checked</strong>
        <span>
          {' '}· {d.counts.success || 0} ok · {d.counts.redirect || 0} redirect · {d.counts['client-error'] || 0} 4xx · {d.counts['server-error'] || 0} 5xx · {d.counts.errors || 0} errors
        </span>
      </div>
      <div className="bulk-list">
        {d.results.map((r, idx) => (
          <div key={idx} className="bulk-row">
            {r.error ? (
              <>
                <span className="status-pill kind-danger">ERR</span>
                <span className="result-value-mono">{r.url}</span>
                <span className="bulk-error">{r.error}</span>
              </>
            ) : (
              <>
                <span className={`status-pill kind-${KIND_CLASS[r.finalKind]}`}>{r.finalStatus}</span>
                <span className="result-value-mono">{r.url}</span>
                <span className="bulk-meta">
                  {r.totalElapsedMs} ms{r.redirectChain.length > 1 ? ` · ${r.redirectChain.length - 1} redirect${r.redirectChain.length === 2 ? '' : 's'}` : ''}
                  {r.finalUrl !== r.url ? ` → ${r.finalUrl}` : ''}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function statusKindClient(s) {
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTTP Status Codes: A Practical Guide</h2>
      <p>Every web request returns a three-digit status code. They’re invisible to ordinary users but they decide whether search engines can index a page and whether visitors get the experience you intend.</p>
      <h3>The codes that matter most</h3>
      <ul>
        <li><strong>200</strong> — what every live page should return.</li>
        <li><strong>301</strong> — permanent redirect; passes the vast majority of ranking signals.</li>
        <li><strong>302 / 307</strong> — temporary; use only when the move is genuinely temporary.</li>
        <li><strong>308</strong> — permanent redirect that preserves the HTTP method (POST stays POST).</li>
        <li><strong>404</strong> — a few are normal; many on previously ranking URLs is lost value.</li>
        <li><strong>410</strong> — explicitly &ldquo;permanently removed&rdquo;; Google drops faster than 404.</li>
        <li><strong>500 / 502 / 503</strong> — server-side problems; if Googlebot sees them often, crawl rate drops.</li>
      </ul>
      <h3>How to use this tool</h3>
      <p>Single URL mode follows redirects, times each hop, and shows every final response header. Bulk mode lets you paste a list — perfect for sanity-checking a redirect map after a migration. Switch the method to HEAD to test without downloading the body — useful for very large pages.</p>
    </article>
  );
}
