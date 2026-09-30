import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Delhi Metro Journey Planner",
    short_name: "Delhi Metro",
    description: "Plan metro journeys across Delhi NCR: Delhi Metro, Noida Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro. Routes, changes, estimated times and fares where published.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#0a2a5e",
    lang: "en-IN",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
