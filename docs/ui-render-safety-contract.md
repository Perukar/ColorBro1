# UI Render Safety Contract — PERUKAR

**Date:** 2026-06-08
**HEAD at last update:** e124809 Document known limitations contract
**Status:** ACTIVE

See also:
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — input validation gates
- [docs/input-model-contract.md](input-model-contract.md) — normalization rules
- [docs/known-limitations-contract.md](known-limitations-contract.md) — production boundary limitations
- [docs/brand-data-layer-contract.md](brand-data-layer-contract.md) — brand matrix safety contract

---

## 1. Purpose

This document is the authoritative contract for how `www/core.js` renders color-protocol output. PERUKAR is safety-sensitive: an executable salon recipe shown in the wrong state is a real-world risk. This contract must not be weakened.

Every render path, every sanitization function, and every UI label that could affect the boundary between "safe to mix" and "not safe to mix" is covered here. All rules are enforced by regression tests listed in §12.

---

## 2. Render status taxonomy

`calculateProtocol()` produces one of four top-level statuses. Each has a distinct render contract:

| Status | Meaning | Executable recipe shown |
|---|---|---|
| `APPROVED` + `productionReady === true` | Valid inputs, no safety gate fires, no diagnostic candidate | **YES** — only case where recipe renders |
| `APPROVED` + `productionReady !== true` | Status approved but readiness gate not met | **NO** — "Рецепт недоступний" block shown |
| `MANUAL_REQUIRED` | A safety gate requires master decision | **NO** — manual decisions shown instead |
| `BLOCKED` | Critical input missing, invalid, or unsafe | **NO** — blockers shown instead |
| `FATAL_ERROR` | Unhandled exception in calculateProtocol | **NO** — error message shown |

Additionally, any state that has an `endsRecDiagnosticWiringCandidate` present forces `productionReady` to `false` regardless of status, because the diagnostic candidate means the protocol is not unambiguously 2-zone.

---

## 3. APPROVED UI rules

An executable recipe renders **only** when `isProductionReadyState(state)` returns `true`. This function requires ALL of the following simultaneously:

```javascript
state.status === 'APPROVED'
&& state.productionReady === true
&& Boolean(state.rootRec || state.midRec || state.lenRec)
&& state.blockers.length === 0
&& state.manualDecisions.length === 0
&& !isDiagnosticOnlyTimingState(state)  // no endsRecDiagnosticWiringCandidate present
```

When this gate passes:
- `renderRecipes` calls `renderRecipe` with `{ approved: true }` → emits `class="recipe approved-recipe"` and includes `Фінальна формула`
- `sanitizeMassModelForRender` returns the full massModel (exact masses visible)
- `sanitizeTimingInfoForRender` returns production timing

**What APPROVED renders:**
- Status header: `<h2>APPROVED | Ціль: X.X</h2>`
- Recipe blocks with `approved-recipe` CSS class
- Process, dye, oxidizer, mass, ratio, mixtone, finalFormula
- Mass model with exact rootMass, lengthMass, totalMass
- Timing info with full production timing data
- Protocol text and phases

**What APPROVED must NOT render:**
- `notForMixing` label
- `previewOnly` label
- `mixingMassesHidden` flag
- `productionTimingHidden` flag

---

## 4. MANUAL_REQUIRED UI rules

When `manualDecisions.length > 0` (or explicitly set status), `buildWwwRenderState` sets `productionReady = false`. The render contract:

- `renderRecipes` returns `''` (no recipe block at all) because `state.status !== 'APPROVED'`
- `renderManualDecisions` shows heading "Потрібне ручне рішення майстра" with the list of specific decisions (CSS class `manual-required`)
- `sanitizeMassModelForRender` strips exact masses; shows only `mode`, `endsMass`, `mixingMassesHidden: true`
- `sanitizeTimingInfoForRender` returns `timingStatus: 'advisory-only'`, `requiresManualConfirmation: true`, `notReadyToExecute: true`
- Status header shows `MANUAL_REQUIRED`
- Warnings list visible

