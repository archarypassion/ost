import fs from 'node:fs';
import path from 'node:path';

import { TOOLS, STATIC_PAGES, getSiteUrl } from '@/lib/tools-catalog';

/** Every /tools/<slug> that has its own app/tools/<slug>/page.js (excludes dynamic [toolSlug]). */
function discoverToolSlugsFromFilesystem() {
  const toolsDir = path.join(process.cwd(), 'src', 'app', 'tools');
  try {
    return fs
      .readdirSync(toolsDir, { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith('[') &&
          !e.name.startsWith('_') &&
          fs.existsSync(path.join(toolsDir, e.name, 'page.js')),
      )
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export default function sitemap() {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticEntries = STATIC_PAGES.map((p) => ({
    url: `${base}${p.path === '/' ? '' : p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const catalogBySlug = new Map(TOOLS.map((t) => [t.slug, t]));
  const slugSet = new Set([...TOOLS.map((t) => t.slug), ...discoverToolSlugsFromFilesystem()]);
  const sortedSlugs = [...slugSet].sort();

  const toolEntries = sortedSlugs.map((slug) => {
    const t = catalogBySlug.get(slug);
    return {
      url: `${base}/tools/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: t ? 0.8 : 0.75,
    };
  });

  return [...staticEntries, ...toolEntries];
}
