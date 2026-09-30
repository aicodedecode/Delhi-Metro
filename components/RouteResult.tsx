import type { RouteResultData } from "@/types";
import { getLine } from "@/lib/data";
import { lineInk, LineBadge, InterchangeChip } from "./LineBadge";
import { IconPin, IconSwap } from "@/components/icons";

function TicketCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
      <div className={`mt-0.5 truncate text-lg font-semibold tabular-nums ${muted ? "text-base text-ink-mute" : "text-ink"}`}>{value}</div>
    </div>
  );
}

export default function RouteResult({ route, dayType, smartCard }: { route: RouteResultData; dayType: "weekday" | "sunday"; smartCard: boolean }) {
  const fareValue = smartCard && route.fare.smartCardAmount !== null ? route.fare.smartCardAmount : route.fare.amount;

  return (
    <section aria-label="Route result" className="dm-fade mt-5">
      {/* Ticket strip: the summary */}
      <div className="grid grid-cols-2 divide-x divide-line-soft rounded-2xl border border-line-soft bg-surface sm:grid-cols-4">
        <TicketCell label={smartCard && route.fare.smartCardAmount !== null ? "Fare, smart card" : "Fare"} value={fareValue !== null ? `₹${fareValue}` : "Unavailable"} muted={fareValue === null} />
        <TicketCell label="Minutes" value={`${route.estimatedMinutes} min`} />
        <TicketCell label="Stations" value={`${route.totalStations}`} />
        <TicketCell label="Changes" value={`${route.interchanges}`} />
      </div>

      <p className="mt-2.5 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        {route.fare.amount !== null
          ? <>{route.fare.note} Approx. distance {route.approxDistanceKm} km. {dayType === "sunday" ? "Sunday or holiday slabs." : "Weekday slabs."}</>
          : route.fare.note}
      </p>
      <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-ink-mute">Journey time is an estimate, about 2.2 minutes per stop plus 5 minutes per change.</p>

      {/* Rail diagram */}
      <ol className="mt-5" aria-label="Step by step journey">
        {/* Origin */}
        <li className="grid grid-cols-[26px_1fr] gap-3">
          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-ink text-white">
              <IconPin size={14} />
            </span>
            <span className="w-[3px] flex-1 rounded-full" style={{ backgroundColor: route.legs[0]?.lineColor }} />
          </div>
          <div className="pb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Board</div>
            <p className="text-xl font-semibold text-ink">{route.fromName}</p>
          </div>
        </li>

        {route.legs.map((leg, li) => {
          const line = getLine(leg.lineId);
          const interchangeNames = new Set(route.interchangeStations);
          return (
            <li key={li} className="grid grid-cols-[26px_1fr] gap-3">
              <div className="flex flex-col items-center" aria-hidden="true">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: leg.lineColor, boxShadow: "0 0 0 2.5px #fbfaf7, 0 0 0 4px " + leg.lineColor + "33" }}
                />
                <span className="w-[3px] flex-1 rounded-full" style={{ backgroundColor: leg.lineColor }} />
              </div>
              <div className="min-w-0 pb-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: leg.lineColor, color: lineInk(leg.lineColor) }}>
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                    {leg.lineName}
                  </span>
                  <span className="text-[13px] text-ink-mute">towards {leg.directionName}, {leg.stops} stop{leg.stops === 1 ? "" : "s"}</span>
                </div>
                <ol className="mt-2 space-y-1.5">
                  {leg.stationNames.slice(1).map((name, si) => (
                    <li key={si} className="flex items-center gap-2 text-[15px] text-ink-soft">
                      <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: leg.lineColor }} />
                      <span>{name}</span>
                      {interchangeNames.has(name) ? <InterchangeChip /> : null}
                    </li>
                  ))}
                </ol>
                {li < route.legs.length - 1 ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2.5">
                    <span className="mt-0.5 shrink-0 text-accent-deep" aria-hidden="true"><IconSwap size={16} /></span>
                    <p className="text-sm leading-snug text-ink">
                      <span className="font-semibold">Change at {leg.toName}</span> to the {route.legs[li + 1].lineName}, towards {route.legs[li + 1].directionName}
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}

        {/* Destination */}
        <li className="grid grid-cols-[26px_1fr] gap-3">
          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="h-[13px] w-[13px] rotate-45 bg-ink" style={{ borderRadius: 3 }} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Destination</div>
            <p className="text-xl font-semibold text-ink">{route.toName}</p>
          </div>
        </li>
      </ol>

      <p className="mt-4 max-w-prose text-sm text-ink-mute">
        {route.legs.length > 1
          ? <>Lines used: {route.linesUsed.join(", ")}. Change at: {route.interchangeStations.join(", ")}.</>
          : <>Direct train on the {route.linesUsed[0]}. No change needed.</>}
      </p>
    </section>
  );
}
