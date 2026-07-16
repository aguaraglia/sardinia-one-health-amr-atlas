#!/usr/bin/env python3
"""Build public municipal AMR aggregates from the S. uberis study supplements.

The source workbooks contain isolate identifiers, exact collection dates and farm-level
metadata. They are downloaded under ``private/``. Public outputs contain municipality-
level aggregates and municipal polygons only.

The script uses only the Python standard library so it can be rerun without QGIS/GDAL
or third-party Python packages.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import urllib.request
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET


METADATA_URL = (
    "https://static-content.springer.com/esm/"
    "art%3A10.1186%2Fs12917-022-03341-1/MediaObjects/"
    "12917_2022_3341_MOESM2_ESM.xlsx"
)
AMR_URL = (
    "https://static-content.springer.com/esm/"
    "art%3A10.1186%2Fs12917-022-03341-1/MediaObjects/"
    "12917_2022_3341_MOESM3_ESM.xlsx"
)

PHENOTYPE_COLUMNS = [
    "Ampicillin",
    "Cephalothin",
    "Erythromycin",
    "Gentamicin",
    "Kanamycin",
    "Novobiocin",
    "Penicillin",
    "Streptomycin",
    "Tetracycline",
    "Amoxicillin+ clavulanic acid",
    "Oxacillin",
    "Trimethoprim Sulphamethoxazole",
    "Ceftiofur",
    "Pirlimycin",
]

GENE_COLUMNS = [
    "Beta-Lactam_gene",
    "Chloramphenicol_gene",
    "Lincosamide/Streptogramin_gene",
    "Lincosamide_gene",
    "Streptomycin_gene",
    "Aminoglycoside_gene",
    "Tetracycline_gene",
]

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
DOC_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "Sardinia-AMR-Atlas/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        destination.write_bytes(response.read())


def column_index(cell_reference: str) -> int:
    letters = re.match(r"[A-Z]+", cell_reference).group(0)
    value = 0
    for char in letters:
        value = value * 26 + ord(char) - 64
    return value - 1


def read_xlsx_sheet(path: Path, sheet_name: str) -> list[dict[str, object]]:
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in relationships.findall("r:Relationship", REL_NS)
        }
        sheet_target = None
        for sheet in workbook.findall("m:sheets/m:sheet", NS):
            if sheet.attrib.get("name") == sheet_name:
                sheet_target = targets[sheet.attrib[DOC_REL]]
                break
        if not sheet_target:
            raise ValueError(f"Sheet not found: {sheet_name} in {path}")
        if sheet_target.startswith("/"):
            sheet_path = sheet_target.lstrip("/")
        else:
            sheet_path = "xl/" + sheet_target.lstrip("/")

        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_root.findall("m:si", NS):
                shared_strings.append("".join(item.itertext()))

        sheet_root = ET.fromstring(archive.read(sheet_path))
        rows: list[list[object]] = []
        for row in sheet_root.findall("m:sheetData/m:row", NS):
            values: dict[int, object] = {}
            for cell in row.findall("m:c", NS):
                index = column_index(cell.attrib["r"])
                cell_type = cell.attrib.get("t")
                value_node = cell.find("m:v", NS)
                if cell_type == "inlineStr":
                    inline = cell.find("m:is", NS)
                    value: object = "" if inline is None else "".join(inline.itertext())
                elif value_node is None:
                    value = ""
                elif cell_type == "s":
                    value = shared_strings[int(value_node.text)]
                elif cell_type == "b":
                    value = value_node.text == "1"
                else:
                    raw = value_node.text or ""
                    try:
                        number = float(raw)
                        value = int(number) if number.is_integer() else number
                    except ValueError:
                        value = raw
                values[index] = value
            width = max(values, default=-1) + 1
            rows.append([values.get(index, "") for index in range(width)])

    if not rows:
        return []
    headers = [str(value).strip() for value in rows[0]]
    records = []
    for row in rows[1:]:
        padded = row + [""] * (len(headers) - len(row))
        record = {headers[index]: padded[index] for index in range(len(headers))}
        if any(str(value).strip() for value in record.values()):
            records.append(record)
    return records


def normalized_name(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value).strip()).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def cleaned(value: object) -> str:
    return str(value).strip() if value is not None else ""


def build_aggregates(metadata_rows: list[dict], amr_rows: list[dict]) -> list[dict]:
    amr_by_filename = {cleaned(row["Filename"]): row for row in amr_rows}
    joined = []
    for metadata in metadata_rows:
        filename = cleaned(metadata["Filename"])
        if filename not in amr_by_filename:
            raise ValueError(f"AMR row not found for {filename}")
        joined.append((metadata, amr_by_filename[filename]))
    if len(joined) != 46:
        raise ValueError(f"Expected 46 study isolates, found {len(joined)}")

    groups: dict[tuple[str, str], list[tuple[dict, dict]]] = defaultdict(list)
    for metadata, amr in joined:
        municipality = cleaned(metadata["Farm"])
        province = cleaned(metadata["Province"])
        if not municipality:
            raise ValueError(f"Missing municipality for {metadata['Filename']}")
        groups[(municipality, province)].append((metadata, amr))

    aggregates = []
    for (municipality, province), rows in sorted(groups.items()):
        phenotype_counts = {
            antimicrobial: Counter(cleaned(amr[antimicrobial]).upper() for _, amr in rows)
            for antimicrobial in PHENOTYPE_COLUMNS
        }
        invalid = {
            antimicrobial: sorted(set(counts) - {"S", "I", "R"})
            for antimicrobial, counts in phenotype_counts.items()
            if set(counts) - {"S", "I", "R"}
        }
        if invalid:
            raise ValueError(f"Unexpected phenotype values in {municipality}: {invalid}")

        gene_counts: Counter[str] = Counter()
        for _, amr in rows:
            for column in GENE_COLUMNS:
                gene = cleaned(amr.get(column, ""))
                if gene and gene.upper() not in {"NA", "N/A", "NONE", "-"}:
                    gene_counts[gene] += 1

        years = sorted(int(metadata["Year"]) for metadata, _ in rows)
        resistant_total = sum(counts["R"] for counts in phenotype_counts.values())
        intermediate_total = sum(counts["I"] for counts in phenotype_counts.values())
        susceptible_total = sum(counts["S"] for counts in phenotype_counts.values())
        resistant_isolates = sum(
            any(cleaned(amr[antimicrobial]).upper() == "R" for antimicrobial in PHENOTYPE_COLUMNS)
            for _, amr in rows
        )
        antimicrobial_results = [
            {
                "antimicrobial": antimicrobial,
                "resistant": phenotype_counts[antimicrobial]["R"],
                "intermediate": phenotype_counts[antimicrobial]["I"],
                "susceptible": phenotype_counts[antimicrobial]["S"],
                "tested": sum(phenotype_counts[antimicrobial].values()),
            }
            for antimicrobial in PHENOTYPE_COLUMNS
        ]
        aggregates.append(
            {
                "municipality": municipality.upper(),
                "province": province.strip().upper(),
                "study_isolates": len(rows),
                "isolates_with_any_resistance": resistant_isolates,
                "sample_year_start": min(years),
                "sample_year_end": max(years),
                "resistant_test_results": resistant_total,
                "intermediate_test_results": intermediate_total,
                "susceptible_test_results": susceptible_total,
                "total_test_results": resistant_total + intermediate_total + susceptible_total,
                "resistant_antimicrobials": [
                    item["antimicrobial"] for item in antimicrobial_results if item["resistant"] > 0
                ],
                "resistance_genes": [
                    {"gene": gene, "isolates": count} for gene, count in sorted(gene_counts.items())
                ],
                "antimicrobial_results": antimicrobial_results,
            }
        )
    return aggregates


def feature_index(boundaries: dict) -> dict[str, dict]:
    result = {}
    for feature in boundaries["features"]:
        name = feature.get("properties", {}).get("Nome", "")
        result[normalized_name(name)] = feature
    return result


def build_uberis_geojson(aggregates: list[dict], boundaries: dict) -> dict:
    boundaries_by_name = feature_index(boundaries)
    features = []
    for row in aggregates:
        boundary = boundaries_by_name.get(normalized_name(row["municipality"]))
        if not boundary:
            raise ValueError(f"Municipal boundary not found: {row['municipality']}")
        properties = {key: value for key, value in row.items() if key != "antimicrobial_results"}
        properties.update(
            {
                "organism": "Streptococcus uberis",
                "host": "sheep",
                "material": "milk",
                "evidence_type": "coorte_genomica_selettiva_ovini",
                "interpretation_note": (
                    "Isolati selezionati uno per azienda e per profilo RFLP; "
                    "identificazione comunale, non prevalenza AMR comunale."
                ),
            }
        )
        features.append({"type": "Feature", "geometry": boundary["geometry"], "properties": properties})
    return {
        "type": "FeatureCollection",
        "name": "Streptococcus uberis - evidenze AMR veterinarie comunali",
        "source_id": "pmid_35799261_s_uberis_wgs",
        "features": features,
    }


def build_combined_outputs(izs_json: dict, izs_geojson: dict, uberis_rows: list[dict], uberis_geojson: dict):
    combined: dict[str, dict] = {}

    def ensure_feature(name: str, province: str, geometry: dict) -> dict:
        key = normalized_name(name)
        if key not in combined:
            combined[key] = {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "municipality": name.upper(),
                    "province": province.upper(),
                    "has_izs_catalogue": False,
                    "has_uberis_wgs": False,
                },
            }
        return combined[key]

    for feature in izs_geojson["features"]:
        source = feature["properties"]
        target = ensure_feature(source["municipality"], source.get("province", ""), feature["geometry"])
        target["properties"].update(
            {
                "has_izs_catalogue": True,
                "izs_catalogue_isolates": source["catalogue_isolates"],
                "izs_resistant_test_results": source["resistant_test_results"],
                "izs_total_test_results": source["total_test_results"],
                "izs_organisms": source.get("organisms", []),
                "izs_resistant_antibiotics": source.get("resistant_antibiotics", []),
                "izs_period": "2004-2006",
            }
        )

    uberis_by_name = {normalized_name(row["municipality"]): row for row in uberis_rows}
    for feature in uberis_geojson["features"]:
        source = feature["properties"]
        row = uberis_by_name[normalized_name(source["municipality"])]
        target = ensure_feature(source["municipality"], source.get("province", ""), feature["geometry"])
        target["properties"].update(
            {
                "has_uberis_wgs": True,
                "uberis_study_isolates": row["study_isolates"],
                "uberis_isolates_with_any_resistance": row["isolates_with_any_resistance"],
                "uberis_resistant_test_results": row["resistant_test_results"],
                "uberis_intermediate_test_results": row["intermediate_test_results"],
                "uberis_total_test_results": row["total_test_results"],
                "uberis_resistant_antimicrobials": row["resistant_antimicrobials"],
                "uberis_resistance_genes": [item["gene"] for item in row["resistance_genes"]],
                "uberis_period": f"{row['sample_year_start']}-{row['sample_year_end']}",
            }
        )

    features = sorted(combined.values(), key=lambda feature: feature["properties"]["municipality"])
    for feature in features:
        properties = feature["properties"]
        properties["evidence_source_count"] = int(properties["has_izs_catalogue"]) + int(
            properties["has_uberis_wgs"]
        )
        properties["interpretation_note"] = (
            "Fonti selettive con pannelli e periodi differenti; i conteggi non vanno sommati "
            "e non stimano prevalenza, incidenza o rischio del comune."
        )

    izs_municipalities = izs_json.get("municipalities", [])
    summary = {
        "source_id": "veterinary_amr_municipal_evidence",
        "dataset_version": "atlas-curated-v0.1",
        "geography_level": "COMUNE_ORIGINE_CAMPIONE",
        "municipality_count_unique": len(features),
        "public_scope": (
            "Aggregati comunali; aziende, localita, coordinate, date esatte e identificativi "
            "dei singoli isolati esclusi."
        ),
        "interpretation_note": (
            "Le fonti sono collezioni o coorti selettive con pannelli e periodi differenti. "
            "Documentano identificazioni comunali, non prevalenza o rischio comunale."
        ),
        "sources": [
            {
                "source_id": "izs_sardegna_bioresource",
                "title": "Bioresource IZSSA - ceppi ovini con antibiogramma",
                "period": "2004-2006",
                "municipality_count": izs_json.get("municipality_count", len(izs_municipalities)),
                "isolate_count": izs_json.get("record_count", 0),
                "resistant_test_results": sum(
                    row.get("resistant_test_results", 0) for row in izs_municipalities
                ),
                "total_test_results": sum(row.get("total_test_results", 0) for row in izs_municipalities),
                "source_url": "https://www.izs-sardegna.it/oldsite/cpt_index.cfm",
            },
            {
                "source_id": "pmid_35799261_s_uberis_wgs",
                "title": "Streptococcus uberis da mastite ovina - coorte WGS",
                "period": "2011-2016",
                "municipality_count": len(uberis_rows),
                "isolate_count": sum(row["study_isolates"] for row in uberis_rows),
                "isolates_with_any_resistance": sum(
                    row["isolates_with_any_resistance"] for row in uberis_rows
                ),
                "resistant_test_results": sum(row["resistant_test_results"] for row in uberis_rows),
                "intermediate_test_results": sum(
                    row["intermediate_test_results"] for row in uberis_rows
                ),
                "total_test_results": sum(row["total_test_results"] for row in uberis_rows),
                "pmid": "35799261",
                "doi": "10.1186/s12917-022-03341-1",
                "source_url": "https://pubmed.ncbi.nlm.nih.gov/35799261/",
            },
        ],
        "municipalities": [
            {
                "municipality": feature["properties"]["municipality"],
                "province": feature["properties"]["province"],
                "sources": [
                    source
                    for source, present in (
                        ("izs_sardegna_bioresource", feature["properties"]["has_izs_catalogue"]),
                        ("pmid_35799261_s_uberis_wgs", feature["properties"]["has_uberis_wgs"]),
                    )
                    if present
                ],
            }
            for feature in features
        ],
    }
    geojson = {
        "type": "FeatureCollection",
        "name": "Evidenze AMR veterinarie comunali - fonti integrate",
        "source_id": "veterinary_amr_municipal_evidence",
        "features": features,
    }
    return summary, geojson


def write_json(path: Path, value: dict, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    else:
        text = json.dumps(value, ensure_ascii=False, indent=2)
    path.write_text(text + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--private-dir", type=Path, default=Path("private/external/streptococcus_uberis"))
    parser.add_argument("--boundaries", type=Path, default=Path("public/geography/atlas_municipalities.geojson"))
    parser.add_argument("--izs-json", type=Path, default=Path("public/data/izs_bioresource_amr_municipal.json"))
    parser.add_argument("--izs-geojson", type=Path, default=Path("public/data/izs_bioresource_amr_municipal.geojson"))
    parser.add_argument("--no-download", action="store_true")
    args = parser.parse_args()

    metadata_path = args.private_dir / "12917_2022_3341_MOESM2_ESM.xlsx"
    amr_path = args.private_dir / "12917_2022_3341_MOESM3_ESM.xlsx"
    if not args.no_download:
        download(METADATA_URL, metadata_path)
        download(AMR_URL, amr_path)
    if not metadata_path.exists() or not amr_path.exists():
        raise FileNotFoundError("Source workbooks are missing; rerun without --no-download")

    metadata_rows = read_xlsx_sheet(metadata_path, "This_study")
    amr_rows = read_xlsx_sheet(amr_path, "Data")
    aggregates = build_aggregates(metadata_rows, amr_rows)
    boundaries = json.loads(args.boundaries.read_text(encoding="utf-8-sig"))
    uberis_geojson = build_uberis_geojson(aggregates, boundaries)

    public_dataset = {
        "source_id": "pmid_35799261_s_uberis_wgs",
        "dataset_version": "atlas-curated-v0.1",
        "geography_level": "COMUNE_ORIGINE_CAMPIONE",
        "record_count": sum(row["study_isolates"] for row in aggregates),
        "municipality_count": len(aggregates),
        "sample_period": {"start": "2011", "end": "2016"},
        "public_scope": (
            "Aggregati comunali; aziende, coordinate, date esatte, Biosample e identificativi "
            "dei singoli isolati esclusi."
        ),
        "interpretation_note": (
            "Coorte genomica selettiva di isolati con profili RFLP unici, uno per azienda, "
            "scelti tra comuni con più focolai. Non è una stima di prevalenza comunale."
        ),
        "source": {
            "title": (
                "Genomic surveillance reveals antibiotic resistance gene transmission via "
                "phage recombinases within sheep mastitis-associated Streptococcus uberis"
            ),
            "pmid": "35799261",
            "pmcid": "PMC9261030",
            "doi": "10.1186/s12917-022-03341-1",
            "url": "https://pubmed.ncbi.nlm.nih.gov/35799261/",
            "supplement_metadata_url": METADATA_URL,
            "supplement_amr_url": AMR_URL,
        },
        "municipalities": aggregates,
    }
    write_json(Path("public/data/streptococcus_uberis_amr_municipal.json"), public_dataset)
    write_json(Path("public/data/streptococcus_uberis_amr_municipal.geojson"), uberis_geojson, compact=True)

    izs_json = json.loads(args.izs_json.read_text(encoding="utf-8-sig"))
    izs_geojson = json.loads(args.izs_geojson.read_text(encoding="utf-8-sig"))
    combined_json, combined_geojson = build_combined_outputs(
        izs_json, izs_geojson, aggregates, uberis_geojson
    )
    write_json(Path("public/data/veterinary_amr_municipal_evidence.json"), combined_json)
    write_json(Path("public/data/veterinary_amr_municipal_evidence.geojson"), combined_geojson, compact=True)

    resistant = sum(row["resistant_test_results"] for row in aggregates)
    total = sum(row["total_test_results"] for row in aggregates)
    print(f"Private source workbooks: {metadata_path}, {amr_path}")
    print(f"Public S. uberis aggregates: {len(aggregates)} municipalities, 46 isolates, {resistant}/{total} resistant results")
    print(f"Combined municipal layer: {combined_json['municipality_count_unique']} municipalities")


if __name__ == "__main__":
    main()
