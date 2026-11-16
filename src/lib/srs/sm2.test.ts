import { describe, expect, it } from "vitest";
import { schedule } from "./sm2";
import { rebuildReviewState } from "./replay";

const now = new Date("2026-01-01T12:00:00Z");
const initial = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };

describe("schedule", () => {
  it("gives a first Good attempt an interval of 3", () => {
    expect(schedule(initial, 3, now).intervalDays).toBe(3);
  });
  it("progresses Good, Good, Good to 3, 7, and 18 days", () => {
    const one = schedule(initial, 3, now);
    const two = schedule(one, 3, now);
    const three = schedule(two, 3, now);
    expect([one.intervalDays, two.intervalDays, three.intervalDays]).toEqual([3, 7, 18]);
  });
  it("resets on a lapse", () => {
    const result = schedule(schedule(initial, 3, now), 1, now);
    expect(result).toMatchObject({ repetitions: 0, intervalDays: 1, lapses: 1 });
  });
  it("never drops ease below 1.3", () => {
    let result = initial;
    for (let i = 0; i < 20; i++) result = schedule(result, 2, now);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

it("replays attempts in chronological order", () => {
  const attempts = [
    { attemptedAt: new Date("2026-01-03"), rating: 3 },
    { attemptedAt: new Date("2026-01-01"), rating: 3 },
  ];
  expect(rebuildReviewState(attempts)).toEqual(
    rebuildReviewState([...attempts].reverse()),
  );
});
