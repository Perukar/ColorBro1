# Brand Data Schema

**Date:** 2026-06-07
**HEAD at creation:** 43c669b Document brand data layer safety contract
**Status:** SCHEMA ONLY — no real brand data present or planned

See also: [docs/brand-data-layer-contract.md](brand-data-layer-contract.md) — safety contract and enabling checklist.

---

## 1. Purpose

This document defines the required structure of a brand rule matrix entry for use in `www/core.js`. It exists so that when real validated brand data is eventually introduced, there is an unambiguous schema to validate against — before any code changes to `hasBrandRuleMatrix`.

This schema is a **contract**, not an implementation. No real brand data is present in the codebase. No brand formula is approved by this document.

---

## 2. Non-goals

- This document does NOT contain real brand formulas, oxidizer rules, or product data.
- This document does NOT approve any formula that is currently `MANUAL_REQUIRED` or `BLOCKED`.
- This document does NOT enable `hasBrandRuleMatrix`. That flag remains `false`.
- This document does NOT define UI presentation or label formatting.
- This document does NOT replace the safety contract in `docs/brand-data-layer-contract.md`.
- This document does NOT specify backend API contracts — only the in-memory shape consumed by `www/core.js`.

---

## 3. Required brand matrix fields

Every entry in a brand rule matrix must contain **all** of the following fields. Any missing or `null` field for a given brand+line+process combination must produce `MANUAL_REQUIRED`, never `APPROVED`.

| Field | Type | Description |
|---|---|---|
| `brandId` | `string` | Unique machine-readable brand identifier. Non-empty, no spaces, ASCII only. |
| `brandDisplayName` | `string` | Human-readable brand name for output. Non-empty. |
| `lineId` | `string` | Unique machine-readable product line identifier within the brand. Non-empty. |
| `lineDisplayName` | `string` | Human-readable product line name for output. Non-empty. |
| `processCategory` | `string` | One of the valid process categories listed in §4. |
| `supportedLevels` | `object` | Min/max hair level range this entry applies to. See §4 for shape. |
| `oxidizerCompatibility` | `array<number>` | Oxidizer concentrations (as percentages) supported by this line. Non-empty array. |
| `mixRatio` | `string` | Mixing ratio for this entry (e.g. `"1:1"`, `"1:2"`). Must be a valid ratio string. |
| `timingRange` | `object` | `{ min: number, max: number }` — processing time in minutes. Both required, min ≤ max. |
| `greyCoveragePolicy` | `object` | Grey coverage support and minimum oxidizer. See §5 for required shape. |
| `specialBlondPolicy` | `object` | Special Blond support, level/condition constraints. See §5 for required shape. |
| `powderPolicy` | `object` | Powder/lightening support and safety restrictions. See §5 for required shape. |
| `toningPolicy` | `object` | Toning support, dilution ratio, oxidizer restrictions. See §5 for required shape. |
| `contraindications` | `array<string>` | Known incompatibilities, condition limits, scalp restrictions. May be empty array if none, but field must be present. |
| `manualReviewTriggers` | `array<string>` | Conditions that escalate to `MANUAL_REQUIRED` even within this brand line. Must include G1-type porous triggers if `specialBlondPolicy.supported` is `true`. |
| `sourceReference` | `string` | Source of validation data (e.g. spec sheet name, URL, version, date). Non-empty. |
| `validationStatus` | `string` | One of: `"validated"`, `"pending"`, `"expired"`. Only `"validated"` entries may contribute to `APPROVED`. |
| `lastReviewedAt` | `string` | ISO 8601 date string (e.g. `"2026-06-07"`). Required for staleness checks. |

Total required fields: **18**.

---

## 4. Required process categories

The `processCategory` field must be one of the following exact strings:

| Value | Description |
|---|---|
| `"permanent"` | Standard permanent oxidative dye |
| `"semi_permanent"` | Semi-permanent or demi-permanent color |
| `"special_blond"` | Special Blond / intense lift process |
| `"powder"` | Powder lightener / bleach |
| `"toning"` | Toning treatment (low-oxidizer overlay) |

Any other string is invalid and must produce `MANUAL_REQUIRED`.

The `supportedLevels` field shape:

