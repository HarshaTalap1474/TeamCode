# ML Engine Integration Guide (Backend)

This is the AI/ML module only. Do not modify backend/shared contracts - adapt to your needs.

## Install ML dependencies
`ash
pip install -r requirements-ml.txt
`
(Note: lightgbm not required by default; baseline is used.)

## Generate demo data
`python
from ml_engine.api import generate_demo_data
data = generate_demo_data(seed=42)
# data keys: demand_cells, existing_stores, competitors, candidates, provenance, meta
`
All synthetic data is clearly labeled (synthetic: true, data_source: 'synthetic').

## Run CLI
`ash
cd <repo_root>
python ml_engine/cli.py
`
Outputs to ml_engine/output/kolhapur_pharmacy_ranked.json.

## Exact import and invocation
`python
from ml_engine.api import score_candidates, generate_demo_data

data = generate_demo_data(seed=42)
result = score_candidates(
    demand_cells=data['demand_cells'],
    existing_stores=data['existing_stores'],
    competitors=data['competitors'],
    candidates=data['candidates'],
    weights={'demand': 0.4, 'pattern': 0.3, 'rent': 0.3},  # optional
    beta=2.0,  # optional
    use_synthetic_labels=True
)
`

## Input schema (required fields)
**demand_cells**: list of dicts with cell_id (str), lat (float), lng (float), population (int), optional demand_rate (float)
**existing_stores**: list of dicts with store_id (str), lat (float), lng (float), is_own_chain (bool), optional ttractiveness (float)
**competitors**: list of dicts with comp_id (str), lat (float), lng (float), optional ttractiveness (float)
**candidates**: list of dicts with cand_id or h3_id (str), lat (float), lng (float), optional zone_name (str), optional eatures (dict)

## Output schema
esult has keys: anked (list of full evidence packets), output (backend-friendly list), meta (dict)
- anked[i]: includes h3_id, zone_name, lat, lng, eps_score, ank, component_scores {demand_pct, pattern_pct, afford_pct, demand_raw_net}, demand_capture, cannibalization_units, cannibalization_pct, 
et_incremental_demand, pattern_score, ffordability_score, estimated_monthly_cost, coverage_ratio, isk_level ('LOW'|'MEDIUM'|'HIGH'), lags, explain {positive_factors, negative_factors, assumptions, data_provenance}, 
earby, demographics
- output[i]: includes same core fields plus ent_index (mapped), shap_drivers (empty list currently - see limitations), explain, component_scores, etc.
- meta: includes weights, eta, synthetic_demo (bool), 
ote

## Illustrative example (small)
`python
from ml_engine.api import score_candidates, generate_demo_data
data = generate_demo_data(seed=123)
res = score_candidates(data['demand_cells'][:10], data['existing_stores'], data['competitors'], data['candidates'][:3])
# res['ranked'][0]['eps_score'], res['ranked'][0]['net_incremental_demand']
`

## Expected exceptions and error handling
- ValueError if any required input is None
- TypeError if inputs are not lists
- Empty lists return empty results (output=[], anked=[])

## Limitations (explicit)
- **Synthetic data only**: Demo data is synthetic; do not claim real-world accuracy or validated business performance.
- **Baseline model**: Pattern score uses transparent baseline by default (no trained ML on real labels). LightGBM scaffold exists but not used; do not fabricate labels.
- **No SHAP**: shap_drivers may be empty; explanations are feature-based, not SHAP.
- **Proxies**: Rent/costs are synthetic proxies, not verified market rent.
- **H3**: Identifiers may look like H3-style strings but are not validated/generated with H3 library; treat as generic IDs unless verified.
- **Coverage ratio**: Reported separately, not included in EPS.
- **EPS formula**: EPS = 0.4*demand_pct + 0.3*pattern_pct + 0.3*afford_pct with percentile ranks.

## Identifiers
- cand_id/h3_id remain stable between input and output (output uses candidate's h3_id or cand_id).
- cell_id, store_id, comp_id used internally; ensure uniqueness in inputs.
