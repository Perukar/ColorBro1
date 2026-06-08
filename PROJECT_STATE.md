# PROJECT_STATE — PERUKAR

**Last updated:** 2026-06-08
**Updated by:** RALFBOT — AUTONOMOUS_BOUNDED_AUDIT_AND_DOCS (Production Readiness Index v1)

---

## 0. Current HEAD

**HEAD:** `d419973 Add browser smoke safety contract`

> NOTE: Sections 1-8 below (legacy state from pre-safety-phase) are preserved for history but are **outdated**. The safety phase started at `9701a4f` (allergy gate) and has been the only active development track since 2026-06-06. The authoritative state record is the committed safety series in `docs/project-checkpoint-safety-phase.md`.

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

### Next pending commit

- Add production readiness index (`docs/production-readiness-index.md`, `test_www_production_readiness_index.js`)

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

---

## 4. Key documents

| Document | Purpose |
|---|---|
| `docs/production-readiness-index.md` | 30-domain readiness matrix — primary production boundary reference |
| `docs/known-limitations-contract.md` | Single source of truth for intentional limitations |
| `docs/runtime-failsafe-contract.md` | Fail-closed runtime rules: NaN, exceptions, fallback states |
| `docs/ui-render-safety-contract.md` | Render status taxonomy and approved-recipe gate rules |
| `docs/state-persistence-safety-contract.md` | Browser storage safety, safeParseJson, stale output policy |
| `docs/browser-smoke-contract.md` | Page structure, gate smoke paths, manual checklist |
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
node test_www_business_scenarios.js
node test_www_mass_model.js
node test_www_mapping.js
node test_www_render_runtime.js
node test_www_browser_smoke.js
node test_www_production_readiness_index.js
git diff --check
```

---

## 6. Known FUSE / git anomaly (sandbox)

`git add` from the Linux sandbox fails with `index.lock` error (FUSE phantom stale cache) even when Windows sees no lock. Staging and commits must be done from Windows PowerShell. `git status` and read-only git commands work from sandbox.

---

## Legacy sections (pre-safety-phase, retained for history)

> Everything below is from the pre-safety-phase era (HEAD was `84b1e2c`). Treat as historical context only — do not act on it as current state.

### Legacy HEAD (outdated)
HEAD: `84b1e2c Normalize blocked result shape`

### Legacy status (outdated)
- Root core.js and www/core.js may diverge — this was resolved by safety phase work on www/core.js as the authoritative production file.
- Mixtones structural only — still true as of safety phase.
- massModel is now a real 2-zone gram model (rootMass, lengthMass, totalMass) — **no longer structural only**.
- timingInfo is now a real production timing object — **no longer structural only**.
- Full test suite now exists: 6 test files, all passing.