**What MANUAL_REQUIRED must NOT render:**
- `approved-recipe` CSS class
- Executable mixing instructions
- `finalFormula` field
- Exact gram values from mass model
- Production timing implying "ready to mix"

---

## 5. BLOCKED UI rules

When critical inputs are missing, invalid, or explicitly unsafe, `calculateProtocol` builds a state with `status: 'BLOCKED'` and `blockers: [reason string]`.

- `renderRecipes` returns `''` (no recipe block) because `state.status !== 'APPROVED'`
- `renderBlockers` shows heading "Блокування" with the specific reason(s) (CSS class `alert`)
- `sanitizeMassModelForRender` strips exact masses
- `sanitizeTimingInfoForRender` returns `timingStatus: 'blocked'`, `productionTimingHidden: true`

**Reasons visible in BLOCKED state:**
- Missing critical fields: `"Недостатньо критичних даних для безпечного рецепта: ..."`
- Unrecognized enum values: `"Нерозпізнані критичні значення (поза дозволеним переліком): ..."`
- Allergy confirmed: `"алергія"` present in output
- Scalp irritated: `"шкіра голови"` present in output

**What BLOCKED must NOT render:**
- `approved-recipe` CSS class
- Any mixing instruction
- `finalFormula` field
- Exact gram values
- Any text suggesting the master can proceed

---

## 6. Diagnostic-only UI rules

Diagnostic-only state is triggered when `endsRecDiagnosticWiringCandidate` is present in the render state. This forces:

- `isDiagnosticOnlyTimingState(state)` → `true`
- `isProductionReadyState(state)` → `false`
- `productionReady` forced to `false` in `normalizeWwwProductionReady`

The diagnostic candidate is rendered via `renderEndsDiagnosticDisplay(candidate)`, which:

- Forces `productionReady` display to `false`
- Shows `previewOnly`, `candidateOnly`, `notForMixing`, `endsRecipeReady` flags
- Always includes the strings: "Потрібна ручна перевірка", "Не є фінальним рецептом", "Не наносити за цим блоком"
- Strips forbidden fields: `dyeMass`, `oxidizerMass`, `grams`, `exactGrams`, `finalFormula`, `endsFormula`, `productionRecipe`, `formula-to-mix`
- If any forbidden field is detected, adds "Небезпечні технічні поля приховано"

**What diagnostic-only must NOT render:**
- `approved-recipe` CSS class
- `<b>productionReady:</b> true`
- `dyeMass` or `oxidizerMass` values
- Any text suggesting mixing is permitted

---

## 7. notForMixing / previewOnly rules

These two flags appear on diagnostic candidates. Their presence in the render output is a safety requirement:

| Flag | Required value | Where it appears |
|---|---|---|
| `notForMixing` | `true` | `renderEndsDiagnosticDisplay` output |
| `previewOnly` | `true` | `renderEndsDiagnosticDisplay` output |
| `endsRecipeReady` | `false` | `renderEndsDiagnosticDisplay` output |
| `productionReady` | `false` (forced) | `renderEndsDiagnosticDisplay` output |
| `candidateOnly` | `true` | `renderEndsDiagnosticDisplay` output |

The render layer MUST show `<b>productionReady:</b> false` and MUST NOT show `<b>productionReady:</b> true` for any diagnostic candidate, even if the candidate object internally carries `productionReady: true` as a contract placeholder in the inactive helpers.

**Rule:** The presence of `notForMixing: true` in a candidate is necessary but not sufficient to prevent recipe display. The primary gate is `isProductionReadyState`. Both must hold.

---

## 8. Mass model display rules

`sanitizeMassModelForRender(massModel, state)` is called on every render:

| State | What is shown | What is hidden |
|---|---|---|
| APPROVED + productionReady=true | Full massModel (rootMass, lengthMass, totalMass, mode, endsMass) | Nothing |
| Any other state | `{ mode, endsMass, mixingMassesHidden: true }` | rootMass, lengthMass, totalMass, densityMultiplier, baseMass |

