#!/usr/bin/env bash
#
# Symlinks local skills into ~/.claude/skills and ~/.agents/skills.
# A pre-existing real directory at a link destination is backed up first.
#
# Usage: ./scripts/install.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
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
# longer exists (e.g. a skill that was since removed from skills/).
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

for target_root in "${TARGETS[@]}"; do
  mkdir -p "$target_root"
  prune_stale_links "$target_root"

  for skill in "$SKILLS_DIR"/*/; do
    skill="${skill%/}"
    link_skill "$skill" "$target_root/$(basename "$skill")"
  done
  log "Linked local skills into $target_root"
done
