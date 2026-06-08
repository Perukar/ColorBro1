# Brand Data Layer Contract

**Date:** 2026-06-07
**HEAD at creation:** 6728e6d Harden formula correctness coverage
**Status:** NOT READY — brand matrix unavailable
**Schema doc:** [docs/brand-data-schema.md](brand-data-schema.md) — field definitions, validation rules, pseudo-schema, migration checklist
**Limitations doc:** [docs/known-limitations-contract.md](known-limitations-contract.md) §10 — brand matrix current limitation and activation checklist
**Readiness index:** [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix: production status, active vs diagnostic, known limitations summary, release checklist

---

> **Scaffold note (2026-06-07):** Pure readiness helpers (`isBrandRuleMatrixAvailable`, `validateBrandRuleMatrixShape`, `getMissingBrandMatrixFields`, `getBrandMatrixReadinessStatus`) and `REQUIRED_BRAND_MATRIX_FIELDS` have been added to `www/core.js`. These do **not** enable the brand matrix and do **not** change safety behavior. `hasBrandRuleMatrix` remains `false` inside `calculateProtocol`. All sensitive formulas remain `MANUAL_REQUIRED`.

---

## 1. Current state

`hasBrandRuleMatrix = false` is **intentionally hardcoded** in `www/core.js` as a safety net.

While `hasBrandRuleMatrix` remains `false`, **every sensitive formula produces `MANUAL_REQUIRED`**, not `APPROVED`. This is not a placeholder or temporary shortcut — it is the current production safety gate.

### Sensitive formula types guarded by the brand gate

| Formula type | Detection rule |
|---|---|
| Special Blond | process text includes `special blond` / `спецблонд` |
| Grey .00 coverage | dye text includes `.00` / `/00` / `double natural` / `intense natural` |
| High oxidizer ≥9% | computed oxidizer percent ≥ 9% on root or length |
| Powder / lightening | process text includes `powder` / `порошок` / `порош` |
| Toning line uncertainty | process text includes `тонування` / `перманент / тонування` / `toning` |

### What is NOT guarded by the brand gate

Generic permanent 6% with no sensitive marker does not trigger the brand gate. This is by design — a baseline permanent at same-level or 1-step lift on healthy hair with no special additives does not require brand-specific data. Current tests confirm this false-positive is absent:
`BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE`.

### G1 gap dependency

`condition='пористі'` (legacy general condition field) does **not** independently feed `hasHighPorositySignal` (which reads only from the separate `porosity` field) and does **not** appear in `legacyHighOxidizerRisk` markers. When combined with Special Blond and an empty `porosity` field, the only active safety net is this brand gate. Regression test: `G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL`. If `hasBrandRuleMatrix` is ever made conditional, a dedicated `condition`-field porous + SB guard must be added before or at the same time.

---

## 2. Required data before enabling brand matrix

A brand entry must provide **all** of the following fields. Missing any field → `MANUAL_REQUIRED` for that process, even if the matrix is otherwise present.

| Field | Description |
|---|---|
| `brand_name` | Exact brand name (e.g. Wella, Matrix, Schwarzkopf) |
| `line` | Product line / series (e.g. Koleston Perfect, Color Touch) |
| `process_category` | One of: permanent, semi-permanent, special_blond, powder, toning |
| `oxidizer_compatibility` | Supported oxidizer concentrations (array: e.g. `[3%, 6%, 9%, 12%]`) |
| `mix_ratio` | Mixing ratio for each oxidizer (e.g. `1:1` for permanent, `1:2` for toning) |
| `timing_range_min` | Minimum processing time in minutes |
| `timing_range_max` | Maximum processing time in minutes |
| `grey_coverage_policy` | Whether this line covers grey and minimum oxidizer required |
| `special_blond_policy` | Whether Special Blond is supported and any level/condition restrictions |
| `powder_lightening_policy` | Whether powder lightening is supported and safety restrictions |
| `toning_policy` | Whether toning is supported and dilution/ratio policy |
| `contraindications` | Known incompatibilities, condition limits, scalp restrictions |
| `manual_review_triggers` | Conditions that must escalate to `MANUAL_REQUIRED` even within the brand line |
| `validated_by` | Source of validation (e.g. manufacturer spec sheet, version, date) |

---

## 3. Incomplete data rule

If any field from the table above is absent or unknown for a given brand and process:

| Situation | Required outcome |
|---|---|
| Field missing | `MANUAL_REQUIRED` |
| Process unknown for this brand | `MANUAL_REQUIRED` |
| Brand line not in matrix | `MANUAL_REQUIRED` |
| Conflicting data between fields | `MANUAL_REQUIRED` or `BLOCKED`, **never `APPROVED`** |
| Brand present but version unconfirmed | `MANUAL_REQUIRED` |
| Partial coverage (some processes validated, others not) | `MANUAL_REQUIRED` for uncovered processes only; `APPROVED` path requires full field coverage for that specific process |

The rule is: **uncertainty defaults to `MANUAL_REQUIRED`, never `APPROVED`**.

---

## 4. Enabling the brand matrix — required steps

Before `hasBrandRuleMatrix` is changed from `false` to any conditional or truthy value, **all** of the following must be in place:

1. A validated brand entry object with all required fields from §2 is present in code or data.
2. The entry covers the specific process, line, and oxidizer being used.
3. New tests are added that:
   - Confirm `APPROVED` is reachable only when all required fields are present.
   - Confirm `MANUAL_REQUIRED` is produced for each missing field individually.
   - Confirm the G1 gap is explicitly handled: `condition='пористі'` + Special Blond must still produce `MANUAL_REQUIRED` unless a dedicated condition-field porous guard exists in addition to the brand gate.
4. Full test matrix passes: `test_www_business_scenarios.js`, `test_www_render_runtime.js`, `test_www_mass_model.js`, `test_www_mapping.js`.
5. `git diff --check` passes.
6. The commit message explicitly states that brand matrix is being enabled and names the brand/line being added.

---

## 5. Forbidden shortcuts

- **Never** replace `hasBrandRuleMatrix = false` with `true` as a development convenience or to unblock testing.
- **Never** add fake or invented brand data (e.g. made-up oxidizer percentages, fictional line names).
- **Never** allow Special Blond, powder, grey .00, high oxidizer, or toning to become `APPROVED` through brand assumptions without real validated data.
- **Never** assume a brand's oxidizer policy from general knowledge — only manufacturer-validated spec data is acceptable.
- **Never** make `hasBrandRuleMatrix` conditional on a simple string check (e.g. `brandName !== ''`) — that would silently unblock all sensitive formulas with any brand name present.

---

## 6. Tests that lock current brand gate behavior

All of the following tests must remain passing at all times. They document the current safety contract and will catch any regression:

| Test name | What it locks |
|---|---|
| `BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED` | Special Blond → MANUAL\_REQUIRED without brand matrix |
| `BRAND-MISSING-GREY-00-NO-APPROVED` | Grey .00 → MANUAL\_REQUIRED without brand matrix |
| `BRAND-MISSING-HIGH-OXIDIZER-NO-APPROVED` | High oxidizer ≥9% → MANUAL\_REQUIRED without brand matrix |
| `BRAND-MISSING-POWDER-NO-APPROVED` | Powder / lightening → MANUAL\_REQUIRED without brand matrix |
| `BRAND-MISSING-TONING-LINE-NO-APPROVED` | Toning uncertainty → MANUAL\_REQUIRED without brand matrix |
| `BRAND-NORMAL-SAME-LEVEL-NO-FALSE-POSITIVE` | Same-level permanent → brand gate does NOT fire |
| `BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE` | Generic permanent 6% → brand gate does NOT fire |
| `G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL` | condition=пористі + SB + empty porosity → MANUAL\_REQUIRED via brand gate |
| `BRAND-HELPER-NULL-MATRIX-NOT-AVAILABLE` | `isBrandRuleMatrixAvailable(null/undefined/false/{})` → `false` |
| `BRAND-HELPER-EMPTY-MATRIX-NOT-AVAILABLE` | `isBrandRuleMatrixAvailable([])` → `false` |
| `BRAND-HELPER-MISSING-FIELDS-REPORT` | `getMissingBrandMatrixFields` returns correct missing count |
| `BRAND-HELPER-PARTIAL-ENTRY-NOT-READY` | `validateBrandRuleMatrixShape` with partial entry → `ready: false` |
| `BRAND-HELPER-PENDING-STATUS-NOT-READY` | full-shape entry with `validationStatus: 'pending'` → `ready: false` |
| `BRAND-HELPER-READINESS-STATUS-NOT-READY` | `getBrandMatrixReadinessStatus(null/[]/partial)` → `'NOT_READY'` |
| `BRAND-HELPER-FIELDS-COUNT` | `REQUIRED_BRAND_MATRIX_FIELDS.length` === 18 |
| `BRAND-HELPER-BEHAVIOR-PRESERVED` | All 4 helpers defined; `calculateProtocol` still accessible |
