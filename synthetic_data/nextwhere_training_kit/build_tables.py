#!/usr/bin/env python3
"""
STEP 2 - raw real data -> NextWhere tables (poi, cell, features) + Day-0 audit + 50-POI audit sample.
  python build_tables.py --raw data/raw/kolhapur --out data/cache/kolhapur_pharmacy
Same column names as the synthetic dataset, so downstream code is identical.
"""
import argparse, json, os, hashlib, datetime
import numpy as np, pandas as pd, geopandas as gpd, h3
from pyproj import Transformer
from rapidfuzz import fuzz

ap = argparse.ArgumentParser()
ap.add_argument("--raw", default="data/raw/kolhapur"); ap.add_argument("--out", default="data/cache/kolhapur_pharmacy")
ap.add_argument("--config", default="config/pharmacy_kolhapur.json")
a = ap.parse_args(); cfg = json.load(open(a.config)); os.makedirs(a.out, exist_ok=True)
RES, UTM = cfg["h3_res"], cfg["utm_epsg"]; rng = np.random.default_rng(cfg["seed"])
T = Transformer.from_crs(4326, UTM, always_xy=True)
def xy(lat, lon): x, y = T.transform(np.asarray(lon, float), np.asarray(lat, float)); return np.c_[x, y]
def dist(A, B): return np.linalg.norm(A[:, None, :] - B[None, :, :], axis=2)
def pct(v): return pd.Series(v).rank(pct=True).values * 100
def z(v): v = np.asarray(v, float); return (v - v.mean()) / (v.std() + 1e-9)
def union(g): return g.union_all() if hasattr(g, "union_all") else g.unary_union
def rd(n, **k):
    p = f"{a.raw}/{n}"
    return pd.read_csv(p, **k) if os.path.exists(p) else None
vers = {r.file: r.version for r in pd.read_csv(f"{a.raw}/raw_manifest.csv").itertuples()} if os.path.exists(f"{a.raw}/raw_manifest.csv") else {}

# ---- cells ---------------------------------------------------------------------------
bnd = gpd.read_file(f"{a.raw}/osm_boundary.geojson").to_crs(4326); bgeom = union(bnd.geometry)
buf = gpd.GeoSeries([bgeom], crs=4326).to_crs(UTM).buffer(cfg["buffer_km"] * 1000).to_crs(4326).iloc[0]
ids = set()
for part in (buf.geoms if hasattr(buf, "geoms") else [buf]): ids |= set(h3.geo_to_cells(part, RES))
ids = sorted(ids); n = len(ids); idx = {h: i for i, h in enumerate(ids)}
ll = np.array([h3.cell_to_latlng(h) for h in ids]); cxy = xy(ll[:, 0], ll[:, 1])
cpts = gpd.GeoSeries(gpd.points_from_xy(ll[:, 1], ll[:, 0]), crs=4326)
inside = cpts.within(bgeom).values
pp = pd.read_csv(f"{a.raw}/raw_pop_points.csv")
pp["h3_id"] = [h3.latlng_to_cell(la, lo, RES) for la, lo in zip(pp.lat, pp.lon)]
pop = pp.groupby("h3_id")["pop"].sum().reindex(ids).fillna(0).round().astype(int).values
wp = f"{a.raw}/osm_water.geojson"
try:
    wg = gpd.read_file(wp); water = cpts.within(union(wg.geometry)).values if len(wg) else np.zeros(n, bool)
except Exception: water = np.zeros(n, bool)
age = rd("raw_age60_points.csv")
if age is not None:
    age["h3_id"] = [h3.latlng_to_cell(la, lo, RES) for la, lo in zip(age.lat, age.lon)]
    age60 = (age.groupby("h3_id")["pop"].sum().reindex(ids).fillna(0).values / np.maximum(pop, 1)).clip(0, 1)
else: age60 = np.full(n, np.nan)
excl = np.where(~inside, "outside_boundary", np.where(water, "water", np.where(pop < cfg["min_population"], "low_population", "")))
is_cand = excl == ""

# ---- POIs ----------------------------------------------------------------------------
pl = pd.read_csv(f"{a.raw}/raw_places.csv"); pl["category"] = pl["category"].fillna("").astype(str).str.lower()
def group_of(c):
    if c in cfg["pharmacy_categories"]: return "pharmacy"
    for g, keys in cfg["groups"].items():
        if any(k in c for k in keys): return g
    return "other"
pl["group"] = pl.category.map(group_of); pl["source"] = "overture"
ph = pl[pl.group == "pharmacy"].copy()
alias = [(al.lower(), bid) for bid, als in cfg["brands"].items() for al in als]
def resolve(row):
    s = " ".join(str(x) for x in (row.brand, row["name"]) if isinstance(x, str)).lower()
    if not s: return "", 0.0
    best = max(((fuzz.token_set_ratio(s, al), bid) for al, bid in alias), default=(0, ""))
    return (best[1], float(best[0])) if best[0] >= cfg["fuzzy_threshold"] else ("", float(best[0]))
