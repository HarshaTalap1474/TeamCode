from typing import Dict, Any, List
from ..spatial.distance import haversine_distance_m

def engineer_features(candidates: List[Dict[str, Any]], demand_cells: List[Dict[str, Any]],
                      existing_stores: List[Dict[str, Any]], competitors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Defensible spatial features, avoid target leakage."""
    enriched = []
    for c in candidates:
        feats = dict(c.get("features", {}))
        # distances to nearest
        dists_own = [haversine_distance_m(c["lat"], c["lng"], s["lat"], s["lng"]) for s in existing_stores] if existing_stores else []
        dists_comp = [haversine_distance_m(c["lat"], c["lng"], k["lat"], k["lng"]) for k in competitors] if competitors else []
        if dists_own: feats["dist_to_nearest_own_m"] = min(dists_own)
        if dists_comp: feats["dist_to_nearest_comp_m"] = min(dists_comp)
        # density proxies
        feats["competitor_count_1km"] = sum(1 for d in dists_comp if d <= 1000)
        feats["own_count_2km"] = sum(1 for d in dists_own if d <= 2000)
        # simple population proxy
        pop_near = sum(cell["population"] for cell in demand_cells if haversine_distance_m(c["lat"], c["lng"], cell["lat"], cell["lng"]) <= 800)
        feats["pop_proxy_800m"] = pop_near
        c2 = dict(c)
        c2["features"] = feats
        enriched.append(c2)
    return enriched
