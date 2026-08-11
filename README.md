# skills

Personal collection of agent skills for Claude Code (and other agents that read `~/.agents/skills`).

## Layout

- `skills/` — one directory per skill, each containing a `SKILL.md` (frontmatter with `name` and `description`, then instructions) plus any supporting files or scripts.
- `scripts/install.sh` — symlinks every directory in `skills/` into `~/.claude/skills` and `~/.agents/skills`, so this repo stays the single source of truth.

## Install

```sh
./scripts/install.sh
```

Re-run it after adding or removing a skill. Pre-existing real directories at a link destination are backed up to `.backup/` before being replaced.

## Adding a skill

Create `skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter, then re-run the install script.
