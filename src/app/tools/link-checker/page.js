"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

function kindOf(s) {
  if (!s) return 'unknown';
  if (s >= 200 && s < 300) return 'success';
  if (s >= 300 && s < 400) return 'redirect';
  if (s >= 400 && s < 500) return 'client-error';
  if (s >= 500) return 'server-error';
  return 'unknown';
}

export default function LinkCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/link-checker', {
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
      <div className="tool-header"><h1>Broken Link Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com/blog/post" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Crawling links…' : 'Check Links'}</button>
        </form>
        <p className="tool-description">
          Extract every <code>&lt;a href&gt;</code> on the page and probe each one in parallel. We report
          status codes, redirects, broken targets, and SEO-relevant attributes (rel, nofollow, target).
          We check up to 100 unique HTTP links per page.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} filter={filter} setFilter={setFilter} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data, filter, setFilter }) {
  const { counts, links, nonHttp, issues, summary } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const filtered = links.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'broken') return l.error || (l.status && l.status >= 400);
    if (filter === 'redirect') return l.status >= 300 && l.status < 400;
    if (filter === 'internal') return l.internal === true;
    if (filter === 'external') return l.internal === false;
    return true;
  });

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>
          {counts.broken + counts.errors > 0
            ? `${counts.broken + counts.errors} link${counts.broken + counts.errors === 1 ? '' : 's'} need attention`
            : `All ${counts.http} HTTP link${counts.http === 1 ? '' : 's'} look healthy`}
        </strong>
        <span>· {counts.ok} ok · {counts.redirected} redirected · {counts.broken} broken · {counts.errors} errors</span>
      </div>

      <h3 className="result-section-title">Links found</h3>
      <div className="wc-grid">
        <Stat label="Total" value={counts.total} highlight />
        <Stat label="HTTP/HTTPS" value={counts.http} />
        <Stat label="Internal" value={counts.internal} />
        <Stat label="External" value={counts.external} />
        <Stat label="Email / Tel / Anchor" value={counts.nonHttp} />
        <Stat label="External nofollow" value={counts.noFollowExternal} />
      </div>

      {counts.truncated && <div className="result-warning">Showing first 100 unique HTTP links — page contains more. Use a desktop crawler for full audits.</div>}

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
        <h3 className="result-section-title" style={{ marginBottom: 0 }}>HTTP links ({filtered.length})</h3>
        <div className="og-tabs" style={{ marginBottom: 0 }}>
          {[['all', 'All'], ['broken', 'Broken'], ['redirect', 'Redirects'], ['internal', 'Internal'], ['external', 'External']].map(([k, label]) => (
            <button key={k} type="button" className={`og-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="ps-resource-list">
        {filtered.map((l, idx) => (
          <div key={idx} className="lc-row">
            <span className={`status-pill kind-${kindOf(l.status)}`}>{l.error ? 'ERR' : (l.status || '—')}</span>
            <span className="lc-internal-tag">{l.internal ? 'internal' : 'external'}</span>
            <div className="lc-link-body">
              <span className="lc-link-text">{l.text || <em>(no anchor text)</em>}</span>
              <a href={l.absoluteUrl} className="result-value-mono lc-link-url" target="_blank" rel="noopener noreferrer">{l.absoluteUrl}</a>
              <div className="lc-link-meta">
                {l.redirected && <span>→ {l.finalUrl}</span>}
                {l.rel && <span> · rel=&quot;{l.rel}&quot;</span>}
                {l.target && <span> · target=&quot;{l.target}&quot;</span>}
                {l.error && <span className="bulk-error" style={{ paddingLeft: 0 }}> · {l.error}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nonHttp.length > 0 && (
        <>
          <h3 className="result-section-title">Non-HTTP links ({nonHttp.length})</h3>
          <div className="ps-resource-list">
            {nonHttp.slice(0, 30).map((l, idx) => (
              <div key={idx} className="lc-row">
                <span className="ps-resource-type" style={{ background: '#9ca3af20', color: '#6b7280' }}>{l.kind}</span>
                <div className="lc-link-body">
                  <span className="lc-link-text">{l.text || <em>(no anchor text)</em>}</span>
                  <span className="result-value-mono lc-link-url">{l.href}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`wc-stat ${highlight ? 'highlight' : ''}`}>
      <div className="wc-stat-label">{label}</div>
      <div className="wc-stat-value">{value}</div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Broken Links: A Slow Drain on Your Authority</h2>
      <p>Internal broken links waste crawl budget and hurt the user experience. External broken links to dead resources are usually the bigger problem — they signal to search engines that your content isn’t maintained. Both should be fixed regularly, ideally as part of a quarterly content audit.</p>
      <h3>What we check</h3>
      <p>For each unique <code>&lt;a href&gt;</code> on the page we send a HEAD request (with a GET fallback for servers that reject HEAD). We follow redirects and report the final status code. The results are split into internal vs external, ok vs broken, and you can filter the list to focus on what matters.</p>
      <h3>What to do with the results</h3>
      <p>For internal broken links, fix them — either correct the path or 301 redirect the destination. For external 404s, replace the link with a current source or remove the reference. For external 403/redirect-to-homepage cases, the source has often moved their content; track it down or update. For external timeout errors, retry once before assuming the site is down.</p>
    </article>
  );
}
