"use client";
import { useState } from 'react';
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
      <div className="tool-header"><h1>Robots.txt Checker</h1></div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter website URL or domain (e.g. example.com)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Fetching...' : 'Check Robots.txt'}
          </button>
        </form>
        <p className="tool-description">
          Fetches <code>/robots.txt</code> from any domain and parses every User-agent group, Allow/Disallow rule,
          Crawl-delay, and Sitemap declaration.
        </p>

        {error && <div className="result-error">{error}</div>}

        {data && <ResultBlock data={data} showRaw={showRaw} setShowRaw={setShowRaw} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Robots.txt: The Complete Guide to Controlling How Search Engines Crawl Your Site</h2>
          <p>The robots.txt file is one of the oldest and most fundamental pieces of technical SEO infrastructure on the web. It's a plain text file sitting at the root of your domain — always accessible at <code>yourdomain.com/robots.txt</code> — and its entire purpose is to communicate with search engine crawlers about which parts of your website they're allowed to access. Despite its age and simplicity, it remains one of the most misunderstood files in web development. A misconfigured robots.txt can accidentally block your entire website from Google, and you might not notice for weeks.</p>
          <p>Understanding how robots.txt works, what it can and cannot do, and how to audit it properly is essential knowledge for anyone serious about technical SEO.</p>
          <h3>How robots.txt Works</h3>
          <p>When a crawler like Googlebot arrives at your domain, one of the very first things it does before crawling any other page is request your robots.txt file. It reads the directives in that file and uses them to determine which URLs it's allowed to fetch. If no robots.txt exists, crawlers assume they have permission to crawl everything.</p>
          <p>The file is organized around "User-agent" declarations, which specify which crawler a particular set of rules applies to. The wildcard <code>User-agent: *</code> applies to all crawlers. You can also write rules specific to individual bots — <code>User-agent: Googlebot</code> for Google, <code>User-agent: Bingbot</code> for Bing, and so on.</p>
          <h3>Disallow vs. Allow Directives</h3>
          <p>The two most commonly used directives are <code>Disallow</code> and <code>Allow</code>. Disallow tells a crawler it cannot access a specific path — for example, <code>Disallow: /admin/</code> blocks all URLs starting with /admin/. Allow overrides a broader Disallow rule for a more specific path. For example, you could disallow an entire directory but allow a specific file within it.</p>
          <p>A critical point that many developers misunderstand: <code>Disallow</code> prevents crawling — it does not prevent indexing. If a page has backlinks pointing to it from other websites, Google may still index it even if you've disallowed it in robots.txt, because it discovers the URL from those external links. To actually prevent a URL from appearing in search results, you need a noindex tag. Robots.txt controls the crawler's door; noindex controls the index itself.</p>
          <h3>The Sitemap Directive</h3>
          <p>Many robots.txt files include a <code>Sitemap:</code> directive pointing to the location of the XML sitemap. This is a helpful signal for crawlers, letting them discover your sitemap without having to search for it. You can include multiple Sitemap directives if you have a sitemap index or separate sitemaps for different sections of your site.</p>
          <h3>Crawl-Delay: Use With Caution</h3>
          <p>The <code>Crawl-delay</code> directive tells crawlers to wait a specified number of seconds between requests. This can be useful for protecting a low-resource server from being overwhelmed by aggressive crawling. However, Google has publicly stated that it does not honor the Crawl-delay directive in robots.txt — you need to use Google Search Console to set a crawl rate limit for Googlebot specifically. Other crawlers like Bingbot do respect Crawl-delay.</p>
          <h3>Common Robots.txt Mistakes</h3>
          <p>The most catastrophic mistake is accidentally disallowing everything with <code>Disallow: /</code>. This happens more often than you'd think — usually during development when a staging environment is correctly blocked but the rule accidentally makes it into the production robots.txt during a site launch. The result is that Googlebot stops crawling your entire site, and your rankings can collapse within days as Google re-evaluates pages it can no longer access.</p>
          <p>Another frequent mistake is trying to use robots.txt to hide sensitive content. If something should genuinely be private, robots.txt is not the right tool — authentication and proper server access controls are. Robots.txt is a public file that anyone can read, so it can actually reveal the existence of paths you'd rather keep private.</p>
          <h3>Using This Tool</h3>
          <p>Our Robots.txt Checker fetches and parses the robots.txt file from any domain and presents the key directives in an easy-to-read format. Check your own site regularly — especially after deployments — and audit competitor robots.txt files to understand what they're hiding from or exposing to search engine crawlers.</p>
        </article>
      </div>
    </div>
  );
}

function ResultBlock({ data, showRaw, setShowRaw }) {
  let bannerClass, BannerIcon, headline;
  if (!data.found) {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = data.message || `No robots.txt found (HTTP ${data.httpStatus}).`;
  } else if (data.summary?.entirelyBlockedForAll) {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = 'Site-wide block detected: Disallow: / for User-agent: *';
  } else {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = `robots.txt found — ${data.groups.length} group${data.groups.length === 1 ? '' : 's'}, ${data.sitemaps.length} sitemap${data.sitemaps.length === 1 ? '' : 's'}.`;
  }

  return (
    <div className="result-box">
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>{headline}</span>
      </div>

      <div>
        <div className="result-section-title">Overview</div>
        <div className="result-grid">
          <ResultRow label="Robots.txt URL" mono>
            <a href={data.robotsUrl} target="_blank" rel="noreferrer" className="sitemap-link">
              {data.robotsUrl}
            </a>
          </ResultRow>
          {data.finalUrl && data.finalUrl !== data.robotsUrl && (
            <ResultRow label="Final URL" mono>{data.finalUrl}</ResultRow>
          )}
          <ResultRow label="HTTP Status">
            <strong>{data.httpStatus}</strong>
          </ResultRow>
          {data.contentType && (
            <ResultRow label="Content-Type">{data.contentType}</ResultRow>
          )}
          {data.found && (
            <ResultRow label="Size">{formatBytes(data.bytes)}</ResultRow>
          )}
          {data.found && (
            <ResultRow label="Distinct User-agents">
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
          <div className="result-section-title">User-agent Groups</div>
          {data.groups.map((g, i) => (
            <UserAgentGroup key={i} group={g} />
          ))}
        </div>
      )}

      {data.found && (
        <div>
          <div className="result-section-title">Sitemaps</div>
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
          <strong>Parsing notes ({data.parseErrors.length})</strong>
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
          <div className="result-section-title">Redirect Chain</div>
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
            <span>Raw File</span>
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
        <div className="ua-meta">Crawl-delay: {group.crawlDelay}{typeof group.crawlDelay === 'number' ? 's' : ''}</div>
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
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
