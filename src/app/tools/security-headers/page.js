"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Lock, Copy, Check } from 'lucide-react';

const NGINX_SECURITY_SNIPPET = `# Nginx Security Headers Configuration
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;`;

const APACHE_SECURITY_SNIPPET = `# Apache .htaccess Security Headers
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>`;

export default function SecurityHeadersPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/security-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err?.message || 'Network error — could not reach security headers service.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (snippet, key) => {
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return '#10B981';
    if (grade === 'B') return '#3B82F6';
    if (grade === 'C') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div>
      <div className="tool-header">
        <h1>HTTP Security Headers Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="url"
            placeholder="Enter website URL (e.g. https://example.com)"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Scanning...' : 'Audit Headers'}
          </button>
        </form>

        <p className="tool-description">
          Inspect HTTP response headers for OWASP recommended security protections: HSTS, Content-Security-Policy,
          X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and server fingerprint leaks.
        </p>

        {error && <div className="result-error" style={{ width: '100%', maxWidth: '720px' }}>{error}</div>}

        {data && (
          <div className="result-box">
            {/* Score & Grade Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '12px',
                    backgroundColor: colorMixWithAlpha(getGradeColor(data.grade), 0.15),
                    color: getGradeColor(data.grade),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    border: `1.5px solid ${getGradeColor(data.grade)}`,
                  }}
                >
                  {data.grade}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Security Score: {data.score}/100</h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Target: {data.url}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Header Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {data.headers?.map((h) => (
                <div
                  key={h.name}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${h.pass ? '#10B981' : h.severity === 'high' ? '#EF4444' : '#F59E0B'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {h.pass ? <CheckCircle2 size={16} color="#10B981" /> : h.severity === 'high' ? <XCircle size={16} color="#EF4444" /> : <AlertTriangle size={16} color="#F59E0B" />}
                      <strong>{h.label}</strong>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: h.pass ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: h.pass ? '#10B981' : '#EF4444',
                      }}
                    >
                      {h.pass ? 'PASS' : 'MISSING / WEAK'}
                    </span>
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {h.message}
                  </p>

                  {h.value && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', wordBreak: 'break-all' }}>
                      <code>{h.value}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Information Leaks */}
            {data.infoLeaks?.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px' }}>
                <strong style={{ color: '#F59E0B', fontSize: '0.875rem' }}>Information Disclosure Headers Detected</strong>
                <p style={{ fontSize: '0.8125rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-secondary)' }}>
                  These headers reveal backend web server versions to potential attackers:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
                  {data.infoLeaks.map((l) => (
                    <li key={l.header}><code>{l.header}</code>: {l.value}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Config Remediation Snippets */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem' }}>Recommended Server Configurations</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={() => copyCode(NGINX_SECURITY_SNIPPET, 'nginx')}
                >
                  {copiedSnippet === 'nginx' ? <Check size={12} color="#10B981" /> : <Copy size={12} />} Copy Nginx Config
                </button>
                <button
                  type="button"
                  className="lv2-pill-btn"
                  onClick={() => copyCode(APACHE_SECURITY_SNIPPET, 'apache')}
                >
                  {copiedSnippet === 'apache' ? <Check size={12} color="#10B981" /> : <Copy size={12} />} Copy Apache Config
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function colorMixWithAlpha(hex, alpha) {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTTP Security Headers &amp; OWASP Defense Standards</h2>
      <p>
        HTTP security headers instruct web browsers how to handle content, restrict framing, prevent cross-site scripting (XSS), and enforce encrypted transport protocols. Hardening web servers with modern security headers prevents client-side vulnerabilities without modifying underlying web application code.
      </p>

      <h2>Core Security Headers Breakdown</h2>

      <h3>1. HTTP Strict Transport Security (HSTS)</h3>
      <p>
        Defined under <a href="https://www.rfc-editor.org/rfc/rfc6797.html" target="_blank" rel="noopener noreferrer">RFC 6797</a>, HSTS forces browsers to communicate exclusively over encrypted HTTPS connections, mitigating SSL-stripping and man-in-the-middle (MITM) attacks:
      </p>
      <pre className="code-pre">
        <code>{`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`}</code>
      </pre>

      <h3>2. Content Security Policy (CSP)</h3>
      <p>
        Defined under W3C CSP Level 3, CSP restricts the domains and resource types (scripts, images, stylesheets, fonts) that a browser is permitted to execute, acting as the primary defense against Cross-Site Scripting (XSS) and data exfiltration.
      </p>

      <h3>3. X-Frame-Options &amp; Clickjacking Defense</h3>
      <p>
        Defined under <a href="https://www.rfc-editor.org/rfc/rfc7034.html" target="_blank" rel="noopener noreferrer">RFC 7034</a>, <code>X-Frame-Options: DENY</code> or <code>SAMEORIGIN</code> prevents malicious third-party websites from rendering your web pages inside hidden <code>&lt;iframe&gt;</code> overlays to hijack user clicks.
      </p>

      <h3>4. X-Content-Type-Options</h3>
      <p>
        Setting <code>X-Content-Type-Options: nosniff</code> forces the browser to adhere strictly to the MIME type sent in the <code>Content-Type</code> header, preventing MIME confusion attacks where user-uploaded images are executed as JavaScript.
      </p>

      <h2>Server Implementation Snippets</h2>

      <h3>Nginx Web Server Configuration</h3>
      <pre className="code-pre">
        <code>{NGINX_SECURITY_SNIPPET}</code>
      </pre>

      <h3>Apache Web Server (.htaccess)</h3>
      <pre className="code-pre">
        <code>{APACHE_SECURITY_SNIPPET}</code>
      </pre>

      <h2>Security &amp; Technical SEO Synergy</h2>

      <p>
        Security posture directly correlates with search engine trust and brand integrity:
      </p>
      <ul>
        <li><strong>Certificate Chain Validation:</strong> Validate your TLS handshake parameters and cipher strength with our <Link href="/tools/ssl-checker">SSL Certificate Checker</Link>.</li>
        <li><strong>Email Domain Protection:</strong> Prevent email phishing and spoofing with our <Link href="/tools/dmarc-checker">DMARC &amp; SPF Validator</Link>.</li>
        <li><strong>Redirect Chain Hygiene:</strong> Ensure HTTPS downgrade hops do not expose user credentials using our <Link href="/tools/redirect-checker">Redirect Chain Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is HSTS Preloading?</h3>
      <p>
        HSTS Preload is a global directory baked into major browsers (Chrome, Firefox, Safari) where domains are hardcoded to load strictly over HTTPS, protecting the very first connection before the server can return an HSTS header.
      </p>

      <h3>Why is &quot;unsafe-inline&quot; in CSP dangerous?</h3>
      <p>
        The <code>&apos;unsafe-inline&apos;</code> directive permits execution of inline <code>&lt;script&gt;</code> tags and DOM event handlers (e.g. <code>onclick</code>), neutralizing primary XSS defenses.
      </p>

      <h3>Does missing security headers affect Google search rankings?</h3>
      <p>
        While HTTPS is a direct ranking signal, missing secondary headers like CSP does not directly lower rankings. However, failing headers leave sites vulnerable to defacement, injection, and blacklisting which permanently damage organic search visibility.
      </p>
    </article>
  );
}
