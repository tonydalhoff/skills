#!/usr/bin/env bash
#
# Symlinks local skills and selected vendored skills into ~/.claude/skills and
# ~/.agents/skills. Local skills take precedence when names collide.
# A pre-existing real directory at a link destination is backed up first.
#
# Usage: ./scripts/install.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
UPSTREAM_DIR="$REPO_ROOT/vendor/mattpocock-skills"
UPSTREAM_MANIFEST="$REPO_ROOT/matt-pocock-skills.manifest"
TARGETS=("$HOME/.claude/skills" "$HOME/.agents/skills")
BACKUP_DIR="$REPO_ROOT/.backup/$(date +%Y%m%d-%H%M%S)"

log() { printf '[skills] %s\n' "$1"; }

# Symlinks $1 -> $2, backing up a pre-existing real directory at $2 first.
link_skill() {
  local src="$1" dest="$2"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    log "Backing up existing $dest"
    mkdir -p "$BACKUP_DIR"
    mv "$dest" "$BACKUP_DIR/$(basename "$dest")"
  fi
  ln -sfn "$src" "$dest"
}

# Removes symlinks in $1 that point back into this repo but whose source no
# longer exists (e.g. a skill that was since removed from skills/ or vendor).
prune_stale_links() {
  local target_root="$1" link target
  for link in "$target_root"/*; do
    [ -L "$link" ] || continue
    target="$(readlink "$link")"
    case "$target" in
      "$REPO_ROOT"/*)
        [ -e "$target" ] || { log "Removing stale link $link"; rm "$link"; }
        ;;
    esac
  done
}

if [ -f "$UPSTREAM_MANIFEST" ]; then
  if [ ! -f "$UPSTREAM_DIR/.git" ] && [ ! -d "$UPSTREAM_DIR/.git" ]; then
    log "Vendored skills are not initialized; run: git submodule update --init"
    exit 1
  fi

  expected_commit="$(awk -F '\t' '$1 == "upstream_commit" { print $2; exit }' "$UPSTREAM_MANIFEST")"
  actual_commit="$(git -C "$UPSTREAM_DIR" rev-parse HEAD)"
  if [ "$actual_commit" != "$expected_commit" ]; then
    log "Vendored checkout does not match manifest pin; run: ./scripts/sync-matt.sh status"
    exit 1
  fi
fi

for target_root in "${TARGETS[@]}"; do
  mkdir -p "$target_root"
  prune_stale_links "$target_root"

  if [ -f "$UPSTREAM_MANIFEST" ]; then
    while IFS= read -r category; do
      for skill in "$UPSTREAM_DIR/skills/$category"/*/; do
        [ -f "$skill/SKILL.md" ] || continue
        skill="${skill%/}"
        link_skill "$skill" "$target_root/$(basename "$skill")"
      done
    done < <(awk -F '\t' '$1 == "include_category" { print $2 }' "$UPSTREAM_MANIFEST")
  fi

  for skill in "$SKILLS_DIR"/*/; do
    skill="${skill%/}"
    if [ -f "$UPSTREAM_MANIFEST" ] && [ -e "$target_root/$(basename "$skill")" ]; then
      log "Local skill name collides with vendored skill: $(basename "$skill")"
      exit 1
    fi
    link_skill "$skill" "$target_root/$(basename "$skill")"
  done
  log "Linked selected skills into $target_root"
done
