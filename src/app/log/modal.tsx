"use client";

import { useEffect, useState } from "react";
import LogForm, { type LogInitial } from "./form";

export default function LogModal({ buttonClassName = "button", label = "Log attempt", initial }: { buttonClassName?: string; label?: string; initial?: LogInitial }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className={buttonClassName} type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="log-modal-title">
            <div className="modal-header">
              <h2 id="log-modal-title">{initial?.title ? `Log ${initial.title}` : "Log an attempt"}</h2>
              <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close log attempt form">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <LogForm initial={initial} onSaved={() => setOpen(false)} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
