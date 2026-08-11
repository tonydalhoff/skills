# skills

Personal collection of agent skills for Claude Code (and other agents that read `~/.agents/skills`), combined with a pinned release of Matt Pocock's skills.

## Layout

- `skills/` — one directory per skill, each containing a `SKILL.md` (frontmatter with `name` and `description`, then instructions) plus any supporting files or scripts.
- `archive/skills/` — preserved local skills that are no longer installed.
- `vendor/mattpocock-skills/` — read-only Git submodule pinned to a published upstream release.
- `matt-pocock-skills.manifest` — selected upstream categories, pinned and previous commits, and local shadows.
- `scripts/install.sh` — installs the selected upstream skills, then local skills; a local skill wins when names collide.
- `scripts/sync-matt.sh` — reports upstream/shadow status or updates the submodule to the latest stable release.

## Install

```sh
git submodule update --init
./scripts/install.sh
```

Re-run it after adding or removing a skill. Pre-existing real directories at a link destination are backed up to `.backup/` before being replaced.

The vendored `in-progress` category is intentionally excluded. Edit the manifest's `include_category` records if that policy changes.

## Updating Matt Pocock's skills

Inspect the current pin and local shadows:

```sh
./scripts/sync-matt.sh status
```

Fetch tags and move to the latest stable release:

```sh
./scripts/sync-matt.sh update
git diff --submodule
./scripts/test.sh
```

The update records the old pin as `previous_commit`, so status reports upstream skill additions and removals. It deliberately does not advance active `shadow` baselines: each local shadow is reported as needing review until its record is updated to the new commit. `archived_shadow` records retain provenance for inactive archived copies and do not affect status or installation.

Compare a local shadow with the newly pinned upstream version before advancing its manifest baseline:

```sh
./scripts/sync-matt.sh diff my-customized-skill
```

Do not edit files under `vendor/`. To customize an upstream skill, copy its entire directory into `skills/<skill-name>/` and add a `shadow` record to the manifest. The local directory will override upstream during installation.

## Adding a skill

Create `skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter, then re-run the install script.
