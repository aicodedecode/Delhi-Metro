import { NextResponse } from "next/server";
import { getServiceStatus } from "@/services/dmrc";

// Server-side only: reads DMRC_API_URL / DMRC_API_KEY via lib/config.
// Returns "unavailable" unless a verified DMRC feed is configured — never fabricates.
export async function GET() {
  const status = await getServiceStatus();
  return NextResponse.json(status);
}
