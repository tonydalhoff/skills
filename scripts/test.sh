#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_HOME="$(mktemp -d "${TMPDIR:-/tmp}/skills-install-test.XXXXXX")"
trap 'rm -rf "$TEST_HOME"' EXIT

bash -n "$REPO_ROOT/scripts/install.sh" "$REPO_ROOT/scripts/sync-matt.sh"
HOME="$TEST_HOME" "$REPO_ROOT/scripts/install.sh"
"$REPO_ROOT/scripts/sync-matt.sh" status >/dev/null

upstream_tdd_target="$(readlink "$TEST_HOME/.agents/skills/tdd")"
upstream_target="$(readlink "$TEST_HOME/.agents/skills/ask-matt")"

[ "$upstream_tdd_target" = "$REPO_ROOT/vendor/mattpocock-skills/skills/engineering/tdd" ] || {
  printf 'expected upstream tdd, got %s\n' "$upstream_tdd_target" >&2
  exit 1
}
[ "$upstream_target" = "$REPO_ROOT/vendor/mattpocock-skills/skills/engineering/ask-matt" ] || {
  printf 'expected upstream ask-matt, got %s\n' "$upstream_target" >&2
  exit 1
}
[ ! -e "$TEST_HOME/.agents/skills/loop-me" ] || {
  printf 'in-progress upstream skill loop-me should not be installed\n' >&2
  exit 1
}

printf '[test] upstream selection and archived local replacement passed\n'
