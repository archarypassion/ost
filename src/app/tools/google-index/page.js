"use client";
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function GoogleIndexChecker() {
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
      const res = await fetch('/api/tools/google-index', {
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
      <div className="tool-header"><h1>🔍 Google Index Checker</h1></div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter page URL (e.g. example.com/some-page)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Checking...' : '🔍 Check Index'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Combines on-page indexability signals (HTTP status, <code>noindex</code>, <code>X-Robots-Tag</code>,
          canonical, robots.txt) with a best-effort Google <code>site:</code> query to estimate whether a URL is indexed.
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
  const v = data.verdict;
  let bannerClass, BannerIcon, headline;
  if (v.state === 'indexed') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = '✅ Indexed in Google';
  } else if (v.state === 'likely-indexed') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = '✅ Likely indexable — no blocking signals detected';
  } else if (v.state === 'not-indexed') {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = '❌ Not indexed (or won\'t be)';
  } else if (v.state === 'conflicting') {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = '⚠️ Conflicting signals — Google may still serve a stale result';
  } else {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = '⚠️ Inconclusive';
  }

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>
          {headline}
          <span className={`confidence-badge ${v.confidence}`}>
            {v.confidence} confidence
          </span>
        </span>
      </div>

      <div>
        <div className="result-section-title">📋 Why</div>
        <div className="signal-list">
          {v.reasons.map((r, i) => {
            const Icon = r.kind === 'good' ? CheckCircle2 : r.kind === 'warn' ? AlertTriangle : XCircle;
            return (
              <div key={i} className={`signal-item ${r.kind}`}>
                <Icon size={16} className="signal-icon" />
                <span className="signal-text">{r.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <PageBlock page={data.page} url={data.url} />
      <RobotsBlock robots={data.robots} />
      <GoogleBlock google={data.google} />

      <div className="disclaimer">
        💡 Google removed the public <code>cache:</code> operator in 2024 and actively blocks server-side scraping. For
        a definitive answer, use the{' '}
        <a
          href={`https://search.google.com/search-console`}
          target="_blank"
          rel="noreferrer"
        >
          Google Search Console URL Inspection tool
        </a>
        {' '}— it requires verified ownership of the property but reports the exact indexing status Google has for your URL.
      </div>
    </div>
  );
}

function PageBlock({ page, url }) {
  return (
    <div>
      <div className="result-section-title">📄 On-Page Signals</div>
      <div className="result-grid" style={{ width: '100%' }}>
        <ResultRow label="📍 Requested URL" mono>{url}</ResultRow>
        {page.reached === false && (
          <ResultRow label="📊 Status">
            <span style={{ color: '#EF4444', fontWeight: 600 }}>Unreachable — {page.error}</span>
          </ResultRow>
        )}
        {page.reached && (
          <>
            <ResultRow label="📊 HTTP Status">
              <strong style={{ color: page.httpStatus >= 400 ? '#EF4444' : page.httpStatus >= 300 ? '#F59E0B' : '#10B981' }}>
                {page.httpStatus}
              </strong>
            </ResultRow>
            {page.finalUrl && page.finalUrl !== url && (
              <ResultRow label="📍 Final URL" mono>{page.finalUrl}</ResultRow>
            )}
            {page.title && <ResultRow label="📌 Page Title">{page.title}</ResultRow>}
            <ResultRow label='🤖 <meta name="robots">'>
              <Mono>{page.robotsContent || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label='🤖 <meta name="googlebot">'>
              <Mono>{page.googlebotContent || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label="📡 X-Robots-Tag">
              <Mono>{page.xRobotsTag || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label="🔗 Canonical URL" mono>
              {page.canonical || <Italic>Not declared</Italic>}
            </ResultRow>
          </>
        )}
      </div>
    </div>
  );
}

function RobotsBlock({ robots }) {
  return (
    <div>
      <div className="result-section-title">🤖 robots.txt Check (Googlebot)</div>
      <div className="result-grid" style={{ width: '100%' }}>
        <ResultRow label="📄 robots.txt found">
          {robots.exists ? <span style={{ color: '#10B981' }}>✅ Yes</span> : <Italic>No (HTTP {robots.status || '—'})</Italic>}
        </ResultRow>
        <ResultRow label="🔗 Path allowed for Googlebot">
          <span style={{ color: robots.allowed ? '#10B981' : '#EF4444', fontWeight: 600 }}>
            {robots.allowed ? '✅ Yes' : '❌ No (Disallowed)'}
          </span>
        </ResultRow>
        {robots.matched && (
          <ResultRow label="📌 Matched rule"><Mono>{robots.matched}</Mono></ResultRow>
        )}
      </div>
    </div>
  );
}

function GoogleBlock({ google }) {
  return (
    <div>
      <div className="result-section-title">🔍 Google site: Query</div>
      <div className="result-grid" style={{ width: '100%' }}>
        <ResultRow label="📊 Query verdict">
          <span style={{
            color: google.verdict === 'indexed' ? '#10B981'
              : google.verdict === 'not-indexed' ? '#EF4444'
                : '#F59E0B',
            fontWeight: 600,
          }}>
            {google.verdict}
          </span>
        </ResultRow>
        {google.reason && (
          <ResultRow label="📌 Reason"><span>{google.reason}</span></ResultRow>
        )}
        {google.resultCount !== undefined && google.resultCount !== null && (
          <ResultRow label="📊 Result count">{google.resultCount.toLocaleString()}</ResultRow>
        )}
        {google.searchUrl && (
          <ResultRow label="🔗 Open in Google">
            <a href={google.searchUrl} target="_blank" rel="noreferrer" className="sitemap-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              View results <ExternalLink size={12} />
            </a>
          </ResultRow>
        )}
      </div>
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
      <h2>The Google Indexation Pipeline: Crawling, Rendering, and Indexing</h2>
      <p>
        Indexation is the process by which Google processes web content, analyzes its structure and relevance, and stores it in the Google Index database so it can appear in Search results. A URL must pass through three distinct stages before ranking:
      </p>

      <ol>
        <li><strong>Crawling (Discovery):</strong> Googlebot requests the URL and fetches its HTML and response headers.</li>
        <li><strong>Rendering (Execution):</strong> Google's Web Rendering Service (WRS) executes JavaScript, parses CSS, and computes the final DOM.</li>
        <li><strong>Indexing (Evaluation):</strong> Google extracts content signals, canonical tags, schema, and determines whether the page provides sufficient quality to warrant indexing.</li>
      </ol>

      <h2>How This Tool Analyzes Indexability Signals</h2>

      <p>
        In early 2024, Google deprecated the public <code>cache:</code> search operator and enforces strict anti-scraping defenses on search result pages. Because of this, third-party tools cannot query live index databases without Search Console API permissions.
      </p>
      <p>
        This checker combines deterministic server-side and DOM signals to evaluate indexation health:
      </p>

      <ul>
        <li>
          <strong>HTTP Response Status:</strong> Ensures the server returns <code>200 OK</code>. Redirects (301/302) or client errors (404/410) are highlighted.
        </li>
        <li>
          <strong>Robots Directives:</strong> Inspects both HTML <code>&lt;meta name="robots"&gt;</code> and HTTP <code>X-Robots-Tag</code> headers for <Link href="/tools/noindex-checker">noindex</Link> or <code>none</code> flags.
        </li>
        <li>
          <strong>Canonical Alignment:</strong> Checks if the page declares a self-referencing <Link href="/tools/canonical-url">canonical URL</Link> or delegates authority to another URL.
        </li>
        <li>
          <strong>Robots.txt Crawl Permission:</strong> Simulates Googlebot user-agent matching against the domain's <Link href="/tools/robots-txt">robots.txt</Link> to ensure the path is crawlable.
        </li>
        <li>
          <strong>Google Site Query Probe:</strong> Executes a scoped <code>site:</code> search probe to verify whether Google serves an existing snippet for the URL.
        </li>
      </ul>

      <h2>Why Published Pages Fail to Get Indexed</h2>

      <h3>1. Discovered - Currently Not Indexed</h3>
      <p>
        Google knows the URL exists (typically via your <Link href="/tools/sitemap-checker">XML sitemap</Link> or internal links), but has not yet allocated crawl resources to fetch it. This is normal for brand-new domains or low-authority sites with limited crawl budget.
      </p>

      <h3>2. Crawled - Currently Not Indexed</h3>
      <p>
        Googlebot successfully crawled and rendered the page, but Google's quality algorithms opted not to index it. Common causes include:
      </p>
      <ul>
        <li>Substantially duplicate or templated content (check with our <Link href="/tools/keyword-density">Keyword Density Checker</Link> and <Link href="/tools/word-count">Word Count Checker</Link>).</li>
        <li>Thin content that lacks original commentary or unique data.</li>
        <li>Canonical conflict where Google picked a different representative URL.</li>
      </ul>

      <h3>3. Technical Indexation Collisions</h3>
      <p>
        A page blocked by <code>robots.txt</code> cannot have its <code>noindex</code> tag read. If other websites link to that blocked URL, Google may still index the bare URL without title or snippet data.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>How long does it take Google to index a new page?</h3>
      <p>
        Indexation times range from a few hours for established news websites to 1 to 4 weeks for new domains. Submitting URLs through Google Search Console's URL Inspection tool can expedite the initial crawl.
      </p>

      <h3>Does Google require a sitemap to index pages?</h3>
      <p>
        No. Google can discover pages through internal and external hyperlinks. However, an XML sitemap provides explicit discovery cues and timestamps that help Google prioritize crawling.
      </p>

      <h3>What is the difference between Google Search Console status and site: queries?</h3>
      <p>
        The URL Inspection tool in Google Search Console reflects Google's authoritative internal database. The <code>site:</code> operator in standard search is a diagnostic query and may occasionally lag behind real-time database updates.
      </p>
    </article>
  );
}