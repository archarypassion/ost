"use client";
import { useState } from 'react';
import Link from 'next/link';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

export default function SslCheckerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/ssl-checker', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
      } else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>SSL Certificate Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="example.com" className="search-input" value={domain} onChange={(e) => setDomain(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Connecting…' : 'Check Certificate'}</button>
        </form>
        <p className="tool-description">
          We open a real TLS handshake to the host on port 443, fetch the certificate chain it presents,
          and validate it against Node’s root trust store. We report the protocol version, cipher,
          expiry date, hostname match, key strength, signature algorithm, and the full chain.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { cert, summary, checks, protocol, cipher, alpn, host, authorized, authError } = data;
  const banner = summary.fail ? 'danger' : summary.warn ? 'warning' : 'success';
  const bannerText = summary.fail
    ? `${summary.fail} issue${summary.fail === 1 ? '' : 's'} found`
    : summary.warn
    ? `${summary.warn} warning${summary.warn === 1 ? '' : 's'}`
    : `Certificate looks healthy${cert?.daysUntilExpiry !== null ? ` · ${cert.daysUntilExpiry} days until expiry` : ''}`;

  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {protocol || '—'} · {cipher?.name || '—'}{alpn ? ` · ${alpn}` : ''}</span>
      </div>

      <h3 className="result-section-title">Subject &amp; Issuer</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">Common Name</span><span className="result-value">{cert?.subject?.commonName || '—'}</span></div>
        <div className="result-item"><span className="result-label">Organisation</span><span className="result-value">{cert?.subject?.organisation || '—'}</span></div>
        <div className="result-item"><span className="result-label">Issuer</span><span className="result-value">{cert?.issuer?.commonName || cert?.issuer?.organisation || '—'}</span></div>
        <div className="result-item"><span className="result-label">Serial</span><span className="result-value-mono">{cert?.serial || '—'}</span></div>
        <div className="result-item"><span className="result-label">Valid From</span><span className="result-value">{cert?.validFrom || '—'}</span></div>
        <div className="result-item"><span className="result-label">Valid To</span><span className="result-value">{cert?.validTo || '—'}</span></div>
        <div className="result-item"><span className="result-label">Days until expiry</span><span className="result-value">{cert?.daysUntilExpiry ?? '—'}</span></div>
        <div className="result-item"><span className="result-label">Trusted</span><span className="result-value">{authorized ? 'Yes' : `No — ${authError}`}</span></div>
        <div className="result-item"><span className="result-label">Key</span><span className="result-value">{cert?.keyAlgorithm || '—'}{cert?.keyBits ? ` (${cert.keyBits} bits)` : ''}</span></div>
        <div className="result-item"><span className="result-label">Signature Alg</span><span className="result-value">{cert?.sigAlg || '—'}</span></div>
      </div>

      {cert?.altNames?.length > 0 && (
        <>
          <h3 className="result-section-title">Subject Alternative Names ({cert.altNames.length})</h3>
          <div className="ssl-altnames">
            {cert.altNames.map((alt, idx) => (
              <code key={idx} className="ssl-altname">{alt.replace(/^DNS:/i, '')}</code>
            ))}
          </div>
        </>
      )}

      <h3 className="result-section-title">Certificate chain ({cert?.chainLength || 0})</h3>
      <ol className="rc-chain">
        {(cert?.chain || []).map((c, idx) => (
          <li key={idx} className="rc-step">
            <div className="rc-step-head">
              <span className="rc-step-num">{idx + 1}</span>
              <strong>{c.subject}</strong>
              <span className="rc-step-time">issued by {c.issuer}</span>
            </div>
            <div className="rc-step-location">
              <span className="result-value-mono" style={{ paddingLeft: 0 }}>
                {c.validFrom} → {c.validTo}{c.bits ? ` · ${c.bits} bits` : ''}
              </span>
            </div>
            {c.fingerprint256 && <div className="rc-step-location"><code style={{ fontSize: '0.72rem' }}>{c.fingerprint256}</code></div>}
          </li>
        ))}
      </ol>

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
      <h2>Transport Layer Security (TLS) &amp; X.509 Public Key Infrastructure</h2>
      <p>
        Transport Layer Security (TLS)—the modern cryptographic successor to SSL—secures network communications over HTTPS by authenticating server identity and establishing symmetric encryption keys. Without valid TLS parameters, browsers abort connection requests with blocking security warnings.
      </p>

      <h2>The X.509 Certificate Chain Architecture</h2>

      <p>
        Certificate validation relies on a hierarchical trust model defined by standard RFC 5280:
      </p>
      <ul>
        <li><strong>Leaf (End-Entity) Certificate:</strong> Issued directly to your domain hostname. Contains the public key, Subject Alternative Names (SANs), validity timestamp window, and digital signature from an intermediate CA.</li>
        <li><strong>Intermediate Certificate Authority (ICA):</strong> Signs leaf certificates on behalf of the root CA. Isolates the offline root key from routine operational exposure. Web servers must serve the intermediate bundle alongside the leaf certificate.</li>
        <li><strong>Root Certificate Authority:</strong> Self-signed anchor hardcoded in browser and operating system trust stores (Mozilla NSS, Apple, Windows).</li>
      </ul>

      <h2>Subject Alternative Names (SANs) &amp; Hostname Matching</h2>

      <p>
        Modern browsers strictly validate the <strong>Subject Alternative Name (SAN)</strong> extension rather than legacy Common Name (CN) attributes.
      </p>
      <ul>
        <li><strong>Wildcard Coverage:</strong> A certificate for <code>*.example.com</code> validates first-level subdomains (e.g. <code>api.example.com</code>, <code>blog.example.com</code>), but does NOT cover the root apex domain (<code>example.com</code>) or nested subdomains (<code>dev.api.example.com</code>) unless explicitly listed.</li>
        <li><strong>Apex &amp; Subdomain Binding:</strong> Production certificates should list both the apex domain (<code>example.com</code>) and the <code>www</code> variant (<code>www.example.com</code>) in the SAN extension.</li>
      </ul>

      <h2>Recommended Security Hardening Directives</h2>

      <h3>1. HTTP Strict Transport Security (HSTS)</h3>
      <p>
        Prevent SSL stripping attacks by transmitting the <code>Strict-Transport-Security</code> response header:
      </p>
      <pre className="code-pre">
        <code>{`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`}</code>
      </pre>

      <h3>2. Certificate Authority Authorization (CAA) DNS Records</h3>
      <p>
        Restrict which Certificate Authorities are authorized to issue certificates for your domain by publishing a CAA DNS record:
      </p>
      <pre className="code-pre">
        <code>{`example.com. IN CAA 0 issue "letsencrypt.org"`}</code>
      </pre>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between TLS 1.2 and TLS 1.3?</h3>
      <p>
        TLS 1.3 simplifies the cryptographic handshake from two round trips (2-RTT) to one round trip (1-RTT), removes obsolete ciphers (such as RC4, 3DES, and CBC-mode AES), and mandates Forward Secrecy across all cipher suites.
      </p>

      <h3>Why does my certificate show an &ldquo;Untrusted Chain&rdquo; error?</h3>
      <p>
        This almost always occurs when the web server configuration is missing intermediate CA certificates in the SSL bundle. Desktop browsers may cache intermediates locally, but mobile browsers and search crawlers will throw immediate trust validation errors.
      </p>

      <h3>How does HTTPS affect search rankings?</h3>
      <p>
        Google uses HTTPS as a baseline ranking signal. Unencrypted HTTP pages display &ldquo;Not Secure&rdquo; warnings in modern browsers and are disqualified from many modern web platform features (Service Workers, Geolocation). Verify your HTTP response codes using our <Link href="/tools/http-status">HTTP Status Checker</Link>.
      </p>
    </article>
  );
}
