import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('http-status');

export default function ToolLayout({ children }) {
  return children;
}
