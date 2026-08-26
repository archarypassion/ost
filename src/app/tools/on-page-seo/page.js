"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function OnPageSEO() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch('/api/tools/on-page-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Something went wrong.');
      else setData(json);
    } catch {
      setError('Network error — could not reach the checker service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header"><h1>📊 On-Page SEO Checker</h1></div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter page URL (e.g. example.com/about)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Fetches the page and runs ~17 on-page SEO checks: title, meta description, headings, images,
          canonical, viewport, language, Open Graph, Twitter Card, structured data, indexability, content length,
          and more. Returns a weighted 0–100 score with per-check explanations.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  const score = data.score;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'Poor';

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className="score-dial" style={{ width: '100%' }}>
        <div
          className="score-circle"
          style={{ '--score': score, '--color': color }}
        >
          <div className="score-circle-text">
            {score}
            <small>/ 100</small>
          </div>
        </div>
        <div className="score-summary">
          <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {label}
          </div>
          <div className="score-counts">
            <div className="score-count">
              <span className="score-count-dot pass" /> {data.counts.passed} passed
            </div>
            <div className="score-count">
              <span className="score-count-dot warn" /> {data.counts.warnings} warnings
            </div>
            <div className="score-count">
              <span className="score-count-dot fail" /> {data.counts.failed} failed
            </div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {data.counts.total} checks across {data.checks.length} signals
          </div>
        </div>
      </div>

      <div>
        <div className="result-section-title">📄 Page Summary</div>
        <div className="result-grid" style={{ width: '100%' }}>
          <ResultRow label="📍 URL" mono>
            <a href={data.url} target="_blank" rel="noreferrer" className="sitemap-link">{data.url}</a>
          </ResultRow>
          {data.finalUrl !== data.url && <ResultRow label="📍 Final URL" mono>{data.finalUrl}</ResultRow>}
          <ResultRow label="📊 HTTP Status">
            <strong>{data.httpStatus}</strong>
          </ResultRow>
          <ResultRow label="📌 Title">{data.signals.title || <Italic>Missing</Italic>}</ResultRow>
          <ResultRow label="📝 Meta description">
            {data.signals.description ? (
              <span style={{ display: 'block', textAlign: 'right' }}>{data.signals.description}</span>
            ) : <Italic>Missing</Italic>}
          </ResultRow>
          <ResultRow label="📊 H1 / H2 / H3">
            {data.signals.headings.h1Count} / {data.signals.headings.h2Count} / {data.signals.headings.h3Count}
          </ResultRow>
          <ResultRow label="🖼️ Images (missing alt)">
            <span>
              {data.signals.images.total}{' '}
              {data.signals.images.missingAlt > 0 && (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>
                  ({data.signals.images.missingAlt} missing alt)
                </span>
              )}
            </span>
          </ResultRow>
          <ResultRow label="📝 Word count">{data.signals.wordCount.toLocaleString()}</ResultRow>
          <ResultRow label="🔗 Links (internal/external)">
            {data.signals.links.internal} / {data.signals.links.external}
          </ResultRow>
          <ResultRow label="🔗 Canonical" mono>
            {data.signals.canonical || <Italic>Not declared</Italic>}
          </ResultRow>
          <ResultRow label="🌐 Lang">
            {data.signals.htmlLang || <Italic>Not set</Italic>}
          </ResultRow>
          <ResultRow label="📱 Viewport">
            <Mono>{data.signals.viewport || 'Not set'}</Mono>
          </ResultRow>
          {data.signals.jsonld.length > 0 && (
            <ResultRow label="📊 Structured data">
              <div className="tag-cloud">
                {[...new Set(data.signals.jsonld.flatMap((b) => b.types))].map((t) => (
                  <span key={t} className="ua-chip">{t}</span>
                ))}
              </div>
            </ResultRow>
          )}
        </div>
      </div>

      <div>
        <div className="result-section-title">✅ Checks ({data.checks.length})</div>
        <div className="check-list">
          {data.checks.map((c, i) => {
            const Icon = c.severity === 'pass' ? CheckCircle2 : c.severity === 'warn' ? AlertTriangle : XCircle;
            return (
              <div key={i} className="check-row">
                <Icon size={18} className={`check-icon ${c.severity}`} />
                <div className="check-body">
                  <div className="check-name">{c.name}</div>
                  <div className="check-message">{c.message}</div>
                  {c.detail && <div className="check-detail">{c.detail}</div>}
                </div>
                <div className="check-weight">w {c.weight}</div>
              </div>
            );
          })}
        </div>
      </div>

      {(Object.keys(data.signals.openGraph).length > 0 || Object.keys(data.signals.twitterCard).length > 0) && (
        <div>
          <div className="result-section-title">📱 Social Tags</div>
          <div className="result-grid" style={{ width: '100%' }}>
            {Object.entries(data.signals.openGraph).map(([k, v]) => (
              <ResultRow key={k} label={k}><Mono>{v}</Mono></ResultRow>
            ))}
            {Object.entries(data.signals.twitterCard).map(([k, v]) => (
              <ResultRow key={k} label={k}><Mono>{v}</Mono></ResultRow>
            ))}
          </div>
        </div>
      )}

      {data.redirectChain && data.redirectChain.length > 1 && (
        <div>
          <div className="result-section-title">🔄 Redirect Chain</div>
          <div className="redirect-chain">
            {data.redirectChain.map((hop, i) => (
              <div key={`${hop.url}-${i}`} className="redirect-hop">
                <span className="redirect-hop-status">{hop.status}</span>
                <span>{hop.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, children, mono = false }) {
  return (
    <div className="result-item">
      <span className="result-label">{label}</span>
      <span className={`result-value ${mono ? 'result-value-mono' : ''}`}>
        {children}
      </span>
    </div>
  );
}

function Mono({ children }) {
  return <code style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.8125rem' }}>{children}</code>;
}

function Italic({ children }) {
  return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{children}</span>;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>The 17-Point On-Page SEO Technical Audit Framework</h2>
      <p>
        On-page search engine optimization encompasses all technical, semantic, and structural signals implemented directly within a webpage's HTML code to optimize discoverability, crawlability, and ranking potential.
      </p>

      <h2>Core On-Page Evaluation Signals</h2>

      <h3>1. Semantic Heading Hierarchy (H1–H6)</h3>
      <ul>
        <li><strong>Single Primary Heading (<code>&lt;h1&gt;</code>):</strong> Every indexable page should have exactly one <code>&lt;h1&gt;</code> that clearly defines the primary topic. Multiple H1 tags fragment page focus.</li>
        <li><strong>Logical Nesting:</strong> Major sections use <code>&lt;h2&gt;</code>, subsections use <code>&lt;h3&gt;</code>. Avoid skipping heading levels (e.g. going directly from H1 to H4 for aesthetic font styling).</li>
      </ul>

      <h3>2. Image Optimization &amp; Web Accessibility</h3>
      <pre className="code-pre">
        <code>{`<img src="/images/diagram.webp" alt="Detailed diagram illustrating TLS 1.3 cryptographic handshake" width="800" height="450" loading="lazy" />`}</code>
      </pre>
      <ul>
        <li><strong>Descriptive Alt Text:</strong> Describes visual content for screen readers (WCAG 2.1 accessibility) and search engine image indexing. Avoid stuffing raw keyword strings.</li>
        <li><strong>Explicit Dimensions:</strong> Declaring <code>width</code> and <code>height</code> attributes reserves layout space and prevents Cumulative Layout Shift (CLS).</li>
      </ul>

      <h3>3. Indexation &amp; URL Directives</h3>
      <ul>
        <li><strong>Canonicalization:</strong> Ensure an explicit <Link href="/tools/canonical-url">Canonical URL</Link> points to the definitive page version.</li>
        <li><strong>Robots Directives:</strong> Verify that accidental <code>noindex</code> tags are not blocking search engines from indexing the page (audit with our <Link href="/tools/noindex-checker">Noindex Checker</Link>).</li>
      </ul>

      <h3>4. Internal &amp; External Link Equity</h3>
      <p>
        Links form the crawl topology of the web:
      </p>
      <ul>
        <li><strong>Internal Links:</strong> Pass PageRank equity to related articles, creating topic clusters.</li>
        <li><strong>External Links:</strong> Cite authoritative reference materials (e.g. W3C, IETF RFCs) to establish factual trust signals.</li>
      </ul>

      <h2>Technical Meta &amp; Social Graph Audit</h2>

      <p>
        In addition to visible content, on-page SEO requires verifying machine-readable tags:
      </p>
      <ul>
        <li><strong>Title &amp; Description:</strong> Checked for pixel length and CTR appeal (see <Link href="/tools/meta-tags">Meta Tags Checker</Link>).</li>
        <li><strong>Open Graph &amp; Twitter Cards:</strong> Validated for social sharing previews (see <Link href="/tools/open-graph">Open Graph Checker</Link>).</li>
        <li><strong>JSON-LD Structured Data:</strong> Validated against Google Rich Result specifications (see <Link href="/tools/schema-checker">Schema Validator</Link>).</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is a good On-Page SEO score?</h3>
      <p>
        An on-page score of <strong>80 or above</strong> indicates that all fundamental HTML signals (titles, headings, alt tags, canonicals, viewport, indexability) meet search engine best practices. Scores below 60 indicate missing metadata, broken heading structures, or missing image alt attributes.
      </p>

      <h3>How often should I audit on-page SEO?</h3>
      <p>
        Audit key landing pages and high-traffic articles after every site redesign, CMS migration, or template update to ensure automated scripts haven't removed meta tags or altered heading hierarchies.
      </p>

      <h3>Does on-page SEO include page load speed?</h3>
      <p>
        Yes. Page performance directly influences user bounce rates and Core Web Vitals rankings. Measure your response latency and asset sizes using our <Link href="/tools/page-speed">Page Speed Checker</Link> and <Link href="/tools/page-size">Page Size Checker</Link>.
      </p>
    </article>
  );
}