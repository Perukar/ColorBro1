# Production Readiness Index — PERUKAR

**Date:** 2026-06-09 (updated — Roadmap and project state sync v1)
**HEAD at last update:** d501069 Expand render forbidden-field coverage
**Status:** ACTIVE
**Classification method:** AUTONOMOUS_BOUNDED_AUDIT — all domains derived from runtime code, committed tests, and existing contracts.

See also:
- [docs/known-limitations-contract.md](known-limitations-contract.md) — authoritative known limitations registry
- [docs/runtime-failsafe-contract.md](runtime-failsafe-contract.md) — fail-safe rules
- [docs/ui-render-safety-contract.md](ui-render-safety-contract.md) — render safety rules
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — input gate policy
- [docs/input-model-contract.md](input-model-contract.md) — input normalization rules
- [docs/brand-data-layer-contract.md](brand-data-layer-contract.md) — brand matrix contract
- [docs/state-persistence-safety-contract.md](state-persistence-safety-contract.md) — persistence safety
- [docs/browser-smoke-contract.md](browser-smoke-contract.md) — Node-VM browser smoke safety (32 scenarios)
- [docs/real-browser-smoke-contract.md](real-browser-smoke-contract.md) — Playwright Chromium smoke (8 scenarios, Windows)

---

## 1. Purpose

This document is the single consolidated production readiness index for PERUKAR.
It classifies every implemented, diagnostic, and future-forbidden domain in the
system. Its purpose is to prevent future work from accidentally treating
diagnostic helpers, scaffold code, or contract-only rules as production-ready.

**This is an inventory document, not a product release declaration.**
"Production readiness" here means: safe to execute as an automated color
protocol in the current codebase. It does not mean the full salon workflow is
complete, that brand data is available, or that all features are implemented.

---

## 2. Readiness status definitions

| Status | Meaning |
|---|---|
| `PRODUCTION_READY` | Active in runtime, tested, fail-closed, does not bypass existing gates, does not leak exact grams in unsafe states |
| `SAFETY_READY` | Active gate or guard that protects the production path; domain itself does not produce a final recipe |
| `MANUAL_REQUIRED_ONLY` | Runtime-active domain that intentionally stops automation and requires expert review; never produces APPROVED output |
| `BLOCKED_ONLY` | Runtime-active domain that intentionally forbids automation entirely; hard gate, no fallback to APPROVED |
| `DIAGNOSTIC_ONLY` | Helper, candidate, or pipeline exists in code and may execute during calculation, but must never affect the production recipe or be passed to renderStateToHtml as authoritative |
| `CONTRACT_ONLY` | Documented rule or schema exists; no active runtime feature yet; future work must consult the contract before implementing |
| `KNOWN_LIMITATION` | Accepted boundary: intentionally incomplete or constrained; documented and tested where possible; must not be silently removed |
| `FUTURE_FORBIDDEN` | Must not be activated without a separate approved task, dedicated regression tests, and explicit commit gate approval |
| `NOT_IMPLEMENTED` | Absent or inactive; no validated data or runtime feature exists |

A domain marked `FUTURE_FORBIDDEN` or `NOT_IMPLEMENTED` is **not a bug**. It is
a deliberate boundary. Scaffold code for future features exists but is not
production-active; the existence of a helper function does not mean the feature
is ready.

---

## 3. Global production invariants

These invariants hold at `HEAD d501069` and must hold in all future work:

```
1. Executable recipe output is allowed only when:
      status === 'APPROVED'
   && productionReady === true
   && all critical input fields are present and valid
   && all safety gates pass (allergy, scalp, target_direction, length/density/thickness)
   && no diagnostic candidate is active
   && no brand-sensitive recipe without validated matrix
   && no NaN/Infinity in totalMass / rootMass / lengthMass
   && no runtime exception occurred

2. production endsMass remains null in all current paths.
3. production endsRec is NOT active.
4. production 3-zone mass model is NOT active.
5. brand matrix is NOT enabled (hasBrandRuleMatrix = false hardcoded).
6. brand-specific formulas are NOT production-ready.
7. diagnostic helpers are NOT production sources.
8. stale persisted output is NOT authoritative.
9. No localStorage or sessionStorage is accessed in the current runtime.
10. browser smoke is a safety layer, not a replacement for domain tests.
```

