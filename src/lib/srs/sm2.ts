import { addDays, startOfDay } from "date-fns";

export type Rating = 1 | 2 | 3 | 4;

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export function schedule(
  prev: SrsState,
  rating: Rating,
  now: Date,
): SrsState & { dueAt: Date } {
  let { easeFactor, intervalDays, repetitions, lapses } = prev;
  if (rating === 1) {
    repetitions = 0;
    lapses += 1;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = rating === 2 ? 1 : rating === 3 ? 3 : 5;
    else if (repetitions === 2) intervalDays = rating === 2 ? 4 : rating === 3 ? 7 : 12;
    else {
      const multiplier = rating === 2 ? 1.2 : rating === 3 ? easeFactor : easeFactor * 1.3;
      intervalDays = Math.round(intervalDays * multiplier);
    }
    if (rating === 2) easeFactor = Math.max(1.3, easeFactor - 0.15);
    if (rating === 4) easeFactor += 0.15;
  }
  intervalDays = Math.min(intervalDays, 180);
  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses,
    dueAt: startOfDay(addDays(now, intervalDays)),
  };
}
