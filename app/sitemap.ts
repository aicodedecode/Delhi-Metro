import type { MetadataRoute } from "next";
import { stations, lines } from "@/lib/data";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://delhimetrorail.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/stations`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/lines`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/route`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/map`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/fares`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
  const stationPages: MetadataRoute.Sitemap = stations.map((s) => ({ url: `${base}/stations/${s.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 }));
  const linePages: MetadataRoute.Sitemap = lines.map((l) => ({ url: `${base}/lines/${l.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 }));
  return [...staticPages, ...stationPages, ...linePages];
}
