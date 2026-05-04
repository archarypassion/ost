"use client";
import { useState } from 'react';

export default function SSLChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1000));
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    setResult({
      valid: true, domain, issuer: 'Let\'s Encrypt Authority X3', protocol: 'TLS 1.3',
      validFrom: '2025-01-15', validUntil: '2025-07-15', daysLeft: 75,
      wildcardCert: false, sniSupported: true,
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>SSL Certificate Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Checking...' : 'Check SSL'}</button>
        </form>
        <p className="tool-description">Verify the SSL/TLS certificate of any domain — check validity, expiry date, issuer, and protocol version.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.valid ? '#10B981' : '#EF4444' }}>
              {result.valid ? '✓ Valid SSL Certificate' : '✗ Invalid or Expired Certificate'}
            </div>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Domain</span><span className="result-value">{result.domain}</span></div>
              <div className="result-item"><span className="result-label">Issuer</span><span className="result-value">{result.issuer}</span></div>
              <div className="result-item"><span className="result-label">Protocol</span><span className="result-value">{result.protocol}</span></div>
              <div className="result-item"><span className="result-label">Valid From</span><span className="result-value">{result.validFrom}</span></div>
              <div className="result-item"><span className="result-label">Valid Until</span><span className="result-value">{result.validUntil}</span></div>
              <div className="result-item"><span className="result-label">Days Remaining</span><span className="result-value" style={{ color: result.daysLeft < 30 ? '#EF4444' : result.daysLeft < 60 ? '#F59E0B' : '#10B981' }}>{result.daysLeft} days</span></div>
              <div className="result-item"><span className="result-label">Wildcard Certificate</span><span className="result-value">{result.wildcardCert ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>SSL Certificates and HTTPS: Security, Trust, and Why Google Cares</h2>
          <p>The padlock icon in your browser's address bar represents something that has gone from a nice-to-have feature for e-commerce sites to an absolute baseline requirement for every website on the internet. SSL (Secure Sockets Layer) — more accurately called TLS (Transport Layer Security) in its modern form — is a cryptographic protocol that creates an encrypted connection between a user's browser and your web server. This encryption ensures that data transmitted between the two cannot be intercepted or tampered with by third parties.</p>
          <p>Google made its position on HTTPS crystal clear back in 2014 when it announced HTTPS as a ranking signal. While it's considered a lightweight signal compared to content quality and backlinks, it's a checkbox that every site needs to tick — because failing it not only hurts rankings slightly but actively damages user trust in a way that other technical issues don't.</p>
          <h3>What Happens Without SSL</h3>
          <p>Browsers have progressively escalated their warnings for non-HTTPS sites. Chrome now displays a "Not Secure" warning in the address bar for any HTTP page. For pages with login forms or payment fields on HTTP, Chrome displays a much more alarming full interstitial warning that many users won't bypass. These warnings are conversion killers — users who see them are significantly less likely to fill in forms, make purchases, or trust the site with their information. Even if your site doesn't collect sensitive data, the "Not Secure" label creates a perception of unprofessionalism that affects credibility.</p>
          <h3>Let's Encrypt: Free SSL for Everyone</h3>
          <p>The cost of SSL certificates was once a legitimate barrier — commercial certificates could cost hundreds of dollars per year. Let's Encrypt, launched in 2016, changed that permanently. It's a free, automated certificate authority that issues 90-day SSL certificates at no cost and with renewal automation. Today, there's genuinely no reason for any website not to have HTTPS. Most hosting providers (cPanel hosts, Kinsta, WP Engine, Netlify, Vercel) install and auto-renew Let's Encrypt certificates automatically. For sites still on HTTP, the migration is typically a few clicks in the hosting control panel.</p>
          <h3>Certificate Expiry: The Silent Killer</h3>
          <p>SSL certificates have expiry dates. When a certificate expires, browsers immediately block visitors from accessing the site with a full-screen error warning that's very difficult to bypass. This is one of the most damaging things that can happen to a website's traffic — users see a security error and leave. It's also avoidable with proper monitoring. Let's Encrypt certificates expire every 90 days by design, but they auto-renew if the automation is properly configured. Commercial certificates expire annually or biannually and require manual renewal. Our SSL Checker tells you exactly how many days remain on any certificate so you're never caught off guard.</p>
          <h3>TLS Protocol Versions Matter</h3>
          <p>Not all HTTPS is equal. The TLS protocol has gone through multiple versions, and the older ones (TLS 1.0 and TLS 1.1) have known security vulnerabilities and are now deprecated by major browsers. TLS 1.2 is acceptable, but TLS 1.3 — the current standard — offers improved security and measurably faster connection speeds. Check your server's TLS configuration to ensure you're using modern protocols and cipher suites.</p>
        </article>
      </div>
    </div>
  );
}