For all current production states, `mode: '2-zone'` and `endsMass: null` always appear in the sanitized output. This confirms the 2-zone production boundary to the reader.

For 3-zone diagnostic candidates, `buildThreeZoneMassCandidate()` produces a mass object with `mode: '3-zone'` and a non-null `endsMass`. This object is NOT stored in `state.massModel` — it lives only in the endsRec diagnostic context. The production `state.massModel` always comes from `buildMassModel()` which always returns `mode: '2-zone'`, `endsMass: null`.

**Rule:** `state.massModel.mode` in any rendered state must be `'2-zone'`. `"mode": "3-zone"` must never appear in the massModel section of any rendered output.

---

## 9. Timing display rules

`sanitizeTimingInfoForRender(timingInfo, state)` routes timing output based on state:

| State | timingStatus value | Production timing shown |
|---|---|---|
| APPROVED + productionReady=true | *(raw timing data)* | **YES** |
| APPROVED + productionReady=false | `production-not-ready` | **NO** — `productionTimingHidden: true` |
| MANUAL_REQUIRED (non-diagnostic) | `advisory-only` | **NO** — `requiresManualConfirmation: true`, `notReadyToExecute: true` |
| Diagnostic-only (has candidate) | `diagnostic-only` | **NO** — `notForMixing: true`, `requiresManualConfirmation: true` |
| BLOCKED | `blocked` | **NO** — `productionTimingHidden: true` |

**Rule:** Timing information for any non-APPROVED state or diagnostic state is advisory or hidden. It must not imply mixing permission. The presence of `timingStatus: 'advisory-only'` or `timingStatus: 'diagnostic-only'` in the JSON-rendered timing block is a required safety signal.

---

## 10. endsRec / third-zone display rules

### What runs diagnostically but must not appear as production

- `classifyThreeZoneActivation()` — gate function, runs in `calculateProtocol()`, returns KEEP_2_ZONE / ALLOW_3_ZONE / MANUAL_REQUIRED / BLOCKED
- `buildThreeZoneMassCandidate()` — called when ALLOW_3_ZONE, result stored as `threeZoneCandidateMassModel`, NOT as `state.massModel`
- The entire `validateProductionEndsRecReadiness → buildProductionEndsRec → … → buildControlledEndsRecDiagnosticWiringCandidate` pipeline — runs in a `try/catch`, result stored as `endsRecDiagnosticWiringCandidate`

### How the diagnostic candidate is safely wired

```
endsRecDiagnosticWiringCandidate is set in calculateProtocol()
  → passed to buildWwwRenderState()
  → normalizeWwwProductionReady() sees hasDiagnosticCandidate = true → productionReady = false
  → isDiagnosticOnlyTimingState(state) = true → isProductionReadyState = false
  → renderRecipes() cannot emit approved-recipe
  → renderEndsDiagnosticDisplay(candidate) renders the diagnostic block with forced productionReady: false
```

### What the render output must contain for the diagnostic block

- `<b>productionReady:</b> false` (forced, even if internal skeleton has `productionReady: true`)
- `<b>notForMixing:</b> true — Не для змішування`
- `<b>previewOnly / Preview only:</b> true`
- `<b>endsRecipeReady:</b> false`
- "Потрібна ручна перевірка"
- "Не є фінальним рецептом"
- "Не наносити за цим блоком"

### Future activation requirement

Production 3-zone and endsRec require a separate implementation task. This diagnostic pipeline must not be activated to production use without:
1. A dedicated implementation commit
2. `endsMass` becoming non-null in production `buildMassModel()`
3. All new tests in the migration checklist of `docs/known-limitations-contract.md §14`
4. Full test matrix passing

---

## 11. Forbidden UI shortcuts

