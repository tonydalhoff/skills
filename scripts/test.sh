#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_HOME="$(mktemp -d "${TMPDIR:-/tmp}/skills-install-test.XXXXXX")"
TEST_SHADOW="$REPO_ROOT/skills/ask-matt"

[ ! -e "$TEST_SHADOW" ] || {
  printf 'test fixture path already exists: %s\n' "$TEST_SHADOW" >&2
  exit 1
}

cleanup() {
  rm -rf "$TEST_HOME" "$TEST_SHADOW"
}
trap cleanup EXIT

mkdir -p "$TEST_SHADOW"
printf '%s\n' '---' 'name: ask-matt' 'description: Installer precedence test fixture.' '---' > "$TEST_SHADOW/SKILL.md"

bash -n "$REPO_ROOT/scripts/install.sh" "$REPO_ROOT/scripts/sync-matt.sh"
HOME="$TEST_HOME" "$REPO_ROOT/scripts/install.sh"
"$REPO_ROOT/scripts/sync-matt.sh" status >/dev/null
"$REPO_ROOT/scripts/sync-matt.sh" diff ask-matt >/dev/null

upstream_tdd_target="$(readlink "$TEST_HOME/.agents/skills/tdd")"
local_shadow_target="$(readlink "$TEST_HOME/.agents/skills/ask-matt")"

[ "$upstream_tdd_target" = "$REPO_ROOT/vendor/mattpocock-skills/skills/engineering/tdd" ] || {
  printf 'expected upstream tdd, got %s\n' "$upstream_tdd_target" >&2
  exit 1
}
[ "$local_shadow_target" = "$TEST_SHADOW" ] || {
  printf 'expected local ask-matt shadow, got %s\n' "$local_shadow_target" >&2
  exit 1
}
[ ! -e "$TEST_HOME/.agents/skills/loop-me" ] || {
  printf 'in-progress upstream skill loop-me should not be installed\n' >&2
  exit 1
}

mismatch_repo="$TEST_HOME/mismatch-repo"
mismatch_commit="$(git -C "$REPO_ROOT/vendor/mattpocock-skills" rev-parse HEAD^)"
mkdir -p "$mismatch_repo/scripts" "$mismatch_repo/vendor" "$mismatch_repo/skills"
cp "$REPO_ROOT/scripts/install.sh" "$REPO_ROOT/scripts/sync-matt.sh" "$mismatch_repo/scripts/"
ln -s "$REPO_ROOT/vendor/mattpocock-skills" "$mismatch_repo/vendor/mattpocock-skills"
awk -F '\t' -v OFS='\t' -v commit="$mismatch_commit" '
  $1 == "upstream_commit" { $2 = commit }
  { print }
' "$REPO_ROOT/matt-pocock-skills.manifest" > "$mismatch_repo/matt-pocock-skills.manifest"

if HOME="$TEST_HOME/mismatch-home" "$mismatch_repo/scripts/install.sh" >/dev/null 2>&1; then
  printf 'installer accepted a checkout that did not match the manifest pin\n' >&2
  exit 1
fi
if "$mismatch_repo/scripts/sync-matt.sh" status >/dev/null 2>&1; then
  printf 'status accepted a checkout that did not match the manifest pin\n' >&2
  exit 1
fi

for archived_skill in \
  codebase-design diagnosing-bugs domain-modeling git-guardrails-claude-code \
  grill-me grill-with-docs grilling handoff implement improve-codebase-architecture \
  migrate-to-shoehorn prototype resolving-merge-conflicts scaffold-exercises \
  setup-matt-pocock-skills setup-pre-commit tdd teach; do
  [ -f "$REPO_ROOT/archive/skills/$archived_skill/SKILL.md" ] || {
    printf 'expected archived skill: %s\n' "$archived_skill" >&2
    exit 1
  }
done

printf '[test] pin enforcement, local precedence, upstream selection, and archival passed\n'
