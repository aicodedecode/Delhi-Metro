#!/usr/bin/env python3
"""Build data/stationFacts.json from verified sources only.

Sources
-------
1. DMRC static GTFS (Open Transit Data Delhi snapshot, 2023) - station
   coordinates and weekday first/last trains. Local copy:
   ~/workspace/delhi-metro-research/dmrc-gtfs-static
2. OpenStreetMap (Overpass API) - coordinates for stations the GTFS
   predates (NMRC/NCRTC already covered by the GTFS; used here for the
   NCRTC corridor and newer DMRC stations). Every match is listed in
   the audit file.
3. Wikipedia line articles (station tables) - opening date and station
   structure (Elevated / Underground / At grade). Values are read from
   the table cell covering the station's own row (Wikipedia merges
   identical values across section rows with rowspans). Dates in the
   future, and rows marked Approved / Under-Construction, are skipped.

Usage: python3 scripts/build-station-facts.py [--skip-network]
Writes data/stationFacts.json and, when the research directory exists,
~/workspace/delhi-metro-research/station-facts-audit.md
"""
import csv, json, os, re, sys, time
from collections import defaultdict
from datetime import date

import requests
from bs4 import BeautifulSoup
from rapidfuzz import fuzz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESEARCH = os.path.expanduser("~/workspace/delhi-metro-research")
GTFS_DIR = os.path.join(RESEARCH, "dmrc-gtfs-static")
CACHE = os.path.join(RESEARCH, "station-facts-cache")
TODAY = date(2026, 10, 1)
SKIP_NETWORK = "--skip-network" in sys.argv
# --strict-wiki: only take opening/structure values from a station row's
# own single-row cell (rowspan == 1) instead of the merged cell covering
# its row. Kept as a switch because grid attribution asserts the same
# value for every station in a section block, which is how Wikipedia
# records section openings.
STRICT_WIKI = "--strict-wiki" in sys.argv

COORD_SOURCE_GTFS = "DMRC static feed (OTD)"
COORD_SOURCE_OSM = "OpenStreetMap"
TIMING_SOURCE = "DMRC official static timetable feed (OTD Delhi), 2023 snapshot"

ROUTE_LINE_PREFIX = {
    "RED": "red", "YELLOW": "yellow", "BLUE": "blue", "GREEN": "green",
    "VIOLET": "violet", "PINK": "pink", "MAGENTA": "magenta", "GRAY": "grey",
    "AQUA": "aqua", "RAPID": "rapid-metro", "ORANGE/AIRPORT": "airport-express",
}
DIRECTIONS = {"east", "west", "north", "south"}

# Renames: pre-rename feed name -> current app station id. Evidence: the
# app dataset's own `aliases` carry the old names, and the old name sits
# on the same line in the feed.
RENAMES = {
    "huda city centre": "millennium-city-centre-gurugram",
    "mayur vihar pocket 1": "shree-ram-mandir-mayur-vihar",
    "pitampura": "madhuban-chowk",
    "pragati maidan": "supreme-court",
    "udyog bhawan": "seva-teerth",
}
# Feed name variants (abbreviations, typos, dropped suffix) -> app id.
VARIANTS = {
    "mansrover park": "mansarovar-park",
    "rk ashram marg": "ramakrishna-ashram-marg",
    "delhi cantt": "delhi-cantonment",
    "dwarka": "dwarka-kakrola",
    "phase i": "phase-1",
    "knowledge park": "knowledge-park-ii",
}
# Fuzzy matches in the 80-89 band accepted after a manual look (line agrees).
MANUAL_ACCEPT = {"86": "mayur-vihar-extension"}  # "Mayur Vihar Ext", score 84.6
# Feed stops deliberately NOT merged into an app station (two distinct
# physical stations; the app carries one merged "Rohini" record).
MANUAL_REJECT_STOPS = {"19", "20"}  # Rohini East, Rohini West

