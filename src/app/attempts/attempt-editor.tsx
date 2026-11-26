"use client";

import { useState, useTransition, type ReactNode } from "react";
import { deleteAttempt, updateAttempt } from "../actions";
import { outcomeLabels, ratingLabels } from "@/lib/format";
import { suggestedRating, type Outcome } from "@/lib/srs/rating";

const textFields = ["timeComplexity", "spaceComplexity", "approach", "mistakes", "code"] as const;
type TextField = (typeof textFields)[number];
type EditableAttempt = { id: string; outcome: string; rating: number; timeMinutes: number | null } & Record<TextField, string | null>;

const toDraft = (attempt: EditableAttempt) => ({
  outcome: attempt.outcome as Outcome,
  rating: attempt.rating,
  time: attempt.timeMinutes?.toString() ?? "",
  ...(Object.fromEntries(textFields.map((key) => [key, attempt[key] ?? ""])) as Record<TextField, string>),
});

/** Read view (children) with Edit and Delete; editing replaces the read view with a form. */
export default function AttemptEditor({ attempt, difficulty, imported, onSaved, onDeleted, children }: {
  attempt: EditableAttempt;
  difficulty: "Easy" | "Medium" | "Hard";
  imported: boolean;
  /** Called with the new values as soon as Save is pressed, then with no argument once the server has them (or refused them). */
  onSaved: (patch?: Partial<EditableAttempt>) => void;
  onDeleted: () => void;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [draft, setDraft] = useState(() => toDraft(attempt));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const setAndSuggest = (patch: Partial<typeof draft>) => setDraft((prev) => {
    const next = { ...prev, ...patch };
    return { ...next, rating: suggestedRating(next.outcome, difficulty, next.time ? Number(next.time) : undefined) };
  });

  const start = (next: "edit" | "delete") => { setDraft(toDraft(attempt)); setError(""); setMode(next); };

  const save = () => {
    setError("");
    const patch = {
      outcome: draft.outcome,
      rating: draft.rating,
      timeMinutes: draft.time ? Number(draft.time) : null,
      ...(Object.fromEntries(textFields.map((key) => [key, draft[key].trim() ? draft[key] : null])) as Record<TextField, string | null>),
    };
    // Show the new values at once, outside the transition: React holds back updates made inside an async
    // transition until it finishes. The server's copy (with the new review date) replaces them when it arrives.
    onSaved(patch);
    setMode("view");
    startTransition(async () => {
      try {
        await updateAttempt(attempt.id, patch);
      } catch {
        startTransition(() => {
          setMode("edit");
          setError("Could not save your changes. Check the fields and try again.");
        });
      }
      onSaved();
    });
  };

  const remove = () => startTransition(async () => {
    setError("");
    try {
      await deleteAttempt(attempt.id);
      onDeleted();
    } catch { setError("Could not delete this attempt. Try again."); }
  });

  const importNote = imported && <p className="list-note">Imported from Notion. Running the import again replaces this attempt and undoes changes made here.</p>;

  if (mode === "edit") {
    const input = (key: TextField, label: string, placeholder?: string) => (
      <div className="field"><label htmlFor={`edit-${key}`}>{label}</label><input id={`edit-${key}`} value={draft[key]} placeholder={placeholder} onChange={(e) => set({ [key]: e.target.value })} /></div>
    );
    const area = (key: TextField, label: string, className?: string) => (
      <div className="field"><label htmlFor={`edit-${key}`}>{label}</label><textarea id={`edit-${key}`} className={className} spellCheck={className !== "code"} value={draft[key]} onChange={(e) => set({ [key]: e.target.value })} /></div>
    );
    return (
      <form className="form" data-editing onSubmit={(event) => { event.preventDefault(); save(); }}>
        {importNote}
        <div className="form-grid">
          <div className="field"><label htmlFor="edit-outcome">Outcome</label>
            <select id="edit-outcome" autoFocus value={draft.outcome} onChange={(e) => setAndSuggest({ outcome: e.target.value as Outcome })}>
              {Object.entries(outcomeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="edit-time">Time <span className="hint">(minutes)</span></label><input id="edit-time" type="number" min="0" step="1" value={draft.time} onChange={(e) => setAndSuggest({ time: e.target.value })} /></div>
        </div>
        <div className="field">
          <span>Rating</span>
          <div className="rating-row" role="group" aria-label="Rating">
            {ratingLabels.map((label, index) => <button type="button" className={draft.rating === index + 1 ? "selected" : ""} aria-pressed={draft.rating === index + 1} onClick={() => set({ rating: index + 1 })} key={label}>{label}</button>)}
          </div>
        </div>
        <div className="form-grid">
          {input("timeComplexity", "Time complexity", "O(n)")}
          {input("spaceComplexity", "Space complexity", "O(1)")}
        </div>
        {area("approach", "Approach")}
        {area("mistakes", "Mistakes / insight")}
        {area("code", "Code", "code")}
        <div className="form-footer">
          {error && <p className="form-message" role="alert">{error}</p>}
          <button className="button secondary" type="button" disabled={pending} onClick={() => setMode("view")}>Cancel</button>
          <button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="peek-actions">
        {mode === "delete" ? (
          <>
            <span className="peek-confirm" role="status">Delete this attempt? The review schedule will be recalculated.</span>
            <button className="button secondary small" type="button" autoFocus disabled={pending} onClick={() => setMode("view")}>Cancel</button>
            <button className="button danger small" type="button" disabled={pending} onClick={remove}>{pending ? "Deleting…" : "Delete"}</button>
          </>
        ) : (
          <>
            <button className="button secondary small" type="button" onClick={() => start("edit")}>Edit</button>
            <button className="button secondary small" type="button" onClick={() => start("delete")}>Delete</button>
          </>
        )}
      </div>
      {error && <p className="form-message" role="alert">{error}</p>}
      {children}
      {importNote}
    </>
  );
}
