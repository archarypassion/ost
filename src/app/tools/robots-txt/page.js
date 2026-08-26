"use client";
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function RobotsTxtChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/robots-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
      } else {
        setData(json);
      }
    } catch {
      setError('Network error — could not reach the checker service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header"><h1>🤖 Robots.txt Checker</h1></div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter website URL or domain (e.g. example.com)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Fetching...' : '🔍 Check Robots.txt'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Fetches <code>/robots.txt</code> from any domain and parses every User-agent group, Allow/Disallow rule,
          Crawl-delay, and Sitemap declaration.
        </p>

        {error && <div className="result-error">{error}</div>}

        {data && <ResultBlock data={data} showRaw={showRaw} setShowRaw={setShowRaw} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data, showRaw, setShowRaw }) {
  let bannerClass, BannerIcon, headline;
  if (!data.found) {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = data.message || `⚠️ No robots.txt found (HTTP ${data.httpStatus}).`;
  } else if (data.summary?.entirelyBlockedForAll) {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = '🚫 Site-wide block detected: Disallow: / for User-agent: *';
  } else {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = `✅ robots.txt found — ${data.groups.length} group${data.groups.length === 1 ? '' : 's'}, ${data.sitemaps.length} sitemap${data.sitemaps.length === 1 ? '' : 's'}.`;
  }

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>{headline}</span>
      </div>

      <div>
        <div className="result-section-title">📊 Overview</div>
        <div className="result-grid" style={{ width: '100%' }}>
          <ResultRow label="📍 Robots.txt URL" mono>
            <a href={data.robotsUrl} target="_blank" rel="noreferrer" className="sitemap-link">
              {data.robotsUrl}
            </a>
          </ResultRow>
          {data.finalUrl && data.finalUrl !== data.robotsUrl && (
            <ResultRow label="📍 Final URL" mono>{data.finalUrl}</ResultRow>
          )}
          <ResultRow label="📊 HTTP Status">
            <strong>{data.httpStatus}</strong>
          </ResultRow>
          {data.contentType && (
            <ResultRow label="📄 Content-Type">{data.contentType}</ResultRow>
          )}
          {data.found && (
            <ResultRow label="📦 Size">{formatBytes(data.bytes)}</ResultRow>
          )}
          {data.found && (
            <ResultRow label="🤖 Distinct User-agents">
              {data.summary.userAgents.length > 0 ? (
                <div className="directive-list">
                  {data.summary.userAgents.map((ua) => (
                    <span key={ua} className="ua-chip">{ua}</span>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None declared</span>
              )}
            </ResultRow>
          )}
        </div>
      </div>

      {data.found && data.groups.length > 0 && (
        <div>
          <div className="result-section-title">🤖 User-agent Groups</div>
          {data.groups.map((g, i) => (
            <UserAgentGroup key={i} group={g} />
          ))}
        </div>
      )}

      {data.found && (
        <div>
          <div className="result-section-title">🗺️ Sitemaps</div>
          {data.sitemaps.length > 0 ? (
            <div className="sitemap-list">
              {data.sitemaps.map((s) => (
                <a key={s} href={s} target="_blank" rel="noreferrer" className="sitemap-link">{s}</a>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
              No <code>Sitemap:</code> directive declared in robots.txt.
            </p>
          )}
        </div>
      )}

      {data.parseErrors && data.parseErrors.length > 0 && (
        <div className="parse-errors">
          <strong>📋 Parsing notes ({data.parseErrors.length})</strong>
          <ul>
            {data.parseErrors.slice(0, 10).map((e, i) => (
              <li key={i}>Line {e.line}: {e.message}</li>
            ))}
            {data.parseErrors.length > 10 && <li>…and {data.parseErrors.length - 10} more</li>}
          </ul>
        </div>
      )}

      {data.redirectChain && data.redirectChain.length > 1 && (
        <div>
          <div className="result-section-title">🔄 Redirect Chain</div>
          <div className="redirect-chain">
            {data.redirectChain.map((hop, i) => (
              <div key={`${hop.url}-${i}`} className="redirect-hop">
                <span className="redirect-hop-status">{hop.status}</span>
                <span>{hop.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.found && data.raw && (
        <div>
          <div className="result-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📄 Raw File</span>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.25rem 0.625rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              {showRaw ? 'Hide' : 'Show'}
            </button>
          </div>
          {showRaw && <pre className="raw-pre">{data.raw}</pre>}
        </div>
      )}
    </div>
  );
}

function UserAgentGroup({ group }) {
  return (
    <div className="ua-group">
      <div className="ua-group-header">
        <strong>User-agent:</strong>
        {group.agents.map((a) => (
          <span key={a} className="ua-chip">{a}</span>
        ))}
      </div>
      <div className="ua-rules">
        {group.rules.length === 0 && (
          <div className="ua-rule">
            <span className="ua-rule-path empty">No Allow/Disallow rules.</span>
          </div>
        )}
        {group.rules.map((r, i) => (
          <div key={i} className="ua-rule">
            <span className={`ua-rule-tag ${r.type}`}>{r.type}</span>
            <span className={`ua-rule-path ${r.value ? '' : 'empty'}`}>
              {r.value || '(empty — allow all)'}
            </span>
          </div>
        ))}
      </div>
      {(group.crawlDelay !== null && group.crawlDelay !== undefined) && (
        <div className="ua-meta">⏱️ Crawl-delay: {group.crawlDelay}{typeof group.crawlDelay === 'number' ? 's' : ''}</div>
      )}
    </div>
  );
}

function ResultRow({ label, children, mono = false }) {
  return (
    <div className="result-item">
      <span className="result-label">{label}</span>
      <span className={`result-value ${mono ? 'result-value-mono' : ''}`}>
        {children}
      </span>
    </div>
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Robots.txt Architecture & the Robots Exclusion Protocol (RFC 9309)</h2>
      <p>
        The <code>robots.txt</code> file is a plaintext file placed at the root of a domain that instructs automated web crawlers which URL paths they are permitted or forbidden to request. Formalized under <a href="https://www.rfc-editor.org/rfc/rfc9309.html" target="_blank" rel="noopener noreferrer">IETF RFC 9309</a>, it serves as the foundational gatekeeper for crawl budget management and server resource preservation.
      </p>

      <h2>Core Syntax & Directive Rules</h2>

      <h3>1. User-Agent Grouping</h3>
      <p>
        Directives apply to specific crawler identifiers. A group begins with one or more <code>User-agent</code> lines followed by <code>Allow</code> or <code>Disallow</code> directives:
      </p>
      <pre className="code-pre">
        <code>{`# Allow Googlebot full access
User-agent: Googlebot
Disallow: /checkout/
Disallow: /api/

# Block aggressive AI scrapers
User-agent: GPTBot
User-agent: CCBot
User-agent: ClaudeBot
Disallow: /

# General fallback for all other crawlers
User-agent: *
Disallow: /private/
Allow: /`}</code>
      </pre>

      <h3>2. Rule Specificity and Matching Logic</h3>
      <p>
        When multiple rules in the same group match a requested URL, search engines follow the <strong>longest matching path</strong> rule, not line order.
      </p>
      <ul>
        <li><code>Disallow: /catalog/</code> (9 chars)</li>
        <li><code>Allow: /catalog/public/</code> (16 chars)</li>
      </ul>
      <p>
        A request for <code>/catalog/public/item.html</code> will be <strong>allowed</strong> because the <code>Allow</code> pattern is longer and more specific than the <code>Disallow</code> pattern.
      </p>

      <h3>3. Wildcards (<code>*</code> and <code>$</code>)</h3>
      <ul>
        <li><code>*</code> matches zero or more characters (e.g., <code>Disallow: /*.pdf$</code> blocks all URLs ending in .pdf).</li>
        <li><code>$</code> designates the end of the URL pattern (e.g., <code>Disallow: /*?*</code> blocks any URL containing query parameters).</li>
      </ul>

      <h2>The Sitemap Directive</h2>
      <p>
        You can declare one or more XML sitemaps anywhere in <code>robots.txt</code>. This helps search engines discover your sitemap index without manual submission:
      </p>
      <pre className="code-pre">
        <code>{`Sitemap: https://www.example.com/sitemap.xml
Sitemap: https://www.example.com/sitemap-news.xml`}</code>
      </pre>
      <p>
        Verify the format and availability of your sitemaps using our <Link href="/tools/sitemap-checker">XML Sitemap Checker</Link>.
      </p>

      <h2>Crucial Gotchas: What Robots.txt Does NOT Do</h2>

      <ul>
        <li>
          <strong>Robots.txt does not guarantee non-indexation:</strong> If external websites link to a disallowed path, Google may still index the URL without crawling the page content. To ensure complete removal from search results, use a <Link href="/tools/noindex-checker">noindex directive</Link> on an accessible page.
        </li>
        <li>
          <strong>Robots.txt is public:</strong> Never use <code>Disallow</code> to conceal sensitive endpoints or hidden admin folders, as the file itself is publicly readable by anyone.
        </li>
        <li>
          <strong>Crawl-delay is ignored by Googlebot:</strong> Google does not honor <code>Crawl-delay</code> in robots.txt. If your server experiences crawl overload from Google, adjust crawl rates inside Google Search Console settings.
        </li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What happens if a website has no robots.txt file?</h3>
      <p>
        If a server returns a 404 (Not Found) for <code>/robots.txt</code>, search engine crawlers interpret this as unrestricted crawl access and will crawl all discoverable links on the domain.
      </p>

      <h3>Can I block CSS and JavaScript files in robots.txt?</h3>
      <p>
        No. Googlebot needs access to CSS and JavaScript assets to render pages accurately for mobile indexing and visual layout verification. Blocking resources in <code>/static/</code> or <code>/assets/</code> can harm your search rankings.
      </p>

      <h3>How quickly does Google update its copy of robots.txt?</h3>
      <p>
        Google typically caches robots.txt files for up to 24 hours. If you update critical disallow rules, you can request an immediate re-fetch using the robots.txt Tester inside Google Search Console.
      </p>
    </article>
  );
}