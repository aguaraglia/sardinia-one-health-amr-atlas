#!/usr/bin/env python3
"""Stage historical receiver evidence against current SIRA plant records.

This creates a private review table. An exact municipality match is only a
candidate, never a proof that the historical ARPAS record and the current SIRA
feature are the same facility.
"""
from __future__ import annotations

import csv
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "metadata" / "HYDROLOGIC_RECEIVER_EVIDENCE.tsv"
SIRA = ROOT / "public" / "data" / "sira_depuratori_points.geojson"
OUT = ROOT / "private" / "hydrology" / "hydrologic_receiver_evidence_sira_candidates.tsv"


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value or "")
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def main() -> None:
    with EVIDENCE.open(encoding="utf-8", newline="") as handle:
        evidence = list(csv.DictReader(handle, delimiter="\t"))
    with SIRA.open(encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    by_municipality: dict[str, list[dict]] = {}
    for feature in features:
        props = feature["properties"]
        by_municipality.setdefault(normalize(props.get("COMUNE", "")), []).append(props)
    rows = []
    for item in evidence:
        candidates = by_municipality.get(normalize(item["municipality"]), [])
        rows.append({
            "evidence_id": item["evidence_id"],
            "municipality": item["municipality"],
            "facility_label": item["facility_label"],
            "historical_receiver": item["documented_receiver_or_destination"],
            "relationship": item["relationship"],
            "candidate_sira_count": len(candidates),
            "candidate_sira_ids": ";".join(str(candidate.get("ID", "")) for candidate in candidates),
            "candidate_sira_names": " | ".join(candidate.get("DENOMINAZIONE", "") for candidate in candidates),
            "match_status": "single_municipality_candidate_needs_manual_review" if len(candidates) == 1 else "multiple_or_missing_municipality_candidates",
            "safety_note": "Historical ARPAS matrix; municipality match is not current authorisation or confirmed facility identity.",
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} private candidate matches to {OUT}")


if __name__ == "__main__":
    main()