import { SITE_NAME } from '@/lib/tools-catalog';

export const metadata = {
  title: 'Contact',
  description: `Contact ${SITE_NAME} for help, feedback, or privacy-related requests.`,
};

export default function ContactLayout({ children }) {
  return children;
}
