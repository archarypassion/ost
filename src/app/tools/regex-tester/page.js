"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Code2, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';

const PRESETS = [
  { name: 'Email Address', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', flags: 'g' },
  { name: 'URL / Web Address', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'gi' },
  { name: 'IPv4 Address', pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b', flags: 'g' },
  { name: 'Hex Color (#FFF or #FFFFFF)', pattern: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$', flags: 'g' },
  { name: 'Date (YYYY-MM-DD)', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', flags: 'g' },
  { name: 'HTML Tags', pattern: '<\\/?[a-zA-Z][^>]*>', flags: 'g' },
];

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [flags, setFlags] = useState('gi');
  const [testString, setTestString] = useState('Contact support@opensourcetools.online or dev-team@example.com for help with SEO audits.');
  const [copied, setCopied] = useState(false);

  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, highlightedHtml: testString };

    try {
      const reg = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
      const matches = [];
      let m;
      let lastIndex = 0;
      let html = '';

      const maxMatches = 100;
      while ((m = reg.exec(testString)) !== null && matches.length < maxMatches) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
        });

        html += escapeHtml(testString.slice(lastIndex, m.index));
        html += `<mark style="background: rgba(59, 130, 246, 0.35); color: inherit; padding: 2px 4px; border-radius: 4px; border-bottom: 2px solid #3B82F6;">${escapeHtml(m[0])}</mark>`;
        lastIndex = m.index + m[0].length;

        if (m[0].length === 0) reg.lastIndex++;
      }
      html += escapeHtml(testString.slice(lastIndex));

      return { matches, error: null, highlightedHtml: html };
    } catch (err) {
      return { matches: [], error: err.message, highlightedHtml: escapeHtml(testString) };
    }
  }, [pattern, flags, testString]);

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) setFlags(flags.replace(flag, ''));
    else setFlags(flags + flag);
  };

  const handleCopy = async () => {
    const expr = `/${pattern}/${flags}`;
    await navigator.clipboard.writeText(expr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>JavaScript Regular Expression (Regex) Tester</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Test and debug JavaScript regular expressions in real-time. Features live syntax highlighting,
          capture group inspection, flag modifiers, and a built-in library of common pattern templates.
        </p>

        {/* Preset Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.45rem' }}>
            Quick Pattern Presets:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="lv2-pill-btn"
                onClick={() => { setPattern(p.pattern); setFlags(p.flags); }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Regex Input Bar with Flag Toggles */}
        <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)' }}>/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. ([a-z]+)@([a-z]+)"
              className="search-input"
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9375rem' }}
            />
            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)' }}>/</span>

            {/* Flag Toggles */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['g', 'i', 'm', 's', 'u'].map((f) => {
                const isActive = flags.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFlag(f)}
                    className={`lv2-pill-btn ${isActive ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}
                    title={`Flag: ${f}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleCopy}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              <AlertCircle size={13} />
              <span>Regex Syntax Error: {error}</span>
            </div>
          )}
        </div>

        {/* Test String & Live Highlighting Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%', marginBottom: '1.25rem' }}>
          {/* Test String Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Test String:
            </label>
            <textarea
              rows={8}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter text to match against regex..."
              className="search-input"
              style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          {/* Highlighted Match Box */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
              <strong>Match Highlights</strong>
              <span style={{ color: matches.length ? '#10B981' : 'var(--text-secondary)' }}>
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
              </span>
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              style={{
                width: '100%',
                height: '190px',
                padding: '0.85rem',
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            />
          </div>
        </div>

        {/* Capture Groups Table */}
        {matches.length > 0 && matches.some((m) => m.groups.length > 0) && (
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #3B82F6' }}>
            <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
              Capture Groups Breakdown:
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              {matches.map((m, idx) => (
                <div key={idx} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--lv2-blue-light)' }}>Match #{idx + 1}: </span>
                  <code>{m.match}</code> (pos {m.index})
                  {m.groups.map((g, gIdx) => (
                    <div key={gIdx} style={{ marginLeft: '1rem', marginTop: '2px', color: 'var(--text-secondary)' }}>
                      Group {gIdx + 1}: <code style={{ color: 'var(--text-primary)' }}>{g || '<Empty>'}</code>
                    </div>
                  ))}
                </div>
              ))}
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
      <h2>ECMAScript Regular Expression Engine Standards</h2>
      <p>
        Regular Expressions (Regex) provide standardized pattern-matching syntax for string validation, lexical token parsing, and text extraction defined under the <a href="https://tc39.es/ecma262/#sec-regexp-regular-expression-objects" target="_blank" rel="noopener noreferrer">ECMA-262 ECMAScript standard</a>.
      </p>

      <h2>Standard Regex Modifier Flags</h2>

      <ul>
        <li><strong><code>g</code> (Global Match):</strong> Continues scanning throughout the entire target string rather than terminating after the first match.</li>
        <li><strong><code>i</code> (Ignore Case):</strong> Disables case sensitivity (e.g. <code>/a/i</code> matches both <code>a</code> and <code>A</code>).</li>
        <li><strong><code>m</code> (Multiline):</strong> Changes anchors <code>^</code> and <code>$</code> to match the start and end of every line rather than the start and end of the entire string.</li>
        <li><strong><code>s</code> (dotAll):</strong> Allows the dot (<code>.</code>) wildcard to match newline characters (<code>\n</code>).</li>
        <li><strong><code>u</code> (Unicode):</strong> Treats the pattern as a sequence of full Unicode code points.</li>
      </ul>

      <h2>Mitigating ReDoS (Catastrophic Backtracking)</h2>

      <p>
        Regular Expression Denial of Service (ReDoS) occurs when nested quantifiers (e.g. <code>(a+)+$</code>) cause exponential computational complexity ($O(2^n)$) on non-matching strings, causing web server CPU starvation. Always avoid overlapping greedy quantifiers.
      </p>

      <h2>Synergies with Developer &amp; Data Tools</h2>

      <p>
        Integrate regex pattern matching with our full developer toolkit:
      </p>
      <ul>
        <li><strong>JSON Formatting:</strong> Validate payload structures with our <Link href="/tools/json-formatter">JSON Formatter &amp; Validator</Link>.</li>
        <li><strong>URL String Inspection:</strong> Percent-encode regex query strings with our <Link href="/tools/url-encoder">URL Encoder / Decoder</Link>.</li>
        <li><strong>List Deduplication:</strong> Clean regex pattern exports with our <Link href="/tools/text-deduplicator">Text Deduplicator</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between capturing and non-capturing groups?</h3>
      <p>
        Capturing groups <code>(abc)</code> store the matched substring in memory for backreferences and array exports. Non-capturing groups <code>(?:abc)</code> group tokens for quantification without memory overhead.
      </p>

      <h3>How do lookaheads work in JavaScript regex?</h3>
      <p>
        Positive lookaheads <code>(?=pattern)</code> assert that what follows immediately matches the pattern without consuming characters in the match result.
      </p>
    </article>
  );
}
