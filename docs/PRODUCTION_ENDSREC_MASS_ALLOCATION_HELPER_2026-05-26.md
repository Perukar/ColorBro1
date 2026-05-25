# Production endsRec mass allocation contract helper

## Purpose

`classifyProductionEndsRecMassAllocationContract(context, readiness, builderResult, formulaContract)` is an internal helper for the future production `endsRec` path.

It classifies whether a previously validated readiness result, an inactive production `endsRec` skeleton, and a verified formula contract are eligible for a mass allocation contract.

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

## Mass contract is not a mass calculation

`massReady`, `massStatus`, and `allowedMassCalculation` describe only the class of future action that may be allowed.

They do not describe a final salon recipe, exact grams, product quantities, oxidizer quantities, or a ready-to-mix formula.

For a safe low-risk path, the helper may classify the contract as:

```js
{
  massReady: true,
  massStatus: "READY",
  allowedMassCalculation: true,
  estimatedEndsShare: null,
  sourceMassModelRef: "threeZoneCandidateMassModel",
  safetyReasonCodes: [...],
  manualRequiredReasonCodes: []
}
```

This means only that the future mass allocation path is eligible. It does not mean that the app has created a final `endsMass` in production.

## Preconditions

The helper may return `massReady: true` only when all preconditions are true:

- `readiness.ready === true`;
- `readiness.status === "READY"`;
- `builderResult.created === true`;
- `formulaContract.formulaReady === true`;
- `builderResult.endsRec.productionReady === true`;
- `builderResult.endsRec.endsRecipeReady === false`;
- the state is not `BLOCKED`;
- the state is not `MANUAL_REQUIRED`;
- `readiness.productionBlocked !== true`.

`readiness.ready` protects the transition from diagnostic preview to production preparation.

`builderResult.created` confirms that the inactive production `endsRec` skeleton exists.

`formulaContract.formulaReady === true` confirms that the formula contract classification is completed before any mass allocation is allowed.

## Why mass allocation helper goes after formula contract

Mass allocation rules depend on the allowed formula type (e.g. toning-only vs permanent lift). We cannot allocate mass for the ends zone without first verifying that the formula class is safe and determined.

## Blocked and manual states

`BLOCKED` and `MANUAL_REQUIRED` states must never automatically create `massReady: true`.

For those states, the helper must return a non-ready mass contract:

- `massStatus: "BLOCKED"` for blocked safety states;
- `massStatus: "MANUAL_REQUIRED"` for manual review states;
- `massReady: false`;
- `allowedMassCalculation: false`.

This prevents automatic mass allocation when the client's history, condition, or target requires a colorist decision.

## No preview mass promotion

The helper must not promote or copy preview mass data (such as `threeZoneCandidateMassModel`, candidate ends mass, or estimated preview mass) to the production `massModel`. The production mass model must remain decoupled from the preview/diagnostic path.

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
- `formulaContract`;
- `massModel`;
- `rootRec`;
- `lenRec`;
- `calcMixtone`;
- global oxidizer logic;
- `calculateProtocol()` behavior.

## Why runtime activation is still forbidden

Runtime activation is still forbidden because the full production `endsRec` lifecycle contract is not yet fully completed, tested, and assembled.

## Next safe direction

The next safe direction is planning and testing for the production `endsRec` assembly contract:

- production `endsRec` assembly contract plan;
- assembly contract tests;
- inactive assembly helper;

calculateProtocol wiring and UI integration remain forbidden at this stage.
