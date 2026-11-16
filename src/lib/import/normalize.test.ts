import { describe, expect, it } from "vitest";
import { normalizeCsv } from "./normalize";

describe("normalizeCsv", () => {
  it("normalizes repeated rows into repeated attempts", () => {
    const rows = normalizeCsv("Name,Level,Status,Last Reviewed\nTwo Sum,Easy,Got It,\"May 1, 2026\"\nTwo Sum,Easy,Shaky,\"May 3, 2026\"\nTwo Sum,Easy,Missed,\"May 5, 2026\"");
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((row) => row.slug))).toEqual(new Set(["two-sum"]));
    expect(rows.map((row) => row.rating)).toEqual([4, 3, 1]);
  });
});
