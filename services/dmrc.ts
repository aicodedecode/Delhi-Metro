import { config } from "@/lib/config";

/**
 * Service Status abstraction. There is currently NO verified public DMRC live
 * feed, so this honestly reports "unavailable" unless DMRC_API_URL and
 * DMRC_API_KEY are configured server-side — and even then any fetch failure
 * maps to unavailable. A status is NEVER fabricated.
 */
export interface ServiceStatusResult {
  status: "unavailable" | "normal" | "delayed" | "disrupted";
  message: string;
  source: string;
}

export async function getServiceStatus(): Promise<ServiceStatusResult> {
  if (!config.dmrcConfigured) {
    return { status: "unavailable", message: "Live status unavailable.", source: "none (DMRC_API_URL / DMRC_API_KEY not configured)" };
  }
  try {
    const res = await fetch(config.dmrcApiUrl, {
      headers: { Authorization: `Bearer ${config.dmrcApiKey}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("status fetch failed");
    const body = (await res.json()) as { status?: string; message?: string };
    const s = body.status === "normal" || body.status === "delayed" || body.status === "disrupted" ? body.status : "unavailable";
    return { status: s, message: body.message ?? "Live status unavailable.", source: "DMRC API" };
  } catch {
    return { status: "unavailable", message: "Live status unavailable.", source: "DMRC API (fetch failed)" };
  }
}
