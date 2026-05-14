# Changelog ПЕРУКАР

Дата: 2026-05-12

## Ремонт бізнес-логіки SB-6-83

Commit:

`8490651 Guard Special Blond base 6 scenario`

## Що змінено

- Для Special Blond зі стартової бази 6 додано ручне підтвердження.
- SB-6-83 більше не проходить як безумовний APPROVED.
- Додано й оновлено автоматичний бізнес-тест.

## Що не змінювалось

- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- Unrelated logic.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Залишкові ризики

- Брендова логіка Special Blond ще не формалізована.
- Правило зачіпає всі випадки стартової бази 6 + Special Blond.
- Потрібні наступні бізнес-сценарії.

## Ремонт бізнес-логіки PREPIG-10-6

Commit:

`eeecfc4 Guard significant darkening prepigmentation scenario`

## Що змінено

- Для значного затемнення зі світлої бази додано manual decision.
- Сценарій PREPIG-10-6 більше не проходить як безумовний APPROVED.
- Додано warning про передпігментацію / заповнення пігменту.
- Тест PREPIG-10-6 оновлено з diagnostic / known-risk на safe behavior.

## Що не змінювалось

- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- Unrelated logic.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Залишкові ризики

- Правило зачіпає всі затемнення на 3+ рівні зі стартової бази 9+.
- Брендова логіка передпігментації ще не формалізована.
- Потрібні наступні бізнес-сценарії.

## Ремонт бізнес-логіки BLACK-EXIT-1

Commit:

`5a4adfe Guard black exit diagnostic scenario`

## Що змінено

- Для виходу з чорного / темного косметичного пігменту додано manual decision.
- Сценарій BLACK-EXIT-1 більше не має проходити як тихий точний рецепт без додаткової діагностики.
- Додано warning про потребу уточнити нашарування, змивки, фон освітлення, стан полотна та тест-пасмо.

## Що не змінювалось

- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- Unrelated logic.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Залишкові ризики

- Правило залежить від текстових маркерів у `history` і `base_type`.
- Якщо користувач описує чорний/темний косметичний пігмент іншими словами, guard може не спрацювати.
- У майбутньому треба формалізувати поля історії: black pigment, cosmetic layering, remover history, current background, strand test.

## Ремонт бізнес-логіки ZONES-ROOT-LENGTH

Commit:

`7f9ac41 Guard zonal level mismatch scenario`

## Що змінено

- Додано manual guard для різниці між `root_level` і `length_level`.
- Якщо різниця між коренем і довжиною >= 2 рівні, результат переходить у `MANUAL_REQUIRED`.
- Якщо процеси для кореня і довжини різні, результат переходить у `MANUAL_REQUIRED`.
- Додано warning про потребу зонального рішення.
- Warning фіксує, що в поточній формі немає `ends_level`, тому кінці потребують окремої оцінки майстром.
- `ZONES-ROOT-LENGTH-ENDS` у business test тепер перевіряє safe behavior.
- Runtime test залишено базовим `APPROVED`-сценарієм через мінімальну зміну fake input.

## Що не змінювалось

- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- `www/index.html`.
- DOM-контракт.
- `ends_level` не додано.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Залишкові ризики

- Повноцінне розділення корінь / довжина / кінці ще не реалізоване.
- `ends_level` відсутній у формі.
- Для повного ремонту потрібна окрема фаза зміни DOM-контракту.

## FORM CONTRACT: ends_level

Commit:

`edce036 Add ends level form contract`

## Що змінено

- Додано поле `ends_level` у форму.
- Додано mapping `ends_level` → `endsLevel`.
- `calculateProtocol()` тепер optional читає рівень кінців.
- Якщо `ends_level` заповнений і відрізняється від `root_level` або `length_level`, результат переходить у `MANUAL_REQUIRED`.
- Додано warning/manual decision про потребу окремої оцінки кінців майстром.
- Business test `ZONES-ROOT-LENGTH-ENDS` тепер використовує реальний `ends_level`.
- Runtime fake DOM contract оновлено так, щоб базовий `APPROVED` сценарій не потрапляв під ZONES guard.

## Що не змінювалось

- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- `endsRec` не створювався.
- Окрема формула для кінців не рахується.
- Розподіл маси між зонами не змінювався.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_mapping.js`;
- `node test_www_mapping.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Залишкові ризики

- `ends_level` вже є у формі, але повний окремий рецепт кінців ще не реалізований.
- Потрібна окрема майбутня фаза для `endsRec` / логіки кінців / маси / оксиду.
- На поточному етапі система тільки зупиняє ризик через `MANUAL_REQUIRED`.

## Business tests: manual ends logic scenarios

Commit:

`d2825e6 Add manual ends logic scenarios`

## Що змінено

