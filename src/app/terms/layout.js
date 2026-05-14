import { SITE_NAME } from '@/lib/tools-catalog';

export const metadata = {
  title: 'Terms of Service',
  description: `Terms governing use of ${SITE_NAME} and its tools.`,
};

export default function TermsLayout({ children }) {
  return children;
}
