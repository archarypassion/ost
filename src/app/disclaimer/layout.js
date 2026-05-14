import { SITE_NAME } from '@/lib/tools-catalog';

export const metadata = {
  title: 'Disclaimer',
  description: `Important limitations on ${SITE_NAME} tool results and professional advice.`,
};

export default function DisclaimerLayout({ children }) {
  return children;
}
