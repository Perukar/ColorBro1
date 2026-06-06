# PERUKAR RALFBOT — Installation Guide

> Block E · Status: TEMPLATE ONLY — not installed
> Hooks are templates until verified against current Claude Code documentation.
> Do not install into a dirty repository.

---

## 1. Package Overview

PERUKAR RALFBOT is a bounded-task execution skill for Claude Code.
It provides:

- A backlog schema and task card templates (`backlog/`)
- A constitution file that defines the agent's operating rules (`references/ralfbot-constitution.md`)
- A SKILL.md entry point for Claude Code skill loading
- Template files for CLAUDE.md and AGENTS.md top block (review before use)
- PowerShell hook templates for preflight, test matrix, and commit gate (verify before use)
- Settings examples (review before use)
- Block E operating documentation (this file and its siblings)

The package does **not** modify any project file automatically.
Every installation step is manual and requires review.

---

## 2. Intended Package Structure

```
perukar-ralfbot/
│
├── SKILL.md                              # Claude Code skill entry point
├── INSTALL.md                            # This file
├── QUICKSTART.md                         # Daily usage guide
├── OPERATING_MANUAL.md                   # Full workflow reference
├── TROUBLESHOOTING.md                    # Problem resolution
├── MAINTENANCE.md                        # Rule drift and update policy
├── VERIFY_BEFORE_INSTALL.md             # Pre-installation checklist
│
├── backlog/
│   ├── README_BACKLOG.md                # Backlog rules
│   ├── TASK_TEMPLATE_LOCKED_DOC_CHANGE.md
│   └── task-schema.json
│
└── references/
    ├── ralfbot-constitution.md           # Canonical rule source
    ├── CLAUDE_TEMPLATE.md               # TEMPLATE ONLY — not installed
    ├── AGENTS_RALFBOT_TOP_BLOCK.md      # TEMPLATE ONLY — not installed
    ├── hooks/
    │   ├── ralfbot-common.ps1           # TEMPLATE ONLY — not installed
    │   ├── ralfbot-preflight.ps1        # TEMPLATE ONLY — not installed
    │   ├── ralfbot-test-matrix.ps1      # TEMPLATE ONLY — not installed
    │   └── ralfbot-commit-gate.ps1      # TEMPLATE ONLY — not installed
    └── settings/
        └── settings.example.json        # TEMPLATE ONLY — not installed
```

---

## 3. Where to Place the Skill Folder

Place the entire `perukar-ralfbot/` folder inside the Claude Code skills directory
configured for your installation. Typical path:

```
~/.claude/skills/perukar-ralfbot/
```

or wherever your `CLAUDE.md` or `SKILL.md` loader resolves skill paths.

Do not rename the folder. Internal references use the folder name as an anchor.

---

## 4. How to Restore the `references/` Folder if Files Were Exported Flat

If the package was delivered as a flat file export (no subdirectory structure),
reconstruct manually:

1. Create `references/` under `perukar-ralfbot/`
2. Move `ralfbot-constitution.md` into `references/`
3. Move `CLAUDE_TEMPLATE.md` into `references/`
4. Move `AGENTS_RALFBOT_TOP_BLOCK.md` into `references/`
5. Create `references/hooks/` and move all `.ps1` files there
6. Create `references/settings/` and move `settings.example.json` there
7. Verify SKILL.md references resolve correctly after restructure

---

## 5. How to Copy CLAUDE.md Template into a Project

> **Do not copy blindly. Review first.**

1. Open `references/CLAUDE_TEMPLATE.md`
2. Read every rule. Verify each rule is accurate for your project
3. Remove or adjust any rule that does not apply
4. Verify no rule contradicts your project's existing `CLAUDE.md`
5. If a `CLAUDE.md` already exists in the project: merge manually, do not overwrite
6. Copy the reviewed content into the project root as `CLAUDE.md`
7. Run `node --check` or equivalent syntax check on any embedded JS snippets
8. Commit `CLAUDE.md` as a standalone commit with message: `chore: add CLAUDE.md from RALFBOT template (reviewed)`

