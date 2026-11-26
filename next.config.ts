import type { NextConfig } from "next";

// Notion pages are read from disk at request time, which build tracing can't see,
// so ship them with the routes that read them.
const notionPages = ["./notion-data/tracker/**/*"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Reuse a page fetched in the last 30 s when switching back to it. Server actions that change data
    // call revalidatePath, which clears this cache, so edits always show.
    staleTimes: { dynamic: 30 },
  },
  outputFileTracingIncludes: {
    "/": notionPages,
    "/problems": notionPages,
    "/problems/[slug]": notionPages,
    "/api/notion-asset": notionPages,
  },
};

export default nextConfig;
