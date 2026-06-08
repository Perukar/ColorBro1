# Runtime Fail-Safe Contract — PERUKAR

**Date:** 2026-06-08
**HEAD at creation:** 54c0763 Harden UI safety surface contract
**Status:** ACTIVE

See also:
- [docs/ui-render-safety-contract.md](ui-render-safety-contract.md) — render status taxonomy and HTML safety rules
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — input validation gates
- [docs/input-model-contract.md](input-model-contract.md) — normalization rules
- [docs/known-limitations-contract.md](known-limitations-contract.md) — production boundary limitations
- [docs/brand-data-layer-contract.md](brand-data-layer-contract.md) — brand matrix safety contract
- [docs/state-persistence-safety-contract.md](state-persistence-safety-contract.md) — browser storage safety: safeParseJson, stale APPROVED result policy, hydration rules
- [docs/browser-smoke-contract.md](browser-smoke-contract.md) — browser smoke safety contract: page structure, gate smoke paths, manual checklist

---

## 1. Purpose

This document defines the fail-safe behavior of the PERUKAR runtime under malformed, partial, or unexpected input conditions. PERUKAR is safety-sensitive: a misrendered recipe or a silently-swallowed error can produce a dangerous salon outcome. This contract governs what the runtime must do when normal conditions do not hold.

The goal is a **fail-closed** system: every uncertain or exceptional runtime state must resolve to a safe, visible, non-executable output — never to an APPROVED or executable recipe by default.

---

## 2. Fail-closed principle

> **When in doubt, block.**

Any runtime condition that cannot be verified as fully valid must resolve to `BLOCKED` or `MANUAL_REQUIRED`, never to `APPROVED`.

This applies to:
- missing or null status fields
- NaN / Infinity in numeric mass or timing fields
- malformed or partial recipe objects
- unhandled exceptions in the calculate or render path
- unknown enum values in critical input fields
- partial diagnostic candidates wired to render paths

The fail-closed principle is stronger than "best effort": a silent default to `APPROVED` is never acceptable, even if the default appears harmless.

---

## 3. Allowed safe fallback states

When an error, uncertain value, or safety gate fires, the output MUST be one of:

| State | Condition |
|---|---|
| `BLOCKED` | Hard safety violation, missing critical field, unrecognized enum, allergy gate, scalp gate, runtime exception |
| `MANUAL_REQUIRED` | Ambiguous field, unknown scalp/allergy token, brand-sensitive recipe without matrix, partial diagnostic candidate |
| `FATAL_ERROR` display | Unhandled exception in `calculateProtocol()` try/catch — produces "Фатальна помилка" render, no recipe |

No fallback state may render `approved-recipe`, `finalFormula`, exact `dyeMass`, exact `oxidizerMass`, or exact grams.

---

## 4. Forbidden runtime fallbacks

The following are **never** allowed as fallbacks for uncertain or error conditions:

- Defaulting `status` to `'APPROVED'` when `status` is missing, null, or falsy
- Defaulting `productionReady` to `true` when it is missing or falsy
- Rendering `approved-recipe` when `status === 'APPROVED'` but `productionReady !== true`
- Rendering exact grams (`dyeMass`, `oxidizerMass`, `totalMass`, `rootMass`, `lengthMass`) in any non-APPROVED-and-productionReady state
- Swallowing a runtime exception without producing a visible blocked/error output
- Treating `NaN` or `Infinity` as a valid number in mass or timing fields
- Falling through an unknown enum value to a default formula decision
- Exposing `finalFormula` or `endsFormula` in diagnostic, manual, blocked, or error states
- Defaulting `endsMass` to a non-null value
- Activating production third-zone or production endsRec on any error path

---

## 5. calculateProtocol fail-safe rules

`calculateProtocol()` is wrapped in a top-level `try/catch`. All rules:

