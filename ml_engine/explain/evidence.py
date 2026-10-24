from typing import Dict, Any, List

def build_evidence(cand: Dict[str, Any], huff_res: Dict[str, Any], features: Dict[str, Any],
                   aff_res: Dict[str, Any], pattern_score: float, competitors_list: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    from ..spatial.distance import haversine_distance_m
    positive = []
    negative = []
    if features.get("pop_proxy_800m", 0) > 1000:
        positive.append({"feature": "Population proxy (800m)", "impact": round(features["pop_proxy_800m"]/1000.0, 2), "rationale": "Larger catchment proxy"})
    if features.get("dist_to_nearest_own_m", 0) > 1500:
        positive.append({"feature": "Distance to own chain", "impact": round(features["dist_to_nearest_own_m"]/100.0, 2), "rationale": "Lower cannibalization risk (farther from own store)"})
    cc = features.get("competitor_count_1km", 0)
    if cc == 0:
        positive.append({"feature": "No competitors within 1km", "impact": 5.0, "rationale": "Less direct competition"})
    elif cc > 3:
        negative.append({"feature": "High competitor density (1km)", "impact": -round(cc*2.0, 2), "rationale": "Increased competition"})
    if aff_res["estimated_monthly_cost"] > 80000:
        negative.append({"feature": "Estimated monthly cost (synthetic)", "impact": -8.0, "rationale": "Higher cost reduces affordability"})
    elif aff_res["estimated_monthly_cost"] < 50000:
        positive.append({"feature": "Estimated monthly cost (synthetic)", "impact": 6.0, "rationale": "More affordable (synthetic proxy)"})

    cov = huff_res["candidate_demand"] / max(1.0, huff_res["baseline_own_sales_sum"]) if huff_res.get("baseline_own_sales_sum") is not None else 0.0
    risk_level = "LOW"
    if huff_res["cannibalization_pct"] > 30 or aff_res["affordability_score"] < 40:
        risk_level = "HIGH"
    elif huff_res["cannibalization_pct"] > 15 or aff_res["affordability_score"] < 60:
        risk_level = "MEDIUM"

    comp_within_500 = 0
    if competitors_list:
        for k in competitors_list:
            try:
                if haversine_distance_m(cand["lat"], cand["lng"], k["lat"], k["lng"]) <= 500.0:
                    comp_within_500 += 1
            except Exception:
                pass
    else:
        dnc = features.get("dist_to_nearest_comp_m")
        if dnc is not None and dnc <= 500.0:
            comp_within_500 = max(1, int(features.get("competitor_count_1km", 0) or 0))

    return {
        "h3_id": cand.get("h3_id") or cand.get("cand_id"),
        "zone_name": cand.get("zone_name", ""),
        "lat": cand["lat"],
        "lng": cand["lng"],
        "demand_capture": round(huff_res["candidate_demand"], 2),
        "cannibalization_units": round(huff_res["cannibalization_units"], 2),
        "cannibalization_pct": round(huff_res["cannibalization_pct"], 2),
        "net_incremental_demand": round(huff_res["net_incremental_demand"], 2),
        "pattern_score": round(pattern_score, 2),
        "affordability_score": aff_res["affordability_score"],
        "estimated_monthly_cost": aff_res["estimated_monthly_cost"],
        "coverage_ratio": round(cov, 3),
        "risk_level": risk_level,
        "flags": ["Synthetic Demo"] + (["Low Cannibalization"] if huff_res["cannibalization_pct"] < 15 else []),
        "explain": {
            "positive_factors": positive,
            "negative_factors": negative,
            "assumptions": [
                "Huff gravity model with haversine distance",
                "Synthetic data - not real Kolhapur observations",
                "Rent/costs are synthetic proxies",
                "Pattern score from transparent baseline (no fake SHAP)"
            ],
            "data_provenance": {
                "data_source": "synthetic",
                "synthetic": True,
                "notes": "DEMO ONLY - synthetic-demo results, not validated for real-world business decisions"
            }
        },
        "nearby": {
            "competitors_within_500m": comp_within_500,
            "nearest_competitor_dist_m": features.get("dist_to_nearest_comp_m"),
            "nearest_own_store_dist_m": features.get("dist_to_nearest_own_m")
        },
        "demographics": {
            "catchment_population_proxy": features.get("pop_proxy_800m", 0)
        }
    }
