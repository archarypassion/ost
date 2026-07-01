import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('canonical-url');

export default function ToolLayout({ children }) {
  return children;
}