---

## 6. How to Insert AGENTS_RALFBOT_TOP_BLOCK.md into Existing AGENTS.md

> **Do not insert blindly. Review first.**

1. Open `references/AGENTS_RALFBOT_TOP_BLOCK.md`
2. Read every constraint. Verify each constraint is accurate for your project
3. Open the project's existing `AGENTS.md`
4. Check for conflicts between existing rules and the RALFBOT top block
5. Resolve all conflicts before inserting
6. Prepend the reviewed block to the top of `AGENTS.md`
   (it must appear before any other agent instructions)
7. Do not remove existing `AGENTS.md` content — only prepend
8. Commit as a standalone commit: `chore: add RALFBOT top block to AGENTS.md (reviewed)`

---

## 7. How to Place Hooks Under `.ralfbot/hooks/`

> **TEMPLATE ONLY. Verify before use. See VERIFY_BEFORE_INSTALL.md.**

1. Complete all steps in `VERIFY_BEFORE_INSTALL.md` first
2. Only after passing every verification step, create `.ralfbot/hooks/` in the project root
3. Copy each verified `.ps1` file from `references/hooks/` into `.ralfbot/hooks/`
4. Do not modify hook files during copy
5. Configure Claude Code `settings.json` to register the hooks
   (use `references/settings/settings.example.json` as the template — review before use)
6. Test each hook individually in a clean repo before activating all hooks together

---

## 8. How to Place Settings Examples

1. Open `references/settings/settings.example.json`
2. Review every field
3. Copy reviewed content into `.claude/settings.json` in the project root
4. Do not overwrite an existing `.claude/settings.json` — merge manually
5. Validate JSON syntax: `Get-Content .claude\settings.json | ConvertFrom-Json`

---

## 9. Warnings

### Hooks are templates until verified

```
WARNING: Hook files in references/hooks/ are templates.
They have not been verified against the current Claude Code hooks specification.
Do not install hooks before completing VERIFY_BEFORE_INSTALL.md.
```

### Do not install before PowerShell syntax check

```
WARNING: Run the following before installing any hook:
  pwsh -NoProfile -File .\references\hooks\ralfbot-common.ps1
  pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
  pwsh -NoProfile -File .\references\hooks\ralfbot-test-matrix.ps1
A syntax error in any hook can block all Claude Code operations.
```

### Do not install into a dirty repository

```
WARNING: Before any installation step, verify the repository is clean:
  git status
If the repo has uncommitted changes, commit or stash them first.
Installing into a dirty repo makes rollback ambiguous.
```

---

## 10. Rollback / Uninstall Instructions

To fully remove PERUKAR RALFBOT from a project:

### Remove hooks
```powershell
Remove-Item -Recurse -Force .ralfbot\hooks\
```

### Revert AGENTS.md
Remove the RALFBOT top block from `AGENTS.md`.
The top block is delimited by:
```
# RALFBOT OPERATING CONSTRAINTS — TOP BLOCK
```
and
```
# END RALFBOT TOP BLOCK
```
Delete everything between and including those markers.

### Remove CLAUDE.md additions
If RALFBOT content was appended to `CLAUDE.md`, remove it.
If RALFBOT created a new `CLAUDE.md`, delete it only if the project had none before.

### Remove settings
If `.claude/settings.json` was created from the template, delete it.
If existing settings were modified, revert to the pre-installation version using git:
```
git diff HEAD -- .claude/settings.json
git checkout HEAD -- .claude/settings.json
```

### Remove skill folder
```powershell
Remove-Item -Recurse -Force ~/.claude/skills/perukar-ralfbot/
```

### Verify clean state
```
git status
```
Expected: clean working tree.

---

*End of INSTALL.md · Block E · PERUKAR RALFBOT*
