import { NextRequest, NextResponse } from "next/server";
import { stations } from "@/lib/data";
import { searchStations } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ stations });
  return NextResponse.json({ stations: searchStations(q, 20) });
}
