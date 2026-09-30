import { Suspense } from "react";
import type { Metadata } from "next";
import RoutePlannerClient from "./RoutePlannerClient";
import { IconSpinner } from "@/components/icons";

export const metadata: Metadata = {
  title: "Route Result",
  description: "Step-by-step Delhi Metro route with interchanges, estimated time and approx. fare.",
  alternates: { canonical: "/route" },
};

export default function RoutePage() {
  return (
    <Suspense
      fallback={
        <p className="flex items-center gap-2 py-10 text-sm text-ink-mute">
          <IconSpinner size={18} className="animate-spin" />
          Loading route.
        </p>
      }
    >
      <RoutePlannerClient />
    </Suspense>
  );
}
