import math
from typing import Tuple

def haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in meters. Documented standard formula."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Optional road-distance approximation stub - clearly marked as approximation
def road_distance_approx_m(lat1: float, lng1: float, lat2: float, lng2: float, factor: float = 1.3) -> float:
    """APPROXIMATION ONLY. Uses haversine * factor as rough proxy; not real routing."""
    return haversine_distance_m(lat1, lng1, lat2, lng2) * factor
