import { describe, expect, it } from "vitest";
import { parseLeetCodeUrl, slugify } from "./leetcode";

describe("parseLeetCodeUrl", () => {
  it("supports leetcode.com and strips suffixes/query strings", () => {
    expect(parseLeetCodeUrl("https://leetcode.com/problems/two-sum/description/?x=1")).toBe("two-sum");
    expect(parseLeetCodeUrl("https://leetcode.cn/problems/two-sum/")).toBe("two-sum");
    expect(parseLeetCodeUrl("https://example.com/problems/two-sum")).toBeNull();
  });
  it("slugifies titles", () => expect(slugify("Best Time to Buy & Sell Stock")).toBe("best-time-to-buy-sell-stock"));
});
