from typing import List, Dict, Any
import random

def generate_kolhapur_synthetic_demo(seed: int = 42) -> Dict[str, Any]:
    """Generate reproducible synthetic demo data for Kolhapur pharmacy expansion.
    Clearly labeled synthetic. No real-world claims."""
    random.seed(seed)
    try:
        import numpy as np
        np.random.seed(seed)
    except Exception:
        pass

    provenance_base = {
        "data_source": "synthetic",
        "synthetic": True,
        "assumptions": [
            "Kolhapur demo boundary used as approximation",
            "Population/demand generated synthetically",
            "Pharmacy locations/candidates synthetic",
            "Rent/costs are synthetic proxies"
        ],
        "notes": "DEMO ONLY - not verified market data"
    }

    # Demand cells
    demand_cells = []
    for i in range(40):
        lat = 16.65 + random.random() * 0.10
        lng = 74.20 + random.random() * 0.10
        pop = random.randint(800, 4500)
        demand_cells.append({
            "cell_id": f"dc_{i:03d}",
            "lat": lat,
            "lng": lng,
            "population": pop,
            "demand_rate": 0.012 + random.random() * 0.006,
            "provenance": dict(provenance_base)
        })

    # Existing own-chain pharmacies
    existing_stores = []
    for i in range(3):
        lat = 16.67 + random.random() * 0.06
        lng = 74.22 + random.random() * 0.06
        existing_stores.append({
            "store_id": f"own_{i:03d}",
            "lat": lat,
            "lng": lng,
            "brand": "pharmacy_chain_own",
            "is_own_chain": True,
            "attractiveness": 1.0,
            "provenance": dict(provenance_base)
        })

    # Competitors
    competitors = []
    for i in range(12):
        lat = 16.66 + random.random() * 0.08
        lng = 74.21 + random.random() * 0.08
        competitors.append({
            "comp_id": f"comp_{i:03d}",
            "lat": lat,
            "lng": lng,
            "brand": "competitor",
            "attractiveness": 0.85 + random.random() * 0.15,
            "provenance": dict(provenance_base)
        })

    # Candidate sites
    candidates = []
    for i in range(15):
        lat = 16.66 + random.random() * 0.09
        lng = 74.215 + random.random() * 0.085
        candidates.append({
            "cand_id": f"cand_{i:03d}",
            "h3_id": f"8926kolhapur{i:03d}ffff",
            "zone_name": f"Kolhapur Zone {i+1}",
            "lat": lat,
            "lng": lng,
            "provenance": dict(provenance_base),
            "features": {
                "pop_density_proxy": random.uniform(0.3, 1.0),
                "road_access_proxy": random.uniform(0.3, 1.0),
                "clinic_proximity_proxy": random.uniform(0.2, 0.9)
            }
        })

    return {
        "demand_cells": demand_cells,
        "existing_stores": existing_stores,
        "competitors": competitors,
        "candidates": candidates,
        "provenance": dict(provenance_base),
        "meta": {"city": "Kolhapur", "category": "pharmacy", "seed": seed, "synthetic": True}
    }
