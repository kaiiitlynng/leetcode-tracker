import type { Rating } from "./sm2";

export type Outcome =
  | "SOLVED"
  | "SOLVED_WITH_HINT"
  | "LOOKED_AT_SOLUTION"
  | "FAILED";

const targets = { Easy: 15, Medium: 30, Hard: 45 } as const;

export function suggestedRating(
  outcome: Outcome,
  difficulty: keyof typeof targets,
  timeMinutes?: number | null,
): Rating {
  if (outcome === "FAILED" || outcome === "LOOKED_AT_SOLUTION") return 1;
  if (outcome === "SOLVED_WITH_HINT") return 2;
  if (timeMinutes == null) return 3;
  return timeMinutes <= targets[difficulty] ? 4 : 3;
}
