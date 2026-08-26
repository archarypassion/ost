"use client";
import { useState } from 'react';
import Link from 'next/link';

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
          <button
            type="button"
            className={`mode-tab ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            🔗 Single URL
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
          >
            📋 Bulk Check (up to 25)
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'single' ? (
            <div className="search-bar">
              <input
                type="text"
                placeholder="https://example.com/page"
                className="search-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" className="check-btn" disabled={loading}>
                {loading ? '⏳ Checking…' : '🚀 Check Status'}
              </button>
            </div>
          ) : (
            <div className="bulk-input-area">
              <div className="bulk-header">
                <span className="bulk-label">Enter URLs (one per line)</span>
                <span className="bulk-count">{bulkText.split(/\r?\n/).filter(s => s.trim()).length} / 25 URLs</span>
              </div>
              <textarea
                className="wc-textarea"
                placeholder={`https://example.com/\nhttps://example.com/page2\nhttps://example.com/page3`}
                value={bulkText}
                onChange={(e) => {
                  const lines = e.target.value.split(/\r?\n/).filter(s => s.trim());
                  if (lines.length <= 25) {
                    setBulkText(e.target.value);
                  }
                }}
                required
              />
              <button type="submit" className="check-btn" style={{ marginTop: '0.75rem' }} disabled={loading}>
                {loading ? '⏳ Checking All…' : '🔍 Check All URLs'}
              </button>
            </div>
          )}
        </form>

        <div className="kd-options">
          <label className="kd-top-label">
            <span className="label-text">HTTP Method:</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET (downloads content)</option>
              <option value="HEAD">HEAD (headers only, faster)</option>
            </select>
          </label>
          <span className="method-hint">
            💡 HEAD is faster for large pages
          </span>
        </div>

        <p className="tool-description">
          🔄 Follow redirects, see every hop's status code with timing, and inspect the final response's
          headers. Bulk mode lets you check up to 25 URLs at once — ideal for verifying redirect maps after
          a site migration.
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
        <div className="result-banner danger"><strong>❌ {d.error}</strong></div>
      </div>
    );
  }
  const kind = d.finalKind;
  return (
    <div className="result-box">
      <div className={`result-banner ${KIND_CLASS[kind]}`}>
        <strong>✅ HTTP {d.finalStatus} {d.finalStatusText}</strong>
        <span>· {d.method} · ⏱️ {d.totalElapsedMs} ms total · 🔄 {d.redirectChain.length - 1} redirect{d.redirectChain.length === 2 ? '' : 's'}</span>
      </div>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">📌 Requested URL</span><span className="result-value-mono">{d.url}</span></div>
        <div className="result-item"><span className="result-label">📍 Final URL</span><span className="result-value-mono">{d.finalUrl}</span></div>
        <div className="result-item"><span className="result-label">💡 What this means</span><span className="result-value">{d.finalMeaning}</span></div>
      </div>

      {d.redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">🔄 Redirect chain ({d.redirectChain.length} hops)</h3>
          <ol className="redirect-chain">
            {d.redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className={`status-pill kind-${KIND_CLASS[statusKindClient(hop.status)]}`}>HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
                <span className="redirect-meta">⏱️ {hop.elapsedMs} ms{hop.location ? ` → ${hop.location}` : ''}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <h3 className="result-section-title">📋 Final response headers ({d.finalHeaders.length})</h3>
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
        <strong>✅ {d.count} URL{d.count === 1 ? '' : 's'} checked</strong>
        <span>
          {' '}· ✅ {d.counts.success || 0} OK · 🔄 {d.counts.redirect || 0} redirect · ❌ {d.counts['client-error'] || 0} 4xx · ⚠️ {d.counts['server-error'] || 0} 5xx · ❌ {d.counts.errors || 0} errors
        </span>
      </div>
      <div className="bulk-list">
        {d.results.map((r, idx) => (
          <div key={idx} className="bulk-row">
            {r.error ? (
              <>
                <span className="status-pill kind-danger">❌ ERR</span>
                <span className="result-value-mono">{r.url}</span>
                <span className="bulk-error">⚠️ {r.error}</span>
              </>
            ) : (
              <>
                <span className={`status-pill kind-${KIND_CLASS[r.finalKind]}`}>{r.finalStatus}</span>
                <span className="result-value-mono">{r.url}</span>
                <span className="bulk-meta">
                  ⏱️ {r.totalElapsedMs} ms{r.redirectChain.length > 1 ? ` · 🔄 ${r.redirectChain.length - 1} redirect${r.redirectChain.length === 2 ? '' : 's'}` : ''}
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
      <h2>HTTP Response Status Codes: IETF Standards &amp; Search Engine Behavior</h2>
      <p>
        Every HTTP transaction between a client (browser, crawler, API agent) and a web server produces a 3-digit status code standardized under <a href="https://www.rfc-editor.org/rfc/rfc9110.html" target="_blank" rel="noopener noreferrer">IETF RFC 9110</a>. These codes determine whether search engines index content, follow links, or discard URLs from their indexes.
      </p>

      <h2>HTTP Status Code Categories</h2>

      <h3>1. 2xx Success (Resource Available)</h3>
      <ul>
        <li><strong>200 OK:</strong> The standard response for successful HTTP requests. Search engines parse and index the returned HTML payload.</li>
        <li><strong>204 No Content:</strong> The server successfully processed the request but returns no message body.</li>
      </ul>

      <h3>2. 3xx Redirection (URL Relocation)</h3>
      <ul>
        <li><strong>301 Moved Permanently:</strong> Directs crawlers to transfer link equity (PageRank) to the target URL and update indexed URLs permanently.</li>
        <li><strong>302 Found (Temporary):</strong> Tells crawlers to fetch the target URL while keeping the original URL indexed. Does not reliably transfer link equity.</li>
        <li><strong>307 Temporary Redirect:</strong> Guarantees that the HTTP request method (e.g. POST) is not mutated when following the redirect.</li>
        <li><strong>308 Permanent Redirect:</strong> The permanent counterpart to 307. Passes PageRank while strictly maintaining the original HTTP request method.</li>
      </ul>

      <h3>3. 4xx Client Errors (Resource Unavailable)</h3>
      <ul>
        <li><strong>404 Not Found:</strong> The server cannot find the requested URL. Googlebot deprioritizes crawling after repeated 404s and de-indexes the page.</li>
        <li><strong>410 Gone:</strong> Explicitly signals permanent removal. Google drops 410 pages from search indexes significantly faster than 404s.</li>
        <li><strong>403 Forbidden:</strong> The server refuses to authorize the request (often triggered by aggressive WAFs blocking legitimate search crawlers).</li>
        <li><strong>429 Too Many Requests:</strong> Rate limiting is active. Tells crawlers to back off and reduce request frequency.</li>
      </ul>

      <h3>4. 5xx Server Errors (Infrastructure Failures)</h3>
      <ul>
        <li><strong>500 Internal Server Error:</strong> Unhandled backend exception or database failure.</li>
        <li><strong>502 Bad Gateway / 504 Gateway Timeout:</strong> Upstream origin server failed or timed out behind a reverse proxy (Nginx, Cloudflare).</li>
        <li><strong>503 Service Unavailable:</strong> Temporary server maintenance. When paired with a <code>Retry-After</code> header, Googlebot pauses crawling without dropping rankings.</li>
      </ul>

      <h2>Crawl Budget &amp; Bulk Header Auditing</h2>

      <p>
        Search engines allocate a finite <em>crawl budget</em> per domain. Excessive redirect chains, unresolved 404 errors, and slow 5xx server faults exhaust crawl bandwidth, preventing new articles from being indexed promptly.
      </p>
      <p>
        Use the Bulk Check mode above to verify up to 25 migrated URLs simultaneously, or inspect entire redirect path sequences with our <Link href="/tools/redirect-checker">Redirect Checker</Link>.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>What is a "Soft 404" error?</h3>
      <p>
        A Soft 404 occurs when a server returns a <code>200 OK</code> status code for a page that actually displays a "Page Not Found", blank, or thin content message. Google flags Soft 404s in Search Console because they waste crawl resources.
      </p>

      <h3>How does HEAD request method differ from GET?</h3>
      <p>
        A <code>HEAD</code> request returns the exact same HTTP headers as a <code>GET</code> request but omits the response body. It is significantly faster for auditing large asset status codes without consuming server bandwidth.
      </p>

      <h3>Can broken links hurt overall domain authority?</h3>
      <p>
        Internal broken links leak PageRank equity and create poor user navigation. Audit all outbound and internal links across your pages using our <Link href="/tools/link-checker">Broken Link Checker</Link>.
      </p>
    </article>
  );
}