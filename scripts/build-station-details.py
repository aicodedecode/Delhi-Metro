#!/usr/bin/env python3
"""Merge official DMRC station details into stationFacts.json + stations.json.

Source: DMRC's own public backend API
(https://backend.delhimetrorail.com/api/v2/en), harvested 2026-10-01 into
~/workspace/delhi-metro-research/dmrc-api-cache/ (254 stations, 0 failures).
The official website's rendered station pages are empty; this backend is the
real source of the data the site claims to publish.

RUN ORDER MATTERS: run AFTER scripts/build-station-facts.py. This script only
ADDS new keys (dmrcCode, gates, platforms, facilities, parking, lifts,
feederRoutes, nearby, opensAt, closesAt, detailsSource) and never removes or
rewrites the facts builder's keys. Re-running build-station-facts.py will not
wipe these keys (it writes its own key set; merge with it, not against it).

MATCH DISCIPLINE (same as the facts builder):
  API name normalised -> exact match against app names/aliases -> RapidFuzz
  >= 90 auto-accept ONLY with line agreement (LN codes mapped to app line
  ids) -> 80-89 manual review band, held back unless in MANUAL_ACCEPT ->
  numeric-token and direction-token guards block bad merges (API Rohini East /
  West must NOT merge into the app's single merged "Rohini" record).
Only index rows with status "Station Open" are candidates. No stations are
added; unmatched API stations go to the audit, never into routing data.

MERGED, per matched station (only non-empty arrays included):
  dmrcCode        API station_code (e.g. "RCK"); also written into the
                  stations.json `code` field (which the station page renders).
  gates           [{name, location|null, stepFree}] - status dropped (stale).
  platforms       [{name, towards}] - towards resolved to app station names via
                  the match map; fallback = cleaned API name.
  facilities      [{kind, items:[{name, location|null}]}] - empty-name items
                  dropped.
  parking         [{car, motorcycle, cycle, location|null, provider}] - per-entry
                  capacities kept, never summed.
  lifts           [{type, name, location|null}] - status/last_update dropped.
  feederRoutes    [{route, from, to, areas}] - only AVIT + SHPK have data.
  nearby          [{category, kind, name, distanceKm, nearestGate|null}] - the
                  API's icon-class pseudo-entries (no name) are skipped.
  opensAt/closesAt  "05:29"/"23:47" from opening_time/closing_time.
  detailsSource   "Delhi Metro (official website)" whenever any detail present.

NOT merged: API first_last_train (3 stations only; GTFS stays), status fields
of gates/lifts (would go stale), station_description prose, phone numbers,
API line termini.

structure: API station_type wins over Wikipedia (official beats compiled)
EXCEPT at the 8 interchanges where the answer differs by line, where we keep
null. coords: API lat/lng fill gaps only (GTFS/OSM preferred), source
"Delhi Metro official website".
"""
import json, os, re, sys
from collections import defaultdict

try:
    from rapidfuzz import fuzz
except ImportError:
    sys.exit("rapidfuzz required; run with ~/workspace/.venvs/scrape/bin/python")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(os.path.expanduser("~"), "workspace", "delhi-metro-research", "dmrc-api-cache")
RESEARCH = os.path.dirname(CACHE)
DRY = "--dry" in sys.argv

DIRECTIONS = {"east", "west", "north", "south"}

LN_TO_APP = {
    "LN1": "red", "LN2": "yellow", "LN3": "blue", "LN4": "blue",
    "LN5": "green", "LN6": "violet", "LN7": "pink", "LN7EXTN": "pink",
    "LN8": "magenta", "LN8EXTN": "magenta", "LN9": "grey",
    "LN10": "airport-express", "LN11": "rapid-metro",
    # LN12 = Dhaula Kuan <-> Durgabai Deshmukh skywalk; membership ignored for
    # line agreement (those stations match via their real lines).
}

# Interchanges where structure genuinely differs by line; API's single
# station_type is kept null rather than showing a misleading value.
MIXED_STRUCTURE_IDS = {
    "welcome", "kashmere-gate", "netaji-subhash-place", "azadpur",
    "kirti-nagar", "janakpuri-west", "lajpat-nagar", "kalkaji-mandir",
}

