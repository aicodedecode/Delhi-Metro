import { faresData, lineById, stationById } from "./data";
import type { DayType, FareResult } from "@/types";

export const FARE_FALLBACK = "Fare information unavailable — please verify with DMRC.";
export const AIRPORT_LINE_ID = "airport-express";
export const NEW_DELHI_ID = "new-delhi";

export function slabFare(distanceKm: number, dayType: DayType): number | null {
  for (const slab of faresData.regularLines.slabs) {
    if (distanceKm > slab.minKm && (slab.maxKm === null || distanceKm <= slab.maxKm)) {
      return dayType === "sunday" ? slab.fareSunday : slab.fareWeekday;
    }
  }
  // 0-distance edge case
  const first = faresData.regularLines.slabs[0];
  return first ? (dayType === "sunday" ? first.fareSunday : first.fareWeekday) : null;
}

function applySmartCard(amount: number | null): number | null {
  if (amount === null) return null;
  const pct = faresData.smartCard.discountPercent;
  return Math.round(amount * (1 - pct / 100));
}

export interface FareInput {
  fromId: string; toId: string; approxDistanceKm: number;
  usesAirportExpress: boolean; dayType?: DayType; smartCard?: boolean;
  /** Line ids used by the route. DMRC slabs apply only to DMRC-only routes. */
  lineIds?: string[];
}

/**
 * Fare engine. Rules (from data/fares.json, effective 25 Aug 2025):
 * - Routes NOT touching Airport Express: distance slab lookup (estimated).
 * - Routes touching Airport Express: only the verified ex-New Delhi anchor
 *   pairs return a fare (marked verified); everything else is unavailable.
 */
export function calculateFare(input: FareInput): FareResult {
  const dayType: DayType = input.dayType ?? "weekday";
  const smartCard = Boolean(input.smartCard);

  // Operator gate: the DMRC slabs in data/fares.json cover DMRC lines only.
  // Any route touching the Aqua Line (NMRC), the Namo Bharat or Meerut Metro
  // (NCRTC) or Rapid Metro returns no fare: no official slab table is held for
  // those operators, so nothing is fabricated.
  const touchesOtherOperator = (input.lineIds ?? []).some((id) => {
    const op = lineById.get(id)?.operator;
    return op !== undefined && op !== "DMRC";
  });
  if (touchesOtherOperator) {
    return {
      amount: null, type: "unavailable", note: "Fare information could not be retrieved.",
      dayType, smartCardApplied: smartCard, smartCardAmount: null,
    };
  }

  if (input.usesAirportExpress) {
    const anchors = faresData.airportExpress.anchorsFromNewDelhi;
    let verified: number | null = null;
    if (input.fromId === NEW_DELHI_ID && anchors[input.toId] !== undefined) verified = anchors[input.toId];
    if (input.toId === NEW_DELHI_ID && anchors[input.fromId] !== undefined) verified = anchors[input.fromId];
    if (verified !== null) {
      return {
        amount: verified, type: "verified",
        note: "Verified fare (DMRC, ex-New Delhi Airport Express anchor).",
        dayType, smartCardApplied: smartCard, smartCardAmount: applySmartCard(verified),
      };
    }
    return {
      amount: null, type: "unavailable", note: FARE_FALLBACK,
      dayType, smartCardApplied: smartCard, smartCardAmount: null,
    };
  }

  const fare = slabFare(input.approxDistanceKm, dayType);
  if (fare === null) {
    return { amount: null, type: "unavailable", note: FARE_FALLBACK, dayType, smartCardApplied: smartCard, smartCardAmount: null };
  }
  return {
    amount: fare, type: "estimated",
    note: "Approx. fare (estimate) — mapped from estimated route distance to the official distance slabs effective 25 Aug 2025. Verify with DMRC.",
    dayType, smartCardApplied: smartCard, smartCardAmount: applySmartCard(fare),
  };
}

export function stationName(id: string): string {
  return stationById.get(id)?.name ?? id;
}
