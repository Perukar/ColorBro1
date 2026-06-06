# Input Safety Gates Contract — PERUKAR

Single source of truth for the production input validation gates in `www/core.js`.
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

| `target_direction` value | Behavior   |
|--------------------------|------------|
| missing / empty          | `BLOCKED`  |
| present and valid        | May continue |

A production recipe requires an explicit target direction. No direction means no
executable recipe.

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

## Relationship to render safety contract

Input gates and render gates are complementary layers. Even if input gate logic were
to fail, the render layer (`docs/ui-render-safety-contract.md`) enforces:

```
status === 'APPROVED' && productionReady === true
```

as the final condition before any executable output is rendered. Both layers must
remain independently enforced.

## What must never be produced for unsafe input states

- `approved-recipe` (recipe block / CSS class)
- executable `finalFormula`
- ready-to-mix wording
- exact mixing grams
- production timing

This applies to any state that is `BLOCKED`, `MANUAL_REQUIRED`, diagnostic-only,
or missing required fields.

## Tests protecting this contract

- `test_www_render_runtime.js` — render gates, production readiness, input gate
  behavior at the render layer.
- `test_www_business_scenarios.js` — end-to-end `calculateProtocol` scenarios
  covering allergy, scalp, direction, condition, history, and missing-data paths.
- `test_www_mass_model.js` — mass model gate: length/density/thickness required,
  unknown enum values blocked, NaN-free paths.
- `test_www_mapping.js` — render-state mapping.

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
node --check test_www_render_runtime.js
node --check test_www_business_scenarios.js
node --check test_www_mass_model.js
node --check test_www_mapping.js
node test_www_render_runtime.js
node test_www_business_scenarios.js
node test_www_mass_model.js
node test_www_mapping.js
git diff --check
```
