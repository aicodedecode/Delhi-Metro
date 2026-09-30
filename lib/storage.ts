"use client";
import { useEffect, useState } from "react";

export interface RecentRoute { fromId: string; fromName: string; toId: string; toName: string; ts: number }
export interface FavoriteSlot { label: string; stationId: string | null; stationName: string | null }

const RECENT_KEY = "dm-recents";
const FAV_KEY = "dm-favorites";
export const DEFAULT_FAVORITES: FavoriteSlot[] = [
  { label: "Home", stationId: null, stationName: null },
  { label: "Work", stationId: null, stationName: null },
  { label: "College", stationId: null, stationName: null },
  { label: "Favourite", stationId: null, stationName: null },
];

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } }

export function loadRecents(): RecentRoute[] { return read<RecentRoute[]>(RECENT_KEY, []); }
export function saveRecent(r: RecentRoute) {
  const list = loadRecents().filter((x) => !(x.fromId === r.fromId && x.toId === r.toId));
  list.unshift(r);
  write(RECENT_KEY, list.slice(0, 8));
}
export function clearRecents() { write(RECENT_KEY, []); }

export function loadFavorites(): FavoriteSlot[] {
  const stored = read<FavoriteSlot[]>(FAV_KEY, []);
  return DEFAULT_FAVORITES.map((d) => stored.find((s) => s.label === d.label) ?? d);
}
export function saveFavorites(favs: FavoriteSlot[]) { write(FAV_KEY, favs); }

export function useLocalData() {
  const [recents, setRecents] = useState<RecentRoute[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSlot[]>(DEFAULT_FAVORITES);
  useEffect(() => { setRecents(loadRecents()); setFavorites(loadFavorites()); }, []);
  return { recents, setRecents, favorites, setFavorites };
}
