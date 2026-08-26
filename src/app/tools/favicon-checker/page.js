"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Smile, CheckCircle, AlertTriangle, XCircle, Search, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function FaviconCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/tools/favicon-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to inspect favicons.');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Favicon &amp; Web App Manifest Checker</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Audit website favicon implementations across modern browsers, iOS home screen touch icons,
          SVG dark-mode favicons, and Progressive Web App (PWA) manifest configurations.
        </p>

        <form onSubmit={handleSubmit} className="search-form" style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
          <div className="search-bar">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)..."
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="check-btn" disabled={loading}>
              <Smile size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Auditing...' : 'Check Favicon'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>Audit Failed: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Scorecard */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: data.validIconsCount > 0 ? '4px solid #10B981' : '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Target Endpoint
                </span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '2px' }}>{data.finalUrl}</div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Valid Icons:</span>
                  <strong style={{ color: '#10B981', fontSize: '1.25rem' }}>{data.validIconsCount}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Root /favicon.ico:</span>
                  <strong>{data.hasFaviconIco ? '✅ Found' : '❌ Missing'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Apple Touch Icon:</span>
                  <strong>{data.hasAppleTouch ? '✅ Found' : '⚠️ Missing'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Icons Table */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <strong style={{ fontSize: '0.9375rem', display: 'block', marginBottom: '1rem' }}>
              Probed Icon Candidates ({data.icons.length}):
            </strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.icons.map((icon, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                    {/* Icon Visual Preview */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {icon.ok && !icon.type.includes('Manifest') ? (
                        <img src={icon.url} alt="Favicon" style={{ maxWidth: '28px', maxHeight: '28px', objectFit: 'contain' }} />
                      ) : (
                        <ImageIcon size={18} color="#94A3B8" />
                      )}
                    </div>

                    <div style={{ wordBreak: 'break-all' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.875rem' }}>{icon.type}</strong>
                        {icon.sizes && <span style={{ fontSize: '0.75rem', color: 'var(--lv2-blue-light)' }}>({icon.sizes})</span>}
                      </div>
                      <a href={icon.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {icon.url} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {icon.contentType && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{icon.contentType.split(';')[0]}</span>
                    )}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: icon.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: icon.ok ? '#10B981' : '#EF4444',
                      }}
                    >
                      HTTP {icon.status || 'Err'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Modern Favicon &amp; App Icon Implementation Standards</h2>
      <p>
        Favicons are small visual brand identity icons displayed in browser tabs, bookmark bars, mobile search snippets, and mobile home screen shortcuts. In modern search engine results pages (Google Mobile &amp; Desktop SERP), Google displays a 16x16 pixel favicon next to the domain name, making a valid favicon a critical factor in search branding and click-through rates.
      </p>

      <h2>Recommended Favicon Asset Inventory</h2>

      <ul>
        <li><strong><code>/favicon.ico</code> (Legacy Fallback):</strong> A multi-resolution <code>.ico</code> file containing 16x16, 32x32, and 48x48 pixel icons placed at the web server root.</li>
        <li><strong><code>/apple-touch-icon.png</code> (180x180):</strong> High-resolution PNG used by Apple iOS Safari when users save web pages to their mobile home screen.</li>
        <li><strong>Vector SVG Favicon (<code>/favicon.svg</code>):</strong> Scalable vector icon supporting <code>@media (prefers-color-scheme: dark)</code> for automatic dark mode adaptation.</li>
        <li><strong>Web App Manifest (<code>manifest.json</code>):</strong> Declares 192x192 and 512x512 PNG icons for Progressive Web App (PWA) installation.</li>
      </ul>

      <h2>Standard HTML Link Tags for Complete Compatibility</h2>

      <pre className="code-pre"><code>&lt;link rel=&quot;icon&quot; href=&quot;/favicon.ico&quot; sizes=&quot;32x32&quot;&gt;
&lt;link rel=&quot;icon&quot; href=&quot;/favicon.svg&quot; type=&quot;image/svg+xml&quot;&gt;
&lt;link rel=&quot;apple-touch-icon&quot; href=&quot;/apple-touch-icon.png&quot;&gt;
&lt;link rel=&quot;manifest&quot; href=&quot;/manifest.json&quot;&gt;</code></pre>

      <h2>Domain &amp; Technical SEO Suite</h2>

      <p>
        Verify your site branding and server diagnostics:
      </p>
      <ul>
        <li><strong>Social Card Previews:</strong> Inspect social share assets with our <Link href="/tools/social-preview">Social Share Multi-Previewer</Link>.</li>
        <li><strong>Security Headers:</strong> Audit server protection with our <Link href="/tools/security-headers">Security Headers Checker</Link>.</li>
        <li><strong>Meta Tags:</strong> Inspect all declared page tags with our <Link href="/tools/meta-tags">Meta Tags Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why is my favicon not showing up in Google Search results?</h3>
      <p>
        Googlebot-Image crawls favicons independently on a separate schedule. Ensure your favicon URL is not blocked in <code>robots.txt</code>, returns a <code>200 OK</code> status, and is a multiple of 48px square (e.g. 48x48, 96x96, 144x144).
      </p>

      <h3>Can I use SVG favicons in all browsers?</h3>
      <p>
        All modern evergreen browsers (Chrome, Firefox, Safari 15+, Edge) support SVG favicons. Older browsers will automatically fall back to the declared <code>favicon.ico</code>.
      </p>
    </article>
  );
}
