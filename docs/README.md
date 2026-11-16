# Import notes

The tracker is local-first. Copy CSV or JSON exports into `notion-data/` and
run `pnpm import:notion-data` for the canonical Notion export, or
`pnpm import:file path/to/file.csv` for a later upload. Import is idempotent
for an attempt with the same problem, local calendar day, and outcome.
