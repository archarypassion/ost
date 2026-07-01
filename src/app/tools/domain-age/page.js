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

      <p>
        Every website address you visit — like <code>example.com</code> — was registered on a specific date.
        That registration date is called the domain&apos;s <strong>creation date</strong>, and the time that has
        passed since then is its <strong>domain age</strong>. A five-year-old domain and a five-day-old domain
        can look identical in a browser, but behind the scenes they tell very different stories about trust,
        history, and intent.
      </p>

      <p>
        Domain age isn&apos;t directly a{' '}
        <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noreferrer">
          Google ranking factor
        </a>{' '}
        — Google has said so explicitly — but it correlates with trust signals that <em>are</em> ranking factors.
        An older domain has had more time to acquire backlinks, build a stable{' '}
        <a href="https://www.icann.org/resources/pages/whois-2012-02-25-en" target="_blank" rel="noreferrer">
          WHOIS
        </a>{' '}
        history, and avoid being flagged as a spam vector. For competitive analysis, knowing whether a
        competitor&apos;s domain is six months old or twelve years old changes how you read their authority.
      </p>

      <p>
        For everyday users, domain age is a quick sanity check. Before you buy from an unfamiliar online store,
        enter a payment on a new site, or reply to an email that links somewhere suspicious, checking how long
        the domain has existed can save you from scams. Brand-new domains are commonly used in phishing because
        they cost little to register and disappear quickly.
      </p>

      <h3>What Is WHOIS and How Does This Tool Work?</h3>

      <p>
        <a href="https://www.icann.org/resources/pages/whois-2012-02-25-en" target="_blank" rel="noreferrer">
          WHOIS
        </a>{' '}
        is a public lookup system that stores registration details for domain names. When you type a domain into
        the search box above, we query the appropriate WHOIS server (and follow registrar referrals) to fetch
        the original creation date, expiry, registrar, name servers, and statuses for that domain.
      </p>

      <p>
        Think of WHOIS as a library card for the internet&apos;s address book. It does not tell you who visits a
        site or what content is on it — only who registered the name, when, and through which company. That is
        enough to answer the most common question: &ldquo;How old is this domain, and is it about to expire?&rdquo;
      </p>

      <h3>Reading Your Results: A Plain-English Guide</h3>

      <p>
        After you run a check, the results are grouped into easy sections. Here is what each part means for a
        normal user:
      </p>

      <ul>
        <li>
          <strong>Created</strong> — the date the domain was first registered. This is the number used to calculate
          domain age. A domain created in 2010 is roughly 15+ years old today.
        </li>
        <li>
          <strong>Last updated</strong> — when the registration record was last changed. Updates happen when you
          change name servers, renew the domain, or update registrar details.
        </li>
        <li>
          <strong>Expires</strong> — the date the current registration period ends. If you own the domain, missing
          this date means you could lose it — sometimes permanently.
        </li>
        <li>
          <strong>Registrar</strong> — the company you pay to register the domain, such as{' '}
          <a href="https://www.godaddy.com/" target="_blank" rel="noreferrer">
            GoDaddy
          </a>
          ,{' '}
          <a href="https://www.namecheap.com/" target="_blank" rel="noreferrer">
            Namecheap
          </a>
          , or{' '}
          <a href="https://domains.google/" target="_blank" rel="noreferrer">
            Google Domains
          </a>
          .
        </li>
        <li>
          <strong>Name servers</strong> — the DNS hosts that control where the domain points. Common examples
          include{' '}
          <a href="https://www.cloudflare.com/dns/" target="_blank" rel="noreferrer">
            Cloudflare
          </a>{' '}
          or your web host&apos;s default servers.
        </li>
        <li>
          <strong>Domain status</strong> — short codes that describe the current state of the registration (active,
          locked, on hold, pending deletion, etc.).
        </li>
        <li>
          <strong>Findings</strong> — a plain summary of anything worth your attention, such as a soon-to-expire
          date or a domain that is only a few months old.
        </li>
      </ul>

      <h3>What WHOIS Still Tells You (and What It Hides)</h3>

      <p>
        Since{' '}
        <a href="https://gdpr.eu/what-is-gdpr/" target="_blank" rel="noreferrer">
          GDPR
        </a>{' '}
        took effect, much of the personal data in WHOIS is redacted by default. You&apos;ll usually still see
        the registrar, creation date, expiry, name servers, and domain statuses. Personal contact info is now
        typically replaced with privacy-proxy emails or omitted entirely.
      </p>

      <p>
        This is good for privacy — domain owners should not have their home address published to the world — but
        it means WHOIS is less useful for finding a specific person behind a site. For age checking, the
        important dates are almost always still visible. If a creation date is missing, the domain may use an
        unusual registry format or heavy privacy settings.
      </p>

      <h3>Domain Status Codes Worth Knowing</h3>

      <p>
        Status codes look technical, but a handful cover almost every situation you will encounter.{' '}
        <a href="https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en" target="_blank" rel="noreferrer">
          ICANN maintains the full official list
        </a>
        , but these are the ones that matter most:
      </p>

      <ul>
        <li>
          <strong>clientTransferProhibited</strong> — registrar lock; transfer requires unlocking. Recommended for
          production domains to prevent hijacking.
        </li>
        <li>
          <strong>clientHold / serverHold</strong> — domain doesn&apos;t resolve. Usually pending payment or a
          dispute.
        </li>
        <li>
          <strong>redemptionPeriod</strong> — domain expired and is in the grace period before deletion. Renewal
          may cost extra during this window.
        </li>
        <li>
          <strong>pendingDelete</strong> — domain will be released back to the public registry within five days.
          After that, anyone can register it.
        </li>
        <li>
          <strong>ok / active</strong> — normal, healthy state. The domain should resolve and function as expected.
        </li>
      </ul>

      <h3>Why Expiry Dates Deserve Your Attention</h3>

      <p>
        Domains are rented, not owned forever. You register them for one to ten years at a time, and when the
        period ends the domain enters a{' '}
        <a href="https://www.icann.org/resources/pages/gtld-lifecycle-2012-02-25-en" target="_blank" rel="noreferrer">
          lifecycle
        </a>{' '}
        of grace periods, redemption, and eventual deletion. If you run a business website and forget to renew,
        your email can stop working, your site can go offline, and a competitor or squatter can grab the name
        once it drops.
      </p>

      <p>
        Our tool highlights domains expiring within 30 or 90 days so you can renew early. Many registrars offer
        auto-renewal — turning it on is one of the simplest ways to avoid an expensive mistake. If you see a
        domain you want to buy that is in <code>pendingDelete</code>, be aware it may become available through
        a back-order service within days.
      </p>

      <h3>Domain Age and SEO: What You Should Actually Believe</h3>

      <p>
        You will often hear that &ldquo;older domains rank better.&rdquo; The reality is more nuanced. Age by
        itself does not give you a ranking boost. What older domains tend to have is a longer history of quality
        content, more inbound links, and established brand recognition — all of which <em>do</em> help rankings.
      </p>

      <p>
        A ten-year-old domain with no content and no links will not outrank a two-year-old site with excellent
        pages and strong backlinks. When doing competitor research, use domain age as context, not as a score.
        Pair it with backlink tools, content analysis, and traffic estimates for a complete picture.{' '}
        <a href="https://developers.google.com/search/docs/essentials" target="_blank" rel="noreferrer">
          Google&apos;s search essentials
        </a>{' '}
        focus on helpful content and technical quality, not registration dates.
      </p>

      <h3>Buying Aged Domains: Opportunities and Risks</h3>

      <p>
        Some people deliberately buy older domains that recently expired, hoping to inherit leftover SEO value.
        This can work in rare cases, but it carries real risks. A previous owner may have used the domain for
        spam, malware, or copyright violations. Search engines may have penalised it, and backlinks pointing to
        it may be low quality or toxic.
      </p>

      <p>
        Before purchasing any aged domain, check its creation date (how long it existed in total), its Wayback
        Machine history on{' '}
        <a href="https://archive.org/web/" target="_blank" rel="noreferrer">
          Internet Archive
        </a>
        , and whether it has suspicious status codes. A domain that is old but was parked or abused for years is
        not a shortcut to rankings.
      </p>

      <h3>Everyday Reasons to Check Domain Age</h3>

      <ul>
        <li>
          <strong>Spotting phishing sites</strong> — scam pages often use domains registered days or weeks ago.
          The{' '}
          <a href="https://www.ftc.gov/phishing" target="_blank" rel="noreferrer">
            FTC
          </a>{' '}
          recommends verifying unfamiliar sites before entering personal information.
        </li>
        <li>
          <strong>Checking a brand&apos;s legitimacy</strong> — a shop claiming decades of history but registered
          last month is a red flag.
        </li>
        <li>
          <strong>Auditing your own portfolio</strong> — business owners with multiple domains can confirm renewal
          dates and registrar details in one place.
        </li>
        <li>
          <strong>Competitor research</strong> — understand whether a fast-growing rival is building on a fresh
          domain or an established one.
        </li>
        <li>
          <strong>Before buying a domain</strong> — see how long it has existed and whether it is close to expiry
          before you negotiate a purchase.
        </li>
        <li>
          <strong>Due diligence on partnerships</strong> — agencies, affiliates, and sponsors sometimes inflate
          their experience; WHOIS dates are harder to fake.
        </li>
      </ul>

      <h3>What This Tool Cannot Tell You</h3>

      <p>
        Domain age checking has clear limits. WHOIS shows registration metadata, not website quality, traffic,
        revenue, or who physically operates a business. A domain registered ten years ago may have changed owners
        five times — the age reflects the name, not necessarily the current site&apos;s history.
      </p>

      <p>
        Privacy services and country-code domains (like <code>.uk</code> or <code>.de</code>) sometimes return
        less data than generic <code>.com</code> domains. Results can also be cached at the registry level, so
        very recent transfers may not appear instantly. Treat WHOIS as one data point among many, not the final
        word on trustworthiness.
      </p>

      <h3>Helpful Resources to Learn More</h3>

      <p>
        These trusted guides go deeper into domain registration, WHOIS, and the policies that govern them.
      </p>

      <ul>
        <li>
          <a href="https://www.icann.org/resources/pages/whois-2012-02-25-en" target="_blank" rel="noreferrer">
            ICANN — What is WHOIS?
          </a>
        </li>
        <li>
          <a href="https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en" target="_blank" rel="noreferrer">
            ICANN — EPP Domain Status Codes
          </a>
        </li>
        <li>
          <a href="https://www.icann.org/resources/pages/gtld-lifecycle-2012-02-25-en" target="_blank" rel="noreferrer">
            ICANN — Domain Name Life Cycle
          </a>
        </li>
        <li>
          <a href="https://www.icann.org/resources/pages/registrars-2012-02-25-en" target="_blank" rel="noreferrer">
            ICANN — What is a Domain Name Registrar?
          </a>
        </li>
        <li>
          <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noreferrer">
            Google — SEO Starter Guide
          </a>
        </li>
        <li>
          <a href="https://gdpr.eu/what-is-gdpr/" target="_blank" rel="noreferrer">
            GDPR.eu — What is GDPR?
          </a>
        </li>
        <li>
          <a href="https://www.cloudflare.com/learning/dns/glossary/what-is-whois/" target="_blank" rel="noreferrer">
            Cloudflare — What is WHOIS?
          </a>
        </li>
        <li>
          <a href="https://en.wikipedia.org/wiki/Domain_name" target="_blank" rel="noreferrer">
            Wikipedia — Domain name overview
          </a>
        </li>
        <li>
          <a href="https://archive.org/web/" target="_blank" rel="noreferrer">
            Internet Archive — Wayback Machine
          </a>
        </li>
        <li>
          <a href="https://www.ftc.gov/phishing" target="_blank" rel="noreferrer">
            FTC — How to recognize and avoid phishing
          </a>
        </li>
      </ul>

      <h3>Try It Now</h3>

      <p>
        The fastest way to understand domain age is to check a real example. Enter your own domain above and note
        the creation date and expiry. Then try a major brand you trust and compare. Finally, if you have ever
        received a suspicious link, paste that domain here — a creation date from last week tells you everything
        you need to know. No account required, no install, just type and check.
      </p>
    </article>
  );
}
