import Link from "next/link";
import { getProblem } from "../../actions";
import { formatDate, formatDateTime, formatOutcome, formatRating } from "@/lib/format";
import AttemptLink from "../../attempts/attempt-link";
import LogModal from "../../log/modal";
import PatternTags from "../../patterns";
import ProblemLinks from "./problem-links";
import Pagination from "../../pagination";
import { pageCount, parsePage } from "@/lib/pagination";

export default async function ProblemDetail({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const requested = parsePage(pageParam);
  let problem = await getProblem(slug, requested);
  const pages = pageCount(problem._count.attempts);
  // A page past the end shows the last page instead of nothing.
  const page = Math.min(requested, pages);
  if (page !== requested) problem = await getProblem(slug, page);
  const attemptCount = problem._count.attempts;
  const stats = [
    { label: "Attempts", value: attemptCount },
    { label: "Ease", value: problem.review?.easeFactor.toFixed(2) ?? "—" },
    { label: "Interval", value: `${problem.review?.intervalDays ?? 0}d` },
    { label: "Next due", value: problem.review ? formatDate(problem.review.dueAt) : "—" },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <Link className="eyebrow" href="/problems">← Problems</Link>
          <h1 className="title">{problem.title}</h1>
          <div className="meta">
            <span className={`badge ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
            <PatternTags patterns={problem.patterns} />
          </div>
        </div>
        <div className="actions">
          <ProblemLinks problemId={problem.id} leetcodeUrl={problem.leetcodeUrl} neetcodeUrl={problem.neetcodeUrl} />
          <LogModal
            label="Log redo"
            initial={{ problemId: problem.id, url: problem.leetcodeUrl ?? undefined, title: problem.title, difficulty: problem.difficulty as "Easy" | "Medium" | "Hard", patterns: problem.patterns, number: problem.lcNumber ?? undefined }}
          />
        </div>
      </header>

      <div className="grid stats">
        {stats.map((stat) => (
          <div className="card stat" key={stat.label}>
            <span className="stat-label">{stat.label}</span>
            <strong className="stat-value">{stat.value}</strong>
          </div>
        ))}
      </div>

      <h2 className="section-title">Attempts</h2>
      {problem.attempts.length ? (
        <div className="timeline">
          {problem.attempts.map((attempt) => (
            <article className="attempt" key={attempt.id}>
              <div className="attempt-head">
                <span className="attempt-date">{formatDateTime(attempt.attemptedAt)}</span>
                <span className="badge">{formatOutcome(attempt.outcome)}</span>
                <span className="badge">{formatRating(attempt.rating)}</span>
                <AttemptLink id={attempt.id}>Open</AttemptLink>
              </div>
              <div className="attempt-body">
                {(attempt.approach || !attempt.notionPage) && <p>{attempt.approach || "No approach recorded."}</p>}
                {attempt.mistakes && <p><strong>Insight</strong> · {attempt.mistakes}</p>}
                {attempt.code && <details><summary>Show code</summary><pre><code>{attempt.code}</code></pre></details>}
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {problem.attempts.length > 0 && (
        <Pagination
          page={page}
          pageCount={pages}
          hrefFor={(target) => (target === 1 ? `/problems/${problem.slug}` : `/problems/${problem.slug}?page=${target}`)}
          label="Attempt pages"
        />
      )}
      {problem.attempts.length === 0 && (
        <div className="empty">
          <p className="empty-title">No attempts recorded</p>
        </div>
      )}
    </>
  );
}
