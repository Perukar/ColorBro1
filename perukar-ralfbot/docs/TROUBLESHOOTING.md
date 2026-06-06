# PERUKAR RALFBOT — Troubleshooting Guide

> Block E · Problem resolution reference
> Each section: symptom → diagnosis → fix

---

## 1. `index.lock` with Active Git Process

**Symptom:**
```
fatal: Unable to create '.git/index.lock': File exists.
Another git process seems to be running in this repository
```

**Diagnosis:** A git operation is still running (or crashed mid-operation).

**Fix:**
1. Check if any git process is still active:
   ```powershell
   Get-Process | Where-Object { $_.Name -like "*git*" }
   ```
2. If a process is running, wait for it to complete
3. If no git process is running, the lock is stale — see §2

---

## 2. Stale `index.lock`

**Symptom:** Same error as §1, but no git process is running.

**Diagnosis:** A previous git operation crashed without releasing the lock file.

**Fix:**
```powershell
Remove-Item .git\index.lock -Force
```

Verify the repo is clean after removal:
```
git status
```

Do not remove `index.lock` while a git process is running.

---

## 3. Root Mismatch

**Symptom:** RALFBOT reports `STATUS: BLOCKED` with reason `ROOT_MISMATCH`.

**Diagnosis:** The `expected_repo_root` in the task card does not match the actual
working directory or the git repository root.

**Fix:**
1. Run `git rev-parse --show-toplevel` in the project directory
2. Copy the exact output path
3. Update `expected_repo_root` in the task card with the exact path
4. Resubmit the card

---

## 4. HEAD Mismatch

**Symptom:** RALFBOT reports `STATUS: BLOCKED` with reason `HEAD_MISMATCH`.

**Diagnosis:** The `expected_head` in the task card does not match the current branch or commit.

**Fix:**
1. Run `git branch --show-current` to see the current branch
2. Run `git rev-parse --short HEAD` to see the current commit
3. Update `expected_head` in the task card to match the actual state
4. Resubmit the card

If you intended to be on a different branch, switch branches first:
```
git checkout <intended-branch>
```
Then verify and resubmit.

---

## 5. Staged Files Before Task

**Symptom:** `git status` shows files in the "Changes to be committed" section
before RALFBOT begins implementation.

**Diagnosis:** Files were staged (via `git add`) before the task started.

**Fix (option A — commit staged files first):**
```
git diff --cached        # review what is staged
git commit -m "chore: commit staged changes before RALFBOT task"
```
Then resubmit the task card.

**Fix (option B — unstage without discarding):**
```
git restore --staged .
```
Verify `git status` shows no staged files. Then resubmit.

Do not proceed with a RALFBOT task while files are staged.

---

## 6. Dirty Repo Before Implementation

**Symptom:** RALFBOT reports dirty repo and switches to `READONLY_AUDIT` before
any implementation begins.

**Diagnosis:** Expected behavior. The repo has uncommitted changes.

**Fix:**
1. Review the audit report RALFBOT produces
2. Decide what to do with the uncommitted changes:
   - Commit them: create a `COMMIT_GATE` card and commit first
   - Discard them: run `git checkout -- .` (caution: permanent)
   - Stash them: run `git stash` manually
3. After the repo is clean, resubmit the implementation task card

---

## 7. Hooks Blocking a Harmless Command

**Symptom:** A command that should be allowed (e.g., `node --check`) is blocked
by a hook. RALFBOT reports the hook rejected the operation.

**Diagnosis:** The hook's allow/block logic is too broad, or the command pattern
was not included in the hook's allow list.

**Fix:**
1. Identify which hook fired (pretooluse or posttooluse)
2. Open the relevant `.ps1` hook file
3. Find the command pattern matching section
4. Add the specific command pattern to the allow list
5. Rerun `VERIFY_BEFORE_INSTALL.md` checks for that hook
6. Reinstall the updated hook

Do not disable all hooks to work around a single false positive.

---

## 8. Hooks Not Firing

**Symptom:** Expected hook behavior (e.g., blocking `git push`) does not occur.

**Diagnosis:** Hooks are not registered, or registration is incorrect.

**Fix:**
1. Open `.claude/settings.json`
2. Verify the hook entries are present and point to correct paths
3. Verify the hook files exist at the registered paths
4. Verify Claude Code version supports the hooks API
5. Check Claude Code logs for hook loading errors
6. Re-run `VERIFY_BEFORE_INSTALL.md § verify hooks can be disabled safely` in reverse
   to confirm hooks activate correctly

## 8.1 Windows-Safe Hook Inspection

**Symptom:** You try to inspect `.ps1` hooks with a wildcard `git grep` command and get confusing or empty results.

**Diagnosis:** On Windows, `git grep` does not always expand `*.ps1` the same way shell globbing does.

**Fix:**
1. List the hook files explicitly:
   ```powershell
   Get-ChildItem ".ralfbot\hooks\*.ps1"
   ```
2. Search the returned files explicitly:
   ```powershell
   Get-ChildItem ".ralfbot\hooks\*.ps1" | Select-String -Pattern "deny|allow|permissionDecision"
   ```
3. Use `git grep` only with exact file paths that already exist

Do not depend on `git grep` wildcard expansion for hook discovery on Windows.

---

## 9. PowerShell Execution Policy Issue

**Symptom:**
```
File .\hooks\ralfbot-preflight.ps1 cannot be loaded because running scripts is disabled.
```

