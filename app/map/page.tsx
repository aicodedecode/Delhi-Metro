import type { Metadata } from "next";
import Link from "next/link";
import MapViewer from "@/components/MapViewer";
import { ogBase } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Network map",
  description: "The official DMRC Delhi Metro network map (August 2026), shown unchanged and animated: every line, station and interchange across Delhi NCR, including the Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro.",
  alternates: { canonical: "/map" },
  openGraph: { ...ogBase, title: "Network map", description: "The official network map, shown unchanged and animated. Drag and zoom to explore.", url: "/map" },
};

export default function MapPage() {
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">Network map</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-mute">
        The official DMRC map of the Delhi metro network, August 2026, shown exactly as published.
        It covers Delhi Metro, the Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro.
        The lines draw themselves in once when the page opens. Drag to move around the map, and
        zoom with the buttons, your scroll wheel, the arrow keys or a pinch.
      </p>
      <div className="mt-4">
        <MapViewer />
      </div>
      <p className="mt-4 max-w-prose text-[13px] leading-relaxed text-ink-mute">
        Map: Delhi Metro Rail Corporation, as on August 2026. Planning a trip?{" "}
        <Link className="font-medium text-accent underline" href="/">Plan your journey</Link>{" "}
        for the route, the fare and every change, step by step.
      </p>
    </div>
  );
}
