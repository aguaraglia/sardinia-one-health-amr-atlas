"""Build public literature JSON and its descriptive summary from the TSV registry."""
from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TSV = ROOT / "metadata/LITERATURE_CURATED.tsv"
DATA = ROOT / "public/data"


def split(value: str) -> list[str]:
    return [part.strip() for part in (value or "").split(";") if part.strip()]


with TSV.open(encoding="utf-8", newline="") as handle:
    rows = list(csv.DictReader(handle, delimiter="\t"))

required = {"study_id", "pmid", "doi", "year", "title", "hosts", "matrix", "organisms", "amr_evidence", "public_geography", "notes"}
missing = required.difference(rows[0] if rows else {})
if missing:
    raise ValueError(f"Missing TSV columns: {', '.join(sorted(missing))}")
ids = [row["study_id"] for row in rows]
if len(ids) != len(set(ids)):
    raise ValueError("Duplicate study_id in literature registry")

records = [
    {
        "study_id": row["study_id"],
        "pmid": row["pmid"],
        "doi": row["doi"],
        "year": int(row["year"]),
        "title": row["title"],
        "hosts": split(row["hosts"]),
        "matrix": split(row["matrix"]),
        "organisms": split(row["organisms"]),
        "amr_evidence": split(row["amr_evidence"]),
        "public_geography": row["public_geography"],
        "source_url": f"https://pubmed.ncbi.nlm.nih.gov/{row['pmid']}/",
        "notes": row["notes"],
    }
    for row in rows
]

payload = {
    "source_id": "letteratura_curata",
    "dataset_version": "atlas-curated-v0.7",
    "geography_level": "REGIONE",
    "geography_id": "SARDEGNA",
    "privacy": "public",
    "notes": "Registro pubblico di evidenze bibliografiche AMR riferite alla Sardegna. Gli studi sono eterogenei e non sono sommati come prevalenza regionale.",
    "records": records,
}

def tally(field: str, key: str):
    counts = Counter(item for record in records for item in record[field])
    return [{key: item, "study_count": count} for item, count in sorted(counts.items(), key=lambda pair: (-pair[1], pair[0].lower()))]

summary = {
    "source_id": "letteratura_curata",
    "dataset_version": "atlas-curated-v0.7",
    "record_count": len(records),
    "year_min": min(record["year"] for record in records),
    "year_max": max(record["year"] for record in records),
    "public_geography": "Sardegna",
    "privacy": "public",
    "hosts": tally("hosts", "host"),
    "organism_groups": tally("organisms", "organism"),
    "notes": "Sintesi descrittiva del registro bibliografico. Gli studi sono eterogenei e non sono sommati come prevalenza regionale.",
}

for path, value in ((DATA / "literature_curated_sardinia.json", payload), (DATA / "literature_curated_summary.json", summary)):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(records)} curated studies from {TSV}")
