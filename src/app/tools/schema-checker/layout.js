import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('schema-checker');

export default function ToolLayout({ children }) {
  return children;
}
