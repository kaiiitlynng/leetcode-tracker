import "server-only";
import { endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import type { ProblemQuery, SortKey } from "@/app/problems/query";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAGE_SIZE, pageCount } from "@/lib/pagination";

export type ProblemListRow = {
  id: string;
  slug: string;
  title: string;
  lcNumber: number | null;
  difficulty: string;
  patterns: string[];
  attempts: number;
  lastId: string | null;
  lastAt: Date | null;
  lastOutcome: string | null;
  dueAt: Date | null;
  suspended: boolean | null;
};

// Whitelisted ORDER BY expressions; user input never reaches the SQL text.
const ORDER: Record<SortKey, Prisma.Sql> = {
  number: Prisma.sql`p."lcNumber"`,
  title: Prisma.sql`lower(p."title")`,
  difficulty: Prisma.sql`CASE p."difficulty" WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 END`,
  attempts: Prisma.sql`a."count"`,
  last: Prisma.sql`l."attemptedAt"`,
  next: Prisma.sql`CASE WHEN r."suspended" THEN NULL ELSE r."dueAt" END`,
};

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * One page of the signed-in user's problems, filtered and sorted in the database, so only
 * PAGE_SIZE rows are loaded. Also returns the match count, the account's total and its patterns.
 */
export async function getProblemPage(query: ProblemQuery) {
  const user = await requireUser();
  const endOfToday = endOfDay(new Date()).toISOString();
  const dueNow = Prisma.sql`(r."dueAt" <= ${endOfToday}::timestamp AND NOT r."suspended")`;
  // "#12" searches problem numbers only; anything else matches the title or the start of the number.
  const numberOnly = query.q.startsWith("#");
  const needle = numberOnly ? query.q.slice(1).trim() : query.q;
  const numberMatch = Prisma.sql`p."lcNumber"::text LIKE ${`${escapeLike(needle)}%`}`;
  const conditions = [
    Prisma.sql`p."userId" = ${user.id}`,
    needle && (numberOnly ? numberMatch : Prisma.sql`(p."title" ILIKE ${`%${escapeLike(needle)}%`} OR ${numberMatch})`),
    query.difficulty && Prisma.sql`p."difficulty" = ${query.difficulty}`,
    query.pattern && Prisma.sql`${query.pattern} = ANY(p."patterns")`,
    query.review === "due" && dueNow,
    query.review === "later" && Prisma.sql`NOT COALESCE(${dueNow}, false)`,
  ].filter((condition): condition is Prisma.Sql => Boolean(condition));
  const direction = query.dir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  const from = Prisma.sql`
    FROM "Problem" p
    LEFT JOIN "ReviewState" r ON r."problemId" = p."id"
    WHERE ${Prisma.join(conditions, " AND ")}`;
  const pageOf = (page: number) => db.$queryRaw<(ProblemListRow & { total: number })[]>`
    SELECT p."id", p."slug", p."title", p."lcNumber", p."difficulty", p."patterns",
           a."count" AS "attempts", l."id" AS "lastId", l."attemptedAt" AS "lastAt", l."outcome" AS "lastOutcome",
           r."dueAt", r."suspended", COUNT(*) OVER ()::int AS "total"
    FROM "Problem" p
    LEFT JOIN "ReviewState" r ON r."problemId" = p."id"
    LEFT JOIN LATERAL (SELECT count(*)::int AS "count" FROM "Attempt" WHERE "problemId" = p."id") a ON true
    LEFT JOIN LATERAL (
      SELECT "id", "attemptedAt", "outcome" FROM "Attempt" WHERE "problemId" = p."id" ORDER BY "attemptedAt" DESC LIMIT 1
    ) l ON true
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${ORDER[query.sort]} ${direction} NULLS LAST, lower(p."title") ASC, p."id"
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`;

  const [rows, [summary]] = await Promise.all([
    pageOf(query.page),
    db.$queryRaw<{ total: number; patterns: string[] }[]>`
      SELECT (SELECT count(*)::int FROM "Problem" WHERE "userId" = ${user.id}) AS "total",
             ARRAY(SELECT DISTINCT unnest("patterns") FROM "Problem" WHERE "userId" = ${user.id} ORDER BY 1) AS "patterns"`,
  ]);
  // A page past the end (say, after deleting problems) shows the last page instead of nothing.
  let page = query.page;
  let pageRows = rows;
  if (!rows.length && page > 1) {
    const [{ matches }] = await db.$queryRaw<{ matches: number }[]>`SELECT count(*)::int AS "matches" ${from}`;
    page = pageCount(matches);
    pageRows = matches ? await pageOf(page) : [];
  }
  return { rows: pageRows as ProblemListRow[], matches: pageRows[0]?.total ?? 0, page, total: summary.total, patterns: summary.patterns };
}
