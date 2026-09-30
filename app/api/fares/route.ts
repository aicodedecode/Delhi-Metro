import { NextRequest, NextResponse } from "next/server";
import { calculateFare } from "@/lib/fare";

export async function GET(request: NextRequest) {
  const distanceKm = Number(request.nextUrl.searchParams.get("distanceKm") ?? NaN);
  const day = request.nextUrl.searchParams.get("day");
  const line = request.nextUrl.searchParams.get("line");
  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  if (Number.isNaN(distanceKm) || distanceKm < 0) {
    return NextResponse.json({ error: "Provide distanceKm (number >= 0)." }, { status: 400 });
  }
  const fare = calculateFare({
    fromId: from, toId: to, approxDistanceKm: distanceKm,
    usesAirportExpress: line === "airport-express",
    dayType: day === "sunday" ? "sunday" : "weekday",
  });
  return NextResponse.json({ fare });
}
