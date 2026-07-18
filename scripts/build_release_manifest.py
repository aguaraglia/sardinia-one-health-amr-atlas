#!/usr/bin/env python3
"""Create a checksum manifest for a reviewable GitHub/Zenodo release draft.

The script only inventories files tracked by Git. It deliberately does not create a
release archive, tag, GitHub Release, Zenodo draft, or DOI.
"""
from __future__ import annotations

import argparse
import hashlib
import subprocess
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "metadata" / "RELEASE_MANIFEST.tsv"


def git_value(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--date", default=date.today().isoformat())
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    tracked = git_value("ls-files").splitlines()
    rows: list[tuple[str, str, int]] = []
    for relative in tracked:
        if relative == "metadata/RELEASE_MANIFEST.tsv":
            continue
        path = ROOT / relative
        if not path.is_file():
            raise SystemExit(f"Tracked file missing: {relative}")
        rows.append((relative.replace("\\", "/"), sha256(path), path.stat().st_size))

    output = args.output if args.output.is_absolute() else ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"release_version\t{args.version}",
        f"release_date\t{args.date}",
        f"source_commit\t{git_value('rev-parse', 'HEAD')}",
        "path\tsha256\tbytes",
    ]
    lines.extend(f"{relative}\t{digest}\t{size}" for relative, digest, size in rows)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} checksums to {output}")


if __name__ == "__main__":
    main()