```
{
  minLevel: number,   // minimum starting level (1–10)
  maxLevel: number    // maximum target level (1–10), maxLevel >= minLevel
}
```

---

## 5. Required safety fields

These three policy objects contain safety-critical data. Each subfield below is required when the parent object is present. A missing subfield → `MANUAL_REQUIRED`.

### `greyCoveragePolicy`

```
{
  supported: boolean,           // true = this line covers grey hair
  minOxidizer: number | null    // minimum oxidizer % required for grey coverage; null if !supported
}
```

### `specialBlondPolicy`

```
{
  supported: boolean,           // true = this line supports Special Blond process
  maxLiftSteps: number | null,  // maximum lift steps allowed; null if !supported
  porousHairAllowed: boolean,   // must be explicitly false if porous contraindicated
  manualIfPorous: boolean       // if true, porous hair + SB always → MANUAL_REQUIRED regardless of brand gate
}
```

**Safety requirement:** if `specialBlondPolicy.supported` is `true`, then `manualReviewTriggers` must contain at least one entry covering porous hair conditions. This is the G1 gap mitigation.

### `powderPolicy`

```
{
  supported: boolean,           // true = this line includes powder lightening
  requiresPreTest: boolean,     // true = patch/strand test mandatory
  contraindicatedConditions: array<string>   // e.g. ["пористі", "damaged", "previously lightened"]
}
```

### `toningPolicy`

```
{
  supported: boolean,           // true = toning is available in this line
  dilutionRatio: string | null, // e.g. "1:2"; null if !supported
  maxOxidizer: number | null    // maximum oxidizer % for toning; null if !supported
}
```

---

## 6. Required validation rules

Before a brand entry may be used by `www/core.js`, it must pass all of the following validation rules. Failure of any rule → entry treated as absent → `MANUAL_REQUIRED`.

| Rule | Check |
|---|---|
| All 18 fields present | `typeof entry.fieldName !== 'undefined'` for each field |
| No null on required scalars | `brandId`, `brandDisplayName`, `lineId`, `lineDisplayName`, `processCategory`, `mixRatio`, `sourceReference`, `validationStatus`, `lastReviewedAt` must be non-null non-empty strings |
| `processCategory` in allowed set | Must be one of the 5 values in §4 |
| `oxidizerCompatibility` non-empty | Array with at least one numeric value |
| `timingRange` coherent | `timingRange.min >= 0`, `timingRange.max >= timingRange.min` |
| `supportedLevels` coherent | `minLevel >= 1`, `maxLevel <= 10`, `maxLevel >= minLevel` |
| `validationStatus` must be `"validated"` | Any other value → entry not usable for `APPROVED` path |
| `lastReviewedAt` parseable as date | ISO 8601, not in the future, not older than policy-defined staleness limit |
| Policy objects fully shaped | All subfields of `greyCoveragePolicy`, `specialBlondPolicy`, `powderPolicy`, `toningPolicy` present |
| G1 guard if SB supported | If `specialBlondPolicy.supported === true`, `manualReviewTriggers` must include a porous hair trigger |

---

## 7. Incomplete data behavior

| Situation | Required behavior |
|---|---|
| Entry field missing | `MANUAL_REQUIRED` for that process |
| Entry field `null` for a required scalar | `MANUAL_REQUIRED` |
| `validationStatus !== "validated"` | `MANUAL_REQUIRED` |
| `processCategory` not in allowed set | `MANUAL_REQUIRED` |
| `oxidizerCompatibility` does not include the computed oxidizer | `MANUAL_REQUIRED` |
| `supportedLevels` does not cover the target level | `MANUAL_REQUIRED` |
| Entry present but `specialBlondPolicy.supported === false` for an SB process | `MANUAL_REQUIRED` |
| `manualReviewTriggers` fires for current client conditions | `MANUAL_REQUIRED` |
| Brand present but line absent | `MANUAL_REQUIRED` |
| Brand+line present but process category absent | `MANUAL_REQUIRED` |

Rule: **uncertainty defaults to `MANUAL_REQUIRED`, never `APPROVED`**.

---

## 8. Conflict behavior

