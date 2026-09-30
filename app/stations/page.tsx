import type { Metadata } from "next";
import { stations } from "@/lib/data";
import { ogBase } from "@/lib/seo";
import StationsListClient from "./StationsListClient";

export const metadata: Metadata = {
  title: "All Stations",
  description: `Browse all ${stations.length} stations of the Delhi NCR metro network (Delhi Metro, Noida Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro), with line colours and interchange information.`,
  alternates: { canonical: "/stations" },
  openGraph: { ...ogBase, title: "All Stations", description: "Every station on every line, with colours and interchanges.", url: "/stations" },
};

export default function StationsPage() { return <StationsListClient />; }
