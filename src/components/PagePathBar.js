"use client";

import { usePathname } from 'next/navigation';

export default function PagePathBar() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="page-path-bar" aria-label="Current page path">
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="page-path-segment">
          {index > 0 && <span className="page-path-separator" aria-hidden="true">&gt;</span>}
          <code>{segment}</code>
        </span>
      ))}
    </nav>
  );
}
