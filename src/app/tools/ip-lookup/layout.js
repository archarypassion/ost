import { buildToolMetadata } from '@/lib/tool-metadata';

export const metadata = buildToolMetadata('ip-lookup');

export default function ToolLayout({ children }) {
  return children;
}
