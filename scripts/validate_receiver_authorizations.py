#!/usr/bin/env python3
"""Validate private current-receiver evidence before it affects Atlas outputs.

The input must remain under ``private/``. This validator only emits aggregate
counts and never copies receiver names or private references into ``public/``.
"""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "sira_id", "facility_name", "municipality", "evidence_type",
    "authorization_reference", "authorization_date", "validity_status",
    "receiver_type", "receiver_name", "source_url_or_private_file",
    "updated_at", "reviewed_by", "outfall_location_private_reference",
    "public_disclosure",
}
CURRENT_EVIDENCE = {"authorisation_act", "official_sira_export", "operator_technical_confirmation"}
VALIDITY = {"valid", "expired", "unknown"}
DISCLOSURE = {"private_only", "aggregated_only", "public_after_review"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="TSV in private/ based on the tracked template")
    parser.add_argument("--summary", type=Path, default=ROOT / "private" / "hydrology" / "receiver_authorization_validation.json")
    args = parser.parse_args()
    source = args.input if args.input.is_absolute() else ROOT / args.input
    if "private" not in source.parts:
        raise SystemExit("Input must be stored in private/.")
    with source.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"Missing template columns: {sorted(missing)}")
        rows = list(reader)
    problems = []
    eligible = 0
    for number, row in enumerate(rows, start=2):
        for name in REQUIRED:
            if not row.get(name, "").strip():
                problems.append(f"row {number}: empty {name}")
        if row.get("validity_status") not in VALIDITY:
            problems.append(f"row {number}: invalid validity_status")
        if row.get("public_disclosure") not in DISCLOSURE:
            problems.append(f"row {number}: invalid public_disclosure")
        if row.get("evidence_type") in CURRENT_EVIDENCE and row.get("validity_status") == "valid":
            eligible += 1
    output = args.summary if args.summary.is_absolute() else ROOT / args.summary
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({
        "input": str(source.relative_to(ROOT)).replace("\\", "/"),
        "records": len(rows),
        "eligible_documented_current": eligible,
        "by_evidence_type": dict(Counter(row.get("evidence_type", "") for row in rows)),
        "by_validity": dict(Counter(row.get("validity_status", "") for row in rows)),
        "problems": problems,
        "safety_note": "Validation does not publish facility-level receivers or outfall references.",
    }, indent=2) + "\n", encoding="utf-8")
    print(f"Validated {len(rows)} records; eligible documented current: {eligible}; problems: {len(problems)}")
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()