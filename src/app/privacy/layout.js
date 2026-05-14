import { SITE_NAME } from '@/lib/tools-catalog';

export const metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} handles cookies, logs, and data when you use the site and tools.`,
};

export default function PrivacyLayout({ children }) {
  return children;
}
