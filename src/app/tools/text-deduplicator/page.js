"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ListFilter, Copy, Check, Download, Trash2, ArrowUpDown } from 'lucide-react';

const SAMPLE_LIST = `seo audit tools
technical seo checklist
keyword research tools
seo audit tools
backlink checker
technical seo checklist
meta tags checker
schema markup generator
keyword research tools
page speed test`;

export default function TextDeduplicatorPage() {
  const [input, setInput] = useState(SAMPLE_LIST);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sortOrder, setSortOrder] = useState('none'); // 'none' | 'asc' | 'desc' | 'length-asc' | 'length-desc'
  const [copied, setCopied] = useState(false);

  const { output, originalCount, uniqueCount, duplicateCount } = useMemo(() => {
    if (!input) return { output: '', originalCount: 0, uniqueCount: 0, duplicateCount: 0 };

    let lines = input.split('\n');
    const originalCount = lines.length;

    if (trimWhitespace) {
      lines = lines.map((l) => l.trim());
    }

    if (removeEmpty) {
      lines = lines.filter((l) => l.length > 0);
    }

    const seen = new Set();
    const unique = [];

    for (const line of lines) {
      const key = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(line);
      }
    }

    if (sortOrder === 'asc') {
      unique.sort((a, b) => a.localeCompare(b));
    } else if (sortOrder === 'desc') {
      unique.sort((a, b) => b.localeCompare(a));
    } else if (sortOrder === 'length-asc') {
      unique.sort((a, b) => a.length - b.length || a.localeCompare(b));
    } else if (sortOrder === 'length-desc') {
      unique.sort((a, b) => b.length - a.length || a.localeCompare(b));
    }

    const uniqueCount = unique.length;
    const duplicateCount = originalCount - uniqueCount;

    return {
      output: unique.join('\n'),
      originalCount,
      uniqueCount,
      duplicateCount,
    };
  }, [input, caseSensitive, trimWhitespace, removeEmpty, sortOrder]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deduplicated.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Text &amp; Keyword List Deduplicator</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Remove duplicate lines from keyword lists, URL inventories, and datasets in real-time.
          Includes case-sensitivity controls, whitespace trimming, and alphabetical sorting.
        </p>

        {/* Options Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
              <span>Case Sensitive</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={trimWhitespace} onChange={(e) => setTrimWhitespace(e.target.checked)} />
              <span>Trim Whitespace</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} />
              <span>Remove Empty Lines</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="search-input"
              style={{ padding: '0.35rem 0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem' }}
            >
              <option value="none">Original Order</option>
              <option value="asc">Sort A &rarr; Z</option>
              <option value="desc">Sort Z &rarr; A</option>
              <option value="length-asc">Shortest First</option>
              <option value="length-desc">Longest First</option>
            </select>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => setInput(SAMPLE_LIST)}
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            >
              Sample
            </button>
          </div>
        </div>

        {/* Textarea Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {/* Input Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Input List</strong>
              <span>{originalCount} lines</span>
            </div>
            <textarea
              className="search-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste list with duplicate lines..."
              rows={12}
              style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          {/* Output Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Cleaned Unique List ({uniqueCount} lines)</strong>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={handleCopy}
                  disabled={!output}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={handleDownload}
                  disabled={!output}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  <Download size={11} /> Save
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={12}
              style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Metrics Banner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginTop: '1.25rem', fontSize: '0.875rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Original Lines: </span><strong>{originalCount}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Unique Lines: </span><strong style={{ color: '#10B981' }}>{uniqueCount}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Duplicates Removed: </span><strong style={{ color: '#EF4444' }}>{duplicateCount}</strong></div>
          {originalCount > 0 && (
            <div><span style={{ color: 'var(--text-secondary)' }}>List Reduction: </span><strong>{Math.round((duplicateCount / originalCount) * 100)}%</strong></div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>List Deduplication in Keyword Research &amp; SEO</h2>
      <p>
        Data deduplication is the process of identifying and removing redundant duplicate text records from a dataset while preserving unique entries. In digital marketing and technical SEO, deduplication cleans keyword research exports, backlink prospect inventories, and URL sitemap feeds.
      </p>

      <h2>Common Use Cases for Text Deduplication</h2>

      <ul>
        <li><strong>PPC &amp; Google Ads Keyword Lists:</strong> Merging search term reports from multiple campaigns creates massive redundancy. Deduplicating keywords prevents self-competing ad spend.</li>
        <li><strong>Backlink Outreach &amp; Prospecting:</strong> Scraping directories often yields duplicate target domains. Deduplicating recipient lists prevents duplicate email outreach.</li>
        <li><strong>XML Sitemap Cleanups:</strong> Verifying that large URL inventories do not contain duplicate canonical paths before publishing feeds.</li>
      </ul>

      <h2>Case-Sensitivity &amp; Whitespace Normalization</h2>

      <p>
        In search marketing, keywords with varying letter capitalization (e.g. <code>&quot;SEO Tools&quot;</code> and <code>&quot;seo tools&quot;</code>) target identical search intent. Enabling case-insensitive matching normalizes terms to ensure absolute list uniqueness.
      </p>

      <h2>Synergies with Link &amp; Content Tools</h2>

      <p>
        Pair list deduplication with our marketing utilities:
      </p>
      <ul>
        <li><strong>Keyword Permutations:</strong> Build multi-tiered keyword lists with our <Link href="/tools/keyword-mixer">Keyword Mixer Tool</Link>.</li>
        <li><strong>Case Normalization:</strong> Convert text formatting with our <Link href="/tools/case-converter">Text Case Converter</Link>.</li>
        <li><strong>Bulk HTTP Status Checking:</strong> Test cleaned URL lists with our <Link href="/tools/http-status">HTTP Status Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Does this tool store or upload my text lists?</h3>
      <p>
        No. All deduplication, sorting, and whitespace normalization is performed strictly client-side in your web browser using high-performance JavaScript <code>Set</code> data structures.
      </p>

      <h3>How does line trimming prevent false negatives?</h3>
      <p>
        Leading or trailing space characters (e.g. <code>&quot;keyword &quot;</code> vs <code>&quot;keyword&quot;</code>) make identical lines appear different to simple filters. Whitespace trimming ensures true string equality.
      </p>
    </article>
  );
}
