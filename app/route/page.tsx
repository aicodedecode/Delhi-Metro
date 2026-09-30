import { Suspense } from "react";
import type { Metadata } from "next";
import RoutePlannerClient from "./RoutePlannerClient";

export const metadata: Metadata = {
  title: "Route Result",
  description: "Step-by-step Delhi Metro route with interchanges, estimated time and approx. fare.",
  alternates: { canonical: "/route" },
};

export default function RoutePage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading route…</p>}>
      <RoutePlannerClient />
    </Suspense>
  );
}
