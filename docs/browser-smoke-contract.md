# Browser Smoke Safety Contract — PERUKAR

**Date:** 2026-06-08
**HEAD at creation:** 511f97b Harden state persistence safety
**Status:** ACTIVE

See also:
- [docs/ui-render-safety-contract.md](ui-render-safety-contract.md) — render status taxonomy and HTML safety rules
- [docs/runtime-failsafe-contract.md](runtime-failsafe-contract.md) — runtime fail-safe rules: NaN/Infinity, malformed input, exception policy
- [docs/state-persistence-safety-contract.md](state-persistence-safety-contract.md) — browser storage safety contract
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — input validation gates
- [docs/known-limitations-contract.md](known-limitations-contract.md) — production boundary limitations
- [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix: production status, active vs diagnostic, known limitations summary, release checklist

---

## 1. Purpose

This document defines the browser smoke contract for PERUKAR's `www/` layer —
the HTML page and core.js runtime that a salon master uses in a real browser.
A browser smoke verification confirms that the minimum viable end-to-end path
is wired correctly: the page loads, the form exists, the calculate button fires,
the correct safety gates fire on the expected inputs, and no approved recipe is
produced from an unsafe scenario.

PERUKAR is safety-sensitive. A smoke failure (approved recipe rendered for an
unsafe input, or no recipe rendered for a valid safe input) indicates a
regression in the UI surface that must be resolved before the page is used in a
production salon environment.

---

## 2. Scope and technical approach

### 2.1 What this contract covers

This contract covers `www/index.html` and `www/core.js` as a unit:
- HTML structure audit: fields, button, output container, script reference
- Global function wiring: `calculateProtocol`, `buildWwwRenderState`, and
  defensive infrastructure functions/constants are accessible
- Functional smoke: representative safe, blocked, and manual-required inputs
  produce the correct output categories
- Persistence infrastructure: storage constants and `safeParseJson` are present;
  no active localStorage/sessionStorage calls exist in the current runtime

### 2.2 Implementation approach: Node-VM static smoke

No Playwright, Puppeteer, jsdom, or real browser automation is required.
The smoke tests run in Node.js using the same `vm.runInContext` pattern as the
existing test suite (`test_www_render_runtime.js`):

- `www/core.js` is loaded via `fs.readFileSync` and executed via
  `vm.runInContext`. All top-level declarations become VM context globals.
- `www/index.html` is loaded as a string and inspected with `String.includes`
  and `String.match` for structural assertions.
- `calculateProtocol()` is exercised via a fake `document.getElementById` mock
  (the `runCalculateProtocolWithValues` helper pattern from the existing suite).
- The VM context `document` starts as a forbidden proxy that throws on access,
  confirming that `core.js` does not access `document` at load time.

### 2.3 What this smoke does NOT cover

- Real browser rendering, CSS layout, or visual presentation.
- Console error capture from a live browser JavaScript engine.
- Network requests, service worker behavior, or caching.
- Multi-session user flows or real browser storage round-trips.
- Accessibility or localization completeness.

These are addressed in §14 (Manual Smoke Checklist).

---

## 3. Page load contract

1. `www/index.html` must exist and be non-empty.
2. The file must be a valid HTML document (DOCTYPE or html root element present).
3. `www/core.js` must exist and be parseable as JavaScript (`node --check`
   must pass).
4. `core.js` must not access `document` or any browser global at load time.
   The VM context test uses a forbidden-proxy `document` that throws if any
   property is accessed; the test must complete without triggering that proxy.
5. The page must not produce any JavaScript syntax error or `ReferenceError`
   when loaded in a Node VM context.

---

## 4. Form structure contract

1. `www/index.html` uses `<div class="block">` groupings rather than a `<form>`
   element. There is no `<form>` tag. Input values are read directly via
   `document.getElementById` on button click — not via form submission. This is
   intentional: `calculateProtocol()` is a pure in-page onclick function, not a
   form submit handler.
2. The following required fields must be present as DOM elements with the
   specified `id` attributes. These are the critical-gate fields whose absence
   or invalid value causes BLOCKED or MANUAL_REQUIRED output:

| Field ID | Gate | Consequence if missing/invalid |
|---|---|---|
| `allergy` | Allergy gate | `MANUAL_REQUIRED` (unknown) or `BLOCKED` (yes) |
| `scalp_sensitivity` | Scalp gate | `MANUAL_REQUIRED` / `BLOCKED` |
| `target_direction` | Direction gate | `BLOCKED` |
| `root_level` | Mandatory field | `BLOCKED` |
| `target_level` | Mandatory field | `BLOCKED` |
| `thickness` | Enum gate | `BLOCKED` |
| `density` | Enum gate | `BLOCKED` |
| `length` | Enum gate | `BLOCKED` |
| `history` | Mandatory field | `BLOCKED` |
| `base_type` | Mandatory field | `BLOCKED` |

3. Non-critical fields required for complete protocol output must also be
   present: `condition`, `root_condition`, `length_condition`, `porosity`,
   `elasticity`, `grey_percent`, `grey_type`, `root_length`, `length_level`,
   `ends_level`, `ends_condition`, `ends_history`, `ends_base_type`,
   `ends_base_type`.
4. All form fields are `<select>` elements.
5. Default selected values must be safe: `allergy` must default to an
   unknown/absent state (not `'no'`), `scalp_sensitivity` must default to
   `'unknown'` (not `'normal'`). These conservative defaults ensure that a user
   who has not made an explicit selection gets MANUAL_REQUIRED, not APPROVED.

---

## 5. Calculate button contract

1. `www/index.html` must contain a button element with an `onclick` attribute
   that calls `calculateProtocol()`.
2. No other button must call `calculateProtocol()` (only one trigger).
3. The button must not perform any form submission or page navigation. It is a
   pure in-page JavaScript action.
4. The button text must be visible and unambiguous (not hidden, not empty).
5. The button must be inside or adjacent to the main form element.

---

## 6. Output container contract

1. `www/index.html` must contain an element with `id="output"`.
2. This element must be a `<div>` (not an `<input>` or other form element).
3. The `#output` div must be empty on page load — no pre-rendered content, no
   stored recipe, no default HTML.
4. `www/index.html` must not call `localStorage.getItem`, `sessionStorage.getItem`,
   or any equivalent to pre-fill `#output` from storage.
5. After `calculateProtocol()` fires, `#output.innerHTML` is written by
   `renderStateToHtml()` and `core.js`. No other script may write to `#output`.

---

## 7. Script loading and globals contract

1. `www/index.html` must load `core.js` via `<script src="core.js"></script>`
   (relative path, same directory as `index.html`).
2. No other external scripts are loaded (no CDN, no analytics, no third-party).
3. After `core.js` is evaluated, the following must be available as globals in
   the browser window scope:
   - `calculateProtocol` — function; the main entry point
   - `buildWwwRenderState` — function; fail-closed render state builder
   - `PerucarWwwRenderV1` — frozen object; render engine
   - `safeParseJson` — function; defensive JSON parser
   - `PERUKAR_STORAGE_VERSION` — number constant (currently `1`)
   - `PERUKAR_PERSIST_INPUT_KEY` — string constant (`'perukar_input_v1'`)
   - `PERUKAR_LEGACY_RESULT_KEYS` — non-empty array
4. None of these functions may throw during load (before `calculateProtocol()`
   is explicitly called by a user action).

---

## 8. APPROVED smoke path contract

The APPROVED path is the positive case: a technically valid input with no active
safety gate firing must produce an approved recipe.

**Default smoke input** (canonical safe scenario):

```
history: 'натуральні', base_type: 'Натуральна', condition: 'здоровые'
root_level: '8', length_level: '8', target_level: '9', target_direction: '1'
thickness: 'средние', density: 'средние', length: 'средние'
allergy: 'no', scalp_sensitivity: 'normal', grey_percent: '0'
```

**Required APPROVED smoke assertions:**

1. `output.innerHTML` must include the string `approved-recipe`.
2. `output.innerHTML` must not include `notForMixing`.
3. `output.innerHTML` must not be empty.
4. `output.innerHTML` must not include `BLOCKED`.
5. `output.innerHTML` must include `APPROVED`.

**What the APPROVED smoke does NOT assert:**

- Exact formula values (those are covered by `test_www_business_scenarios.js`).
- Exact mass gram values (covered by `test_www_mass_model.js`).
- Exact timing values.
- Specific dye or oxidizer text.

The smoke only confirms that the approved-recipe gate opened correctly for the
expected input category.

---

## 9. BLOCKED smoke path contract

Each of the following inputs must produce output with **no `approved-recipe`**
and with a visible blocked indicator.

| Smoke scenario | Override | Expected |
|---|---|---|
| Allergy confirmed | `allergy: 'yes'` | No `approved-recipe`; BLOCKED label visible |
| Scalp irritated | `scalp_sensitivity: 'irritated'` | No `approved-recipe` |
| No target direction | `target_direction: ''` | No `approved-recipe` |
| Unknown thickness | `thickness: 'UNKNOWN_XYZ'` | No `approved-recipe` |
| Empty length | `length: ''` | No `approved-recipe` |
| Empty density | `density: ''` | No `approved-recipe` |

**Required BLOCKED smoke assertions for each scenario:**

1. `output.innerHTML` must not include `approved-recipe`.
2. `output.innerHTML` must not be empty (must show a blocked/error state).
3. `output.innerHTML` must not include `finalFormula`.

---

## 10. MANUAL_REQUIRED smoke path contract

Each of the following inputs must produce output with **no `approved-recipe`**
and with a visible manual-required indicator.

| Smoke scenario | Override | Expected |
|---|---|---|
| Allergy unknown | `allergy: 'unknown'` | No `approved-recipe`; MANUAL_REQUIRED label |
| Allergy empty | `allergy: ''` | No `approved-recipe` |
| Scalp sensitive | `scalp_sensitivity: 'sensitive'` | No `approved-recipe` |
| Scalp unknown | `scalp_sensitivity: 'unknown'` | No `approved-recipe` |

**Required MANUAL_REQUIRED smoke assertions:**

1. `output.innerHTML` must not include `approved-recipe`.
2. `output.innerHTML` must not be empty.
3. `output.innerHTML` must not include `finalFormula`.
4. For `allergy: 'unknown'`: output must include `MANUAL_REQUIRED` or the
   Ukrainian manual heading text `ручне`.

---

## 11. Persistence interaction contract

1. `www/index.html` must not reference `localStorage` or `sessionStorage` in
   any form (no get/set/remove/clear calls).
2. `www/core.js` must not call `localStorage.` or `sessionStorage.` methods.
   The defensive infrastructure constants and `safeParseJson` are present in
   `core.js` for future use only; they must not be wired to active storage calls.
3. `safeParseJson` must return `null` for: bad JSON strings, empty string,
   null, undefined, and non-string values.
4. `safeParseJson` must parse valid JSON strings correctly.
5. `PERUKAR_STORAGE_VERSION` must equal `1`.
6. `PERUKAR_PERSIST_INPUT_KEY` must equal `'perukar_input_v1'`.
7. `PERUKAR_LEGACY_RESULT_KEYS` must be a non-empty array.
8. The `#output` div in `index.html` must not have any default inner content
   that could be confused with a pre-loaded result.

---

## 12. Console/runtime error policy

In a real browser, the smoke verification must observe **zero console errors**
during:
- Page load (before any user interaction)
- A single click of the calculate button with default form values
- A single click of the calculate button after setting `allergy = 'yes'`

Console warnings are acceptable; errors are not. A console error during load
indicates that `core.js` throws an uncaught exception or accesses an undefined
browser API.

Because real browser console capture is not available in the Node-VM smoke
tests, this rule is enforced manually per §14.

**Runtime exception policy:**

Any exception inside `calculateProtocol()` must be caught by the top-level
try/catch and render a `FATAL_ERROR` display — it must never produce a blank
page, a partial recipe, or an approved-recipe block.

---

## 13. Required Node-VM smoke tests

The following tests are enforced in `test_www_browser_smoke.js`:

| Test ID | Category | What it verifies |
|---|---|---|
| `SMOKE-HTML-INDEX-EXISTS` | HTML structure | index.html is non-empty |
| `SMOKE-HTML-FORM-EXISTS` | HTML structure | `<form` element is present |
| `SMOKE-HTML-BUTTON-EXISTS` | HTML structure | button calls `calculateProtocol()` |
| `SMOKE-HTML-OUTPUT-DIV` | HTML structure | `id="output"` element is present |
| `SMOKE-HTML-SCRIPT-CORE` | HTML structure | `src="core.js"` script tag present |
| `SMOKE-HTML-NO-PERSISTENCE` | HTML structure | no `localStorage`/`sessionStorage` in index.html |
| `SMOKE-HTML-REQUIRED-FIELDS` | HTML structure | all 10 critical-gate field IDs present |
| `SMOKE-GLOBALS-CALCULATE-PROTOCOL` | Globals wiring | `calculateProtocol` is a function |
| `SMOKE-GLOBALS-BUILD-RENDER-STATE` | Globals wiring | `buildWwwRenderState` is a function |
| `SMOKE-GLOBALS-SAFE-PARSE-JSON` | Globals wiring | `safeParseJson` is a function |
| `SMOKE-GLOBALS-STORAGE-VERSION` | Globals wiring | `PERUKAR_STORAGE_VERSION === 1` |
| `SMOKE-GLOBALS-PERSIST-INPUT-KEY` | Globals wiring | `PERUKAR_PERSIST_INPUT_KEY === 'perukar_input_v1'` |
| `SMOKE-GLOBALS-LEGACY-RESULT-KEYS` | Globals wiring | `PERUKAR_LEGACY_RESULT_KEYS` is non-empty array |
| `SMOKE-APPROVED-VALID-SCENARIO` | APPROVED path | default safe values → `approved-recipe` in output |
| `SMOKE-APPROVED-NOT-BLOCKED` | APPROVED path | default safe values → no `BLOCKED` in output |
| `SMOKE-APPROVED-NO-NOT-FOR-MIXING` | APPROVED path | approved output has no `notForMixing` |
| `SMOKE-BLOCKED-ALLERGY-YES` | BLOCKED path | `allergy: 'yes'` → no `approved-recipe` |
| `SMOKE-BLOCKED-SCALP-IRRITATED` | BLOCKED path | `scalp_sensitivity: 'irritated'` → no `approved-recipe` |
| `SMOKE-BLOCKED-MISSING-TARGET-DIRECTION` | BLOCKED path | `target_direction: ''` → no `approved-recipe` |
| `SMOKE-BLOCKED-UNKNOWN-THICKNESS` | BLOCKED path | unknown `thickness` enum → no `approved-recipe` |
| `SMOKE-BLOCKED-EMPTY-LENGTH` | BLOCKED path | `length: ''` → no `approved-recipe` |
| `SMOKE-BLOCKED-EMPTY-DENSITY` | BLOCKED path | `density: ''` → no `approved-recipe` |
| `SMOKE-MANUAL-ALLERGY-UNKNOWN` | MANUAL path | `allergy: 'unknown'` → MANUAL_REQUIRED, no `approved-recipe` |
| `SMOKE-MANUAL-ALLERGY-EMPTY` | MANUAL path | `allergy: ''` → no `approved-recipe` |
| `SMOKE-MANUAL-SCALP-SENSITIVE` | MANUAL path | `scalp_sensitivity: 'sensitive'` → no `approved-recipe` |
| `SMOKE-MANUAL-SCALP-UNKNOWN` | MANUAL path | `scalp_sensitivity: 'unknown'` → no `approved-recipe` |
| `SMOKE-PERSIST-NO-STORAGE-IN-CORE` | Persistence | no `localStorage.`/`sessionStorage.` in core.js |
| `SMOKE-PERSIST-NO-STORAGE-IN-INDEX` | Persistence | no `localStorage` in index.html |
| `SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED` | Persistence | `safeParseJson` returns null for bad/empty/null |
| `SMOKE-PERSIST-SAFEJSON-VALID` | Persistence | `safeParseJson` parses valid JSON correctly |
| `SMOKE-SAFETY-NO-APPROVED-IN-UNSAFE` | Safety invariant | BLOCKED and MANUAL states never contain `approved-recipe` |
| `SMOKE-SAFETY-APPROVED-REQUIRES-ALL-GATES` | Safety invariant | removing each critical gate field prevents `approved-recipe` |

---

## 14. Manual smoke checklist (real browser)

Run these steps in a real Chromium-based browser before any production deployment.
Open DevTools console before starting.

1. **Open DevTools** — Console tab, clear existing messages.
2. **Open `www/index.html`** directly (file:// or local server). Verify:
   - [ ] Page loads without console errors.
   - [ ] Form is visible with all select fields.
   - [ ] The calculate button is visible and labeled correctly.
   - [ ] `#output` div is empty.
3. **Click calculate with default form values**. Verify:
   - [ ] No console errors.
   - [ ] `#output` shows a protocol result (not blank).
   - [ ] The result contains `APPROVED` and a recipe block with `approved-recipe`.
   - [ ] No `BLOCKED` or `MANUAL_REQUIRED` text visible.
4. **Set `allergy` to `"Так (є алергія / Hna)"` (yes), click calculate**. Verify:
   - [ ] No console errors.
   - [ ] `#output` shows `BLOCKED` or a blocker message.
   - [ ] No `approved-recipe` class visible in the output HTML.
5. **Set `allergy` to unknown/empty, click calculate**. Verify:
   - [ ] `#output` shows `MANUAL_REQUIRED` or manual heading.
   - [ ] No `approved-recipe` class visible.
6. **Open DevTools → Application → Local Storage**. Verify:
   - [ ] No keys are written to localStorage by any user interaction.
   - [ ] No keys are written to sessionStorage.
7. **Reload the page**. Verify:
   - [ ] `#output` is empty after reload (no pre-rendered result persisted).
   - [ ] No console errors on reload.
8. **Open DevTools → Sources, set a breakpoint at `calculateProtocol()`**. Trigger
   calculation. Verify the function fires once per button click, not on load.

---

## 15. Final invariant summary

```
Browser smoke invariants:

  1. Page loads without console errors.
  2. calculateProtocol() fires only on explicit user button click — never on load.
  3. #output is empty on page load.
  4. No localStorage or sessionStorage is written on any user interaction.
  5. Default safe inputs (allergy=no, scalp=normal, valid enum fields,
     valid levels, valid target_direction) → approved-recipe in output.
  6. Any safety-gate violation (allergy=yes, scalp=irritated, unknown enums,
     empty critical fields, missing target_direction) → no approved-recipe.
  7. Allergy or scalp unknown → MANUAL_REQUIRED, no approved-recipe.
  8. safeParseJson, PERUKAR_STORAGE_VERSION, PERUKAR_PERSIST_INPUT_KEY,
     PERUKAR_LEGACY_RESULT_KEYS are all accessible as globals from core.js.
  9. core.js does not access document at load time.
  10. No external scripts are loaded by index.html.

Current runtime state (HEAD 511f97b):
  - No localStorage or sessionStorage used anywhere in www/index.html or www/core.js.
  - calculateProtocol() is called only via explicit onclick button.
  - All safety gates confirmed working via Node-VM smoke tests.
```
