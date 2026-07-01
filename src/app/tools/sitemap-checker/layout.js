import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('sitemap-checker');

export default function ToolLayout({ children }) {
  return children;
}
