"use client";
import { useState } from 'react';

export default function KeywordDensityChecker() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 600));
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','was','are','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','this','that','these','those','i','we','you','he','she','they','it','its','my','your','his','her','our','their']);
    const freq = {};
    words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    setResult({ totalWords: words.length, uniqueWords: Object.keys(freq).length, topKeywords: sorted });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Keyword Density Checker</h1></div>
      <div className="tool-card">
        <textarea
          placeholder="Paste your content here to analyze keyword density..."
          style={{ width: '100%', maxWidth: '780px', minHeight: '160px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button className="check-btn" onClick={handleCheck} disabled={loading || !text.trim()}>{loading ? 'Analyzing...' : 'Analyze Keywords'}</button>
        <p className="tool-description">Paste any text or article content to see the top keywords, their frequency, and density percentage.</p>
        {result && (
          <div className="result-box">
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Total Words</span><span className="result-value">{result.totalWords}</span></div>
              <div className="result-item"><span className="result-label">Unique Keywords</span><span className="result-value">{result.uniqueWords}</span></div>
            </div>
            <h4 style={{ color: 'var(--text-primary)', margin: '0.75rem 0 0.5rem' }}>Top Keywords</h4>
            {result.topKeywords.map(([kw, count], i) => (
              <div key={kw} className="result-item">
                <span className="result-label">#{i + 1} {kw}</span>
                <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{count}x</span>
                  <span className="result-value">{((count / result.totalWords) * 100).toFixed(2)}%</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Keyword Density: What It Is, Why It Still Matters, and How Not to Obsess Over It</h2>
          <p>Keyword density is the percentage of times a specific word or phrase appears in a piece of content relative to the total word count. If you write a 1,000-word article and your target keyword appears 10 times, the density for that keyword is 1%. It's a simple concept, and for a long period in SEO history — roughly the late 1990s through the early 2010s — it was treated as a primary ranking signal. Stuff your keyword in as many times as possible, the thinking went, and you'd rank higher. That era is long over, but keyword density as a concept still matters — just in a more nuanced way.</p>
          <h3>The Death of Keyword Stuffing</h3>
          <p>Google's Panda algorithm update in 2011 was specifically designed to target low-quality content, and keyword stuffing was one of its primary targets. Pages that repeated the same keyword dozens of times in clearly unnatural ways were penalized or removed from search results entirely. The algorithm forced a shift toward writing for humans rather than search engines — a shift that, in retrospect, was long overdue.</p>
          <p>Today, stuffing keywords is not just ineffective — it's actively harmful. Google's systems are sophisticated enough to detect when keyword repetition reads as spammy or manipulative, and they'll suppress that content accordingly. More importantly, readers notice too. Content that feels awkwardly repetitive is off-putting and increases bounce rates.</p>
          <h3>What a Healthy Keyword Density Looks Like</h3>
          <p>There's no universally agreed-upon "perfect" keyword density, and Google has said as much. Generally, an organic density somewhere in the range of 1-2% for a primary keyword tends to feel natural in most content. Some SEOs suggest 0.5-1.5% as a conservative target. But the honest answer is: write naturally, include your keyword where it makes sense, and don't count occurrences manually. If it reads well to a human being, it's probably fine.</p>
          <p>What matters far more than density is whether you're covering the topic comprehensively. Google evaluates topical depth by looking at the related terms, entities, and concepts present in your content — not just how many times the exact target keyword appears. This concept, sometimes called TF-IDF (Term Frequency-Inverse Document Frequency), means you should think about naturally incorporating semantically related terms rather than repeating the same phrase over and over.</p>
          <h3>Using Keyword Density Analysis Productively</h3>
          <p>The best use of a keyword density checker isn't to hit a specific target number — it's to audit for extremes. If a keyword appears only once in a 2,000-word article, you might want to work it in a few more times naturally. If a keyword appears 30 times in 500 words, that's a red flag worth fixing. Our Keyword Density Checker also shows you which other words are appearing most frequently in your content, which is genuinely useful for identifying unintentional repetitiveness and for making sure you're actually covering the topic you intend to rank for.</p>
        </article>
      </div>
    </div>
  );
}
