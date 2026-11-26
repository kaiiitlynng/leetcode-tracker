/** The current page's URL with `attempt` set to `id`, or removed when `id` is null. Other query parameters are kept. */
export function attemptHref(pathname: string, searchParams: URLSearchParams | { toString(): string }, id: string | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (id) params.set("attempt", id);
  else params.delete("attempt");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Open or close the panel by editing the URL in place. Next keeps useSearchParams in sync with the
 * History API, so the panel updates without asking the server to re-render the page behind it.
 */
export function openAttempt(id: string) {
  window.history.pushState(null, "", attemptHref(window.location.pathname, window.location.search, id));
}

export function closeAttempt() {
  window.history.replaceState(null, "", attemptHref(window.location.pathname, window.location.search, null));
}
