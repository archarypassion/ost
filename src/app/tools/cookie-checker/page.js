"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Cookie, CheckCircle, AlertTriangle, XCircle, Search, ShieldCheck, Lock } from 'lucide-react';

export default function CookieCheckerPage() {
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
      const res = await fetch('/api/tools/cookie-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to inspect cookies.');
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
        <h1>HTTP Cookie &amp; SameSite Security Inspector</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Inspect HTTP <code>Set-Cookie</code> response headers for essential security flags
          including <code>Secure</code>, <code>HttpOnly</code>, <code>SameSite</code>, and expiration policies.
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
              <Cookie size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {loading ? 'Inspecting Headers...' : 'Inspect Cookies'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>Cookie Audit Error: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Scorecard */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: data.warnings.length === 0 ? '4px solid #10B981' : '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Target Endpoint
                </span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '2px' }}>{data.finalUrl}</div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Cookies Discovered:</span>
                  <strong style={{ fontSize: '1.25rem' }}>{data.cookieCount}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Security Warnings:</span>
                  <strong style={{ color: data.warnings.length > 0 ? '#EF4444' : '#10B981', fontSize: '1.25rem' }}>
                    {data.warnings.length}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies Breakdown List */}
          {data.cookies.length === 0 ? (
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No <code>Set-Cookie</code> headers were sent by this server on initial request.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.cookies.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    borderLeft: c.secure && c.sameSite ? '3px solid #10B981' : '3px solid #F59E0B',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--lv2-blue-light)' }}>{c.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        Path: {c.path || '/'} · Domain: {c.domain || 'Host-only'}
                      </span>
                    </div>

                    {/* Flags Badges */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: c.secure ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: c.secure ? '#10B981' : '#EF4444' }}>
                        {c.secure ? 'Secure: Yes' : 'Secure: No'}
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: c.httpOnly ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: c.httpOnly ? '#10B981' : '#F59E0B' }}>
                        {c.httpOnly ? 'HttpOnly: Yes' : 'HttpOnly: No'}
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: c.sameSite ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: c.sameSite ? '#3B82F6' : '#EF4444' }}>
                        SameSite: {c.sameSite || 'None / Missing'}
                      </span>
                    </div>
                  </div>

                  {/* Raw Header Snippet */}
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                    {c.raw}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings List */}
          {data.warnings && data.warnings.length > 0 && (
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', color: '#EF4444', fontSize: '0.8125rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Security &amp; Privacy Warnings:</strong>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {data.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>RFC 6265bis HTTP Cookie Security Standards</h2>
      <p>
        HTTP state management cookies defined by <a href="https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis" target="_blank" rel="noopener noreferrer">IETF RFC 6265bis</a> are small key-value strings stored by web browsers to persist user authentication sessions, shopping carts, and site preferences. Because cookies often store sensitive session tokens, missing security attributes expose web applications to severe vulnerabilities.
      </p>

      <h2>Critical Cookie Security Flags Explained</h2>

      <ul>
        <li><strong><code>Secure</code> Flag:</strong> Directs the browser to only transmit the cookie over encrypted HTTPS connections. Prevents man-in-the-middle (MitM) eavesdropping over unencrypted WiFi.</li>
        <li><strong><code>HttpOnly</code> Flag:</strong> Blocks client-side JavaScript (<code>document.cookie</code>) from accessing the cookie. Prevents Cross-Site Scripting (XSS) session token theft.</li>
        <li><strong><code>SameSite</code> Attribute:</strong> Controls whether cookies are transmitted with cross-site requests:
          <ul>
            <li><code>SameSite=Strict</code>: Cookie is never sent on cross-site requests (highest CSRF protection).</li>
            <li><code>SameSite=Lax</code>: Cookie is sent on top-level safe GET navigations (recommended default).</li>
            <li><code>SameSite=None; Secure</code>: Required for third-party cross-site embeds and iframes.</li>
          </ul>
        </li>
      </ul>

      <h2>Recommended Set-Cookie Production Header</h2>

      <pre className="code-pre"><code>Set-Cookie: session_id=xyz123; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=86400</code></pre>

      <h2>Domain &amp; Security Tool Suite</h2>

      <p>
        Perform comprehensive security checks:
      </p>
      <ul>
        <li><strong>Security Header Auditing:</strong> Inspect HSTS and CSP with our <Link href="/tools/security-headers">Security Headers Checker</Link>.</li>
        <li><strong>SSL Encryption Verification:</strong> Inspect TLS certificates with our <Link href="/tools/ssl-checker">SSL Certificate Checker</Link>.</li>
        <li><strong>CORS Inspection:</strong> Audit cross-origin headers with our <Link href="/tools/cors-checker">CORS Headers Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What happens if SameSite is omitted in modern browsers?</h3>
      <p>
        Modern Chromium browsers (Google Chrome, Microsoft Edge) automatically apply a default policy of <code>SameSite=Lax</code> if the attribute is omitted, but explicitly declaring it is required for cross-browser consistency.
      </p>

      <h3>Can an HTTP site set a Secure cookie?</h3>
      <p>
        No. Under modern browser security specifications, browsers reject <code>Set-Cookie</code> directives containing the <code>Secure</code> flag if received over an insecure plaintext HTTP connection.
      </p>
    </article>
  );
}
