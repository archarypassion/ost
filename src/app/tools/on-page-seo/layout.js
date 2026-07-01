import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('on-page-seo');

export default function ToolLayout({ children }) {
  return children;
}
