import { stations } from "./data";
import type { Station } from "@/types";

/** Normalise a query or name: lowercase, strip punctuation, collapse spaces. */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

interface Indexed { station: Station; haystack: string; tokens: string[] }

const index: Indexed[] = stations.map((s) => {
  const haystack = normalize([s.name, ...s.aliases].join(" "));
  return { station: s, haystack, tokens: haystack.split(" ") };
});

/**
 * Score a station against the query. Lower = better. -1 = no match.
 * Handles partial names ("rajiv" -> Rajiv Chowk, "hauz" -> Hauz Khas),
 * aliases (HUDA City Centre) and single-character typos.
 */
export function scoreStation(query: string, item: Indexed): number {
  const q = normalize(query);
  if (!q) return -1;
  const { station, haystack, tokens } = item;
  const name = normalize(station.name);
  if (name === q) return 0;
  if (normalize(station.aliases.join(" ")) === q) return 1;
  if (name.startsWith(q)) return 2;
  if (haystack.split(" ").some((t) => t === q)) return 3;
  if (name.includes(q)) return 4;
  if (haystack.includes(q)) return 5;
  if (tokens.some((t) => t.startsWith(q))) return 6;
  const qTokens = q.split(" ");
  if (qTokens.every((qt) => tokens.some((t) => t.startsWith(qt) || (qt.length >= 4 && levenshtein(qt, t) <= 1)))) return 7;
  if (q.length >= 4 && tokens.some((t) => levenshtein(q, t) <= 1)) return 8;
  if (q.length >= 6 && haystack.replace(/ /g, "").includes(q.replace(/ /g, ""))) return 9;
  return -1;
}

export function searchStations(query: string, limit = 8): Station[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { st: Station; score: number }[] = [];
  for (const item of index) {
    const score = scoreStation(q, item);
    if (score >= 0) scored.push({ st: item.station, score });
  }
  scored.sort((a, b) => a.score - b.score || a.st.name.localeCompare(b.st.name));
  return scored.slice(0, limit).map((s) => s.st);
}

/** Resolve free text to a single station (exact/alias/only match), else null. */
export function resolveStation(text: string): Station | null {
  const results = searchStations(text, 8);
  return results.length ? results[0] : null;
}
