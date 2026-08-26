"use client";
import { useState } from 'react';
import Link from 'next/link';

const SEVERITY_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEVERITY_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

export default function OpenGraphCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [useFbUa, setUseFbUa] = useState(false);
  const [activeTab, setActiveTab] = useState('facebook');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch('/api/tools/open-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), useFacebookCrawler: useFbUa }),
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
        <h1>📱 Open Graph Checker</h1>
      </div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="https://example.com or example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Fetching…' : '🔍 Check OG Tags'}
          </button>
        </form>
        <label className="og-toggle" style={{ width: '100%' }}>
          <input type="checkbox" checked={useFbUa} onChange={(e) => setUseFbUa(e.target.checked)} />
          <span>🤖 Fetch as <code>facebookexternalhit</code> (some sites only return OG tags to social crawlers)</span>
        </label>
        <p className="tool-description">
          🔍 See exactly how your link will look on Facebook, LinkedIn, X (Twitter), WhatsApp, and Discord. We
          fetch your <code>og:image</code> to verify it's reachable, measure its actual dimensions, and validate
          every tag against the Open Graph and Twitter Card specs.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && (
          <ResultBlock data={data} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data, activeTab, setActiveTab }) {
  const { previews, checks, summary, og, twitter, ogStructured, imageProbe, fallback, finalUrl, redirectChain } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const bannerText = summary.fail
    ? `❌ ${summary.fail} blocking issue${summary.fail === 1 ? '' : 's'}`
    : summary.warn
      ? `⚠️ ${summary.warn} warning${summary.warn === 1 ? '' : 's'}`
      : '✅ Open Graph and Twitter tags look great';

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· ✅ {summary.pass} passed · ⚠️ {summary.warn} warnings · ❌ {summary.fail} issues · ℹ️ {summary.info} info</span>
      </div>

      <h3 className="result-section-title">📱 Social previews</h3>
      <div className="og-tabs" style={{ width: '100%' }}>
        {['facebook', 'twitter', 'linkedin', 'whatsapp', 'discord'].map((tab) => (
          <button
            key={tab}
            className={`og-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === 'facebook' && '📘'}
            {tab === 'twitter' && '🐦'}
            {tab === 'linkedin' && '🔗'}
            {tab === 'whatsapp' && '💬'}
            {tab === 'discord' && '🎮'}
            {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="og-preview-stage" style={{ width: '100%' }}>
        {activeTab === 'facebook' && <FacebookPreview p={previews.facebook} />}
        {activeTab === 'twitter' && <TwitterPreview p={previews.twitter} />}
        {activeTab === 'linkedin' && <LinkedInPreview p={previews.linkedin} />}
        {activeTab === 'whatsapp' && <WhatsAppPreview p={previews.whatsapp} />}
        {activeTab === 'discord' && <DiscordPreview p={previews.discord} />}
      </div>

      <h3 className="result-section-title">🖼️ Image probe</h3>
      <ImageProbeBlock probe={imageProbe} />

      <h3 className="result-section-title">✅ Validation ({checks.length})</h3>
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

      <div className="og-tag-grid" style={{ width: '100%' }}>
        <TagBlock title={`📝 Open Graph tags (${Object.keys(og).length})`} entries={Object.entries(og)} prefix="og" />
        <TagBlock title={`🐦 Twitter Card tags (${Object.keys(twitter).length})`} entries={Object.entries(twitter)} prefix="twitter" />
      </div>

      {ogStructured['og:image']?.length > 0 && (
        <>
          <h3 className="result-section-title">🖼️ Image entries ({ogStructured['og:image'].length})</h3>
          <div className="og-image-list">
            {ogStructured['og:image'].map((img, idx) => (
              <div key={idx} className="og-image-entry">
                <div className="og-image-key">og:image #{idx + 1}</div>
                <div className="result-value-mono">{img.absoluteUrl || img.url || '(no url)'}</div>
                <div className="og-image-meta">
                  {img.type && <span>type: <code>{img.type}</code></span>}
                  {img.width && <span>declared: <code>{img.width}×{img.height || '?'}</code></span>}
                  {img.alt && <span>alt: “{img.alt}”</span>}
                  {img.secure_url && img.secure_url !== img.url && <span>secure_url: yes</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="result-section-title">📄 Page details</h3>
      <div className="result-grid" style={{ width: '100%' }}>
        <div className="result-item"><span className="result-label">📍 Final URL</span><span className="result-value-mono">{finalUrl}</span></div>
        <div className="result-item"><span className="result-label">🔗 Canonical</span><span className="result-value-mono">{fallback.canonical || '—'}</span></div>
        <div className="result-item"><span className="result-label">📌 HTML title fallback</span><span className="result-value">{fallback.title || '—'}</span></div>
        <div className="result-item"><span className="result-label">📝 Meta description fallback</span><span className="result-value">{fallback.description || '—'}</span></div>
      </div>

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">🔄 Redirect chain</h3>
          <ol className="redirect-chain">
            {redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className="redirect-status">HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function ImageProbeBlock({ probe }) {
  if (!probe) return <div className="og-probe-empty">No og:image or twitter:image declared on this page.</div>;
  if (probe.error) {
    return (
      <div className="og-probe-error">
        <strong>❌ Image fetch failed</strong>
        <div className="result-value-mono" style={{ marginTop: 6 }}>{probe.url}</div>
        <div style={{ marginTop: 6 }}>{probe.error}</div>
      </div>
    );
  }
  return (
    <div className="og-probe-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={probe.url} alt="og:image" className="og-probe-thumb" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <div className="og-probe-info">
        <div className="result-value-mono og-probe-url">{probe.url}</div>
        <div className="og-probe-stats">
          <span>{probe.width && probe.height ? `${probe.width}×${probe.height}` : 'dimensions unknown'}</span>
          <span>·</span>
          <span>{probe.format || probe.contentType || 'unknown format'}</span>
          <span>·</span>
          <span>{probe.contentLength ? formatBytes(probe.contentLength) : '?'}</span>
          <span>·</span>
          <span>HTTP {probe.status}</span>
          {probe.truncated && <span className="og-probe-warn">· truncated at probe limit</span>}
        </div>
      </div>
    </div>
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function TagBlock({ title, entries, prefix }) {
  if (!entries || entries.length === 0) {
    return (
      <div>
        <h4 className="og-block-title">{title}</h4>
        <div className="og-block-empty">No {prefix} tags found.</div>
      </div>
    );
  }
  return (
    <div>
      <h4 className="og-block-title">{title}</h4>
      <div className="og-tag-list">
        {entries.map(([key, value]) => (
          <div key={key} className="og-tag-row">
            <code className="og-tag-key">{key}</code>
            <span className="og-tag-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FacebookPreview({ p }) {
  return (
    <div className="fb-card">
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="fb-image" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      )}
      <div className="fb-body">
        <div className="fb-host">{(p.host || '').toUpperCase()}</div>
        <div className="fb-title">{p.title}</div>
        {p.description && <div className="fb-desc">{p.description}</div>}
      </div>
    </div>
  );
}

function TwitterPreview({ p }) {
  const isLarge = p.card === 'summary_large_image';
  return (
    <div className={`tw-card ${isLarge ? 'tw-large' : 'tw-small'}`}>
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="tw-image" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      )}
      <div className="tw-body">
        <div className="tw-title">{p.title}</div>
        {p.description && <div className="tw-desc">{p.description}</div>}
        <div className="tw-host">🔗 {p.host}</div>
      </div>
    </div>
  );
}

function LinkedInPreview({ p }) {
  return (
    <div className="li-card">
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="li-image" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      )}
      <div className="li-body">
        <div className="li-title">{p.title}</div>
        <div className="li-host">{p.host}{p.description ? ` · ${truncate(p.description, 80)}` : ''}</div>
      </div>
    </div>
  );
}

function WhatsAppPreview({ p }) {
  return (
    <div className="wa-card">
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="wa-image" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      )}
      <div className="wa-body">
        <div className="wa-title">{p.title}</div>
        {p.description && <div className="wa-desc">{truncate(p.description, 110)}</div>}
        <div className="wa-host">{p.host}</div>
      </div>
    </div>
  );
}

function DiscordPreview({ p }) {
  const sideColor = p.color || '#5865f2';
  return (
    <div className="dc-card" style={{ borderLeftColor: sideColor }}>
      {p.siteName && <div className="dc-sitename">{p.siteName}</div>}
      <div className="dc-title">{p.title}</div>
      {p.description && <div className="dc-desc">{p.description}</div>}
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="dc-image" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      )}
    </div>
  );
}

function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function Article() {
  return (
    <article className="tool-article">
      <h2>The Open Graph Protocol & Social Card Optimization</h2>
      <p>
        The <a href="https://ogp.me/" target="_blank" rel="noopener noreferrer">Open Graph protocol</a> (created by Facebook) enables any webpage to become a rich object in a social graph. When a URL is shared across Facebook, LinkedIn, X (Twitter), WhatsApp, Discord, or Slack, crawlers parse these tags to render rich preview cards with media, titles, and summaries.
      </p>

      <h2>The Four Core Open Graph Tags</h2>

      <pre className="code-pre">
        <code>{`<meta property="og:title" content="The Definitive Guide to Web Security" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://www.example.com/images/hero-1200x630.jpg" />
<meta property="og:url" content="https://www.example.com/security-guide" />
<meta property="og:description" content="Learn how to harden TLS, configure CSP headers, and prevent XSS attacks." />
<meta property="og:site_name" content="Developer Tools Online" />`}</code>
      </pre>

      <h2>Image Dimension Standards & Aspect Ratios</h2>

      <p>
        The preview image is the single most important factor for social click-through rates.
      </p>

      <ul>
        <li><strong>Standard Recommended Resolution:</strong> <code>1200 × 630 pixels</code> (Aspect ratio <strong>1.91:1</strong>).</li>
        <li><strong>Minimum Resolution:</strong> <code>600 × 315 pixels</code>. Images smaller than this render as small square thumbnails beside the text rather than full-width header cards.</li>
        <li><strong>Maximum File Size:</strong> Keep image payloads under <strong>8 MB</strong> (5 MB recommended for fast scraper fetching). Supported formats: JPEG, PNG, WebP, GIF.</li>
        <li><strong>HTTPS Requirement:</strong> Always provide secure absolute URLs (<code>https://...</code>). Some platforms reject HTTP image paths when shared in secure chat applications.</li>
      </ul>

      <h2>Twitter (X) Cards & Protocol Fallback</h2>

      <p>
        X parses Twitter-specific tags before falling back to Open Graph values:
      </p>
      <pre className="code-pre">
        <code>{`<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@yourbrand" />
<meta name="twitter:creator" content="@authorhandle" />
<meta name="twitter:title" content="Page Headline" />
<meta name="twitter:description" content="Brief summary for feed cards." />
<meta name="twitter:image" content="https://www.example.com/images/twitter-hero.jpg" />`}</code>
      </pre>
      <p>
        Using <code>summary_large_image</code> yields significantly higher engagement than the default <code>summary</code> (which renders a tiny 1:1 square).
      </p>

      <h2>Crawler User-Agents & Cache Invalidation</h2>

      <p>
        Social networks use dedicated user-agents to scrape metadata when a link is pasted into a composer:
      </p>
      <ul>
        <li><strong>Facebook / Messenger:</strong> <code>facebookexternalhit/1.1</code></li>
        <li><strong>Twitter (X):</strong> <code>Twitterbot/1.0</code></li>
        <li><strong>LinkedIn:</strong> <code>LinkedInBot/1.0</code></li>
        <li><strong>WhatsApp:</strong> <code>WhatsApp/2.x</code></li>
      </ul>

      <p>
        <strong>Clearing Stale Social Caches:</strong> Once a URL is shared, social platforms cache the preview image and copy for days or weeks. If you update your <code>og:image</code>, use the official platform debuggers (such as the Facebook Sharing Debugger or LinkedIn Post Inspector) to trigger a scrape refresh.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>Can I use relative paths for og:image?</h3>
      <p>
        No. Social scrapers do not reliably resolve relative URLs like <code>/images/cover.jpg</code>. Always declare the full absolute URL with scheme (<code>https://example.com/images/cover.jpg</code>).
      </p>

      <h3>Why is my image not showing on WhatsApp or Discord?</h3>
      <p>
        Common causes include: image file size exceeding 2 MB, the server returning a 403/404 to scraper user-agents, or the image missing explicit dimensions tags (<code>og:image:width</code> and <code>og:image:height</code>).
      </p>

      <h3>How does Open Graph interact with SEO?</h3>
      <p>
        While Open Graph tags are not direct Google ranking signals, they heavily influence referral traffic, social reach, and natural backlinks. Always ensure your Open Graph tags match your <Link href="/tools/meta-tags">HTML Title &amp; Meta Description</Link> to maintain brand consistency.
      </p>
    </article>
  );
}