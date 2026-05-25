# Production endsRec builder skeleton contract

## Purpose

`buildProductionEndsRec(context, readiness)` is an internal helper for the future production `endsRec` path.

It is a skeleton builder. It can produce a minimal production `endsRec` skeleton only after `validateProductionEndsRecReadiness(context)` has already returned a safe readiness result.

The helper is not a formula builder, not a mass allocator, and not a runtime activation point.

## Inactive status

`buildProductionEndsRec(context, readiness)` is inactive in the current runtime flow.

It is not connected to `calculateProtocol()`. Current recipe output remains unchanged:

- no production `endsRec` is rendered;
- `massModel.mode` remains `"2-zone"`;
- `massModel.endsMass` remains `null`;
- root and length recipes remain the only production recipe zones;
- renderer and UI output do not change.

## Preconditions

The helper may return `created: true` only when all preconditions are true:

- `readiness.ready === true`;
- `readiness.status === "READY"`;
- `readiness.productionAllowed === true`;
- `readiness.productionBlocked === false`;
- `readiness.candidateSummary` or `readiness.candidateRef` exists.

Any `BLOCKED`, `MANUAL_REQUIRED`, missing candidate, or not-ready state must keep the helper from creating `endsRec`.

## Output contract

Successful skeleton output has this shape:

```js
{
  created: true,
  status: "CREATED",
  reasonCode: string,
  reasons: string[],
  endsRec: {
    productionReady: true,
    endsRecipeReady: false,
    source: "endsRecCandidatePreview",
    sourceCandidateSummary: object | null,
    safetyReasonCodes: string[]
  }
}
```

`created: true` means only that a production `endsRec` skeleton passed the readiness gate.

It does not mean that the app has a ready-to-mix ends recipe.

## productionReady is not endsRecipeReady

`productionReady: true` on the skeleton means the preview candidate is allowed to move into a production-data skeleton.

`endsRecipeReady` must remain `false` until a separate formula and mass contract exists.

The skeleton is therefore a controlled intermediate object. It is not a final salon instruction.

## created:false states

The helper must return `created: false` and `endsRec: null` for:

- `NOT_READY`;
- `BLOCKED`;
- `MANUAL_REQUIRED`;
- `NO_CANDIDATE`.

These states prevent accidental production recipe creation when readiness is incomplete, unsafe, manual-only, or missing candidate evidence.

## What the builder must not create

The builder must not create or mutate:

- `dyeMass`;
- `oxidizerMass`;
- `endsMass`;
- final `endsFormula`;
- numeric `massModel.endsMass`;
- `massModel.mode = "3-zone"`;
- renderer output;
- UI output.

It must also not change:

- `context`;
- `readiness`;
- `massModel`;
- `rootRec`;
- `lenRec`;
- `calcMixtone`;
- global oxidizer logic;
- `calculateProtocol()` behavior.

## Preview flags

The production skeleton must not copy preview-only flags from the candidate:

- `candidateOnly`;
- `previewOnly`;
- `notForMixing`.

Those flags belong to diagnostic preview data. A production skeleton should keep only a sanitized `sourceCandidateSummary`.

## Risks closed by this contract

This contract reduces these risks:

- treating candidate preview data as a ready recipe;
- exposing production `endsRec` through runtime output too early;
- creating an ends recipe without approved mass logic;
- creating ends mass without an approved recipe;
- mixing preview-only flags into production data;
- switching `massModel` to `"3-zone"` before a production ends recipe exists;
- producing dye or oxidizer quantities before a formula contract exists.

## Next allowed step

The next allowed step after this documentation is only planning or tests for a future formula or mass contract.

Runtime activation is not the next step. A later task must separately define and test:

- formula contract;
- mass allocation contract;
- safety gates for real mixing quantities;
- explicit wiring rules for `calculateProtocol()`.

Until those contracts exist, `buildProductionEndsRec(context, readiness)` must remain inactive and must not change production output.
