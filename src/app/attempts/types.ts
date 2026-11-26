import type { NotionPage } from "@/lib/notion";

/** Everything the side panel shows for one attempt, as sent by GET /api/attempts/[id]. Dates are ISO strings. */
export type AttemptView = {
  id: string;
  attemptedAt: string;
  outcome: string;
  rating: number;
  timeMinutes: number | null;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  approach: string | null;
  mistakes: string | null;
  code: string | null;
  source: string;
  problem: {
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    patterns: string[];
    lcNumber: number | null;
    leetcodeUrl: string | null;
    neetcodeUrl: string | null;
    nextReview: string | null;
  };
  siblings: { id: string; attemptedAt: string; outcome: string }[];
  /** Null when the attempt has no Notion page; `page` is null when its file is not on this server. */
  notion: { page: NotionPage | null } | null;
};
