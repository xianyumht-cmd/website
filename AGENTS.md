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

## Self-maintaining AI knowledge system

The user should **not** need to remember or repeat project-history and documentation chores. When the user has authorized a repository-changing task, maintaining the repository knowledge files below is part of that task and does not require a separate reminder. Do not perform repository writes during a purely read-only request.

### Knowledge takeover order

After reading all applicable `AGENTS.md` / `CODEX.md`, read these canonical files when they exist, then verify important claims against current Git/Issue/PR/deployment evidence:

1. `docs/AI_CONTEXT.md` — stable project purpose, boundaries, major modules, external dependencies, and terminology.
2. `docs/PROJECT_STATE.md` — current verified development/deployment state, active Issues/PRs, accepted versions, incomplete work, and next actions.
3. `docs/PITFALLS.md` — recurring mistakes, failed approaches, root causes, detection signals, and prevention rules.
4. `docs/DECISIONS.md` — durable technical/product/operations decisions and why they were made.
5. `docs/ARCHITECTURE.md` — components, ownership boundaries, data flow, contracts, and integration relationships.
6. `docs/OPERATIONS.md` — build, release, deployment, verification, recovery, rollback, and maintenance runbooks.
7. `docs/AI_WORKSTYLE.md` — stable repository-relevant collaboration preferences that help AI work effectively with the user.

Missing files are not an error. **Do not create empty boilerplate files.** Create a canonical file only when the first real piece of durable information belongs there.

### Automatic routing rules

- Stable mandatory AI behavior/safety/workflow belongs in `AGENTS.md`.
- Stable project facts and vocabulary belong in `AI_CONTEXT.md`.
- Current state belongs in `PROJECT_STATE.md`; keep it concise and replace stale facts instead of appending chat logs.
- Reusable lessons from failures or user corrections belong in `PITFALLS.md` with cause + prevention.
- Durable choices between alternatives belong in `DECISIONS.md` with date, reason, consequences, and superseded decisions when applicable.
- Architecture changes belong in `ARCHITECTURE.md`.
- Build/deploy/rollback/verification procedure changes belong in `OPERATIONS.md`.
- Stable repository-relevant collaboration preferences belong in `AI_WORKSTYLE.md`; do not store unrelated personal profile information.
- Do not create `*-v2.md`, `final-notes.md`, dated handoff duplicates, or parallel knowledge files when a canonical file can be updated.
- Do not create a separate branch merely for handoff/knowledge updates; include them in the same authorized task branch/PR.

### Automatic maintenance triggers

Before declaring a substantive task complete, decide what knowledge changed and:

1. reconcile docs with actual Git/Issue/PR/deployment evidence;
2. update `PROJECT_STATE.md` when current state, active task, blocker, accepted result, or next action changed;
3. update `PITFALLS.md` after a reusable failure/correction;
4. update `DECISIONS.md` after a durable decision;
5. update `ARCHITECTURE.md` / `OPERATIONS.md` when their facts changed;
6. update `AI_CONTEXT.md` / `AI_WORKSTYLE.md` only for stable facts/preferences;
7. update `AGENTS.md` only for a new long-lived mandatory rule.

A task is **not fully closed** if repository knowledge is materially stale after the change.

### Evidence and hygiene rules

- Current repository/deployment evidence outranks stale documentation.
- Distinguish **verified current state**, **planned work**, and **inference**.
- Prefer exact Issue/PR numbers, tags, commit SHAs, paths, and dates when useful for auditability.
- Never store passwords, API tokens, cookies, private keys, session secrets, or credential-bearing diagnostics in these knowledge files.
- Do not dump large logs or chat transcripts into the knowledge base; summarize the reusable conclusion and durable evidence.
- If knowledge conflicts with reality, correct or mark it superseded during the current task instead of silently working around it.

The goal is that a future ChatGPT/Codex session can enter this repository, read the canonical files, inspect live repository state, and continue safely **without relying on the user to remember previous instructions or retell project history**.