# Fuzzy matches accepted after a manual look (name/coords/line all checked).
# Score shown is the fuzzy score vs the app name; each was verified by hand.
MANUAL_ACCEPT = {
    "CIPK": "brigadier-hoshiyar-singh",       # "BRIG. HOSHIAR SINGH", 85.7
    "AVIT": "anand-vihar",                    # "ANAND VIHAR ISBT", 81.5 (DMRC, Blue)
    "MGRO": "mg-road",                        # "M.G. ROAD", 80.0 (Rapid Metro)
    "JLNS": "jawaharlal-nehru-stadium",       # "JLN STADIUM", 62.9 (Violet)
    "APOT": "igi-airport",                    # "AIRPORT (T-3)", 77.8 (Airport Exp)
    "NPPR": "haiderpur-village",              # "NORTH PITAMPURA" (Magenta N);
                                              # coords ~150 m from our record
    "PHVR": "uttari-pitampura-prashant-vihar",# "PRASHANT VIHAR" (Magenta N);
                                              # coords ~15 m from our record
    "SNVH": "nanaksar-sonia-vihar",           # "SONIA VIHAR" (Pink);
                                              # coords ~45 m from our record
}
# Stations whose app display name came from OSM research but the official
# DMRC backend uses a different (authoritative) name. Display name is aligned
# to the operator; the old name is kept as a search alias. Ids unchanged.
OFFICIAL_RENAMES = {
    "haiderpur-village": "North Pitampura",            # API: NORTH PITAMPURA
    "uttari-pitampura-prashant-vihar": "Prashant Vihar",# API: PRASHANT VIHAR
    "nanaksar-sonia-vihar": "Sonia Vihar",             # API: SONIA VIHAR
}
# Deliberately rejected even if the score is high.
MANUAL_REJECT = {}  # e.g. {"CODE": "app-id"}
# SOORGHAT (SOOG): the API flags it "Station Open" but the record is a shell
# (0 gates, 0 lifts, 0 facilities, 0 parking) - not credible evidence of
# operation. Kept out of the dataset as built-but-unopened.

def norm(s, keep_paren=False):
    s = s.lower()
    groups = re.findall(r"\(([^)]*)\)", s)
    s = re.sub(r"\([^)]*\)", " ", s)
    for g in groups:
        g2 = " ".join(re.sub(r"[^a-z0-9 ]", " ", g).split())
        if g2 in DIRECTIONS or keep_paren:
            s += " " + g2
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    toks = s.split()
    if len(toks) > 2 and toks[-2:] == ["metro", "station"]:
        toks = toks[:-2]
    elif len(toks) > 1 and toks[-1] == "station":
        toks = toks[:-1]
    toks = ["sector" if t == "sec" else t for t in toks]
    return " ".join(toks)

def nums(s):
    return set(int(x) for x in re.findall(r"\d+", s))

def dirset(s):
    return set(norm(s).split()) & DIRECTIONS

def clean_title(s):
    """Turn API ALL CAPS names into sentence-case display names."""
    parts = []
    for w in re.sub(r"[^A-Z0-9 ]+", " ", s.upper()).split():
        if re.match(r"^[IVX]+$", w) and len(w) <= 4:
            parts.append(w)
        elif re.match(r"^\d", w):
            parts.append(w)
        else:
            parts.append(w.capitalize())
    return " ".join(parts)

# ---------------------------------------------------------------- load API
index = json.load(open(os.path.join(CACHE, "stations_index.json")))
code_lines = defaultdict(set)
for ln_code in LN_TO_APP:
    p = os.path.join(CACHE, f"station_by_line_{ln_code}.json")
    if not os.path.exists(p):
        continue
    for row in json.load(open(p)):
        code_lines[row["station_code"]].add(ln_code)
details = {}
for code in index:
    p = os.path.join(CACHE, f"station_{code}.json")
    if os.path.exists(p):
        details[code] = json.load(open(p))

# Only live stations are candidates for merging.
open_codes = [c for c, r in index.items()
              if (r.get("status") or "").lower() == "station open"]

def api_app_lines(code):
    lines = {LN_TO_APP[ln] for ln in code_lines[code] if ln in LN_TO_APP}
    return lines

# ---------------------------------------------------------------- load app
stations_doc = json.load(open(os.path.join(ROOT, "data", "stations.json")))
APP = stations_doc["stations"]
app_by_id = {s["id"]: s for s in APP}
facts_doc = json.load(open(os.path.join(ROOT, "data", "stationFacts.json")))
FACTS = facts_doc["stations"]  # dict keyed by app station id
facts_by_id = FACTS

forms = defaultdict(list)
for st in APP:
    forms[norm(st["name"])].append(st["id"])
    for al in st.get("aliases", []):
        forms[norm(al)].append(st["id"])

# ---------------------------------------------------------------- match
matched = {}        # api code -> app id
match_method = {}   # api code -> (method, score)
rejects = []        # (code, api name, best candidate, score, reason)
unclaimed = set(open_codes)
audit_lines = []

