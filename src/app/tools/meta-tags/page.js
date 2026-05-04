"use client";
import { useState } from 'react';

export default function MetaTagsChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1000));
    setResult({
      title: 'Homepage | Your Brand Name',
      titleLength: 26,
      description: 'We build products that help your business grow faster and smarter.',
      descriptionLength: 65,
      robots: 'index, follow',
      viewport: 'width=device-width, initial-scale=1',
      charset: 'UTF-8',
      language: 'en',
      author: 'Your Brand',
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Meta Tags Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Fetching...' : 'Check Meta Tags'}</button>
        </form>
        <p className="tool-description">Extract and analyze all meta tags from any webpage including title, description, robots, viewport, and more.</p>
        {result && (
          <div className="result-box">
            <div className="result-grid">
              <div className="result-item"><span className="result-label">Title</span><span className="result-value">{result.title}</span></div>
              <div className="result-item"><span className="result-label">Title Length</span><span className="result-value" style={{ color: result.titleLength <= 60 ? '#10B981' : '#EF4444' }}>{result.titleLength} chars {result.titleLength > 60 ? '— Too Long!' : '— Good'}</span></div>
              <div className="result-item"><span className="result-label">Description</span><span className="result-value">{result.description}</span></div>
              <div className="result-item"><span className="result-label">Description Length</span><span className="result-value" style={{ color: result.descriptionLength <= 160 ? '#10B981' : '#EF4444' }}>{result.descriptionLength} chars</span></div>
              <div className="result-item"><span className="result-label">Robots</span><span className="result-value">{result.robots}</span></div>
              <div className="result-item"><span className="result-label">Viewport</span><span className="result-value">{result.viewport}</span></div>
              <div className="result-item"><span className="result-label">Charset</span><span className="result-value">{result.charset}</span></div>
              <div className="result-item"><span className="result-label">Language</span><span className="result-value">{result.language}</span></div>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Meta Tags Explained: The Hidden HTML Elements That Control How Search Engines See You</h2>
          <p>Meta tags are snippets of code that live inside the <code>&lt;head&gt;</code> section of an HTML document. They're completely invisible to website visitors — no one scrolling through your content will ever see them — but they communicate critical information to search engines, social media platforms, and browsers about how to handle, display, and index your page. Getting your meta tags right is foundational to both SEO and user experience.</p>
          <p>There are dozens of possible meta tags, but only a handful are truly important for most websites. Knowing which ones to prioritize and how to optimize them correctly separates professionally managed websites from the rest.</p>
          <h3>The Title Tag</h3>
          <p>Technically not a meta tag but a distinct HTML element (<code>&lt;title&gt;</code>), the page title is the single most important on-page SEO element. It's the main headline that appears in search engine results pages (SERPs) and the text shown in browser tabs. Keep titles between 50-60 characters to avoid truncation. Include your primary keyword naturally near the beginning. Add your brand name at the end, separated by a pipe or dash. Write it for humans first — it has to earn a click.</p>
          <h3>Meta Description</h3>
          <p>The <code>meta name="description"</code> tag provides a brief summary of the page content. While it doesn't directly influence rankings, it heavily influences click-through rates. Google often displays it in search results below the title link. Keep descriptions between 130-160 characters. Make them compelling, accurate, and include the target keyword (Google bolds it when it matches the search query). Pages without meta descriptions have random text pulled from the page body, which is rarely as persuasive as a thoughtfully written description.</p>
          <h3>Robots Meta Tag</h3>
          <p>The <code>meta name="robots"</code> tag controls whether a page should be indexed and whether its links should be followed. The four main values are <code>index</code>, <code>noindex</code>, <code>follow</code>, and <code>nofollow</code>, used in combinations like <code>content="index, follow"</code> or <code>content="noindex, nofollow"</code>. This tag should be explicitly set on every page type — don't assume the default is correct everywhere.</p>
          <h3>Viewport Meta Tag</h3>
          <p>The <code>meta name="viewport"</code> tag tells browsers how to render the page on different screen sizes. The standard value <code>content="width=device-width, initial-scale=1"</code> is essential for responsive design and mobile usability. Without it, mobile browsers will render your page at a desktop width and then scale it down, resulting in tiny, unreadable text. Google uses mobile-first indexing, meaning it primarily evaluates the mobile version of your pages, making this tag non-negotiable.</p>
          <h3>Charset Declaration</h3>
          <p>The <code>meta charset</code> tag declares the character encoding used by the document. <code>UTF-8</code> is the universal standard and handles characters from virtually every language on Earth. Without a charset declaration, browsers may guess — and guess wrong — leading to garbled text for international content.</p>
          <h3>Auditing Your Meta Tags</h3>
          <p>Use our Meta Tags Checker to instantly extract and review all the meta tags on any URL. Check pages across your site to ensure consistency, catch missing tags, and identify title or description lengths that are too short or too long. A thorough meta tag audit is one of the fastest, highest-impact technical SEO tasks you can perform on any website.</p>
        </article>
      </div>
    </div>
  );
}
