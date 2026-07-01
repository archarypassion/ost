import { buildToolMetadata } from '@/lib/tool-metadata';

export async function generateMetadata({ params }) {
  const { toolSlug } = await params;
  return buildToolMetadata(toolSlug);
}

export default function ToolSlugLayout({ children }) {
  return children;
}
