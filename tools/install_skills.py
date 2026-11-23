#!/usr/bin/env python3
"""Install repo skills into provider skill roots by profile, and find orphans.

  python tools/install_skills.py --profile audit --target all --dry-run
  python tools/install_skills.py --profile ship --target claude
  python tools/install_skills.py --prune-orphans --dry-run

Profiles and Claude-only extras live in tools/skill-profiles.json; retired
skill names in tools/retired-skills.txt. Targets: claude (~/.claude/skills),
codex (~/.codex/skills). Copy mode backs up a changed installed copy to
<provider-home>/_backup_sync/<timestamp>/ -- outside the skill root, because
Codex also loads SKILL.md files nested under a skill root. --symlink links the
installed folder to the repo instead of copying.

--prune-orphans scans ~/.claude/skills, ~/.codex/skills and ~/.agents/skills
for retired skill folders and for backup/archive folders that hide SKILL.md
files inside a skill root. With --dry-run it only reports; otherwise it needs
--yes and moves each orphan to <provider-home>/_backup_sync/<timestamp>/pruned/
(nothing is deleted).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "skills" / "skill-creator" / "scripts"))
from compare_installed_skills import discover_repo_skills, skill_digest  # noqa: E402

PROVIDERS = {"claude": ".claude", "codex": ".codex"}
SCAN_HOMES = (".claude", ".codex", ".agents")   # every skill root a provider reads
NESTED_ORPHAN_DIRS = ("_backup_sync", "_archive")
IGNORE = shutil.ignore_patterns("__pycache__", "*.pyc", ".pytest_cache")


def load_profiles() -> dict:
    return json.loads((REPO / "tools" / "skill-profiles.json").read_text(encoding="utf-8"))


def load_retired() -> dict[str, str]:
    retired = {}
    for line in (REPO / "tools" / "retired-skills.txt").read_text(encoding="utf-8").splitlines():
        name, _, reason = line.partition("#")
        name = name.strip()
        if name:
            retired[name] = reason.strip() or "retired"
    return retired


def resolve_profile(name: str, profiles: dict, repo_skills: dict) -> list[str]:
    wanted = profiles["profiles"].get(name)
    if wanted is None:
        raise SystemExit(f"unknown profile {name!r}; choose from {', '.join(profiles['profiles'])}")
    if wanted == "*":
        return sorted(repo_skills)
    missing = [s for s in wanted if s not in repo_skills]
    if missing:
        raise SystemExit(f"profile {name!r} names skills not in the repo: {', '.join(missing)}")
    return list(wanted)


def stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def tree_digest(path: Path) -> str | None:
    if path.is_symlink() or not path.exists():
        return None
    return skill_digest(path) if path.is_dir() else hashlib.sha256(path.read_bytes()).hexdigest()


def installed_only(src: Path, dest: Path) -> list[str]:
    """Files present in the installed folder but not in the repo copy (lost from the live skill on update)."""
    if not (src.is_dir() and dest.is_dir()) or dest.is_symlink():
        return []
    rel = lambda root: {p.relative_to(root).as_posix() for p in root.rglob("*")
                        if p.is_file() and "__pycache__" not in p.parts}
    return sorted(rel(dest) - rel(src))


def install_item(src: Path, dest: Path, backup_root: Path, mode: str, dry: bool) -> str:
    """Install one skill folder or extra file. Returns the action taken (or planned)."""
    if mode == "symlink":
        if dest.is_symlink() and Path(os.readlink(dest)) == src:
            return "same (link)"
        action = "relink" if dest.exists() or dest.is_symlink() else "link"
    else:
        if dest.is_symlink():
            action = "replace link"
        elif not dest.exists():
            action = "install"
        elif tree_digest(dest) == tree_digest(src):
            return "same"
        else:
            action = "update (backup)"
    extra = installed_only(src, dest)
    if extra:
        # The whole installed folder moves to backup, so these leave the live skill.
        shown = ", ".join(extra[:3]) + (" ..." if len(extra) > 3 else "")
        action += f"; {len(extra)} installed-only file(s) move to backup: {shown}"
    if dry:
        return action
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_symlink():
        dest.unlink()
    elif dest.exists():
        backup = backup_root / dest.parent.name / dest.name
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(dest), str(backup))
    if mode == "symlink":
        try:
            os.symlink(src, dest, target_is_directory=src.is_dir())
        except OSError as exc:  # Windows without Developer Mode
            raise SystemExit(f"cannot create symlink {dest}: {exc}; use copy mode")
    elif src.is_dir():
        shutil.copytree(src, dest, ignore=IGNORE)
    else:
        shutil.copy2(src, dest)
    return action


def cmd_install(args, home: Path) -> int:
    profiles = load_profiles()
    repo_skills = discover_repo_skills(REPO)
    names = resolve_profile(args.profile, profiles, repo_skills)
    targets = list(PROVIDERS) if args.target == "all" else [args.target]
    ts = stamp()
    mode = "symlink" if args.symlink else "copy"
    print(f"{'DRY RUN: ' if args.dry_run else ''}profile={args.profile} target={args.target} mode={mode}")
    print(f"{'item':40} {'provider':8} action")
    for provider in targets:
        phome = home / PROVIDERS[provider]
        backup_root = phome / "_backup_sync" / ts
        for name in names:
            action = install_item(repo_skills[name].path, phome / "skills" / name, backup_root, mode, args.dry_run)
            print(f"{name:40} {provider:8} {action}")
            if provider != "claude":
                continue
            for extra in profiles.get("claude_extras", {}).get(name, []):
                src = REPO / extra
                action = install_item(src, phome / extra, backup_root, mode, args.dry_run)
                print(f"{extra:40} {provider:8} {action}")
    if not args.dry_run:
        print(f"backups (if any): <provider-home>/_backup_sync/{ts}/")
    return 0


def find_orphans(home: Path) -> list[tuple[Path, str]]:
    retired = load_retired()
    found = []
    for sub in SCAN_HOMES:
        root = home / sub / "skills"
        if not root.is_dir():
            continue
        for entry in sorted(root.iterdir()):
            if not entry.is_dir():
                continue
            if entry.name in retired and (entry / "SKILL.md").exists():
                found.append((entry, f"retired: {retired[entry.name]}"))
            elif entry.name in NESTED_ORPHAN_DIRS:
                nested = sorted(p.parent.relative_to(entry).as_posix() for p in entry.rglob("SKILL.md"))
                if nested:
                    sample = ", ".join(nested[:3]) + (" ..." if len(nested) > 3 else "")
                    found.append((entry, f"{len(nested)} SKILL.md nested inside a skill root ({sample})"))
    return found


def cmd_prune(args, home: Path) -> int:
    orphans = find_orphans(home)
    print(f"{'DRY RUN: ' if args.dry_run else ''}orphans found: {len(orphans)}")
    for path, reason in orphans:
        print(f"  {display(path, home)}  <- {reason}")
    if args.dry_run or not orphans:
        return 0
    if not args.yes:
        print("refusing to move orphans without --yes (run with --dry-run first)")
        return 2
    ts = stamp()
    for path, _ in orphans:
        provider_home = path.parent.parent          # <home>/.claude, .codex or .agents
        dest = provider_home / "_backup_sync" / ts / "pruned" / path.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(path), str(dest))
        print(f"  moved {display(path, home)} -> {display(dest, home)}")
    return 0


def display(path: Path, home: Path) -> str:
    try:
        return "~/" + path.relative_to(home).as_posix()
    except ValueError:
        return str(path)


def parse_args(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--profile", help="ship | audit | build | workflow | all (see tools/skill-profiles.json)")
    p.add_argument("--target", choices=[*PROVIDERS, "all"], default="all")
    p.add_argument("--symlink", action="store_true", help="link installed folders to the repo instead of copying")
    p.add_argument("--prune-orphans", action="store_true", help="find retired or nested-backup skills in provider roots")
    p.add_argument("--dry-run", action="store_true", help="report what would change; write nothing")
    p.add_argument("--yes", action="store_true", help="confirm moving orphans (prune without --dry-run)")
    p.add_argument("--home", type=Path, default=Path.home(), help="home directory holding .claude/.codex/.agents (tests)")
    args = p.parse_args(argv)
    if not args.profile and not args.prune_orphans:
        p.error("give --profile and/or --prune-orphans")
    return args


def main(argv=None) -> int:
    args = parse_args(argv)
    home = args.home.resolve()
    rc = 0
    if args.profile:
        rc = cmd_install(args, home)
    if args.prune_orphans:
        rc = rc or cmd_prune(args, home)
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
