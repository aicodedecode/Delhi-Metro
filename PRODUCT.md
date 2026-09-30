# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Delhi NCR metro riders on mobile phones: daily commuters checking a regular journey, students and office-goers, airport travellers on the Airport Express, and occasional/first-time riders who need reassurance. The primary situation is on-the-go: one hand, often standing in a station or on the platform, in bright daylight or a dim concourse, with seconds to decide which train to board.

## Product Purpose

A fast Delhi Metro journey planner: pick two stations and get the best route across the real network, with every line change, direction, estimated time and approximate fare, in one glance, without an account. Success means a rider trusts the answer enough to board, and knows exactly what is verified data and what is an estimate.

## Positioning

An independent planner built on the actual published network (13 lines, 298 stations, gazette-verified station order, four operators: DMRC, NMRC, NCRTC and Rapid Metro) with a weighted-graph router that balances journey time against unnecessary interchanges. Its defining discipline: it never fabricates. Unverifiable things (live status, per-station first/last trains, facility lists, station codes/codesets without a published source, station-to-station Airport Express fares outside verified anchors, and fares for any route touching a non-DMRC operator) are labelled as unavailable rather than guessed. Neighbouring metro apps guess; this one declines.

## Operating Context

Mobile-first (the phone is the platform), PWA with an offline shell so the planner opens on weak station connectivity. Journeys are planned standing, one-handed, frequently as repeat trips (home/work/college). Search must tolerate typos and old station names (e.g. "HUDA" for Millennium City Centre Gurugram). Fare rules differ weekday vs Sunday/holiday and by smart card; the app surfaces those toggles at plan time. The official DMRC site (delhimetrorail.com) is the authority for live status and announcements; this app defers to it explicitly.

## Capabilities and Constraints

- Routing: weighted Dijkstra over line-segment station order; segments are never bridged (the Magenta Line's two disconnected segments cannot be routed through). Branch forks (Yamuna Bank, Ashok Park Main, Maujpur-Babarpur) and walk-linked station pairs between operators are modelled explicitly (Dhaula Kuan skywalk, Sector 52 to Sector 51 Aqua, Sikanderpur to Rapid Metro, and four Namo Bharat foot links), as are the four stations shared between Namo Bharat and Meerut Metro. Every journey is computed two ways, Fastest and Fewest changes, and the rider can pick; when both ways follow the same path only one route is shown. Station lists filter by line and by interchange-only, from the same dataset.
- Data discipline: never invent stations, routes, fares, timings, line colors, interchange stations, or facilities. Station codes and station coordinates are null until a reliable public source is verified. DMRC fares come from the official distance slabs effective 25 August 2025; Airport Express fares are shown only for verified ex-New-Delhi anchor pairs, otherwise "Fare information unavailable — please verify with DMRC". Any route touching a non-DMRC operator (NMRC, NCRTC, Rapid Metro) shows "Fare information could not be retrieved.", because no official fare table for those operators could be verified.
- Live status is shown only when a real operator feed is connected server-side (DMRC_API_KEY / DMRC_API_URL via environment, never exposed to the client); otherwise the honest state "Live status unavailable."
- Secrets never ship to the browser; no keys in components, bundles, or the repo. The user is asked for credentials only when actually required.
- Favorites and recents live in local storage; no account creation; history can be cleared.
- Location is optional and never required for basic route planning.
- WCAG AA contrast; interactive targets ≥44px; text alternatives accompany every use of line color.
- Network map: the official DMRC network map as published (August 2026), shown unchanged and only animated, per the user's direct instruction; it is attributed to DMRC on the /map page. If a *geographic* map is ever added, it must use OpenStreetMap/MapLibre.

## Brand Commitments

- Name: "Delhi Metro" (planner); it is an independent planner, not the official DMRC website, and says so in the footer.
- Voice: calm, precise, official-grade. Short declaratives. Estimates are always labelled estimates; nothing unverified is stated as fact.
- Data-driven color system: the thirteen line colors from the verified dataset are the interface's chromatic system: line identity is color plus name, never color alone.
- SEO surfaces: /, /stations, /stations/[id], /lines, /lines/[id], /route, /map, /fares. Every station and line page has its own title, description, canonical URL and JSON-LD; counts in copy are computed from the data files, never typed by hand. The /fares page publishes the official DMRC distance slabs effective 25 August 2025 and is labelled Delhi Metro only; other operators' fares are not shown because no official fare table for them could be verified.

## Evidence on Hand

- Verified dataset in `data/` (stations, lines, line-station order, interchanges, fares, timings) compiled from published DMRC-reliable sources, as of 1 October 2026; research audit in `~/workspace/delhi-metro-research/dataset/sources.md`. Known gaps stated in the data itself: station codes (null), station coordinates (null), per-station first/last trains (unverified), complete Airport Express station-to-station fare matrix (only ex-New-Delhi anchors verified), station facilities (not verified).
- Reference site: delhimetrorail.com for structure and public information.

## Product Principles

1. **The route is the product.** The planner answers in one screen; everything else is orientation.
2. **Never fabricate.** When data cannot be verified, say so plainly; an honest "unavailable" beats a confident guess.
3. **Estimates are labelled estimates.** Times, distances and distance-derived fares carry their provenance in the UI.
4. **Built for one hand, on the platform.** Fast search, big targets, repeat journeys in one tap.
5. **Color is information, not decoration.** The network's real line colors carry meaning; the interface stays quiet around them.

## Accessibility & Inclusion

WCAG 2.x AA: body text contrast ≥ 4.5:1, visible focus rings everywhere, line identity never by color alone (every badge pairs color with the line name), 44px minimum touch targets, tabular numerals for fares and times, respects `prefers-reduced-motion`.
