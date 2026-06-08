"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileSearch, Link as LinkIcon, Image, Activity, Repeat, Archive,
  Maximize, Fingerprint, FileText, Map, Tag, Code2, Lock,
  Calendar, Type, Hash, Search, Zap, Smartphone, Globe,
} from 'lucide-react';

const toolGroups = [
  {
    label: 'INDEXATION',
    tools: [
      { name: 'Noindex Tag Checker', path: '/tools/noindex-checker', icon: FileSearch },
      { name: 'Robots.txt Checker', path: '/tools/robots-txt', icon: FileText },
      { name: 'XML Sitemap Checker', path: '/tools/sitemap-checker', icon: Map },
      { name: 'Google Index Checker', path: '/tools/google-index', icon: Search },
    ],
  },
  {
    label: 'ON-PAGE SEO',
    tools: [
      { name: 'On-Page SEO Checker', path: '/tools/on-page-seo', icon: Activity },
      { name: 'Meta Tags Checker', path: '/tools/meta-tags', icon: Tag },
      { name: 'Open Graph Checker', path: '/tools/open-graph', icon: Image },
      { name: 'Schema Markup Checker', path: '/tools/schema-checker', icon: Code2 },
      { name: 'Canonical URL Checker', path: '/tools/canonical-url', icon: Fingerprint },
      { name: 'Keyword Density Checker', path: '/tools/keyword-density', icon: Hash },
      { name: 'Word Count Checker', path: '/tools/word-count', icon: Type },
    ],
  },
  {
    label: 'LINKS',
    tools: [
      { name: 'Link Checker', path: '/tools/link-checker', icon: LinkIcon },
      { name: 'Redirect Checker', path: '/tools/redirect-checker', icon: Repeat },
      { name: 'HTTP Status Checker', path: '/tools/http-status', icon: Activity },
    ],
  },
  {
    label: 'PERFORMANCE',
    tools: [
      { name: 'Gzip Checker', path: '/tools/gzip-checker', icon: Archive },
      { name: 'Web Page Size Checker', path: '/tools/page-size', icon: Maximize },
      { name: 'Page Speed Checker', path: '/tools/page-speed', icon: Zap },
      { name: 'Mobile Friendly Checker', path: '/tools/mobile-friendly', icon: Smartphone },
    ],
  },
  {
    label: 'DOMAIN & SERVER',
    tools: [
      { name: 'SSL Certificate Checker', path: '/tools/ssl-checker', icon: Lock },
      { name: 'Domain Age Checker', path: '/tools/domain-age', icon: Calendar },
      { name: 'IP Address Lookup', path: '/tools/ip-lookup', icon: Globe },
    ],
  },
];

export default function Sidebar() {
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