- Додано business tests для критичних сценаріїв кінців.
- `ENDS-LIGHTER-THAN-LENGTH` перевіряє, що світліші кінці не проходять як безумовний approved-рецепт.
- `ENDS-DARKER-THAN-LENGTH` перевіряє темніші кінці.
- `ENDS-10-6-PREPIG` перевіряє затемнення кінців зі світлої бази.
- `ENDS-TARGET-BETWEEN-LENGTH-ENDS` перевіряє ситуацію, коли ціль між довжиною і кінцями.
- `ENDS-DAMAGED-LIFT` зафіксований як diagnostic / limitation.
- `ENDS-COSMETIC-UNKNOWN-HISTORY` зафіксований як diagnostic / limitation.

## Що не змінювалось

- Production code.
- `www/core.js`.
- `www/index.html`.
- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- `endsRec` не створювався.
- Mass model не змінювався.
- Окрема формула кінців не додавалась.

## Перевірки

- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check www/core.js`;
- `node --check test_www_mapping.js`;
- `node test_www_mapping.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Результат

- Safe: `ENDS-LIGHTER-THAN-LENGTH`, `ENDS-DARKER-THAN-LENGTH`, `ENDS-10-6-PREPIG`, `ENDS-TARGET-BETWEEN-LENGTH-ENDS`.
- Diagnostic / limitation: `ENDS-DAMAGED-LIFT`, `ENDS-COSMETIC-UNKNOWN-HISTORY`.
- Нового silent approved known-risk не зафіксовано.

## Залишкові ризики

- Немає окремого поля стану кінців.
- Немає окремої історії / `base_type` саме для кінців.
- Повний `endsRec` і mass model ще не реалізовані.

## FORM CONTRACT: ends_condition

Commit:

`bda9bd8 Add ends condition form contract`

## Що змінено

- Додано поле `ends_condition` у форму поруч із `ends_level`.
- Додано mapping `ends_condition` → `endsCondition`.
- `calculateProtocol()` тепер optional читає стан кінців.
- Додано manual guard для ризикового стану кінців.
- Якщо `ends_condition` пористі/ламкі/сильно пошкоджені/критично пошкоджені і сценарій передбачає освітлення або хімічне втручання, результат переходить у `MANUAL_REQUIRED` або diagnostic/manual signal.
- Якщо `ends_condition` не вказано, але `ends_level` відрізняється від `root_level` або `length_level`, система додає manual/diagnostic signal про недостатню оцінку стану кінців.
- Додано business tests `ENDS-CONDITION-POROUS-LIFT`, `ENDS-CONDITION-BRITTLE-HIGH-LIFT`, `ENDS-CONDITION-DAMAGED-CHEMISTRY`, `ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL`.
- Runtime fake DOM contract оновлено `ends_condition: здорові` для базового `APPROVED`-сценарію.

## Що не змінювалось

- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- `endsRec` не створювався.
- Mass model не змінювався.
- Окрема формула кінців не додавалась.
- Docs до цього commit не змінювались.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_mapping.js`;
- `node test_www_mapping.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Результат

- Safe: `SB-6-83`, `PREPIG-10-6`, `ZONES-ROOT-LENGTH-ENDS`, `MISSING-CRITICAL-DATA`.
- Safe: `ENDS-LIGHTER-THAN-LENGTH`, `ENDS-DARKER-THAN-LENGTH`, `ENDS-10-6-PREPIG`, `ENDS-DAMAGED-LIFT`, `ENDS-TARGET-BETWEEN-LENGTH-ENDS`.
- Safe: `ENDS-CONDITION-*` scenarios.
- Diagnostic / limitation: `ENDS-COSMETIC-UNKNOWN-HISTORY`, бо окремої історії/base_type саме для кінців ще немає.

## Залишкові ризики

- Немає окремої історії кінців.
- Немає окремого `base_type` саме для кінців.
- Повний `endsRec` і mass model ще не реалізовані.
- Автоматичний рецепт кінців все ще не дозволений.

## FORM CONTRACT: ends_history / ends_base_type

Commit:

`c9e5eaf Add ends history and base type contract`

## Що змінено

- додано поле ends_history у форму;
- додано поле ends_base_type у форму;
- додано mapping ends_history → endsHistory;
- додано mapping ends_base_type → endsBaseType;
- calculateProtocol() optional читає історію та тип бази кінців;
- якщо ends_level відрізняється від інших зон, але історія або тип бази кінців не вказані — додається manual/diagnostic signal;
- якщо ends_history вказує на косметичний пігмент, темний косметичний пігмент, змивку, хну/метали або невідому історію — результат переходить у MANUAL_REQUIRED;
- якщо ends_base_type косметична, змішана або невідома при освітленні — результат переходить у MANUAL_REQUIRED;
- додано business tests:
  - ENDS-HISTORY-UNKNOWN;
  - ENDS-HISTORY-COSMETIC-LIFT;
  - ENDS-HISTORY-DARK-COSMETIC;
  - ENDS-HISTORY-AFTER-REMOVER;
  - ENDS-HISTORY-HENNA-METALS;
  - ENDS-BASE-TYPE-COSMETIC-LIFT;
  - ENDS-BASE-TYPE-MIXED-UNEVEN;
  - ENDS-HISTORY-MISSING-WITH-DIFFERENT-LEVEL;
