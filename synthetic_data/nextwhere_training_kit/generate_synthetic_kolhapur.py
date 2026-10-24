#!/usr/bin/env python3
"""
NextWhere - synthetic data generator, Kolhapur pharmacy (hackathon city).

Produces the SAME tables the PRD (Section 8.3) defines, so real Overture/WorldPop/OSM
data can later be dropped in under the same file names and column names.

Everything here is SYNTHETIC. Neighbourhood anchors use approximate real Kolhapur
locations only to make the demo look familiar; store names/chains, populations, roads
and rents are invented. Chains are fictional.

Usage:  python generate_synthetic_kolhapur.py [out_dir] [n_draws]
"""
import sys, os, hashlib, datetime
import numpy as np, pandas as pd, h3

OUT = sys.argv[1] if len(sys.argv) > 1 else "kolhapur_pharmacy_v1"
N_DRAWS = int(sys.argv[2]) if len(sys.argv) > 2 else 100
SEED = 42
RES = 9
CENTER = (16.7050, 74.2433)           # approx. Kolhapur centre
RUN_ID = f"synth-kolhapur-pharmacy-v1-seed{SEED}"
GEN_DATE = "2026-10-24"
rng = np.random.default_rng(SEED)
os.makedirs(OUT, exist_ok=True)

# ---- true (hidden) simulator parameters, written to synthetic_truth.csv -------------
TRUE = dict(beta=1.5, lam=1.5, attractiveness=1.0, detour=1.3, min_dist_km=0.2, catchment_km=3.0,
            store_area_sqft=250, fixed_cost_inr=40000, gross_margin_per_tx_inr=40,
            min_population=50, w_demand=0.40, w_pattern=0.30, w_afford=0.30)

def xy(lat, lon):
    lat = np.asarray(lat, float); lon = np.asarray(lon, float)
    return np.c_[(lon - CENTER[1]) * 111320 * np.cos(np.radians(CENTER[0])),
                 (lat - CENTER[0]) * 110574]
def dist(A, B): return np.linalg.norm(A[:, None, :] - B[None, :, :], axis=2)
def z(v): v = np.asarray(v, float); return (v - v.mean()) / (v.std() + 1e-9)
def pct(v): return pd.Series(v).rank(pct=True).values * 100
def seg_dist(P, a, b):
    a = xy(*a)[0]; b = xy(*b)[0]; ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + np.outer(t, ab)), axis=1)

# ---- 1. H3 grid ---------------------------------------------------------------------
center_cell = h3.latlng_to_cell(*CENTER, RES)
ids = sorted(h3.grid_disk(center_cell, 22))
n_all = len(ids)
latlng = np.array([h3.cell_to_latlng(i) for i in ids])
cxy = xy(latlng[:, 0], latlng[:, 1])
idx_of = {h: k for k, h in enumerate(ids)}

# neighbourhood anchors: name, lat, lon, pop_weight, sigma_m, commercial, affluence
ANCH = [("Mahadwar_Ambabai", 16.7048, 74.2210, 1.6, 900, 1.0, 0.4),
        ("Shahupuri",        16.7005, 74.2330, 1.5, 800, 0.9, 0.6),
        ("Rajarampuri",      16.6950, 74.2400, 1.7, 900, 1.0, 0.8),
        ("Station_Area",     16.7040, 74.2440, 1.2, 700, 0.9, 0.5),
        ("Tarabai_Park",     16.7030, 74.2290, 1.0, 600, 0.5, 0.9),
        ("Kadamwadi",        16.7100, 74.2530, 1.0, 900, 0.4, 0.5),
        ("Sane_Guruji",      16.7170, 74.2390, 0.9, 800, 0.3, 0.6),
        ("Shivaji_University", 16.6783, 74.2554, 0.8, 1000, 0.3, 0.6),
        ("Kasaba_Bawda",     16.7300, 74.2200, 0.8, 1100, 0.2, 0.4),
        ("Gokul_Shirgaon_MIDC", 16.6700, 74.2700, 0.6, 1000, 0.3, 0.2),
        ("Uchgaon",          16.6806, 74.2850, 0.7, 1000, 0.2, 0.3)]