---

## 4. Safety-critical production rules

These rules must not be weakened in any future task:

1. `buildWwwRenderState` defaults `status` to `'BLOCKED'` when status is missing
   or falsy — never `'APPROVED'`.
2. `productionReady: true` is set only by `normalizeWwwProductionReady()` as
   part of a fresh `calculateProtocol()` call. It cannot be imported from
   storage, passed from a prior session, or set by a diagnostic candidate.
3. The `approved-recipe` CSS class renders only when
   `status === 'APPROVED' && productionReady === true`.
4. `sanitizeMassModelForRender` strips exact masses (`totalMass`, `rootMass`,
   `lengthMass`) in all non-production states. NaN/Infinity in production state
   → mass hidden, not displayed.
5. `endsRecDiagnosticWiringCandidate` always carries `productionReady: false`,
   `previewOnly: true`, `notForMixing: true`. The render layer enforces this
   regardless of candidate content.
6. `hasBrandRuleMatrix = false` inside `calculateProtocol()` is intentional and
   hardcoded. It is not a placeholder.
7. `endsMass: null` in all production `buildMassModel()` output. No code path
   may set `endsMass` to a non-null value in the current runtime.
8. Any exception inside `calculateProtocol()` must render `FATAL_ERROR`, not
   a blank page or a partial recipe.
9. `safeParseJson` is the only safe entry point for any future storage reads.
10. The `#output` div must be empty on page load; no persisted result may be
    restored to it.

---

## 5. Domain readiness matrix

