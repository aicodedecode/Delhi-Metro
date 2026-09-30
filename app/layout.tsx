import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileNav } from "@/components/SiteNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://delhimetrorail.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "Delhi Metro Journey Planner: Routes, Fares and Stations", template: "%s | Delhi Metro" },
  description: "Plan Delhi Metro journeys: best route, interchanges, estimated time and approx. fare across all 9 lines and 243 stations. Data from verified public sources; verify live status with DMRC.",
  keywords: ["Delhi Metro", "metro route", "journey planner", "metro fare", "Rajiv Chowk", "Kashmere Gate"],
  authors: [{ name: "Delhi Metro Planner" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "en_IN", url: "/", siteName: "Delhi Metro",
    title: "Delhi Metro Journey Planner",
    description: "Best route, interchanges, estimated time and approx. fare for every Delhi Metro journey.",
  },
  twitter: { card: "summary", title: "Delhi Metro Journey Planner", description: "Best route, interchanges, estimated time and approx. fare for every Delhi Metro journey." },
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
          {children}
          <footer className="mt-12 border-t border-line-soft pt-5 text-[13px] leading-relaxed text-ink-mute">
            <p>Network data: 243 stations across 9 corridors, compiled from verified public sources (October 2026). Fares use the official distance slabs effective 25 August 2025. Journey times and distances are estimates.</p>
            <p className="mt-2">This is an independent planner, not the official DMRC website. For live status, official timings and announcements, visit <a className="font-medium text-accent underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a>.</p>
          </footer>
        </main>
        <MobileNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