- **Never** pass `{ approved: true }` to `renderRecipe` from any path other than `renderRecipes` after `canRenderExecutableRecipe` passes.
- **Never** replace `productionReady === true` with `productionReady !== false` or `!!productionReady` — undefined/missing must remain unsafe.
- **Never** skip `isDiagnosticOnlyTimingState` check in `isProductionReadyState`.
- **Never** show exact gram values (`rootMass`, `lengthMass`, `totalMass`, `dyeMass`, `oxidizerMass`) in manual/blocked/diagnostic states.
- **Never** render `"mode": "3-zone"` in the mass model section of `renderStateToHtml` output.
- **Never** show `<b>productionReady:</b> true` in a diagnostic candidate display.
- **Never** add a bypass of `renderBlockers` or `renderManualDecisions` that re-routes to `renderRecipes`.
- **Never** change `renderRecipes` to accept statuses other than `APPROVED`.
- **Never** add an approved-recipe-looking block outside `renderRecipes`.
- **Never** remove "Не наносити за цим блоком" or "Потрібна ручна перевірка" from `renderEndsDiagnosticDisplay`.

---

## 12. Required regression tests

### test_www_render_runtime.js (direct render layer tests)

| Test / check | What it locks |
|---|---|
| `productionReady: true` → `approved-recipe` in HTML | APPROVED clean path renders recipe |
| `productionReady: false` → not `approved-recipe` | APPROVED without productionReady does not render recipe |
| Missing `productionReady` → not `approved-recipe` | Missing productionReady is unsafe by default |
| BLOCKED state → not `approved-recipe` | BLOCKED never renders recipe |
| MANUAL_REQUIRED → not `approved-recipe` | MANUAL_REQUIRED never renders recipe |
| DIAGNOSTIC-DISPLAY-RENDER-CONTRACT | Diagnostic candidate: productionReady forced false; no approved-recipe; notForMixing/previewOnly visible |
| Two-zone baseline → `approved-recipe` | Clean 2-zone APPROVED state renders recipe |
| Diagnostic display → not `approved-recipe` | State with diagnostic candidate does not render recipe |
| THIRD-ZONE-ISOLATION | Real 3-zone skeleton (productionReady:true) wired into render → still no approved-recipe; productionReady shown as false |
| Allergy gates (yes/empty/unknown/no) | BLOCKED/MANUAL_REQUIRED/APPROVED depending on allergy value |
| Scalp sensitivity gates | BLOCKED/MANUAL_REQUIRED/APPROVED depending on scalp value |
| TARGET-DIRECTION-GATE | Missing/empty target_direction → BLOCKED, no recipe |
| LENGTH-DENSITY-THICKNESS-GATE | Missing/empty → BLOCKED, no recipe |
| LENGTH-DENSITY-THICKNESS-UNRECOGNIZED-GATE | Unrecognized values → BLOCKED, no recipe, no MANUAL |
| Mass model in MANUAL state | `"mode": "2-zone"`, `"endsMass": null` in HTML; no exact masses |
| Timing in diagnostic state | `timingStatus: "diagnostic-only"`, `notForMixing: true` |
| Timing in advisory state | `timingStatus: "advisory-only"` |

### test_www_business_scenarios.js (end-to-end calculateProtocol tests)

| Test | What it locks |
|---|---|
| `UI-RENDER-APPROVED-CLEAN-PATH` | calculateProtocol() for clean non-sensitive scenario → `approved-recipe` in HTML |
| `BRAND-NORMAL-SAME-LEVEL-NO-FALSE-POSITIVE` | Same-level permanent → no brand gate fires |
| `BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE` | Generic 6% permanent → no brand gate fires |
| `BRAND-MISSING-*` (5 tests) | Sensitive formulas → not `approved-recipe` |
| All ENDS-REC-* tests | endsRec scenarios → not `approved-recipe` |
| `G1-LEGACY-CONDITION-POROUS-SB-*` | G1 gap → not `approved-recipe` |
| `LIMITATION-PRODUCTION-MASS-RUNTIME-2-ZONE` | calculateProtocol() HTML contains `"mode": "2-zone"`, `"endsMass": null` |
| `LIMITATION-POWDER-SURCHARGE-MANUAL-NO-EXACT-GRAMS` | Powder → MANUAL_REQUIRED, no exact grams |

