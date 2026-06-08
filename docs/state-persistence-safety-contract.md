# State Persistence Safety Contract — PERUKAR

**Date:** 2026-06-08
**HEAD at creation:** a187cee Harden runtime fail-safe behavior
**Status:** ACTIVE

See also:
- [docs/runtime-failsafe-contract.md](runtime-failsafe-contract.md) — runtime fail-safe rules: NaN/Infinity, malformed input, exception policy
- [docs/ui-render-safety-contract.md](ui-render-safety-contract.md) — render status taxonomy and HTML safety rules
- [docs/input-safety-gates-contract.md](input-safety-gates-contract.md) — input validation gates
- [docs/input-model-contract.md](input-model-contract.md) — normalization rules
- [docs/known-limitations-contract.md](known-limitations-contract.md) — production boundary limitations
- [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix: production status, active vs diagnostic, known limitations summary, release checklist

---

## 1. Purpose

This document defines safety rules for any current or future browser-side state
persistence in PERUKAR (localStorage, sessionStorage, IndexedDB, cookies, or any
equivalent mechanism). PERUKAR is safety-sensitive: a stale, malformed, or partial
saved state silently treated as authoritative can produce an APPROVED executable
recipe for an input the user did not intend — a real-world salon risk.

**Current state as of HEAD a187cee:** PERUKAR has no persistence layer. Neither
`www/index.html` nor `www/core.js` reads from or writes to `localStorage`,
`sessionStorage`, or any other browser storage. All form inputs use static HTML
defaults and are read fresh from the DOM on every `calculateProtocol()` call. The
output div `#output` is written on each call and is not persisted.

This contract defines rules that must govern any future persistence implementation
and documents the current no-persistence invariant.

---

## 2. Persisted state is untrusted input

Any value loaded from `localStorage`, `sessionStorage`, or any other browser
storage is **untrusted input** by definition:

- It was written by a prior browser session, possibly under a different code version.
- It may have been modified by the user, by a browser extension, or by a crash.
- Its schema may be outdated relative to the current runtime.
- Its values may be invalid, partial, NaN, null, or unknown enum values.

**Persisted state must never be treated as verified, validated, or authoritative.**
It must be revalidated through the current input gates and safety pipeline before it
can influence any rendered output.

---

## 3. Allowed persisted data

Only raw user input field values may be persisted — the same data that a user types
or selects in the form. These values are inputs to `calculateProtocol()`, not outputs
from it.

Allowed persisted fields (for future use only):

| Field | Notes |
|---|---|
| `history` | String — must be revalidated on restore |
| `condition` | String — must be normalized and revalidated |
| `root_condition` | String — must be revalidated |
| `length_condition` | String — must be revalidated |
| `porosity` | String — must be revalidated |
| `elasticity` | String — must be revalidated |
| `thickness` | Enum — must be in allowed set or BLOCKED |
| `density` | Enum — must be in allowed set or BLOCKED |
| `length` | Enum — must be in allowed set or BLOCKED |
| `grey_percent` | Integer — must be valid integer or ignored |
| `grey_type` | String — must be revalidated |
| `root_level` | Integer 1-10 — must be revalidated |
| `length_level` | Integer 1-10 — must be revalidated |
| `target_level` | Integer 1-12 — must be revalidated |
| `target_direction` | String — empty/missing → BLOCKED |
| `allergy` | Enum — unknown/missing → MANUAL_REQUIRED |
| `scalp_sensitivity` | Enum — unknown/missing → MANUAL_REQUIRED |
| `base_type` | String — must be revalidated |

---

## 4. Forbidden persisted data

The following must **never** be persisted as authoritative source of truth:

| Forbidden item | Why |
|---|---|
| `status` field (`'APPROVED'`, etc.) | Stale status is not authoritative |
| `productionReady: true` | Not valid without fresh recalculation |
| `finalFormula` | Recipe text must come from current calculation |
| `dye`, `ox`, `ratio` (recipe fields) | Same — must come from current calculation |
| `dyeMass`, `oxidizerMass`, exact grams | Mass fields must come from current calculation |
| `timingInfo`, `totalMinutes` | Timing must come from current calculation |
| `massModel` (result) | Must come from current calculation |
| Rendered recipe HTML | HTML output is a display artifact, not data |
| `approved-recipe` CSS class or block | Display artifact |
| Any entire `calculateProtocol()` result object | The result is not safe to restore |

---

## 5. Hydration rules

When restoring persisted input to form fields before recalculation:

1. **Parse with `safeParseJson`** — never use bare `JSON.parse`. Malformed JSON must
   return `null`, never throw.
2. **Check schema version** — if a `_version` field is present and does not match
   the current `PERUKAR_STORAGE_VERSION`, discard the payload and use form defaults.
3. **Restore only input fields** — populate only the fields listed in §3. Never
   restore a `status`, `productionReady`, or any result field.
4. **Allow missing fields** — if a field is absent from the persisted object, use
   the form's static default. Never use `null`, `undefined`, or `NaN` as a form
   field value.
5. **Do not call `calculateProtocol()` automatically** — restored inputs must wait
   for explicit user action. Never auto-trigger a protocol calculation on page load
   from persisted state.
6. **Do not render anything on hydration** — the `#output` div must remain empty
   after hydration. No result is rendered until the user triggers recalculation.

---

## 6. Recalculation rules

1. **Every render requires fresh recalculation** — `calculateProtocol()` must be
   called with the current DOM values on every render. Persisted results are not
   accepted as input to `renderStateToHtml()`.
2. **Persisted result objects are ignored** — even if a prior `status: 'APPROVED'`
   object is loaded from storage, it must be discarded. It cannot be passed to
   `renderStateToHtml()` as a valid approved state.
3. **Recalculation passes through all current gates** — allergy gate, scalp gate,
   target direction gate, length/density/thickness gate, brand gate, mass model
   fail-safe, NaN guards. No persisted state bypasses these.
4. **`buildWwwRenderState` is not a restore function** — it accepts a fresh
   `runtime` object from `calculateProtocol()` and applies the fail-closed default
   (`status || 'BLOCKED'`). It must not be called with a raw persisted object.

---

## 7. Malformed JSON policy

1. **`safeParseJson(value)` is the only safe entry point** for parsing any
   string from browser storage. It wraps `JSON.parse` in a try/catch and returns
   `null` on any error.
2. **`null` result → use form defaults** — when `safeParseJson` returns `null`,
   treat it as if no persisted state existed. Do not crash. Do not render output.
3. **Never expose parse error text** — JSON.parse error messages must not appear in
   any UI output.
4. **Never throw from storage read code** — any storage access must be wrapped in
   a try/catch; a missing key, quota error, or SecurityError must fail silently with
   form defaults.
5. **Empty string → null** — `safeParseJson('')` returns `null` (not an empty
   object).

---

## 8. Legacy payload policy

A "legacy payload" is any persisted object written by a prior version of the app.

1. **Version check first** — if the persisted object has `_version !== PERUKAR_STORAGE_VERSION`,
   discard the entire object and start with form defaults.
2. **Unknown top-level keys are ignored** — extra fields not in the allowed list (§3)
   must be silently discarded, not mapped to any input.
3. **Never assume known-good defaults for unknown values** — a field that existed in
   a prior version but is no longer valid must not be silently coerced to a current
   valid value. If the field is a critical gated field, treat it as missing → BLOCKED
   or MANUAL_REQUIRED (depending on the gate).
4. **Legacy result keys must be deleted** — any of `perukar_result`, `perukar_output`,
   `perukar_approved`, `perukar_html` found in storage must be deleted on load, not
   read.

---

## 9. Unknown critical fields policy

For the critical gated fields (`allergy`, `scalp_sensitivity`, `thickness`, `density`,
`length`, `target_direction`):

| Field | Unknown/missing value from storage | Required outcome |
|---|---|---|
| `allergy` | Not `'no'`, `'yes'` — any other string or absent | `MANUAL_REQUIRED` |
| `scalp_sensitivity` | Not `'normal'`, `'sensitive'`, `'irritated'` — any other or absent | `MANUAL_REQUIRED` or `BLOCKED` per gate |
| `thickness` | Not in `{тонкие, средние, толстые}` | `BLOCKED` |
| `density` | Not in `{редкие, средние, густые}` | `BLOCKED` |
| `length` | Not in `{короткие, средние, длинные}` | `BLOCKED` |
| `target_direction` | Empty, absent, or unrecognized | `BLOCKED` |

The rule: **unknown critical field from storage → same behavior as unknown input in fresh form**. The gate behavior is not relaxed for persisted values.

---

## 10. Stale APPROVED result policy

1. **Stale APPROVED is not APPROVED** — a previously-computed `status: 'APPROVED'`
   stored in `localStorage` does not grant APPROVED status in the current session.
2. **No `renderStateToHtml` without fresh `calculateProtocol`** — the render pipeline
   must only run on the output of a fresh `calculateProtocol()` call with current
   DOM values. A stale result object must never be passed to `renderStateToHtml`.
3. **`productionReady: true` from storage is not valid** — this field is set only by
   `buildWwwRenderState` as part of a fresh calculation pipeline. It cannot be
   imported from storage.
4. **`approved-recipe` from stale HTML is not valid** — if stored HTML contains an
   `approved-recipe` block, that HTML must not be written to `#output` on load.
   The `#output` div must start empty on every page load.
5. **Time-based expiry is not a substitute for recalculation** — even a freshly-saved
   APPROVED result from 5 seconds ago is not safe to restore. The input may have
   changed in the DOM.

---

## 11. Render/output persistence policy

1. **Rendered HTML must not be persisted as source of truth** — `#output.innerHTML`
   is a display artifact. It must not be saved to `localStorage` and restored on load.
2. **No output pre-rendering from storage** — the `#output` div must be empty on
   page load. Pre-rendering from stored HTML is forbidden.
3. **Result objects from `calculateProtocol()` must not be persisted** — the entire
   object (or any of its fields) must not be written to storage for later restore.
4. **If result HTML is accidentally persisted** — on detection (e.g. by finding a
   known legacy key), it must be deleted without being rendered.

---

## 12. Clear/reset behavior

When a reset/clear action is implemented:

1. **Clear all persisted input keys** — `PERUKAR_PERSIST_INPUT_KEY` and any other
   input keys must be removed from storage.
2. **Clear all legacy result keys** — `PERUKAR_LEGACY_RESULT_KEYS` must be removed
   from storage.
3. **Clear `#output` div** — set `innerHTML = ''`.
4. **Reset form fields to static HTML defaults** — not to any stored value.
5. **Do not trigger recalculation on reset** — reset leaves the form at its default
   state; the user initiates recalculation explicitly.

---

## 13. Required regression tests

The following tests must pass at all times. They are in `test_www_render_runtime.js`:

| Test ID | What it verifies |
|---|---|
| `PERSIST-SAFEJSON-MALFORMED` | `safeParseJson` returns `null` for bad JSON, empty string, null, undefined, number |
| `PERSIST-SAFEJSON-VALID` | `safeParseJson` returns parsed object/array/primitive for valid JSON |
| `PERSIST-STALE-APPROVED-NO-RENDER` | A stale APPROVED-like object cannot produce `approved-recipe` via `buildWwwRenderState` alone |
| `PERSIST-PARTIAL-INPUT-BLOCKED` | Partial input from hypothetical storage (empty critical fields) produces BLOCKED |
| `PERSIST-UNKNOWN-ENUM-BLOCKED` | Unknown `thickness`/`density`/`length` from storage produces BLOCKED |
| `PERSIST-NAN-FIELD-BLOCKED` | NaN in numeric input field from storage produces BLOCKED or safe state |
| `PERSIST-NO-STORAGE-IN-RUNTIME` | Documents that no localStorage/sessionStorage is accessed in the current runtime |

Additionally covered by existing tests (not persistence-specific but relevant):
- `FAILSAFE-STATUS-DEFAULT-BLOCKED` — missing status → BLOCKED (applies to stale object)
- `FAILSAFE-STATUS-NULL-BLOCKED` — null status → BLOCKED
- `FAILSAFE-NAN-MASS-APPROVED-SANITIZE` — NaN in mass fields is hidden
- `ALLERGY-PRODUCTION-GATE`, `SCALP-SENSITIVITY-GATE` — unknown values produce MANUAL or BLOCKED

---

## 14. Migration checklist

Before any persistence layer is added to PERUKAR:

- [ ] Schema version constant (`PERUKAR_STORAGE_VERSION`) is defined and tested
- [ ] `safeParseJson` is used for all storage reads
- [ ] Only fields from the allowed list (§3) are saved
- [ ] Persist key constants (`PERUKAR_PERSIST_INPUT_KEY`) are defined
- [ ] Legacy result keys are defined in `PERUKAR_LEGACY_RESULT_KEYS` for cleanup
- [ ] Legacy result keys are deleted on every page load (even before reading input)
- [ ] Hydration does not trigger `calculateProtocol()` automatically
- [ ] `#output` div is empty on page load (no stored HTML)
- [ ] Unknown critical field values fail-closed per §9
- [ ] Version mismatch discards entire payload
- [ ] Full test matrix passes: `node test_www_render_runtime.js`, `node test_www_business_scenarios.js`, `node test_www_mass_model.js`, `node test_www_mapping.js`
- [ ] `git diff --check` passes
- [ ] Commit message explicitly states persistence is being added
- [ ] `docs/state-persistence-safety-contract.md` is updated to reflect new state

---

## 15. Final invariant summary

```
Persisted state is untrusted input.

Safe persistence invariants:
  1. Only raw input field values may be persisted — never results.
  2. Persisted state must be revalidated through current calculateProtocol() gates.
  3. safeParseJson() is the only entry point for storage reads.
  4. Malformed JSON → null → form defaults (never crash, never render).
  5. Unknown critical field from storage → BLOCKED or MANUAL_REQUIRED (never APPROVED).
  6. Stale APPROVED result from storage → discarded (never rendered as authority).
  7. Rendered recipe HTML from storage → discarded (never written to #output).
  8. #output div starts empty on every page load.
  9. Legacy result keys are deleted on load, not read.
  10. Reset removes all persisted input and result keys.

Current runtime state (HEAD a187cee):
  - No localStorage or sessionStorage used anywhere in www/index.html or www/core.js.
  - All inputs are read fresh from DOM on every calculateProtocol() call.
  - All output is written to #output on each call and not persisted.
  - safeParseJson() helper exists in www/core.js as defensive infrastructure.
  - Storage key constants exist in www/core.js as defensive infrastructure.
```
