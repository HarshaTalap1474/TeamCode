from typing import List, Dict, Any
from .distance import haversine_distance_m


class HuffModel:
    def __init__(self, beta: float = 2.0, min_dist: float = 0.2):
        self.beta = beta
        self.min_dist = min_dist

    def compute_market_shares(self, demand_cells: List[Dict[str, Any]], stores: List[Dict[str, Any]]) -> Dict[str, List[float]]:
        """Compute share_ij for each demand cell i across stores j. Shares sum to ~1 if choice set non-empty."""
        shares_by_cell = {}
        for cell in demand_cells:
            cell_id = cell["cell_id"]
            weights = []
            for store in stores:
                d = haversine_distance_m(cell["lat"], cell["lng"], store["lat"], store["lng"])
                d_eff = max(d, self.min_dist)
                attr = store.get("attractiveness", 1.0)
                w_ij = attr / (d_eff ** self.beta)
                weights.append(w_ij)
            total = sum(weights)
            if total == 0:
                shares = [0.0] * len(stores)
            else:
                shares = [w / total for w in weights]
            shares_by_cell[cell_id] = shares
        return shares_by_cell

    def expected_sales_by_store(self, demand_cells: List[Dict[str, Any]], stores: List[Dict[str, Any]]) -> Dict[str, float]:
        shares_by_cell = self.compute_market_shares(demand_cells, stores)
        sales_by_id = {s.get("store_id") or s.get("comp_id") or s.get("cand_id"): 0.0 for s in stores}
        for cell in demand_cells:
            cell_id = cell["cell_id"]
            shares = shares_by_cell.get(cell_id, [])
            if not shares:
                continue
            demand_i = cell.get("population", 0) * cell.get("demand_rate", 0.015)
            for j, s in enumerate(stores):
                sid = s.get("store_id") or s.get("comp_id") or s.get("cand_id")
                sales_by_id[sid] += demand_i * shares[j]
        return sales_by_id

    def expected_sales(self, demand_cells: List[Dict[str, Any]], stores: List[Dict[str, Any]]) -> List[float]:
        shares_by_cell = self.compute_market_shares(demand_cells, stores)
        sales = [0.0] * len(stores)
        for i, cell in enumerate(demand_cells):
            cell_id = cell["cell_id"]
            shares = shares_by_cell.get(cell_id, [0.0] * len(stores))
            demand_i = cell.get("population", 0) * cell.get("demand_rate", 0.015)
            for j, s in enumerate(shares):
                sales[j] += demand_i * s
        return sales

    def evaluate_candidate(self, demand_cells: List[Dict[str, Any]], existing_stores: List[Dict[str, Any]],
                           all_competitors: List[Dict[str, Any]], candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Add candidate using explicit IDs (no position-based assumption)."""
        cand_id = candidate.get("cand_id") or candidate.get("h3_id")
        if cand_id is None:
            raise ValueError("candidate must have cand_id or h3_id")

        baseline_stores = list(existing_stores) + list(all_competitors)
        baseline_sales_by_id = self.expected_sales_by_store(demand_cells, baseline_stores)

        cand_store = {
            "store_id": cand_id,
            "lat": candidate["lat"],
            "lng": candidate["lng"],
            "attractiveness": candidate.get("attractiveness", 1.0),
            "is_own_chain": True
        }
        candidate_stores = baseline_stores + [cand_store]
        candidate_sales_by_id = self.expected_sales_by_store(demand_cells, candidate_stores)

        cand_sales = candidate_sales_by_id.get(cand_id, 0.0)

        lost_own = 0.0
        for s in existing_stores:
            sid = s.get("store_id")
            if sid is None:
                continue
            b = baseline_sales_by_id.get(sid, 0.0)
            c = candidate_sales_by_id.get(sid, 0.0)
            lost_own += max(0.0, b - c)

        lost_comp = 0.0
        for k in all_competitors:
            kid = k.get("comp_id")
            if kid is None:
                continue
            b = baseline_sales_by_id.get(kid, 0.0)
            c = candidate_sales_by_id.get(kid, 0.0)
            lost_comp += max(0.0, b - c)

        net_incremental = cand_sales - lost_own  # never clipped
        cannibalization_pct = (lost_own / cand_sales * 100.0) if cand_sales > 0 else 0.0

        return {
            "candidate_demand": cand_sales,
            "own_chain_loss": lost_own,
            "lost_demand_own_stores": lost_own,
            "competitor_loss": lost_comp,
            "lost_demand_competitors": lost_comp,
            "net_incremental_demand": net_incremental,
            "cannibalization_units": lost_own,
            "cannibalization_pct": cannibalization_pct,
            "baseline_own_sales_sum": sum(baseline_sales_by_id.get(s.get("store_id"), 0.0) for s in existing_stores if s.get("store_id")),
            "baseline_comp_sales_sum": sum(baseline_sales_by_id.get(k.get("comp_id"), 0.0) for k in all_competitors if k.get("comp_id")),
        }
