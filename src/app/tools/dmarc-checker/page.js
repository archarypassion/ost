"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck, CheckCircle2, XCircle, AlertTriangle, Copy, Check, Shield } from 'lucide-react';

export default function DmarcCheckerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch('/api/tools/dmarc-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err?.message || 'Network error — could not query DNS records.');
    } finally {
      setLoading(false);
    }
  };

  const copyDmarcTemplate = async () => {
    const template = `v=DMARC1; p=reject; rua=mailto:dmarc-reports@${domain.trim() || 'example.com'}; pct=100; sp=reject;`;
    await navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>DMARC &amp; SPF Email Authentication Validator</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter domain (e.g. example.com or user@example.com)"
            className="search-input"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? 'Querying DNS...' : 'Verify Records'}
          </button>
        </form>

        <p className="tool-description">
          Verify DNS DMARC and SPF TXT records for email spoofing protection, deliverability compliance,
          and Gmail &amp; Yahoo bulk sender authentication requirements.
        </p>

        {error && <div className="result-error" style={{ width: '100%', maxWidth: '720px' }}>{error}</div>}

        {data && (
          <div className="result-box">
            {/* Header / Score Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{data.domain}</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Authentication Health: {data.score}/100
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: data.status === 'good' ? 'rgba(16, 185, 129, 0.15)' : data.status === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: data.status === 'good' ? '#10B981' : data.status === 'warning' ? '#F59E0B' : '#EF4444',
                  border: `1px solid ${data.status === 'good' ? '#10B981' : data.status === 'warning' ? '#F59E0B' : '#EF4444'}`,
                }}
              >
                {data.status === 'good' ? 'PROTECTED' : data.status === 'warning' ? 'MONITORING ONLY' : 'VULNERABLE'}
              </span>
            </div>

            {/* DMARC Record Section */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {data.dmarc.record ? <CheckCircle2 size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                  <strong>DMARC Record (<code>{data.dmarc.host}</code>)</strong>
                </div>
                {data.dmarc.tags?.p && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'var(--lv2-blue-soft)', color: 'var(--lv2-blue-light)' }}>
                    Policy: {data.dmarc.tags.p}
                  </span>
                )}
              </div>

              {data.dmarc.record ? (
                <div>
                  <pre className="code-pre" style={{ margin: '0.5rem 0', padding: '0.75rem', fontSize: '0.8125rem' }}>
                    <code>{data.dmarc.record}</code>
                  </pre>
                  {data.dmarc.tags && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                      {Object.entries(data.dmarc.tags).map(([k, v]) => (
                        <div key={k} style={{ padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{k}: </span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#EF4444' }}>{data.dmarc.error}</div>
              )}
            </div>

            {/* SPF Record Section */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {data.spf.record ? <CheckCircle2 size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                  <strong>SPF Record (<code>{data.spf.host}</code>)</strong>
                </div>
                {data.spf.parsed?.allPolicy && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)' }}>
                    Policy: {data.spf.parsed.allPolicy}
                  </span>
                )}
              </div>

              {data.spf.record ? (
                <div>
                  <pre className="code-pre" style={{ margin: '0.5rem 0', padding: '0.75rem', fontSize: '0.8125rem' }}>
                    <code>{data.spf.record}</code>
                  </pre>
                  {data.spf.parsed?.mechanisms?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                      {data.spf.parsed.mechanisms.map((m) => (
                        <span key={m} style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#EF4444' }}>{data.spf.error}</div>
              )}
            </div>

            {/* Findings & Warnings */}
            {data.warnings?.length > 0 && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px' }}>
                <strong style={{ color: '#EF4444', fontSize: '0.875rem' }}>Security Vulnerabilities &amp; Warnings</strong>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {data.warnings.map((w, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Generator Snippet */}
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="lv2-pill-btn"
                onClick={copyDmarcTemplate}
              >
                {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />} Copy Recommended DMARC TXT Record
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Email Authentication Architecture: DMARC, SPF &amp; DKIM</h2>
      <p>
        Domain-based Message Authentication, Reporting, and Conformance (DMARC) defined in <a href="https://www.rfc-editor.org/rfc/rfc7489.html" target="_blank" rel="noopener noreferrer">RFC 7489</a> pairs with Sender Policy Framework (SPF, <a href="https://www.rfc-editor.org/rfc/rfc7208.html" target="_blank" rel="noopener noreferrer">RFC 7208</a>) and DomainKeys Identified Mail (DKIM, <a href="https://www.rfc-editor.org/rfc/rfc6376.html" target="_blank" rel="noopener noreferrer">RFC 6376</a>) to authenticate email senders and eliminate domain spoofing, business email compromise (BEC), and phishing attacks.
      </p>

      <h2>The Three Pillars of Email Security</h2>

      <ul>
        <li><strong>SPF (Sender Policy Framework):</strong> A DNS TXT record specifying the exact server IP addresses and third-party email providers (e.g. Google Workspace, SendGrid) authorized to transmit email on behalf of your domain.</li>
        <li><strong>DKIM (DomainKeys Identified Mail):</strong> Cryptographic public/private key pairs that attach a digital signature header (<code>DKIM-Signature</code>) verifying that an email was not tampered with in transit.</li>
        <li><strong>DMARC:</strong> The overarching policy mechanism that instructs receiving mail servers (Gmail, Outlook, Yahoo) what to do with messages that fail SPF or DKIM alignment (<code>p=none</code>, <code>p=quarantine</code>, or <code>p=reject</code>).</li>
      </ul>

      <h2>Recommended Production DMARC Configuration</h2>

      <p>
        Publish a DNS TXT record at <code>_dmarc.yourdomain.com</code>:
      </p>
      <pre className="code-pre">
        <code>{`_dmarc.example.com.  IN  TXT  "v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc-reports@example.com; pct=100; adkim=r; aspf=r;"`}</code>
      </pre>

      <h2>DMARC Policy Enforcement Progression</h2>

      <ol>
        <li><strong>Monitoring Mode (<code>p=none</code>):</strong> Collect aggregate XML reports (<code>rua</code>) without blocking mail to identify legitimate sending sources.</li>
        <li><strong>Quarantine Mode (<code>p=quarantine</code>):</strong> Direct unaligned spoofed emails to recipient Spam and Junk folders.</li>
        <li><strong>Strict Reject Mode (<code>p=reject</code>):</strong> Receiving mail servers drop unauthenticated emails outright at the SMTP gateway.</li>
      </ol>

      <h2>DNS &amp; Domain Infrastructure Integration</h2>

      <p>
        Complete your technical domain setup with our infrastructure suite:
      </p>
      <ul>
        <li><strong>DNS Zone Sweeps:</strong> Inspect authoritative MX, NS, and TXT records using our <Link href="/tools/ip-lookup">IP &amp; DNS Lookup Tool</Link>.</li>
        <li><strong>Domain Trust Audits:</strong> Verify domain lifecycle stages and registrar locks with our <Link href="/tools/domain-age">Domain Age Checker</Link>.</li>
        <li><strong>Security Header Hardening:</strong> Protect your web traffic with our <Link href="/tools/security-headers">Security Headers Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What are the 2024+ Gmail and Yahoo bulk sender requirements?</h3>
      <p>
        Google and Yahoo require all domains sending over 5,000 emails daily to have valid SPF and DKIM authentication, a published DMARC policy (minimum <code>p=none</code>), valid reverse DNS (PTR) records, and spam complaint rates below 0.3%.
      </p>

      <h3>What is the difference between ~all and -all in SPF?</h3>
      <p>
        <code>-all</code> (HardFail) explicitly rejects unauthorized sender IPs. <code>~all</code> (SoftFail) accepts unauthorized mail but flags it as suspicious, delegating the final disposition to DMARC policies.
      </p>

      <h3>Why is DMARC p=none not enough for long-term security?</h3>
      <p>
        A policy of <code>p=none</code> only collects reports and does not block attackers from sending forged emails using your brand domain. Production domains should progress to <code>p=quarantine</code> and <code>p=reject</code>.
      </p>
    </article>
  );
}