axy = xy([a[1] for a in ANCH], [a[2] for a in ANCH])
Dca = dist(cxy, axy)
K = np.exp(-Dca**2 / (2 * np.array([a[4] for a in ANCH])**2))
popw = np.array([a[3] for a in ANCH]); comm_w = np.array([a[5] for a in ANCH]); aff_w = np.array([a[6] for a in ANCH])
dens = (K * popw).sum(1) + 0.08
commercial = (K * comm_w * popw).sum(1) / ((K * popw).sum(1) + 0.1)
commercial = (K**0.5 * comm_w).max(1) * (K * popw).sum(1) ** 0.3
commercial = commercial / commercial.max() * 100
affluence = (K * popw * aff_w).sum(1) / ((K * popw).sum(1) + 1e-6)
affluence = np.clip(affluence * 100 + rng.normal(0, 6, n_all), 0, 100)
pop = dens / dens.sum() * 450000 * rng.lognormal(0, 0.25, n_all)
# synthetic water body (lake) and a river strip -> excluded cells
lake = np.linalg.norm(cxy - xy(16.6905, 74.2125)[0], axis=1) < 450
pop[lake] = 0
pop = np.round(pop).astype(int)
nearest_anchor = [ANCH[k][0] for k in Dca.argmin(1)]
centrality = np.linalg.norm(cxy - xy(*CENTER)[0], axis=1)
age60 = np.clip(0.08 + 0.07 * (K[:, :4] * popw[:4]).sum(1) / ((K * popw).sum(1) + 1e-6) + rng.normal(0, 0.012, n_all), 0.04, 0.25)
bldg = np.clip(15 + 70 * pop / (pop.max() + 1) + rng.normal(0, 4, n_all), 0, None)
excl = np.where(lake, "water", np.where(pop < TRUE["min_population"], "low_population", ""))
is_cand = excl == ""
cand_idx = np.where(is_cand)[0]; nc = len(cand_idx)

# synthetic arterial roads (NOT real roads)
ART = [((16.7600, 74.2450), (16.6500, 74.2480)),
       ((16.7040, 74.2150), (16.7040, 74.2900)),
       ((16.7050, 74.2250), (16.7600, 74.1900))]
art_d = np.min([seg_dist(cxy, a, b) for a, b in ART], axis=0)
inter_den = np.clip(rng.poisson(3 + 0.12 * commercial), 0, None)

# ---- 2. footfall POIs ---------------------------------------------------------------
def sample_cells(w, n):
    p = np.zeros(n_all); p[cand_idx] = w[cand_idx]; p /= p.sum()
    return rng.choice(n_all, n, p=p)
def place(ci):
    j = cxy[ci] + rng.normal(0, 55, 2); j = np.clip(j, cxy[ci] - 100, cxy[ci] + 100)
    lat = CENTER[0] + j[1] / 110574
    lon = CENTER[1] + j[0] / (111320 * np.cos(np.radians(CENTER[0])))
    return lat, lon

FOOT = {"hospital": (14, (commercial / 100) ** 1.0 * (pop + 1) ** 0.3),
        "clinic":   (70, (pop + 1) ** 0.7 * (commercial / 100 + 0.1) ** 0.5),
        "school":   (48, (pop + 1) ** 1.0),
        "market":   (14, (commercial / 100) ** 1.5 + 0.01),
        "office":   (40, (commercial / 100) ** 2 + 0.01),
        "transit_stop": (55, np.exp(-art_d / 300) * (pop + 1) ** 0.5)}
HOSP_NAMES = ["City Hospital", "Sanjeevani Hospital", "Lifeline Multispeciality", "Shree Hospital", "Care Hospital"]
rows = []
for cat, (n, w) in FOOT.items():
    for ci in sample_cells(w, n):
        lat, lon = place(ci)
        rows.append(dict(category=cat, brand_id="", lat=lat, lon=lon,
                         name=f"{cat}_{len(rows)+1:03d}" if cat != "hospital" else rng.choice(HOSP_NAMES),
                         overture_confidence=float(np.clip(rng.beta(8, 2.5), 0.4, 0.99)),
                         match_score=np.nan, is_own=False, is_branded_pool=False))
foot_df = pd.DataFrame(rows)
foot_xy = xy(foot_df.lat, foot_df.lon)

def foot_feat(cat, rad=1000, tau=500):
    m = (foot_df.category == cat).values
    D = dist(cxy, foot_xy[m]); return np.where(D <= rad, np.exp(-D / tau), 0).sum(1)
hosp_w = foot_feat("hospital")

