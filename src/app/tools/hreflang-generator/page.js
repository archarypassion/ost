"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Languages, Copy, Check, Plus, Trash2, Download, Code } from 'lucide-react';

const SAMPLE_ENTRIES = [
  { lang: 'en', region: 'us', url: 'https://example.com/en-us' },
  { lang: 'en', region: 'gb', url: 'https://example.com/en-gb' },
  { lang: 'es', region: 'es', url: 'https://example.com/es' },
  { lang: 'es', region: 'mx', url: 'https://example.com/es-mx' },
  { lang: 'de', region: '', url: 'https://example.com/de' },
  { lang: 'fr', region: '', url: 'https://example.com/fr' },
];

export default function HreflangGeneratorPage() {
  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [includeXDefault, setIncludeXDefault] = useState(true);
  const [xDefaultUrl, setXDefaultUrl] = useState('https://example.com/');
  const [outputFormat, setOutputFormat] = useState('html'); // 'html' | 'xml'
  const [copied, setCopied] = useState(false);

  const addEntry = () => {
    setEntries([...entries, { lang: 'en', region: '', url: 'https://example.com/' }]);
  };

  const removeEntry = (index) => {
    setEntries(entries.filter((_, idx) => idx !== index));
  };

  const updateEntry = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const generatedOutput = useMemo(() => {
    const cleanEntries = entries.filter((e) => e.lang && e.url);

    if (outputFormat === 'html') {
      const tags = cleanEntries.map((e) => {
        const hreflang = e.region ? `${e.lang.toLowerCase()}-${e.region.toUpperCase()}` : e.lang.toLowerCase();
        return `<link rel="alternate" hreflang="${hreflang}" href="${e.url.trim()}" />`;
      });
      if (includeXDefault && xDefaultUrl) {
        tags.push(`<link rel="alternate" hreflang="x-default" href="${xDefaultUrl.trim()}" />`);
      }
      return tags.join('\n');
    }

    if (outputFormat === 'xml') {
      const xmlLinks = cleanEntries.map((e) => {
        const hreflang = e.region ? `${e.lang.toLowerCase()}-${e.region.toUpperCase()}` : e.lang.toLowerCase();
        return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${e.url.trim()}" />`;
      });
      if (includeXDefault && xDefaultUrl) {
        xmlLinks.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl.trim()}" />`);
      }

      return `<url>\n  <loc>${cleanEntries[0]?.url || 'https://example.com/'}</loc>\n${xmlLinks.join('\n')}\n</url>`;
    }

    return '';
  }, [entries, includeXDefault, xDefaultUrl, outputFormat]);

  const handleCopy = async () => {
    if (!generatedOutput) return;
    await navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Hreflang Tag &amp; Multilingual XML Generator</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Generate bidirectional reciprocal hreflang annotations for international SEO. Supports ISO 639-1
          language codes, ISO 3166-1 regional targeting, and XML Sitemap markup.
        </p>

        {/* Dynamic Rows Table */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong style={{ fontSize: '0.875rem' }}>Language &amp; Regional Target URLs:</strong>
            <button
              type="button"
              className="check-btn"
              onClick={addEntry}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Plus size={13} style={{ display: 'inline', marginRight: '4px' }} /> Add Language
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {entries.map((entry, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 100px 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Language (e.g. en)"
                    value={entry.lang}
                    onChange={(e) => updateEntry(idx, 'lang', e.target.value)}
                    className="search-input"
                    style={{ width: '100%', padding: '0.45rem', fontSize: '0.8125rem', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Region (e.g. US)"
                    value={entry.region}
                    onChange={(e) => updateEntry(idx, 'region', e.target.value)}
                    className="search-input"
                    style={{ width: '100%', padding: '0.45rem', fontSize: '0.8125rem', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="https://example.com/target-page"
                    value={entry.url}
                    onChange={(e) => updateEntry(idx, 'url', e.target.value)}
                    className="search-input"
                    style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="lv2-pill-btn"
                    style={{ padding: '6px', color: '#EF4444' }}
                    title="Remove Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* x-default Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeXDefault}
                onChange={(e) => setIncludeXDefault(e.target.checked)}
              />
              <strong>Include x-default Fallback:</strong>
            </label>
            {includeXDefault && (
              <input
                type="text"
                value={xDefaultUrl}
                onChange={(e) => setXDefaultUrl(e.target.value)}
                placeholder="https://example.com/ (Global landing page)"
                className="search-input"
                style={{ flex: 1, minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              />
            )}
          </div>
        </div>

        {/* Output Box */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className={outputFormat === 'html' ? 'check-btn' : 'lv2-pill-btn'}
                onClick={() => setOutputFormat('html')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                HTML &lt;link&gt; Tags
              </button>
              <button
                type="button"
                className={outputFormat === 'xml' ? 'check-btn' : 'lv2-pill-btn'}
                onClick={() => setOutputFormat('xml')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                XML Sitemap Format
              </button>
            </div>

            <button
              type="button"
              className="check-btn"
              onClick={handleCopy}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              {copied ? <Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />}
              {copied ? 'Copied!' : 'Copy Markup'}
            </button>
          </div>

          <textarea
            readOnly
            rows={8}
            value={generatedOutput}
            style={{ width: '100%', padding: '0.85rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', lineHeight: 1.5, resize: 'vertical', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Google International SEO &amp; Hreflang Annotation Rules</h2>
      <p>
        The <code>rel=&quot;alternate&quot; hreflang=&quot;x&quot;</code> attribute specifies the language and optional geographical region of alternate versions of a webpage under <a href="https://www.rfc-editor.org/rfc/rfc5646.txt" target="_blank" rel="noopener noreferrer">IETF RFC 5646</a>. Search engines like Google and Bing use hreflang signals to serve localized searchers with the correct regional language variant.
      </p>

      <h2>Core Rules for Valid Hreflang Implementation</h2>

      <ul>
        <li><strong>Bidirectional Return Links (Reciprocity):</strong> Hreflang annotations must be reciprocal. If Page A links to Page B as its Spanish alternate, Page B <em>must</em> link back to Page A as its English alternate, or Google will ignore both annotations.</li>
        <li><strong>Self-Referencing Tag:</strong> Every page must include an hreflang tag pointing back to itself.</li>
        <li><strong>The <code>x-default</code> Directive:</strong> The <code>hreflang=&quot;x-default&quot;</code> fallback URL directs unmatched international searchers to a global language selector or default homepage.</li>
      </ul>

      <h2>Language &amp; Region Formatting Standards</h2>

      <p>
        Languages must use two-letter <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes" target="_blank" rel="noopener noreferrer">ISO 639-1</a> codes (e.g. <code>en</code>, <code>es</code>, <code>de</code>), while optional geographical regions must use two-letter <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank" rel="noopener noreferrer">ISO 3166-1 Alpha-2</a> codes (e.g. <code>US</code>, <code>GB</code>, <code>MX</code>).
      </p>

      <h2>International SEO Suite</h2>

      <p>
        Pair hreflang generation with our technical SEO suite:
      </p>
      <ul>
        <li><strong>Sitemap Validation:</strong> Test multi-language sitemaps with our <Link href="/tools/sitemap-checker">XML Sitemap Checker</Link>.</li>
        <li><strong>Canonical Auditing:</strong> Prevent canonical conflicts with our <Link href="/tools/canonical-url">Canonical URL Checker</Link>.</li>
        <li><strong>Meta Tags Inspection:</strong> Inspect live tags with our <Link href="/tools/meta-tags">Meta Tags Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Should hreflang point to the canonical URL?</h3>
      <p>
        Yes. Every alternate URL specified in hreflang tags must be self-canonicalized and return a <code>200 OK</code> HTTP status code. Never target redirecting (301) or noindexed pages.
      </p>

      <h3>Is hreflang needed if my website only has one language?</h3>
      <p>
        No. Single-language websites targeting a single country do not need hreflang markup.
      </p>
    </article>
  );
}
