"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logAttempt } from "../actions";
import { parseLeetCodeUrl, slugify } from "@/lib/leetcode";
import { suggestedRating, type Outcome } from "@/lib/srs/rating";
import type { Rating } from "@/lib/srs/sm2";
import { patternColor } from "@/lib/patterns";

const patterns = ["Arrays", "Two pointers", "Sliding window", "Binary search", "Stack", "Linked list", "Trees", "Graphs", "Dynamic programming", "Greedy", "Backtracking", "Intervals"];

export type LogInitial = { url?: string; title?: string; difficulty?: "Easy" | "Medium" | "Hard"; pattern?: string; number?: number };

export default function LogForm({ onSaved, initial = {} }: { onSaved?: () => void; initial?: LogInitial }) {
  const router = useRouter();
  const initialPattern = initial.pattern && (patterns.find((p) => p.toLowerCase() === initial.pattern!.toLowerCase()) ?? initial.pattern);
  const [url, setUrl] = useState(initial.url ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(initial.difficulty ?? "Medium");
  const [outcome, setOutcome] = useState<Outcome>("SOLVED");
  const [time, setTime] = useState("");
  const [rating, setRating] = useState<Rating>(3);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState({ number: initial.number?.toString() ?? "", topics: "", pattern: initialPattern ?? "", approach: "", mistakes: "", code: "" });
  const setDetail = (key: keyof typeof details, value: string) => setDetails((prev) => ({ ...prev, [key]: value }));
  const updateSuggestion = (nextOutcome: Outcome, nextDifficulty = difficulty, nextTime = time) => {
    setOutcome(nextOutcome);
    setRating(suggestedRating(nextOutcome, nextDifficulty, nextTime ? Number(nextTime) : undefined));
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await logAttempt({
        title: title || (parseLeetCodeUrl(url) ?? "Untitled problem").replaceAll("-", " "),
        slug: parseLeetCodeUrl(url) ?? slugify(title),
        url: url || undefined,
        lcNumber: details.number ? Number(details.number) : undefined,
        difficulty, topics: details.topics.split(",").map((x) => x.trim()).filter(Boolean),
        pattern: details.pattern || undefined, attemptedAt: new Date(), outcome,
        rating, timeMinutes: time ? Number(time) : undefined, approach: details.approach || undefined,
        mistakes: details.mistakes || undefined, code: details.code || undefined,
      });
      setMessage("Saved. Review state updated.");
      onSaved?.();
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save attempt."); }
  }
  const field = (id: keyof typeof details, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field"><label htmlFor={id}>{label}</label><input id={id} value={details[id]} onChange={(e) => setDetail(id, e.target.value)} {...props} /></div>
  );
  const patternOptions = initialPattern && !patterns.includes(initialPattern) ? [...patterns, initialPattern] : patterns;
  const nextReview = rating === 1 ? "tomorrow" : rating === 2 ? "in 1 day" : rating === 3 ? "in 3 days" : "in 5 days";

  return <form className="form card log-form" onSubmit={submit}>
    <div className="field"><label htmlFor="url">LeetCode URL <span className="hint">optional</span></label><input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://leetcode.com/problems/two-sum/" /></div>
    <div className="form-grid">
      <div className="field"><label htmlFor="title">Title</label><input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Two Sum" /></div>
      {field("number", "Problem number", { inputMode: "numeric", placeholder: "1" })}
      <div className="field"><label htmlFor="difficulty">Difficulty</label><select id="difficulty" value={difficulty} onChange={(e) => { const next = e.target.value as typeof difficulty; setDifficulty(next); setRating(suggestedRating(outcome, next, time ? Number(time) : undefined)); }}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
      <div className="field"><label htmlFor="time">Time <span className="hint">(minutes)</span></label><input id="time" type="number" min="0" value={time} onChange={(e) => { setTime(e.target.value); setRating(suggestedRating(outcome, difficulty, e.target.value ? Number(e.target.value) : undefined)); }} placeholder="25" /></div>
    </div>
    {field("topics", "Topics", { placeholder: "Array, Hash Table" })}
    <div className="field">
      <span>Pattern</span>
      <div className="pill-menu" role="group" aria-label="Pattern">
        <button type="button" className={`pill ${details.pattern === "" ? "selected" : ""}`} aria-pressed={details.pattern === ""} onClick={() => setDetail("pattern", "")}>None</button>
        {patternOptions.map((pattern) => <button type="button" data-color={patternColor(pattern)} className={`pill ${details.pattern === pattern ? "selected" : ""}`} aria-pressed={details.pattern === pattern} onClick={() => setDetail("pattern", pattern)} key={pattern}>{pattern}</button>)}
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
      <div className="field"><label htmlFor="approach">Approach</label><textarea id="approach" value={details.approach} onChange={(e) => setDetail("approach", e.target.value)} placeholder="Hash map of value → index, single pass" /></div>
      <div className="field"><label htmlFor="mistakes">Mistakes / insight</label><textarea id="mistakes" value={details.mistakes} onChange={(e) => setDetail("mistakes", e.target.value)} /></div>
    </div>
    <div className="field"><label htmlFor="code">Code</label><textarea id="code" className="code" spellCheck={false} value={details.code} onChange={(e) => setDetail("code", e.target.value)} /></div>
    <div className="form-footer">
      {message && <p className="form-message" role="status">{message}</p>}
      <button className="button" type="submit">Save attempt</button>
    </div>
  </form>;
}