# Wikipedia facts to withhold despite a table match (see audit).
WIKI_WITHHOLD = {
    "dr-baba-saheb-ambedkar-hospital":
        "Wikipedia's Red Line table inserts this unopened Phase IV station "
        "inside the 31 March 2004 opening block and the line's own extension "
        "rows are marked Approved; grid attribution would smear a 2004 "
        "opening date onto it. Withheld pending an opening source.",
}

# OpenStreetMap matches decided after manual review of name + network /
# operator tags (same-name Indian Railways and DMRC stations rejected).
OSM_DECISIONS = {
    # Newer DMRC stations (network: Delhi Metro)
    "bhajanpura": ("node", 5215706782),
    "bhalaswa": ("node", 5215706542),
    "burari": ("node", 5215706767),
    "deepali-chowk": ("node", 5215706475),
    "haiderpur-village": ("node", 5215706476),
    "jagatpur-wazirabad": ("node", 5215706768),
    "jharoda-majra": ("node", 13628489720),
    "khajuri-khas": ("node", 5215706769),
    "krishna-park-extension": ("node", 12149316873),
    "nanaksar-sonia-vihar": ("node", 13628489714),
    "uttari-pitampura-prashant-vihar": ("node", 5215706525),  # "North Pitampura - Prashant Vihar"
    "yamuna-vihar": ("node", 5215706770),
    "yashobhoomi-dwarka-sector-25": ("node", 11203142798),
    # NCRTC Namo Bharat / Meerut Metro (network RapidX / Meerut Metro,
    # operator National Capital Region Transport Corporation)
    "sarai-kale-khan-rrts": ("node", 10700089586),
    "new-ashok-nagar-rrts": ("node", 12478188647),
    "anand-vihar-rrts": ("node", 10700089589),
    "sahibabad": ("way", 1144312132),
    "ghaziabad-rrts": ("node", 11293189742),
    "guldhar": ("node", 11294005967),
    "duhai": ("node", 11293126097),
    "duhai-depot": ("node", 11293126096),  # "Duhai Depot Station"
    "muradnagar": ("node", 10700089584),    # "Murad Nagar"
    "modinagar-south": ("node", 10700089579),
    "modinagar-north": ("node", 10700089587),
    "meerut-south": ("node", 10700089582),
    "shatabdi-nagar": ("node", 10700089576),
    "begumpul": ("node", 10700089583),
    "modipuram": ("node", 7944688630),
    "partapur": ("node", 10700089592),
    "rithani": ("node", 10700089588),
    "brahmpuri": ("node", 10700089590),     # "Brahmapuri"
    "meerut-central": ("node", 10700089580),
    "bhaisali": ("node", 10700089593),      # "Bhainsali"
    "mes-colony": ("node", 10700089577),
    "daurli": ("node", 10700089585),
    "meerut-north": ("node", 10700089573),
}

# Wikipedia article titles discovered via the Wikipedia API search
# (action=query, list=search) on 2026-10-01; fetched through the API.
WIKI_TITLES = {
    "red": "Red Line (Delhi Metro)",
    "yellow": "Yellow Line (Delhi Metro)",
    "blue": "Blue Line (Delhi Metro)",
    "green": "Green Line (Delhi Metro)",
    "violet": "Violet Line (Delhi Metro)",
    "pink": "Pink Line (Delhi Metro)",
    "magenta": "Magenta Line (Delhi Metro)",
    "grey": "Grey Line (Delhi Metro)",
    "airport-express": "Airport Express Line (Delhi Metro)",
    "aqua": "Aqua Line (Noida Metro)",
    "rapid-metro": "Rapid Metro Gurgaon",
    "namo-bharat": "Delhi–Meerut Regional Rapid Transit System",
    "meerut-metro": "Meerut Metro",
}

# ---------------------------------------------------------------- helpers
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

def squash(s):
    return norm(s).replace(" ", "")

def nums(s):
    return set(int(x) for x in re.findall(r"\d+", s))

def dirset(s):
    return set(norm(s).split()) & DIRECTIONS

