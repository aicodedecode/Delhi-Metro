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
 *
 * Touch behaviour: BOTH the container and the <img> carry touch-action:none
 * (the .dm-gesture-surface rule). touch-action is not inherited, so when it
 * was only on the container, touches landed on the image with the browser
 * default and the browser took the gesture over: page pinch-zoom and
 * pull-to-refresh (the reload people saw on phones). With the gesture owned
 * here, pointermove events stream to us instead. Updates are throttled to
 * one setState per animation frame, and the CSS transform transitions with
 * an ease-out only while no gesture is active, so dragging stays glued to
 * the fingers and button zooms glide.
 */
export default function MapViewer() {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [gesturing, setGesturing] = useState(false);
  const [run, setRun] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pending = useRef<View | null>(null);
  const rafId = useRef<number | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 });

  /** Queue a view update; applied once per animation frame. */
  const applyView = (v: View) => {
    pending.current = v;
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (pending.current) {
        setView(pending.current);
        pending.current = null;
      }
    });
  };
  const applyRef = useRef(applyView);
  applyRef.current = applyView;

  useEffect(() => () => { if (rafId.current !== null) cancelAnimationFrame(rafId.current); }, []);

  /**
   * Zoom keeping the content point under screen point (sx, sy) fixed.
   * The transform is translate(x, y) scale(k) with origin at the box centre,
   * so a content point q shows at c + t + k*(q - c). Solve for the new t.
   */
  const zoomAt = (base: View, sx: number, sy: number, factor: number): View => {
    const box = boxRef.current;
    if (!box) return { ...base, k: clampK(base.k * factor) };
    const w = box.clientWidth, h = box.clientHeight;
    const cx = w / 2, cy = h / 2;
    const k2 = clampK(base.k * factor);
    if (k2 === base.k) return base;
    const qx = cx + (sx - cx - base.x) / base.k;
    const qy = cy + (sy - cy - base.y) / base.k;
    return { x: sx - cx - k2 * (qx - cx), y: sy - cy - k2 * (qy - cy), k: k2 };
  };

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cur = pending.current ?? view;
      applyRef.current(zoomAt(cur, e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    // Legacy Safari fires gesturestart for pinches; owning it stops the
    // page-level zoom there too.
    const onGestureStart = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesturing(true);
  };

  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = pending.current ?? view;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Previous frame's other pointer position is needed for the distance
      // ratio; reconstruct it from the stored map before this update.
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
      if (!other) return;
      const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
      const newDist = Math.hypot(a.x - b.x, a.y - b.y);
      if (prevDist <= 0 || newDist <= 0) return;
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      applyView(zoomAt(cur, midX, midY, newDist / prevDist));
    } else if (pointers.current.size === 1) {
      applyView({ ...cur, x: cur.x + (e.clientX - prev.x), y: cur.y + (e.clientY - prev.y) });
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const wasPinch = pointers.current.size >= 2;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setGesturing(false);
    // Double-tap to zoom (touch): a quick second tap near the first.
    if (!wasPinch && e.pointerType === "touch") {
      const now = performance.now();
      const dx = e.clientX - lastTap.current.x;
      const dy = e.clientY - lastTap.current.y;
      if (now - lastTap.current.t < 300 && Math.hypot(dx, dy) < 40) {
        const rect = boxRef.current?.getBoundingClientRect();
        if (rect) applyView(zoomAt(pending.current ?? view, e.clientX - rect.left, e.clientY - rect.top, 1.6));
        lastTap.current = { t: 0, x: 0, y: 0 };
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      }
    }
  };

  const zoomCentre = (f: number) => {
    const box = boxRef.current;
    const cur = pending.current ?? view;
    if (!box) { applyView({ ...cur, k: clampK(cur.k * f) }); return; }
    applyView(zoomAt(cur, box.clientWidth / 2, box.clientHeight / 2, f));
  };
  const reset = () => applyView({ x: 0, y: 0, k: 1 });
  const replay = () => { reset(); setRun((r) => r + 1); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = pending.current ?? view;
    const step = 60;
    if (e.key === "ArrowLeft") { e.preventDefault(); applyView({ ...cur, x: cur.x + step }); }
    else if (e.key === "ArrowRight") { e.preventDefault(); applyView({ ...cur, x: cur.x - step }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); applyView({ ...cur, y: cur.y + step }); }
    else if (e.key === "ArrowDown") { e.preventDefault(); applyView({ ...cur, y: cur.y - step }); }
    else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomCentre(1.25); }
    else if (e.key === "-") { e.preventDefault(); zoomCentre(1 / 1.25); }
    else if (e.key === "0") { e.preventDefault(); reset(); }
  };

  const btn =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-line-soft bg-surface text-lg font-semibold text-ink shadow-sm transition-colors hover:bg-paper";

  return (
    <div>
      <div
        ref={boxRef}
        role="application"
        aria-label="Delhi Metro network map viewer. Drag to move around the map. Scroll, pinch or use the buttons to zoom. Arrow keys move the map when it has focus."
        tabIndex={0}
        className="dm-gesture-surface relative h-[70svh] select-none overflow-hidden rounded-xl border border-line-soft bg-white"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={(e) => {
          const rect = boxRef.current?.getBoundingClientRect();
          if (rect) applyView(zoomAt(pending.current ?? view, e.clientX - rect.left, e.clientY - rect.top, 1.6));
        }}
        onKeyDown={onKeyDown}
      >
        <img
          key={run}
          src="/map/dmrc-network.svg"
          alt="Official DMRC Delhi Metro network map, August 2026, with all lines, stations and interchanges"
          draggable={false}
          className="dm-gesture-surface h-full w-full cursor-grab object-contain active:cursor-grabbing"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transition: gesturing ? "none" : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        <div
          className="absolute right-3 top-3 flex flex-col gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button type="button" className={btn} onClick={() => zoomCentre(1.35)} aria-label="Zoom in">+</button>
          <button type="button" className={btn} onClick={() => zoomCentre(1 / 1.35)} aria-label="Zoom out">−</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={replay}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line-soft bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          <IconRepeat size={15} /> Replay animation
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line-soft bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
