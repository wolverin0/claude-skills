#!/usr/bin/env python3
"""Compare repo skill packages with installed provider skill roots.

Read-only: it never writes. To install or update copies use
tools/install_skills.py (profiles, --dry-run, backups outside the skill root).
"""

from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path


PROVIDER_ROOTS = {
    "claude": Path.home() / ".claude" / "skills",
    "codex": Path.home() / ".codex" / "skills",
}


@dataclass(frozen=True)
class Skill:
    name: str
    path: Path
    digest: str


def file_digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def skill_digest(skill_dir: Path) -> str:
    h = hashlib.sha256()
    for path in sorted(p for p in skill_dir.rglob("*") if p.is_file()):
        if any(part in {".git", "__pycache__", ".pytest_cache"} for part in path.parts):
            continue
        rel = path.relative_to(skill_dir).as_posix()
        h.update(rel.encode("utf-8"))
        h.update(b"\0")
        h.update(file_digest(path).encode("ascii"))
        h.update(b"\0")
    return h.hexdigest()


def discover_repo_skills(repo_root: Path) -> dict[str, Skill]:
    skills_root = repo_root / "skills"
    found: dict[str, Skill] = {}
    for marker in skills_root.rglob("SKILL.md"):
        skill_dir = marker.parent
        name = skill_dir.name
        found[name] = Skill(name=name, path=skill_dir, digest=skill_digest(skill_dir))
    return dict(sorted(found.items()))


def installed_digest(root: Path, name: str) -> str | None:
    skill_dir = root / name
    if not (skill_dir / "SKILL.md").exists():
        return None
    return skill_digest(skill_dir)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="repo root")
    parser.add_argument(
        "--target",
        choices=[*PROVIDER_ROOTS.keys(), "all"],
        default="all",
        help="installed skill root to compare",
    )
    parser.add_argument(
        "--skill",
        action="append",
        default=[],
        help="skill name to include; repeat for multiple skills",
    )
    parser.add_argument("--json", action="store_true", help="print JSON")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = args.repo.resolve()
    repo_skills = discover_repo_skills(repo_root)
    if args.skill:
        wanted = set(args.skill)
        repo_skills = {k: v for k, v in repo_skills.items() if k in wanted}

    targets = PROVIDER_ROOTS if args.target == "all" else {args.target: PROVIDER_ROOTS[args.target]}
    rows = []

    for name, skill in repo_skills.items():
        for provider, root in targets.items():
            installed = installed_digest(root, name)
            if installed is None:
                status = "missing"
            elif installed == skill.digest:
                status = "same"
            else:
                status = "different"

            rows.append(
                {
                    "skill": name,
                    "provider": provider,
                    "status": status,
                    "repo_digest": skill.digest[:12],
                    "installed_digest": installed[:12] if installed else None,
                    "repo_path": str(skill.path.relative_to(repo_root)),
                    "provider_root": str(root),
                }
            )

    if args.json:
        print(json.dumps(rows, indent=2))
    else:
        print(f"{'skill':32} {'provider':8} {'status':10} {'repo':12} {'installed':12}")
        for row in rows:
            print(
                f"{row['skill'][:32]:32} {row['provider']:8} {row['status']:10} "
                f"{row['repo_digest']:12} {row['installed_digest'] or '-':12}"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
