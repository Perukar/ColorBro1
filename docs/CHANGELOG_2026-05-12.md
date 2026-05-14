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
