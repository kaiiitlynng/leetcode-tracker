/** Search, filters, sort and page for the problems list. Read from the URL on the server and in the browser. */
export const SORT_KEYS = ["number", "title", "difficulty", "attempts", "last", "next"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type Direction = "asc" | "desc";

/** The direction a column sorts in when first chosen: newest logs and most attempts first, otherwise ascending. */
export const FIRST_DIRECTION: Record<SortKey, Direction> = { number: "asc", title: "asc", difficulty: "asc", attempts: "desc", last: "desc", next: "asc" };

export type ProblemQuery = {
  q: string;
  difficulty: "" | "Easy" | "Medium" | "Hard";
  pattern: string;
  review: "" | "due" | "later";
  sort: SortKey;
  dir: Direction;
  page: number;
};

type Params = { get(key: string): string | null };

export function parseProblemQuery(params: Params): ProblemQuery {
  const sortParam = params.get("sort");
  const sort = (SORT_KEYS as readonly string[]).includes(sortParam ?? "") ? (sortParam as SortKey) : "last";
  const dir = params.get("dir");
  const difficulty = params.get("difficulty");
  const review = params.get("review");
  const page = Number(params.get("page"));
  return {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    difficulty: difficulty === "Easy" || difficulty === "Medium" || difficulty === "Hard" ? difficulty : "",
    pattern: params.get("pattern") ?? "",
    review: review === "due" || review === "later" ? review : "",
    sort,
    dir: dir === "asc" || dir === "desc" ? dir : FIRST_DIRECTION[sort],
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export const isFiltering = (query: ProblemQuery) => Boolean(query.q || query.difficulty || query.pattern || query.review);
