import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://delhimetrorail.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "Delhi Metro — Journey Planner, Routes, Fares & Stations", template: "%s | Delhi Metro" },
  description: "Plan Delhi Metro journeys: best route, interchanges, estimated time and approx. fare across all 9 lines and 243 stations. Data from verified public sources; verify live status with DMRC.",
  keywords: ["Delhi Metro", "metro route", "journey planner", "metro fare", "Rajiv Chowk", "Kashmere Gate"],
  authors: [{ name: "Delhi Metro Planner" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "en_IN", url: "/", siteName: "Delhi Metro",
    title: "Delhi Metro — Journey Planner",
    description: "Best route, interchanges, estimated time and approx. fare for every Delhi Metro journey.",
  },
  twitter: { card: "summary", title: "Delhi Metro — Journey Planner", description: "Best route, interchanges, estimated time and approx. fare for every Delhi Metro journey." },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0b2a5b", width: "device-width", initialScale: 1 };

const nav = [
  { href: "/", label: "Plan", icon: "🧭" },
  { href: "/stations", label: "Stations", icon: "🚉" },
  { href: "/lines", label: "Lines", icon: "🚇" },
  { href: "/stations/rajiv-chowk", label: "Popular", icon: "⭐" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-100 font-sans text-slate-900">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:font-semibold">Skip to main content</a>
        <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-[#0b2a5b] text-white shadow-sm md:block">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-extrabold tracking-wide" aria-label="Delhi Metro home">DELHI METRO <span className="ml-1 rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-slate-900">PLANNER</span></Link>
            <nav aria-label="Main navigation" className="flex gap-1">
              {nav.map((n) => (<Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">{n.icon} {n.label}</Link>))}
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:pb-10">
          {children}
          <footer className="mt-10 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
            <p>Network data: 243 stations across 9 corridors, compiled from verified public sources (October 2026). Fares use the official distance slabs effective 25 August 2025. Journey times and distances are estimates.</p>
            <p className="mt-1">This is an independent planner, not the official DMRC website. For live status, official timings and announcements, visit <a className="font-medium text-sky-700 underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a>.</p>
          </footer>
        </main>

        <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
          <ul className="grid grid-cols-4">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-slate-700 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500">
                  <span aria-hidden="true" className="text-lg leading-none">{n.icon}</span>{n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
