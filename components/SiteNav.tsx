"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconRoute, IconNode, IconWaypoints, IconMap, IconTicket } from "@/components/icons";

const items = [
  { href: "/", label: "Plan", Icon: IconRoute },
  { href: "/map", label: "Map", Icon: IconMap },
  { href: "/stations", label: "Stations", Icon: IconNode },
  { href: "/lines", label: "Lines", Icon: IconWaypoints },
  { href: "/fares", label: "Fares", Icon: IconTicket },
];

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 hidden border-b border-ink-deep bg-ink text-white md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2" aria-label="Delhi Metro journey planner home">
          <span className="font-display text-xl tracking-tight">Delhi Metro</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Journey planner</span>
        </Link>
        <nav aria-label="Main navigation">
          <ul className="flex gap-1">
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-surface md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink-mute"
                }`}
              >
                <Icon size={22} className={active ? "text-accent" : undefined} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
