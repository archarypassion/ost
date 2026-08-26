"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'during', 'each', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself'
]);

function transliterate(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe');
}

export default function SlugGeneratorPage() {
  const [input, setInput] = useState('Top 10 Best Technical SEO Tools for Developers in 2026!');
  const [separator, setSeparator] = useState('-'); // '-' | '_' | ''
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [stripNumbers, setStripNumbers] = useState(false);
  const [casing, setCasing] = useState('lower'); // 'lower' | 'upper' | 'preserve'
  const [maxLen, setMaxLen] = useState(80);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!input.trim()) return '';

    let text = transliterate(input.trim());

    if (casing === 'lower') text = text.toLowerCase();
    else if (casing === 'upper') text = text.toUpperCase();

    // Replace all non-alphanumeric with spaces
    text = text.replace(/[^a-zA-Z0-9\s]/g, ' ');

    let words = text.split(/\s+/).filter(Boolean);

    if (removeStopWords) {
      words = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
    }

    if (stripNumbers) {
      words = words.filter((w) => !/^\d+$/.test(w));
    }

    let result = words.join(separator);

    if (maxLen && result.length > maxLen) {
      result = result.slice(0, maxLen);
      if (separator && result.endsWith(separator)) {
        result = result.slice(0, -1);
      }
    }

    return result;
  }, [input, separator, removeStopWords, stripNumbers, casing, maxLen]);

  const handleCopy = async () => {
    if (!slug) return;
    await navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>SEO Friendly URL Slug Generator</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Convert blog titles and article headlines into clean, search engine friendly URL slugs.
          Automatically strips stop words, normalizes accented characters, and formats keywords.
        </p>

        {/* Input Field */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Article Title / Headline:
          </label>
          <input
            type="text"
            className="search-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 15 Essential SEO Checklist Items for Next.js Applications"
            style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1rem' }}
          />
        </div>

        {/* Options Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.25rem' }}>
          {/* Separator */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Word Separator:
            </label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }}
            >
              <option value="-">Hyphen (-) [Google Recommended]</option>
              <option value="_">Underscore (_)</option>
              <option value="">None (Concatenated)</option>
            </select>
          </div>

          {/* Casing */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Letter Casing:
            </label>
            <select
              value={casing}
              onChange={(e) => setCasing(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }}
            >
              <option value="lower">Lowercase (Recommended)</option>
              <option value="upper">UPPERCASE</option>
              <option value="preserve">Preserve Input Case</option>
            </select>
          </div>

          {/* Max Length */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Max Character Length:
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={maxLen}
              onChange={(e) => setMaxLen(parseInt(e.target.value, 10) || 80)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={removeStopWords}
              onChange={(e) => setRemoveStopWords(e.target.checked)}
            />
            <span>Remove common stop words (a, the, in, for, of, with...)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={stripNumbers}
              onChange={(e) => setStripNumbers(e.target.checked)}
            />
            <span>Strip pure numbers (e.g. &quot;2026&quot;, &quot;10&quot;)</span>
          </label>
        </div>

        {/* Output Box */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.875rem' }}>Generated SEO Slug:</strong>
            <button
              type="button"
              className="check-btn"
              onClick={handleCopy}
              disabled={!slug}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              {copied ? <Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />}
              {copied ? 'Copied!' : 'Copy Slug'}
            </button>
          </div>

          <div style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {slug || 'Enter a title above to preview your URL slug...'}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Length: <strong>{slug.length}</strong> characters</span>
            <span>Words: <strong>{slug ? slug.split(separator || ' ').length : 0}</strong></span>
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
      <h2>Search Engine Friendly URL Architecture</h2>
      <p>
        A URL slug is the human-readable, hyphenated text string identifying a specific webpage resource within a domain path. Crafting concise, descriptive slugs improves organic search click-through rates (CTR) and reinforces keyword topical relevance for search engine crawlers.
      </p>

      <h2>Google Guidelines: Hyphens vs. Underscores</h2>

      <p>
        Google Search Central explicitly recommends using <strong>hyphens (<code>-</code>)</strong> rather than underscores (<code>_</code>) as word delimiters in URL paths:
      </p>
      <ul>
        <li><strong>Hyphens:</strong> Googlebot treats <code>seo-tools-checker</code> as three separate words (<code>&quot;seo&quot; &quot;tools&quot; &quot;checker&quot;</code>).</li>
        <li><strong>Underscores:</strong> Googlebot historically treats <code>seo_tools_checker</code> as a single concatenated term (<code>&quot;seotoolschecker&quot;</code>).</li>
      </ul>

      <h2>Why Remove Stop Words from URL Slugs?</h2>

      <p>
        Articles, prepositions, and conjunctions (e.g. <em>&quot;the&quot;</em>, <em>&quot;in&quot;</em>, <em>&quot;of&quot;</em>, <em>&quot;and&quot;</em>) add visual length without contributing topical search equity. Removing them produces concise, memorable slugs (e.g. <code>/blog/technical-seo-checklist</code> instead of <code>/blog/the-complete-technical-seo-checklist-for-modern-websites</code>).
      </p>

      <h2>Synergies with On-Page &amp; Content Tools</h2>

      <p>
        Coordinate slug creation with our on-page diagnostic suite:
      </p>
      <ul>
        <li><strong>Keyword Distribution:</strong> Measure lexical frequency across your content using our <Link href="/tools/keyword-density">Keyword Density Checker</Link>.</li>
        <li><strong>SERP Meta Tags:</strong> Preview how titles and URLs appear in search snippets with our <Link href="/tools/meta-tags">Meta Tags Checker</Link>.</li>
        <li><strong>Readability Auditing:</strong> Calculate Flesch readability grades with our <Link href="/tools/word-count">Word Count &amp; Readability Tool</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the optimal length for an SEO URL slug?</h3>
      <p>
        Aim for 3 to 5 key descriptive words, ideally keeping total slug length under 60 characters for maximum SERP readability and easy sharing.
      </p>

      <h3>Should I change existing URL slugs on published articles?</h3>
      <p>
        Only if necessary. Changing a live URL changes its address; you must implement an immediate <code>301 Permanent Redirect</code> from the old URL to the new slug to prevent 404 errors and preserve backlink equity.
      </p>

      <h3>Can URL slugs contain uppercase letters?</h3>
      <p>
        URLs are case-sensitive on Linux/Unix web servers (Apache, Nginx). Always standardize slugs to lowercase to prevent duplicate content indexing issues.
      </p>
    </article>
  );
}
