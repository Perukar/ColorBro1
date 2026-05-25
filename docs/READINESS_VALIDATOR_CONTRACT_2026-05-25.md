# Production endsRec readiness validator contract

## Purpose

`validateProductionEndsRecReadiness(context)` is an internal safety validator for the future production `endsRec` flow.

Its job is to answer one narrow question: whether the current diagnostic state is safe enough to prepare a production ends recipe in a later step.

The helper does not create a recipe. It only classifies readiness.

## What the helper checks

Positive readiness requires all of these conditions:

- `classifyThreeZoneActivation(context)` returns `ALLOW_3_ZONE`.
- `classifyEndsRecEligibility(context)` returns `SAFE_FOR_TONING`.
- `context.endsRecCandidatePreview` exists.
- The candidate remains diagnostic-only:
  - `candidateOnly === true`;
  - `previewOnly === true`;
  - `notForMixing === true`;
  - `productionReady === false`.
- The candidate does not contain production `dyeMass`.
- The candidate does not contain production `oxidizerMass`.
- The candidate does not contain production `endsFormula`.
- The candidate does not write a numeric production value into `massModel.endsMass`.

Negative readiness covers these cases:

- `KEEP_2_ZONE`;
- `MANUAL_REQUIRED`;
- `BLOCKED`;
- missing candidate preview;
- missing preview safety flags;
- `productionReady === true` on the candidate in this phase;
- unsafe cosmetic lift, damaged ends, henna/metals, remover history, unknown chemical history, or prepigmentation-needed scenarios, according to the existing classifiers.

## Return object

The helper returns a plain object:

```js
{
  ready: boolean,
  status: "READY" | "NOT_READY" | "BLOCKED" | "MANUAL_REQUIRED",
  reasonCode: string,
  reasons: string[],
  candidateSummary: object | null,
  productionAllowed: boolean,
  productionBlocked: boolean
}
```

`ready: true` means only that the system may proceed to a future production `endsRec` preparation step.

`productionAllowed: true` does not mean a production recipe has already been created.

## What the helper must not do

`validateProductionEndsRecReadiness(context)` must not:

- mutate `context`;
- mutate `massModel`;
- create production `endsRec`;
- create numeric `endsMass`;
- create `dyeMass`;
- create `oxidizerMass`;
- create `endsFormula`;
- change `rootRec`;
- change `lenRec`;
- call or change `calcMixtone` for a new production formula path;
- change global oxidizer logic;
- change renderer behavior;
- change UI behavior;
- change `calculateProtocol` production output;
- wire the candidate preview into production recipe creation.

## Readiness is not a production recipe

Readiness is a safety classification. A production recipe is an actionable salon instruction.

The validator exists between diagnostic preview and recipe creation. This separation keeps a safe checkpoint before the app is ever allowed to allocate ends mass or produce an ends formula.

## Candidate preview cannot be flipped into production

`endsRecCandidatePreview` is intentionally marked as non-production:

- `candidateOnly`;
- `previewOnly`;
- `notForMixing`;
- `productionReady: false`.

Those flags mean the candidate is evidence for a future decision, not a recipe. Turning it directly into production would bypass the safety boundary that the validator is meant to enforce.

## Mass model cannot move to 3-zone without production endsRec

`massModel.mode` cannot move from `"2-zone"` to `"3-zone"` until a real production `endsRec` exists.

Without a production ends recipe, a 3-zone mass model would allocate real product mass for a zone that still has no approved formula. That would change recipe behavior before the system has a safe production instruction for the ends.

## Risks closed by this validator

The validator reduces these risks:

- treating a diagnostic candidate as a salon-ready recipe;
- allocating ends mass before an ends formula exists;
- producing dye or oxidizer quantities for ends too early;
- bypassing manual review for risky chemical history;
- allowing 3-zone production behavior from a preview-only object;
- changing runtime output surface before the production path is explicitly designed.

## Next allowed step

The next allowed step is a narrow implementation or audit step that keeps production behavior unchanged:

- keep `validateProductionEndsRecReadiness(context)` pure or near-pure;
- keep `endsRecCandidatePreview` readonly and preview-only;
- keep `massModel.mode` as `"2-zone"` until a separate production `endsRec` step is explicitly approved;
- keep renderer/UI unchanged;
- keep current-state safety tests green.

Any future production `endsRec` work must be a separate scoped task with its own tests and audit.
