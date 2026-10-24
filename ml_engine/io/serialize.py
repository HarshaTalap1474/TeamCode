from typing import Dict, Any

def to_backend_friendly(evidence_list: list) -> list:
    # Return in a shape compatible with shared/contracts where possible
    out = []
    for e in evidence_list:
        out.append({
            "h3_id": e["h3_id"],
            "zone_name": e["zone_name"],
            "lat": e["lat"],
            "lng": e["lng"],
            "rank": e.get("rank"),
            "eps_score": e.get("eps_score"),
            "demand_capture": e["demand_capture"],
            "cannibalization_pct": e["cannibalization_pct"],
            "cannibalization_units": e["cannibalization_units"],
            "net_incremental_demand": e["net_incremental_demand"],
            "pattern_score": e["pattern_score"],
            "rent_index": round((100 - e["affordability_score"]) / 10.0, 2),  # map affordability to rent index approx
            "coverage_ratio": e["coverage_ratio"],
            "risk_level": e["risk_level"],
            "flags": e["flags"],
            "shap_drivers": [],  # no fake SHAP; use explanations separately
            "explain": e["explain"],
            "component_scores": e.get("component_scores"),
            "affordability_score": e["affordability_score"],
            "estimated_monthly_cost": e["estimated_monthly_cost"],
            "nearby": e["nearby"],
            "demographics": e["demographics"]
        })
    return out
