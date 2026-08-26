"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Share2, CheckCircle, AlertTriangle, XCircle, Search, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function SocialPreviewPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [platformTab, setPlatformTab] = useState('facebook'); // 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/tools/social-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch social metadata.');
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
        <h1>Social Share Multi-Platform Previewer</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Preview how any webpage appears when shared across Facebook, X (Twitter), LinkedIn, and
          WhatsApp. Inspects Open Graph and Twitter Card tags to fix broken images and truncated titles.
        </p>

        <form onSubmit={handleSubmit} className="search-form" style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
          <div className="search-bar">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter webpage URL (e.g., https://example.com/article)..."
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="check-btn" disabled={loading}>
              <Share2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Fetching Meta...' : 'Preview Social Cards'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>Social Preview Error: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Platform Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={platformTab === 'facebook' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setPlatformTab('facebook')}
              style={{ padding: '0.45rem 1.1rem' }}
            >
              Facebook Preview
            </button>
            <button
              type="button"
              className={platformTab === 'twitter' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setPlatformTab('twitter')}
              style={{ padding: '0.45rem 1.1rem' }}
            >
              X / Twitter Card
            </button>
            <button
              type="button"
              className={platformTab === 'linkedin' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setPlatformTab('linkedin')}
              style={{ padding: '0.45rem 1.1rem' }}
            >
              LinkedIn Post
            </button>
            <button
              type="button"
              className={platformTab === 'whatsapp' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setPlatformTab('whatsapp')}
              style={{ padding: '0.45rem 1.1rem' }}
            >
              WhatsApp Bubble
            </button>
          </div>

          {/* Social Mockup Container */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {/* Facebook Card Mockup */}
            {platformTab === 'facebook' && (
              <div style={{ width: '100%', maxWidth: '520px', background: '#FFFFFF', color: '#1C1E21', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <div style={{ height: '270px', background: '#E4E6EB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {data.image ? (
                    <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#8A8D91', fontSize: '0.875rem' }}>No og:image declared</span>
                  )}
                </div>
                <div style={{ padding: '12px 16px', background: '#F0F2F5' }}>
                  <div style={{ fontSize: '12px', color: '#65676B', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {data.domain}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#050505', lineHeight: 1.25, marginBottom: '4px' }}>
                    {data.title || 'No Title Found'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#65676B', lineHeight: 1.4, maxHeight: '36px', overflow: 'hidden' }}>
                    {data.description || 'No description found.'}
                  </div>
                </div>
              </div>
            )}

            {/* Twitter Card Mockup */}
            {platformTab === 'twitter' && (
              <div style={{ width: '100%', maxWidth: '520px', background: '#000000', color: '#E7E9EA', borderRadius: '16px', overflow: 'hidden', border: '1px solid #2F3336', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div style={{ height: '270px', background: '#16181C', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {data.image ? (
                    <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#71767B', fontSize: '0.875rem' }}>No twitter:image declared</span>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '13px', color: '#71767B', marginBottom: '2px' }}>{data.domain}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#E7E9EA', lineHeight: 1.3, marginBottom: '4px' }}>
                    {data.title || 'Page Title'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#71767B', lineHeight: 1.4, maxHeight: '36px', overflow: 'hidden' }}>
                    {data.description || 'Description text preview...'}
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn Card Mockup */}
            {platformTab === 'linkedin' && (
              <div style={{ width: '100%', maxWidth: '520px', background: '#FFFFFF', color: '#000000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, sans-serif' }}>
                <div style={{ height: '270px', background: '#EBEBEB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {data.image ? (
                    <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#666666', fontSize: '0.875rem' }}>No image found</span>
                  )}
                </div>
                <div style={{ padding: '12px 16px', background: '#F3F6F8' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', lineHeight: 1.3, marginBottom: '4px' }}>
                    {data.title || 'Article Headline'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                    {data.domain} · {data.siteName}
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Card Mockup */}
            {platformTab === 'whatsapp' && (
              <div style={{ width: '100%', maxWidth: '380px', background: '#EFEAE2', padding: '12px', borderRadius: '12px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', border: '1px solid #D1D7DB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ height: '180px', background: '#F0F2F5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {data.image ? (
                      <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#8696A0', fontSize: '0.75rem' }}>No image preview</span>
                    )}
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111B21', lineHeight: 1.3, marginBottom: '3px' }}>
                      {data.title || 'Page Title'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#667781', lineHeight: 1.3, maxHeight: '32px', overflow: 'hidden', marginBottom: '4px' }}>
                      {data.description || 'Description text...'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8696A0' }}>{data.domain}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parsed Meta Tags Grid */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.75rem' }}>Extracted Social Graph Tags:</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>og:title: </span><strong>{data.og.title || data.title || 'None'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>og:description: </span><span>{data.og.description || data.description || 'None'}</span></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>og:image: </span><code style={{ wordBreak: 'break-all' }}>{data.image || 'None'}</code></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>twitter:card: </span><code>{data.twitterCardType}</code></div>
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
      <h2>Open Graph Protocol &amp; Social Share Specifications</h2>
      <p>
        The <a href="https://ogp.me" target="_blank" rel="noopener noreferrer">Open Graph protocol</a> (created by Facebook) and Twitter Card tags enable webpages to become rich interactive graph objects in social feeds and messaging platforms. When users paste a link into WhatsApp, Facebook, LinkedIn, X, or Slack, the platform&apos;s crawler fetches Open Graph metadata to render a high-converting visual preview card.
      </p>

      <h2>Recommended Social Image Dimensions (1.91:1 Ratio)</h2>

      <ul>
        <li><strong>Standard Landscape Banner:</strong> <strong>1200 x 630 pixels</strong> (1.91:1 aspect ratio). Supported across Facebook, X summary_large_image, LinkedIn, and Slack.</li>
        <li><strong>Minimum Supported Size:</strong> Images below 200x200 pixels will not render as large cards and are downgraded to tiny square thumbnails.</li>
        <li><strong>Max File Size:</strong> Keep social share images under <strong>5 MB</strong> (under 1 MB recommended) in JPG, PNG, or WebP formats.</li>
      </ul>

      <h2>Essential Social Meta Tags</h2>

      <pre className="code-pre"><code>&lt;meta property=&quot;og:title&quot; content=&quot;Your Compelling Title&quot; /&gt;
&lt;meta property=&quot;og:description&quot; content=&quot;Short 2-sentence description.&quot; /&gt;
&lt;meta property=&quot;og:image&quot; content=&quot;https://example.com/share-image.jpg&quot; /&gt;
&lt;meta property=&quot;og:url&quot; content=&quot;https://example.com/page&quot; /&gt;
&lt;meta name=&quot;twitter:card&quot; content=&quot;summary_large_image&quot; /&gt;</code></pre>

      <h2>On-Page &amp; Social Marketing Suite</h2>

      <p>
        Optimize your brand across social and search channels:
      </p>
      <ul>
        <li><strong>Meta Tags Auditing:</strong> Inspect all declared headers with our <Link href="/tools/meta-tags">Meta Tags Checker</Link>.</li>
        <li><strong>Meta Description Crafting:</strong> Optimize SERP snippet length with our <Link href="/tools/meta-description-generator">Meta Description Generator</Link>.</li>
        <li><strong>Campaign Link Tracking:</strong> Build custom tracking URLs with our <Link href="/tools/utm-builder">UTM Campaign Builder</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why is Facebook or Twitter showing an outdated share image?</h3>
      <p>
        Social platforms aggressively cache Open Graph metadata for up to 30 days. Use the official Facebook Sharing Debugger or Twitter Card Validator to force crawlers to scrape the latest metadata.
      </p>

      <h3>Does WhatsApp support Twitter Card tags?</h3>
      <p>
        No. WhatsApp strictly parses <code>og:image</code> and standard HTML <code>&lt;title&gt;</code> tags. Twitter Card markup is ignored by WhatsApp.
      </p>
    </article>
  );
}
