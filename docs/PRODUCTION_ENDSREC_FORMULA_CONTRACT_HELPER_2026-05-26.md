# Production endsRec formula contract helper

## Purpose

`classifyProductionEndsRecFormulaContract(context, readiness, builderResult)` is an internal helper for the future production `endsRec` path.

It classifies whether a previously validated readiness result and an inactive production `endsRec` skeleton are eligible for a formula contract class.

The helper is inactive. It is not a production recipe builder, not a mass allocator, and not a runtime activation point.

## Inactive status

The helper is not connected to `calculateProtocol()`.

Current runtime behavior remains unchanged:

- no production `endsRec` is rendered;
- no final `endsFormula` is exposed;
- `massModel.mode` remains `"2-zone"`;
- `massModel.endsMass` remains `null`;
- root and length recipes remain the only production recipe zones;
- renderer and UI output do not change.

## Formula contract is not a recipe

`formulaReady` and `formulaStatus` describe only the class of future action that may be allowed.

They do not describe a final salon recipe, exact grams, product quantities, oxidizer quantities, or a ready-to-mix formula.

For a safe low-risk path, the helper may classify the contract as:

```js
{
  formulaReady: true,
  formulaStatus: "FORMULA_CONTRACT_READY",
  formulaType: "TONING_ONLY",
  targetAction: "tone_ends"
}
```

This means only that the future formula path is limited to a toning-only class. It does not mean that the app has created a final `endsFormula`.

## Preconditions

The helper may return `formulaReady: true` only when all preconditions are true:

- `readiness.ready === true`;
- `readiness.status === "READY"`;
- `builderResult.created === true`;
- `builderResult.endsRec.productionReady === true`;
- `builderResult.endsRec.endsRecipeReady === false`;
- the state is not `BLOCKED`;
- the state is not `MANUAL_REQUIRED`.

`readiness.ready` protects the transition from diagnostic preview to production preparation.

`builderResult.created` confirms that the inactive production `endsRec` skeleton exists before any formula contract can be classified.

## productionReady is not a ready recipe

`endsRec.productionReady === true` means only that the inactive builder created a production-data skeleton from safe readiness input.

It does not mean that the ends recipe is complete.

`endsRecipeReady` must remain `false` until a separate formula, mass, and assembly contract exists.

## Blocked and manual states

`BLOCKED` and `MANUAL_REQUIRED` states must never automatically create `formulaReady: true`.

For those states, the helper must return a non-ready formula contract:

- `formulaStatus: "BLOCKED"` for blocked safety states;
- `formulaStatus: "MANUAL_REQUIRED"` for manual review states;
- `formulaReady: false`.

This prevents automatic formula classification when the client's history, condition, or target requires a colorist decision.

## What the helper must not create

The helper must not create or mutate:

- `dyeMass`;
- `oxidizerMass`;
- exact grams;
- `endsMass`;
- final `endsFormula`;
- numeric `massModel.endsMass`;
- `massModel.mode = "3-zone"`;
- renderer output;
- UI output.

It must also not change:

- `context`;
- `readiness`;
- `builderResult`;
- `massModel`;
- `rootRec`;
- `lenRec`;
- `calcMixtone`;
- global oxidizer logic;
- `calculateProtocol()` behavior.

## Risks closed by this contract

This contract reduces these risks:

- treating an inactive production skeleton as a finished recipe;
- allowing `formulaReady: true` from `BLOCKED` or `MANUAL_REQUIRED` states;
- creating a formula before mass allocation rules exist;
- creating mass allocation before formula rules exist;
- exposing exact grams before safety and assembly contracts exist;
- switching `massModel` to `"3-zone"` before a production ends recipe is complete;
- changing renderer or UI output before runtime activation is explicitly approved.

## Next safe direction

The next safe direction is planning or tests for one of these separate contracts:

- mass allocation contract;
- formula and mass assembly contract.

Runtime activation is still forbidden at this stage.

A later runtime task must separately define and test:

- when `endsRecipeReady` may become `true`;
- how final formula data is assembled;
- how exact grams are calculated;
- how `massModel` can safely move beyond `"2-zone"`;
- how `calculateProtocol()` wiring is allowed.

Until those contracts exist, `classifyProductionEndsRecFormulaContract(context, readiness, builderResult)` must remain inactive and must not change production output.
