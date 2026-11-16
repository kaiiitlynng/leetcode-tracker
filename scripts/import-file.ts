import fs from "node:fs/promises";
import path from "node:path";
import { normalizeCsv } from "../src/lib/import/normalize";
import { runImport } from "../src/lib/import/run";
import type { ImportRow } from "../src/lib/import/types";

const input = process.argv[2];
if (!input) throw new Error("Usage: pnpm import:file <path>");

async function main() {
  const content = await fs.readFile(input, "utf8");
  const rows: ImportRow[] = path.extname(input).toLowerCase() === ".json" ? JSON.parse(content) : normalizeCsv(content);
  console.log(await runImport(rows.map((row) => ({ ...row, source: "upload" }))));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
