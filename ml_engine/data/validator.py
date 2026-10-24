from typing import Dict, Any, List

def validate_dataset(data: Dict[str, Any]) -> Dict[str, Any]:
    errors = []
    warnings = []
    # basic checks
    for key in ["demand_cells", "existing_stores", "competitors", "candidates"]:
        if key not in data:
            errors.append(f"Missing {key}")
    # coords
    def check_coords(items, name):
        for it in items:
            lat = it.get("lat"); lng = it.get("lng")
            if lat is None or lng is None:
                errors.append(f"{name} missing coords")
                continue
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                errors.append(f"{name} invalid coords")
    if "demand_cells" in data: check_coords(data["demand_cells"], "demand_cells")
    if "existing_stores" in data: check_coords(data["existing_stores"], "existing_stores")
    if "competitors" in data: check_coords(data["competitors"], "competitors")
    if "candidates" in data: check_coords(data["candidates"], "candidates")
    # synthetic labeling
    prov = data.get("provenance", {})
    if not prov.get("synthetic") and prov.get("data_source") == "synthetic":
        warnings.append("Provenance synthetic flag inconsistent")
    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}
