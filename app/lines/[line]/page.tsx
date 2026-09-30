import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLine, lines, segments, stationById } from "@/lib/data";
import { ogBase, siteUrl } from "@/lib/seo";
import { lineInk } from "@/components/LineBadge";
import LineStationList from "@/components/LineStationList";
import { IconChevronRight } from "@/components/icons";

export function generateStaticParams() { return lines.map((l) => ({ line: l.id })); }

const OPERATOR_FULL: Record<string, string> = {
  DMRC: "Delhi Metro Rail Corporation",
  NMRC: "Noida Metro Rail Corporation",
  NCRTC: "National Capital Region Transport Corporation",
  "Rapid Metro": "Rapid Metro, Gurugram (HMRTC)",
};

export async function generateMetadata({ params }: { params: Promise<{ line: string }> }): Promise<Metadata> {
  const { line } = await params;
  const l = getLine(line);
  if (!l) return { title: "Line not found" };
  const numberPart = l.number ? ` (Line ${l.number})` : "";
  const desc = `${l.name}${numberPart}: ${l.terminals.join(" to ")}, ${l.stationCount} stations, ${l.lengthKm} km, run by ${OPERATOR_FULL[l.operator] ?? l.operator}. Full ordered station list.`;
  return {
    title: `${l.name}`,
    description: desc,
    alternates: { canonical: `/lines/${l.id}` },
    openGraph: { ...ogBase, title: l.name, description: `${l.terminals.join(" to ")} · ${l.stationCount} stations · run by ${l.operator}`, url: `/lines/${l.id}` },
  };
}

export default async function LinePage({ params }: { params: Promise<{ line: string }> }) {
  const { line } = await params;
  const l = getLine(line);
  if (!l) notFound();
  const fg = lineInk(l.color);
  const siblings = lines.filter((x) => x.operator === l.operator && x.id !== l.id);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Lines", item: `${siteUrl}/lines` },
      { "@type": "ListItem", position: 2, name: l.name, item: `${siteUrl}/lines/${l.id}` },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-ink-mute">
        <Link href="/lines" className="underline underline-offset-2">Lines</Link>
        <span aria-hidden="true"><IconChevronRight size={13} /></span>
        <span aria-current="page" className="font-medium text-ink-soft">{l.name}</span>
      </nav>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold ring-1 ring-ink/20" style={{ backgroundColor: l.color, color: fg }} aria-hidden="true">{l.number ?? ""}</span>
        <div>
          <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{l.name}</h1>
          <p className="text-[13px] tabular-nums text-ink-mute">{l.terminals.join(" to ")} · {l.stationCount} stations · {l.lengthKm.toFixed(1)} km</p>
        </div>
      </div>
      <p className="mt-2 max-w-prose text-sm text-ink-mute">Run by {OPERATOR_FULL[l.operator] ?? l.operator}. {l.operatingHours}</p>

      <LineStationList
        color={l.color}
        segments={l.segments.map((segId) => {
          const seg = segments[segId];
          const segLabel = segId.replace(/([A-Z])/g, " $1");
          const segTitle = (segLabel.charAt(0).toUpperCase() + segLabel.slice(1)) + " segment";
          return {
            key: segId,
            title: l.segments.length > 1 ? segTitle : null,
            stations: seg.stations.flatMap((sid, i) => {
              const st = stationById.get(sid);
              if (!st) return [];
              return [{
                id: sid,
                name: st.name,
                terminus: i === 0 || i === seg.stations.length - 1,
                interchange: st.isInterchange,
                interchangeDetail: st.isInterchange && st.lines.length > 1 ? st.lines.filter((x) => x !== l.id).map((x) => getLine(x)?.colorName ?? x).join(", ") : undefined,
              }];
            }),
          };
        })}
      />

      <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink-mute">
        <p>Station order is the operational order verified from published line data (October 2026).</p>
        {l.stationCountNote ? <p>{l.stationCountNote}.</p> : null}
        {l.id === "pink" ? <p>Soorghat (Pink Line) is built but not open and is intentionally not listed.</p> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/" className="flex min-h-[48px] items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-deep">Plan a journey on this line</Link>
        <Link href="/lines" className="flex min-h-[48px] items-center rounded-xl border border-line-soft bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper">All lines</Link>
      </div>

      {siblings.length ? (
        <nav aria-label={`More lines by ${l.operator}`} className="mt-8 border-t border-line-soft pt-4">
          <h2 className="text-[15px] font-semibold text-ink">More lines by {l.operator}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link href={`/lines/${s.id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line-soft bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-paper">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: s.color }} />
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}
