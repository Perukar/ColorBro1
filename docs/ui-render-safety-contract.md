# UI Render Safety Contract — PERUKAR

**Date:** 2026-06-08
**HEAD at last update:** e124809 Document known limitations contract
**Status:** ACTIVE

See also:
- [docs/runtime-failsafe-contract.md](runtime-failsafe-contract.md) — runtime fail-safe rules: NaN/Infinity, malformed input, exception policy
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — input validation gates
- [docs/input-model-contract.md](input-model-contract.md) — normalization rules
- [docs/known-limitations-contract.md](known-limitations-contract.md) — production boundary limitations
- [docs/brand-data-layer-contract.md](brand-data-layer-contract.md) — brand matrix safety contract
- [docs/state-persistence-safety-contract.md](state-persistence-safety-contract.md) — browser storage safety: stale APPROVED result policy, render output persistence rules
- [docs/browser-smoke-contract.md](browser-smoke-contract.md) — browser smoke safety contract: page structure, gate smoke paths, manual checklist
- [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix: production status, active vs diagnostic, known limitations summary, release checklist

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
- `renderApprovedCaveat` emits an `approved-caveat` block: APPROVED is **not** a chemical/medical safety guarantee and **not** permission to apply without strand test, allergy test, and master's decision; manufacturer instructions still apply. Rendered only on the production-ready APPROVED path. Locked by `test_www_output_honesty_copy.js`. Honesty wording across BLOCKED / MANUAL_REQUIRED / unknown-enum / brand-missing / ends-diagnostic / stale-output states — no apply-permission wording ("можна наносити", "safe to apply", "без перевірки", …) and exact grams on the approved executable path only — is locked by `test_www_output_honesty_contract.js`

**What APPROVED renders:**
- Status header: `<h2>APPROVED — розрахунок дозволено (не гарантія безпеки) | Ціль: X.X</h2>` — the gloss makes explicit that APPROVED means the calculation passed software gates, not that the result is chemically/medically safe or cleared to apply
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
- Allergy confirmed:

---

## 6. Render-layer internal field sanitization (commit 413ced8)

`buildWwwRenderState` applies a narrow reasons sanitization before passing data to `renderStateToHtml`:

- **Arrays** (reason-code lists from gate results): passed through unchanged. This is the normal path for BLOCKED/MANUAL states that use `normalizeReasons()`.
- **Non-array `reasons` object with `threeZoneGateDecision === 'ALLOW_3_ZONE'`**: passed through to the render layer — `normalizeReasonsToItems` intentionally renders 3-zone diagnostic evidence (e.g. `threeZonePreviewEligible`, `threeZonePreviewOnly`, `threeZoneGateDecision`).
- **All other non-array `reasons` objects**: sanitized to `[]`. The 50+ key plain diagnostic object from `calculateProtocol`'s internal `reasons` context must not be dumped via `normalizeReasonsToItems` into user-visible HTML for normal APPROVED / MANUAL / BLOCKED paths.

**Fields that must NOT appear in normal APPROVED output:**

| Field | Why forbidden |
|---|---|
| `threeZonePreviewOnly` | Internal 3-zone diagnostic flag |
| `threeZonePreviewEligible` | Internal 3-zone diagnostic flag |
| `threeZoneGateDecision` | Internal gate decision (only visible in ALLOW_3_ZONE diagnostic scenario) |
| `endsRecipeReady` | Internal ends-recipe state flag |
| `notForMixing` | Candidate guard flag (only visible in diagnostic candidate display) |
| `productionReady` | Candidate guard flag (only visible in diagnostic candidate display) |
| `dyeMass` | Internal mass calculation — never for direct display |
| `oxidizerMass` | Internal mass calculation — never for direct display |
| `rootOxPercent` | Internal oxidizer percentage — internal calculation only |
| `lengthOxPercent` | Internal oxidizer percentage — internal calculation only |
| `finalFormula` | Internal formula object — never for direct display |

**Note on `endsMass`:** `endsMass: null` legitimately appears in the 2-zone mass model JSON block (rendered by `renderMassModel`). This is expected behavior. The invariant is that `endsMass` is `null` — never a production gram value.

**ALLOW_3_ZONE diagnostic-preview:** The 3-zone preview diagnostic scenario (`threeZoneGateDecision === 'ALLOW_3_ZONE'`) intentionally renders diagnostic evidence including `threeZonePreviewOnly: true`, `threeZonePreviewEligible: true`, and the candidate mass model. This is a diagnostic-only path: `productionReady: false`, `notForMixing: true`, `candidateOnly: true`. The contract is locked by `THREE-ZONE-PREVIEW-ALLOW-CREATES-CANDIDATE` in `test_www_business_scenarios.js`.

**Node-level regression coverage:** `test_www_render_runtime.js` contains the following tests that enforce these invariants at the Node VM layer (cheaper than real browser smoke):

- `RENDER-FORBIDDEN-FIELDS-APPROVED-CLEAN-PATH`
- `RENDER-FORBIDDEN-FIELDS-BLOCKED-PATH`
- `RENDER-FORBIDDEN-FIELDS-MANUAL-PATH`
- `RENDER-ALLOW-3ZONE-DIAGNOSTIC-PREVIEW-PRESERVED`
- `RENDER-REASONS-OBJECT-NOT-DUMPED-BY-DEFAULT`
- `RENDER-REASONS-ARRAY-PRESERVED`
