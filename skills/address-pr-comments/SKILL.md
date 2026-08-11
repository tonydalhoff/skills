---
name: address-pr-comments
description: Fetch unresolved pull-request review comments, categorize them, research solutions, and present each comment for the user to accept, edit, push back on, or skip. Use when asked to address PR comments, resolve review feedback, or respond to code review.
---

# Address PR Comments

## Setup

1. Detect the pull request for the current branch with `gh pr view --json number,url`, or use a PR number or URL supplied by the user.
2. Confirm GitHub authentication with `gh auth status`; stop with a clear message if unauthenticated.
3. Record the current GitHub user and repository owner/name.

## Fetch comments

Use GitHub's review-thread API to retrieve unresolved threads. Keep only threads where `isResolved` is false and the last commenter is not the current user. Print "No unresolved comments found" when none remain.

Collect comments by file path and line number. Present pre-level comments without a file association after inline comments.

## Categorize and research

Assign exactly one category from reviewer intent:

- Signal: reviewer identifies a bug, logic error, or missing edge case.
- Action: reviewer requests a structural change, extraction, rename, or reorganization.
- Style: cosmetic naming, formatting, import style, or preference.
- Question: reviewer asks for clarification rather than requesting code.
- Suggestion: reviewer offers an optional alternative, often in a suggestion block.

For each comment, read the surrounding diff hunk and full file, inspect relevant codebase patterns, and propose a concrete response. If a code change is warranted, implement it narrowly, run relevant tests, and draft the reply. Present one comment at a time so the user can accept, edit, push back, or skip.

Do not resolve threads or post replies without user approval. After approved changes and replies are complete, summarize changed files, verification, and any unresolved threads.
