import { endOfDay } from "date-fns";
import LogModal from "../log/modal";
import { formatDate, formatOutcome } from "@/lib/format";
import { pageCount } from "@/lib/pagination";
import { getProblemPage } from "@/lib/problems";
import ProblemsTable, { type ProblemRow } from "./problems-table";
import { isFiltering, parseProblemQuery } from "./query";

export const dynamic = "force-dynamic";

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const query = parseProblemQuery({ get: (key) => { const value = raw[key]; return (Array.isArray(value) ? value[0] : value) ?? null; } });
  const result = await getProblemPage(query);
  const endOfToday = endOfDay(new Date());
  // Dates are formatted here so the server and browser render the same text.
  const rows: ProblemRow[] = result.rows.map((problem) => ({
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    lcNumber: problem.lcNumber,
    difficulty: problem.difficulty,
    patterns: problem.patterns,
    attempts: problem.attempts,
    lastAttempt: problem.lastId && problem.lastAt
      ? { id: problem.lastId, label: `${formatDate(problem.lastAt)} · ${formatOutcome(problem.lastOutcome ?? "")}` }
      : null,
    nextReview: problem.dueAt && !problem.suspended
      ? { label: formatDate(problem.dueAt), due: problem.dueAt <= endOfToday }
      : null,
  }));

  return (
    <>
      <header className="page-header">
        <div className="heading-row">
          <h1 className="title">Problems</h1>
          {result.total > 0 && <span className="count-chip num">{result.total}</span>}
        </div>
        <LogModal buttonClassName="button" />
      </header>
      {result.total > 0 || isFiltering(query) ? (
        <ProblemsTable
          rows={rows}
          matches={result.matches}
          page={result.page}
          pageCount={pageCount(result.matches)}
          patternOptions={result.patterns}
        />
      ) : (
        <div className="empty">
          <p className="empty-title">No problems yet</p>
          <p className="empty-text">Log your first attempt to start your review queue.</p>
        </div>
      )}
    </>
  );
}
