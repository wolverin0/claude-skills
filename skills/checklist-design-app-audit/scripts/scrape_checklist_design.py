#!/usr/bin/env python3
"""Scrape the public Checklist Design API into a normalized, provenance-rich dataset.

This collector uses only public endpoints referenced by the public web application.
It does not authenticate, access admin routes, or download/re-host inspiration images.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests

BASE_URL = "https://www.checklist.design"
INDEX_ENDPOINT = f"{BASE_URL}/api/checklists/grouped"
DETAIL_ENDPOINT = f"{BASE_URL}/api/checklists/by-slug"
USER_AGENT = "ChecklistDesign-AppAuditSkill/1.0 (+public read-only research)"
SCHEMA_VERSION = 1


def get_json(session: requests.Session, url: str, retries: int = 5) -> dict[str, Any]:
    error: Exception | None = None
    for attempt in range(retries):
        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict) or not payload.get("success"):
                raise RuntimeError(f"API returned unsuccessful payload for {url}")
            return payload
        except (requests.RequestException, ValueError, RuntimeError) as exc:
            error = exc
            if attempt + 1 < retries:
                time.sleep(min(8.0, 0.5 * (2**attempt)))
    raise RuntimeError(f"Failed after {retries} attempts: {url}: {error}")


def resource_type(tab_type: str | None) -> str:
    if tab_type == "inspiration":
        return "inspiration"
    if tab_type == "documentation":
        return "documentation"
    return "flow_step"


def normalize_related(row: dict[str, Any]) -> dict[str, Any]:
    related = row.get("related") or {}
    category = related.get("website_categories") or {}
    return {
        "id": related.get("id"),
        "name": related.get("name"),
        "slug": related.get("slug"),
        "category_name": category.get("name"),
        "category_slug": category.get("slug"),
        "sort_order": row.get("sort_order"),
        "source_url": (
            f"{BASE_URL}/{category.get('slug')}/{related.get('slug')}"
            if category.get("slug") and related.get("slug")
            else None
        ),
    }


def normalize_record(category: dict[str, Any], index_row: dict[str, Any], detail: dict[str, Any]) -> dict[str, Any]:
    checklist = detail["checklist"]
    category_slug = category["slug"]
    slug = checklist["slug"]
    tab_type = category.get("tab_type")
    kind = resource_type(tab_type)

    criteria = [
        {
            "id": row.get("id"),
            "title": row.get("title") or "",
            "description": row.get("description") or "",
            "suggestion": row.get("suggestion"),
            "sort_order": row.get("sort_order"),
        }
        for row in sorted(detail.get("items") or [], key=lambda x: (x.get("sort_order") or 0, x.get("id") or ""))
    ]

    resources = [
        {
            "id": row.get("id"),
            "type": kind,
            "title": row.get("title") or "",
            "description": row.get("description"),
            "image_url": row.get("image_url"),
            "sort_order": row.get("sort_order"),
            "source_page": f"{BASE_URL}/{category_slug}/{slug}",
        }
        for row in sorted(detail.get("tabs") or [], key=lambda x: (x.get("sort_order") or 0, x.get("id") or ""))
    ]

    collections = []
    for row in detail.get("collections") or []:
        collection = row.get("collection") or {}
        collections.append(
            {
                "id": collection.get("id"),
                "name": collection.get("name"),
                "slug": collection.get("slug"),
            }
        )

    cross_platform = []
    for row in detail.get("sameNameOnOtherPlatforms") or []:
        other_category = row.get("category") or {}
        cross_platform.append(
            {
                "id": row.get("id"),
                "name": row.get("name"),
                "slug": row.get("slug"),
                "category_name": other_category.get("name"),
                "category_slug": other_category.get("slug"),
                "source_url": (
                    f"{BASE_URL}/{other_category.get('slug')}/{row.get('slug')}"
                    if other_category.get("slug") and row.get("slug")
                    else None
                ),
            }
        )

    return {
        "id": checklist.get("id"),
        "name": checklist.get("name"),
        "slug": slug,
        "description": checklist.get("description") or "",
        "icon_url": checklist.get("icon_url"),
        "category": {
            "id": category.get("id"),
            "name": category.get("name"),
            "slug": category_slug,
            "tab_type": tab_type,
        },
        "sort_order": index_row.get("sort_order"),
        "homepage_pinned": bool(index_row.get("homepage_pinned")),
        "collections": collections,
        "criteria": criteria,
        "resources": resources,
        "inspiration": [row for row in resources if row["type"] == "inspiration"],
        "related": [normalize_related(row) for row in detail.get("related") or []],
        "same_name_other_platforms": cross_platform,
        "source_url": f"{BASE_URL}/{category_slug}/{slug}",
        "source_api_url": f"{DETAIL_ENDPOINT}?{urlencode({'slug': slug, 'category': category_slug})}",
    }


def build_counts(records: list[dict[str, Any]], categories: list[dict[str, Any]]) -> dict[str, Any]:
    resource_counts = {"inspiration": 0, "documentation": 0, "flow_step": 0}
    for record in records:
        for resource in record["resources"]:
            resource_counts[resource["type"]] += 1
    return {
        "categories": len(categories),
        "checklists": len(records),
        "criteria": sum(len(row["criteria"]) for row in records),
        "flow_steps": resource_counts["flow_step"],
        "audit_items": sum(len(row["criteria"]) for row in records) + resource_counts["flow_step"],
        "resources": sum(len(row["resources"]) for row in records),
        "inspiration_images": resource_counts["inspiration"],
        "documentation_images": resource_counts["documentation"],
        "flow_step_images": resource_counts["flow_step"],
        "checklists_with_inspiration": sum(bool(row["inspiration"]) for row in records),
        "by_category": {row["slug"]: row["checklist_count"] for row in categories},
    }


def validate(dataset: dict[str, Any], expected_count: int | None = None) -> list[str]:
    errors: list[str] = []
    records = dataset["checklists"]
    counts = dataset["counts"]
    category_total = sum(counts["by_category"].values())
    if counts["checklists"] != category_total:
        errors.append(f"detail count {counts['checklists']} != grouped index count {category_total}")
    if expected_count is not None and counts["checklists"] != expected_count:
        errors.append(f"checklist count {counts['checklists']} != expected {expected_count}")

    keys = [(row["category"]["slug"], row["slug"]) for row in records]
    if len(keys) != len(set(keys)):
        errors.append("duplicate category/slug keys detected")

    ids = [row["id"] for row in records]
    if len(ids) != len(set(ids)):
        errors.append("duplicate checklist IDs detected")

    for row in records:
        key = f"{row['category']['slug']}/{row['slug']}"
        has_flow_steps = any(resource["type"] == "flow_step" for resource in row["resources"])
        if not row["criteria"] and not has_flow_steps:
            errors.append(f"{key}: no criteria or flow steps")
        for criterion in row["criteria"]:
            if not criterion["title"]:
                errors.append(f"{key}: criterion without title")
        for resource in row["resources"]:
            if not resource["image_url"]:
                errors.append(f"{key}: resource without image_url")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, help="Destination JSON file")
    parser.add_argument("--delay", type=float, default=0.20, help="Delay between detail requests")
    parser.add_argument("--expected-count", type=int, default=None, help="Optional exact count assertion")
    args = parser.parse_args()

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json"})

    index = get_json(session, INDEX_ENDPOINT)
    grouped = index.get("grouped") or []
    categories: list[dict[str, Any]] = []
    records: list[dict[str, Any]] = []

    frontier: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for category in grouped:
        checklists = category.get("checklists") or []
        categories.append(
            {
                "id": category.get("id"),
                "name": category.get("name"),
                "slug": category.get("slug"),
                "tab_type": category.get("tab_type"),
                "sort_order": category.get("sort_order"),
                "checklist_count": len(checklists),
            }
        )
        frontier.extend((category, row) for row in checklists)

    total = len(frontier)
    for position, (category, row) in enumerate(frontier, start=1):
        url = f"{DETAIL_ENDPOINT}?{urlencode({'slug': row['slug'], 'category': category['slug']})}"
        detail = get_json(session, url)
        records.append(normalize_record(category, row, detail))
        print(f"[{position:03d}/{total:03d}] {category['slug']}/{row['slug']}", file=sys.stderr)
        if position < total and args.delay > 0:
            time.sleep(args.delay)

    records.sort(key=lambda row: (row["category"]["slug"], row["sort_order"] or 0, row["slug"]))
    scraped_at = datetime.now(timezone.utc).isoformat()
    dataset: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "source": {
            "name": "Checklist Design",
            "site_url": BASE_URL,
            "browse_url": f"{BASE_URL}/browse",
            "index_api_url": INDEX_ENDPOINT,
            "robots_url": f"{BASE_URL}/robots.txt",
            "terms_url": f"{BASE_URL}/terms",
            "creator": "George Hatzis",
            "scraped_at_utc": scraped_at,
            "collector": "scrape_checklist_design.py",
            "content_note": "Checklist text and inspiration URLs remain attributable to Checklist Design. Images are referenced remotely and are not republished in this dataset.",
        },
        "categories": categories,
        "checklists": records,
    }
    dataset["counts"] = build_counts(records, categories)

    canonical = json.dumps(dataset, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    dataset["source"]["content_sha256"] = hashlib.sha256(canonical).hexdigest()

    errors = validate(dataset, args.expected_count)
    dataset["validation"] = {"ok": not errors, "errors": errors}

    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"output": str(output), "counts": dataset["counts"], "validation": dataset["validation"]}, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    raise SystemExit(main())
