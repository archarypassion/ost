import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('word-count');

export default function ToolLayout({ children }) {
  return children;
}
