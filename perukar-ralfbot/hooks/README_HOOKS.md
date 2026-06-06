# README_HOOKS — RALFBOT guard scripts (Block C, TEMPLATE)

> **TEMPLATE ONLY. Nothing here is installed.** These files do not touch the real PERUKAR repo, AGENTS.md, or `.claude/settings.json`. They are copied/installed manually by you.
>
> **VERIFY AGAINST CURRENT CLAUDE CODE DOCS BEFORE INSTALLATION.** Built without live docs access (sandbox blocked `docs.claude.com`). Assumes: PreToolUse stdin JSON with `tool_name` + `tool_input.command` / `tool_input.file_path`; block via **exit code 2** (primary) and a `hookSpecificOutput.permissionDecision = "deny"` JSON (secondary); `$CLAUDE_PROJECT_DIR` available in hook commands; `permissions.deny` glob/prefix syntax. Confirm all of these in your version.

## Files

| script | type | mutates repo? |
|---|---|---|
| `ralfbot-common.ps1` | shared helpers (dot-sourced) | no |
| `ralfbot-preflight.ps1` | manual / SessionStart / Stop preflight | only optional 0-byte stale `index.lock` removal, opt-in |
| `ralfbot-pretooluse-bash-guard.ps1` | PreToolUse(Bash) deny guard | no |
| `ralfbot-pretooluse-file-guard.ps1` | PreToolUse(Edit/Write/MultiEdit) deny guard | no |
| `ralfbot-test-matrix.ps1` | runs full test matrix + `git diff --check` | no |
| `ralfbot-commit-gate.ps1` | safe commit gate | stages exact approved files + commits ONLY with `-CommitYes yes`; never pushes |

## Requirements
- PowerShell 7 (`pwsh`) recommended. On Windows PowerShell 5.1 replace `pwsh` with `powershell` in settings (test first).
- `git` and `node` on PATH.

## Windows-safe hook inspection
When you inspect hook scripts on Windows, prefer an explicit file list instead of relying on `git grep` to expand `*.ps1` patterns.

Example:
```powershell
Get-ChildItem ".ralfbot\hooks\*.ps1" | Select-String -Pattern "deny|allow|permissionDecision"
```

If you need to inspect every hook file safely, use `Get-ChildItem` first and then `Select-String` on the returned file objects.
`git grep` may not expand `*.ps1` the way a shell glob does in every environment, so do not depend on it for hook-file discovery.

## Quick manual use (no Claude Code needed)
```
pwsh -NoProfile -File hooks/ralfbot-preflight.ps1 -ExpectedRoot "D:/PERUKAR"
pwsh -NoProfile -File hooks/ralfbot-test-matrix.ps1
pwsh -NoProfile -File hooks/ralfbot-commit-gate.ps1 -Message "feat: X" -Files "www/core.js" -CommitYes no   # dry gate -> "Ready for commit gate: yes"
pwsh -NoProfile -File hooks/ralfbot-commit-gate.ps1 -Message "feat: X" -Files "www/core.js" -CommitYes yes  # actually commits, never pushes
```

## Allowed-files override (unlocks LOCKED files for a scoped task)
Set ONE of:
- env var `RALFBOT_ALLOWED_FILES="www/core.js;test_www_mass_model.js"`
- file `.ralfbot/allowed-files.txt` (one path per line, `#` comments). Supports `dir/**` prefixes.

Without an entry, the file-guard blocks edits to LOCKED files.

## Behavioural notes (read before trusting)
- **bash-guard fail-mode:** if hook stdin can't be parsed it **fails OPEN** (allows) with a stderr warning, to avoid bricking the session. To fail CLOSED, swap the marked line for `Deny-PreToolUse "unparseable hook input"`.
- **chaining:** any `&&`, `;`, or `|` combined with git/destructive commands is blocked — run commands separately.
- **raw `git commit` is blocked** unless the command goes through `ralfbot-commit-gate.ps1`.
- **exact-file staging only:** commit-gate tasks must stage only the explicit file list from the task card. Never use `git add .`, `git add -A`, `git clean`, or force push as a shortcut.
- Full policy, install steps, and "what hooks do NOT enforce" → `../references/hooks-policy.md`.
