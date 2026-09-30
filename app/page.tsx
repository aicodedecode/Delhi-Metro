import JourneyPlanner from "@/features/JourneyPlanner";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";

export default function HomePage() {
  return (
    <div>
      <JourneyPlanner />
      <section aria-label="Network map" className="mt-10 border-t border-line-soft pt-6">
        <h2 className="text-[17px] font-semibold text-ink">Network map</h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-soft">
          The official DMRC map of all nine lines, with every station and interchange.
          It draws itself in when it opens, and you can drag and zoom to explore.
        </p>
        <Link href="/map" className="mt-2 inline-flex items-center gap-1 font-medium text-accent underline">
          Open the map <IconArrowRight size={15} />
        </Link>
      </section>
      <section aria-label="About this planner" className="mt-12 max-w-prose border-t border-line-soft pt-6">
        <h2 className="text-[17px] font-semibold text-ink">How it works</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Pick a From and To station to get the route across all 9 Delhi Metro corridors.
          Every line change is shown step by step. Fares come from the official distance
          slabs effective 25 August 2025, and Airport Express fares are shown only for
          verified New Delhi pairs. Times are estimates. Check live status and
          first/last trains with DMRC before you travel.
        </p>
      </section>
    </div>
  );
}