# ---- 3. pharmacies (own chain + competitors) -----------------------------------------
lp = (0.9 * z(np.log1p(((dist(cxy, cxy) <= 1000) @ pop))) + 0.7 * z(commercial)
      + 0.5 * z(hosp_w) + 0.4 * z(-np.log(art_d + 50)))
CHAINS = [("B001", "CureWell", 34), ("B002", "LifeLine", 32), ("B003", "Apna Medico", 28), ("B004", "MediCare Plus", 24)]
OWN_BRAND = "B001"
INDEP = ["Shree Medical", "Sai Medicals", "Ganesh Pharmacy", "Mahalaxmi Medical Store", "Om Chemist",
         "Datta Medicals", "Jyoti Medical & General", "Ambabai Pharmacy", "Rajarampuri Chemists", "Shivneri Medical"]
def variant(b):
    return rng.choice([b, f"{b} Pharmacy", f"{b} Medicals", b.upper(), b.replace(" ", ""), f"{b} Chemist"],
                      p=[.35, .3, .1, .1, .1, .05])
ph = []
def add_store(ci, brand_id=None, brand=None):
    lat, lon = place(ci)
    conf = float(np.clip(rng.beta(14, 2.5), 0.35, 0.99))
    if brand:
        nm = variant(brand); ms = 100.0 if nm == brand else float(rng.uniform(90, 98))
    else:
        nm = f"{rng.choice(INDEP)}"; ms = float(rng.uniform(20, 70))
    ph.append(dict(category="pharmacy", brand_id=brand_id or "", lat=lat, lon=lon, name=nm,
                   overture_confidence=conf, match_score=round(ms, 1),
                   is_own=(brand_id == OWN_BRAND), is_branded_pool=bool(brand_id)))
p_b = np.exp(0.55 * lp); p_i = np.exp(0.40 * lp)
HOME = {"B001": (16.6950, 74.2360, 1400), "B002": (16.7100, 74.2530, 1800),
        "B003": (16.7250, 74.2250, 1800), "B004": (16.7040, 74.2300, 6000)}   # chain home territories
for bid, bname, n in CHAINS:
    placed = []
    hx = xy(*HOME[bid][:2])[0]
    p_c = p_b * np.exp(-np.linalg.norm(cxy - hx, axis=1) / HOME[bid][2] * 1.0)
    while len(placed) < n:
        ci = sample_cells(p_c, 1)[0]
        if placed and np.min(np.linalg.norm(cxy[placed] - cxy[ci], axis=1)) < 250:   # same-chain spacing
            continue
        placed.append(ci); add_store(ci, bid, bname)
for ci in sample_cells(p_i, 150): add_store(ci)
ph_df = pd.DataFrame(ph)

poi = pd.concat([ph_df, foot_df], ignore_index=True)
poi["h3_id"] = [h3.latlng_to_cell(a, b, RES) for a, b in zip(poi.lat, poi.lon)]
bad = ~poi.h3_id.isin(idx_of)               # jitter pushed outside the disk -> snap to centroid
poi.loc[bad, "h3_id"] = poi.loc[bad, "h3_id"].map(lambda h: h3.cell_to_center_child(h, RES))
poi = poi[poi.h3_id.isin(idx_of)].reset_index(drop=True)
poi["poi_id"] = [f"P{i+1:04d}" for i in range(len(poi))]
poi["source"] = "synthetic"
poi["lat"] = poi.lat.round(6); poi["lon"] = poi.lon.round(6)
poi["overture_confidence"] = poi.overture_confidence.round(3)
poi = poi[["poi_id", "name", "category", "brand_id", "lat", "lon", "h3_id", "overture_confidence",
           "match_score", "is_own", "is_branded_pool", "source"]]
poi.to_csv(f"{OUT}/poi.csv", index=False)

# supply set = pharmacies with confidence >= 0.7 (assumption A-10)
S = poi[(poi.category == "pharmacy") & (poi.overture_confidence >= 0.7)].reset_index(drop=True)
s_xy = xy(S.lat, S.lon); s_cell = S.h3_id.map(idx_of).values
s_own = S.is_own.values.astype(bool); s_pool = S.is_branded_pool.values.astype(bool)
has_own = np.zeros(n_all, bool); has_own[s_cell[s_own]] = True
has_pool = np.zeros(n_all, bool); has_pool[s_cell[s_pool]] = True

