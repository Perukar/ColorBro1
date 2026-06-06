# PERUKAR RALFBOT — Maintenance Guide

> Block E · Rule drift prevention and update policy
> This file defines how to keep RALFBOT's rules consistent over time.

---

## 1. Rule Drift Policy

Rule drift occurs when the same constraint is stated differently in multiple files.
Drift causes conflicts, confusion, and agent misbehavior.

**Prevention rule:** Every rule must have exactly one canonical source.
All other files that mention the rule must be short mirrors — they must not restate the rule in different words.
When the canonical source changes, the mirrors must be updated immediately.
Mirrors must not be updated independently of the canonical source.

**Detection:** Run a periodic audit (see §7) to find rules stated in more than one place
with different wording.

---

## 2. Canonical Files

These files are the authoritative source of truth for RALFBOT rules.

### `SKILL.md`
The Claude Code skill entry point.
Defines: skill name, description, activation conditions, and entry-point behavior.
If SKILL.md and another file conflict, SKILL.md governs skill activation only.

### `references/ralfbot-constitution.md`
The canonical source for all operating constraints, safety rules, and behavioral contracts.
Every rule that RALFBOT follows must originate here.
If a rule is not in the constitution, it is not a RALFBOT rule.

---

## 3. Short Mirrors

These files mirror rules from the canonical sources.
They must not add new rules independently.
They must not reword existing rules.

### `references/CLAUDE_TEMPLATE.md`
A condensed mirror of constitution rules, formatted for `CLAUDE.md` placement.
Status: **TEMPLATE ONLY — not installed.**
Contains: key constraints in a format Claude Code reads at session start.

### `references/AGENTS_RALFBOT_TOP_BLOCK.md`
A condensed mirror of constitution constraints, formatted for `AGENTS.md` prepend.
Status: **TEMPLATE ONLY — not installed.**
Contains: agent behavior rules, mode definitions, commit gate rules.

---

## 4. Update Order

When a rule changes, update files in this exact order.
Do not skip steps. Do not update out of order.

```
Step 1: references/ralfbot-constitution.md
  ↓ canonical rule is updated first
Step 2: SKILL.md
  ↓ if the skill entry point or activation logic is affected
Step 3: references/CLAUDE_TEMPLATE.md
  ↓ mirror updated to match constitution
Step 4: references/AGENTS_RALFBOT_TOP_BLOCK.md
  ↓ mirror updated to match constitution
Step 5: references/hooks/*.ps1
  ↓ if the rule has a corresponding hook enforcement
Step 6: backlog/task-schema.json + backlog/TASK_TEMPLATE_LOCKED_DOC_CHANGE.md
  ↓ if the rule affects task card structure or validation
Step 7: INSTALL.md, QUICKSTART.md, OPERATING_MANUAL.md,
        TROUBLESHOOTING.md, MAINTENANCE.md, VERIFY_BEFORE_INSTALL.md
  ↓ user-facing documentation updated last
```

Each step must be committed separately with a clear message referencing the rule change.
Do not bundle a constitution update and a hook update into one commit.

---

## 5. How to Update the Test Matrix Once

The test matrix (list of required tests) is defined in:
- `backlog/TASK_TEMPLATE_LOCKED_DOC_CHANGE.md` §18
- `backlog/task-schema.json` (as `required_tests` array items in examples)
- `references/ralfbot-constitution.md` (canonical)

To update the test matrix:

1. Determine the new test list
2. Update `references/ralfbot-constitution.md` first
3. Update `backlog/TASK_TEMPLATE_LOCKED_DOC_CHANGE.md` §18 to match exactly
4. Verify no other file defines a different test list
5. Create a `LOCKED_DOC_UPDATE` task card with `safety_impact: TIGHTENING` (if adding tests)
   or `safety_impact: RELAXING` (if removing tests — requires approval evidence)

---

## 6. How to Update the Locked File List

The list of locked files is referenced in:
- `references/ralfbot-constitution.md` (canonical)
- `OPERATING_MANUAL.md` §5 (mirror)
- `backlog/TASK_TEMPLATE_LOCKED_DOC_CHANGE.md` §11 default forbidden files (partial mirror)

