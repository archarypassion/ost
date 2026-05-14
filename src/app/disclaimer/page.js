'use client';

import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, SITE_NAME } from '@/lib/tools-catalog';

const mailHelp = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} — disclaimer question`)}`;

export default function DisclaimerPage() {
  return (
    <LegalPageShell>
      <article className="tool-article" style={{ width: '100%' }}>
        <h1>Disclaimer</h1>
        <p>Last updated: {LEGAL_LAST_UPDATED}</p>

        <h2>General</h2>
        <p>
          The information, scores, and diagnostics provided by {SITE_NAME} are for general informational
          purposes only. We make reasonable efforts to keep tools accurate and up to date, but we do not
          guarantee that any result is complete, correct, or suitable for your situation.
        </p>

        <h2>Not professional advice</h2>
        <p>
          Nothing on this site is legal, financial, or tailored professional SEO advice. Search engines
          change their systems frequently; a passing check today does not guarantee rankings, indexation,
          or compliance tomorrow. Always verify critical decisions with qualified professionals and
          official documentation (for example Google Search Central).
        </p>

        <h2>Third-party data and live checks</h2>
        <p>
          Many tools fetch or analyze third-party URLs, DNS, certificates, or HTTP responses. Results
          depend on network conditions, caching, geo routing, robots rules, and the target site&apos;s
          behaviour. We are not responsible for actions you take based on tool output, or for outages or
          changes on sites you analyze.
        </p>

        <h2>No warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind, to the fullest
          extent permitted by law. See also our{' '}
          <Link href="/terms" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Terms of Service
          </Link>
          .
        </p>

        <h2>Advertising</h2>
        <p>
          If ads are displayed, they are served by third-party networks. We do not endorse advertised
          products or services by virtue of their appearance on {SITE_NAME}.
        </p>

        <h2>Contact</h2>
        <p>
          For clarifications, email{' '}
          <a href={mailHelp} style={{ color: 'var(--accent-color, #1A73E8)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </article>
    </LegalPageShell>
  );
}
