export interface Station {
  id: string;
  name: string;
  code: string | null;
  lines: string[];
  isInterchange: boolean;
  lat: number | null;
  lng: number | null;
  aliases: string[];
}
export interface LineInfo {
  id: string; name: string; number: string; color: string; colorName: string;
  terminals: string[]; lengthKm: number; stationCount: number; stationCountNote?: string;
  segments: string[]; operatingHours: string;
}
export interface Segment { line: string; stations: string[] }
export interface Interchange { stationId: string; stationName: string; lines: string[]; type: string; note?: string; connectedStations?: string[] }
export interface FareSlab { minKm: number; maxKm: number | null; fareWeekday: number; fareSunday: number }
export interface FareData {
  meta: Record<string, unknown>;
  regularLines: { basis: string; slabs: FareSlab[] };
  airportExpress: { note: string; rangeInr: number[]; anchorsFromNewDelhi: Record<string, number> };
  smartCard: { discountPercent: number; note: string; offPeakWindows: string[] };
  fallbackMessage: string;
}
export type DayType = "weekday" | "sunday";
export interface FareResult {
  amount: number | null;
  type: "verified" | "estimated" | "unavailable";
  note: string;
  dayType: DayType;
  smartCardApplied: boolean;
  smartCardAmount: number | null;
}
export interface RouteLeg {
  lineId: string; lineName: string; lineColor: string;
  fromId: string; fromName: string; toId: string; toName: string;
  directionName: string;
  stations: string[]; stationNames: string[]; stops: number;
}
export interface RouteResultData {
  fromId: string; toId: string; fromName: string; toName: string;
  path: string[]; pathNames: string[];
  legs: RouteLeg[]; linesUsed: string[];
  totalStations: number; hops: number; interchanges: number;
  interchangeStations: string[];
  estimatedMinutes: number; approxDistanceKm: number; usesAirportExpress: boolean;
  fare: FareResult;
}
