"use client";
import { useState } from 'react';

const SEVERITY_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEVERITY_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

const VERDICT_LABEL = {
  'self-referencing': 'Self-referencing canonical',
  'cross-page': 'Canonical points to another URL',
  'no-canonical': 'No canonical declared',
};

export default function CanonicalUrlCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch('/api/tools/canonical-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Canonical URL Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            placeholder="https://example.com/page or example.com/page"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Checking…' : 'Check Canonical'}
          </button>
        </form>
        <p className="tool-description">
          We inspect the page&rsquo;s HTML <code>&lt;link rel=&quot;canonical&quot;&gt;</code> tag, parse
          its HTTP <code>Link</code> header, follow the canonical target one hop, and detect conflicts —
          duplicate tags, mismatched HTML/header values, redirect chains, noindex collisions, and loops.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { summary, verdict, primaryCanonical, htmlCanonicals, htmlCanonicalsRaw, linkHeaderCanonicals, target, checks, redirectChain, finalUrl, title, metaRobots, xRobotsTag, contentType, httpStatus } = data;

  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : (verdict === 'self-referencing' ? 'success' : 'warning');
  const bannerText = summary.fail
    ? `${summary.fail} blocking issue${summary.fail === 1 ? '' : 's'} — ${VERDICT_LABEL[verdict]}`
    : verdict === 'self-referencing'
    ? 'Self-referencing canonical — best-practice setup'
    : verdict === 'cross-page'
    ? 'Canonical points to another URL'
    : 'No canonical declared';

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {summary.pass} pass · {summary.warn} warn · {summary.fail} fail · {summary.info} info</span>
      </div>

      <div className="canonical-flow">
        <div className="canonical-flow-card">
          <div className="canonical-flow-label">Requested URL</div>
          <div className="result-value-mono">{data.url}</div>
        </div>
        <div className="canonical-flow-arrow" aria-hidden="true">→</div>
        <div className="canonical-flow-card">
          <div className="canonical-flow-label">Final URL after redirects</div>
          <div className="result-value-mono">{finalUrl}</div>
          <div className="canonical-flow-meta">HTTP {httpStatus}{redirectChain.length > 1 ? ` · ${redirectChain.length - 1} redirect${redirectChain.length === 2 ? '' : 's'}` : ''}</div>
        </div>
        <div className="canonical-flow-arrow" aria-hidden="true">→</div>
        <div className={`canonical-flow-card canonical-flow-canonical verdict-${verdict}`}>
          <div className="canonical-flow-label">Canonical declared</div>
          <div className="result-value-mono">{primaryCanonical || <em className="muted">— none —</em>}</div>
          <div className="canonical-flow-meta">{VERDICT_LABEL[verdict]}</div>
        </div>
      </div>

      <h3 className="result-section-title">Sources</h3>
      <div className="result-grid">
        <div className="result-item">
          <span className="result-label">HTML <code>&lt;link rel=&quot;canonical&quot;&gt;</code></span>
          <span className="result-value-mono">
            {htmlCanonicals.length === 0
              ? <em className="muted">— none —</em>
              : htmlCanonicalsRaw.map((raw, idx) => (
                  <div key={idx}>{raw}{raw !== htmlCanonicals[idx] && <span className="canonical-resolved"> → {htmlCanonicals[idx]}</span>}</div>
                ))}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">HTTP <code>Link</code> header</span>
          <span className="result-value-mono">
            {linkHeaderCanonicals.length === 0
              ? <em className="muted">— not present —</em>
              : linkHeaderCanonicals.map((u, idx) => <div key={idx}>{u}</div>)}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">Page title</span>
          <span className="result-value">{title || <em className="muted">—</em>}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Robots meta</span>
          <span className="result-value">{metaRobots || <em className="muted">—</em>}</span>
        </div>
        <div className="result-item">
          <span className="result-label">X-Robots-Tag header</span>
          <span className="result-value">{xRobotsTag || <em className="muted">—</em>}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Content-Type</span>
          <span className="result-value">{contentType || <em className="muted">—</em>}</span>
        </div>
      </div>

      <h3 className="result-section-title">Checks ({checks.length})</h3>
      <ul className="og-check-list">
        {checks.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEVERITY_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head">
                <code className="og-check-tag">{c.tag}</code>
                <span className={`og-check-label sev-${c.severity}`}>{SEVERITY_LABEL[c.severity]}</span>
              </div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>

      {target && <TargetBlock target={target} />}

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">Redirect chain</h3>
          <ol className="redirect-chain">
            {redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className="redirect-status">HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
                {hop.location && <span className="redirect-location">→ {hop.location}</span>}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function TargetBlock({ target }) {
  if (target.error) {
    return (
      <>
        <h3 className="result-section-title">Canonical target probe</h3>
        <div className="canonical-target-error">
          <strong>Could not reach the canonical target.</strong>
          <div style={{ marginTop: 6 }} className="result-value-mono">{target.requested}</div>
          <div style={{ marginTop: 6 }}>{target.error}</div>
        </div>
      </>
    );
  }
  return (
    <>
      <h3 className="result-section-title">Canonical target probe</h3>
      <div className="canonical-target">
        <div className="result-grid">
          <div className="result-item">
            <span className="result-label">Target URL</span>
            <span className="result-value-mono">{target.requested}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Final URL (after target redirects)</span>
            <span className="result-value-mono">{target.finalUrl}</span>
          </div>
          <div className="result-item">
            <span className="result-label">HTTP status</span>
            <span className="result-value">{target.httpStatus}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Content-Type</span>
            <span className="result-value">{target.contentType || '—'}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Target page title</span>
            <span className="result-value">{target.title || '—'}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Target&rsquo;s own canonical</span>
            <span className="result-value-mono">
              {target.htmlCanonicals[0] || target.linkHeaderCanonicals[0] || <em className="muted">— none —</em>}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Target robots</span>
            <span className="result-value">{target.metaRobots || target.xRobotsTag || <em className="muted">—</em>}</span>
          </div>
        </div>
        {target.redirectChain && target.redirectChain.length > 1 && (
          <>
            <div className="canonical-target-subtitle">Target redirect chain</div>
            <ol className="redirect-chain">
              {target.redirectChain.map((hop, idx) => (
                <li key={idx}>
                  <span className="redirect-status">HTTP {hop.status}</span>
                  <span className="result-value-mono">{hop.url}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Canonical URLs: How to Solve Duplicate Content Without Losing Rankings</h2>
      <p>The same content reachable from multiple URLs is endemic on the web. Trailing slashes, tracking parameters, HTTP vs HTTPS, www vs non-www, print and AMP variants — all create technical duplicates. The <code>&lt;link rel=&quot;canonical&quot;&gt;</code> tag is how you tell Google which URL to treat as the master copy and consolidate ranking signals to.</p>
      <h3>Self-referencing is the safe default</h3>
      <p>A self-referencing canonical — where every page declares its own URL as canonical — is best practice. It explicitly signals &ldquo;this is the original version&rdquo; and protects you if Google later finds the same content on a syndication partner or under a tracking parameter.</p>
      <h3>Where canonicals come from</h3>
      <p>Most sites use the HTML <code>&lt;link rel=&quot;canonical&quot;&gt;</code> tag in the <code>&lt;head&gt;</code>. But canonicals can also be sent via the HTTP <code>Link</code> response header — useful for non-HTML files like PDFs that have no <code>&lt;head&gt;</code> to inject into. We check both sources and flag conflicts when the two disagree (Google ignores the page-level canonical when this happens).</p>
      <h3>Conflicts that quietly destroy your canonicals</h3>
      <ul>
        <li><strong>Multiple canonical tags</strong> in the same HTML — Google ignores the page-level canonical entirely.</li>
        <li><strong>Canonical + noindex</strong> on the same page — contradictory signals; Google may drop both.</li>
        <li><strong>Canonical points to a redirect</strong> — Google follows it, but prefers a direct canonical to the final URL.</li>
        <li><strong>Canonical to a 4xx/5xx page</strong> — broken canonicalisation; ranking signals are lost.</li>
        <li><strong>Canonical loops</strong> — page A → B → A; Google ignores both.</li>
        <li><strong>Cross-domain canonicals</strong> — fine for syndication, dangerous when accidental (a copy-pasted template can wipe out a whole site&rsquo;s rankings overnight).</li>
      </ul>
      <h3>How to use this tool</h3>
      <p>Paste any URL above. We follow redirects, parse every canonical signal on the page, and then probe the canonical target itself — fetching it, reading its own canonical, and reporting whether the chain stops cleanly. Run it on key landing pages, on URL variations (<code>example.com</code> vs <code>example.com/</code> vs <code>www.example.com</code>) and on parameterised URLs to catch silent canonicalisation bugs before they cost rankings.</p>
    </article>
  );
}
