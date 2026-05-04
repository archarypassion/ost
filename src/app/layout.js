import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "TrueSEO - Premium SEO Tools",
  description: "Advanced SEO tools for modern developers and marketers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={dmSans.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
