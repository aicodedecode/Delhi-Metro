import { NextResponse } from "next/server";
import { timingsData } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    generalOperatingHours: timingsData.generalOperatingHours,
    airportExpress: timingsData.airportExpress,
    perStation: { status: timingsData.firstLastPerStation, note: timingsData.firstLastPerStationNote },
  });
}
