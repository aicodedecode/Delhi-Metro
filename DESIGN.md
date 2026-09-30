# DESIGN.md — Delhi Metro Planner visual system

<!-- impeccable:design-schema 1 -->
<!-- Written 2026-10-01 as the replacement visual world for the Delhi Metro journey planner. -->

## World: "Metro Roundel"

A modern Indian transit-authority identity rendered with Swiss transit-design discipline. The
surface is quiet so the network can speak: warm paper white, deep DMRC navy, one saffron
accent. The thirteen real line colors are the chromatic system: they identify lines
everywhere (badges, rails, roundels), always paired with the line name in text, never alone.
The network is run by four operators (DMRC, NMRC, NCRTC, Rapid Metro); the planner speaks
for all of them with one voice and never applies one operator's rules to another's lines.

The physical scene that picks light: commuters on one hand, in bright platform daylight,
glancing for one fact — which line, how long, how much. So: high contrast, big targets,
tabular data, the route drawn as an actual vertical metro rail with station nodes.

Restraint rule: this is a working transit app, not a showcase. Fewer flourishes, more
hierarchy. One authored motion moment (a quiet fade on new results); everything else is
instant state change.

## Color

Tokens live as CSS custom properties in `app/globals.css` (`:root`), mapped into Tailwind
in `@theme inline` as `paper/surface/ink/ink-deep/ink-soft/ink-mute/line/accent/*`.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#FBFAF7` | Page ground (warm paper white) |
| `--surface` | `#FFFFFF` | Fields, dropdowns, ticket strip |
| `--ink` | `#0A2A5E` | Headings, wordmark, primary buttons, map-pin |
| `--ink-deep` | `#071F47` | Pressed states, footer ground |
| `--ink-soft` | `#33456B` | Body text (≥4.5:1 on paper) |
| `--ink-mute` | `#5B657F` | Secondary text, labels (≥4.5:1 on paper) |
| `--line-soft` | `#E4E1D7` | Hairline borders on paper |
| `--rail` | `#D9D4C4` | Inactive rail segments |
| `--accent` | `#C2410C` | Saffron — the single action accent (swap, toggles on, active nav, alerts of intent). White text on it measures ≈5.2:1 (pass); navy text on it is only ≈2.7:1, so navy-on-saffron is never used for text. |
| `--accent-soft` | `#FBEDE3` | Saffron tint for interchange-change banners and info notes |
| `--rose` | `#B42318` | Errors only |

Line colors come from `data/lines.json` (never hand-typed from memory), exposed as
`--line-red #ED1C24`, `--line-yellow #FDB913`, `--line-blue #0051AD`,
`--line-green #00A650`, `--line-violet #764B9E`, `--line-airport-express #F68920`,
`--line-pink #ED6BA7`, `--line-magenta #A00D71`, `--line-grey #808080`,
`--line-aqua #79D3DC`, `--line-namo-bharat #F47216`, `--line-meerut-metro #00ADEF`,
`--line-rapid-metro #211C1C`.

Text over a line color: `lineInk(hex)` in `components/LineBadge.tsx` computes WCAG
relative luminance and picks whichever of navy `#0A2A5E` or white gives the better
contrast against that color. Ten of the thirteen colors reach ≥4.5:1 that way; Red,
Green and Grey top out between 3.9:1 and 4.4:1 with either ink. So text sits on a
line color only at 20px extrabold or larger (line numbers in roundels, station
numbers in the route rail), where the WCAG large-text floor of 3:1 holds for every
color, and small text never sits on a line color: chips carry the color as a
swatch with the name in ink beside it. (An earlier brightness heuristic put white
text on Aqua and Meerut blue at under 3:1; the luminance rule replaced it. On pale
colors such as Aqua, body text next to the color must be navy, never the color
itself.)

## Typography

- UI face: **Instrument Sans** via `next/font/google`, `subsets:["latin"]`, `display:"swap"`,
  weights 400–700. Body 1rem/1.6, measure ≤ 65ch.
- Display face: **Instrument Serif** (400 only), tracking `-0.02em`. Used for the
  wordmark and page titles only (H1), never for UI chrome or body.
- Scale: display `clamp(2rem, 5vw, 2.75rem)` / 1.05; h1 1.625rem/1.2; h2 1.125rem/1.3
  (sans, semibold); h3 1rem/1.4 semibold; body 1rem/1.6; small 0.8125rem/1.5.
- All fares, times, distances, counts, and line numbers use `tabular-nums`.
- Section headings carry their own weight — no kickers or eyebrows anywhere.
- Fallbacks: `ui-sans-serif, system-ui` / `Georgia, "Times New Roman", serif`.

## Elevation, radii, spacing

- **One elevation rule:** surfaces are separated by 1px `--line-soft` borders. Shadow is
  reserved for layered elements (the station-search dropdown) — offset, soft blur,
  navy-tinted: `0 8px 30px rgb(10 42 94 / 0.12)`. Never both border and shadow on a card.
