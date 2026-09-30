import { NextRequest, NextResponse } from "next/server";
import { getStation } from "@/lib/data";
import { findRoute } from "@/lib/router";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const day = request.nextUrl.searchParams.get("day");
  if (!from || !to) return NextResponse.json({ error: "Missing from/to station ids." }, { status: 400 });
  if (from === to) return NextResponse.json({ error: "Please select two different stations." }, { status: 400 });
  if (!getStation(from) || !getStation(to)) return NextResponse.json({ error: "Unknown station id." }, { status: 404 });
  const route = findRoute(from, to, { dayType: day === "sunday" ? "sunday" : "weekday" });
  if (!route) return NextResponse.json({ error: "No route found between these stations." }, { status: 404 });
  return NextResponse.json({ route });
}
