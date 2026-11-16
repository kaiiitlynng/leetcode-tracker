"use server";

import { endOfDay, startOfDay, subDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeJsonArray } from "@/lib/json";
import { parseLeetCodeUrl, slugify } from "@/lib/leetcode";
import { rebuildReviewState } from "@/lib/srs/replay";
import { suggestedRating } from "@/lib/srs/rating";
import { attemptInputSchema, problemInputSchema, problemLinksSchema } from "@/lib/validation";

async function refreshReview(problemId: string) {
  const attempts = await db.attempt.findMany({
    where: { problemId },
    orderBy: { attemptedAt: "asc" },
  });
  const state = rebuildReviewState(attempts);
  return db.reviewState.upsert({
    where: { problemId },
    create: {
      problemId,
      easeFactor: state.easeFactor,
      intervalDays: state.intervalDays,
      repetitions: state.repetitions,
      lapses: state.lapses,
      dueAt: state.dueAt,
      lastReviewedAt: attempts.at(-1)?.attemptedAt,
    },
    update: {
      easeFactor: state.easeFactor,
      intervalDays: state.intervalDays,
      repetitions: state.repetitions,
      lapses: state.lapses,
      dueAt: state.dueAt,
      lastReviewedAt: attempts.at(-1)?.attemptedAt,
    },
  });
}

export async function upsertProblem(input: unknown) {
  const parsed = problemInputSchema.parse(input);
  const problem = await db.problem.upsert({
    where: { slug: parsed.slug },
    create: {
      ...parsed,
      topics: serializeJsonArray(parsed.topics),
      lists: serializeJsonArray(parsed.lists),
    },
    update: {
      title: parsed.title,
      lcNumber: parsed.lcNumber,
      difficulty: parsed.difficulty,
      topics: serializeJsonArray(parsed.topics),
      pattern: parsed.pattern,
      lists: serializeJsonArray(parsed.lists),
    },
  });
  revalidatePath("/problems");
  return problem;
}

async function resolveProblem(input: z.infer<typeof attemptInputSchema>) {
  const slug = input.slug ?? (input.url ? parseLeetCodeUrl(input.url) : null) ?? slugify(input.title);
  const existing = input.problemId
    ? await db.problem.findUnique({ where: { id: input.problemId } })
    : await db.problem.findUnique({ where: { slug } });
  if (existing) return existing;
  return upsertProblem({ ...input, slug, leetcodeUrl: input.url });
}

export async function logAttempt(input: unknown) {
  const parsed = attemptInputSchema.parse(input);
  const problem = await resolveProblem(parsed);
  const rating =
    parsed.rating ??
    suggestedRating(parsed.outcome, problem.difficulty as "Easy" | "Medium" | "Hard", parsed.timeMinutes);
  const attempt = await db.attempt.create({
    data: {
      problemId: problem.id,
      attemptedAt: parsed.attemptedAt,
      outcome: parsed.outcome,
      rating,
      timeMinutes: parsed.timeMinutes,
      language: parsed.language,
      approach: parsed.approach,
      timeComplexity: parsed.timeComplexity,
      spaceComplexity: parsed.spaceComplexity,
      mistakes: parsed.mistakes,
      code: parsed.code,
      isReview: parsed.isReview,
      source: parsed.source,
    },
  });
  await refreshReview(problem.id);
  revalidatePath("/");
  revalidatePath("/log");
  revalidatePath("/problems");
  revalidatePath(`/problems/${problem.slug}`);
  revalidatePath("/review");
  return { problem, attempt };
}

export async function updateAttempt(id: string, patch: unknown) {
  const parsed = attemptInputSchema.partial().omit({ title: true, difficulty: true }).parse(patch);
  const attempt = await db.attempt.update({ where: { id }, data: parsed });
  await refreshReview(attempt.problemId);
  revalidatePath(`/problems/${(await db.problem.findUniqueOrThrow({ where: { id: attempt.problemId } })).slug}`);
  return attempt;
}

export async function deleteAttempt(id: string) {
  const attempt = await db.attempt.delete({ where: { id } });
  await refreshReview(attempt.problemId);
  revalidatePath("/problems");
  return attempt;
}

export async function updateProblem(id: string, patch: unknown) {
  const parsed = problemInputSchema.partial().omit({ slug: true, title: true, leetcodeUrl: true, neetcodeUrl: true }).parse(patch);
  const problem = await db.problem.update({
    where: { id },
    data: {
      ...parsed,
      topics: parsed.topics ? serializeJsonArray(parsed.topics) : undefined,
      lists: parsed.lists ? serializeJsonArray(parsed.lists) : undefined,
    },
  });
  revalidatePath(`/problems/${problem.slug}`);
  revalidatePath("/problems");
  return problem;
}

