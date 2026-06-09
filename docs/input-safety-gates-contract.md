# Input Safety Gates Contract — PERUKAR

Single source of truth for the production input validation gates in `www/core.js`.
See also: [docs/input-model-contract.md](input-model-contract.md) — full normalization rules, field table, unknown/missing-value behavior, and migration checklist.
See also: [docs/known-limitations-contract.md](known-limitations-contract.md) — powder surcharge, endsMass, endsRec, 3-zone, brand scaffold limitations.
See also: [docs/production-readiness-index.md](production-readiness-index.md) — full domain readiness matrix: production status, active vs diagnostic, known limitations summary, release checklist.
PERUKAR is a safety-sensitive color-logic control system — not a recipe hint tool.
An executable salon recipe produced from incomplete or unsafe input is a real-world
risk. This contract must not be weakened.

## Final audit status

Input safety gate series: **PASS**. Full test matrix green on all four test suites.

## Input safety gate commit chain

- `9701a4f` Add allergy production gate
- `cc9a030` Add scalp sensitivity production gate
- `1ef1fd5` Require target direction for production gate
- `2aa62fa` Add length density thickness production gate
- `f60665b` Reject unknown hair mass enum values
- `5bd506a` Sync roadmap and project state (HEAD before boundary fuzz task)
- *(pending)* Add input boundary fuzz coverage + target_direction enum gate

## System identity

PERUKAR is a safety and control system. It enforces hard gates before any
executable color recipe can reach production output. Missing, unknown, or unsafe
input must never silently fall through to an approved recipe, executable formula,
exact grams, or production timing.

## Required production fields

The following fields must be present and valid before production readiness can be
reached. A missing or empty required field must block production readiness.

| Field              | Role                                      |
|--------------------|-------------------------------------------|
| `root_level`       | Current root color level                  |
| `length_level`     | Current length color level                |
| `target_level`     | Target color level                        |
| `target_direction` | Direction of color change (required gate) |
| `history`          | Chemical history of the hair              |
| `base_type`        | Color base classification                 |
| `condition`        | Hair condition per zone                   |
| `allergy`          | Client allergy flag (required gate)       |
| `scalp_sensitivity`| Scalp sensitivity flag (required gate)    |
| `length`           | Hair length enum (required gate)          |
| `density`          | Hair density enum (required gate)         |
| `thickness`        | Hair thickness enum (required gate)       |

## Missing critical field behavior

A missing or empty required production field must:

- Block production readiness (`productionReady !== true`)
- Produce no `approved-recipe`
- Produce no executable `finalFormula`
- Produce no exact mixing grams
- Produce no production timing

There must be no silent fallback, no default value substitution, and no code path
that allows a missing field to reach an `APPROVED + productionReady=true` state.

## Allergy gate

| `allergy` value            | Behavior        |
|----------------------------|-----------------|
| `no`                       | May continue    |
| `unknown` / empty / unrecognized | `MANUAL_REQUIRED` |
| `yes`                      | `BLOCKED`       |

## Scalp sensitivity gate

| `scalp_sensitivity` value        | Behavior        |
|----------------------------------|-----------------|
| `normal`                         | May continue    |
| `unknown` / `sensitive` / unrecognized | `MANUAL_REQUIRED` |
| `irritated`                      | `BLOCKED`       |
| missing / empty                  | `BLOCKED`       |

## Target direction gate

| `target_direction` value               | Behavior   |
|----------------------------------------|------------|
| missing / empty                        | `BLOCKED`  |
| present and in allowed set (see below) | May continue |
| present but NOT in allowed set         | `BLOCKED`  |

A production recipe requires an explicit target direction. No direction means no
executable recipe. Any non-empty value that is not in the allowed set is treated as
unrecognized critical input and produces `BLOCKED` — not `MANUAL_REQUIRED`, not a
silent default.

### Allowed target_direction values (production enum)

`'0'`, `'1'`, `'11'`, `'16'`, `'2'`, `'3'`, `'32'`, `'4'`, `'5'`, `'6'`, `'7'`, `'81'`, `'89'`

These correspond to tonal directions defined in `www/index.html`. Any value outside
this set (including free-text, emoji, or arbitrary strings) must produce `BLOCKED`.

**Confirmed fail-open defect fixed (boundary fuzz task):** Before this fix,
`target_direction='invalid_xyz'` produced `approved-recipe` output. The missing-field
check only tested for empty string, so any non-empty garbage string passed through
and produced an APPROVED recipe with a nonsensical color code (e.g., `9.invalid_xyz`).
The enum gate now guards this.

## Hair mass input gates (length / density / thickness)

All three fields are required. Missing, empty, or unrecognized values must block
production readiness. No silent fallback may produce an executable recipe.

### Allowed enum values

**length:**
- `короткие`
- `средние`
- `длинные`

**density:**
- `редкие`
- `средние`
- `густые`

**thickness:**
- `тонкие`
- `средние`
- `толстые`

Any value outside these allowed sets must result in `BLOCKED` — not `MANUAL_REQUIRED`,
not a default substitution, and not a silent pass-through.

### Parameter roles (mass vs timing)

Beyond gating, the three fields have distinct production roles, locked by
`test_www_hair_parameter_contract.js`:

- `density` — mass multiplier (0.7 / 1.0 / 1.5); does NOT affect timing.
- `length` — base mass (30 / 60 / 120 g); does NOT affect timing.
- `thickness` — timing modifier / diagnostic only; does NOT affect mass.

