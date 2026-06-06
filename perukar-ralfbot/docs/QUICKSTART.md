# PERUKAR RALFBOT — Quick Start Guide

> Block E · Daily usage reference
> RALFBOT is not an autopilot. It executes one bounded task at a time and stops.

---

## What RALFBOT does and does not do

**Does:**
- Execute one task card at a time
- Run required tests
- Stop at the commit gate and wait for explicit authorization
- Report status after each task
- Block unsafe operations (dirty repo, locked files, vague scope)

**Does not:**
- Chain tasks automatically
- Decide what to do next
- Infer your intent from vague requests
- Commit without explicit `commit_allowed: yes`
- Push without explicit instruction
- Continue if any required condition fails

---

## Minimal Task Card Format

Every task must be a structured card. The minimum valid card has these fields:

```yaml
task_id: TASK-XXX
task_title: Short title
mode: IMPLEMENTATION
context: Why this task exists.
goal: Single concrete outcome.
non_goals:
  - What this task does NOT do
expected_repo_root: C:\path\to\project
expected_head: main
branch_policy: work on current branch
allowed_files:
  - relative/path/to/file.js
forbidden_files:
  - www/core.js
locked_files_involved: []
source_of_truth_refs:
  - AGENTS.md §relevant-section
required_tests:
  - node --check www/core.js
  - node test_www_business_scenarios.js
commit_allowed: no
approved_commit_file_list: []
stop_conditions:
  - any test fails
  - any file outside allowed_files is modified
definition_of_done:
  - all required_tests pass
  - goal is met
  - final report produced
```

---

## Ready-to-Copy Examples

### A. Read-Only Audit

Use this when you want RALFBOT to inspect the repo without changing anything.

```yaml
task_id: TASK-AUDIT-001
task_title: Read-only audit of current repo state
mode: READONLY_AUDIT
context: Need to understand current dirty state before proceeding.
goal: Produce a complete list of all uncommitted changes and their status.
non_goals:
  - Do not make any changes
  - Do not stash or reset anything
  - Do not commit anything
expected_repo_root: C:\path\to\project
expected_head: main
branch_policy: read-only, no branch changes
allowed_files: []
forbidden_files:
  - www/core.js
  - AGENTS.md
  - CLAUDE.md
locked_files_involved: []
source_of_truth_refs:
  - git status
  - git diff HEAD
required_tests:
  - git diff --check
commit_allowed: no
approved_commit_file_list: []
stop_conditions:
  - any write operation attempted
definition_of_done:
  - full list of dirty files produced
  - status reported to user
  - no changes made
```

---

### B. Implementation Without Commit

Use this when you want RALFBOT to implement something but hold for your
explicit commit approval afterward.

```yaml
task_id: TASK-IMPL-001
task_title: Add missing null check in mass model function
mode: IMPLEMENTATION
context: |
  test_www_mass_model.js fails with null dereference when greyRatio is undefined.
  Fix is to add a null guard before the ratio calculation.
goal: Add null guard for greyRatio in www/core.js mass model function. All tests pass.
non_goals:
  - Do not change any other function
  - Do not touch UI files
  - Do not commit
expected_repo_root: C:\path\to\project
expected_head: main
branch_policy: work on current branch
allowed_files:
  - www/core.js
forbidden_files:
  - www/index.html
  - AGENTS.md
  - CLAUDE.md
locked_files_involved: []
source_of_truth_refs:
  - test_www_mass_model.js §greyRatio tests
  - AGENTS.md §mass-model-rules
required_tests:
  - node --check www/core.js
  - node test_www_mass_model.js
  - node test_www_business_scenarios.js
  - git diff --check
commit_allowed: no
approved_commit_file_list: []
stop_conditions:
  - any test fails
  - any file outside allowed_files is modified
  - repo is dirty before starting
definition_of_done:
  - null guard added
  - all required_tests pass
  - ready for commit gate: yes
  - final report produced
```

After RALFBOT reports `ready_for_commit_gate: yes`, send a Commit Gate card (see Example C).

---

### C. Commit Gate After Verified Changes

Use this only after an implementation task succeeded and all tests passed.

```yaml
task_id: TASK-COMMIT-001
task_title: Commit verified null guard fix
mode: COMMIT_GATE
context: |
  TASK-IMPL-001 completed. All tests passed.
  RALFBOT is holding at commit gate.
  This card authorizes the commit.
goal: Commit the verified null guard fix with the specified message.
non_goals:
  - Do not push
  - Do not modify any additional files
  - Do not stage files outside approved_commit_file_list
expected_repo_root: C:\path\to\project
expected_head: main
branch_policy: commit on current branch
allowed_files:
  - www/core.js
forbidden_files:
  - www/index.html
  - AGENTS.md
locked_files_involved: []
source_of_truth_refs:
  - TASK-IMPL-001 final report
required_tests:
  - node --check www/core.js
  - node test_www_mass_model.js
  - git diff --check
commit_allowed: yes
approved_commit_file_list:
  - www/core.js
commit_message: "fix: [TASK-IMPL-001] add null guard for greyRatio in mass model"
stop_conditions:
  - any test fails
  - any file outside approved_commit_file_list is staged
definition_of_done:
  - commit made with correct message
  - only www/core.js in commit
  - final report produced with commit SHA
```

---

## How to Say "Commit: yes"

RALFBOT will not commit based on a verbal instruction like "go ahead and commit."

You must provide a `COMMIT_GATE` task card with:
```yaml
commit_allowed: yes
approved_commit_file_list:
  - exact/file/path.js
commit_message: "your commit message here"
```

Without these three fields explicitly set, RALFBOT must not commit.

---

## What to Do When RALFBOT Says BLOCKED

RALFBOT reports `STATUS: BLOCKED` when it cannot proceed safely.
Common causes and actions:

| Cause | Action |
|---|---|
| Missing required field in task card | Add the missing field, resubmit the card |
| `safety_impact: RELAXING` without evidence | Provide explicit approval quote, resubmit |
| Repo is dirty | Run `git status`, resolve dirty state first |
| Required file does not exist | Verify path, fix the card |
| Locked file in scope without justification | Add `locked_files_involved` entry with `why` |
| Vague goal | Rewrite goal to be a single specific outcome |

RALFBOT does not attempt to resolve a BLOCKED state on its own.
It stops and waits for a corrected card.

---

## One-Command Preflight Example

Before submitting any task card, run:

```powershell
git status && git diff --check && node --check www/core.js
```

Expected output for a clean, ready state:
```
On branch main
nothing to commit, working tree clean
(no output from diff --check)
(no output from node --check = syntax OK)
```

If any of these fail, resolve before submitting a task card.

---

## RALFBOT Is Not an Infinite Autopilot

RALFBOT does not:
- Continue working after a task is done
- Start the next task based on context
- Decide what the next task should be
- Accumulate goals across multiple messages

After every task, RALFBOT stops and reports.
The next task requires a new, explicit task card from you.

If you send a message like "continue" or "do the next thing," RALFBOT will
ask you to provide a bounded task card before proceeding.

---

*End of QUICKSTART.md · Block E · PERUKAR RALFBOT*