| # | Domain | Status | Runtime active | Produces recipe | Test coverage | Main blocker/risk | Required future work | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Runtime fail-safe | `PRODUCTION_READY` | yes | no (guard) | FAILSAFE-* (8 tests) | none | none | runtime-failsafe-contract.md |
| 2 | UI render safety | `PRODUCTION_READY` | yes | yes (gate) | full render_runtime suite | none | none | ui-render-safety-contract.md |
| 3 | Input model normalization | `PRODUCTION_READY` | yes | no (pre-gate) | NORMALIZATION-* | none | none | input-model-contract.md |
| 4 | Input safety gates (critical fields) | `SAFETY_READY` | yes | no | FAILSAFE-CALCULATE-PROTOCOL-MALFORMED | none | none | input-safety-gates-contract.md |
| 5 | Allergy gate | `SAFETY_READY` | yes | no | ALLERGY-PRODUCTION-GATE | none | none | input-safety-gates-contract.md |
| 6 | Scalp sensitivity gate | `SAFETY_READY` | yes | no | SCALP-SENSITIVITY-GATE | none | none | input-safety-gates-contract.md |
| 7 | Target direction gate | `SAFETY_READY` | yes | no | TARGET-DIRECTION-GATE | none | none | input-safety-gates-contract.md |
| 8 | Density / thickness / length gates | `SAFETY_READY` | yes | no | LENGTH-DENSITY-THICKNESS-GATE + UNRECOGNIZED-GATE | none | none | input-safety-gates-contract.md |
| 9 | Unknown enum handling | `SAFETY_READY` | yes | no | UNRECOGNIZED-GATE | none | none | input-model-contract.md |
| 10 | Damage / porosity / elasticity signals | `MANUAL_REQUIRED_ONLY` | yes | no | business_scenarios (porous+SB, damaged lift) | no hard BLOCKED for standalone damage; depends on combination | none | ui-render-safety-contract.md §10 |
| 11 | High oxidizer gates | `MANUAL_REQUIRED_ONLY` | yes | no | BRAND-HIGH-OX-MANUAL, business_scenarios | brand gate required; hasBrandRuleMatrix=false | none | brand-data-layer-contract.md |
| 12 | Special Blond gates | `MANUAL_REQUIRED_ONLY` | yes | no | G1-LEGACY-CONDITION-POROUS-SB-*, BRAND-SENSITIVE-* | brand gate required; SB always MANUAL_REQUIRED | none | brand-data-layer-contract.md |
| 13 | Grey coverage gates | `SAFETY_READY` | yes | no (modifier/warning) | business_scenarios (grey scenarios) | mordonsage only advisory; grey+SB → MANUAL | none | known-limitations-contract.md |
| 14 | Prepigmentation gates | `MANUAL_REQUIRED_ONLY` | yes | no | business_scenarios (significant darkening) | none | none | input-safety-gates-contract.md |
| 15 | Henna / metals blockers | `SAFETY_READY` | yes | no | BLOCKED scenario in business_scenarios | henna+porous → BLOCKED; henna alone → MANUAL_REQUIRED | none | input-safety-gates-contract.md |
| 16 | Black exit blockers | `MANUAL_REQUIRED_ONLY` | yes | no | business_scenarios | none | none | ui-render-safety-contract.md |
| 17 | Brand data layer helpers | `DIAGNOSTIC_ONLY` | partial | no | BRAND-MATRIX-INACTIVE, BRAND-READINESS-* | helpers exist; not called in production path | full brand dataset required | brand-data-layer-contract.md |
| 18 | Brand matrix availability | `NOT_IMPLEMENTED` | no | no | BRAND-MATRIX-INACTIVE | no validated brand data exists | validated matrix with all 18 fields | brand-data-layer-contract.md |
| 19 | Brand-specific formula readiness | `FUTURE_FORBIDDEN` | no | no | n/a | hasBrandRuleMatrix=false hardcoded | separate activation task + full test matrix | brand-data-layer-contract.md |
| 20 | Mass model 2-zone production | `PRODUCTION_READY` | yes | yes | mass_model suite | endsMass=null always; powder surcharge limitation | none for 2-zone | known-limitations-contract.md |
| 21 | Powder surcharge | `KNOWN_LIMITATION` | yes | yes (limited) | LIMITATION-POWDER-SURCHARGE-* | ratio accuracy depends on future brand data | brand data for exact powder ratios | known-limitations-contract.md §5 |
| 22 | 3-zone mass candidate | `DIAGNOSTIC_ONLY` | partial | no | PRODUCTION-THIRD-ZONE-READINESS-DIAGNOSTIC-ISOLATION | threeZonePreviewOnly=true always; not in massModel | production activation task | known-limitations-contract.md §3 |
| 23 | endsRec candidate / readiness pipeline | `DIAGNOSTIC_ONLY` | partial | no | THIRD-ZONE-ISOLATION, business_scenarios | previewOnly=true; notForMixing=true; endsRecipeReady=false | production endsRec activation task | known-limitations-contract.md §3 |
| 24 | Production third-zone activation | `FUTURE_FORBIDDEN` | no | no | n/a | endsMass must remain null; 3-zone split policy undefined | separate approved activation task | known-limitations-contract.md §4 |
| 25 | Runtime persistence / localStorage safety | `PRODUCTION_READY` | yes (defensive) | no | PERSIST-* (7 tests) | no active storage; safeParseJson defensive only | active storage requires full checklist | state-persistence-safety-contract.md |
| 26 | Browser smoke coverage | `PRODUCTION_READY` | yes | no (test layer) | SMOKE-* (32 tests) | not a replacement for domain tests | none | browser-smoke-contract.md |
| 27 | Known limitations registry | `PRODUCTION_READY` | yes (doc) | no | cross-referenced by other tests | none | update when any limitation is resolved | known-limitations-contract.md |
| 28 | Exact grams exposure policy | `PRODUCTION_READY` | yes | no (strip) | FAILSAFE-NAN-MASS-APPROVED-SANITIZE, render tests | none | none | runtime-failsafe-contract.md §7 |
| 29 | Diagnostic-only helpers aggregate | `DIAGNOSTIC_ONLY` | partial | no | isolation tests in mass_model + render_runtime | must not be passed to renderStateToHtml as authoritative | none | known-limitations-contract.md §3 |
| 30 | Future production blockers list | `FUTURE_FORBIDDEN` | no | no | n/a | 3-zone, endsRec, endsMass, brand matrix — all forbidden without explicit approval | separate approved tasks for each | known-limitations-contract.md §4 |