- runtime fake DOM contract оновлено для нових полів.

## Що не змінювалось

- формули;
- грамовки;
- оксид;
- calcMixtone;
- endsRec не створювався;
- mass model не змінювався;
- окрема формула кінців не додавалась;
- розподіл продукту на 3 зони не реалізовувався.

## Перевірки

- node --check www/core.js;
- node --check test_www_mapping.js;
- node test_www_mapping.js;
- node --check test_www_business_scenarios.js;
- node test_www_business_scenarios.js;
- node --check test_www_render_runtime.js;
- node test_www_render_runtime.js.

## Залишкові ризики

- система вже бачить історію й тип бази кінців, але не рахує окремий рецепт кінців;
- повний endsRec, mass model, оксид і формула кінців залишаються окремою майбутньою фазою;
- автоматичний рецепт кінців все ще заборонений без окремого проєктування.

## Mass model diagnostic tests і recovery fix

Commits:

- `eedf476 Add diagnostic mass model scenarios`
- `7a76091 Fix mass model diagnostic tests`

## Що зроблено

- Додано diagnostic / known-limitation business tests для майбутньої 3-зонної mass model.
- Зафіксовано, що поточна система ще не має `endsMass`.
- Зафіксовано, що `endsRec` не має створюватися без mass model.
- Зафіксовано future requirement для округлення: `rootMass + lengthMass + endsMass` має дорівнювати `totalMass` або мати похибку не більше 1 г.
- Зафіксовано, що low-risk endsRec auto-toning є майбутньою можливістю, а не поточною поведінкою.
- Зафіксовано блокування cosmetic lift / damaged ends / unknown history для кінців.
- Зафіксовано, що powder surcharge per zone є майбутньою вимогою.

## Recovery note

- Commit `eedf476` спочатку створив залежність тестів від внутрішнього state через `globalThis.__latestState`.
- Це було визнано порушенням, бо production code змінювати було заборонено.
- Незатверджена зміна у `www/core.js` була відкотена (`git restore www/core.js`).
- Commit `7a76091` переписав diagnostic tests так, щоб вони не залежали від hidden production state.
- Після fix тести працюють тільки через public test surface / HTML output / manual-warning signals.

## Що не змінювалось

- Production code.
- `www/core.js` у фінальному стані.
- `www/index.html`.
- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- `endsRec` не створювався.
- Mass model не змінювався.
- Окрема формула кінців не додавалась.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_mapping.js`;
- `node test_www_mapping.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Mass model scenarios: класифікація

| Сценарій | Статус |
|---|---|
| `MASS-MODEL-3-ZONES-TOTAL` | KNOWN_LIMITATION |
| `MASS-MODEL-ROUNDING` | KNOWN_LIMITATION |
| `ENDS-REC-NOT-CREATED-WITHOUT-MASS` | SAFE |
| `ENDS-REC-AUTO-TONING-LOW-RISK` | DIAGNOSTIC |
| `ENDS-REC-BLOCK-COSMETIC-LIFT` | SAFE |
| `ENDS-REC-BLOCK-DAMAGED-ENDS` | SAFE |
| `ENDS-REC-BLOCK-UNKNOWN-HISTORY` | SAFE |
| `ENDS-REC-POWDER-SURCHARGE-PER-ZONE` | KNOWN_LIMITATION |

## Залишкові ризики

- 3-зонна mass model ще не реалізована.
- `endsMass` ще не існує.
- `endsRec` ще не реалізований.
- Автоматичний рецепт кінців усе ще заборонений до окремого mass model refactor.

## Mass model diagnostic test contract

Commit:

`6e25afd Add mass model diagnostic test contract`

## Що змінено

- Створено окремий diagnostic test file `test_www_mass_model.js`.
- Зафіксовано, що `buildMassModel()` ще не існує як production helper.
- Зафіксовано майбутню вимогу для 2-зонного split: `rootMass + lengthMass === totalMass`.
- Підтверджено double-round drift у поточній формулі для окремих значень (`totalMass=35`: `11+25=36≠35`).
- Зафіксовано майбутню вимогу: невідомий `length` не має давати тихий `NaN` (підтверджено для 7 значень, включаючи `'середні'`).
- Зафіксовано різну форму `massModel` у BLOCKED (3 поля) і APPROVED (5 полів) шляхах.
- Зафіксовано вимогу синхронізації powder surcharge з `massModel.rootMass` після refactor.
- Зафіксовано майбутню вимогу для 3-зонного split: `rootMass + lengthMass + endsMass === totalMass` з похибкою не більше 1 г.

