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
      <h2>Keyword Density: A Useful Diagnostic, Not a Ranking Lever</h2>
      <p>Keyword density — the percentage a term occupies of your total word count — was once a favoured way to game search rankings. Modern Google ignores raw frequency and looks for topical coherence, entities, and how naturally a topic is covered. So why look at density at all? Because it's an excellent <em>diagnostic</em>: a quick way to see what a page is actually about, and a fast way to flag accidental keyword stuffing.</p>

      <p>According to <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google's Helpful Content guidelines</a>, focusing on creating genuinely useful content is more important than optimizing for keyword frequency. Our <strong>Keyword Density Checker</strong> helps you analyze your content's keyword usage to ensure it's natural and focused.</p>

      <h2>What This Tool Measures</h2>

      <h3>Core Metrics</h3>
      <ul>
        <li><strong>Total Words:</strong> Total word count in the analyzed content</li>
        <li><strong>Without Stopwords:</strong> Word count after removing common stopwords</li>
        <li><strong>Unique Words:</strong> Number of distinct words used</li>
        <li><strong>Lexical Diversity:</strong> Ratio of unique words to total words</li>
      </ul>

      <h3>Phrase Analysis</h3>
      <ul>
        <li><strong>Unigrams:</strong> Individual word frequency and density</li>
        <li><strong>Bigrams:</strong> Two-word phrase frequency and density</li>
        <li><strong>Trigrams:</strong> Three-word phrase frequency and density</li>
      </ul>

      <h2>Why Keyword Density Matters for SEO</h2>

      <h3>1. Understanding Topic Focus</h3>
      <p>Keyword density helps you understand what a page is actually about. The most frequent words and phrases reveal the core topics and themes. This is essential for <strong>mobile SEO</strong> and creating <strong>mobile-friendly websites</strong> that clearly communicate their purpose.</p>

      <h3>2. Detecting Keyword Stuffing</h3>
      <p>Excessive keyword density (above 2-3%) can indicate keyword stuffing, which violates <a href="https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines#keyword-stuffing" target="_blank" rel="noopener noreferrer">Google's Webmaster Guidelines</a>. Our <strong>Keyword Density Checker</strong> helps you spot over-optimization before it hurts your rankings.</p>

      <h3>3. Competitor Analysis</h3>
      <p>Analyze competitor content to understand which keywords and phrases they emphasize. This helps you identify content gaps and opportunities. Use our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive competitor analysis.</p>

      <h2>What Healthy Keyword Density Looks Like</h2>
      <p>For most editorial content the primary keyword should appear at 0.5–1.5% density — roughly one mention every 100–200 words. Bigrams and trigrams (two- and three-word phrases) are usually more revealing than single words: a page about "machine learning" should have "machine learning" as a top bigram, not just "learning" or "machine" in isolation.</p>

      <p>According to <a href="https://www.semrush.com/blog/keyword-density/" target="_blank" rel="noopener noreferrer">Semrush</a>, the optimal keyword density for most content is between 1-2%. However, focus on natural language and comprehensive coverage rather than hitting specific percentages.</p>

      <h2>Stopwords Change Everything</h2>
      <p>Without filtering stopwords ("the, of, and"), every page looks like it's about "the". We exclude them by default. Toggle them back on if you're analysing for plagiarism or style. Stopwords are common words that don't carry significant meaning but appear frequently in natural language.</p>

      <p>For <strong>mobile-friendly websites</strong>, proper stopword handling is crucial because mobile users often scan content quickly. Our tool helps you identify the truly meaningful keywords in your content.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Text Mode (Paste Content)</h3>
      <p>Paste a draft to see what your editor weights. This is perfect for content writers who want to analyze their keyword usage before publishing. The tool shows you which words and phrases you're emphasizing most.</p>

      <h3>URL Mode (Fetch Page)</h3>
      <p>Fetch a competitor's URL to learn which phrases they're emphasising — then write better and more naturally. Aim for the top trigrams to actually describe the topic in plain English; if they don't, your content is probably unfocused.</p>

      <h2>Optimizing Your Keyword Strategy for SEO</h2>

      <h3>1. Use Keywords Naturally</h3>
      <p>Write for users first, search engines second. Keywords should flow naturally within your content. Forced keyword insertion creates poor user experience and can trigger spam filters. <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google's Helpful Content guidelines</a> emphasize natural language use.</p>

      <h3>2. Focus on Semantic Relevance</h3>
      <p>Modern Google uses natural language processing to understand topics. Include related terms, synonyms, and variations (LSI keywords) to demonstrate comprehensive topic coverage. Our <a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> can help you ensure sufficient depth.</p>

      <h3>3. Optimize Heading Structure</h3>
      <p>Include keywords in your headings (H1, H2, H3) to signal content hierarchy. Our tool shows H1/H2 counts to help you audit your structure. Use our <a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> for comprehensive page optimization.</p>

      <h3>4. Use Keyword Variations</h3>
      <p>Incorporate different keyword variations and long-tail phrases. This improves <strong>mobile SEO</strong> by matching various search queries. Our <strong>Keyword Density Checker</strong> helps you identify which variations you're using.</p>

      <h2>Common Keyword Issues and Solutions</h2>

      <h3>1. Keyword Stuffing</h3>
      <p><strong>The Problem:</strong> Excessive keyword frequency above 2-3% density.</p>
      <p><strong>The Fix:</strong> Reduce keyword frequency, use synonyms, and focus on natural language. Use our <strong>Keyword Density Checker</strong> to monitor improvements.</p>

      <h3>2. Low Keyword Density</h3>
      <p><strong>The Problem:</strong> Primary keywords appear too infrequently (below 0.5%).</p>
      <p><strong>The Fix:</strong> Incorporate keywords more naturally, especially in headings and early paragraphs. Ensure important topics are adequately covered.</p>

      <h3>3. Inconsistent Topic Focus</h3>
      <p><strong>The Problem:</strong> Top keywords and phrases don't match the intended topic.</p>
      <p><strong>The Fix:</strong> Review your content for focus and clarity. Use our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive analysis.</p>

      <h2>Analyzing Bigrams and Trigrams</h2>
      <p>Bigrams and trigrams (two- and three-word phrases) are often more revealing than single words. They show the natural phrases your content emphasizes. For example:</p>
      <ul>
        <li><strong>Unigram:</strong> "learning" — could be about many topics</li>
        <li><strong>Bigram:</strong> "machine learning" — clearly about AI</li>
        <li><strong>Trigram:</strong> "machine learning algorithms" — even more specific</li>
      </ul>
      <p>Using our <strong>Keyword Density Checker</strong>, you can identify which phrases are most prominent and ensure they align with your content goals.</p>

      <h2>Monitoring Keyword Usage Over Time</h2>
      <p>Regular keyword analysis with our <strong>Keyword Density Checker</strong> helps you:</p>
      <ul>
        <li>Track keyword usage patterns in your content</li>
        <li>Identify over-optimized pages that may need revision</li>
        <li>Discover content gaps and opportunities</li>
        <li>Maintain natural keyword distribution</li>
        <li>Optimize for <strong>mobile-friendly websites</strong></li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> for comprehensive content optimization.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is the Keyword Density Checker?</h3>
      <p>The <strong>Keyword Density Checker</strong> is a tool that analyzes content to identify the most frequently used words and phrases. It shows keyword frequency, density percentages, and provides insights into topic focus and natural language usage.</p>

      <h3>What is the ideal keyword density for SEO?</h3>
      <p>For most content, aim for 0.5-1.5% density for primary keywords. However, focus on natural language and comprehensive topic coverage rather than hitting specific percentages. <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google</a> emphasizes quality over keyword frequency.</p>

      <h3>What are stopwords and why remove them?</h3>
      <p>Stopwords are common words like "the," "and," "of" that appear frequently but don't carry significant meaning. Removing them reveals the true keywords in your content. Our tool excludes stopwords by default for clearer analysis.</p>

      <h3>What are bigrams and trigrams?</h3>
      <p><strong>Bigrams</strong> are two-word phrases (e.g., "machine learning"). <strong>Trigrams</strong> are three-word phrases (e.g., "machine learning algorithms"). These are often more revealing than individual words for understanding topic focus.</p>

      <h3>How do I avoid keyword stuffing?</h3>
      <p>Keep keyword density under 2-3% for primary keywords. Use synonyms and variations (LSI keywords). Write naturally for users first. Our <strong>Keyword Density Checker</strong> helps you monitor and avoid over-optimization.</p>

      <h3>What is lexical diversity?</h3>
      <p>Lexical diversity is the ratio of unique words to total words. Higher diversity indicates richer, more varied vocabulary. Lower diversity may indicate repetitive content or excessive keyword usage.</p>

      <h2>Conclusion</h2>
      <p>Keyword density analysis is a valuable diagnostic tool for understanding content focus, detecting over-optimization, and optimizing for <strong>mobile SEO</strong>. Our <strong>Keyword Density Checker</strong> provides the detailed analysis you need to create content that is natural, focused, and user-friendly.</p>

      <p>Whether you're writing blog posts, product descriptions, or landing pages, understanding your keyword usage is crucial for creating effective, user-focused content. Use our <strong>Keyword Density Checker</strong> as part of your content creation process to ensure your content is optimized for both users and search engines.</p>

      <p>Start analyzing your keyword usage today—use our <strong>Keyword Density Checker</strong> to understand your content's focus, identify improvements, and create content that ranks and resonates.</p>

      <h3>Related Tools for Comprehensive Content Optimization</h3>
      <p>For a complete content optimization strategy, use these tools alongside our <strong>Keyword Density Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Comprehensive content analysis</li>
        <li><a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> - Measure content length and readability</li>
        <li><a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> - Optimize metadata</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Inspector</a> - Optimize social sharing</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Optimize URL forwarding</li>
      </ul>

      <p>For further reading on keyword optimization and SEO, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google Helpful Content Guidelines</a></li>
        <li><a href="https://www.semrush.com/blog/keyword-density/" target="_blank" rel="noopener noreferrer">Semrush Keyword Density Guide</a></li>
        <li><a href="https://moz.com/learn/seo/keyword-density" target="_blank" rel="noopener noreferrer">Moz Keyword Density Guide</a></li>
        <li><a href="https://yoast.com/keyword-density/" target="_blank" rel="noopener noreferrer">Yoast Keyword Density Guide</a></li>
        <li><a href="https://backlinko.com/keyword-density" target="_blank" rel="noopener noreferrer">Backlinko Keyword Density Study</a></li>
      </ul>
    </article>
  );
}