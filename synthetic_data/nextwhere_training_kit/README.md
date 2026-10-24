# NextWhere training kit
data_synthetic_kolhapur/  SYNTHETIC (fake) data - only to develop/test the pipeline. NEVER report its metrics as real-city results.
example_outputs/          what train_pattern.py produced on that synthetic data
Real data: fetch_real_kolhapur.py -> build_tables.py -> score_tables.py -> train_pattern.py (needs internet)

Train on synthetic:  python train_pattern.py --data data_synthetic_kolhapur
Train on real:       python train_pattern.py --data data/cache/kolhapur_pharmacy
Then:                python score_tables.py --data <dir> --pattern <dir>/pattern_scores.csv   (partial -> standard ranking)

Outputs: pattern_scores.csv (out-of-fold), metrics_pattern.json (Lift@10% + block-bootstrap CI, ROC/PR-AUC, baselines, SHAP checks), shap_drivers.csv, feature_importance.csv
