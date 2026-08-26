"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

export default function WordCountPage() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Live local stats while typing in text mode (no debounce needed for small text)
  const localStats = useMemo(() => {
    if (mode !== 'text' || !text.trim()) return null;
    return analyseLocal(text);
  }, [mode, text]);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const body = mode === 'text' ? { mode: 'text', text } : { mode: 'url', url: url.trim() };
      const res = await fetch('/api/tools/word-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else setData(json);
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>📝 Word Count Checker</h1></div>
      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="mode-tabs" style={{ width: '100%' }}>
          <button
            type="button"
            className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
            style={{ flex: 1 }}
          >
            ✏️ Paste Text
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
            style={{ flex: 1 }}
          >
            🌐 Fetch URL
          </button>
        </div>

        <form onSubmit={submit} style={{ width: '100%' }}>
          {mode === 'text' ? (
            <textarea
              placeholder="📝 Paste or type your content here..."
              className="wc-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              style={{ width: '100%', minHeight: '200px' }}
            />
          ) : (
            <div className="search-bar" style={{ width: '100%' }}>
              <input
                type="text"
                placeholder="https://example.com/page"
                className="search-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="check-btn" disabled={loading}>
                {loading ? '⏳ Fetching…' : '🔍 Analyse Page'}
              </button>
            </div>
          )}
          {mode === 'text' && (
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {text.length} characters · {text.split(/\s+/).filter(w => w).length} words (live)
              </span>
              <button type="submit" className="check-btn" disabled={loading}>
                {loading ? '⏳ Analysing…' : '📊 Analyse Text'}
              </button>
            </div>
          )}
        </form>

        <p className="tool-description">
          📊 Count words, characters, sentences, paragraphs, syllables, reading and speaking time, plus
          Flesch readability — either on text you paste here or on any live web page.
        </p>

        {error && <div className="result-error">{error}</div>}
        {mode === 'text' && localStats && <StatsBlock stats={localStats} />}
        {data && !data.error && data.mode === 'url' && (
          <>
            {data.extracted && <ExtractedBlock e={data.extracted} url={data.finalUrl} status={data.httpStatus} />}
            <StatsBlock stats={data.stats} />
          </>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ExtractedBlock({ e, url, status }) {
  return (
    <div className="result-box" style={{ marginBottom: '1rem', width: '100%' }}>
      <h3 className="result-section-title">📄 Page Information</h3>
      <div className="result-grid" style={{ width: '100%' }}>
        <div className="result-item"><span className="result-label">📍 URL</span><span className="result-value-mono">{url}</span></div>
        <div className="result-item"><span className="result-label">📊 HTTP</span><span className="result-value">{status}</span></div>
        <div className="result-item"><span className="result-label">📌 Title</span><span className="result-value">{e.title || '—'}</span></div>
        <div className="result-item"><span className="result-label">📌 First H1</span><span className="result-value">{e.firstH1 || '—'}</span></div>
        <div className="result-item"><span className="result-label">📊 H1 / H2 count</span><span className="result-value">{e.h1Count} / {e.h2Count}</span></div>
        <div className="result-item"><span className="result-label">🌐 HTML lang</span><span className="result-value">{e.lang || '—'}</span></div>
        <div className="result-item"><span className="result-label">📦 HTML size</span><span className="result-value">{(e.htmlLength / 1024).toFixed(1)} KB</span></div>
      </div>
    </div>
  );
}

function StatsBlock({ stats }) {
  return (
    <div className="result-box" style={{ width: '100%' }}>
      <h3 className="result-section-title">📊 Counts</h3>
      <div className="wc-grid" style={{ width: '100%' }}>
        <Stat label="📝 Words" value={stats.words.toLocaleString()} highlight />
        <Stat label="🔤 Characters" value={stats.characters.toLocaleString()} />
        <Stat label="📝 No spaces" value={stats.charactersNoSpaces.toLocaleString()} />
        <Stat label="📄 Sentences" value={stats.sentences.toLocaleString()} />
        <Stat label="📑 Paragraphs" value={stats.paragraphs.toLocaleString()} />
        <Stat label="🔊 Syllables" value={stats.syllables.toLocaleString()} />
      </div>

      <h3 className="result-section-title">📈 Word Statistics</h3>
      <div className="wc-grid" style={{ width: '100%' }}>
        <Stat label="📏 Avg word length" value={`${stats.avgWordLength} chars`} />
        <Stat label="📏 Avg sentence length" value={`${stats.avgSentenceLength} words`} />
        <Stat label="🔤 Long words (7+)" value={stats.longWords.toLocaleString()} />
        <Stat label="🔤 Very long words (12+)" value={stats.veryLongWords.toLocaleString()} />
        <Stat label="⏱️ Reading time" value={`${stats.readingTimeMinutes} min`} sub="@ 230 wpm" />
        <Stat label="⏱️ Speaking time" value={`${stats.speakingTimeMinutes} min`} sub="@ 130 wpm" />
      </div>

      {stats.fleschReadingEase !== null && (
        <>
          <h3 className="result-section-title">📖 Readability</h3>
          <div className="wc-readability" style={{ width: '100%' }}>
            <div className="wc-readability-score">
              <div className="wc-readability-num">{stats.fleschReadingEase}</div>
              <div className="wc-readability-sub">Flesch Reading Ease</div>
            </div>
            <div className="wc-readability-grade">
              <div className="wc-readability-num">{stats.fleschKincaidGrade}</div>
              <div className="wc-readability-sub">Flesch–Kincaid Grade</div>
            </div>
            <div className="wc-readability-label">📌 {stats.readabilityLabel}</div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div className={`wc-stat ${highlight ? 'highlight' : ''}`}>
      <div className="wc-stat-label">{label}</div>
      <div className="wc-stat-value">{value}</div>
      {sub && <div className="wc-stat-sub">{sub}</div>}
    </div>
  );
}

// Local (client-side) analyser mirrors the server one closely so live typing is instant.
function analyseLocal(text) {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}'\-\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleaned ? cleaned.split(' ').filter((t) => t.length >= 1 && !/^[\d\-]+$/.test(t)) : [];
  const words = tokens.length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentenceMatches = text.match(/[^.!?]+[.!?]+/g);
  const sentences = sentenceMatches ? sentenceMatches.length : (text.trim() ? 1 : 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (text.trim() ? 1 : 0);
  let syllables = 0, longWords = 0, veryLongWords = 0;
  for (const t of tokens) { syllables += syl(t); if (t.length >= 7) longWords++; if (t.length >= 12) veryLongWords++; }
  const avgWordLength = words ? +(tokens.reduce((s, t) => s + t.length, 0) / words).toFixed(2) : 0;
  const avgSentenceLength = sentences ? +(words / sentences).toFixed(2) : 0;
  const flesch = words && sentences ? +(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)).toFixed(1) : null;
  const fk = words && sentences ? +(0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59).toFixed(1) : null;
  return {
    words, characters, charactersNoSpaces, sentences, paragraphs, syllables,
    longWords, veryLongWords, avgWordLength, avgSentenceLength,
    readingTimeMinutes: Math.max(1, Math.round(words / 230)),
    speakingTimeMinutes: Math.max(1, Math.round(words / 130)),
    fleschReadingEase: flesch,
    fleschKincaidGrade: fk,
    readabilityLabel: flesch === null ? null : (flesch >= 90 ? 'Very easy (5th grade)' : flesch >= 80 ? 'Easy (6th grade)' : flesch >= 70 ? 'Fairly easy (7th grade)' : flesch >= 60 ? 'Standard (8th–9th grade)' : flesch >= 50 ? 'Fairly difficult (10th–12th grade)' : flesch >= 30 ? 'Difficult (college)' : 'Very difficult (college graduate)'),
  };
}

function syl(word) {
  if (!word) return 0;
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = cleaned.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Text Analysis &amp; Readability: Metrics, Formulas &amp; Content Sizing</h2>
      <p>
        Content length is not an isolated ranking factor; rather, comprehensive topic coverage correlates with search performance because it thoroughly answers user queries. Evaluating word count alongside readability metrics ensures technical depth without sacrificing reader comprehension.
      </p>

      <h2>Mathematical Readability Formulas</h2>

      <h3>1. Flesch Reading Ease Score</h3>
      <pre className="code-pre">
        <code>{`Score = 206.835 - 1.015 × (Total Words / Total Sentences) - 84.6 × (Total Syllables / Total Words)`}</code>
      </pre>
      <p>
        Scores range from 0 to 100:
      </p>
      <ul>
        <li><strong>90–100:</strong> Very Easy (5th-grade level)</li>
        <li><strong>60–70:</strong> Plain English / Standard (8th–9th grade level) — Ideal for consumer web content</li>
        <li><strong>30–50:</strong> Difficult (College level) — Common in legal and academic papers</li>
        <li><strong>0–29:</strong> Very Confusing (Postgraduate level)</li>
      </ul>

      <h3>2. Flesch–Kincaid Grade Level</h3>
      <pre className="code-pre">
        <code>{`Grade Level = 0.39 × (Total Words / Total Sentences) + 11.8 × (Total Syllables / Total Words) - 15.59`}</code>
      </pre>
      <p>
        Translates readability directly into the estimated years of formal education required to understand the material.
      </p>

      <h2>Reading vs. Speaking Velocity Estimates</h2>

      <ul>
        <li><strong>Silent Web Reading:</strong> Calculated at <strong>230 words per minute (WPM)</strong>, the standard benchmark for adult comprehension on digital screens.</li>
        <li><strong>Spoken Delivery (Podcasts / Videos):</strong> Calculated at <strong>130 words per minute (WPM)</strong>, typical for clear broadcast speech.</li>
      </ul>

      <h2>Matching Content Depth to Search Intent</h2>

      <ul>
        <li><strong>Informational Guides:</strong> Typically 1,500 to 3,500 words to comprehensively cover subtopics, edge cases, and actionable steps.</li>
        <li><strong>E-Commerce Product Pages:</strong> Typically 200 to 500 concise words focusing on specifications, compatibility, and user benefits. Fluff padding hurts conversion rates.</li>
        <li><strong>Landing Pages &amp; Tools:</strong> Prioritize clear headings, interactive inputs, and scannable FAQs.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Does Google penalize short articles?</h3>
      <p>
        No. Google does not have an arbitrary word count requirement. A 300-word answer that completely solves a specific user intent can easily outrank a bloated 2,000-word guide filled with filler text.
      </p>

      <h3>How do sentences and syllables impact readability?</h3>
      <p>
        Long sentences (exceeding 25 words) and polysyllabic terms (3+ syllables) reduce the Flesch score significantly. Splitting compound sentences into concise statements improves user retention.
      </p>

      <h3>How can I verify term distribution within my text?</h3>
      <p>
        To ensure you haven't overused specific terminology while refining length, use our <Link href="/tools/keyword-density">Keyword Density Checker</Link> and audit structure with our <Link href="/tools/on-page-seo">On-Page SEO Checker</Link>.
      </p>
    </article>
  );
}