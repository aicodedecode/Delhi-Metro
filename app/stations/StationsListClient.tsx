"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { stations, lines } from "@/lib/data";
import { searchStations } from "@/lib/search";
import { LineBadge, InterchangeChip } from "@/components/LineBadge";
import { IconSearch, IconArrowRight } from "@/components/icons";

export default function StationsListClient() {
  const [q, setQ] = useState("");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [interchangeOnly, setInterchangeOnly] = useState(false);
  const results = useMemo(() => {
    const base = q.trim() ? searchStations(q, stations.length) : stations.slice().sort((a, b) => a.name.localeCompare(b.name));
    return base.filter((st) => (lineFilter === "all" || st.lines.includes(lineFilter)) && (!interchangeOnly || st.isInterchange));
  }, [q, lineFilter, interchangeOnly]);
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">Stations</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-mute">{stations.length} stations on {lines.length} lines. Tap a station to see its lines and neighbours. Filter by line, or show interchange stations only.</p>
      <div className="relative mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-mute" htmlFor="station-search">Search stations</label>
        <div className="flex items-center gap-2.5 rounded-xl border border-line-soft bg-surface px-3">
          <span className="shrink-0 text-ink-mute/60" aria-hidden="true"><IconSearch size={18} /></span>
          <input
            id="station-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try rajiv or hauz"
            className="min-h-[52px] w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-mute/70"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2.5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-mute" htmlFor="station-line-filter">Line</label>
          <select
            id="station-line-filter"
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="min-h-[48px] rounded-xl border border-line-soft bg-surface px-3 text-sm font-medium text-ink"
          >
            <option value="all">All lines</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
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
      </div>
      <p className="mt-3 text-[13px] tabular-nums text-ink-mute" role="status">{results.length} station{results.length === 1 ? "" : "s"} shown</p>
      <ul className="mt-1 divide-y divide-line-soft/60 border-y border-line-soft">
        {results.map((st) => (
          <li key={st.id}>
            <Link href={`/stations/${st.id}`} className="flex min-h-[56px] items-center gap-2 py-2">
              <span className="flex items-center gap-2 font-medium text-ink">{st.name}{st.isInterchange ? <InterchangeChip /> : null}</span>
              <span className="ml-auto flex shrink-0 gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
              <span className="text-ink-mute/50" aria-hidden="true"><IconArrowRight size={15} /></span>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 0 ? <p className="mt-4 text-sm text-ink-mute">No station matches. Try a different spelling, or clear the line and interchange filters.</p> : null}
    </div>
  );
}
