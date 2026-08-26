"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Binary, Copy, Check, ArrowRightLeft, Trash2 } from 'lucide-react';

const COMMON_ENCODINGS = [
  { char: 'Space ( )', encoded: '%20 or +' },
  { char: 'Ampersand (&)', encoded: '%26' },
  { char: 'Equals (=)', encoded: '%3D' },
  { char: 'Question mark (?)', encoded: '%3F' },
  { char: 'Slash (/)', encoded: '%2F' },
  { char: 'Colon (:)', encoded: '%3A' },
  { char: 'Hash (#)', encoded: '%23' },
  { char: 'Percent (%)', encoded: '%25' },
  { char: 'At (@)', encoded: '%40' },
  { char: 'Plus (+)', encoded: '%2B' },
];

export default function UrlEncoderPage() {
  const [input, setInput] = useState('https://example.com/search?q=SEO tools & free diagnostics #results');
  const [mode, setMode] = useState('encodeComponent'); // encodeComponent | encodeFull | decode
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    try {
      if (mode === 'encodeComponent') return encodeURIComponent(input);
      if (mode === 'encodeFull') return encodeURI(input);
      if (mode === 'decode') return decodeURIComponent(input.replace(/\+/g, ' '));
      return input;
    } catch {
      return 'Error: Malformed URI sequence.';
    }
  }, [input, mode]);

  const parsedParams = useMemo(() => {
    if (!input.includes('?') && !input.includes('&')) return [];
    try {
      const qs = input.includes('?') ? input.split('?')[1].split('#')[0] : input;
      const params = new URLSearchParams(qs);
      const list = [];
      params.forEach((val, key) => list.push({ key, val }));
      return list;
    } catch {
      return [];
    }
  }, [input]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (output && !output.startsWith('Error:')) {
      setInput(output);
      setMode(mode === 'decode' ? 'encodeComponent' : 'decode');
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>URL Percent Encoder &amp; Decoder</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Percent-encode and decode URLs, query strings, and special UTF-8 characters under RFC 3986.
          Inspect parsed query parameters in real-time.
        </p>

        {/* Mode Selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={mode === 'encodeComponent' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('encodeComponent')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Encode Component (Strict)
            </button>
            <button
              type="button"
              className={mode === 'encodeFull' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('encodeFull')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Encode Full URL
            </button>
            <button
              type="button"
              className={mode === 'decode' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('decode')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Decode URL / String
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleSwap}
              disabled={!output}
              title="Swap input and output"
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
              Input Text / URL:
            </label>
            <textarea
              className="search-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text or URL to encode/decode..."
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

        {/* Query Parameter Parser (if detected) */}
        {parsedParams.length > 0 && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
            <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
              Parsed Query Parameters ({parsedParams.length}):
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
              {parsedParams.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                  <code style={{ color: 'var(--lv2-blue-light)', fontWeight: 600 }}>{p.key}</code>
                  <span style={{ color: 'var(--text-secondary)' }}>=</span>
                  <span style={{ wordBreak: 'break-all' }}>{p.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Reference Table */}
        <div style={{ marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Common ASCII Percent-Encoding Reference:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
            {COMMON_ENCODINGS.map((c) => (
              <div key={c.char} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{c.char}: </span>
                <code style={{ fontWeight: 700 }}>{c.encoded}</code>
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
      <h2>RFC 3986 URI Percent-Encoding Standards</h2>
      <p>
        Uniform Resource Identifier (URI) percent-encoding, formalized in <a href="https://www.rfc-editor.org/rfc/rfc3986.html" target="_blank" rel="noopener noreferrer">IETF RFC 3986</a>, represents arbitrary octets and non-ASCII Unicode characters using printable ASCII character sequences (a percent sign <code>%</code> followed by two hexadecimal digits representing the byte value).
      </p>

      <h2>Reserved vs. Unreserved Characters</h2>

      <ul>
        <li><strong>Unreserved Characters (Never Encoded):</strong> Uppercase/lowercase alphanumeric letters (<code>A-Z</code>, <code>a-z</code>), decimal digits (<code>0-9</code>), hyphen (<code>-</code>), underscore (<code>_</code>), period (<code>.</code>), and tilde (<code>~</code>).</li>
        <li><strong>Reserved Characters (Delimiters):</strong> Characters with syntax meaning in URL structures: <code>:</code>, <code>/</code>, <code>?</code>, <code>#</code>, <code>[</code>, <code>]</code>, <code>@</code>, <code>!</code>, <code>$</code>, <code>&amp;</code>, <code>&apos;</code>, <code>(</code>, <code>)</code>, <code>*</code>, <code>+</code>, <code>,</code>, <code>;</code>, <code>=</code>.</li>
      </ul>

      <h2><code>encodeURI()</code> vs. <code>encodeURIComponent()</code></h2>

      <div className="ps2-timings" style={{ margin: '1.5rem 0' }}>
        <p><strong>encodeURI():</strong> Intended for complete URLs. Preserves protocol schemes, slashes, question marks, and colons (e.g. leaves <code>https://example.com/path?query=1</code> structurally intact).</p>
        <p><strong>encodeURIComponent():</strong> Intended for individual query parameter keys and values. Encodes all reserved characters including <code>/</code>, <code>?</code>, <code>&amp;</code>, and <code>=</code> to prevent query string breaking.</p>
      </div>

      <h2>Web &amp; SEO Tool Synergy</h2>

      <p>
        Clean URL encoding prevents tracking degradation and broken redirects:
      </p>
      <ul>
        <li><strong>Campaign Tagging:</strong> Build clean query URLs with our <Link href="/tools/utm-builder">UTM Campaign Builder</Link>.</li>
        <li><strong>Slug Formatting:</strong> Convert titles to URL-safe paths with our <Link href="/tools/slug-generator">URL Slug Generator</Link>.</li>
        <li><strong>Redirect Integrity:</strong> Verify that server routing preserves percent-encoded characters using our <Link href="/tools/redirect-checker">Redirect Chain Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between %20 and + in URL encoding?</h3>
      <p>
        <code>%20</code> is the standard RFC 3986 percent-encoding for a space character across all URL segments. <code>+</code> is an alternate encoding for space historically used only inside application/x-www-form-urlencoded query strings.
      </p>

      <h3>How are multi-byte Unicode characters (emojis, accents) encoded?</h3>
      <p>
        Unicode characters are first converted into their UTF-8 byte representation, and each resulting byte is percent-encoded. For example, <code>&eacute;</code> becomes <code>%C3%A9</code> (2 bytes).
      </p>

      <h3>What causes double-encoding bugs?</h3>
      <p>
        Passing an already-encoded URL through an encoder a second time turns <code>%20</code> into <code>%2520</code> (because <code>%</code> is encoded as <code>%25</code>), causing server 404 errors.
      </p>
    </article>
  );
}
