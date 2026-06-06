# PERUKAR RALFBOT — Operating Manual

> Block E · Full workflow and operating reference
> Read this file before creating or executing any task card.

---

## 1. Full Workflow

Every task follows this fixed sequence. Steps must not be skipped or reordered.

```
STEP 1: PREFLIGHT
  ↓ repo is clean, HEAD matches, root matches
STEP 2: READONLY AUDIT (if requested or required)
  ↓ full repo state documented, no changes made
STEP 3: SCOPED IMPLEMENTATION
  ↓ only files in allowed_files touched, goal is specific
STEP 4: REQUIRED TESTS
  ↓ all tests in required_tests pass
STEP 5: DIFF AUDIT
  ↓ git diff --check passes, only expected files changed
STEP 6: COMMIT GATE
  ↓ commit_allowed: yes confirmed, approved_commit_file_list confirmed
  → COMMIT (or STOP if commit_allowed: no)

At any step: if a condition fails → STOP → report STATUS: BLOCKED or FAIL → wait
```

---

## 2. Mode Selection

Choose the mode that matches the task. Do not use a broader mode than necessary.

| Mode | Use when | Writes? | Commits? |
|---|---|---|---|
| `READONLY_AUDIT` | Inspecting repo state, documenting dirty state | No | No |
| `IMPLEMENTATION` | Implementing a bounded change | Yes | Only if commit_allowed: yes |
| `RECOVERY` | Fixing a broken state (failed test, bad file) | Yes | Only if commit_allowed: yes |
| `COMMIT_GATE` | Authorizing a previously verified implementation | No new writes | Yes if commit_allowed: yes |
| `DOCUMENTATION` | Doc-only changes, no logic impact | Yes (docs only) | Only if commit_allowed: yes |
| `LOCKED_DOC_UPDATE` | Modifying a contract/locked document | Yes (locked docs) | Only if commit_allowed: yes |
| `CLEANUP` | Mechanical cleanup: formatting, dead code removal | Yes (cleanup only) | Only if commit_allowed: yes |
| `UNKNOWN_TO_AUDIT` | Ambiguous task or unclear starting state | No — must audit first | No |

If the task mode is unclear, default to `UNKNOWN_TO_AUDIT` and audit before proceeding.

---

## 3. Dirty Repo Behavior

RALFBOT must check repo cleanliness before any implementation step.

**If the repo is clean:** proceed.

**If the repo is dirty (uncommitted changes exist):**
1. Switch to `READONLY_AUDIT` mode immediately
2. Document all dirty files:
   - `git status` output
   - `git diff HEAD` summary
3. Stop and report the dirty state
4. Wait for explicit user instruction:
   - "commit existing changes first" → new COMMIT_GATE card
   - "stash and continue" → user runs stash manually, then resubmit
   - "abort" → task is cancelled

RALFBOT must not:
- Silently stash uncommitted work
- Reset or discard uncommitted changes
- Overwrite uncommitted changes with implementation
- Proceed with implementation while the repo is dirty

---

## 4. Branch and Main Behavior

RALFBOT does not create branches.
RALFBOT does not switch branches.
RALFBOT does not merge branches.

The task card must specify `expected_head` (branch or commit SHA).

**At task start:** RALFBOT verifies current HEAD matches `expected_head`.
If HEAD does not match:
- Report `STATUS: BLOCKED` with reason `HEAD_MISMATCH`
- Do not proceed until user resolves the discrepancy

**On main/master branch:**
RALFBOT applies the same rules as any other branch.
There is no special bypass for main.
Commits to main still require `commit_allowed: yes` and `approved_commit_file_list`.

---

## 5. Locked Files Behavior

A locked file is any file designated as a contract or specification anchor.
Canonical locked files in a PERUKAR project include (but are not limited to):

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/settings.json`
- `docs/LOGIC_LOCKED/`
- `docs/AGENTS_LOCKED/`
- `www/core.js` (unless the task specifically allows it)

**When a locked file is in scope:**
- The task must use `mode: LOCKED_DOC_UPDATE`
- The task must declare `safety_impact`
- The task must list the file in `locked_files_involved` with a specific `why`
- If `safety_impact: RELAXING` or `UNKNOWN`, explicit user approval evidence is required
  (see PATCH D-1 rules in `backlog/README_BACKLOG.md`)

**RALFBOT must not:**
- Touch a locked file that is not listed in `locked_files_involved`
- Touch a file in `forbidden_files`
- Modify a locked file without a `LOCKED_DOC_UPDATE` task card

---

## 6. Source-of-Truth Priority

When there is a conflict between documents, apply this priority order:

```
Priority 1 (highest):
  AGENTS.md
  docs/LOGIC_LOCKED/ (if it exists)
  docs/AGENTS_LOCKED/ (if it exists)

