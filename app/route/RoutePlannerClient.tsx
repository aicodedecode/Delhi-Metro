"use client";
import { useSearchParams } from "next/navigation";
import { getStation } from "@/lib/data";
import JourneyPlanner from "@/features/JourneyPlanner";

export default function RoutePlannerClient() {
  const params = useSearchParams();
  const fromId = params.get("from") ?? undefined;
  const toId = params.get("to") ?? undefined;
  const from = fromId ? getStation(fromId) : undefined;
  const to = toId ? getStation(toId) : undefined;
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">
        {from && to ? `${from.name} to ${to.name}` : "Plan a route"}
      </h1>
      <p className="mt-1 max-w-prose text-sm text-ink-mute">
        Shareable route link. Use the weekday or Sunday toggle for the right fare slabs,
        and the smart card toggle for the 10% discounted estimate.
      </p>
      <div className="mt-4">
        <JourneyPlanner initialFromId={fromId} initialToId={toId} headingLevel="p" />
      </div>
    </div>
  );
}
