# PERUKAR RALFBOT — Backlog README

> Version: 1.0 · PATCH D-1 applied · Block D

---

## What this backlog IS and IS NOT

### IS: a queue of bounded tasks
Every card in this backlog represents a single, concrete, bounded goal.  
A task has a defined start state, a defined end state, and an explicit commit decision.  
The backlog is a **controlled queue**, not an autopilot.

### IS NOT: an autopilot
The agent does not decide what to do next.  
The agent does not chain tasks automatically.  
The agent does not infer intent from vague instructions.  
The agent executes one card at a time and stops.

---

## Core rules

### One task = one goal = at most one commit

Each task card covers exactly one goal.  
A single task must not expand to cover multiple goals.  
If work reveals additional goals, they become new cards — they are not absorbed into the current task.  
One task produces at most one commit (or zero commits if `commit_allowed: no`).

### allowed_files = maximum scope, not approved commit list

The `allowed_files` list in a task card defines the **maximum set of files the agent may touch**.  
It is a boundary constraint, not a pre-approval of commits.  
The agent must not commit every file it touched just because it is in `allowed_files`.  
The actual commit file list is defined separately in `approved_commit_file_list`.

### Commit requires explicit `Commit: yes`

The agent must not commit unless the task card explicitly contains:
```
commit_allowed: yes
```

If `commit_allowed: no`, the agent must:
1. Complete all implementation work.
2. Run all required tests.
3. Stop at: **Ready for commit gate: yes**
4. Report state and wait for the user to issue a commit card.

The agent must never commit on its own initiative.

### Dirty repo before implementation → read-only dirty state audit

If the repository contains uncommitted changes before the agent begins implementation,  
the agent must NOT proceed with implementation.  
Instead, the agent must:
1. Switch to `mode: READONLY_AUDIT`
2. Document all dirty files and their status
3. Stop and report the dirty state to the user
4. Wait for explicit instruction

The agent must not silently stash, reset, or overwrite uncommitted work.

### Vague tasks must be converted to bounded cards first

The agent must refuse to act on vague instructions such as:
- "continue"
- "fix everything"
- "make it better"
- "do the next step"
- "clean up"

If a request is vague, the agent must:
1. Stop immediately
2. Convert the vague request into one or more bounded task cards
3. Present the proposed cards to the user
4. Wait for explicit approval before executing any card

### LOCKED_DOC_UPDATE requires safety impact declaration

Any task that modifies a locked documentation file must:
1. Use `mode: LOCKED_DOC_UPDATE`
2. Declare a `safety_impact` value (see below)
3. Document `contract_direction` (old → new contract)
4. List all `affected_invariants`
5. Specify `required_paired_changes`
6. Include a `rollback_plan`

---

## Safety impact rules (PATCH D-1)

Every `LOCKED_DOC_UPDATE` task must declare one of the following safety impact levels:

| Value | Meaning |
|---|---|
| `TIGHTENING` | The change makes rules more strict. Lower risk. |
| `CLARIFICATION_ONLY` | No rule change, only wording. No safety risk. |
| `RELAXING` | The change weakens or removes a constraint. **HIGH RISK.** |
| `UNKNOWN` | Impact cannot be determined. Treat as high risk. |

### RELAXING or UNKNOWN → explicit user approval required

If `safety_impact` is `RELAXING` or `UNKNOWN`, the agent must:

1. **STOP** — do not proceed with implementation
2. Present the proposed change and its safety impact to the user
3. Require explicit user decision (not silence, not inference)
4. Record the approval in **two fields**:

```
relaxation_user_approved: true
relaxation_user_approval_evidence: "<exact quote or decision ID>"
```

#### Rules for `relaxation_user_approval_evidence`:

- Must be the **exact quote** from the user's approval message, or a **decision ID** from an explicit approval record
- Must not be empty
- Must not be a paraphrase or summary
- The agent must **NOT** infer approval from:
  - silence
  - lack of objection
  - prior related approvals
  - any indirect signal
- The agent must **NOT** invent, fabricate, or synthesize approval evidence
- A boolean `relaxation_user_approved: true` alone is **NOT sufficient** — evidence is mandatory

If `relaxation_user_approval_evidence` is missing, empty, or fabricated, the task is **BLOCKED** and must not proceed.

---

## Task modes

| Mode | Description |
|---|---|
| `READONLY_AUDIT` | Read-only inspection. No writes. |
| `IMPLEMENTATION` | Active development work. |
| `RECOVERY` | Fixing a broken state. |
| `COMMIT_GATE` | Explicit commit authorization card. |
| `DOCUMENTATION` | Documentation-only changes. |
| `LOCKED_DOC_UPDATE` | Modifying a locked/contract document. Full safety protocol. |
| `CLEANUP` | Mechanical cleanup (formatting, dead code). No logic changes. |
| `UNKNOWN_TO_AUDIT` | Ambiguous state — must audit before any action. |

---

## Commit gate flow

```
Task card received
    ↓
commit_allowed?
    ├── yes → implement → test → commit → report
    └── no  → implement → test → stop at "Ready for commit gate: yes" → report → wait
```

A separate `COMMIT_GATE` card must be issued by the user to authorize a commit  
when `commit_allowed: no` was used in the implementation card.

---

## Template

See: `TASK_TEMPLATE_LOCKED_DOC_CHANGE.md`

## Schema

See: `task-schema.json`

---

*End of README_BACKLOG.md*
