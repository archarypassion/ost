"use client";
import { useState } from 'react';
import Link from 'next/link';

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
      <div className="tool-header"><h1>🔗 Broken Link Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input
            type="text"
            placeholder="https://example.com/blog/post"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Crawling links…' : '🔍 Check Links'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Extract every <code>&lt;a href&gt;</code> on the page and probe each one in parallel. We report
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
            ? `❌ ${counts.broken + counts.errors} link${counts.broken + counts.errors === 1 ? '' : 's'} need attention`
            : `✅ All ${counts.http} HTTP link${counts.http === 1 ? '' : 's'} look healthy`}
        </strong>
        <span>· ✅ {counts.ok} ok · ⚠️ {counts.redirected} redirected · ❌ {counts.broken} broken · ❌ {counts.errors} errors</span>
      </div>

      <h3 className="result-section-title">📊 Links found</h3>
      <div className="wc-grid">
        <Stat label="📌 Total" value={counts.total} highlight />
        <Stat label="🌐 HTTP/HTTPS" value={counts.http} />
        <Stat label="🏠 Internal" value={counts.internal} />
        <Stat label="🌍 External" value={counts.external} />
        <Stat label="📧 Email / Tel / Anchor" value={counts.nonHttp} />
        <Stat label="🔒 External nofollow" value={counts.noFollowExternal} />
      </div>

      {counts.truncated && <div className="result-warning">⚠️ Showing first 100 unique HTTP links — page contains more. Use a desktop crawler for full audits.</div>}

      <h3 className="result-section-title">📋 Findings</h3>
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
        <h3 className="result-section-title" style={{ marginBottom: 0 }}>🔗 HTTP links ({filtered.length})</h3>
        <div className="og-tabs" style={{ marginBottom: 0 }}>
          {[['all', 'All'], ['broken', 'Broken'], ['redirect', 'Redirects'], ['internal', 'Internal'], ['external', 'External']].map(([k, label]) => (
            <button key={k} type="button" className={`og-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="ps-resource-list">
        {filtered.map((l, idx) => (
          <div key={idx} className="lc-row">
            <span className={`status-pill kind-${kindOf(l.status)}`}>{l.error ? '❌ ERR' : (l.status || '—')}</span>
            <span className="lc-internal-tag">{l.internal ? '🏠 internal' : '🌍 external'}</span>
            <div className="lc-link-body">
              <span className="lc-link-text">{l.text || <em>(no anchor text)</em>}</span>
              <a href={l.absoluteUrl} className="result-value-mono lc-link-url" target="_blank" rel="noopener noreferrer">{l.absoluteUrl}</a>
              <div className="lc-link-meta">
                {l.redirected && <span>→ {l.finalUrl}</span>}
                {l.rel && <span> · rel="{l.rel}"</span>}
                {l.target && <span> · target="{l.target}"</span>}
                {l.error && <span className="bulk-error" style={{ paddingLeft: 0 }}> · {l.error}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nonHttp.length > 0 && (
        <>
          <h3 className="result-section-title">📧 Non-HTTP links ({nonHttp.length})</h3>
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
      <h2>Link Crawlability &amp; Anchor Equity Architecture</h2>
      <p>
        Hyperlinks (<code>&lt;a href&gt;</code>) represent the primary topological connective tissue of the World Wide Web. Search engines traverse links to discover new URLs, compute PageRank graph authority, and understand topical relationships through anchor text semantics.
      </p>

      <h2>Link Qualification Attributes (<code>rel</code>)</h2>

      <p>
        Under Google Search Central guidelines and W3C HTML specifications, outbound hyperlinks should be qualified with standard <code>rel</code> attribute values:
      </p>
      <ul>
        <li><strong><code>rel="nofollow"</code>:</strong> Directs search crawlers not to associate your site's PageRank or endorsement with the target destination.</li>
        <li><strong><code>rel="sponsored"</code>:</strong> Required for paid advertisements, affiliate links, and commercial sponsorships to avoid link scheme penalties.</li>
        <li><strong><code>rel="ugc"</code>:</strong> Recommended for User Generated Content (comments, forum posts, profile links) to protect against comment spam abuse.</li>
      </ul>
      <pre className="code-pre">
        <code>{`<a href="https://example.com/affiliate" rel="sponsored nofollow" target="_blank">Partner Resource</a>`}</code>
      </pre>

      <h2>Internal vs. External Link Equity Distribution</h2>

      <h3>1. Internal Links</h3>
      <p>
        Internal links establish your site's architectural hierarchy and distribute authority from high-equity pages (such as your homepage) to deeper topic clusters. Broken internal links (returning 404 or 500 status codes) result in dead ends for crawlers and dilute internal equity.
      </p>

      <h3>2. External Links &amp; Trust Signals</h3>
      <p>
        Linking out to reputable, authoritative industry sources and research studies provides positive contextual signals for topic verification. However, linking to dead external resources or spam-expired domains degrades site quality.
      </p>

      <h2>Remediating Broken Links</h2>

      <p>
        When broken links are identified:
      </p>
      <ul>
        <li><strong>Internal 404s:</strong> Update the anchor <code>href</code> directly to the revised URL path, or configure a <code>301 Moved Permanently</code> redirect using our <Link href="/tools/redirect-checker">Redirect Checker</Link>.</li>
        <li><strong>External 404s:</strong> Locate the updated documentation or remove the hyperlink while preserving the attribution text.</li>
        <li><strong>Redirect Chains on Links:</strong> Point internal anchors directly to the final canonical URL to bypass intermediate redirect latency.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why does the checker probe links with HEAD requests?</h3>
      <p>
        <code>HEAD</code> requests retrieve only the HTTP status code and response headers without downloading the full page payload. This allows probing dozens of links concurrently in milliseconds with minimal server overhead.
      </p>

      <h3>Do broken external links hurt my search rankings?</h3>
      <p>
        While an occasional broken external link is normal as websites move content, pages containing numerous dead links signal to search engines that content is unmaintained and obsolete.
      </p>

      <h3>Should I add nofollow to all external links?</h3>
      <p>
        No. Google encourages natural editorial citations without <code>nofollow</code>. Reserve <code>nofollow</code>, <code>sponsored</code>, or <code>ugc</code> for unvetted user links, sponsored placements, and paid endorsements.
      </p>
    </article>
  );
}