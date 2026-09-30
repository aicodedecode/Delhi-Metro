import { getLine } from "@/lib/data";
import { IconRepeat } from "@/components/icons";

/** Line colour dot + line name — the name is always shown so meaning never
 * depends on colour alone (accessibility). */
export function LineBadge({ lineId, size = "md" }: { lineId: string; size?: "sm" | "md" }) {
  const line = getLine(lineId);
  if (!line) return null;
  const dot = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const text = size === "sm" ? "text-[11px]" : "text-xs";
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
      <span aria-hidden="true" className={`${dot} shrink-0 rounded-full ring-1 ring-ink/20`} style={{ backgroundColor: line.color }} />
      <span className={text}>{line.name}</span>
    </span>
  );
}

/** Interchange chip — saffron-tint pill with a real icon, never emoji. */
export function InterchangeChip({ label = "Interchange", detail }: { label?: string; detail?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-deep">
      <IconRepeat size={12} />
      {label}
      {detail ? <span className="font-medium"> {detail}</span> : null}
    </span>
  );
}

/** Text colour that stays readable on a line's colour chip. */
export function lineInk(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0a2a5e" : "#ffffff";
}

// Backward-compatible alias (previous name).
export const lineTextColor = lineInk;
