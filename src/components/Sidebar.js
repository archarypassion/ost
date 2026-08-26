"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileSearch, Link as LinkIcon, Image, Activity, Repeat, Archive,
  Maximize, Fingerprint, FileText, Map, Tag, Code2, Lock,
  Calendar, Type, Hash, Search, Zap, Smartphone, Globe,
  ShieldCheck, MailCheck, Bot, Share2, Binary, Contrast,
  Braces, CodeXml, Sparkles, Languages, ImageOff, BookOpen,
  Shuffle, Network, Radio, Cookie, Smile, CaseSensitive,
  FileCode, Key, ListFilter, PenTool, ShieldAlert,
} from 'lucide-react';

const toolGroups = [
  {
    label: 'INDEXATION',
    tools: [
      { name: 'Noindex Tag Checker', path: '/tools/noindex-checker', icon: FileSearch },
      { name: 'Robots.txt Checker', path: '/tools/robots-txt', icon: FileText },
      { name: 'Robots.txt Generator', path: '/tools/robots-generator', icon: Bot },
      { name: 'XML Sitemap Checker', path: '/tools/sitemap-checker', icon: Map },
      { name: 'Google Index Checker', path: '/tools/google-index', icon: Search },
    ],
  },
  {
    label: 'ON-PAGE SEO',
    tools: [
      { name: 'On-Page SEO Checker', path: '/tools/on-page-seo', icon: Activity },
      { name: 'Meta Tags Checker', path: '/tools/meta-tags', icon: Tag },
      { name: 'Meta Description Generator', path: '/tools/meta-description-generator', icon: PenTool },
      { name: 'Open Graph Checker', path: '/tools/open-graph', icon: Image },
      { name: 'Social Share Multi-Preview', path: '/tools/social-preview', icon: Share2 },
      { name: 'Schema Markup Checker', path: '/tools/schema-checker', icon: Code2 },
      { name: 'JSON-LD Schema Generator', path: '/tools/schema-generator', icon: Sparkles },
      { name: 'Canonical URL Checker', path: '/tools/canonical-url', icon: Fingerprint },
      { name: 'Hreflang Tag Generator', path: '/tools/hreflang-generator', icon: Languages },
      { name: 'Broken Image & Alt Checker', path: '/tools/broken-image-checker', icon: ImageOff },
      { name: 'Keyword Density Checker', path: '/tools/keyword-density', icon: Hash },
      { name: 'Word Count Checker', path: '/tools/word-count', icon: Type },
      { name: 'Readability Score Analyzer', path: '/tools/readability-checker', icon: BookOpen },
      { name: 'URL Slug Generator', path: '/tools/slug-generator', icon: FileText },
    ],
  },
  {
    label: 'LINKS & MARKETING',
    tools: [
      { name: 'Link Checker', path: '/tools/link-checker', icon: LinkIcon },
      { name: 'Redirect Checker', path: '/tools/redirect-checker', icon: Repeat },
      { name: 'HTTP Status Checker', path: '/tools/http-status', icon: Activity },
      { name: 'UTM Campaign Builder', path: '/tools/utm-builder', icon: Share2 },
      { name: 'URL Encoder / Decoder', path: '/tools/url-encoder', icon: Binary },
      { name: 'Keyword Mixer Tool', path: '/tools/keyword-mixer', icon: Shuffle },
    ],
  },
  {
    label: 'PERFORMANCE & DESIGN',
    tools: [
      { name: 'Gzip Checker', path: '/tools/gzip-checker', icon: Archive },
      { name: 'Web Page Size Checker', path: '/tools/page-size', icon: Maximize },
      { name: 'Page Speed Checker', path: '/tools/page-speed', icon: Zap },
      { name: 'Mobile Friendly Checker', path: '/tools/mobile-friendly', icon: Smartphone },
      { name: 'Color Contrast Checker', path: '/tools/color-contrast', icon: Contrast },
    ],
  },
  {
    label: 'DOMAIN & SECURITY',
    tools: [
      { name: 'SSL Certificate Checker', path: '/tools/ssl-checker', icon: Lock },
      { name: 'Security Headers Checker', path: '/tools/security-headers', icon: ShieldCheck },
      { name: 'DMARC & SPF Validator', path: '/tools/dmarc-checker', icon: MailCheck },
      { name: 'DNS Propagation Checker', path: '/tools/dns-propagation', icon: Network },
      { name: 'HTTP/2 & HTTP/3 Checker', path: '/tools/http-protocol-checker', icon: Radio },
      { name: 'Cookie & SameSite Inspector', path: '/tools/cookie-checker', icon: Cookie },
      { name: 'Favicon & Manifest Checker', path: '/tools/favicon-checker', icon: Smile },
      { name: 'Domain Age Checker', path: '/tools/domain-age', icon: Calendar },
      { name: 'IP Address Lookup', path: '/tools/ip-lookup', icon: Globe },
    ],
  },
  {
    label: 'DEVELOPER UTILITIES',
    tools: [
      { name: 'JSON Formatter & Validator', path: '/tools/json-formatter', icon: Braces },
      { name: 'Text Case Converter', path: '/tools/case-converter', icon: CaseSensitive },
      { name: 'Base64 Encoder / Decoder', path: '/tools/base64-encoder', icon: Binary },
      { name: 'Regex Tester & Explainer', path: '/tools/regex-tester', icon: Code2 },
      { name: 'Markdown Live Preview', path: '/tools/markdown-previewer', icon: FileCode },
      { name: 'CSS Minifier & Formatter', path: '/tools/css-minifier', icon: FileCode },
      { name: 'UUID / GUID Generator', path: '/tools/uuid-generator', icon: Key },
      { name: 'Cryptographic Hash Generator', path: '/tools/hash-generator', icon: Fingerprint },
      { name: 'Text & Keyword Deduplicator', path: '/tools/text-deduplicator', icon: ListFilter },
      { name: 'Lorem Ipsum Generator', path: '/tools/lorem-generator', icon: FileText },
      { name: 'CORS Headers Checker', path: '/tools/cors-checker', icon: ShieldAlert },
      { name: 'HTML Entity Encoder', path: '/tools/html-entity', icon: CodeXml },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {toolGroups.map((group) => (
          <div key={group.label} className="sidebar-group">
            <div className="sidebar-header">
              <h2>{group.label}</h2>
            </div>
            <ul>
              {group.tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = pathname === tool.path;
                return (
                  <li key={tool.name}>
                    <Link
                      href={tool.path}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      title={tool.name}
                      onClick={onNavigate}
                    >
                      <Icon size={16} className="nav-icon" />
                      <span>{tool.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
