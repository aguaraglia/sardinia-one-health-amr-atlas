#!/usr/bin/env python3
"""Place curated Sardinia studies at the scale the authors declare.

Regional and North Sardinia studies share one unfilled outline each, in the
same popup schema as the Lombardy atlas. Named hospitals stay on the existing
facility layer. Anonymous farms, dairies and hunting houses are not geocoded.
"""

from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
NOTE = "Il segnaposto indica dove è stato condotto lo studio, non una prevalenza."
SECTOR = {
    "veterinary_amr": "AMR veterinaria",
    "food_chain_amr": "AMR alimentare",
    "wildlife_amr": "AMR nella fauna selvatica",
    "human_amr": "AMR umana",
    "one_health_amr": "One Health",
}
# First author as returned by PubMed esummary on 2026-11-12. The preprint
# authors are those on the Crossref DOI record.
AUTHORS = {
    "lit_nas_sardinia_2021": "Longheu CM et al.",
    "lit_saureus_ovine_mastitis_sardinia_2017": "Azara E et al.",
    "lit_salmonella_poultry_sardinia_2026": "Siddi G et al.",
    "lit_saureus_small_ruminants_sardinia_2025": "Moawad AA et al.",
    "lit_ecoli_pigs_sardinia_2025": "Siddi G et al.",
    "lit_salmonella_yersinia_pig_meat_sardinia_2024": "Siddi G et al.",
    "lit_escherichia_wild_boar_sardinia_2024": "Siddi G et al.",
    "lit_salmonella_yersinia_wild_boar_sardinia_2023": "Siddi G et al.",
    "lit_yersinia_pigs_sardinia_2018": "Fois F et al.",
    "lit_salmonella_pigs_sardinia_2017": "Fois F et al.",
    "lit_mycobacteria_north_sardinia_2023": "Chen X et al.",
    "lit_streptococcus_uberis_sardinia_2021": "Rosa NM et al.",
    "lit_staphylococcus_epidermidis_ovine_sardinia_2011": "Onni T et al.",
    "lit_yersinia_cheese_plants_sardinia_2023": "Piras F et al.",
    "lit_cons_ovine_sausage_sardinia_2024": "Mangia NP et al.",
    "lit_lab_fermented_food_sardinia_2025": "Carboni G et al.",
    "lit_sruminantium_mastitis_sardinia_2023": "Rosa MN et al.",
    "lit_efaecalis_mastitis_outbreak_sardinia_2013": "Sanciu G et al.",
    "lit_leptospira_livestock_sardinia_2018": "Liegeon G et al.",
    "lit_enterococcus_dairy_sardinia_2003": "Mannu L et al.",
    "lit_h_pylori_north_sardinia_2013": "Dore MP et al.",
    "lit_h_pylori_north_sardinia_2002": "Dore MP et al.",
    "lit_salmonella_typhi_sardinia_2000": "Scuderi G et al.",
}
REGIONAL_IDS = [
    "lit_saureus_ovine_mastitis_sardinia_2017",
    "lit_salmonella_poultry_sardinia_2026",
    "lit_saureus_small_ruminants_sardinia_2025",
    "lit_ecoli_pigs_sardinia_2025",
    "lit_salmonella_yersinia_pig_meat_sardinia_2024",
    "lit_escherichia_wild_boar_sardinia_2024",
    "lit_salmonella_yersinia_wild_boar_sardinia_2023",
    "lit_yersinia_pigs_sardinia_2018",
    "lit_salmonella_pigs_sardinia_2017",
    "lit_streptococcus_uberis_sardinia_2021",
    "lit_staphylococcus_epidermidis_ovine_sardinia_2011",
    "lit_yersinia_cheese_plants_sardinia_2023",
    "lit_cons_ovine_sausage_sardinia_2024",
    "lit_lab_fermented_food_sardinia_2025",
    "lit_sruminantium_mastitis_sardinia_2023",
    "lit_leptospira_livestock_sardinia_2018",
    "lit_enterococcus_dairy_sardinia_2003",
    "lit_salmonella_typhi_sardinia_2000",
]
NORTH_IDS = [
    "lit_mycobacteria_north_sardinia_2023",
    "lit_h_pylori_north_sardinia_2013",
    "lit_h_pylori_north_sardinia_2002",
    "lit_efaecalis_mastitis_outbreak_sardinia_2013",
]
NAS_ID = "lit_nas_sardinia_2021"
OZIERI = (9.002230, 40.580791)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def card(record: dict, curated: dict) -> dict:
    organisms = ", ".join(curated.get("organisms") or []) or "non specificato"
    doi = record.get("doi") or ""
    return {
        "id": record["id"],
        "authors": AUTHORS.get(record["id"]) or record.get("authors") or "autori dello studio",
        "year": str(record["year"]),
        "title": record["title"].rstrip("."),
        "sector": SECTOR[record["scope"]],
        "organism": organisms,
        "doi": f"https://doi.org/{doi}" if doi else record.get("source_url") or "",
    }


def outline(geometry: dict, place: str, level: str, basis: str, studies: list[dict]) -> dict:
    studies = sorted(studies, key=lambda item: (-int(item["year"]), item["title"]))
    return {
        "type": "Feature",
        "geometry": geometry,
        "properties": {
            "place": place,
            "geography_level": level,
            "geography_basis": basis,
            "study_count": len(studies),
            "study_ids": "; ".join(item["id"] for item in studies),
            "authors": " | ".join(item["authors"] for item in studies),
            "year": " | ".join(item["year"] for item in studies),
            "title": " | ".join(item["title"] for item in studies),
            "sector": " | ".join(item["sector"] for item in studies),
            "organism": " | ".join(item["organism"] for item in studies),
            "doi": " | ".join(item["doi"] for item in studies),
            "geography_note": NOTE,
        },
    }


