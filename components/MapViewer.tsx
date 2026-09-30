"use client";
import { useEffect, useRef, useState } from "react";
import { IconRepeat } from "@/components/icons";

type View = { x: number; y: number; k: number };
const MIN_K = 1;
const MAX_K = 9;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

/**
 * Pan/zoom viewer for the official DMRC network map. The artwork itself is
 * the untouched official SVG (public/map/dmrc-network.svg); its lines fade
 * in once on load via CSS inside the SVG. This component only moves and
 * scales the frame around it.
 */
export default function MapViewer() {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [run, setRun] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; k: number } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => ({ ...v, k: clampK(v.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.d > 0) {
        const startK = pinch.current.k;
        setView((v) => ({ ...v, k: clampK(startK * (d / pinch.current!.d)) }));
      }
    } else if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const zoom = (f: number) => setView((v) => ({ ...v, k: clampK(v.k * f) }));
  const reset = () => setView({ x: 0, y: 0, k: 1 });
  const replay = () => {
    reset();
    setRun((r) => r + 1);
  };

  const btn =
    "flex h-10 w-10 items-center justify-center rounded-lg border border-line-soft bg-surface text-lg font-semibold text-ink shadow-sm transition-colors hover:bg-paper";

  return (
    <div>
      <div
        ref={boxRef}
        role="application"
        aria-label="Delhi Metro network map viewer. Drag to move around the map. Scroll, pinch or use the buttons to zoom."
        className="relative h-[70svh] touch-none select-none overflow-hidden rounded-xl border border-line-soft bg-white"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={() => zoom(1.6)}
      >
        <img
          key={run}
          src="/map/dmrc-network.svg"
          alt="Official DMRC Delhi Metro network map, August 2026, with all lines, stations and interchanges"
          draggable={false}
          className="h-full w-full cursor-grab object-contain active:cursor-grabbing"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
        />
        <div
          className="absolute right-3 top-3 flex flex-col gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button type="button" className={btn} onClick={() => zoom(1.35)} aria-label="Zoom in">+</button>
          <button type="button" className={btn} onClick={() => zoom(1 / 1.35)} aria-label="Zoom out">−</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={replay}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-line-soft bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          <IconRepeat size={15} /> Replay animation
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-line-soft bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
