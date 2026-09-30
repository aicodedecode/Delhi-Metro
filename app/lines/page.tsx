import type { Metadata } from "next";
import Link from "next/link";
import { lines, stations } from "@/lib/data";
import { ogBase } from "@/lib/seo";
import { lineInk } from "@/components/LineBadge";
import { IconChevronRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "All Lines",
  description: "All 13 lines of the Delhi NCR metro network: Delhi Metro, Noida Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro, with colours, terminals, lengths and station counts.",
  alternates: { canonical: "/lines" },
  openGraph: { ...ogBase, title: "All Lines", description: "Every line, every operator: colours, terminals, lengths and station counts.", url: "/lines" },
};

const OPERATOR_GROUPS: { operator: string; heading: string }[] = [
  { operator: "DMRC", heading: "Delhi Metro (DMRC)" },
  { operator: "NMRC", heading: "Noida Metro (NMRC)" },
  { operator: "NCRTC", heading: "NCRTC" },
  { operator: "Rapid Metro", heading: "Rapid Metro Gurugram" },
];

function km(kmValue: number): string {
  return kmValue.toFixed(1).replace(/\.0$/, "");
}

export default function LinesPage() {
  const networkKm = lines.reduce((sum, l) => sum + l.lengthKm, 0);
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">Lines</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-mute">
        {lines.length} lines, {stations.length} stations, about {Math.round(networkKm)} km of network, run by four operators.
        Colours are the official line colours; the line name is always shown in text too.
      </p>
      <dl className="mt-4 flex flex-wrap gap-2" aria-label="Network totals">
        <div className="rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[13px] font-medium tabular-nums text-ink">{lines.length} <span className="font-normal text-ink-mute">lines</span></div>
        <div className="rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[13px] font-medium tabular-nums text-ink">{stations.length} <span className="font-normal text-ink-mute">stations</span></div>
        <div className="rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[13px] font-medium tabular-nums text-ink">{Math.round(networkKm)} km <span className="font-normal text-ink-mute">of network</span></div>
      </dl>

      {OPERATOR_GROUPS.map((group) => {
        const groupLines = lines.filter((l) => l.operator === group.operator);
        if (groupLines.length === 0) return null;
        return (
          <section key={group.operator} aria-label={group.heading} className="mt-7">
            <h2 className="text-[17px] font-semibold text-ink">{group.heading}</h2>
            <ul className="mt-1 divide-y divide-line-soft/70 border-y border-line-soft">
              {groupLines.map((line) => (
                <li key={line.id}>
                  <Link href={`/lines/${line.id}`} className="flex min-h-[64px] items-center gap-3 py-2 transition-colors hover:bg-surface">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl font-extrabold ring-1 ring-ink/20"
                      style={{ backgroundColor: line.color, color: lineInk(line.color) }}
                      aria-hidden="true"
                    >
                      {line.number ?? ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{line.name}</span>
                      <span className="block truncate text-[13px] tabular-nums text-ink-mute">{line.terminals.join(" to ")} · {line.stationCount} stops · {km(line.lengthKm)} km</span>
                    </span>
                    <span aria-hidden="true" className="ml-auto shrink-0 text-ink-mute/50"><IconChevronRight size={16} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="mt-6 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        The Magenta Line currently runs as two separate segments (Krishna Park Extension to Botanical Garden,
        and Deepali Chowk to Majlis Park). The connecting section is under construction, so routes never pass
        through that gap. The Golden Line is not yet operational and is not included.
      </p>
    </div>
  );
}
