"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CaseSensitive, Copy, Check, Trash2, Download } from 'lucide-react';

const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'en', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'v', 'via', 'vs']);

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt, offset) => {
    const lower = txt.toLowerCase();
    if (offset !== 0 && MINOR_WORDS.has(lower)) {
      return lower;
    }
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function toSentenceCase(str) {
  return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
}

function toCamelCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

function toSnakeCase(str) {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase();
}

function toKebabCase(str) {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
}

function toConstantCase(str) {
  return toSnakeCase(str).toUpperCase();
}

function toAlternatingCase(str) {
  let result = '';
  let upper = false;
  for (const ch of str) {
    if (/[a-zA-Z]/.test(ch)) {
      result += upper ? ch.toUpperCase() : ch.toLowerCase();
      upper = !upper;
    } else {
      result += ch;
    }
  }
  return result;
}

export default function CaseConverterPage() {
  const [text, setText] = useState('Transform any text into multiple developer casing conventions and publishing styles.');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    return { chars, words, lines };
  }, [text]);

  const handleCopy = async (val) => {
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const conversions = [
    { label: 'Sentence case', fn: () => toSentenceCase(text) },
    { label: 'Title Case (Publishing)', fn: () => toTitleCase(text) },
    { label: 'UPPERCASE', fn: () => text.toUpperCase() },
    { label: 'lowercase', fn: () => text.toLowerCase() },
    { label: 'camelCase (JavaScript)', fn: () => toCamelCase(text) },
    { label: 'PascalCase (Classes)', fn: () => toPascalCase(text) },
    { label: 'snake_case (Python)', fn: () => toSnakeCase(text) },
    { label: 'kebab-case (URLs & CSS)', fn: () => toKebabCase(text) },
    { label: 'CONSTANT_CASE (Env Vars)', fn: () => toConstantCase(text) },
    { label: 'aLtErNaTiNg cAsE', fn: () => toAlternatingCase(text) },
  ];

  return (
    <div>
      <div className="tool-header">
        <h1>Text Case Converter &amp; String Formatter</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Convert text between publishing styles (Title Case, Sentence case) and developer variable naming conventions
          (camelCase, snake_case, kebab-case, CONSTANT_CASE, PascalCase).
        </p>

        {/* Input Textarea */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <strong>Input Text</strong>
            <span>{stats.chars} chars · {stats.words} words · {stats.lines} lines</span>
          </div>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="search-input"
            style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.9375rem', lineHeight: 1.5 }}
          />
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {conversions.slice(0, 4).map((c) => (
            <button
              key={c.label}
              type="button"
              className="check-btn"
              onClick={() => setText(c.fn())}
              style={{ padding: '0.45rem 1rem' }}
            >
              {c.label}
            </button>
          ))}
          <button
            type="button"
            className="lv2-pill-btn"
            onClick={() => setText('')}
          >
            <Trash2 size={13} style={{ display: 'inline', marginRight: '4px' }} /> Clear
          </button>
        </div>

        {/* Live Transformation Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', width: '100%' }}>
          {conversions.map((c) => {
            const converted = c.fn();
            return (
              <div
                key={c.label}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lv2-blue-light)' }}>
                    {c.label}
                  </span>
                  <button
                    type="button"
                    className="lv2-pill-btn"
                    onClick={() => handleCopy(converted)}
                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                  >
                    <Copy size={11} style={{ display: 'inline', marginRight: '3px' }} /> Copy
                  </button>
                </div>
                <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)', wordBreak: 'break-all', color: 'var(--text-primary)', maxHeight: '80px', overflowY: 'auto' }}>
                  {converted || '<Empty>'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>String Casing Standards in Software &amp; Publishing</h2>
      <p>
        String case transformation is standard across computer programming, technical writing, database schemas, and digital publishing. Standardizing letter casing prevents syntax errors, enhances code readability, and maintains brand typography guidelines.
      </p>

      <h2>Programming Variable Casing Conventions</h2>

      <ul>
        <li><strong>camelCase:</strong> Standard in JavaScript, TypeScript, and Java for variable and function identifiers (e.g. <code>getUserProfile</code>).</li>
        <li><strong>PascalCase:</strong> Standard in React components, C#, and OOP class definitions (e.g. <code>UserProfileCard</code>).</li>
        <li><strong>snake_case:</strong> Standard in Python, Ruby, and PostgreSQL column definitions (e.g. <code>user_profile_id</code>).</li>
        <li><strong>kebab-case:</strong> Standard in URL slugs, CSS class selectors, and HTML custom attributes (e.g. <code>user-profile-card</code>).</li>
        <li><strong>CONSTANT_CASE:</strong> Standard for environment variables and global immutable constants (e.g. <code>API_SECRET_KEY</code>).</li>
      </ul>

      <h2>Publishing Title Case Rules (AP vs. Chicago)</h2>

      <p>
        Standard Title Case capitalizes the first word, last word, and all principal words, while keeping minor words (short prepositions, conjunctions, articles under 4 letters such as <em>&quot;a&quot;</em>, <em>&quot;in&quot;</em>, <em>&quot;for&quot;</em>, <em>&quot;and&quot;</em>) in lowercase.
      </p>

      <h2>Developer &amp; SEO Tool Synergy</h2>

      <p>
        Format and optimize strings across your development pipeline:
      </p>
      <ul>
        <li><strong>URL Slug Formatting:</strong> Convert titles to URL-safe strings with our <Link href="/tools/slug-generator">URL Slug Generator</Link>.</li>
        <li><strong>Character Count &amp; Readability:</strong> Measure reading levels using our <Link href="/tools/readability-checker">Readability Score Analyzer</Link>.</li>
        <li><strong>Text Sanitization:</strong> Escape special characters using our <Link href="/tools/html-entity">HTML Entity Encoder</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why is kebab-case preferred for web URLs?</h3>
      <p>
        Search engines recognize hyphens (<code>-</code>) in kebab-case as distinct word separators, whereas snake_case underscores (<code>_</code>) are often indexed as concatenated strings.
      </p>

      <h3>What is alternating case used for?</h3>
      <p>
        Alternating case (aLtErNaTiNg cAsE) is popular in social media, meme typography, and creative text formatting.
      </p>

      <h3>How does sentence case improve user interface readability?</h3>
      <p>
        Modern UI design frameworks (Google Material Design, Apple HIG) recommend Sentence case for buttons and navigation labels to improve reading speed and visual clarity.
      </p>
    </article>
  );
}
