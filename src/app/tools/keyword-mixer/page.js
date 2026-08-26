"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shuffle, Copy, Check, Download, Trash2 } from 'lucide-react';

const SAMPLE_A = `best\ntop\ncheap\nfree`;
const SAMPLE_B = `seo tools\nkeyword rank tracker\nbacklink checker`;
const SAMPLE_C = `online\nfor developers\n2026`;

export default function KeywordMixerPage() {
  const [listA, setListA] = useState(SAMPLE_A);
  const [listB, setListB] = useState(SAMPLE_B);
  const [listC, setListC] = useState(SAMPLE_C);

  const [comboAB, setComboAB] = useState(true);
  const [comboBC, setComboBC] = useState(true);
  const [comboABC, setComboABC] = useState(true);
  const [comboAC, setComboAC] = useState(false);

  const [matchBroad, setMatchBroad] = useState(true);
  const [matchPhrase, setMatchPhrase] = useState(false);
  const [matchExact, setMatchExact] = useState(false);
  const [forceLower, setForceLower] = useState(true);
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    const parse = (text) => text.split('\n').map((l) => (forceLower ? l.trim().toLowerCase() : l.trim())).filter(Boolean);
    const a = parse(listA);
    const b = parse(listB);
    const c = parse(listC);

    const rawCombos = new Set();

    // A + B
    if (comboAB && a.length && b.length) {
      for (const x of a) for (const y of b) rawCombos.add(`${x} ${y}`);
    }

    // B + C
    if (comboBC && b.length && c.length) {
      for (const y of b) for (const z of c) rawCombos.add(`${y} ${z}`);
    }

    // A + B + C
    if (comboABC && a.length && b.length && c.length) {
      for (const x of a) for (const y of b) for (const z of c) rawCombos.add(`${x} ${y} ${z}`);
    }

    // A + C
    if (comboAC && a.length && c.length) {
      for (const x of a) for (const z of c) rawCombos.add(`${x} ${z}`);
    }

    const outputList = [];
    for (const phrase of rawCombos) {
      if (matchBroad) outputList.push(phrase);
      if (matchPhrase) outputList.push(`"${phrase}"`);
      if (matchExact) outputList.push(`[${phrase}]`);
    }

    return outputList;
  }, [listA, listB, listC, comboAB, comboBC, comboABC, comboAC, matchBroad, matchPhrase, matchExact, forceLower]);

  const handleCopy = async () => {
    if (!results.length) return;
    await navigator.clipboard.writeText(results.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!results.length) return;
    const blob = new Blob([results.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-permutations.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Keyword Mixer &amp; Permutation Tool</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Combine up to three lists of keyword modifiers, root terms, and geo-locations into complete
          keyword permutations with Google Ads match type formatting (Broad, &quot;Phrase&quot;, [Exact]).
        </p>

        {/* 3 Input Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', width: '100%', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              List A (Prefixes / Modifiers):
            </label>
            <textarea
              rows={6}
              value={listA}
              onChange={(e) => setListA(e.target.value)}
              placeholder="best&#10;cheap&#10;top"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8125rem', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              List B (Core Keywords / Products):
            </label>
            <textarea
              rows={6}
              value={listB}
              onChange={(e) => setListB(e.target.value)}
              placeholder="seo tools&#10;rank tracker"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8125rem', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              List C (Suffixes / Locations / Year):
            </label>
            <textarea
              rows={6}
              value={listC}
              onChange={(e) => setListC(e.target.value)}
              placeholder="online&#10;for developers&#10;2026"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8125rem', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Options & Combinations Toolbar */}
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Combination Rules:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={comboAB} onChange={(e) => setComboAB(e.target.checked)} /> A + B</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={comboBC} onChange={(e) => setComboBC(e.target.checked)} /> B + C</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={comboABC} onChange={(e) => setComboABC(e.target.checked)} /> A + B + C</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={comboAC} onChange={(e) => setComboAC(e.target.checked)} /> A + C</label>
              </div>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Match Types (Google Ads):</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={matchBroad} onChange={(e) => setMatchBroad(e.target.checked)} /> Broad Match (keyword)</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={matchPhrase} onChange={(e) => setMatchPhrase(e.target.checked)} /> Phrase Match (&quot;keyword&quot;)</label>
                <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={matchExact} onChange={(e) => setMatchExact(e.target.checked)} /> Exact Match ([keyword])</label>
              </div>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Formatting:</strong>
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <input type="checkbox" checked={forceLower} onChange={(e) => setForceLower(e.target.checked)} /> Force Lowercase
              </label>
            </div>
          </div>
        </div>

        {/* Output Box */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #06B6D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Generated Keywords ({results.length} total):
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="lv2-pill-btn"
                onClick={handleCopy}
                disabled={!results.length}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy List'}
              </button>
              <button
                type="button"
                className="lv2-pill-btn"
                onClick={handleDownload}
                disabled={!results.length}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                <Download size={11} /> Save
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={results.join('\n')}
            rows={10}
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
      <h2>Keyword Permutation Theory for PPC &amp; Programmatic SEO</h2>
      <p>
        Keyword permutation is the mathematical combinatorial multiplication of core keyword entities with prefixes (intent modifiers like <em>&quot;best&quot;</em> or <em>&quot;buy&quot;</em>) and suffixes (geographical locations, year tokens, or audience modifiers). It allows search marketers to generate comprehensive keyword coverage for Google Ads, Bing Ads, and programmatic SEO landing pages.
      </p>

      <h2>Google Ads Match Types Explained</h2>

      <ul>
        <li><strong>Broad Match (<code>keyword</code>):</strong> Matches searches related to your keyword, including synonyms, misspellings, and related topics.</li>
        <li><strong>Phrase Match (<code>&quot;keyword&quot;</code>):</strong> Matches searches that include the exact phrase meaning, allowing words before or after.</li>
        <li><strong>Exact Match (<code>[keyword]</code>):</strong> Matches searches with the exact same search intent as your keyword without extraneous terms.</li>
      </ul>

      <h2>Best Practices for Large Keyword Permutations</h2>

      <ol>
        <li><strong>Deduplicate Generated Lists:</strong> Always run permutations through our <Link href="/tools/text-deduplicator">Text Deduplicator</Link> to ensure overlapping combination rules do not produce duplicate entries.</li>
        <li><strong>Analyze Search Volumes:</strong> Prioritize high-intent commercial modifiers (e.g. <em>&quot;pricing&quot;</em>, <em>&quot;software&quot;</em>, <em>&quot;platform&quot;</em>) over ambiguous terms.</li>
        <li><strong>Prevent Cannibalization:</strong> Group permuted keywords into dedicated ad groups to ensure ad copy relevancy remains tightly focused.</li>
      </ol>

      <h2>Synergies with Link &amp; Marketing Tools</h2>

      <p>
        Execute marketing campaigns with our full diagnostics suite:
      </p>
      <ul>
        <li><strong>Campaign Tracking:</strong> Build tagged links with our <Link href="/tools/utm-builder">UTM Campaign Builder</Link>.</li>
        <li><strong>List Deduplication:</strong> Remove duplicate records with our <Link href="/tools/text-deduplicator">Text &amp; Keyword Deduplicator</Link>.</li>
        <li><strong>URL Slug Formatting:</strong> Convert keyword phrases to slugs with our <Link href="/tools/slug-generator">URL Slug Generator</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>How many combinations does multiplying 3 lists produce?</h3>
      <p>
        If List A has 5 words, List B has 10 words, and List C has 4 words, an $A \times B \times C$ permutation produces $5 \times 10 \times 4 = 200$ unique keyword combinations.
      </p>

      <h3>Does this tool run client-side?</h3>
      <p>
        Yes. All keyword permutations and formatting are calculated locally in your browser with zero latency and zero data persistence.
      </p>
    </article>
  );
}
