/**
 * Sanity checks for data/stationFacts.json (built by
 * scripts/build-station-facts.py). Every fact must carry its source,
 * coordinates must sit inside the NCR, first trains must leave before
 * last trains (allowing a just-after-midnight wrap), and lines with no
 * GTFS service (Namo Bharat, Meerut Metro) must not gain first/last rows.
 */
import stationsJson from "../data/stations.json";
import stationFactsJson from "../data/stationFacts.json";
import type { Station, StationFact } from "../types";

const stations = (stationsJson as unknown as { stations: Station[] }).stations;
const facts = (stationFactsJson as unknown as { stations: Record<string, StationFact> }).stations;
const byId = new Map(stations.map((s) => [s.id, s]));

const COORD_SOURCES = new Set(["DMRC static feed (OTD)", "OpenStreetMap"]);
const STRUCTURES = new Set(["Elevated", "Underground", "At grade"]);
const NO_SERVICE_LINES = new Set(["namo-bharat", "meerut-metro"]);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

let errors = 0;
const fail = (msg: string) => {
  errors += 1;
  console.error("FAIL", msg);
};
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

for (const [id, f] of Object.entries(facts)) {
  const st = byId.get(id);
  if (!st) {
    fail(`${id}: facts keyed to an unknown station id`);
    continue;
  }
  if (Object.keys(f).length === 0) fail(`${id}: empty fact entry`);

  const hasCoords = f.lat !== undefined || f.lng !== undefined;
  if (hasCoords) {
    if (typeof f.lat !== "number" || typeof f.lng !== "number") fail(`${id}: partial coordinates`);
    else {
      if (!(f.lat >= 28.05 && f.lat <= 29.15)) fail(`${id}: latitude ${f.lat} outside NCR bounds`);
      if (!(f.lng >= 76.6 && f.lng <= 77.95)) fail(`${id}: longitude ${f.lng} outside NCR bounds`);
    }
    if (!f.coordSource || !COORD_SOURCES.has(f.coordSource)) fail(`${id}: missing or unknown coordSource`);
  } else if (f.coordSource) {
    fail(`${id}: coordSource without coordinates`);
  }

  if (f.opened !== undefined) {
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(f.opened)) fail(`${id}: bad opened format ${f.opened}`);
    if (f.opened > "2026-10-01") fail(`${id}: opened date ${f.opened} is in the future`);
    if (!f.openedSource) fail(`${id}: opened without openedSource`);
  } else if (f.openedSource) {
    fail(`${id}: openedSource without opened`);
  }

  if (f.structure !== undefined) {
    if (!STRUCTURES.has(f.structure)) fail(`${id}: unknown structure "${f.structure}"`);
    if (!f.structureSource) fail(`${id}: structure without structureSource`);
  } else if (f.structureSource) {
    fail(`${id}: structureSource without structure`);
  }

  for (const row of f.firstLast ?? []) {
    if (!st.lines.includes(row.lineId)) fail(`${id}: firstLast on line ${row.lineId} the station is not on`);
    if (NO_SERVICE_LINES.has(row.lineId)) fail(`${id}: firstLast row on ${row.lineId}, which has no GTFS service`);
    if (!TIME.test(row.first) || !TIME.test(row.last)) fail(`${id}: bad HH:MM in firstLast row`);
    else if (!(toMin(row.last) > toMin(row.first) || toMin(row.last) < 120)) {
      fail(`${id}: first ${row.first} is not before last ${row.last}`);
    }
    if (!row.towards) fail(`${id}: firstLast row without a towards station`);
  }
}

const withFacts = Object.keys(facts).length;
console.log(
  `station facts: ${withFacts} stations, ` +
    `${Object.values(facts).filter((f) => f.lat !== undefined).length} with coordinates, ` +
    `${Object.values(facts).filter((f) => f.opened).length} with opening dates, ` +
    `${Object.values(facts).filter((f) => f.structure).length} with structure, ` +
    `${Object.values(facts).filter((f) => f.firstLast?.length).length} with first/last trains`,
);
if (errors > 0) {
  console.error(`${errors} station fact check(s) failed`);
  process.exit(1);
}
console.log("STATION FACT CHECKS PASSED");
