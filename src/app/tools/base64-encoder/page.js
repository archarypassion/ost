"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Binary, Copy, Check, Upload, ArrowRightLeft, Trash2 } from 'lucide-react';

function utf8ToBase64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

export default function Base64EncoderPage() {
  const [input, setInput] = useState('OpenSourceTools: Fast, Private, Free Web Diagnostics!');
  const [mode, setMode] = useState('encode'); // 'encode' | 'decode' | 'file'
  const [fileDataUri, setFileDataUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') return utf8ToBase64(input);
      if (mode === 'decode') return base64ToUtf8(input.trim());
      return '';
    } catch {
      return 'Error: Invalid Base64 encoded string.';
    }
  }, [input, mode]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setFileDataUri(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = async (val) => {
    if (!val) return;
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (output && !output.startsWith('Error:')) {
      setInput(output);
      setMode(mode === 'encode' ? 'decode' : 'encode');
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Base64 Encoder &amp; Decoder</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Encode text and binary image files into RFC 4648 Base64 strings and Data URIs,
          or decode Base64 data back to human-readable UTF-8 text with instant live conversion.
        </p>

        {/* Mode Selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={mode === 'encode' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('encode')}
              style={{ padding: '0.45rem 1rem' }}
            >
              Encode Text &rarr; Base64
            </button>
            <button
              type="button"
              className={mode === 'decode' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('decode')}
              style={{ padding: '0.45rem 1rem' }}
            >
              Decode Base64 &rarr; Text
            </button>
            <button
              type="button"
              className={mode === 'file' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('file')}
              style={{ padding: '0.45rem 1rem' }}
            >
              File / Image &rarr; Base64 Data URI
            </button>
          </div>

          {mode !== 'file' && (
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
          )}
        </div>

        {/* Standard Text Encoder / Decoder */}
        {mode !== 'file' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>{mode === 'encode' ? 'UTF-8 Plaintext Input' : 'Base64 Encoded Input'}</strong>
                <span>{input.length} chars</span>
              </div>
              <textarea
                rows={9}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste Base64 string to decode...'}
                className="search-input"
                style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical' }}
              />
            </div>

            {/* Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>{mode === 'encode' ? 'Base64 Output' : 'Decoded UTF-8 Output'}</strong>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={() => handleCopy(output)}
                  disabled={!output}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                readOnly
                rows={9}
                value={output}
                style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        ) : (
          /* File Upload to Base64 Data URI Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', background: 'var(--bg-card)' }}>
              <Upload size={32} style={{ color: 'var(--lv2-blue-light)', margin: '0 auto 0.75rem' }} />
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Select any image or document file</strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1rem' }}>PNG, JPG, SVG, WebP, GIF, or JSON</span>
              <label className="check-btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Browse File
                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {fileDataUri && (
              <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <strong>{fileName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({(fileSize / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    className="check-btn"
                    onClick={() => handleCopy(fileDataUri)}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
                  >
                    {copied ? <Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                    {copied ? 'Copied URI!' : 'Copy Data URI'}
                  </button>
                </div>

                {fileDataUri.startsWith('data:image/') && (
                  <div style={{ marginBottom: '1rem', textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    <img src={fileDataUri} alt="Preview" style={{ maxWidth: '180px', maxHeight: '140px', objectFit: 'contain' }} />
                  </div>
                )}

                <textarea
                  readOnly
                  rows={6}
                  value={fileDataUri}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', wordBreak: 'break-all' }}
                />
              </div>
            )}
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
      <h2>RFC 4648 Base64 Encoding Specifications</h2>
      <p>
        Base64 is a binary-to-text encoding scheme defined by <a href="https://www.rfc-editor.org/rfc/rfc4648.html" target="_blank" rel="noopener noreferrer">IETF RFC 4648</a>. It translates arbitrary binary sequences and multi-byte UTF-8 data into a safe set of 64 ASCII printable characters (<code>A-Z</code>, <code>a-z</code>, <code>0-9</code>, <code>+</code>, and <code>/</code>) with <code>=</code> padding.
      </p>

      <h2>Mathematical 3-to-4 Bit Mapping</h2>

      <p>
        Base64 takes every 3 bytes (24 bits) of raw binary data and splits them into four 6-bit groups ($2^6 = 64$). Each 6-bit chunk maps to an index in the 64-character ASCII table, which increases the total character payload size by exactly <strong>33%</strong>.
      </p>

      <h2>Web &amp; Performance Use Cases (Data URIs)</h2>

      <ul>
        <li><strong>Inline SVG &amp; Icon Embedding:</strong> Embedding small icons as Data URIs (<code>data:image/svg+xml;base64,...</code>) directly inside CSS eliminates round-trip HTTP request overhead.</li>
        <li><strong>API Authentication Tokens:</strong> HTTP Basic Authentication encodes <code>username:password</code> credentials in Base64 within the <code>Authorization: Basic &lt;token&gt;</code> request header.</li>
        <li><strong>Email Attachments (MIME):</strong> Email protocols (SMTP) transmit attachments encoded in Base64 lines under RFC 2045.</li>
      </ul>

      <h2>Developer Utilities Suite</h2>

      <p>
        Pair Base64 encoding with our development suite:
      </p>
      <ul>
        <li><strong>URL Percent Encoding:</strong> Safely encode URL query parameters with our <Link href="/tools/url-encoder">URL Encoder / Decoder</Link>.</li>
        <li><strong>JSON Formatting:</strong> Validate data payloads with our <Link href="/tools/json-formatter">JSON Formatter &amp; Validator</Link>.</li>
        <li><strong>Hash Calculation:</strong> Generate cryptographic checksums using our <Link href="/tools/hash-generator">Cryptographic Hash Generator</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Is Base64 a form of encryption?</h3>
      <p>
        No. Base64 is an open public encoding format, not encryption. It provides zero confidentiality or security and can be decoded instantly by anyone.
      </p>

      <h3>Should I embed large images as Base64 strings in HTML?</h3>
      <p>
        No. Because Base64 increases byte size by 33% and cannot be cached independently by browser CDNs, inlining large images harms Google Core Web Vitals (LCP). Only inline tiny icons (&lt; 2 KB).
      </p>
    </article>
  );
}
