# PROJECT_STATE — PERUKAR

**Last updated:** 2026-06-09
**Updated by:** RALFBOT — AUTONOMOUS_BOUNDED_TEST_COVERAGE (Input boundary fuzz v1)

---

## 0. Current HEAD

**HEAD:** `5bd506a Sync roadmap and project state` (pre-fuzz-task commit; pending commit for this task)
**origin/main:** `5bd506a` (in sync)
**Branch:** `main`

---

## 1. Safety phase status

The safety foundation phase is **in progress**. All committed work is on `main`.

### Committed safety series (chronological)

| Commit | Description |
|--------|-------------|
| `e087879` | Document UI render safety contract |
| `9701a4f` | Add allergy production gate |
| `cc9a030` | Add scalp sensitivity production gate |
| `1ef1fd5` | Require target direction for production gate |
| `2aa62fa` | Add length density thickness production gate |
| `f60665b` | Reject unknown hair mass enum values |
| `6474f55` | Document input safety gates contract |
| `225adc2` | Document safety phase checkpoint |
| `6728e6d` | Harden formula correctness coverage |
| `43c669b` | Document brand data layer safety contract |
| `6103656` | Scaffold brand data layer readiness |
| `ee990a6` | Harden input model normalization contract |
| `e124809` | Document known limitations contract |
| `54c0763` | Harden UI safety surface contract |
| `a187cee` | Harden runtime fail-safe behavior |
| `511f97b` | Harden state persistence safety |
| `d419973` | Add browser smoke safety contract |
| `b2645ef` | Add production readiness index |
| `94a6b23` | Add real browser smoke test (Playwright Chromium) |
| `413ced8` | Fix real browser smoke internal field handling (render sanitization) |
| `5bd506a` | Sync roadmap and project state |
| *(pending)* | Add input boundary fuzz coverage (target_direction enum gate fix + fuzz test) |
| *(pending)* | Add hair parameter contract tests v1 (density/length mass, thickness timing, structure/curl absence) — test-only + docs sync, no runtime change |
| *(pending)* | Output honesty copy fix v1 (UI header/Block-1 wording + APPROVED gloss & safety caveat) + test_www_output_honesty_copy.js — render/UI text only, no formula change |

### Recently completed blocks

1. Runtime fail-safe behavior — NaN guards, fail-closed status default
2. State persistence safety — safeParseJson, storage key constants, stale output guard
3. Browser smoke safety contract — 32 Node-VM smoke tests
4. Production readiness index — 30-domain matrix
5. Real browser Playwright smoke — 8 end-to-end Chromium scenarios
6. Internal field render sanitization — buildWwwRenderState narrow reasons guard
7. Render forbidden-field coverage expansion — 6 Node render-runtime regression tests
8. Input boundary fuzz coverage — target_direction enum gate fix + test_www_input_boundary_fuzz.js (7 groups)
9. Hair parameter contract v1 — test_www_hair_parameter_contract.js (10 groups, integration-level): density/length mass-bearing, thickness timing-only, density/length timing-neutral, structure/curl absence. Test-only; no runtime change. Docs synced (input-model, input-safety-gates, known-limitations §17, production-readiness-index).
10. Output honesty copy fix v1 — UI header "Colorist Auto-Pilot" → "Колорист-калькулятор (помічник майстра)"; Block 1 "Структура" → "Стан і параметри волосся"; APPROVED status gloss "розрахунок дозволено (не гарантія безпеки)" + renderApprovedCaveat block on the production-ready path. Render/UI text only — no formula/gating change. Locked by test_www_output_honesty_copy.js (6 groups). DOM/render touched → run real browser smoke on Windows before deploy.

---

## 2. Production readiness summary

| Domain class | Count | Notes |
|---|---|---|
| PRODUCTION_READY | 9 | Core formula, safety gates, mass model 2-zone, UI, persistence, etc. |
| SAFETY_READY | 3 | Henna/metals, Special Blond (MANUAL_REQUIRED gate), prepigmentation check |
| MANUAL_REQUIRED_ONLY | 2 | Brand-sensitive recipes, scalp advisory |
| BLOCKED_ONLY | 1 | Allergy confirmed path |
| DIAGNOSTIC_ONLY | 5 | endsRec pipeline, 3-zone candidate, brand helpers |
| FUTURE_FORBIDDEN | 2 | Production 3-zone activation, production endsRec activation |
| KNOWN_LIMITATION | 4 | endsMass null, powder surcharge, grey coverage, length advisory |
| CONTRACT_ONLY | 2 | Browser smoke, runtime persistence defensive |
| NOT_IMPLEMENTED | 2 | Mobile native, CI/CD |

