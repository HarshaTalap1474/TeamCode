#!/usr/bin/env python3
"""
STEP 4 - Pattern engine: LightGBM positive-unlabeled classifier + spatial block CV + baselines + SHAP.
  python train_pattern.py --data data/cache/kolhapur_pharmacy
Reads  : cell.csv, features.csv, (optional) scores.csv for the Huff-NID baseline
Writes : pattern_scores.csv (out-of-fold, leakage-free), metrics_pattern.json, shap_drivers.csv, feature_importance.csv

Works identically on synthetic and real data. Label = cell has a branded-chain pharmacy (positive); everything else is UNLABELED.
"""
import argparse, json, os
import numpy as np, pandas as pd, h3, lightgbm as lgb, shap
from sklearn.metrics import roc_auc_score, average_precision_score

ap = argparse.ArgumentParser()
ap.add_argument("--data", default="data/cache/kolhapur_pharmacy"); ap.add_argument("--block-res", type=int, default=6)
ap.add_argument("--folds", type=int, default=5); ap.add_argument("--repeats", type=int, default=3); ap.add_argument("--boot", type=int, default=1000)
ap.add_argument("--seed", type=int, default=42); ap.add_argument("--exclude-rings", type=int, default=2); ap.add_argument("--buffer-m", type=float, default=1000)
a = ap.parse_args(); rng = np.random.default_rng(a.seed); D = a.data

cell = pd.read_csv(f"{D}/cell.csv"); F = pd.read_csv(f"{D}/features.csv")
df = F.merge(cell[["h3_id", "lat", "lon", "has_pool_store"]], on="h3_id")
y = df.has_pool_store.astype(int).values; n = len(df)
feat = [c for c in F.columns if c != "h3_id" and df[c].notna().any() and df[c].nunique() > 1]    # drop empty/constant columns
assert not {"lat", "lon"} & set(feat)                                                              # coordinates are never predictors
X = df[feat]; print(f"cells={n} positives={y.sum()} features={len(feat)}")
ids = df.h3_id.tolist(); idset = {h: i for i, h in enumerate(ids)}

# ---- PU negatives: unlabeled cells within N rings of a positive are NOT used as training negatives ----
near_pos = np.zeros(n, bool)
for i in np.where(y == 1)[0]:
    for h in h3.grid_disk(ids[i], a.exclude_rings):
        j = idset.get(h)
        if j is not None and y[j] == 0: near_pos[j] = True
train_ok = ~near_pos
# ---- spatial blocks ----
blocks = np.array([h3.cell_to_parent(h, a.block_res) for h in ids]); ub = np.unique(blocks)
print(f"spatial blocks (H3 res {a.block_res}) = {len(ub)}")
xy = np.c_[(df.lon - df.lon.mean()) * 111320 * np.cos(np.radians(df.lat.mean())), (df.lat - df.lat.mean()) * 110574]
PARAMS = dict(n_estimators=250, learning_rate=0.05, num_leaves=15, min_child_samples=15, subsample=0.8, subsample_freq=1,
              colsample_bytree=0.8, reg_lambda=1.0, class_weight="balanced", random_state=a.seed, verbose=-1)

def lift10(score, yy):
    if yy.sum() == 0: return np.nan
    k = max(1, int(round(0.10 * len(score)))); top = np.argsort(-score, kind="stable")[:k]
    return yy[top].sum() / yy.sum() / 0.10

def oof(cols):
    """Out-of-fold predictions averaged over repeats; train on blocks outside the test blocks, minus a buffer around test positives."""
    P = np.zeros(n); cnt = np.zeros(n); nf = min(a.folds, len(ub))
    for r in range(a.repeats):
        fold_of = dict(zip(rng.permutation(ub), np.arange(len(ub)) % nf))
        fid = np.array([fold_of[b] for b in blocks])
        for f in range(nf):
            te = fid == f
            if y[te].sum() == 0: continue
            tp = xy[te & (y == 1)]
            dmin = np.sqrt(((xy[:, None, :] - tp[None, :, :]) ** 2).sum(2)).min(1)
            tr = (~te) & train_ok & (dmin > a.buffer_m)                                   # preprocessing/model fit on training data only
            if y[tr].sum() < 5: continue
            m = lgb.LGBMClassifier(**PARAMS).fit(X.loc[tr, cols], y[tr])
            P[te] += m.predict_proba(X.loc[te, cols])[:, 1]; cnt[te] += 1
    return P / np.maximum(cnt, 1), cnt > 0

pred, ok = oof(feat)
pct = lambda v: pd.Series(v).rank(pct=True).values
base = {"random": rng.random(n), "population_only": df.pop_1km.values,
        "weighted_sum": 0.4 * pct(df.pop_1km) - 0.3 * pct(df.comp_cnt_400m) + 0.3 * pct(df.commercial_density)}
if os.path.exists(f"{D}/scores.csv"):
    sc = pd.read_csv(f"{D}/scores.csv")[["h3_id", "nid_p50"]]; nid = df[["h3_id"]].merge(sc, on="h3_id", how="left").nid_p50.values
    if not np.isnan(nid).any(): base["huff_nid"] = nid; base["hybrid_nid_plus_pattern"] = 0.5 * pct(nid) + 0.5 * pct(pred)