def line_ok(code, app_id):
    return bool(api_app_lines(code) & set(app_by_id[app_id]["lines"]))

def guard_ok(code, app_id):
    # numeric tokens compared on NORMED names: API names carry parentheticals
    # like "(T-3)" or "(earlier MAYUR VIHAR POCKET-1)" that norm() strips, and
    # those must not count as real station numbers.
    an = norm(index[code]["station_name"])
    bn = norm(app_by_id[app_id]["name"])
    if nums(an) != nums(bn):
        return False, "numeric-token mismatch"
    if dirset(an) != dirset(bn):
        return False, "direction-token mismatch"
    return True, ""

# exact pass
for code in sorted(unclaimed):
    if code in MANUAL_ACCEPT:
        aid = MANUAL_ACCEPT[code]
        if aid not in matched.values() and line_ok(code, aid):
            sc = fuzz.token_sort_ratio(norm(index[code]["station_name"]),
                                       norm(app_by_id[aid]["name"]))
            matched[code] = aid
            match_method[code] = ("manual-accept", sc)
            unclaimed.discard(code)
            continue
    n = norm(index[code]["station_name"])
    cands = [a for a in forms.get(n, []) if line_ok(code, a)]
    if len(set(cands)) == 1:
        ok, reason = guard_ok(code, cands[0])
        if ok:
            matched[code] = cands[0]
            match_method[code] = ("exact", 100.0)
            unclaimed.discard(code)
        else:
            rejects.append((code, index[code]["station_name"], cands[0],
                            app_by_id[cands[0]]["name"], 100.0, reason))
            unclaimed.discard(code)

# fuzzy pass
pending_review = []
for code in sorted(unclaimed):
    an = index[code]["station_name"]
    best = None
    for st in APP:
        if st["id"] in matched.values():
            continue
        if not line_ok(code, st["id"]):
            continue
        score = fuzz.token_sort_ratio(norm(an), norm(st["name"]))
        if best is None or score > best[1]:
            best = (st["id"], score)
    if best is None:
        rejects.append((code, an, None, None, 0, "no line-agreeing candidate"))
        unclaimed.discard(code)
        continue
    app_id, score = best
    if code in MANUAL_ACCEPT:
        # Hand-verified; still require line agreement as a safety net.
        if line_ok(code, MANUAL_ACCEPT[code]):
            matched[code] = MANUAL_ACCEPT[code]
            match_method[code] = ("manual-accept", score)
        else:
            rejects.append((code, an, MANUAL_ACCEPT[code],
                            app_by_id[MANUAL_ACCEPT[code]]["name"],
                            score, "manual accept failed line agreement"))
        unclaimed.discard(code)
        continue
    ok, reason = guard_ok(code, app_id)
    unclaimed.discard(code)
    if score >= 90 and ok:
        matched[code] = app_id
        match_method[code] = ("fuzzy", score)
    elif 80 <= score < 90 and ok:
        pending_review.append((code, an, app_id,
                               app_by_id[app_id]["name"], score))
    else:
        why = reason or f"score {score:.1f} below 80"
        rejects.append((code, an, app_id, app_by_id[app_id]["name"],
                        score, why))

# ---------------------------------------------------------------- extract
code_to_appid = dict(matched)

def resolve_station_name(api_code, api_name):
    if api_code in code_to_appid:
        return app_by_id[code_to_appid[api_code]]["name"]
    return clean_title(api_name)

def hhmm(t):
    if not t:
        return None
    m = re.match(r"(\d{1,2}):(\d{2})", t)
    return f"{int(m.group(1)):02d}:{m.group(2)}" if m else None