Full matrix: `docs/production-readiness-index.md`

---

## 3. Critical invariants (must not be violated by future work)

- `endsMass` is always `null` in production `buildMassModel()` output.
- `hasBrandRuleMatrix = false` is hardcoded inside `calculateProtocol()` — all sensitive formulas → `MANUAL_REQUIRED`.
- `endsRec` pipeline is DIAGNOSTIC_ONLY — `productionReady: false`, `notForMixing: true`.
- Production 3-zone is not active — `threeZonePreviewOnly: true` always.
- Allergy gate: `yes` → `BLOCKED`; `unknown/empty` → `MANUAL_REQUIRED`.
- Scalp gate: `irritated` → `BLOCKED`; `sensitive/unknown/missing` → `MANUAL_REQUIRED`.
- `approved-recipe` renders only when `status === 'APPROVED' && productionReady === true`.
- Fail-closed: missing/falsy status defaults to `'BLOCKED'`, never `'APPROVED'`.
- Normal APPROVED output must not dump internal diagnostic fields (`threeZonePreviewOnly`, `rootOxPercent`, etc.).
- ALLOW_3_ZONE diagnostic preview is diagnostic evidence only — not a production recipe, not for mixing.
- BLOCKED/MANUAL_REQUIRED must not render executable mixing fields (`dyeMass`, `oxidizerMass`, `finalFormula`).

---

## 4. Key documents

| Document | Purpose |
|---|---|
| `docs/production-readiness-index.md` | 30-domain readiness matrix — primary production boundary reference |
| `docs/known-limitations-contract.md` | Single source of truth for intentional limitations |
| `docs/runtime-failsafe-contract.md` | Fail-closed runtime rules: NaN, exceptions, fallback states |
| `docs/ui-render-safety-contract.md` | Render status taxonomy, approved-recipe gate rules, forbidden-field policy |
| `docs/state-persistence-safety-contract.md` | Browser storage safety, safeParseJson, stale output policy |
| `docs/browser-smoke-contract.md` | Node-VM page structure smoke, gate smoke paths, manual checklist |
| `docs/real-browser-smoke-contract.md` | Playwright Chromium end-to-end smoke contract (8 scenarios) |
| `docs/input-safety-gates-contract.md` | Production input validation gate policy |
| `docs/input-model-contract.md` | Input normalization rules |
| `docs/brand-data-layer-contract.md` | Brand matrix safety contract (NOT READY) |
| `docs/project-checkpoint-safety-phase.md` | Safety phase commit history and completion blocks |
| `AGENTS.md` | Task card protocol and RALFBOT discipline rules |

---

## 5. Required test matrix (full — must all pass before any commit)

```
node --check www/core.js
node --check test_www_business_scenarios.js
node --check test_www_mass_model.js
node --check test_www_mapping.js
node --check test_www_render_runtime.js
node --check test_www_browser_smoke.js
node --check test_www_production_readiness_index.js
node --check test_www_real_browser_smoke.js
node --check test_www_hair_parameter_contract.js
node --check test_www_output_honesty_copy.js
node test_www_business_scenarios.js
node test_www_mass_model.js
node test_www_mapping.js
node test_www_render_runtime.js
node test_www_browser_smoke.js
node test_www_production_readiness_index.js
node test_www_hair_parameter_contract.js
node test_www_output_honesty_copy.js
git diff --check
```

Real browser smoke (Playwright Chromium):
```
node test_www_real_browser_smoke.js
```
Run from Windows PowerShell (Chromium binary required). Not required before every commit — run after any DOM/script/render change.

---

## 6. Known FUSE / git anomaly (sandbox)

`git add` from the Linux sandbox fails with `index.lock` error (FUSE phantom stale cache) even when Windows sees no lock. Staging and commits must be done from Windows PowerShell. `git status` and read-only git commands work from sandbox.

---

## Legacy sections (pre-safety-phase, retained for history)

> Everything below is from the pre-safety-phase era (HEAD was `84b1e2c`). Treat as historical context only.

### Legacy HEAD (outdated)
HEAD: `84b1e2c Normalize blocked result shape`
