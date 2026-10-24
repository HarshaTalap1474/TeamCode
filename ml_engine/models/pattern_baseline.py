from typing import Dict, Any

class PatternBaseline:
    """Transparent baseline when no suitable labels for ML."""
    def score(self, features: Dict[str, Any]) -> float:
        score = 50.0
        # prefer some distance to own stores, prefer population proxy, penalize many competitors nearby
        if features.get("pop_proxy_800m", 0) > 2000:
            score += 10
        elif features.get("pop_proxy_800m", 0) > 1000:
            score += 5
        if features.get("dist_to_nearest_own_m", 10_000) > 1500:
            score += 8
        elif features.get("dist_to_nearest_own_m", 10_000) > 800:
            score += 4
        cc = features.get("competitor_count_1km", 0)
        if cc == 0:
            score += 10
        elif cc <= 2:
            score += 3
        else:
            score -= min(15, cc * 3)
        # clamp
        if score < 0: score = 0
        if score > 100: score = 100
        return score
