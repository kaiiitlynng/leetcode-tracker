import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { getTodayPlan } from "../actions";
import AttemptLink from "../attempts/attempt-link";
import LogModal from "../log/modal";
import PatternTags from "../patterns";

export const dynamic = "force-dynamic";

type Difficulty = "Easy" | "Medium" | "Hard";
type PlanProblem = { slug: string; title: string; difficulty: string; patterns: string[] };

function ProblemCell({ problem }: { problem: PlanProblem }) {
  return (
    <div className="today-problem">
      <Link className="title-link" href={`/problems/${problem.slug}`}>{problem.title}</Link>
      <span className={`badge ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
      <PatternTags patterns={problem.patterns} />
    </div>
  );
}

function dueLabel(dueAt: Date, today: Date) {
  const days = differenceInCalendarDays(today, dueAt);
  return days <= 0 ? "Due today" : `${days}d overdue`;
}

export default async function Home() {
  const plan = await getTodayPlan();
  const today = new Date();
  const total = plan.done.length + plan.remaining.length;

  return (
    <>
      <header className="page-header">
        <div className="heading-row">
          <h1 className="title">Today</h1>
          {total > 0 && <span className="count-chip num">{plan.done.length} / {total}</span>}
        </div>
        <LogModal buttonClassName="button" />
      </header>

      {total > 0 ? (
        <>
          <ul className="today-list">
            {plan.remaining.map(({ problem, dueAt }) => (
              <li className="today-row" key={problem.id}>
                <span className="check" aria-hidden="true" />
                <ProblemCell problem={problem} />
                <span className={`due-label num ${differenceInCalendarDays(today, dueAt) > 0 ? "overdue" : ""}`}>{dueLabel(dueAt, today)}</span>
                <div className="row-actions">
                  {problem.leetcodeUrl && <a className="button secondary small" href={problem.leetcodeUrl} target="_blank" rel="noreferrer">LeetCode ↗</a>}
                  {problem.neetcodeUrl && <a className="button secondary small" href={problem.neetcodeUrl} target="_blank" rel="noreferrer">NeetCode ↗</a>}
                  <LogModal
                    buttonClassName="button small"
                    label="Log"
                    initial={{ problemId: problem.id, url: problem.leetcodeUrl ?? undefined, title: problem.title, difficulty: problem.difficulty as Difficulty, patterns: problem.patterns, number: problem.lcNumber ?? undefined }}
                  />
                </div>
              </li>
            ))}
            {plan.done.map(({ problem }) => (
              <li className="today-row done" key={problem.id}>
                <span className="check" aria-label="Done">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5.2 4 7.2 8 3" /></svg>
                </span>
                <ProblemCell problem={problem} />
                <span className="due-label">Done</span>
                <div className="row-actions">{problem.attempts[0] && <AttemptLink id={problem.attempts[0].id} className="button secondary small">View log</AttemptLink>}</div>
              </li>
            ))}
          </ul>
          {plan.deferred > 0 && <p className="list-note">{plan.deferred} more due · rolls into tomorrow</p>}
        </>
      ) : (
        <div className="empty">
          <p className="empty-title">You’re all caught up</p>
          <p className="empty-text">Nothing is due for review today. <Link className="peek-link" href="/problems">Browse all problems</Link></p>
        </div>
      )}
    </>
  );
}
