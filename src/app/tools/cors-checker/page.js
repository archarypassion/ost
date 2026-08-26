"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle, Search, ShieldCheck } from 'lucide-react';

export default function CorsCheckerPage() {
  const [url, setUrl] = useState('');
  const [origin, setOrigin] = useState('https://example.com');
  const [method, setMethod] = useState('GET');
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
      const res = await fetch('/api/tools/cors-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, origin, method }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'CORS audit failed.');
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
        <h1>CORS &amp; Access-Control Headers Checker</h1>
      </div>

      <div className="tool-card">
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Test API endpoints and web services for Cross-Origin Resource Sharing (CORS) compatibility.
          Inspects preflight <code>OPTIONS</code> requests and <code>Access-Control-*</code> response headers.
        </p>

        <form onSubmit={handleSubmit} className="search-form" style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <div className="search-bar">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter API Endpoint URL (e.g., https://api.example.com/data)..."
                className="search-input"
                disabled={loading}
              />
              <button type="submit" className="check-btn" disabled={loading}>
                <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {loading ? 'Probing...' : 'Check CORS'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Test Origin (e.g. https://example.com)"
                  className="search-input"
                  style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.8125rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>
              <div>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="search-input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                >
                  <option value="GET">Method: GET</option>
                  <option value="POST">Method: POST</option>
                  <option value="PUT">Method: PUT</option>
                  <option value="DELETE">Method: DELETE</option>
                  <option value="OPTIONS">Method: OPTIONS</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="result-box error" style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="#EF4444" />
            <strong>CORS Inspection Failed: {error}</strong>
          </div>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: '850px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Card */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: data.corsStatus === 'allowed' ? '4px solid #10B981' : '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  CORS Audit Verdict
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: data.corsStatus === 'allowed' ? '#10B981' : '#EF4444' }}>
                  {data.corsStatus === 'allowed' ? '✅ Cross-Origin Access Allowed' : '❌ Cross-Origin Requests Blocked'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>HTTP Status:</span>
                  <strong>{data.statusCode}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Preflight OPTIONS:</span>
                  <strong>{data.preflightStatusCode ? `HTTP ${data.preflightStatusCode}` : 'N/A'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Headers Matrix */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <strong style={{ fontSize: '0.9375rem', display: 'block', marginBottom: '1rem' }}>
              CORS Response Headers Breakdown:
            </strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 600 }}>Access-Control-Allow-Origin:</span>
                <code style={{ color: data.headers.allowOrigin ? '#10B981' : '#EF4444' }}>
                  {data.headers.allowOrigin || 'Missing (Requests blocked)'}
                </code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 600 }}>Access-Control-Allow-Methods:</span>
                <code>{data.headers.allowMethods || 'Not specified'}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 600 }}>Access-Control-Allow-Headers:</span>
                <code>{data.headers.allowHeaders || 'Not specified'}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 600 }}>Access-Control-Allow-Credentials:</span>
                <code>{data.headers.allowCredentials || 'false'}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 600 }}>Access-Control-Max-Age (Preflight Cache):</span>
                <code>{data.headers.maxAge ? `${data.headers.maxAge} seconds` : 'Default (5s)'}</code>
              </div>
            </div>
          </div>

          {/* Warnings Banner */}
          {data.warnings && data.warnings.length > 0 && (
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', color: '#EF4444', fontSize: '0.8125rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Security &amp; Connectivity Warnings:</strong>
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
      <h2>Cross-Origin Resource Sharing (CORS) Security Specifications</h2>
      <p>
        Cross-Origin Resource Sharing (CORS) is a browser-enforced security standard defined by the <a href="https://fetch.spec.whatwg.org/#http-cors-protocol" target="_blank" rel="noopener noreferrer">W3C WHATWG Fetch standard</a>. By default, web browsers apply the <strong>Same-Origin Policy (SOP)</strong>, preventing JavaScript code running on one domain (e.g. <code>https://app.example.com</code>) from reading HTTP responses from a different origin (e.g. <code>https://api.backend.com</code>) without explicit server permission.
      </p>

      <h2>The Anatomy of CORS Preflight Requests</h2>

      <p>
        When client JavaScript issues a non-simple HTTP request (e.g. using custom headers like <code>Authorization: Bearer &lt;token&gt;</code> or methods like <code>PUT</code>/<code>DELETE</code>), modern browsers automatically dispatch an <code>OPTIONS</code> preflight request before sending the actual payload. The server must respond with appropriate <code>Access-Control-Allow-*</code> headers or the browser aborts the request with a console CORS error.
      </p>

      <h2>Example Nginx CORS Server Configuration</h2>

      <pre className="code-pre"><code># Enable CORS in Nginx
add_header &apos;Access-Control-Allow-Origin&apos; &apos;https://app.example.com&apos; always;
add_header &apos;Access-Control-Allow-Methods&apos; &apos;GET, POST, OPTIONS&apos; always;
add_header &apos;Access-Control-Allow-Headers&apos; &apos;Authorization, Content-Type&apos; always;
if ($request_method = &apos;OPTIONS&apos;) &#123;
    add_header &apos;Access-Control-Max-Age&apos; 1728000;
    return 204;
&#125;</code></pre>

      <h2>Developer &amp; Security Tool Suite</h2>

      <p>
        Audit your server headers and API endpoints:
      </p>
      <ul>
        <li><strong>Security Header Auditing:</strong> Inspect CSP and HSTS with our <Link href="/tools/security-headers">Security Headers Checker</Link>.</li>
        <li><strong>HTTP Status Diagnostics:</strong> Test status codes with our <Link href="/tools/http-status">HTTP Status Checker</Link>.</li>
        <li><strong>Cookie Security:</strong> Audit SameSite flags with our <Link href="/tools/cookie-checker">Cookie &amp; SameSite Inspector</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why does my API work in Postman or cURL but fail in the browser?</h3>
      <p>
        Postman and cURL are developer CLI tools that do not enforce the browser Same-Origin Policy. CORS restrictions are strictly enforced by web browsers to protect end users from cross-site data theft.
      </p>

      <h3>Is Access-Control-Allow-Origin: * safe for authenticated APIs?</h3>
      <p>
        No. Using a wildcard <code>*</code> origin on endpoints that handle user credentials or session cookies is prohibited by modern browsers and introduces significant cross-site data leak vulnerabilities.
      </p>
    </article>
  );
}
