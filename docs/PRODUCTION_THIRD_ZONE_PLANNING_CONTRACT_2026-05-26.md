# Production Third-Zone Planning Contract

## 1. Status

**Planning only. No implementation.**

* Production third-zone recipe is **NOT implemented**.
* No runtime activation in this phase.
* No UI activation in this phase.
* No grams calculated.
* No formula-to-mix defined.
* `endsRecipeReady` залишається `false`.
* `massModel.mode` залишається `"2-zone"`.

---

## 2. Relation to Diagnostic Display

Diagnostic display branch завершена на commit `647c6ed Document diagnostic display milestone`.

Ключові межі, які залишаються чинними:

* Diagnostic display є **інформаційним блоком** — не production recipe.
* `state.endsRecDiagnosticWiringCandidate` є **diagnostic source** — не final recipe source.
* Diagnostic candidate НЕ може бути безпосередньо перетворений у production recipe без окремого contract.
* Production third-zone потребує **окремого contract, окремих tests і окремого activation path**.

Забороні shortcuts між diagnostic і production:
* Не використовувати `notForMixing: true` candidate як formula basis.
* Не просувати `previewOnly` дані у `massModel`.
* Не підміняти відсутній production contract існуючим diagnostic candidate.

---

## 3. Production Third-Zone Definition

Production third-zone вважається **production-ready** тільки якщо окремо визначені та верифіковані:

| Контракт | Призначення |
|---|---|
| Readiness contract | Коли можна приступати до розрахунку |
| Formula contract | Що є дозволеною формулою |
| Mass contract | Як розраховується маса і як змінюється massModel |
| Safety contract | Які комбінації заблоковані |
| UI/render contract | Що і коли може показувати інтерфейс |
| Manual override contract | Коли потрібна ручна перевірка майстра |
| Testing contract | Які тести потрібні до кожного кроку |

Жоден із цих контрактів не може бути замінений іншим.

---

## 4. Required Inputs Before Production Third-Zone Can Exist

Щоб production third-zone recipe міг бути розрахований, система повинна мати всі наступні вхідні дані:

* Root level (рівень коренів).
* Length level (рівень довжини).
* Ends level (рівень кінців).
* Target level (цільовий рівень).
* Target direction (цільовий відтінок/напрямок).
* Ends history (хімічна історія кінців).
* Porosity (пористість).
* Damage/sensitivity (пошкодженість/чутливість).
* Previous chemical history (попередня хімічна обробка).
* Grey percentage (відсоток сивини, якщо релевантний).
* Brand/system constraints (обмеження бренду/системи).
* Oxidizer constraints (обмеження вибору окисника).
* Application-zone logic (логіка нанесення по зонах).
* Manual verification flags (прапорці ручної перевірки).

Відсутність будь-якого з цих полів є **блокером** для production readiness.

---

## 5. Production Readiness Requirements

Production third-zone **НЕ може бути ready**, якщо виконується хоча б одна умова:

* Відсутній критичний input.
* Невідома або порожня `ends history`.
* Висока пошкодженість/чутливість вимагає ручної перевірки.
* Несумісний цільовий/вихідний рівень.
* Вибір окисника не є contractually safe.
* Формула не може бути обґрунтована.
* Маса не може бути безпечно виділена.
* UI відображав би рецепт без попереджень безпеки.

---

## 6. Formula Contract Requirements

Майбутня formula contract повинна визначити:

* **Дозволені джерела формули** — які дані можна використовувати для побудови formula.
* **Target correction logic** — як цільовий рівень та відтінок впливають на formula.
* **Neutralization/support logic** — підтримувальні та нейтралізуючі компоненти.
* **Brand/system dependency** — залежність від конкретного бренду чи системи фарбування.
* **Коли formula заблокована** — умови, за яких formula не може бути визначена автоматично.
* **Коли потрібна ручна перевірка** — сценарії обов'язкового manual review.
* **Що заборонено виводити автоматично** — поля, які не можуть з'явитися без explicit approval.

---

## 7. Mass Contract Requirements

Майбутня mass contract повинна визначити:

* **Чи може маса кінців бути розрахована** — умови дозволу.
* **Вплив довжини/густоти зони кінців на масу** — масова залежність від фізичних параметрів.
* **Як massModel переходить з 2-zone у 3-zone** — точний механізм розширення.
* **Коли `massModel.endsMass` може стати числом** — single explicit condition.
* **Запобігання preview mass promotion** — захист від випадкового просування preview до production.
* **Rounding policy** — правила округлення маси.
* **Мінімальні та максимальні безпечні межі маси** — safety bounds.

---

## 8. UI/Render Contract Requirements

Production UI **може показати** third-zone recipe тільки за одночасного виконання всіх умов:

* `productionReady === true`
* `endsRecipeReady === true`
* `massModel.mode === "3-zone"`
* `massModel.endsMass` є валідним числом
* Formula є фінальною
* Grams є фінальними
* Safety flags є clear (немає блокерів)
* Manual-required flags є resolved (немає невирішених ручних перевірок)

Якщо хоча б одна умова не виконана — UI НЕ показує production third-zone recipe.

---

## 9. Safety Invariants Until Explicit Activation

До окремої production activation phase наступне **категорично заборонено**:

| Інваріант | Статус |
|---|---|
| Production `endsRec` | 🚫 BLOCKED |
| `massModel.mode = "3-zone"` | 🚫 BLOCKED |
| `massModel.endsMass` as number | 🚫 BLOCKED |
| `dyeMass` | 🚫 BLOCKED |
| `oxidizerMass` | 🚫 BLOCKED |
| Exact grams | 🚫 BLOCKED |
| Final `endsFormula` | 🚫 BLOCKED |
| `endsRecipeReady = true` | 🚫 BLOCKED |
| Preview mass promotion | 🚫 BLOCKED |
| `formula-to-mix` | 🚫 BLOCKED |
| Mixing instruction | 🚫 BLOCKED |
| Application instruction for ends | 🚫 BLOCKED |

