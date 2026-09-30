import { getLine } from "@/lib/data";

/** Line colour dot + line name — the name is always shown so meaning never
 * depends on colour alone (accessibility). */
export function LineBadge({ lineId, size = "md" }: { lineId: string; size?: "sm" | "md" }) {
  const line = getLine(lineId);
  if (!line) return null;
  const dot = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const text = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
      <span aria-hidden="true" className={`${dot} shrink-0 rounded-full ring-1 ring-black/20`} style={{ backgroundColor: line.color }} />
      <span className={text}>{line.name}</span>
    </span>
  );
}

export function lineTextColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#1a1a1a" : "#ffffff";
}