---

## 6. Production-ready domains

The following domains are fully active, tested, and safe in the current runtime:

**Runtime foundation:**
- Runtime fail-safe (§1): `isFiniteNumber`, `buildWwwRenderState` fail-closed default, `try/catch` in `calculateProtocol`, NaN guards in mass model and render.
- UI render safety (§2): `renderStateToHtml`, `isProductionReadyState`, `sanitizeMassModelForRender`, `sanitizeTimingInfoForRender`, `stripWwwHtmlText`.
- Input model normalization (§3): `normalizeTextInput`, `classifyMissingInput`, `normalizeEnumInput`.

**Recipe production:**
- Mass model 2-zone (§20): `buildMassModel(length, density)` → `mode: '2-zone'`, `endsMass: null` always. Exact grams produced for production-approved states.
- Exact grams exposure policy (§28): exact masses stripped in all non-production states; NaN/Infinity hidden.

**Defensive infrastructure:**
- Runtime persistence / localStorage safety (§25): `safeParseJson`, `PERUKAR_STORAGE_VERSION`, `PERUKAR_PERSIST_INPUT_KEY`, `PERUKAR_LEGACY_RESULT_KEYS` present as defensive infrastructure; no active storage calls.
- Browser smoke (§26): 32 SMOKE-* tests confirm page structure, global wiring, gate behavior, and persistence infrastructure.
- Known limitations registry (§27): `docs/known-limitations-contract.md` complete.

**What PRODUCTION_READY does NOT mean:**
- It does not mean all salon workflows are complete.
- It does not mean brand data is available.
- It does not mean the full protocol covers all edge cases.
- It does not mean the system is ready for unmonitored salon deployment.

---

## 7. Safety-ready but not recipe-producing domains

These gates are active and tested. They protect the approved-recipe path but do
not themselves produce a final recipe:

- Input safety gates (§4) — 12 critical fields; missing/empty → BLOCKED
- Allergy gate (§5) — confirmed → BLOCKED; unknown → MANUAL_REQUIRED
- Scalp sensitivity gate (§6) — irritated → BLOCKED; non-normal → MANUAL_REQUIRED
- Target direction gate (§7) — empty/missing → BLOCKED
- Density/thickness/length enum gates (§8) — missing or unrecognized → BLOCKED
- Unknown enum handling (§9) — no silent defaults; unrecognized → BLOCKED
- Grey coverage gates (§13) — grey % modifies oxidizer selection; grey+SB → MANUAL_REQUIRED
- Henna/metals blockers (§15) — henna history + porous condition → BLOCKED; henna alone → MANUAL_REQUIRED

---

## 8. Manual-only domains

These domains are active in runtime but intentionally prevent automation.
MANUAL_REQUIRED output is the expected and correct result for these paths:

- Damage / porosity / elasticity signals (§10): damaged condition + lifting → MANUAL_REQUIRED warning
- High oxidizer gates (§11): high-oxidizer process + no brand matrix → MANUAL_REQUIRED via brand gate
- Special Blond gates (§12): Special Blond process → MANUAL_REQUIRED via brand gate; confirmed by G1 regression test
- Prepigmentation gates (§14): significant darkening → MANUAL_REQUIRED
- Black exit blockers (§16): dark lift on cosmetic/black base → MANUAL_REQUIRED

All MANUAL_REQUIRED paths must display the manual decisions list and must never
produce `approved-recipe`, `finalFormula`, or exact mixing grams.

---

## 9. Blocked-only domains

Hard BLOCKED gates (no recipe, no manual fallback, no exceptions):

- Confirmed allergy (`allergy === 'yes'` or equivalent) → BLOCKED
- Irritated/inflamed scalp → BLOCKED
- Missing critical field → BLOCKED
- Unrecognized enum value in length/density/thickness → BLOCKED
- Henna/metals history + porous or severely damaged condition → BLOCKED
- NaN/Infinity in mass fields in approved state → mass hidden (sanitize), total BLOCKED if status itself invalid
- Runtime exception in `calculateProtocol()` → FATAL_ERROR display

