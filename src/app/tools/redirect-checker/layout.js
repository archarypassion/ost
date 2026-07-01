import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('redirect-checker');

export default function ToolLayout({ children }) {
  return children;
}
