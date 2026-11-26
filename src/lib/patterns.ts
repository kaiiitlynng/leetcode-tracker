export type PatternColor = "gray" | "brown" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "pink" | "red";

const colors: Record<string, PatternColor> = {
  "array": "blue",
  "arrays": "blue",
  "hash map": "blue",
  "two pointers": "teal",
  "sliding window": "yellow",
  "stack": "orange",
  "binary search": "purple",
  "linked list": "pink",
  "trees": "green",
  "tries": "green",
  "heap / priority queue": "red",
  "backtracking": "red",
  "graphs": "brown",
  "advanced graphs": "brown",
  "dynamic programming": "orange",
  "1d dynamic programming": "orange",
  "2d dynamic programming": "orange",
  "greedy": "yellow",
  "intervals": "teal",
  "math & geometry": "gray",
  "bit manipulation": "purple",
};

export function patternColor(pattern: string | null | undefined): PatternColor {
  return (pattern && colors[pattern.trim().toLowerCase()]) || "gray";
}

/** Pattern choices offered when logging, in the order they are usually studied. */
export const PATTERNS = [
  "Array", "Hash Map", "Two Pointers", "Sliding Window", "Stack", "Binary Search", "Linked List", "Trees", "Tries",
  "Heap / Priority Queue", "Backtracking", "Graphs", "Advanced Graphs", "1D Dynamic Programming", "2D Dynamic Programming",
  "Greedy", "Intervals", "Math & Geometry", "Bit Manipulation",
];

/** Show stored patterns with the standard spelling when they match one, case-insensitively. */
export function canonicalPattern(pattern: string): string {
  return PATTERNS.find((option) => option.toLowerCase() === pattern.trim().toLowerCase()) ?? pattern.trim();
}
