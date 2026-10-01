import type { StationFact, StationParking } from "@/types";
import { IconAccessibility } from "@/components/icons";

function parkingLine(p: StationParking): string | null {
  const parts: string[] = [];
  if (p.car) parts.push(`${p.car.toLocaleString("en-IN")} cars`);
  if (p.motorcycle) parts.push(`${p.motorcycle.toLocaleString("en-IN")} motorcycles`);
  if (p.cycle) parts.push(`${p.cycle.toLocaleString("en-IN")} cycles`);
  if (parts.length === 0) return null;
  return `Parking for ${parts.join(" and ")}`;
}

function liftSummary(facts: StationFact): string {
  const lifts = facts.lifts ?? [];
  const nLift = lifts.filter((l) => l.type.toLowerCase().includes("lift")).length;
  const nEsc = lifts.length - nLift;
  const parts: string[] = [];
  if (nLift) parts.push(`${nLift} lift${nLift === 1 ? "" : "s"}`);
  if (nEsc) parts.push(`${nEsc} escalator${nEsc === 1 ? "" : "s"}`);
  return parts.join(" and ") || `${lifts.length} lifts and escalators`;
}

export default function StationDetails({ facts }: { facts: StationFact }) {
  const hasAny =
    (facts.gates?.length ?? 0) > 0 ||
    (facts.platforms?.length ?? 0) > 0 ||
    (facts.facilities?.length ?? 0) > 0 ||
    (facts.parking?.length ?? 0) > 0 ||
    (facts.lifts?.length ?? 0) > 0 ||
    (facts.feederRoutes?.length ?? 0) > 0 ||
    (facts.nearby?.length ?? 0) > 0;

  if (!hasAny) {
    return (
      <div className="py-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Facilities, parking, feeder buses, accessibility</h2>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink-soft">
          Not verified here. Check at the station rather than relying on a guess.
        </p>
      </div>
    );
  }

  return (
    <div className="py-3.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Facilities, gates, platforms</h2>
      <dl className="mt-2 space-y-4 text-[15px] leading-relaxed text-ink-soft">
        {facts.gates && facts.gates.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Gates</dt>
            <dd>
              <ul className="mt-1 space-y-1.5">
                {facts.gates.map((g) => (
                  <li key={g.name}>
                    <span className="font-medium">{g.name}</span>
                    {g.location ? <span className="text-ink-soft">: {g.location}</span> : null}
                    {g.stepFree ? (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[12px] font-medium text-ink-soft">
                        <IconAccessibility size={13} /> Step-free
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {facts.platforms && facts.platforms.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Platforms</dt>
            <dd>
              <ul className="mt-1 space-y-1.5">
                {facts.platforms.map((p) => (
                  <li key={p.name}>
                    <span className="font-medium">{p.name}</span>
                    {p.towards ? <span className="text-ink-soft">: trains towards {p.towards}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {facts.facilities && facts.facilities.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Facilities</dt>
            <dd className="mt-1 space-y-2.5">
              {facts.facilities.map((fg) => (
                <div key={fg.kind}>
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-mute">{fg.kind}</p>
                  <ul className="mt-0.5 space-y-1">
                    {fg.items.map((it, i) => (
                      <li key={`${it.name}-${i}`}>
                        {it.name}
                        {it.location ? <span className="text-ink-mute">, {it.location}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </dd>
          </div>
        ) : null}

        {facts.parking && facts.parking.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Parking</dt>
            <dd>
              <ul className="mt-1 space-y-1.5">
                {facts.parking.map((pk, i) => {
                  const line = parkingLine(pk);
                  return (
                    <li key={i}>
                      {line ? <span className="font-medium">{line}</span> : <span>Parking available</span>}
                      {[pk.provider, pk.location].filter(Boolean).join(" · ") ? (
                        <span className="block text-[13px] text-ink-mute">
                          {[pk.provider, pk.location].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>
        ) : null}

        {facts.lifts && facts.lifts.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Lifts and escalators</dt>
            <dd>
              <p className="mt-1">{liftSummary(facts)} at this station.</p>
              <ul className="mt-1 space-y-1 text-[14px]">
                {facts.lifts.map((l, i) => (
                  <li key={`${l.name}-${i}`}>
                    <span className="font-medium">{l.name}</span>
                    {l.location ? <span className="text-ink-mute">, {l.location}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {facts.feederRoutes && facts.feederRoutes.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Feeder buses</dt>
            <dd>
              <ul className="mt-1 space-y-1.5">
                {facts.feederRoutes.map((fr) => (
                  <li key={fr.route}>
                    <span className="font-medium">Route {fr.route}</span>
                    <span className="text-ink-soft">: {fr.from} to {fr.to}</span>
                    {fr.areas ? <span className="block text-[13px] text-ink-mute">Via {fr.areas}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {facts.nearby && facts.nearby.length > 0 ? (
          <div>
            <dt className="font-medium text-ink">Nearby</dt>
            <dd>
              <ul className="mt-1 space-y-1 text-[14px]">
                {facts.nearby.map((n, i) => (
                  <li key={`${n.name}-${i}`}>
                    <span className="font-medium">{n.name}</span>
                    <span className="text-ink-mute"> ({n.kind.toLowerCase()})</span>
                    {n.distanceKm !== null && n.distanceKm !== undefined ? (
                      <span className="text-ink-soft">, {n.distanceKm} km away</span>
                    ) : null}
                    {n.nearestGate ? <span className="text-ink-mute">, nearest gate {n.nearestGate}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        Gates, platforms, facilities and parking: Delhi Metro (official website).
        Gate and lift working status is not shown; check at the station.
      </p>
    </div>
  );
}