1. **Missing DOM element** — if `document.getElementById(id)` returns `undefined` or `null` for a critical field, the catch block fires and renders a FATAL_ERROR display (no stack trace, no recipe).
2. **Empty required field** — `root_level`, `target_level`, `history`, `length`, `density`, `thickness` empty or missing → `BLOCKED` via the mandatory-field gate; never produces APPROVED.
3. **Unknown enum value** — unrecognized `length`, `density`, or `thickness` value → `BLOCKED` (Нерозпізнані критичні значення); never MANUAL_REQUIRED, never a silent default.
4. **Allergy gate** — `allergy === 'yes'` → `BLOCKED`; unknown/empty → `MANUAL_REQUIRED`; `'no'` → proceeds.
5. **Scalp sensitivity gate** — `'irritated'` → `BLOCKED`; `'sensitive'`/`'unknown'`/missing → `MANUAL_REQUIRED`; `'normal'` → proceeds.
6. **Missing `target_direction`** — empty or absent → `BLOCKED`.
7. **No silent defaults for critical coloristic inputs** — any unrecognized value in a gated field produces `BLOCKED`, not a formula decision.

---

## 6. Input normalization fail-safe rules

Pure helper functions `normalizeTextInput`, `classifyMissingInput`, and `normalizeEnumInput`:

1. **`normalizeTextInput(value)`** — returns `''` for `null` / `undefined` / any non-string; trims whitespace; never throws. Does NOT lowercase (callers apply `.toLowerCase()` separately where needed).
2. **`classifyMissingInput(value)`** — returns `'missing'` for `null`, `undefined`, or whitespace-only; `'present'` otherwise; never throws.
3. **`normalizeEnumInput(value, allowedSet)`** — returns `{ normalized, inAllowed }`. `inAllowed: false` if value is empty or not in the allowed set; callers treat `inAllowed: false` as a gate failure.
4. **No safe defaulting** — none of these helpers convert an unknown value to a recognized enum token. Unknown stays unknown; callers gate on it.

---

## 7. Mass model fail-safe rules

1. **`buildThreeZoneMassCandidate(length, density, split)`** — returns `null` if `split` is null/undefined, or if `split.rootPct` or `split.endsPct` is not a finite number (`Number.isFinite` required — `typeof NaN === 'number'` makes typeof checks insufficient).
2. **`sanitizeMassModelForRender(massModel, state)`** — for `APPROVED` + `productionReady === true` states: if any of `totalMass`, `rootMass`, `lengthMass` is present and non-finite (NaN, Infinity, -Infinity), returns `null`. Null massModel renders with no exact gram values. For non-production states: all exact gram fields (`totalMass`, `rootMass`, `lengthMass`, `baseMass`, `densityMultiplier`) are stripped from render output; `mixingMassesHidden: true` is set.
3. **`endsMass` remains null** in all current production paths. No code path may set `endsMass` to a non-null value in the current runtime.
4. **NaN in mass fields must not render as grams** — any NaN or Infinity that reaches the render layer must be hidden, not displayed.

---

## 8. Timing fail-safe rules

1. **`timingInfo` absent** — `buildWwwRenderState` defaults to `timingInfo: null` (or an equivalent non-crashing value); `renderStateToHtml` handles null timingInfo without crashing.
2. **Timing in non-APPROVED states** — `timingStatus` must be one of `'blocked'`, `'advisory-only'`, or `'production-not-ready'`; `productionTimingHidden: true` is set; `totalMinutes` and `modifierMinutes` are hidden.
3. **Timing in MANUAL_REQUIRED state** — timing is shown as advisory only with `requiresManualConfirmation: true` and `notReadyToExecute: true`; must not appear as a mixing permission.
4. **Timing in diagnostic-only state** — `timingStatus: 'diagnostic-only'`; `notForMixing: true`; `productionTimingHidden: true`; no totalMinutes shown.
5. **Timing must not authorize recipe** — timing display in manual/blocked/error paths is informational only, never a step-by-step mixing instruction.

---

## 9. Render fail-safe rules

1. **`buildWwwRenderState` status default** — `const status = runtime.status || 'BLOCKED'` — missing or falsy status defaults to `'BLOCKED'`, never `'APPROVED'`. This is a defense-in-depth guard; all callers provide explicit status.
2. **`productionReady` coercion** — `BLOCKED` and `MANUAL_REQUIRED` states always set `productionReady: false` in `buildWwwRenderState`, regardless of caller input.
3. **Approved-recipe gate** — `approved-recipe` CSS class renders only when `status === 'APPROVED' && productionReady === true`; any deviation keeps this class absent.
4. **`finalFormula` gate** — `finalFormula` renders only inside `approved-recipe`; never in blocked/manual/error/diagnostic blocks.
5. **HTML escaping** — all user-controlled text (target, warnings, blockers, recipe fields) passes through `stripWwwHtmlText` before render; `<script>`, `<b>`, `<br>`, `onclick`, etc. are stripped or escaped.
6. **`FATAL_ERROR` render** — exception message shown as plain text (not as HTML); stack trace (`at `) is stripped.
7. **Diagnostic candidate isolation** — `endsRecDiagnosticWiringCandidate` with `productionReady: true` is coerced to `productionReady: false` in the render layer; cannot bypass the approved-recipe gate.

