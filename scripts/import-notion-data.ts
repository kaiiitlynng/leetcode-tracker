import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "papaparse";
import { normalizeCsv } from "../src/lib/import/normalize";
import { runImport } from "../src/lib/import/run";
import { db } from "../src/lib/db";
import { userFromArgs } from "../src/lib/import/user";
import { parseNotionPage, type NotionPage } from "../src/lib/notion";

const root = path.join(process.cwd(), "notion-data");
const generated = path.join(root, "_generated");

async function main() {
  const user = await userFromArgs();
  const files = await fs.readdir(root, { recursive: true });
  const csvFiles = files.filter((file) => file.endsWith(".csv"));
  const preferred = csvFiles.find((file) => file.includes("_all")) || csvFiles[0];
  if (!preferred) throw new Error("No CSV export found in notion-data.");
  const csv = await fs.readFile(path.join(root, preferred), "utf8");
  const rows = normalizeCsv(csv, "notion-data");
  const markdownFiles = files.filter((file) => file.endsWith(".md") && !file.startsWith("_generated"));
  const pages = await Promise.all(markdownFiles.map(async (file) => parseNotionPage(file.split(path.sep).join("/"), await fs.readFile(path.join(root, file), "utf8"))));
  const unmatched = linkPages(rows, pages);
  if (unmatched.length) console.warn(`No Notion page found for ${unmatched.length} row(s):`, unmatched);

  // The export is a full snapshot: replace previously imported attempts so dates and page links are rebuilt.
  // Problems (and the links you entered on them) are kept.
  const removed = await db.attempt.deleteMany({ where: { source: "notion-data", problem: { userId: user.id } } });
  console.log(`Importing into ${user.email}; replacing ${removed.count} previously imported attempt(s).`);
  await fs.mkdir(generated, { recursive: true });
  await fs.writeFile(path.join(generated, "normalized.json"), JSON.stringify(rows, null, 2));
  const parsedCsv = parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const columns = Object.keys(parsedCsv.data[0] || {});
  const samples = columns.map((column) => `| ${column} | ${parsedCsv.data.slice(0, 3).map((item) => item[column]).filter(Boolean).join("; ").replace(/\|/g, "\\|") || "—" } |`).join("\n");
  await fs.writeFile(path.join(process.cwd(), "docs/notion-data-inventory.md"), `# Notion data inventory\n\n| File/type | Details |\n|---|---|\n${files.map((file) => `| ${file} | ${file.endsWith(".csv") ? "CSV export" : file.endsWith(".md") ? "Markdown page" : "Asset"} |`).join("\n")}\n\n## Canonical CSV columns and samples\n\n| Column | Samples |\n|---|---|\n${samples}\n\nCanonical CSV: \`${preferred}\`; normalized rows: ${rows.length}.`);
  await fs.writeFile(path.join(process.cwd(), "docs/import-mapping.md"), "# Import mapping\n\n| Source status | Outcome | Rating |\n|---|---|---:|\n| Got It | SOLVED | 4 |\n| Shaky | SOLVED | 3 |\n| Missed | FAILED | 1 |\n| Unknown/empty | SOLVED | 3 |\n\nThe `_all.csv` export is preferred. Source files are read-only; generated files are written under `notion-data/_generated/`.\n");
  console.log(await runImport(user.id, rows));
}

const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const reviewedAt = (page: NotionPage) => {
  const value = page.properties.find((property) => property.key === "Last Reviewed")?.value;
  return value ? new Date(value).toISOString() : undefined;
};

/**
 * Give each CSV row its own page. A row and its page share the title and the Last Reviewed
 * timestamp; the timestamp alone is the fallback when Notion truncated the page title.
 */
function linkPages(rows: Awaited<ReturnType<typeof normalizeCsv>>, pages: NotionPage[]) {
  const used = new Set<string>();
  const unmatched: string[] = [];
  for (const row of rows) {
    const candidates = pages.filter((page) => !used.has(page.file) && reviewedAt(page) === row.attemptedAt);
    const page = candidates.find((candidate) => clean(candidate.title) === clean(row.title))
      ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (!page) { unmatched.push(row.title); continue; }
    used.add(page.file);
    row.notionPage = page.file;
    row.code = row.code || page.body.match(/```[\w-]*\n([\s\S]*?)```/)?.[1]?.trim();
  }
  return unmatched;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