res = ph.apply(resolve, axis=1); ph["brand_id"] = [r[0] for r in res]; ph["match_score"] = [r[1] for r in res]
hc = ph[ph.confidence >= cfg["min_confidence"]]
print("\nTop pharmacy names/brands (use to extend aliases in config):"); print(ph.assign(n=ph.brand.fillna(ph["name"])).n.value_counts().head(25).to_string())
cnt = hc[hc.brand_id != ""].brand_id.value_counts()
demo = cfg["demo_chain_brand_id"] if cfg["demo_chain_brand_id"] != "auto" else (cnt.index[0] if len(cnt) else "")
print("\nBranded high-confidence counts:", cnt.to_dict(), "| demo chain:", demo)
ph["is_own"] = (ph.brand_id == demo) & (demo != ""); ph["is_branded_pool"] = ph.brand_id != ""
others = pl[pl.group != "pharmacy"].copy(); others["brand_id"] = ""; others["match_score"] = np.nan; others["is_own"] = False; others["is_branded_pool"] = False
tr = rd("osm_transit.csv")
parts = [ph.assign(category="pharmacy"), others.assign(category=others.group)]
if tr is not None and len(tr):
    parts.append(pd.DataFrame(dict(id=[f"osm-transit-{i}" for i in range(len(tr))], name="", category="transit_stop", confidence=1.0, brand="", lon=tr.lon, lat=tr.lat,
                                   brand_id="", match_score=np.nan, is_own=False, is_branded_pool=False, source="osm")))
poi = pd.concat(parts, ignore_index=True)
poi["h3_id"] = [h3.latlng_to_cell(la, lo, RES) for la, lo in zip(poi.lat, poi.lon)]
poi = poi[poi.h3_id.isin(idx)].rename(columns={"id": "poi_id", "confidence": "overture_confidence"})
poi = poi[["poi_id", "name", "category", "brand_id", "lat", "lon", "h3_id", "overture_confidence", "match_score", "is_own", "is_branded_pool", "source"]]
poi.to_csv(f"{a.out}/poi.csv", index=False)

S = poi[(poi.category == "pharmacy") & (poi.overture_confidence >= cfg["min_confidence"])].reset_index(drop=True)
s_xy = xy(S.lat, S.lon); s_cell = S.h3_id.map(idx).values; s_own = S.is_own.values.astype(bool); s_pool = S.is_branded_pool.values.astype(bool)
has_own = np.zeros(n, bool); has_own[s_cell[s_own]] = True; has_pool = np.zeros(n, bool); has_pool[s_cell[s_pool]] = True
pd.DataFrame(dict(h3_id=ids, lat=ll[:, 0].round(6), lon=ll[:, 1].round(6), population=pop, age60_share=np.round(age60, 4), is_candidate=is_cand,
                  exclusion_reason=excl, has_own_store=has_own, has_pool_store=has_pool)).to_csv(f"{a.out}/cell.csv", index=False)

# ---- features (leave-focal-out for pharmacy features) --------------------------------
Dcc = dist(cxy, cxy)
def pts(df): return xy(df.lat, df.lon) if df is not None and len(df) else np.zeros((0, 2))
def wcount(g, rad=1000, tau=500):
    P = pts(poi[poi.category == g]); 
    if not len(P): return np.zeros(n)
    D = dist(cxy, P); return np.where(D <= rad, np.exp(-D / tau), 0).sum(1)