def http_get_json(url, params, tag):
    path = os.path.join(CACHE, tag + ".json")
    if os.path.exists(path):
        return json.load(open(path))
    if SKIP_NETWORK:
        raise SystemExit(f"no cache for {tag} and --skip-network set")
    sess = requests.Session()
    sess.headers["User-Agent"] = "delhi-metro-app-research/1.0 (station facts; github aicodedecode)"
    for attempt in range(6):
        try:
            r = sess.get(url, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            os.makedirs(CACHE, exist_ok=True)
            json.dump(data, open(path, "w"))
            return data
        except Exception:
            if attempt == 5: raise
            time.sleep(3 * (attempt + 1))

# ---------------------------------------------------------------- load app
APP = json.load(open(os.path.join(ROOT, "data/stations.json")))["stations"]
app_by_id = {s["id"]: s for s in APP}
LINES = json.load(open(os.path.join(ROOT, "data/lines.json")))["lines"]
line_by_id = {l["id"]: l for l in LINES}
audit = {"renames": [], "variants": [], "fuzzy": [], "rejected": [],
         "osm": [], "wiki": [], "notes": []}

# ---------------------------------------------------------------- GTFS match
routes = {r["route_id"]: r for r in csv.DictReader(open(f"{GTFS_DIR}/routes.txt"))}
def route_line(rid):
    return ROUTE_LINE_PREFIX[routes[rid]["route_long_name"].split("_")[0]]

trips = {}
for t in csv.DictReader(open(f"{GTFS_DIR}/trips.txt")):
    trips[t["trip_id"]] = (route_line(t["route_id"]), t["service_id"])

def parse_gtfs_time(ts):
    if not ts: return None
    h, m, s = ts.split(":")
    return int(h) * 60 + int(m)

rows_by_trip = defaultdict(list)
stop_lines = defaultdict(set)
for row in csv.DictReader(open(f"{GTFS_DIR}/stop_times.txt")):
    line, svc = trips[row["trip_id"]]
    stop_lines[row["stop_id"]].add(line)
    dep = parse_gtfs_time(row["departure_time"]) or parse_gtfs_time(row["arrival_time"])
    rows_by_trip[row["trip_id"]].append((int(row["stop_sequence"]), row["stop_id"], dep))

stops = {r["stop_id"]: r for r in csv.DictReader(open(f"{GTFS_DIR}/stops.txt"))}
forms = defaultdict(list)
for st in APP:
    forms[norm(st["name"])].append((st["id"], "name", st["name"]))
    for al in st.get("aliases", []):
        forms[norm(al)].append((st["id"], "alias", al))

claim_by_app, claim_by_stop = {}, {}

def line_ok(app_id, stop_id):
    return bool(set(app_by_id[app_id]["lines"]) & stop_lines[stop_id])

def claim(stop, app_id, method, score=None):
    rec = {"gtfs_name": stop["stop_name"].strip(), "stop_id": stop["stop_id"],
           "app_id": app_id, "app_name": app_by_id[app_id]["name"],
           "method": method, "score": score,
           "gtfs_lines": sorted(stop_lines[stop["stop_id"]])}
    claim_by_stop[stop["stop_id"]] = app_id
    claim_by_app[app_id] = rec
    return rec

pending = []
for sid in sorted(stops, key=lambda x: int(x)):
    stop = stops[sid]
    n = norm(stop["stop_name"].strip())
    if n in RENAMES and RENAMES[n] not in claim_by_app and line_ok(RENAMES[n], sid):
        audit["renames"].append(claim(stop, RENAMES[n], "rename")); continue
    if n in VARIANTS and VARIANTS[n] not in claim_by_app and line_ok(VARIANTS[n], sid):
        audit["variants"].append(claim(stop, VARIANTS[n], "variant")); continue
    cands = [c for c in forms.get(n, []) if c[0] not in claim_by_app and line_ok(c[0], sid)]
    if len(set(c[0] for c in cands)) == 1:
        claim(stop, cands[0][0], "norm-exact" if cands[0][1] == "name" else "alias-exact"); continue
    sq = squash(stop["stop_name"])
    cands = [c for form, lst in forms.items() if form.replace(" ", "") == sq
             for c in lst if c[0] not in claim_by_app and line_ok(c[0], sid)]
    if len(set(c[0] for c in cands)) == 1:
        claim(stop, cands[0][0], "squash-exact"); continue
    pending.append(stop)

for stop in pending:
    sid = stop["stop_id"]
    n = norm(stop["stop_name"].strip())
    scored = []
    for st in APP:
        if st["id"] in claim_by_app: continue
        cn = norm(st["name"])
        scored.append((max(fuzz.ratio(n, cn), fuzz.token_set_ratio(n, cn)), st))
    scored.sort(key=lambda x: -x[0])
    s1, st1 = scored[0]
    s2 = scored[1][0] if len(scored) > 1 else 0
    ok = (not (nums(n) or nums(norm(st1["name"])))) or nums(n) == nums(norm(st1["name"]))
    dirs_ok = dirset(stop["stop_name"]) == dirset(st1["name"])
    rec = {"gtfs_name": stop["stop_name"].strip(), "stop_id": sid,
           "candidate": st1["name"], "candidate_id": st1["id"], "score": round(s1, 1),
           "second": scored[1][1]["name"], "second_score": round(s2, 1),
           "line_ok": line_ok(st1["id"], sid), "nums_ok": bool(ok), "dirs_ok": bool(dirs_ok)}
    if sid in MANUAL_REJECT_STOPS:
        rec["decision"] = "rejected-manual (two distinct stations; app has one merged record)"
        audit["rejected"].append(rec); continue
    if s1 >= 90 and rec["line_ok"] and rec["nums_ok"] and rec["dirs_ok"] and (s1 - s2) >= 3:
        rec.update(claim(stop, st1["id"], "fuzzy>=90", round(s1, 1))); rec["decision"] = "accepted"
        audit["fuzzy"].append(rec); continue
    if sid in MANUAL_ACCEPT and MANUAL_ACCEPT[sid] == st1["id"]:
        rec.update(claim(stop, st1["id"], "fuzzy-manual", round(s1, 1))); rec["decision"] = "accepted-manual"
        audit["fuzzy"].append(rec); continue
    rec["decision"] = "rejected"
    audit["rejected"].append(rec)

# ---------------------------------------------------------------- first/last
stop_to_app = {v["stop_id"]: aid for aid, v in ((a, {"stop_id": r["stop_id"]}) for a, r in claim_by_app.items())}
groups = defaultdict(lambda: {"times": [], "dests": defaultdict(lambda: [0, 0])})
for tid, (line, svc) in trips.items():
    if svc != "weekday": continue
    rows = sorted(rows_by_trip[tid])
    if len(rows) < 2: continue
    mapped = [stop_to_app.get(sid) for _, sid, _ in rows]
    last_idx = len(rows) - 1
    dest_id = mapped[last_idx]
    if dest_id is None:
        for j in range(last_idx, -1, -1):
            if mapped[j]: dest_id = mapped[j]; break
    for i, (seq, sid, dep) in enumerate(rows):
        aid = mapped[i]
        if aid is None or dep is None or i == last_idx: continue
        if line not in app_by_id[aid]["lines"]: continue
        neighbour = None
        for j in range(i + 1, len(rows)):
            if mapped[j] and mapped[j] != aid: neighbour = mapped[j]; break
        if neighbour is None: continue
        g = groups[(aid, line, neighbour)]
        g["times"].append(dep)
        d = g["dests"][dest_id]
        d[0] = max(d[0], rows[last_idx][0] - seq); d[1] += 1

def fmt(mins):
    return f"{(mins // 60) % 24:02d}:{mins % 60:02d}"

first_last = defaultdict(list)
for (aid, line, _nbr), g in sorted(groups.items()):
    times = sorted(g["times"])
    dest_id = max(g["dests"].items(), key=lambda kv: (kv[1][0], kv[1][1]))[0]
    first_last[aid].append({"lineId": line, "towards": app_by_id[dest_id]["name"],
                            "first": fmt(times[0]), "last": fmt(times[-1])})

# ---------------------------------------------------------------- OSM coords
osm_targets = [s for s in APP if s["id"] not in claim_by_app and s["id"] != "rohini"]
osm_coords = {}
if True:  # served from cache when present; --skip-network fails loudly without it
    QL = """
[out:json][timeout:120];
(
  node["railway"="station"](28.0,76.6,29.2,78.0);
  way["railway"="station"](28.0,76.6,29.2,78.0);
  node["railway"="halt"](28.0,76.6,29.2,78.0);
  node["public_transport"="station"]["station"="subway"](28.0,76.6,29.2,78.0);
);
out center tags;
"""
    osm_data = http_get_json("https://overpass-api.de/api/interpreter",
                             {"data": QL}, "osm_stations")
    if "elements" not in osm_data:  # POST response cached under GET params key
        sess = requests.Session()
        sess.headers["User-Agent"] = "delhi-metro-app-research/1.0 (station facts)"
        for attempt in range(4):
            try:
                r = sess.post("https://overpass-api.de/api/interpreter", data={"data": QL}, timeout=180)
                r.raise_for_status(); osm_data = r.json(); break
            except Exception:
                if attempt == 3: raise
                time.sleep(5)
        os.makedirs(CACHE, exist_ok=True)
        json.dump(osm_data, open(os.path.join(CACHE, "osm_stations.json"), "w"))
    elements = {(e["type"], e["id"]): e for e in osm_data["elements"]}
    for app_id, (etype, eid) in OSM_DECISIONS.items():
        e = elements.get((etype, eid))
        if e is None:
            audit["notes"].append(f"OSM decision target missing for {app_id}: {etype}/{eid}")
            continue
        lat = e.get("lat", e.get("center", {}).get("lat"))
        lon = e.get("lon", e.get("center", {}).get("lon"))
        tags = e.get("tags", {})
        osm_coords[app_id] = (round(lat, 6), round(lon, 6))
        audit["osm"].append({"app_id": app_id, "app_name": app_by_id[app_id]["name"],
                              "osm": f"{etype}/{eid}", "osm_name": tags.get("name"),
                              "network": tags.get("network"), "operator": tags.get("operator"),
                              "lat": round(lat, 6), "lng": round(lon, 6)})

# ---------------------------------------------------------------- Wikipedia
MONTHS = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"])}
STRUCT = {"elevated": "Elevated", "underground": "Underground",
          "at grade": "At grade", "at-grade": "At grade", "ground level": "At grade"}

def cell_text(td):
    t = td.get_text(" ", strip=True)
    t = re.sub(r"\[\d+\]", "", t)
    return re.sub(r"\s+", " ", t).strip()

def expand(table):
    grid, carry = [], {}
    for tr in table.find_all("tr"):
        if tr.find_parent("table") is not table: continue
        row, col, ci = [], 0, 0
        cells = tr.find_all(["td", "th"], recursive=False)
        while ci < len(cells) or col in carry:
            if col in carry:
                txt, rem, total = carry[col]
                row.append({"text": txt, "span": total, "origin": False})
                if rem - 1 <= 0: del carry[col]
                else: carry[col] = (txt, rem - 1, total)
                col += 1
                continue
            if ci >= len(cells): break
            c = cells[ci]; ci += 1
            rs = int(c.get("rowspan", 1)); cs = int(c.get("colspan", 1)); txt = cell_text(c)
            for _k in range(cs):
                row.append({"text": txt, "span": rs, "origin": True})
                if rs > 1: carry[col] = (txt, rs - 1, rs)
                col += 1
        grid.append(row)
    return grid

def parse_date(txt):
    t = txt.strip()
    m = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", t)
    if m and m.group(2).lower() in MONTHS:
        d = date(int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))
        return d.isoformat(), d > TODAY
    m = re.match(r"^([A-Za-z]+)\s+(\d{4})$", t)
    if m and m.group(1).lower() in MONTHS:
        d = date(int(m.group(2)), MONTHS[m.group(1).lower()], 1)
        return f"{m.group(2)}-{MONTHS[m.group(1).lower()]:02d}", d > TODAY
    m = re.match(r"^(\d{4})$", t)
    if m:
        return m.group(1), int(m.group(1)) > TODAY.year
    return None

