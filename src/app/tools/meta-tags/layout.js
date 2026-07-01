import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('meta-tags');

export default function ToolLayout({ children }) {
  return children;
}