## Що не змінювалось

- Production code.
- `www/core.js`.
- `www/index.html`.
- Існуючі тести.
- Формули.
- Грамовки.
- Оксид.
- `calcMixtone`.
- `buildMassModel` не реалізовано.
- `endsMass` не реалізовано.
- `endsRec` не реалізовано.
- Mass model не змінювалась.

## Перевірки

- `node --check test_www_mass_model.js`;
- `node test_www_mass_model.js`;
- `node --check www/core.js`;
- `node --check test_www_mapping.js`;
- `node test_www_mapping.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Знахідки diagnostic тестів

| Сценарій | Статус | Знахідка |
|---|---|---|
| `MASS-MODEL-INLINE-CURRENT` | KNOWN_LIMITATION | `buildMassModel` не існує як helper |
| `MASS-MODEL-2-ZONE-EXPECTED-SPLIT` | KNOWN_LIMITATION | Double-round drift: `totalMass=35` → `11+25=36` |
| `MASS-MODEL-INVALID-LENGTH-NO-NAN` | KNOWN_LIMITATION | 7 невідомих значень → тихий NaN |
| `MASS-MODEL-BLOCKED-PATH-SHAPE` | KNOWN_LIMITATION | BLOCKED: 3 поля, APPROVED: 5 полів |
| `MASS-MODEL-POWDER-SURCHARGE-SYNC` | KNOWN_LIMITATION | Surcharge `18→40` для `totalMass=60` |
| `MASS-MODEL-3-ZONE-FUTURE-SPLIT` | KNOWN_LIMITATION | Remainder-формула математично валідна |

## Залишкові ризики

- Mass model досі inline у `calculateProtocol()`.
- `buildMassModel()` ще не створений.
- NaN fallback ще не виправлений.
- BLOCKED/APPROVED massModel shape ще не уніфікований.
- 3-зонна mass model ще не реалізована.
- `endsRec` усе ще заборонений до окремого refactor.

## Two zone mass model helper

Commit:

`8037531 Extract two zone mass model helper`

## Що змінено

- Створено helper `buildMassModel()` як окрему функцію перед `calculateProtocol()`.
- Inline-розрахунок mass model винесено з `calculateProtocol()`.
- 2-зонний режим залишено основним і єдиним активним режимом.
- `rootMass` рахується як `Math.round(totalMass * 0.3)`.
- `lengthMass` рахується як `totalMass - rootMass`, щоб уникнути double-round drift.
- `endsMass` залишається `null`.
- `mode` зафіксовано як `"2-zone"`.
- Невідомий `length` більше не має створювати тихий `NaN` — `buildMassModel()` повертає `null`, виклик-код додає diagnostic і застосовує safe fallback.
- BLOCKED і APPROVED/MANUAL шляхи отримують консистентну `massModel`-структуру (7 полів: `baseMass`, `densityMultiplier`, `totalMass`, `rootMass`, `lengthMass`, `endsMass`, `mode`).
- Powder surcharge для кореня синхронізує `massModel.rootMass` із фактичним `rootRec.mass` через `Object.assign()`.

## Що не змінювалось

- `endsRec` не створювався.
- `endsMass` не реалізований.
- 3-зонна mass model не вмикалась.
- Пропорції 25/45/30 не додавались.
- Окрема формула кінців не додавалась.
- Оксид не змінювався.
- `calcMixtone` не змінювався.
- `www/index.html` не змінювався.

## Перевірки

- `node --check www/core.js`;
- `node --check test_www_mass_model.js`;
- `node test_www_mass_model.js`;
- `node --check test_www_mapping.js`;
- `node test_www_mapping.js`;
- `node --check test_www_business_scenarios.js`;
- `node test_www_business_scenarios.js`;
- `node --check test_www_render_runtime.js`;
- `node test_www_render_runtime.js`.

## Результат

| Перевірка | Статус |
|---|---|
| `buildMassModel()` створено | ✅ |
| 2-zone mass sum стабільна | ✅ `rootMass + lengthMass === totalMass` для всіх 9 комбінацій |
| NaN fallback прибраний | ✅ null для невідомого length |
| `endsMass === null` | ✅ |
| `endsRec` не створюється | ✅ |
| Production behavior не розширено до 3-zone | ✅ |
| Powder surcharge синхронізований | ✅ |
| BLOCKED/APPROVED shape уніфікований | ✅ |

## Залишкові ризики

- 3-зонна mass model ще не реалізована.
- `endsMass` ще не використовується у рецептах.
- `endsRec` ще не реалізований.
- Автоматичний рецепт кінців усе ще заборонений.
- Наступна фаза має бути окремим планом 3-zone activation, не прямим `endsRec`.
