# TASK TEMPLATE — LOCKED_DOC_UPDATE
> Mode: LOCKED_DOC_UPDATE · Block D · PATCH D-1 applied
> Copy this template for every task that modifies a locked or contract document.
> Replace all `<FILL>` placeholders. Do not leave placeholders in active cards.

---

## 1. Task ID

```
task_id: <FILL: e.g. TASK-D-042>
```

## 2. Task Title

```
task_title: <FILL: short human-readable title>
```

## 3. Mode

```
mode: LOCKED_DOC_UPDATE
```

## 4. Context

```
context: |
  <FILL: Why this task exists. What situation triggered it.
  Reference the document being changed and why it is locked.
  Reference prior decisions or cards if relevant.>
```

## 5. Goal

```
goal: |
  <FILL: Single concrete outcome. One sentence if possible.
  Must be specific enough that "done" is unambiguous.>
```

## 6. Non-Goals

```
non_goals:
  - <FILL: What this task explicitly does NOT do>
  - <FILL: Related work that is out of scope>
  - Do not touch runtime code
  - Do not touch UI/HTML/CSS
  - Do not chain into next task automatically
```

## 7. Expected Repo Root

```
expected_repo_root: <FILL: absolute path to repo root, e.g. C:\perukar>
```

## 8. Expected HEAD

```
expected_head: <FILL: expected git branch or commit SHA before starting>
```

## 9. Branch Policy

```
branch_policy: <FILL: e.g. "work on current branch, no new branch required" or "must be on branch X">
```

## 10. Allowed Files

> Maximum scope. The agent may touch ONLY these files.
> This is NOT an approved commit list.

```
allowed_files:
  - <FILL: relative path from repo root>
  - <FILL: relative path from repo root>
```

## 11. Forbidden Files

> Files the agent must never touch during this task, even if adjacent.

```
forbidden_files:
  - www/core.js
  - www/index.html
  - AGENTS.md
  - CLAUDE.md
  - .claude/settings.json
  - <FILL: any other file explicitly forbidden>
```

## 12. LOCKED Files Involved + WHY

> List every locked file this task touches and the specific reason it must be modified.

```
locked_files_involved:
  - file: <FILL: path>
    why: <FILL: specific reason this locked file must change>
  - file: <FILL: path>
    why: <FILL: specific reason>
```

## 13. Source-of-Truth Refs

> Documents, specs, or decisions that define what the correct content should be.

```
source_of_truth_refs:
  - <FILL: e.g. "PERUKAR_CORE_LOGIC_SPEC_v1 §3.2">
  - <FILL: e.g. "User decision: 2026-06-01 chat, explicit approval">
  - <FILL: e.g. "docs/contract/allergy_rules.md">
```

## 14. Contract Direction

> Describe EXACTLY what changes in the contract. Old → New. Be precise.

```
contract_direction:
  old_contract: |
    <FILL: exact wording or rule as it exists NOW, before this task>
  new_contract: |
    <FILL: exact wording or rule as it will be AFTER this task>
  reason_for_change: |
    <FILL: why this change is necessary. Reference source-of-truth.>
```

## 15. Safety Impact

> Choose EXACTLY ONE. Delete the others.

```
safety_impact: TIGHTENING
# safety_impact: RELAXING
# safety_impact: CLARIFICATION_ONLY
# safety_impact: UNKNOWN
```

### ⚠️ STOP — READ THIS BEFORE PROCEEDING

**If `safety_impact` is `RELAXING` or `UNKNOWN`:**

The agent MUST stop here and NOT proceed with implementation until:

1. The change and its safety impact are presented to the user
2. The user issues an **explicit approval** (not silence, not inference)
3. Both fields below are filled with real evidence:

```
relaxation_user_approved: true
relaxation_user_approval_evidence: "<FILL: EXACT quote from user approval message or decision ID>"
```

**Rules for `relaxation_user_approval_evidence`:**
- Must be an exact verbatim quote from the user's approval, or a traceable decision ID
- Must NOT be empty
- Must NOT be a paraphrase, summary, or the agent's interpretation
- The agent must NOT infer approval from silence or lack of objection
- The agent must NOT infer approval from prior related approvals
- The agent must NOT fabricate or invent evidence
- A `true` boolean alone is NOT sufficient — evidence is mandatory and must be non-empty

**If `safety_impact` is `TIGHTENING` or `CLARIFICATION_ONLY`:**

These fields are optional. Leave them out or set:
```
relaxation_user_approved: false
relaxation_user_approval_evidence: ""
```

---

## 16. Affected Invariants

> Check all that apply. Remove those that do not apply.

