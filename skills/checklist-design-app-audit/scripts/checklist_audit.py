#!/usr/bin/env python3
"""Search Checklist Design data and generate bounded app-audit packets."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATA = SCRIPT_DIR.parent / "references" / "checklists.json"
STATUSES = ["pass", "partial", "fail", "not_applicable", "not_tested"]


def load_data(path: str | Path) -> dict[str, Any]:
    data_path = Path(path).expanduser().resolve()
    data = json.loads(data_path.read_text(encoding="utf-8"))
    validation = data.get("validation") or {}
    if not validation.get("ok"):
        raise RuntimeError(f"Dataset validation failed: {validation.get('errors')}")
    return data


def record_key(record: dict[str, Any]) -> str:
    return f"{record['category']['slug']}/{record['slug']}"


def normalized_terms(text: str) -> list[str]:
    return [term for term in re.findall(r"[a-z0-9]+", text.lower()) if len(term) > 1]


def searchable_text(record: dict[str, Any]) -> str:
    chunks = [
        record_key(record),
        record.get("name") or "",
        record.get("description") or "",
        " ".join(c.get("name") or "" for c in record.get("collections") or []),
        " ".join(i.get("title") or "" for i in record.get("criteria") or []),
        " ".join(r.get("title") or "" for r in record.get("resources") or []),
    ]
    return " ".join(chunks).lower()


def rank_record(record: dict[str, Any], query: str) -> int:
    q = query.strip().lower()
    if not q:
        return 1
    key = record_key(record).lower()
    name = (record.get("name") or "").lower()
    slug = (record.get("slug") or "").lower()
    haystack = searchable_text(record)
    score = 0
    if q == key:
        score += 1000
    if q == name or q == slug:
        score += 500
    if q in key:
        score += 150
    if q in name:
        score += 120
    if q in (record.get("description") or "").lower():
        score += 40
    for term in normalized_terms(q):
        if term in name:
            score += 30
        if term in key:
            score += 20
        score += min(haystack.count(term), 5) * 4
    return score


def select_records(data: dict[str, Any], keys: list[str]) -> list[dict[str, Any]]:
    by_key = {record_key(row): row for row in data["checklists"]}
    selected = []
    missing = []
    for key in keys:
        cleaned = key.strip().strip("/")
        if not cleaned:
            continue
        record = by_key.get(cleaned)
        if record is None:
            missing.append(cleaned)
        else:
            selected.append(record)
    if missing:
        raise KeyError(f"Unknown checklist key(s): {', '.join(missing)}")
    return selected


def audit_items(record: dict[str, Any]) -> list[dict[str, Any]]:
    if record.get("criteria"):
        return [
            {
                "id": row.get("id"),
                "title": row.get("title") or "",
                "description": row.get("description") or "",
                "suggestion": row.get("suggestion"),
                "source_kind": "criterion",
            }
            for row in record["criteria"]
        ]
    return [
        {
            "id": row.get("id"),
            "title": row.get("title") or "",
            "description": row.get("description") or "",
            "suggestion": None,
            "source_kind": "flow_step",
            "reference_image_url": row.get("image_url"),
        }
        for row in record.get("resources") or []
        if row.get("type") == "flow_step"
    ]


def markdown_packet(data: dict[str, Any], records: list[dict[str, Any]], app_name: str, target: str) -> str:
    source = data["source"]
    lines = [
        f"# Checklist Design audit packet — {app_name}",
        "",
        f"- Target: {target or '[record target URL/build]'}",
        f"- Source: [Checklist Design]({source['site_url']})",
        f"- Dataset captured: `{source['scraped_at_utc']}`",
        f"- Dataset SHA-256: `{source['content_sha256']}`",
        "- Audit statuses: `pass`, `partial`, `fail`, `not_applicable`, `not_tested`",
        "- Evidence rule: every pass/partial/fail requires a URL or route, viewport, and screenshot/DOM/console evidence.",
        "- Inspiration rule: examples are references, not requirements; do not mark compliance solely by visual similarity.",
        "",
        "## Scope",
        "",
    ]
    for record in records:
        lines.append(f"- [{record_key(record)}]({record['source_url']}) — {record['name']}")
    lines.extend(["", "## Audit", ""])

    sequence = 0
    for record in records:
        lines.extend(
            [
                f"### {record['name']} — `{record_key(record)}`",
                "",
                record.get("description") or "_No source description._",
                "",
                f"Source: {record['source_url']}",
                "",
            ]
        )
        for item in audit_items(record):
            sequence += 1
            lines.append(f"#### AUD-{sequence:03d} — {item['title']}")
            lines.append("")
            lines.append(item.get("description") or "_No source description._")
            if item.get("suggestion"):
                lines.append(f"\nSource suggestion: {item['suggestion']}")
            if item.get("reference_image_url"):
                lines.append(f"\nFlow reference: {item['reference_image_url']}")
            lines.extend(
                [
                    "",
                    "- Status: `not_tested`",
                    "- Impact: `unrated`",
                    "- Evidence: _required_",
                    "- Finding: _pending_",
                    "- Recommended change: _pending_",
                    "",
                ]
            )

        inspirations = record.get("inspiration") or []
        docs = [row for row in record.get("resources") or [] if row.get("type") == "documentation"]
        if inspirations:
            lines.extend(["#### Inspiration references", ""])
            for row in inspirations:
                title = row.get("title") or "Example"
                desc = f" — {row['description']}" if row.get("description") else ""
                lines.append(f"- [{title}]({row['image_url']}){desc}")
            lines.append("")
        if docs:
            lines.extend(["#### Documentation references", ""])
            for row in docs:
                title = row.get("title") or "Example"
                desc = f" — {row['description']}" if row.get("description") else ""
                lines.append(f"- [{title}]({row['image_url']}){desc}")
            lines.append("")

    lines.extend(
        [
            "## Scorecard",
            "",
            "- Applicable tested items: `0`",
            "- Passed: `0`",
            "- Partial: `0`",
            "- Failed: `0`",
            "- Not applicable: `0`",
            "- Not tested: `0`",
            "- Compliance score: `N/A` (compute as pass + 0.5×partial over applicable tested items)",
            "- Blockers: _pending_",
            "- Highest-leverage improvements: _pending_",
            "",
            "## Provenance and limitations",
            "",
            "Checklist wording and reference URLs are attributed to Checklist Design. No ownership or redistribution license is assumed. The source terms route was unavailable at capture time. Inspiration images remain remote and are not bundled in this packet.",
            "",
        ]
    )
    return "\n".join(lines)


def json_packet(data: dict[str, Any], records: list[dict[str, Any]], app_name: str, target: str) -> dict[str, Any]:
    audits = []
    sequence = 0
    for record in records:
        items = []
        for item in audit_items(record):
            sequence += 1
            items.append(
                {
                    "audit_id": f"AUD-{sequence:03d}",
                    **item,
                    "status": "not_tested",
                    "impact": "unrated",
                    "evidence": [],
                    "finding": "",
                    "recommended_change": "",
                }
            )
        audits.append(
            {
                "key": record_key(record),
                "name": record["name"],
                "description": record.get("description") or "",
                "source_url": record["source_url"],
                "items": items,
                "inspiration": record.get("inspiration") or [],
                "documentation": [r for r in record.get("resources") or [] if r.get("type") == "documentation"],
            }
        )
    return {
        "schema_version": 1,
        "app_name": app_name,
        "target": target,
        "dataset": {
            "source": data["source"]["site_url"],
            "scraped_at_utc": data["source"]["scraped_at_utc"],
            "content_sha256": data["source"]["content_sha256"],
        },
        "allowed_statuses": STATUSES,
        "audits": audits,
    }


def markdown_inventory(data: dict[str, Any], app_name: str, target: str) -> str:
    source = data["source"]
    lines = [
        f"# Checklist Design applicability inventory — {app_name}",
        "",
        f"- Target: {target or '[record target URL/build]'}",
        f"- Dataset captured: `{source['scraped_at_utc']}`",
        f"- Dataset SHA-256: `{source['content_sha256']}`",
        "- Allowed decisions: `applicable`, `not_applicable`, `needs_evidence`",
        "- Rule: every checklist must receive a decision and rationale before detailed auditing.",
        "",
    ]
    current_category = None
    for record in data["checklists"]:
        category = record["category"]["name"]
        if category != current_category:
            lines.extend([f"## {category}", ""])
            current_category = category
        lines.extend(
            [
                f"### `{record_key(record)}` — {record['name']}",
                "",
                f"- Decision: `needs_evidence`",
                f"- Audit items: `{len(audit_items(record))}`",
                f"- Inspiration examples: `{len(record.get('inspiration') or [])}`",
                f"- Relevant target surfaces: _pending_",
                f"- Rationale/evidence: _pending_",
                f"- Source: {record['source_url']}",
                "",
            ]
        )
    return "\n".join(lines)


def json_inventory(data: dict[str, Any], app_name: str, target: str) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "app_name": app_name,
        "target": target,
        "dataset": {
            "source": data["source"]["site_url"],
            "scraped_at_utc": data["source"]["scraped_at_utc"],
            "content_sha256": data["source"]["content_sha256"],
        },
        "allowed_decisions": ["applicable", "not_applicable", "needs_evidence"],
        "checklists": [
            {
                "key": record_key(record),
                "category": record["category"]["name"],
                "name": record["name"],
                "description": record.get("description") or "",
                "audit_item_count": len(audit_items(record)),
                "inspiration_count": len(record.get("inspiration") or []),
                "source_url": record["source_url"],
                "decision": "needs_evidence",
                "relevant_target_surfaces": [],
                "rationale_evidence": "",
            }
            for record in data["checklists"]
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", default=str(DEFAULT_DATA))
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("stats")

    list_parser = sub.add_parser("list")
    list_parser.add_argument("--category")

    search_parser = sub.add_parser("search")
    search_parser.add_argument("query")
    search_parser.add_argument("--category")
    search_parser.add_argument("--limit", type=int, default=10)

    show_parser = sub.add_parser("show")
    show_parser.add_argument("key")
    show_parser.add_argument("--format", choices=["markdown", "json"], default="markdown")

    inventory_parser = sub.add_parser("inventory")
    inventory_parser.add_argument("--app-name", required=True)
    inventory_parser.add_argument("--target", default="")
    inventory_parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    inventory_parser.add_argument("--output")

    packet_parser = sub.add_parser("packet")
    packet_parser.add_argument("--keys", required=True, help="Comma-separated category/slug keys")
    packet_parser.add_argument("--app-name", required=True)
    packet_parser.add_argument("--target", default="")
    packet_parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    packet_parser.add_argument("--output")

    args = parser.parse_args()
    data = load_data(args.data)

    if args.command == "stats":
        print(json.dumps({"source": data["source"], "counts": data["counts"], "validation": data["validation"]}, indent=2))
        return 0

    if args.command == "list":
        rows = [row for row in data["checklists"] if not args.category or row["category"]["slug"] == args.category]
        for row in rows:
            print(f"{record_key(row)}\t{row['name']}\titems={len(audit_items(row))}\tinspiration={len(row.get('inspiration') or [])}")
        return 0

    if args.command == "search":
        rows = [row for row in data["checklists"] if not args.category or row["category"]["slug"] == args.category]
        ranked = [(rank_record(row, args.query), row) for row in rows]
        ranked = [(score, row) for score, row in ranked if score > 0]
        ranked.sort(key=lambda pair: (-pair[0], record_key(pair[1])))
        for score, row in ranked[: args.limit]:
            print(f"{record_key(row)}\t{row['name']}\tscore={score}\titems={len(audit_items(row))}\tinspiration={len(row.get('inspiration') or [])}")
        return 0

    if args.command == "show":
        record = select_records(data, [args.key])[0]
        if args.format == "json":
            print(json.dumps(record, ensure_ascii=False, indent=2))
        else:
            print(markdown_packet(data, [record], record["name"], record["source_url"]))
        return 0

    if args.command == "inventory":
        if args.format == "json":
            content = json.dumps(json_inventory(data, args.app_name, args.target), ensure_ascii=False, indent=2) + "\n"
        else:
            content = markdown_inventory(data, args.app_name, args.target) + "\n"
        if args.output:
            output = Path(args.output).expanduser().resolve()
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(content, encoding="utf-8")
            print(str(output))
        else:
            sys.stdout.write(content)
        return 0

    if args.command == "packet":
        records = select_records(data, args.keys.split(","))
        if args.format == "json":
            content = json.dumps(json_packet(data, records, args.app_name, args.target), ensure_ascii=False, indent=2) + "\n"
        else:
            content = markdown_packet(data, records, args.app_name, args.target) + "\n"
        if args.output:
            output = Path(args.output).expanduser().resolve()
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(content, encoding="utf-8")
            print(str(output))
        else:
            sys.stdout.write(content)
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
