'use client';

import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, SITE_NAME } from '@/lib/tools-catalog';

const mailLegal = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} — terms`)}`;

export default function TermsPage() {
  return (
    <LegalPageShell>
      <article className="tool-article" style={{ width: '100%' }}>
        <h1>Terms of Service</h1>
        <p>Last updated: {LEGAL_LAST_UPDATED}</p>

        <p>
          These terms govern your access to and use of {SITE_NAME}. If you do not agree, do not use
          the site.
        </p>

        <h2>1. The service</h2>
        <p>
          {SITE_NAME} provides informational tools and reports. Outputs depend on live or cached data
          from the open web and may be incomplete or outdated. See our{' '}
          <Link href="/disclaimer" style={{ color: 'var(--accent-color, #1A73E8)' }}>
            Disclaimer
          </Link>{' '}
          for important limitations.
        </p>

        <h2>2. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the site in any way that violates applicable law;</li>
          <li>Attempt to disrupt, overload, or reverse engineer the service or its infrastructure;</li>
          <li>Use automated means to scrape or hammer endpoints in a way that degrades service for others;</li>
          <li>Submit illegal content or use the tools to harass third parties.</li>
        </ul>
        <p>We may suspend or block access when we reasonably believe these rules are being broken.</p>

        <h2>3. Intellectual property</h2>
        <p>
          The site layout, branding, text, and software are owned by us or our licensors. You may not
          copy or redistribute the codebase or substantial parts of the UI without permission, except
          where allowed by law.
        </p>

        <h2>4. Disclaimer of warranties</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
          of any kind, express or implied, including merchantability, fitness for a particular purpose,
          and non-infringement, to the fullest extent permitted by law.
        </p>

        <h2>5. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {SITE_NAME} and its operators are not liable for any
          indirect, incidental, special, consequential, or punitive damages, or for any loss of profits,
          data, or goodwill, arising from your use of the site or reliance on tool output.
        </p>

        <h2>6. Indemnity</h2>
        <p>
          You agree to defend and indemnify us against claims arising from your misuse of the service
          or violation of these terms, to the extent permitted by law.
        </p>

        <h2>7. Changes</h2>
        <p>
          We may modify these terms at any time. Material changes will be reflected by updating the
          date above. Your continued use after changes constitutes acceptance of the new terms.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about these terms:{' '}
          <a href={mailLegal} style={{ color: 'var(--accent-color, #1A73E8)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </article>
    </LegalPageShell>
  );
}
