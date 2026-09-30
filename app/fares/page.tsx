import type { Metadata } from "next";
import Link from "next/link";
import { faresData, stationById } from "@/lib/data";
import { FARE_FALLBACK } from "@/lib/fare";
import { ogBase, siteUrl } from "@/lib/seo";
import { IconChevronRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Metro fares",
  description: "Delhi Metro (DMRC) fare slabs by distance, effective 25 August 2025, with Monday to Saturday and Sunday or holiday fares, smart card discounts, and verified Airport Express fares from New Delhi.",
  alternates: { canonical: "/fares" },
  openGraph: { ...ogBase, title: "Metro fares", description: "DMRC fare slabs effective 25 August 2025, smart card discounts and verified Airport Express fares from New Delhi.", url: "/fares" },
};

function slabLabel(minKm: number, maxKm: number | null): string {
  if (maxKm === null) return `Over ${minKm} km`;
  if (minKm === 0) return `Up to ${maxKm} km`;
  return `${minKm} to ${maxKm} km`;
}

export default function FaresPage() {
  const slabs = faresData.regularLines.slabs;
  const sc = faresData.smartCard;
  const anchors = Object.entries(faresData.airportExpress.anchorsFromNewDelhi);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Fares", item: `${siteUrl}/fares` },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px] text-ink-mute">
        <Link href="/" className="underline underline-offset-2">Home</Link>
        <span aria-hidden="true"><IconChevronRight size={13} /></span>
        <span aria-current="page" className="font-medium text-ink-soft">Fares</span>
      </nav>

      <h1 className="mt-2 font-display text-[32px] leading-tight tracking-tight text-ink">Metro fares</h1>
      <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
        Delhi Metro (DMRC) charges by the distance travelled on the shortest route. The slabs below
        took effect on 25 August 2025. This page covers Delhi Metro only; the other operators set
        their own fares, covered at the end.
      </p>

      <h2 className="mt-7 text-[17px] font-semibold text-ink">Delhi Metro fare slabs</h2>
      <div className="mt-2 overflow-x-auto rounded-xl border border-line-soft bg-surface">
        <table className="w-full text-left text-[15px]">
          <caption className="sr-only">Delhi Metro fares by distance travelled, effective 25 August 2025</caption>
          <thead>
            <tr className="border-b border-line-soft text-xs font-semibold uppercase tracking-wider text-ink-mute">
              <th scope="col" className="px-4 py-2.5">Distance travelled</th>
              <th scope="col" className="px-4 py-2.5">Monday to Saturday</th>
              <th scope="col" className="px-4 py-2.5">Sunday and holidays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft/60">
            {slabs.map((s) => (
              <tr key={s.minKm}>
                <th scope="row" className="px-4 py-2.5 font-medium text-ink">{slabLabel(s.minKm, s.maxKm)}</th>
                <td className="px-4 py-2.5 tabular-nums text-ink">₹{s.fareWeekday}</td>
                <td className="px-4 py-2.5 tabular-nums text-ink">₹{s.fareSunday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        The journey planner works out which slab a trip falls in and shows the fare in the route
        result. Use the weekday or Sunday toggle there to match the day you travel.
      </p>

      <h2 className="mt-7 text-[17px] font-semibold text-ink">Smart card</h2>
      <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
        A Delhi Metro smart card takes {sc.discountPercent}% off every journey. There is a further{" "}
        {sc.discountPercent}% off outside peak hours: {sc.offPeakWindows.join(", ")}. Turn on the
        smart card toggle in the planner to see the discounted estimate for a journey.
      </p>

      <h2 className="mt-7 text-[17px] font-semibold text-ink">Airport Express</h2>
      <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
        The Airport Express charges its own fares rather than the slabs above. Only the fares from
        New Delhi in this table could be verified, so only they are published here.
      </p>
      <div className="mt-2 overflow-x-auto rounded-xl border border-line-soft bg-surface">
        <table className="w-full text-left text-[15px]">
          <caption className="sr-only">Verified Airport Express fares from New Delhi</caption>
          <thead>
            <tr className="border-b border-line-soft text-xs font-semibold uppercase tracking-wider text-ink-mute">
              <th scope="col" className="px-4 py-2.5">From New Delhi to</th>
              <th scope="col" className="px-4 py-2.5">Fare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft/60">
            {anchors.map(([stationId, fare]) => (
              <tr key={stationId}>
                <th scope="row" className="px-4 py-2.5 font-medium text-ink">
                  <Link href={`/stations/${stationId}`} className="underline-offset-2 hover:underline">{stationById.get(stationId)?.name ?? stationId}</Link>
                </th>
                <td className="px-4 py-2.5 tabular-nums text-ink">₹{fare}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        For Airport Express journeys that do not start at New Delhi, the planner shows: {FARE_FALLBACK}
      </p>

      <h2 className="mt-7 text-[17px] font-semibold text-ink">Fares on the other lines</h2>
      <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
        The Aqua Line is run by NMRC, Namo Bharat and Meerut Metro by NCRTC, and Rapid Metro
        Gurugram by its own operator. Each sets its own fares, and those fares are not published
        here because no official fare table for them could be verified. In the planner, any journey
        that touches one of those lines shows “Fare information could not be retrieved.” Check the
        operator or the station for those fares.
      </p>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <Link href="/" className="flex min-h-[48px] items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-deep">Plan a journey</Link>
        <Link href="/lines" className="flex min-h-[48px] items-center rounded-xl border border-line-soft bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper">All lines</Link>
      </div>

      <p className="mt-6 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        Official announcements, and the official DMRC Travel app for QR tickets and smart card
        recharge, are on <a className="font-medium text-accent underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a>.
        This planner does not sell tickets or recharge cards.
      </p>
    </article>
  );
}