---

## 10. Activation Blockers

Production activation **must be blocked** if any of the following is true:

* Diagnostic candidate є єдиним джерелом даних.
* Reason codes включають `manual-required`.
* `notForMixing === true`.
* `productionReady === false`.
* `endsRecipeReady === false`.
* Mass contract неповний або не верифікований.
* Formula contract неповний або не верифікований.
* UI safety contract неповний або не верифікований.

---

## 11. Test Plan Required Before Implementation

Перед будь-яким production code обов'язково потрібні тести:

**Readiness tests:**
* Positive case: всі required inputs присутні → readiness READY.
* Negative case: відсутній critical input → readiness BLOCKED.
* Negative case: unknown ends history → readiness BLOCKED.
* Negative case: high damage → readiness MANUAL.

**Formula tests:**
* Positive case: valid formula source → formula defined.
* Negative case: incompatible levels → formula BLOCKED.
* Negative case: manual-required condition → formula MANUAL.

**Mass tests:**
* Positive case: valid ends data → endsMass calculated.
* Negative case: missing ends density → endsMass null.
* Safety: no preview promotion → `massModel.endsMass` залишається null до explicit production.
* Safety: no accidental 3-zone activation.
* Safety: no grams without mass contract complete.

**UI/render tests:**
* Third-zone hidden until `productionReady === true`.
* No final formula shown until formula contract complete.
* Root/length output stability після додавання third-zone logic.
* Business scenarios stability.
* Mapping stability.

---

## 12. Implementation Sequence

Майбутня production implementation має йти строго в наступному порядку:

| Крок | Дія |
|---|---|
| 1 | Production third-zone readiness contract tests |
| 2 | Readiness helper implementation |
| 3 | Formula contract tests |
| 4 | Formula helper implementation |
| 5 | Mass contract tests |
| 6 | Mass helper implementation |
| 7 | Assembly contract tests |
| 8 | Production assembly helper implementation |
| 9 | Guarded integration tests |
| 10 | Runtime integration |
| 11 | Render contract tests |
| 12 | UI implementation |
| 13 | Manual UI smoke |
| 14 | Milestone docs |

Кожен наступний крок може починатися тільки після того, як попередній крок має PASS тести.

---

## 13. Explicit Non-Goals

Цей документ **НЕ дозволяє**:

* Production implementation у будь-якому файлі.
* Runtime changes у `www/core.js`.
* UI changes у `www/index.html` або `www/style.css`.
* Test changes у будь-якому test файлі.
* Third-zone activation.
* Grams для кінців.
* Final formula для кінців.
* Recipe-to-mix для кінців.
* Application protocol для кінців.

---

## 14. Future Approval Rule

Будь-який наступний prompt, який планує:
* Змінювати `www/core.js` у частині production endsRec;
* Додавати production `endsRec`;
* Міняти `massModel.mode` на `"3-zone"`;
* Додавати grams для кінців;
* Ставити `endsRecipeReady = true`;
* Міняти UI recipe output для кінців;

**Зобов'язаний**:
1. Визначити allowed scope файлів явно.
2. Надати safety checks для кожного дозволеного файлу.
3. Надати explicit acceptance criteria.
4. Посилатися на відповідний contract (readiness / formula / mass / assembly).
5. Мати PASS тести з попереднього кроку implementation sequence.

Без виконання цих умов — зміни не допускаються.

---

## 15. Reference Documents

* [DIAGNOSTIC_DISPLAY_MILESTONE_2026-05-26.md](DIAGNOSTIC_DISPLAY_MILESTONE_2026-05-26.md) — completed diagnostic display branch snapshot.
* [DIAGNOSTIC_DISPLAY_CONTRACT_PLAN_2026-05-26.md](DIAGNOSTIC_DISPLAY_CONTRACT_PLAN_2026-05-26.md) — diagnostic display contract (секції 1–13).
* [GUARDED_CALCULATEPROTOCOL_DIAGNOSTIC_WIRING_2026-05-26.md](GUARDED_CALCULATEPROTOCOL_DIAGNOSTIC_WIRING_2026-05-26.md) — guarded wiring architecture.
* [PRODUCTION_ENDSREC_BUILDER_SKELETON_CONTRACT_2026-05-26.md](PRODUCTION_ENDSREC_BUILDER_SKELETON_CONTRACT_2026-05-26.md) — builder skeleton reference.
* [PRODUCTION_ENDSREC_FORMULA_CONTRACT_HELPER_2026-05-26.md](PRODUCTION_ENDSREC_FORMULA_CONTRACT_HELPER_2026-05-26.md) — formula helper reference.
* [PRODUCTION_ENDSREC_MASS_ALLOCATION_HELPER_2026-05-26.md](PRODUCTION_ENDSREC_MASS_ALLOCATION_HELPER_2026-05-26.md) — mass allocation helper reference.
* [PRODUCTION_ENDSREC_ASSEMBLY_CONTRACT_HELPER_2026-05-26.md](PRODUCTION_ENDSREC_ASSEMBLY_CONTRACT_HELPER_2026-05-26.md) — assembly contract helper reference.
* [PRODUCTION_ENDSREC_WIRING_CONTRACT_HELPER_2026-05-26.md](PRODUCTION_ENDSREC_WIRING_CONTRACT_HELPER_2026-05-26.md) — wiring contract helper reference.
* [READINESS_VALIDATOR_CONTRACT_2026-05-25.md](READINESS_VALIDATOR_CONTRACT_2026-05-25.md) — readiness validator contract reference.
