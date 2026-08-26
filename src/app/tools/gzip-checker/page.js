"use client";
import { useState } from 'react';
import Link from 'next/link';

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
      <h2>HTTP Content Compression: Brotli (br) vs. Gzip (gzip) Standards</h2>
      <p>
        HTTP compression reduces the raw byte payload transferred over the network between web servers and client browsers. Enabling modern compression algorithms on text-based assets (HTML, CSS, JavaScript, JSON, SVG) routinely reduces bandwidth consumption by <strong>65% to 85%</strong>, accelerating Time-To-First-Byte (TTFB) and improving Core Web Vitals.
      </p>

      <h2>Compression Algorithm Specifications</h2>

      <h3>1. Brotli Compression (<code>Content-Encoding: br</code>)</h3>
      <p>
        Standardized under <a href="https://www.rfc-editor.org/rfc/rfc7932.html" target="_blank" rel="noopener noreferrer">IETF RFC 7932</a>, Brotli uses a combination of the LZ77 algorithm, Huffman coding, and 2nd-order context modeling with a built-in 120 KB static dictionary. Brotli produces payloads roughly <strong>15% to 25% smaller</strong> than Gzip at equivalent CPU compression levels.
      </p>

      <h3>2. Gzip Compression (<code>Content-Encoding: gzip</code>)</h3>
      <p>
        Standardized under <a href="https://www.rfc-editor.org/rfc/rfc1952.html" target="_blank" rel="noopener noreferrer">IETF RFC 1952</a>, Gzip utilizes the DEFLATE algorithm. Gzip is universally supported across every browser and legacy HTTP client.
      </p>

      <h2>Server Configuration Examples</h2>

      <h3>Nginx (Brotli + Gzip Fallback)</h3>
      <pre className="code-pre">
        <code>{`# Enable Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 256;
gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;

# Enable Brotli (ngx_brotli module)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript application/xml image/svg+xml;`}</code>
      </pre>

      <h2>The Importance of the <code>Vary: Accept-Encoding</code> Header</h2>
      <p>
        When dynamic compression is enabled, servers must send the <code>Vary: Accept-Encoding</code> header. This instructs intermediate caching proxies and CDNs to store separate cached copies of the resource for clients supporting Brotli (<code>br</code>), Gzip (<code>gzip</code>), or uncompressed (<code>identity</code>), preventing corrupted responses from being delivered to legacy clients.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>Should media assets (JPEG, WebP, MP4) be compressed with Gzip?</h3>
      <p>
        No. Image, video, and audio formats are already compressed with domain-specific binary codecs. Attempting to Gzip or Brotli compress JPEGs or WebP images wastes CPU cycles and can occasionally increase file size.
      </p>

      <h3>What is the Identity-Encoding probe?</h3>
      <p>
        An <code>Accept-Encoding: identity</code> probe tests whether a server correctly respects client requests for raw uncompressed bytes. Servers that return compressed data despite an explicit <code>identity</code> header violate RFC 9110 specifications.
      </p>

      <h3>How does compression affect page load performance?</h3>
      <p>
        Smaller transfer sizes reduce network round trips and packet latency. Measure your total transfer weight with our <Link href="/tools/page-size">Page Size Checker</Link> and audit end-to-end rendering speed with our <Link href="/tools/page-speed">Page Speed Checker</Link>.
      </p>
    </article>
  );
}