#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path("/Volumes/SSDExterno/Desenvolvimento/Leggau")
CATALOG_PATH = ROOT / "mobile/Assets/StreamingAssets/config/gau-variants.json"


def main() -> int:
    data = json.loads(CATALOG_PATH.read_text())
    variants = data.get("variants", [])
    if not variants:
        raise SystemExit("gau-variants.json has no variants")

    missing = []
    for item in variants:
        variant_id = item["id"]
        for field in ("blendPath", "fbxPath", "previewPath"):
            path = ROOT / item[field]
            if not path.exists():
                missing.append((variant_id, field, str(path)))

    if missing:
        for variant_id, field, path in missing:
            print(f"missing {field} for {variant_id}: {path}")
        raise SystemExit(1)

    print(f"gau runtime catalog ok: {len(variants)} variants validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