---

## 10. Diagnostic / preview fail-safe rules

1. **`notForMixing` and `previewOnly` are non-overridable** — these flags in a diagnostic candidate cannot be changed to produce an executable recipe.
2. **No production headings** — `<h3>Кінці</h3>`, `<h3>Ends</h3>`, `<h3>endsRec</h3>` must never appear in output from a diagnostic-display candidate.
3. **Forbidden display fields** — `dyeMass`, `oxidizerMass`, `grams`, `exactGrams`, `finalFormula`, `endsFormula`, `productionRecipe`, `formula-to-mix` must never appear in the diagnostic block.
4. **Forbidden recipe text** — `змішати`, `пропорції нанесення`, `готовий рецепт для кінців`, `готовий рецепт` must never appear in the diagnostic block.
5. **`endsRecipeReady: true` forbidden** — the diagnostic block must never show `endsRecipeReady: true`; the render layer coerces `productionReady: false` regardless of candidate value.
6. **Two-zone stability** — when a diagnostic candidate is present, the approved root/length two-zone recipe must NOT render; the overall state becomes `MANUAL_REQUIRED` with diagnostic display.
7. **`endsRec` null in current runtime** — approved output must not contain `<h3>Кінці</h3>`, `endsRecipeReady: true`, `dyeMass`, or `oxidizerMass`. Production `endsRec` requires a separate activation task.

---

## 11. Brand matrix fail-safe rules

1. **`isBrandRuleMatrixAvailable(matrix)`** — returns `false` for `null`, `undefined`, empty array `[]`, non-array object, string, or any non-array. Returns `true` only for a non-empty array.
2. **`hasBrandRuleMatrix` local constant** — `const hasBrandRuleMatrix = false` inside `calculateProtocol`; hardcoded disabled; not a placeholder; not a runtime toggle.
3. **Brand-sensitive recipe without matrix** — if the recipe text contains Special Blond, `.00`, high oxidizer, powder, or toning markers, and `hasBrandRuleMatrix === false`, a `manualDecisions` entry is pushed → result becomes `MANUAL_REQUIRED`, never `APPROVED`.
4. **No brand approval without validated matrix** — `validateBrandRuleMatrixShape` returns `ready: false` for any matrix that is null, empty, missing fields, or has `validationStatus !== 'validated'`.
5. **Brand helpers are diagnostic only** — `validateBrandRuleMatrixShape`, `getBrandMatrixReadinessStatus`, `getMissingBrandMatrixFields` do not affect `calculateProtocol` approval; they are shape-validation utilities only.

---

## 12. NaN / Infinity policy

`typeof NaN === 'number'` is true — naive `typeof` checks are insufficient. The rule:

1. **Use `Number.isFinite(value)`** wherever a number field must be validated before use in mass, timing, or render calculations.
2. **`isFiniteNumber(value)` helper** — `typeof value === 'number' && Number.isFinite(value)` — returns `false` for NaN, Infinity, -Infinity, null, undefined, and string. Use in all mass/timing guards.
3. **NaN pct fields** — `buildThreeZoneMassCandidate` uses `Number.isFinite` for `split.rootPct` and `split.endsPct`; returns `null` if either is non-finite.
4. **NaN mass fields in approved state** — `sanitizeMassModelForRender` uses `isFiniteNumber` for `totalMass`, `rootMass`, `lengthMass` in the production path; returns `null` if any is non-finite.
5. **No NaN in render output** — NaN or Infinity must never appear as a gram or minute value in the rendered HTML, in any state.

---

## 13. Exception handling policy

1. **`calculateProtocol()` is wrapped in `try/catch`** — the catch block renders "Фатальна помилка" with the exception message (plain text, stripped of stack trace).
2. **No silent swallowing** — catching an exception without producing a visible, non-recipe output is forbidden.
3. **No partial recipe on exception** — if an exception fires mid-calculation, the catch output must never expose `approved-recipe`, `finalFormula`, or exact grams.
4. **Stack traces stripped** — the `at ` prefix (node.js stack trace lines) is stripped from exception messages before render.
5. **`renderStateToHtml` exceptions** — any exception inside the render pipeline should produce a FATAL_ERROR display, not a blank or partial page.
6. **No try/catch that defaults to APPROVED** — a catch block that sets `status = 'APPROVED'` is forbidden regardless of context.

