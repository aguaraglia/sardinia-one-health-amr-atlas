#!/usr/bin/env python3
"""Build a local, reviewable source archive for a future GitHub/Zenodo release.

The archive is written under ``private/release`` and deliberately does not create
a Git tag, GitHub Release, Zenodo draft, or DOI. Git archive includes tracked
files only, so ignored private datasets cannot enter the package.
"""
from __future__ import annotations

import argparse
import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def command(*args: str) -> str:
    return subprocess.check_output(args, cwd=ROOT, text=True).strip()


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--revision", default="HEAD")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "private" / "release")
    args = parser.parse_args()
    output_dir = args.output_dir if args.output_dir.is_absolute() else ROOT / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    revision = command("git", "rev-parse", args.revision)
    archive = output_dir / f"sardinia-one-health-amr-atlas-v{args.version}.zip"
    subprocess.run(["git", "archive", "--format=zip", f"--output={archive}", revision], cwd=ROOT, check=True)
    members = command("git", "archive", "--format=tar", revision, "|", "tar", "-tf") if False else []
    # Validate repository paths rather than the ZIP implementation's listing.
    tracked = command("git", "ls-tree", "-r", "--name-only", revision).splitlines()
    disallowed = [name for name in tracked if name.startswith(("private/", "raw/", "reports/local/"))]
    if disallowed:
        raise SystemExit(f"Release revision contains disallowed paths: {disallowed}")
    receipt = output_dir / f"sardinia-one-health-amr-atlas-v{args.version}.sha256.txt"
    receipt.write_text(
        f"sha256  {checksum(archive)}\nbytes   {archive.stat().st_size}\nrevision {revision}\nfiles    {len(tracked)}\n",
        encoding="utf-8",
    )
    print(receipt.read_text(encoding="utf-8"), end="")


if __name__ == "__main__":
    main()