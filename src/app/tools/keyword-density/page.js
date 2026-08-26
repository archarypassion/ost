"use client";
import { useState } from 'react';
import Link from 'next/link';

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
      <div className="tool-header"><h1>🔑 Keyword Density Checker</h1></div>
      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="mode-tabs" style={{ width: '100%' }}>
          <button
            type="button"
            className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
            style={{ flex: 1 }}
          >
            🌐 Fetch URL
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
            style={{ flex: 1 }}
          >
            ✏️ Paste Text
          </button>
        </div>

        <form onSubmit={submit} style={{ width: '100%' }}>
          {mode === 'url' ? (
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
                {loading ? '⏳ Analysing…' : '🔍 Analyse'}
              </button>
            </div>
          ) : (
            <>
              <textarea
                className="wc-textarea"
                placeholder="📝 Paste content to analyse…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                style={{ width: '100%', minHeight: '200px' }}
              />
              <button type="submit" className="check-btn" style={{ marginTop: '0.75rem' }} disabled={loading}>
                {loading ? '⏳ Analysing…' : '📊 Analyse'}
              </button>
            </>
          )}
        </form>

        <div className="kd-options" style={{ width: '100%' }}>
          <label className="og-toggle">
            <input type="checkbox" checked={excludeStopwords} onChange={(e) => setExcludeStopwords(e.target.checked)} />
            <span>🚫 Exclude stopwords (the, and, of, …)</span>
          </label>
          <label className="kd-top-label">
            📊 Top:
            <select value={top} onChange={(e) => setTop(parseInt(e.target.value, 10))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <p className="tool-description">
          🔍 See the most-used words and phrases on any page or text. Density is the percentage each term
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
    <div className="result-box" style={{ width: '100%' }}>
      {data.mode === 'url' && (
        <>
          <h3 className="result-section-title">📄 Page Information</h3>
          <div className="result-grid" style={{ width: '100%' }}>
            <div className="result-item"><span className="result-label">📍 URL</span><span className="result-value-mono">{data.finalUrl}</span></div>
            <div className="result-item"><span className="result-label">📌 Title</span><span className="result-value">{data.title || '—'}</span></div>
            <div className="result-item"><span className="result-label">📌 First H1</span><span className="result-value">{data.h1?.[0] || '—'}</span></div>
            <div className="result-item"><span className="result-label">📊 H1 / H2</span><span className="result-value">{data.h1?.length || 0} / {data.h2Count || 0}</span></div>
          </div>
        </>
      )}

      <h3 className="result-section-title">📊 Vocabulary</h3>
      <div className="wc-grid" style={{ width: '100%' }}>
        <Stat label="📝 Total words" value={stats.totalWords.toLocaleString()} highlight />
        <Stat label={stats.excludeStopwords ? '🚫 Without stopwords' : '📝 Considered'} value={stats.totalConsidered.toLocaleString()} />
        <Stat label="🔤 Unique words" value={stats.uniqueWords.toLocaleString()} />
        <Stat label="📊 Lexical diversity" value={stats.lexicalDiversity} sub="unique / total" />
      </div>

      <div className="og-tabs" style={{ marginTop: '1rem', width: '100%' }}>
        <button type="button" className={`og-tab ${tab === 'unigrams' ? 'active' : ''}`} onClick={() => setTab('unigrams')}>📝 Words</button>
        <button type="button" className={`og-tab ${tab === 'bigrams' ? 'active' : ''}`} onClick={() => setTab('bigrams')}>🔗 2-Word Phrases</button>
        <button type="button" className={`og-tab ${tab === 'trigrams' ? 'active' : ''}`} onClick={() => setTab('trigrams')}>🔗 3-Word Phrases</button>
      </div>

      {list.length === 0 ? (
        <div className="og-block-empty">No {tab} above the threshold.</div>
      ) : (
        <div style={{ width: '100%' }}>
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
      <h2>Natural Language Processing in SEO: N-Grams, Lexical Diversity &amp; Semantic Coverage</h2>
      <p>
        Early search algorithms relied heavily on exact-match word frequency. Modern search engines evaluate topical depth, entity co-occurrence, and semantic coherence using transformer models (such as BERT and MUM).
      </p>

      <h2>N-Gram Tokenization Explained</h2>

      <p>
        An <em>n-gram</em> is a contiguous sequence of <em>n</em> items from a given sample of text:
      </p>
      <ul>
        <li><strong>Unigram (1-word):</strong> <code>security</code>, <code>certificates</code>, <code>encryption</code>. Useful for broad vocabulary measurement.</li>
        <li><strong>Bigram (2-word phrases):</strong> <code>ssl certificate</code>, <code>public key</code>, <code>cipher suite</code>. Discovers compound subjects.</li>
        <li><strong>Trigram (3-word phrases):</strong> <code>transport layer security</code>, <code>certificate authority authorization</code>. Reveals precise technical entities and intent.</li>
      </ul>

      <h2>Lexical Diversity &amp; Type-Token Ratio (TTR)</h2>

      <p>
        <strong>Lexical diversity</strong> measures the proportion of unique words relative to total words in a text corpus:
      </p>
      <pre className="code-pre">
        <code>{`Lexical Diversity = (Unique Words / Total Words) × 100`}</code>
      </pre>
      <p>
        High-quality technical documentation typically exhibits a balanced lexical diversity (30% to 55%). Content with very low diversity often suffers from repetitive phrasing, thin copy, or keyword stuffing.
      </p>

      <h2>Stopword Filtering</h2>

      <p>
        Stopwords (e.g. <em>the, is, at, which, on</em>) represent over 40% of standard English text. Removing stopwords allows analysis to isolate high-entropy content terms that represent the core subject matter.
      </p>

      <h2>Why Keyword Stuffing Triggers Algorithmic Penalties</h2>

      <p>
        Artificially inflating a target phrase beyond <strong>2.5% to 3%</strong> of total content creates poor reading cadence and triggers spam filters under Google's Helpful Content System. Instead of repeating identical keywords:
      </p>
      <ul>
        <li>Incorporate <strong>LSI (Latent Semantic Indexing) entities:</strong> Related subtopics, synonyms, and contextual terminology.</li>
        <li>Structure your narrative around answering secondary search intents (how-to steps, troubleshooting, technical specifications).</li>
        <li>Audit heading tags and overall content hierarchy using our <Link href="/tools/on-page-seo">On-Page SEO Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the ideal keyword density percentage?</h3>
      <p>
        There is no fixed mathematical target. Most naturally written, authoritative articles have a primary keyword density between <strong>0.5% and 1.5%</strong>. If your primary bigram/trigram flows naturally in headings and introductions, density is sufficient.
      </p>

      <h3>How does TF-IDF differ from simple keyword density?</h3>
      <p>
        Keyword density only measures term frequency on one page. TF-IDF (Term Frequency-Inverse Document Frequency) compares term frequency against a broader library of documents, penalizing commonly occurring words while elevating rare, highly specific topical phrases.
      </p>

      <h3>How does word count relate to keyword density?</h3>
      <p>
        Shorter articles require fewer keyword repetitions to establish topical relevance. Check overall document length, syllable counts, and reading level with our <Link href="/tools/word-count">Word Count &amp; Readability Checker</Link>.
      </p>
    </article>
  );
}