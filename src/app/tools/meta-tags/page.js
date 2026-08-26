"use client";
import { useState } from 'react';
import Link from 'next/link';

const SEVERITY_ICON = { pass: '✓', warn: '!', fail: '✕' };
const SEVERITY_LABEL = { pass: 'Good', warn: 'Warning', fail: 'Issue' };

export default function MetaTagsCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch('/api/tools/meta-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || `Request failed with status ${res.status}.`);
        if (json?.finalUrl || json?.redirectChain) setData(json);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tool-header">
        <h1>🏷️ Meta Tags Checker</h1>
      </div>

      <div className="tool-card" style={{ width: '100%', maxWidth: '100%' }}>
        <form className="search-bar" onSubmit={handleCheck} style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="https://example.com or example.com"
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="check-btn" disabled={loading}>
            {loading ? '⏳ Fetching…' : '🔍 Check Meta Tags'}
          </button>
        </form>
        <p className="tool-description">
          🔍 Extract every <code>&lt;meta&gt;</code> and <code>&lt;link&gt;</code> tag, see a Google SERP preview,
          inspect Open Graph and Twitter Card tags, and spot length issues at a glance.
        </p>

        {error && <div className="result-error">{error}</div>}
        {data && !data.error && <ResultBlock data={data} />}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <Article />
      </div>
    </div>
  );
}