base["lightgbm_pattern"] = pred

def metrics(s, mask):
    yy = y[mask]; ss = s[mask]; return dict(lift10=lift10(ss, yy), roc_auc=roc_auc_score(yy, ss), pr_auc=average_precision_score(yy, ss))
res = {k: metrics(v, ok) for k, v in base.items()}
# block bootstrap (resample spatial blocks, not stores)
bidx = {b: np.where((blocks == b) & ok)[0] for b in ub}; names = list(base); boots = {k: [] for k in names}
for _ in range(a.boot):
    pick = rng.choice(ub, len(ub)); idx = np.concatenate([bidx[b] for b in pick])
    if y[idx].sum() < 2 or y[idx].sum() == len(idx): continue
    for k in names: boots[k].append(lift10(base[k][idx], y[idx]))
for k in names:
    b = np.array(boots[k]); lo, hi = (np.nanpercentile(b, [2.5, 97.5]) if len(b) > 20 else (np.nan, np.nan))
    res[k].update(lift10_ci95=[float(lo), float(hi)], bootstrap_n=int(len(b)))
for k, v in res.items(): print(f"{k:26s} Lift@10%={v['lift10']:.2f} CI={np.round(v['lift10_ci95'],2)}  ROC-AUC={v['roc_auc']:.3f}  PR-AUC={v['pr_auc']:.3f}")

# ---- final model, SHAP, additivity, deletion audit ----
final = lgb.LGBMClassifier(**PARAMS).fit(X[train_ok], y[train_ok])
ex = shap.TreeExplainer(final); sv = ex.shap_values(X)
sv = sv[1] if isinstance(sv, list) else sv
if sv.ndim == 3: sv = sv[:, :, 1]
ev = np.atleast_1d(ex.expected_value)[-1]
add_err = float(np.abs(sv.sum(1) + ev - final.predict(X, raw_score=True)).max())
mean_abs = pd.Series(np.abs(sv).mean(0), index=feat).sort_values(ascending=False)
mean_abs.rename("mean_abs_shap").to_csv(f"{D}/feature_importance.csv")
top3 = list(mean_abs.index[:3]); rnd3 = list(rng.choice([c for c in feat if c not in top3], 3, replace=False))
p_top, ok_t = oof([c for c in feat if c not in top3]); p_rnd, ok_r = oof([c for c in feat if c not in rnd3])
audit = dict(removed_top3=top3, removed_random3=rnd3,
             roc_auc_full=res["lightgbm_pattern"]["roc_auc"], roc_auc_minus_top3=float(roc_auc_score(y[ok_t], p_top[ok_t])), roc_auc_minus_random3=float(roc_auc_score(y[ok_r], p_rnd[ok_r])))
top_idx = np.argsort(-np.abs(sv), axis=1)[:, :3]
pd.DataFrame({"h3_id": ids, **{f"driver{k+1}_{t}": [feat[j] if t == "feature" else round(float(sv[i, j]), 4) for i, j in enumerate(top_idx[:, k])] for k in range(3) for t in ("feature", "shap")}}).to_csv(f"{D}/shap_drivers.csv", index=False)
# pattern_score = OUT-OF-FOLD prediction, so a store cell is never rewarded for its own label
pd.DataFrame({"h3_id": ids, "pattern_score": np.round(pred, 5)}).to_csv(f"{D}/pattern_scores.csv", index=False)
lg = res["lightgbm_pattern"]; pop = res["population_only"]
status = lambda cond, lo: "MEASURED-met" if cond else "MEASURED-not-met"
out = dict(dataset=D, n_eligible_cells=int(ok.sum()), n_positive_cells=int(y[ok].sum()), n_spatial_blocks=int(len(ub)), block_res=a.block_res,
           folds=min(a.folds, len(ub)), repeats=a.repeats, features_used=feat, methods=res, shap_additivity_max_error=add_err, shap_deletion_audit=audit,
           K1_lift10=dict(value=lg["lift10"], ci95=lg["lift10_ci95"], beats_population_only=bool(lg["lift10"] > pop["lift10"]),
                          beats_weighted_sum=bool(lg["lift10"] > res["weighted_sum"]["lift10"]),
                          status="inconclusive (lower CI <= 1.0)" if lg["lift10_ci95"][0] <= 1.0 else status(lg["lift10"] >= 2.0, 2.0), target=">=2.0x"),
           K2_roc_auc=dict(value=lg["roc_auc"], status=status(lg["roc_auc"] >= 0.75, .75), target=">=0.75"),
           note="Spatial block CV with buffer; labels = branded-chain presence (revealed preference, PU). If dataset is synthetic these are NOT real-city results.")
json.dump(out, open(f"{D}/metrics_pattern.json", "w"), indent=2, default=float)
print(f"\nSHAP additivity max error = {add_err:.2e} | deletion audit AUC full/-top3/-rand3 = "
      f"{audit['roc_auc_full']:.3f}/{audit['roc_auc_minus_top3']:.3f}/{audit['roc_auc_minus_random3']:.3f} | top features: {top3}")
print("K1:", out["K1_lift10"]["status"], "| K2:", out["K2_roc_auc"]["status"])
