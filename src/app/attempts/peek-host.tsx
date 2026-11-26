"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import AttemptPanel from "./attempt-panel";
import Peek from "./peek";
import { forgetAttempts, loadAttempt, loadedAttempt } from "./store";
import type { AttemptView } from "./types";
import { closeAttempt } from "./url";

type State = { id: string; status: "ready"; view: AttemptView | null } | { id: string; status: "loading" | "error" };

/** Shows the side panel for `?attempt=` on any page. Mounted once, in the root layout. */
export default function PeekHost() {
  const id = useSearchParams().get("attempt");
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!id) return;
    let current = true;
    const known = loadedAttempt(id);
    setState(known !== undefined ? { id, status: "ready", view: known } : { id, status: "loading" });
    loadAttempt(id).then(
      (view) => { if (current) setState({ id, status: "ready", view }); },
      () => { if (current) setState({ id, status: "error" }); },
    );
    return () => { current = false; };
  }, [id]);

  if (!id) return null;
  // Until the effect runs for a new id, show the loading state rather than the previous attempt.
  const shown: State = state?.id === id ? state : { id, status: "loading" };
  const view = shown.status === "ready" ? shown.view : null;

  /** Reload from the server, keeping what is on screen until the new copy arrives. */
  const reload = () => {
    if (view) forgetAttempts(view.siblings.map((sibling) => sibling.id));
    else forgetAttempts([id]);
    if (shown.status === "error") setState({ id, status: "loading" });
    loadAttempt(id).then(
      (next) => setState((current) => (current?.id === id ? { id, status: "ready", view: next } : current)),
      () => setState((current) => (current?.id === id && current.status !== "ready" ? { id, status: "error" } : current)),
    );
  };
  const changed = (patch?: Partial<AttemptView>) => {
    if (patch) setState((current) => (current?.id === id && current.status === "ready" && current.view ? { ...current, view: { ...current.view, ...patch } } : current));
    else reload();
  };
  const deleted = () => {
    if (view) forgetAttempts(view.siblings.map((sibling) => sibling.id));
    closeAttempt();
  };

  return (
    <Peek
      attemptId={id}
      subtitle={view ? formatDateTime(view.attemptedAt) : ""}
      notionId={view?.notion?.page?.notionId ?? null}
      onClose={closeAttempt}
    >
      {shown.status === "loading" && <PanelSkeleton />}
      {shown.status === "error" && (
        <p className="muted" role="alert">
          Could not load this attempt. <button type="button" className="link-button" onClick={reload}>Try again</button>
        </p>
      )}
      {shown.status === "ready" && (view
        ? <AttemptPanel view={view} onChanged={changed} onDeleted={deleted} />
        : <p id="peek-title" className="muted">This attempt no longer exists.</p>)}
    </Peek>
  );
}

function PanelSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading attempt">
      <span id="peek-title" className="skeleton skeleton-title" />
      <div className="peek-props">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}><span className="skeleton skeleton-label" /><span className="skeleton skeleton-value" /></div>
        ))}
      </div>
      <span className="skeleton skeleton-block" />
    </div>
  );
}
