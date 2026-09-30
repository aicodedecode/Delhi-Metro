import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLine, lines, segments, stationById } from "@/lib/data";
import { lineTextColor } from "@/components/LineBadge";

export function generateStaticParams() { return lines.map((l) => ({ line: l.id })); }

export async function generateMetadata({ params }: { params: Promise<{ line: string }> }): Promise<Metadata> {
  const { line } = await params;
  const l = getLine(line);
  if (!l) return { title: "Line not found" };
  return {
    title: `${l.name} — Stations, Terminals & Route`,
    description: `${l.name} (Line ${l.number}): ${l.terminals.join(" to ")}, ${l.stationCount} stations, ${l.lengthKm} km. Full ordered station list.`,
    alternates: { canonical: `/lines/${l.id}` },
    openGraph: { title: l.name, description: `${l.terminals.join(" to ")} · ${l.stationCount} stations`, url: `/lines/${l.id}` },
  };
}

export default async function LinePage({ params }: { params: Promise<{ line: string }> }) {
  const { line } = await params;
  const l = getLine(line);
  if (!l) notFound();
  const fg = lineTextColor(l.color);

  return (
    <article>
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500"><Link href="/lines" className="underline">Lines</Link> <span aria-hidden="true">›</span> {l.name}</nav>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold" style={{ backgroundColor: l.color, color: fg }} aria-hidden="true">{l.number}</span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{l.name}</h1>
          <p className="text-sm text-slate-500">{l.terminals.join(" ↔ ")} · {l.stationCount} stations · {l.lengthKm} km</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{l.operatingHours}</p>

      {l.segments.map((segId) => {
        const seg = segments[segId];
        return (
          <section key={segId} aria-label={`${l.name} stations`} className="mt-4">
            {l.segments.length > 1 ? <h2 className="text-sm font-bold text-slate-700">{segId.replace(/([A-Z])/g, " $1")} segment</h2> : null}
            <ol className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {seg.stations.map((sid, i) => {
                const st = stationById.get(sid);
                if (!st) return null;
                return (
                  <li key={sid + i}>
                    <Link href={`/stations/${sid}`} className="flex min-h-[48px] items-center gap-3 px-3 py-2 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500">
                      <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/20" style={{ backgroundColor: l.color }} />
                      <span className="font-medium text-slate-900">{st.name}</span>
                      {i === 0 || i === seg.stations.length - 1 ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">Terminus</span> : null}
                      {st.isInterchange ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">🔄 Interchange{st.lines.length > 1 ? ": " + st.lines.filter((x) => x !== l.id).map((x) => getLine(x)?.colorName ?? x).join(", ") : ""}</span> : null}
                      <span aria-hidden="true" className="ml-auto text-slate-400">›</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <p className="mt-3 text-xs text-slate-500">Station order is the operational order verified from published line data (October 2026). Soorghat (Pink Line) is built but not open and is intentionally not listed.</p>
    </article>
  );
}
