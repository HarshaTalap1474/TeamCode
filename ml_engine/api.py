# Public API for backend integration

from typing import Dict, Any, Optional
from . import config
from .data.synthetic_gen import generate_kolhapur_synthetic_demo
from .data.validator import validate_dataset
from .spatial.huff import HuffModel
from .features.engineer import engineer_features
from .models.pattern_baseline import PatternBaseline
from .economics.affordability import AffordabilityModel
from .ranking.ranker import Ranker
from .explain.evidence import build_evidence
from .io.serialize import to_backend_friendly


def score_candidates(
    demand_cells: list,
    existing_stores: list,
    competitors: list,
    candidates: list,
    weights: Optional[Dict[str, float]] = None,
    beta: float = None,
    use_synthetic_labels: bool = True
) -> Dict[str, Any]:
    if demand_cells is None or existing_stores is None or competitors is None or candidates is None:
        raise ValueError("All inputs (demand_cells, existing_stores, competitors, candidates) must be provided")
    if not isinstance(demand_cells, list) or not isinstance(existing_stores, list) or not isinstance(competitors, list) or not isinstance(candidates, list):
        raise TypeError("All inputs must be lists")
    if weights is None:
        weights = dict(config.RANKING_WEIGHTS)
    if beta is None:
        beta = config.DEFAULT_BETA
    huff = HuffModel(beta=beta)
    enriched = engineer_features(candidates, demand_cells, existing_stores, competitors)
    baseline = PatternBaseline()
    aff = AffordabilityModel()
    results = []
    for cand in enriched:
        feats = cand.get("features", {})
        hres = huff.evaluate_candidate(demand_cells, existing_stores, competitors, cand)
        pscore = baseline.score(feats)
        ares = aff.estimate_cost_and_score(feats)
        evid = build_evidence(cand, hres, feats, ares, pscore, competitors_list=competitors)
        results.append(evid)
    ranked = Ranker(weights=weights).rank(results)
    out = to_backend_friendly(ranked)
    return {
        "ranked": ranked,
        "output": out,
        "meta": {
            "weights": weights,
            "beta": beta,
            "synthetic_demo": bool(use_synthetic_labels),
            "note": "All results labeled synthetic/demo if using synthetic inputs"
        }
    }


def generate_demo_data(seed: int = None) -> Dict[str, Any]:
    if seed is None:
        seed = config.SEED
    config.set_seeds(seed)
    return generate_kolhapur_synthetic_demo(seed=seed)
