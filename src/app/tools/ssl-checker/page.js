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
      <h2>SSL/TLS Certificates: What They Are and Why Every Website Needs One</h2>

      <p>
        When you visit a website and see a padlock icon in the address bar, that means the connection is protected
        by an{' '}
        <a href="https://www.cloudflare.com/learning/ssl/what-is-ssl/" target="_blank" rel="noreferrer">
          SSL/TLS certificate
        </a>
        . SSL (Secure Sockets Layer) is the older name; today almost everything uses its successor, TLS
        (Transport Layer Security). Together they encrypt the data travelling between your browser and the server
        so passwords, payment details, and personal information cannot easily be read by anyone in between.
      </p>

      <p>
        Most TLS audits are mountains of detail when, for production sites, the key questions are simple: does the
        certificate match the hostname, is it issued by a CA the browser trusts, is it within its validity window,
        is the key strong enough, and is the negotiated protocol modern? This tool answers each one and shows you
        the chain it inspected.
      </p>

      <p>
        You do not need to be a security engineer to use it. Enter any domain above and we open a real TLS
        handshake on port 443 — the same connection your browser makes when you visit{' '}
        <code>https://example.com</code>. The sections below explain what the results mean in everyday language.
      </p>

      <h3>What Is HTTPS and How Does It Relate to SSL?</h3>

      <p>
        <a href="https://developer.mozilla.org/en-US/docs/Glossary/HTTPS" target="_blank" rel="noreferrer">
          HTTPS
        </a>{' '}
        is simply HTTP (normal web traffic) wrapped inside a TLS-encrypted tunnel. The &ldquo;S&rdquo; stands for
        secure. Modern browsers mark non-HTTPS sites as &ldquo;Not Secure,&rdquo; which erodes visitor trust even
        on pages that do not collect sensitive data.
      </p>

      <p>
        Google has treated HTTPS as a{' '}
        <a href="https://developers.google.com/search/docs/advanced/security/https" target="_blank" rel="noreferrer">
          lightweight ranking signal
        </a>{' '}
        since 2014. More importantly, browsers now restrict powerful features — geolocation, camera access,
        service workers — to secure contexts only. If you run a website in 2026 without a valid certificate, you
        are fighting both users and search engines.
      </p>

      <h3>How This SSL Checker Works</h3>

      <p>
        We open a real TLS handshake to the host on port 443, fetch the certificate chain it presents, and validate
        it against a trusted root store. We report the protocol version, cipher, expiry date, hostname match, key
        strength, signature algorithm, and the full chain — the same details a browser checks before showing you
        the padlock.
      </p>

      <p>
        Unlike a simple &ldquo;is the site up?&rdquo; ping, this tool inspects the actual cryptographic credentials
        the server offers. That matters because a site can respond on port 443 with an expired certificate, a
        certificate issued for a different domain, or a self-signed cert that no browser trusts. Each of those
        scenarios looks like HTTPS at a glance but fails the security check.
      </p>

      <h3>Reading Your Results: A Plain-English Walkthrough</h3>

      <p>
        After you run a check, the results are grouped into sections. Here is what each part tells a normal user:
      </p>

      <ul>
        <li>
          <strong>Subject &amp; Issuer</strong> — who the certificate was issued to (your domain or organisation)
          and who signed it. Trusted issuers include{' '}
          <a href="https://letsencrypt.org/" target="_blank" rel="noreferrer">
            Let&apos;s Encrypt
          </a>
          , DigiCert, Sectigo, and Google Trust Services.
        </li>
        <li>
          <strong>Common Name (CN)</strong> — the primary hostname on older certificates. Modern browsers rely
          more on Subject Alternative Names.
        </li>
        <li>
          <strong>Valid From / Valid To</strong> — the certificate&apos;s active window. Expired certificates
          trigger browser warnings immediately.
        </li>
        <li>
          <strong>Days until expiry</strong> — how long before renewal is required. Do not wait until day zero.
        </li>
        <li>
          <strong>Trusted</strong> — whether the certificate chains back to a root authority your system recognises.
          &ldquo;No&rdquo; usually means self-signed, misconfigured chain, or unknown issuer.
        </li>
        <li>
          <strong>Key &amp; Signature Algorithm</strong> — the cryptographic strength. RSA 2048-bit or ECDSA
          P-256 are common modern standards.
        </li>
        <li>
          <strong>Subject Alternative Names (SANs)</strong> — every hostname covered by one certificate, including
          <code>www</code> variants and subdomains.
        </li>
        <li>
          <strong>Certificate chain</strong> — the path from your site&apos;s cert up through intermediate CAs to a
          trusted root. A broken chain causes trust errors even when the leaf certificate is valid.
        </li>
        <li>
          <strong>Findings</strong> — a plain summary of issues, warnings, and passes so you do not have to
          interpret raw TLS data yourself.
        </li>
      </ul>

      <h3>Protocol Versions: TLS 1.3, TLS 1.2, and What to Avoid</h3>

      <p>
        <a href="https://www.cloudflare.com/learning/ssl/why-use-tls-1.3/" target="_blank" rel="noreferrer">
          TLS 1.3
        </a>{' '}
        (finalised in 2018) is the gold standard — fewer round trips, only modern ciphers, and improved security
        against known attacks. TLS 1.2 is still widely used and acceptable for most sites. Anything older — TLS 1.0,
        TLS 1.1, or SSL 3.0 — should be disabled. If your server negotiates those legacy protocols, you have a
        backwards-compatibility problem that attackers can exploit.
      </p>

      <p>
        Our tool reports the protocol version negotiated during the handshake. Seeing <code>TLSv1.3</code> is ideal.
        Seeing only <code>TLSv1.2</code> is fine for now but worth monitoring as standards evolve. If you manage
        the server,{' '}
        <a href="https://ssl-config.mozilla.org/" target="_blank" rel="noreferrer">
          Mozilla&apos;s SSL Configuration Generator
        </a>{' '}
        is the industry-standard reference for hardening settings.
      </p>

      <h3>Hostname Matching and Wildcard Certificates</h3>

      <p>
        Modern browsers ignore the certificate&apos;s Common Name and check the{' '}
        <a href="https://www.digicert.com/faq/dns-names-and-common-names-in-certificates" target="_blank" rel="noreferrer">
          Subject Alternative Names
        </a>{' '}
        instead. We list every DNS name on the SAN list and explicitly verify the requested host matches one of
        them, including wildcard rules.
      </p>

      <p>
        A wildcard certificate for <code>*.example.com</code> covers subdomains like <code>blog.example.com</code>
        but not the bare domain <code>example.com</code> unless it is listed separately. A common mistake after
        launching a new subdomain is forgetting to add it to the certificate — visitors see a scary
        &ldquo;Your connection is not private&rdquo; warning even though the main site works fine.
      </p>

      <h3>Certificate Authorities and Let&apos;s Encrypt</h3>

      <p>
        A{' '}
        <a href="https://www.icann.org/resources/pages/tls-2012-02-25-en" target="_blank" rel="noreferrer">
          Certificate Authority (CA)
        </a>{' '}
        is a trusted organisation that verifies domain ownership and issues signed certificates. Browsers ship
        with a list of trusted root CAs; if your certificate is not signed by one of them, users see an error page.
      </p>

      <p>
        <a href="https://letsencrypt.org/getting-started/" target="_blank" rel="noreferrer">
          Let&apos;s Encrypt
        </a>{' '}
        revolutionised the web by offering free, automated certificates. Most shared hosts and control panels
        (cPanel, Plesk, Cloudflare) integrate it with one click. Paid CAs still dominate enterprise environments
        where extended validation (EV) or organisation-validated (OV) certificates are required for compliance or
        brand display.
      </p>

      <h3>Renewal Cadence: Do Not Let Certificates Expire</h3>

      <p>
        Most public CAs now issue certificates valid for 90 days (Let&apos;s Encrypt) or up to roughly 13 months
        (commercial CAs, following{' '}
        <a href="https://www.digicert.com/blog/google-reduces-maximum-ssl-tls-certificate-validity-398-days" target="_blank" rel="noreferrer">
          browser-imposed limits
        </a>
        ). Shorter lifetimes reduce the damage from compromised keys but mean renewal must be automated.
      </p>

      <p>
        Set up automatic renewal through your host, CDN, or a tool like{' '}
        <a href="https://certbot.eff.org/" target="_blank" rel="noreferrer">
          Certbot
        </a>
        , and monitor expiry dates from outside the system that owns them. An expired certificate does not just
        look bad — it stops transactions, breaks API integrations, and can take hours to fix if you discover it
        on a Friday evening.
      </p>

      <h3>Common SSL Problems and What They Mean</h3>

      <ul>
        <li>
          <strong>Certificate expired</strong> — the validity window ended. Renew immediately; browsers will block
          all visitors until you do.
        </li>
        <li>
          <strong>Hostname mismatch</strong> — you visited <code>www.example.com</code> but the cert only covers
          <code>example.com</code> (or vice versa). Add the missing name to SANs or redirect consistently.
        </li>
        <li>
          <strong>Untrusted / self-signed</strong> — the certificate was not issued by a recognised CA. Fine for
          internal testing; never acceptable for public websites.
        </li>
        <li>
          <strong>Incomplete chain</strong> — the server forgot to send intermediate certificates. Some browsers
          guess the chain; others fail. Install the full chain from your CA.
        </li>
        <li>
          <strong>Weak key or signature</strong> — RSA keys below 2048 bits or SHA-1 signatures are deprecated.
          Re-issue with modern algorithms.
        </li>
        <li>
          <strong>Mixed content</strong> — the page loads over HTTPS but pulls images or scripts over HTTP.
          Browsers may block those assets and show warnings.
        </li>
      </ul>

      <h3>Everyday Reasons to Check SSL Certificates</h3>

      <ul>
        <li>
          <strong>Before launching a new site</strong> — confirm HTTPS works on both <code>www</code> and non-
          <code>www</code> versions before sharing the URL publicly.
        </li>
        <li>
          <strong>After changing hosts or CDNs</strong> — migrations often leave certificates misconfigured or
          pointing at the old provider.
        </li>
        <li>
          <strong>Monitoring expiry</strong> — schedule monthly checks on production domains so you catch 30-day
          warnings early.
        </li>
        <li>
          <strong>Auditing client sites</strong> — agencies and freelancers can verify SSL health without logging
          into every hosting panel.
        </li>
        <li>
          <strong>Checking suspicious sites</strong> — phishing pages sometimes use valid HTTPS to appear
          legitimate. A certificate alone does not prove trustworthiness, but an invalid one is a clear red flag.
        </li>
        <li>
          <strong>SEO and Core Web Vitals audits</strong> — HTTPS is a baseline requirement, not an optional
          enhancement.
        </li>
      </ul>

      <h3>What This Tool Cannot Tell You</h3>

      <p>
        This checker validates the certificate presented during a single TLS handshake from our server. It does not
        scan your entire site for{' '}
        <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" target="_blank" rel="noreferrer">
          mixed content
        </a>
        , test every subdomain, or audit server-side cipher configuration beyond what was negotiated. It also
        cannot detect vulnerabilities like Heartbleed or misconfigured HSTS headers — those require dedicated
        security scanners.
      </p>

      <p>
        A valid certificate proves the connection is encrypted and the domain was verified at issuance time. It
        does not guarantee the site is honest, malware-free, or well-maintained. Always combine SSL checks with
        common sense when evaluating unfamiliar websites.
      </p>

      <h3>Helpful Resources to Learn More</h3>

      <p>
        These trusted guides explain SSL/TLS concepts in more depth. All links open in a new tab.
      </p>

      <ul>
        <li>
          <a href="https://www.cloudflare.com/learning/ssl/what-is-ssl/" target="_blank" rel="noreferrer">
            Cloudflare — What is SSL?
          </a>
        </li>
        <li>
          <a href="https://developer.mozilla.org/en-US/docs/Glossary/HTTPS" target="_blank" rel="noreferrer">
            MDN Web Docs — HTTPS glossary
          </a>
        </li>
        <li>
          <a href="https://developers.google.com/search/docs/advanced/security/https" target="_blank" rel="noreferrer">
            Google — HTTPS as a ranking signal
          </a>
        </li>
        <li>
          <a href="https://letsencrypt.org/getting-started/" target="_blank" rel="noreferrer">
            Let&apos;s Encrypt — Getting started guide
          </a>
        </li>
        <li>
          <a href="https://certbot.eff.org/" target="_blank" rel="noreferrer">
            Certbot — Free SSL automation by EFF
          </a>
        </li>
        <li>
          <a href="https://www.cloudflare.com/learning/ssl/why-use-tls-1.3/" target="_blank" rel="noreferrer">
            Cloudflare — Why use TLS 1.3?
          </a>
        </li>
        <li>
          <a href="https://ssl-config.mozilla.org/" target="_blank" rel="noreferrer">
            Mozilla — SSL Configuration Generator
          </a>
        </li>
        <li>
          <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noreferrer">
            Qualys SSL Labs — Deep server test (advanced)
          </a>
        </li>
        <li>
          <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" target="_blank" rel="noreferrer">
            MDN — Mixed content explained
          </a>
        </li>
        <li>
          <a href="https://www.icann.org/resources/pages/tls-2012-02-25-en" target="_blank" rel="noreferrer">
            ICANN — TLS / SSL overview
          </a>
        </li>
      </ul>

      <h3>Try It Now</h3>

      <p>
        The best way to understand SSL is to inspect a real certificate. Enter your own domain above and check the
        expiry date, SAN list, and trust status. Then try a major site you use daily and compare. If anything shows
        a warning or fail finding, address it before your visitors or search engines do. No sign-up, no install —
        just type a domain and check.
      </p>
    </article>
  );
}
