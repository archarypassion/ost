import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('gzip-checker');

export default function ToolLayout({ children }) {
  return children;
}
