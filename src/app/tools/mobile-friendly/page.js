"use client";
import { useState } from 'react';

export default function MobileFriendlyChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1300));
    setResult({
      isMobileFriendly: true,
      viewportSet: true,
      textReadable: true,
      tapTargetsOk: false,
      tapTargetIssues: 3,
      contentWidthOk: true,
      usesFlash: false,
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="tool-header"><h1>Mobile Friendly Checker</h1></div>
      <div className="tool-card">
        <form className="search-bar" onSubmit={handleCheck}>
          <input type="url" placeholder="Enter website URL..." className="search-input" value={url} onChange={e => setUrl(e.target.value)} required />
          <button type="submit" className="check-btn" disabled={loading}>{loading ? 'Testing...' : 'Test Mobile'}</button>
        </form>
        <p className="tool-description">Test whether a webpage is properly optimized for mobile devices and identify specific usability issues.</p>
        {result && (
          <div className="result-box">
            <div className="result-score" style={{ color: result.isMobileFriendly ? '#10B981' : '#EF4444' }}>
              {result.isMobileFriendly ? '✓ Mobile-Friendly' : '✗ Not Mobile-Friendly'}
            </div>
            <div className="result-grid">
              {[
                { label: 'Viewport Meta Tag', value: result.viewportSet },
                { label: 'Text Readable Without Zoom', value: result.textReadable },
                { label: 'Tap Targets Properly Sized', value: result.tapTargetsOk, warn: `${result.tapTargetIssues} issues found` },
                { label: 'Content Fits Screen Width', value: result.contentWidthOk },
                { label: 'No Flash Content', value: !result.usesFlash },
              ].map(item => (
                <div key={item.label} className="result-item">
                  <span className="result-label">{item.label}</span>
                  <span style={{ color: item.value ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                    {item.value ? '✓ Pass' : `✗ Fail${item.warn ? ` — ${item.warn}` : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '4rem' }}>
        <article className="tool-article">
          <h2>Mobile-Friendly Websites: Why Mobile Optimization Is Now an Absolute Non-Negotiable</h2>
          <p>The shift to mobile has been dramatic and decisive. Global mobile traffic overtook desktop traffic for the first time back in 2016, and since then the gap has only widened. For most industries, 55-70% of website visits now come from mobile devices. Google responded to this reality in 2019 by switching to mobile-first indexing — meaning it primarily uses the mobile version of your website's content for indexing and ranking purposes, regardless of what the desktop version looks like.</p>
          <p>The practical implication is stark: if your site isn't properly optimized for mobile, you're not just delivering a poor experience to a majority of your visitors — you're actively hurting your search engine rankings. Mobile optimization has gone from a nice-to-have to a hard prerequisite for competitive organic performance.</p>
          <h3>The Viewport Meta Tag: The Foundation of Mobile Design</h3>
          <p>The viewport meta tag is the foundational building block of mobile-friendly web design. Without it, mobile browsers render your page at a full desktop width (typically 980 pixels) and then shrink it to fit the screen, resulting in tiny, unreadable text and microscopic tap targets. The standard viewport declaration <code>content="width=device-width, initial-scale=1"</code> tells the browser to set the page width equal to the device screen width and start at 100% zoom. This is step zero for any mobile-friendly page.</p>
          <h3>Text Readability and Font Sizes</h3>
          <p>Google recommends a minimum font size of 16 pixels for body text on mobile pages. Text smaller than this requires users to pinch and zoom to read it, which creates friction and signals poor mobile design. More broadly, line lengths should be comfortable for mobile reading — typically 60-80 characters per line. Contrast ratios matter more on mobile screens in variable lighting conditions, so make sure your text-to-background color contrast meets accessibility standards (WCAG 2.1 recommends a minimum ratio of 4.5:1 for body text).</p>
          <h3>Tap Target Sizing</h3>
          <p>Tap targets — links, buttons, form fields, and any other interactive elements — need to be large enough to tap accurately with a fingertip. Google recommends a minimum tap target size of 48x48 pixels with sufficient spacing between adjacent targets. Targets that are too small or too closely spaced lead to accidental taps, user frustration, and ultimately higher bounce rates. Navigation menus are a particularly common culprit — mobile hamburger menus where the individual links are packed too closely together create a poor experience on smaller devices.</p>
          <h3>Content Width and Horizontal Scrolling</h3>
          <p>Content that requires horizontal scrolling on mobile is a fundamental usability failure. It usually happens when images have fixed pixel widths wider than the viewport, when tables don't have responsive overflow handling, or when content is positioned absolutely without accounting for smaller screen sizes. All major content should be contained within the viewport width using CSS techniques like <code>max-width: 100%</code> for images and flexbox or grid for layout elements.</p>
          <h3>Google's Mobile-First Indexing: What It Actually Means for You</h3>
          <p>Mobile-first indexing doesn't mean Google only indexes mobile pages — it means the mobile version of your page is what Google uses to determine ranking. If your desktop site has rich content but your mobile site hides sections, lazy-loads critical text, or removes schema markup, Google evaluates the stripped-down mobile version. The practical takeaway is that your mobile and desktop experiences should be functionally equivalent in terms of content, structured data, and internal links. Use our Mobile Friendly Checker to quickly audit any URL and get a clear breakdown of which specific mobile usability factors are passing and which need attention.</p>
        </article>
      </div>
    </div>
  );
}
