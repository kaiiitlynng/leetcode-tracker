"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Notion-style side peek. Stays mounted while switching attempts, so only the content changes. */
export default function Peek({ attemptId, subtitle, notionId, onClose, children }: {
  attemptId: string;
  subtitle: ReactNode;
  notionId: string | null;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // Escape and backdrop clicks are easy to hit by accident, so they never discard an edit in progress.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !panel.current?.querySelector("[data-editing]")) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    body.current?.scrollTo(0, 0);
    closeButton.current?.focus();
  }, [attemptId]);

  return (
    <div className="peek-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !panel.current?.querySelector("[data-editing]")) onClose();
    }}>
      <aside ref={panel} className="peek" role="dialog" aria-modal="true" aria-labelledby="peek-title">
        <div className="peek-bar">
          <button ref={closeButton} className="modal-close" type="button" onClick={onClose} aria-label="Close attempt">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
          <span className="peek-subtitle">{subtitle}</span>
          {notionId && (
            <a className="button secondary small" href={`https://www.notion.so/${notionId}`} target="_blank" rel="noreferrer">
              Open in Notion ↗
            </a>
          )}
        </div>
        <div ref={body} className="peek-body">{children}</div>
      </aside>
    </div>
  );
}
