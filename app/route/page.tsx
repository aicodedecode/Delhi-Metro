import { Suspense } from "react";
import type { Metadata } from "next";
import RoutePlannerClient from "./RoutePlannerClient";
import { ogBase } from "@/lib/seo";
import { IconSpinner } from "@/components/icons";

export const metadata: Metadata = {
  title: "Route planner",
  description: "Step-by-step metro route across the Delhi NCR network (Delhi Metro, Aqua Line, Namo Bharat, Meerut Metro, Rapid Metro) with changes, estimated time and fare where published.",
  alternates: { canonical: "/route" },
  openGraph: { ...ogBase, title: "Route planner", description: "Step-by-step route with changes, estimated time and fare where published.", url: "/route" },
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
