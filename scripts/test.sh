#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_HOME="$(mktemp -d "${TMPDIR:-/tmp}/skills-install-test.XXXXXX")"

cleanup() {
  rm -rf "$TEST_HOME"
}
trap cleanup EXIT

bash -n "$REPO_ROOT/scripts/install.sh"
HOME="$TEST_HOME" "$REPO_ROOT/scripts/install.sh"
HOME="$TEST_HOME" "$REPO_ROOT/scripts/install.sh"

local_requirements_target="$(readlink "$TEST_HOME/.agents/skills/trace-requirements")"

[ "$local_requirements_target" = "$REPO_ROOT/skills/trace-requirements" ] || {
  printf 'expected local trace-requirements, got %s\n' "$local_requirements_target" >&2
  exit 1
}

printf '[test] local skill installation passed\n'
