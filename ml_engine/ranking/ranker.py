from typing import List, Dict, Any

def compute_percentile_ranks(values: List[float]) -> List[float]:
    # simple percentile rank (0-100)
    if not values:
        return []
    # create sorted order
    items = list(enumerate(values))
    items_sorted = sorted(items, key=lambda x: x[1])
    n = len(items_sorted)
    ranks = [0] * n
    for i, (orig_idx, v) in enumerate(items_sorted):
        # percentile rank
        pct = (i / (n - 1) * 100.0) if n > 1 else 100.0
        ranks[orig_idx] = pct
    return ranks

class Ranker:
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or {"demand": 0.4, "pattern": 0.3, "rent": 0.3}

    def rank(self, candidates_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not candidates_results:
            return []
        # get values
        net_demand = [r["net_incremental_demand"] for r in candidates_results]
        pattern = [r["pattern_score"] for r in candidates_results]
        aff = [r["affordability_score"] for r in candidates_results]
        d_pct = compute_percentile_ranks(net_demand)
        p_pct = compute_percentile_ranks(pattern)
        a_pct = compute_percentile_ranks(aff)
        results = []
        for i, r in enumerate(candidates_results):
            eps = (self.weights["demand"] * d_pct[i] +
                   self.weights["pattern"] * p_pct[i] +
                   self.weights["rent"] * a_pct[i])
            r2 = dict(r)
            r2["component_scores"] = {
                "demand_pct": round(d_pct[i], 3),
                "pattern_pct": round(p_pct[i], 3),
                "afford_pct": round(a_pct[i], 3),
                "demand_raw_net": r["net_incremental_demand"]
            }
            r2["eps_score"] = round(eps, 3)
            results.append(r2)
        # sort desc
        results_sorted = sorted(results, key=lambda x: x["eps_score"], reverse=True)
        for idx, r in enumerate(results_sorted):
            r["rank"] = idx + 1
        return results_sorted
