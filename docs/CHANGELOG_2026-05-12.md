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
