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
  id: string; name: string; number: string | null; color: string; colorName: string;
  terminals: string[]; lengthKm: number; stationCount: number; stationCountNote?: string;
  segments: string[]; operatingHours: string; operator: "DMRC" | "NMRC" | "NCRTC" | "Rapid Metro";
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
export interface FirstLastTrain {
  lineId: string;
  towards: string;
  first: string;
  last: string;
}
export interface StationGate {
  name: string;
  location: string | null;
  stepFree: boolean;
}
export interface StationPlatform {
  name: string;
  towards: string | null;
}
export interface StationFacilityItem {
  name: string;
  location: string | null;
}
export interface StationFacilityGroup {
  kind: string;
  items: StationFacilityItem[];
}
export interface StationParking {
  car: number | null;
  motorcycle: number | null;
  cycle: number | null;
  location: string | null;
  provider: string | null;
}
export interface StationLift {
  type: string;
  name: string;
  location: string | null;
}
export interface StationFeederRoute {
  route: string;
  from: string;
  to: string;
  areas: string | null;
}
export interface StationNearby {
  category: string;
  kind: string;
  name: string;
  distanceKm: number | null;
  nearestGate: string | null;
}
export interface StationFact {
  lat?: number;
  lng?: number;
  coordSource?: string;
  opened?: string;
  openedSource?: string;
  structure?: string;
  structureSource?: string;
  firstLast?: FirstLastTrain[];
  dmrcCode?: string;
  gates?: StationGate[];
  platforms?: StationPlatform[];
  facilities?: StationFacilityGroup[];
  parking?: StationParking[];
  lifts?: StationLift[];
  feederRoutes?: StationFeederRoute[];
  nearby?: StationNearby[];
  opensAt?: string;
  closesAt?: string;
  detailsSource?: string;
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
