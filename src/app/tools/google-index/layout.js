import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('google-index');

export default function ToolLayout({ children }) {
  return children;
}