function ResultBlock({ data }) {
  const { seoEssentials, opengraph, twitter, metaTagsGrouped, linkTagsGrouped, counts, issues, redirectChain, xRobotsTag } = data;
  const failCount = issues.filter((i) => i.severity === 'fail').length;
  const warnCount = issues.filter((i) => i.severity === 'warn').length;
  const banner = failCount ? 'danger' : warnCount ? 'warning' : 'success';
  const bannerText = failCount
    ? `❌ ${failCount} issue${failCount === 1 ? '' : 's'} found`
    : warnCount
      ? `⚠️ ${warnCount} warning${warnCount === 1 ? '' : 's'}`
      : '✅ All essential meta tags look good';

  return (
    <div className="result-box" style={{ width: '100%' }}>
      <div className={`result-banner ${banner}`}>
        <strong>{bannerText}</strong>
        <span>· {counts.meta} meta · {counts.link} link · 1 title</span>
      </div>

      <SerpPreview essentials={seoEssentials} finalUrl={data.finalUrl} />

      <h3 className="result-section-title">📌 SEO essentials</h3>
      <div className="essentials-grid" style={{ width: '100%' }}>
        <LengthCard
          label="Title"
          value={seoEssentials.title}
          length={seoEssentials.titleLength}
          recommendedMin={30}
          recommendedMax={60}
          truncationLimit={60}
          missingMessage="No <title> tag"
        />
        <LengthCard
          label="Meta description"
          value={seoEssentials.description}
          length={seoEssentials.description?.length || 0}
          recommendedMin={120}
          recommendedMax={160}
          truncationLimit={165}
          missingMessage="No description"
        />
      </div>

      <div className="result-grid" style={{ marginTop: '1rem', width: '100%' }}>
        <Field label="🔗 Canonical" value={seoEssentials.canonical} mono />
        <Field label="🤖 Robots" value={seoEssentials.robots} />
        <Field label="🤖 Googlebot" value={seoEssentials.googlebot} />
        <Field label="📡 X-Robots-Tag" value={xRobotsTag} />
        <Field label="📱 Viewport" value={seoEssentials.viewport} mono />
        <Field label="🔤 Charset" value={seoEssentials.charset} />
        <Field label="🌐 HTML lang" value={seoEssentials.htmlLang} />
        <Field label="📝 HTML dir" value={seoEssentials.htmlDir} />
        <Field label="✍️ Author" value={seoEssentials.author} />
        <Field label="⚙️ Generator" value={seoEssentials.generator} />
        <Field label="🎨 Theme color" value={seoEssentials.themeColor} />
        <Field label="🔑 Keywords" value={seoEssentials.keywords} />
      </div>

      {issues.length > 0 && (
        <>
          <h3 className="result-section-title">📋 Issues & warnings</h3>
          <ul className="issue-list">
            {issues.map((issue, idx) => (
              <li key={idx} className={`issue-item ${issue.severity === 'fail' ? 'error' : 'warn'}`}>
                <span className="issue-tag">{SEVERITY_ICON[issue.severity]} {SEVERITY_LABEL[issue.severity]}</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <SocialPreview opengraph={opengraph} twitter={twitter} finalUrl={data.finalUrl} />

      <h3 className="result-section-title">📋 All meta tags ({counts.meta})</h3>
      <CategoryBlock title="📌 SEO" tags={metaTagsGrouped.seo} kind="meta" />
      <CategoryBlock title="📱 Open Graph" tags={metaTagsGrouped.opengraph} kind="meta" />
      <CategoryBlock title="🐦 Twitter Card" tags={metaTagsGrouped.twitter} kind="meta" />
      <CategoryBlock title="📱 Mobile / PWA" tags={metaTagsGrouped.mobile} kind="meta" />
      <CategoryBlock title="⚙️ Technical (charset, http-equiv)" tags={metaTagsGrouped.technical} kind="meta" />
      <CategoryBlock title="✅ Site verification" tags={metaTagsGrouped.verification} kind="meta" />
      <CategoryBlock title="📄 Microdata" tags={metaTagsGrouped.microdata} kind="meta" />
      <CategoryBlock title="📌 Other" tags={metaTagsGrouped.other} kind="meta" />

      <h3 className="result-section-title">🔗 Link tags ({counts.link})</h3>
      <CategoryBlock title="📌 SEO (canonical, alternate, etc.)" tags={linkTagsGrouped.seo} kind="link" />
      <CategoryBlock title="🖼️ Icons & manifest" tags={linkTagsGrouped.icons} kind="link" />
      <CategoryBlock title="⚡ Performance hints" tags={linkTagsGrouped.performance} kind="link" />
      <CategoryBlock title="🎨 Stylesheets" tags={linkTagsGrouped.stylesheet} kind="link" />
      <CategoryBlock title="📌 Other" tags={linkTagsGrouped.other} kind="link" />

      {redirectChain && redirectChain.length > 1 && (
        <>
          <h3 className="result-section-title">🔄 Redirect chain</h3>
          <ol className="redirect-chain">
            {redirectChain.map((hop, idx) => (
              <li key={idx}>
                <span className="redirect-status">HTTP {hop.status}</span>
                <span className="result-value-mono">{hop.url}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function SerpPreview({ essentials, finalUrl }) {
  const title = essentials.title || 'Untitled page';
  const description = essentials.description || 'No description provided.';
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const truncatedDesc = description.length > 160 ? description.slice(0, 157) + '…' : description;

  let displayUrl = finalUrl || '';
  try {
    const u = new URL(finalUrl);
    displayUrl = `${u.hostname}${u.pathname.replace(/\/$/, '')}`;
  } catch { }

  return (
    <>
      <h3 className="result-section-title">🔍 Google SERP preview</h3>
      <div className="serp-preview">
        <div className="serp-url">{displayUrl}</div>
        <div className="serp-title">{truncatedTitle}</div>
        <div className="serp-description">{truncatedDesc}</div>
      </div>
    </>
  );
}

function SocialPreview({ opengraph, twitter, finalUrl }) {
  const ogKeys = Object.keys(opengraph);
  const twKeys = Object.keys(twitter);
  if (!ogKeys.length && !twKeys.length) return null;

  const ogTitle = opengraph['og:title'];
  const ogDesc = opengraph['og:description'];
  const ogImage = opengraph['og:image'] || opengraph['og:image:url'];
  const ogSite = opengraph['og:site_name'];

  let host = '';
  try { host = new URL(finalUrl).hostname; } catch { }

  return (
    <>
      <h3 className="result-section-title">📱 Social preview</h3>
      <div className="social-grid" style={{ width: '100%' }}>
        {(ogTitle || ogDesc || ogImage) ? (
          <div className="social-card">
            <div className="social-card-label">📘 Open Graph (Facebook / LinkedIn / WhatsApp)</div>
            {ogImage && (
              <div className="social-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAbs(ogImage, finalUrl)} alt="Open Graph image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
            <div className="social-card-body">
              <div className="social-card-host">{ogSite || host}</div>
              <div className="social-card-title">{ogTitle || '(no og:title)'}</div>
              <div className="social-card-desc">{ogDesc || '(no og:description)'}</div>
            </div>
          </div>
        ) : null}

        {twKeys.length > 0 && (
          <div className="social-card">
            <div className="social-card-label">🐦 Twitter Card ({twitter['twitter:card'] || 'summary'})</div>
            {(twitter['twitter:image'] || ogImage) && (
              <div className="social-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAbs(twitter['twitter:image'] || ogImage, finalUrl)} alt="Twitter card image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
            <div className="social-card-body">
              <div className="social-card-host">{twitter['twitter:site'] || host}</div>
              <div className="social-card-title">{twitter['twitter:title'] || ogTitle || '(no twitter:title)'}</div>
              <div className="social-card-desc">{twitter['twitter:description'] || ogDesc || '(no twitter:description)'}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function resolveAbs(href, base) {
  if (!href) return '';
  try { return new URL(href, base).toString(); }
  catch { return href; }
}

function LengthCard({ label, value, length, recommendedMin, recommendedMax, truncationLimit, missingMessage }) {
  if (!value) {
    return (
      <div className="length-card length-card-empty">
        <div className="length-card-label">{label}</div>
        <div className="length-card-missing">{missingMessage}</div>
      </div>
    );
  }
  const overTruncation = length > truncationLimit;
  const tooShort = length < recommendedMin;
  const status = overTruncation ? 'over' : tooShort ? 'short' : 'good';
  const pct = Math.min(100, Math.round((length / truncationLimit) * 100));
  return (
    <div className="length-card">
      <div className="length-card-head">
        <span className="length-card-label">{label}</span>
        <span className={`length-card-count ${status}`}>{length} chars</span>
      </div>
      <div className="length-card-value">{value}</div>
      <div className="length-bar">
        <div className={`length-bar-fill ${status}`} style={{ width: `${pct}%` }} />
        <div className="length-bar-marker" style={{ left: `${(recommendedMin / truncationLimit) * 100}%` }} title={`min ${recommendedMin}`} />
        <div className="length-bar-marker" style={{ left: `${(recommendedMax / truncationLimit) * 100}%` }} title={`recommended ${recommendedMax}`} />
      </div>
      <div className="length-card-hint">
        Recommended {recommendedMin}–{recommendedMax} · Truncation around {truncationLimit}
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="result-item">
      <span className="result-label">{label}</span>
      <span className={mono ? 'result-value-mono' : 'result-value'}>{value || <em className="muted">—</em>}</span>
    </div>
  );
}

function CategoryBlock({ title, tags, kind }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="meta-category">
      <h4 className="meta-category-title">{title} <span className="meta-count">({tags.length})</span></h4>
      <div className="meta-tag-list">
        {tags.map((tag, idx) => (
          <RawTag key={idx} attrs={tag} kind={kind} />
        ))}
      </div>
    </div>
  );
}

function RawTag({ attrs, kind }) {
  const skip = new Set(['_kind', '_category', '_absoluteHref']);
  const tagName = kind === 'link' ? 'link' : 'meta';
  const pairs = Object.entries(attrs).filter(([k]) => !skip.has(k));
  return (
    <code className="meta-tag-code">
      &lt;{tagName}
      {pairs.map(([k, v]) => (
        <span key={k}>
          {' '}<span className="meta-attr-key">{k}</span>=<span className="meta-attr-val">&quot;{String(v)}&quot;</span>
        </span>
      ))}
      {' '}/&gt;
    </code>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>HTML <code>&lt;head&gt;</code> Metadata Architecture & Search Optimization</h2>
      <p>
        HTML metadata elements located inside the document <code>&lt;head&gt;</code> inform search engine crawlers, social graph scrapers, and web browsers how to interpret, render, and index a webpage.
      </p>

      <h2>Core SEO Metadata Elements</h2>

      <h3>1. Document Title (<code>&lt;title&gt;</code>)</h3>
      <p>
        The <code>&lt;title&gt;</code> tag remains one of the strongest on-page relevance signals for organic search.
      </p>
      <ul>
        <li><strong>SERP Pixel Limit:</strong> Google desktop search results allocate approximately <strong>600 pixels</strong> (typically 50–60 characters). Titles exceeding this limit get truncated with an ellipsis.</li>
        <li><strong>Format:</strong> <code>Primary Keyword - Secondary Keyword | Brand Name</code></li>
        <li><strong>Uniqueness:</strong> Every URL must have a unique title tag to avoid title cannibalization across indexable pages.</li>
      </ul>

      <h3>2. Meta Description</h3>
      <pre className="code-pre">
        <code>{`<meta name="description" content="Concise summary of the page content containing primary search terms and a clear call-to-action." />`}</code>
      </pre>
      <p>
        While meta descriptions are not a direct algorithmic ranking factor, they directly determine organic click-through rates (CTR). Recommended length is <strong>120 to 160 characters</strong>. Search engines highlight searched terms in bold within the description snippet.
      </p>

      <h3>3. Viewport Meta Tag (Mobile Readiness)</h3>
      <pre className="code-pre">
        <code>{`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`}</code>
      </pre>
      <p>
        Mandatory for responsive rendering. Without this tag, mobile browsers render desktop-width viewports and scale down content, triggering mobile usability errors in Google Search Console.
      </p>

      <h3>4. Character Encoding & Document Language</h3>
      <pre className="code-pre">
        <code>{`<meta charset="UTF-8" />
<html lang="en">`}</code>
      </pre>
      <p>
        Declaring <code>UTF-8</code> within the first 1024 bytes of the HTML document prevents character encoding mismatches and garbled text across international browsers.
      </p>

      <h2>Social Metadata: Open Graph & Twitter Cards</h2>
      <p>
        Social platforms like Facebook, LinkedIn, Discord, and Slack consume Open Graph (OG) protocol tags, while X (Twitter) reads Twitter Card markup with fallback to OG:
      </p>
      <pre className="code-pre">
        <code>{`<!-- Open Graph -->
<meta property="og:type" content="article" />
<meta property="og:title" content="Page Headline" />
<meta property="og:description" content="Summary of the article." />
<meta property="og:image" content="https://example.com/images/cover.jpg" />
<meta property="og:url" content="https://example.com/page" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@brandhandle" />`}</code>
      </pre>
      <p>
        Validate your social cards and test aspect ratio rendering with our <Link href="/tools/open-graph">Open Graph Checker</Link>.
      </p>

      <h2>Frequently Asked Questions</h2>

      <h3>Why does Google rewrite or replace my title tag in search results?</h3>
      <p>
        Google may replace your title tag if it is excessively long, keyword-stuffed, repetitive across pages, or does not accurately match the user's specific search query. Ensuring your title matches the primary <code>&lt;h1&gt;</code> heading reduces the chance of algorithmic overwrites.
      </p>

      <h3>Does the <code>&lt;meta name="keywords"&gt;</code> tag help SEO?</h3>
      <p>
        No. Google officially abandoned the <code>keywords</code> meta tag in 2009 due to widespread spam. Including it provides zero ranking benefit and reveals your target keywords to competitors.
      </p>

      <h3>What is the difference between meta robots and X-Robots-Tag?</h3>
      <p>
        The <code>&lt;meta name="robots"&gt;</code> tag is placed in HTML source code. The <code>X-Robots-Tag</code> is delivered via HTTP server response headers and works on non-HTML files (PDFs, images). Inspect directives with our <Link href="/tools/noindex-checker">Noindex Checker</Link>.
      </p>
    </article>
  );
}