---

## 10. Diagnostic-only domains

These helpers exist and may execute during `calculateProtocol()` but must never
produce, influence, or bypass the production recipe:

**3-zone mass candidate pipeline** (§22):
- `buildThreeZoneMassCandidate(length, density, split)` — executes when `threeZonePreviewEligible = true`
- Result stored as `threeZoneCandidateMassModel` with `threeZonePreviewOnly = true`
- Never stored in production `massModel`; never passed to `renderStateToHtml` as authoritative
- Test: `PRODUCTION-THIRD-ZONE-READINESS-DIAGNOSTIC-ISOLATION`

**endsRec candidate pipeline** (§23):
- `classifyEndsRecEligibility()`, `validateProductionEndsRecReadiness()`, `buildProductionEndsRec()`, `assembleProductionEndsRecContract()`, `buildControlledEndsRecDiagnosticWiringCandidate()`
- Result stored as `endsRecDiagnosticWiringCandidate` with:
  `productionReady: false`, `previewOnly: true`, `notForMixing: true`, `endsRecipeReady: false`
- The render layer strips all production fields from this candidate
- Tests: `THIRD-ZONE-ISOLATION`, `FAILSAFE-ENDSREC-NULL-RUNTIME`

**Brand data layer helpers** (§17):
- `isBrandRuleMatrixAvailable()`, `validateBrandRuleMatrixShape()`, `getMissingBrandMatrixFields()`, `getBrandMatrixReadinessStatus()`
- Not called in the `calculateProtocol()` approval path
- Used only for readiness checks and shape validation
- Test: `BRAND-MATRIX-INACTIVE`, `FAILSAFE-BRAND-MATRIX-INACTIVE`

**Invariant:** the presence of a diagnostic helper function does not mean the
feature is production-ready. Scaffold ≠ approval.

---

## 11. Known limitations

These limitations are intentional, documented, and tested where possible. They
must not be silently removed or glossed over in future work:

| Limitation | Current behavior | Risk if ignored |
|---|---|---|
| 2-zone only | `buildMassModel` produces 2-zone; `endsMass: null` always | Activating 3-zone without separate task bypasses split policy and mass validation |
| Production endsRec inactive | endsRec pipeline is diagnostic-only; `endsRecipeReady: false` always | Activating production endsRec without separate task bypasses eligibility gate and recipe validation |
| endsMass remains null | No code path sets `endsMass` to a non-null value | Non-null endsMass would require 3-zone activation and full mass model update |
| Brand matrix not available | `hasBrandRuleMatrix = false` hardcoded; all sensitive formulas → MANUAL_REQUIRED | Enabling without validated matrix data would allow unconfirmed brand recipes to reach APPROVED |
| Powder surcharge accuracy | Ratio ×1.6 applied, min 40g; accuracy depends on brand-specific data | Over/under-dosing risk if used with premium powder brands without brand matrix |
| G1 gap dependency | `condition='пористі'` does not independently feed `hasHighPorositySignal`; safety relies on brand gate | If brand matrix enabled without adding standalone `condition` porous + SB guard, G1 gap re-opens |
| No production endsRec mass allocation | `classifyProductionEndsRecMassAllocationContract` exists but cannot return READY | Future activation requires `validateProductionEndsRecReadiness()` to pass (currently impossible) |
| structure / curl absent | Not gathered, normalized, read, gated, or rendered; tested as absent (`test_www_hair_parameter_contract.js` group 8) | Activating requires explicit product/design contract + dedicated tests; does not equal full salon-ready logic |

---

## 12. Future-forbidden activations

The following must **not** be activated without a separate approved task with
dedicated regression tests and explicit commit gate approval:

