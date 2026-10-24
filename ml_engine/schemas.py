from dataclasses import dataclass, asdict, field
from typing import List, Dict, Any, Optional
import time

@dataclass
class DataProvenance:
    data_source: str = "synthetic"  # "synthetic" or "real"
    synthetic: bool = True
    generated_at: float = field(default_factory=time.time)
    assumptions: List[str] = field(default_factory=list)
    notes: str = ""

    def to_dict(self):
        return asdict(self)

@dataclass
class DemandCell:
    cell_id: str
    lat: float
    lng: float
    population: int
    demand_rate: float = 0.015
    provenance: DataProvenance = field(default_factory=DataProvenance)

    def to_dict(self):
        d = asdict(self)
        d["provenance"] = self.provenance.to_dict()
        return d

@dataclass
class Store:
    store_id: str
    lat: float
    lng: float
    brand: str = "pharmacy_chain_own"
    is_own_chain: bool = True
    attractiveness: float = 1.0
    provenance: DataProvenance = field(default_factory=DataProvenance)

    def to_dict(self):
        d = asdict(self)
        d["provenance"] = self.provenance.to_dict()
        return d

@dataclass
class Competitor:
    comp_id: str
    lat: float
    lng: float
    brand: str = "competitor"
    attractiveness: float = 0.9
    provenance: DataProvenance = field(default_factory=DataProvenance)

    def to_dict(self):
        d = asdict(self)
        d["provenance"] = self.provenance.to_dict()
        return d

@dataclass
class Candidate:
    cand_id: str
    h3_id: Optional[str] = None
    zone_name: str = ""
    lat: float = 0.0
    lng: float = 0.0
    provenance: DataProvenance = field(default_factory=DataProvenance)
    features: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        d = asdict(self)
        d["provenance"] = self.provenance.to_dict()
        return d

@dataclass
class EvidencePacket:
    h3_id: str
    zone_name: str
    lat: float
    lng: float
    eps_score: float
    rank: int
    component_scores: Dict[str, float]
    demand_capture: float
    cannibalization_units: float
    cannibalization_pct: float
    net_incremental_demand: float
    pattern_score: float
    affordability_score: float
    estimated_monthly_cost: float
    coverage_ratio: float
    risk_level: str
    flags: List[str]
    explain: Dict[str, Any]
    nearby: Dict[str, Any]
    demographics: Dict[str, Any]
    data_provenance: Dict[str, Any]

    def to_dict(self):
        return asdict(self)