```
affected_invariants:
  - productionReady          # affects production-readiness gate
  - approval_state           # affects APPROVED / MANUAL_REQUIRED / BLOCKED logic
  - missingCriticalFields    # affects missing field detection
  - allergy_scalp            # affects allergy / scalp sensitivity rules
  - special_blond            # affects Special Blond handling
  - grey                     # affects grey hair rules
  - target_direction         # affects target direction logic
  - brand_matrix             # affects brand matrix lookup
  - diagnostic_only          # affects diagnostic-only mode gate
  - third_zone_ends          # affects third zone / ends rules
  - mass_model               # affects mass model calculations
  - timing                   # affects timing / processing time logic
  - ui_runtime_mapping       # affects UI ↔ runtime field mapping
  - tests_as_spec            # affects tests that serve as specification
```

## 17. Required Paired Changes

> For each category, state whether a paired change is required in this task.
> If not required, state why.

```
required_paired_changes:
  docs_contract_updated: <true | false>
  agents_md_updated: <true | false>
  tests_updated: <true | false>
  runtime_updated: <true | false>
  reason_if_not_needed: |
    <FILL: If any of the above is false, explain why no paired change is needed.
    "Not applicable" is not sufficient — be specific.>
```

## 18. Required Tests

> All of the following tests must pass before the task is considered done.
> Do not skip any test. Do not mark done if any test fails.

```
required_tests:
  - "node --check www/core.js"
  - "node --check test_www_business_scenarios.js"
  - "node --check test_www_mass_model.js"
  - "node --check test_www_mapping.js"
  - "node --check test_www_render_runtime.js"
  - "node test_www_business_scenarios.js"
  - "node test_www_mass_model.js"
  - "node test_www_mapping.js"
  - "node test_www_render_runtime.js"
  - "git diff --check"
```

## 19. Commit Allowed

```
commit_allowed: <yes | no>
```

> If `no`: implement → test → stop at "Ready for commit gate: yes" → report → wait.
> Do NOT commit without explicit `commit_allowed: yes`.

## 20. Approved Commit File List

> The exact list of files that may appear in the commit.
> Must be a strict subset of `allowed_files`.
> If `commit_allowed: no`, set to empty list.

```
approved_commit_file_list:
  - <FILL: relative path>
  - <FILL: relative path>
```

## 21. Commit Message

```
commit_message: |
  <FILL: e.g. "docs: [TASK-D-042] update allergy rule wording (CLARIFICATION_ONLY)">
```

## 22. Stop Conditions

> The agent must stop immediately if any of these conditions is true.

```
stop_conditions:
  - safety_impact is RELAXING or UNKNOWN and relaxation_user_approval_evidence is missing or empty
  - relaxation_user_approved is false or absent when safety_impact is RELAXING or UNKNOWN
  - any test in required_tests fails
  - any file outside allowed_files is modified
  - any file in forbidden_files is touched
  - repo is dirty before implementation begins
  - task scope expands beyond the stated goal
  - commit_allowed is no and agent is about to commit
  - <FILL: any task-specific stop condition>
```

## 23. Commit Split Rule

```
commit_split_rule: |
  One task = at most one commit.
  If the implementation requires changes to files not in approved_commit_file_list,
  STOP and raise a new task card for those changes.
  Do not absorb additional files into this commit.
```

## 24. Rollback Plan

```
rollback_plan: |
  <FILL: How to undo this change if it causes a problem.
  E.g.: "git revert <commit SHA>. No runtime side effects.
  Re-run required_tests to confirm rollback is clean."
  Must be specific. "git revert" alone is not sufficient if there are dependencies.>
```

## 25. Final Report Requirements

The agent must report the following after completing the task:

```
final_report:
  - STATUS: PASS / FAIL / BLOCKED
  - task_id
  - files_changed: <list>
  - files_not_touched: <list>
  - tests_run: <list with pass/fail per test>
  - safety_impact_declared: <value>
  - relaxation_user_approved: <true | false | N/A>
  - relaxation_user_approval_evidence: <value | N/A>
  - commit_made: <yes | no>
  - commit_sha: <SHA | N/A>
  - ready_for_commit_gate: <yes | no | N/A>
  - ready_for_block_e: <yes | no>
```

## 26. Definition of Done

```
definition_of_done:
  - All required_tests pass
  - Only files in allowed_files were touched
  - No files in forbidden_files were touched
  - contract_direction accurately reflects the actual change made
  - safety_impact declared and consistent with actual change
  - If safety_impact is RELAXING or UNKNOWN: relaxation_user_approval_evidence is present, non-empty, and real
  - If commit_allowed is yes: commit is made with correct message and only approved_commit_file_list files
  - If commit_allowed is no: stopped at "Ready for commit gate: yes"
  - Final report produced
  - No scope expansion occurred
```

---

*End of TASK_TEMPLATE_LOCKED_DOC_CHANGE.md · PATCH D-1*
