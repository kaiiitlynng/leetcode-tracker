"use client";

import type { AttemptView } from "./types";

/**
 * Attempts fetched for the side panel, kept for the session so reopening one, or switching between
 * a problem's attempts, needs no request. `null` means the attempt does not exist or is not yours.
 */
const requests = new Map<string, Promise<AttemptView | null>>();
const loaded = new Map<string, AttemptView | null>();

export function loadAttempt(id: string): Promise<AttemptView | null> {
  let request = requests.get(id);
  if (!request) {
    request = fetch(`/api/attempts/${encodeURIComponent(id)}`).then(async (response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Could not load attempt (${response.status})`);
      return (await response.json()) as AttemptView;
    });
    requests.set(id, request);
    request.then((view) => loaded.set(id, view), () => requests.delete(id));
  }
  return request;
}

/** The attempt if it has already arrived, so the panel can render it without a loading state. */
export const loadedAttempt = (id: string) => loaded.get(id);

/** Drop cached copies after an edit or delete. Every attempt of the problem is dropped, since their lists and review dates changed too. */
export function forgetAttempts(ids: string[]) {
  for (const id of ids) { requests.delete(id); loaded.delete(id); }
}
