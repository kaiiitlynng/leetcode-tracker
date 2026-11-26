"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { loadAttempt } from "./store";
import { attemptHref, openAttempt } from "./url";

/**
 * Opens an attempt in the side panel over the current page. Starts loading it on hover or focus, so
 * it is usually ready by the time the click lands. A real link, so it still opens in a new tab.
 */
export default function AttemptLink({ id, className = "peek-trigger", children }: { id: string; className?: string; children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preload = () => { loadAttempt(id).catch(() => {}); };
  return (
    <a
      className={className}
      href={attemptHref(pathname, searchParams, id)}
      onPointerEnter={preload}
      onFocus={preload}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openAttempt(id);
      }}
    >
      {children}
    </a>
  );
}
