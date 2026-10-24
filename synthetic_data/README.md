# NextWhere – REAL Kolhapur data pipeline (open data only)

Run on a laptop WITH internet. ~10–25 min (OSM download + 500 MB WorldPop raster is read by HTTP range, not fully downloaded).

    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python fetch_real_kolhapur.py --out data/raw/kolhapur          # 1. real Overture + WorldPop + OSM
    python build_tables.py --raw data/raw/kolhapur --out data/cache/kolhapur_pharmacy   # 2. poi/cell/features + Day-0 audit
    python score_tables.py --data data/cache/kolhapur_pharmacy     # 3. NID + economics + ranking (partial until pattern model exists)

## Check these after step 1/2
1. Printed "Boundary area": should be the city, not the district. If wrong: --boundary-file city.geojson or --bbox.
2. Step 2 prints top pharmacy names: edit `brands` in config/pharmacy_kolhapur.json to match the REAL chains in Kolhapur.
   The alias list is a starting guess, not verified. Demo chain = chain with most high-confidence POIs (PRD 8.2).
3. audit_report.csv = Day-0 gate. If it fails, follow PRD 8.2 fallback; do not lower thresholds.
4. poi_audit_sample.csv = 50 random pharmacies; fill `manual_correct_label` (Google Maps / site visit) -> K9.

## Known gaps (documented, not hidden)
- age60_share is blank unless you supply raw_age60_points.csv (lat,lon,pop of WorldPop 60+ age-class rasters summed).
- residential_bldg_share is blank (OSM building tags too sparse to trust). LightGBM handles NaN.
- affluence_proxy = percentile of premium-amenity POIs within 500 m (a proxy, not income). commercial_density = OSM shops + all POIs within 500 m.
- rent: PROXY mode only. Unit-economics in config are ASSUMPTIONS (economics_ASSUMPTIONS) - replace with real rent sample (FR20).
- WorldPop 2020 is modelled residential population; Overture presence != operating.
- Scripts were tested locally on mock raw files in the same format; the live downloads (steps 1) were NOT run from my sandbox.
Attribution: Overture Maps Foundation (CDLA-Permissive-2.0); WorldPop (CC BY 4.0); © OpenStreetMap contributors (ODbL).
