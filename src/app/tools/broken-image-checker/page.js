"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ImageOff, CheckCircle, AlertTriangle, XCircle, Search, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function BrokenImageCheckerPage() {
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
      const res = await fetch('/api/tools/broken-image-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to inspect page images.');
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
        <h1>Broken Image &amp; Alt Tag Checker</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Crawl all images on any webpage to detect 404 broken image links, missing or empty
          <code>alt</code> attributes (WCAG accessibility), and insecure HTTP mixed content.
        </p>

        <form onSubmit={handleSubmit} className="search-form" style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
          <div className="search-bar">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter page URL (e.g., https://example.com/blog)..."
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="check-btn" disabled={loading}>
              <ImageOff size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Crawling Images...' : 'Audit Images'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>Image Audit Error: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Scorecard */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: data.brokenCount === 0 ? '4px solid #10B981' : '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Image Audit Summary
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                  {data.totalImages} images inspected
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Broken (404/500):</span>
                  <strong style={{ color: data.brokenCount > 0 ? '#EF4444' : '#10B981', fontSize: '1.25rem' }}>
                    {data.brokenCount}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Missing Alt Text:</span>
                  <strong style={{ color: data.missingAltCount > 0 ? '#F59E0B' : '#10B981', fontSize: '1.25rem' }}>
                    {data.missingAltCount}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Mixed Content:</span>
                  <strong style={{ color: data.mixedContentCount > 0 ? '#EF4444' : '#10B981', fontSize: '1.25rem' }}>
                    {data.mixedContentCount}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Images Detail List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.images.map((img, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderLeft: !img.ok ? '3px solid #EF4444' : img.isMissingAlt ? '3px solid #F59E0B' : '3px solid #10B981',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {img.ok ? (
                      <img src={img.url} alt="" style={{ maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' }} />
                    ) : (
                      <ImageOff size={18} color="#EF4444" />
                    )}
                  </div>

                  <div style={{ wordBreak: 'break-all' }}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--lv2-blue-light)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {img.url} <ExternalLink size={11} />
                    </a>
                    <div style={{ fontSize: '0.75rem', marginTop: '3px', color: 'var(--text-secondary)' }}>
                      Alt: {img.hasAlt ? <strong style={{ color: 'var(--text-primary)' }}>&quot;{img.alt}&quot;</strong> : <span style={{ color: '#F59E0B' }}>⚠️ Missing alt attribute</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {img.isMixedContent && (
                    <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 600 }}>
                      HTTP Mixed
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: img.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: img.ok ? '#10B981' : '#EF4444',
                    }}
                  >
                    HTTP {img.status || '404'}
                  </span>
                </div>
              </div>
            ))}
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
      <h2>The SEO &amp; Accessibility Impact of Webpage Images</h2>
      <p>
        Images constitute over 50% of the average webpage&apos;s total transfer weight. Broken image references (HTTP 404 or 500 status) damage user trust, trigger Google Core Web Vitals layout shifts (CLS), and waste search engine crawl budget. Furthermore, missing descriptive <code>alt</code> attributes violate international accessibility laws and prevent image ranking in Google Image Search.
      </p>

      <h2>WCAG 2.1 Accessibility Requirements (Criterion 1.1.1)</h2>

      <ul>
        <li><strong>Informative Images:</strong> Every meaningful image must have an <code>alt</code> text describing its visual content or function for screen readers used by visually impaired visitors.</li>
        <li><strong>Decorative Images:</strong> Purely decorative background flourishes should have an empty alt attribute (<code>alt=&quot;&quot;</code>) so assistive technologies ignore them.</li>
      </ul>

      <h2>Mixed Content Security Vulnerabilities</h2>

      <p>
        Serving unencrypted images (<code>http://</code>) on a secure HTTPS webpage triggers browser &quot;Mixed Content&quot; security blocks. Modern browsers (Google Chrome, Firefox) will block HTTP images entirely, breaking page layouts.
      </p>

      <h2>On-Page &amp; Performance Tool Suite</h2>

      <p>
        Optimize your full page assets:
      </p>
      <ul>
        <li><strong>Broken Link Crawling:</strong> Test outbound anchor links with our <Link href="/tools/link-checker">Broken Link Checker</Link>.</li>
        <li><strong>Total Asset Weight:</strong> Measure image payload sizes with our <Link href="/tools/page-size">Page Size Checker</Link>.</li>
        <li><strong>On-Page Auditing:</strong> Run a full 17-point check with our <Link href="/tools/on-page-seo">On-Page SEO Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Does Google rank pages with broken images lower?</h3>
      <p>
        Yes. Broken images lead to high bounce rates and poor page experience signals, which Google Search ranking algorithms factor into search position calculations.
      </p>

      <h3>How long should alt text be for optimal SEO?</h3>
      <p>
        Keep alt text between 5 to 15 words (approx. 50–100 characters). Accurately describe the subject matter and naturally include primary keywords without spammy keyword stuffing.
      </p>
    </article>
  );
}
