"use client";
import { useState } from 'react';

export default function KeywordDensityPage() {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [excludeStopwords, setExcludeStopwords] = useState(true);
  const [top, setTop] = useState(20);
  const [tab, setTab] = useState('unigrams');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const body = { mode, top, excludeStopwords, ...(mode === 'text' ? { text } : { url: url.trim() }) };
      const res = await fetch('/api/tools/keyword-density', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>Keyword Density Checker</h1></div>
      <div className="tool-card">
        <div className="mode-tabs">
          <button type="button" className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>Fetch URL</button>
          <button type="button" className={`mode-tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>Paste text</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'url' ? (
            <div className="search-bar">
              <input type="text" placeholder="https://example.com/page" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
              <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Analysing…' : 'Analyse'}</button>
            </div>
          ) : (
            <>
              <textarea className="wc-textarea" placeholder="Paste content to analyse…" value={text} onChange={(e) => setText(e.target.value)} required />
              <button type="submit" className="check-btn" style={{ marginTop: '0.75rem' }} disabled={loading}>{loading ? 'Analysing…' : 'Analyse'}</button>
            </>
          )}
        </form>

        <div className="kd-options">
          <label className="og-toggle">
            <input type="checkbox" checked={excludeStopwords} onChange={(e) => setExcludeStopwords(e.target.checked)} />
            <span>Exclude stopwords (the, and, of, …)</span>
          </label>
          <label className="kd-top-label">
            Top:
            <select value={top} onChange={(e) => setTop(parseInt(e.target.value, 10))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <p className="tool-description">
          See the most-used words and phrases on any page or text. Density is the percentage each term
          contributes to the total — useful for spotting keyword stuffing or for understanding what a
          page is really about. Bigrams and trigrams reveal the natural phrases your content emphasises.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} tab={tab} setTab={setTab} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data, tab, setTab }) {
  const { stats } = data;
  const list = stats[tab] || [];
  const max = list[0]?.count || 1;
  return (
    <div className="result-box">
      {data.mode === 'url' && (
        <>
          <h3 className="result-section-title">Page</h3>
          <div className="result-grid">
            <div className="result-item"><span className="result-label">URL</span><span className="result-value-mono">{data.finalUrl}</span></div>
            <div className="result-item"><span className="result-label">Title</span><span className="result-value">{data.title || '—'}</span></div>
            <div className="result-item"><span className="result-label">First H1</span><span className="result-value">{data.h1?.[0] || '—'}</span></div>
            <div className="result-item"><span className="result-label">H1 / H2</span><span className="result-value">{data.h1?.length || 0} / {data.h2Count || 0}</span></div>
          </div>
        </>
      )}

      <h3 className="result-section-title">Vocabulary</h3>
      <div className="wc-grid">
        <Stat label="Total words" value={stats.totalWords.toLocaleString()} highlight />
        <Stat label={stats.excludeStopwords ? 'Without stopwords' : 'Considered'} value={stats.totalConsidered.toLocaleString()} />
        <Stat label="Unique words" value={stats.uniqueWords.toLocaleString()} />
        <Stat label="Lexical diversity" value={stats.lexicalDiversity} sub="unique / total" />
      </div>

      <div className="og-tabs" style={{ marginTop: '1rem' }}>
        <button type="button" className={`og-tab ${tab === 'unigrams' ? 'active' : ''}`} onClick={() => setTab('unigrams')}>Words</button>
        <button type="button" className={`og-tab ${tab === 'bigrams' ? 'active' : ''}`} onClick={() => setTab('bigrams')}>2-word phrases</button>
        <button type="button" className={`og-tab ${tab === 'trigrams' ? 'active' : ''}`} onClick={() => setTab('trigrams')}>3-word phrases</button>
      </div>

      {list.length === 0 ? (
        <div className="og-block-empty">No {tab} above the threshold.</div>
      ) : (
        <div>
          {list.map((row, idx) => (
            <div key={row.term} className="kd-row">
              <span className="kd-rank">#{idx + 1}</span>
              <span className="kd-term">{row.term}</span>
              <span className="kd-count">{row.count}</span>
              <span className="kd-density">{row.density}%</span>
              <div className="kd-bar"><div className="kd-bar-fill" style={{ width: `${(row.count / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
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

function Article() {
  return (
    <article className="tool-article">
      <h2>Keyword Density: A Useful Diagnostic, Not a Ranking Lever</h2>
      <p>Keyword density — the percentage a term occupies of your total word count — was once a favoured way to game search rankings. Modern Google ignores raw frequency and looks for topical coherence, entities, and how naturally a topic is covered. So why look at density at all? Because it’s an excellent <em>diagnostic</em>: a quick way to see what a page is actually about, and a fast way to flag accidental keyword stuffing.</p>
      <h3>What healthy density looks like</h3>
      <p>For most editorial content the primary keyword should appear at 0.5–1.5% density — roughly one mention every 100–200 words. Bigrams and trigrams (two- and three-word phrases) are usually more revealing than single words: a page about &ldquo;machine learning&rdquo; should have &ldquo;machine learning&rdquo; as a top bigram, not just &ldquo;learning&rdquo; or &ldquo;machine&rdquo; in isolation.</p>
      <h3>Stopwords change everything</h3>
      <p>Without filtering stopwords (&ldquo;the, of, and&rdquo;), every page looks like it’s about &ldquo;the&rdquo;. We exclude them by default. Toggle them back on if you’re analysing for plagiarism or style.</p>
      <h3>How to use this tool</h3>
      <p>Paste a draft to see what your editor weights. Or fetch a competitor’s URL to learn which phrases they’re emphasising — then write better and more naturally. Aim for the top trigrams to actually describe the topic in plain English; if they don’t, your content is probably unfocused.</p>
    </article>
  );
}
