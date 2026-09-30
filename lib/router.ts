import { segments, lineById, stationById, skywalkPartners } from "./data";
import { calculateFare } from "./fare";
import type { RouteResultData, RouteLeg, DayType } from "@/types";

/**
 * Delhi Metro route engine.
 *
 * Graph model: a node is (stationId, lineId). Undirected edges connect
 * consecutive stations within each segment of lineStations.json (segments are
 * kept separate, so the two disconnected Magenta segments can never be
 * traversed through the under-construction gap, and the unopened Soorghat
 * station — absent from the data — can never appear).
 *
 * Cost model (all displayed values are ESTIMATES, labelled as such in the UI):
 *   travel edge    = 2.2 min per hop (4.7 min on the Airport Express, whose
 *                    hops are much longer — New Delhi to IGI Airport is ~19 min)
 *   line change    = 5 min interchange penalty (same-station line transfer)
 *   skywalk link   = 5 min (Dhaula Kuan <-> Durgabai Deshmukh South Campus)
 * Displayed estimated minutes = sum(per-hop times) + interchanges*5, rounded.
 * The Dijkstra optimisation adds a further 15 min aversion per change, so a
 * change is only recommended when it buys real time — a direct train with a
 * few extra stops therefore beats a two-change shortcut, matching how riders
 * actually choose.
 */

export const MIN_PER_HOP = 2.2;
export const INTERCHANGE_PENALTY_MIN = 5;
/** Extra optimisation-only aversion per change (walking + waiting + hassle).
 * A change must save real time before the planner recommends one. */
export const TRANSFER_AVERSION_MIN = 15;

/** Realistic per-hop minutes by line (Airport Express hops are long). */
export function lineHopMinutes(lineId: string): number {
  return lineId === "airport-express" ? 4.7 : MIN_PER_HOP;
}

interface Edge { to: string; cost: number; kind: "travel" | "transfer" | "skywalk"; lineId: string }

function key(stationId: string, lineId: string): string { return stationId + "|" + lineId; }
function parseKey(k: string): [string, string] { const i = k.lastIndexOf("|"); return [k.slice(0, i), k.slice(i + 1)]; }

let graph: Map<string, Edge[]> | null = null;

export function buildGraph(): Map<string, Edge[]> {
  if (graph) return graph;
  const adj = new Map<string, Edge[]>();
  const add = (a: string, e: Edge) => { const l = adj.get(a); if (l) l.push(e); else adj.set(a, [e]); };

  // Travel edges between consecutive stations in each segment.
  for (const seg of Object.values(segments)) {
    const sts = seg.stations;
    for (let i = 0; i < sts.length - 1; i++) {
      const a = key(sts[i], seg.line), b = key(sts[i + 1], seg.line);
      add(a, { to: b, cost: lineHopMinutes(seg.line), kind: "travel", lineId: seg.line });
      add(b, { to: a, cost: lineHopMinutes(seg.line), kind: "travel", lineId: seg.line });
    }
  }
  // Same-station line transfers + skywalk links.
  for (const st of stationById.values()) {
    for (let i = 0; i < st.lines.length; i++) {
      for (let j = 0; j < st.lines.length; j++) {
        if (i !== j) add(key(st.id, st.lines[i]), { to: key(st.id, st.lines[j]), cost: INTERCHANGE_PENALTY_MIN + TRANSFER_AVERSION_MIN, kind: "transfer", lineId: st.lines[j] });
      }
    }
    for (const partner of skywalkPartners(st.id)) {
      for (const l of st.lines) add(key(st.id, l), { to: key(partner, l), cost: INTERCHANGE_PENALTY_MIN + TRANSFER_AVERSION_MIN, kind: "skywalk", lineId: l });
      for (const l of stationById.get(partner)?.lines ?? []) add(key(partner, l), { to: key(st.id, l), cost: INTERCHANGE_PENALTY_MIN + TRANSFER_AVERSION_MIN, kind: "skywalk", lineId: l });
    }
  }
  graph = adj;
  return adj;
}

/** Per-hop distance (km) within a segment, from the corridor length. */
function segmentHopKm(segId: string): number {
  const seg = segments[segId];
  const line = lineById.get(seg.line);
  if (!line || seg.stations.length < 2) return 0;
  const totalHops = line.segments.reduce((sum, s) => sum + Math.max((segments[s]?.stations.length ?? 1) - 1, 0), 0);
  const kmPerHop = totalHops > 0 ? line.lengthKm / totalHops : 0;
  void segId;
  return kmPerHop;
}

export interface RouteOptions { dayType?: DayType; smartCard?: boolean }

const routeCache = new Map<string, RouteResultData | null>();

export function findRoute(fromId: string, toId: string, options: RouteOptions = {}): RouteResultData | null {
  const dayType: DayType = options.dayType ?? "weekday";
  const cacheKey = fromId + ">" + toId + ">" + dayType + ">" + (options.smartCard ? "sc" : "tk");
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey) ?? null;

  const result = computeRoute(fromId, toId, options);
  routeCache.set(cacheKey, result);
  return result;
}