- Radii: 12px cards (`rounded-xl`), 16px planner shell (`rounded-2xl`), pill chips.
- Rhythm: tight groups (8–12px gaps), generous separation (24–32px) between sections;
  more space above a heading than below it.

## Iconography

One consistent icon family: **lucide-react** (verified exports at install time).
Icons are used at fixed sizes (16/20/24) with stroke width 1.75, round caps, in
`components/icons.tsx` as named wrappers (`IconSwap`, `IconSearch`, `IconPin`,
`IconWaypoints`, `IconRepeat`, `IconChevronRight`, `IconChevronLeft`, `IconClose`,
`IconAlert`, `IconSpinner`, `IconArrowRight`, `IconHouse`, `IconBriefcase`,
`IconGraduationCap`, `IconHeart`, `IconRoute`, `IconNode`, `IconWalk`, `IconClock`). **No emoji or unicode glyphs as icons anywhere in the UI.**
Route-diagram station nodes are geometry (dots/rings), not icons.

## Copy

UI copy follows the humanizer rules: sentence case headings, plain transit-authority
voice ("Plan", "Fare ₹54", "Change at Rajiv Chowk", "Live status unavailable."), no
em or en dashes in prose, no bold as decoration, no triads, no closers, no inflated
claims. Factual claims kept; ornament cut. Link targets, data strings, and code keep
their own punctuation (e.g. numeric ranges in fares.json).

## Components

- **Wordmark:** `Delhi Metro` in Instrument Serif + a saffron rail tick; small caps sans
  "JOURNEY PLANNER" as part of the lockup (brand, not eyebrow).
- **Planner header (sticky mobile):** navy `ink` ground, paper text; From/To fields on
  paper; saffron circular swap button bridging the two fields; segmented day control;
  smart-card switch; CTA is saffron-on-navy: saffron bg, white text at 5.2:1, min-h 52px.
  Error = `role=alert` strip.
- **Station search:** combobox with line badges and interchange chips per suggestion;
  clear button; keyboard navigable; dropdown is the one shadowed layer.
- **Summary stat tiles:** the route header (origin arrow destination) above four
  stat tiles (Minutes · Line changes · Stations · Fare) and a slim estimate banner
  ("Times shown are estimates…"). Tabular numerals. The Fare tile shows a number only
  when a verified fare exists, otherwise "Not available", never a fabricated figure.
- **Route rail diagram:** a vertical rail read top-down in journey order. Each leg
  runs in its line's real color with numbered square station badges; every station
  carries its cumulative estimated time ("~N min") right-aligned. The origin block
  shows the line chip and "Towards {terminus}". Same-station changes and cross-operator
  walks are distinct blocks: a swap-icon "Change at {station}" or a walk-icon "Walk to
  {station} and change to the {line}, towards {terminus}", each telling the rider to
  allow the change allowance once. Interchange stations get an "Interchange" chip;
  the destination closes with "You arrive at {station}". No platform or gate numbers
  are ever shown. That data is not verified.
- **LineBadge:** colored dot + line name text (never color alone). Interchange chips are
  saffron-tint pills with the interchange icon.
- **Info notes:** hairline card, ink-mute text, `info` icon. Unverified data states are
  styled honestly ("Fare information could not be retrieved.", "verify with the
  operator"). Calm, not apologetic.
- **Bottom nav (mobile) / header nav (desktop):** four destinations with SVG icons;
  active route gets saffron icon + ink label.

## Motion

One authored moment: a quiet 180ms fade (`cubic-bezier(0.22, 1, 0.36, 1)`) on new
route results (`dm-fade`). Interactive state changes (hover, press, toggle, swap)
transition at 160 to 220ms ease-out; nothing animates on scroll, and nothing moves
without a user action behind it.

The map viewer owns its gestures: `touch-action: none` and
`overscroll-behavior: none` on the gesture surface, `overscroll-behavior: none` on
the body, pointer capture during drag/pinch, and gesture updates throttled to one
`requestAnimationFrame` per frame. Pinch, wheel, double-tap, buttons and arrow keys
all drive the same transform; a 180ms ease-out transform transition applies only
while the user is *not* actively gesturing, so drags feel 1:1 and settles feel
smooth. `prefers-reduced-motion` disables all of it.

## Browser surfaces

Saffron text selection; navy caret; ink focus rings (2px + 2px paper offset);
underlined links with 2px offset; tabular numerals for all data. Scrollbars slimmed and
navy-tinted on WebKit.

## Bans honored from craft-floor

No eyebrows/kickers above headings · no emoji-as-icons · no gradient text ·
no glassmorphism · no hard offset shadows · no hero-metric layouts ·
no identical icon+heading+text card grids · card radii 12–16px · border-or-shadow,
never both · contrast ≥4.5:1 on all body text.
