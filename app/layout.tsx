import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileNav } from "@/components/SiteNav";
import PageFade from "@/components/PageFade";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { lines, stations } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

const ui = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-display",
});

const baseUrl = siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "Delhi Metro Journey Planner: Routes, Fares and Stations", template: "%s | Delhi Metro" },
  description: `Plan journeys across the Delhi Metro, Noida Aqua Line, Namo Bharat, Meerut Metro and Rapid Metro: best route, changes, estimated time and fare where published. ${lines.length} lines, ${stations.length} stations. Data from verified public sources; verify live status with the operator.`,
  keywords: ["Delhi Metro", "metro route", "journey planner", "metro fare", "Rajiv Chowk", "Kashmere Gate"],
  authors: [{ name: "Delhi Metro Planner" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "en_IN", url: "/", siteName: "Delhi Metro",
    title: "Delhi Metro Journey Planner",
    description: "Best route, changes, estimated time and fare where published, for every journey across the Delhi NCR metro network.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Delhi Metro journey planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Delhi Metro Journey Planner",
    description: "Best route, changes, estimated time and fare where published, across the Delhi NCR metro network.",
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0a2a5e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink-soft">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:font-semibold focus:text-ink">Skip to main content</a>
        <DesktopNav />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:pb-12">
          <PageFade>
            {children}
          </PageFade>
          <footer className="mt-12 border-t border-line-soft pt-5 text-[13px] leading-relaxed text-ink-mute">
            <p>Network data: {stations.length} stations across {lines.length} lines run by DMRC, NMRC, NCRTC and Rapid Metro, compiled from verified public sources (October 2026). DMRC fares use the official distance slabs effective 25 August 2025. Journey times and distances are estimates.</p>
            <p className="mt-2">This is an independent planner, not the official DMRC website. For live status, official timings and announcements, visit <a className="font-medium text-accent underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a>. Tickets, QR codes and smart card recharge are only in the official channels: the DMRC Travel app and station counters. This planner does not sell tickets or recharge cards.</p>
            <p className="mt-2">Plan with the <Link className="font-medium text-accent underline" href="/">journey planner</Link>, check the <Link className="font-medium text-accent underline" href="/fares">Delhi Metro fare slabs</Link>, or browse <Link className="font-medium text-accent underline" href="/lines">all lines</Link> and <Link className="font-medium text-accent underline" href="/stations">all stations</Link>.</p>
          </footer>
        </main>
        <MobileNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
