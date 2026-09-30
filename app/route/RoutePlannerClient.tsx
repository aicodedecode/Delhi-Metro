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
      <h1 className="text-xl font-extrabold text-slate-900">{from && to ? `${from.name} → ${to.name}` : "Plan a route"}</h1>
      <p className="mb-3 text-sm text-slate-500">Shareable route link. Use the weekday / Sunday toggle for the right fare slabs, and the smart-card toggle for the 10% discounted estimate.</p>
      <JourneyPlanner initialFromId={fromId} initialToId={toId} />
    </div>
  );
}
