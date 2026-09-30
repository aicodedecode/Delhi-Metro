import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStation, getLine, stations, segments, stationById, skywalkPartners, timingsData } from "@/lib/data";
import { LineBadge } from "@/components/LineBadge";

export function generateStaticParams() {
  return stations.map((s) => ({ station: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ station: string }> }): Promise<Metadata> {
  const { station } = await params;
  const st = getStation(station);
  if (!st) return { title: "Station not found" };
  const lineNames = st.lines.map((l) => getLine(l)?.name ?? l).join(", ");
  return {
    title: `${st.name} Metro Station — Lines, Neighbours & Route Info`,
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
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href="/stations" className="underline">Stations</Link> <span aria-hidden="true">›</span> {st.name}
      </nav>
      <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{st.name}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {st.lines.map((l) => <LineBadge key={l} lineId={l} />)}
        {st.isInterchange ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">🔄 Interchange station</span> : <span className="text-xs font-medium text-slate-500">Regular station</span>}
      </p>

      <dl className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Station code</dt>
          <dd className="mt-0.5 text-sm text-slate-700">{st.code ?? "Station code not published — verify with DMRC"}</dd>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lines &amp; neighbouring stations</dt>
          <dd className="mt-1 space-y-2">
            {st.lines.map((l) => {
              const line = getLine(l); const nb = neighbours(st.id, l);
              return (
                <div key={l} className="text-sm text-slate-700">
                  <LineBadge lineId={l} />{" "}
                  <span className="text-slate-500">(towards {line?.terminals.join(" / ")})</span>
                  <div className="mt-0.5 pl-5 text-slate-600">
                    {nb.prev ? <>← <Link className="text-sky-700 underline" href={`/stations/${nb.prev}`}>{stationById.get(nb.prev)?.name}</Link></> : <span>Terminus this side</span>}
                    {"  ·  "}
                    {nb.next ? <><Link className="text-sky-700 underline" href={`/stations/${nb.next}`}>{stationById.get(nb.next)?.name}</Link> →</> : <span>Terminus this side</span>}
                  </div>
                </div>
              );
            })}
            {partners.map((p) => (
              <p key={p} className="text-sm text-slate-700">↔ Skywalk connection to <Link className="text-sky-700 underline" href={`/stations/${p}`}>{stationById.get(p)?.name}</Link> (paid-area footbridge)</p>
            ))}
          </dd>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Train timings</dt>
          <dd className="mt-0.5 text-sm leading-relaxed text-slate-700">
            General network hours: approx. {timingsData.generalOperatingHours.firstTrainApprox}–{timingsData.generalOperatingHours.lastTrainApprox}.<br />
            <span className="font-medium text-amber-700">First/last train times: verify with DMRC</span> — per-station times are not published here because they could not be verified.
          </dd>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Facilities · parking · feeder buses · accessibility</dt>
          <dd className="mt-0.5 text-sm text-slate-700">Information not verified — please check at the station or on <a className="font-medium text-sky-700 underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a>. Nothing is listed here rather than guessed.</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/route?from=${st.id}`} className="flex min-h-[48px] items-center rounded-xl bg-[#0b2a5b] px-4 text-sm font-bold text-white hover:bg-[#123a7d]">Plan a journey from here →</Link>
        <Link href={`/route?to=${st.id}`} className="flex min-h-[48px] items-center rounded-xl bg-white px-4 text-sm font-bold text-[#0b2a5b] ring-1 ring-slate-300 hover:bg-slate-50">Plan a journey to here →</Link>
      </div>
    </article>
  );
}