# ---- 4. cell.csv ---------------------------------------------------------------------
cell = pd.DataFrame(dict(h3_id=ids, lat=latlng[:, 0].round(6), lon=latlng[:, 1].round(6),
                         population=pop, age60_share=age60.round(4), is_candidate=is_cand,
                         exclusion_reason=excl, has_own_store=has_own, has_pool_store=has_pool,
                         nearest_anchor=nearest_anchor))
cell.to_csv(f"{OUT}/cell.csv", index=False)

# ---- 5. features.csv (leave-focal-out for pharmacy features) -------------------------
Dcc = dist(cxy, cxy)
Dcs = dist(cxy, s_xy)
Dcs[s_cell[None, :] == np.arange(n_all)[:, None]] = np.inf      # focal cell's own stores removed
comp_mask = ~s_own
def cnt(r, m): return (Dcs[:, m] <= r).sum(1)
nearest_comp = np.minimum(np.where(comp_mask[None, :], Dcs, np.inf).min(1), 5000)
nearest_own = np.minimum(np.where(s_own[None, :], Dcs, np.inf).min(1), 5000)
bdiv = np.array([len(set(np.where(Dcs[i] <= 1000, np.where(S.brand_id.values == "", "IND", S.brand_id.values), None)) - {None})
                 for i in range(n_all)])
transit_xy = foot_xy[(foot_df.category == "transit_stop").values]
Dt = dist(cxy, transit_xy)
rent_proxy = np.clip(0.6 * z(commercial) + 0.4 * z(-centrality) + 0.15 * z(affluence), -3, 3)
rent_proxy = (rent_proxy - rent_proxy.min()) / (rent_proxy.max() - rent_proxy.min()) * 100
F = pd.DataFrame(dict(
    h3_id=ids,
    pop_500m=(Dcc <= 500) @ pop, pop_1km=(Dcc <= 1000) @ pop, pop_2km=(Dcc <= 2000) @ pop,
    age60_share=age60, bldg_density_per_ha=bldg,
    residential_bldg_share=np.clip(0.85 - 0.5 * commercial / 100 + rng.normal(0, 0.04, n_all), 0.1, 0.95),
    hospital_wcount_1km=hosp_w, clinic_wcount_1km=foot_feat("clinic"), school_wcount_1km=foot_feat("school"),
    market_wcount_1km=foot_feat("market"), office_wcount_1km=foot_feat("office"),
    dist_to_hospital_m=dist(cxy, foot_xy[(foot_df.category == "hospital").values]).min(1),
    transit_stop_dist_m=Dt.min(1), transit_stop_cnt_500m=(Dt <= 500).sum(1),
    arterial_dist_m=art_d, intersection_density_km2=inter_den,
    comp_cnt_300m=cnt(300, comp_mask), comp_cnt_400m=cnt(400, comp_mask), comp_cnt_1km=cnt(1000, comp_mask),
    nearest_comp_m=nearest_comp, brand_diversity_1km=bdiv,
    pool_cnt_1km=cnt(1000, s_pool),
    own_nearest_m=nearest_own, own_cnt_1km=cnt(1000, s_own),
    commercial_density=commercial, affluence_proxy=affluence, rent_pressure_proxy=rent_proxy,
    centrality_m=centrality))
F["pop_density_pctile"] = pct(F.pop_1km); F["comp_cnt_300m_pctile"] = pct(F.comp_cnt_300m)
F["brand_in_cell_flag"] = 0   # placeholder kept 0: leave-focal-out guarantees no own-cell leakage
F = F[is_cand].reset_index(drop=True).round(4)
F.to_csv(f"{OUT}/features.csv", index=False)
fi = F.set_index("h3_id")

# ---- 6. Huff demand engine (closed form, counterfactual focal removal) ----------------
Dkm_all = Dcc / 1000 * TRUE["detour"]
Dsd = dist(s_xy, cxy) / 1000 * TRUE["detour"]
def huff(beta, popmult=None, keep=None):
    keep = np.ones(len(S), bool) if keep is None else keep
    P = pop * (1 if popmult is None else popmult)
    W = np.maximum(Dsd, TRUE["min_dist_km"]) ** (-beta) * keep[:, None] * TRUE["attractiveness"]
    Wc_all = np.zeros((n_all, n_all)); Wc_own = np.zeros((n_all, n_all))
    np.add.at(Wc_all, s_cell, W); np.add.at(Wc_own, s_cell[s_own], W[s_own])
    D = np.maximum(W.sum(0)[None, :] - Wc_all[cand_idx], 0) + 1e-12      # focal store removed
    O = np.maximum(W[s_own].sum(0)[None, :] - Wc_own[cand_idx], 0)
    Dk = Dkm_all[cand_idx]
    X = np.maximum(Dk, TRUE["min_dist_km"]) ** (-beta) * TRUE["attractiveness"] * (Dk <= TRUE["catchment_km"])
    sh = X / (D + X)
    cap = TRUE["lam"] * (P[None, :] * sh).sum(1)
    can = TRUE["lam"] * (P[None, :] * (O / D) * sh).sum(1)
    return cap, can
