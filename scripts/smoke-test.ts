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

// ---- Expansion checks (NMRC / NCRTC / Rapid Metro) — hard assertions ----
let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
}

const aqua = findRoute("rajiv-chowk", "pari-chowk", { dayType: "weekday" });
check("Rajiv Chowk -> Pari Chowk routes", aqua !== null);
if (aqua) {
  check("  uses Blue then Aqua", aqua.legs.map((l) => l.lineId).join(",") === "blue,aqua", aqua.legs.map((l) => l.lineId).join(","));
  check("  walk link Sector 52 -> Sector 51", aqua.legs[0].toId === "noida-sector-52" && aqua.legs[1].fromId === "noida-sector-51");
  check("  direction set on both legs", aqua.legs.every((l) => l.directionName.length > 0), aqua.legs.map((l) => l.directionName).join("/"));
  check("  fare unavailable for Aqua route", aqua.fare.amount === null && aqua.fare.note === "Fare information could not be retrieved.", aqua.fare.note);
}

const namo = findRoute("rajiv-chowk", "meerut-south", { dayType: "weekday" });
check("Rajiv Chowk -> Meerut South routes", namo !== null);
if (namo) {
  check("  touches Namo Bharat", namo.legs.some((l) => l.lineId === "namo-bharat"), namo.linesUsed.join("+"));
  check("  fare unavailable for Namo route", namo.fare.amount === null && namo.fare.note === "Fare information could not be retrieved.");
}

const modipuram = findRoute("rajiv-chowk", "modipuram", { dayType: "weekday" });
check("Rajiv Chowk -> Modipuram routes", modipuram !== null);
if (modipuram) check("  fare unavailable for Modipuram route", modipuram.fare.amount === null && modipuram.fare.note === "Fare information could not be retrieved.");

const meerut = findRoute("meerut-south", "meerut-central", { dayType: "weekday" });
check("Meerut South -> Meerut Central routes", meerut !== null);
if (meerut) {
  check("  Meerut Metro only, no change", meerut.legs.length === 1 && meerut.legs[0].lineId === "meerut-metro" && meerut.interchanges === 0);
  check("  fare unavailable for Meerut Metro route", meerut.fare.amount === null && meerut.fare.note === "Fare information could not be retrieved.");
}

const rapid = findRoute("rajiv-chowk", "cyber-city", { dayType: "weekday" });
check("Rajiv Chowk -> Cyber City routes", rapid !== null);
if (rapid) {
  check("  uses Yellow then Rapid Metro", rapid.legs.map((l) => l.lineId).join(",") === "yellow,rapid-metro", rapid.legs.map((l) => l.lineId).join(","));
  check("  walk link Sikanderpur -> Sikanderpur (Rapid)", rapid.legs[0].toId === "sikanderpur" && rapid.legs[1].fromId === "sikanderpur-rapid");
  check("  fare unavailable for Rapid Metro route", rapid.fare.amount === null && rapid.fare.note === "Fare information could not be retrieved.");
}

// Skywalk regression (pre-existing link, Dhaula Kuan <-> Durgabai Deshmukh South Campus)
const sky = findRoute("new-delhi", "durgabai-deshmukh-south-campus", { dayType: "weekday" });
check("New Delhi -> Durgabai Deshmukh South Campus routes", sky !== null);
if (sky) {
  check("  ride Airport Express to Dhaula Kuan, then walk to the destination", sky.legs.length === 1 && sky.legs[0].lineId === "airport-express" && sky.legs[0].toId === "dhaula-kuan" && sky.path[sky.path.length - 1] === "durgabai-deshmukh-south-campus", sky.legs.map((l) => l.lineId).join(","));
}

// DMRC-only fares still price
const dmrcOnly = findRoute("rajiv-chowk", "kashmere-gate", { dayType: "weekday" });
check("DMRC-only route still prices", dmrcOnly !== null && dmrcOnly.fare.amount !== null, dmrcOnly ? String(dmrcOnly.fare.amount) : "no route");

// Excluded stations never leak
for (const bad of ["soorghat", "jangpura-rrts", "modipuram-depot"]) {
  check(`'${bad}' not in dataset`, findRoute("rajiv-chowk", bad, { dayType: "weekday" }) === null);
}

// ---- Route preference checks (Fastest / Fewest changes) ----
console.log("\nRoute preference checks:");
const prefPairs: [string, string][] = [
  ["rajiv-chowk", "cyber-city"],
  ["rajiv-chowk", "pari-chowk"],
  ["kashmere-gate", "millennium-city-centre-gurugram"],
  ["new-delhi", "botanical-garden"],
];
for (const [f, t] of prefPairs) {
  const fast = findRoute(f, t, { preference: "fastest" });
  const few = findRoute(f, t, { preference: "fewest-changes" });
  check(`${f} -> ${t}: both preferences route`, !!fast && !!few);
  if (fast && few) {
    check("  fewest-changes never has more changes than fastest", few.interchanges <= fast.interchanges, `fastest=${fast.interchanges} fewest=${few.interchanges}`);
  }
}

const directFast = findRoute("rajiv-chowk", "kashmere-gate", { preference: "fastest" });
const directFew = findRoute("rajiv-chowk", "kashmere-gate", { preference: "fewest-changes" });
check("Direct route identical under both preferences (UI shows one option)", !!directFast && !!directFew && directFast.path.join("|") === directFew.path.join("|"));

const divFast = findRoute("dwarka-sector-21", "noida-electronic-city", { preference: "fastest" });
const divFew = findRoute("dwarka-sector-21", "noida-electronic-city", { preference: "fewest-changes" });
check("Dwarka Sector 21 -> Noida Electronic City: both preferences route", !!divFast && !!divFew);
if (divFast && divFew) {
  check("  preferences diverge on changes", divFast.interchanges > divFew.interchanges, `fastest=${divFast.interchanges} fewest=${divFew.interchanges}`);
  check("  fewest-changes rides the Blue Line through with no change", divFew.interchanges === 0 && divFew.legs.every((l) => l.lineId === "blue"), divFew.linesUsed.join("+"));
  check("  fastest is quicker in displayed minutes", divFast.estimatedMinutes < divFew.estimatedMinutes, `${divFast.estimatedMinutes} vs ${divFew.estimatedMinutes}`);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
