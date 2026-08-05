#!/usr/bin/env python3
"""
Ledger utilities for anysite-monitor: URL normalization, content hashing,
diffing fetched items against a seen-ledger, and applying the rolling window.

This exists so every scheduled run does the diff the SAME deterministic way
instead of re-deriving it. It is pure-stdlib and side-effect free — it reads
JSON, writes JSON, touches no network and no storage. The skill is responsible
for loading/saving the ledger from the chosen backend.

CLI:
  # Diff fetched items against a ledger, get new/changed + the updated ledger:
  python ledger.py diff --ledger ledger.json --items items.json \
      --today 2026-08-11 --retention-days 45 [--baseline]

items.json is a list of objects, each:
  {"fingerprint": "job:apify:4021847", "content": "<optional text to hash>",
   "label": "Senior ML Engineer", "url": "...", "meta": {...}}

Output (stdout, JSON):
  {"baseline": false, "new": [...], "changed": [...],
   "counts": {"new": 2, "changed": 1, "seen": 37},
   "ledger": { ...updated ledger... }}
"""
import argparse
import hashlib
import json
import sys
from datetime import date, timedelta
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

_TRACKING_PREFIXES = ("utm_", "fbclid", "gclid", "mc_", "ref", "ref_src",
                      "spm", "igshid", "si")


def normalize_url(url: str) -> str:
    """Lowercase host, strip tracking params + fragment, drop trailing slash."""
    if not url:
        return url
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return url.strip()
    host = parts.netloc.lower()
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=False)
             if not any(k.lower() == p or k.lower().startswith(p)
                        for p in _TRACKING_PREFIXES)]
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), host, path,
                       urlencode(sorted(query)), ""))


def content_hash(text: str) -> str:
    """Short stable digest of meaningful content (whitespace-collapsed)."""
    norm = " ".join((text or "").split())
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()[:8]


def diff(ledger: dict, items: list, today: str, retention_days: int,
         baseline: bool):
    items_map = dict(ledger.get("items", {})) if ledger else {}
    is_baseline = baseline or not items_map
    new, changed = [], []
    seen_count = 0
    seeded = 0

    for it in items:
        fp = it.get("fingerprint")
        if not fp:
            continue
        h = content_hash(it["content"]) if it.get("content") is not None else None
        prior = items_map.get(fp)
        if prior is None:
            if is_baseline:
                seeded += 1
            else:
                new.append(it)
        elif h is not None and prior.get("h") != h:
            # includes the first time hashing is enabled for an existing item
            changed.append({**it, "old_hash": prior.get("h"), "new_hash": h})
        else:
            seen_count += 1
        entry = {"s": today}
        if h is not None:
            entry["h"] = h
        items_map[fp] = entry

    # rolling window
    cutoff = (date.fromisoformat(today) - timedelta(days=retention_days)).isoformat()
    items_map = {k: v for k, v in items_map.items() if v.get("s", today) >= cutoff}

    out_ledger = {
        "ledger_version": 1,
        "monitor_id": (ledger or {}).get("monitor_id"),
        "last_run": today,
        "last_ok_run": (ledger or {}).get("last_ok_run"),
        "runs": ((ledger or {}).get("runs", 0)) + 1,
        "items": items_map,
    }
    return {
        "baseline": is_baseline,
        "new": new,
        "changed": changed,
        "counts": {"new": len(new), "changed": len(changed), "seen": seen_count,
                   "seeded": seeded, "tracking": len(items_map)},
        "ledger": out_ledger,
    }


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("diff")
    d.add_argument("--ledger", help="path to ledger JSON (optional)")
    d.add_argument("--items", required=True, help="path to fetched items JSON")
    d.add_argument("--today", required=True, help="YYYY-MM-DD")
    d.add_argument("--retention-days", type=int, default=45)
    d.add_argument("--baseline", action="store_true")
    args = ap.parse_args()

    ledger = {}
    if args.ledger:
        try:
            with open(args.ledger) as f:
                ledger = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            ledger = {}
    with open(args.items) as f:
        items = json.load(f)

    result = diff(ledger, items, args.today, args.retention_days, args.baseline)
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
