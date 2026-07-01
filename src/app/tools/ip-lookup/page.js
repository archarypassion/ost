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

      <p>
        When you type a website name into your browser, something invisible happens behind the scenes: your device
        asks the internet, &ldquo;What is the actual address for this site?&rdquo; That address is called an{' '}
        <a href="https://www.cloudflare.com/learning/ddos/what-is-an-ip-address/" target="_blank" rel="noreferrer">
          IP address
        </a>
        . Think of it like a phone number for a computer on the internet. Every website, email server, and online
        service has one — or often several.
      </p>

      <p>
        An IP lookup takes a domain name (like <code>example.com</code>) or a raw IP address and shows you what is
        connected to it. The IP address behind a domain reveals a surprising amount of useful information: the cloud
        provider hosting it, the country and city of the data centre, the ASN (autonomous system) that owns the
        network, and — through reverse DNS — sometimes the original hosting customer. For SEO and competitive
        research, that data is gold. For everyday users, it is simply a fast way to understand who is really
        running a website before you trust it, buy from it, or troubleshoot a problem.
      </p>

      <p>
        You do not need to be a programmer to use this tool. Type any domain or IP into the search box above and
        we handle the technical work. The sections below explain what you are looking at in plain language.
      </p>

      <h3>How Does a Domain Name Become an IP Address?</h3>

      <p>
        Humans remember names; computers remember numbers. The system that translates between them is called{' '}
        <a href="https://www.icann.org/resources/pages/dns-what-is-2021-02-25-en" target="_blank" rel="noreferrer">
          DNS
        </a>{' '}
        (Domain Name System). When you visit a site, your browser quietly asks a DNS server: &ldquo;What IP belongs
        to this name?&rdquo; The answer comes back in milliseconds and your browser connects to that address.
      </p>

      <p>
        DNS is not just one answer. A domain can have many records at once — some for web traffic, some for email,
        some for security checks. That is why a full IP lookup is more useful than simply pinging a site. You see
        the whole picture, not just the front door.
      </p>

      <h3>What We Resolve</h3>

      <p>
        We do a full DNS sweep of A, AAAA, NS, MX, TXT, SOA, and CAA records. Here is what each one means in
        everyday terms:
      </p>

      <ul>
        <li>
          <strong>A and AAAA records</strong> — the main &ldquo;where is this website?&rdquo; answers. A records
          point to older-style IPv4 addresses (four numbers like <code>93.184.216.34</code>). AAAA records point
          to newer IPv6 addresses, which look longer and use letters and numbers.
        </li>
        <li>
          <strong>NS records</strong> — show whose DNS is authoritative. Common names you might see include
          Cloudflare, AWS Route 53, or Google Cloud DNS. This tells you who manages the domain&apos;s settings.
        </li>
        <li>
          <strong>MX records</strong> — show the email provider. If a business uses Google Workspace or Microsoft
          365, you will usually see it here.
        </li>
        <li>
          <strong>TXT records</strong> — short text notes attached to a domain. The TXT list often reveals SPF,
          DKIM, DMARC, and verification records (Google, Microsoft, Atlassian, etc.) that hint at which
          third-party tools the site uses.{' '}
          <a href="https://support.google.com/a/answer/33786" target="_blank" rel="noreferrer">
            SPF
          </a>{' '}
          and{' '}
          <a href="https://dmarc.org/overview/" target="_blank" rel="noreferrer">
            DMARC
          </a>{' '}
          help prove that email from that domain is legitimate and not spoofed.
        </li>
        <li>
          <strong>CNAME records</strong> — aliases that point one name at another. Many CDNs and website builders
          use these so you only need to update one place when things change.
        </li>
        <li>
          <strong>SOA records</strong> — technical housekeeping for the domain zone, including how often DNS
          caches should refresh.
        </li>
        <li>
          <strong>CAA records</strong> — a security setting that limits which companies are allowed to issue SSL
          certificates for the domain.
        </li>
      </ul>

      <p>
        Together, these records paint a clear picture of how a site is set up — not just where it lives, but how
        email is handled, which services are connected, and how seriously the owner takes security.
      </p>

      <h3>Reading Your Results: A Simple Walkthrough</h3>

      <p>
        After you run a lookup, you will see a summary banner at the top showing how many records were found. Below
        that, each IP address gets its own card with location details, timezone, coordinates, and the organisation
        that owns the network block.
      </p>

      <p>
        <strong>Country and city</strong> tell you roughly where the server appears to be located.{' '}
        <strong>ASN</strong> (Autonomous System Number) identifies the network operator — for example Amazon,
        Google, or a local internet provider. <strong>Organisation</strong> is the company name tied to that
        network. <strong>Reverse DNS</strong> shows whether the IP maps back to a readable hostname, which is
        especially important for email servers.
      </p>

      <p>
        If something looks wrong — say your own site still points to an old host after a move — compare the IP
        addresses here with what your hosting company gave you. Mismatches are one of the most common reasons a
        website or email stops working after a migration.
      </p>

      <h3>IPv4 and IPv6: Why There Are Two Kinds of Address</h3>

      <p>
        The internet originally used IPv4, which provides about 4.3 billion unique addresses. That sounds like a lot,
        but the world ran out years ago. IPv6 was introduced to solve the shortage and can support an almost
        unlimited number of addresses. You can read a friendly overview on{' '}
        <a href="https://www.cloudflare.com/learning/network-layer/what-is-ipv6/" target="_blank" rel="noreferrer">
          Cloudflare&apos;s IPv6 guide
        </a>
        .
      </p>

      <p>
        Most modern websites support both. If you only see IPv4 addresses for a site, it may still work fine for
        most visitors today — but IPv6-only networks (common on some mobile carriers) could have trouble. Seeing
        both A and AAAA records is generally a sign of a well-maintained setup.
      </p>

      <h3>What Is Reverse DNS and Why Does It Matter?</h3>

      <p>
        Normal DNS answers the question: &ldquo;What IP does this domain name point to?&rdquo; Reverse DNS flips
        that around: &ldquo;What domain name is registered for this IP?&rdquo; This is done with a special record
        type called a{' '}
        <a href="https://www.cloudflare.com/learning/dns/dns-records/dns-ptr-record/" target="_blank" rel="noreferrer">
          PTR record
        </a>
        .
      </p>

      <p>
        For most casual browsing, reverse DNS does not affect you. But if you send email from your own server, missing
        or incorrect reverse DNS is a common reason messages land in spam. Many businesses check it automatically.
        It is also useful when a site sits behind a CDN: the forward address might show Cloudflare, but reverse DNS
        on the origin IP can reveal the real hosting company underneath.
      </p>

      <h3>Geolocation Accuracy</h3>

      <p>
        IP geolocation is approximate. It is based on registries that map IP blocks to network owners; for cloud
        and CDN IPs the location reported is usually the closest data centre rather than where the company is
        registered. Anycast networks (Cloudflare, Fastly, AWS CloudFront) will resolve to whichever PoP (point of
        presence) happens to be closest to our server, not yours.
      </p>

      <p>
        In practice, this means country-level results are usually trustworthy, but city-level results can be off by
        hundreds of kilometres — especially for large cloud providers with data centres everywhere. Coordinates on
        the result card are estimates, not a GPS pin on someone&apos;s office. Use them as a rough guide, not as
        proof of where a person or business physically sits.
      </p>

      <p>
        If you need to understand why results differ between tools,{' '}
        <a href="https://en.wikipedia.org/wiki/Internet_geolocation" target="_blank" rel="noreferrer">
          IP geolocation
        </a>{' '}
        works by matching address ranges to databases that are updated regularly but never perfectly.
      </p>

      <h3>Everyday Reasons People Use IP Lookup</h3>

      <p>
        You do not need a technical background to get real value from this page. Here are situations where a quick
        lookup saves time:
      </p>

      <ul>
        <li>
          <strong>Checking a suspicious link</strong> — before clicking an unfamiliar shop or login page, see
          whether it points to a reputable host or something unexpected.
        </li>
        <li>
          <strong>After moving your website</strong> — confirm your domain now points to the new server and the
          old IP is gone.
        </li>
        <li>
          <strong>Email problems</strong> — inspect MX and TXT records to see if mail is routed correctly and
          authentication is configured.
        </li>
        <li>
          <strong>Comparing competitors</strong> — notice when a rival switches from shared hosting to a CDN or
          cloud platform.
        </li>
        <li>
          <strong>Understanding downtime</strong> — if a site is down, checking whether its IP changed can tell you
          if DNS was updated incorrectly.
        </li>
        <li>
          <strong>Verifying your own setup</strong> — small business owners often inherit DNS settings from a web
          designer; this tool shows exactly what is live right now.
        </li>
      </ul>

      <h3>What IP Lookup Cannot Tell You</h3>

      <p>
        It is equally important to know the limits. An IP lookup will not show you private information about
        individual visitors, exact street addresses, or who owns a website legally — only where the server appears
        to be hosted. Two completely unrelated websites can share the same IP on budget shared hosting. A company
        in London might host its site in Frankfurt because that data centre is faster or cheaper.
      </p>

      <p>
        Privacy tools, VPNs, and proxy services deliberately hide a user&apos;s real location, so never use IP
        data alone to make serious legal or security decisions. Treat this tool as an infrastructure map, not a
        detective dossier.
      </p>

      <h3>Helpful Resources to Learn More</h3>

      <p>
        If you want to go deeper, these trusted guides explain the same concepts from different angles. All links
        open in a new tab.
      </p>

      <ul>
        <li>
          <a href="https://www.cloudflare.com/learning/dns/what-is-dns/" target="_blank" rel="noreferrer">
            Cloudflare — What is DNS? (beginner-friendly)
          </a>
        </li>
        <li>
          <a href="https://www.cloudflare.com/learning/ddos/what-is-an-ip-address/" target="_blank" rel="noreferrer">
            Cloudflare — What is an IP address?
          </a>
        </li>
        <li>
          <a href="https://www.icann.org/resources/pages/dns-what-is-2021-02-25-en" target="_blank" rel="noreferrer">
            ICANN — What is the Domain Name System?
          </a>
        </li>
        <li>
          <a href="https://en.wikipedia.org/wiki/IP_address" target="_blank" rel="noreferrer">
            Wikipedia — IP address (overview and history)
          </a>
        </li>
        <li>
          <a href="https://www.cloudflare.com/learning/dns/dns-records/dns-ptr-record/" target="_blank" rel="noreferrer">
            Cloudflare — What is a DNS PTR record?
          </a>
        </li>
        <li>
          <a href="https://support.google.com/a/answer/33786" target="_blank" rel="noreferrer">
            Google Workspace — SPF record setup guide
          </a>
        </li>
        <li>
          <a href="https://dmarc.org/overview/" target="_blank" rel="noreferrer">
            DMARC.org — What is DMARC email authentication?
          </a>
        </li>
        <li>
          <a href="https://www.cloudflare.com/learning/network-layer/what-is-ipv6/" target="_blank" rel="noreferrer">
            Cloudflare — What is IPv6?
          </a>
        </li>
        <li>
          <a href="https://en.wikipedia.org/wiki/Internet_geolocation" target="_blank" rel="noreferrer">
            Wikipedia — How IP geolocation works
          </a>
        </li>
        <li>
          <a href="https://developer.mozilla.org/en-US/docs/Glossary/DNS" target="_blank" rel="noreferrer">
            MDN Web Docs — DNS glossary entry
          </a>
        </li>
      </ul>

      <h3>Try It Now</h3>

      <p>
        The best way to understand IP lookup is to run one yourself. Enter your own domain, your email provider&apos;s
        domain, or any IP you are curious about in the search box at the top of this page. Read through the records,
        match them against what you expected, and keep this page bookmarked for the next time DNS changes or
        something does not look right. No sign-up, no install — just type and look up.
      </p>
    </article>
  );
}
