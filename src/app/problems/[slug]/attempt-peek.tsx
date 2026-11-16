"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Notion-style side peek: a panel that slides in from the right over the page. */
export default function AttemptPeek({ title, subtitle, notionId, children }: {
  title: string;
  subtitle: string;
  notionId: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const button = trigger.current;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    close.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      button?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={trigger} className="peek-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <rect x="1.5" y="2" width="11" height="10" rx="1.5" />
          <path d="M8.5 2v10" />
        </svg>
        Notion page
      </button>
      {open && (
        <div className="peek-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <aside className="peek" role="dialog" aria-modal="true" aria-labelledby="peek-title">
            <div className="peek-bar">
              <button ref={close} className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close page">
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
            <div className="peek-body">
              <h2 id="peek-title" className="peek-title">{title}</h2>
              {children}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
