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
      <h2>Open Graph &amp; Twitter Cards: Control How Your Pages Look on Social</h2>
      <p>You wrote a great article, polished a landing page, or launched a new product. Then someone shares the link in a Slack channel or on LinkedIn — and it shows up as a bare URL with no image, or with the wrong image, or your favicon stretched into a blurry rectangle. That's an Open Graph problem, and it's entirely preventable.</p>

      <p>According to <a href="https://developers.facebook.com/docs/sharing/webmasters/" target="_blank" rel="noopener noreferrer">Facebook's Sharing documentation</a>, proper Open Graph tags are essential for controlling how your content appears when shared. Our <strong>Open Graph Checker</strong> helps you verify your tags and ensure your content looks great on every platform, improving your <strong>mobile SEO</strong> and social engagement.</p>

      <h2>What This Tool Does</h2>
      <p>Paste any URL above. We fetch the live HTML, parse every OG and Twitter tag, download the actual <code>og:image</code> to measure its real dimensions and file size, and render preview cards exactly as Facebook, LinkedIn, X, WhatsApp, and Discord would show them. Run it on every important page before launch — and on competitors to learn what they're telling social platforms that you're not.</p>

      <p>This tool is essential for maintaining a <strong>mobile-friendly website</strong> with strong social presence. Combined with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a>, you can ensure your site is fully optimized for all platforms.</p>

      <h2>Why Open Graph Tags Matter for SEO</h2>

      <h3>1. Social Media Visibility</h3>
      <p>Open Graph tags control how your content appears on social platforms. Proper tags ensure your links display with compelling images, titles, and descriptions, driving higher click-through rates and engagement.</p>

      <h3>2. Brand Consistency</h3>
      <p>Consistent Open Graph tags across your content reinforce your brand identity. Every share becomes a branded experience that builds recognition and trust.</p>

      <h3>3. Mobile SEO</h3>
      <p>Social shares are a key signal for <strong>mobile SEO</strong>. Content that performs well on social platforms often ranks better in search results. Proper Open Graph tags maximize sharing potential.</p>

      <h2>The Four Required Open Graph Tags</h2>
      <p>Every page needs four OG tags: <code>og:title</code>, <code>og:type</code>, <code>og:image</code>, and <code>og:url</code>. Without them, social platforms guess, and they usually guess badly. Pair these with <code>og:description</code> and <code>og:site_name</code> for a complete preview card.</p>

      <ul>
        <li><strong>📌 og:title</strong> - The title of your content (max 60-70 characters)</li>
        <li><strong>📝 og:type</strong> - The type of content (article, product, website, etc.)</li>
        <li><strong>🖼️ og:image</strong> - The image URL (1200×630 recommended for Facebook)</li>
        <li><strong>🔗 og:url</strong> - The canonical URL of your content</li>
        <li><strong>📄 og:description</strong> - A compelling description (max 155-200 characters)</li>
        <li><strong>🏷️ og:site_name</strong> - Your site name</li>
      </ul>

      <h2>Image Dimensions Matter More Than You Think</h2>
      <p>Facebook recommends 1200×630 pixels with a 1.91:1 aspect ratio. The minimum is 600×315; below that the platform falls back to a small thumbnail or refuses to display the image at all. Below 200×200 most platforms reject it outright. Use a high-quality JPEG or PNG and stay under 8 MB.</p>

      <p>According to <a href="https://developers.facebook.com/docs/sharing/best-practices" target="_blank" rel="noopener noreferrer">Facebook's best practices</a>, images should be at least 1200×630 for optimal display on all devices. Our <strong>Open Graph Checker</strong> verifies your image dimensions and warns if they're insufficient.</p>

      <h2>Twitter Cards Layer on Top</h2>
      <p><code>twitter:card</code> defines the layout: <code>summary</code> (small square thumbnail) or <code>summary_large_image</code> (banner-style, far more engaging in feeds). If you don't set Twitter tags, X falls back to OG — but explicit is better. Add <code>twitter:site</code> with your @handle to attribute the share to your account.</p>

      <p>Twitter Card types:</p>
      <ul>
        <li><strong>🐦 summary</strong> - Small thumbnail with title and description</li>
        <li><strong>🐦 summary_large_image</strong> - Large banner image with title and description (recommended)</li>
        <li><strong>🐦 app</strong> - For mobile app promotion</li>
        <li><strong>🐦 player</strong> - For video/audio content</li>
      </ul>

      <h2>Common Open Graph Issues and How to Fix Them</h2>

      <h3>1. Missing Required Tags</h3>
      <p><strong>The Problem:</strong> Missing og:title, og:type, og:image, or og:url.</p>
      <p><strong>The Fix:</strong> Add all required Open Graph tags to every page. Use our <strong>Open Graph Checker</strong> to identify missing tags.</p>

      <h3>2. Image Too Small</h3>
      <p><strong>The Problem:</strong> Image is below the minimum dimensions (600×315 for Facebook).</p>
      <p><strong>The Fix:</strong> Upload a larger image (minimum 1200×630) and update your og:image tag.</p>

      <h3>3. Image Not Accessible</h3>
      <p><strong>The Problem:</strong> The og:image URL returns a 404 or is blocked.</p>
      <p><strong>The Fix:</strong> Ensure the image URL is publicly accessible and not blocked by robots.txt.</p>

      <h3>4. Title Too Long</h3>
      <p><strong>The Problem:</strong> Title exceeds recommended length (60-70 characters).</p>
      <p><strong>The Fix:</strong> Keep titles concise and compelling for social sharing.</p>

      <h2>Best Practices for Open Graph Implementation</h2>

      <h3>1. Use Absolute URLs</h3>
      <p>Always use absolute URLs (starting with <code>https://</code>) for og:image, og:url, and other URL-based tags. Relative URLs may not work correctly on all platforms.</p>

      <h3>2. Optimize Image Size</h3>
      <p>Use 1200×630 images for Facebook (1.91:1 ratio) and 800×418 for Twitter summary_large_image. Keep file size under 8 MB for optimal loading.</p>

      <h3>3. Include Twitter Cards</h3>
      <p>Add Twitter Card tags alongside Open Graph tags for optimal X sharing. Our <strong>Open Graph Checker</strong> validates both sets of tags.</p>

      <h3>4. Test Before Sharing</h3>
      <p>Always test your tags using our <strong>Open Graph Checker</strong> before sharing content on social platforms.</p>

      <h2>Don't Lie to the Crawler</h2>
      <p>Some sites serve different OG tags to social crawlers than to regular visitors — a tactic that can get pages flagged for cloaking. Use the "Fetch as <code>facebookexternalhit</code>" toggle above to compare. If your tags differ between user agents, that's usually a JavaScript SSR problem worth fixing.</p>

      <p>According to <a href="https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines#cloaking" target="_blank" rel="noopener noreferrer">Google's Webmaster Guidelines</a>, cloaking is a violation that can result in penalties. Ensure your Open Graph tags are consistent across all user agents.</p>

      <h2>Test Before You Ship</h2>
      <p>Paste any URL above. We fetch the live HTML, parse every OG and Twitter tag, download the actual <code>og:image</code> to measure its real dimensions and file size, and render preview cards exactly as Facebook, LinkedIn, X, WhatsApp, and Discord would show them. Run it on every important page before launch — and on competitors to learn what they're telling social platforms that you're not.</p>

      <h2>Monitoring Open Graph Tags Over Time</h2>
      <p>Regular monitoring with our <strong>Open Graph Checker</strong> helps you:</p>
      <ul>
        <li>Detect tag changes introduced during updates</li>
        <li>Verify images remain accessible and properly sized</li>
        <li>Identify new social sharing opportunities</li>
        <li>Maintain <strong>mobile-friendly websites</strong> with strong social presence</li>
        <li>Protect your social sharing performance</li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> for comprehensive site optimization.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is an Open Graph Checker?</h3>
      <p>An <strong>Open Graph Checker</strong> is a tool that analyzes your webpage's Open Graph and Twitter Card tags, validates them against platform requirements, and shows previews of how your content will appear on social platforms.</p>

      <h3>Why are Open Graph tags important?</h3>
      <p>Open Graph tags control how your content appears when shared on social platforms. They determine the title, image, description, and appearance of your links, directly impacting click-through rates and engagement.</p>

      <h3>What are the required Open Graph tags?</h3>
      <p>The four required Open Graph tags are: <code>og:title</code>, <code>og:type</code>, <code>og:image</code>, and <code>og:url</code>. Add <code>og:description</code> and <code>og:site_name</code> for a complete preview.</p>

      <h3>What image size should I use for Open Graph?</h3>
      <p>For Facebook, use 1200×630 pixels (1.91:1 ratio). Minimum is 600×315. For Twitter summary_large_image, use 800×418. Our tool verifies your image dimensions.</p>

      <h3>What's the difference between Open Graph and Twitter Cards?</h3>
      <p>Open Graph tags are used by Facebook, LinkedIn, WhatsApp, and other platforms. Twitter Cards are specific to X (Twitter). X falls back to Open Graph if Twitter tags aren't present, but explicit Twitter tags are better.</p>

      <h3>How do I fix image not showing on social?</h3>
      <p>Check that the image URL is absolute and publicly accessible. Ensure the image meets minimum size requirements (600×315 for Facebook). Use our <strong>Open Graph Checker</strong> to verify image accessibility and dimensions.</p>

      <h2>Conclusion</h2>
      <p>Proper Open Graph and Twitter Card implementation is essential for maximizing your content's social media performance. Our <strong>Open Graph Checker</strong> provides the detailed validation and previews you need to ensure your content looks great on every platform.</p>

      <p>Whether you're running a <strong>mobile-friendly website</strong>, an e-commerce platform, or a content-rich blog, proper social sharing tags are essential for driving engagement and traffic. Use our <strong>Open Graph Checker</strong> as part of your routine maintenance to catch issues early and maintain strong social presence.</p>

      <p>Start validating your Open Graph tags today—use our <strong>Open Graph Checker</strong> to audit your site, identify issues, and ensure your content appears beautifully on every social platform.</p>

      <h3>Related Tools for Comprehensive Website Analysis</h3>
      <p>For a complete website optimization strategy, use these tools alongside our <strong>Open Graph Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Comprehensive content analysis</li>
        <li><a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> - Optimize metadata</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Optimize URL forwarding</li>
      </ul>

      <p>For further reading on Open Graph and social sharing, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.facebook.com/docs/sharing/webmasters/" target="_blank" rel="noopener noreferrer">Facebook Open Graph Documentation</a></li>
        <li><a href="https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards" target="_blank" rel="noopener noreferrer">Twitter Cards Documentation</a></li>
        <li><a href="https://developers.facebook.com/docs/sharing/best-practices" target="_blank" rel="noopener noreferrer">Facebook Sharing Best Practices</a></li>
        <li><a href="https://moz.com/learn/seo/open-graph" target="_blank" rel="noopener noreferrer">Moz Open Graph Guide</a></li>
        <li><a href="https://www.semrush.com/blog/open-graph-meta-tags/" target="_blank" rel="noopener noreferrer">Semrush Open Graph Guide</a></li>
      </ul>
    </article>
  );
}