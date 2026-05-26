# Diagnostic Display Milestone Snapshot

## 1. Status

**Completed / Stable.**

* Diagnostic display is **implemented** and verified.
* Production third-zone recipe is **NOT implemented**.
* Production activation is **NOT implemented**.
* `endsRecipeReady` залишається `false`.
* `massModel.mode` залишається `"2-zone"`.

---

## 2. Scope Completed

| Фаза | Commit | Опис |
|---|---|---|
| Guarded wiring | `3efcb07` | Guarded `calculateProtocol` diagnostic wiring |
| Wiring docs | `5a49c68` | Document guarded wiring |
| Invariant tests | `ae8c3d8` | Diagnostic wiring invariant tests |
| Output contract | `5d0d4f5` | Diagnostic output contract tests |
| Display plan | `973ef6b` | Diagnostic display contract plan |
| Render tests | `ad0359d` | Diagnostic display render contract tests |
| Display impl | `b8a830e` | Implement diagnostic display block |
| Input align | `73fad44` | Align diagnostic display UI input values |
| Input docs | `a5cbcde` | Document diagnostic UI input normalization |
| Reachability | `9781af7` | Diagnostic UI value reachability tests |
| Status docs | `8c4f73c` | Document diagnostic display implementation status |
| Reason labels | `11b73f8` | Implement diagnostic reason labels |
| Labels docs | `05a1fad` | Document diagnostic reason labels |
| Case matrix | `4f826ef` | Diagnostic display case matrix tests |
| Matrix docs | `5545b53` | Document diagnostic display case matrix coverage |

---

## 3. Current Implemented Behavior

* `state.endsRecDiagnosticWiringCandidate` існує як діагностичне джерело даних.
* Diagnostic block рендериться в UI коли candidate існує.
* Diagnostic block прихований коли candidate `null` або відсутній.
* Diagnostic block досяжний з реальної UI-форми після normalization `"натуральні"` → `"натуральна"`.
* Reason labels відображаються людською мовою (українською).
* Unknown reason code має safe fallback (не ламає render).
* Existing root/length output залишається стабільним.

---

## 4. Дозволений вміст diagnostic block

* Діагностичний warning/info статус.
* `previewOnly` статус.
* `notForMixing` статус.
* `candidateOnly` статус.
* Manual check required статус.
* `sourceRefs` (якщо безпечні, як diagnostic context).
* `safetyReasonCodes` як human-readable labels.
* `manualRequiredReasonCodes` як human-readable labels.
* Warning: «Не є фінальним рецептом».
* Warning: «Не наносити за цим блоком».

---

## 5. Заборонений вміст diagnostic block

* `grams` — точні грами.
* `dyeMass` — маса барвника.
* `oxidizerMass` — маса окисника.
* `exactGrams` — будь-які точні грами.
* `finalFormula` — фінальна формула.
* `endsFormula` як production formula.
* `productionRecipe` — робочий рецепт.
* `formula-to-mix` — формула для змішування.
* Mixing instruction — інструкція змішування.
* Proportions for application — пропорції нанесення.
* Ready recipe for ends — готовий рецепт для кінців.
* CTA «готовий рецепт» — кнопка затвердження.

---

## 6. Safety Invariants

| Інваріант | Стан |
|---|---|
| No production `endsRec` | ✅ |
| `massModel.mode` ≠ `"3-zone"` | ✅ |
| `massModel.endsMass` не є числом | ✅ |
| No `dyeMass` / `oxidizerMass` runtime | ✅ |
| No exact grams runtime | ✅ |
| No final `endsFormula` | ✅ |
| `endsRecipeReady` ≠ `true` | ✅ |
| No preview mass promotion | ✅ |
| No `calcMixtone` change | ✅ |
| No oxidizer logic change | ✅ |

---

## 7. Test Coverage

| Suite | Status |
|---|---|
| render runtime | PASS |
| mass model | PASS |
| business scenarios | PASS |
| mapping | PASS |
| `git diff --check` | PASS |

Додаткове покриття:
* Wiring invariant tests — safety flags перевірені.
* Output contract tests — candidate shape перевірений.
* Render contract tests — display block / hidden перевірені.
* UI value reachability tests — real UI values перевірені.
* Case matrix tests — positive/negative visibility matrix.

---

## 8. QA Summary

* Local app: `http://127.0.0.1:8080` у Microsoft Edge.
* Real form candidate path: verified.
* Diagnostic block visible via real form: ✅.
* Diagnostic block hidden when candidate absent: ✅.
* No production recipe impression: ✅.
* Browser console errors: none.
* Layout readable: ✅.
* Forms/buttons not broken: ✅.

---

## 9. Non-Goals (поза межами milestone)

* No production third-zone recipe.
* No grams for ends.
* No final formula for ends.
* No recipe-to-mix for ends.
* No automatic application protocol for ends.
* No production readiness signal.

---

## 10. Future Allowed Directions

1. Розширювати diagnostic cases — тільки з matrix tests (positive + negative).
2. Додавати reason labels — тільки з fallback tests.
3. Покращувати UI wording — тільки з render tests.
4. Планувати production third-zone — тільки в окремій contract фазі.
5. Production activation — вимагає окремих safety tests і явного approval.

---

## 11. Future Forbidden Shortcuts

1. **Не конвертувати** diagnostic block у recipe card.
2. **Не показувати** grams з diagnostic candidate.
3. **Не встановлювати** `endsRecipeReady = true` з render logic.
4. **Не промотувати** preview mass у `massModel`.
5. **Не змінювати** option values без UI reachability tests.
6. **Не трактувати** reason labels як calculation logic.

---

## 12. Reference Documents

* [DIAGNOSTIC_DISPLAY_CONTRACT_PLAN_2026-05-26.md](DIAGNOSTIC_DISPLAY_CONTRACT_PLAN_2026-05-26.md) — повний contract plan (секції 1–13).
* [GUARDED_CALCULATEPROTOCOL_DIAGNOSTIC_WIRING_2026-05-26.md](GUARDED_CALCULATEPROTOCOL_DIAGNOSTIC_WIRING_2026-05-26.md) — guarded wiring architecture.
