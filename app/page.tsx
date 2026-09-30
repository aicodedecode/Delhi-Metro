import JourneyPlanner from "@/features/JourneyPlanner";

export default function HomePage() {
  return (
    <div>
      <JourneyPlanner />
      <section aria-label="About this planner" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">How it works</h2>
        <p className="mt-1">Pick a From and To station to get the best route across all 9 Delhi Metro corridors (243 stations), with every line change shown step by step. Routes balance journey time against unnecessary interchanges. Fares are mapped from the estimated route distance to the official slabs effective 25 August 2025 (Airport Express fares are shown only for verified New Delhi anchor pairs). Times are estimates — always verify live status and first/last trains with DMRC.</p>
      </section>
    </div>
  );
}
