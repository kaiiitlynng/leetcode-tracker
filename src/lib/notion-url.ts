/**
 * Map an image src written in a page (relative, URL-encoded) to the asset route. The route gets the
 * page and the src as written, so it can check the viewer owns the page and the page uses the image.
 * Kept apart from notion.ts, which reads files, so the browser can use it.
 */
export function notionAssetUrl(pageFile: string, src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `/api/notion-asset?page=${encodeURIComponent(pageFile)}&src=${encodeURIComponent(src)}`;
}
