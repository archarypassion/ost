import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('open-graph');

export default function ToolLayout({ children }) {
  return children;
}
