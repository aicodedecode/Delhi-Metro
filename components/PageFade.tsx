"use client";
import { usePathname } from "next/navigation";

/**
 * Route-change transition: page content arrives with the app's one authored
 * motion moment (the quiet dm-fade) instead of snapping in. The key is the
 * pathname only, so query-param changes (the planner's shareable URLs) do
 * not re-trigger it. prefers-reduced-motion disables the fade in CSS.
 */
export default function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="dm-fade">
      {children}
    </div>
  );
}