### Absent parameters: structure / curl

`structure` and `curl` are NOT part of the current contract: not gathered, not
normalized, not read by `calculateProtocol()`, not gated, not rendered. This
absence is tested as current implementation reality (see the contract test
below, group 8). Future implementation requires an explicit product/design
contract and dedicated tests first, and does not by itself equal full
salon-ready logic.

## Structured safety markers (not display text)

Powder / Special Blond / toning / grey-`.00` / high-oxidizer gates read **structured
recipe metadata** (`recipe.meta`, set by `buildRecipeMeta` / `withMeta` at the
formula-assembly branch), not user-facing display strings:

- `meta.isPowder` / `isSpecialBlond` / `isToning` / `usesDoubleNaturalBase` —
  gate the brand-sensitive MANUAL_REQUIRED decision and the powder mass surcharge.
- `meta.oxidizerPercent` (numeric) — drives the high-oxidizer (≥9%) gate and the
  grey `.00` base-validity check (permanent + oxidizer ∈ {6,9,12}); display labels
  are fallback only.
- Display labels (`recipe.process` / `recipe.dye` / `recipe.ox`) are **not**
  safety-critical inputs: renaming/localizing a label cannot silently disable a gate.
- A legacy text-marker check remains only as a fallback when `meta` is absent;
  the current builder always attaches `meta`.
- `meta` is internal: it is never rendered to the UI and is never set from user input.
- Advisory `calcMixtone` (tonal corrector) and `getBaseProcessTiming` (process
  base minutes) are ALSO routed to `recipe.meta` (powder/SB/toning/permanent),
  with display text kept only as fallback. Renaming a process label no longer
  changes the corrector neutralisation or the base timing for internally-built
  recipes. Locked by `test_www_structured_safety_flags.js` groups 11–13.

Locked by `test_www_structured_safety_flags.js` (10 groups).

## Relationship to render safety contract

Input gates and render gates are complementary layers. Even if input gate logic were
to fail, the render layer (`docs/ui-render-safety-contract.md`) enforces:

```
status === 'APPROVED' && productionReady === true
```

as the final condition before any executable output is rendered. Both layers must
remain independently enforced.

## Input coercion behavior (documented, not a gate failure)

The following coercions are **documented expected behavior**, not fail-open defects.
They produce valid parsed values and may result in APPROVED output for a clean fixture.
Do NOT add blocking gates for these — they are valid paths.

| Raw input | `parseInt()` result | Level | Notes |
|-----------|-------------------|-------|-------|
| `'7,5'`   | 7                 | Valid | Decimal comma; parseInt stops at comma |
| `'7.5'`   | 7                 | Valid | Decimal dot; parseInt stops at dot |
| `' 7 '`   | 7                 | Valid | Whitespace trimmed by parseInt |
| `'07'`    | 7                 | Valid | Leading zero; base-10 parse |
| `['7']`   | 7                 | Valid | Array coerces to `'7'` via String |

For enum fields (density, thickness, length, target_direction), `String([])` = `''`
(empty, treated as missing → BLOCKED) and `String({})` = `'[object Object]'`
(non-empty, treated as unrecognized → BLOCKED). These are also expected behaviors.

## What must never be produced for unsafe input states

- `approved-recipe` (recipe block / CSS class)
- executable `finalFormula`
- ready-to-mix wording
- exact mixing grams
- production timing

This applies to any state that is `BLOCKED`, `MANUAL_REQUIRED`, diagnostic-only,
or missing required fields.

## Tests protecting this contract

- `test_www_input_boundary_fuzz.js` — **boundary and fuzz coverage** (added in
  boundary fuzz task). Seven groups: numeric level boundaries, enum boundaries,
  localized input, object/array injection, prototype-ish key pollution, render
  NaN/Infinity, canonical clean control. Includes regression for target_direction
  enum gate. Must be run as part of the full test matrix.
- `test_www_render_runtime.js` — render gates, production readiness, input gate
  behavior at the render layer.
- `test_www_business_scenarios.js` — end-to-end `calculateProtocol` scenarios
  covering allergy, scalp, direction, condition, history, and missing-data paths.
- `test_www_mass_model.js` — mass model gate: length/density/thickness required,
  unknown enum values blocked, NaN-free paths.
- `test_www_mapping.js` — render-state mapping.
- `test_www_hair_parameter_contract.js` — **hair parameter contract** (density/
  length mass, thickness timing, structure/curl absence). Integration-level, 10
  reported groups. Must be run as part of the full test matrix.
- `test_www_structured_safety_flags.js` — **structured safety flags** (powder/SB/
  toning/grey/high-ox gates driven by `recipe.meta`, robust to display-label
  renames; meta not rendered; user cannot inject meta). 10 groups.

## Do not change without tests

Any future change to these gates must include regression tests proving that unsafe
states cannot produce:

- `APPROVED + productionReady=true`
- `approved-recipe`
- executable `finalFormula`
- exact grams
- production timing

The full test matrix must pass before any such change is committed:

```
node --check www/core.js
node --check test_www_input_boundary_fuzz.js
node --check test_www_business_scenarios.js
node --check test_www_mass_model.js
node --check test_www_mapping.js
node --check test_www_render_runtime.js
node test_www_input_boundary_fuzz.js
node test_www_business_scenarios.js
node test_www_mass_model.js
node test_www_mapping.js
node test_www_render_runtime.js
git diff --check
```
