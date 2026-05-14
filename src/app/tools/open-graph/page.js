"use client";
import { useState } from 'react';

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
        <h1>Open Graph Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            placeholder="https://example.com or example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Fetching…' : 'Check OG Tags'}
          </button>
        </form>
        <label className="og-toggle">
          <input type="checkbox" checked={useFbUa} onChange={(e) => setUseFbUa(e.target.checked)} />
          <span>Fetch as <code>facebookexternalhit</code> (some sites only return OG tags to social crawlers)</span>
        </label>
        <p className="tool-description">
          See exactly how your link will look on Facebook, LinkedIn, X (Twitter), WhatsApp, and Discord. We
          fetch your <code>og:image</code> to verify it’s reachable, measure its actual dimensions, and validate
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
    ? `${summary.fail} blocking issue${summary.fail === 1 ? '' : 's'}`
    : summary.warn
    ? `${summary.warn} warning${summary.warn === 1 ? '' : 's'}`
    : 'Open Graph and Twitter tags look great';

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {summary.pass} passed · {summary.warn} warnings · {summary.fail} issues · {summary.info} info</span>
      </div>

      <h3 className="result-section-title">Social previews</h3>
      <div className="og-tabs">
        {['facebook', 'twitter', 'linkedin', 'whatsapp', 'discord'].map((tab) => (
          <button
            key={tab}
            className={`og-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="og-preview-stage">
        {activeTab === 'facebook' && <FacebookPreview p={previews.facebook} />}
        {activeTab === 'twitter' && <TwitterPreview p={previews.twitter} />}
        {activeTab === 'linkedin' && <LinkedInPreview p={previews.linkedin} />}
        {activeTab === 'whatsapp' && <WhatsAppPreview p={previews.whatsapp} />}
        {activeTab === 'discord' && <DiscordPreview p={previews.discord} />}
      </div>

      <h3 className="result-section-title">Image probe</h3>
      <ImageProbeBlock probe={imageProbe} />

      <h3 className="result-section-title">Validation ({checks.length})</h3>
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

      <div className="og-tag-grid">
        <TagBlock title={`Open Graph tags (${Object.keys(og).length})`} entries={Object.entries(og)} prefix="og" />
        <TagBlock title={`Twitter Card tags (${Object.keys(twitter).length})`} entries={Object.entries(twitter)} prefix="twitter" />
      </div>

      {ogStructured['og:image']?.length > 0 && (
        <>
          <h3 className="result-section-title">Image entries ({ogStructured['og:image'].length})</h3>
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

      <h3 className="result-section-title">Page details</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">Final URL</span><span className="result-value-mono">{finalUrl}</span></div>
        <div className="result-item"><span className="result-label">Canonical</span><span className="result-value-mono">{fallback.canonical || '—'}</span></div>
        <div className="result-item"><span className="result-label">HTML title fallback</span><span className="result-value">{fallback.title || '—'}</span></div>
        <div className="result-item"><span className="result-label">Meta description fallback</span><span className="result-value">{fallback.description || '—'}</span></div>
      </div>

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">Redirect chain</h3>
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
        <strong>Image fetch failed</strong>
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
      <h2>Open Graph &amp; Twitter Cards: Control How Your Pages Look on Social</h2>
      <p>You wrote a great article, polished a landing page, or launched a new product. Then someone shares the link in a Slack channel or on LinkedIn — and it shows up as a bare URL with no image, or with the wrong image, or your favicon stretched into a blurry rectangle. That’s an Open Graph problem, and it’s entirely preventable.</p>
      <h3>The four required Open Graph tags</h3>
      <p>Every page needs four OG tags: <code>og:title</code>, <code>og:type</code>, <code>og:image</code>, and <code>og:url</code>. Without them, social platforms guess, and they usually guess badly. Pair these with <code>og:description</code> and <code>og:site_name</code> for a complete preview card.</p>
      <h3>Image dimensions matter more than you think</h3>
      <p>Facebook recommends 1200×630 pixels with a 1.91:1 aspect ratio. The minimum is 600×315; below that the platform falls back to a small thumbnail or refuses to display the image at all. Below 200×200 most platforms reject it outright. Use a high-quality JPEG or PNG and stay under 8 MB.</p>
      <h3>Twitter Cards layer on top</h3>
      <p><code>twitter:card</code> defines the layout: <code>summary</code> (small square thumbnail) or <code>summary_large_image</code> (banner-style, far more engaging in feeds). If you don’t set Twitter tags, X falls back to OG — but explicit is better. Add <code>twitter:site</code> with your @handle to attribute the share to your account.</p>
      <h3>Don’t lie to the crawler</h3>
      <p>Some sites serve different OG tags to social crawlers than to regular visitors — a tactic that can get pages flagged for cloaking. Use the “Fetch as <code>facebookexternalhit</code>” toggle above to compare. If your tags differ between user agents, that’s usually a JavaScript SSR problem worth fixing.</p>
      <h3>Test before you ship</h3>
      <p>Paste any URL above. We fetch the live HTML, parse every OG and Twitter tag, download the actual <code>og:image</code> to measure its real dimensions and file size, and render preview cards exactly as Facebook, LinkedIn, X, WhatsApp, and Discord would show them. Run it on every important page before launch — and on competitors to learn what they’re telling social platforms that you’re not.</p>
    </article>
  );
}
