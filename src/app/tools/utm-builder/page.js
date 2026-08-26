"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Share2, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';

const PRESETS = [
  { name: 'Google Ads (Search/CPC)', source: 'google', medium: 'cpc', campaign: 'spring_promo' },
  { name: 'Facebook / Meta Ads', source: 'facebook', medium: 'paid_social', campaign: 'lead_gen_q2' },
  { name: 'Email Newsletter', source: 'newsletter', medium: 'email', campaign: 'weekly_digest_24' },
  { name: 'LinkedIn Organic Post', source: 'linkedin', medium: 'social', campaign: 'product_launch' },
  { name: 'Twitter / X Campaign', source: 'twitter', medium: 'social', campaign: 'brand_awareness' },
];

export default function UtmBuilderPage() {
  const [url, setUrl] = useState('https://example.com/landing-page');
  const [source, setSource] = useState('google');
  const [medium, setMedium] = useState('cpc');
  const [campaign, setCampaign] = useState('summer_sale');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [forceLowercase, setForceLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const clean = (val) => {
    let s = val.trim();
    if (forceLowercase) s = s.toLowerCase();
    return s.replace(/\s+/g, '_');
  };

  const finalUrl = useMemo(() => {
    if (!url.trim()) return '';
    try {
      let base = url.trim();
      if (!base.startsWith('http://') && !base.startsWith('https://')) {
        base = `https://${base}`;
      }
      const u = new URL(base);

      if (source.trim()) u.searchParams.set('utm_source', clean(source));
      if (medium.trim()) u.searchParams.set('utm_medium', clean(medium));
      if (campaign.trim()) u.searchParams.set('utm_campaign', clean(campaign));
      if (term.trim()) u.searchParams.set('utm_term', clean(term));
      if (content.trim()) u.searchParams.set('utm_content', clean(content));

      return u.toString();
    } catch {
      return '';
    }
  }, [url, source, medium, campaign, term, content, forceLowercase]);

  const applyPreset = (p) => {
    setSource(p.source);
    setMedium(p.medium);
    setCampaign(p.campaign);
  };

  const handleCopy = async () => {
    if (!finalUrl) return;
    await navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Google Analytics UTM Campaign URL Builder</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Build standardized Google Analytics 4 (GA4) tracking URLs. Add source, medium, campaign,
          keyword term, and content tags with quick channel presets and automatic sanitization.
        </p>

        {/* Preset Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Quick Channel Presets:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="lv2-pill-btn"
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Builder Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', width: '100%' }}>
          {/* Base URL */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Target Website URL <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
              required
            />
          </div>

          {/* utm_source */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Campaign Source (<code>utm_source</code>) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. google, newsletter, facebook"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
              required
            />
          </div>

          {/* utm_medium */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Campaign Medium (<code>utm_medium</code>) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="e.g. cpc, email, paid_social, banner"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
              required
            />
          </div>

          {/* utm_campaign */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Campaign Name (<code>utm_campaign</code>)
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. black_friday_2026"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
            />
          </div>

          {/* utm_term */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Campaign Term / Keyword (<code>utm_term</code>)
            </label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. seo_tools"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
            />
          </div>

          {/* utm_content */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Campaign Content (<code>utm_content</code>)
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. sidebar_cta_blue or header_text_link"
              className="search-input"
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={forceLowercase}
              onChange={(e) => setForceLowercase(e.target.checked)}
            />
            <span>Force lowercase &amp; convert spaces to underscores (Recommended for GA4)</span>
          </label>
        </div>

        {/* Final URL Box */}
        <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', borderLeft: '3px solid #06B6D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.875rem' }}>Generated Campaign URL:</strong>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="check-btn"
                onClick={handleCopy}
                disabled={!finalUrl}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
              >
                {copied ? <Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', wordBreak: 'break-all', color: finalUrl ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {finalUrl || 'Fill in the required fields above to generate your URL...'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>Google Analytics 4 (GA4) Campaign Tagging Architecture</h2>
      <p>
        Urchin Tracking Module (UTM) parameters are five query string tokens appended to URLs that instruct analytics platforms (Google Analytics 4, Mixpanel, Adobe Analytics) exactly which marketing channel, ad variation, or newsletter link generated a session and conversion.
      </p>

      <h2>The Five Standard UTM Parameters</h2>

      <ul>
        <li><strong><code>utm_source</code> (Required):</strong> Identifies the platform or referrer sending traffic (e.g. <code>google</code>, <code>facebook</code>, <code>newsletter</code>, <code>linkedin</code>).</li>
        <li><strong><code>utm_medium</code> (Required):</strong> Identifies the high-level marketing channel type (e.g. <code>cpc</code>, <code>email</code>, <code>paid_social</code>, <code>referral</code>, <code>organic_social</code>).</li>
        <li><strong><code>utm_campaign</code> (Recommended):</strong> Identifies the specific marketing initiative, promo, or product launch (e.g. <code>black_friday_2026</code>).</li>
        <li><strong><code>utm_term</code> (Optional):</strong> Used primarily in paid search (Google Ads, Bing Ads) to record targeted keyword terms.</li>
        <li><strong><code>utm_content</code> (Optional):</strong> Differentiates distinct links pointing to the same destination on one page (e.g. <code>button_cta</code> vs <code>footer_text_link</code>) for A/B split testing.</li>
      </ul>

      <h2>Critical UTM Best Practices for Clean Analytics</h2>

      <ol>
        <li><strong>Strict Lowercase:</strong> Google Analytics treats <code>utm_source=Google</code> and <code>utm_source=google</code> as two separate traffic sources. Always normalize tags to lowercase.</li>
        <li><strong>Use Underscores or Hyphens:</strong> Avoid raw spaces in parameter values; use underscores (<code>summer_sale</code>) or hyphens to prevent ugly <code>%20</code> URL encoding artifacts.</li>
        <li><strong>Never Tag Internal Links:</strong> Do not place UTM tags on internal links within your website. Doing so overrides the original visitor attribution and resets session analytics.</li>
      </ol>

      <h2>Synergies with Link &amp; Redirect Tools</h2>

      <p>
        Ensure marketing campaigns retain tracking equity across routing hops:
      </p>
      <ul>
        <li><strong>Preserve Query Strings:</strong> Verify that server 301 redirects do not strip UTM parameters using our <Link href="/tools/redirect-checker">Redirect Chain Checker</Link>.</li>
        <li><strong>Canonical URL Safety:</strong> Ensure campaign landing pages reference clean canonical targets with our <Link href="/tools/canonical-url">Canonical URL Checker</Link>.</li>
        <li><strong>Character Encoding:</strong> Percent-encode specialized query characters using our <Link href="/tools/url-encoder">URL Encoder / Decoder</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Do UTM parameters hurt SEO or create duplicate content?</h3>
      <p>
        No, provided your destination page implements a self-referencing <Link href="/tools/canonical-url">canonical tag</Link> pointing to the clean apex URL without parameters. Googlebot automatically strips standard UTM query strings when indexing canonical URLs.
      </p>

      <h3>What is the difference between utm_source and utm_medium?</h3>
      <p>
        <code>utm_source</code> answers <em>&quot;Where did the visitor come from?&quot;</em> (e.g. Google, Facebook, Substack). <code>utm_medium</code> answers <em>&quot;How did they get here?&quot;</em> (e.g. CPC ad, organic post, email newsletter).
      </p>

      <h3>Why is utm_content useful for A/B testing?</h3>
      <p>
        If your email newsletter features two links to the same landing page (one hero banner and one bottom text link), setting <code>utm_content=hero_banner</code> and <code>utm_content=footer_link</code> reveals which creative drove more sales.
      </p>
    </article>
  );
}
