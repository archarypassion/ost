"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Key, Copy, Check, Download, RefreshCw } from 'lucide-react';

function generateV4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateV7() {
  // RFC 9562 UUID Version 7 (Unix timestamp milliseconds + random bits)
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0'); // 48 bits = 12 hex chars

  const randomBytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 10; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  }

  const randHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Format: 8-4-4-4-12
  const p1 = timeHex.slice(0, 8);
  const p2 = timeHex.slice(8, 12);
  const p3 = '7' + randHex.slice(0, 3); // 7 + 3 hex chars
  const p4 = ((parseInt(randHex.slice(3, 5), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + randHex.slice(5, 7);
  const p5 = randHex.slice(7, 19);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export default function UuidGeneratorPage() {
  const [version, setVersion] = useState('v4'); // 'v4' | 'v7'
  const [quantity, setQuantity] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [quotes, setQuotes] = useState(false);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const uuidList = useMemo(() => {
    const list = [];
    const count = Math.min(200, Math.max(1, quantity));

    for (let i = 0; i < count; i++) {
      let id = version === 'v7' ? generateV7() : generateV4();
      if (!hyphens) id = id.replace(/-/g, '');
      if (uppercase) id = id.toUpperCase();
      if (quotes) id = `"${id}"`;
      list.push(id);
    }
    return list;
  }, [version, quantity, uppercase, hyphens, quotes, seed]);

  const outputText = useMemo(() => {
    return uuidList.join('\n');
  }, [uuidList]);

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>UUID / GUID Generator (v4 &amp; v7)</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Generate cryptographically random UUID v4 and time-ordered UUID v7 strings under RFC 9562.
          Supports bulk generation, uppercase formatting, and hyphen toggling for database indexing.
        </p>

        {/* Options Toolbar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1.25rem' }}>
          {/* Version */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              UUID Version:
            </label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }}
            >
              <option value="v4">Version 4 (Random)</option>
              <option value="v7">Version 7 (Time-Ordered)</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Quantity (1–200):
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="search-input"
              style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Regenerate Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="check-btn"
              onClick={() => setSeed(seed + 1)}
              style={{ width: '100%', padding: '0.5rem', justifyContent: 'center' }}
            >
              <RefreshCw size={13} style={{ display: 'inline', marginRight: '4px' }} /> Regenerate
            </button>
          </div>
        </div>

        {/* Formatting Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} />
            <span>Include Hyphens (<code>-</code>)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
            <span>UPPERCASE</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={quotes} onChange={(e) => setQuotes(e.target.checked)} />
            <span>Wrap in Quotes (&quot;...&quot;)</span>
          </label>
        </div>

        {/* Output Box */}
        <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #EC4899' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Generated {version.toUpperCase()} Identifiers ({uuidList.length}):
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="lv2-pill-btn"
                onClick={handleCopy}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                className="lv2-pill-btn"
                onClick={handleDownload}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                <Download size={11} /> Save .txt
              </button>
            </div>
          </div>

          <textarea
            readOnly
            rows={10}
            value={outputText}
            style={{ width: '100%', padding: '0.85rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical', color: 'var(--text-primary)' }}
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
      <h2>RFC 9562 Universally Unique Identifier (UUID) Specifications</h2>
      <p>
        A Universally Unique Identifier (UUID) is a 128-bit label standardized under <a href="https://www.rfc-editor.org/rfc/rfc9562.html" target="_blank" rel="noopener noreferrer">IETF RFC 9562</a> (superseding RFC 4122). Designed to enable distributed systems to generate unique primary keys without central coordination, UUIDs guarantee uniqueness across databases, session cookies, and API request headers.
      </p>

      <h2>UUID Version 4 vs. Version 7 Comparison</h2>

      <ul>
        <li><strong>UUID Version 4 (Pure Randomness):</strong> Generated using 122 bits of pseudo-random entropy. The collision probability is astronomically small (1 in 2^122), but random distribution causes severe B-Tree database index fragmentation.</li>
        <li><strong>UUID Version 7 (Time-Ordered):</strong> Combines a 48-bit Unix epoch millisecond timestamp with 74 bits of random entropy. Because IDs are monotonically increasing over time, they index cleanly in PostgreSQL, MySQL, and SQLite without database page splits.</li>
      </ul>

      <h2>Standard Hexadecimal String Representation</h2>

      <p>
        UUIDs are formatted as 32 hexadecimal digits separated by four hyphens into five groups: <code>8-4-4-4-12</code> (e.g. <code>f47ac10b-58cc-4372-a567-0e02b2c3d479</code>).
      </p>

      <h2>Developer &amp; Database Suite</h2>

      <p>
        Combine UUID generation with our webmaster utilities:
      </p>
      <ul>
        <li><strong>Cryptographic Hashes:</strong> Compute SHA-256 digests with our <Link href="/tools/hash-generator">Cryptographic Hash Generator</Link>.</li>
        <li><strong>JSON Formatting:</strong> Structure API request payloads with our <Link href="/tools/json-formatter">JSON Formatter &amp; Validator</Link>.</li>
        <li><strong>Base64 Encoding:</strong> Convert binary data with our <Link href="/tools/base64-encoder">Base64 Encoder / Decoder</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between a UUID and a GUID?</h3>
      <p>
        UUID (Universally Unique Identifier) is the open IETF standard name. GUID (Globally Unique Identifier) is Microsoft&apos;s terminology for the exact same 128-bit specification.
      </p>

      <h3>Why is UUID v7 recommended for database primary keys?</h3>
      <p>
        Because UUID v7 begins with a chronological timestamp, new records are appended sequentially to the end of database B-Tree index pages, improving database insert performance by up to 400% compared to random UUID v4.
      </p>
    </article>
  );
}
