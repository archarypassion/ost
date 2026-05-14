'use client';

import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, SITE_NAME } from '@/lib/tools-catalog';

const mailPrivacy = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} — privacy`)}`;

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <article className="tool-article" style={{ width: '100%' }}>
        <h1>Privacy Policy</h1>
        <p>Last updated: {LEGAL_LAST_UPDATED}</p>

        <p>
          This policy describes how {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects and uses
          information when you visit our website or use our tools. By using the site, you agree to
          this policy together with our{' '}
          <Link href="/terms" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/disclaimer" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Disclaimer
          </Link>
          .
        </p>

        <h2>1. What we collect</h2>
        <p>
          <strong>Server and analytics logs.</strong> Like most websites, our hosting may log technical
          data such as IP address, browser type, approximate request time, and pages or endpoints
          requested. We use this to operate the service, prevent abuse, and understand aggregate usage.
        </p>
        <p>
          <strong>URLs and inputs you submit to tools.</strong> When you run a check, our servers may
          request the URL or resource you specify in order to return results. We do not use that content
          to build profiles about you. We may retain short-lived logs for security and debugging; we do
          not sell personal data.
        </p>
        <p>
          <strong>Local storage.</strong> Theme preference (light or dark mode) may be stored in your
          browser only and is not sent to us as an account identifier (we do not offer accounts).
        </p>

        <h2>2. Cookies and similar technologies</h2>
        <p>
          We may use cookies or similar technologies where needed for site functionality or, if
          configured, for advertising or analytics partners. Third-party scripts (for example ad
          networks) are governed by those providers&apos; policies. You can control cookies through your
          browser settings.
        </p>

        <h2>3. Third-party services</h2>
        <p>
          The site may link to external sites or load third-party resources. We are not responsible for
          the privacy practices of other sites. Review their policies before sharing sensitive
          information with them.
        </p>

        <h2>4. Children</h2>
        <p>
          {SITE_NAME} is not directed at children under 13, and we do not knowingly collect personal
          information from children.
        </p>

        <h2>5. Contact</h2>
        <p>
          Questions about this policy:{' '}
          <a href={mailPrivacy} style={{ color: 'var(--accent-color, #1A73E8)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2>6. Changes</h2>
        <p>
          We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top will
          change when we do; continued use of the site after changes means you accept the revised
          policy.
        </p>
      </article>
    </LegalPageShell>
  );
}
