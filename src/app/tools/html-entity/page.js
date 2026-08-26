"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CodeXml, Copy, Check, ArrowRightLeft, Trash2, ShieldCheck } from 'lucide-react';

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '§': '&sect;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  '—': '&mdash;',
  '–': '&ndash;',
  '…': '&hellip;',
  '«': '&laquo;',
  '»': '&raquo;',
};

const COMMON_ENTITIES = [
  { char: '<', named: '&lt;', dec: '&#60;', hex: '&#x3C;', desc: 'Less than' },
  { char: '>', named: '&gt;', dec: '&#62;', hex: '&#x3E;', desc: 'Greater than' },
  { char: '&', named: '&amp;', dec: '&#38;', hex: '&#x26;', desc: 'Ampersand' },
  { char: '"', named: '&quot;', dec: '&#34;', hex: '&#x22;', desc: 'Double quote' },
  { char: "'", named: '&#39;', dec: '&#39;', hex: '&#x27;', desc: 'Single quote' },
  { char: '©', named: '&copy;', dec: '&#169;', hex: '&#xA9;', desc: 'Copyright' },
  { char: '®', named: '&reg;', dec: '&#174;', hex: '&#xAE;', desc: 'Registered' },
  { char: '€', named: '&euro;', dec: '&#8364;', hex: '&#x20AC;', desc: 'Euro' },
];

export default function HtmlEntityPage() {
  const [input, setInput] = useState('<div class="header"><h1>Welcome to "SEO & Tools" — © 2026</h1></div>');
  const [mode, setMode] = useState('named'); // 'named' | 'dec' | 'hex' | 'decode'
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';

    if (mode === 'decode') {
      // Decode HTML entities
      return input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0*39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&euro;/g, '€')
        .replace(/&pound;/g, '£')
        .replace(/&yen;/g, '¥')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '…')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    if (mode === 'named') {
      let res = '';
      for (const ch of input) {
        res += ENTITY_MAP[ch] || ch;
      }
      return res;
    }

    if (mode === 'dec') {
      let res = '';
      for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        if (/[a-zA-Z0-9\s]/.test(input[i])) res += input[i];
        else res += `&#${code};`;
      }
      return res;
    }

    if (mode === 'hex') {
      let res = '';
      for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        if (/[a-zA-Z0-9\s]/.test(input[i])) res += input[i];
        else res += `&#x${code.toString(16).toUpperCase()};`;
      }
      return res;
    }

    return input;
  }, [input, mode]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setMode(mode === 'decode' ? 'named' : 'decode');
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>HTML Entity Encoder &amp; Decoder</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Convert special characters to Named, Decimal, and Hexadecimal HTML entities and decode encoded markup.
          Essential for XSS sanitization and formatting character references.
        </p>

        {/* Mode Selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={mode === 'named' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('named')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Encode (Named: &amp;lt;)
            </button>
            <button
              type="button"
              className={mode === 'dec' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('dec')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Encode (Decimal: &amp;#60;)
            </button>
            <button
              type="button"
              className={mode === 'hex' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('hex')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Encode (Hex: &amp;#x3C;)
            </button>
            <button
              type="button"
              className={mode === 'decode' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('decode')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Decode Entities
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleSwap}
              disabled={!output}
            >
              <ArrowRightLeft size={13} style={{ display: 'inline', marginRight: '4px' }} /> Swap
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => setInput('')}
            >
              <Trash2 size={13} style={{ display: 'inline', marginRight: '4px' }} /> Clear
            </button>
          </div>
        </div>

        {/* Textarea Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {/* Input Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Input Text / HTML:
            </label>
            <textarea
              className="search-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter HTML or text to encode/decode..."
              rows={8}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Output Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Result ({mode === 'decode' ? 'Decoded' : 'Encoded'}):
              </label>
              <button
                type="button"
                className="lv2-pill-btn"
                onClick={handleCopy}
                disabled={!output}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={8}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                resize: 'vertical',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Cheat Sheet Table */}
        <div style={{ marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Common HTML Entity Reference:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
            {COMMON_ENTITIES.map((c) => (
              <div key={c.char} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong>{c.desc} (<code>{c.char}</code>)</strong>
                </div>
                <div style={{ color: 'var(--lv2-blue-light)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {c.named} · {c.dec}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>W3C HTML5 Character Entity Specifications</h2>
      <p>
        An HTML entity is a standardized text string beginning with an ampersand (<code>&amp;</code>) and ending with a semicolon (<code>;</code>) used to display reserved characters (which would otherwise be parsed as HTML markup) and invisible or non-ASCII characters.
      </p>

      <h2>The Five Core XML/HTML Reserved Characters</h2>

      <ul>
        <li><code>&lt;</code> (Less-than) &rarr; <code>&amp;lt;</code> (Prevents browser from opening an HTML tag).</li>
        <li><code>&gt;</code> (Greater-than) &rarr; <code>&amp;gt;</code> (Prevents tag closing injection).</li>
        <li><code>&amp;</code> (Ampersand) &rarr; <code>&amp;amp;</code> (Prevents broken entity decoding).</li>
        <li><code>&quot;</code> (Double-quote) &rarr; <code>&amp;quot;</code> (Prevents breaking HTML attributes).</li>
        <li><code>&apos;</code> (Single-quote) &rarr; <code>&amp;#39;</code> (Prevents breaking single-quoted attributes).</li>
      </ul>

      <h2>Cross-Site Scripting (XSS) Mitigation</h2>

      <p>
        Rendering raw user-generated content directly inside HTML templates without entity encoding creates severe Reflected and Stored XSS vulnerabilities. Escaping special characters into HTML entities ensures the browser interprets the input as inert text rather than executable script elements.
      </p>

      <h2>Synergies with Developer &amp; Security Tools</h2>

      <p>
        Combine entity conversion with our webmaster utilities:
      </p>
      <ul>
        <li><strong>Security Header Hardening:</strong> Enforce strict script execution rules with our <Link href="/tools/security-headers">Security Headers Checker</Link>.</li>
        <li><strong>JSON Sanitization:</strong> Format and validate data payloads with our <Link href="/tools/json-formatter">JSON Formatter &amp; Validator</Link>.</li>
        <li><strong>URL String Encoding:</strong> Percent-encode query characters using our <Link href="/tools/url-encoder">URL Encoder / Decoder</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between Named and Decimal entities?</h3>
      <p>
        Named entities (e.g. <code>&amp;copy;</code>) use human-readable words, while decimal (e.g. <code>&amp;#169;</code>) and hexadecimal (e.g. <code>&amp;#xA9;</code>) entities refer directly to the character&apos;s Unicode code point.
      </p>

      <h3>Does modern UTF-8 encoding make HTML entities obsolete?</h3>
      <p>
        While UTF-8 handles international characters (accents, emojis) natively, the core reserved characters (<code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, <code>&quot;</code>) must always be entity-encoded when rendering dynamic data inside HTML.
      </p>

      <h3>How does entity encoding impact SEO?</h3>
      <p>
        Search engines parse HTML entities correctly when reading page titles and meta descriptions (e.g. <code>&amp;amp;</code> in a title appears as <code>&amp;</code> on Google search results).
      </p>
    </article>
  );
}
