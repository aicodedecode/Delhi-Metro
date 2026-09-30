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

const NAVY = "#0a2a5e";
const WHITE = "#ffffff";

/** WCAG relative luminance of a hex colour. */
function relLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const chan = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text colour that stays readable on a line's colour chip: whichever of the
 * brand navy or white gives the higher WCAG contrast ratio. (The old
 * brightness heuristic put white on sky-blue and pink chips at under 3:1.)
 */
export function lineInk(hex: string): string {
  return contrast(hex, NAVY) >= contrast(hex, WHITE) ? NAVY : WHITE;
}

// Backward-compatible alias (previous name).
export const lineTextColor = lineInk;
