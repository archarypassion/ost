import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('ssl-checker');

export default function ToolLayout({ children }) {
  return children;
}
