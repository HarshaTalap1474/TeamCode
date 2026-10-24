from typing import Dict, Any

class AffordabilityModel:
    def __init__(self):
        pass

    def estimate_cost_and_score(self, features: Dict[str, Any], config: Dict[str, Any] = None) -> Dict[str, Any]:
        config = config or {}
        # Synthetic proxy if no real rent data
        base = config.get("base_rent", 45000)  # INR/month synthetic
        # adjust by proxies
        cc = features.get("competitor_count_1km", 0)
        pop = features.get("pop_proxy_800m", 1000)
        cost = base * (1.0 + 0.05 * cc) * (1.0 + 0.0001 * pop)
        # affordability score: lower cost better
        # normalize roughly
        max_cost = config.get("max_cost_ref", 120000)
        aff_score = max(0.0, (1.0 - (cost / max_cost)) * 100.0)
        return {"estimated_monthly_cost": round(cost, 2), "affordability_score": round(aff_score, 2), "is_synthetic": True}
