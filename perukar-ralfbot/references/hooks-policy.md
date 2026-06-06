# hooks-policy.md — what the RALFBOT hooks do (and do not) enforce

> **VERIFY AGAINST CURRENT CLAUDE CODE DOCS BEFORE INSTALLATION.** These templates were written without live docs access. Confirm hook event names, matcher syntax, `$CLAUDE_PROJECT_DIR`, permissions pattern syntax, and the PreToolUse decision schema (`exit 2` vs JSON `permissionDecision`) against your Claude Code version.

## Critical design rule
**Hooks enforce DETERMINISTIC rules only. Business decisions still STOP for the user.**
A hook can mechanically decide "is this `git push`?" or "is this path LOCKED?". A hook CANNOT decide "does this dirty test legitimately weaken the BRAND contract?" — that stays a human STOP, owned by the skill + CLAUDE.md.

## What hooks ENFORCE (deterministic)
- Block `git add .` / `-A` / `--all` (bash-guard + permissions deny).
- Block `git push` (always).
- Block `git reset` / `clean` / `checkout` / `switch` / `restore` / `stash`.
- Block destructive `rm -rf`, `Remove-Item -Recurse/-Force`, `del /...`, and pokes at `.git` internals.
- Block command chaining (`&&`, `;`, `|`) combined with git/destructive actions.
- Block raw `git commit` unless via `ralfbot-commit-gate.ps1`.
- Block edits to LOCKED files unless explicitly allow-listed.
- Block writes to secret-like files and to paths outside the repo.
- Commit gate: empty index first, approved ⊆ Allowed, changed ⊆ Allowed, approved ⊆ changed, full test matrix + `git diff --check` PASS, stage exact files, staged == approved, then commit — never push.
- Preflight: detect root/HEAD/dirty/staged/active-git/index.lock; never auto-delete a lock except an opt-in 0-byte stale lock.

## What hooks DO NOT enforce (still human / skill judgment)
- Whether a business-logic change is correct (color-logic, allergy/scalp gates, productionReady).
- AGENTS.md vs **committed** tests conflict → **STOP** (human). Hooks only honor an explicit `.ralfbot/CONFLICT` sentinel.
- Whether dirty tests should be trusted (they are suspicious by policy; the human decides).
- Scope definition itself — hooks check membership, you define Allowed files.
- Anything requiring reading file *contents* for meaning.

## Source-of-truth alignment
Hooks operate **below** the source-of-truth priority (AGENTS.md/LOCKED > committed tests > core.js > dirty diff). They prevent mechanical violations; they never override a human STOP that the priority demands.

## Installation options (manual, deliberate)
1. Copy `hooks/` to `<repo>/.ralfbot/hooks/` and (optionally) create `.ralfbot/allowed-files.txt`.
2. Merge `settings/claude-settings.project.example.json` into `<repo>/.claude/settings.json` (shared) and/or the local example into `.claude/settings.local.json` (per-machine). **Remove the `_README` key.**
3. Adjust `pwsh` vs `powershell` and paths for your OS.
4. Restart Claude Code so it reloads settings.

### Why templates are NOT auto-installed
Installing hooks silently changes how every tool call in the repo is gated and can block your own workflow. That must be a conscious, reviewed act by you — installing it for you would itself violate the RALFBOT principle of no blind state changes.

## Project vs local settings
- **Project** (`.claude/settings.json`): committed, shared by everyone on PERUKAR. Put the core guards here.
- **Local** (`.claude/settings.local.json`): per-machine, not committed. Machine-specific paths and extra personal denies. Local extends/overrides project.

## How to test
- Run `/hooks` inside Claude Code to view active hooks and confirm they loaded.
- Trigger a benign read-only command (`git status`) → should pass.
- Trigger a blocked one (`git push`, or editing `www/core.js` without allow-listing) → should be denied with a RALFBOT reason.
- Run the scripts standalone (see `hooks/README_HOOKS.md`) to validate logic without Claude Code.

## How to disable safely
- Temporarily: comment out / remove the relevant `hooks` entries in settings and restart, or use `/hooks` to manage.
- Fully: delete the `hooks` block from `.claude/settings.json` / `.local.json`. Scripts in `.ralfbot/hooks/` are inert unless referenced.
- The bash-guard can be switched to fail-closed (see README_HOOKS) if you want maximum strictness.

## Connection to SKILL.md and CLAUDE.md
- `SKILL.md` / `CLAUDE.md` = the **judgment + process** layer (preflight → audit → scoped impl → tests → diff audit → commit gate), loaded by the skill and at project level.
- These hooks = the **hard wall** that makes the non-negotiable bans deterministic even if the model drifts.
- Same rules, two layers: instruction (skill/CLAUDE.md) + enforcement (hooks).
