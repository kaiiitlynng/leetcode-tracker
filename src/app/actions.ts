"use server";

import type { Problem } from "@prisma/client";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializeJsonArray } from "@/lib/json";
import { parseLeetCodeUrl, slugify } from "@/lib/leetcode";
import { rebuildReviewState } from "@/lib/srs/replay";
import { suggestedRating } from "@/lib/srs/rating";
import { PAGE_SIZE } from "@/lib/pagination";
import { attemptInputSchema, attemptPatchSchema, problemInputSchema, problemLinksSchema } from "@/lib/validation";

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
  const user = await requireUser();
  const parsed = problemInputSchema.parse(input);
  const problem = await db.problem.upsert({
    where: { userId_slug: { userId: user.id, slug: parsed.slug } },
    create: {
      ...parsed,
      userId: user.id,
      topics: serializeJsonArray(parsed.topics),
      lists: serializeJsonArray(parsed.lists),
    },
    update: {
      title: parsed.title,
      lcNumber: parsed.lcNumber,
      difficulty: parsed.difficulty,
      topics: serializeJsonArray(parsed.topics),
      patterns: parsed.patterns,
      lists: serializeJsonArray(parsed.lists),
    },
  });
  revalidatePath("/problems");
  return problem;
}

/**
 * Logging a known problem fills in details it lacks without overwriting stored ones. Patterns are the
 * exception: the form starts from the stored ones, so a non-empty selection replaces them.
 */
async function fillMissingDetails(problem: Problem, input: z.infer<typeof attemptInputSchema>) {
  const numberTaken = input.lcNumber != null && problem.lcNumber == null
    && (await db.problem.findFirst({ where: { userId: problem.userId, lcNumber: input.lcNumber }, select: { id: true } }));
  return db.problem.update({
    where: { id: problem.id },
    data: {
      leetcodeUrl: problem.leetcodeUrl ?? input.url,
      patterns: input.patterns.length ? input.patterns : undefined,
      lcNumber: problem.lcNumber ?? (numberTaken ? undefined : input.lcNumber),
    },
  });
}

async function resolveProblem(input: z.infer<typeof attemptInputSchema>) {
  const user = await requireUser();
  const slug = input.slug ?? (input.url ? parseLeetCodeUrl(input.url) : null) ?? slugify(input.title);
  const existing = input.problemId
    ? await db.problem.findFirst({ where: { id: input.problemId, userId: user.id } })
    : await db.problem.findUnique({ where: { userId_slug: { userId: user.id, slug } } });
  if (existing) return fillMissingDetails(existing, input);
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
  const user = await requireUser();
  const data = attemptPatchSchema.parse(patch);
  // updateMany takes the ownership filter in one statement; update() would add a lookup and a transaction.
  const { count } = await db.attempt.updateMany({ where: { id, problem: { userId: user.id } }, data });
  if (!count) throw new Error("Attempt not found");
  const { problemId } = await db.attempt.findUniqueOrThrow({ where: { id }, select: { problemId: true } });
  await refreshReview(problemId);
  revalidateAttemptPages();
}

/** Attempt changes show on Today, the problems list and every problem page. */
function revalidateAttemptPages() {
  revalidatePath("/");
  revalidatePath("/problems");
  revalidatePath("/problems/[slug]", "page");
}

export async function deleteAttempt(id: string) {
  const user = await requireUser();
  const attempt = await db.attempt.findFirst({ where: { id, problem: { userId: user.id } }, select: { problemId: true } });
  if (!attempt) throw new Error("Attempt not found");
  await db.attempt.delete({ where: { id } });
  // With no attempts left there is nothing to review.
  if (await db.attempt.count({ where: { problemId: attempt.problemId } })) await refreshReview(attempt.problemId);
  else await db.reviewState.deleteMany({ where: { problemId: attempt.problemId } });
  revalidateAttemptPages();
}

