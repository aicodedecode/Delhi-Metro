"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Station, RouteResultData } from "@/types";
import { getStation } from "@/lib/data";
import { findRoute } from "@/lib/router";
import { searchStations } from "@/lib/search";
import StationPicker from "@/components/StationPicker";
import RouteResult from "@/components/RouteResult";
import { LineBadge } from "@/components/LineBadge";
import { loadRecents, saveRecent, clearRecents, loadFavorites, saveFavorites, type RecentRoute, type FavoriteSlot } from "@/lib/storage";

const POPULAR_IDS = ["rajiv-chowk", "kashmere-gate", "new-delhi", "hauz-khas", "botanical-garden", "dwarka-sector-21", "central-secretariat", "millennium-city-centre-gurugram", "noida-electronic-city", "igi-airport"];

export default function JourneyPlanner({ initialFromId, initialToId }: { initialFromId?: string; initialToId?: string }) {
  const [from, setFrom] = useState<Station | null>(null);
  const [to, setTo] = useState<Station | null>(null);
  const [dayType, setDayType] = useState<"weekday" | "sunday">("weekday");
  const [smartCard, setSmartCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResultData | null>(null);
  const [recents, setRecents] = useState<RecentRoute[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSlot[]>([]);
  const [favPicker, setFavPicker] = useState<string | null>(null);
  const [favQuery, setFavQuery] = useState("");
  const [nearbyNote, setNearbyNote] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");

  useEffect(() => {
    setRecents(loadRecents());
    setFavorites(loadFavorites());
    if (initialFromId) setFrom(getStation(initialFromId) ?? null);
    if (initialToId) setTo(getStation(initialToId) ?? null);
  }, [initialFromId, initialToId]);

  useEffect(() => {
    if (from && to && from.id !== to.id) {
      const r = findRoute(from.id, to.id, { dayType, smartCard });
      setRoute(r);
      setError(r ? null : "No route found between these stations.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayType, smartCard]);

  function plan(f: Station | null, t: Station | null, record = true) {
    if (!f || !t) { setError("Please select both a From and a To station."); setRoute(null); return; }
    if (f.id === t.id) { setError("Please select two different stations."); setRoute(null); return; }
    const r = findRoute(f.id, t.id, { dayType, smartCard });
    if (!r) { setError("No route found between these stations."); setRoute(null); return; }
    setError(null);
    setRoute(r);
    if (record) {
      saveRecent({ fromId: f.id, fromName: f.name, toId: t.id, toName: t.name, ts: Date.now() });
      setRecents(loadRecents());
    }
    if (typeof window !== "undefined") {
      const url = `/route?from=${f.id}&to=${t.id}&day=${dayType}`;
      window.history.replaceState(null, "", url);
    }
  }

  function swap() { const f = from, t = to; setFrom(t); setTo(f); if (f && t) plan(t, f); }

  function setFavoriteStation(label: string, st: Station) {
    const next = favorites.map((x) => (x.label === label ? { ...x, stationId: st.id, stationName: st.name } : x));
    setFavorites(next); saveFavorites(next); setFavPicker(null); setFavQuery("");
  }

  function planFromFavorite(slot: FavoriteSlot, other: Station | null, asFrom: boolean) {
    const st = slot.stationId ? getStation(slot.stationId) : undefined;
    if (!st || !other) return;
    if (asFrom) { setFrom(st); setTo(other); plan(st, other); } else { setFrom(other); setTo(st); plan(other, st); }
  }

  function onLocate() {
    if (!("geolocation" in navigator)) { setNearbyNote("Location is not supported on this device. Search by station name instead."); return; }
    setNearbyNote("Checking your location…");
    navigator.geolocation.getCurrentPosition(
      () => setNearbyNote("Nearby stations need verified station locations — station coordinates are not yet verified in this dataset, so distance sorting is unavailable. Please search by station name instead."),
      () => setNearbyNote("Location permission denied. No problem — search by station name instead; location is never required."),
      { timeout: 8000 }
    );
  }

  const favResults = useMemo(() => (favQuery.trim() ? searchStations(favQuery, 6) : []), [favQuery]);
  const manualResults = useMemo(() => (manualQuery.trim() ? searchStations(manualQuery, 6) : []), [manualQuery]);
  const popular = POPULAR_IDS.map((id) => getStation(id)).filter(Boolean) as Station[];

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-[#0b2a5b]/95 px-4 pb-4 pt-4 text-white shadow-md backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <h1 className="text-center text-2xl font-extrabold tracking-wide">DELHI METRO</h1>
        <p className="mt-0.5 text-center text-xs text-sky-200">Journey planner · Routes, interchanges &amp; approx. fares</p>
        <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); plan(from, to); }} aria-label="Journey planner">
          <div className="rounded-xl bg-white p-2 text-slate-900">
            <StationPicker label="From station" value={from} onChange={setFrom} placeholder="From Station — e.g. Rajiv Chowk" accentColor="#009444" />
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={swap} aria-label="Swap From and To stations" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-amber-400 px-4 text-sm font-bold text-slate-900 shadow hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              ⇅ Swap
            </button>
          </div>
          <div className="rounded-xl bg-white p-2 text-slate-900">
            <StationPicker label="To station" value={to} onChange={setTo} placeholder="To Station — e.g. Hauz Khas" accentColor="#e30613" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm">
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">Day type for fare</legend>
              <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5"><input type="radio" name="day" checked={dayType === "weekday"} onChange={() => setDayType("weekday")} className="h-4 w-4" /> Mon–Sat</label>
              <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5"><input type="radio" name="day" checked={dayType === "sunday"} onChange={() => setDayType("sunday")} className="h-4 w-4" /> Sunday / Holiday</label>
            </fieldset>
            <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5"><input type="checkbox" checked={smartCard} onChange={(e) => setSmartCard(e.target.checked)} className="h-4 w-4" /> Smart card (10% off est.)</label>
          </div>
          <button type="submit" className="min-h-[52px] w-full rounded-xl bg-amber-400 text-lg font-extrabold text-slate-900 shadow hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Find Route
          </button>
        </form>
        {error ? <p role="alert" className="mt-2 rounded-lg bg-rose-600 px-3 py-2 text-center text-sm font-semibold">{error}</p> : null}
      </div>

      {route ? <RouteResult route={route} dayType={dayType} smartCard={smartCard} /> : null}

      <section aria-label="Metro status" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Metro Status</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">⚪ Live status unavailable.</p>
        <p className="mt-1 text-xs text-slate-500">No verified live DMRC feed is connected yet, so no service state is shown rather than guessed. Check <a className="font-medium text-sky-700 underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a> for official announcements.</p>
      </section>

      <section aria-label="Nearby stations" className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">📍 Stations Near Me</h2>
        <button type="button" onClick={onLocate} className="mt-2 min-h-[44px] rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Use my location</button>
        {nearbyNote ? <p className="mt-2 text-sm text-slate-600" role="status">{nearbyNote}</p> : <p className="mt-2 text-sm text-slate-500">Location is optional and never required for route planning.</p>}
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="manual-near">…or search a place / station</label>
        <input id="manual-near" type="text" value={manualQuery} onChange={(e) => setManualQuery(e.target.value)} placeholder="Type a station name" className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200" autoComplete="off" />
        {manualResults.length > 0 ? (
          <ul className="mt-2 divide-y divide-slate-100">
            {manualResults.map((st) => (
              <li key={st.id} className="flex min-h-[44px] items-center justify-between gap-2 py-1.5">
                <Link href={`/stations/${st.id}`} className="font-medium text-sky-800 underline-offset-2 hover:underline">{st.name}</Link>
                <span className="flex gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-label="Favourite stations" className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">⭐ My Places</h2>
        <ul className="mt-2 space-y-2">
          {favorites.map((slot) => (
            <li key={slot.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex min-h-[40px] flex-wrap items-center gap-2">
                <span className="w-16 text-sm font-bold text-slate-700">{slot.label}</span>
                {slot.stationName ? (
                  <>
                    <span className="text-sm font-medium text-slate-900">{slot.stationName}</span>
                    <button type="button" className="min-h-[36px] rounded bg-sky-700 px-2.5 text-xs font-semibold text-white" onClick={() => { const st = getStation(slot.stationId!); if (st) { setFrom(st); setTo(null); } }}>Set as From</button>
                    <button type="button" className="min-h-[36px] rounded bg-slate-700 px-2.5 text-xs font-semibold text-white" onClick={() => { const st = getStation(slot.stationId!); if (st) { setTo(st); setFrom(null); } }}>Set as To</button>
                    {from && slot.stationId !== from.id ? <button type="button" className="min-h-[36px] rounded bg-emerald-700 px-2.5 text-xs font-semibold text-white" onClick={() => planFromFavorite(slot, from, false)}>{`From ${from.name} →`}</button> : null}
                    {to && slot.stationId !== to.id ? <button type="button" className="min-h-[36px] rounded bg-emerald-700 px-2.5 text-xs font-semibold text-white" onClick={() => planFromFavorite(slot, to, true)}>{`→ To ${to.name}`}</button> : null}
                    <button type="button" className="min-h-[36px] rounded bg-white px-2.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200" onClick={() => { setFavPicker(slot.label); setFavQuery(""); }}>Change</button>
                    <button type="button" aria-label={`Clear ${slot.label}`} className="min-h-[36px] rounded bg-white px-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200" onClick={() => { const next = favorites.map((x) => x.label === slot.label ? { ...x, stationId: null, stationName: null } : x); setFavorites(next); saveFavorites(next); }}>Clear</button>
                  </>
                ) : (
                  <button type="button" className="min-h-[36px] rounded bg-sky-700 px-3 text-xs font-semibold text-white" onClick={() => { setFavPicker(slot.label); setFavQuery(""); }}>+ Set station</button>
                )}
              </div>
              {favPicker === slot.label ? (
                <div className="mt-2">
                  <input aria-label={`Search station for ${slot.label}`} type="text" value={favQuery} onChange={(e) => setFavQuery(e.target.value)} placeholder="Search station…" className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200" autoComplete="off" />
                  {favResults.length > 0 ? (
                    <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                      {favResults.map((st) => (
                        <li key={st.id}><button type="button" className="flex min-h-[44px] w-full items-center justify-between px-3 text-left" onClick={() => setFavoriteStation(slot.label, st)}><span className="font-medium">{st.name}</span><span className="flex gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span></button></li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Saved on this device only (local storage) — no account needed.</p>
      </section>

      {recents.length > 0 ? (
        <section aria-label="Recent journeys" className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">🕘 Recent Journeys</h2>
            <button type="button" onClick={() => { clearRecents(); setRecents([]); }} className="min-h-[36px] rounded px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Clear history</button>
          </div>
          <ul className="mt-2 space-y-1">
            {recents.map((r, i) => (
              <li key={i}>
                <button type="button" className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-left hover:bg-sky-50" onClick={() => { const f = getStation(r.fromId), t = getStation(r.toId); if (f && t) { setFrom(f); setTo(t); plan(f, t, false); } }}>
                  <span className="text-sm font-medium text-slate-800">{r.fromName} <span aria-hidden="true">→</span> {r.toName}</span>
                  <span aria-hidden="true" className="text-slate-400">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Popular stations" className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Popular Stations</h2>
        <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {popular.map((st) => (
            <li key={st.id}>
              <Link href={`/stations/${st.id}`} className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-2 hover:bg-sky-50">
                <span className="font-medium text-slate-800">{st.name}{st.isInterchange ? <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">🔄 Interchange</span> : null}</span>
                <span className="flex shrink-0 gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