def north_geometry() -> dict:
    municipalities = load(ROOT / "public/geography/atlas_municipalities.geojson")["features"]
    parts = [
        shape(feature["geometry"])
        for feature in municipalities
        if str(feature["properties"].get("CIstat") or "").startswith("090")
    ]
    if len(parts) < 80:
        raise SystemExit(f"Comuni ISTAT 090 inattesi: {len(parts)}")
    merged = unary_union(parts)
    return mapping(merged)


def write_collection(path: Path, feature: dict) -> None:
    payload = {"type": "FeatureCollection", "features": [feature]}
    path.write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def attach_nas(nas: dict) -> None:
    path = ROOT / "public/data/human_amr_facility_evidence.geojson"
    collection = load(path)
    note = (
        "I risultati umani non sono ripartiti per ospedale. "
        "I campioni ovini restano a scala regionale e non sono attribuiti a un comune."
    )
    basis = (
        "Ospedali nominati nello studio: AOU di Sassari, Ospedale San Francesco di Nuoro "
        "e Ospedale Antonio Segni di Ozieri. " + note +
        " Ozieri: OpenStreetMap Nominatim, Ospedale Antonio Segni, way 238298554, verificato il 2026-11-12."
    )
    fields = {
        "geography_level": "struttura",
        "geography_basis": basis,
        "authors": nas["authors"],
        "year": nas["year"],
        "title": nas["title"],
        "sector": nas["sector"],
        "organism": nas["organism"],
        "doi": nas["doi"],
    }
    found = {"Sassari": False, "Nuoro": False}
    for feature in collection["features"]:
        props = feature["properties"]
        facility = props.get("facility") or ""
        if "Sassari" in facility and "Ozieri" not in facility:
            key = "Sassari"
        elif "Nuoro" in facility:
            key = "Nuoro"
        else:
            continue
        found[key] = True
        props.update(fields)
        detail = props.get("detail") or ""
        sentence = "Comprende anche lo studio NAS 2021 sui tre ospedali nominati; i risultati umani non sono ripartiti per ospedale."
        if sentence not in detail:
            props["detail"] = (detail + " " + sentence).strip()
        ids = list(props.get("source_ids") or [])
        if NAS_ID not in ids:
            ids.append(NAS_ID)
        props["source_ids"] = ids
        props["study_count"] = len(ids)
    if not all(found.values()):
        raise SystemExit(f"Strutture mancanti nel layer umano: {found}")
    if not any(f["properties"].get("facility", "").startswith("Ospedale Antonio Segni") for f in collection["features"]):
        collection["features"].append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [OZIERI[0], OZIERI[1]]},
            "properties": {
                "facility": "Ospedale Antonio Segni, Ozieri",
                "municipality": "Ozieri",
                "study_count": 1,
                "period": "2017",
                "organisms": ["non-aureus Staphylococcus spp."],
                "headline": "Studio NAS 2021, uno dei tre ospedali nominati",
                "detail": note,
                "geography_note": NOTE + " " + note,
                "source_ids": [NAS_ID],
                **fields,
            },
        })
    path.write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    catalog = {row["id"]: row for row in load(ROOT / "public/data/literature-catalog.json")["records"]}
    curated = {row["study_id"]: row for row in load(ROOT / "public/data/literature_curated_sardinia.json")["records"]}
    if set(catalog) != set(curated):
        raise SystemExit("Catalogo e registro curato non coincidono")

    def cards(ids: list[str]) -> list[dict]:
        return [card(catalog[study_id], curated[study_id]) for study_id in ids]

    region = load(ROOT / "public/geography/atlas_regions.geojson")["features"][0]["geometry"]
    regional = outline(
        region,
        "Sardegna",
        "regione",
        "Gli autori dichiarano la Sardegna, oppure un'area non delimitata o un sito anonimo "
        "(azienda, caseificio, casa di caccia) che non viene localizzato. "
        "S. ruminantium è descritto come focolaio in Sardegna orientale senza un confine disegnabile: resta su questo contorno. "
        "Il contorno regionale non è un punto di misura.",
        cards(REGIONAL_IDS),
    )
    north = outline(
        north_geometry(),
        "Nord Sardegna",
        "area",
        "Contorno ottenuto unendo i 92 comuni con codice ISTAT 090 (provincia di Sassari) nella base comunale DBGT. "
        "È l'area amministrativa usata per gli studi che dichiarano il Nord Sardegna o il sistema sanitario del Nord Sardegna. "
        "Non è il confine ufficiale di un'ASL. L'azienda del focolaio da E. faecalis non è localizzata.",
        cards(NORTH_IDS),
    )
    write_collection(ROOT / "public/data/regional_study_outline.geojson", regional)
    write_collection(ROOT / "public/data/north_sardinia_study_outline.geojson", north)
    attach_nas(cards([NAS_ID])[0])
    print(f"regional studies {len(REGIONAL_IDS)}; north studies {len(NORTH_IDS)}; NAS on three hospitals")


if __name__ == "__main__":
    main()
