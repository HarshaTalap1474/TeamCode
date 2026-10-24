#!/usr/bin/env python3
"""
STEP 3 - demand engine (Huff NID + Monte Carlo), economics proxy, robust ranking -> scores.csv, evidence.csv
  python score_tables.py --data data/cache/kolhapur_pharmacy [--pattern pattern_scores.csv]
pattern_scores.csv (h3_id, pattern_score) comes from your LightGBM PU model. If absent, the ranking is a labelled PARTIAL ranking (PRD 8.9).
"""
import argparse, json, os
import numpy as np, pandas as pd
from pyproj import Transformer
ap = argparse.ArgumentParser(); ap.add_argument("--data", default="data/cache/kolhapur_pharmacy")
ap.add_argument("--config", default="config/pharmacy_kolhapur.json"); ap.add_argument("--pattern"); ap.add_argument("--draws", type=int)
a = ap.parse_args(); cfg = json.load(open(a.config)); H = cfg["huff"]; E = cfg["economics_ASSUMPTIONS"]; rng = np.random.default_rng(cfg["seed"])
N_DRAWS = a.draws or H["n_draws"]; T = Transformer.from_crs(4326, cfg["utm_epsg"], always_xy=True)
def xy(lat, lon): x, y = T.transform(np.asarray(lon, float), np.asarray(lat, float)); return np.c_[x, y]
def dist(A, B): return np.linalg.norm(A[:, None, :] - B[None, :, :], axis=2)
def pct(v): return pd.Series(v).rank(pct=True).values * 100
cell = pd.read_csv(f"{a.data}/cell.csv"); poi = pd.read_csv(f"{a.data}/poi.csv"); F = pd.read_csv(f"{a.data}/features.csv")
n = len(cell); idx = {h: i for i, h in enumerate(cell.h3_id)}; pop = cell.population.values.astype(float)
cxy = xy(cell.lat, cell.lon); cand = np.where(cell.is_candidate.values)[0]; nc = len(cand)
S = poi[(poi.category == "pharmacy") & (poi.overture_confidence >= cfg["min_confidence"]) & poi.h3_id.isin(idx)].reset_index(drop=True)
s_xy = xy(S.lat, S.lon); s_cell = S.h3_id.map(idx).values; s_own = S.is_own.values.astype(bool)
assert s_own.any(), "no own-chain stores: check demo_chain_brand_id / aliases"
Dkm = dist(cxy, cxy) / 1000 * H["detour"]; Dsd = dist(s_xy, cxy) / 1000 * H["detour"]
def huff(beta, pm=None, keep=None):
    keep = np.ones(len(S), bool) if keep is None else keep; P = pop * (1 if pm is None else pm)
    W = np.maximum(Dsd, H["min_dist_km"]) ** (-beta) * keep[:, None]
    Wa = np.zeros((n, n)); Wo = np.zeros((n, n)); np.add.at(Wa, s_cell, W); np.add.at(Wo, s_cell[s_own], W[s_own])
    D = np.maximum(W.sum(0)[None, :] - Wa[cand], 0) + 1e-12; O = np.maximum(W[s_own].sum(0)[None, :] - Wo[cand], 0)   # focal store removed
    Dk = Dkm[cand]; X = np.maximum(Dk, H["min_dist_km"]) ** (-beta) * (Dk <= H["catchment_km"]); sh = X / (D + X)
    return H["lam"] * (P * sh).sum(1), H["lam"] * (P * (O / D) * sh).sum(1)
cap_t, can_t = huff(H["beta"]); nid_true = cap_t - can_t
caps = np.zeros((N_DRAWS, nc)); cans = np.zeros_like(caps)
for d in range(N_DRAWS):
    keep = s_own | (rng.random(len(S)) > rng.uniform(0, H["dropout_max"]))
    caps[d], cans[d] = huff(rng.triangular(*H["beta_tri"]), rng.lognormal(0, H["pop_noise_sigma"], n), keep)
nids = caps - cans; q = lambda x, p: np.percentile(x, p, axis=0)
# economics (proxy mode: ASSUMPTIONS in config, labelled)
rent_psf = E["rent_psf_base_inr"] + E["rent_psf_slope_inr"] * F.rent_pressure_proxy.values
cost = rent_psf * E["store_area_sqft"] + E["fixed_cost_inr"]; be = cost / E["gross_margin_per_tx_inr"]; cov = q(nids, 50) / be
# components + weights (partial ranking if pattern missing)
w = dict(cfg["weights"]); pat = None
if a.pattern and os.path.exists(a.pattern):
    pat = F[["h3_id"]].merge(pd.read_csv(a.pattern), on="h3_id", how="left").pattern_score.values
    assert not np.isnan(pat).any(), "pattern_scores.csv must cover every candidate cell"
