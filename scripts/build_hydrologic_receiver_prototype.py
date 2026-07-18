"""Create a transparent screening prototype for wastewater-plant hydrology.

This script deliberately does not infer an authorised discharge point or a
downstream route. The legacy public hydrography bundled with the atlas has no topology or flow
direction fields, so it can only support a proximity screening. A newer official WFS network is
handled separately in a private validation workflow.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POINTS = ROOT / "public/data/sira_depuratori_points.geojson"
NEAREST = ROOT / "public/data/sira_depuratori_nearest_river.csv"
OUT = ROOT / "reports/hydrologic_receiver_prototype_20.tsv"


def number(value):
    try:
        parsed = int(value)
        return parsed if parsed >= 10 else None
    except (TypeError, ValueError):
        return None


with POINTS.open(encoding="utf-8") as handle:
    features = json.load(handle)["features"]
with NEAREST.open(encoding="utf-8", newline="") as handle:
    nearest = {row["id"]: row for row in csv.DictReader(handle)}

rows = []
for feature in features:
    props = feature.get("properties", {})
    if props.get("categoria") != "Acque reflue urbane" or props.get("STATO_OPERATIVO") != "Attivo":
        continue
    reference = nearest.get(str(props.get("ID")))
    if not reference:
        continue
    distance = float(reference["distanza_approssimata_km"])
    rows.append({
        "sira_id": props["ID"],
        "municipality": props.get("COMUNE", ""),
        "plant_name": props.get("DENOMINAZIONE", ""),
        "population_served": number(props.get("ABITANTI_SERVITI")),
        "nearest_named_watercourse": reference["fiume_vicino"],
        "geometric_distance_km": f"{distance:.3f}",
        "screening_status": "candidate_for_manual_validation" if distance <= 0.5 else "not_prioritised_for_first_validation",
        "authorised_receiver": "not_assessed",
        "downstream_path": "not_assessed",
        "public_interpretation": "Geometric proximity only; does not demonstrate an authorised discharge or downstream destination."
    })

rows.sort(key=lambda row: (float(row["geometric_distance_km"]), row["municipality"], str(row["sira_id"])))
fields = list(rows[0])
with OUT.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=fields, delimiter="\t")
    writer.writeheader()
    writer.writerows(rows[:20])
print(f"Wrote {min(20, len(rows))} screening records to {OUT}")
