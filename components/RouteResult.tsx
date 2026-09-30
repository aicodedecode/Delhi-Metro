import type { RouteResultData } from "@/types";
import { getLine } from "@/lib/data";
import { lineTextColor } from "./LineBadge";

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center shadow-sm">
      <div aria-hidden="true" className="text-lg leading-none">{icon}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function RouteResult({ route, dayType, smartCard }: { route: RouteResultData; dayType: "weekday" | "sunday"; smartCard: boolean }) {
  return (
    <section aria-label="Route result" className="mt-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard icon="⏱" label="Estimated time" value={`${route.estimatedMinutes} min`} />
        <SummaryCard icon="🚇" label="Stations" value={`${route.totalStations}`} />
        <SummaryCard icon="🔄" label="Interchanges" value={`${route.interchanges}`} />
        {route.fare.amount !== null ? (
          <SummaryCard icon="💰" label={smartCard && route.fare.smartCardAmount !== null ? "Fare (smart card est.)" : "Fare"} value={`₹${smartCard && route.fare.smartCardAmount !== null ? route.fare.smartCardAmount : route.fare.amount}`} />
        ) : (
          <SummaryCard icon="💰" label="Fare" value="—" />
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {route.fare.amount !== null
          ? <>{route.fare.note}{route.fare.type === "estimated" ? ` · Approx. distance ${route.approxDistanceKm} km · ${dayType === "sunday" ? "Sunday/holiday slabs" : "Mon–Sat slabs"}.` : ""}</>
          : <span className="font-medium text-amber-700">{route.fare.note}</span>}
      </p>
      <p className="mt-1 text-xs text-slate-500">Journey time is an estimate (about 2.2 min per stop + 5 min per change). Check station exit / last-mile options locally.</p>

      <ol className="mt-4 space-y-0" aria-label="Step by step journey">
        <li className="flex items-stretch gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white" aria-hidden="true">▶</span>
            <span className="w-0.5 flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          <div className="pb-3 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Board</span>
            <p className="font-semibold text-slate-900">{route.fromName}</p>
          </div>
        </li>

        {route.legs.map((leg, li) => {
          const line = getLine(leg.lineId);
          const fg = line ? lineTextColor(line.color) : "#fff";
          return (
            <li key={li} className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full ring-2 ring-white" style={{ backgroundColor: leg.lineColor }} />
                <span className="w-0.5 flex-1" style={{ backgroundColor: leg.lineColor }} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: leg.lineColor, color: fg }}>
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current opacity-70" />
                  {leg.lineName}
                </span>
                <span className="ml-2 text-xs font-medium text-slate-500">towards {leg.directionName} · {leg.stops} stop{leg.stops === 1 ? "" : "s"}</span>
                <ol className="mt-1.5 space-y-1">
                  {leg.stationNames.slice(1).map((name, si) => (
                    <li key={si} className="flex items-center gap-2 text-sm text-slate-700">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: leg.lineColor }} />
                      {name}
                      {si === leg.stationNames.length - 2 && li < route.legs.length - 1 ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">CHANGE LINE HERE</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
                {li < route.legs.length - 1 ? (
                  <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    🔄 Change at {leg.toName} to the {route.legs[li + 1].lineName} (towards {route.legs[li + 1].directionName})
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}

        <li className="flex items-stretch gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white" aria-hidden="true">■</span>
          </div>
          <div className="pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Destination</span>
            <p className="font-semibold text-slate-900">{route.toName}</p>
          </div>
        </li>
      </ol>

      {route.legs.length > 1 ? (
        <p className="mt-2 text-sm text-slate-600">
          Lines used: {route.linesUsed.join(" → ")}. Change at: {route.interchangeStations.join(", ")}.
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">Direct train on the {route.linesUsed[0]} — no change needed.</p>
      )}
    </section>
  );
}
