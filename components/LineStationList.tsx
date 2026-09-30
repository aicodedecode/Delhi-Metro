"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { InterchangeChip } from "@/components/LineBadge";
import { IconChevronRight } from "@/components/icons";

export interface LineStationRow {
  id: string;
  name: string;
  terminus: boolean;
  interchange: boolean;
  interchangeDetail?: string;
}

export interface LineStationSegment {
  key: string;
  title: string | null;
  stations: LineStationRow[];
}

/**
 * Ordered station list for one line, with an interchange-only filter.
 * All rows come from the verified dataset; the filter only hides rows,
 * it never invents them.
 */
export default function LineStationList({ color, segments }: { color: string; segments: LineStationSegment[] }) {
  const [interchangeOnly, setInterchangeOnly] = useState(false);
  const total = useMemo(() => segments.reduce((n, s) => n + s.stations.length, 0), [segments]);
  const shown = useMemo(
    () => segments.reduce((n, s) => n + s.stations.filter((r) => !interchangeOnly || r.interchange).length, 0),
    [segments, interchangeOnly]
  );

  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={interchangeOnly}
          onClick={() => setInterchangeOnly((v) => !v)}
          className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-line-soft bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
        >
          <span className={`flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors ${interchangeOnly ? "bg-accent" : "bg-ink-mute/30"}`}>
            <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${interchangeOnly ? "translate-x-5" : "translate-x-0"}`} />
          </span>
          Interchange stations only
        </button>
        <span className="text-[13px] tabular-nums text-ink-mute" role="status">
          {shown} of {total} stations shown
        </span>
      </div>

      {segments.map((seg) => {
        const rows = seg.stations.filter((r) => !interchangeOnly || r.interchange);
        return (
          <section key={seg.key} aria-label="Stations on this line" className="mt-5">
            {seg.title ? <h2 className="mb-2 text-[17px] font-semibold text-ink">{seg.title}</h2> : null}
            {rows.length > 0 ? (
              <ol className="divide-y divide-line-soft/60 border-y border-line-soft">
                {rows.map((r, i) => (
                  <li key={`${r.id}-${i}`}>
                    <Link href={`/stations/${r.id}`} className="flex min-h-[52px] items-center gap-3 py-2 transition-colors hover:bg-surface">
                      <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: color }} />
                      <span className="font-medium text-ink">{r.name}</span>
                      {r.terminus ? <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Terminus</span> : null}
                      {r.interchange ? <InterchangeChip detail={r.interchangeDetail} /> : null}
                      <span aria-hidden="true" className="ml-auto shrink-0 text-ink-mute/50"><IconChevronRight size={15} /></span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="border-y border-line-soft py-3 text-sm text-ink-mute">No interchange stations in this part of the line. Turn the filter off to see every station.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
