import { parse } from "papaparse";
import { parseLeetCodeUrl, slugify } from "@/lib/leetcode";
import type { ImportRow } from "./types";

const aliases: Record<keyof ImportRow, string[]> = {
  title: ["title", "name", "problem", "question"], lcNumber: ["#", "no", "number", "id", "problem number", "lc #"],
  url: ["url", "link", "leetcode link"], difficulty: ["difficulty", "level"], topics: ["topics", "tags", "category", "type"],
  pattern: ["pattern", "technique", "approach type"], attemptedAt: ["date", "date solved", "solved on", "attempted", "last attempted", "last reviewed"],
  outcome: ["status", "confidence", "result", "solved?", "rating"], timeMinutes: ["time", "time taken", "minutes", "duration"],
  notes: ["notes", "comments", "insight", "takeaways"], code: ["code", "solution"], slug: [], lists: [], rating: [],
  language: [], approach: [], mistakes: [], source: [], notionPage: [],
};
const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function findColumn(headers: string[], field: keyof ImportRow) {
  return headers.find((header) => aliases[field].some((alias) => clean(alias) === clean(header)));
}
function values(value: string | undefined) {
  return value?.split(/[,;|]/).map((part) => part.trim()).filter(Boolean) ?? [];
}
function status(value: string | undefined): { outcome: ImportRow["outcome"]; rating: 1 | 2 | 3 | 4 } {
  const normalized = value?.toLowerCase().trim() ?? "";
  if (normalized.includes("miss") || normalized.includes("fail")) return { outcome: "FAILED", rating: 1 };
  if (normalized.includes("shak")) return { outcome: "SOLVED", rating: 3 };
  if (normalized.includes("got") || normalized.includes("confident")) return { outcome: "SOLVED", rating: 4 };
  return { outcome: "SOLVED", rating: 3 };
}

export function normalizeCsv(csv: string, source: ImportRow["source"] = "upload"): ImportRow[] {
  const result = parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return result.data.flatMap((row) => {
    const headers = Object.keys(row);
    const get = (field: keyof ImportRow) => {
      const column = findColumn(headers, field);
      return column ? row[column]?.trim() : undefined;
    };
    const title = get("title");
    if (!title) return [];
    const url = get("url");
    const rawDate = get("attemptedAt");
    const mapped = status(get("outcome"));
    return [{
      title, url, slug: url ? parseLeetCodeUrl(url) ?? slugify(title) : slugify(title),
      lcNumber: get("lcNumber") ? Number(get("lcNumber")) : undefined,
      difficulty: (get("difficulty") as ImportRow["difficulty"]) || "Medium",
      topics: values(get("topics")), pattern: get("pattern"), notes: get("notes"), code: get("code"),
      attemptedAt: rawDate ? new Date(rawDate).toISOString() : undefined,
      outcome: mapped.outcome, rating: mapped.rating, source,
    }];
  });
}
