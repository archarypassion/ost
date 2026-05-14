"use client";

import { useState } from 'react';
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
      <div className="tool-header"><h1>On-Page SEO Checker</h1></div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter page URL (e.g. example.com/about)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
        <p className="tool-description">
          Fetches the page and runs ~17 on-page SEO checks: title, meta description, headings, images,
          canonical, viewport, language, Open Graph, Twitter Card, structured data, indexability, content length,
          and more. Returns a weighted 0–100 score with per-check explanations.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>On-Page SEO: The Complete Practical Guide for Getting It Right</h2>
          <p>Most conversations about SEO quickly drift toward link building, domain authority, and backlink profiles. And while all of that matters, there's a foundational layer that determines whether any of those off-page efforts will ever pay off — and that's on-page SEO. If your pages aren't properly optimized from the inside, no amount of external authority is going to push them to the top of search results.</p>
          <p>On-page SEO refers to every optimization you make directly on a webpage to help search engines understand what it's about and to help users decide it's worth their click. It's the art and science of communicating clearly with both algorithms and human beings at the same time.</p>

          <h3>Why On-Page SEO Still Matters More Than Ever</h3>
          <p>Some people assume that Google has become so sophisticated that it doesn't really need you to follow on-page optimization rules anymore. That's only partially true. Google's natural language processing has improved dramatically, yes — but that doesn't mean you should throw out the structured signals it uses to categorize and rank your content. Think of on-page optimization as giving Google a clear roadmap rather than making it guess. The easier you make it to understand your content, the more confidently it can rank you for the right searches.</p>

          <h3>Title Tags: Your Most Important On-Page Element</h3>
          <p>The HTML title tag is arguably the single most important on-page SEO element. It tells both Google and the user exactly what a page is about before they've even clicked on it. It's the blue clickable text you see in search results, and it's what appears in the browser tab when someone is on your page.</p>
          <p>Best practices for title tags haven't changed much over the years. Keep them between 50 and 60 characters so they don't get truncated in SERPs. Put your primary keyword as close to the beginning as feels natural. Include your brand name, especially if it carries some recognition — typically at the end separated by a pipe or dash. And don't stuff it with keywords; that stopped working years ago and now actively hurts you.</p>

          <h3>Meta Descriptions: Click-Through Rates Depend On These</h3>
          <p>Meta descriptions don't directly influence ranking, but they dramatically influence click-through rate — and click-through rate does influence ranking indirectly. A well-written meta description is essentially your 155-character sales pitch. It should accurately summarize the page content, include your target keyword (Google will bold it in search results if it matches the query), and end with a subtle call to action when it makes sense.</p>
          <p>The frustrating reality is that Google will sometimes rewrite your meta description if it thinks something else on your page better answers the user's query. But that doesn't mean you should skip writing one. Pages without meta descriptions look unfinished, and Google will grab a random snippet of text from your page that might not be flattering.</p>

          <h3>Heading Structure: More Than Just Visual Formatting</h3>
          <p>Headings — H1 through H6 — create both visual hierarchy for readers and semantic structure for crawlers. Your H1 should appear exactly once per page and should clearly state the page's primary topic, ideally including the main target keyword. Your H2 tags break your content into logical sections. H3 tags further subdivide those sections.</p>
          <p>Common mistakes include having zero H1 tags (usually a template or CMS issue), having multiple H1 tags on the same page, and using headings purely for visual styling rather than semantic meaning. Some developers use CSS to make a paragraph look like a heading without actually using heading tags — this is invisible to search engines and a missed opportunity.</p>

          <h3>Image Optimization: Alt Text Is Not Optional</h3>
          <p>Every meaningful image on your page should have a descriptive alt attribute. Alt text serves two critical purposes: it tells screen readers what an image depicts (a major accessibility concern), and it tells search engines what the image shows. Without alt text, an image is essentially invisible to crawlers and contributes nothing to your page's relevance for visual search queries.</p>
          <p>Alt text should be descriptive but concise. Describe what's in the image naturally. Avoid alt text like "image123.jpg" or stuffing it with keywords: "buy cheap blue widgets blue widget sale best widgets." A good rule of thumb: write it as if you're describing the image to someone who can't see it.</p>

          <h3>Content Quality and Word Count</h3>
          <p>There's an ongoing debate in the SEO community about minimum word counts. The honest answer is there's no magic number — a search query like "what time is it in Tokyo" can be perfectly answered in a single sentence. But for competitive informational queries, more depth usually correlates with higher rankings because it signals to Google that you've thoroughly covered the topic.</p>
          <p>What matters far more than raw word count is topical depth and relevance. Does your page answer the user's question fully? Does it address the related questions they might have? Does it provide unique insight that other pages don't? Pages that genuinely satisfy user intent — regardless of length — are the ones that tend to rank and stay ranked.</p>

          <h3>Using This Tool Effectively</h3>
          <p>Our On-Page SEO Checker pulls the key signals from any URL and presents them in an easy-to-read format so you can instantly spot gaps. Check your pages before publishing, and run regular audits on your highest-traffic URLs to make sure nothing has drifted out of spec. Even a small technical slip — a missing title tag after a CMS update, a template change that accidentally removes meta descriptions — can have a meaningful negative impact on your organic performance.</p>
        </article>
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  const score = data.score;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'Poor';

  return (
    <div className="result-box">
      <div className="score-dial">
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
        <div className="result-section-title">Page Summary</div>
        <div className="result-grid">
          <ResultRow label="URL" mono>
            <a href={data.url} target="_blank" rel="noreferrer" className="sitemap-link">{data.url}</a>
          </ResultRow>
          {data.finalUrl !== data.url && <ResultRow label="Final URL" mono>{data.finalUrl}</ResultRow>}
          <ResultRow label="HTTP Status">
            <strong>{data.httpStatus}</strong>
          </ResultRow>
          <ResultRow label="Title">{data.signals.title || <Italic>Missing</Italic>}</ResultRow>
          <ResultRow label="Meta description">
            {data.signals.description ? (
              <span style={{ display: 'block', textAlign: 'right' }}>{data.signals.description}</span>
            ) : <Italic>Missing</Italic>}
          </ResultRow>
          <ResultRow label="H1 / H2 / H3">
            {data.signals.headings.h1Count} / {data.signals.headings.h2Count} / {data.signals.headings.h3Count}
          </ResultRow>
          <ResultRow label="Images (missing alt)">
            <span>
              {data.signals.images.total}{' '}
              {data.signals.images.missingAlt > 0 && (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>
                  ({data.signals.images.missingAlt} missing alt)
                </span>
              )}
            </span>
          </ResultRow>
          <ResultRow label="Word count">{data.signals.wordCount.toLocaleString()}</ResultRow>
          <ResultRow label="Links (internal/external)">
            {data.signals.links.internal} / {data.signals.links.external}
          </ResultRow>
          <ResultRow label="Canonical" mono>
            {data.signals.canonical || <Italic>Not declared</Italic>}
          </ResultRow>
          <ResultRow label="Lang">
            {data.signals.htmlLang || <Italic>Not set</Italic>}
          </ResultRow>
          <ResultRow label="Viewport">
            <Mono>{data.signals.viewport || 'Not set'}</Mono>
          </ResultRow>
          {data.signals.jsonld.length > 0 && (
            <ResultRow label="Structured data">
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
        <div className="result-section-title">Checks ({data.checks.length})</div>
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
          <div className="result-section-title">Social Tags</div>
          <div className="result-grid">
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
          <div className="result-section-title">Redirect Chain</div>
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
