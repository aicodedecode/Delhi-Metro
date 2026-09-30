"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { stations } from "@/lib/data";
import { searchStations } from "@/lib/search";
import { LineBadge } from "@/components/LineBadge";

export default function StationsListClient() {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchStations(q, 243) : stations.slice().sort((a, b) => a.name.localeCompare(b.name))), [q]);
  return (
    <div>
      <h1 className="text-xl font-extrabold text-slate-900">Delhi Metro Stations</h1>
      <p className="text-sm text-slate-500">243 stations · 9 corridors. Tap a station for lines, neighbours and interchange details.</p>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="station-search">Search stations</label>
      <input id="station-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — try “rajiv” or “hauz”" className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200" autoComplete="off" />
      <p className="mt-2 text-xs text-slate-500" role="status">{results.length} station{results.length === 1 ? "" : "s"} shown</p>
      <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {results.map((st) => (
          <li key={st.id}>
            <Link href={`/stations/${st.id}`} className="flex min-h-[52px] items-center justify-between gap-2 px-3 py-2 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500">
              <span className="font-medium text-slate-900">{st.name}{st.isInterchange ? <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">🔄 Interchange</span> : null}</span>
              <span className="flex shrink-0 flex-wrap justify-end gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 0 ? <p className="mt-3 text-sm text-slate-500">No station found. Try a shorter or different spelling.</p> : null}
    </div>
  );
}
