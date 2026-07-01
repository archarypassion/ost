import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('noindex-checker');

export default function ToolLayout({ children }) {
  return children;
}
