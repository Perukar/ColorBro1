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
