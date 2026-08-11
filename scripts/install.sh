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

for target_root in "${TARGETS[@]}"; do
  mkdir -p "$target_root"

  if [ -f "$UPSTREAM_MANIFEST" ]; then
    if [ ! -f "$UPSTREAM_DIR/.git" ] && [ ! -d "$UPSTREAM_DIR/.git" ]; then
      log "Vendored skills are not initialized; run: git submodule update --init"
      exit 1
    fi

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
    link_skill "$skill" "$target_root/$(basename "$skill")"
  done
  log "Linked selected skills into $target_root"
done
