"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Radio, CheckCircle, AlertTriangle, XCircle, Search, Zap, ShieldCheck } from 'lucide-react';

export default function HttpProtocolCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/tools/http-protocol-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Protocol audit failed.');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>HTTP/2 &amp; HTTP/3 Protocol Checker</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Test web server ALPN protocol negotiation for modern HTTP/2 binary multiplexing and
          HTTP/3 (QUIC) support to minimize Core Web Vitals network latency.
        </p>

        <form onSubmit={handleSubmit} className="search-form" style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
          <div className="search-bar">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)..."
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="check-btn" disabled={loading}>
              <Radio size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Probing ALPN...' : 'Check Protocols'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>Protocol Check Failed: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Scorecard */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: data.protocols.http2 || data.protocols.http3 ? '4px solid #10B981' : '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Negotiated ALPN Protocol
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px', color: data.protocols.http2 ? '#10B981' : 'var(--text-primary)' }}>
                  {data.negotiatedProtocol.toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Target: {data.hostname}:{data.port}</span>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Handshake Time:</span>
                  <strong style={{ fontSize: '1.25rem' }}>{data.tls.handshakeElapsedMs}ms</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>TLS Version:</span>
                  <strong>{data.tls.version || 'TLS 1.3'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Protocol Support Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* HTTP/1.1 */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong>HTTP/1.1 (Legacy)</strong>
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.75rem' }}>SUPPORTED</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Standard sequential request pipeline over TCP. Universal fallback.
              </p>
            </div>

            {/* HTTP/2 */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', borderLeft: data.protocols.http2 ? '3px solid #10B981' : '3px solid #EF4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong>HTTP/2 (Multiplexing)</strong>
                <span style={{ color: data.protocols.http2 ? '#10B981' : '#EF4444', fontWeight: 700, fontSize: '0.75rem' }}>
                  {data.protocols.http2 ? 'SUPPORTED' : 'UNAVAILABLE'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Binary framing layer, multiplexed concurrent streams, HPACK header compression.
              </p>
            </div>

            {/* HTTP/3 */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', borderLeft: data.protocols.http3 ? '3px solid #10B981' : '3px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong>HTTP/3 (QUIC / UDP)</strong>
                <span style={{ color: data.protocols.http3 ? '#10B981' : '#F59E0B', fontWeight: 700, fontSize: '0.75rem' }}>
                  {data.protocols.http3 ? 'ENABLED (Alt-Svc)' : 'NOT ADVERTISED'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                UDP transport, zero Head-of-Line blocking, built-in TLS 1.3 encryption.
              </p>
            </div>
          </div>

          {/* Technical Details Banner */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.75rem' }}>Server &amp; Connection Details:</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Cipher Suite: </span><code>{data.tls.cipher || 'TLS_AES_128_GCM_SHA256'}</code></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Web Server: </span><code>{data.serverHeader || 'Hidden / Cloudflare'}</code></div>
              {data.altSvcHeader && (
                <div><span style={{ color: 'var(--text-secondary)' }}>Alt-Svc Header: </span><code>{data.altSvcHeader}</code></div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTTP Protocol Evolution: HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC</h2>
      <p>
        The Hypertext Transfer Protocol (HTTP) is the foundational application layer protocol of the World Wide Web. Upgrading web servers to modern protocol specifications (HTTP/2 and HTTP/3) dramatically reduces latency, eliminates TCP connection contention, and directly improves Google Core Web Vitals (Largest Contentful Paint &amp; First Contentful Paint).
      </p>

      <h2>Architectural Differences Compared</h2>

      <ul>
        <li><strong>HTTP/1.1 (RFC 2616):</strong> Plaintext protocol limited by Head-of-Line (HoL) blocking; browsers can only open 6 parallel TCP connections per hostname, causing resource queuing.</li>
        <li><strong>HTTP/2 (RFC 7540):</strong> Introduces a binary framing layer that allows hundreds of assets (CSS, JS, images) to be multiplexed concurrently over a single TCP connection with HPACK header compression.</li>
        <li><strong>HTTP/3 / QUIC (RFC 9114):</strong> Replaces TCP with UDP-based QUIC transport developed by Google, eliminating packet loss transport-layer blocking and enabling 0-RTT connection resumption.</li>
      </ul>

      <h2>ALPN (Application-Layer Protocol Negotiation)</h2>

      <p>
        During the initial TLS handshake, the browser and server negotiate supported application protocols via the TLS ALPN extension (RFC 7301). Servers return <code>h2</code> if HTTP/2 is enabled, allowing seamless protocol upgrades over HTTPS port 443.
      </p>

      <h2>Performance &amp; Server Infrastructure Suite</h2>

      <p>
        Audit your complete network performance:
      </p>
      <ul>
        <li><strong>Real Network Timings:</strong> Measure TTFB and download speed with our <Link href="/tools/page-speed">Page Speed Checker</Link>.</li>
        <li><strong>TLS Encryption Auditing:</strong> Inspect certificate chains with our <Link href="/tools/ssl-checker">SSL Certificate Checker</Link>.</li>
        <li><strong>Wire Compression:</strong> Test Brotli and Gzip savings with our <Link href="/tools/gzip-checker">Gzip Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Does HTTP/2 require an SSL/TLS certificate?</h3>
      <p>
        While the HTTP/2 standard technically permits unencrypted cleartext (<code>h2c</code>), all major web browsers (Chrome, Firefox, Safari, Edge) strictly require HTTPS encryption for HTTP/2.
      </p>

      <h3>How do web servers advertise HTTP/3 support?</h3>
      <p>
        Servers advertise HTTP/3 via the <code>Alt-Svc</code> (Alternative Services) HTTP response header (e.g. <code>Alt-Svc: h3=&quot;:443&quot;; ma=86400</code>), signaling to browsers that future requests can use QUIC over UDP.
      </p>
    </article>
  );
}