---

## 14. Required regression tests

The following regression tests are enforced in `test_www_render_runtime.js`:

| Test ID | What it verifies |
|---|---|
| `FAILSAFE-STATUS-DEFAULT-BLOCKED` | `buildWwwRenderState({})` → `status === 'BLOCKED'`, no `approved-recipe` |
| `FAILSAFE-STATUS-NULL-BLOCKED` | `buildWwwRenderState({status: null})` → `status === 'BLOCKED'`, no `approved-recipe` |
| `FAILSAFE-ISFINITE-HELPER` | `isFiniteNumber` returns false for NaN, Infinity, -Infinity, null, undefined, string; true for 0, positive, negative finite |
| `FAILSAFE-NAN-PCT-MASS-CANDIDATE` | `buildThreeZoneMassCandidate` with NaN/Infinity/missing pcts → null |
| `FAILSAFE-NAN-MASS-APPROVED-SANITIZE` | NaN/Infinity `totalMass` in approved state → mass values hidden, no gram leak |
| `FAILSAFE-CALCULATE-PROTOCOL-MALFORMED` | Empty `root_level`, `target_level`, `history` → BLOCKED, no `approved-recipe` |
| `FAILSAFE-ENDSREC-NULL-RUNTIME` | Approved output: no `<h3>Кінці</h3>`, no `endsRecipeReady: true`, no `dyeMass`/`oxidizerMass` |
| `FAILSAFE-BRAND-MATRIX-INACTIVE` | `isBrandRuleMatrixAvailable` returns false for null, undefined, `[]`, `{}`, string |

Additionally covered by `test_www_render_runtime.js` (pre-existing):
- `ALLERGY-PRODUCTION-GATE` — yes=BLOCKED, unknown/empty=MANUAL, no=APPROVED
- `SCALP-SENSITIVITY-GATE` — missing/irritated=BLOCKED, unknown/sensitive=MANUAL, normal=APPROVED
- `TARGET-DIRECTION-GATE` — missing/empty=BLOCKED, valid=APPROVED
- `LENGTH-DENSITY-THICKNESS-GATE` — each missing/empty=BLOCKED, valid=APPROVED
- `LENGTH-DENSITY-THICKNESS-UNRECOGNIZED-GATE` — unknown value=BLOCKED (not MANUAL, not silent default)
- `THIRD-ZONE-ISOLATION` — skeleton endsRec cannot leak production recipe
- `TIMING` — timing hidden in blocked/manual states; advisory-only in manual

---

## 15. Migration checklist

Before enabling any currently-disabled production feature (3-zone, endsRec, endsMass, brand matrix), the following must be satisfied:

- [ ] Feature has its own dedicated regression tests covering: valid path, malformed path, NaN/Infinity path, exception path
- [ ] `sanitizeMassModelForRender` updated to handle new mass fields
- [ ] Fail-safe contract updated with new section for the feature
- [ ] `docs/known-limitations-contract.md` updated to reflect new production boundary
- [ ] `AGENTS.md` updated if any agent behavior changes
- [ ] All 4 test files pass on the feature branch before merge
- [ ] No weakening of existing BLOCKED/MANUAL_REQUIRED gates

Specifically for brand matrix activation:
- [ ] `hasBrandRuleMatrix` const replaced with a validated runtime check
- [ ] Brand entry validation tests cover all 18 required fields
- [ ] Brand-sensitive scenarios produce `APPROVED` only with a fully validated matrix entry

---

## 16. Final invariant summary

```
Executable recipe output is allowed only when:
    status === 'APPROVED'
    && productionReady === true
    && all critical input fields are valid and finite
    && all safety gates pass (allergy, scalp, target_direction, length/density/thickness)
    && no diagnostic candidate is active
    && no brand-sensitive recipe without validated matrix
    && no NaN/Infinity in totalMass / rootMass / lengthMass
    && no runtime exception occurred

In all other cases: BLOCKED, MANUAL_REQUIRED, or FATAL_ERROR.
Never APPROVED by default. Never executable recipe by default.
```

Current production boundaries (as