# Delhi Metro — Journey Planner

A production-quality, mobile-first Delhi Metro journey planner built with
Next.js (App Router) + TypeScript + Tailwind CSS. It plans the best route
across all **243 stations / 9 corridors**, shows every line change step by
step, and estimates journey time and fare honestly.

> This is an independent planner, not the official DMRC website. Live status
> is shown only when a verified DMRC feed is connected — otherwise the app
> says "Live status unavailable." and never guesses.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## What's inside

| Area | Where |
|---|---|
| Network data (stations, lines, ordered station lists, interchanges, fares, timings) | `data/` (plain JSON — edit and redeploy to update the network) |
| Route engine (Dijkstra over a station×line graph; 2.2 min/hop + 5 min/change) | `lib/router.ts` |
| Fare engine (official distance slabs effective 25 Aug 2025; Airport Express verified New Delhi anchors only) | `lib/fare.ts` + `data/fares.json` |
| Station search (partial, aliases, typo-tolerant, debounced) | `lib/search.ts` + `components/StationPicker.tsx` |
| Server config (secrets) | `lib/config.ts` — `DMRC_API_KEY` / `DMRC_API_URL`, server-side only |
| API | `app/api/*` — `/api/stations`, `/api/routes`, `/api/fares`, `/api/timings`, `/api/status` |
| PWA | `app/manifest.ts`, `public/sw.js`, offline shell |

## Accuracy rules baked in

- Station codes, coordinates and facilities were **not verifiable**, so they
  are stored as `null` and the UI says so instead of inventing values.
- Fares: regular lines map estimated route distance to the official slabs.
  Airport Express fares are shown **only** for the verified ex–New Delhi
  anchor pairs; anything else falls back to "Fare information unavailable —
  please verify with DMRC."
- The Magenta Line runs as two disconnected segments; the router can never
  path through the under-construction gap. Soorghat (built, not open) and the
  Golden Line (not operational) are excluded from the data entirely.
- Journey times and distances are labelled **estimates**.

## Updating the data

1. Edit the relevant JSON in `data/` (keep station `id`s stable — URLs use them).
2. If you add a station, add it to `stations.json` **and** in the correct
   position of its segment in `lineStations.json`, and to `interchanges.json`
   if it connects lines.
3. Fare changes: edit the slabs / anchors in `data/fares.json` only — no code
   change needed.
4. Re-run the smoke test: `npm run test:routes`, then `npm run build`.

## Connecting an official DMRC feed later

Set server-side environment variables (see `.env.example`):

```
DMRC_API_URL=https://…   # official endpoint
DMRC_API_KEY=…           # secret — server only
```

`services/dmrc.ts` will then attempt the live status fetch and maps any
failure to "Live status unavailable." The key is never sent to the browser.
