import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStation, getLine, stations, segments, stationById, skywalkPartners, timingsData } from "@/lib/data";
import { LineBadge, InterchangeChip } from "@/components/LineBadge";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

export function generateStaticParams() {
  return stations.map((s) => ({ station: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ station: string }> }): Promise<Metadata> {
  const { station } = await params;
  const st = getStation(station);
  if (!st) return { title: "Station not found" };
  const lineNames = st.lines.map((l) => getLine(l)?.name ?? l).join(", ");
  return {
    title: `${st.name} Metro Station`,
    description: `${st.name} Delhi Metro station on the ${lineNames}. ${st.isInterchange ? "Interchange station. " : ""}Neighbours, connecting lines and journey planning.`,
    alternates: { canonical: `/stations/${st.id}` },
    openGraph: { title: `${st.name} Metro Station`, description: `${st.name} on the ${lineNames}. Plan routes to and from this station.`, url: `/stations/${st.id}` },
  };
}

function neighbours(stationId: string, lineId: string): { prev: string | null; next: string | null } {
  for (const seg of Object.values(segments)) {
    if (seg.line !== lineId) continue;
    const idx = seg.stations.indexOf(stationId);
    if (idx >= 0) {
      return { prev: idx > 0 ? seg.stations[idx - 1] : null, next: idx < seg.stations.length - 1 ? seg.stations[idx + 1] : null };
    }
  }
  return { prev: null, next: null };
}

export default async function StationPage({ params }: { params: Promise<{ station: string }> }) {
  const { station } = await params;
  const st = getStation(station);
  if (!st) notFound();
  const partners = skywalkPartners(st.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SubwayStation",
    name: `${st.name} Metro Station`,
    containedInPlace: { "@type": "City", name: "Delhi" },
    publicAccess: true,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-ink-mute">
        <Link href="/stations" className="underline underline-offset-2">Stations</Link>
        <span aria-hidden="true"><IconChevronRight size={13} /></span>
        <span aria-current="page" className="font-medium text-ink-soft">{st.name}</span>
      </nav>

      <h1 className="mt-1.5 font-display text-[30px] leading-tight tracking-tight text-ink">{st.name}</h1>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {st.lines.map((l) => <LineBadge key={l} lineId={l} />)}
        {st.isInterchange ? <InterchangeChip label="Interchange station" /> : null}
      </p>

      <div className="mt-6 divide-y divide-line-soft/70 border-y border-line-soft">
        <div className="py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Station code</h2>
          <p className="mt-1 text-[15px] text-ink-soft">{st.code ?? "Station code not published. Verify with DMRC."}</p>
        </div>

        <div className="py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Lines and neighbouring stations</h2>
          <div className="mt-2 space-y-3">
            {st.lines.map((l) => {
              const line = getLine(l); const nb = neighbours(st.id, l);
              return (
                <div key={l} className="text-[15px] text-ink-soft">
                  <LineBadge lineId={l} />
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-ink-soft">
                    {nb.prev
                      ? <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-flex"><IconChevronLeft size={14} /></span> <Link className="text-accent underline underline-offset-2" href={`/stations/${nb.prev}`}>{stationById.get(nb.prev)?.name}</Link></span>
                      : <span className="text-ink-mute">Terminus this side</span>}
                    <span aria-hidden="true" className="text-ink-mute/50">·</span>
                    {nb.next
                      ? <span className="inline-flex items-center gap-1"><Link className="text-accent underline underline-offset-2" href={`/stations/${nb.next}`}>{stationById.get(nb.next)?.name}</Link> <span aria-hidden="true" className="inline-flex"><IconChevronRight size={14} /></span></span>
                      : <span className="text-ink-mute">Terminus this side</span>}
                  </p>
                </div>
              );
            })}
            {partners.map((p) => (
              <p key={p} className="text-[15px] text-ink-soft">Skywalk connection to <Link className="text-accent underline underline-offset-2" href={`/stations/${p}`}>{stationById.get(p)?.name}</Link> (paid-area footbridge)</p>
            ))}
          </div>
        </div>

        <div className="py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Train timings</h2>
          <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
            General network hours: approx. {timingsData.generalOperatingHours.firstTrainApprox} to {timingsData.generalOperatingHours.lastTrainApprox}.
            First and last train times: verify with DMRC. Per-station times are not published here because they could not be verified.
          </p>
        </div>

        <div className="py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Facilities, parking, feeder buses, accessibility</h2>
          <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
            Not verified. Check at the station or on <a className="font-medium text-accent underline underline-offset-2" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a> rather than relying on a guess.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href={`/route?from=${st.id}`} className="flex min-h-[48px] items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-deep">Plan a journey from here</Link>
        <Link href={`/route?to=${st.id}`} className="flex min-h-[48px] items-center rounded-xl border border-line-soft bg-surface px-4 text-sm font-semibold text-ink">Plan a journey to here</Link>
      </div>
    </article>
  );
}
