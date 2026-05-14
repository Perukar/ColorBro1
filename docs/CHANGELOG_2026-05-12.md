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