by_line = defaultdict(list)
for st in APP:
    for lid in st["lines"]: by_line[lid].append(st)

wiki_raw = defaultdict(lambda: {"opened": [], "structure": []})
for line_id, title in WIKI_TITLES.items():
    data = http_get_json("https://en.wikipedia.org/w/api.php",
                         {"action": "parse", "page": title, "prop": "text",
                          "format": "json", "formatversion": 2},
                         "wiki_" + re.sub(r"[^A-Za-z0-9]+", "_", title))
    html = data["parse"]["text"]
    soup = BeautifulSoup(html, "html.parser")
    cands = by_line.get(line_id, [])
    cand_forms = {}
    for st in cands:
        for nm in [st["name"]] + st.get("aliases", []):
            cand_forms.setdefault(norm(nm), set()).add(st["id"])
            cand_forms.setdefault(norm(nm, keep_paren=True), set()).add(st["id"])
    for table in soup.find_all("table"):
        if "wikitable" not in (table.get("class") or []): continue
        grid = expand(table)
        hdr_i, cols = None, {}
        for j, r in enumerate(grid[:4]):
            low = [c["text"].lower() for c in r]
            if any("station" in c for c in low) and any(("open" in c or "layout" in c or "structure" in c) for c in low):
                hdr_i = j
                for idx, c in enumerate(low):
                    if "station name" in c or c == "station": cols.setdefault("station", idx)
                    elif "opening" in c or c == "opened": cols.setdefault("opened", idx)
                    elif "layout" in c or "structure" in c: cols.setdefault("layout", idx)
                    elif c == "status": cols.setdefault("status", idx)
                break
        if hdr_i is None or "station" not in cols: continue
        for r in grid[hdr_i + 1:]:
            if cols["station"] >= len(r): continue
            raw_name = r[cols["station"]]["text"]
            if raw_name.strip().lower() in ("english", "hindi", ""): continue
            clean = re.sub(r"\[[^\]]*\]", "", raw_name).replace("*", "").strip()
            ids = set()
            for nn in (norm(clean), norm(clean, keep_paren=True)):
                ids |= cand_forms.get(nn, set())
            method = "exact"
            if len(ids) != 1:
                scored = []
                for st in cands:
                    sc = max(fuzz.ratio(norm(clean), norm(st["name"])),
                             max([fuzz.ratio(norm(clean), norm(a)) for a in st.get("aliases", [])] or [0]))
                    scored.append((sc, st))
                scored.sort(key=lambda x: -x[0])
                s1, st1 = scored[0]; s2 = scored[1][0] if len(scored) > 1 else 0
                a, b = nums(norm(clean)), nums(norm(st1["name"]))
                if s1 >= 90 and (s1 - s2) >= 5 and (not (a and b) or a == b) \
                        and dirset(clean) == dirset(st1["name"]):
                    ids = {st1["id"]}; method = f"fuzzy{s1:.0f}"
                else:
                    audit["wiki"].append({"line": line_id, "wiki": clean, "decision": "no-match",
                                          "best": st1["name"], "score": round(s1, 1)})
                    continue
            app_id = next(iter(ids))
            get = lambda key: r[cols[key]]["text"] if key in cols and cols[key] < len(r) else None
            getspan = lambda key: r[cols[key]]["span"] if key in cols and cols[key] < len(r) else None
            status, opened_raw, layout_raw = get("status"), get("opened"), get("layout")
            pd = parse_date(opened_raw) if opened_raw else None
            not_open = False
            if status is not None and not re.search(r"operational|opened|open\b", status.lower()):
                not_open = True
            if opened_raw and opened_raw.strip() not in ("", "None", "-") and pd is None:
                not_open = True
            if pd and pd[1]:
                not_open = True
            audit["wiki"].append({"line": line_id, "wiki": clean, "app_id": app_id, "method": method,
                                   "opened_raw": opened_raw, "opened_span": getspan("opened"),
                                   "layout_raw": layout_raw, "layout_span": getspan("layout"),
                                   "not_open": not_open})
            if not_open or app_id in WIKI_WITHHOLD: continue
            if pd and (not STRICT_WIKI or getspan("opened") == 1):
                wiki_raw[app_id]["opened"].append((pd[0], title))
            if layout_raw and layout_raw.strip().lower() in STRUCT \
                    and (not STRICT_WIKI or getspan("layout") == 1):
                wiki_raw[app_id]["structure"].append((STRUCT[layout_raw.strip().lower()], title))