function computeRoute(fromId: string, toId: string, options: RouteOptions): RouteResultData | null {
  const from = stationById.get(fromId);
  const to = stationById.get(toId);
  if (!from || !to || fromId === toId) return null;

  const adj = buildGraph();
  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; kind: Edge["kind"]; lineId: string }>();
  const visited = new Set<string>();

  // Multi-source start: board any line at the origin at zero cost.
  const queue: { node: string; cost: number }[] = [];
  for (const l of from.lines) { const k = key(fromId, l); dist.set(k, 0); queue.push({ node: k, cost: 0 }); }

  const destinationKeys = new Set(to.lines.map((l) => key(toId, l)));
  let endKey: string | null = null;

  // Dijkstra (small graph — a simple priority scan is fine and instant).
  while (queue.length) {
    let best = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i].cost < queue[best].cost) best = i;
    const { node, cost } = queue.splice(best, 1)[0];
    if (visited.has(node)) continue;
    visited.add(node);
    if (destinationKeys.has(node)) { endKey = node; break; }
    for (const e of adj.get(node) ?? []) {
      const nc = cost + e.cost;
      if (nc < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nc);
        prev.set(e.to, { from: node, kind: e.kind, lineId: e.lineId });
        queue.push({ node: e.to, cost: nc });
      }
    }
  }
  if (!endKey) return null;

  // Reconstruct the (station,line) node chain.
  const chain: { stationId: string; lineId: string; kind: Edge["kind"] }[] = [];
  let cur: string | undefined = endKey;
  while (cur) {
    const [sid, lid] = parseKey(cur);
    const p = prev.get(cur);
    chain.unshift({ stationId: sid, lineId: lid, kind: p ? p.kind : "travel" });
    cur = p?.from;
  }
  if (!chain.length || chain[0].stationId !== fromId) return null;

  // Collapse into legs grouped by line.
  const legs: RouteLeg[] = [];
  let hops = 0;
  let transfers = 0;
  let distanceKm = 0;

  interface SegInfo { segId: string; ids: string[] }
  const segStationsByLine = new Map<string, SegInfo[]>();
  for (const [segId, seg] of Object.entries(segments)) {
    const arr = segStationsByLine.get(seg.line) ?? [];
    arr.push({ segId, ids: seg.stations });
    segStationsByLine.set(seg.line, arr);
  }
  void segStationsByLine;

  let legLine = chain[0].lineId;
  let legStations: string[] = [chain[0].stationId];
  const flushLeg = () => {
    if (legStations.length < 2) return;
    const line = lineById.get(legLine);
    // direction = terminus of the segment in the direction of travel
    let directionName = "";
    for (const seg of Object.values(segments)) {
      if (seg.line !== legLine) continue;
      const idx = seg.stations.indexOf(legStations[0]);
      const idx2 = seg.stations.indexOf(legStations[legStations.length - 1]);
      if (idx >= 0 && idx2 >= 0 && idx !== idx2) {
        directionName = stationById.get(seg.stations[idx2 > idx ? seg.stations.length - 1 : 0])?.name ?? "";
        distanceKm += Math.abs(idx2 - idx) * segmentHopKm(Object.keys(segments).find((k) => segments[k] === seg) ?? "");
        break;
      }
    }
    legs.push({
      lineId: legLine,
      lineName: line?.name ?? legLine,
      lineColor: line?.color ?? "#333333",
      fromId: legStations[0],
      fromName: stationById.get(legStations[0])?.name ?? legStations[0],
      toId: legStations[legStations.length - 1],
      toName: stationById.get(legStations[legStations.length - 1])?.name ?? legStations[legStations.length - 1],
      directionName,
      stations: [...legStations],
      stationNames: legStations.map((s) => stationById.get(s)?.name ?? s),
      stops: legStations.length - 1,
    });
  };

  for (let i = 1; i < chain.length; i++) {
    const step = chain[i];
    if (step.kind === "travel") {
      hops++;
      if (step.lineId !== legLine) { flushLeg(); legLine = step.lineId; legStations = [chain[i - 1].stationId]; }
      legStations.push(step.stationId);
    } else {
      // transfer / skywalk at (or between) station(s): close leg, start new leg
      transfers++;
      flushLeg();
      legLine = step.lineId;
      legStations = [step.stationId];
    }
    }
  flushLeg();

  const path: string[] = [];
  legs.forEach((leg, i) => {
    leg.stations.forEach((s, j) => { if (i === 0 || j > 0) path.push(s); });
  });
  // Path may include the skywalk partner station as an extra node — that is a
  // real walk between two records, so it stays in the displayed path.

  const interchangeStations: string[] = [];
  for (let i = 0; i + 1 < legs.length; i++) interchangeStations.push(legs[i].toName);

  const usesAirportExpress = legs.some((l) => l.lineId === "airport-express");
  const travelMinutes = legs.reduce((sum, l) => sum + l.stops * lineHopMinutes(l.lineId), 0);
  const estimatedMinutes = Math.round(travelMinutes + transfers * INTERCHANGE_PENALTY_MIN);
  const fare = calculateFare({
    fromId, toId,
    approxDistanceKm: Math.round(distanceKm * 10) / 10,
    usesAirportExpress,
    dayType: options.dayType ?? "weekday",
    smartCard: options.smartCard,
  });

  return {
    fromId, toId,
    fromName: from.name, toName: to.name,
    path, pathNames: path.map((s) => stationById.get(s)?.name ?? s),
    legs,
    linesUsed: legs.map((l) => l.lineName),
    totalStations: path.length,
    hops,
    interchanges: transfers,
    interchangeStations,
    estimatedMinutes,
    approxDistanceKm: Math.round(distanceKm * 10) / 10,
    usesAirportExpress,
    fare,
  };
}
