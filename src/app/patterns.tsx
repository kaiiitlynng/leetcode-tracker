import { patternColor } from "@/lib/patterns";

export default function PatternTags({ patterns, empty = false }: { patterns: string[]; empty?: boolean }) {
  if (!patterns.length) return empty ? <span className="dash">—</span> : null;
  return (
    <span className="pattern-list">
      {patterns.map((pattern) => <span className="pattern-pill" data-color={patternColor(pattern)} key={pattern}>{pattern}</span>)}
    </span>
  );
}
