"use client";

import { useState, useTransition } from "react";
import { updateProblemLinks } from "../../actions";

/** LeetCode / NeetCode links you enter yourself; nothing is generated from the title. */
export default function ProblemLinks({ problemId, leetcodeUrl, neetcodeUrl }: {
  problemId: string;
  leetcodeUrl: string | null;
  neetcodeUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [leetcode, setLeetcode] = useState(leetcodeUrl ?? "");
  const [neetcode, setNeetcode] = useState(neetcodeUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => startTransition(async () => {
    setError(null);
    try {
      await updateProblemLinks(problemId, { leetcodeUrl: leetcode.trim(), neetcodeUrl: neetcode.trim() });
      setEditing(false);
    } catch {
      setError("Enter full URLs starting with https://, or leave a field empty.");
    }
  });

  if (editing) {
    return (
      <form className="links-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <div className="field">
          <label htmlFor="leetcode-url">LeetCode</label>
          <input id="leetcode-url" type="url" value={leetcode} onChange={(e) => setLeetcode(e.target.value)} placeholder="https://leetcode.com/problems/…" />
        </div>
        <div className="field">
          <label htmlFor="neetcode-url">NeetCode</label>
          <input id="neetcode-url" type="url" value={neetcode} onChange={(e) => setNeetcode(e.target.value)} placeholder="https://neetcode.io/problems/…" />
        </div>
        <div className="links-form-actions">
          {error && <span className="form-message" role="alert">{error}</span>}
          <button className="button secondary small" type="button" onClick={() => {
            setLeetcode(leetcodeUrl ?? ""); setNeetcode(neetcodeUrl ?? ""); setError(null); setEditing(false);
          }}>Cancel</button>
          <button className="button small" type="submit" disabled={pending}>{pending ? "Saving…" : "Save links"}</button>
        </div>
      </form>
    );
  }

  return (
    <>
      {leetcodeUrl && <a className="button secondary" href={leetcodeUrl} target="_blank" rel="noreferrer">LeetCode ↗</a>}
      {neetcodeUrl && <a className="button secondary" href={neetcodeUrl} target="_blank" rel="noreferrer">NeetCode ↗</a>}
      <button className="button secondary" type="button" onClick={() => setEditing(true)}>
        {leetcodeUrl || neetcodeUrl ? "Edit links" : "Add links"}
      </button>
    </>
  );
}
