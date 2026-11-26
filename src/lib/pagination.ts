export const PAGE_SIZE = 50;

/** A 1-based page number from a query value; anything invalid is page 1. */
export function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export const pageCount = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));
