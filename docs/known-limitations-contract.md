# Known Limitations Contract — PERUKAR

**Date:** 2026-06-08
**HEAD at creation:** ee990a6 Harden input model normalization contract
**Status:** ACTIVE — documents current intentional limitations

See also:
- [docs/runtime-failsafe-contract.md](runtime-failsafe-contract.md) — runtime fail-safe rules and migration checklist (§15) for activating any limitation listed here
- [docs/input-model-contract.md](input-model-contract.md) — input normalization rules
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — production gate policy
- [docs/brand-data-layer-contract.md](brand-data-layer-contract.md) — brand matrix contract
- [docs/brand-data-schema.md](brand-data-schema.md) — brand schema definition
- [docs/ui-render-safety-contract.md](ui-render-safety-contract.md) — render layer safety rules
- [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix: production status, active vs diagnostic, known limitations summary, release checklist

---

## 1. Purpose

This document is the single source of truth for all current known limitations in PERUKAR. "Known limitation" means a feature or boundary that is intentionally incomplete, inactive, or diagnostic-only — not a bug, but a deliberate constraint that must not be accidentally activated by future work.

Every limitation listed here is guarded by at least one regression test. Future work that activates any feature listed here must treat this document as a mandatory pre-flight checklist.

---

## 2. Current production boundaries

The following are fully implemented and active in production:

| Boundary | Status |
|---|---|
| 2-zone mass model (`buildMassModel`) | **ACTIVE** — `mode: '2-zone'`, `endsMass: null` always |
| Allergy gate | **ACTIVE** — `yes` → BLOCKED; unknown/empty → MANUAL_REQUIRED |
| Scalp sensitivity gate | **ACTIVE** — `irritated` → BLOCKED; non-normal → MANUAL_REQUIRED |
| Length/density/thickness enum gate | **ACTIVE** — missing or unrecognized → BLOCKED |
| Target direction gate | **ACTIVE** — missing/empty → BLOCKED |
| Powder surcharge | **ACTIVE** — rootMass × 1.6 applied post-mass-model, min 40g |
| Brand gate | **ACTIVE** — `hasBrandRuleMatrix = false` → sensitive formulas MANUAL_REQUIRED |
| Input normalization | **ACTIVE** — `normalizeTextInput()` trims condition at read time |
| G1 porous condition + SB guard | **ACTIVE** — via brand gate (see §10) |

All other features below are either **diagnostic-only** or **not implemented**.

---

## 3. Diagnostic-only boundaries

The following logic runs inside `calculateProtocol()` but never produces a production recipe or approved output:

| Feature | Diagnostic scope | Production output |
|---|---|---|
| `classifyThreeZoneActivation()` | Returns KEEP_2_ZONE / ALLOW_3_ZONE / MANUAL_REQUIRED / BLOCKED | No production effect — ALLOW_3_ZONE triggers `threeZonePreviewEligible = true` only |
| `buildThreeZoneMassCandidate()` | Called when ALLOW_3_ZONE; produces a preview mass object | Not stored in production `massModel`; `threeZonePreviewOnly = true` always |
| endsRec diagnostic wiring pipeline | `validateProductionEndsRecReadiness` → `buildProductionEndsRec` → … → `buildControlledEndsRecDiagnosticWiringCandidate` | Result stored as `endsRecDiagnosticWiringCandidate` with `previewOnly: true`, `notForMixing: true`, `endsRecipeReady: false`; no production recipe |
| Ends conflict detection | Detects `endsConflictDetected`, multi-zone risk signals | Triggers MANUAL_REQUIRED; no production endsRec |
| `classifyEndsRecEligibility()` | Pure gate function | Called from diagnostic pipeline only |
| `validateProductionThirdZoneReadiness()` | Pure readiness check | Not called from `calculateProtocol()` |

**Rule:** Any diagnostic candidate that reaches the render layer must carry `previewOnly: true`, `notForMixing: true`, and `endsRecipeReady: false`. The render layer strips production fields from diagnostic candidates.

---

## 4. Not-implemented features

The following features have scaffolding code but are intentionally not activated:

| Feature | Scaffold state | Activation condition |
|---|---|---|
| Production endsRec | Helpers exist (`buildProductionEndsRec`, `assembleProductionEndsRecContract`, etc.) | Requires separate implementation task, full test matrix, and explicit commit |
| Production 3-zone mass model | `buildThreeZoneMassCandidate()` exists | Requires production activation decision, split policy, and explicit commit |
| Brand rule matrix | Readiness helpers exist; `hasBrandRuleMatrix = false` hardcoded | Requires real validated brand data, all fields present, full test matrix (see §10) |
| Production endsRec mass allocation | `classifyProductionEndsRecMassAllocationContract()` exists | Requires `validateProductionEndsRecReadiness()` to return READY (currently impossible without endsMass ≠ null) |

**Rule:** The existence of a helper function does NOT mean the feature is ready for production. Scaffold ≠ approval.

---

## 5. Powder surcharge limitation

### What it does

When `rLevel <= 5` and `rStep > 0`, the root recipe is set to powder (`Порошок`). The root mass is then recalculated:

```
rMass = Math.round(rMass * 1.6);
if (rMass < 40) rMass = 40;
rootRec.mass = rMass;
massModel = Object.assign({}, massModel, { rootMass: rMass });
```

### Known limitation: nominal vs actual totalMass divergence

After the powder surcharge, `massModel.rootMass` is updated to the post-surcharge value. However, `massModel.totalMass` is NOT updated — it retains the pre-surcharge nominal value (e.g., 60g for medium length/density).

This means:

```
// After surcharge:
massModel.rootMass  // = actual post-surcharge root mass (e.g., 29)
massModel.lengthMass  // = nominal remainder (e.g., 42)
massModel.totalMass   // = nominal total (e.g., 60) — NOT updated
// Actual total = rootMass + lengthMass = 71, nominal totalMass = 60 → diverges
```

### Why this is acceptable

Powder surcharge is a per-process adjustment. The nominal `totalMass` represents the base formula volume before process-specific adjustments. The actual mixed mass for the root zone is `rootRec.mass`. The render layer displays these values independently. This is by design — not a rounding error.

### Guard

All powder scenarios trigger the brand gate (`hasBrandRuleMatrix = false`), producing MANUAL_REQUIRED. No powder formula can reach APPROVED without a validated brand matrix. The surcharge divergence is never hidden in an approved recipe.

### Tests

- `MASS-MODEL-POWDER-SURCHARGE-SYNC` (test_www_mass_model.js test 5)
- `BUILD-MASS-MODEL-POWDER-SURCHARGE-CONTRACT` (test_www_mass_model.js test 12)
- `LIMITATION-POWDER-SURCHARGE-MANUAL-NO-EXACT-GRAMS` (test_www_business_scenarios.js)

---

## 6. Mass model limitation

### Production behavior

`buildMassModel(length, density)` always returns:

```javascript
{
    baseMass,        // from lookup: 30/60/120
    densityMultiplier, // from lookup: 0.7/1.0/1.5
    totalMass,       // Math.round(baseMass * densityMultiplier)
    rootMass,        // Math.round(totalMass * 0.3)
    lengthMass,      // totalMass - rootMass (remainder, no double-round drift)
    endsMass: null,  // ALWAYS null in production
    mode: '2-zone'   // ALWAYS '2-zone' in production
}
```

### What is not yet production

- `endsMass` is always `null`
- `mode` is always `'2-zone'`
- The 3-zone split (root/length/ends) is implemented only as a candidate helper, not in production

### Tests

- `MASS-MODEL-2-ZONE-EXPECTED-SPLIT` (test_www_mass_model.js test 2)
- `MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC` (test_www_mass_model.js test 9)
- `LIMITATION-PRODUCTION-MASS-RUNTIME-2-ZONE` (test_www_business_scenarios.js)

---

## 7. endsMass limitation

`endsMass` is always `null` in production `buildMassModel()` output. This is not a placeholder value or a bug — it is a hard constraint that the 3-zone mass split is not production-ready.

**Invariant:** If any code path sets `massModel.endsMass` to a non-null value, it is a limitation violation that must be caught by tests and blocked at commit gate.

Current check in `validateProductionEndsRecReadiness()`:

```javascript
if (input.massModel && typeof input.massModel.endsMass === 'number') {
    return result('BLOCKED', 'MASSMODEL_ENDSMASS_ALREADY_SET', ...);
}
```

This ensures that even if a future code path accidentally sets `endsMass`, the endsRec pipeline will be BLOCKED.

### Tests

- `MASS-MODEL-3-ZONE-FUTURE-SPLIT` (test_www_mass_model.js test 6) — asserts `endsMass === null`
- `MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC` (test_www_mass_model.js test 9)

---

## 8. endsRec limitation

### What exists

Five inactive helper functions (all labeled `INACTIVE HELPER` in source):

- `buildProductionEndsRec(context, readiness)` — builds skeleton only; `endsRec: null` if readiness is not READY
- `classifyProductionEndsRecFormulaContract(...)` — formula classification; blocked if readiness not READY
- `classifyProductionEndsRecMassAllocationContract(...)` — mass contract; does not allocate mass, dyeMass, oxidizerMass, or exact grams
- `assembleProductionEndsRecContract(...)` — assembles candidate with `endsRecipeReady: false`
- `buildControlledEndsRecDiagnosticWiringContract(...)` — produces diagnostic wiring candidate only

### What the diagnostic candidate must contain

All diagnostic candidates must carry these exact flags:

```javascript
{
    previewOnly: true,
    notForMixing: true,
    endsRecipeReady: false,
    productionReady: false
    // NO dyeMass, NO oxidizerMass, NO exact grams
}
```

### What the render layer does

`PerucarWwwRenderV1.buildSafeRenderState()` strips `dyeMass` and `oxidizerMass` from candidate output. The render only shows `endsMass` as `null` (from massModel) or `'hidden'` (if unexpectedly set).

### Tests

- `ENDS-REC-NOT-CREATED` (test_www_business_scenarios.js)
- `MULTI-ZONE-DIAGNOSTIC-NOT-PRODUCTION-SOURCE` (test_www_business_scenarios.js)
- `DIAGNOSTIC-DISPLAY-RENDER-CONTRACT` (test_www_render_runtime.js)
- Full endsRec readiness pipeline tests (test_www_mass_model.js, ТЕСТ 26–40+ range)

---

## 9. 3-zone limitation

### What exists

- `classifyThreeZoneActivation(input)` — pure gate function, called from `calculateProtocol()` when `ends_level ≠ length_level`
- `buildThreeZoneMassCandidate(length, density, split)` — inactive helper, called only when ALLOW_3_ZONE decision is made, but result is `threeZonePreviewOnly: true` always
- `validateProductionThirdZoneReadiness(input)` — pure check, NOT called from `calculateProtocol()`

### Production constraint

Even when `classifyThreeZoneActivation` returns `ALLOW_3_ZONE`:

```javascript
threeZonePreviewOnly = true;
threeZoneEndsRecipeReady = false;
// Warning added: "Це не production рецепт і не інструкція для змішування."
// Production protocol remains 2-zone.
```

### Activation chain that would be needed (not implemented)

```
validateProductionThirdZoneReadiness() → READY
buildProductionEndsRec() → skeleton ready
classifyProductionEndsRecFormulaContract() → formula contract ready
classifyProductionEndsRecMassAllocationContract() → mass contract ready
assembleProductionEndsRecContract() → candidate with endsRecipeReady: false
→ [separate production activation task required]
```

None of this chain currently leads to a production recipe. Each step returns not-ready or blocks.

### Tests

- `THREE-ZONE-GATE-PRODUCTION-BUILDMASSMODEL-STILL-2-ZONE` (test_www_mass_model.js test 26)
- `THREE-ZONE-GATE-*` (test_www_mass_model.js tests 17–25)
- `MULTI-ZONE-LENGTH-HEALTHY-ENDS-DAMAGED-NO-PRODUCTION-ENDSREC` (test_www_business_scenarios.js)
- `MULTI-ZONE-DIAGNOSTIC-NOT-PRODUCTION-SOURCE` (test_www_business_scenarios.js)

---

## 10. Brand matrix limitation

### Current state

`hasBrandRuleMatrix = false` is hardcoded inside `calculateProtocol()`. This is a hard production gate, not a placeholder.

The following formula types always produce MANUAL_REQUIRED without a validated brand matrix:

- Special Blond (`special blond` / `спецблонд`)
- Grey .00 coverage (`.00` / `/00` / `double natural`)
- High oxidizer ≥9%
- Powder / lightening
- Toning line uncertainty

### Scaffold state

Readiness helpers (`isBrandRuleMatrixAvailable`, `validateBrandRuleMatrixShape`, `getMissingBrandMatrixFields`, `getBrandMatrixReadinessStatus`) exist in `www/core.js`. They do NOT affect `hasBrandRuleMatrix` and do NOT change safety behavior.

### G1 gap dependency

`condition='пористі'` does NOT feed `hasHighPorositySignal` (reads `porosity` field only). The brand gate is the current safety net for the combination: condition=пористі + Special Blond + empty porosity. If `hasBrandRuleMatrix` is ever made conditional, a dedicated porous+SB guard must be added first.

### Tests

- `BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED` — and 6 other BRAND-MISSING-* tests
- `G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL`
- `BRAND-HELPER-*` (8 helper scaffold tests)

---

## 11. Input model limitation

### Normalization helpers

Three pure helpers added in Task 6:

- `normalizeTextInput(value)` — trims whitespace, handles null/undefined
- `classifyMissingInput(value)` — returns `'missing'` or `'present'`
- `normalizeEnumInput(value, allowedSet)` — trims and checks against set

These helpers do NOT weaken safety — they only clarify behavior that was previously implicit.

### Known normalization gap: `history` and `base_type`

`history` and `base_type` are NOT trimmed at read time. They use marker-based detection (`.toLowerCase().includes()`) which is whitespace-tolerant for internal markers. This is by design — their exact value is not enum-validated.

### Safety constraint

Unknown, empty, or whitespace-only values for critical enum fields (`length`, `density`, `thickness`) always produce BLOCKED. Normalization may only preserve or strengthen safety. No unknown/missing/malformed critical input may become APPROVED.

### Tests

- `INPUT-HELPER-NORMALIZE-TEXT`, `INPUT-HELPER-CLASSIFY-MISSING`, `INPUT-HELPER-NORMALIZE-ENUM`
- `INPUT-ENUM-UNKNOWN-*-BLOCKED` (3 tests)
- `INPUT-ENUM-EMPTY-*-BLOCKED` (3 tests)
- `INPUT-NORM-CONDITION-TRIM`

---

## 12. Render/UI limitation

### Diagnostic display contract

The render layer (`PerucarWwwRenderV1`) always applies these guards:

- `buildSafeRenderState()` strips `dyeMass` and `oxidizerMass` from diagnostic candidates
- `endsMass` from massModel is rendered as `null` (or `'hidden'` if unexpectedly set)
- Diagnostic candidates are displayed with explicit `previewOnly: true` and `notForMixing: true` labels
- No diagnostic/manual/blocked state renders an executable mixing recipe with exact grams

### What the UI does not show in non-APPROVED states

- `dyeMass` / `oxidizerMass` / exact grams per zone
- `endsRec` production recipe
- `"mode": "3-zone"` in mass model block
- `endsRecipeReady: true`

### Tests

- `DIAGNOSTIC-DISPLAY-RENDER-CONTRACT` (test_www_render_runtime.js)
- `MANUAL-STATE-MASS-MODEL-RENDER` (test_www_render_runtime.js) — asserts `"mode": "2-zone"` and `"endsMass": null` in HTML
- All MULTI-ZONE tests check `!hasProductionEndsRecSignal(html)`

---

## 13. Forbidden shortcuts

- **Never** make `endsMass` non-null in production `buildMassModel()`.
- **Never** activate `classifyThreeZoneActivation`'s ALLOW_3_ZONE path to produce a production recipe — it must remain diagnostic/preview only.
- **Never** set `threeZoneEndsRecipeReady = true` without a dedicated production activation task and full test matrix.
- **Never** change `hasBrandRuleMatrix` from `false` to any conditional or truthy value without all 6 activation steps in `docs/brand-data-layer-contract.md §4`.
- **Never** allow any diagnostic candidate to contain `dyeMass`, `oxidizerMass`, or exact gram values.
- **Never** allow `endsRecipeReady: true` on any object produced by current helper pipeline.
- **Never** normalize an unknown enum value (length/density/thickness) to the nearest valid value — unknown must remain BLOCKED.
- **Never** let `totalMass` update silently match `rootMass + lengthMass` after powder surcharge without understanding the nominal/actual split behavior.
- **Never** skip the G1 regression test when changing `condition` or `porosity` handling.
- **Never** treat scaffold helper existence as production approval — scaffold ≠ ready.

---

## 14. Required tests before future activation

Before activating any feature below, ALL of the following tests must pass AND new tests must be added:

### Before enabling production endsRec

- [ ] `validateProductionEndsRecReadiness()` must return READY for the target scenario
- [ ] `massModel.endsMass` must be a valid non-null number (requires 3-zone mass activation first)
- [ ] New test: `ENDSREC-PRODUCTION-APPROVED-ONLY-WHEN-ALL-FIELDS-PRESENT`
- [ ] New test: `ENDSREC-PRODUCTION-BLOCKED-MISSING-MASS`
- [ ] G1 regression test still passes: `G1-LEGACY-CONDITION-POROUS-SB-NO-POROSITY-FIELD-MANUAL`
- [ ] Full test matrix: all 4 test suites green

### Before enabling production 3-zone mass

- [ ] Split policy decided and documented in this contract
- [ ] `buildThreeZoneMassCandidate()` called with validated split
- [ ] New test: `MASS-MODEL-3-ZONE-PRODUCTION-SPLIT-CONTRACT`
- [ ] New test: `MASS-MODEL-3-ZONE-ENDSMASS-SUM-CONTRACT`
- [ ] `MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC` updated to reflect new state
- [ ] Full test matrix green

### Before enabling brand matrix

- [ ] All 6 steps in `docs/brand-data-layer-contract.md §4` complete
- [ ] All 18 `REQUIRED_BRAND_MATRIX_FIELDS` present in every brand entry
- [ ] `BRAND-HELPER-BEHAVIOR-PRESERVED` still passes
- [ ] G1 gap explicitly covered by dedicated porous+SB guard (not only brand gate)
- [ ] Full test matrix green

### Before changing powder surcharge math

- [ ] A clear mechanical bug must be identified and documented
- [ ] New regression test added before changing the math
- [ ] `MASS-MODEL-POWDER-SURCHARGE-SYNC` and `BUILD-MASS-MODEL-POWDER-SURCHARGE-CONTRACT` updated
- [ ] `LIMITATION-POWDER-SURCHARGE-MANUAL-NO-EXACT-GRAMS` still passes
- [ ] Full test matrix green

---

## 15. Migration checklist

Before committing any change that touches a limitation boundary:

- [ ] All 14 sections of this document reviewed; affected sections updated.
- [ ] The relevant "Required tests before activation" checklist completed.
- [ ] `docs/project-checkpoint-safety-phase.md` updated.
- [ ] Commit message explicitly states which limitation boundary is being changed.
- [ ] No `git add .` / `-A`; exact files staged only.
- [ ] Full test matrix: `node test_www_business_scenarios.js`, `node test_www_render_runtime.js`, `node test_www_mass_model.js`, `node test_www_mapping.js`.
- [ ] `git diff --check` passes.
- [ ] User explicit `Commit: yes` before staging.
