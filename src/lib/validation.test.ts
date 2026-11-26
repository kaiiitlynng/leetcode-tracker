import { describe, expect, it } from "vitest";
import { attemptPatchSchema } from "./validation";

describe("attemptPatchSchema", () => {
  it("adds nothing that was not in the patch", () => {
    expect(attemptPatchSchema.parse({ rating: 2 })).toEqual({ rating: 2 });
  });
  it("accepts null to clear a field", () => {
    expect(attemptPatchSchema.parse({ code: null, timeMinutes: null })).toEqual({ code: null, timeMinutes: null });
  });
  it("drops fields that belong to the problem or the import", () => {
    expect(attemptPatchSchema.parse({ topics: ["Array"], source: "manual", problemId: "x" })).toEqual({});
  });
  it("rejects a null outcome", () => {
    expect(attemptPatchSchema.safeParse({ outcome: null }).success).toBe(false);
  });
});
