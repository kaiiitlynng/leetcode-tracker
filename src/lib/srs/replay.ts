import type { Attempt } from "@prisma/client";
import { schedule, type Rating, type SrsState } from "./sm2";

export function rebuildReviewState(attempts: Pick<Attempt, "attemptedAt" | "rating">[]) {
  const initial: SrsState = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
  return [...attempts]
    .sort((a, b) => a.attemptedAt.getTime() - b.attemptedAt.getTime())
    .reduce((state, attempt) => schedule(state, attempt.rating as Rating, attempt.attemptedAt), {
      ...initial,
      dueAt: new Date(),
    });
}
