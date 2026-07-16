"""Build public map layers from already-curated aggregate AMR datasets."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value):
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def build_human_facility_layer():
    sassari = read_json(DATA / "human_amr_facility_sassari_studies.json")
    local = read_json(DATA / "human_amr_local_studies_sardinia.json")
    cagliari = next(row for row in local["records"] if row["study_id"] == "binaghi_cagliari_efaecalis_2010")
    nuoro = next(row for row in local["records"] if row["study_id"] == "nuoro_san_francesco_mdr_abaumannii_outbreak_2012")

    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [8.552654, 40.720196]},
            "properties": {
                "facility": sassari["facility"]["facility_name"],
                "municipality": "Sassari",
                "study_count": len(sassari["records"]),
                "period": "2013-2022",
                "organisms": sorted({row.get("organism") for row in sassari["records"] if row.get("organism")}),
                "headline": "8 studi/coorti: K. pneumoniae, E. faecium e A. baumannii",
                "detail": "KPC, OXA-48-like, NDM e vanB2 documentati; coorti potenzialmente sovrapposte.",
                "geography_note": sassari["facility"]["geography_note"],
                "source_ids": [row["study_id"] for row in sassari["records"]],
            },
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [9.135638888888889, 39.210055555555556]},
            "properties": {
                "facility": cagliari["facility"],
                "municipality": "Cagliari",
                "study_count": 1,
                "period": "pubblicato nel 2010",
                "organisms": [cagliari["organism"]],
                "headline": f"{cagliari['patients_and_isolates']} isolati di E. faecalis",
                "detail": "Resistenze riportate per 13 antimicrobici; 89% multi-resistente secondo la definizione dello studio.",
                "geography_note": cagliari["geography_note"],
                "source_ids": [cagliari["study_id"]],
            },
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [9.3264, 40.3202]},
            "properties": {
                "facility": nuoro["facility"],
                "municipality": "Nuoro",
                "study_count": 1,
                "period": nuoro["collection_period"],
                "organisms": [nuoro["organism"]],
                "headline": f"Focolaio: {nuoro['clinical_positive_patients']} pazienti e {nuoro['environmental_positive_bed_headboards']} superfici positive",
                "detail": "12 isolati ST31 con blaOXA-51-like e blaOXA-23-like; sensibili alla colistina.",
                "geography_note": nuoro["geography_note"],
                "source_ids": [nuoro["study_id"]],
            },
        },
    ]
    write_json(
        DATA / "human_amr_facility_evidence.geojson",
        {
            "type": "FeatureCollection",
            "name": "Evidenze AMR umane pubblicate per struttura sanitaria",
            "source_id": "human_amr_facility_evidence",
            "privacy": "public_aggregate",
            "interpretation_note": "I punti identificano strutture sanitarie pubbliche, non la residenza dei pazienti e non coordinate di campioni.",
            "features": features,
        },
    )


def build_food_chain_layer():
    evidence = read_json(DATA / "food_chain_amr_berchidda.json")
    municipalities = read_json(ROOT / "public" / "geography" / "atlas_municipalities.geojson")
    boundary = next(
        feature
        for feature in municipalities["features"]
        if str(feature.get("properties", {}).get("Nome", "")).upper() == evidence["municipality"]
    )
    properties = {
        "municipality": evidence["municipality"],
        "period": evidence["collection_period"],
        "matrix": evidence["matrix"],
        "culture_count": len(evidence["cultures"]),
        "cultures": evidence["cultures"],
        "organisms": evidence["organisms_detected"],
        "interpretation_note": evidence["interpretation_note"],
        "source": evidence["source"],
    }
    write_json(
        DATA / "food_chain_amr_berchidda.geojson",
        {
            "type": "FeatureCollection",
            "name": "Evidenza AMR della filiera alimentare nel comune di Berchidda",
            "source_id": evidence["source_id"],
            "features": [{"type": "Feature", "geometry": boundary["geometry"], "properties": properties}],
        },
    )


if __name__ == "__main__":
    build_human_facility_layer()
    build_food_chain_layer()
    print("Built human facility and Berchidda food-chain AMR layers")
