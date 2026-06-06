# PERUKAR RALFBOT — Verification Checklist Before Installation

> Block E · Hard checklist — complete every item before installing hooks
> Hooks are TEMPLATE ONLY until this checklist passes in full.
> Do not install hooks before passing this checklist.
> Do not claim hooks are production-ready until this checklist passes.

---

## How to Use This Checklist

Work through every section in order.
For each item: run the specified command or inspection.
Record PASS or FAIL next to each item.
Do not proceed to the next section if the current section has any FAIL.
Do not install if any item is FAIL.

---

## Section 1: Verify Claude Code Hooks Documentation Is Current

**1.1** Open the current Claude Code hooks documentation.
Confirm the hooks API format (stdin/stdout, exit codes, hook event names) matches
what is implemented in the `.ps1` hook files.

```
Source to check: Claude Code official documentation (hooks section)
Hook files to check:
  references/hooks/ralfbot-common.ps1
  references/hooks/ralfbot-preflight.ps1
  references/hooks/ralfbot-test-matrix.ps1
  references/hooks/ralfbot-commit-gate.ps1
```

- [ ] 1.1 Hook stdin format matches current Claude Code docs
- [ ] 1.2 Hook stdout format matches current Claude Code docs
- [ ] 1.3 Exit code semantics (0 = allow, non-zero = block) match current docs
- [ ] 1.4 Hook event names in settings.example.json match current docs
- [ ] 1.5 Hook registration format in settings.example.json matches current docs

If any item is FAIL: update the hook files to match current documentation before proceeding.

---

## Section 2: Verify Settings JSON Syntax

**2.1** Validate `references/settings/settings.example.json`:

```powershell
Get-Content "references\settings\settings.example.json" | ConvertFrom-Json
```

Expected: no error output, object displayed.

- [ ] 2.1 settings.example.json parses without error
- [ ] 2.2 settings.example.json contains valid hook registration entries
- [ ] 2.3 Hook paths in settings.example.json are relative and correct

If any item is FAIL: fix JSON syntax before proceeding.

---

## Section 3: Verify PowerShell Syntax for All Hook Files

Run each command. Expected: no output (syntax OK). Any output = syntax error.

**3.1** Common library:
```powershell
pwsh -NoProfile -File .\references\hooks\ralfbot-common.ps1
```
- [ ] 3.1 ralfbot-common.ps1 syntax OK (no output)

**3.2** Preflight hook:
```powershell
pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
```
- [ ] 3.2 ralfbot-preflight.ps1 syntax OK (no output)

**3.3** Test matrix hook:
```powershell
pwsh -NoProfile -File .\references\hooks\ralfbot-test-matrix.ps1
```
- [ ] 3.3 ralfbot-test-matrix.ps1 syntax OK (no output)

**3.4** Commit gate hook:
```powershell
pwsh -NoProfile -File .\references\hooks\ralfbot-commit-gate.ps1
```
- [ ] 3.4 ralfbot-commit-gate.ps1 syntax OK (no output)

If any item is FAIL: fix syntax error before proceeding.

---

## Section 4: Verify Scripts Do Not Modify Files

**4.1** Inspect `ralfbot-preflight.ps1` source code.
Confirm it contains no `Set-Content`, `Out-File`, `Add-Content`, `New-Item`,
`Remove-Item`, `Move-Item`, `Copy-Item`, or any other file write operation,
except in `ralfbot-commit-gate.ps1` where staging is explicitly allowed
only when `commit_allowed: yes` is confirmed.

- [ ] 4.1 ralfbot-preflight.ps1 contains no file write operations
- [ ] 4.2 ralfbot-common.ps1 contains no file write operations
- [ ] 4.3 ralfbot-test-matrix.ps1 contains no file write operations
- [ ] 4.4 ralfbot-commit-gate.ps1 file writes are limited to commit-gate flow only

---

## Section 5: Verify pretooluse Guards Parse Sample stdin JSON

**5.1** Create a sample stdin payload (simulate Claude Code input):

```powershell
$sampleInput = '{"tool":"bash","input":{"command":"git status"}}'
$sampleInput | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
```

- [ ] 5.1 Hook parses stdin without error
- [ ] 5.2 Hook exits 0 for a harmless command (git status)
- [ ] 5.3 No JSON parse error in output

**5.2** Test with empty stdin:
```powershell
"" | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
```
- [ ] 5.4 Hook handles empty stdin gracefully (exits 0, no crash)

---

## Section 6: Verify File Guard Blocks a LOCKED File

**6.1** Simulate a write attempt to a locked file:

```powershell
$lockedFileAttempt = '{"tool":"write_file","input":{"path":"AGENTS.md","content":"test"}}'
$lockedFileAttempt | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "Exit code: $LASTEXITCODE"
```

- [ ] 6.1 Exit code is non-zero (hook blocked the operation)
- [ ] 6.2 Hook output contains a clear reason for blocking

**6.2** Simulate a write attempt to `www/core.js` (locked unless in scope):
```powershell
$coreAttempt = '{"tool":"write_file","input":{"path":"www/core.js","content":"test"}}'
$coreAttempt | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "Exit code: $LASTEXITCODE"
```
- [ ] 6.3 Exit code is non-zero (hook blocked the operation)

---

## Section 7: Verify Bash Guard Blocks `git add .`

```powershell
$addAll = '{"tool":"bash","input":{"command":"git add ."}}'
$addAll | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "Exit code: $LASTEXITCODE"
```

- [ ] 7.1 Exit code is non-zero
- [ ] 7.2 Hook output states why `git add .` is blocked

---

## Section 8: Verify Bash Guard Blocks `git push`

```powershell
$push = '{"tool":"bash","input":{"command":"git push"}}'
$push | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "Exit code: $LASTEXITCODE"
```

