#!/usr/bin/env python3
"""
Quick validation script for skills - minimal version
"""

import sys
import re
import yaml
from pathlib import Path

# Agent Skills spec (agentskills.io): the only keys claude.ai uploads, the
# Skills API and package_skill.py accept.
SPEC_PROPERTIES = {'name', 'description', 'license', 'compatibility', 'allowed-tools', 'metadata'}

# Claude Code frontmatter reference (code.claude.com/docs/en/skills). Claude Code
# acts on them; Codex 0.171 loads a skill carrying them and ignores them.
CLAUDE_CODE_PROPERTIES = {
    'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation',
    'user-invocable', 'disallowed-tools', 'model', 'effort', 'context', 'agent',
    'background', 'hooks', 'paths', 'shell',
}


def validate_skill(skill_path, portable=False):
    """Basic validation of a skill.

    portable=True accepts only the Agent Skills spec keys (packaging/upload);
    the default also accepts Claude Code extension keys and names them.
    """
    skill_path = Path(skill_path)

    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    # Read and validate frontmatter
    content = skill_md.read_text(encoding='utf-8')
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter_text = match.group(1)

    # Parse YAML frontmatter
    try:
        frontmatter = yaml.safe_load(frontmatter_text)
        if not isinstance(frontmatter, dict):
            return False, "Frontmatter must be a YAML dictionary"
    except yaml.YAMLError as e:
        return False, f"Invalid YAML in frontmatter: {e}"

    allowed_properties = SPEC_PROPERTIES if portable else SPEC_PROPERTIES | CLAUDE_CODE_PROPERTIES

    # Check for unexpected properties
    unexpected_keys = set(frontmatter.keys()) - allowed_properties
    if unexpected_keys:
        return False, (
            f"Unexpected key(s) in SKILL.md frontmatter: {', '.join(sorted(unexpected_keys))}. "
            f"Allowed properties are: {', '.join(sorted(allowed_properties))}"
        )

    # Check required fields
    if 'name' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description' not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    # Extract name for validation
    name = frontmatter.get('name', '')
    if not isinstance(name, str):
        return False, f"Name must be a string, got {type(name).__name__}"
    name = name.strip()
    if name:
        # Check naming convention (hyphen-case)
        if not re.match(r'^[a-z0-9-]+$', name):
            return False, f"Name '{name}' should be hyphen-case (lowercase letters, digits, and hyphens only)"
        if name.startswith('-') or name.endswith('-') or '--' in name:
            return False, f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
        if len(name) > 64:
            return False, f"Name is too long ({len(name)} characters). Maximum is 64 characters."

    # Extract and validate description
    description = frontmatter.get('description', '')
    if not isinstance(description, str):
        return False, f"Description must be a string, got {type(description).__name__}"
    description = description.strip()
    if description:
        if '<' in description or '>' in description:
            return False, "Description cannot contain angle brackets (< or >)"
        if len(description) > 1024:
            return False, f"Description is too long ({len(description)} characters). Maximum is 1024 characters."

    claude_code_keys = sorted(set(frontmatter.keys()) & CLAUDE_CODE_PROPERTIES)
    if claude_code_keys:
        return True, (
            "Skill is valid! Note: Claude Code-only key(s) "
            f"{', '.join(claude_code_keys)}; Codex ignores them and "
            "claude.ai upload / package_skill.py reject them."
        )
    return True, "Skill is valid!"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        sys.exit(1)

    valid, message = validate_skill(sys.argv[1])
    print(message)
    sys.exit(0 if valid else 1)