---

## 13. Migration checklist before future 3-zone / endsRec activation

Before any change to `renderEndsDiagnosticDisplay`, `renderRecipes`, `isProductionReadyState`, `canRenderExecutableRecipe`, or `normalizeWwwProductionReady`:

- [ ] All 15 sections of this document reviewed and updated.
- [ ] The production boundary in §2 explicitly updated to reflect new states.
- [ ] `THIRD-ZONE-ISOLATION` test still passes.
- [ ] `DIAGNOSTIC-DISPLAY-RENDER-CONTRACT` test still passes.
- [ ] New test added: production 3-zone state → `approved-recipe` present when activation is live.
- [ ] New test added: non-3-zone state → `approved-recipe` absent (regression guard).
- [ ] `UI-RENDER-APPROVED-CLEAN-PATH` still passes.
- [ ] No `approved-recipe` appears in any MANUAL_REQUIRED or BLOCKED state.
- [ ] No exact grams appear in any MANUAL_REQUIRED, BLOCKED, or diagnostic state.
- [ ] Full test matrix green: `test_www_render_runtime.js`, `test_www_business_scenarios.js`, `test_www_mass_model.js`, `test_www_mapping.js`.
- [ ] `git diff --check` passes.
- [ ] `docs/known-limitations-contract.md §9` updated.

---

## 14. Known limitations

### Mass model: totalMass after powder surcharge

After a powder process is selected, `massModel.rootMass` is updated to the post-surcharge value, but `massModel.totalMass` is not. See `docs/known-limitations-contract.md §5`. This divergence is intentional and documented. All powder scenarios trigger `MANUAL_REQUIRED` via the brand gate, so the divergence never reaches an approved recipe display.

### endsRec / 3-zone not production

The endsRec diagnostic candidate is shown in `renderEndsDiagnosticDisplay`. It carries `productionReady: false`, `notForMixing: true`, `previewOnly: true`, `endsRecipeReady: false`. These values are enforced by the render layer even if the internal helper pipeline produces a skeleton with `productionReady: true`. See `docs/known-limitations-contract.md §8 and §9`.

### G1 gap: condition vs porosity

`condition='пористі'` does not feed `hasHighPorositySignal`. The brand gate is the current safety net. This affects the render only insofar as the brand gate ensures MANUAL_REQUIRED without a validated brand matrix. See `docs/brand-data-layer-contract.md §1`.

---

## 15. Final invariant summary

```
Executable recipe output (approved-recipe CSS class, finalFormula field, exact gram values,
production timing) renders ONLY when isProductionReadyState(state) returns true.

isProductionReadyState requires:
  state.status === 'APPROVED'
  && state.productionReady === true
  && recipe present
  && blockers.length === 0
  && manualDecisions.length === 0
  && isDiagnosticOnlyTimingState(state) === false

productionReady is ALWAYS false when:
  - any blockers are present
  - any manualDecisions are present
  - endsRecDiagnosticWiringCandidate is present
  - productionReady is missing/undefined/null/false

Hardening commit chain (audited as one chain):
  14c25e1  Harden UI render safety contract
  47b9e0d  Harden timing render safety contract
  972ef60  Harden formula render safety contract
  9c178b8  Harden productionReady invariant contract
  7452779  Harden third-zone skeleton isolation contract
```

Any change to `isProductionReadyState`, `canRenderExecutableRecipe`, `normalizeWwwProductionReady`, `renderRecipes`, `renderRecipe`, `sanitizeMassModelForRender`, `sanitizeTimingInfoForRender`, or `renderEndsDiagnosticDisplay` MUST:

1. Keep the core invariant (`status === 'APPROVED' && productionReady === true`) strict — never permissive.
2. Keep missing / undefined `productionReady` unsafe by default.
3. Pass the full test matrix.
4. Add or extend regression tests proving no executable leak for unsafe states.
5. Update this document's affected sections.
