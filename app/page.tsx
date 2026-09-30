import JourneyPlanner from "@/features/JourneyPlanner";
import Link from "next/link";
import { lines } from "@/lib/data";
import { IconArrowRight } from "@/components/icons";

export default function HomePage() {
  return (
    <div>
      <JourneyPlanner />
      <section aria-label="Network map" className="mt-10 border-t border-line-soft pt-6">
        <h2 className="text-[17px] font-semibold text-ink">Network map</h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-soft">
          The official DMRC map of the whole August 2026 network, with every station and interchange,
          including the Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro.
          It draws itself in when it opens, and you can drag and zoom to explore.
        </p>
        <Link href="/map" className="mt-2 inline-flex items-center gap-1 font-medium text-accent underline">
          Open the map <IconArrowRight size={15} />
        </Link>
      </section>
      <section aria-label="About this planner" className="mt-12 max-w-prose border-t border-line-soft pt-6">
        <h2 className="text-[17px] font-semibold text-ink">How it works</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Pick a From and To station to get the route across all {lines.length} lines in the network,
          run by DMRC, NMRC, NCRTC and Rapid Metro. Every line change is shown step by step, including
          the short walks between stations run by different operators. Delhi Metro fares come from the
          official distance slabs effective 25 August 2025, and Airport Express fares are shown only
          for verified New Delhi pairs. Fares for the other operators are not
          published here, because no official fare table could be verified. Times are estimates.
          Check live status and first/last trains with the operator before you travel.
        </p>
      </section>
    </div>
  );
}
