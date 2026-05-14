"use client";
import { useState } from 'react';

export default function IpLookupPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch('/api/tools/ip-lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) setError(json?.error || `Request failed with status ${res.status}.`);
      else setData(json);
    } catch (err) { setError(err?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="tool-header"><h1>IP Lookup</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={submit}>
          <input type="text" placeholder="example.com or 1.1.1.1" className="search-input" value={input} onChange={(e) => setInput(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Looking up…' : 'Look up'}</button>
        </form>
        <p className="tool-description">
          Resolve a domain to its IPv4 / IPv6 addresses, list its DNS records (MX, NS, TXT, SOA, CAA),
          do a reverse-DNS check on each IP, and look up the geographic location and ASN that owns it.
          You can also enter a raw IP address.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data?.mode === 'domain' && <DomainResult d={data} />}
        {data?.mode === 'ip' && <IpResult d={data} />}
      </div>
      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function DomainResult({ d }) {
  return (
    <div className="result-box">
      <div className="result-banner success">
        <strong>{d.domain}</strong>
        <span>· {d.counts.a} A · {d.counts.aaaa} AAAA · {d.counts.mx} MX · {d.counts.ns} NS · {d.counts.txt} TXT</span>
      </div>

      <h3 className="result-section-title">IP addresses ({d.ips.length})</h3>
      {d.ips.length === 0 ? (
        <div className="og-block-empty">No A/AAAA records resolved.</div>
      ) : (
        <div className="ip-grid">
          {d.ips.map((ip, idx) => <IpCard key={idx} ip={ip} />)}
        </div>
      )}

      <DnsSection title="A records" records={d.a} />
      <DnsSection title="AAAA records" records={d.aaaa} />
      <DnsSection title="NS records" records={d.ns} />
      <DnsSection title="MX records" records={d.mx} renderItem={(r) => `${r.priority} ${r.exchange}`} />
      <DnsSection title="TXT records" records={d.txt} mono />
      <DnsSection title="CAA records" records={d.caa} renderItem={(r) => `${r.critical} ${r.issue || r.issuewild || JSON.stringify(r)}`} />
      <DnsSection title="CNAME" records={d.cname} />
      {d.soa && !d.soa.error && (
        <>
          <h3 className="result-section-title">SOA</h3>
          <div className="result-grid">
            <div className="result-item"><span className="result-label">Primary NS</span><span className="result-value">{d.soa.nsname}</span></div>
            <div className="result-item"><span className="result-label">Admin</span><span className="result-value">{d.soa.hostmaster}</span></div>
            <div className="result-item"><span className="result-label">Serial</span><span className="result-value">{d.soa.serial}</span></div>
            <div className="result-item"><span className="result-label">Refresh / Retry / Expire / Min TTL</span><span className="result-value">{d.soa.refresh} / {d.soa.retry} / {d.soa.expire} / {d.soa.minttl}</span></div>
          </div>
        </>
      )}
    </div>
  );
}

function DnsSection({ title, records, mono, renderItem }) {
  if (!records || (Array.isArray(records) && records.length === 0)) return null;
  return (
    <>
      <h3 className="result-section-title">{title}</h3>
      {records.error ? (
        <div className="og-block-empty">{records.error}</div>
      ) : (
        <ul className="dns-list">
          {records.map((r, idx) => (
            <li key={idx} className={mono ? 'result-value-mono' : ''}>{renderItem ? renderItem(r) : (typeof r === 'string' ? r : JSON.stringify(r))}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function IpResult({ d }) {
  return (
    <div className="result-box">
      <div className="result-banner success"><strong>{d.ip}</strong></div>
      <IpCard ip={d} standalone />
    </div>
  );
}

function IpCard({ ip, standalone }) {
  const geo = ip.geo;
  return (
    <div className="ip-card">
      <div className="ip-card-head">
        <code className="ip-addr">{ip.ip}</code>
        {geo?.countryCode && <span className="ip-country">{geo.countryCode} · {geo.country}</span>}
      </div>
      {geo ? (
        <div className="ip-grid-inner">
          <div><span className="result-label">City</span><div className="result-value">{geo.city || '—'}{geo.region ? `, ${geo.region}` : ''}</div></div>
          <div><span className="result-label">ASN</span><div className="result-value-mono">{geo.asn || '—'}</div></div>
          <div><span className="result-label">Organisation</span><div className="result-value">{geo.org || '—'}</div></div>
          <div><span className="result-label">Timezone</span><div className="result-value">{geo.timezone || '—'} {geo.utcOffset ? `(${geo.utcOffset})` : ''}</div></div>
          <div><span className="result-label">Coordinates</span><div className="result-value-mono">{geo.latitude ?? '—'}, {geo.longitude ?? '—'}</div></div>
          <div><span className="result-label">Postal</span><div className="result-value">{geo.postal || '—'}</div></div>
        </div>
      ) : (
        <div className="og-block-empty">{ip.geoError || 'Geolocation unavailable.'}</div>
      )}
      {ip.reverseDns?.length > 0 && (
        <div className="ip-ptr">
          <span className="result-label">Reverse DNS</span>
          <div>{ip.reverseDns.map((n) => <code key={n} className="ssl-altname">{n}</code>)}</div>
        </div>
      )}
      {ip.reverseDnsError && <div className="og-block-empty">PTR: {ip.reverseDnsError}</div>}
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>What an IP Lookup Tells You</h2>
      <p>The IP address behind a domain reveals a surprising amount of useful information: the cloud provider hosting it, the country and city of the data centre, the ASN (autonomous system) that owns the network, and — through reverse DNS — sometimes the original hosting customer. For SEO and competitive research that data is gold.</p>
      <h3>What we resolve</h3>
      <p>We do a full DNS sweep of A, AAAA, NS, MX, TXT, SOA, and CAA records. The TXT list often reveals SPF, DKIM, DMARC, and verification records (Google, Microsoft, Atlassian, etc.) that hint at which third-party tools the site uses. NS records show whose DNS is authoritative — Cloudflare, AWS Route 53, Google Cloud DNS, etc. MX shows the email provider.</p>
      <h3>Geolocation accuracy</h3>
      <p>IP geolocation is approximate. It’s based on registries that map IP blocks to network owners; for cloud and CDN IPs the location reported is usually the closest data centre rather than where the company is registered. Anycast networks (Cloudflare, Fastly, AWS CloudFront) will resolve to whichever PoP happens to be closest to <em>our server</em>, not yours.</p>
    </article>
  );
}
