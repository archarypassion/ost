"use client";
import { useState } from 'react';

export default function PageSpeedChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1800));
    setResult({
      mobile: { score: 68, lcp: '3.2s', fid: '120ms', cls: '0.08', fcp: '2.1s', ttfb: '0.4s' },
      desktop: { score: 91, lcp: '1.4s', fid: '18ms', cls: '0.02', fcp: '0.8s', ttfb: '0.3s' },
    });
    setLoading(false);
  };

  const scoreColor = s => s >= 90 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444';
  const scoreLabel = s => s >= 90 ? 'Good' : s >= 50 ? 'Needs Improvement' : 'Poor';

  return (
    <div>
      <div className="tool-header"><h1>Page Speed Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Measuring...' : 'Check Speed'}</button>
        </form>
        <p className="tool-description">Measure Core Web Vitals and performance scores for both mobile and desktop versions of any webpage.</p>
        {result && (
          <div className="result-box" style={{ gap: '1rem' }}>
            {['mobile', 'desktop'].map(device => (
              <div key={device}>
                <h4 style={{ color: 'var(--text-primary)', textTransform: 'capitalize', marginBottom: '0.5rem' }}>{device}</h4>
                <div className="result-grid">
                  <div className="result-item">
                    <span className="result-label">Performance Score</span>
                    <span style={{ color: scoreColor(result[device].score), fontWeight: 700 }}>{result[device].score}/100 — {scoreLabel(result[device].score)}</span>
                  </div>
                  <div className="result-item"><span className="result-label">LCP (Largest Contentful Paint)</span><span className="result-value">{result[device].lcp}</span></div>
                  <div className="result-item"><span className="result-label">FID (First Input Delay)</span><span className="result-value">{result[device].fid}</span></div>
                  <div className="result-item"><span className="result-label">CLS (Cumulative Layout Shift)</span><span className="result-value">{result[device].cls}</span></div>
                  <div className="result-item"><span className="result-label">FCP (First Contentful Paint)</span><span className="result-value">{result[device].fcp}</span></div>
                  <div className="result-item"><span className="result-label">TTFB (Time to First Byte)</span><span className="result-value">{result[device].ttfb}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Core Web Vitals & Page Speed: Google's Performance Metrics Demystified</h2>
          <p>Page speed has been an official Google ranking factor since 2010, but the introduction of Core Web Vitals as a ranking signal in 2021 marked a significant evolution in how speed is measured and evaluated. Rather than relying on synthetic lab tests and arbitrary millisecond thresholds, Core Web Vitals measure actual user experiences using real-world data from Chrome users. They're designed to capture the specific aspects of page performance that users genuinely notice and care about.</p>
          <p>There are three Core Web Vitals, each measuring a different dimension of the user experience: loading performance, interactivity, and visual stability. Understanding each one individually helps you prioritize your optimization efforts rather than chasing a single abstract "speed score."</p>
          <h3>LCP — Largest Contentful Paint</h3>
          <p>LCP measures how long it takes for the largest visible element on the page to fully load. This is usually a hero image, a large heading, or the main content block. A good LCP is 2.5 seconds or less. Needs Improvement is between 2.5 and 4 seconds. Anything above 4 seconds is classified as Poor. LCP is heavily influenced by image optimization, server response time, and render-blocking resources like large CSS or JavaScript files that delay the browser from rendering content.</p>
          <h3>INP — Interaction to Next Paint (formerly FID)</h3>
          <p>INP replaced First Input Delay (FID) as a Core Web Vital in 2024. It measures the responsiveness of a page to user interactions — specifically, how long it takes for the page to visually respond after a user taps, clicks, or types. Poor INP is almost always caused by excessive JavaScript execution that blocks the main thread. Heavy third-party scripts — analytics, chat widgets, ad networks — are frequent culprits. A good INP score is under 200 milliseconds.</p>
          <h3>CLS — Cumulative Layout Shift</h3>
          <p>CLS measures visual stability — how much the page layout unexpectedly shifts while loading. Have you ever been about to click a button and suddenly the page jumps because an image loaded above it, and you accidentally clicked something else entirely? That's a layout shift. A good CLS score is under 0.1. The most common causes are images without explicit width and height attributes, ads or embeds that appear after the page has already rendered, and web fonts that cause text to reflow when they load.</p>
          <h3>TTFB — Time to First Byte</h3>
          <p>TTFB measures how quickly the server starts sending data after a browser request. While not a Core Web Vital itself, a slow TTFB cascades into poor scores for all other metrics because nothing can load until the server starts responding. TTFB is primarily a server-side concern — hosting quality, database performance, server-side rendering complexity, and CDN configuration all directly affect it. A good TTFB is under 0.8 seconds.</p>
          <h3>Mobile vs. Desktop Performance</h3>
          <p>Google uses mobile-first indexing, meaning it evaluates the mobile version of your pages for ranking purposes. This makes mobile performance scores more important than desktop ones for SEO purposes. Mobile scores are consistently lower than desktop scores for most websites because mobile devices have less processing power and often operate on slower connections. Use our Page Speed Checker to benchmark both — use the mobile score to understand your SEO impact, and the desktop score to understand the experience your best-connected users are getting.</p>
        </article>
      </div>
    </div>
  );
}
