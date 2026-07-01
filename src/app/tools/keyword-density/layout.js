import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('keyword-density');

export default function ToolLayout({ children }) {
  return children;
}
