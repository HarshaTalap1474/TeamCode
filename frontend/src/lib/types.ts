/**
 * NextWhere Shared Data & API Types
 */

export type RetailCategory = 'cafe' | 'pharmacy' | 'supermarket' | 'qsr' | 'fashion';

export interface SHAPDriver {
  feature: string;
  impact: number; // e.g. +24.2 or -12.1 (%)
  type: 'POSITIVE' | 'NEGATIVE';
}

export interface CandidateSite {
  h3_id: string;
  zone_name: string;
  lat: number;
  lng: number;
  rank: number;
  eps_score: number; // 0 to 100
  demand_capture: number;
  cannibalization_pct: number;
  cannibalization_units: number;
  net_incremental_demand: number; // NID
  pattern_score: number;
  rent_index: number; // 1.0 to 10.0
  coverage_ratio: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  shap_drivers: SHAPDriver[];
  verdict: string;
  category: RetailCategory;
  brand: string;
  demographics: {
    catchment_population: number;
    senior_pct?: number;
    youth_student_pct?: number;
    affluence_index: number;
  };
  competitors_within_500m: number;
  nearest_competitor_dist_m: number;
  nearest_own_store_dist_m: number;
  anchor_poi_summary: {
    tech_parks?: number;
    hospitals?: number;
    metro_transit_dist_m: number;
  };
}

export interface POIStore {
  id: string;
  name: string;
  brand: string;
  type: 'OWN' | 'COMPETITOR';
  lat: number;
  lng: number;
  category: RetailCategory;
}

export interface SimulationWeights {
  demand: number;   // default 0.40
  pattern: number;  // default 0.30
  rent: number;     // default 0.30
}

export interface FilterState {
  searchQuery: string;
  maxRentIndex: number;
  minPopulation: number;
  excludeHighCannibalization: boolean;
}
