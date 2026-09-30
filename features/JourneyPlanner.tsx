"use client";
import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import type { Station, RouteResultData } from "@/types";
import { getStation, lines, stations } from "@/lib/data";
import { findRoute, type RoutePreference } from "@/lib/router";
import { searchStations } from "@/lib/search";
import StationPicker from "@/components/StationPicker";
import RouteResult from "@/components/RouteResult";
import { LineBadge, InterchangeChip } from "@/components/LineBadge";
import { IconSwap, IconAlert, IconPin, IconSearch, IconHouse, IconBriefcase, IconGraduationCap, IconHeart, IconArrowRight } from "@/components/icons";
import { loadRecents, saveRecent, clearRecents, loadFavorites, saveFavorites, type RecentRoute, type FavoriteSlot } from "@/lib/storage";

const POPULAR_IDS = ["rajiv-chowk", "kashmere-gate", "new-delhi", "hauz-khas", "botanical-garden", "dwarka-sector-21", "central-secretariat", "millennium-city-centre-gurugram", "noida-electronic-city", "igi-airport"];

const FAV_ICONS: Record<string, typeof IconHouse> = {
  Home: IconHouse,
  Work: IconBriefcase,
  College: IconGraduationCap,
  Favourite: IconHeart,
};

function Section({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`mt-9 ${className}`}>
      <h2 id={id} className="mb-2.5 text-[17px] font-semibold text-ink">{label}</h2>
      {children}
    </section>
  );
}

/** One-line summary shown on each route-preference option. */
function optionSummary(r: RouteResultData): string {
  const fare = r.fare.amount !== null ? ` · ₹${r.fare.amount}` : "";
  return `${r.estimatedMinutes} min · ${r.interchanges} change${r.interchanges === 1 ? "" : "s"} · ${r.totalStations} stations${fare}`;
}

