# LeetCode Tracker

Local-first LeetCode attempt logging with a review queue powered by spaced
repetition.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

The SQLite database is `prisma/dev.db` and is ignored by git. No account or
external LeetCode API is required.

## Importing existing data

The read-only Notion export belongs in `notion-data/`. Run:

```bash
pnpm import:notion-data
pnpm import:file path/to/export.csv
```

The importer prefers an `_all.csv` file, generates normalized data and reports
under `notion-data/_generated/`, and safely skips duplicate attempts. See
[`docs/import-mapping.md`](./docs/import-mapping.md) after the first import.

## Review schedule

Each attempt receives a rating from Again, Hard, Good, or Easy. The modified
SM-2 scheduler caps intervals at 180 days and rebuilds the review state from
the complete attempt history after every import or change.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
