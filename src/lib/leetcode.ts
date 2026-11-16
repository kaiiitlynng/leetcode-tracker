export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function parseLeetCodeUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith("leetcode.com") && !host.endsWith("leetcode.cn")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const index = parts.findIndex((part) => part.toLowerCase() === "problems");
    const slug = index >= 0 ? parts[index + 1] : undefined;
    return slug ? slugify(slug) : null;
  } catch {
    return null;
  }
}
