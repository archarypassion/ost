"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };
const TAG_KIND = { good: 'kind-success', warn: 'kind-redirect', bad: 'kind-danger', info: 'kind-unknown' };

function classifyStatus(s) {
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

export default function RedirectCheckerPage() {
  const [url, setUrl] = useState('');
  const [compareUA, setCompareUA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/redirect-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), compareUserAgents: compareUA }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>Redirect Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Tracing…' : 'Trace Redirects'}</button>
        </form>
        <label className="og-toggle">
          <input type="checkbox" checked={compareUA} onChange={(e) => setCompareUA(e.target.checked)} />
          <span>Also fetch as Googlebot and Mobile Safari (detect crawler-specific redirects)</span>
        </label>

        <p className="tool-description">
          Trace every hop in a redirect chain, classify each step (301 vs 302, HTTPS upgrade, www toggle,
          trailing-slash, cross-domain) and surface SEO problems — long chains, mixed types, downgrades, loops.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { chain, issues, summary, comparisons } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const bannerText = summary.fail
    ? `${summary.fail} issue${summary.fail === 1 ? '' : 's'} in the redirect chain`
    : summary.warn
    ? `${summary.warn} warning${summary.warn === 1 ? '' : 's'}`
    : summary.hops === 0
    ? 'No redirect — page responded directly'
    : `${summary.hops} redirect${summary.hops === 1 ? '' : 's'} — chain looks healthy`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {summary.hops} hop{summary.hops === 1 ? '' : 's'} · final HTTP {summary.finalStatus} · {summary.totalElapsedMs} ms total</span>
      </div>

      <h3 className="result-section-title">Chain ({chain.length} step{chain.length === 1 ? '' : 's'})</h3>
      <ol className="rc-chain">
        {chain.map((hop, idx) => (
          <li key={idx} className="rc-step">
            <div className="rc-step-head">
              <span className="rc-step-num">{idx + 1}</span>
              <span className={`status-pill kind-${classifyStatus(hop.status)}`}>HTTP {hop.status}</span>
              <span className="rc-step-time">{hop.elapsedMs} ms</span>
            </div>
            <div className="rc-step-url result-value-mono">{hop.url}</div>
            {hop.location && idx < chain.length - 1 && (
              <div className="rc-step-location">
                <span className="rc-arrow">→</span>
                <span className="result-value-mono">{hop.location}</span>
              </div>
            )}
            {hop.tags && hop.tags.length > 0 && (
              <div className="rc-step-tags">
                {hop.tags.map((t, i) => <span key={i} className={`status-pill ${TAG_KIND[t.kind]}`}>{t.label}</span>)}
              </div>
            )}
          </li>
        ))}
      </ol>

      {issues.length > 0 && (
        <>
          <h3 className="result-section-title">Findings</h3>
          <ul className="og-check-list">
            {issues.map((c, idx) => (
              <li key={idx} className={`og-check-row sev-${c.severity}`}>
                <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
                <div className="og-check-body">
                  <div className="og-check-head">
                    <span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span>
                  </div>
                  <div className="og-check-message">{c.message}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {comparisons && (
        <>
          <h3 className="result-section-title">User-agent comparison</h3>
          <UAComparison label="Googlebot" v={comparisons.googlebot} />
          <UAComparison label="Mobile Safari" v={comparisons.mobile} />
        </>
      )}
    </div>
  );
}

function UAComparison({ label, v }) {
  if (v.error) {
    return (
      <div className="rc-ua-row">
        <strong>{label}:</strong>
        <span className="bulk-error" style={{ paddingLeft: 0 }}>{v.error}</span>
      </div>
    );
  }
  return (
    <div className="rc-ua-row">
      <strong>{label}</strong>
      <div className="rc-ua-meta">
        <span className={`status-pill kind-${classifyStatus(v.finalStatus)}`}>HTTP {v.finalStatus}</span>
        <span>{v.hops - 1} redirect{v.hops === 2 ? '' : 's'}</span>
      </div>
      <div className="rc-ua-final result-value-mono">{v.finalUrl}</div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Redirects: Where Sites Quietly Lose Rankings</h2>
      <p>Redirects are how the web survives renames, restructures, HTTPS migrations, and consolidations. They’re also where ranking signals leak away if you’re not careful. A handful of common mistakes — using 302 instead of 301 for a permanent move, chains of three or more hops, downgrading from HTTPS to HTTP at any step, or accidentally creating a loop — can quietly drop a site’s organic visibility for months before anyone notices.</p>
      <h3>301 vs 302 vs 308</h3>
      <p><code>301</code> is permanent and passes nearly all PageRank to the new URL. <code>302</code> is temporary and Google is more conservative about transferring signals through it. <code>308</code> is permanent <em>and</em> preserves the request method (POST stays POST). For an HTTPS migration, a www toggle, or a permanent move always use 301 (or 308 if methods matter).</p>
      <h3>Chain length matters</h3>
      <p>Each extra hop adds latency for users and crawl cost for Google. Industry research suggests roughly 5–10% of equity dissipates per extra hop. Updating <em>incoming</em> links to point to the final URL is one of the highest-leverage technical SEO tasks you can do after a migration.</p>
      <h3>How to use this tool</h3>
      <p>Paste a URL — we follow every redirect, time each hop, classify the type (permanent vs temporary, scheme upgrade, www toggle, slash toggle, cross-domain) and call out the issues that hurt SEO. Toggle the user-agent comparison to detect cases where bots are sent down a different path than humans — a smell of cloaking or fragile redirect logic.</p>
    </article>
  );
}
