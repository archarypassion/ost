"use client";
import { useState } from 'react';

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
      <h2>SSL/TLS: What Actually Matters in 2026</h2>
      <p>Most TLS audits are mountains of detail when, for production sites, the key questions are simple: does the certificate match the hostname, is it issued by a CA the browser trusts, is it within its validity window, is the key strong enough, and is the negotiated protocol modern? This tool answers each one and shows you the chain it inspected.</p>
      <h3>Protocol versions</h3>
      <p>TLS 1.3 (2018) is the gold standard — fewer round trips, only modern ciphers. TLS 1.2 is acceptable. Anything older (1.0, 1.1, SSL 3) should be disabled — and if your server even negotiates them, you have a backwards-compatibility problem.</p>
      <h3>Hostname matching</h3>
      <p>Modern browsers ignore the certificate’s Common Name and check the Subject Alternative Names instead. We list every DNS name on the SAN list and explicitly verify the requested host matches one of them, including wildcard rules.</p>
      <h3>Renewal cadence</h3>
      <p>Most public CAs now issue certificates valid for ≤ 13 months and Let’s Encrypt issues 90-day certs. Set up automatic renewal and monitor expiry dates from outside the system that owns them.</p>
    </article>
  );
}
