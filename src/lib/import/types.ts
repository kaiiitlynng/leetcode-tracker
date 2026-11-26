export interface ImportRow {
  lcNumber?: number;
  title: string;
  url?: string;
  slug?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  topics?: string[];
  patterns?: string[];
  lists?: string[];
  notes?: string;
  attemptedAt?: string;
  outcome?: "SOLVED" | "SOLVED_WITH_HINT" | "LOOKED_AT_SOLUTION" | "FAILED";
  rating?: 1 | 2 | 3 | 4;
  timeMinutes?: number;
  approach?: string;
  mistakes?: string;
  code?: string;
  /** Source page path relative to notion-data/, one page per attempt. */
  notionPage?: string;
  source: "notion-data" | "upload";
}

export interface ImportSummary {
  problemsCreated: number;
  problemsMerged: number;
  attemptsAdded: number;
  duplicatesSkipped: number;
  invalidRows: { row: number; reason: string }[];
}