cap_t, can_t = huff(TRUE["beta"]); nid_true = cap_t - can_t

caps = np.zeros((N_DRAWS, nc)); cans = np.zeros_like(caps)
for d in range(N_DRAWS):
    beta = rng.triangular(1.0, 1.5, 2.5)
    pm = rng.lognormal(0, 0.10, n_all)
    drop = rng.uniform(0, 0.2)
    keep = s_own | (rng.random(len(S)) > drop)
    caps[d], cans[d] = huff(beta, pm, keep)
nids = caps - cans
q = lambda a, p_: np.percentile(a, p_, axis=0)

# ---- 7. economics + pattern oracle + robust ranking -----------------------------------
rent_psf = 25 + 0.9 * rent_proxy[cand_idx]
monthly_cost = rent_psf * TRUE["store_area_sqft"] + TRUE["fixed_cost_inr"]
breakeven_tx = monthly_cost / TRUE["gross_margin_per_tx_inr"]
cov = q(nids, 50) / breakeven_tx
pattern_logit = lp[cand_idx] + rng.normal(0, 0.4, nc)          # ORACLE propensity, not a trained model
pattern_score = 1 / (1 + np.exp(-z(pattern_logit)))
pct_pat = pct(pattern_score); pct_aff = pct(-monthly_cost)
w0 = np.array([TRUE["w_demand"], TRUE["w_pattern"], TRUE["w_afford"]])
eps = w0[0] * pct(q(nids, 50)) + w0[1] * pct_pat + w0[2] * pct_aff
rk = np.zeros((N_DRAWS, nc))
for d in range(N_DRAWS):
    w = rng.dirichlet(w0 * 100)
    e = w[0] * pct(nids[d]) + w[1] * pct_pat + w[2] * pct_aff
    rk[d] = pd.Series(-e).rank(method="min").values
r10, r50, r90 = q(rk, 10), q(rk, 50), q(rk, 90)
top10 = (rk <= 10).mean(0)
nid50 = q(nids, 50); cap50 = q(caps, 50); can_pct = q(cans / np.maximum(caps, 1e-9) * 100, 50)
sat_thr = np.percentile(F.comp_cnt_300m, 90)
pn = pct(nid50)
flags = []
for i in range(nc):
    f = ["rent_proxy"]
    if can_pct[i] > 35: f.append("high_cannibalization")
    if r90[i] - r10[i] > 25: f.append("fragile_rank")
    if abs(pn[i] - pct_pat[i]) > 30: f.append("model_disagreement")
    if F.comp_cnt_300m[i] > sat_thr: f.append("saturated")
    if cov[i] < 1.0: f.append("below_breakeven")
    flags.append(";".join(f))
scores = pd.DataFrame(dict(
    h3_id=F.h3_id, nid_p10=q(nids, 10), nid_p50=nid50, nid_p90=q(nids, 90), nid_true=nid_true,
    capture_p50=cap50, cannib_pct_p50=can_pct, pattern_score=pattern_score,
    rent_pressure=rent_proxy[cand_idx], rent_psf_inr=rent_psf, monthly_cost_inr=monthly_cost,
    breakeven_tx=breakeven_tx, coverage_ratio_p50=cov, eps=eps,
    rank_p10=r10, rank_p50=r50, rank_p90=r90, top10_prob=top10, flags=flags,
    rent_mode="proxy", eps_mode="standard", run_id=RUN_ID,
    pop_only_rank=pd.Series(-pop[cand_idx]).rank(method="min").values))
scores["rank_eps"] = scores.eps.rank(ascending=False, method="min")
scores = scores.sort_values("rank_eps").round(4)
scores.to_csv(f"{OUT}/scores.csv", index=False)

