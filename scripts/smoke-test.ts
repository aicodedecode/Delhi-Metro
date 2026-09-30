// @ts-nocheck
import { findRoute } from "../lib/router";
import { searchStations } from "../lib/search";

const cases: [string, string][] = [
  ["rajiv-chowk", "millennium-city-centre-gurugram"],
  ["rajiv-chowk", "kashmere-gate"],
  ["new-delhi", "igi-airport"],
  ["hauz-khas", "botanical-garden"],
  ["dwarka-sector-21", "noida-electronic-city"],
  ["kashmere-gate", "raja-nahar-singh"],
  ["majlis-park", "botanical-garden"],
];

for (const [f, t] of cases) {
  const r = findRoute(f, t, { dayType: "weekday" });
  if (!r) { console.log(`${f} -> ${t}: NO ROUTE`); continue; }
  console.log(`${r.fromName} -> ${r.toName}`);
  console.log(`  stations=${r.totalStations} hops=${r.hops} interchanges=${r.interchanges} estMin=${r.estimatedMinutes} dist~${r.approxDistanceKm}km lines=[${r.linesUsed.join(" + ")}]`);
  console.log(`  legs: ${r.legs.map((l) => `${l.lineName}: ${l.fromName} -> ${l.toName} (${l.stops} stops, twd ${l.directionName})`).join(" | ")}`);
  console.log(`  fare: ${r.fare.amount === null ? r.fare.note : "₹" + r.fare.amount + " (" + r.fare.type + ")"}`);
  if (r.path.includes("soorghat")) console.log("  !!! SOORGHAT LEAK");
  console.log("  path: " + r.pathNames.join(" -> "));
  console.log("");
}

console.log("search 'rajiv':", searchStations("rajiv").map((s) => s.name).join(", "));
console.log("search 'hauz':", searchStations("hauz").map((s) => s.name).join(", "));
console.log("search 'HUDA':", searchStations("HUDA").map((s) => s.name + " [" + s.id + "]").join(", "));
console.log("search 'rajiv chowk' typo 'rajv':", searchStations("rajv").map((s) => s.name).join(", "));

// Magenta gap guard: Majlis Park -> Botanical Garden must not use Magenta directly
const gap = findRoute("majlis-park", "botanical-garden", { dayType: "weekday" });
if (gap) {
  const usesMagentaGap = gap.legs.length === 1 && gap.legs[0].lineId === "magenta";
  console.log(`GAP CHECK Majlis Park->Botanical Garden: legs=${gap.legs.length} magentaDirect=${usesMagentaGap} (must be false) interchanges=${gap.interchanges}`);
  const magentaLegStations = gap.legs.filter((l) => l.lineId === "magenta").flatMap((l) => l.stations);
  console.log("  magenta leg stations:", magentaLegStations.join(",") || "(none)");
}
