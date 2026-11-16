import Link from "next/link";
import { getProblem } from "../../actions";
import { parseJsonArray } from "@/lib/json";
import { patternColor } from "@/lib/patterns";
import { readNotionPage } from "@/lib/notion";
import AttemptPeek from "./attempt-peek";
import NotionPageView from "./notion-page";
import ProblemLinks from "./problem-links";

const ratingLabels = ["Again", "Hard", "Good", "Easy"];
const formatDate = (date: Date | string) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const formatDateTime = (date: Date | string) => new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const formatOutcome = (outcome: string) => outcome.charAt(0) + outcome.slice(1).toLowerCase().replaceAll("_", " ");

export default async function ProblemDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  const topics = parseJsonArray(problem.topics);
  const notionPages = new Map(await Promise.all(
    problem.attempts.map(async (attempt) => [attempt.id, attempt.notionPage ? await readNotionPage(attempt.notionPage) : null] as const),
  ));
  const stats = [
    { label: "Attempts", value: problem.attempts.length },
    { label: "Ease", value: problem.review?.easeFactor.toFixed(2) ?? "—" },
    { label: "Interval", value: `${problem.review?.intervalDays ?? 0}d` },
    { label: "Next due", value: problem.review ? formatDate(problem.review.dueAt) : "—" },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <Link className="eyebrow" href="/">← Problems</Link>
          <h1 className="title">{problem.title}</h1>
          <div className="meta">
            <span className={`badge ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
            {problem.pattern && <span className="pattern-pill" data-color={patternColor(problem.pattern)}>{problem.pattern}</span>}
            {topics.length > 0 && <span>{topics.join(", ")}</span>}
          </div>
        </div>
        <div className="actions">
          <ProblemLinks problemId={problem.id} leetcodeUrl={problem.leetcodeUrl} neetcodeUrl={problem.neetcodeUrl} />
          <Link className="button" href="/log">Log redo</Link>
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
          {problem.attempts.map((attempt) => {
            const page = notionPages.get(attempt.id);
            return (
            <article className="attempt" key={attempt.id}>
              <div className="attempt-head">
                <span className="attempt-date">{formatDateTime(attempt.attemptedAt)}</span>
                <span className="badge">{formatOutcome(attempt.outcome)}</span>
                <span className="badge">{ratingLabels[attempt.rating - 1] ?? `Rating ${attempt.rating}`}</span>
                {page && (
                  <AttemptPeek title={page.title} subtitle={formatDateTime(attempt.attemptedAt)} notionId={page.notionId}>
                    <NotionPageView page={page} />
                  </AttemptPeek>
                )}
              </div>
              <div className="attempt-body">
                {(attempt.approach || !page) && <p>{attempt.approach || "No approach recorded."}</p>}
                {attempt.mistakes && <p><strong>Insight</strong> · {attempt.mistakes}</p>}
                {attempt.code && <details><summary>Show code</summary><pre><code>{attempt.code}</code></pre></details>}
              </div>
            </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <p className="empty-title">No attempts recorded</p>
        </div>
      )}
    </>
  );
}