# ---- 8. evidence.csv (top 20) --------------------------------------------------------
ev = []
for n, r in enumerate(scores.head(20).itertuples(), 1):
    def add(t, stat, v, u): ev.append(dict(evidence_id=f"E-{t}-{n:02d}" + (f"-{stat}" if stat else ""), h3_id=r.h3_id, type=t.lower(),
                                           stat=stat or "value", value=round(float(v), 4), unit=u, source_table="scores", data_version=RUN_ID))
    add("NID", "P10", r.nid_p10, "demand_units"); add("NID", "P50", r.nid_p50, "demand_units"); add("NID", "P90", r.nid_p90, "demand_units")
    add("CAP", "", r.capture_p50, "demand_units"); add("CAN", "", r.cannib_pct_p50, "percent")
    add("COV", "", r.coverage_ratio_p50, "ratio"); add("RANK", "P50", r.rank_p50, "rank"); add("RANK", "P10", r.rank_p10, "rank")
    add("RANK", "P90", r.rank_p90, "rank"); add("TOP10", "", r.top10_prob, "probability")
pd.DataFrame(ev).to_csv(f"{OUT}/evidence.csv", index=False)

# ---- 9. rent_sample.csv (P1 / FR20 test) ---------------------------------------------
ri = rng.choice(cand_idx, 40, replace=False)
rs = pd.DataFrame(dict(sample_id=[f"R{i+1:03d}" for i in range(40)], h3_id=[ids[i] for i in ri],
                       lat=latlng[ri, 0].round(6), lon=latlng[ri, 1].round(6),
                       asking_rent_psf_inr=(25 + 0.9 * rent_proxy[ri] * rng.lognormal(0, 0.12, 40)).round(1),
                       area_sqft=rng.choice([150, 200, 250, 300, 400], 40),
                       listing_type="shop", collected_on=GEN_DATE, source_note="synthetic - replace with manually recorded public listings"))
rs.to_csv(f"{OUT}/rent_sample.csv", index=False)

# ---- 10. synthetic_truth.csv ---------------------------------------------------------
pd.DataFrame([dict(parameter=k, value=v) for k, v in
              {**TRUE, "seed": SEED, "n_mc_draws": N_DRAWS, "own_brand_id": OWN_BRAND, "run_id": RUN_ID,
               "mc_beta_dist": "Triangular(1.0,1.5,2.5)", "mc_pop_noise": "lognormal(0,0.10)",
               "mc_competitor_dropout": "U(0,0.2)"}.items()]).to_csv(f"{OUT}/synthetic_truth.csv", index=False)

