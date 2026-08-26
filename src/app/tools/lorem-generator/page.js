"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Copy, Check, RefreshCw } from 'lucide-react';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'faucibus', 'ornare',
  'scelerisque', 'aliquam', 'purus', 'volutpat', 'dictum', 'mauris', 'integer',
  'gravida', 'placerat', 'habitant', 'senectus', 'netus', 'fames', 'egestas',
];

function generateSentence(minWords = 8, maxWords = 15) {
  const len = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const sentenceWords = [];
  for (let i = 0; i < len; i++) {
    const word = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    sentenceWords.push(word);
  }
  const str = sentenceWords.join(' ');
  return str.charAt(0).toUpperCase() + str.slice(1) + '.';
}

function generateParagraph(sentenceCount = 5) {
  const sentences = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(' ');
}

export default function LoremGeneratorPage() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState('paragraphs'); // 'paragraphs' | 'words' | 'sentences' | 'lists'
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [htmlFormat, setHtmlFormat] = useState('plain'); // 'plain' | 'html-p' | 'html-list'
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const generatedText = useMemo(() => {
    let result = '';

    if (type === 'paragraphs') {
      const paras = [];
      for (let i = 0; i < count; i++) {
        let p = generateParagraph();
        if (i === 0 && startWithLorem) {
          p = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + p;
        }
        if (htmlFormat === 'html-p') paras.push(`<p>${p}</p>`);
        else paras.push(p);
      }
      result = paras.join(htmlFormat === 'html-p' ? '\n\n' : '\n\n');
    } else if (type === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        if (i === 0 && startWithLorem && count >= 2) {
          words.push('Lorem', 'ipsum');
          i++;
        } else {
          words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
        }
      }
      result = words.join(' ');
    } else if (type === 'sentences') {
      const sents = [];
      for (let i = 0; i < count; i++) {
        let s = generateSentence();
        if (i === 0 && startWithLorem) {
          s = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        }
        sents.push(s);
      }
      result = sents.join(' ');
    } else if (type === 'lists') {
      const items = [];
      for (let i = 0; i < count; i++) {
        const item = generateSentence(4, 9).replace(/\.$/, '');
        items.push(htmlFormat === 'html-list' ? `  <li>${item}</li>` : `• ${item}`);
      }
      if (htmlFormat === 'html-list') {
        result = `<ul>\n${items.join('\n')}\n</ul>`;
      } else {
        result = items.join('\n');
      }
    }

    return result;
  }, [count, type, startWithLorem, htmlFormat, seed]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = generatedText.trim() ? generatedText.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="tool-header">
        <h1>Lorem Ipsum &amp; Placeholder Text Generator</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Generate custom dummy placeholder text by paragraphs, sentences, words, or HTML lists.
          Ideal for website wireframing, layout prototyping, and typography testing.
        </p>

        {/* Controls Toolbar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1.25rem' }}>
          {/* Quantity */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Count:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Unit Type:
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.875rem' }}
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
              <option value="lists">List Items</option>
            </select>
          </div>

          {/* HTML Format */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Format Markup:
            </label>
            <select
              value={htmlFormat}
              onChange={(e) => setHtmlFormat(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.875rem' }}
            >
              <option value="plain">Plain Text</option>
              <option value="html-p">HTML &lt;p&gt; Tags</option>
              <option value="html-list">HTML &lt;ul&gt; &lt;li&gt; List</option>
            </select>
          </div>

          {/* Regenerate Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => setSeed(seed + 1)}
              style={{ width: '100%', padding: '0.55rem', justifyContent: 'center' }}
            >
              <RefreshCw size={13} style={{ display: 'inline', marginRight: '4px' }} /> Regenerate
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
            />
            <span>Start with &quot;Lorem ipsum dolor sit amet...&quot;</span>
          </label>
        </div>

        {/* Output Box */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #EC4899' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {wordCount} words · {generatedText.length} characters
            </span>
            <button
              type="button"
              className="check-btn"
              onClick={handleCopy}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              {copied ? <Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          <textarea
            readOnly
            value={generatedText}
            rows={10}
            style={{ width: '100%', padding: '0.85rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: htmlFormat.startsWith('html') ? 'var(--font-mono, monospace)' : 'inherit', fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical', color: 'var(--text-primary)' }}
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
      <h2>Origins &amp; Purpose of Lorem Ipsum Placeholder Copy</h2>
      <p>
        Lorem Ipsum is standard dummy typesetting text used in printing, graphic design, and web development since the 1500s. Derived from sections 1.10.32 and 1.10.33 of Cicero&apos;s 45 BC philosophical treatise <em>De Finibus Bonorum et Malorum</em>, it simulates natural sentence length and letter frequency without conveying distracting semantic meaning.
      </p>

      <h2>Why Developers &amp; Designers Rely on Placeholder Text</h2>

      <ul>
        <li><strong>Prevents Content Bias:</strong> Real readable copy distracts stakeholders during UI/UX reviews; placeholder text directs focus strictly to visual layout, spacing, and typography hierarchy.</li>
        <li><strong>Simulates Natural Letter Distribution:</strong> Repeating phrases like <em>&quot;Content here, content here&quot;</em> fails to mimic natural English word lengths, producing misleading visual balance.</li>
        <li><strong>Responsive Layout Stress-Testing:</strong> Filling grid layouts with multi-paragraph dummy text reveals container overflow and line wrapping bugs early.</li>
      </ul>

      <h2>Synergies with Design &amp; Typography Tools</h2>

      <p>
        Explore our companion developer utilities:
      </p>
      <ul>
        <li><strong>Accessibility Contrast Audits:</strong> Verify text visibility using our <Link href="/tools/color-contrast">WCAG Color Contrast Checker</Link>.</li>
        <li><strong>Readability Scoring:</strong> Evaluate live copy with our <Link href="/tools/readability-checker">Readability Score Analyzer</Link>.</li>
        <li><strong>Case Normalization:</strong> Convert typography styles with our <Link href="/tools/case-converter">Text Case Converter</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Is Lorem Ipsum real Latin?</h3>
      <p>
        It is corrupted pseudo-Latin. The original text from Cicero begins: <em>&quot;Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...&quot;</em> (&quot;Nor is there anyone who loves grief itself, who seeks after it and wants to have it, simply because it is grief...&quot;).
      </p>

      <h3>Should Lorem Ipsum ever be left on a live website?</h3>
      <p>
        Never. Leaving placeholder text on published production pages harms search engine rankings, triggers low-quality content algorithmic penalties, and undermines customer trust.
      </p>
    </article>
  );
}
