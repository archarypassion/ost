"use client";
import { useState } from 'react';
import Link from 'next/link';

const SEV_ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const SEV_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue', info: 'Info' };

function fmtDate(iso, raw) {
  if (iso) {
    try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return raw; }
  }
  return raw || '—';
}

export default function DomainAgePage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/domain-age', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setError(json?.error || `Request failed with status ${res.status}.`);
      else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>Domain Age Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="example.com" className="search-input" value={domain} onChange={(e) => setDomain(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Querying WHOIS…' : 'Check Domain'}</button>
        </form>
        <p className="tool-description">
          We query the appropriate WHOIS server (and follow registrar referrals) to fetch the original
          creation date, expiry, registrar, name servers and statuses for any domain.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && <ResultBlock data={data} showRaw={showRaw} setShowRaw={setShowRaw} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function ResultBlock({ data, showRaw, setShowRaw }) {
  const banner = data.summary.fail ? 'danger' : data.summary.warn ? 'warning' : 'success';
  return (
    <div className="result-box">
      <div className={`result-banner ${banner}`}>
        <strong>{data.domain}</strong>
        <span>{data.ageYears !== null ? ` · ${data.ageYears} years old` : ''}{data.daysUntilExpiry !== null ? ` · expires in ${data.daysUntilExpiry} days` : ''}{data.registrar ? ` · ${data.registrar}` : ''}</span>
      </div>

      <h3 className="result-section-title">Dates</h3>
      <div className="da-dates">
        <DateCard label="Created" iso={data.creationDateIso} raw={data.creationDate} sub={data.ageYears !== null ? `${data.ageYears} years ago` : null} />
        <DateCard label="Last updated" iso={data.updatedDateIso} raw={data.updatedDate} />
        <DateCard label="Expires" iso={data.expirationDateIso} raw={data.expirationDate} sub={data.daysUntilExpiry !== null ? `in ${data.daysUntilExpiry} days` : null} />
      </div>

      <h3 className="result-section-title">Registrar</h3>
      <div className="result-grid">
        <div className="result-item"><span className="result-label">Registrar</span><span className="result-value">{data.registrar || '—'}</span></div>
        <div className="result-item"><span className="result-label">Registrar URL</span><span className="result-value-mono">{data.registrarUrl || '—'}</span></div>
        <div className="result-item"><span className="result-label">IANA ID</span><span className="result-value">{data.registrarIanaId || '—'}</span></div>
        <div className="result-item"><span className="result-label">Abuse contact</span><span className="result-value-mono">{data.abuseEmail || '—'}</span></div>
        <div className="result-item"><span className="result-label">WHOIS server</span><span className="result-value-mono">{data.whoisServer || '—'}</span></div>
      </div>

      {data.nameServers?.length > 0 && (
        <>
          <h3 className="result-section-title">Name servers</h3>
          <div className="ssl-altnames">
            {data.nameServers.map((n, idx) => <code key={idx} className="ssl-altname">{n}</code>)}
          </div>
        </>
      )}

      {data.statuses?.length > 0 && (
        <>
          <h3 className="result-section-title">Domain status</h3>
          <div className="ssl-altnames">
            {data.statuses.map((s, idx) => <code key={idx} className="ssl-altname">{s}</code>)}
          </div>
        </>
      )}

      <h3 className="result-section-title">Findings</h3>
      <ul className="og-check-list">
        {data.issues.map((c, idx) => (
          <li key={idx} className={`og-check-row sev-${c.severity}`}>
            <span className={`og-check-icon sev-${c.severity}`}>{SEV_ICON[c.severity]}</span>
            <div className="og-check-body">
              <div className="og-check-head"><span className={`og-check-label sev-${c.severity}`}>{SEV_LABEL[c.severity]}</span></div>
              <div className="og-check-message">{c.message}</div>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="og-tab" onClick={() => setShowRaw((v) => !v)} style={{ marginTop: '0.5rem' }}>
        {showRaw ? 'Hide' : 'Show'} raw WHOIS response
      </button>
      {showRaw && <pre className="da-raw">{data.raw}</pre>}
    </div>
  );
}

function DateCard({ label, iso, raw, sub }) {
  return (
    <div className="da-date-card">
      <div className="da-date-label">{label}</div>
      <div className="da-date-value">{iso ? fmtDate(iso, raw) : (raw || '—')}</div>
      {sub && <div className="da-date-sub">{sub}</div>}
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Domain Registration Protocols &amp; ICANN Lifecycle Architecture</h2>
      <p>
        A domain name&apos;s registration record represents its cryptographic ownership and routing metadata within the global Domain Name System (DNS). Querying WHOIS servers and Registration Data Access Protocol (RDAP) endpoints exposes creation timestamps, registrar bindings, authoritative nameservers, and Extensible Provisioning Protocol (EPP) status flags.
      </p>

      <h2>The ICANN Generic Top-Level Domain (gTLD) Lifecycle</h2>

      <p>
        Domains operate under strict lifecycle state machines defined by ICANN:
      </p>
      <ul>
        <li><strong>Active Registration (1&ndash;10 Years):</strong> Domain resolves normally across global root resolvers and can be updated or transferred between registrars.</li>
        <li><strong>Auto-Renew Grace Period (0&ndash;45 Days):</strong> Triggered immediately upon expiration. The registrar auto-renews the domain internally while suspending active DNS resolution. The original owner can renew at standard rates.</li>
        <li><strong>Redemption Grace Period / RGP (30 Days):</strong> The registrar deletes the registration record. The registry holds the domain; restoring it requires an additional redemption fee.</li>
        <li><strong>Pending Delete (5 Days):</strong> The domain cannot be recovered. At the end of 5 days, the registry purges the record and releases the domain to the public drop pool.</li>
      </ul>

      <h2>Critical Extensible Provisioning Protocol (EPP) Status Codes</h2>

      <p>
        EPP status codes define administrative and operational constraints placed on the domain:
      </p>
      <ul>
        <li><code>clientTransferProhibited</code> &mdash; Registrar Lock preventing unauthorized domain transfers between registrars.</li>
        <li><code>clientHold</code> / <code>serverHold</code> &mdash; DNS resolution is completely halted by registrar or registry (frequently due to abuse reports or non-payment).</li>
        <li><code>clientUpdateProhibited</code> &mdash; Prevents modifications to authoritative nameservers and contact records.</li>
      </ul>

      <h2>Domain Age vs. SEO Authority</h2>

      <p>
        While Google has stated that raw chronological domain age is not a direct algorithmic ranking factor, age correlates with critical SEO assets:
      </p>
      <ul>
        <li><strong>Historical Backlink Equity:</strong> Established domains accumulate diverse, editorial backlink profiles over time.</li>
        <li><strong>Indexation Stability:</strong> Established domains have established crawl frequency patterns with search engine spiders.</li>
        <li><strong>Audit Dropped Domains:</strong> When acquiring expired domains, verify past indexation and redirects with our <Link href="/tools/redirect-checker">Redirect Chain Checker</Link> and check server hosting records with our <Link href="/tools/ip-lookup">IP &amp; ASN Lookup Tool</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What is the difference between WHOIS and RDAP?</h3>
      <p>
        WHOIS (RFC 3912) returns unstructured, plaintext responses over port 43. RDAP (RFC 9082/9083) is the modern RESTful replacement that delivers structured JSON over HTTPS with native support for internationalization, access control, and privacy redacting (GDPR).
      </p>

      <h3>Why is registrant contact information redacted?</h3>
      <p>
        Following GDPR and ICANN Temporary Specification policies, public WHOIS and RDAP queries redact personal contact details (names, emails, phone numbers) by default, displaying proxy privacy relays instead.
      </p>

      <h3>Can an expired domain retain its historical search rankings?</h3>
      <p>
        If a domain passes through the full deletion cycle and is re-registered as a dropped domain, search engines typically reset historical trust signals to prevent malicious ranking manipulation.
      </p>
    </article>
  );
}
