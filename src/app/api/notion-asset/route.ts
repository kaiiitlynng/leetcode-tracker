import fs from "node:fs/promises";
import path from "node:path";
import { resolveNotionPath } from "@/lib/notion";

const IMAGE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(request: Request) {
  const relative = new URL(request.url).searchParams.get("path") ?? "";
  const absolute = resolveNotionPath(relative);
  const type = IMAGE_TYPES[path.extname(relative).toLowerCase()];
  if (!absolute || !type) return new Response("Not found", { status: 404 });
  try {
    const file = await fs.readFile(absolute);
    return new Response(file, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
