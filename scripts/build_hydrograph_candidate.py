#!/usr/bin/env python3
"""Build a *private* hydrologic-network screening for wastewater-plant review.

This uses the Regione Sardegna DBGT v05 ``Elemento idrico Strahler`` WFS
snapshot.  The source describes the natural hydrographic network as connected,
oriented and ordered; this script nevertheless records network gaps and branch
ambiguities.  Its output is never a public discharge assertion: a SIRA plant is
only associated with its nearest mapped segment, not an authorised outfall.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POINTS = ROOT / "public" / "data" / "sira_depuratori_points.geojson"
NEAREST = ROOT / "public" / "data" / "sira_depuratori_nearest_river.csv"
DEFAULT_NETWORK = ROOT / "private" / "hydrology" / "elemento_idrico_strahler_2026-07-18.geojson"
DEFAULT_OUTPUT = ROOT / "private" / "hydrology" / "hydrograph_candidate_prototype_20.tsv"
DEFAULT_SUMMARY = ROOT / "private" / "hydrology" / "hydrograph_candidate_summary.json"
GRID_SIZE_DEGREES = 0.025


def key(point: list[float], precision: int = 7) -> tuple[float, float]:
    return round(point[0], precision), round(point[1], precision)


def point_segment_km(point: list[float], start: list[float], end: list[float]) -> float:
    """Approximate WGS84 point-to-segment distance for candidate selection."""
    scale = math.cos(math.radians(point[1]))
    px, py = point[0] * scale, point[1]
    ax, ay = start[0] * scale, start[1]
    bx, by = end[0] * scale, end[1]
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        degrees = math.hypot(px - ax, py - ay)
    else:
        fraction = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        degrees = math.hypot(px - (ax + fraction * dx), py - (ay + fraction * dy))
    return degrees * 111.32


def distance_to_line_km(point: list[float], line: list[list[float]]) -> float:
    return min(point_segment_km(point, start, end) for start, end in zip(line, line[1:]))


def active_urban_screening(limit: int) -> list[dict[str, str]]:
    with POINTS.open(encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    with NEAREST.open(encoding="utf-8", newline="") as handle:
        near = {row["id"]: row for row in csv.DictReader(handle)}
    rows = []
    for feature in features:
        props = feature["properties"]
        if props.get("categoria") != "Acque reflue urbane" or props.get("STATO_OPERATIVO") != "Attivo":
            continue
        reference = near.get(str(props.get("ID")))
        if not reference:
            continue
        rows.append({
            "sira_id": str(props["ID"]),
            "municipality": props.get("COMUNE", ""),
            "plant_name": props.get("DENOMINAZIONE", ""),
            "point": feature["geometry"]["coordinates"],
            "proximity_km": float(reference["distanza_approssimata_km"]),
        })
    rows = sorted(rows, key=lambda row: (row["proximity_km"], row["municipality"], row["sira_id"]))
    return rows if limit == 0 else rows[:limit]


def load_segments(network: Path) -> list[dict]:
    with network.open(encoding="utf-8") as handle:
        features = json.load(handle)["features"]
    segments = []
    for feature in features:
        props = feature["properties"]
        for line in feature["geometry"]["coordinates"]:
            if len(line) < 2:
                continue
            xs = [point[0] for point in line]
            ys = [point[1] for point in line]
            segments.append({
                "start": line[0], "end": line[-1], "line": line,
                "bbox": (min(xs), min(ys), max(xs), max(ys)),
                "segment_id": props.get("segmentid", ""),
                "name": props.get("nome", ""), "basin": props.get("sub_bacino", ""),
                "strahler": props.get("n_strahler"),
            })
    return segments


def grid_cell(x: float, y: float, size: float = GRID_SIZE_DEGREES) -> tuple[int, int]:
    return math.floor(x / size), math.floor(y / size)


def build_spatial_index(segments: list[dict], size: float = GRID_SIZE_DEGREES) -> dict[tuple[int, int], list[int]]:
    """Index segment bounding boxes in a coarse geographic grid for private screening."""
    index: dict[tuple[int, int], list[int]] = defaultdict(list)
    for segment_index, segment in enumerate(segments):
        xmin, ymin, xmax, ymax = segment["bbox"]
        ix0, iy0 = grid_cell(xmin, ymin, size)
        ix1, iy1 = grid_cell(xmax, ymax, size)
        for ix in range(ix0, ix1 + 1):
            for iy in range(iy0, iy1 + 1):
                index[ix, iy].append(segment_index)
    return index


def nearest_segment(point: list[float], segments: list[dict], spatial_index: dict[tuple[int, int], list[int]], size: float = GRID_SIZE_DEGREES) -> tuple[int, float]:
    """Find a nearest line while expanding the grid only as far as required."""
    ix, iy = grid_cell(point[0], point[1], size)
    candidates: set[int] = set()
    best_index, best_distance = -1, float("inf")
    for radius in range(0, 81):
        for gx in range(ix - radius, ix + radius + 1):
            for gy in range(iy - radius, iy + radius + 1):
                if radius and max(abs(gx - ix), abs(gy - iy)) != radius:
                    continue
                for segment_index in spatial_index.get((gx, gy), []):
                    if segment_index in candidates:
                        continue
                    candidates.add(segment_index)
                    distance = distance_to_line_km(point, segments[segment_index]["line"])
                    if distance < best_distance:
                        best_index, best_distance = segment_index, distance
        # The next unsearched ring begins at least roughly radius grid cells away.
        if radius >= 1 and best_index >= 0 and best_distance <= radius * size * 70:
            return best_index, best_distance
    if best_index < 0:
        raise RuntimeError("No network segment found within grid search extent")
    return best_index, best_distance


def route_from(start_index: int, segments: list[dict], starts: dict[tuple[float, float], list[int]], maximum_steps: int = 20000) -> dict[str, object]:
    path, current, seen = [], start_index, set()
    while len(path) < maximum_steps:
        if current in seen:
            return {"status": "cycle_detected", "path": path, "terminal": None}
        seen.add(current)
        path.append(current)
        segment = segments[current]
        next_candidates = [item for item in starts.get(key(segment["end"]), []) if item != current]
        if not next_candidates:
            return {"status": "network_terminal_unclassified", "path": path, "terminal": segment["end"]}
        same_basin = [item for item in next_candidates if segments[item]["basin"] == segment["basin"]]
        if len(same_basin) == 1:
            current = same_basin[0]
        elif len(next_candidates) == 1:
            current = next_candidates[0]
        else:
            return {"status": "branch_ambiguous", "path": path, "terminal": segment["end"]}
    return {"status": "maximum_steps_reached", "path": path, "terminal": None}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--network", type=Path, default=DEFAULT_NETWORK)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--summary", type=Path, default=DEFAULT_SUMMARY)
    parser.add_argument("--limit", type=int, default=20, help="Plants to screen; use 0 for all active urban plants.")
    args = parser.parse_args()
    if args.limit < 0:
        raise SystemExit("--limit must be zero or positive")
    if not args.network.exists():
        raise SystemExit(f"Private WFS snapshot not found: {args.network}")

    segments = load_segments(args.network)
    spatial_index = build_spatial_index(segments)
    starts: dict[tuple[float, float], list[int]] = defaultdict(list)
    for index, segment in enumerate(segments):
        starts[key(segment["start"])].append(index)

    output_rows = []
    for plant in active_urban_screening(args.limit):
        index, distance = nearest_segment(plant["point"], segments, spatial_index)
        route = route_from(index, segments, starts)
        source = segments[index]
        last = segments[route["path"][-1]]
        output_rows.append({
            "sira_id": plant["sira_id"],
            "municipality": plant["municipality"],
            "plant_name": plant["plant_name"],
            "nearest_network_segment": source["segment_id"],
            "nearest_segment_name": source["name"],
            "nearest_segment_basin": source["basin"],
            "nearest_segment_strahler": source["strahler"],
            "nearest_network_distance_km": f"{distance:.4f}",
            "candidate_path_segments": len(route["path"]),
            "candidate_terminal_segment": last["segment_id"],
            "candidate_terminal_basin": last["basin"],
            "network_route_status": route["status"],
            "authorised_receiver": "not_assessed",
            "public_interpretation": "Private network screening only. Nearest mapped segment and candidate route do not demonstrate an authorised discharge, outfall or receiving water body.",
        })

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output_rows[0]), delimiter="\t")
        writer.writeheader()
        writer.writerows(output_rows)

    terminals = sum(1 for segment in segments if not starts.get(key(segment["end"])))
    summary = {
        "source": "Regione Sardegna DBGT10K_22_v05 elemento_idrico_strahler WFS",
        "network_file": str(args.network.relative_to(ROOT)).replace("\\", "/"),
        "segments": len(segments),
        "connected_endpoints": len(segments) - terminals,
        "terminal_edges": terminals,
        "screened_plants": len(output_rows),
        "screening_limit": args.limit,
        "route_statuses": dict(Counter(row["network_route_status"] for row in output_rows)),
        "safety_note": "No authorised receiver, discharge point or public downstream destination is inferred.",
    }
    args.summary.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()