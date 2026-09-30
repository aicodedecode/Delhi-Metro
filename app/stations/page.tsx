import type { Metadata } from "next";
import StationsListClient from "./StationsListClient";

export const metadata: Metadata = {
  title: "All Stations",
  description: "Browse all 243 Delhi Metro stations across 9 lines, with line colours and interchange information.",
  alternates: { canonical: "/stations" },
};

export default function StationsPage() { return <StationsListClient />; }
