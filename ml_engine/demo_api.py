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

def run_kolhapur_demo(seed=None):
    if seed is None:
        seed = config.SEED
    config.set_seeds(seed)
    data = generate_kolhapur_synthetic_demo(seed=seed)
    validate_dataset(data)
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
    return {"data": data, "ranked": ranked, "output": out}