def extract(code):
    d = details[code]
    out = {}
    gates = []
    for g in d.get("gates") or []:
        if not g.get("gate_name"):
            continue
        gates.append({"name": g["gate_name"].strip(),
                      "location": (g.get("location") or "").strip() or None,
                      "stepFree": bool(g.get("divyang_friendly"))})
    if gates:
        out["gates"] = gates
    plats = []
    for p in d.get("platforms") or []:
        if not p.get("platform_name"):
            continue
        tw = p.get("train_towards") or {}
        towards = resolve_station_name(tw.get("station_code"),
                                       tw.get("station_name") or "")
        tw2 = p.get("train_towards_second") or {}
        tw2s = ""
        if tw2.get("station_code") or tw2.get("station_name"):
            tw2s = " / " + resolve_station_name(tw2.get("station_code"),
                                               tw2.get("station_name") or "")
        plats.append({"name": p["platform_name"].strip(),
                      "towards": (towards + tw2s).strip(" /") or None})
    if plats:
        out["platforms"] = plats
    facs = []
    for f in d.get("stations_facilities") or []:
        items = []
        for it in f.get("detail_list") or []:
            nm = (it.get("facility_name") or "").strip()
            if not nm:
                continue
            items.append({"name": nm,
                          "location": (it.get("location_description") or "").strip() or None})
        if items:
            facs.append({"kind": (f.get("kind") or "").strip(), "items": items})
    if facs:
        out["facilities"] = facs
    parks = []
    for pk in d.get("parkings") or []:
        def cap(v):
            return int(v) if isinstance(v, int) and v >= 0 else None
        parks.append({"car": cap(pk.get("capacity_car")),
                      "motorcycle": cap(pk.get("capacity_motorcycle")),
                      "cycle": cap(pk.get("capacity_cycle")),
                      "location": (pk.get("location") or "").strip() or None,
                      "provider": (pk.get("provider") or "").strip() or None})
    if parks:
        out["parking"] = parks
    lifts = []
    for l in d.get("lifts") or []:
        if not l.get("name"):
            continue
        lifts.append({"type": (l.get("lift_type") or "").strip(),
                      "name": l["name"].strip(),
                      "location": (l.get("description_location") or "").strip() or None})
    if lifts:
        out["lifts"] = lifts
    feed = []
    for f in d.get("feeder") or []:
        feed.append({"route": (f.get("route_num") or "").strip(),
                     "from": (f.get("origin_from") or "").strip(),
                     "to": (f.get("destination") or "").strip(),
                     "areas": (f.get("area_covered") or "").strip() or None})
    if feed:
        out["feederRoutes"] = feed
    near = []
    for entry in d.get("nearby_places") or []:
        if not isinstance(entry, dict):
            continue
        for cat, kinds in entry.items():
            if not isinstance(kinds, dict):
                continue
            for kind, places in kinds.items():
                if not isinstance(places, list):
                    continue
                for pl in places:
                    if not isinstance(pl, dict) or not pl.get("name"):
                        continue  # icon-class pseudo entries
                    dm = pl.get("distance_from_metro")
                    near.append({
                        "category": cat.strip(),
                        "kind": (pl.get("types_of_place") or kind).strip(),
                        "name": pl["name"].strip(),
                        "distanceKm": float(dm) if isinstance(dm, (int, float)) else None,
                        "nearestGate": (pl.get("nearest_gate_name") or "").strip() or None,
                    })
    if near:
        out["nearby"] = near
    opens = hhmm(d.get("opening_time"))
    closes = hhmm(d.get("closing_time"))
    if opens:
        out["opensAt"] = opens
    if closes:
        out["closesAt"] = closes
    if out:
        out["detailsSource"] = "Delhi Metro (official website)"
        out["dmrcCode"] = code
    return out

merged = 0
coord_fills = 0
struct_overrides = []
api_struct_claims = {}
for code, app_id in sorted(matched.items(), key=lambda kv: kv[1]):
    if code not in details:
        continue
    fact = facts_by_id.get(app_id)
    if fact is None:
        fact = {}
        facts_by_id[app_id] = fact
    det = extract(code)
    if det:
        fact.update(det)
        merged += 1
        # station code into stations.json
        st = app_by_id[app_id]
        if not st.get("code"):
            st["code"] = code
        # coords: fill gaps only
        if fact.get("lat") is None and details[code].get("latitude") is not None:
            try:
                la, lo = float(details[code]["latitude"]), float(details[code]["longitude"])
            except (TypeError, ValueError):
                la = lo = None
            if la and lo and 28.05 <= la <= 29.15 and 76.6 <= lo <= 77.95:
                fact["lat"] = round(la, 6); fact["lng"] = round(lo, 6)
                fact["coordSource"] = "Delhi Metro official website"
                coord_fills += 1
        # structure: API station_type wins over Wikipedia except at the 8
        # mixed interchanges, where we keep null.
        stype = (details[code].get("station_type") or "").strip()
        api_struct_claims[app_id] = stype or None
        if app_id not in MIXED_STRUCTURE_IDS and stype:
            m = {"elevated": "Elevated", "underground": "Underground",
                 "at grade": "At grade"}.get(stype.lower())
            if m:
                fact["structure"] = m
                fact["structureSource"] = "Delhi Metro (official website)"
                struct_overrides.append(app_id)

# ---------------------------------------------------------------- official renames
renamed = []
for sid, new_name in OFFICIAL_RENAMES.items():
    st = app_by_id.get(sid)
    if st and st["name"] != new_name:
        old = st["name"]
        als = st.setdefault("aliases", [])
        if old not in als:
            als.append(old)
        st["name"] = new_name
        renamed.append((sid, old, new_name))