| Activation | Why forbidden without approval |
|---|---|
| Production 3-zone (`endsMass ≠ null`) | Split policy undefined; mass model not validated for 3-zone; diagnostic candidate isolation would break |
| Production endsRec | Eligibility gate incomplete; brand-specific recipe rules not validated; endsMass must be non-null first |
| Brand matrix enable (`hasBrandRuleMatrix = true`) | No validated brand data; G1 gap dependency; brand entry schema requires all 18 fields; test coverage for brand-specific APPROVED paths required |
| Brand-specific formula APPROVED output | No validated brand entries; brand matrix not enabled |
| Removal of henna/metals BLOCKED gate | Hard safety gate; never remove without documented justification and counter-gate |
| Removal of allergy BLOCKED gate | Same — never weaken |
| Removal of `hasBrandRuleMatrix = false` constant | Must use runtime readiness check with validated matrix data, not just remove the constant |

---

## 13. Non-negotiable blockers before production expansion

Before any currently-inactive feature is promoted to production, **all** of the
following must be satisfied:

**For any feature activation:**
- [ ] Feature has its own dedicated regression tests covering: valid path, malformed path, exception path
- [ ] Feature does not weaken any existing BLOCKED or MANUAL_REQUIRED gate
- [ ] Feature has its own contract section in the relevant `docs/` file
- [ ] `docs/known-limitations-contract.md` updated to reflect resolved limitation
- [ ] Full 6-test matrix passes (including browser smoke)
- [ ] `git diff --check` passes
- [ ] Commit message explicitly states what feature is being activated
- [ ] Explicit `Commit: yes` approval

**Additionally for brand matrix activation:**
- [ ] Validated brand entries with all 18 required fields
- [ ] `hasBrandRuleMatrix = false` replaced with `isBrandRuleMatrixAvailable(matrix)` runtime check
- [ ] Standalone `condition='пористі'` + Special Blond guard added (G1 gap dependency)
- [ ] Brand-specific APPROVED output test added for at least one validated entry
- [ ] Brand-specific MANUAL_REQUIRED test for entry with missing fields

**Additionally for 3-zone / endsRec activation:**
- [ ] `endsMass` mass allocation policy defined and documented
- [ ] `validateProductionEndsRecReadiness()` returns READY for test scenario
- [ ] endsRec eligibility gate covers all conflict scenarios
- [ ] `THIRD-ZONE-ISOLATION` tests updated to cover new production path
- [ ] `sanitizeMassModelForRender` updated to handle `endsMass` in production state

**Additionally for production endsRec:**
- [ ] 3-zone production is already active (prerequisite)
- [ ] `endsRecipeReady: true` path produces correct `finalFormula` in tests
- [ ] `notForMixing` and `previewOnly` flags removed from production path (not from diagnostic path)

---

## 14. Required regression tests

These test files must all pass before any commit that touches safety domains:

| Test file | Domain coverage |
|---|---|
| `test_www_input_boundary_fuzz.js` | Boundary/fuzz: numeric level NaN-coercing, enum unknown/object/array, localized input, injection, prototype safety, render NaN/Infinity, clean control regression |
| `test_www_render_runtime.js` | Runtime fail-safe, UI render, input gates, allergy, scalp, target_direction, length/density/thickness, third-zone isolation, FAILSAFE-*, PERSIST-* |
| `test_www_business_scenarios.js` | End-to-end business scenarios: henna/metals BLOCKED, Special Blond MANUAL_REQUIRED, grey coverage, damage signals, approved clean path |
| `test_www_mass_model.js` | 2-zone mass model, powder surcharge, buildThreeZoneMassCandidate diagnostic isolation, NaN guards |
| `test_www_mapping.js` | Formula/oxidizer mapping correctness |
| `test_www_hair_parameter_contract.js` | Hair parameter contract: density/length mass-bearing, thickness timing-only, density/length timing-neutral, structure/curl absence (integration-level, 10 groups) |
| `test_www_output_honesty_copy.js` | Output honesty copy: no "Auto-Pilot" claim, honest Block 1 title, APPROVED gloss + safety caveat present on approved path and absent elsewhere, gating/mass unchanged (6 groups) |
| `test_www_browser_smoke.js` | Browser page structure, global wiring, gate smoke paths, persistence infrastructure (32 tests) |
| `test_www_production_readiness_index.js` | Readiness index document existence, required section presence, key invariant strings |

