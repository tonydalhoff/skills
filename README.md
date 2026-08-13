# skills

Personal collection of agent skills for Claude Code (and other agents that read `~/.agents/skills`), combined with a pinned release of Matt Pocock's skills.

## Layout

- `skills/` — one directory per skill, each containing a `SKILL.md` (frontmatter with `name` and `description`, then instructions) plus any supporting files or scripts.
- `vendor/mattpocock-skills/` — read-only Git submodule pinned to a published upstream release.
- `matt-pocock-skills.manifest` — selected upstream categories and pinned version metadata.
- `scripts/install.sh` — installs selected upstream and local skills; names must not collide.
- `scripts/sync-matt.sh` — reports or updates the submodule to the latest stable release.

## Install

```sh
git submodule update --init
./scripts/install.sh
```

Re-run it after adding or removing a skill. Pre-existing real directories at a link destination are backed up to `.backup/` before being replaced.

The vendored `in-progress` category is intentionally excluded. Edit the manifest's `include_category` records if that policy changes.

## Updating Matt Pocock's skills

Inspect the current pin:

```sh
./scripts/sync-matt.sh status
```

Fetch tags and move to the latest stable release:

```sh
./scripts/sync-matt.sh update
git diff --submodule
./scripts/test.sh
```

The update records the old pin as `previous_commit`, so status reports upstream skill additions and removals. Do not edit files under `vendor/`.

## Adding a skill

Create `skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter, then re-run the install script.