# ---------------------------------------------------------------- audit
a = []
a.append("# Station details merge audit (official DMRC backend API)")
a.append("Built 2026-10-01 by scripts/build-station-details.py.")
a.append(f"API records: {len(index)} (open: {len(open_codes)}), "
         f"matched: {len(matched)}, facts merged: {merged}.")
exact = sum(1 for c in match_method.values() if c[0] == "exact")
fuzzy = sum(1 for c in match_method.values() if c[0] == "fuzzy")
manual = sum(1 for c in match_method.values() if c[0] == "manual-accept")
a.append(f"Match methods: exact {exact}, fuzzy>=90 {fuzzy}, manual-accept {manual}.")
for code in sorted(matched):
    if match_method[code][0] == "manual-accept":
        a.append(f"  manual: {code} \"{index[code]['station_name']}\" -> "
                 f"{app_by_id[matched[code]]['name']} ({matched[code]}) "
                 f"score {match_method[code][1]:.1f}")
a.append(f"Coord gap fills from API: {coord_fills}. "
         f"Structure overrides from API station_type: {len(struct_overrides)}.")
a.append("")
a.append("## Display names aligned to the official DMRC names (ids unchanged)")
for sid, old, new in renamed:
    a.append(f"- {sid}: \"{old}\" -> \"{new}\" (old name kept as search alias)")
if not renamed:
    a.append("- none")
a.append("")
a.append("## Held back in the 80-89 review band (line agrees, not merged)")
for code, an, aid, bn, sc in sorted(pending_review, key=lambda x: -x[4]):
    a.append(f"- {code} \"{an}\" vs \"{bn}\" ({aid}) score {sc:.1f}")
a.append("")
a.append("## Rejected (guard or no candidate)")
shown_rejects = [r for r in rejects if r[0] not in matched]
for code, an, aid, bn, sc, why in shown_rejects:
    cand = f"vs \"{bn}\" ({aid}) score {sc:.1f}" if aid else "no candidate"
    a.append(f"- {code} \"{an}\" {cand}: {why}")
a.append("")
a.append("## API stations with no app station (not added to routing data)")
unmatched_app = [s for s in APP if s["id"] not in matched.values()]
by_op = defaultdict(list)
for s in unmatched_app:
    by_op[s.get("operator", "?")].append(s["name"])
for op in sorted(by_op):
    a.append(f"- {op}: {len(by_op[op])} stations")
for code in sorted(unclaimed):
    if code in {r[0] for r in rejects} or code in {p[0] for p in pending_review}:
        continue
    a.append(f"- {code} \"{index[code]['station_name']}\" (open, unmatched)")
a.append("")
a.append("## App stations with no DMRC API record")
for op in sorted(by_op):
    a.append(f"### {op} ({len(by_op[op])})")
    for n in sorted(by_op[op]):
        a.append(f"- {n}")
a.append("")
a.append("## API station_type at the 8 mixed-structure interchanges (kept null)")
for aid in sorted(MIXED_STRUCTURE_IDS):
    a.append(f"- {aid}: API says \"{api_struct_claims.get(aid)}\" (withheld: differs by line)")
a.append("")

audit_text = "\n".join(a)
open(os.path.join(RESEARCH, "station-details-audit.md"), "w").write(audit_text)

# ---------------------------------------------------------------- write
if DRY:
    print("DRY RUN - no files written")
    print(audit_text)
else:
    facts_doc["stations"] = FACTS
    json.dump(facts_doc, open(os.path.join(ROOT, "data", "stationFacts.json"), "w"),
              ensure_ascii=False, indent=2)
    stations_doc["stations"] = APP
    json.dump(stations_doc, open(os.path.join(ROOT, "data", "stations.json"), "w"),
              ensure_ascii=False, indent=2)
    # keep the research dataset copy identical (name/aliases/code are the
    # only fields this script touches over there)
    ds = os.path.join(RESEARCH, "dataset", "stations.json")
    if os.path.exists(ds):
        ds_doc = json.load(open(ds))
        by_id = {s["id"]: s for s in APP}
        for s in ds_doc["stations"]:
            src = by_id.get(s["id"])
            if src:
                s["name"] = src["name"]
                s["aliases"] = src.get("aliases", [])
                s["code"] = src.get("code")
        json.dump(ds_doc, open(ds, "w"), ensure_ascii=False, indent=2)
print(f"matched={len(matched)} merged={merged} pending_review={len(pending_review)} "
      f"rejects={len(rejects)}")
