#!/usr/bin/env python3
"""
STEP 1 - download REAL open data for Kolhapur into raw files (needs internet).
  Overture Maps Places (CDLA-Permissive 2.0) | WorldPop constrained 2020 100 m (CC BY 4.0) | OpenStreetMap (ODbL)

  python fetch_real_kolhapur.py --out data/raw/kolhapur
Optional: --pop-tif local.tif (skip 500 MB streaming) | --release 2026-xx-xx.0 | --boundary-file city.geojson | --bbox minlon,minlat,maxlon,maxlat
"""
import argparse, json, os, hashlib, datetime
import numpy as np, pandas as pd, geopandas as gpd, requests

ap = argparse.ArgumentParser()
ap.add_argument("--out", default="data/raw/kolhapur"); ap.add_argument("--config", default="config/pharmacy_kolhapur.json")
ap.add_argument("--release"); ap.add_argument("--boundary-file"); ap.add_argument("--bbox"); ap.add_argument("--pop-tif")
a = ap.parse_args()
cfg = json.load(open(a.config)); os.makedirs(a.out, exist_ok=True)
UTM = cfg["utm_epsg"]; TODAY = datetime.date.today().isoformat(); MAN = []

def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()
def log(src, ver, path, rows, lic): MAN.append(dict(source=src, version=ver, retrieval_date=TODAY, file=os.path.basename(path), row_count=rows, sha256=sha(path), licence=lic)); print(f"  wrote {path} ({rows} rows)")

# ---- boundary ------------------------------------------------------------------------
import osmnx as ox
if a.boundary_file: b = gpd.read_file(a.boundary_file).to_crs(4326)
elif a.bbox:
    from shapely.geometry import box; x0, y0, x1, y1 = map(float, a.bbox.split(",")); b = gpd.GeoDataFrame(geometry=[box(x0, y0, x1, y1)], crs=4326)
else: b = ox.geocode_to_gdf(cfg["place_query"]).to_crs(4326)
b = b[b.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].head(1)
area = b.to_crs(UTM).area.iloc[0] / 1e6
print(f"Boundary area = {area:.1f} km2  <-- sanity check: should look like the CITY, not the whole district (tens of km2, not thousands). "
      "If wrong, pass --boundary-file or --bbox.")
p = f"{a.out}/osm_boundary.geojson"; b[["geometry"]].to_file(p, driver="GeoJSON"); log("OSM/Nominatim boundary", TODAY, p, 1, "ODbL")
poly_buf = gpd.GeoSeries([b.geometry.iloc[0]], crs=4326).to_crs(UTM).buffer(cfg["buffer_km"] * 1000).to_crs(4326).iloc[0]
minx, miny, maxx, maxy = poly_buf.bounds

# ---- Overture places -----------------------------------------------------------------
import duckdb
rel = a.release or requests.get("https://labs.overturemaps.org/data/releases.json", timeout=30).json()["latest"]
print("Overture release:", rel)
con = duckdb.connect(); con.execute("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
url = f"s3://overturemaps-us-west-2/release/{rel}/theme=places/type=place/*"
cols = {r[0] for r in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{url}', hive_partitioning=1)").fetchall()}
cat = " , ".join([e for c, e in (("taxonomy", "taxonomy.primary"), ("categories", "categories.primary")) if c in cols])
q = f"""SELECT id, names.primary AS name, COALESCE({cat}) AS category, confidence,
        brand.names.primary AS brand, CAST(bbox.xmin AS DOUBLE) AS lon, CAST(bbox.ymin AS DOUBLE) AS lat
        FROM read_parquet('{url}', hive_partitioning=1)
        WHERE bbox.xmin BETWEEN {minx} AND {maxx} AND bbox.ymin BETWEEN {miny} AND {maxy}"""
pl = con.execute(q).df()
p = f"{a.out}/raw_places.csv"; pl.to_csv(p, index=False); log("Overture Maps Places", rel, p, len(pl), "CDLA-Permissive-2.0")

# ---- WorldPop ------------------------------------------------------------------------
import rasterio
from rasterio.windows import from_bounds
tif = a.pop_tif or "/vsicurl/https://data.worldpop.org/GIS/Population/Global_2000_2020_Constrained/2020/BSGM/IND/ind_ppp_2020_constrained.tif"
with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"), rasterio.open(tif) as src:
    win = from_bounds(minx, miny, maxx, maxy, src.transform).round_offsets().round_lengths()
    arr = src.read(1, window=win, masked=True); tr = src.window_transform(win)
r, c = np.where((arr.filled(0) > 0))
xs, ys = rasterio.transform.xy(tr, r, c)
pp = pd.DataFrame(dict(lat=ys, lon=xs, pop=arr.filled(0)[r, c]))
p = f"{a.out}/raw_pop_points.csv"; pp.to_csv(p, index=False); log("WorldPop constrained 2020 100m (BSGM IND)", "2020", p, len(pp), "CC-BY-4.0")
print(f"  total modelled population in buffered area: {pp['pop'].sum():,.0f}")

# ---- OpenStreetMap -------------------------------------------------------------------
def feats(tags):
    try: return ox.features_from_polygon(poly_buf, tags).reset_index(drop=True)
    except Exception as e: print("  OSM empty/failed:", tags, type(e).__name__); return gpd.GeoDataFrame(geometry=[], crs=4326)
def centroids(g, name):
    if len(g) == 0: pd.DataFrame(columns=["lat", "lon"]).to_csv(f"{a.out}/{name}.csv", index=False); return
    c = g.to_crs(UTM).centroid.to_crs(4326); return pd.DataFrame(dict(lat=c.y, lon=c.x))
G = ox.graph_from_polygon(poly_buf, network_type="drive")
nodes, edges = ox.graph_to_gdfs(G)
hw = edges["highway"].apply(lambda v: v[0] if isinstance(v, list) else v)
art = edges[hw.isin(["motorway", "trunk", "primary", "secondary", "motorway_link", "trunk_link", "primary_link", "secondary_link"])]
p = f"{a.out}/osm_arterials.geojson"; art[["geometry"]].reset_index(drop=True).to_file(p, driver="GeoJSON"); log("OSM arterial roads", TODAY, p, len(art), "ODbL")
ix = nodes[nodes["street_count"] >= 3]; d = pd.DataFrame(dict(lat=ix.y, lon=ix.x))
p = f"{a.out}/osm_intersections.csv"; d.to_csv(p, index=False); log("OSM intersections", TODAY, p, len(d), "ODbL")
for name, tags in [("osm_transit", {"highway": "bus_stop", "public_transport": ["platform", "stop_position"], "railway": ["station", "halt"]}),
                   ("osm_shops", {"shop": True}), ("osm_buildings", {"building": True})]:
    d = centroids(feats(tags), name)
    if d is not None:
        p = f"{a.out}/{name}.csv"; d.to_csv(p, index=False); log(f"OSM {name}", TODAY, p, len(d), "ODbL")
w = feats({"natural": "water", "landuse": "reservoir", "waterway": "riverbank"})
w = w[w.geometry.geom_type.isin(["Polygon", "MultiPolygon"])] if len(w) else w
p = f"{a.out}/osm_water.geojson"
(w[["geometry"]] if len(w) else gpd.GeoDataFrame(geometry=[], crs=4326)).to_file(p, driver="GeoJSON"); log("OSM water", TODAY, p, len(w), "ODbL")
pd.DataFrame(MAN).to_csv(f"{a.out}/raw_manifest.csv", index=False); print("done ->", a.out)