# ---- 11. data_dictionary.csv ---------------------------------------------------------
DESC = {
 "poi": dict(poi_id="Unique POI id", name="Raw POI name (variants test fuzzy matching)", category="pharmacy|hospital|clinic|school|market|office|transit_stop",
    brand_id="Resolved chain id; blank = independent/unresolved", lat="Latitude WGS84", lon="Longitude WGS84", h3_id="H3 res-9 cell",
    overture_confidence="Source confidence 0-1 (filter >= 0.7)", match_score="Fuzzy brand match score 0-100 (>= 90 accepted)",
    is_own="True if POI belongs to the selected chain", is_branded_pool="True if POI belongs to any resolved chain", source="synthetic | overture"),
 "cell": dict(h3_id="H3 res-9 id", lat="Cell centroid lat", lon="Cell centroid lon", population="Residents in cell", age60_share="Share aged 60+",
    is_candidate="Passes filters", exclusion_reason="water|low_population|blank", has_own_store="Selected chain store in cell",
    has_pool_store="Any branded-pool store in cell (PU positive label)", nearest_anchor="Nearest neighbourhood anchor (for demo narratives)"),
 "features": dict(h3_id="H3 id", pop_500m="Population within 500 m", pop_1km="Population within 1 km", pop_2km="Population within 2 km",
    age60_share="Share aged 60+", bldg_density_per_ha="Buildings per hectare", residential_bldg_share="Residential share of buildings",
    hospital_wcount_1km="Distance-weighted hospital count (tau 500 m)", clinic_wcount_1km="Same, clinics", school_wcount_1km="Same, schools",
    market_wcount_1km="Same, markets", office_wcount_1km="Same, offices", dist_to_hospital_m="Distance to nearest hospital (m)",
    transit_stop_dist_m="Distance to nearest transit stop (m)", transit_stop_cnt_500m="Transit stops within 500 m",
    arterial_dist_m="Distance to nearest arterial road (m)", intersection_density_km2="Intersections per km2",
    comp_cnt_300m="Competitor pharmacies within 300 m (focal cell excluded)", comp_cnt_400m="Within 400 m", comp_cnt_1km="Within 1 km",
    nearest_comp_m="Distance to nearest competitor (m, cap 5000)", brand_diversity_1km="Distinct brands within 1 km (independents = 1)",
    pool_cnt_1km="Branded-pool stores within 1 km", own_nearest_m="Distance to nearest own store (m, cap 5000)", own_cnt_1km="Own stores within 1 km",
    commercial_density="Commercial intensity 0-100", affluence_proxy="Affluence proxy 0-100", rent_pressure_proxy="Unitless rent proxy 0-100",
    centrality_m="Distance to city centre (m)", pop_density_pctile="Within-city percentile of pop_1km", comp_cnt_300m_pctile="Within-city percentile of comp_cnt_300m",
    brand_in_cell_flag="Reserved leakage check column (always 0)"),
 "scores": dict(h3_id="H3 id", nid_p10="NID 10th pct", nid_p50="NID median", nid_p90="NID 90th pct", nid_true="NID at true beta, no noise (K18 ground truth)",
    capture_p50="Capture median", cannib_pct_p50="Cannibalization % median", pattern_score="ORACLE pattern propensity 0-1 (replace with LightGBM output)",
    rent_pressure="Rent proxy 0-100", rent_psf_inr="Synthetic rent INR/sqft/month", monthly_cost_inr="Rent*area + fixed cost",
    breakeven_tx="Break-even monthly transactions", coverage_ratio_p50="NID_p50 / breakeven_tx", eps="Expansion Priority Score 0-100",
    rank_p10="Rank 10th pct", rank_p50="Rank median", rank_p90="Rank 90th pct", top10_prob="P(rank <= 10)", flags="Semicolon-separated flags",
    rent_mode="proxy|model", eps_mode="standard|partial", run_id="Data/run version", pop_only_rank="Population-only baseline rank", rank_eps="Rank by default-weight EPS"),
 "evidence": dict(evidence_id="Unique evidence id cited in Briefs", h3_id="H3 id", type="nid|cap|can|cov|rank|top10", stat="p10|p50|p90|value",
    value="Numeric value", unit="Unit", source_table="Table the value came from", data_version="Run/data version"),
 "rent_sample": dict(sample_id="Listing id", h3_id="H3 id", lat="Lat", lon="Lon", asking_rent_psf_inr="Asking rent INR/sqft/month", area_sqft="Unit area",
    listing_type="shop", collected_on="Collection date", source_note="Provenance note"),
 "synthetic_truth": dict(parameter="Hidden simulator parameter", value="Value"),
}
dd = []
for t, d in DESC.items():
    df = pd.read_csv(f"{OUT}/{t}.csv")
    for c in df.columns:
        assert c in d, f"missing description {t}.{c}"
        dd.append(dict(table=f"{t}.csv", field=c, dtype=str(df[c].dtype), description=d[c], example=df[c].iloc[0]))
pd.DataFrame(dd).to_csv(f"{OUT}/data_dictionary.csv", index=False)

# ---- 12. manifest.csv ----------------------------------------------------------------
man = []
for t in DESC:
    p = f"{OUT}/{t}.csv"
    man.append(dict(source=f"{t}.csv", version=RUN_ID, retrieval_date=GEN_DATE, row_count=len(pd.read_csv(p)),
                    sha256=hashlib.sha256(open(p, "rb").read()).hexdigest(), licence="synthetic (no third-party data)", is_synthetic=True))
pd.DataFrame(man).to_csv(f"{OUT}/manifest.csv", index=False)

# ---- sanity checks / summary ---------------------------------------------------------
assert (nid_true <= cap_t + 1e-9).all()
print(f"cells={n_all} candidates={nc} pharmacies_supply={len(S)} own={s_own.sum()} branded={s_pool.sum()}")
print(f"cannib% p50: {np.percentile(can_pct,[10,50,90]).round(1)}  coverage ratio: {np.percentile(cov,[10,50,90]).round(2)}")
print("flag counts:", pd.Series(";".join(flags).split(";")).value_counts().to_dict())
print("median-rank spearman vs true NID:", round(pd.Series(r50).corr(pd.Series(-nid_true).rank(), method="spearman"), 3))
print(scores[["h3_id","nid_p50","cannib_pct_p50","coverage_ratio_p50","eps","rank_eps","pop_only_rank","top10_prob"]].head(5).to_string(index=False))