export default function JourneyPlanner({ initialFromId, initialToId, initialPreference, headingLevel = "h1" }: { initialFromId?: string; initialToId?: string; initialPreference?: RoutePreference; headingLevel?: "h1" | "p" }) {
  const [from, setFrom] = useState<Station | null>(null);
  const [to, setTo] = useState<Station | null>(null);
  const [dayType, setDayType] = useState<"weekday" | "sunday">("weekday");
  const [smartCard, setSmartCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Both route options for the planned pair. When they follow the same path
  // there is effectively one option and no toggle is shown.
  const [options, setOptions] = useState<{ fastest: RouteResultData; fewest: RouteResultData; same: boolean } | null>(null);
  const [preference, setPreference] = useState<RoutePreference>(initialPreference ?? "fastest");
  // The station pair that produced the visible route. Day/smart-card toggles only
  // auto-replan when the inputs still match it; any input change clears the stale result.
  const [planned, setPlanned] = useState<{ fromId: string; toId: string } | null>(null);
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

  /** Compute both route options for a pair; null when no route exists. */
  function computeOptions(fId: string, tId: string) {
    const fastest = findRoute(fId, tId, { dayType, smartCard, preference: "fastest" });
    if (!fastest) return null;
    const fewest = findRoute(fId, tId, { dayType, smartCard, preference: "fewest-changes" }) ?? fastest;
    return { fastest, fewest, same: fastest.path.join("|") === fewest.path.join("|") };
  }

  useEffect(() => {
    if (planned && from?.id === planned.fromId && to?.id === planned.toId && from.id !== to.id) {
      const pair = computeOptions(from.id, to.id);
      setOptions(pair);
      setError(pair ? null : "No route found between these stations.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayType, smartCard]);

  /** Drop a route whose inputs no longer match — never show a stale journey. */
  function clearStale(nextFrom: Station | null, nextTo: Station | null) {
    if (planned && (nextFrom?.id !== planned.fromId || nextTo?.id !== planned.toId)) {
      setPlanned(null);
      setOptions(null);
      setError(null);
      if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function syncUrl(fId: string, tId: string, pref: RoutePreference) {
    if (typeof window === "undefined") return;
    const url = `/route?from=${fId}&to=${tId}&day=${dayType}${pref === "fewest-changes" ? "&pref=fewest-changes" : ""}`;
    window.history.replaceState(null, "", url);
  }

  function choosePreference(p: RoutePreference) {
    setPreference(p);
    if (planned) syncUrl(planned.fromId, planned.toId, p);
  }

  function plan(f: Station | null, t: Station | null, record = true) {
    if (!f || !t) { setError("Please select both a From and a To station."); setOptions(null); return; }
    if (f.id === t.id) { setError("Please select two different stations."); setOptions(null); return; }
    const pair = computeOptions(f.id, t.id);
    if (!pair) { setError("No route found between these stations."); setOptions(null); return; }
    setError(null);
    setOptions(pair);
    setPlanned({ fromId: f.id, toId: t.id });
    if (record) {
      saveRecent({ fromId: f.id, fromName: f.name, toId: t.id, toName: t.name, ts: Date.now() });
      setRecents(loadRecents());
    }
    syncUrl(f.id, t.id, preference);
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
    setNearbyNote("Checking your location.");
    navigator.geolocation.getCurrentPosition(
      () => setNearbyNote("Nearby stations need verified station locations. Station coordinates are not yet verified in this dataset, so distance sorting is unavailable. Please search by station name instead."),
      () => setNearbyNote("Location permission denied. No problem: search by station name instead. Location is never required."),
      { timeout: 8000 }
    );
  }

  const favResults = useMemo(() => (favQuery.trim() ? searchStations(favQuery, 6) : []), [favQuery]);
  const manualResults = useMemo(() => (manualQuery.trim() ? searchStations(manualQuery, 6) : []), [manualQuery]);
  const popular = POPULAR_IDS.map((id) => getStation(id)).filter(Boolean) as Station[];
  const shown = options ? (preference === "fewest-changes" ? options.fewest : options.fastest) : null;

  return (
    <div>
      {/* Planner header — the whole point of the app */}
      <div className="sticky top-0 z-20 -mx-4 bg-ink px-4 pb-5 pt-5 md:static sm:mx-0 sm:rounded-2xl">
        {headingLevel === "h1" ? (
          <h1 className="font-display text-[32px] leading-none tracking-tight text-white">Delhi Metro</h1>
        ) : (
          <p className="font-display text-[32px] leading-none tracking-tight text-white">Delhi Metro</p>
        )}
        <p className="mt-1.5 text-[13px] text-white/70">Plan a journey. {lines.length} lines, {stations.length} stations, four operators.</p>

        <form className="mt-4" onSubmit={(e) => { e.preventDefault(); plan(from, to); }} aria-label="Journey planner">
          <div className="rounded-xl bg-surface px-3 py-2">
            <StationPicker label="From station" value={from} onChange={(st) => { setFrom(st); clearStale(st, to); }} placeholder="From, e.g. Rajiv Chowk" accentColor="#0a2a5e" />
          </div>
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap From and To stations"
              className="z-10 -my-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_14px_rgb(194_65_12/0.4)] transition hover:bg-accent-deep active:scale-95"
            >
              <IconSwap size={20} />
            </button>
          </div>
          <div className="rounded-xl bg-surface px-3 py-2">
            <StationPicker label="To station" value={to} onChange={(st) => { setTo(st); clearStale(from, st); }} placeholder="To, e.g. Hauz Khas" accentColor="#c2410c" />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-white">
            <div role="radiogroup" aria-label="Day type for fare" className="flex rounded-full bg-white/10 p-1">
              {(["weekday", "sunday"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={dayType === d}
                  onClick={() => setDayType(d)}
                  className={`min-h-[44px] rounded-full px-3.5 text-[13px] font-semibold transition-colors ${dayType === d ? "bg-white text-ink" : "text-white/75 hover:text-white"}`}
                >
                  {d === "weekday" ? "Weekday" : "Sunday or holiday"}
                </button>
              ))}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smartCard}
              onClick={() => setSmartCard((v) => !v)}
              className="flex min-h-[44px] items-center gap-2.5"
            >
              <span className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${smartCard ? "bg-accent" : "bg-white/20"}`}>
                <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${smartCard ? "translate-x-5" : "translate-x-0"}`} />
              </span>
              <span className="text-[13px] font-medium text-white/85">Smart card, 10% off</span>
            </button>
          </div>

          <button
            type="submit"
            className="mt-3 min-h-[52px] w-full rounded-xl bg-accent text-lg font-bold text-white transition-colors hover:bg-accent-deep"
          >
            Find route
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-rose-soft px-3 py-2.5 text-sm font-semibold text-rose">
            <IconAlert size={18} className="shrink-0" />
            {error}
          </p>
        ) : null}
      </div>

      {options && !options.same ? (
        <div className="dm-fade mt-4">
          <div role="radiogroup" aria-label="Route preference" className="grid grid-cols-2 gap-2">
            {([
              ["fastest", "Fastest", options.fastest],
              ["fewest-changes", "Fewest changes", options.fewest],
            ] as const).map(([key, label, r]) => {
              const active = preference === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => choosePreference(key)}
                  className={`min-h-[52px] rounded-xl border px-3 py-2 text-left transition-colors ${active ? "border-ink bg-ink text-white" : "border-line-soft bg-surface text-ink hover:bg-paper"}`}
                >
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className={`mt-0.5 block text-xs tabular-nums ${active ? "text-white/75" : "text-ink-mute"}`}>{optionSummary(r)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[13px] text-ink-mute">Two ways to make this journey. Times are estimates either way.</p>
        </div>
      ) : null}

      {shown ? <RouteResult route={shown} dayType={dayType} smartCard={smartCard} /> : null}

      <Section label="Metro status">
        <p className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-sm font-semibold text-ink-mute ring-1 ring-line-soft">
          <span className="h-2 w-2 rounded-full bg-ink-mute/50" aria-hidden="true" />
          Live status unavailable.
        </p>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-ink-mute">
          No verified live feed is connected for any operator, so no service state is shown. Check <a className="font-medium text-accent underline" href="https://delhimetrorail.com" target="_blank" rel="noreferrer">delhimetrorail.com</a> for official Delhi Metro announcements.
        </p>
      </Section>

      <Section label="Stations near me">
        <button
          type="button"
          onClick={onLocate}
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-deep"
        >
          <IconPin size={17} />
          Use my location
        </button>
        {nearbyNote
          ? <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-ink-soft" role="status">{nearbyNote}</p>
          : <p className="mt-2.5 max-w-prose text-sm text-ink-mute">Location is optional and never required for route planning.</p>}
        <div className="relative mt-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-mute" htmlFor="manual-near">Or search a station</label>
          <div className="flex items-center gap-2.5 rounded-xl border border-line-soft bg-surface px-3">
            <span className="shrink-0 text-ink-mute/60" aria-hidden="true"><IconSearch size={18} /></span>
            <input
              id="manual-near"
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Type a station name"
              className="min-h-[48px] w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-mute/70"
              autoComplete="off"
            />
          </div>
          {manualResults.length > 0 ? (
            <ul className="mt-1.5 divide-y divide-line-soft/60 rounded-xl border border-line-soft bg-surface">
              {manualResults.map((st) => (
                <li key={st.id} className="flex min-h-[52px] items-center justify-between gap-2 px-3 py-2">
                  <Link href={`/stations/${st.id}`} className="font-medium text-ink underline-offset-2 hover:underline">{st.name}</Link>
                  <span className="flex shrink-0 gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Section>

      <Section label="My places">
        <ul className="divide-y divide-line-soft/60">
          {favorites.map((slot) => {
            const FavIcon = FAV_ICONS[slot.label] ?? IconHouse;
            return (
              <li key={slot.label} className="py-2.5">
                <div className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="flex w-24 items-center gap-1.5 text-sm font-semibold text-ink">
                    <FavIcon size={16} className="text-ink-mute" />
                    {slot.label}
                  </span>
                  {slot.stationName ? (
                    <>
                      <span className="text-[15px] font-medium text-ink-soft">{slot.stationName}</span>
                      <span className="ml-auto flex flex-wrap gap-1.5">
                        <button type="button" className="min-h-[44px] rounded-full bg-ink px-3 text-xs font-semibold text-white" onClick={() => { const st = getStation(slot.stationId!); if (st) { setFrom(st); clearStale(st, to); } }}>Set as from</button>
                        <button type="button" className="min-h-[44px] rounded-full bg-ink px-3 text-xs font-semibold text-white" onClick={() => { const st = getStation(slot.stationId!); if (st) { setTo(st); clearStale(from, st); } }}>Set as to</button>
                        {from && slot.stationId !== from.id ? <button type="button" className="min-h-[44px] rounded-full bg-accent px-3 text-xs font-semibold text-white" onClick={() => planFromFavorite(slot, from, false)}>{`From ${from.name}`}</button> : null}
                        {to && slot.stationId !== to.id ? <button type="button" className="min-h-[44px] rounded-full bg-accent px-3 text-xs font-semibold text-white" onClick={() => planFromFavorite(slot, to, true)}>{`To ${to.name}`}</button> : null}
                        <button type="button" className="min-h-[44px] rounded-full px-2.5 text-xs font-semibold text-ink-mute hover:bg-paper" onClick={() => { setFavPicker(slot.label); setFavQuery(""); }}>Change</button>
                        <button type="button" aria-label={`Clear ${slot.label}`} className="min-h-[44px] rounded-full px-2.5 text-xs font-semibold text-ink-mute hover:bg-paper" onClick={() => { const next = favorites.map((x) => x.label === slot.label ? { ...x, stationId: null, stationName: null } : x); setFavorites(next); saveFavorites(next); }}>Clear</button>
                      </span>
                    </>
                  ) : (
                    <button type="button" className="min-h-[44px] rounded-full bg-ink px-3.5 text-xs font-semibold text-white" onClick={() => { setFavPicker(slot.label); setFavQuery(""); }}>Set station</button>
                  )}
                </div>
                {favPicker === slot.label ? (
                  <div className="mt-2 max-w-md">
                    <input
                      aria-label={`Search station for ${slot.label}`}
                      type="text"
                      value={favQuery}
                      onChange={(e) => setFavQuery(e.target.value)}
                      placeholder="Search station"
                      className="min-h-[48px] w-full rounded-xl border border-line-soft bg-surface px-3 text-base text-ink outline-none placeholder:text-ink-mute/70 focus:border-ink"
                      autoComplete="off"
                    />
                    {favResults.length > 0 ? (
                      <ul className="mt-1.5 divide-y divide-line-soft/60 rounded-xl border border-line-soft bg-surface">
                        {favResults.map((st) => (
                          <li key={st.id}>
                            <button type="button" className="flex min-h-[52px] w-full items-center justify-between gap-2 px-3 text-left hover:bg-paper" onClick={() => setFavoriteStation(slot.label, st)}>
                              <span className="font-medium text-ink">{st.name}</span>
                              <span className="flex shrink-0 gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[13px] text-ink-mute">Saved on this device only. No account needed.</p>
      </Section>

      {recents.length > 0 ? (
        <Section label="Recent journeys">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink-mute">{recents.length} saved</span>
            <button type="button" onClick={() => { clearRecents(); setRecents([]); }} className="min-h-[44px] rounded-full px-3 text-[13px] font-semibold text-rose hover:bg-rose-soft">Clear history</button>
          </div>
          <ul className="divide-y divide-line-soft/60">
            {recents.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="flex min-h-[52px] w-full items-center gap-2 text-left"
                  onClick={() => { const f = getStation(r.fromId), t = getStation(r.toId); if (f && t) { setFrom(f); setTo(t); plan(f, t, false); } }}
                >
                  <span className="flex items-center gap-1.5 text-[15px] font-medium text-ink">{r.fromName} <span aria-hidden="true" className="inline-flex text-ink-mute"><IconArrowRight size={14} /></span> {r.toName}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section label="Popular stations">
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {popular.map((st) => (
            <li key={st.id}>
              <Link href={`/stations/${st.id}`} className="flex min-h-[52px] items-center justify-between gap-2 border-b border-line-soft/60 py-2">
                <span className="flex items-center gap-2 font-medium text-ink">{st.name}{st.isInterchange ? <InterchangeChip /> : null}</span>
                <span className="flex shrink-0 gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
