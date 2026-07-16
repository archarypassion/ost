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
      <h2>Word Count: Why Length Matters in SEO (and the Way It Doesn't)</h2>
      <p>Google has said many times that there's no minimum word count, yet pages ranking for competitive informational queries are reliably longer and more comprehensive than the rest. The relationship is correlative, not causal — long content ranks because depth signals authority, not because Google rewards length.</p>

      <p>According to <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google's Helpful Content guidelines</a>, creating content that is genuinely useful to users is more important than hitting arbitrary word counts. Our <strong>Word Count Checker</strong> helps you analyze your content's length, readability, and structure to optimize for both users and search engines.</p>

      <h2>Why Word Count Matters for SEO</h2>

      <h3>1. Content Depth and Authority</h3>
      <p>Longer, comprehensive content tends to rank better for informational queries because it demonstrates depth of knowledge. <a href="https://backlinko.com/content-length-ranking" target="_blank" rel="noopener noreferrer">Research by Backlinko</a> shows that the average first-page result on Google contains 1,447 words. However, this is correlative, not causal — depth signals authority.</p>

      <h3>2. Mobile SEO and User Experience</h3>
      <p>For <strong>mobile-friendly websites</strong>, content needs to be scannable and digestible. Long blocks of text can overwhelm mobile users. Use headings, bullet points, and short paragraphs to improve readability. Our <a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> can help ensure your content is optimized for mobile devices.</p>

      <h3>3. Match Length to Intent</h3>
      <p>For deep informational queries ("how does X work"), top results are commonly 2,000–4,000 words. For transactional queries ("buy size 10 sneakers"), a tight 300-word product page outranks a 2,000-word essay. For local queries, concise wins. Write to satisfy the user's task, not to hit a word target.</p>

      <h2>What This Tool Measures</h2>

      <h3>Core Metrics</h3>
      <ul>
        <li><strong>Word Count:</strong> Total number of words in your content</li>
        <li><strong>Character Count:</strong> Total characters (with and without spaces)</li>
        <li><strong>Sentence Count:</strong> Number of complete sentences</li>
        <li><strong>Paragraph Count:</strong> Number of paragraphs in your content</li>
        <li><strong>Syllable Count:</strong> Total syllables for readability analysis</li>
      </ul>

      <h3>Advanced Metrics</h3>
      <ul>
        <li><strong>Average Word Length:</strong> Average characters per word</li>
        <li><strong>Average Sentence Length:</strong> Average words per sentence</li>
        <li><strong>Long Words (7+):</strong> Count of longer words that may affect readability</li>
        <li><strong>Very Long Words (12+):</strong> Count of very long words</li>
        <li><strong>Reading Time:</strong> Estimated reading time at 230 words per minute</li>
        <li><strong>Speaking Time:</strong> Estimated speaking time at 130 words per minute</li>
      </ul>

      <h2>Readability Matters as Much as Length</h2>
      <p>Flesch Reading Ease scores text from 0 (very hard) to 100 (very easy). Most general-audience web copy targets 60–70. The Flesch–Kincaid grade level estimates the U.S. school grade required to understand the text — most consumer content is best at grade 7–9. We compute both above so you can spot pages that are accidentally academic.</p>

      <p>According to <a href="https://www.nngroup.com/articles/readability/" target="_blank" rel="noopener noreferrer">Nielsen Norman Group</a>, users typically read only 20-28% of the words on a page. This makes readability and scannability crucial for <strong>mobile SEO</strong> and user engagement. Our <strong>Word Count Checker</strong> helps you optimize both length and readability.</p>

      <h2>How to Use This Tool Effectively</h2>

      <h3>Text Mode (Paste Content)</h3>
      <p>Paste your draft for live counts as you type. This is perfect for content writers who want to track their word count and readability in real-time. The tool updates instantly as you type, showing live word and character counts.</p>

      <h3>URL Mode (Fetch Page)</h3>
      <p>Enter any URL to see how many words your published page actually has — because what your CMS shows in the editor is rarely what gets rendered to crawlers after templates, navigation, and footers strip in. This is essential for <strong>mobile-friendly websites</strong> where content rendering can vary.</p>

      <h2>Optimizing Your Content for Mobile and SEO</h2>

      <h3>1. Use Clear Heading Structure</h3>
      <p>Proper heading structure (H1, H2, H3) improves readability and helps search engines understand your content hierarchy. Our tool shows H1/H2 counts to help you audit your structure. Use our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> for comprehensive content analysis.</p>

      <h3>2. Write for Your Audience</h3>
      <p>Consider your target audience's reading level. Consumer content should aim for grade 7-9 readability (Flesch score 60-70). Technical content may require higher reading levels. Our tool helps you gauge your content's accessibility.</p>

      <h3>3. Use Subheadings and Lists</h3>
      <p>Break up long content with descriptive subheadings and bullet points. This improves scannability and <strong>mobile SEO</strong>. According to <a href="https://www.semrush.com/blog/readability-score/" target="_blank" rel="noopener noreferrer">Semrush</a>, content with good readability scores tends to rank higher.</p>

      <h3>4. Monitor Reading Time</h3>
      <p>Consider your content's reading time. Most users have limited time, so keep content concise while maintaining depth. Our tool shows estimated reading time to help you calibrate content length.</p>

      <h2>Best Practices for Content Length and Readability</h2>

      <h3>1. Match Length to Search Intent</h3>
      <p>Research top-ranking content for your target keywords to understand appropriate length. Use our <a href="https://opensourcetools.online/tools/keyword-density" target="_blank" rel="noopener noreferrer">Keyword Density Tool</a> to optimize keyword usage within your content.</p>

      <h3>2. Aim for Grade 7-9 Readability</h3>
      <p>Most consumer content performs best at this reading level. Our <strong>Word Count Checker</strong> provides Flesch scores to help you calibrate your writing.</p>

      <h3>3. Structure with Headings</h3>
      <p>Use descriptive headings to break up content and improve navigation. This is especially important for <strong>mobile-friendly websites</strong> where users scroll quickly.</p>

      <h3>4. Optimize for Mobile Reading</h3>
      <p>Use short paragraphs (2-3 sentences), bullet points, and clear headings. Our <a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> can help ensure your content displays properly on all devices.</p>

      <h2>Common Content Issues and Solutions</h2>

      <h3>1. Too Long, Difficult to Read</h3>
      <p><strong>The Problem:</strong> Content is too wordy or academic for the target audience.</p>
      <p><strong>The Fix:</strong> Shorten sentences, use simpler vocabulary, and break up long paragraphs. Aim for Flesch scores above 60 for consumer content.</p>

      <h3>2. Too Short, Lacks Depth</h3>
      <p><strong>The Problem:</strong> Content doesn't fully address the topic.</p>
      <p><strong>The Fix:</strong> Research related topics, answer common questions, and provide examples. Use our <a href="https://opensourcetools.online/tools/word-count" target="_blank" rel="noopener noreferrer">Word Count Checker</a> to track improvements.</p>

      <h3>3. Poor Heading Structure</h3>
      <p><strong>The Problem:</strong> Headings don't follow proper hierarchy or are missing.</p>
      <p><strong>The Fix:</strong> Use H1 for main title, H2 for major sections, H3 for subsections. Our tool shows heading counts to help you audit.</p>

      <h2>Monitoring Content Quality Over Time</h2>
      <p>Regular content analysis with our <strong>Word Count Checker</strong> helps you:</p>
      <ul>
        <li>Track content length and readability improvements</li>
        <li>Ensure new content meets quality standards</li>
        <li>Identify content that may need updating</li>
        <li>Maintain consistency across your site</li>
        <li>Optimize for <strong>mobile-friendly websites</strong></li>
      </ul>

      <p>Combine with our <a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> and <a href="https://opensourcetools.online/tools/keyword-density" target="_blank" rel="noopener noreferrer">Keyword Density Tool</a> for comprehensive content optimization.</p>

      <h2>Frequently Asked Questions (FAQs)</h2>

      <h3>What is the Word Count Checker?</h3>
      <p>The <strong>Word Count Checker</strong> is a tool that analyzes text content, providing word count, character count, sentence count, paragraph count, syllable count, reading time, speaking time, and readability scores (Flesch Reading Ease and Flesch-Kincaid Grade).</p>

      <h3>Is there a minimum word count for SEO?</h3>
      <p>Google has stated there's no minimum word count. However, content that fully answers user questions tends to be longer. Focus on quality and comprehensiveness rather than hitting arbitrary word targets.</p>

      <h3>What is a good readability score?</h3>
      <p>For most consumer content, aim for Flesch Reading Ease scores of 60-70 (grade 7-9). This is considered "Standard" readability. Technical content may have lower scores (50-60), while children's content aims for higher scores (80-90).</p>

      <h3>How is reading time calculated?</h3>
      <p>Reading time is calculated at 230 words per minute, which is the average adult reading speed. Speaking time is calculated at 130 words per minute, the average speech rate.</p>

      <h3>How do I improve my content's readability?</h3>
      <p>Use shorter sentences, simpler vocabulary, active voice, and break up long paragraphs. Use headings and lists to improve scannability. Our <strong>Word Count Checker</strong> helps you track improvements.</p>

      <h3>What's the difference between Flesch Reading Ease and Flesch-Kincaid Grade?</h3>
      <p>Flesch Reading Ease scores text on a 0-100 scale (higher = easier). Flesch-Kincaid Grade estimates the U.S. school grade level needed to understand the text (lower = easier). Both use similar formulas but provide different perspectives on readability.</p>

      <h2>Conclusion</h2>
      <p>Word count and readability are essential factors in content quality, <strong>mobile SEO</strong>, and user engagement. Our <strong>Word Count Checker</strong> provides the detailed analysis you need to optimize your content for both users and search engines.</p>

      <p>Whether you're writing blog posts, product descriptions, or landing pages, understanding your content's length, readability, and structure is crucial for success. Use our <strong>Word Count Checker</strong> as part of your content creation process to ensure your content is accessible, engaging, and optimized for search engines.</p>

      <p>Start optimizing your content today—use our <strong>Word Count Checker</strong> to analyze your text, identify improvements, and create content that ranks and resonates.</p>

      <h3>Related Tools for Comprehensive Content Optimization</h3>
      <p>For a complete content optimization strategy, use these tools alongside our <strong>Word Count Checker</strong>:</p>
      <ul>
        <li><a href="https://opensourcetools.online/tools/on-page-seo" target="_blank" rel="noopener noreferrer">On-Page SEO Checker</a> - Comprehensive content analysis</li>
        <li><a href="https://opensourcetools.online/tools/keyword-density" target="_blank" rel="noopener noreferrer">Keyword Density Tool</a> - Optimize keyword usage</li>
        <li><a href="https://opensourcetools.online/tools/mobile-friendly" target="_blank" rel="noopener noreferrer">Mobile Friendly Test</a> - Ensure mobile optimization</li>
        <li><a href="https://opensourcetools.online/tools/page-speed" target="_blank" rel="noopener noreferrer">Page Speed Checker</a> - Measure load performance</li>
        <li><a href="https://opensourcetools.online/tools/meta-tags" target="_blank" rel="noopener noreferrer">Meta Tags Analyzer</a> - Optimize metadata</li>
        <li><a href="https://opensourcetools.online/tools/open-graph" target="_blank" rel="noopener noreferrer">Open Graph Inspector</a> - Optimize social sharing</li>
        <li><a href="https://opensourcetools.online/tools/schema-checker" target="_blank" rel="noopener noreferrer">Schema Validator</a> - Implement structured data</li>
        <li><a href="https://opensourcetools.online/tools/redirect-checker" target="_blank" rel="noopener noreferrer">Redirect Checker</a> - Optimize URL forwarding</li>
        <li><a href="https://opensourcetools.online/tools/canonical-url" target="_blank" rel="noopener noreferrer">Canonical URL Checker</a> - Prevent duplicate content</li>
      </ul>

      <p>For further reading on content optimization and readability, consult these authoritative resources:</p>
      <ul>
        <li><a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer">Google Helpful Content Guidelines</a></li>
        <li><a href="https://www.nngroup.com/articles/readability/" target="_blank" rel="noopener noreferrer">Nielsen Norman Group Readability Research</a></li>
        <li><a href="https://backlinko.com/content-length-ranking" target="_blank" rel="noopener noreferrer">Backlinko Content Length Study</a></li>
        <li><a href="https://www.semrush.com/blog/readability-score/" target="_blank" rel="noopener noreferrer">Semrush Readability Guide</a></li>
        <li><a href="https://yoast.com/readability-analysis/" target="_blank" rel="noopener noreferrer">Yoast Readability Analysis</a></li>
      </ul>
    </article>
  );
}