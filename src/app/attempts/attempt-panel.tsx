"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PatternTags from "../patterns";
import { formatDate, formatDateTime, formatOutcome, formatRating } from "@/lib/format";
import AttemptEditor from "./attempt-editor";
import AttemptLink from "./attempt-link";
import NotionPageView from "./notion-page";
import type { AttemptView } from "./types";

const sourceLabels: Record<string, string> = { manual: "Logged here", "notion-data": "Notion import", upload: "File import" };

function ExternalLink({ href }: { href: string }) {
  return <a className="peek-link" href={href} target="_blank" rel="noreferrer">{href}</a>;
}

/** The stored details of one attempt. Fields with nothing recorded are left out. */
export default function AttemptPanel({ view, onChanged, onDeleted }: { view: AttemptView; onChanged: (patch?: Partial<AttemptView>) => void; onDeleted: () => void }) {
  const { problem } = view;
  const properties: [string, ReactNode][] = [
    ["Outcome", formatOutcome(view.outcome)],
    ["Rating", formatRating(view.rating)],
    ["Time", view.timeMinutes != null && `${view.timeMinutes} min`],
    ["Time complexity", view.timeComplexity],
    ["Space complexity", view.spaceComplexity],
    ["Difficulty", <span className={`badge ${problem.difficulty.toLowerCase()}`} key="difficulty">{problem.difficulty}</span>],
    ["Pattern", problem.patterns.length > 0 && <PatternTags patterns={problem.patterns} />],
    ["Problem number", problem.lcNumber],
    ["LeetCode", problem.leetcodeUrl && <ExternalLink href={problem.leetcodeUrl} />],
    ["NeetCode", problem.neetcodeUrl && <ExternalLink href={problem.neetcodeUrl} />],
    ["Source", sourceLabels[view.source] ?? view.source],
    ["Next review", problem.nextReview && formatDate(problem.nextReview)],
  ];
  const sections: [string, string | null][] = [["Approach", view.approach], ["Mistakes / insight", view.mistakes]];

  return (
    <>
      <h2 id="peek-title" className="peek-title"><Link className="title-link" href={`/problems/${problem.slug}`}>{problem.title}</Link></h2>
      <AttemptEditor key={view.id} attempt={view} difficulty={problem.difficulty} imported={view.source === "notion-data"} onSaved={onChanged} onDeleted={onDeleted}>
        <dl className="peek-props">
          {properties.filter(([, value]) => value != null && value !== false && value !== "").map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        {sections.filter(([, text]) => text).map(([heading, text]) => (
          <section className="peek-section" key={heading}><h3>{heading}</h3><p>{text}</p></section>
        ))}
        {view.code && <section className="peek-section"><h3>Code</h3><pre><code>{view.code}</code></pre></section>}
        {view.notion && (
          <section className="peek-section">
            <h3>Notion page</h3>
            {view.notion.page ? <NotionPageView page={view.notion.page} /> : <p>The exported Notion page is not available on this server.</p>}
          </section>
        )}
        {view.siblings.length > 1 && (
          <nav className="peek-section" aria-label="All attempts at this problem">
            <h3>All attempts</h3>
            <ul className="peek-attempts">
              {view.siblings.map((sibling) => (
                <li key={sibling.id}>
                  {sibling.id === view.id
                    ? <span aria-current="true">{formatDateTime(sibling.attemptedAt)} · {formatOutcome(sibling.outcome)} (viewing)</span>
                    : <AttemptLink id={sibling.id} className="peek-link">{formatDateTime(sibling.attemptedAt)} · {formatOutcome(sibling.outcome)}</AttemptLink>}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </AttemptEditor>
    </>
  );
}
