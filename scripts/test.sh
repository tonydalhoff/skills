#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_HOME="$(mktemp -d "${TMPDIR:-/tmp}/skills-install-test.XXXXXX")"

cleanup() {
  rm -rf "$TEST_HOME"
}
trap cleanup EXIT

bash -n "$REPO_ROOT/scripts/install.sh" "$REPO_ROOT/scripts/sync-matt.sh"
HOME="$TEST_HOME" "$REPO_ROOT/scripts/install.sh"
"$REPO_ROOT/scripts/sync-matt.sh" status >/dev/null

upstream_tdd_target="$(readlink "$TEST_HOME/.agents/skills/tdd")"
local_requirements_target="$(readlink "$TEST_HOME/.agents/skills/trace-requirements")"

[ "$upstream_tdd_target" = "$REPO_ROOT/vendor/mattpocock-skills/skills/engineering/tdd" ] || {
  printf 'expected upstream tdd, got %s\n' "$upstream_tdd_target" >&2
  exit 1
}
[ "$local_requirements_target" = "$REPO_ROOT/skills/trace-requirements" ] || {
  printf 'expected local trace-requirements, got %s\n' "$local_requirements_target" >&2
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

printf '[test] pin enforcement and upstream/local skill installation passed\n'
