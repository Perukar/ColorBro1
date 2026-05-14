# Browser QA ends_history / ends_base_type

Дата: 2026-05-12

## 1. Як запущено

- Browser QA виконано через Antigravity.
- Локальний сервер: `python -m http.server 8081 --directory "C:\Users\User\Favorites\Робочий стіл\PAREIKM\PERUKAR"`.
- URL: `http://127.0.0.1:8081/www/index.html`.
- Файли проєкту під час тестування не змінювались.
- `git status --short`: clean.

## 2. Перевірені поля

### ends_history

Поле `Історія кінців` видно в UI.

Перевірені варіанти:
- `Не вказано`;
- `Натуральні`;
- `Освітлені`;
- `Косметичний пігмент`;
- `Темний косметичний пігмент`;
- `Після змивки`;
- `Хна / метали`;
- `Невідома історія`.

Результат: PASS.

### ends_base_type

Поле `Тип бази кінців` видно в UI.

Перевірені варіанти:
- `Не вказано`;
- `Натуральна`;
- `Косметична`;
- `Освітлена`;
- `Змішана / нерівномірна`;
- `Невідома`.

Результат: PASS.

## 3. Перевірені сценарії

| Сценарій | Статус | Фактична поведінка |
| --- | --- | --- |
| APPROVED базовий | PASS | система видає результат без ends-history/base warnings |
| ENDS-HISTORY-UNKNOWN | PASS | `MANUAL_REQUIRED`, warning про невідому історію кінців |
| ENDS-HISTORY-COSMETIC-LIFT | PASS | `MANUAL_REQUIRED`, warning про косметичний пігмент / освітлення косметичної бази |
| ENDS-HISTORY-DARK-COSMETIC | PASS | `MANUAL_REQUIRED`, warning про темний косметичний пігмент / додаткову діагностику |
| ENDS-HISTORY-AFTER-REMOVER | PASS | `MANUAL_REQUIRED`, warning про нестабільну базу після змивки |
| ENDS-HISTORY-HENNA-METALS | PASS | `MANUAL_REQUIRED`, warning про хна / метали |
| ENDS-BASE-TYPE-MIXED-UNEVEN | PASS | `MANUAL_REQUIRED`, warning про змішану / нерівномірну базу кінців |
| ENDS-HISTORY-MISSING-WITH-DIFFERENT-LEVEL | PASS | `MANUAL_REQUIRED`, warning про відсутню оцінку історії / типу бази кінців |

## 4. Технічний стан

- Критичних console errors не виявлено.
- Розрахунок працює.
- Warning/manual blocks видно в UI.
- Layout після додавання нових полів не зламаний.
- Старі сценарії SB-6-83 і PREPIG-10-6 не зламані.

## 5. Висновок

Browser QA для `ends_history` і `ends_base_type` пройдено.

UI відповідає очікуваній guard-логіці:
- ризикова історія кінців переводить результат у `MANUAL_REQUIRED`;
- ризиковий тип бази кінців переводить результат у `MANUAL_REQUIRED`;
- система не створює окремий автоматичний рецепт кінців.

## 6. Обмеження

- Це browser QA, не фізичний планшетний QA.
- `endsRec` не реалізований.
- Окрема формула кінців не реалізована.
- Mass model для 3 зон не реалізований.
- Автоматичний рецепт кінців усе ще заборонений без окремого проєктування.
