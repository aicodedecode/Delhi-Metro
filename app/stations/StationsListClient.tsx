"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { stations } from "@/lib/data";
import { searchStations } from "@/lib/search";
import { LineBadge, InterchangeChip } from "@/components/LineBadge";
import { IconSearch, IconArrowRight } from "@/components/icons";

export default function StationsListClient() {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchStations(q, 243) : stations.slice().sort((a, b) => a.name.localeCompare(b.name))), [q]);
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">Stations</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-mute">243 stations, 9 corridors. Tap a station to see its lines and neighbours.</p>
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
      {results.length === 0 ? <p className="mt-4 text-sm text-ink-mute">No station found. Try a shorter or different spelling.</p> : null}
    </div>
  );
}
