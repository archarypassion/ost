"use client";
import { useState } from 'react';

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
      <h2>Why Domain Age Matters</h2>
      <p>Domain age isn’t directly a ranking factor — Google has said so explicitly — but it correlates with trust signals that <em>are</em> ranking factors. An older domain has had more time to acquire backlinks, build a stable Whois history, and avoid being flagged as a spam vector. For competitive analysis, knowing whether a competitor’s domain is six months old or twelve years old changes how you read their authority.</p>
      <h3>What WHOIS still tells you (and what it hides)</h3>
      <p>Since GDPR took effect, much of the personal data in WHOIS is redacted by default. You’ll usually still see the registrar, creation date, expiry, name servers, and domain statuses. Personal contact info is now typically replaced with privacy-proxy emails or omitted entirely.</p>
      <h3>Domain status codes worth knowing</h3>
      <ul>
        <li><strong>clientTransferProhibited</strong> — registrar lock; transfer requires unlocking. Recommended for production domains.</li>
        <li><strong>clientHold / serverHold</strong> — domain doesn’t resolve. Usually pending payment or a dispute.</li>
        <li><strong>redemptionPeriod</strong> — domain expired and is in the 30-day grace period before deletion.</li>
        <li><strong>pendingDelete</strong> — domain will be released back to the public registry within five days.</li>
      </ul>
    </article>
  );
}
