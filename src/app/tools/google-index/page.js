"use client";
import { useState } from 'react';
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
      <div className="tool-header"><h1>Google Index Checker</h1></div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter page URL (e.g. example.com/some-page)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Checking...' : 'Check Index'}
          </button>
        </form>
        <p className="tool-description">
          Combines on-page indexability signals (HTTP status, <code>noindex</code>, <code>X-Robots-Tag</code>,
          canonical, robots.txt) with a best-effort Google <code>site:</code> query to estimate whether a URL is indexed.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Google Index Checker: How to Know If Google Can See Your Pages</h2>
          <p>Publishing content is only half the battle. If Google hasn't indexed your pages, they simply won't appear in search results — no matter how well-written, optimized, or link-rich they are. Indexing is the prerequisite for ranking, and yet it's surprising how often important pages fail to get indexed, and site owners don't notice for weeks or months.</p>
          <p>A Google Index Checker lets you instantly determine whether a specific URL has made it into Google's search index. This is one of the first diagnostic steps you should take whenever a page isn't appearing in search results for queries you'd expect it to rank for.</p>
          <h3>Why Pages Don't Get Indexed</h3>
          <p>There are many reasons a page might fail to get indexed. The most common ones involve deliberate signals that are accidentally misconfigured. A noindex meta tag left on from a development environment is the classic culprit — the page is blocked from indexing by a tag that should have been removed before launch. Similarly, a robots.txt Disallow rule that prevents Googlebot from crawling the page means the noindex tag (if present) can never even be read.</p>
          <p>Other causes include pages with very thin or duplicate content that Google doesn't consider worth indexing, pages that are deeply buried in a site structure with few or no internal links pointing to them, and pages that are genuinely new and simply haven't been crawled yet. Google doesn't index pages the moment they're published — on newer or lower-authority sites, it can take days or even weeks for a new page to be crawled and indexed.</p>
          <h3>How to Check If a Page Is Indexed</h3>
          <p>The classic manual method is to search for <code>site:yourdomain.com/your-page-url</code> in Google. If the URL appears in the results, it's indexed. If it doesn't, it may not be indexed — though note that the site: operator isn't perfectly reliable and should be treated as an indicator rather than a guarantee. Google Search Console's URL Inspection tool is the most accurate source — it shows the exact indexing status as Google sees it, including whether a page is indexed, whether it was recently crawled, and if there are any issues preventing indexation.</p>
          <h3>What This Tool Does (and Doesn't Do)</h3>
          <p>Google removed its public <code>cache:</code> operator in 2024 and actively blocks server-side scraping of its results pages with CAPTCHAs and rate limits. That means no third-party tool — including this one — can guarantee a definitive index status without using Google Search Console's URL Inspection API (which requires verified property ownership). What our tool does instead is combine the indexability signals that we <em>can</em> read directly: HTTP status, the page's robots meta tag, the X-Robots-Tag response header, the canonical URL declaration, and whether robots.txt blocks Googlebot from the path. We then attempt a Google <code>site:</code> query as a supplementary signal. The result is a confidence-rated verdict that's far more useful than a yes/no — and importantly, transparent about what we can and can't know.</p>
          <h3>Getting Pages Indexed Faster</h3>
          <p>If you've published new content and want to accelerate indexing, there are a few reliable tactics. Submit the URL directly through Google Search Console's URL Inspection tool — there's a "Request Indexing" button that adds it to Google's priority crawl queue. Make sure the new page is linked from other already-indexed pages on your site (internal linking is the primary way Googlebot discovers new content). And if you have an XML sitemap, make sure the new URL is included in it and that the sitemap has been submitted to Google Search Console.</p>
        </article>
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
    headline = 'Indexed in Google';
  } else if (v.state === 'likely-indexed') {
    bannerClass = 'success';
    BannerIcon = CheckCircle2;
    headline = 'Likely indexable — no blocking signals detected';
  } else if (v.state === 'not-indexed') {
    bannerClass = 'danger';
    BannerIcon = XCircle;
    headline = 'Not indexed (or won’t be)';
  } else if (v.state === 'conflicting') {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = 'Conflicting signals — Google may still serve a stale result';
  } else {
    bannerClass = 'warning';
    BannerIcon = AlertTriangle;
    headline = 'Inconclusive';
  }

  return (
    <div className="result-box">
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
        <div className="result-section-title">Why</div>
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
        Google removed the public <code>cache:</code> operator in 2024 and actively blocks server-side scraping. For
        a definitive answer, use the{' '}
        <a
          href={`https://search.google.com/search-console`}
          target="_blank"
          rel="noreferrer"
        >
          Google Search Console URL Inspection tool
        </a>{' '}
        — it requires verified ownership of the property but reports the exact indexing status Google has for your URL.
      </div>
    </div>
  );
}

function PageBlock({ page, url }) {
  return (
    <div>
      <div className="result-section-title">On-Page Signals</div>
      <div className="result-grid">
        <ResultRow label="Requested URL" mono>{url}</ResultRow>
        {page.reached === false && (
          <ResultRow label="Status">
            <span style={{ color: '#EF4444', fontWeight: 600 }}>Unreachable — {page.error}</span>
          </ResultRow>
        )}
        {page.reached && (
          <>
            <ResultRow label="HTTP Status">
              <strong style={{ color: page.httpStatus >= 400 ? '#EF4444' : page.httpStatus >= 300 ? '#F59E0B' : '#10B981' }}>
                {page.httpStatus}
              </strong>
            </ResultRow>
            {page.finalUrl && page.finalUrl !== url && (
              <ResultRow label="Final URL" mono>{page.finalUrl}</ResultRow>
            )}
            {page.title && <ResultRow label="Page Title">{page.title}</ResultRow>}
            <ResultRow label='<meta name="robots">'>
              <Mono>{page.robotsContent || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label='<meta name="googlebot">'>
              <Mono>{page.googlebotContent || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label="X-Robots-Tag">
              <Mono>{page.xRobotsTag || 'Not present'}</Mono>
            </ResultRow>
            <ResultRow label="Canonical URL" mono>
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
      <div className="result-section-title">robots.txt Check (Googlebot)</div>
      <div className="result-grid">
        <ResultRow label="robots.txt found">
          {robots.exists ? <span style={{ color: '#10B981' }}>Yes</span> : <Italic>No (HTTP {robots.status || '—'})</Italic>}
        </ResultRow>
        <ResultRow label="Path allowed for Googlebot">
          <span style={{ color: robots.allowed ? '#10B981' : '#EF4444', fontWeight: 600 }}>
            {robots.allowed ? 'Yes' : 'No (Disallowed)'}
          </span>
        </ResultRow>
        {robots.matched && (
          <ResultRow label="Matched rule"><Mono>{robots.matched}</Mono></ResultRow>
        )}
      </div>
    </div>
  );
}

function GoogleBlock({ google }) {
  return (
    <div>
      <div className="result-section-title">Google site: Query</div>
      <div className="result-grid">
        <ResultRow label="Query verdict">
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
          <ResultRow label="Reason"><span>{google.reason}</span></ResultRow>
        )}
        {google.resultCount !== undefined && google.resultCount !== null && (
          <ResultRow label="Result count">{google.resultCount.toLocaleString()}</ResultRow>
        )}
        {google.searchUrl && (
          <ResultRow label="Open in Google">
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
