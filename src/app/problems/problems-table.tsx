"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import AttemptLink from "../attempts/attempt-link";
import Pagination from "../pagination";
import PatternTags from "../patterns";
import { PAGE_SIZE } from "@/lib/pagination";
import { FIRST_DIRECTION, isFiltering, parseProblemQuery, type SortKey } from "./query";

export type ProblemRow = {
  id: string;
  slug: string;
  title: string;
  lcNumber: number | null;
  difficulty: string;
  patterns: string[];
  attempts: number;
  lastAttempt: { id: string; label: string } | null;
  nextReview: { label: string; due: boolean } | null;
};

const columns: { key: SortKey; label: string; className?: string }[] = [
  { key: "number", label: "#", className: "num" },
  { key: "title", label: "Title" },
  { key: "difficulty", label: "Difficulty" },
];
const trailingColumns: { key: SortKey; label: string; className?: string }[] = [
  { key: "attempts", label: "Attempts", className: "num" },
  { key: "last", label: "Last log" },
  { key: "next", label: "Next review" },
];

/**
 * One page of problems. Search, filters, sort and page live in the URL and are applied by the
 * server, so only one page of rows is ever loaded; this component edits the URL.
 */
export default function ProblemsTable({ rows, matches, page, pageCount, patternOptions }: {
  rows: ProblemRow[];
  matches: number;
  page: number;
  pageCount: number;
  patternOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  // The query most recently asked for. The controls show it at once, and every change builds on it, so
  // quick successive changes (clear the search, then pick a filter) never undo each other while the
  // server is still answering an earlier one.
  const [requested, setRequested] = useState(() => searchParams.toString());
  const latest = useRef(requested);
  const query = parseProblemQuery(new URLSearchParams(requested));
  const [search, setSearch] = useState(query.q);
  const sentSearch = useRef(query.q);

  // Follow the URL when it changes from outside this table (Back, opening a log), once nothing is in flight.
  const current = searchParams.toString();
  useEffect(() => {
    if (pending) return;
    latest.current = current;
    setRequested(current);
  }, [current, pending]);

  /** The requested URL with `changes` applied. Changing anything but the page goes back to page 1. */
  const hrefWith = (changes: Record<string, string>, base = requested) => {
    const next = new URLSearchParams(base);
    if (!("page" in changes)) next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value && !(key === "page" && value === "1")) next.set(key, value);
      else next.delete(key);
    }
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  };
  const go = (href: string) => {
    const search = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
    latest.current = search;
    setRequested(search);
    startTransition(() => router.replace(href, { scroll: false }));
  };

  // Search as you type, once typing pauses.
  useEffect(() => {
    if (search.trim() === query.q) return;
    const timer = setTimeout(() => {
      sentSearch.current = search.trim();
      go(hrefWith({ q: search.trim() }, latest.current));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Keep the box in step when the URL changes some other way (Back, Clear filters), but not when the
  // URL is catching up with what was typed, which would drop letters typed in the meantime.
  useEffect(() => {
    if (query.q === sentSearch.current) return;
    sentSearch.current = query.q;
    setSearch(query.q);
  }, [query.q]);

  const filtering = isFiltering(query);
  const clear = () => { setSearch(""); sentSearch.current = ""; go(hrefWith({ q: "", difficulty: "", pattern: "", review: "" })); };
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = first + rows.length - 1;

  const header = ({ key, label, className }: (typeof columns)[number]) => {
    const active = query.sort === key;
    const nextDir = active ? (query.dir === "asc" ? "desc" : "asc") : FIRST_DIRECTION[key];
    const href = hrefWith({ sort: key, dir: nextDir });
    return (
      <th key={key} className={className} aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : undefined}>
        <Link className="sort-button" href={href} scroll={false} replace onClick={(event) => { event.preventDefault(); go(href); }}>
          {label}
          <span className="sort-arrow" aria-hidden="true">{active ? (query.dir === "asc" ? "↑" : "↓") : ""}</span>
        </Link>
      </th>
    );
  };

  return (
    <>
      <div className="filters" role="search">
        <input type="search" aria-label="Search problems" placeholder="Search by title or number" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Difficulty" value={query.difficulty} onChange={(e) => go(hrefWith({ difficulty: e.target.value }))}>
          <option value="">All difficulties</option>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <select aria-label="Pattern" value={query.pattern} onChange={(e) => go(hrefWith({ pattern: e.target.value }))}>
          <option value="">All patterns</option>
          {patternOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select aria-label="Review status" value={query.review} onChange={(e) => go(hrefWith({ review: e.target.value }))}>
          <option value="">Any review status</option>
          <option value="due">Due now</option>
          <option value="later">Not due</option>
        </select>
      </div>
      <p className="list-note filters-count" role="status">
        {matches === 0 ? "No matches" : matches <= PAGE_SIZE ? `${matches} ${filtering ? "matching " : ""}problem${matches === 1 ? "" : "s"}` : `${first}–${last} of ${matches}${filtering ? " matching" : ""}`}
        {filtering && <button type="button" className="link-button" onClick={clear}>Clear filters</button>}
        {pending && <span className="pending-note">Updating…</span>}
      </p>
      {rows.length ? (
        <>
          <div className="table-wrap" aria-busy={pending} data-pending={pending || undefined}>
            <table className="problems-table">
              <thead>
                <tr>{columns.map(header)}<th>Pattern</th>{trailingColumns.map(header)}</tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="num secondary">{row.lcNumber ?? <span className="dash">—</span>}</td>
                    <td><Link className="title-link" href={`/problems/${row.slug}`}>{row.title}</Link></td>
                    <td><span className={`badge ${row.difficulty.toLowerCase()}`}>{row.difficulty}</span></td>
                    <td className="wrap"><PatternTags patterns={row.patterns} empty /></td>
                    <td className="num">{row.attempts}</td>
                    <td>{row.lastAttempt ? <AttemptLink id={row.lastAttempt.id}>{row.lastAttempt.label}</AttemptLink> : <span className="dash">—</span>}</td>
                    <td className={row.nextReview?.due ? "due-now" : "secondary"}>{row.nextReview ? (row.nextReview.due ? `Due · ${row.nextReview.label}` : row.nextReview.label) : <span className="dash">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageCount={pageCount} hrefFor={(target) => hrefWith({ page: String(target) })} onNavigate={go} label="Problems pages" />
        </>
      ) : (
        <div className="empty">
          <p className="empty-title">No problems match</p>
          <p className="empty-text">Try a different search, or <button type="button" className="link-button" onClick={clear}>clear the filters</button>.</p>
        </div>
      )}
    </>
  );
}