**Note:** `test_www_production_readiness_index.js` tests the documentation layer
only — it asserts that the readiness index exists, contains required sections,
and explicitly states key invariants (endsRec inactive, 3-zone inactive, etc.).
It does not duplicate runtime test coverage.

---

## 15. Release checklist

Before any production deployment to a real salon environment:

**Safety gates:**
- [ ] All 6 test files pass with zero failures
- [ ] `git diff --check` exits 0
- [ ] No diagnostic candidate is reachable from a production path
- [ ] `hasBrandRuleMatrix` remains false OR brand activation task is complete
- [ ] `endsMass` is null OR 3-zone activation task is complete
- [ ] `endsRecipeReady` is false in all diagnostic candidates

**Input/output integrity:**
- [ ] All 12 critical fields validated at runtime
- [ ] Allergy + scalp sensitivity gates verified in browser smoke
- [ ] `#output` is empty on page load (browser smoke: SMOKE-SAFETY-OUTPUT-STARTS-EMPTY-ON-LOAD)
- [ ] No localStorage or sessionStorage writes confirmed (browser smoke + manual checklist §14)

**Documentation:**
- [ ] `docs/known-limitations-contract.md` is current
- [ ] `docs/production-readiness-index.md` is current
- [ ] Any newly-activated feature has its own contract section
- [ ] Relevant contract `See-also` links are updated

**Manual verification:**
- [ ] Manual browser smoke checklist (docs/browser-smoke-contract.md §14) completed
- [ ] Zero console errors on page load
- [ ] Zero console errors on calculate with default values
- [ ] Zero console errors on calculate with `allergy = yes`
- [ ] No `approved-recipe` class visible in output when allergy = yes or scalp = irritated

---

## 16. Final invariant summary

```
PERUKAR production readiness status at HEAD d501069:

ACTIVE AND PRODUCTION_READY (10 domains):
  Runtime fail-safe, UI render safety, Input model normalization,
  Mass model 2-zone, Exact grams exposure policy,
  Runtime persistence safety (defensive), Browser smoke (32 Node-VM tests),
  Known limitations registry,
  Real browser Playwright smoke (8 scenarios, Windows Chromium),
  Render forbidden-field coverage (6 Node render-runtime regression tests).

ACTIVE AS SAFETY GATES (8 domains):
  Input safety gates (12 critical fields), Allergy gate, Scalp gate,
  Target direction gate, Density/thickness/length gates,
  Unknown enum handling, Grey coverage gates, Henna/metals blockers.

ACTIVE AS MANUAL-REQUIRED GUARDS (6 domains):
  Damage/porosity/elasticity signals, High oxidizer gates,
  Special Blond gates, Prepigmentation gates, Black exit blockers,
  (brand gate when hasBrandRuleMatrix=false, for all sensitive formulas).

DIAGNOSTIC_ONLY — must not produce production output (3 domains):
  3-zone mass candidate, endsRec candidate pipeline,
  Brand data layer helpers.

NOT_IMPLEMENTED (1 domain):
  Brand matrix availability (no validated data).

KNOWN_LIMITATION (1 domain):
  Powder surcharge (active but limited accuracy without brand data).

FUTURE_FORBIDDEN — explicit approval required (3 domains):
  Production 3-zone activation, Production endsRec,
  Brand-specific formula APPROVED output.

HARD INVARIANTS THAT MUST NOT BE CHANGED:
  - production endsMass remains null
  - production endsRec is NOT active
  - production 3-zone is NOT active
  - brand matrix is NOT enabled (hasBrandRuleMatrix = false)
  - diagnostic helpers are NOT production sources
  - stale persisted output is NOT authoritative
  - APPROVED output is allowed only through the current validated calculateProtocol path
  - browser smoke is a safety layer, not a replacement for domain tests
  - normal APPROVED output must not dump internal diagnostic fields (rootOxPercent, threeZonePreviewOnly, etc.)
  - ALLOW_3ZONE diagnostic preview is diagnostic evidence only — not for mixing, not a production recipe
  - BLOCKED and MANUAL_REQUIRED states must not render dyeMass, oxidizerMass, or finalFormula
```
