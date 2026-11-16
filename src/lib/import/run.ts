import { db } from "@/lib/db";
import { serializeJsonArray } from "@/lib/json";
import { rebuildReviewState } from "@/lib/srs/replay";
import type { ImportRow, ImportSummary } from "./types";

export async function runImport(rows: ImportRow[]): Promise<ImportSummary> {
  const summary: ImportSummary = { problemsCreated: 0, problemsMerged: 0, attemptsAdded: 0, duplicatesSkipped: 0, invalidRows: [] };
  const affected = new Set<string>();
  for (const [index, row] of rows.entries()) {
    if (!row.title) { summary.invalidRows.push({ row: index + 1, reason: "Missing title" }); continue; }
    const slug = row.slug || row.title.toLowerCase().replace(/\s+/g, "-");
    let problem = await db.problem.findUnique({ where: { slug } });
    if (!problem) {
      problem = await db.problem.create({ data: {
        slug, title: row.title, leetcodeUrl: row.url, lcNumber: row.lcNumber,
        difficulty: row.difficulty || "Medium", topics: serializeJsonArray(row.topics || []),
        pattern: row.pattern, notes: row.notes, lists: serializeJsonArray(row.lists || []),
      }});
      summary.problemsCreated++;
    } else {
      problem = await db.problem.update({ where: { id: problem.id }, data: {
        title: problem.title || row.title, leetcodeUrl: problem.leetcodeUrl ?? row.url,
        lcNumber: problem.lcNumber ?? row.lcNumber, pattern: problem.pattern || row.pattern,
        notes: [problem.notes, row.notes].filter(Boolean).join("\n\n") || null,
      }});
      summary.problemsMerged++;
    }
    const attemptedAt = row.attemptedAt ? new Date(row.attemptedAt) : new Date();
    const dayStart = new Date(attemptedAt); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    // A Notion page is one attempt, so it is the identity; otherwise one attempt per day and outcome.
    const existing = await db.attempt.findFirst({ where: row.notionPage
      ? { notionPage: row.notionPage }
      : { problemId: problem.id, attemptedAt: { gte: dayStart, lt: dayEnd }, outcome: row.outcome || "SOLVED" } });
    if (existing) { summary.duplicatesSkipped++; continue; }
    await db.attempt.create({ data: {
      problemId: problem.id, attemptedAt, outcome: row.outcome || "SOLVED", rating: row.rating || 3,
      mistakes: row.mistakes || row.notes, code: row.code, timeMinutes: row.timeMinutes,
      source: row.source, notionPage: row.notionPage,
    }});
    summary.attemptsAdded++; affected.add(problem.id);
  }
  for (const problemId of affected) {
    const attempts = await db.attempt.findMany({ where: { problemId }, orderBy: { attemptedAt: "asc" } });
    const state = rebuildReviewState(attempts);
    await db.reviewState.upsert({ where: { problemId }, create: { problemId, ...state, lastReviewedAt: attempts.at(-1)?.attemptedAt }, update: { ...state, lastReviewedAt: attempts.at(-1)?.attemptedAt } });
  }
  return summary;
}
