"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logAttempt } from "../actions";
import { openAttempt } from "../attempts/url";
import { parseLeetCodeUrl, slugify } from "@/lib/leetcode";
import { suggestedRating, type Outcome } from "@/lib/srs/rating";
import type { Rating } from "@/lib/srs/sm2";
import { PATTERNS, canonicalPattern, patternColor } from "@/lib/patterns";

export type LogInitial = { problemId?: string; url?: string; title?: string; difficulty?: "Easy" | "Medium" | "Hard"; patterns?: string[]; number?: number };

export default function LogForm({ onSaved, initial = {} }: { onSaved?: () => void; initial?: LogInitial }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialPatterns = [...new Set((initial.patterns ?? []).map(canonicalPattern))];
  const [url, setUrl] = useState(initial.url ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(initial.difficulty ?? "Medium");
  const [outcome, setOutcome] = useState<Outcome>("SOLVED");
  const [time, setTime] = useState("");
  const [rating, setRating] = useState<Rating>(3);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [patterns, setPatterns] = useState<string[]>(initialPatterns);
  const togglePattern = (pattern: string) => setPatterns((prev) => prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]);
  const [details, setDetails] = useState({ number: initial.number?.toString() ?? "", timeComplexity: "", spaceComplexity: "", approach: "", mistakes: "", code: "" });
  const setDetail = (key: keyof typeof details, value: string) => setDetails((prev) => ({ ...prev, [key]: value }));
  const updateSuggestion = (nextOutcome: Outcome, nextDifficulty = difficulty, nextTime = time) => {
    setOutcome(nextOutcome);
    setRating(suggestedRating(nextOutcome, nextDifficulty, nextTime ? Number(nextTime) : undefined));
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      // Changing the title, or replacing a known URL, means this is a different problem.
      const sameProblem = title === initial.title && (!initial.url || url === initial.url);
      const { problem, attempt } = await logAttempt({
        problemId: sameProblem ? initial.problemId : undefined,
        title: title || (parseLeetCodeUrl(url) ?? "Untitled problem").replaceAll("-", " "),
        slug: parseLeetCodeUrl(url) ?? slugify(title),
        url: url || undefined,
        lcNumber: details.number ? Number(details.number) : undefined,
        difficulty, patterns, attemptedAt: new Date(), outcome,
        rating, timeMinutes: time ? Number(time) : undefined,
        timeComplexity: details.timeComplexity || undefined,
        spaceComplexity: details.spaceComplexity || undefined, approach: details.approach || undefined,
        mistakes: details.mistakes || undefined, code: details.code || undefined,
      });
      onSaved?.();
      // On Today, the problems list or this problem's page, open the new attempt over the page, which the
      // action has already refreshed. From anywhere else (the /log page), go to the problem.
      if (pathname === "/" || pathname === "/problems" || pathname === `/problems/${problem.slug}`) openAttempt(attempt.id);
      else router.push(`/problems/${problem.slug}?attempt=${attempt.id}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save attempt."); }
    finally { setSaving(false); }
  }
  const field = (id: keyof typeof details, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field"><label htmlFor={id}>{label}</label><input id={id} value={details[id]} onChange={(e) => setDetail(id, e.target.value)} {...props} /></div>
  );
  const patternOptions = [...PATTERNS, ...initialPatterns.filter((pattern) => !PATTERNS.includes(pattern))];
  const nextReview = rating === 1 ? "tomorrow" : rating === 2 ? "in 1 day" : rating === 3 ? "in 3 days" : "in 5 days";

  return <form className="form card log-form" onSubmit={submit}>
    <div className="field"><label htmlFor="url">LeetCode URL <span className="hint">optional</span></label><input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://leetcode.com/problems/two-sum/" /></div>
    <div className="form-grid">
      <div className="field"><label htmlFor="title">Title</label><input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Two Sum" /></div>
      {field("number", "Problem number", { inputMode: "numeric", placeholder: "1" })}
      <div className="field"><label htmlFor="difficulty">Difficulty</label><select id="difficulty" value={difficulty} onChange={(e) => { const next = e.target.value as typeof difficulty; setDifficulty(next); setRating(suggestedRating(outcome, next, time ? Number(time) : undefined)); }}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
      <div className="field"><label htmlFor="time">Time <span className="hint">(minutes)</span></label><input id="time" type="number" min="0" value={time} onChange={(e) => { setTime(e.target.value); setRating(suggestedRating(outcome, difficulty, e.target.value ? Number(e.target.value) : undefined)); }} placeholder="25" /></div>
    </div>
    <div className="field">
      <span>Pattern <span className="hint">· select all that apply</span></span>
      <div className="pill-menu" role="group" aria-label="Pattern">
        {patternOptions.map((pattern) => <button type="button" data-color={patternColor(pattern)} className={`pill ${patterns.includes(pattern) ? "selected" : ""}`} aria-pressed={patterns.includes(pattern)} onClick={() => togglePattern(pattern)} key={pattern}>{pattern}</button>)}
        {patterns.length > 0 && <button type="button" className="pill" onClick={() => setPatterns([])}>Clear</button>}
      </div>
    </div>
    <hr className="divider" />
    <div className="form-grid">
      <div className="field"><label htmlFor="outcome">Outcome</label><select id="outcome" value={outcome} onChange={(e) => updateSuggestion(e.target.value as Outcome)}><option value="SOLVED">Solved</option><option value="SOLVED_WITH_HINT">Solved with hint</option><option value="LOOKED_AT_SOLUTION">Looked at solution</option><option value="FAILED">Failed</option></select></div>
      <div className="field">
        <span>Rating <span className="hint">· suggested</span></span>
        <div className="rating-row" role="group" aria-label="Rating">
          {(["Again", "Hard", "Good", "Easy"] as const).map((label, index) => <button type="button" className={rating === index + 1 ? "selected" : ""} aria-pressed={rating === index + 1} onClick={() => setRating((index + 1) as Rating)} key={label}>{label}</button>)}
        </div>
        <p className="rating-note">Next review {nextReview}</p>
      </div>
    </div>
    <div className="form-grid">
      {field("timeComplexity", "Time complexity", { placeholder: "O(n)" })}
      {field("spaceComplexity", "Space complexity", { placeholder: "O(1)" })}
    </div>
    <div className="form-grid">
      <div className="field"><label htmlFor="approach">Approach</label><textarea id="approach" value={details.approach} onChange={(e) => setDetail("approach", e.target.value)} placeholder="Hash map of value → index, single pass" /></div>
      <div className="field"><label htmlFor="mistakes">Mistakes / insight</label><textarea id="mistakes" value={details.mistakes} onChange={(e) => setDetail("mistakes", e.target.value)} /></div>
    </div>
    <div className="field"><label htmlFor="code">Code</label><textarea id="code" className="code" spellCheck={false} value={details.code} onChange={(e) => setDetail("code", e.target.value)} /></div>
    <div className="form-footer">
      {message && <p className="form-message" role="status">{message}</p>}
      <button className="button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save attempt"}</button>
    </div>
  </form>;
}
