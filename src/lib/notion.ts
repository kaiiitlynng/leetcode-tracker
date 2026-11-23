import fs from "node:fs/promises";
import path from "node:path";

export const NOTION_ROOT = path.join(process.cwd(), "notion-data");

/** Database columns Notion writes as `Key: value` lines under the page title. */
const PROPERTY_KEYS = ["Pattern", "Level", "Status", "Last Reviewed", "Next Review"] as const;

export interface NotionPage {
  /** Path relative to notion-data/, e.g. `tracker/Two Sum 36ed….md`. */
  file: string;
  title: string;
  properties: { key: string; value: string }[];
  body: string;
  /** 32-char hex page id from the filename, used to link back to notion.so. */
  notionId: string | null;
}

/** Resolve a notion-data-relative path, refusing anything that escapes the folder. */
export function resolveNotionPath(relative: string): string | null {
  const absolute = path.resolve(NOTION_ROOT, relative);
  return absolute.startsWith(NOTION_ROOT + path.sep) ? absolute : null;
}

export function parseNotionPage(file: string, source: string): NotionPage {
  const lines = source.replace(/^﻿/, "").split("\n");
  let index = 0;
  const title = lines[0]?.startsWith("# ") ? lines[index++].slice(2).trim() : path.basename(file, ".md");
  while (lines[index]?.trim() === "") index++;

  const properties: NotionPage["properties"] = [];
  for (; index < lines.length; index++) {
    const match = lines[index].match(/^([^:]+): (.*)$/);
    if (!match || !PROPERTY_KEYS.includes(match[1] as (typeof PROPERTY_KEYS)[number])) break;
    properties.push({ key: match[1], value: match[2].trim() });
  }

  return {
    file,
    title,
    properties,
    body: lines.slice(index).join("\n").trim(),
    notionId: path.basename(file, ".md").match(/([0-9a-f]{32})$/)?.[1] ?? null,
  };
}

export async function readNotionPage(file: string): Promise<NotionPage | null> {
  const absolute = resolveNotionPath(file);
  if (!absolute || !absolute.endsWith(".md")) return null;
  try {
    return parseNotionPage(file, await fs.readFile(absolute, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Map an image src written in a page (relative, URL-encoded) to the asset route. The route gets the
 * page and the src as written, so it can check the viewer owns the page and the page uses the image.
 */
export function notionAssetUrl(pageFile: string, src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `/api/notion-asset?page=${encodeURIComponent(pageFile)}&src=${encodeURIComponent(src)}`;
}

/** notion-data-relative path of an image src as written in `pageFile`. */
export function resolveAssetPath(pageFile: string, src: string): string {
  return path.posix.join(path.posix.dirname(pageFile), decodeURIComponent(src));
}