| Conflict type | Required behavior |
|---|---|
| Two entries with same `brandId + lineId + processCategory` | `MANUAL_REQUIRED` — ambiguity is not resolvable automatically |
| `greyCoveragePolicy.supported = true` but `minOxidizer = null` | `MANUAL_REQUIRED` |
| `specialBlondPolicy.supported = true` but `porousHairAllowed = true` and `manualIfPorous = false` | `MANUAL_REQUIRED` — contradicts G1 safety requirement |
| `timingRange.min > timingRange.max` | `MANUAL_REQUIRED` |
| `oxidizerCompatibility` contains a value ≥ 12% | `MANUAL_REQUIRED` — must be escalated for manual review regardless of brand entry |
| Entry `validationStatus = "validated"` but `lastReviewedAt` older than staleness limit | `MANUAL_REQUIRED` |

Conflicting data is treated as absent data. **Never resolve conflicts in favor of `APPROVED`.**

---

## 9. Manual review triggers

The `manualReviewTriggers` field must enumerate conditions under which the entry itself demands `MANUAL_REQUIRED`, even when all 18 fields are present and valid. Minimum required triggers:

- Any condition in `specialBlondPolicy.contraindicatedConditions` (equivalent field in `powderPolicy.contraindicatedConditions`)
- Porous hair signal when `specialBlondPolicy.supported === true` — mandatory G1 gap mitigation
- Oxidizer computed ≥ 12% — regardless of brand line support
- Target level outside `supportedLevels` range
- Any contraindication in `contraindications` matching current client conditions

If a `manualReviewTrigger` fires, status must be `MANUAL_REQUIRED`. Triggers in the entry cannot be overridden by the calling code.

---

## 10. Forbidden shortcuts

- **Never** add a real brand entry with fabricated oxidizer concentrations or timing ranges.
- **Never** populate `oxidizerCompatibility` from general marketing knowledge — only manufacturer technical documentation.
- **Never** set `validationStatus: "validated"` without a real `sourceReference` pointing to a verifiable spec document.
- **Never** set `specialBlondPolicy.manualIfPorous: false` for a brand that has not explicitly documented porous hair safety for its Special Blond process.
- **Never** use brand matrix entries to approve a formula that `hasBrandRuleMatrix = false` currently blocks — only real, fully validated entries may change the safety outcome.
- **Never** add an entry with `processCategory: "special_blond"` or `processCategory: "powder"` without a `sourceReference` reviewed by a qualified colorist.
- **Never** treat an expired (`lastReviewedAt` stale) entry as valid.

---

## 11. Example pseudo-schema

The following is a **structural placeholder only**. All values are fictional and must never be used as real brand data.

```javascript
// PSEUDO-SCHEMA ONLY — NO REAL BRAND DATA
// Do not use these values. Do not copy into production.
const EXAMPLE_BRAND_ENTRY_SHAPE = {
    brandId:           "PLACEHOLDER_BRAND_ID",
    brandDisplayName:  "Placeholder Brand Name",
    lineId:            "PLACEHOLDER_LINE_ID",
    lineDisplayName:   "Placeholder Line Name",
    processCategory:   "permanent",           // one of §4 values
    supportedLevels:   { minLevel: 0, maxLevel: 0 },  // real values from spec
    oxidizerCompatibility: [],                // real values from spec
    mixRatio:          "PLACEHOLDER_RATIO",   // e.g. "1:1"
    timingRange:       { min: 0, max: 0 },    // real values from spec
    greyCoveragePolicy: {
        supported:    false,
        minOxidizer:  null
    },
    specialBlondPolicy: {
        supported:         false,
        maxLiftSteps:      null,
        porousHairAllowed: false,
        manualIfPorous:    true              // always true if supported
    },
    powderPolicy: {
        supported:                false,
        requiresPreTest:          true,
        contraindicatedConditions: []
    },
    toningPolicy: {
        supported:     false,
        dilutionRatio: null,
        maxOxidizer:   null
    },
    contraindications:     [],              // real values from spec
    manualReviewTriggers:  [],              // real values from spec; porous required if SB supported
    sourceReference:       "PLACEHOLDER_SOURCE_REF",
    validationStatus:      "pending",       // "validated" only after real review
    lastReviewedAt:        "PLACEHOLDER_DATE"
};
```

This shape is what `validateBrandRuleMatrixShape()` (see `www/core.js`) verifies when checking readiness.

---

## 12. Migration checklist before enabling brand matrix

