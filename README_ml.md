# ML Engine (Kolhapur Pharmacy) - Usage

This is the AI/ML module only. It is isolated from frontend/backend.

## Quick start (synthetic demo)
`ash
cd <repo_root>
python -c "
from ml_engine.data.synthetic_gen import generate_kolhapur_synthetic_demo
from ml_engine import config
config.set_seeds()
data = generate_kolhapur_synthetic_demo()
print('ok')
"
`

## Generate ranked candidates (CLI)
`ash
python ml_engine/cli.py
`
Outputs to ml_engine/output/kolhapur_pharmacy_ranked.json (synthetic labeled).

## Tests
`ash
python -m pytest tests/ml_engine/test_ml_core.py -v
`

## Notes
- All synthetic data is clearly labeled (data_source: synthetic, synthetic: true).
- Huff model uses haversine distance; shares sum to ~1 per demand cell.
- Net incremental demand = candidate-attributed demand minus lost demand from own-chain stores.
- Ranking: EPS = 0.4*demand_pct + 0.3*pattern_pct + 0.3*afford_pct (coverage reported separately).
- Pattern score uses transparent baseline by default; LightGBM scaffold only if labels suitable.
- No fake SHAP - explanations are feature-based.
- Do not claim synthetic results represent real Kolhapur market conditions.
