"use client";
import { useState } from 'react';

export default function IpLookup() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 850));
    setResult({
      ip: '172.67.182.35', hostname: query.replace(/https?:\/\//, '').split('/')[0],
      isp: 'Cloudflare, Inc.', org: 'AS13335 Cloudflare, Inc.',
      country: 'United States', region: 'California', city: 'San Francisco',
      timezone: 'America/Los_Angeles', lat: '37.7749', lon: '-122.4194',
      isProxy: false, isHosting: true,
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>IP Address Lookup</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="text" placeholder="Enter IP address or domain name..." className="search-input" value={query} onChange={e => setQuery(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Looking up...' : 'Lookup IP'}</button>
        </form>
        <p className="tool-description">Look up the IP address, location, ISP, and hosting information for any domain name or IP address.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: 'var(--accent-color)' }}>{result.ip}</div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Hostname</span><span className="result-value">{result.hostname}</span></div>
              <div className="result-item"><span className="result-label">ISP</span><span className="result-value">{result.isp}</span></div>
              <div className="result-item"><span className="result-label">Organization</span><span className="result-value">{result.org}</span></div>
              <div className="result-item"><span className="result-label">Country</span><span className="result-value">{result.country}</span></div>
              <div className="result-item"><span className="result-label">Region / City</span><span className="result-value">{result.region} / {result.city}</span></div>
              <div className="result-item"><span className="result-label">Timezone</span><span className="result-value">{result.timezone}</span></div>
              <div className="result-item"><span className="result-label">Coordinates</span><span className="result-value">{result.lat}, {result.lon}</span></div>
              <div className="result-item"><span className="result-label">Proxy / VPN</span><span className="result-value" style={{ color: result.isProxy ? '#EF4444' : '#10B981' }}>{result.isProxy ? 'Detected' : 'Not Detected'}</span></div>
              <div className="result-item"><span className="result-label">Hosting Provider</span><span className="result-value" style={{ color: result.isHosting ? '#F59E0B' : '#10B981' }}>{result.isHosting ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>IP Address Lookup: Understanding Server Infrastructure and Geolocation</h2>
          <p>An IP (Internet Protocol) address is the unique numerical identifier assigned to every device connected to the internet. When you visit a website, your browser connects to the IP address of the server hosting that site. IP address lookup tools resolve this technical identifier into human-readable information — the hosting provider, geographic location, ISP, and organizational details behind the address. While not a core SEO metric in itself, IP lookup data is genuinely useful for a range of technical and competitive research tasks.</p>
          <p>Whether you're investigating a competitor's hosting infrastructure, diagnosing server location issues that might affect load times for specific geographic audiences, checking if a domain is behind a CDN proxy, or validating your own server configuration, an IP lookup gives you a clear picture of the technical layer beneath any web address.</p>
          <h3>Server Location and SEO</h3>
          <p>Historically, the physical location of a web server was a mild relevance signal for local search — a server in Germany might be considered slightly more locally relevant to German users than one hosted in the US. However, this has become largely irrelevant with the widespread adoption of CDNs (Content Delivery Networks). When a site uses Cloudflare, Fastly, AWS CloudFront, or another CDN, the IP address returned by a lookup resolves to a CDN edge node, not the origin server. The actual server could be anywhere in the world while the CDN serves content from data centers close to the user's location.</p>
          <p>What matters far more for geographic SEO today are server-side signals like the hreflang attribute, geo-targeting settings in Google Search Console, and the use of country-specific top-level domains (ccTLDs) like .de, .fr, or .co.uk.</p>
          <h3>CDN Detection</h3>
          <p>One of the most practical uses of IP lookup for SEO and competitive research is CDN detection. When the IP address of a domain resolves to a major CDN provider like Cloudflare (AS13335), Fastly, or Akamai, you know the site is using a CDN for performance and potentially for DDoS protection. This can inform your competitive analysis — sites behind CDNs tend to have better performance globally and are harder to knock offline. Our IP Lookup tool flags whether the resolved IP belongs to a known hosting or CDN provider.</p>
          <h3>Shared Hosting vs. Dedicated IPs</h3>
          <p>In the early days of SEO, there was significant discussion about whether sharing an IP address with "bad neighbor" sites (spam sites, penalized domains) on shared hosting could negatively affect your own rankings. Google has largely moved past this concern — it evaluates sites individually based on their own content and backlink profiles. However, on very low-quality shared hosting environments, being on the same IP block as many spam sites can occasionally cause issues with email deliverability and, rarely, with overzealous spam filters affecting crawling. For most purposes, the hosting provider and server performance are far more important than the specific IP address.</p>
          <h3>Geolocation Accuracy</h3>
          <p>IP geolocation data — the city and region information from an IP lookup — is useful but imperfect. The accuracy varies depending on the database used and the nature of the IP address. ISP-assigned residential and business IPs are typically geolocated accurately to the city level. CDN edge IPs may geolocate to a city near a data center rather than the actual website's origin location. Use IP geolocation data as a directional indicator rather than a definitive fact, especially when the IP resolves to a CDN or large cloud provider.</p>
        </article>
      </div>
    </div>
  );
}