All items must be checked off — in order — before `hasBrandRuleMatrix` is changed from `false` to any conditional or truthy value.

- [ ] Real brand entry data obtained from manufacturer technical documentation (not marketing materials).
- [ ] All 18 required fields populated for the specific brand + line + process category being enabled.
- [ ] `validationStatus` set to `"validated"` and `sourceReference` points to a verifiable, dated document.
- [ ] A qualified colorist has reviewed the entry data for accuracy.
- [ ] `specialBlondPolicy.manualIfPorous = true` if `specialBlondPolicy.supported = true`.
- [ ] `manualReviewTriggers` includes a porous hair trigger if any SB process is supported (G1 gap mitigation — see `docs/brand-data-layer-contract.md §1 G1 gap dependency`).
- [ ] `validateBrandRuleMatrixShape()` returns `{ ready: true }` for the entry.
- [ ] New test added: confirms `APPROVED` is reachable only with the complete entry.
- [ ] New test added: confirms `MANUAL_REQUIRED` for each missing field individually (at least the 5 safety-critical fields).
- [ ] New test added: `condition='пористі'` + SB + empty `porosity` field still produces `MANUAL_REQUIRED` after enabling (G1 regression must still pass).
- [ ] Full test matrix passes: `node test_www_business_scenarios.js`, `node test_www_render_runtime.js`, `node test_www_mass_model.js`, `node test_www_mapping.js`.
- [ ] `git diff --check` passes.
- [ ] Commit message explicitly states: which brand, which line, which process category is being enabled.
- [ ] No sensitive formula type that is currently `MANUAL_REQUIRED` becomes `APPROVED` except through the validated entry for that specific process.

---

## 13. Test requirements before enabling brand matrix

The following tests must exist and pass before `hasBrandRuleMatrix` is changed:

### Existing tests that must remain passing (locked)

| Test name | What it locks |
|---|---|
| `BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED` | Special Blond still `MANUAL_REQUIRED` when brand data absent |
| `BRAND-MISSING-GREY-00-NO-APPROVED` | Grey .00 still `MANUAL_REQUIRED` when brand data absent |
| `BRAND-MISSING-HIGH-OXIDIZER-NO-APPROVED` | High oxidizer ≥9% still `MANUAL_REQUIRED` when brand data absent |
| `BRAND-MISSING-POWDER-NO-APPROVED` | Powder still `MANUAL_REQUIRED` when brand data absent |
| `BRAND-MISSING-TONING-LINE-NO-APPROVED` | Toning still `MANUAL_REQUIRED` when brand data absent |
| `BRAND-NORMAL-SAME-LEVEL-NO-FALSE-POSITIVE` | Same-level permanent not falsely blocked |
| `BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE` | Generic 6% permanent not falsely blocked |
| `G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL` | G1 gap still covered |

### Helper function tests that must exist (added in current task)

| Test name | What it covers |
|---|---|
| `BRAND-HELPER-NULL-MATRIX-NOT-AVAILABLE` | `isBrandRuleMatrixAvailable(null)` → `false` |
| `BRAND-HELPER-EMPTY-MATRIX-NOT-AVAILABLE` | `isBrandRuleMatrixAvailable([])` → `false` |
| `BRAND-HELPER-PARTIAL-ENTRY-NOT-READY` | `validateBrandRuleMatrixShape` with missing fields → not ready |
| `BRAND-HELPER-MISSING-FIELDS-REPORT` | `getMissingBrandMatrixFields` returns correct missing field list |
| `BRAND-HELPER-READINESS-STATUS-NOT-READY` | `getBrandMatrixReadinessStatus(null)` → `"NOT_READY"` |
| `BRAND-HELPER-BEHAVIOR-PRESERVED` | All 5 sensitive formula types still `MANUAL_REQUIRED` after helpers added |

### New tests required when enabling (not yet required)

- `BRAND-ENTRY-VALID-SB-APPROVED` — full valid SB entry → `APPROVED` (only when real data present)
- `BRAND-ENTRY-MISSING-ONE-FIELD-<fieldName>` × 18 — each field missing → `MANUAL_REQUIRED`
- `BRAND-ENTRY-G1-POROUS-STILL-MANUAL-AFTER-ENABLE` — G1 still covered after enabling
