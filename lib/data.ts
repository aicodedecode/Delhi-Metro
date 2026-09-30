import stationsJson from "@/data/stations.json";
import linesJson from "@/data/lines.json";
import lineStationsJson from "@/data/lineStations.json";
import interchangesJson from "@/data/interchanges.json";
import faresJson from "@/data/fares.json";
import timingsJson from "@/data/timings.json";
import type { Station, LineInfo, Segment, Interchange, FareData } from "@/types";

export const stations = (stationsJson as unknown as { stations: Station[] }).stations;
export const lines = (linesJson as unknown as { lines: LineInfo[] }).lines;
export const segments = (lineStationsJson as unknown as { segments: Record<string, Segment> }).segments;
export const interchanges = (interchangesJson as unknown as { interchanges: Interchange[] }).interchanges;
export const faresData = faresJson as unknown as FareData;
export const timingsData = timingsJson as unknown as {
  generalOperatingHours: { firstTrainApprox: string; lastTrainApprox: string; note: string };
  airportExpress: { firstTrainApprox: string; lastTrainApprox: string; frequency: string; note: string };
  firstLastPerStation: string;
  firstLastPerStationNote: string;
  fallbackMessage: string;
};

export const stationById = new Map<string, Station>(stations.map((s) => [s.id, s]));
export const lineById = new Map<string, LineInfo>(lines.map((l) => [l.id, l]));

export function getStation(id: string): Station | undefined { return stationById.get(id); }
export function getLine(id: string): LineInfo | undefined { return lineById.get(id); }

export function stationSlug(id: string): string { return id; }

export function stationsOnLine(lineId: string): Station[] {
  const line = lineById.get(lineId); if (!line) return [];
  const seen = new Set<string>(); const out: Station[] = [];
  for (const segId of line.segments) {
    for (const sid of segments[segId]?.stations ?? []) {
      if (!seen.has(sid)) { seen.add(sid); const st = stationById.get(sid); if (st) out.push(st); }
    }
  }
  return out;
}

/** Interchange partners reached via a skywalk between two distinct station records. */
export function skywalkPartners(stationId: string): string[] {
  const out: string[] = [];
  for (const ic of interchanges) {
    if (ic.type === "skywalk-interchange" && ic.connectedStations?.includes(stationId)) {
      for (const p of ic.connectedStations) if (p !== stationId) out.push(p);
    }
  }
  return out;
}