wiki_facts, wiki_conflicts = {}, []
for app_id, e in wiki_raw.items():
    out = {}
    if e["opened"]:
        out["opened"] = min(x[0] for x in e["opened"])
        out["openedArticle"] = next(x[1] for x in e["opened"] if x[0] == out["opened"])
    vals = sorted(set(x[0] for x in e["structure"]))
    if len(vals) == 1:
        out["structure"] = vals[0]
        out["structureArticle"] = e["structure"][0][1]
    elif len(vals) > 1:
        wiki_conflicts.append({"app_id": app_id, "values": vals,
                               "articles": sorted(set(x[1] for x in e["structure"]))})
    if out: wiki_facts[app_id] = out

# ---------------------------------------------------------------- assemble
facts = {}
for st in APP:
    aid = st["id"]
    f = {}
    if aid in claim_by_app:
        s = stops[claim_by_app[aid]["stop_id"]]
        f["lat"] = round(float(s["stop_lat"]), 6)
        f["lng"] = round(float(s["stop_lon"]), 6)
        f["coordSource"] = COORD_SOURCE_GTFS
    elif aid in osm_coords:
        f["lat"], f["lng"] = osm_coords[aid]
        f["coordSource"] = COORD_SOURCE_OSM
    w = wiki_facts.get(aid)
    if w:
        if "opened" in w: f["opened"], f["openedSource"] = w["opened"], f"Wikipedia: {w['openedArticle']}"
        if "structure" in w: f["structure"], f["structureSource"] = w["structure"], f"Wikipedia: {w['structureArticle']}"
    if aid in first_last:
        f["firstLast"] = sorted(first_last[aid], key=lambda x: (x["lineId"], x["towards"]))
    if f: facts[aid] = f

