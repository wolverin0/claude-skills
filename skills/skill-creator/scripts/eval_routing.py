#!/usr/bin/env python3
"""Audit trigger collisions between skill descriptions.

Scores every skill's frontmatter description against realistic user prompts
with BM25 (stdlib only) and checks, for each case in a JSON file:
  - the expected skill ranks within --top-k (default 2);
  - no skill listed under "not" ranks above the expected one.
It also prints near-ties (score within --tie-ratio of the expected skill),
which are the collisions to fix by sharpening a description.

Sentences that redirect to another skill ("Not for ... (vibe-to-prod)") are
removed before scoring: they name a sibling on purpose and are not triggers.

  python eval_routing.py                       # this repo's skills + routing_cases.json
  python eval_routing.py --skills-root ~/.claude/skills --cases my_cases.json
Exit 0 when every case passes, 1 otherwise.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
STOP = set("""a an and are as at be by can do does for from has have how i if in into is it its me my
not of on or our so than that the their them then there these this to use used uses using want we what
when where which while who will with without you your it's i'm let's please""".split())
REDIRECT = re.compile(r"^(not for|not a |do not use|never on your own|explicit invocation only|heavy|start it only|"
                      r"for functional flows|to capture a workflow|fixes belong)", re.I)


def tokens(text: str) -> list[str]:
    out = []
    for t in re.findall(r"[a-z0-9]+", text.lower()):
        if t in STOP or len(t) < 2:
            continue
        for suffix in ("ing", "ies", "es", "ed", "s"):       # crude stemming, enough for overlap
            if len(t) > len(suffix) + 3 and t.endswith(suffix):
                t = t[: -len(suffix)] + ("y" if suffix == "ies" else "")
                break
        out.append(t)
    return out


def load_skills(root: Path) -> dict[str, dict]:
    skills = {}
    for md in sorted(root.rglob("SKILL.md")):
        text = md.read_text(encoding="utf-8")
        m = re.match(r"^---\r?\n(.*?)\r?\n---", text, re.S)
        if not m:
            continue
        fm = yaml.safe_load(m.group(1)) or {}
        name = str(fm.get("name") or md.parent.name)
        if name.startswith("<"):
            continue
        desc = str(fm.get("description") or "")
        kept = [s for s in re.split(r"(?<=[.;])\s+", desc) if not REDIRECT.match(s.strip())]
        skills[name] = {
            "tokens": tokens(" ".join(kept)) + tokens(name.replace("-", " ")) * 2,
            "explicit_only": fm.get("disable-model-invocation") is True,
        }
    return skills


def bm25(skills: dict[str, dict], k1: float = 1.4, b: float = 0.75):
    n = len(skills)
    avg = sum(len(s["tokens"]) for s in skills.values()) / max(n, 1)
    df = Counter(t for s in skills.values() for t in set(s["tokens"]))
    tf = {name: Counter(s["tokens"]) for name, s in skills.items()}

    def score(query: str) -> list[tuple[str, float]]:
        q = set(tokens(query))
        ranked = []
        for name, s in skills.items():
            dl = len(s["tokens"])
            total = 0.0
            for t in q:
                f = tf[name].get(t, 0)
                if f:
                    idf = math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5))
                    total += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * dl / avg))
            ranked.append((name, total))
        return sorted(ranked, key=lambda x: -x[1])

    return score


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--skills-root", type=Path, default=HERE.parent.parent, help="folder searched for SKILL.md")
    p.add_argument("--cases", type=Path, default=HERE / "routing_cases.json")
    p.add_argument("--top-k", type=int, default=2)
    p.add_argument("--tie-ratio", type=float, default=0.9)
    p.add_argument("--json", action="store_true")
    args = p.parse_args(argv)

    skills = load_skills(args.skills_root)
    cases = json.loads(args.cases.read_text(encoding="utf-8"))
    score = bm25(skills)
    results, failures = [], 0
    for case in cases:
        expect = case["expect"]
        if expect not in skills:
            results.append({"prompt": case["prompt"], "expect": expect, "status": "FAIL", "why": "expected skill not found"})
            failures += 1
            continue
        ranked = score(case["prompt"])
        names = [n for n, _ in ranked]
        rank = names.index(expect) + 1
        exp_score = dict(ranked)[expect]
        above = names[: rank - 1]
        forbidden = [n for n in above if n in case.get("not", [])]
        ties = [n for n, s in ranked if n != expect and exp_score > 0 and s >= args.tie_ratio * exp_score]
        status = "PASS" if rank <= args.top_k and not forbidden and exp_score > 0 else "FAIL"
        failures += status == "FAIL"
        results.append({"prompt": case["prompt"], "expect": expect, "rank": rank, "status": status,
                        "top": [f"{n}:{s:.2f}" for n, s in ranked[:3]], "forbidden_above": forbidden,
                        "near_ties": ties})

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            line = f"{r['status']} rank={r.get('rank', '-')} expect={r['expect']:28} top={', '.join(r.get('top', []))}"
            if r.get("forbidden_above"):
                line += f"  FORBIDDEN-ABOVE={r['forbidden_above']}"
            if r.get("near_ties"):
                line += f"  near-tie={r['near_ties']}"
            print(line + f"  | {r['prompt']}")
        collisions = Counter(tuple(sorted((r["expect"], t))) for r in results for t in r.get("near_ties", []))
        print(f"\n{len(results) - failures}/{len(results)} cases pass (top-{args.top_k}); skills scored: {len(skills)}")
        if collisions:
            print("near-tie pairs (sharpen one description):")
            for (a, b), c in collisions.most_common():
                print(f"  {a} <-> {b}  x{c}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
