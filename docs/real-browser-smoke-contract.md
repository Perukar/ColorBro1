# Real Browser Smoke Contract — PERUKAR

**Date:** 2026-06-09 (updated — Roadmap and project state sync v1)
**HEAD at creation:** b2645ef Add production readiness index
**HEAD at last verification:** d501069 Expand render forbidden-field coverage
**Status:** ACTIVE — 8/8 PASS on Windows (Playwright Chromium); tooling BLOCKED_TOOLING in sandbox (proxy blocks playwright.azureedge.net)
**Test file:** `test_www_real_browser_smoke.js`

See also:
- [docs/browser-smoke-contract.md](browser-smoke-contract.md) — Node-VM smoke: gate logic, status paths, 32 scenarios
- [docs/ui-render-safety-contract.md](ui-render-safety-contract.md) — render status taxonomy and approved-recipe gate rules
- [docs/state-persistence-safety-contract.md](state-persistence-safety-contract.md) — stale storage policy and safeParseJson rules
- [docs/known-limitations-contract.md](known-limitations-contract.md) — production boundary limitations
- [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix

---

## 1. Purpose

This document defines the real browser smoke test contract for PERUKAR. While `test_www_browser_smoke.js` verifies gate logic via Node-VM in isolation, the real browser smoke verifies the **full end-to-end pipeline** in a real Chromium browser:

- `www/index.html` parses correctly
- `www/core.js` loads and executes in a real browser JS engine
- DOM selectors (`#output`, `#allergy`, `#scalp_sensitivity`, etc.) match live form elements
- `calculateProtocol()` is callable via the UI button
- Safety gates produce correct output classes in real rendered HTML
- `localStorage` is not pre-populated with stale APPROVED output on load
- Forbidden fields do not appear in rendered APPROVED output
- No console errors on normal operation

The real browser smoke does not replace domain tests (business scenarios, mass model, mapping, render runtime). It is the final integration layer verifying that the tested logic is actually wired to the UI.

---

## 2. Relation to Node-VM smoke

| Layer | File | What it checks |
|---|---|---|
| Domain logic | `test_www_business_scenarios.js` | Formula correctness, gate decisions, 30+ scenarios |
| Mass model | `test_www_mass_model.js` | 2-zone gram calculations, NaN guards, sanitize |
| Mapping | `test_www_mapping.js` | Level-to-tone mapping, oxidizer selection |
| Render runtime | `test_www_render_runtime.js` | buildWwwRenderState, forbidden fields, persistence helpers |
| Node-VM smoke | `test_www_browser_smoke.js` | Gate paths via vm.runInContext — core.js behavior in Node |
| **Real browser smoke** | `test_www_real_browser_smoke.js` | Full page load → form fill → click → DOM output in Chromium |

The real browser smoke is **not a substitute** for the domain tests above. It verifies wiring, not correctness. A bug caught by domain tests may not be visible in the smoke; a wiring bug (missing `<script>` tag, wrong selector, broken HTML) will be caught here but not by Node-VM smoke.

---

## 3. Tooling requirements

- **Runtime:** Node.js ≥ 18 (available via `node --version`)
- **Package:** `@playwright/test` (installed as devDependency — `npm install --save-dev @playwright/test`)
- **Browser binary:** Chromium — installed via `npx playwright install chromium`
  - On Windows (unrestricted network): run from PowerShell in repo root
  - In sandbox: blocked — `playwright.azureedge.net` returns HTTP 403 from proxy
- **Test execution:** `node test_www_real_browser_smoke.js` (plain Node.js runner, not `npx playwright test`)
- **headless:** yes (default) — no display required
- **Timeout:** 30 seconds per scenario; 120 seconds total

---

## 4. When to run

- After any change to `www/index.html` (DOM structure, selector IDs, script tags)
- After any change to `www/core.js` that affects `calculateProtocol()` entry point or output structure
- As part of the release checklist before any production deployment
- After any change to `www/style.css` that might add or remove output classes
- Before any commit that modifies the render pipeline or UI form elements

The real browser smoke is NOT required before every commit (too slow). The full Node-VM matrix (`node --check` + `node test_www_*.js`) is required before every commit.

---

## 5. Scenarios covered

| Scenario ID | Input state | Expected output |
|---|---|---|
| `SMOKE-PAGE-LOAD-OUTPUT-EMPTY` | Default page load, no interaction | `#output` is empty |
| `SMOKE-ALLERGY-YES-BLOCKED` | allergy=yes, all else default | Output contains `BLOCKED` text, no `approved-recipe` class |
| `SMOKE-SCALP-IRRITATED-BLOCKED` | scalp_sensitivity=irritated, allergy=no | Output contains `BLOCKED` text, no `approved-recipe` class |
| `SMOKE-ALLERGY-UNKNOWN-MANUAL` | allergy="" (default/unknown), scalp=normal | Output contains `MANUAL` text, no `approved-recipe` class |
| `SMOKE-CLEAN-PATH-APPROVED` | allergy=no, scalp=normal, all valid fields | Output contains `approved-recipe` class |
| `SMOKE-STALE-STORAGE-NO-PRERENDER` | Inject fake APPROVED into localStorage, reload | `#output` empty on load (no stale pre-render) |
| `SMOKE-FORBIDDEN-FIELDS-NOT-IN-OUTPUT` | Clean path → APPROVED | Output HTML does not contain dyeMass/oxidizerMass/finalFormula raw fields |
| `SMOKE-NO-CONSOLE-ERRORS` | Default load + clean calculation | No `console.error` calls during page lifecycle |

---

## 6. Scenario: SMOKE-PAGE-LOAD-OUTPUT-EMPTY

On every page load, `#output` must be empty.

**Rationale:** `www/core.js` must not call `calculateProtocol()` automatically on `DOMContentLoaded` or `window.load`. The current implementation does not do this, but this smoke test locks that invariant as a regression check. Any future persistence hydration must also leave `#output` empty (per `docs/state-persistence-safety-contract.md` §5.6).

**Pass condition:** `document.getElementById('output').innerHTML.trim() === ''`

---

## 7. Scenario: SMOKE-ALLERGY-YES-BLOCKED

Setting `#allergy` to `'yes'` and clicking the calculate button must produce a BLOCKED output.

**Rationale:** Allergy gate is the primary human-safety gate. If it is wired incorrectly to the DOM (wrong selector, wrong value mapping), domain tests would pass but the real form would be unsafe. This smoke verifies the gate fires in real browser execution.

**Pass condition:**
- `#output` is not empty after click
- `#output.innerHTML` does NOT contain `approved-recipe`
- `#output.innerHTML` contains `BLOCKED` (case-sensitive or as part of a status string)

---

## 8. Scenario: SMOKE-SCALP-IRRITATED-BLOCKED

Setting `#scalp_sensitivity` to `'irritated'` (with `allergy=no`) and clicking calculate must produce BLOCKED.

**Rationale:** Scalp gate second critical human-safety gate. Wiring verification is same rationale as allergy gate above.

**Pass condition:** same as §7 (no `approved-recipe`, contains `BLOCKED`)

---

## 9. Scenario: SMOKE-ALLERGY-UNKNOWN-MANUAL

With default form state (`allergy=""`, `scalp_sensitivity="unknown"`), clicking calculate must produce MANUAL_REQUIRED — not APPROVED and not BLOCKED.

**Rationale:** Unknown allergy state must escalate to human review, not be silently accepted or rejected. This is a behavioral contract verified only under real DOM default values.

**Pass condition:**
- `#output` is not empty after click
- `#output.innerHTML` does NOT contain `approved-recipe`
- `#output.innerHTML` contains `MANUAL` (as part of status string) OR does not contain `APPROVED`

---

## 10. Scenario: SMOKE-CLEAN-PATH-APPROVED

With all safety fields set to safe values and a valid target direction, calculate must produce an APPROVED output containing the `approved-recipe` class.

**Input state (safe approved fixture — mirrors `UI-RENDER-APPROVED-CLEAN-PATH` in `test_www_business_scenarios.js`):**
```
allergy = "no"
scalp_sensitivity = "normal"
root_level = "7"          (explicitly set — not HTML default 5)
length_level = "7"        (explicitly set — not HTML default 9)
ends_level = "7"          (explicitly set)
target_level = "7"        (same-level permanent — not HTML default 9)
target_direction = "1"    (голубий/пепел)
base_type = "Натуральна"  (explicitly set — not HTML default Косметична)
history = "натуральні"    (HTML default — safe)
thickness = "средние"     (HTML default — valid)
density = "средние"       (HTML default — valid)
length = "средние"        (HTML default — valid)
```

**Why not HTML defaults (root_level=5, target_level=9)?**
A 5→9 lift (4 levels) results in high oxidizer ≥9%, which triggers the brand gate
(`hasBrandRuleMatrix = false`), producing MANUAL_REQUIRED — not APPROVED.
A same-level 7→7 permanent uses standard oxidizer with no brand-sensitive marker,
passing all gates and producing APPROVED.

**Rationale:** Verifies the APPROVED path is reachable via the real DOM — that selectors, value mappings, and the script tag are all correctly wired.

**Pass condition:** `#output.innerHTML` contains the string `approved-recipe`

---

## 11. Scenario: SMOKE-STALE-STORAGE-NO-PRERENDER

Inject a fake stale APPROVED object into `localStorage` under the key `perukar_state`, then reload the page. `#output` must be empty.

**Injected payload:**
```json
{"status":"APPROVED","productionReady":true,"finalFormula":"FAKE","approved-recipe":true}
```

**Rationale:** Per `docs/state-persistence-safety-contract.md` §10 and §11: stale APPROVED from storage must never be rendered to `#output` on load. Even if `perukar_state` exists in storage, the current runtime does not read it (no persistence layer exists) — this verifies that remains true.

**Pass condition:** After reload, `document.getElementById('output').innerHTML.trim() === ''`

---

## 12. Scenario: SMOKE-FORBIDDEN-FIELDS-NOT-IN-OUTPUT

After a clean-path APPROVED calculation (§10 inputs), inspect `#output.innerHTML`. The raw field names and values that must NOT appear:

| Forbidden string | Why forbidden |
|---|---|
| `"dyeMass"` | Internal mass field — not for display |
| `"oxidizerMass"` | Internal mass field — not for display |
| `"finalFormula"` as JSON key | Internal recipe object key — not raw display |
| `"notForMixing"` | Diagnostic field — not for production display |
| `"threeZonePreviewOnly"` | Diagnostic flag — not for production display |
| `"endsRecipeReady"` | Diagnostic field — not for production display |

**Rationale:** `renderEndsDiagnosticDisplay()` has an explicit `forbiddenFields` Set. This smoke verifies those fields do not leak into the DOM in any APPROVED output path.

**Pass condition:** None of the above strings appear in `#output.innerHTML`

---

## 13. Scenario: SMOKE-NO-CONSOLE-ERRORS

During default page load and a clean-path calculation, no `console.error` calls must fire.

**Rationale:** Console errors indicate JS exceptions or failed assertions that may not prevent output rendering but signal an unstable state.

**Pass condition:** No `console.error` messages captured during page.goto + calculateProtocol() call

---

## 14. What this contract does NOT cover

- Formula correctness (covered by `test_www_business_scenarios.js`)
- Mass model gram precision (covered by `test_www_mass_model.js`)
- Full gate matrix (covered by `test_www_browser_smoke.js` Node-VM smoke)
- Render state sanitization completeness (covered by `test_www_render_runtime.js`)
- Style/CSS visual appearance
- Mobile viewport rendering
- Multi-tab state isolation
- Service workers or network interception
- Production server TLS or CORS behavior

---

## 15. Final invariant summary

```
Real browser smoke invariants:

  1. #output is empty on every page load (no auto-calculate, no stale render).
  2. allergy=yes → BLOCKED in real browser DOM (not just in unit logic).
  3. scalp_sensitivity=irritated → BLOCKED in real browser DOM.
  4. allergy=unknown/empty → MANUAL_REQUIRED (not APPROVED) in real browser DOM.
  5. Clean-path → approved-recipe class present in #output.
  6. Stale APPROVED localStorage does not pre-populate #output.
  7. Forbidden internal fields do not appear in APPROVED DOM output.
  8. No console.error on normal operation.

Tooling note (updated 2026-06-09):
  @playwright/test is installed (devDependency).
  Chromium binary requires: npx playwright install chromium (run from Windows PowerShell).
  Sandbox binary download blocked by proxy (playwright.azureedge.net → HTTP 403).
  Windows verification: 8/8 scenarios PASS as of commit 94a6b23.
  SMOKE-FORBIDDEN-FIELDS scenario (commit 94a6b23) verifies no internal diagnostic fields in APPROVED DOM output.
  Render sanitization fix (commit 413ced8) resolved the underlying internal field leak in buildWwwRenderState.
  All subsequent commits (d501069) preserve the 8/8 smoke pass state.
```
