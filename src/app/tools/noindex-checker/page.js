"use client";

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import NoindexArticle from './NoindexArticle';

const BAD_DIRECTIVES = new Set(['noindex', 'nofollow', 'none', 'noarchive', 'nosnippet', 'noimageindex']);

export default function NoindexChecker() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/noindex-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
      } else {
        setData(json);
      }
    } catch {
      setError('Network error — could not reach the checker service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Noindex Tag Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter website URL (e.g. example.com)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Checking...' : 'Check'}
          </button>
        </form>
        <p className="tool-description">
          Fetches the page and checks the <code>robots</code> meta tag, the <code>googlebot</code> meta tag, and the
          <code> X-Robots-Tag</code> HTTP header to determine whether search engines are allowed to index it.
        </p>

        {error && <div className="result-error">{error}</div>}

        {data && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <NoindexArticle />
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  const indexable = data.indexable;
  const bannerClass = indexable ? 'success' : data.hasNoindex ? 'danger' : 'warning';
  const BannerIcon = indexable ? CheckCircle2 : data.hasNoindex ? XCircle : AlertTriangle;
  const headline = indexable
    ? 'Indexable — search engines can index this page.'
    : data.hasNoindex
      ? 'Noindex detected — this page is blocked from search engines.'
      : `Not indexable — HTTP status ${data.httpStatus}.`;

  return (
    <div className="result-box">
      <div className={`result-banner ${bannerClass}`}>
        <BannerIcon size={20} className="result-banner-icon" />
        <span>{headline}</span>
      </div>

      <div>
        <div className="result-section-title">Overview</div>
        <div className="result-grid">
          <ResultRow label="Requested URL" mono>{data.url}</ResultRow>
          {data.finalUrl && data.finalUrl !== data.url && (
            <ResultRow label="Final URL" mono>{data.finalUrl}</ResultRow>
          )}
          <ResultRow label="HTTP Status">
            <strong>{data.httpStatus}</strong>
          </ResultRow>
          {data.contentType && (
            <ResultRow label="Content-Type">{data.contentType}</ResultRow>
          )}
          {data.pageTitle && (
            <ResultRow label="Page Title">{data.pageTitle}</ResultRow>
          )}
          <ResultRow label="Indexable">
            <span style={{ color: indexable ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {indexable ? 'Yes' : 'No'}
            </span>
          </ResultRow>
        </div>
      </div>

      <div>
        <div className="result-section-title">Directives Found</div>
        <div className="result-grid">
          <ResultRow label='<meta name="robots">'>
            <DirectiveValue value={data.robotsContent} />
          </ResultRow>
          <ResultRow label='<meta name="googlebot">'>
            <DirectiveValue value={data.googlebotContent} />
          </ResultRow>
          <ResultRow label="X-Robots-Tag header">
            <DirectiveValue value={data.xRobotsTag} />
          </ResultRow>
          {data.directives.length > 0 && (
            <ResultRow label="All directives">
              <div className="directive-list">
                {data.directives.map((d) => (
                  <span
                    key={d}
                    className={`directive-chip ${BAD_DIRECTIVES.has(d) ? 'bad' : ''}`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </ResultRow>
          )}
        </div>
      </div>

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

function DirectiveValue({ value }) {
  if (!value) {
    return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not present</span>;
  }
  return <code style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.8125rem' }}>{value}</code>;
}
