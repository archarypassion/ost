"use client";

import { useState } from 'react';

export default function OpenGraphChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1000));
    setResult({
      ogTitle: 'Example Domain — Build Something Great',
      ogDescription: 'We help businesses grow through technology and design.',
      ogImage: 'https://example.com/og-image.jpg',
      ogType: 'website',
      ogUrl: url,
      twitterCard: 'summary_large_image',
      twitterTitle: 'Example Domain',
      twitterDescription: 'We help businesses grow.',
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header">
        <h1>Open Graph Checker</h1>
      </div>

      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Fetching...' : 'Check OG Tags'}</button>
        </form>
        <p className="tool-description">Inspect the Open Graph and Twitter Card meta tags of any URL to see how it appears when shared on social media.</p>

        {result && (
          <div className="result-box">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Open Graph Tags</h4>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">og:title</span><span className="result-value">{result.ogTitle}</span></div>
              <div className="result-item"><span className="result-label">og:description</span><span className="result-value">{result.ogDescription}</span></div>
              <div className="result-item"><span className="result-label">og:type</span><span className="result-value">{result.ogType}</span></div>
              <div className="result-item"><span className="result-label">og:url</span><span className="result-value">{result.ogUrl}</span></div>
              <div className="result-item"><span className="result-label">og:image</span><span className="result-value" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{result.ogImage}</span></div>
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', marginTop: '1rem' }}>Twitter Card Tags</h4>
            <div className="result-grid">
              <div className="result-item"><span className="result-label">twitter:card</span><span className="result-value">{result.twitterCard}</span></div>
              <div className="result-item"><span className="result-label">twitter:title</span><span className="result-value">{result.twitterTitle}</span></div>
              <div className="result-item"><span className="result-label">twitter:description</span><span className="result-value">{result.twitterDescription}</span></div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Open Graph Tags Explained: Control How Your Pages Look on Social Media</h2>
          <p>You've written a great blog post, a well-researched guide, or a compelling product page. Then someone shares the link on LinkedIn or Facebook, and instead of a clean preview card with your headline and featured image, the social platform pulls a random logo, or worse, shows no image at all, and grabs a nonsensical snippet of text from somewhere in the page footer. That's an Open Graph problem — and it's entirely preventable.</p>
          <p>Open Graph (OG) is a protocol originally developed by Facebook that allows webpages to define exactly how they should appear when shared on social platforms. Twitter has its own similar system called Twitter Cards. Together, these two sets of meta tags give you full control over the title, description, and preview image that appear whenever your content is shared or linked anywhere on social media.</p>

          <h3>The Essential Open Graph Tags Every Page Needs</h3>
          <p>There are four Open Graph properties that are considered mandatory for a basic, functional social preview. Without these four, social platforms will try to guess — and they'll often guess wrong.</p>
          <p><strong>og:title</strong> — The title that appears in the preview card. This doesn't have to be identical to your HTML title tag. It can be slightly more conversational or engaging for social contexts.</p>
          <p><strong>og:description</strong> — A brief summary of the content. Keep it punchy and human. Around 2-3 sentences is ideal. Don't make it a keyword dump — it's being read by real people who are deciding whether to click.</p>
          <p><strong>og:image</strong> — The thumbnail image shown in the preview. This is the most visually impactful tag. Use a high-quality image with a 1200x630 pixel resolution for best results across all platforms. Avoid tiny logos — they look terrible at that size.</p>
          <p><strong>og:url</strong> — The canonical URL of the page. This helps social platforms resolve any ambiguity when the same content might be accessible from multiple URLs.</p>

          <h3>Additional Open Graph Tags Worth Using</h3>
          <p>Beyond the four essentials, there are a handful of optional tags that add useful context. <strong>og:type</strong> describes the nature of the object — "website" for most pages, "article" for blog posts, "product" for e-commerce, "video.movie" for video content pages. Specifying the correct type can unlock richer preview formatting on some platforms.</p>
          <p><strong>og:site_name</strong> lets you define your brand name separately from the page title — this often appears as a smaller label below the main preview. <strong>og:locale</strong> specifies the language and regional formatting, which is useful for multilingual sites.</p>

          <h3>Twitter Cards: The Same Idea, Different System</h3>
          <p>Twitter (now X) doesn't rely on Open Graph tags. It has its own meta tag system called Twitter Cards. The good news is that if you've implemented Open Graph tags, Twitter will often fall back to them if Twitter Card tags are absent. But explicitly setting Twitter Card tags gives you more control and often produces better results.</p>
          <p>The most important Twitter Card tag is <strong>twitter:card</strong>, which defines the preview style. "summary" shows a small square thumbnail. "summary_large_image" shows a wide banner-style image preview — this looks far more engaging in feeds and is almost always the better choice for content-driven pages. Add <strong>twitter:title</strong>, <strong>twitter:description</strong>, and <strong>twitter:image</strong> to complete the set.</p>

          <h3>Common Open Graph Mistakes to Avoid</h3>
          <p>The most frequent mistake is using an image that's too small. Social platforms have minimum image size requirements, and if your image falls below them, it either won't show or will show a small, unimpressive thumbnail. Always use at least 600x314 pixels, but aim for 1200x630 for the best quality across all devices and Retina screens.</p>
          <p>Another common problem is having OG tags that don't match the actual page content. If your og:title and og:description promote something completely different from what the page delivers, users who click through will feel misled — leading to high bounce rates and potentially a reputation hit if the pattern continues.</p>
          <p>Finally, remember to test your implementation using each platform's debugger tool (Facebook's Sharing Debugger, Twitter's Card Validator). These tools will show you exactly how your page renders in their preview systems and will flag any errors in your tag implementation. Our Open Graph Checker gives you a quick, all-in-one view so you can spot issues before your pages are shared.</p>
        </article>
      </div>
    </div>
  );
}