**Diagnosis:** PowerShell execution policy blocks unsigned scripts.

**Fix:**
```powershell
# Check current policy
Get-ExecutionPolicy -List

# Set for current user only (preferred — minimal scope)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Do not set `Unrestricted` or apply policy changes to `LocalMachine` scope
unless you understand the security implications.

After changing policy, re-run the syntax check:
```powershell
pwsh -NoProfile -File .\hooks\ralfbot-preflight.ps1
```

---

## 10. `pwsh` Not Found

**Symptom:**
```
pwsh : The term 'pwsh' is not recognized
```

**Diagnosis:** PowerShell 7+ is not installed or not on PATH.

**Fix:**
1. Install PowerShell 7+: https://aka.ms/powershell
2. Verify installation: `pwsh --version`
3. If installed but not on PATH, add the install directory to the user PATH:
   ```powershell
   $env:PATH += ";C:\Program Files\PowerShell\7"
   ```
4. Restart the terminal and rerun the command

---

## 11. JSON Hook stdin Parse Failure

**Symptom:** Hook exits with a JSON parse error when receiving Claude Code stdin data.

**Diagnosis:** The hook's stdin parsing code does not handle the actual JSON format
sent by the current Claude Code version, or stdin is empty.

**Fix:**
1. Add defensive stdin handling to the hook:
   ```powershell
   $rawInput = $input | Out-String
   if ([string]::IsNullOrWhiteSpace($rawInput)) {
     exit 0   # no stdin — allow
   }
   try {
     $data = $rawInput | ConvertFrom-Json -ErrorAction Stop
   } catch {
     Write-Host "RALFBOT: JSON parse failed — blocking for safety"
     exit 1
   }
   ```
2. Log `$rawInput` to a temp file for inspection:
   ```powershell
   $rawInput | Out-File "$env:TEMP\ralfbot-stdin-debug.txt"
   ```
3. Run RALFBOT with a sample command and inspect the log
4. Update the hook's JSON parsing to match the actual format

---

## 12. Tests Failing

**Symptom:** A required test fails during RALFBOT task execution.

**Diagnosis:** Either the implementation introduced a regression,
or the test was already failing before the task started.

**Fix:**
1. Check if the test was passing before the task started:
   ```
   git stash
   node test_www_business_scenarios.js
   git stash pop
   ```
2. If the test was already failing before: do not mask with a new implementation.
   Create a `READONLY_AUDIT` card to document the pre-existing failure first.
3. If the test started failing after implementation: review the change, find the regression,
   fix it, and rerun all required tests.
4. Do not mark the task PASS if any required test fails.

---

## 13. AGENTS.md vs Tests Conflict

**Symptom:** `AGENTS.md` states one rule, but committed tests encode a different rule.
RALFBOT reports a source-of-truth conflict.

**Diagnosis:** Rule drift between `AGENTS.md` and the test spec.

**Fix:**
1. Do not resolve the conflict silently. Stop and report both versions to the user.
2. The user must decide which source wins (see `OPERATING_MANUAL.md §6 Source-of-Truth Priority`).
3. After the user decides, create a `LOCKED_DOC_UPDATE` task card to align the losing document
   with the winning source.
4. Do not implement any new feature until the conflict is resolved.

---

## 14. Claude Tries `git add .`

**Symptom:** Claude Code attempts to run `git add .` (staging all files).

**Diagnosis:** Either a hook is not blocking this command, or the task card
was written without an explicit `approved_commit_file_list`.

**Fix (immediate):** Reject the operation. Do not allow `git add .`.

**Fix (structural):**
1. Verify the `ralfbot-preflight.ps1` hook blocks `git add .` — see `VERIFY_BEFORE_INSTALL.md §7`
2. Ensure the task card has an explicit `approved_commit_file_list` with specific file paths
3. If Claude is acting outside the task card scope, stop the task and report it

RALFBOT must only stage files listed in `approved_commit_file_list`, one file at a time:
```
git add <specific-file>
```

---

## 15. Claude Wants to Push

**Symptom:** Claude Code attempts or proposes to run `git push`.

**Diagnosis:** Claude is operating outside RALFBOT constraints.

**Fix (immediate):** Reject the push. Do not allow it.

**Fix (structural):**
1. Verify the hook blocks `git push` — see `VERIFY_BEFORE_INSTALL.md §8`
2. Remind Claude of the constraint: pushing requires explicit user instruction,
   not a task card `commit_allowed: yes`
3. `commit_allowed: yes` in a task card authorizes a local commit only.
   It never authorizes push.

Push to any remote is always a manual user action, never an agent action.

---

## 16. Claude Asks Unnecessary Read-Only Confirmation

**Symptom:** Claude asks "Should I run `git status`?" or "Can I read `www/core.js`?"
for operations that are clearly within scope and carry no risk.

**Diagnosis:** Claude's safety-prompting behavior is overriding RALFBOT's minimal
user involvement rules.

**Fix:**
1. Confirm once: "Run all in-scope read operations without asking for confirmation."
2. Add to the task card's `non_goals`:
   ```yaml
   non_goals:
     - Do not ask for confirmation before reading files in scope
     - Do not ask for confirmation before running required_tests
     - Do not ask for confirmation before running git status or git diff
   ```
3. If the behavior persists, update `AGENTS_RALFBOT_TOP_BLOCK.md` to include an
   explicit "do not prompt for read-only in-scope operations" rule.

---

*End of TROUBLESHOOTING.md · Block E · PERUKAR RALFBOT*
