"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Check, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function SchemaGeneratorPage() {
  const [schemaType, setSchemaType] = useState('Article');
  const [copied, setCopied] = useState(false);

  // Article State
  const [article, setArticle] = useState({
    headline: '10 Essential SEO Techniques for Modern Web Developers',
    image: 'https://example.com/images/seo-guide.jpg',
    authorName: 'Alex Mercer',
    publisherName: 'OpenSourceTools',
    publisherLogo: 'https://example.com/logo.png',
    datePublished: '2026-05-15',
    dateModified: '2026-05-18',
    description: 'A comprehensive technical audit guide for developers looking to optimize indexation and performance.',
  });

  // FAQ State
  const [faqs, setFaqs] = useState([
    { q: 'What is structured data?', a: 'Structured data is standardized JSON-LD markup that helps search engines understand webpage content.' },
    { q: 'How does schema markup improve SEO?', a: 'Schema qualifies pages for rich result enhancements like stars, FAQ accordions, and price snippets in Google SERPs.' },
  ]);

  // Product State
  const [product, setProduct] = useState({
    name: 'Professional SEO Diagnostic Suite',
    image: 'https://example.com/product.jpg',
    description: 'High-speed technical SEO and network timing analysis software.',
    brand: 'OpenSourceTools',
    price: '49.00',
    currency: 'USD',
    availability: 'https://schema.org/InStock',
    ratingValue: '4.9',
    reviewCount: '128',
  });

  // Organization State
  const [org, setOrg] = useState({
    name: 'OpenSourceTools Inc.',
    url: 'https://www.opensourcetools.online',
    logo: 'https://www.opensourcetools.online/logo.png',
    sameAs: 'https://twitter.com/opensourcetools\nhttps://github.com/opensourcetools',
  });

  // Breadcrumb State
  const [breadcrumbs, setBreadcrumbs] = useState([
    { name: 'Home', url: 'https://example.com' },
    { name: 'Tools', url: 'https://example.com/tools' },
    { name: 'Schema Generator', url: 'https://example.com/tools/schema-generator' },
  ]);

  const generatedJson = useMemo(() => {
    if (schemaType === 'Article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.headline,
        image: article.image ? [article.image] : undefined,
        datePublished: article.datePublished,
        dateModified: article.dateModified || article.datePublished,
        author: [{
          '@type': 'Person',
          name: article.authorName,
        }],
        publisher: {
          '@type': 'Organization',
          name: article.publisherName,
          logo: article.publisherLogo ? {
            '@type': 'ImageObject',
            url: article.publisherLogo,
          } : undefined,
        },
        description: article.description,
      };
    }

    if (schemaType === 'FAQPage') {
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      };
    }

    if (schemaType === 'Product') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.image ? [product.image] : undefined,
        description: product.description,
        brand: {
          '@type': 'Brand',
          name: product.brand,
        },
        offers: {
          '@type': 'Offer',
          url: typeof window !== 'undefined' ? window.location.href : 'https://example.com',
          priceCurrency: product.currency,
          price: product.price,
          availability: product.availability,
        },
        aggregateRating: product.ratingValue ? {
          '@type': 'AggregateRating',
          ratingValue: product.ratingValue,
          reviewCount: product.reviewCount || '1',
        } : undefined,
      };
    }

    if (schemaType === 'Organization') {
      const links = org.sameAs.split('\n').map((s) => s.trim()).filter(Boolean);
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: org.name,
        url: org.url,
        logo: org.logo,
        sameAs: links.length > 0 ? links : undefined,
      };
    }

    if (schemaType === 'BreadcrumbList') {
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.url,
        })),
      };
    }

    return {};
  }, [schemaType, article, faqs, product, org, breadcrumbs]);

  const jsonLdString = useMemo(() => {
    return JSON.stringify(generatedJson, null, 2);
  }, [generatedJson]);

  const scriptTagString = useMemo(() => {
    return `<script type="application/ld+json">\n${jsonLdString}\n</script>`;
  }, [jsonLdString]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scriptTagString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addFaq = () => {
    setFaqs([...faqs, { q: '', a: '' }]);
  };

  const removeFaq = (idx) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  const updateFaq = (idx, field, val) => {
    const updated = [...faqs];
    updated[idx][field] = val;
    setFaqs(updated);
  };

  const addBreadcrumb = () => {
    setBreadcrumbs([...breadcrumbs, { name: '', url: '' }]);
  };

  const removeBreadcrumb = (idx) => {
    setBreadcrumbs(breadcrumbs.filter((_, i) => i !== idx));
  };

  const updateBreadcrumb = (idx, field, val) => {
    const updated = [...breadcrumbs];
    updated[idx][field] = val;
    setBreadcrumbs(updated);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>JSON-LD Schema Markup Generator</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Generate valid Google-compliant JSON-LD structured data. Select a schema type, fill in the
          properties, and copy the ready-to-paste script tag for rich result enhancements.
        </p>

        {/* Schema Type Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['Article', 'FAQPage', 'Product', 'Organization', 'BreadcrumbList'].map((type) => (
            <button
              key={type}
              type="button"
              className={schemaType === type ? 'check-btn' : 'lv2-pill-btn'}
              onClick={() => setSchemaType(type)}
              style={{ padding: '0.45rem 1rem' }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Builder & Output Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%' }}>
          {/* Form Fields Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schemaType === 'Article' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Article Headline</label>
                  <input type="text" value={article.headline} onChange={(e) => setArticle({ ...article, headline: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Featured Image URL</label>
                  <input type="url" value={article.image} onChange={(e) => setArticle({ ...article, image: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Author Name</label>
                    <input type="text" value={article.authorName} onChange={(e) => setArticle({ ...article, authorName: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Publisher Name</label>
                    <input type="text" value={article.publisherName} onChange={(e) => setArticle({ ...article, publisherName: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Date Published</label>
                    <input type="date" value={article.datePublished} onChange={(e) => setArticle({ ...article, datePublished: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Date Modified</label>
                    <input type="date" value={article.dateModified} onChange={(e) => setArticle({ ...article, dateModified: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                </div>
              </>
            )}

            {schemaType === 'FAQPage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {faqs.map((f, idx) => (
                  <div key={idx} style={{ padding: '0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Question #{idx + 1}</label>
                      {faqs.length > 1 && (
                        <button type="button" onClick={() => removeFaq(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      )}
                    </div>
                    <input type="text" value={f.q} onChange={(e) => updateFaq(idx, 'q', e.target.value)} placeholder="e.g. What is your refund policy?" className="search-input" style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.8125rem' }} />
                    <textarea rows={2} value={f.a} onChange={(e) => updateFaq(idx, 'a', e.target.value)} placeholder="Answer text..." className="search-input" style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem', resize: 'vertical' }} />
                  </div>
                ))}
                <button type="button" onClick={addFaq} className="lv2-pill-btn" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={13} style={{ display: 'inline', marginRight: '4px' }} /> Add Question
                </button>
              </div>
            )}

            {schemaType === 'Product' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Product Name</label>
                  <input type="text" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Price</label>
                    <input type="text" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Currency</label>
                    <input type="text" value={product.currency} onChange={(e) => setProduct({ ...product, currency: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Rating (0-5)</label>
                    <input type="number" step="0.1" max="5" value={product.ratingValue} onChange={(e) => setProduct({ ...product, ratingValue: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Review Count</label>
                    <input type="number" value={product.reviewCount} onChange={(e) => setProduct({ ...product, reviewCount: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  </div>
                </div>
              </>
            )}

            {schemaType === 'Organization' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Organization Name</label>
                  <input type="text" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Official Website URL</label>
                  <input type="url" value={org.url} onChange={(e) => setOrg({ ...org, url: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Logo Image URL</label>
                  <input type="url" value={org.logo} onChange={(e) => setOrg({ ...org, logo: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Social Profiles (One per line)</label>
                  <textarea rows={3} value={org.sameAs} onChange={(e) => setOrg({ ...org, sameAs: e.target.value })} className="search-input" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8125rem', resize: 'vertical' }} />
                </div>
              </>
            )}

            {schemaType === 'BreadcrumbList' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {breadcrumbs.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>#{idx + 1}</span>
                    <input type="text" value={b.name} onChange={(e) => updateBreadcrumb(idx, 'name', e.target.value)} placeholder="Title" className="search-input" style={{ flex: 1, padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }} />
                    <input type="url" value={b.url} onChange={(e) => updateBreadcrumb(idx, 'url', e.target.value)} placeholder="URL" className="search-input" style={{ flex: 1.5, padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8125rem' }} />
                    {breadcrumbs.length > 1 && (
                      <button type="button" onClick={() => removeBreadcrumb(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addBreadcrumb} className="lv2-pill-btn" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={13} style={{ display: 'inline', marginRight: '4px' }} /> Add Breadcrumb Item
                </button>
              </div>
            )}
          </div>

          {/* Output Code Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Generated JSON-LD Tag</strong>
              <button
                type="button"
                className="check-btn"
                onClick={handleCopy}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8125rem' }}
              >
                {copied ? <Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> : <Copy size={13} style={{ display: 'inline', marginRight: '4px' }} />}
                {copied ? 'Copied Tag!' : 'Copy Script Tag'}
              </button>
            </div>

            <textarea
              readOnly
              value={scriptTagString}
              rows={18}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8125rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                resize: 'vertical',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
              }}
            />
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
      <h2>Schema.org JSON-LD Structured Data Standards</h2>
      <p>
        Structured data is a standardized machine-readable vocabulary founded by Google, Microsoft, Yahoo, and Yandex under the <a href="https://schema.org" target="_blank" rel="noopener noreferrer">Schema.org</a> consortium. Implemented as <strong>JSON-LD</strong> (JavaScript Object Notation for Linked Data) embedded within HTML <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> blocks, it qualifies web pages for Google Rich Results (star ratings, FAQ accordions, pricing snippets, and breadcrumbs).
      </p>

      <h2>Supported Google Rich Result Schema Types</h2>

      <ul>
        <li><strong>Article / BlogPosting:</strong> Displays rich headlines, author cards, publish dates, and thumbnail images in Google News and Discover feeds.</li>
        <li><strong>FAQPage:</strong> Renders expandable interactive question-and-answer accordions directly in organic search results.</li>
        <li><strong>Product &amp; Offer:</strong> Exposes live pricing, currency, availability (InStock/OutOfStock), and aggregate star ratings in Google Shopping SERPs.</li>
        <li><strong>Organization &amp; LocalBusiness:</strong> Populates Google Knowledge Graph panels with verified logos, contact numbers, and social profile links.</li>
        <li><strong>BreadcrumbList:</strong> Replaces raw URLs in search snippets with clean hierarchical navigation trails (e.g. <code>Home &gt; Products &gt; Shoes</code>).</li>
      </ul>

      <h2>Why Google Recommends JSON-LD over Microdata</h2>

      <p>
        Google Search Central explicitly recommends JSON-LD over inline Microdata or RDFa because JSON-LD separates structured data from visual presentation markup, preventing layout changes from breaking machine-readable entity schemas.
      </p>

      <h2>Synergies with On-Page &amp; Content Tools</h2>

      <p>
        Combine schema generation with our on-page auditing tools:
      </p>
      <ul>
        <li><strong>Live Schema Validation:</strong> Validate JSON-LD entities on live URLs using our <Link href="/tools/schema-checker">Schema Markup Checker</Link>.</li>
        <li><strong>Open Graph Tags:</strong> Build rich social card previews with our <Link href="/tools/open-graph">Open Graph Checker</Link>.</li>
        <li><strong>On-Page Technical Auditing:</strong> Inspect semantic H1/H2 hierarchy with our <Link href="/tools/on-page-seo">On-Page SEO Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>Where should the JSON-LD script tag be placed?</h3>
      <p>
        JSON-LD can be placed in either the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> section of the HTML document. Placing it in the <code>&lt;head&gt;</code> ensures early parsing by search engine crawlers.
      </p>

      <h3>Can a single webpage contain multiple schema types?</h3>
      <p>
        Yes. You can declare multiple schema objects on one page using the <code>@graph</code> pattern (e.g. combining an <code>Article</code>, <code>BreadcrumbList</code>, and <code>Organization</code> into a unified linked entity graph).
      </p>

      <h3>Does adding Schema markup guarantee rich snippets in Google Search?</h3>
      <p>
        No. Schema markup makes a page <em>eligible</em> for rich results, but Google algorithms decide whether to render rich snippets based on user query intent, domain authority, and content quality.
      </p>
    </article>
  );
}
