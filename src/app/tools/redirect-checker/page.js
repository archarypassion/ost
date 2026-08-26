"use client";
import { useState } from 'react';
import Link from 'next/link';

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
      <div className="tool-header"><h1>🔄 Redirect Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input
            type="text"
            placeholder="https://example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Tracing…' : '🔍 Trace Redirects'}
          </button>
        </form>

        <div className="og-toggle-wrapper">
          <label className="og-toggle">
            <input type="checkbox" checked={compareUA} onChange={(e) => setCompareUA(e.target.checked)} />
            <span>🤖 Also fetch as Googlebot and Mobile Safari (detect crawler-specific redirects)</span>
          </label>
          <span className="toggle-hint">💡 Helps detect cloaking or user-agent-specific redirects</span>
        </div>

        <p className="tool-description">
          🔄 Trace every hop in a redirect chain, classify each step (301 vs 302, HTTPS upgrade, www toggle,
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
    ? `❌ ${summary.fail} issue${summary.fail === 1 ? '' : 's'} in the redirect chain`
    : summary.warn
      ? `⚠️ ${summary.warn} warning${summary.warn === 1 ? '' : 's'}`
      : summary.hops === 0
        ? '✅ No redirect — page responded directly'
        : `✅ ${summary.hops} redirect${summary.hops === 1 ? '' : 's'} — chain looks healthy`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {summary.hops} hop{summary.hops === 1 ? '' : 's'} · final HTTP {summary.finalStatus} · ⏱️ {summary.totalElapsedMs} ms total</span>
      </div>

      <h3 className="result-section-title">🔄 Chain ({chain.length} step{chain.length === 1 ? '' : 's'})</h3>
      <ol className="rc-chain">
        {chain.map((hop, idx) => (
          <li key={idx} className="rc-step">
            <div className="rc-step-head">
              <span className="rc-step-num">#{idx + 1}</span>
              <span className={`status-pill kind-${classifyStatus(hop.status)}`}>HTTP {hop.status}</span>
              <span className="rc-step-time">⏱️ {hop.elapsedMs} ms</span>
            </div>
            <div className="rc-step-url result-value-mono">📍 {hop.url}</div>
            {hop.location && idx < chain.length - 1 && (
              <div className="rc-step-location">
                <span className="rc-arrow">⬇️</span>
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
          <h3 className="result-section-title">📋 Findings</h3>
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
          <h3 className="result-section-title">🤖 User-agent comparison</h3>
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
        <span className="bulk-error" style={{ paddingLeft: 0 }}>❌ {v.error}</span>
      </div>
    );
  }
  return (
    <div className="rc-ua-row">
      <strong>{label}</strong>
      <div className="rc-ua-meta">
        <span className={`status-pill kind-${classifyStatus(v.finalStatus)}`}>HTTP {v.finalStatus}</span>
        <span>🔄 {v.hops - 1} redirect{v.hops === 2 ? '' : 's'}</span>
      </div>
      <div className="rc-ua-final result-value-mono">📍 {v.finalUrl}</div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Redirect Chain Architecture: Preserving Equity &amp; Eliminating Latency</h2>
      <p>
        URL redirection forwards visitors and automated crawlers from an initial requested URL to a secondary destination. While redirects are necessary during domain migrations, path restructuring, and HTTPS upgrades, misconfigured redirect chains create severe performance bottlenecks and ranking signal degradation.
      </p>

      <h2>The Anatomy of a Redirect Chain</h2>

      <p>
        A <em>redirect chain</em> occurs when an initial URL requires multiple intermediate redirection hops before resolving to a final <code>200 OK</code> destination:
      </p>
      <pre className="code-pre">
        <code>{`// Inefficient Multi-Hop Chain:
http://example.com/blog/
  └─(301)─> https://example.com/blog/
              └─(301)─> https://www.example.com/blog/
                          └─(301)─> https://www.example.com/blog`}</code>
      </pre>
      <p>
        <strong>The Solution:</strong> Flatten redirect chains into a single direct hop at the web server or edge CDN configuration level:
      </p>
      <pre className="code-pre">
        <code>{`// Optimized Direct Hop:
http://example.com/blog/  ─(301)─>  https://www.example.com/blog`}</code>
      </pre>

      <h2>Critical Redirection Pitfalls</h2>

      <h3>1. Protocol Downgrades (HTTPS &rarr; HTTP &rarr; HTTPS)</h3>
      <p>
        If any hop in a redirect chain drops from <code>https://</code> to <code>http://</code> before returning to HTTPS, sensitive referrer headers and session tokens are exposed in plaintext across open network connections, and browsers may flag mixed-content warnings.
      </p>

      <h3>2. Cumulative Round-Trip Latency</h3>
      <p>
        Each redirect hop requires a new DNS resolution (if cross-domain), TCP connection, and TLS handshake. On mobile cellular connections, a 3-hop chain can introduce <strong>600ms to 1200ms</strong> of pure Time-To-First-Byte (TTFB) delay, directly damaging Core Web Vitals (LCP) and increasing user abandonment.
      </p>

      <h3>3. Crawler vs. User Cloaking Risks</h3>
      <p>
        Serving different redirect destinations based on the client's <code>User-Agent</code> (e.g. redirecting mobile browsers to a separate subfolder while showing desktop bots a cached page) risks being classified as deceptive cloaking under Google Search Essentials. Use the "Compare User-Agents" feature above to verify consistency.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>Does Google stop following redirects after a certain number of hops?</h3>
      <p>
        Yes. Googlebot generally follows up to <strong>5 redirect hops</strong> in a single crawl attempt before aborting the request to prevent infinite loops. Once aborted, the destination URL may fail to be indexed.
      </p>

      <h3>What is a redirect loop?</h3>
      <p>
        A redirect loop occurs when URL A redirects to URL B, which redirects back to URL A (or through a cycle like A &rarr; B &rarr; C &rarr; A). Browsers abort with <code>ERR_TOO_MANY_REDIRECTS</code>.
      </p>

      <h3>Should internal links point through 301 redirects?</h3>
      <p>
        No. While 301 redirects preserve PageRank equity, you should update all internal navigation and in-text links to point directly to the final destination URL. Audit internal link health with our <Link href="/tools/link-checker">Broken Link Checker</Link>.
      </p>
    </article>
  );
}