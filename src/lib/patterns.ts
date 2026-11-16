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
