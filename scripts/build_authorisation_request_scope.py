#!/usr/bin/env python3
"""Create a private, minimal-scope attachment for DeSAC/SIRA authorisation requests.

The output lists active urban SIRA plants and deliberately omits coordinates,
operators, network geometry, outfall details and any inferred receiver. It is a
private worklist for requesting documentary evidence, not a public dataset.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POINTS = ROOT / "public" / "data" / "sira_depuratori_points.geojson"
DEFAULT_OUTPUT = ROOT / "private" / "hydrology" / "desac_authorisation_request_scope_active_urban.tsv"

COLUMNS = [
    "sira_id", "municipality", "province", "plant_name", "operational_status", "category",
    "requested_authorisation_reference", "requested_validity_status", "requested_receiver_type",
    "requested_receiver_name", "requested_updated_at", "request_review_status", "public_disclosure",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.output if args.output.is_absolute() else ROOT / args.output

    with POINTS.open(encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    rows = []
    for feature in features:
        props = feature.get("properties", {})
        if props.get("categoria") != "Acque reflue urbane" or props.get("STATO_OPERATIVO") != "Attivo":
            continue
        rows.append({
            "sira_id": str(props.get("ID", "")),
            "municipality": props.get("COMUNE", ""),
            "province": props.get("PROVINCIA", ""),
            "plant_name": props.get("DENOMINAZIONE", ""),
            "operational_status": props.get("STATO_OPERATIVO", ""),
            "category": props.get("categoria", ""),
            "requested_authorisation_reference": "",
            "requested_validity_status": "",
            "requested_receiver_type": "",
            "requested_receiver_name": "",
            "requested_updated_at": "",
            "request_review_status": "pending_source_response",
            "public_disclosure": "private_only",
        })
    rows.sort(key=lambda row: (row["province"], row["municipality"], row["plant_name"], row["sira_id"]))
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} private request-scope rows to {output}")


if __name__ == "__main__":
    main()