out = {
    "meta": {
        "generatedBy": "scripts/build-station-facts.py",
        "coordinateSources": [COORD_SOURCE_GTFS, COORD_SOURCE_OSM],
        "timingSource": TIMING_SOURCE,
        "openingStructureSource": "Wikipedia line articles (station tables), retrieved 2026-10-01",
    },
    "stations": facts,
}
with open(os.path.join(ROOT, "data/stationFacts.json"), "w") as fh:
    json.dump(out, fh, indent=1, ensure_ascii=False)
    fh.write("\n")

def cov(key):
    return sum(1 for f in facts.values() if key in f)

print(f"stations with any facts: {len(facts)} / {len(APP)}")
print(f"coords {cov('lat')} (GTFS {sum(1 for f in facts.values() if f.get('coordSource')==COORD_SOURCE_GTFS)}, "
      f"OSM {sum(1 for f in facts.values() if f.get('coordSource')==COORD_SOURCE_OSM)}), "
      f"opened {cov('opened')}, structure {cov('structure')}, firstLast {cov('firstLast')}")
print("structure conflicts (left null):", [c["app_id"] for c in wiki_conflicts])
print("GTFS stops unclaimed:", [sid for sid in stops if sid not in claim_by_stop])

# audit
if os.path.isdir(RESEARCH):
    lines_out = ["# Station facts audit", "",
                 "Sources: DMRC static GTFS (OTD Delhi, 2023 snapshot), OpenStreetMap via Overpass,",
                 "Wikipedia line articles (station tables). Matching: normalise, exact, then",
                 "RapidFuzz. Fuzzy scores of 90 or more accepted only with line agreement;",
                 "the 80-89 band needed a manual look; below that or ambiguous means unmatched.", ""]
    lines_out += ["## Renames (feed name to current station)", ""]
    for r in audit["renames"]:
        lines_out.append(f"- feed stop {r['stop_id']} \"{r['gtfs_name']}\" -> {r['app_name']} ({r['app_id']})")
    lines_out += ["", "## Feed name variants accepted", ""]
    for r in audit["variants"]:
        lines_out.append(f"- feed stop {r['stop_id']} \"{r['gtfs_name']}\" -> {r['app_name']} ({r['app_id']})")
    lines_out += ["", "## Fuzzy matches accepted", ""]
    for r in audit["fuzzy"]:
        lines_out.append(f"- feed stop {r['stop_id']} \"{r['gtfs_name']}\" -> {r.get('app_name', r['candidate'])} "
                         f"score {r['score']} (next best {r['second']} {r['second_score']}) [{r['decision']}]")
    lines_out += ["", "## Rejected or unmatched feed stops", ""]
    for r in audit["rejected"]:
        lines_out.append(f"- feed stop {r['stop_id']} \"{r['gtfs_name']}\" (best candidate {r['candidate']} "
                         f"score {r['score']}) [{r['decision']}]")
    lines_out += ["", "## OpenStreetMap coordinate matches", ""]
    for r in audit["osm"]:
        lines_out.append(f"- {r['app_name']} ({r['app_id']}) <- osm {r['osm']} \"{r['osm_name']}\" "
                         f"network={r['network']} operator={r['operator']} at {r['lat']}, {r['lng']}")
    lines_out += ["", "## Wikipedia rows that matched no app station", ""]
    for r in audit["wiki"]:
        if r.get("decision") == "no-match":
            lines_out.append(f"- [{r['line']}] \"{r['wiki']}\" (best {r['best']} score {r['score']})")
    lines_out += ["", "## Structure conflicts left null (differs by line)", ""]
    for c in wiki_conflicts:
        lines_out.append(f"- {c['app_id']}: {', '.join(c['values'])} ({'; '.join(c['articles'])})")
    lines_out += ["", "## Withheld", ""]
    for aid, why in WIKI_WITHHOLD.items():
        lines_out.append(f"- {aid}: {why}")
    lines_out.append("- rohini: no coordinates. The 2023 feed has separate Rohini East and Rohini West")
    lines_out.append("  stops and OpenStreetMap has separate stations; the app carries one merged")
    lines_out.append("  Rohini record, so no single sourced point exists. Opened and structure come")
    lines_out.append("  from the Red Line table's own Rohini row.")
    lines_out.append("- dr-baba-saheb-ambedkar-hospital: no coordinates. No OpenStreetMap station")
    lines_out.append("  element exists for it yet in the fetched classes.")
    lines_out.append("- pragati maidan -> supreme-court: no rename needed; the feed already names the")
    lines_out.append("  stop Supreme Court (stop 91) and it matched by exact name.")
    lines_out.append("- shaheed-sthal-new-bus-adda: coordinates and Wikipedia facts, but no first/last")
    lines_out.append("  trains. In the feed it is only ever the last stop of weekday trips;")
    lines_out.append("  weekday departures exist only in the Saturday pattern, which is out of scope.")
    for n in audit["notes"]:
        lines_out.append(f"- note: {n}")
    with open(os.path.join(RESEARCH, "station-facts-audit.md"), "w") as fh:
        fh.write("\n".join(lines_out) + "\n")
    print("audit written")
