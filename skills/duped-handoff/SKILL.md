---
name: duped-handoff
description: Compact the current conversation into a handoff document for another agent to pick up. Use when the user asks to preserve context for a fresh session or another agent.
argument-hint: "What will the next session be used for?"
---

# Handoff (Imported Duplicate)

Write a handoff document summarizing the current conversation so a fresh agent can continue the work. Save it under `~/bt/dotfiles-personal/handoffs/`, a single flat directory shared across repositories and projects.

Create the directory if needed. Name the file `<short-description>.md`, or `<jira-id>-<short-description>.md` when centered on a Jira ticket. Do not include "handoff" or a timestamp in the filename; record the timestamp in the body.

Suggest skills the next session should use. Do not duplicate content already recorded in PRDs, plans, ADRs, issues, commits, or diffs; reference those artifacts by path or URL. If arguments were supplied, use them as the next session's focus and tailor the document accordingly.