To add a file to the locked list:
1. Update `references/ralfbot-constitution.md`
2. Update `OPERATING_MANUAL.md` §5
3. Update the default `forbidden_files` list in the task template if appropriate
4. `safety_impact: TIGHTENING` — no approval evidence required

To remove a file from the locked list:
1. This is a `safety_impact: RELAXING` change
2. Stop and obtain explicit user approval before proceeding
3. Record `relaxation_user_approval_evidence` with the exact approval quote
4. Update `references/ralfbot-constitution.md`
5. Update mirrors

---

## 7. How to Version the Package

RALFBOT uses semantic versioning: `MAJOR.MINOR.PATCH`.

| Increment | When |
|---|---|
| PATCH | Wording fix, typo, documentation clarification (CLARIFICATION_ONLY) |
| MINOR | New feature, new mode, new field (TIGHTENING or neutral) |
| MAJOR | Breaking change to task card format, removal of a rule (RELAXING) |

Version is recorded in:
- `references/ralfbot-constitution.md` header
- `backlog/task-schema.json` `version` field
- `SKILL.md` header comment

Update all three in step 6 of the update order.
Do not change the version number in one file without updating the others.

---

## 8. How to Audit Duplicated Rules

Run this audit periodically — at minimum, before any MAJOR version increment.

**Step 1: List all rule-bearing files**
```
backlog/README_BACKLOG.md
backlog/TASK_TEMPLATE_LOCKED_DOC_CHANGE.md
backlog/task-schema.json
references/ralfbot-constitution.md
references/CLAUDE_TEMPLATE.md
references/AGENTS_RALFBOT_TOP_BLOCK.md
SKILL.md
OPERATING_MANUAL.md
INSTALL.md
QUICKSTART.md
MAINTENANCE.md
TROUBLESHOOTING.md
VERIFY_BEFORE_INSTALL.md
```

**Step 2: For each rule, identify its canonical source**
Create a table:

| Rule | Canonical file | Mirror files |
|---|---|---|
| commit_allowed: yes required | ralfbot-constitution.md | README_BACKLOG.md, CLAUDE_TEMPLATE.md, AGENTS_RALFBOT_TOP_BLOCK.md |
| RELAXING requires evidence | ralfbot-constitution.md | README_BACKLOG.md, task-schema.json, TASK_TEMPLATE, OPERATING_MANUAL.md |
| … | … | … |

**Step 3: Verify wording consistency**
For each rule, compare the wording in canonical vs mirrors.
If any mirror states the rule differently, update the mirror to match the canonical.

**Step 4: Verify no mirror contains a rule not present in the canonical**
If a mirror has a rule that is not in `ralfbot-constitution.md`, either:
- Add it to the constitution (making it canonical), or
- Remove it from the mirror (it was added in error)

---

## 9. How to Prevent Source-of-Truth Drift

**Never update a mirror without updating the canonical first.**

**Never add a new rule to a mirror without adding it to the constitution first.**

**Use `LOCKED_DOC_UPDATE` mode** for any change to constitution or mirror files.

**After every rule change:** run the duplicate audit (§8) to confirm consistency.

**After every package version increment:** verify the version number is consistent
in all three versioned files.

---

## 10. Safety Relaxation Approval Evidence Rule

This rule applies to the maintenance process itself, not just to task cards.

When updating any rule that weakens a constraint:

- `relaxation_user_approved` must be `true`
- `relaxation_user_approval_evidence` must contain the **exact verbatim quote**
  from the user's explicit approval, or a traceable decision ID
- The evidence must be recorded in the task card used for the update
- The evidence must not be invented, inferred, paraphrased, or left empty
- Approval cannot be inferred from:
  - silence after presenting the change
  - a previous approval for a related but different change
  - the user's general support for the project
  - any indirect signal

If a rule was relaxed in a prior version without recorded evidence,
do not retroactively invent evidence. Document the gap in the constitution
and require explicit re-approval from the user for the next release.

---

*End of MAINTENANCE.md · Block E · PERUKAR RALFBOT*
