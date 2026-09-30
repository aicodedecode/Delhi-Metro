import type { Metadata } from "next";
import Link from "next/link";
import { lines } from "@/lib/data";
import { lineTextColor } from "@/components/LineBadge";

export const metadata: Metadata = {
  title: "Delhi Metro Lines — All 9 Corridors",
  description: "All 9 Delhi Metro corridors with colours, terminals, lengths and station counts: Red, Yellow, Blue, Green, Violet, Airport Express, Pink, Magenta and Grey lines.",
  alternates: { canonical: "/lines" },
};

export default function LinesPage() {
  return (
    <div>
      <h1 className="text-xl font-extrabold text-slate-900">Delhi Metro Lines</h1>
      <p className="text-sm text-slate-500">9 corridors · 243 stations. Colours are official line colours; the line name is always shown in text too.</p>
      <ul className="mt-3 space-y-2">
        {lines.map((line) => (
          <li key={line.id}>
            <Link href={`/lines/${line.id}`} className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold" style={{ backgroundColor: line.color, color: lineTextColor(line.color) }} aria-hidden="true">{line.number}</span>
              <span className="min-w-0">
                <span className="block font-bold text-slate-900">{line.name}</span>
                <span className="block truncate text-xs text-slate-500">{line.terminals.join(" ↔ ")} · {line.stationCount} stations · {line.lengthKm} km</span>
              </span>
              <span aria-hidden="true" className="ml-auto text-slate-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">Note: the Magenta Line currently runs as two separate segments (Krishna Park Extension–Botanical Garden and Deepali Chowk–Majlis Park); the connecting section is under construction, so routes never pass through that gap. The Golden Line is not yet operational and is not included.</p>
    </div>
  );
}
