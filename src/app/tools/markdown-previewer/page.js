"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileCode, Copy, Check, Eye, Download, Code } from 'lucide-react';

const SAMPLE_MD = `# Technical SEO & Webmaster Toolkit

Welcome to **OpenSourceTools**, the developer-first diagnostics suite.

## Key Capabilities
- *Indexation verification* (Noindex tags, robots.txt, sitemaps)
- Security header auditing (HSTS, CSP, X-Frame-Options)
- Performance & Core Web Vitals profiling

> "Fast, accessible web applications rank higher on Google Search."

### Code Integration Example
\`\`\`javascript
const score = auditPageSpeed('https://example.com');
console.log(\`TTFB: \${score.ttfbMs}ms\`);
\`\`\`

Visit our [Home Page](https://www.opensourcetools.online) for more tools!`;

function simpleMarkdownToHtml(md) {
  let html = md;

  // Escape basic HTML tags to prevent XSS in raw preview
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks ```code```
  html = html.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-pre"><code>${code.trim()}</code></pre>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings #, ##, ###
  html = html.replace(/^### (.*$)/gim, '<h3 style="margin: 0.75rem 0 0.25rem;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="margin: 1rem 0 0.5rem;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="margin: 1.25rem 0 0.5rem; font-size: 1.5rem;">$1</h1>');

  // Blockquotes > quote
  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid #3B82F6; padding-left: 1rem; margin: 0.75rem 0; color: #94A3B8; font-style: italic;">$1</blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #60A5FA; text-decoration: underline;">$1</a>');

  // Unordered lists - item
  html = html.replace(/^\- (.*$)/gim, '<li style="margin-left: 1.25rem;">$1</li>');

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p style="margin: 0.5rem 0;">');
  html = `<p style="margin: 0.5rem 0;">${html}</p>`;

  return html;
}

export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [viewTab, setViewTab] = useState('preview'); // 'preview' | 'html'
  const [copied, setCopied] = useState(false);

  const rawHtml = useMemo(() => {
    return simpleMarkdownToHtml(markdown);
  }, [markdown]);

  const handleCopy = async (val) => {
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Exported Markdown</title>\n</head>\n<body>\n${rawHtml}\n</body>\n</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="tool-header">
        <h1>Markdown to HTML Live Editor &amp; Previewer</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Edit GitHub Flavored Markdown (GFM) with live split-pane HTML rendering. Convert markdown documents
          to clean semantic HTML with instant copy and download capabilities.
        </p>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {wordCount} words · {markdown.length} characters
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={viewTab === 'preview' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setViewTab('preview')}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> Live Preview
            </button>
            <button
              type="button"
              className={viewTab === 'html' ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setViewTab('html')}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Code size={13} style={{ display: 'inline', marginRight: '4px' }} /> Raw HTML
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={() => handleCopy(viewTab === 'html' ? rawHtml : markdown)}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              className="lv2-pill-btn"
              onClick={handleDownloadHtml}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Download size={13} /> Export .html
            </button>
          </div>
        </div>

        {/* Split Editor Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {/* Markdown Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Markdown Editor:</label>
            <textarea
              rows={16}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write Markdown here..."
              className="search-input"
              style={{ width: '100%', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', lineHeight: 1.55, resize: 'vertical' }}
            />
          </div>

          {/* Rendered Preview / HTML View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {viewTab === 'preview' ? 'HTML Rendered Output:' : 'Raw HTML Code:'}
            </label>

            {viewTab === 'preview' ? (
              <div
                dangerouslySetInnerHTML={{ __html: rawHtml }}
                style={{
                  width: '100%',
                  height: '380px',
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflowY: 'auto',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                }}
              />
            ) : (
              <textarea
                readOnly
                rows={16}
                value={rawHtml}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '10px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', lineHeight: 1.5, resize: 'vertical', color: 'var(--text-primary)' }}
              />
            )}
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
      <h2>CommonMark &amp; GitHub Flavored Markdown (GFM) Specifications</h2>
      <p>
        Markdown is a lightweight plaintext formatting syntax designed by John Gruber and Aaron Swartz in 2004. Formalized under the <a href="https://commonmark.org" target="_blank" rel="noopener noreferrer">CommonMark</a> specification and extended by GitHub (GFM), it allows content authors to write human-readable text that converts into valid semantic HTML5 markup.
      </p>

      <h2>Core Markdown Syntax Elements</h2>

      <ul>
        <li><strong>Headings:</strong> <code># Heading 1</code> maps to <code>&lt;h1&gt;</code>, <code>## Heading 2</code> maps to <code>&lt;h2&gt;</code>, etc.</li>
        <li><strong>Emphasis:</strong> <code>**bold text**</code> maps to <code>&lt;strong&gt;</code>, and <code>*italic*</code> maps to <code>&lt;em&gt;</code>.</li>
        <li><strong>Hyperlinks:</strong> <code>[Anchor Text](https://example.com)</code> maps to <code>&lt;a href=&quot;...&quot;&gt;</code>.</li>
        <li><strong>Code Blocks:</strong> Triple backticks with language tags (<code>```javascript</code>) produce syntax-highlighted <code>&lt;pre&gt;&lt;code&gt;</code> elements.</li>
      </ul>

      <h2>Markdown for SEO Content Workflows</h2>

      <p>
        Writing web content in Markdown ensures clean, semantic HTML structure without proprietary Microsoft Word or Google Docs inline styling junk that can degrade page speed and crawl budget efficiency.
      </p>

      <h2>Synergies with Developer &amp; On-Page Tools</h2>

      <p>
        Pair Markdown authoring with our content utilities:
      </p>
      <ul>
        <li><strong>Readability Scoring:</strong> Evaluate reading grades with our <Link href="/tools/readability-checker">Readability Score Analyzer</Link>.</li>
        <li><strong>HTML Entity Sanitization:</strong> Escape special characters with our <Link href="/tools/html-entity">HTML Entity Encoder</Link>.</li>
        <li><strong>Character &amp; Word Counts:</strong> Verify density with our <Link href="/tools/word-count">Word Count Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Is Markdown converted in the browser?</h3>
      <p>
        Yes. All markdown parsing and HTML generation runs entirely in client-side memory with zero server round-trips.
      </p>

      <h3>How does semantic HTML from Markdown improve SEO?</h3>
      <p>
        Markdown maps directly to standard HTML semantic elements (<code>&lt;h1&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;blockquote&gt;</code>, <code>&lt;ul&gt;</code>), enabling search engine spiders to understand content hierarchy effortlessly.
      </p>
    </article>
  );
}
