import type { RouteResultData, RouteLeg } from "@/types";
import { lineHopMinutes, INTERCHANGE_PENALTY_MIN } from "@/lib/router";
import { lineInk } from "./LineBadge";
import { IconPin, IconSwap, IconWalk, IconClock } from "@/components/icons";

function StatTile({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
      <div className={`mt-0.5 truncate text-lg font-semibold tabular-nums ${muted ? "text-base text-ink-mute" : "text-ink"}`}>{value}</div>
    </div>
  );
}

function LineChip({ leg }: { leg: RouteLeg }) {
  // Name never sits on the line colour at small sizes (some colours cannot
  // reach 4.5:1); the colour rides as a swatch, the name in ink beside it.
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-ink/20" style={{ backgroundColor: leg.lineColor }} />
      {leg.lineName}
    </span>
  );
}

/**
 * A change between two legs. Same station record: a plain change. Different
 * station records (walk links between operators): a walk block that names
 * both stations, because you leave one station and enter another on foot.
 */
function ChangeBlock({ prev, next }: { prev: RouteLeg; next: RouteLeg }) {
  const walk = prev.toId !== next.fromId;
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent-deep ring-1 ring-accent/25" aria-hidden="true">
        {walk ? <IconWalk size={17} /> : <IconSwap size={16} />}
      </span>
      <div className="min-w-0 text-sm leading-snug text-ink">
        {walk ? (
          <p>
            <span className="font-semibold">Walk to {next.fromName}</span> and change to the {next.lineName}, towards {next.directionName}.
            <span className="block text-[13px] text-ink-soft">The two stations are linked on foot. Allow about {INTERCHANGE_PENALTY_MIN} minutes.</span>
          </p>
        ) : (
          <p>
            <span className="font-semibold">Change at {prev.toName}</span> to the {next.lineName}, towards {next.directionName}.
          </p>
        )}
      </div>
    </div>
  );
}

