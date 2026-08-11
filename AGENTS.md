# AGENTS.md

This repo is a collection of agent skills. It contains no application code.

## Structure

- `skills/<skill-name>/SKILL.md` — every skill lives in its own directory under `skills/`. `SKILL.md` starts with YAML frontmatter (`name`, `description`) followed by the skill's instructions. Supporting files (playbooks, templates, scripts) sit alongside it in the same directory.
- `scripts/install.sh` — symlinks each directory in `skills/` into `~/.claude/skills` and `~/.agents/skills`. The symlinks point into this repo, so edits here take effect immediately; the script only needs re-running when skills are added or removed.

## Conventions

- The directory name and the frontmatter `name` must match.
- The frontmatter `description` states what the skill does and when to use it — it's what agents use to decide whether to load the skill.
- Keep each skill self-contained: it may reference its own bundled files by relative path, but not files in other skill directories.
