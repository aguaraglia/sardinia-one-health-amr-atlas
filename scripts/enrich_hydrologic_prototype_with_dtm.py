"""Orient the nearest DBGT segment for the 20-plant screening sample.

This is deliberately a segment-orientation exercise, not a discharge-routing
model. It samples the official regional DTM through WCS and records only the
downhill end of the nearest mapped line. No authorised receiver is inferred.
"""
from __future__ import annotations

import csv
import io
import json
import math
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports/hydrologic_receiver_prototype_20.tsv"
PLANTS = ROOT / "public/data/sira_depuratori_points.geojson"
RIVERS = ROOT / "public/data/dbgt_corsi_principali.geojson"
WCS = "https://webgis.regione.sardegna.it/geoserverraster/wcs"
COVERAGE = "raster__DTM_10M_ALTIMETRIA_REV01"


def utm32(lon: float, lat: float) -> tuple[float, float]:
    """WGS84 to UTM 32N; ETRF2000/RDN2008 difference is negligible at 10 m."""
    a, ecc_sq, k0 = 6378137.0, 0.00669438, 0.9996
    ecc_prime_sq = ecc_sq / (1 - ecc_sq)
    lat_rad, lon_rad = math.radians(lat), math.radians(lon)
    lon_origin = math.radians(9.0)
    n = a / math.sqrt(1 - ecc_sq * math.sin(lat_rad) ** 2)
    t = math.tan(lat_rad) ** 2
    c = ecc_prime_sq * math.cos(lat_rad) ** 2
    aa = math.cos(lat_rad) * (lon_rad - lon_origin)
    m = a * ((1 - ecc_sq / 4 - 3 * ecc_sq**2 / 64 - 5 * ecc_sq**3 / 256) * lat_rad
        - (3 * ecc_sq / 8 + 3 * ecc_sq**2 / 32 + 45 * ecc_sq**3 / 1024) * math.sin(2 * lat_rad)
        + (15 * ecc_sq**2 / 256 + 45 * ecc_sq**3 / 1024) * math.sin(4 * lat_rad)
        - (35 * ecc_sq**3 / 3072) * math.sin(6 * lat_rad))
    easting = k0 * n * (aa + (1 - t + c) * aa**3 / 6 + (5 - 18 * t + t**2 + 72 * c - 58 * ecc_prime_sq) * aa**5 / 120) + 500000
    northing = k0 * (m + n * math.tan(lat_rad) * (aa**2 / 2 + (5 - t + 9 * c + 4 * c**2) * aa**4 / 24 + (61 - 58 * t + t**2 + 600 * c - 330 * ecc_prime_sq) * aa**6 / 720))
    return easting, northing


def point_segment_distance(point, start, end):
    lon_scale = math.cos(math.radians(point[1]))
    px, py = point[0] * lon_scale, point[1]
    ax, ay = start[0] * lon_scale, start[1]
    bx, by = end[0] * lon_scale, end[1]
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return math.hypot(px - ax, py - ay)
    fraction = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + fraction * dx), py - (ay + fraction * dy))


def iter_parts(geometry):
    if geometry["type"] == "LineString":
        yield geometry["coordinates"]
    elif geometry["type"] == "MultiLineString":
        yield from geometry["coordinates"]


def nearest_line(point, features):
    best = None
    for feature in features:
        for coordinates in iter_parts(feature["geometry"]):
            if len(coordinates) < 2:
                continue
            distance = min(point_segment_distance(point, a, b) for a, b in zip(coordinates, coordinates[1:]))
            if best is None or distance < best[0]:
                best = (distance, coordinates, feature["properties"])
    return best


def elevation(lon: float, lat: float) -> float:
    east, north = utm32(lon, lat)
    params = {
        "service": "WCS", "version": "2.0.1", "request": "GetCoverage", "coverageId": COVERAGE,
        "subset": [f"E({east - 10:.3f},{east + 10:.3f})", f"N({north - 10:.3f},{north + 10:.3f})"],
        "format": "image/tiff",
    }
    url = WCS + "?" + urllib.parse.urlencode(params, doseq=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        image = Image.open(io.BytesIO(response.read()))
        values = [float(value) for value in image.getdata() if float(value) > -9000]
    if not values:
        raise ValueError("DTM returned only no-data values")
    return sum(values) / len(values)


with REPORT.open(encoding="utf-8", newline="") as handle:
    report_rows = list(csv.DictReader(handle, delimiter="\t"))
with PLANTS.open(encoding="utf-8") as handle:
    plant_by_id = {str(item["properties"]["ID"]): item for item in json.load(handle)["features"]}
with RIVERS.open(encoding="utf-8") as handle:
    river_features = json.load(handle)["features"]

for row in report_rows:
    point = plant_by_id[str(row["sira_id"])]["geometry"]["coordinates"]
    distance, coords, props = nearest_line(point, river_features)
    start, end = coords[0], coords[-1]
    try:
        start_elev, end_elev = elevation(*start), elevation(*end)
        delta = start_elev - end_elev
        if abs(delta) < 1:
            orientation = "uncertain_flat_or_below_dtm_resolution"
        elif delta > 0:
            orientation = "nearest_segment_start_to_end"
        else:
            orientation = "nearest_segment_end_to_start"
        row.update({
            "nearest_dbgt_id": props.get("ID", ""),
            "nearest_dbgt_name": props.get("Nome", ""),
            "nearest_segment_distance_km": f"{distance * 111.32:.3f}",
            "segment_start_elevation_m": f"{start_elev:.1f}",
            "segment_end_elevation_m": f"{end_elev:.1f}",
            "segment_elevation_delta_m": f"{delta:.1f}",
            "segment_orientation": orientation,
            "dtm_method": "RAS DTM 10m Rev01 WCS sampled at segment endpoints",
            "downstream_path": "not_assessed",
        })
    except Exception as error:  # retain a visible, non-fatal failure state
        row.update({"segment_orientation": "not_assessed", "dtm_method": f"WCS sampling failed: {error}"})
    time.sleep(0.1)

fields = list(report_rows[0])
with REPORT.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=fields, delimiter="\t")
    writer.writeheader()
    writer.writerows(report_rows)
print(f"Enriched {len(report_rows)} screening records with DTM endpoint orientation")
