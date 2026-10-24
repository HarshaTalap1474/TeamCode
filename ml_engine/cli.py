#!/usr/bin/env python
import json
import os
import sys
sys.path.insert(0, '.')

from ml_engine.data.synthetic_gen import generate_kolhapur_synthetic_demo
from ml_engine.data.validator import validate_dataset
from ml_engine.spatial.huff import HuffModel
from ml_engine.features.engineer import engineer_features
from ml_engine.models.pattern_baseline import PatternBaseline
from ml_engine.economics.affordability import AffordabilityModel
from ml_engine.ranking.ranker import Ranker
from ml_engine.explain.evidence import build_evidence
from ml_engine.io.serialize import to_backend_friendly
from ml_engine import config

def main():
    config.set_seeds()
    data = generate_kolhapur_synthetic_demo(seed=config.SEED)
    v = validate_dataset(data)
    print("validation:", v)
    huff = HuffModel(beta=config.DEFAULT_BETA)
    enriched = engineer_features(data["candidates"], data["demand_cells"], data["existing_stores"], data["competitors"])
    baseline = PatternBaseline()
    aff = AffordabilityModel()
    results = []
    for cand in enriched:
        feats = cand["features"]
        hres = huff.evaluate_candidate(data["demand_cells"], data["existing_stores"], data["competitors"], cand)
        pscore = baseline.score(feats)
        ares = aff.estimate_cost_and_score(feats)
        evid = build_evidence(cand, hres, feats, ares, pscore, competitors_list=data["competitors"])
        results.append(evid)
    ranked = Ranker(weights=config.RANKING_WEIGHTS).rank(results)
    out = to_backend_friendly(ranked)
    os.makedirs("ml_engine/output", exist_ok=True)
    with open("ml_engine/output/kolhapur_pharmacy_ranked.json", "w") as f:
        json.dump(out, f, indent=2)
    print("wrote ml_engine/output/kolhapur_pharmacy_ranked.json")
    print("top:", ranked[0]["h3_id"], ranked[0]["eps_score"])

if __name__ == "__main__":
    main()
