# Input Model Contract

**Date:** 2026-06-08
**HEAD at creation:** 6103656 Scaffold brand data layer readiness
**Status:** ACTIVE — normalization layer hardened

See also: [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — production gate policy.

---

## 1. Purpose

This document defines the authoritative contract for how `www/core.js` reads, normalizes, and interprets every input field. It exists to make input handling explicit, testable, and safer — especially at the boundary between legacy fields (`condition`) and newer zone-specific fields (`root_condition`, `length_condition`, `porosity`).

The contract applies to `calculateProtocol()`. All normalization rules below are enforced by code. Tests listed in §15 lock this behavior.

---

## 2. Current input model

`calculateProtocol()` reads all inputs via `document.getElementById(fieldId)`. The field set has three generations:

| Generation | Fields | Status |
|---|---|---|
| Original | `history`, `condition`, `grey_percent`, `grey_type`, `root_level`, `length_level`, `target_level`, `target_direction`, `base_type`, `allergy` | Active, critical |
| Extended mass/physical | `density`, `thickness`, `length`, `root_length`, `scalp_sensitivity` | Active, critical |
| Zone-specific | `root_condition`, `length_condition`, `porosity`, `elasticity` | Active, optional |
| Ends/third-zone | `ends_level`, `ends_condition`, `ends_history`, `ends_base_type` | Active, optional, diagnostic only |

---

## 3. Critical fields

Missing or invalid critical fields produce `BLOCKED` (insufficient data or unrecognized enum). No APPROVED output is possible without all critical fields.

| Field | Type | Missing behavior | Enum validation |
|---|---|---|---|
| `root_level` | integer | BLOCKED (NaN) | — |
| `length_level` | integer | BLOCKED (NaN) | — |
| `target_level` | integer | BLOCKED (NaN) | — |
| `history` | string | BLOCKED (empty) | marker-based, no enum |
| `base_type` | string | BLOCKED (empty) | no enum |
| `condition` | string | BLOCKED (empty) | no enum, normalized (trimmed) |
| `scalp_sensitivity` | string | BLOCKED (empty) | set-based gate |
| `target_direction` | string | BLOCKED (empty) | no enum |
| `length` | string | BLOCKED (empty or unrecognized) | `['короткие', 'средние', 'длинные']` |
| `density` | string | BLOCKED (empty or unrecognized) | `['редкие', 'средние', 'густые']` |
| `thickness` | string | BLOCKED (empty or unrecognized) | `['тонкие', 'средние', 'толстые']` |
| `allergy` | string | MANUAL_REQUIRED | set-based gate (unknown → MANUAL; positive → BLOCKED) |

The missing check for numeric fields uses `Number.isFinite()` — NaN, Infinity, null all fail. The missing check for string fields uses `String(value || '').trim() === ''`.

---

## 4. Optional fields

Optional fields produce no signal when absent or empty. They can only add warnings or manual decisions — never convert a BLOCKED to APPROVED, and never convert MANUAL_REQUIRED to APPROVED.

| Field | Absent behavior | Present non-neutral behavior |
|---|---|---|
| `root_condition` | no signal | damage markers → MANUAL_REQUIRED for root lift |
| `length_condition` | no signal | damage markers → MANUAL_REQUIRED for length lift |
| `porosity` | no signal | high porosity markers → MANUAL_REQUIRED |
| `elasticity` | no signal | low elasticity markers → MANUAL_REQUIRED |
| `grey_percent` | NaN → falsy (safe, no grey gate fires) | ≥30% adds warnings; ≥50% changes recipe |
| `grey_type` | miss check (safe) | `стекловидная` → diagnostics |
| `root_length` | 0 → no hot root | ≥3 cm with rStep > 0 → hot root warning |

---

## 5. Legacy fields

`condition` is the original general-purpose hair condition field. It is still used as a critical production field (BLOCKED if empty). However, its meaning overlaps with newer zone-specific fields:

| Legacy use of `condition` | Replaced by / co-exists with |
|---|---|
| General porous flag (`'пористі'`) | `porosity` field (zone-specific) |
| General damage flag (`'сильно поврежденные'`) | `root_condition`, `length_condition` |
| Passed to `calcMixtone()` for length zone | No replacement — legacy path |

**G1 gap:** `condition='пористі'` does NOT feed `hasHighPorositySignal` (which reads only `porosity`). When combined with Special Blond and empty `porosity`, the brand gate (`hasBrandRuleMatrix = false`) is the current safety net. See `docs/brand-data-layer-contract.md §1 G1 gap dependency`.

**Rule:** Legacy `condition` signals must not override safety decisions made by newer zone-specific fields. Zone-specific damage signals are additive — they stack with legacy signals, never cancel them.

---

## 6. Zone-specific fields

Zone-specific fields are optional elements. When the DOM element is absent, they default to empty string with no signal.

| Field | Scope | Gate behavior |
|---|---|---|
| `root_condition` | Root zone only | Damage markers → `MANUAL_REQUIRED` for root lift / high-oxidizer processes |
| `length_condition` | Length zone only | Damage markers → `MANUAL_REQUIRED` for length lift / high-oxidizer processes |
| `porosity` | Full canvas | High porosity markers → `MANUAL_REQUIRED`; neutral markers → no signal |

**Zone isolation rule:** `root_condition` damage signals affect only root-zone decisions. `length_condition` damage signals affect only length-zone decisions. Neither crosses into the other zone. However, legacy `condition` affects both zones when it carries damage markers (this is by design — general condition is a global signal).

**Marker matching:** Zone-specific fields use substring include-check against marker lists, not exact-match. This tolerates variations in phrasing. Neutral markers (healthy, normal, норм) prevent false positives from partial matches.

---

## 7. Ends/third-zone fields

All ends fields are optional. None of them enable production endsRec or production 3-zone recipe. Their role is diagnostic and manual-decision gating only.

| Field | Optional | Absent behavior | Present risky behavior |
|---|---|---|---|
| `ends_level` | yes | `eLevel = null`, no ends gate | differs from root/length → MANUAL_REQUIRED |
| `ends_condition` | yes | no signal | risk markers → MANUAL_REQUIRED |
| `ends_history` | yes | no signal | risk markers → MANUAL_REQUIRED |
| `ends_base_type` | yes | no signal | risk markers + lightening needed → MANUAL_REQUIRED |

**Invariant:** Even if all ends fields are present and risky, the output is `MANUAL_REQUIRED`, never `APPROVED`. Production endsRec requires `validateProductionEndsRecReadiness()` to pass, which has its own separate gate that is not currently enabled for production use.

**Same-level ends:** If `ends_level === length_level`, the three-zone gate does not fire. The system stays in 2-zone mode.

---

## 8. Normalization rules

### 8.1 Text normalization

All string inputs are normalized via `normalizeTextInput(value)` before interpretation:

```javascript
normalizeTextInput(value) → String(value || '').trim()
```

This removes leading/trailing whitespace. Empty strings after trim are treated as missing.

**Which fields are normalized at read time:**
- `condition` — normalized at read (trim applied before all downstream checks)
- `root_condition`, `length_condition`, `porosity` — trimmed at element read with `String(element.value || '').trim()`
- `thickness`, `density`, `length` — preserved for enum check (enum check uses trimmed value `String(value || '').trim()`)
- `history`, `base_type` — NOT trimmed at read time; marker-based detection uses `.toLowerCase()` + `.includes()` which is whitespace-tolerant for internal markers

### 8.2 Enum normalization

Critical enum fields (`length`, `density`, `thickness`) are validated against exact allowed-value sets. The validation trims the value before comparison:

```
allowedLengthValues = { 'короткие', 'средние', 'длинные' }
allowedDensityValues = { 'редкие', 'средние', 'густые' }
allowedThicknessValues = { 'тонкие', 'средние', 'толстые' }
```

Any non-empty value not in the allowed set → BLOCKED. Empty value → BLOCKED (missing critical field).

### 8.3 Numeric normalization

Level fields (`root_level`, `length_level`, `target_level`) use `parseInt()`. If the result is not `Number.isFinite()` → BLOCKED. NaN, Infinity, non-numeric strings all fail.

### 8.4 Case sensitivity

- Exact enum matches: case-sensitive (allowed values are lowercase Cyrillic/Latin as defined)
- Marker-based matches: all converted to `.toLowerCase()` before check → case-insensitive in practice
- Gate sets (allergy, scalp): `.toLowerCase()` applied before Set lookup → case-insensitive

---

## 9. Unknown-value behavior

| Field type | Unknown value behavior | Allowed to produce APPROVED? |
|---|---|---|
| Enum field (length/density/thickness) | BLOCKED | No |
| Legacy `condition` (unrecognized value) | Passes missing check if non-empty; no specific gate fires | Only if no other safety gate fires |
| Optional field with unrecognized value | No signal (no marker match) | No additional block added, but no permission added either |
| Gate set (allergy/scalp) | Unknown → MANUAL_REQUIRED | No |
| Numeric (NaN) | BLOCKED | No |

**Rule:** Unknown values for critical enum fields are always BLOCKED. Unknown values for optional fields produce no signal (no positive or negative effect). An unknown value for a critical gate-set field is treated as unknown/unsafe → MANUAL_REQUIRED.

---

## 10. Missing-value behavior

| Field | Empty string | Absent element |
|---|---|---|
| `root_level` / `length_level` / `target_level` | BLOCKED (parseInt('') = NaN) | BLOCKED |
| `history` / `condition` / `base_type` | BLOCKED | BLOCKED |
| `length` / `density` / `thickness` | BLOCKED (missing critical field) | BLOCKED |
| `scalp_sensitivity` / `target_direction` | BLOCKED | BLOCKED |
| `allergy` | MANUAL_REQUIRED (unknown allergy status) | MANUAL_REQUIRED |
| `root_condition` | no signal | no signal (element may be absent) |
| `length_condition` | no signal | no signal |
| `porosity` | no signal | no signal |
| `elasticity` | no signal | no signal |
| `ends_level` | eLevel = null, no ends gate | eLevel = null |
| `ends_condition` / `ends_history` / `ends_base_type` | no signal | no signal |

**Rule:** Empty string must not silently become a safe default for any critical field. Empty string → BLOCKED is the correct outcome for enum fields.

---

## 11. Conflict behavior

| Conflict type | Required behavior |
|---|---|
| `condition='пористі'` AND `porosity` has high signal | Both gates fire independently — MANUAL_REQUIRED from porosity gate and brand gate |
| `root_condition` damaged AND `length_condition` healthy | Root MANUAL; length not affected |
| `length_condition` damaged AND `root_condition` healthy | Length MANUAL; root not affected |
| `condition='сильно поврежденные'` AND `root_condition` healthy | Legacy gate fires (global), zones not cancelled |
| `ends_level` differs from `length_level` AND risky `ends_condition` | Both MANUAL triggers fire |
| `grey_percent >= 50` AND Special Blond process | Brand gate fires (MANUAL_REQUIRED) — Special Blond at high grey always MANUAL |
| Low elasticity AND high oxidizer | Both fire independently — high oxidizer risk gate + low elasticity signal both produce MANUAL_REQUIRED |
| Contradictory conditions (e.g. damaged root + no damage length + SB on both) | MANUAL_REQUIRED — conflicting signals are never resolved to APPROVED |

**Rule:** When multiple signals conflict or co-occur, they stack toward `MANUAL_REQUIRED`, never cancel each other. The more restrictive outcome wins.

---

## 12. Safety output mapping

| Input state | Maximum safe output |
|---|---|
| Any critical field missing | `BLOCKED` |
| Any critical enum field unrecognized | `BLOCKED` |
| Allergy confirmed positive | `BLOCKED` |
| Scalp irritated | `BLOCKED` |
| `condition='сильно поврежденные'` with lStep > 0 | `BLOCKED` |
| Henna/metals in history | `MANUAL_REQUIRED` |
| Black/dark cosmetic exit diagnostic | `MANUAL_REQUIRED` |
| Zone-specific damage + lift | `MANUAL_REQUIRED` |
| High porosity + any chemical | `MANUAL_REQUIRED` |
| Low elasticity + lift/SB/high-oxidizer | `MANUAL_REQUIRED` |
| Brand-sensitive formula (SB/grey .00/high-ox/powder/toning) without brand matrix | `MANUAL_REQUIRED` |
| G1: `condition='пористі'` + SB + empty porosity | `MANUAL_REQUIRED` (via brand gate) |
| Allergy unknown | `MANUAL_REQUIRED` |
| Scalp non-normal | `MANUAL_REQUIRED` |
| Ends conflict detected | `MANUAL_REQUIRED` |
| All critical fields valid, no safety gates | `APPROVED` possible (non-sensitive formula only) |

**Invariant:** `status === 'APPROVED' && productionReady === true` is the ONLY gate for executable recipe output. All other paths must not render a production recipe.

---

## 13. Forbidden shortcuts

- **Never** silently default a missing critical field to a safe enum value (e.g., missing density → 'средние').
- **Never** interpret an unrecognized enum value as the closest valid enum (e.g., 'medio' → 'средние').
- **Never** allow zone-specific damage signals to cancel legacy condition signals — they stack.
- **Never** allow legacy `condition` to override a MANUAL_REQUIRED or BLOCKED triggered by a zone-specific field.
- **Never** allow `ends_level` being present to auto-enable production 3-zone recipe.
- **Never** allow `condition='пористі'` + empty `porosity` to produce APPROVED for Special Blond without a dedicated porous guard (current safety net is brand gate).
- **Never** skip the G1 regression test when changing `condition` or `porosity` handling.
- **Never** change field names or remove legacy fields from the input model without a full migration checklist.

---

## 14. Migration checklist

Before changing any input field name, removing a legacy field, or changing how a critical field is read:

- [ ] All 15 sections of this document are updated to reflect the change.
- [ ] `docs/input-safety-gates-contract.md` cross-reference updated.
- [ ] New field names are reflected in the UI and in all test scenario fixtures.
- [ ] Existing tests that reference the old field name pass under the new name.
- [ ] G1 regression (`G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL`) still passes.
- [ ] All enum gate regression tests pass.
- [ ] Legacy `condition` field is not removed until a dedicated zone-specific replacement for all its downstream uses is in place.
- [ ] Full test matrix: `node test_www_business_scenarios.js`, `node test_www_render_runtime.js`, `node test_www_mass_model.js`, `node test_www_mapping.js`.
- [ ] `git diff --check` passes.
- [ ] Commit message explicitly names the migrated field and describes the change.

---

## 15. Test requirements

### Existing tests that lock current behavior

| Test name | What it locks |
|---|---|
| `MISSING-CRITICAL-DATA` | Empty critical fields → BLOCKED, no APPROVED |
| `G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL` | G1 gap: porous condition + SB + empty porosity → MANUAL_REQUIRED |
| `ELASTICITY-NORMAL-FALSE-POSITIVE` | Normal elasticity does not produce false-positive MANUAL |
| `ELASTICITY-LOW-RISKY-LIFT` | Low elasticity + SB → MANUAL_REQUIRED |
| `SPECIAL-BLOND-NORMAL-POROSITY-NO-FALSE-POSITIVE` | Normal porosity does not block SB |
| `SPECIAL-BLOND-BARE-POROSITY-LABEL` | High porosity bare label → MANUAL for SB |
| `ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED` | Damaged root without lift → no false BLOCKED |
| `ROOT-BARE-LABEL-NO-FALSE-POSITIVE` | Damaged root bare label, no lift → no false MANUAL |
| `ROOT-DAMAGED-NO-ROOT-LIFT-WARNING` | Damaged root + lift → MANUAL_REQUIRED |
| `LENGTH-HEALTHY-ROOT-DAMAGED-NO-FALSE-POSITIVE` | Root damage does not bleed into length zone |
| `LENGTH-DAMAGED-NO-LENGTH-LIFT` | Length damage alone without lift → no false block |
| `LENGTH-DAMAGED-NO-LENGTH-LIFT-WARNING` | Length damage + lift → MANUAL_REQUIRED |

### Tests added in this task (enum gate regression)

| Test name | What it locks |
|---|---|
| `INPUT-ENUM-UNKNOWN-DENSITY-BLOCKED` | Unknown density value → BLOCKED |
| `INPUT-ENUM-UNKNOWN-THICKNESS-BLOCKED` | Unknown thickness value → BLOCKED |
| `INPUT-ENUM-UNKNOWN-LENGTH-BLOCKED` | Unknown length value → BLOCKED |
| `INPUT-ENUM-EMPTY-DENSITY-BLOCKED` | Empty density → BLOCKED |
| `INPUT-ENUM-EMPTY-THICKNESS-BLOCKED` | Empty thickness → BLOCKED |
| `INPUT-ENUM-EMPTY-LENGTH-BLOCKED` | Empty length → BLOCKED |
| `INPUT-NORM-CONDITION-TRIM` | Trimmed condition string still triggers correct diagnostic |
| `INPUT-HELPER-NORMALIZE-TEXT` | `normalizeTextInput` trims whitespace correctly |
| `INPUT-HELPER-CLASSIFY-MISSING` | `classifyMissingInput` identifies empty/present correctly |
| `INPUT-HELPER-NORMALIZE-ENUM` | `normalizeEnumInput` matches allowed set correctly |
