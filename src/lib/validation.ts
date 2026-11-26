import { z } from "zod";

export const outcomeSchema = z.enum([
  "SOLVED",
  "SOLVED_WITH_HINT",
  "LOOKED_AT_SOLUTION",
  "FAILED",
]);

export const problemInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  leetcodeUrl: z.string().url().optional(),
  neetcodeUrl: z.string().url().optional(),
  lcNumber: z.number().int().positive().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  topics: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  notes: z.string().optional(),
  lists: z.array(z.string()).default([]),
});

/** Empty string clears a link. */
const optionalLink = z.union([z.literal(""), z.string().url()]).transform((value) => value || null);
export const problemLinksSchema = z.object({ leetcodeUrl: optionalLink, neetcodeUrl: optionalLink });

export const attemptInputSchema = z.object({
  problemId: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  /** A LeetCode URL typed into the log form; stored as the problem's LeetCode link. */
  url: z.string().url().optional(),
  lcNumber: z.number().int().positive().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  topics: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  lists: z.array(z.string()).default([]),
  attemptedAt: z.coerce.date(),
  outcome: outcomeSchema,
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  timeMinutes: z.number().int().nonnegative().optional(),
  approach: z.string().optional(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  mistakes: z.string().optional(),
  code: z.string().optional(),
  isReview: z.boolean().default(false),
  source: z.enum(["manual", "notion-data", "upload"]).default("manual"),
});

const clearableText = z.string().nullable().optional();
/** Edits to a saved attempt. No defaults, so fields missing from the patch stay untouched; null clears. */
export const attemptPatchSchema = z.object({
  outcome: outcomeSchema.optional(),
  rating: attemptInputSchema.shape.rating,
  timeMinutes: z.number().int().nonnegative().nullable().optional(),
  timeComplexity: clearableText,
  spaceComplexity: clearableText,
  approach: clearableText,
  mistakes: clearableText,
  code: clearableText,
});
