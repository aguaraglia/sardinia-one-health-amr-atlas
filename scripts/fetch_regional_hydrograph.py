#!/usr/bin/env python3
"""Fetch the official Regione Sardegna Strahler hydrography into private storage.

The downloaded snapshot supports internal network-quality and routing research.
It is intentionally not placed in ``public/`` and does not establish a wastewater
outfall or authorised receiving water body.
"""
from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
WFS = "https://webgis.regione.sardegna.it/geoserver/dbu/wfs"
TYPENAME = "dbu:elemento_idrico_strahler"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output = args.output or ROOT / "private" / "hydrology" / f"elemento_idrico_strahler_{date.today().isoformat()}.geojson"
    if not output.is_absolute():
        output = ROOT / output
    params = {
        "service": "WFS", "version": "2.0.0", "request": "GetFeature",
        "typeNames": TYPENAME, "count": 300000,
        "outputFormat": "application/json", "srsName": "EPSG:4326",
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".part")
    with urlopen(WFS + "?" + urlencode(params), timeout=600) as response, temporary.open("wb") as handle:
        while block := response.read(1024 * 1024):
            handle.write(block)
    temporary.replace(output)
    print(f"Downloaded {output.stat().st_size} bytes to {output}")
    print(f"Source: {WFS}; typeNames={TYPENAME}")


if __name__ == "__main__":
    main()