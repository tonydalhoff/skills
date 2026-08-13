#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$REPO_ROOT/matt-pocock-skills.manifest"
UPSTREAM_DIR="$REPO_ROOT/vendor/mattpocock-skills"

die() {
  printf '[matt-sync] error: %s\n' "$1" >&2
  exit 1
}

manifest_value() {
  awk -F '\t' -v key="$1" '$1 == key { print $2; exit }' "$MANIFEST"
}

require_submodule() {
  [ -f "$UPSTREAM_DIR/.git" ] || [ -d "$UPSTREAM_DIR/.git" ] ||
    die "submodule is not initialized; run: git submodule update --init"
}

list_skills_at() {
  local commit="$1" category
  local paths=()

  while IFS= read -r category; do
    paths+=("skills/$category")
  done < <(awk -F '\t' '$1 == "include_category" { print $2 }' "$MANIFEST")

  git -C "$UPSTREAM_DIR" ls-tree -r --name-only "$commit" -- "${paths[@]}" |
    awk -F / '$NF == "SKILL.md" { print $(NF - 1) }' |
    sort -u
}

status() {
  local expected_commit previous_commit actual_commit ref
  local additions removals mismatch=0

  require_submodule
  expected_commit="$(manifest_value upstream_commit)"
  previous_commit="$(manifest_value previous_commit)"
  ref="$(manifest_value upstream_ref)"
  actual_commit="$(git -C "$UPSTREAM_DIR" rev-parse HEAD)"

  printf '[matt-sync] pinned: %s (%s)\n' "$ref" "$expected_commit"
  if [ "$actual_commit" != "$expected_commit" ]; then
    printf '[matt-sync] mismatch: submodule is at %s\n' "$actual_commit"
    mismatch=1
  else
    printf '[matt-sync] submodule matches manifest\n'
  fi

  additions="$(comm -13 <(list_skills_at "$previous_commit") <(list_skills_at "$expected_commit"))"
  removals="$(comm -23 <(list_skills_at "$previous_commit") <(list_skills_at "$expected_commit"))"
  if [ -n "$additions" ]; then
    printf '[matt-sync] upstream skills added since previous pin:\n%s\n' "$additions"
  fi
  if [ -n "$removals" ]; then
    printf '[matt-sync] upstream skills removed since previous pin:\n%s\n' "$removals"
  fi
  if [ -z "$additions" ] && [ -z "$removals" ]; then
    printf '[matt-sync] no upstream skill additions or removals since previous pin\n'
  fi

  [ "$mismatch" -eq 0 ]
}

update() {
  local old_commit latest_ref new_commit manifest_tmp

  require_submodule
  git -C "$UPSTREAM_DIR" diff --quiet || die "upstream submodule has local changes"
  git -C "$UPSTREAM_DIR" diff --cached --quiet || die "upstream submodule has staged changes"

  old_commit="$(manifest_value upstream_commit)"
  printf '[matt-sync] fetching upstream tags...\n'
  git -C "$UPSTREAM_DIR" fetch --tags --prune
  latest_ref="$(git -C "$UPSTREAM_DIR" tag --list 'v[0-9]*' --sort=-version:refname |
    awk '/^v[0-9]+\.[0-9]+\.[0-9]+$/ { print; exit }')"
  [ -n "$latest_ref" ] || die "no stable vMAJOR.MINOR.PATCH tag found"

  git -C "$UPSTREAM_DIR" checkout --detach "$latest_ref"
  new_commit="$(git -C "$UPSTREAM_DIR" rev-parse HEAD)"
  manifest_tmp="$(mktemp "$MANIFEST.tmp.XXXXXX")"
  awk -F '\t' -v OFS='\t' \
    -v previous="$old_commit" -v ref="$latest_ref" -v commit="$new_commit" '
      $1 == "previous_commit" { $2 = previous }
      $1 == "upstream_ref" { $2 = ref }
      $1 == "upstream_commit" { $2 = commit }
      { print }
    ' "$MANIFEST" > "$manifest_tmp"
  mv "$manifest_tmp" "$MANIFEST"

  if [ "$old_commit" = "$new_commit" ]; then
    printf '[matt-sync] already current at %s\n' "$latest_ref"
  else
    printf '[matt-sync] updated %s -> %s (%s)\n' "$old_commit" "$latest_ref" "$new_commit"
  fi
  status
}

case "${1:-status}" in
  status) status ;;
  update) update ;;
  *) die "usage: $0 [status|update]" ;;
esac
