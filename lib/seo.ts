import type { Metadata } from "next";

/**
 * Shared Open Graph fields. In Next.js, a page-level `openGraph` object
 * replaces the layout's whole object rather than deep-merging it, so every
 * page that sets openGraph must spread this in or og:image is lost.
 */
export const ogBase: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  siteName: "Delhi Metro",
  images: [{ url: "/og.png", width: 1200, height: 630, alt: "Delhi Metro journey planner" }],
};

/** Canonical site origin, used wherever an absolute URL is required (JSON-LD, sitemap). */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://delhimetrorail.example.com";