- [ ] 8.1 Exit code is non-zero
- [ ] 8.2 Hook output states why `git push` is blocked

---

## Section 9: Verify Bash Guard Blocks Dangerous Git Operations

Test each of the following. Each must produce a non-zero exit code.

```powershell
# reset --hard
'{"tool":"bash","input":{"command":"git reset --hard HEAD"}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "reset --hard exit: $LASTEXITCODE"

# restore
'{"tool":"bash","input":{"command":"git restore ."}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "restore exit: $LASTEXITCODE"

# checkout (branch switch)
'{"tool":"bash","input":{"command":"git checkout other-branch"}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "checkout exit: $LASTEXITCODE"

# switch
'{"tool":"bash","input":{"command":"git switch main"}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "switch exit: $LASTEXITCODE"

# clean
'{"tool":"bash","input":{"command":"git clean -fd"}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "clean exit: $LASTEXITCODE"

# stash
'{"tool":"bash","input":{"command":"git stash"}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "stash exit: $LASTEXITCODE"
```

- [ ] 9.1 `git reset --hard` blocked (exit non-zero)
- [ ] 9.2 `git restore` blocked (exit non-zero)
- [ ] 9.3 `git checkout <branch>` blocked (exit non-zero)
- [ ] 9.4 `git switch` blocked (exit non-zero)
- [ ] 9.5 `git clean` blocked (exit non-zero)
- [ ] 9.6 `git stash` blocked (exit non-zero)

---

## Section 10: Verify Commit Gate Does Not Stage Before `Commit: yes`

**10.1** Inspect `ralfbot-commit-gate.ps1` source:
- Confirm it reads `commit_allowed` from the task context
- Confirm it does not run `git add` or `git commit` unless `commit_allowed: yes` is confirmed
- Confirm it blocks staging if `commit_allowed: no`

- [ ] 10.1 Commit gate reads `commit_allowed` before acting
- [ ] 10.2 Commit gate does not run `git add` without `commit_allowed: yes`
- [ ] 10.3 Commit gate does not run `git commit` without `commit_allowed: yes`
- [ ] 10.4 Commit gate stages only files in `approved_commit_file_list`, not all changed files

---

## Section 11: Verify Hooks Can Be Disabled Safely

**11.1** Temporarily rename the settings file to simulate disabled hooks:
```powershell
Rename-Item .claude\settings.json .claude\settings.json.bak
```

Verify Claude Code operates normally (can run commands, read files).
Restore:
```powershell
Rename-Item .claude\settings.json.bak .claude\settings.json
```

- [ ] 11.1 Claude Code operates normally when hooks are disabled
- [ ] 11.2 Hooks re-activate correctly when settings are restored
- [ ] 11.3 No side effects from the disable/enable cycle

---

## Section 12: Verify Dirty Repo Behavior

**12.1** Create a dirty state:
```powershell
"test" | Out-File -FilePath .\test-dirty-verify.tmp
```

Run a RALFBOT preflight check:
```powershell
$preflight = '{"tool":"bash","input":{"command":"git status"}}'
$preflight | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "Exit code: $LASTEXITCODE"
```

Verify behavior, then clean up:
```powershell
Remove-Item .\test-dirty-verify.tmp
```

- [ ] 12.1 Hook detects dirty state
- [ ] 12.2 Hook does not proceed with implementation in dirty state
- [ ] 12.3 Hook reports dirty state clearly
- [ ] 12.4 No permanent changes made by the hook during this test

---

## Section 13: Verify Stale Index Lock Behavior

**13.1** Create a fake stale index lock:
```powershell
"stale" | Out-File -FilePath .git\index.lock
```

Run a git command:
```powershell
'{"tool":"bash","input":{"command":"git status"}}' | pwsh -NoProfile -File .\references\hooks\ralfbot-preflight.ps1
echo "Exit code: $LASTEXITCODE"
```

The hook should either:
- Detect the lock and report it (exit non-zero), or
- Allow `git status` to fail naturally and report the error

The hook must NOT silently delete `index.lock`.

Clean up:
```powershell
Remove-Item .git\index.lock -Force
```

- [ ] 13.1 Hook does not silently delete index.lock
- [ ] 13.2 Lock condition is reported to the user
- [ ] 13.3 No permanent damage caused by this test

---

## Final Go / No-Go Checklist

Complete this section only after all sections above are PASS.

```
Section 1  — Claude Code docs current:            [ ] PASS / [ ] FAIL
Section 2  — Settings JSON valid:                 [ ] PASS / [ ] FAIL
Section 3  — PowerShell syntax clean:             [ ] PASS / [ ] FAIL
Section 4  — No unauthorized file writes:         [ ] PASS / [ ] FAIL
Section 5  — stdin JSON parsing works:            [ ] PASS / [ ] FAIL
Section 6  — Locked file guard active:            [ ] PASS / [ ] FAIL
Section 7  — git add . blocked:                   [ ] PASS / [ ] FAIL
Section 8  — git push blocked:                    [ ] PASS / [ ] FAIL
Section 9  — Dangerous git ops blocked:           [ ] PASS / [ ] FAIL
Section 10 — Commit gate safe:                    [ ] PASS / [ ] FAIL
Section 11 — Hooks disable safely:                [ ] PASS / [ ] FAIL
Section 12 — Dirty repo detected:                 [ ] PASS / [ ] FAIL
Section 13 — Stale lock handled safely:           [ ] PASS / [ ] FAIL

All sections PASS?
  YES → Proceed to INSTALL.md hook installation steps
  NO  → Do not install. Fix failing sections. Re-run this checklist.
```

---

*End of VERIFY_BEFORE_INSTALL.md · Block E · PERUKAR RALFBOT*
