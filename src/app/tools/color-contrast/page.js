"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Contrast, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

function hexToRgb(hex) {
  let c = hex.replace(/^#/, '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (Number.isNaN(num) || c.length !== 6) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getLuminance(rgb) {
  if (!rgb) return 0;
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorContrastPage() {
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#1E293B');

  const ratio = useMemo(() => {
    const r = getContrastRatio(textColor, bgColor);
    return r !== null ? parseFloat(r.toFixed(2)) : null;
  }, [textColor, bgColor]);

  const handleSwap = () => {
    const temp = textColor;
    setTextColor(bgColor);
    setBgColor(temp);
  };

  const getScoreColor = (r) => {
    if (r >= 7.0) return '#10B981';
    if (r >= 4.5) return '#3B82F6';
    if (r >= 3.0) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div>
      <div className="tool-header">
        <h1>WCAG Color Contrast Ratio Checker</h1>
      </div>

      <div className="tool-card" style={{ alignItems: 'stretch' }}>
        <p className="tool-description" style={{ margin: '0 auto 1.5rem', maxWidth: '750px' }}>
          Calculate color contrast ratios according to W3C Web Content Accessibility Guidelines (WCAG 2.1).
          Ensure web typography and UI components comply with Level AA and AAA accessibility standards.
        </p>

        {/* Color Pickers Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', width: '100%', marginBottom: '1.5rem' }}>
          {/* Foreground (Text) */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Text / Foreground Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value.toUpperCase())}
                style={{ width: '48px', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="search-input"
                style={{ flex: 1, padding: '0.65rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}
              />
            </div>
          </div>

          {/* Background */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Background Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                style={{ width: '48px', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="search-input"
                style={{ flex: 1, padding: '0.65rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="lv2-pill-btn"
            onClick={handleSwap}
            style={{ padding: '0.45rem 1rem' }}
          >
            <ArrowRightLeft size={13} style={{ display: 'inline', marginRight: '6px' }} /> Swap Colors
          </button>
        </div>

        {/* Ratio & Preview Card */}
        {ratio !== null && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {/* Compliance Results */}
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(ratio) }}>
                  {ratio}:1
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Contrast Ratio
                </span>
              </div>

              {/* Compliance Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Normal Text AA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div><strong>Normal Text (WCAG AA)</strong> <span style={{ color: 'var(--text-secondary)' }}>≥ 4.5:1</span></div>
                  {ratio >= 4.5 ? <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={15} /> PASS</span> : <span style={{ color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={15} /> FAIL</span>}
                </div>

                {/* Normal Text AAA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div><strong>Normal Text (WCAG AAA)</strong> <span style={{ color: 'var(--text-secondary)' }}>≥ 7.0:1</span></div>
                  {ratio >= 7.0 ? <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={15} /> PASS</span> : <span style={{ color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={15} /> FAIL</span>}
                </div>

                {/* Large Text AA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div><strong>Large Text (WCAG AA)</strong> <span style={{ color: 'var(--text-secondary)' }}>≥ 3.0:1</span></div>
                  {ratio >= 3.0 ? <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={15} /> PASS</span> : <span style={{ color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={15} /> FAIL</span>}
                </div>

                {/* Large Text AAA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div><strong>Large Text (WCAG AAA)</strong> <span style={{ color: 'var(--text-secondary)' }}>≥ 4.5:1</span></div>
                  {ratio >= 4.5 ? <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={15} /> PASS</span> : <span style={{ color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={15} /> FAIL</span>}
                </div>

                {/* UI Components */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <div><strong>UI Components / Borders</strong> <span style={{ color: 'var(--text-secondary)' }}>≥ 3.0:1</span></div>
                  {ratio >= 3.0 ? <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={15} /> PASS</span> : <span style={{ color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={15} /> FAIL</span>}
                </div>
              </div>
            </div>

            {/* Live Visual Preview */}
            <div
              style={{
                padding: '2rem',
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Live Typography &amp; UI Preview
              </span>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: textColor }}>
                Accessible Headings Matter
              </h3>
              <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, color: textColor }}>
                This is a preview of body copy formatted with your selected color combination.
                Good contrast ensures content is effortless to read under all lighting conditions.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: textColor,
                    color: bgColor,
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}
                >
                  Action Button
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '4rem' }}><Article /></div>
    </div>
  );
}

function Article() {
  return (
    <article className="tool-article">
      <h2>W3C WCAG 2.1 Color Contrast Mathematics</h2>
      <p>
        Web Content Accessibility Guidelines (WCAG 2.1) published by the W3C Web Accessibility Initiative (WAI) define mathematical contrast ratio benchmarks between foreground text and background colors to ensure digital content is legible for users with low vision, aging eyes, or situational lighting challenges.
      </p>

      <h2>Mathematical Relative Luminance Formula</h2>

      <p>
        Relative luminance ($L$) normalizes sRGB color values (0–255) to a scale of 0.0 (pure black) to 1.0 (pure white):
      </p>
      <pre className="code-pre">
        <code>{`// WCAG 2.1 Luminance Formula
L = 0.2126 * R + 0.7152 * G + 0.0722 * B

// Contrast Ratio Formula (where L1 is lighter and L2 is darker)
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)`}</code>
      </pre>

      <h2>WCAG 2.1 Conformance Levels</h2>

      <ul>
        <li><strong>Level AA (Minimum Standard):</strong> Requires a minimum contrast ratio of <strong>4.5:1</strong> for normal text (under 18pt/24px) and <strong>3.0:1</strong> for large text (18pt+ or 14pt+ bold) and active UI component borders.</li>
        <li><strong>Level AAA (Enhanced Standard):</strong> Requires an enhanced contrast ratio of <strong>7.0:1</strong> for normal text and <strong>4.5:1</strong> for large text.</li>
      </ul>

      <h2>Accessibility &amp; Technical SEO Integration</h2>

      <p>
        Accessibility is increasingly correlated with user engagement and search rankings:
      </p>
      <ul>
        <li><strong>Mobile Usability:</strong> Verify responsive viewport scaling and tap target sizes using our <Link href="/tools/mobile-friendly">Mobile Friendly Test</Link>.</li>
        <li><strong>On-Page Technical Auditing:</strong> Inspect semantic heading structure with our <Link href="/tools/on-page-seo">On-Page SEO Checker</Link>.</li>
        <li><strong>Core Web Vitals:</strong> Audit network latency and visual stability using our <Link href="/tools/page-speed">Page Speed Checker</Link>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>

      <h3>What constitutes &quot;Large Text&quot; under WCAG?</h3>
      <p>
        Large text is defined as at least 18pt (24px) regular font weight, or at least 14pt (approx. 18.66px) bold font weight.
      </p>

      <h3>Does placeholder text need to meet contrast ratios?</h3>
      <p>
        Yes. Low-contrast grey placeholder text inside form inputs fails WCAG 1.4.3 Level AA guidelines. Inputs should use clearly legible placeholder values.
      </p>

      <h3>How does color contrast affect SEO?</h3>
      <p>
        Poor color contrast increases user bounce rates and lowers dwell time, sending negative search quality signals to Google algorithms. Accessible websites perform significantly better in real-world user engagement metrics.
      </p>
    </article>
  );
}
