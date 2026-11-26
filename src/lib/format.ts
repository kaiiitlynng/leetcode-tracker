export const ratingLabels = ["Again", "Hard", "Good", "Easy"] as const;

export const outcomeLabels: Record<string, string> = {
  SOLVED: "Solved",
  SOLVED_WITH_HINT: "Solved with hint",
  LOOKED_AT_SOLUTION: "Looked at solution",
  FAILED: "Failed",
};

export const formatOutcome = (outcome: string) => outcomeLabels[outcome] ?? outcome;
export const formatRating = (rating: number) => ratingLabels[rating - 1] ?? `Rating ${rating}`;
export const formatDate = (date: Date | string) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
export const formatDateTime = (date: Date | string) => new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
