import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('link-checker');

export default function ToolLayout({ children }) {
  return children;
}
