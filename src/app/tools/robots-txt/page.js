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
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Robots.txt: The Complete Guide to Controlling How Search Engines Crawl Your Site</h2>
      <p>The robots.txt file is one of the oldest and most fundamental pieces of technical SEO infrastructure on the web. It's a plain text file sitting at the root of your domain — always accessible at <code>yourdomain.com/robots.txt</code> — and its entire purpose is to communicate with search engine crawlers about which parts of your website they're allowed to access. Despite its age and simplicity, it remains one of the most misunderstood files in web development. A misconfigured robots.txt can accidentally block your entire website from Google, and you might not notice for weeks.</p>
      
      <p>According to <a href="https://developers.google.com/search/docs/crawling-indexing/robots/intro" target="_blank" rel="noopener noreferrer">Google Search Central</a>, robots.txt is the first line of defense in controlling how search engines crawl your site. Our <strong>Robots.txt Checker</strong> helps you validate your robots.txt file and identify issues that could prevent proper crawling.</p>

      <h2>What This Tool Does</h2>
      <p>Fetches <code>/robots.txt</code> from any domain and parses every User-agent group, Allow/Disallow rule, Crawl-delay, and Sitemap declaration.</p>
      
      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong>. Combined with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Checker</a> and <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a>, you can ensure your site is properly configured for Google's crawlers.</p>

      <h2>How Robots.txt Works</h2>
      <p>When a crawler like Googlebot arrives at your domain, one of the very first things it does before crawling any other page is request your robots.txt file. It reads the directives in that file and uses them to determine which URLs it's allowed to fetch. If no robots.txt exists, crawlers assume they have permission to crawl everything.</p>
      <p>The file is organized around "User-agent" declarations, which specify which crawler a particular set of rules applies to. The wildcard <code>User-agent: *</code> applies to all crawlers. You can also write rules specific to individual bots — <code>User-agent: Googlebot</code> for Google, <code>User-agent: Bingbot</code> for Bing, and so on.</p>

      <h2>Disallow vs. Allow Directives</h2>
      <p>The two most commonly used directives are <code>Disallow</code> and <code>Allow</code>. Disallow tells a crawler it cannot access a specific path — for example, <code>Disallow: /admin/</code> blocks all URLs starting with /admin/. Allow overrides a broader Disallow rule for a more specific path. For example, you could disallow an entire directory but allow a specific file within it.</p>
      <p>A critical point that many developers misunderstand: <code>Disallow</code> prevents crawling — it does not prevent indexing. If a page has backlinks pointing to it from other websites, Google may still index it even if you've disallowed it in robots.txt, because it discovers the URL from those external links. To actually prevent a URL from appearing in search results, you need a noindex tag. Robots.txt controls the crawler's door; noindex controls the index itself.</p>

      <h2>The Sitemap Directive</h2>
      <p>Many robots.txt files include a <code>Sitemap:</code> directive pointing to the location of the XML sitemap. This is a helpful signal for crawlers, letting them discover your sitemap without having to search for it. You can include multiple Sitemap directives if you have a sitemap index or separate sitemaps for different sections of your site.</p>
      
      <p>Use our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Checker</a> to validate your sitemap after ensuring it's properly referenced in robots.txt.</p>

      <h2>Crawl-Delay: Use With Caution</h2>
      <p>The <code>Crawl-delay</code> directive tells crawlers to wait a specified number of seconds between requests. This can be useful for protecting a low-resource server from being overwhelmed by aggressive crawling. However, Google has publicly stated that it does not honor the Crawl-delay directive in robots.txt — you need to use Google Search Console to set a crawl rate limit for Googlebot specifically. Other crawlers like Bingbot do respect Crawl-delay.</p>

      <h2>Common Robots.txt Mistakes</h2>
      
      <h3>1. Site-Wide Block</h3>
      <p><strong>The Problem:</strong> <code>Disallow: /</code> blocks all crawling for a user-agent.</p>
      <p><strong>The Fix:</strong> Remove the Disallow rule or make it more specific. Use our <strong>Robots.txt Checker</strong> to detect site-wide blocks.</p>
      
      <h3>2. Trying to Hide Sensitive Content</h3>
      <p><strong>The Problem:</strong> Using robots.txt to hide private content — robots.txt is public and can reveal the existence of paths you'd rather keep private.</p>
      <p><strong>The Fix:</strong> Use authentication and proper server access controls for genuinely private content.</p>
      
      <h3>3. Disallow without Noindex</h3>
      <p><strong>The Problem:</strong> Disallowing crawling but not adding noindex tags — pages may still appear in search results from external links.</p>
      <p><strong>The Fix:</strong> For pages you don't want indexed, add <code>&lt;meta name="robots" content="noindex"&gt;</code> in addition to Disallow rules.</p>
      
      <h3>4. Missing Sitemap Declaration</h3>
      <p><strong>The Problem:</strong> No Sitemap directive in robots.txt, making it harder for crawlers to discover your sitemap.</p>
      <p><strong>The Fix:</strong> Add <code>Sitemap: https://yourdomain.com/sitemap.xml</code> to your robots.txt file.</p>

      <h2>Best Practices for Robots.txt</h2>
      
      <h3>1. Start with a Clean File</h3>
      <p>Begin with no rules (or just a sitemap declaration) and add specific Disallow rules as needed. Avoid blanket blocking unless absolutely necessary.</p>
      
      <h3>2. Test Your Rules</h3>
      <p>Use our <strong>Robots.txt Checker</strong> to validate your rules after any change. Test with Google Search Console's robots.txt tester for Google-specific validation.</p>
      
      <h3>3. Use Specific User-Agents</h3>
      <p>Use specific user-agent rules when possible. For example, block certain crawlers while allowing Googlebot.</p>
      
      <h3>4. Include Sitemap References</h3>
      <p>Always include a <code>Sitemap:</code> directive pointing to your XML sitemap location.</p>
      
      <h3>5. Keep It Simple</h3>
      <p>Complex robots.txt files are harder to maintain and more likely to contain errors. Keep rules simple and well-documented.</p>

      <h2>How to Use This Tool Effectively</h2>
      
      <h3>Single Domain Check</h3>
      <p>Enter any domain to fetch and parse its robots.txt file. The tool shows all user-agent groups, rules, and sitemap declarations.</p>
      
      <h3>Competitor Analysis</h3>
      <p>Analyze competitor robots.txt files to understand what they're hiding from or exposing to search engine crawlers.</p>
      
      <h3>Post-Update Verification</h3>
      <p>After updating your robots.txt, use our tool to verify it's properly configured. Combine with our <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> to ensure pages are being indexed.</p>

      <h2>Monitoring Robots.txt Over Time</h2>
      <p>Regular monitoring with our <strong>Robots.txt Checker</strong> helps you:</p>
      <ul>
        <li>Detect accidental site-wide blocks introduced during updates</li>
        <li>Verify sitemap references remain correct</li>
        <li>Identify changes in crawl behavior</li>
        <li>Maintain <strong>mobile-friendly websites</strong> with proper crawl settings</li>
        <li>Protect your crawl efficiency</li>
      </ul>
      
      <p>Combine with our <a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Checker</a> and <a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> for comprehensive crawl management.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is a Robots.txt Checker?</h3>
      <p>A <strong>Robots.txt Checker</strong> is a tool that fetches and parses a website's robots.txt file, displaying user-agent groups, Allow/Disallow rules, Crawl-delay directives, and Sitemap declarations in an easy-to-read format.</p>

      <h3>Why is robots.txt important for SEO?</h3>
      <p>robots.txt controls which parts of your site search engines can crawl. Proper configuration ensures Googlebot can access important content while blocking irrelevant or sensitive pages.</p>

      <h3>What is the difference between Disallow and noindex?</h3>
      <p><strong>Disallow</strong> prevents crawling (Googlebot can't access the page). <strong>Noindex</strong> prevents indexing (the page won't appear in search results). For complete removal, use both.</p>

      <h3>Does Google honor all robots.txt rules?</h3>
      <p>Google honors Disallow and Allow rules but does not honor Crawl-delay. For crawl rate control, use Google Search Console.</p>

      <h3>What happens if robots.txt blocks Googlebot?</h3>
      <p>Googlebot won't crawl blocked pages. However, if external links point to those pages, Google may still index them without crawling (using the link text and URL as signals).</p>

      <h2>Conclusion</h2>
      <p>The robots.txt file is a critical component of technical SEO infrastructure. Our <strong>Robots.txt Checker</strong> provides the detailed analysis you need to validate your configuration and avoid common mistakes.</p>
      
      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper robots.txt configuration is essential for efficient crawling and indexing. Use our <strong>Robots.txt Checker</strong> as part of your routine maintenance to catch issues early and maintain strong search presence.</p>
      
      <p>Start checking your robots.txt today—use our <strong>Robots.txt Checker</strong> to audit your site, identify issues, and ensure your crawler directives are properly configured.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Robots.txt Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/sitemap-checker" target="_blank" rel="noopener noreferrer">Sitemap Checker</a> - Validate sitemap references</li>
        <li><a href="https://opensourcetools.online/tools/google-index" target="_blank" rel="noopener noreferrer">Google Index Checker</a> - Check indexing status</li>
        <li><a href="https://opensourcetools.online/tools/http-status" target="_blank" rel="noopener noreferrer">HTTP Status Checker</a> - Verify server responses</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Analyze redirect chains</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Optimize your content</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
      </ul>
      
      <p>For further reading on robots.txt and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/robots/intro" target="_blank" rel="noopener noreferrer">Google Search Central: robots.txt</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/robots/robots-txt" target="_blank" rel="noopener noreferrer">Google Search Central: robots.txt Rules</a></li>
        <li><a href="https://developers.google.com/search/docs/crawling-indexing/robots/meta-tags" target="_blank" rel="noopener noreferrer">Google Search Central: Meta Robots Tags</a></li>
        <li><a href="https://moz.com/learn/seo/robots-txt" target="_blank" rel="noopener noreferrer">Moz Robots.txt Guide</a></li>
        <li><a href="https://www.semrush.com/blog/robots-txt/" target="_blank" rel="noopener noreferrer">Semrush Robots.txt Guide</a></li>
      </ul>
    </article>
  );
}