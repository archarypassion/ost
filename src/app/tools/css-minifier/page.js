"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileCode, Copy, Check, Download, Trash2, Zap } from 'lucide-react';

const SAMPLE_CSS = `/* Main Application Stylesheet */
.container {
  max-width: 1200px;
  margin: 0px auto;
  padding: 20px 16px;
}

.hero-header {
  font-size: 2.5rem;
  font-weight: 700;
  color: #3B82F6;
  line-height: 1.2;
}

/* Button Component */
.button-primary {
  background-color: #10B981;
  color: #FFFFFF;
  border-radius: 8px;
  padding: 10px 20px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.button-primary:hover {
  background-color: #059669;
  transform: translateY(-2px);
}`;

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // remove space around delimiters
    .replace(/;\}/g, '}') // remove trailing semicolon
    .replace(/\b0(px|em|rem|%|in|cm|mm|pc|pt|ex|vh|vw|vmin|vmax)\b/g, '0') // strip zero units
    .trim();
}

function beautifyCss(css) {
  let formatted = '';
  let indent = 0;
  const clean = minifyCss(css);

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '{') {
      indent++;
      formatted += ' {\n' + '  '.repeat(indent);
    } else if (char === '}') {
      indent = Math.max(0, indent - 1);
      formatted += '\n' + '  '.repeat(indent) + '}\n\n' + '  '.repeat(indent);
    } else if (char === ';') {
      formatted += ';\n' + '  '.repeat(indent);
    } else if (char === ':') {
      formatted += ': ';
    } else {
      formatted += char;
    }
  }
  return formatted.trim();
}

export default function CssMinifierPage() {
  const [input, setInput] = useState(SAMPLE_CSS);
  const [mode, setMode] = useState('minify'); // 'minify' | 'beautify'
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'minify') return minifyCss(input);
      if (mode === 'beautify') return beautifyCss(input);
      return input;
    } catch {
      return 'Error: Invalid CSS stylesheet structure.';
    }
  }, [input, mode]);

  const stats = useMemo(() => {
    const originalBytes = new Blob([input]).size;
    const outputBytes = new Blob([output]).size;
    const savedBytes = Math.max(0, originalBytes - outputBytes);
    const percent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;
    return { originalBytes, outputBytes, savedBytes, percent };
  }, [input, output]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/css;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'minify' ? 'style.min.css' : 'style.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>CSS Minifier &amp; Formatter</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Minify CSS stylesheets to reduce file weight and improve Core Web Vitals (FCP/LCP),
          or format minified CSS into clean readable indentation.
        </p>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className={mode === 'minify' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('minify')}
              style={{ padding: '0.45rem 1rem' }}
            >
              Minify (Compress)
            </button>
            <button
              type="button"
              className={mode === 'beautify' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setMode('beautify')}
              style={{ padding: '0.45rem 1rem' }}
            >
              Beautify (Format)
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => setInput(SAMPLE_CSS)}
            >
              Sample CSS
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleCopy}
              disabled={!output}
            >
              {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleDownload}
              disabled={!output}
            >
              <Download size={12} /> Download
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => setInput('')}
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>

        {/* Textarea Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Raw Input CSS</strong>
              <span>{stats.originalBytes} bytes</span>
            </div>
            <textarea
              rows={14}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste CSS code here..."
              className="search-input"
              style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          {/* Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>{mode === 'minify' ? 'Minified Output' : 'Beautified Output'}</strong>
              <span>{stats.outputBytes} bytes</span>
            </div>
            <textarea
              readOnly
              rows={14}
              value={output}
              style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', lineHeight: 1.5, resize: 'vertical', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Compression Metrics Banner */}
        {mode === 'minify' && input.trim() && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginTop: '1.25rem', fontSize: '0.875rem' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Original Size: </span><strong>{stats.originalBytes} B</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Minified Size: </span><strong>{stats.outputBytes} B</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Savings: </span><strong style={{ color: '#10B981' }}>{stats.savedBytes} B ({stats.percent}%)</strong></div>
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
      <h2>CSS Minification &amp; Core Web Vitals Optimization</h2>
      <p>
        Cascading Style Sheets (CSS) are render-blocking resources. When a browser requests an HTML document, it pauses DOM rendering until all external stylesheets are downloaded and parsed into the CSS Object Model (CSSOM). Minifying CSS removes unnecessary bytes from the Critical Rendering Path, accelerating First Contentful Paint (FCP) and Largest Contentful Paint (LCP).
      </p>

      <h2>The Mechanics of CSS Minification</h2>

      <ul>
        <li><strong>Comment Removal:</strong> Strips developer comments (<code>/* ... */</code>) which are ignored by browser rendering engines.</li>
        <li><strong>Whitespace Collapse:</strong> Eliminates extra tabs, indentation spaces, and newline characters.</li>
        <li><strong>Delimiter Compaction:</strong> Removes whitespace around curly braces (<code>{`{ ... }`}</code>), colons, and semicolons.</li>
        <li><strong>Zero Unit Stripping:</strong> Converts <code>0px</code>, <code>0em</code>, and <code>0%</code> into pure numeric <code>0</code>.</li>
      </ul>

      <h2>Minification vs. Gzip &amp; Brotli Compression</h2>

      <p>
        Minification and HTTP compression work together: minification optimizes the raw code structure, while Gzip/Brotli algorithms compress repetitive byte patterns over the wire. Running both yields up to <strong>85% bandwidth reduction</strong> on production stylesheets.
      </p>

      <h2>Performance &amp; Webmaster Suite</h2>

      <p>
        Audit your site speed with our performance suite:
      </p>
      <ul>
        <li><strong>Wire Compression Auditing:</strong> Measure real-world byte savings with our <Link href="/tools/gzip-checker">Gzip &amp; Brotli Checker</Link>.</li>
        <li><strong>Total Asset Weight:</strong> Inspect total stylesheet weight using our <Link href="/tools/page-size">Page Size Checker</Link>.</li>
        <li><strong>Network Latency:</strong> Measure TTFB and TLS handshake speed with our <Link href="/tools/page-speed">Page Speed Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Will minifying CSS break my website layout?</h3>
      <p>
        No. Standard CSS minification only removes superfluous whitespace and comments without modifying selector specificity, property declarations, or CSS calculation logic.
      </p>

      <h3>Should I minify CSS in modern build tools?</h3>
      <p>
        Modern bundlers (Webpack, Next.js, Vite, esbuild) minify CSS automatically during production builds (<code>npm run build</code>). This standalone tool is ideal for inline CSS blocks, legacy projects, and quick stylesheet optimization.
      </p>
    </article>
  );
}
