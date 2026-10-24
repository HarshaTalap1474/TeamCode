import os
import random

SEED = 42

# Kolhapur demo boundary (approximate bounding box) - clearly synthetic/demo only
KOLHAPUR_BOUNDS = {
    "min_lat": 16.65,
    "max_lat": 16.75,
    "min_lng": 74.20,
    "max_lng": 74.30,
    "city": "Kolhapur",
    "state": "Maharashtra",
    "country": "India",
    "note": "Synthetic/demo boundary - not verified real municipal boundary"
}

# Huff model defaults
DEFAULT_BETA = 2.0
DEFAULT_DEMAND_RATE = 0.015  # fraction of population that is potential demand per period (synthetic)
DEFAULT_ATTRACTIVENESS = 1.0

# Ranking weights (as specified)
RANKING_WEIGHTS = {
    "demand": 0.4,
    "pattern": 0.3,
    "rent": 0.3
}

# Distance threshold for "focal store removed from choice set" handling (meters concept)
MIN_DIST_EPS = 0.2  # meters-equivalent floor to avoid division issues

def set_seeds(seed: int = SEED):
    random.seed(seed)
    try:
        import numpy as np
        np.random.seed(seed)
    except Exception:
        pass
