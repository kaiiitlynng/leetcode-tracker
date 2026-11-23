import type { NextConfig } from "next";

// Notion pages are read from disk at request time, which build tracing can't see,
// so ship them with the routes that read them.
const notionPages = ["./notion-data/tracker/**/*"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/problems/[slug]": notionPages,
    "/api/notion-asset": notionPages,
  },
};

export default nextConfig;
