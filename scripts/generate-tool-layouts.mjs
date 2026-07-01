import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS } from '../src/lib/tools-catalog.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function layoutContent(slug) {
  return [
    "import { buildToolMetadata } from '@/lib/tool-metadata';",
    '',
    `export const metadata = buildToolMetadata('${slug}');`,
    '',
    'export default function ToolLayout({ children }) {',
    '  return children;',
    '}',
    '',
  ].join('\n');
}

for (const tool of TOOLS) {
  const dir = path.join(root, 'src', 'app', 'tools', tool.slug);
  const file = path.join(dir, 'layout.js');
  if (!fs.existsSync(dir)) {
    console.warn('skip missing dir', tool.slug);
    continue;
  }
  fs.writeFileSync(file, layoutContent(tool.slug));
  console.log('wrote', file);
}

const dynFile = path.join(root, 'src', 'app', 'tools', '[toolSlug]', 'layout.js');
fs.writeFileSync(
  dynFile,
  [
    "import { buildToolMetadata } from '@/lib/tool-metadata';",
    '',
    'export async function generateMetadata({ params }) {',
    '  const { toolSlug } = await params;',
    '  return buildToolMetadata(toolSlug);',
    '}',
    '',
    'export default function ToolSlugLayout({ children }) {',
    '  return children;',
    '}',
    '',
  ].join('\n'),
);
console.log('wrote', dynFile);