export async function updateProblem(id: string, patch: unknown) {
  const user = await requireUser();
  const parsed = problemInputSchema.partial().omit({ slug: true, title: true, leetcodeUrl: true, neetcodeUrl: true }).parse(patch);
  const problem = await db.problem.update({
    where: { id, userId: user.id },
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
  const user = await requireUser();
  const problem = await db.problem.update({ where: { id, userId: user.id }, data: problemLinksSchema.parse(links) });
  revalidatePath("/");
  revalidatePath(`/problems/${problem.slug}`);
  return problem;
}

export async function getDueQueue(today = new Date()) {
  const user = await requireUser();
  return db.reviewState.findMany({
    where: { dueAt: { lte: endOfDay(today) }, suspended: false, problem: { userId: user.id } },
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
  const user = await requireUser();
  const mine = { problem: { userId: user.id } };
  const start = startOfDay(today);
  const end = endOfDay(today);
  const [reviewedToday, due, totalDue] = await Promise.all([
    db.reviewState.findMany({
      relationLoadStrategy: "join",
      where: { lastReviewedAt: { gte: start, lte: end }, dueAt: { gt: end }, ...mine },
      include: { problem: { include: { _count: { select: { attempts: true } }, attempts: { select: { id: true }, orderBy: { attemptedAt: "desc" }, take: 1 } } } },
      orderBy: { lastReviewedAt: "asc" },
    }),
    db.reviewState.findMany({
      relationLoadStrategy: "join",
      where: { dueAt: { lte: end }, suspended: false, ...mine },
      include: { problem: true },
      orderBy: [{ dueAt: "asc" }, { lapses: "desc" }, { easeFactor: "asc" }],
      take: DAILY_LIMIT,
    }),
    db.reviewState.count({ where: { dueAt: { lte: end }, suspended: false, ...mine } }),
  ]);
  // A first attempt at a new problem isn't a review, so it doesn't count toward the list.
  const done = reviewedToday.filter((review) => review.problem._count.attempts > 1);
  const remaining = due.slice(0, Math.max(0, DAILY_LIMIT - done.length));
  return { done, remaining, deferred: totalDue - remaining.length, limit: DAILY_LIMIT };
}

export async function toggleSuspend(problemId: string) {
  const user = await requireUser();
  const current = await db.reviewState.findUniqueOrThrow({ where: { problemId, problem: { userId: user.id } } });
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
  const user = await requireUser();
  const mine = { problem: { userId: user.id } };
  const [problems, attempts, due, upcoming] = await Promise.all([
    db.problem.findMany({ where: { userId: user.id }, include: { attempts: true } }),
    db.attempt.findMany({ where: { attemptedAt: { gte: subDays(new Date(), 7) }, ...mine } }),
    db.reviewState.count({ where: { dueAt: { lte: endOfDay(new Date()) }, suspended: false, ...mine } }),
    db.reviewState.count({
      where: { dueAt: { gt: endOfDay(new Date()), lte: endOfDay(new Date(Date.now() + 7 * 86400000)) }, suspended: false, ...mine },
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
  const user = await requireUser();
  return db.attempt.findMany({
    where: { problem: { userId: user.id } },
    include: { problem: true },
    orderBy: { attemptedAt: "desc" },
    take: 10,
  });
}

export async function getProblems() {
  const user = await requireUser();
  return db.problem.findMany({
    where: { userId: user.id },
    include: { attempts: { orderBy: { attemptedAt: "desc" } }, review: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** A problem with one page (PAGE_SIZE) of its attempts, newest first, and its attempt count. */
export async function getProblem(slug: string, page = 1) {
  const user = await requireUser();
  const problem = await db.problem.findUnique({
    relationLoadStrategy: "join",
    where: { userId_slug: { userId: user.id, slug } },
    include: {
      attempts: { orderBy: { attemptedAt: "desc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE },
      review: true,
      _count: { select: { attempts: true } },
    },
  });
  if (!problem) notFound();
  return problem;
}
