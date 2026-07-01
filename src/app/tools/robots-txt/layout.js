import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('robots-txt');

export default function ToolLayout({ children }) {
  return children;
}
