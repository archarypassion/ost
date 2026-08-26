"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Copy, Check, Sparkles, Clock, FileText } from 'lucide-react';

const SAMPLE_TEXT = `Search engine optimization is the process of improving the quality and quantity of website traffic to a webpage from search engines. SEO targets unpaid traffic rather than direct traffic or paid traffic. Technical SEO involves auditing indexability, verifying metadata, optimizing page speed, and ensuring structured data markup is valid. When search engines crawl a website, clean content hierarchy and accessible language help crawlers index content accurately.`;

function countSyllablesInWord(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  w = w.replace(/^y/, '');
  const matches = w.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export default function ReadabilityCheckerPage() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => {
    const raw = text.trim();
    if (!raw) return null;

    const words = raw.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    if (wordCount === 0) return null;

    const sentences = raw.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = Math.max(1, sentences.length);
    const charCount = raw.replace(/\s+/g, '').length;

    let totalSyllables = 0;
    let complexWords = 0;

    for (const w of words) {
      const syl = countSyllablesInWord(w);
      totalSyllables += syl;
      if (syl >= 3) complexWords++;
    }

    const wordsPerSentence = wordCount / sentenceCount;
    const syllablesPerWord = totalSyllables / wordCount;

    // 1. Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const fleschEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

    // 2. Flesch-Kincaid Grade Level: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    const fleschKincaid = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

    // 3. Gunning Fog Index: 0.4 * ((words/sentences) + 100 * (complexWords/words))
    const gunningFog = 0.4 * (wordsPerSentence + 100 * (complexWords / wordCount));

    // 4. Coleman-Liau: 0.0588 * L - 0.296 * S - 15.8 (L = avg letters per 100 words, S = avg sentences per 100 words)
    const L = (charCount / wordCount) * 100;
    const S = (sentenceCount / wordCount) * 100;
    const colemanLiau = 0.0588 * L - 0.296 * S - 15.8;

    // 5. Automated Readability Index (ARI): 4.71 * (chars/words) + 0.5 * (words/sentences) - 21.43
    const ari = 4.71 * (charCount / wordCount) + 0.5 * wordsPerSentence - 21.43;

    // Reading & Speaking Time
    const readingTimeMins = (wordCount / 200).toFixed(1);
    const speakingTimeMins = (wordCount / 130).toFixed(1);

    return {
      wordCount,
      sentenceCount,
      charCount,
      totalSyllables,
      complexWords,
      complexPercentage: ((complexWords / wordCount) * 100).toFixed(1),
      readingTimeMins,
      speakingTimeMins,
      fleschEase: Math.max(0, Math.min(100, parseFloat(fleschEase.toFixed(1)))),
      fleschKincaid: Math.max(1, parseFloat(fleschKincaid.toFixed(1))),
      gunningFog: Math.max(1, parseFloat(gunningFog.toFixed(1))),
      colemanLiau: Math.max(1, parseFloat(colemanLiau.toFixed(1))),
      ari: Math.max(1, parseFloat(ari.toFixed(1))),
    };
  }, [text]);

  const getFleschLabel = (score) => {
    if (score >= 90) return { label: 'Very Easy (5th Grade)', color: '#10B981' };
    if (score >= 80) return { label: 'Easy (6th Grade)', color: '#10B981' };
    if (score >= 70) return { label: 'Fairly Easy (7th Grade)', color: '#3B82F6' };
    if (score >= 60) return { label: 'Standard Plain English (8th–9th Grade)', color: '#3B82F6' };
    if (score >= 50) return { label: 'Fairly Difficult (High School)', color: '#F59E0B' };
    if (score >= 30) return { label: 'Difficult (College Level)', color: '#EF4444' };
    return { label: 'Very Confusing (Graduate Level)', color: '#EF4444' };
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Advanced Readability Score Analyzer</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Analyze text readability using Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog Index,
          Coleman-Liau, and ARI algorithms. Optimize blog articles and marketing copy for target audiences.
        </p>

        {/* Input Textarea */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
            <label style={{ fontWeight: 600 }}>Paste Article / Content Copy:</label>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => setText(SAMPLE_TEXT)}
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            >
              Load Sample
            </button>
          </div>
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here to evaluate readability..."
            className="search-input"
            style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.9375rem', lineHeight: 1.55 }}
          />
        </div>

        {/* Results Grid */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top Score Banner */}
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: `4px solid ${getFleschLabel(analysis.fleschEase).color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                    Primary Readability Verdict
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: getFleschLabel(analysis.fleschEase).color, margin: '0.25rem 0' }}>
                    {analysis.fleschEase} / 100
                  </div>
                  <strong style={{ fontSize: '1rem' }}>{getFleschLabel(analysis.fleschEase).label}</strong>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Reading Time:</span>
                    <strong>~{analysis.readingTimeMins} min</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Speaking Time:</span>
                    <strong>~{analysis.speakingTimeMins} min</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Complex Words:</span>
                    <strong>{analysis.complexPercentage}%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Readability Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Flesch-Kincaid Grade</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--lv2-blue-light)' }}>Grade {analysis.fleschKincaid}</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>US School Grade Level</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gunning Fog Index</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--lv2-blue-light)' }}>{analysis.gunningFog}</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Years of formal education</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Coleman-Liau Index</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--lv2-blue-light)' }}>Grade {analysis.colemanLiau}</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Letter/sentence length index</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Automated Readability (ARI)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--lv2-blue-light)' }}>{analysis.ari}</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Real-time character index</p>
              </div>
            </div>

            {/* Document Statistics */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.8125rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Words: </span><strong>{analysis.wordCount}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Sentences: </span><strong>{analysis.sentenceCount}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Characters (no spaces): </span><strong>{analysis.charCount}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Total Syllables: </span><strong>{analysis.totalSyllables}</strong></div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>The Mathematics of Content Readability Formulas</h2>
      <p>
        Readability scoring algorithms analyze sentence length, syllable frequency, and word complexity to calculate the educational grade level required for an average reader to understand written text on the first pass.
      </p>

      <h2>Core Readability Algorithms Compared</h2>

      <ul>
        <li><strong>Flesch Reading Ease:</strong> Scores text on a 0–100 scale based on words per sentence and syllables per word. Scores between <strong>60 and 70</strong> represent standard English accessible to 80% of readers.</li>
        <li><strong>Flesch-Kincaid Grade Level:</strong> Converts readability into United States school grade levels (e.g. a score of 8.0 indicates an eighth-grade reading level).</li>
        <li><strong>Gunning Fog Index:</strong> Focuses heavily on &quot;complex words&quot; (words containing three or more syllables), commonly used in technical documentation and journalism.</li>
        <li><strong>Coleman-Liau Index:</strong> Relies strictly on character counts rather than syllables, providing high accuracy for digital web content.</li>
      </ul>

      <h2>Readability Targets for SEO &amp; Organic Rankings</h2>

      <p>
        Google search algorithms favor content that satisfies user intent quickly without friction:
      </p>
      <ul>
        <li><strong>Consumer Articles &amp; eCommerce:</strong> Aim for a Flesch Reading Ease of <strong>65–80</strong> (Grade 6–8).</li>
        <li><strong>B2B &amp; Software Documentation:</strong> Aim for a Flesch score of <strong>50–65</strong> (Grade 8–10).</li>
        <li><strong>Academic &amp; Legal:</strong> Scores below 40 are difficult for broad audiences to comprehend.</li>
      </ul>

      <h2>Content &amp; On-Page SEO Suite</h2>

      <p>
        Refine your content with our on-page writing tools:
      </p>
      <ul>
        <li><strong>Keyword Distribution:</strong> Measure phrase frequency using our <Link href="/tools/keyword-density">Keyword Density Checker</Link>.</li>
        <li><strong>Snippet Optimization:</strong> Craft titles and snippets with our <Link href="/tools/meta-description-generator">Meta Description Generator</Link>.</li>
        <li><strong>Word &amp; Sentence Auditing:</strong> Inspect raw metrics with our <Link href="/tools/word-count">Word Count Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Does readable content rank higher on Google?</h3>
      <p>
        Yes. Content with clear readability keeps visitors on page longer, reduces immediate bounces, and generates higher engagement signals that search engines reward.
      </p>

      <h3>How can I quickly improve a low readability score?</h3>
      <p>
        Break up long, compound sentences into two shorter sentences, replace multi-syllable jargon with simpler synonyms, and use bullet points to break up dense paragraphs.
      </p>

      <h3>Why do syllables matter in readability formulas?</h3>
      <p>
        Multi-syllabic words require greater cognitive processing time. Shorter words allow readers to scan and absorb technical concepts more efficiently.
      </p>
    </article>
  );
}
