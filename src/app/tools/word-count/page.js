"use client";
import { useState, useMemo, useEffect } from 'react';

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
      <div className="tool-header"><h1>Word Count Checker</h1></div>
      <div className="tool-card">
        <div className="mode-tabs">
          <button type="button" className={`mode-tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>Paste text</button>
          <button type="button" className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>Fetch URL</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'text' ? (
            <textarea
              placeholder="Paste or type your content here..."
              className="wc-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          ) : (
            <div className="search-bar">
              <input type="text" placeholder="https://example.com/page" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
              <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Fetching…' : 'Analyse Page'}</button>
            </div>
          )}
        </form>

        <p className="tool-description">
          Count words, characters, sentences, paragraphs, syllables, reading and speaking time, plus
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
    <div className="result-box" style={{ marginBottom: '1rem' }}>
      <h3 className="result-section-title">Page</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">URL</span><span className="result-value-mono">{url}</span></div>
        <div className="result-item"><span className="result-label">HTTP</span><span className="result-value">{status}</span></div>
        <div className="result-item"><span className="result-label">Title</span><span className="result-value">{e.title || '—'}</span></div>
        <div className="result-item"><span className="result-label">First H1</span><span className="result-value">{e.firstH1 || '—'}</span></div>
        <div className="result-item"><span className="result-label">H1 / H2 count</span><span className="result-value">{e.h1Count} / {e.h2Count}</span></div>
        <div className="result-item"><span className="result-label">HTML lang</span><span className="result-value">{e.lang || '—'}</span></div>
        <div className="result-item"><span className="result-label">HTML size</span><span className="result-value">{(e.htmlLength / 1024).toFixed(1)} KB</span></div>
      </div>
    </div>
  );
}

function StatsBlock({ stats }) {
  return (
    <div className="result-box">
      <h3 className="result-section-title">Counts</h3>
      <div className="wc-grid">
        <Stat label="Words" value={stats.words.toLocaleString()} highlight />
        <Stat label="Characters" value={stats.characters.toLocaleString()} />
        <Stat label="No spaces" value={stats.charactersNoSpaces.toLocaleString()} />
        <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
        <Stat label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
        <Stat label="Syllables" value={stats.syllables.toLocaleString()} />
      </div>

      <h3 className="result-section-title">Word stats</h3>
      <div className="wc-grid">
        <Stat label="Avg word length" value={`${stats.avgWordLength} chars`} />
        <Stat label="Avg sentence length" value={`${stats.avgSentenceLength} words`} />
        <Stat label="Long words (7+)" value={stats.longWords.toLocaleString()} />
        <Stat label="Very long words (12+)" value={stats.veryLongWords.toLocaleString()} />
        <Stat label="Reading time" value={`${stats.readingTimeMinutes} min`} sub="@ 230 wpm" />
        <Stat label="Speaking time" value={`${stats.speakingTimeMinutes} min`} sub="@ 130 wpm" />
      </div>

      {stats.fleschReadingEase !== null && (
        <>
          <h3 className="result-section-title">Readability</h3>
          <div className="wc-readability">
            <div className="wc-readability-score">
              <div className="wc-readability-num">{stats.fleschReadingEase}</div>
              <div className="wc-readability-sub">Flesch Reading Ease</div>
            </div>
            <div className="wc-readability-grade">
              <div className="wc-readability-num">{stats.fleschKincaidGrade}</div>
              <div className="wc-readability-sub">Flesch–Kincaid grade</div>
            </div>
            <div className="wc-readability-label">{stats.readabilityLabel}</div>
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
      <h2>Word Count: Why Length Matters in SEO (and the Way It Doesn’t)</h2>
      <p>Google has said many times that there’s no minimum word count, yet pages ranking for competitive informational queries are reliably longer and more comprehensive than the rest. The relationship is correlative, not causal — long content ranks because depth signals authority, not because Google rewards length.</p>
      <h3>Match length to intent</h3>
      <p>For deep informational queries (&ldquo;how does X work&rdquo;), top results are commonly 2,000–4,000 words. For transactional queries (&ldquo;buy size 10 sneakers&rdquo;), a tight 300-word product page outranks a 2,000-word essay. For local queries, concise wins. Write to satisfy the user’s task, not to hit a word target.</p>
      <h3>Readability matters as much as length</h3>
      <p>Flesch Reading Ease scores text from 0 (very hard) to 100 (very easy). Most general-audience web copy targets 60–70. The Flesch–Kincaid grade level estimates the U.S. school grade required to understand the text — most consumer content is best at grade 7–9. We compute both above so you can spot pages that are accidentally academic.</p>
      <h3>How to use this tool</h3>
      <p>Paste your draft for live counts as you type, or fetch any live URL to see how many words your published page actually has — because what your CMS shows in the editor is rarely what gets rendered to crawlers after templates, navigation, and footers strip in.</p>
    </article>
  );
}
