# Website Project Rules

## Project Context

- Project path: `D:\project2\website-main`
- Primary branch: `source`
- This project is a website with a homepage and resource navigation pages.

## Product Priorities

- Preserve existing customer-facing functions unless the user explicitly asks to remove them.
- Important functions include homepage entries, resource navigation, footer, translation, automatic theme switching, right-click/shortcut protection, feedback paths, and business cooperation entry.
- Visual upgrades should make the site clearer, more polished, and easier for returning customers to use.
- Do not expose internal development wording on public pages.

## Frontend Work

- After meaningful visual or interaction changes, verify with browser preview or screenshots.
- Check both desktop and mobile layouts when the change affects page structure.
- Avoid text overflow, awkward overlaps, broken links, and missing assets.
- Keep public copy business-appropriate and avoid placeholders.

## Git Rules

- Do not commit unless the user asks.
- Before committing, check branch and staged files.
- Never include `node_modules`, temporary screenshots, build outputs, secrets, or unrelated generated files.
- Prefer concise commit messages that describe the user-visible improvement.

## Local Notes

- `CODEX.md` contains additional collaboration guidance and should be kept consistent with this file.
- Broader workspace rules live in `D:\project2\WORKSPACE_RULES.md`.
- Repeated corrections and preferences live in `D:\project2\AI_PITFALLS.md`.

# Shared Mandatory AI Takeover Policy

> **ChatGPT / Codex / other coding agents: read this entire file before any repository action.** These are standing user instructions. Do not wait for the user to repeat them in a new chat.

## Canonical branch

- Canonical development branch: `source`.
- New code work starts from the latest `source` when the user has authorized repository changes.
- Read-only diagnosis does not require a new branch.

## One task = one temporary branch

- Before creating a branch, check whether the same task already has an active branch or PR.
- Otherwise use exactly one short-lived branch for that task.
- Keep revisions on the same task branch. Do not create auxiliary `v2`, `v3`, `final`, `current`, `backup`, `test`, `build`, `deploy`, `handoff`, `note`, or packaging branches.
- Do not use branches as chat memory, backups, build artifacts, or task-status records.
- Track unfinished work in GitHub Issues or repository task-state documentation.
- After an authorized PR is merged and `source` is verified, delete the temporary task branch and update the Issue/task-state record.

## Builds, releases, and history

- Use CI/Actions artifacts for build/deployment packages.
- Use tags for immutable candidates, releases, production snapshots, or archived historical states.
- Preserve unique old history with a verified `archive/*` tag before branch deletion.
- Never delete unique history merely because a branch looks old.

## Git safety

Unless the user explicitly authorizes a narrowly scoped recovery operation, do not use force push, `git reset --hard`, history-rewriting rebase, `git clean`, `git stash`, destructive ref moves, or automatic branch switching as an error-recovery shortcut.

If the worktree is dirty, origin/branch is unexpected, history diverges, or the safe path is unclear: stop and report exact state instead of rewriting history.

Never commit secrets, tokens, credentials, local environment files, sensitive diagnostics, or unrelated generated files.

## AI takeover protocol

At the start of every task:

1. read this file, `CODEX.md`, and any more specific nested `AGENTS.md`;
2. identify current branch, canonical branch, origin, and working-tree status;
3. inspect the relevant Issue/PR when referenced;
4. preserve the project-specific product/frontend rules above;
5. make the smallest safe change on one task branch after the user authorizes changes.

Destructive Git operations, branch/tag deletion, deployment, or production-impacting changes require explicit user intent and fresh safety checks immediately before execution.

Persistent branches should stay minimal; temporary branches exist only while their task is active.
