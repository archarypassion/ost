import { SITE_NAME } from '@/lib/tools-catalog';

export const metadata = {
  title: 'About',
  description: `What ${SITE_NAME} is, who it is for, and how we approach free technical SEO tools.`,
};

export default function AboutLayout({ children }) {
  return children;
}