export default function RouteResult({ route, dayType, smartCard }: { route: RouteResultData; dayType: "weekday" | "sunday"; smartCard: boolean }) {
  const fareValue = smartCard && route.fare.smartCardAmount !== null ? route.fare.smartCardAmount : route.fare.amount;
  const firstLeg = route.legs[0];
  const lastLeg = route.legs[route.legs.length - 1];
  const startsWithWalk = firstLeg !== undefined && firstLeg.fromId !== route.fromId;
  const endsWithWalk = lastLeg !== undefined && lastLeg.toId !== route.toId;
  const interchangeNames = new Set(route.interchangeStations);

  // Pre-compute the rail: one row per station after boarding, each with its
  // journey-wide number and cumulative estimated minutes. The boundary cost
  // is added once per change, exactly as in the router's estimate.
  type Row = { name: string; leg: RouteLeg };
  const rows: Row[] = [];
  route.legs.forEach((leg) => {
    leg.stationNames.slice(1).forEach((name) => rows.push({ name, leg }));
  });
  let cumulative = 0;
  const cumByRow = rows.map((row, i) => {
    const prevLeg = i === 0 ? null : rows[i - 1].leg;
    if (prevLeg && prevLeg !== row.leg) cumulative += INTERCHANGE_PENALTY_MIN;
    cumulative += lineHopMinutes(row.leg.lineId);
    return Math.round(cumulative);
  });

  return (
    <section aria-label="Route result" className="dm-fade mt-5">
      {/* Summary header */}
      <p className="text-[15px] font-semibold text-ink">
        {route.fromName} <span aria-hidden="true" className="text-ink-mute">→</span> {route.toName}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line-soft bg-line-soft sm:grid-cols-4">
        <StatTile label="Minutes" value={`${route.estimatedMinutes} min`} />
        <StatTile label="Line changes" value={`${route.interchanges}`} />
        <StatTile label="Stations" value={`${route.totalStations}`} />
        <StatTile label={smartCard && route.fare.smartCardAmount !== null ? "Fare, smart card" : "Fare"} value={fareValue !== null ? `₹${fareValue}` : "Not available"} muted={fareValue === null} />
      </div>
      <p className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-relaxed text-ink-mute">
        <span className="mt-px shrink-0" aria-hidden="true"><IconClock size={14} /></span>
        <span>Times shown are estimates. Leave a little extra time for your journey.</span>
      </p>
      <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        {route.fare.amount !== null
          ? <>{route.fare.note} Approx. distance {route.approxDistanceKm} km. {dayType === "sunday" ? "Sunday or holiday slabs." : "Weekday slabs."}</>
          : route.fare.note}
      </p>

      {/* Rail diagram */}
      <ol className="mt-5" aria-label="Step by step journey">
        {/* Origin */}
        <li className="grid grid-cols-[32px_1fr] gap-3">
          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
              <IconPin size={14} />
            </span>
            <span className="w-[3px] flex-1 rounded-full" style={{ backgroundColor: firstLeg?.lineColor ?? "#0a2a5e" }} />
          </div>
          <div className="pb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Board</div>
            <p className="text-xl font-semibold text-ink">{route.fromName}</p>
            {!startsWithWalk && firstLeg ? (
              <p className="mt-1.5 flex flex-wrap items-center gap-2">
                <LineChip leg={firstLeg} />
                <span className="text-[13px] text-ink-mute">Towards {firstLeg.directionName}</span>
              </p>
            ) : null}
          </div>
        </li>

        {startsWithWalk && firstLeg ? (
          <li className="grid grid-cols-[32px_1fr] gap-3">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className="w-[3px] flex-1 rounded-full" style={{ backgroundColor: firstLeg.lineColor }} />
            </div>
            <div className="pb-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent-deep ring-1 ring-accent/25" aria-hidden="true"><IconWalk size={17} /></span>
                <p className="text-sm leading-snug text-ink">
                  <span className="font-semibold">Walk to {firstLeg.fromName}</span> station and board the {firstLeg.lineName}, towards {firstLeg.directionName}.
                </p>
              </div>
            </div>
          </li>
        ) : null}

        {route.legs.map((leg, li) => {
          const legRows = rows.filter((r) => r.leg === leg);
          const firstRowIdx = rows.indexOf(legRows[0]);
          return (
            <li key={li} className="grid grid-cols-[32px_1fr] gap-3">
              <div className="flex flex-col items-center" aria-hidden="true">
                <span className="w-[3px] flex-1 rounded-full" style={{ backgroundColor: leg.lineColor }} />
              </div>
              <div className="min-w-0 pb-4">
                {li > 0 ? <ChangeBlock prev={route.legs[li - 1]} next={leg} /> : null}
                <ol className="mt-1 space-y-1" start={firstRowIdx + 1}>
                  {legRows.map((row, ri) => {
                    const n = firstRowIdx + ri + 1;
                    return (
                      <li key={ri} value={n} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl font-extrabold leading-none tabular-nums"
                          style={{ backgroundColor: leg.lineColor, color: lineInk(leg.lineColor) }}
                        >
                          {n}
                        </span>
                        <span className="min-w-0">{row.name}</span>
                        {interchangeNames.has(row.name) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-deep">Change here</span>
                        ) : null}
                        <span className="ml-auto shrink-0 text-[13px] tabular-nums text-ink-mute">~{cumByRow[firstRowIdx + ri]} min</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </li>
          );
        })}

        {route.legs.length === 0 ? (
          <li className="grid grid-cols-[32px_1fr] gap-3">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className="w-[3px] flex-1 rounded-full bg-rail" />
            </div>
            <div className="pb-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent-deep ring-1 ring-accent/25" aria-hidden="true"><IconWalk size={17} /></span>
                <p className="text-sm leading-snug text-ink">
                  <span className="font-semibold">Walk to {route.toName}</span> station.
                  <span className="block text-[13px] text-ink-soft">The two stations are linked on foot. Allow about {INTERCHANGE_PENALTY_MIN} minutes.</span>
                </p>
              </div>
            </div>
          </li>
        ) : null}

        {endsWithWalk && lastLeg ? (
          <li className="grid grid-cols-[32px_1fr] gap-3">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className="w-[3px] flex-1 rounded-full bg-rail" />
            </div>
            <div className="pb-4">
              <div className="flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent-deep ring-1 ring-accent/25" aria-hidden="true"><IconWalk size={17} /></span>
                <p className="text-sm leading-snug text-ink">
                  <span className="font-semibold">Walk to {route.toName}</span> station.
                  <span className="block text-[13px] text-ink-soft">{lastLeg.toName} and {route.toName} are linked on foot. Allow about {INTERCHANGE_PENALTY_MIN} minutes.</span>
                </p>
              </div>
            </div>
          </li>
        ) : null}

        {/* Destination */}
        <li className="grid grid-cols-[32px_1fr] gap-3">
          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="h-[13px] w-[13px] rotate-45 bg-ink" style={{ borderRadius: 3 }} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">You arrive at</div>
            <p className="text-xl font-semibold text-ink">{route.toName}</p>
            <p className="mt-0.5 text-[13px] tabular-nums text-ink-mute">About {route.estimatedMinutes} minutes in total.</p>
          </div>
        </li>
      </ol>

      <p className="mt-4 max-w-prose text-sm text-ink-mute">
        {route.legs.length > 1
          ? <>Lines used: {route.linesUsed.join(", ")}.</>
          : route.interchanges > 0
            ? <>Direct train on the {route.linesUsed[0]}, then a short walk to {route.toName}.</>
            : <>Direct train on the {route.linesUsed[0]}. No change needed.</>}
      </p>
    </section>
  );
}
