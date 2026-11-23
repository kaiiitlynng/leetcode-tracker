import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readNotionPage, resolveAssetPath, resolveNotionPath } from "@/lib/notion";

const IMAGE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const notFound = () => new Response("Not found", { status: 404 });

/** Serves an image only if the viewer owns an attempt whose Notion page embeds it. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const pageFile = params.get("page") ?? "";
  const src = params.get("src") ?? "";
  const owned = await db.attempt.findFirst({ where: { notionPage: pageFile, problem: { userId: user.id } }, select: { id: true } });
  if (!owned) return notFound();

  const page = await readNotionPage(pageFile);
  if (!page?.body.includes(`](${src})`)) return notFound();

  const relative = resolveAssetPath(pageFile, src);
  const absolute = resolveNotionPath(relative);
  const type = IMAGE_TYPES[path.extname(relative).toLowerCase()];
  if (!absolute || !type) return notFound();
  try {
    const file = await fs.readFile(absolute);
    return new Response(file, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
  } catch {
    return notFound();
  }
}