def within(P, r): return (dist(cxy, P) <= r).sum(1) if len(P) else np.zeros(n)
hosp = poi[poi.category == "hospital"]; hxy = pts(hosp)
trxy = pts(tr); ixy = pts(rd("osm_intersections.csv")); shxy = pts(rd("osm_shops.csv")); bxy = pts(rd("osm_buildings.csv"))
art = gpd.read_file(f"{a.raw}/osm_arterials.geojson").to_crs(UTM)
art_d = gpd.GeoSeries(gpd.points_from_xy(cxy[:, 0], cxy[:, 1]), crs=UTM).distance(union(art.geometry)).values if len(art) else np.full(n, np.nan)
allp = poi[poi.category != "transit_stop"]; premium = poi[poi.category == "amenity_premium"]
commercial = pct(within(shxy, 500) + within(pts(allp), 500))
affluence = pct(within(pts(premium), 500))
centre = xy([allp.lat.median()], [allp.lon.median()])[0]; centrality = np.linalg.norm(cxy - centre, axis=1)
rp = np.clip(0.6 * z(commercial) + 0.4 * z(-centrality) + 0.15 * z(affluence), -3, 3); rp = (rp - rp.min()) / (rp.max() - rp.min()) * 100
cell_area_ha = h3.cell_area(ids[0], unit="m^2") / 1e4
braw = rd("osm_buildings.csv")
bcnt = pd.Series([h3.latlng_to_cell(la, lo, RES) for la, lo in zip(braw.lat, braw.lon)]).value_counts() if braw is not None and len(braw) else pd.Series(dtype=int)
Dcs = dist(cxy, s_xy) if len(S) else np.zeros((n, 0)); Dcs[s_cell[None, :] == np.arange(n)[:, None]] = np.inf
comp = ~s_own
def c_(r, m): return (Dcs[:, m] <= r).sum(1)
nc_ = np.minimum(np.where(comp[None, :], Dcs, np.inf).min(1) if comp.any() else np.full(n, 5000), 5000)
no_ = np.minimum(np.where(s_own[None, :], Dcs, np.inf).min(1) if s_own.any() else np.full(n, 5000), 5000)
bid = np.where(S.brand_id.values == "", "IND", S.brand_id.values)
bdiv = np.array([len(set(bid[Dcs[i] <= 1000])) for i in range(n)])
F = pd.DataFrame(dict(
    h3_id=ids, pop_500m=(Dcc <= 500) @ pop, pop_1km=(Dcc <= 1000) @ pop, pop_2km=(Dcc <= 2000) @ pop, age60_share=age60,
    bldg_density_per_ha=[bcnt.get(h, 0) / cell_area_ha for h in ids], residential_bldg_share=np.nan,
    hospital_wcount_1km=wcount("hospital"), clinic_wcount_1km=wcount("clinic"), school_wcount_1km=wcount("school"),
    market_wcount_1km=wcount("market"), office_wcount_1km=wcount("office"),
    dist_to_hospital_m=dist(cxy, hxy).min(1) if len(hxy) else np.nan,
    transit_stop_dist_m=dist(cxy, trxy).min(1) if len(trxy) else np.nan, transit_stop_cnt_500m=within(trxy, 500),
    arterial_dist_m=art_d, intersection_density_km2=within(ixy, 500) / (np.pi * 0.25),
    comp_cnt_300m=c_(300, comp), comp_cnt_400m=c_(400, comp), comp_cnt_1km=c_(1000, comp), nearest_comp_m=nc_, brand_diversity_1km=bdiv,
    pool_cnt_1km=c_(1000, s_pool), own_nearest_m=no_, own_cnt_1km=c_(1000, s_own),
    commercial_density=commercial, affluence_proxy=affluence, rent_pressure_proxy=rp, centrality_m=centrality))
F["pop_density_pctile"] = pct(F.pop_1km); F["comp_cnt_300m_pctile"] = pct(F.comp_cnt_300m)
F = F[is_cand].reset_index(drop=True).round(4); F.to_csv(f"{a.out}/features.csv", index=False)

# ---- Day-0 audit (PRD 8.2) + K9 audit sample -----------------------------------------
n_ph = len(ph); n_br = int((hc.brand_id != "").sum()); n_demo = int((hc.brand_id == demo).sum()) if demo else 0
gates = [("pharmacy_pois_total", n_ph, 150), ("pooled_branded_high_conf", n_br, 100), ("demo_chain_high_conf", n_demo, 15),
         ("median_pharmacy_confidence", round(float(ph.confidence.median()), 3) if n_ph else 0, 0.7)]
au = pd.DataFrame([dict(gate=g, value=v, threshold=t, passed=bool(v >= t)) for g, v, t in gates])
au = pd.concat([au, pd.DataFrame([dict(gate=f"group_count_{g}", value=int((poi.category == g).sum()), threshold=np.nan, passed=np.nan) for g in list(cfg["groups"]) + ["transit_stop"]]
                                  + [dict(gate="candidate_cells", value=int(is_cand.sum()), threshold=np.nan, passed=np.nan),
                                     dict(gate="inside_cells_passing_filters_pct", value=round(100 * is_cand[inside].sum() / max(inside.sum(), 1), 1), threshold=np.nan, passed=np.nan)])])
au.to_csv(f"{a.out}/audit_report.csv", index=False); print("\nDAY-0 AUDIT"); print(au.to_string(index=False))
samp = ph.sample(min(50, n_ph), random_state=cfg["seed"])[["id", "name", "brand", "brand_id", "match_score", "confidence", "lat", "lon"]]
samp.assign(manual_correct_label="", manual_still_operating="", notes="").to_csv(f"{a.out}/poi_audit_sample.csv", index=False)

# ---- manifest ------------------------------------------------------------------------
TODAY = datetime.date.today().isoformat(); rows = []
for f in ["poi", "cell", "features", "audit_report", "poi_audit_sample"]:
    p = f"{a.out}/{f}.csv"; rows.append(dict(source=f"{f}.csv", version=f"derived-{vers.get('raw_places.csv', 'raw')}", retrieval_date=TODAY, row_count=len(pd.read_csv(p)),
                                              sha256=hashlib.sha256(open(p, "rb").read()).hexdigest(), licence="derived from ODbL/CC-BY/CDLA data - attribute sources", is_synthetic=False))
if os.path.exists(f"{a.raw}/raw_manifest.csv"): rows = list(pd.read_csv(f"{a.raw}/raw_manifest.csv").assign(is_synthetic=False).rename(columns={"file": "source"}).to_dict("records")) + rows
pd.DataFrame(rows).to_csv(f"{a.out}/manifest.csv", index=False); print("done ->", a.out)
