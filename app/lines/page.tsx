import type { Metadata } from "next";
import Link from "next/link";
import { lines } from "@/lib/data";
import { lineInk } from "@/components/LineBadge";
import { IconChevronRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "All Lines",
  description: "All 9 Delhi Metro corridors with colours, terminals, lengths and station counts: Red, Yellow, Blue, Green, Violet, Airport Express, Pink, Magenta and Grey lines.",
  alternates: { canonical: "/lines" },
};

export default function LinesPage() {
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">Lines</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-mute">9 corridors, 243 stations. Colours are the official line colours; the line name is always shown in text too.</p>
      <ul className="mt-4 divide-y divide-line-soft/70 border-y border-line-soft">
        {lines.map((line) => (
          <li key={line.id}>
            <Link href={`/lines/${line.id}`} className="flex min-h-[64px] items-center gap-3 py-2">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-ink/20"
                style={{ backgroundColor: line.color, color: lineInk(line.color) }}
                aria-hidden="true"
              >
                {line.number}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{line.name}</span>
                <span className="block truncate text-[13px] tabular-nums text-ink-mute">{line.terminals.join(" to ")} · {line.stationCount} stations · {line.lengthKm.toFixed(1)} km</span>
              </span>
              <span aria-hidden="true" className="ml-auto shrink-0 text-ink-mute/50"><IconChevronRight size={16} /></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        The Magenta Line currently runs as two separate segments (Krishna Park Extension to Botanical Garden,
        and Deepali Chowk to Majlis Park). The connecting section is under construction, so routes never pass
        through that gap. The Golden Line is not yet operational and is not included.
      </p>
    </div>
  );
}
