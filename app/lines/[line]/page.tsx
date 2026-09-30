import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLine, lines, segments, stationById } from "@/lib/data";
import { lineInk, InterchangeChip } from "@/components/LineBadge";
import { IconChevronRight } from "@/components/icons";

export function generateStaticParams() { return lines.map((l) => ({ line: l.id })); }

export async function generateMetadata({ params }: { params: Promise<{ line: string }> }): Promise<Metadata> {
  const { line } = await params;
  const l = getLine(line);
  if (!l) return { title: "Line not found" };
  return {
    title: `${l.name}`,
    description: `${l.name} (Line ${l.number}): ${l.terminals.join(" to ")}, ${l.stationCount} stations, ${l.lengthKm} km. Full ordered station list.`,
    alternates: { canonical: `/lines/${l.id}` },
    openGraph: { title: l.name, description: `${l.terminals.join(" to ")} · ${l.stationCount} stations`, url: `/lines/${l.id}` },
  };
}

export default async function LinePage({ params }: { params: Promise<{ line: string }> }) {
  const { line } = await params;
  const l = getLine(line);
  if (!l) notFound();
  const fg = lineInk(l.color);

  return (
    <article>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-ink-mute">
        <Link href="/lines" className="underline underline-offset-2">Lines</Link>
        <span aria-hidden="true"><IconChevronRight size={13} /></span>
        <span aria-current="page" className="font-medium text-ink-soft">{l.name}</span>
      </nav>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-1 ring-ink/20" style={{ backgroundColor: l.color, color: fg }} aria-hidden="true">{l.number}</span>
        <div>
          <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{l.name}</h1>
          <p className="text-[13px] tabular-nums text-ink-mute">{l.terminals.join(" to ")} · {l.stationCount} stations · {l.lengthKm.toFixed(1)} km</p>
        </div>
      </div>
      <p className="mt-2 max-w-prose text-sm text-ink-mute">{l.operatingHours}</p>

      {l.segments.map((segId) => {
        const seg = segments[segId];
        const segLabel = segId.replace(/([A-Z])/g, " $1");
        return (
          <section key={segId} aria-label={`${l.name} stations`} className="mt-6">
            {l.segments.length > 1 ? <h2 className="mb-2 text-[17px] font-semibold capitalize text-ink">{segLabel} segment</h2> : null}
            <ol className="divide-y divide-line-soft/60 border-y border-line-soft">
              {seg.stations.map((sid, i) => {
                const st = stationById.get(sid);
                if (!st) return null;
                return (
                  <li key={sid + i}>
                    <Link href={`/stations/${sid}`} className="flex min-h-[52px] items-center gap-3 py-2">
                      <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: l.color }} />
                      <span className="font-medium text-ink">{st.name}</span>
                      {i === 0 || i === seg.stations.length - 1 ? <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Terminus</span> : null}
                      {st.isInterchange ? <InterchangeChip detail={st.lines.length > 1 ? st.lines.filter((x) => x !== l.id).map((x) => getLine(x)?.colorName ?? x).join(", ") : undefined} /> : null}
                      <span aria-hidden="true" className="ml-auto shrink-0 text-ink-mute/50"><IconChevronRight size={15} /></span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <p className="mt-4 max-w-prose text-[13px] text-ink-mute">Station order is the operational order verified from published line data (October 2026). Soorghat (Pink Line) is built but not open and is intentionally not listed.</p>
    </article>
  );
}
