"use client";
import { useState } from 'react';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

export default function GzipCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/gzip-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl) setData(json);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>Gzip Compression Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="https://example.com" className="search-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking…' : 'Check Compression'}</button>
        </form>
        <p className="tool-description">
          We fetch your page advertising support for gzip, deflate, and Brotli — measure how many bytes
          arrive on the wire, decompress them, and compare with the uncompressed size to show your real
          transfer savings. We also do an identity-encoding probe to catch misconfigured servers.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { summary, contentEncoding, contentType, bytesOnWire, uncompressedSize, savingsBytes, savingsPct, ratio, formatted, identityCheck, varyHeader, checks } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const bannerText = !contentEncoding
    ? 'No compression — server is sending uncompressed bytes'
    : `Compressed with ${contentEncoding} — ${savingsPct?.toFixed(1)}% smaller on the wire`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· wire: {formatted.wire} · uncompressed: {formatted.uncompressed}{ratio ? ` · ratio ${ratio}×` : ''}</span>
      </div>

      <div className="gz-bars">
        <div className="gz-bar-row">
          <div className="gz-bar-label">On the wire ({contentEncoding || 'identity'})</div>
          <div className="gz-bar"><div className="gz-bar-fill compressed" style={{ width: `${(bytesOnWire / Math.max(uncompressedSize, bytesOnWire)) * 100}%` }} /></div>
          <div className="gz-bar-num">{formatted.wire}</div>
        </div>
        <div className="gz-bar-row">
          <div className="gz-bar-label">Uncompressed</div>
          <div className="gz-bar"><div className="gz-bar-fill uncompressed" style={{ width: '100%' }} /></div>
          <div className="gz-bar-num">{formatted.uncompressed}</div>
        </div>
        {savingsBytes !== null && (
          <div className="gz-savings">Saves <strong>{formatted.savings}</strong> per request{savingsPct !== null ? ` (${savingsPct.toFixed(1)}%)` : ''}.</div>
        )}
      </div>

      <h3 className="result-section-title">Details</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">Content-Encoding</span><span className="result-value">{contentEncoding || '— none —'}</span></div>
        <div className="result-item"><span className="result-label">Content-Type</span><span className="result-value">{contentType || '—'}</span></div>
        <div className="result-item"><span className="result-label">Vary header</span><span className="result-value">{varyHeader || '—'}</span></div>
        <div className="result-item"><span className="result-label">Wire bytes</span><span className="result-value">{bytesOnWire.toLocaleString()} B</span></div>
        <div className="result-item"><span className="result-label">Uncompressed bytes</span><span className="result-value">{uncompressedSize.toLocaleString()} B</span></div>
        <div className="result-item"><span className="result-label">Compression ratio</span><span className="result-value">{ratio ? `${ratio}×` : '—'}</span></div>
      </div>

      {identityCheck && (
        <>
          <h3 className="result-section-title">Identity-encoding probe</h3>
          <div className="gz-identity">
            <div>
              <strong>Accept-Encoding: identity</strong> request returned <code>{identityCheck.contentEncoding || 'no encoding'}</code> in {identityCheck.bytes.toLocaleString()} bytes.
            </div>
            {identityCheck.servedCompressedAnyway && (
              <div className="gz-identity-warn">⚠ Server sent compressed bytes despite <code>identity</code> being requested — non-conformant behaviour.</div>
            )}
          </div>
        </>
      )}

      <h3 className="result-section-title">Findings</h3>
      <ul className="og-check-list">
        {checks.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head"><span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span></div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTTP Compression: The Easiest Performance Win Most Sites Still Miss</h2>
      <p>HTTP compression — gzip, deflate, or Brotli — can shrink HTML, CSS, and JavaScript responses by 60–80% on the wire. That translates directly into faster page loads, lower bandwidth bills, and better Core Web Vitals scores. Yet a surprising number of production sites still ship uncompressed assets, especially API endpoints and dynamic HTML.</p>
      <h3>gzip vs Brotli</h3>
      <p>gzip has been universally supported since 2000. Brotli (announced 2015) typically compresses 15–25% smaller than gzip for HTML and CSS at equivalent CPU cost. Most modern CDNs (Cloudflare, Fastly, AWS CloudFront, Vercel) support Brotli out of the box. Enable it.</p>
      <h3>What this tool does</h3>
      <p>We bypass Node’s automatic decompression and read the raw bytes directly from the socket — that gives us the actual transfer size, not what some library reports. We then decompress and measure the original payload, so the savings number you see is the literal byte difference visitors experience. We also probe with <code>Accept-Encoding: identity</code> to catch servers that are misconfigured.</p>
      <h3>Common findings</h3>
      <p>If we report no compression, your origin or CDN isn’t serving compressed responses for this URL — check your server config (nginx <code>gzip on;</code> / Apache <code>mod_deflate</code> / your CDN’s settings). If we report compression but the savings are weak (under 50%), the server may be using a low compression level — bump it up. If we report compression on already-compressed content (JPEG, MP4) the savings will naturally be tiny — that’s expected.</p>
    </article>
  );
}
