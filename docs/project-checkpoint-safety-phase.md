# Project Checkpoint: Safety Foundation Completed

**Date:** 2026-06-09 (updated — Roadmap and project state sync v1)
**Phase:** Safety Foundation — IN PROGRESS
**HEAD:** d501069 Expand render forbidden-field coverage

---

## Completed blocks

### 1. UI/Render Safety
- Formula render safety contract hardened (productionReady invariant).
- Third-zone skeleton isolation contract: skeleton renders only; no production recipe leaks.
- All render paths verified: BLOCKED / MANUAL_REQUIRED / APPROVED states correctly gate output.
- `buildWwwRenderState` narrow reasons sanitization: normal APPROVED output must not dump internal diagnostic fields; ALLOW_3_ZONE diagnostic preview is diagnostic-only.
- 6 Node-level render-runtime regression tests cover forbidden-field invariants.

### 2. Input/Business Safety Gates
- **Allergy gate:** `allergy === 'yes'` → BLOCKED; `unknown/empty` → MANUAL_REQUIRED; `no` → proceeds.
- **Scalp sensitivity gate:** `irritated` → BLOCKED; `sensitive/unknown/missing` → MANUAL_REQUIRED; `normal` → proceeds.
- **Target direction gate:** missing or empty `target_direction` → BLOCKED.
- **Length/density/thickness gate:** any missing or empty value → BLOCKED; any unrecognized enum value → BLOCKED (no silent default, no MANUAL fallback).

### 3. Documentation
- `docs/ui-render-safety-contract.md` — UI render safety contract (15 sections + §16 forbidden-field policy).
- `docs/input-safety-gates-contract.md` — input/business safety gates contract.
- `docs/known-limitations-contract.md` — known limitations registry.
- `docs/production-readiness-index.md` — 30-domain readiness matrix.
- `docs/runtime-failsafe-contract.md` — runtime fail-safe rules.
- `docs/state-persistence-safety-contract.md` — browser storage safety.
- `docs/browser-smoke-contract.md` — Node-VM smoke contract (32 tests).
- `docs/real-browser-smoke-contract.md` — Playwright Chromium smoke contract (8 scenarios).

---

## Main safety invariant

Executable recipe output is allowed **only** when:

```
status === 'APPROVED' && productionReady === true
```

All other paths (BLOCKED, MANUAL_REQUIRED, diagnostic-only) must not produce a production recipe.

---

## Required production input fields

The following fields must be present and valid for a production gate to proceed:

```
root_level, length_level, target_level, target_direction,
history, base_type, condition, allergy, scalp_sensitivity,
length, density, thickness
```

---

## What is now blocked

- Any missing critical field from the list above.
- `allergy === 'yes'`.
- `scalp_sensitivity === 'irritated'`.
- Missing, empty, or unrecognized `length` / `density` / `thickness` enum values.
- Missing or empty `target_direction`.
- Diagnostic-only paths attempting to produce a production recipe.
- Normal APPROVED output rendering internal diagnostic fields (`threeZonePreviewOnly`, `rootOxPercent`, etc.).

---

## Committed safety series (chronological)

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
| `6728e6d` | Harden formula correctness coverage (G1 regression + formula audit) |
| `43c669b` | Document brand data layer safety contract |
| `6103656` | Scaffold brand data layer readiness (helpers + schema + tests) |
| `ee990a6` | Harden input model normalization contract |
| `e124809` | Document known limitations contract |
| `54c0763` | Harden UI safety surface contract |
| `a187cee` | Harden runtime fail-safe behavior |
| `511f97b` | Harden state persistence safety |
| `d419973` | Add browser smoke safety contract (32 Node-VM smoke tests) |
| `b2645ef` | Add production readiness index (30-domain matrix) |
| `94a6b23` | Add real browser smoke test (Playwright Chromium, 8 scenarios) |
| `413ced8` | Fix real browser smoke internal field handling (narrow reasons sanitization in buildWwwRenderState) |
| `d501069` | Expand render forbidden-field coverage (6 Node render-runtime regression tests, §16 ui-render-safety-contract) |

---

## Remaining major completion blocks: 7

| # | Block | Status |
|---|-------|--------|
| 1 | Core business logic audit | done — formula correctness audit clean (2026-06-07) |
| 2 | Formula correctness audit | done — G1 regression test added (2026-06-07) |
| 3 | Brand/product data layer | scaffold done — schema defined, helpers added, matrix disabled; not production-ready |
| 4 | User flow / UI polish | pending |
| 5 | Data persistence / client history | pending — state persistence safety contract and helpers added (2026-06-08); no active persistence yet |
| 6 | Final QA / CI | pending |
| 7 | Release / packaging / deployment | pending |

---

## Notes for future agents

- Known limitations are documented in `docs/known-limitations-contract.md` — consult before any future activation task.
- UI render safety rules are documented in `docs/ui-render-safety-contract.md` — consult before any render layer change.
- Render forbidden-field policy is in §16 of `docs/ui-render-safety-contract.md`.
- Do not change runtime logic or tests in documentation-only tasks.
- Safety invariant (`status === 'APPROVED' && productionReady === true`) must be preserved in all future work.
- LOCKED files: see `references/locked-files-and-git-policy.md`.
- Full test matrix must pass before any commit:
  ```
  node --check www/core.js
  node --check test_www_business_scenarios.js
  node --check test_www_mass_model.js
  node --check test_www_mapping.js
  node --check test_www_render_runtime.js
  node --check test_www_browser_smoke.js
  node --check test_www_production_readiness_index.js
  node --check test_www_real_browser_smoke.js
  node test_www_business_scenarios.js
  node test_www_mass_model.js
  node test_www_mapping.js
  node test_www_render_runtime.js
  node test_www_browser_smoke.js
  node test_www_production_readiness_index.js
  git diff --check
  ```
  Real browser smoke (`node test_www_real_browser_smoke.js`) requires Playwright Chromium (Windows PowerShell). Run after DOM/script/render changes.
- Production readiness domain matrix is documented in `docs/production-readiness-index.md` (30 domains, 9 status codes) — consult before any activation task.
