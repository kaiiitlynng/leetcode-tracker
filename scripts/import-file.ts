import fs from "node:fs/promises";
import path from "node:path";
import { normalizeCsv } from "../src/lib/import/normalize";
import { runImport } from "../src/lib/import/run";
import type { ImportRow } from "../src/lib/import/types";
import { userFromArgs } from "../src/lib/import/user";

const input = process.argv[2];
if (!input || input.startsWith("--")) throw new Error("Usage: pnpm import:file <path> --email you@example.com");

async function main() {
  const user = await userFromArgs(process.argv.slice(3));
  const content = await fs.readFile(input, "utf8");
  const rows: ImportRow[] = path.extname(input).toLowerCase() === ".json" ? JSON.parse(content) : normalizeCsv(content);
  console.log(await runImport(user.id, rows.map((row) => ({ ...row, source: "upload" }))));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
