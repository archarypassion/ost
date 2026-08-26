"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Download, Trash2, FileJson, AlertCircle } from 'lucide-react';

const SAMPLE_JSON = `{
  "name": "OpenSourceTools",
  "version": "2.4.0",
  "features": ["SEO Audit", "Security Headers", "Performance Diagnostics"],
  "settings": {
    "darkMode": true,
    "maxRedirectHops": 5,
    "timeoutMs": 12000
  },
  "author": {
    "name": "Core Dev Team",
    "verified": true
  }
}`;

export default function JsonFormatterPage() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState(null);
  const [indent, setIndent] = useState(2);

  const formatJson = (spacing = indent) => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      setStats(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const formatted = spacing === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, spacing);
      setOutput(formatted);

      // Compute statistics
      const keysCount = countKeys(parsed);
      const byteSize = new Blob([formatted]).size;
      setStats({
        type: Array.isArray(parsed) ? 'Array' : typeof parsed === 'object' && parsed !== null ? 'Object' : typeof parsed,
        keys: keysCount,
        size: formatBytes(byteSize),
        lines: formatted.split('\n').length,
      });
    } catch (err) {
      setError(parseJsonError(err.message, input));
      setOutput('');
      setStats(null);
    }
  };

  const countKeys = (obj) => {
    if (typeof obj !== 'object' || obj === null) return 0;
    let count = 0;
    for (const k of Object.keys(obj)) {
      count++;
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        count += countKeys(obj[k]);
      }
    }
    return count;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const parseJsonError = (msg, raw) => {
    const posMatch = msg.match(/position\s+(\d+)/i) || msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    let line = null;
    let col = null;
    if (posMatch && posMatch[1] && !posMatch[2]) {
      const pos = parseInt(posMatch[1], 10);
      const upTo = raw.slice(0, pos);
      const lines = upTo.split('\n');
      line = lines.length;
      col = lines[lines.length - 1].length + 1;
    } else if (posMatch && posMatch[2]) {
      line = parseInt(posMatch[1], 10);
      col = parseInt(posMatch[2], 10);
    }
    return {
      message: msg,
      line,
      col,
    };
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setInput(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>JSON Formatter, Validator &amp; Minifier</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Format, validate, minify, and inspect JSON documents in real-time. Detects syntax errors,
          counts keys and payload sizes, and delivers clean RFC 8259 compliant formatting.
        </p>

        {/* Controls Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="check-btn"
              onClick={() => { setIndent(2); formatJson(2); }}
              style={{ padding: '0.5rem 1rem' }}
            >
              Prettify (2 Spaces)
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => { setIndent(4); formatJson(4); }}
            >
              4 Spaces
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => { setIndent(0); formatJson(0); }}
            >
              Minify (Compact)
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => { setInput(SAMPLE_JSON); setError(null); }}
            >
              Load Sample
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label className="lv2-pill-btn" style={{ cursor: 'pointer', margin: 0 }}>
              Upload .json
              <input type="file" accept=".json,application/json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => { setInput(''); setOutput(''); setError(null); setStats(null); }}
              title="Clear input"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Editor Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {/* Input Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Input JSON</strong>
              <span>{input.length} chars</span>
            </div>
            <textarea
              className="search-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste raw JSON here..."
              rows={16}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-card)',
                border: error ? '1.5px solid #EF4444' : '1px solid var(--border-color)',
                borderRadius: '10px',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Output Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Formatted Output</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={handleCopy}
                  disabled={!output}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={handleDownload}
                  disabled={!output}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  <Download size={12} /> Save
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={output}
              placeholder="Formatted output will appear here..."
              rows={16}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                resize: 'vertical',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="result-error" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '1rem', width: '100%' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Invalid JSON Syntax</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{error.message}</p>
              {error.line && (
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  Location: Line {error.line}, Column {error.col}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Statistics Bar */}
        {stats && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginTop: '1rem', width: '100%', fontSize: '0.875rem' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Root Type: </span><strong>{stats.type}</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Total Keys: </span><strong>{stats.keys}</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Lines: </span><strong>{stats.lines}</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Payload Size: </span><strong>{stats.size}</strong></div>
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
      <h2>JSON Data Interchange Standards (RFC 8259)</h2>
      <p>
        JavaScript Object Notation (JSON) is a lightweight, text-based data interchange format defined by <a href="https://www.rfc-editor.org/rfc/rfc8259.html" target="_blank" rel="noopener noreferrer">IETF RFC 8259</a> and <a href="https://www.ecma-international.org/publications-and-standards/standards/ecma-404/" target="_blank" rel="noopener noreferrer">ECMA-404</a>. It is programming language-independent and serves as the standard transmission format for modern REST APIs, GraphQL payloads, and search engine structured data.
      </p>

      <h2>JSON Syntax Rules &amp; Strict Data Types</h2>

      <p>
        RFC 8259 enforces six fundamental data structures:
      </p>
      <ul>
        <li><strong>Object:</strong> Unordered collection of zero or more key/value pairs enclosed in curly braces <code>{`{ ... }`}</code>. Keys must be double-quoted strings.</li>
        <li><strong>Array:</strong> Ordered collection of zero or more values enclosed in square brackets <code>{`[ ... ]`}</code>.</li>
        <li><strong>String:</strong> Unicode text enclosed in double quotes (e.g. <code>&quot;hello&quot;</code>). Single quotes are illegal in valid JSON.</li>
        <li><strong>Number:</strong> Integer or floating-point number without octal or hexadecimal prefixes (e.g. <code>42</code>, <code>3.14159</code>, <code>1.0e+10</code>).</li>
        <li><strong>Boolean:</strong> Exact literal values <code>true</code> or <code>false</code> (case-sensitive).</li>
        <li><strong>Null:</strong> Literal value <code>null</code> indicating empty or missing values.</li>
      </ul>

      <h2>Most Common JSON Syntax Errors</h2>

      <p>
        Unlike JavaScript object literals, JSON parsers fail strictly when encountering:
      </p>
      <ul>
        <li><strong>Trailing Commas:</strong> Placing a comma after the final property in an object or array (e.g. <code>{`{"a": 1,}`}</code>) violates JSON specifications.</li>
        <li><strong>Single Quotes:</strong> Keys and string values must strictly use double quotes (<code>&quot;key&quot;</code>). Single quotes (<code>&apos;key&apos;</code>) throw immediate parsing errors.</li>
        <li><strong>Unquoted Object Keys:</strong> Keys like <code>{`{ key: "val" }`}</code> are valid JS but invalid JSON.</li>
        <li><strong>Undefined or Functions:</strong> JSON does not support <code>undefined</code>, functions, comments, or <code>NaN</code>.</li>
      </ul>

      <h2>Integrating JSON with Web &amp; SEO Tools</h2>

      <p>
        Clean, valid JSON is critical across search and performance infrastructure:
      </p>
      <ul>
        <li><strong>Structured Data:</strong> Generate valid JSON-LD rich snippets using our <Link href="/tools/schema-generator">JSON-LD Schema Generator</Link> and validate live tags with our <Link href="/tools/schema-checker">Schema Markup Checker</Link>.</li>
        <li><strong>Payload Size Optimization:</strong> Minifying JSON payloads reduces bandwidth consumption before analyzing wire transfers with our <Link href="/tools/page-size">Page Size Checker</Link>.</li>
        <li><strong>Encoding Compliance:</strong> When embedding JSON within query strings, encode special characters using our <Link href="/tools/url-encoder">URL Encoder / Decoder</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between JSON and JavaScript Objects?</h3>
      <p>
        JSON is a pure text serialization format with strict syntax rules: all object keys must be enclosed in double quotes, strings must use double quotes, and functions, comments, or trailing commas are strictly forbidden.
      </p>

      <h3>How does minifying JSON improve web performance?</h3>
      <p>
        Minification removes all extraneous whitespace, line breaks, and indentation, reducing payload byte sizes by 20% to 50% before transmission across HTTP sockets.
      </p>

      <h3>Is JSON case-sensitive?</h3>
      <p>
        Yes. Object keys (<code>&quot;Id&quot;</code> vs <code>&quot;id&quot;</code>) and literal values (<code>true</code>, <code>false</code>, <code>null</code>) are strictly case-sensitive.
      </p>
    </article>
  );
}
