"use client";
import { useState } from 'react';

export default function WordCountChecker() {
  const [text, setText] = useState('');
  const result = (() => {
    if (!text.trim()) return null;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const readingTime = Math.ceil(words.length / 238);
    return { words: words.length, chars, charsNoSpace, sentences, paragraphs, readingTime };
  })();

  return (
    <div>
      <div className="tool-header"><h1>Word Count Checker</h1></div>
      <div className="tool-card">
        <textarea
          placeholder="Paste or type your content here..."
          style={{ width: '100%', maxWidth: '780px', minHeight: '180px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <p className="tool-description">Count words, characters, sentences, paragraphs, and estimated reading time for any text in real-time.</p>
        {result && (
          <div className="result-box">
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Words</span><span className="result-value" style={{ color: 'var(--accent-color)', fontSize: '1.1rem', fontWeight: 700 }}>{result.words.toLocaleString()}</span></div>
              <div className="result-item"><span className="result-label">Characters (with spaces)</span><span className="result-value">{result.chars.toLocaleString()}</span></div>
              <div className="result-item"><span className="result-label">Characters (no spaces)</span><span className="result-value">{result.charsNoSpace.toLocaleString()}</span></div>
              <div className="result-item"><span className="result-label">Sentences</span><span className="result-value">{result.sentences}</span></div>
              <div className="result-item"><span className="result-label">Paragraphs</span><span className="result-value">{result.paragraphs}</span></div>
              <div className="result-item"><span className="result-label">Reading Time</span><span className="result-value">{result.readingTime} min</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Word Count: Why Length Matters in SEO (But Not in the Way Most People Think)</h2>
          <p>Ask ten SEOs whether word count is a ranking factor and you'll get ten different answers. The truth is nuanced enough that both the "yes" and "no" camps can point to evidence supporting their position. Google has publicly stated there's no minimum word count requirement, yet numerous correlation studies consistently show that top-ranking pages for competitive keywords tend to be longer and more comprehensive than lower-ranking ones. So what's actually going on?</p>
          <p>The relationship between word count and rankings isn't causal — longer content doesn't rank better because it has more words. It ranks better because more words, done right, signal topical depth and authority. A 3,000-word article that thoroughly covers a subject from multiple angles, anticipates reader questions, and provides genuinely useful detail is inherently more valuable than a 400-word piece that scratches the surface. The word count is a byproduct of quality, not a cause of it.</p>
          <h3>Word Count Benchmarks by Content Type</h3>
          <p>Different content types have different expectations, and what constitutes "enough" varies considerably by context. For highly competitive informational queries — "how does machine learning work," "what is content marketing" — the top-ranking pages are frequently 2,000-4,000 words. For transactional queries — "buy red sneakers size 10" — a well-structured 300-word product page can outrank a bloated 2,000-word essay. For local queries — "dentist near me" — a concise, well-structured page with clear contact information often performs best.</p>
          <p>The key is matching content length to user intent. When someone wants a quick answer, deliver it concisely. When someone wants a deep dive, give them depth. The mistake many content creators make is writing to a target word count rather than writing to satisfy the actual information need behind the search query.</p>
          <h3>Reading Time as a Proxy for Engagement</h3>
          <p>Our Word Count Checker calculates estimated reading time based on an average adult reading speed of 238 words per minute (a commonly cited research benchmark). Reading time is a useful metric for understanding your content from the reader's perspective. A 6-minute read is appropriate for an in-depth guide. A 30-second read is appropriate for an FAQ answer. Knowing your reading time helps you structure your content correctly — if a guide reads in 90 seconds but you intended it to be comprehensive, it's probably too thin.</p>
          <h3>Character Count for Platform-Specific Optimization</h3>
          <p>Word count isn't the only metric worth tracking. Character count becomes critical when writing meta descriptions (155-160 character limit), page titles (50-60 characters), social media posts (280 characters for X/Twitter, 2,200 for Instagram captions), and email subject lines (40-50 characters for optimal mobile display). Our Word Count Checker shows both raw character count and character count excluding spaces, which is useful for platforms that use one metric or the other in their limits.</p>
          <h3>Thin Content: The Content Quality Threshold</h3>
          <p>While there's no hard minimum, very short pages — typically under 200-300 words — are often classified by Google as "thin content" if they don't add significant unique value. Thin content was specifically targeted by Google's Panda algorithm and continues to be a quality signal in Google's evaluation of site quality. If you have many short pages on your site, it may be worth consolidating them into more comprehensive resources or expanding them with genuinely useful additional information. Use our Word Count Checker as a first-pass tool to identify pages that might be candidates for expansion.</p>
        </article>
      </div>
    </div>
  );
}
