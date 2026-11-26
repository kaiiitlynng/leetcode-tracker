import { NextResponse } from "next/server";
import type { AttemptView } from "@/app/attempts/types";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readNotionPage } from "@/lib/notion";

/** One attempt for the side panel, as JSON. 404 when it is missing or belongs to another account. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const attempt = await db.attempt.findFirst({
    relationLoadStrategy: "join",
    where: { id, problem: { userId: user.id } },
    include: {
      problem: {
        include: {
          review: { select: { dueAt: true } },
          attempts: { select: { id: true, attemptedAt: true, outcome: true }, orderBy: { attemptedAt: "desc" } },
        },
      },
    },
  });
  if (!attempt) return new NextResponse("Not found", { status: 404 });

  const { problem } = attempt;
  const view: AttemptView = {
    id: attempt.id,
    attemptedAt: attempt.attemptedAt.toISOString(),
    outcome: attempt.outcome,
    rating: attempt.rating,
    timeMinutes: attempt.timeMinutes,
    timeComplexity: attempt.timeComplexity,
    spaceComplexity: attempt.spaceComplexity,
    approach: attempt.approach,
    mistakes: attempt.mistakes,
    code: attempt.code,
    source: attempt.source,
    problem: {
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty as AttemptView["problem"]["difficulty"],
      patterns: problem.patterns,
      lcNumber: problem.lcNumber,
      leetcodeUrl: problem.leetcodeUrl,
      neetcodeUrl: problem.neetcodeUrl,
      nextReview: problem.review?.dueAt.toISOString() ?? null,
    },
    siblings: problem.attempts.map((sibling) => ({ ...sibling, attemptedAt: sibling.attemptedAt.toISOString() })),
    notion: attempt.notionPage ? { page: await readNotionPage(attempt.notionPage) } : null,
  };
  return NextResponse.json(view, { headers: { "Cache-Control": "private, no-store" } });
}
