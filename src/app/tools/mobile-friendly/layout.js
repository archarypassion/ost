import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('mobile-friendly');

export default function ToolLayout({ children }) {
  return children;
}
