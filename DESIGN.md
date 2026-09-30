# DESIGN.md — Delhi Metro Planner visual system

<!-- impeccable:design-schema 1 -->
<!-- Written 2026-10-01 as the replacement visual world for the Delhi Metro journey planner. -->

## World: "Metro Roundel"

A modern Indian transit-authority identity rendered with Swiss transit-design discipline. The
surface is quiet so the network can speak: warm paper white, deep DMRC navy, one saffron
accent. The nine real corridor colors are the chromatic system — they identify lines
everywhere (badges, rails, roundels), always paired with the line name in text, never alone.

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
`--line-pink #ED6BA7`, `--line-magenta #A00D71`, `--line-grey #808080`.

Text over a line color: navy ink when the color is light (yellow/pink/green), white when
dark — see `lineInk(hex)` in `components/LineBadge.tsx`.

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
`IconGraduationCap`, `IconHeart`, `IconRoute`, `IconNode`). **No emoji or unicode glyphs as icons anywhere in the UI.**
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
- **Ticket strip:** the route summary — one horizontal strip, 4 cells separated by
  hairlines: Fare · Minutes · Stations · Changes. Tabular numerals. Fare cell shows
  "Unavailable" text, never a fabricated number.
- **Route rail diagram:** vertical line; each leg renders its line's real color as the
  rail; stations are nodes (dots); origin gets a navy pin marker, destination a navy
  diamond; interchange stations get an Interchange chip beside the name, and a saffron
  "Change at {station}" banner naming the next line and direction. Direction/terminus labels ride with each leg.
- **LineBadge:** colored dot + line name text (never color alone). Interchange chips are
  saffron-tint pills with the interchange icon.
- **Info notes:** hairline card, ink-mute text, `info` icon. Unverified data states are
  styled honestly ("verify with DMRC") — calm, not apologetic.
- **Bottom nav (mobile) / header nav (desktop):** four destinations with SVG icons;
  active route gets saffron icon + ink label.

## Motion

One authored moment: a quiet 150ms fade on new route results (`dm-fade`). Toggles and
swap use 120ms state transitions. No entrance animations on scroll sections.
`prefers-reduced-motion` disables everything.

## Browser surfaces

Saffron text selection; navy caret; ink focus rings (2px + 2px paper offset);
underlined links with 2px offset; tabular numerals for all data. Scrollbars slimmed and
navy-tinted on WebKit.

## Bans honored from craft-floor

No eyebrows/kickers above headings · no emoji-as-icons · no gradient text ·
no glassmorphism · no hard offset shadows · no hero-metric layouts ·
no identical icon+heading+text card grids · card radii 12–16px · border-or-shadow,
never both · contrast ≥4.5:1 on all body text.
