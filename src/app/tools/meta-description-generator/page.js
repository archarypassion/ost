"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PenTool, Copy, Check, Smartphone, Monitor, AlertCircle, Sparkles } from 'lucide-react';

export default function MetaDescriptionGeneratorPage() {
  const [title, setTitle] = useState('10 Best Technical SEO Diagnostic Tools for Developers');
  const [description, setDescription] = useState('Explore our curated suite of open-source SEO diagnostics. Audit indexability, test security headers, measure Core Web Vitals, and resolve crawl errors instantly.');
  const [url, setUrl] = useState('https://www.opensourcetools.online/tools');
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [copied, setCopied] = useState(false);

  // Approximate pixel width calculations (average 8.5px per character in Arial 14px)
  const pixelWidth = useMemo(() => {
    return Math.round(description.length * 8.4);
  }, [description]);

  const maxChars = viewMode === 'desktop' ? 160 : 120;
  const maxPixels = viewMode === 'desktop' ? 960 : 680;
  const isTruncated = description.length > maxChars || pixelWidth > maxPixels;

  const handleCopy = async () => {
    const tag = `<meta name="description" content="${description.trim()}" />`;
    await navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Meta Description Generator &amp; SERP Simulator</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Craft search-optimized meta descriptions with real-time Google desktop and mobile SERP preview
          simulations. Measures exact character counts and pixel widths to prevent search snippet truncation.
        </p>

        {/* Editor & Preview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Page Title Tag:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
                <label style={{ fontWeight: 600 }}>Meta Description:</label>
                <span style={{ color: description.length > 160 ? '#EF4444' : description.length >= 120 ? '#10B981' : 'var(--text-secondary)' }}>
                  {description.length} / 160 chars ({pixelWidth}px)
                </span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter compelling meta description copy..."
                className="search-input"
                style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: isTruncated ? '1px solid #F59E0B' : '1px solid var(--border-color)', borderRadius: '8px', resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Destination URL:
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>

            <button
              type="button"
              className="check-btn"
              onClick={handleCopy}
              style={{ alignSelf: 'flex-start' }}
            >
              {copied ? <Check size={14} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={14} style={{ display: 'inline', marginRight: '4px' }} />}
              {copied ? 'Copied Tag!' : 'Copy <meta> Tag'}
            </button>
          </div>

          {/* SERP Simulator Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.875rem' }}>Google SERP Snippet Preview</strong>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  className={viewMode === 'desktop' ? 'check-btn' : 'lv2-pill-btn'}
                  style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                >
                  <Monitor size={12} style={{ display: 'inline', marginRight: '4px' }} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  className={viewMode === 'mobile' ? 'check-btn' : 'lv2-pill-btn'}
                  style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                >
                  <Smartphone size={12} style={{ display: 'inline', marginRight: '4px' }} /> Mobile
                </button>
              </div>
            </div>

            {/* Google SERP Card Mockup */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: '#ffffff',
                color: '#202124',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                fontFamily: 'Arial, sans-serif',
                maxWidth: viewMode === 'desktop' ? '600px' : '380px',
              }}
            >
              {/* URL Breadcrumb */}
              <div style={{ fontSize: '12px', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#e8f0fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#1a73e8' }}>🌐</span>
                <span style={{ color: '#4d5156' }}>{url}</span>
              </div>

              {/* Title */}
              <div style={{ fontSize: '18px', lineHeight: '1.3', color: '#1a0dab', cursor: 'pointer', marginBottom: '4px', fontWeight: 400 }}>
                {title || 'Page Title'}
              </div>

              {/* Description Snippet */}
              <div style={{ fontSize: '14px', lineHeight: '1.58', color: '#4d5156', wordBreak: 'break-word' }}>
                {isTruncated
                  ? `${description.slice(0, maxChars)}...`
                  : (description || 'Meta description text preview...')}
              </div>
            </div>

            {/* Truncation Warning */}
            {isTruncated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#F59E0B' }}>
                <AlertCircle size={14} />
                <span>Description may be truncated on {viewMode} screens (&gt; {maxChars} characters).</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Search Engine Meta Description Standards</h2>
      <p>
        The <code>&lt;meta name=&quot;description&quot;&gt;</code> HTML attribute provides search engines (Google, Bing, Yahoo) with an authoritative concise summary of webpage content. Although meta descriptions are not a direct algorithmic search ranking factor, compelling copy directly increases organic Click-Through Rate (CTR) from Search Engine Results Pages (SERPs).
      </p>

      <h2>Optimal Length &amp; Pixel Truncation Rules</h2>

      <ul>
        <li><strong>Desktop Search Snippets:</strong> Google truncates snippets after approximately <strong>960 pixels</strong> (approx. 155–160 characters).</li>
        <li><strong>Mobile Search Snippets:</strong> Google truncates snippets after approximately <strong>680 pixels</strong> (approx. 115–120 characters).</li>
        <li><strong>Character Width Variation:</strong> Uppercase letters and wide glyphs (e.g. <code>W</code>, <code>M</code>) occupy more pixel width than narrow characters (e.g. <code>l</code>, <code>i</code>), causing snippets with fewer characters to truncate early.</li>
      </ul>

      <h2>Best Practices for High-Converting Meta Descriptions</h2>

      <ol>
        <li><strong>Include Primary Target Keywords:</strong> Google bolds search query terms matching your description in SERP snippets, drawing visual attention.</li>
        <li><strong>Incorporate Clear Calls to Action (CTA):</strong> Use actionable verbs like <em>&quot;Discover&quot;</em>, <em>&quot;Calculate&quot;</em>, <em>&quot;Audit&quot;</em>, and <em>&quot;Download&quot;</em>.</li>
        <li><strong>Unique per URL:</strong> Never duplicate meta descriptions across multiple site pages; identical descriptions trigger Google automated snippet rewrites.</li>
      </ol>

      <h2>On-Page &amp; SERP Optimization Suite</h2>

      <p>
        Optimize your complete SERP appearance:
      </p>
      <ul>
        <li><strong>Live Tag Auditing:</strong> Inspect live meta tags on any URL using our <Link href="/tools/meta-tags">Meta Tags Checker</Link>.</li>
        <li><strong>Social Card Previews:</strong> Preview Open Graph share cards with our <Link href="/tools/social-preview">Social Share Multi-Previewer</Link>.</li>
        <li><strong>Slug Formatting:</strong> Create search-friendly URLs with our <Link href="/tools/slug-generator">URL Slug Generator</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why does Google sometimes ignore my meta description?</h3>
      <p>
        Google rewrites meta descriptions in roughly 60% of search queries if the page&apos;s published description is too short, keyword-stuffed, duplicated, or does not directly answer the user&apos;s specific search intent.
      </p>

      <h3>Can I use emojis in meta descriptions?</h3>
      <p>
        Yes. Unicode emojis (e.g. ✅, ⚡, ⭐) can be included and often boost organic CTR, but avoid overusing them as Google filters excessive or spammy symbols.
      </p>

      <h3>Does missing a meta description hurt rankings?</h3>
      <p>
        Missing descriptions do not directly penalize rankings, but Google will automatically extract a random sentence from your body copy which is rarely optimized for maximum click-through rates.
      </p>
    </article>
  );
}
