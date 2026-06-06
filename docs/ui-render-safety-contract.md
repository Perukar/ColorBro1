# UI Render Safety Contract — PERUKAR

Single source of truth for how the web UI (`www/core.js`) is allowed to render
colour-protocol output. PERUKAR is safety-sensitive: an executable salon recipe
shown in the wrong state is a real-world risk. This contract must not be weakened.

## Final audit status

Final read-only audit: **PASS READ-ONLY**. No render-safety leak found.

## Hardening commit chain (audited as one chain)

- `14c25e1` Harden UI render safety contract
- `47b9e0d` Harden timing render safety contract
- `972ef60` Harden formula render safety contract
- `9c178b8` Harden productionReady invariant contract
- `7452779` Harden third-zone skeleton isolation contract

## Core invariant

Executable recipe output renders **only** when:

```
status === 'APPROVED' && productionReady === true
```

Enforced by `isProductionReadyState(state)` (exposed as `canRenderExecutableRecipe(state)`)
in `www/core.js`. In addition to the two conditions above, `isProductionReadyState`
requires: a recipe is present (`rootRec` / `midRec` / `lenRec`), no `blockers`,
no `manualDecisions`, and no diagnostic candidate present
(`isDiagnosticOnlyTimingState(state)` is false).

## productionReady is unsafe by default

Missing or `undefined` `productionReady` must **not** render executable output.
`normalizeWwwProductionReady(...)` recomputes `productionReady` inside
`buildWwwRenderState`; it is `true` only for an `APPROVED` state that has a recipe,
no blockers, no manual decisions, no diagnostic candidate, and is not explicitly
denied. Never replace `productionReady === true` with `productionReady !== false`
or any permissive fallback.

## States that must never render executable recipe output

- `MANUAL_REQUIRED`
- `BLOCKED`
- diagnostic-only
- third-zone / endsRec diagnostic output
- `APPROVED` without `productionReady === true`

## Unsafe states must NOT render

- `approved-recipe` (recipe block / CSS class)
- executable `finalFormula`
- ready-to-mix wording
- exact mixing grams
- production timing

## Safety markers that must stay visible on diagnostic / manual unsafe paths

- `notForMixing`
- `advisory-only` (`timingStatus`)
- `requiresManualConfirmation`
- `notReadyToExecute`
- `productionTimingHidden`
- `mixingMassesHidden`

Static labels in `renderEndsDiagnosticDisplay` also remain visible:
"Не наносити за цим блоком", "Не є фінальним рецептом", "Потрібна ручна перевірка".

## Render gate map (`www/core.js`)

- `renderRecipes` → gates on `canRenderExecutableRecipe`; otherwise returns the
  `renderProductionNotReadyNotice` safe block ("Рецепт недоступний"). It is the
  single chokepoint that emits `approved-recipe`.
- `renderRecipe` → emits `finalFormula` only when `options.approved === true`,
  which is passed only by `renderRecipes`.
- `sanitizeMassModelForRender` → returns exact masses only when
  `canRenderExecutableRecipe`; otherwise hides them (`mixingMassesHidden`).
- `sanitizeTimingInfoForRender` → returns production timing only when
  `canRenderExecutableRecipe`; otherwise blocked / diagnostic-only / advisory-only
  with `productionTimingHidden`.
- `renderEndsDiagnosticDisplay` → forces the displayed `productionReady` to `false`
  and strips forbidden fields (`dyeMass`, `oxidizerMass`, `grams`, `exactGrams`,
  `finalFormula`, `endsFormula`, `productionRecipe`, `formula-to-mix`).
- `isDiagnosticOnlyTimingState` → true for any truthy `endsRecDiagnosticWiringCandidate`,
  which forces `isProductionReadyState` to false.

## Third-zone / endsRec production skeletons

`buildProductionEndsRec` and `assembleProductionEndsRecContract` are INACTIVE /
future-only. They contain `productionReady: true` as a contract placeholder and are
**not** wired into runtime rendering: the diagnostic wiring contract rebuilds the
candidate with `productionReady: false`, the runtime hardcodes `false`,
`normalizeWwwProductionReady` forces `false` whenever a diagnostic candidate is
present, and `isProductionReadyState` blocks the executable recipe. They must not be
activated without a new explicit safety task and tests.

## Tests protecting this contract

- `test_www_render_runtime.js` — render gates and direct render-bypass attempts,
  including the real skeleton object wired directly into `renderStateToHtml`.
- `test_www_business_scenarios.js` — end-to-end `calculateProtocol` scenarios.
- `test_www_mass_model.js` — mass model and third-zone readiness helper contracts.
- `test_www_mapping.js` — render-state mapping.

## Do not change without tests

Any change touching `isProductionReadyState`, `canRenderExecutableRecipe`,
`normalizeWwwProductionReady`, `renderRecipes`, `renderRecipe`,
`sanitizeMassModelForRender`, `sanitizeTimingInfoForRender`,
`renderEndsDiagnosticDisplay`, or the third-zone / endsRec skeletons MUST:

1. Keep the core invariant (`status === 'APPROVED' && productionReady === true`)
   strict — never permissive.
2. Keep missing / undefined `productionReady` unsafe by default.
3. Pass the full matrix: `node --check` on `www/core.js` and all four test files;
   run all four test files; `git diff --check`.
4. Add or extend regression tests proving no executable leak for unsafe states.