Priority 2:
  Committed tests
  (test files that are committed and passing define the contract)

Priority 3:
  www/core.js (committed version)
  (runtime is the implementation of the spec, not the spec itself)

Priority 4 (NOT a source of truth):
  Dirty diff / uncommitted changes
  (a dirty diff is a candidate, not a rule)
  Working notes, chat messages, unverified summaries
```

If a conflict exists between Priority 1 and Priority 2, stop and report it.
Do not resolve the conflict silently.
Do not proceed until the user clarifies which source wins.

---

## 7. Safety-Sensitive Task Handling

Tasks that involve `safety_impact: RELAXING` or `UNKNOWN` require this protocol:

1. **Identify:** Determine that the change weakens or has unknown impact on a constraint
2. **Stop:** Do not proceed with implementation
3. **Present:** Show the user exactly what the old rule is, what the new rule would be,
   and why the impact is RELAXING or UNKNOWN
4. **Wait:** Do not infer approval from silence or from previous messages
5. **Require explicit approval:** User must respond with a clear approval statement
6. **Record evidence:** Copy the exact approval quote into `relaxation_user_approval_evidence`
7. **Set boolean:** `relaxation_user_approved: true`
8. **Proceed:** Only after both fields are set with real evidence

RALFBOT must never:
- Infer that "the user probably approves" from context
- Reuse a prior approval for a different change
- Set `relaxation_user_approved: true` without a corresponding real evidence value
- Fabricate an evidence string

---

## 8. Minimal User Involvement Rules

RALFBOT does not ask for confirmation on operations that are within the task card scope
and have no safety implications.

**RALFBOT must NOT ask for confirmation before:**
- Reading files that are in scope
- Running `node --check` on any file
- Running tests listed in `required_tests`
- Running `git status` or `git diff`
- Writing to files listed in `allowed_files` (within task scope)

**RALFBOT must STOP and ask before:**
- Touching any file outside `allowed_files`
- Touching any file in `forbidden_files`
- Committing (requires `commit_allowed: yes` in the card)
- Pushing (requires explicit user instruction, always)
- Modifying a locked file not listed in `locked_files_involved`
- Proceeding with a RELAXING safety impact without approval evidence

---

## 9. Report Format

Every task must end with a structured report in this format:

```
STATUS: PASS | FAIL | BLOCKED

task_id: <value>
files_changed:
  - <relative path>
files_not_touched:
  - <relative path>
tests_run:
  - "node --check www/core.js": PASS | FAIL
  - "node test_www_business_scenarios.js": PASS | FAIL
  - <all required_tests with result>
safety_impact_declared: <value | N/A>
relaxation_user_approved: <true | false | N/A>
relaxation_user_approval_evidence: <value | N/A>
commit_made: yes | no
commit_sha: <SHA | N/A>
ready_for_commit_gate: yes | no | N/A
ready_for_block_e: yes | no
```

Do not omit fields. Do not abbreviate. Do not summarize test results.

---

## 10. What the User Should Approve

The user must explicitly approve:

- The task card before execution begins
- `commit_allowed: yes` (by including it in the card, not by verbal instruction)
- `approved_commit_file_list` contents
- Any change with `safety_impact: RELAXING` or `UNKNOWN` (with explicit quote)
- Push to any remote (always manual, never in a task card)

**The user should NOT need to approve:**
- Individual file reads within scope
- Syntax checks (`node --check`)
- Test runs listed in `required_tests`
- `git status` or `git diff` calls
- The final report format

If RALFBOT is asking for approval on low-risk in-scope operations,
see `TROUBLESHOOTING.md § Claude asks unnecessary read-only confirmation`.

---

*End of OPERATING_MANUAL.md · Block E · PERUKAR RALFBOT*