mode = "standard"
if pat is None: mode = "partial"; w.pop("pattern"); tot = sum(w.values()); w = {k: v / tot for k, v in w.items()}
w0 = np.array([w["demand"], w.get("pattern", 0), w["afford"]]); ppat = pct(pat) if pat is not None else np.zeros(nc); paff = pct(-cost)
eps = w0[0] * pct(q(nids, 50)) + w0[1] * ppat + w0[2] * paff
act = [i for i in range(3) if w0[i] > 0]; rk = np.zeros((N_DRAWS, nc))
for d in range(N_DRAWS):
    ww = np.zeros(3); ww[act] = rng.dirichlet(w0[act] * 100)
    rk[d] = pd.Series(-(ww[0] * pct(nids[d]) + ww[1] * ppat + ww[2] * paff)).rank(method="min").values
r10, r50, r90 = q(rk, 10), q(rk, 50), q(rk, 90); nid50 = q(nids, 50); canp = q(cans / np.maximum(caps, 1e-9) * 100, 50)
sat = np.percentile(F.comp_cnt_300m, 90); pn = pct(nid50); flags = []
for i in range(nc):
    f = ["rent_proxy"] + (["pattern_unavailable"] if pat is None else [])
    if canp[i] > 35: f.append("high_cannibalization")
    if r90[i] - r10[i] > 25: f.append("fragile_rank")
    if pat is not None and abs(pn[i] - ppat[i]) > 30: f.append("model_disagreement")
    if F.comp_cnt_300m[i] > sat: f.append("saturated")
    if cov[i] < 1: f.append("below_breakeven")
    flags.append(";".join(f))
run = f"{cfg['city']}-{cfg['category']}-{mode}-seed{cfg['seed']}"
sc = pd.DataFrame(dict(h3_id=F.h3_id, nid_p10=q(nids, 10), nid_p50=nid50, nid_p90=q(nids, 90), capture_p50=q(caps, 50), cannib_pct_p50=canp,
    pattern_score=pat if pat is not None else np.nan, rent_pressure=F.rent_pressure_proxy, monthly_cost_inr=cost, breakeven_tx=be, coverage_ratio_p50=cov, eps=eps,
    rank_p10=r10, rank_p50=r50, rank_p90=r90, top10_prob=(rk <= 10).mean(0), flags=flags, rent_mode="proxy", eps_mode=mode, run_id=run,
    pop_only_rank=pd.Series(-pop[cand]).rank(method="min").values))
sc["rank_eps"] = sc.eps.rank(ascending=False, method="min"); sc = sc.sort_values("rank_eps").round(4); sc.to_csv(f"{a.data}/scores.csv", index=False)
ev = []
for k, r in enumerate(sc.head(20).itertuples(), 1):
    for t, st, v, u in [("NID", "P10", r.nid_p10, "demand_units"), ("NID", "P50", r.nid_p50, "demand_units"), ("NID", "P90", r.nid_p90, "demand_units"),
                        ("CAP", "", r.capture_p50, "demand_units"), ("CAN", "", r.cannib_pct_p50, "percent"), ("COV", "", r.coverage_ratio_p50, "ratio"),
                        ("RANK", "P10", r.rank_p10, "rank"), ("RANK", "P50", r.rank_p50, "rank"), ("RANK", "P90", r.rank_p90, "rank"), ("TOP10", "", r.top10_prob, "probability")]:
        ev.append(dict(evidence_id=f"E-{t}-{k:02d}" + (f"-{st}" if st else ""), h3_id=r.h3_id, type=t.lower(), stat=st or "value", value=round(float(v), 4), unit=u, source_table="scores", data_version=run))
pd.DataFrame(ev).to_csv(f"{a.data}/evidence.csv", index=False)
print(f"mode={mode} candidates={nc} own={s_own.sum()} supply={len(S)}  cannib% p10/50/90={np.percentile(canp,[10,50,90]).round(1)}  coverage p10/50/90={np.percentile(cov,[10,50,90]).round(2)}")