export async function updateProblemLinks(id: string, links: unknown) {
  const problem = await db.problem.update({ where: { id }, data: problemLinksSchema.parse(links) });
  revalidatePath("/");
  revalidatePath(`/problems/${problem.slug}`);
  return problem;
}

export async function getDueQueue(today = new Date()) {
  return db.reviewState.findMany({
    where: { dueAt: { lte: endOfDay(today) }, suspended: false },
    include: { problem: { include: { attempts: { orderBy: { attemptedAt: "desc" }, take: 3 } } } },
    orderBy: [{ dueAt: "asc" }, { easeFactor: "asc" }],
  });
}

const DAILY_LIMIT = 10;

/**
 * Today's study list: reviews already completed today, then the most overdue due
 * problems (repeated lapses and low ease first) until the daily limit is reached.
 * Anything past the limit stays due and rolls into tomorrow's list.
 */
export async function getTodayPlan(today = new Date()) {
  const start = startOfDay(today);
  const end = endOfDay(today);
  const [reviewedToday, due, totalDue] = await Promise.all([
    db.reviewState.findMany({
      where: { lastReviewedAt: { gte: start, lte: end }, dueAt: { gt: end } },
      include: { problem: { include: { _count: { select: { attempts: true } } } } },
      orderBy: { lastReviewedAt: "asc" },
    }),
    db.reviewState.findMany({
      where: { dueAt: { lte: end }, suspended: false },
      include: { problem: true },
      orderBy: [{ dueAt: "asc" }, { lapses: "desc" }, { easeFactor: "asc" }],
      take: DAILY_LIMIT,
    }),
    db.reviewState.count({ where: { dueAt: { lte: end }, suspended: false } }),
  ]);
  // A first attempt at a new problem isn't a review, so it doesn't count toward the list.
  const done = reviewedToday.filter((review) => review.problem._count.attempts > 1);
  const remaining = due.slice(0, Math.max(0, DAILY_LIMIT - done.length));
  return { done, remaining, deferred: totalDue - remaining.length, limit: DAILY_LIMIT };
}

export async function toggleSuspend(problemId: string) {
  const current = await db.reviewState.findUniqueOrThrow({ where: { problemId } });
  const updated = await db.reviewState.update({
    where: { problemId },
    data: { suspended: !current.suspended },
  });
  revalidatePath("/review");
  const problem = await db.problem.findUnique({ where: { id: problemId }, select: { slug: true } });
  if (problem) revalidatePath(`/problems/${problem.slug}`);
  return updated;
}

export async function getStats() {
  const [problems, attempts, due, upcoming] = await Promise.all([
    db.problem.findMany({ include: { attempts: true } }),
    db.attempt.findMany({ where: { attemptedAt: { gte: subDays(new Date(), 7) } } }),
    db.reviewState.count({ where: { dueAt: { lte: endOfDay(new Date()) }, suspended: false } }),
    db.reviewState.count({
      where: { dueAt: { gt: endOfDay(new Date()), lte: endOfDay(new Date(Date.now() + 7 * 86400000)) }, suspended: false },
    }),
  ]);
  const days = new Set(attempts.map((attempt) => startOfDay(attempt.attemptedAt).toISOString()));
  let streak = 0;
  for (let cursor = startOfDay(new Date()); days.has(cursor.toISOString()); cursor = subDays(cursor, 1)) streak++;
  return {
    totalProblems: problems.length,
    totalAttempts: problems.reduce((sum, problem) => sum + problem.attempts.length, 0),
    attemptsThisWeek: attempts.length,
    currentStreak: streak,
    dueToday: due,
    dueNext7Days: upcoming,
    byDifficulty: ["Easy", "Medium", "Hard"].map((difficulty) => ({
      difficulty,
      count: problems.filter((problem) => problem.difficulty === difficulty).length,
    })),
    weakTopics: [],
  };
}

export async function getRecentAttempts() {
  return db.attempt.findMany({
    include: { problem: true },
    orderBy: { attemptedAt: "desc" },
    take: 10,
  });
}

export async function getProblems() {
  return db.problem.findMany({
    include: { attempts: { orderBy: { attemptedAt: "desc" } }, review: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProblem(slug: string) {
  return db.problem.findUniqueOrThrow({
    where: { slug },
    include: { attempts: { orderBy: { attemptedAt: "desc" } }, review: true },
  });
}
