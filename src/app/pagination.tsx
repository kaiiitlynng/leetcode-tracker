import Link from "next/link";

/**
 * Previous / next links for a list split into pages. `onNavigate`, when given, takes over the click
 * (to show a pending state); the links still work without JavaScript and in a new tab.
 */
export default function Pagination({ page, pageCount, hrefFor, onNavigate, label }: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  onNavigate?: (href: string) => void;
  label: string;
}) {
  if (pageCount <= 1) return null;
  const link = (target: number, text: string, rel: "prev" | "next") => {
    const disabled = target < 1 || target > pageCount;
    if (disabled) return <span className="button secondary small" aria-disabled="true">{text}</span>;
    const href = hrefFor(target);
    return (
      <Link
        className="button secondary small"
        href={href}
        rel={rel}
        scroll={false}
        onClick={onNavigate && ((event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onNavigate(href);
        })}
      >
        {text}
      </Link>
    );
  };
  return (
    <nav className="pagination" aria-label={label}>
      {link(page - 1, "← Previous", "prev")}
      <span className="pagination-status num">Page {page} of {pageCount}</span>
      {link(page + 1, "Next →", "next")}
    </nav>
  );
}
