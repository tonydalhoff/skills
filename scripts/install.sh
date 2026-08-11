#!/usr/bin/env bash
#
# Symlinks every skill directory in this repo's skills/ into ~/.claude/skills
# and ~/.agents/skills, so ~/dev/skills is the single source of truth.
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

for target_root in "${TARGETS[@]}"; do
  mkdir -p "$target_root"
  for skill in "$SKILLS_DIR"/*/; do
    skill="${skill%/}"
    link_skill "$skill" "$target_root/$(basename "$skill")"
  done
  log "Linked $(ls -d "$SKILLS_DIR"/*/ | wc -l | tr -d ' ') skills into $target_root"
done
