"use client";

import { useRouter } from "next/navigation";

/** Real browser-history back, not a reconstructed URL — so returning from an
 *  application detail page lands on whatever page/search the Resume Edits
 *  list was actually on, instead of always resetting to page 1. */
export function BackLink({
  fallbackHref,
  children,
  className,
}: {
  fallbackHref: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <a
      href={fallbackHref}
      className={className}
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </a>
  );
}
