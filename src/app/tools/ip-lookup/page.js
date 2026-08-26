"use client";
import { useState } from 'react';
import Link from 'next/link';

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
      <h2>DNS Zone Architecture, Autonomous Systems &amp; IP Routing</h2>
      <p>
        An IP lookup performs bidirectional DNS resolution and Border Gateway Protocol (BGP) routing inspection. Resolving a domain to its underlying IPv4 (A) and IPv6 (AAAA) addresses exposes server hosting infrastructure, transit Autonomous System Numbers (ASNs), reverse DNS (PTR) records, and core zone configurations.
      </p>

      <h2>Core DNS Zone Record Specifications</h2>

      <ul>
        <li><strong>A &amp; AAAA Records:</strong> Map hostnames to 32-bit IPv4 (e.g. <code>192.0.2.1</code>) and 128-bit IPv6 (e.g. <code>2001:db8::1</code>) network interfaces. Modern production websites require dual-stack deployment.</li>
        <li><strong>MX Records:</strong> Mail Exchanger records specifying the mail servers responsible for accepting incoming email for the domain, ordered by priority.</li>
        <li><strong>TXT Records (SPF, DKIM, DMARC):</strong> Text records containing domain verification strings and email authentication policies (e.g. <code>v=spf1 include:_spf.google.com ~all</code>).</li>
        <li><strong>NS Records:</strong> Authoritative nameservers designated for delegating DNS zone authority.</li>
        <li><strong>SOA Records:</strong> Start of Authority records defining zone serial numbers, refresh timers, retry intervals, and minimum TTL (negative caching).</li>
        <li><strong>CAA Records:</strong> Certificate Authority Authorization records preventing unauthorized SSL certificate issuance.</li>
      </ul>

      <h2>Autonomous System Numbers (ASNs) &amp; BGP Anycast</h2>

      <p>
        An <strong>Autonomous System (AS)</strong> is a connected group of IP routing prefixes controlled by one or more network operators under a single routing policy. The <strong>ASN</strong> identifies the hosting provider, ISP, or CDN operating the network (e.g. AS13335 for Cloudflare, AS15169 for Google).
      </p>
      <p>
        <strong>Anycast Routing:</strong> Global Content Delivery Networks announce the same IP prefix from hundreds of edge Points of Presence (PoPs) worldwide. Geolocation tools identify the nearest edge point rather than the origin server datacenter.
      </p>

      <h2>Reverse DNS (rDNS) &amp; PTR Verification</h2>

      <p>
        Reverse DNS queries map an IP address back to its canonical hostname using specialized <code>.in-addr.arpa</code> (IPv4) or <code>.ip6.arpa</code> (IPv6) zones. Forward-Confirmed Reverse DNS (FCrDNS) is a primary requirement for:
      </p>
      <ul>
        <li><strong>Email Deliverability:</strong> SMTP receivers reject mail from IP addresses without valid reverse PTR records matching the sending hostname.</li>
        <li><strong>Search Bot Verification:</strong> Verifying legitimate Googlebot and Bingbot crawlers to prevent spoofed scraper access.</li>
        <li><strong>Security Auditing:</strong> Inspect certificate bindings using our <Link href="/tools/ssl-checker">SSL Certificate Checker</Link> and verify domain history with our <Link href="/tools/domain-age">Domain Age Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Why does my geolocation show a different country than my hosting provider?</h3>
      <p>
        If your website uses a CDN (Cloudflare, Fastly, CloudFront), DNS queries resolve to the CDN&apos;s Anycast edge node nearest to the query origin, not the physical origin backend server.
      </p>

      <h3>What is the difference between an A record and a CNAME record?</h3>
      <p>
        An <code>A</code> record maps a hostname directly to an IP address. A <code>CNAME</code> (Canonical Name) record is an alias that maps a hostname to another hostname. CNAME records cannot coexist with other records on the apex (root) domain per RFC 1034.
      </p>

      <h3>How do I verify if my server supports IPv6?</h3>
      <p>
        Enter your domain in the tool above; if an <code>AAAA</code> record appears with valid geolocation and network ASN details, your domain is dual-stack IPv6 enabled.
      </p>
    </article>
  );
}
