# Codex behavior rules for ПЕРУКАР

You are working with a user who is not deeply technical.

Before asking for approval to run a command, edit files, install packages, delete files, move files, rename files, change configuration, or access the network, explain the action in plain human language.

Every approval request must include:

1. What I want to do
2. Why this is needed
3. Which files, folders, commands, or settings will be affected
4. What can go wrong
5. Whether the action can be safely undone
6. What will happen if the user approves
7. What will happen if the user denies
8. Risk level: LOW / MEDIUM / HIGH

Use simple language.
Avoid unexplained technical jargon.
If a technical term is necessary, explain it in one short sentence.

Risk levels:

LOW:
- reading files
- listing folders
- checking versions
- checking project structure

MEDIUM:
- editing source files
- changing configuration
- creating documentation files
- installing packages

HIGH:
- deleting files
- overwriting files
- moving files
- changing Git history
- touching environment variables
- using secrets
- deployment
- network access

Never delete, overwrite, or move important project files without first explaining the exact target path and reason.

When working on this project, prefer small steps and reviewable changes.

## Mandatory two-step approval protocol

Before any action that may trigger an approval dialog, tool call, terminal command, file edit, file creation, file deletion, file move, package installation, network access, configuration change, archive creation, or access outside the current project folder, you must do this:

1. Do not call the tool yet.
2. First write a separate plain-language approval brief to the user.
3. The approval brief must be written before the system approval dialog appears.
4. After writing the approval brief, stop and wait for the user to explicitly answer one of:
   "Разрешаю выполнить"
   "Дозволяю виконати"
5. Only after that explicit text confirmation may you run the command, edit the file, or trigger the approval dialog.
6. If you are about to use a terminal command, show the command in a PowerShell code block and explain it line by line in simple language.
7. If the action is only reading files, still explain what will be read and why.
8. Never combine the explanation and the tool call in the same step.
9. If you accidentally trigger an approval dialog before giving a plain-language explanation, stop and apologize, then explain the action before continuing.

Every approval brief must use this exact structure:

### Подтверждение действия

**Что я хочу сделать:**
...

**Зачем это нужно:**
...

**Что будет затронуто:**
...

**Будут ли изменены файлы:**
Да/Нет. Если да — какие именно.

**Команда, если она будет запускаться:**
Покажи команду в отдельном PowerShell code block.

**Что может пойти не так:**
...

**Можно ли откатить:**
...

**Что будет, если ты разрешишь:**
...

**Что будет, если ты откажешь:**
...

**Уровень риска:**
LOW / MEDIUM / HIGH

After writing this approval brief, stop and wait. Do not run the command. Do not edit the file. Do not trigger the approval dialog until the user explicitly writes one of:

Разрешаю выполнить
Дозволяю виконати

If the user is not a technical specialist, prioritize explanation over speed. It is better to ask one extra confirmation than to silently perform a confusing action.

For ПЕРУКАР specifically:
- Do not use deprecated project/product names in user-facing text, docs, code comments, commit messages, or reports.
- The current project root is PERUKAR.
- The official product name is ПЕРУКАР.
- Use perukar only as an internal/lowercase product slug when appropriate.
- Before changing architecture, formulas, colorist logic, client-card logic, or calculation logic, first explain the reason and expected effect.
- Keep all changes small, reversible, and easy to review.

## Додаткові правила для ПЕРУКАР

- Відповідати користувачу українською, якщо користувач пише українською або змішаною українсько-російською мовою.
- Не виконувати `git add`, `commit` або `push` без окремого прямого дозволу користувача.
- Перед зміною бізнес-логіки ПЕРУКАР коротко описувати:
  - яку поведінку застосунку змінить правка;
  - які колористичні сценарії вона зачепить;
  - які ризики може створити.
- Після зміни файлів запускати доступні перевірки:
  - `git status --short`;
  - `git diff --stat`;
  - `node --check` для змінених JS-файлів;
  - `npm test`, якщо в `package.json` є відповідний script;
  - конкретні тестові файли, якщо вони вже існують у проєкті.
- Якщо автоматичних тестів немає, чесно писати: "Автоматичних тестів для цієї частини не знайдено. Проведена тільки доступна перевірка."
- Основні зони підвищеної обережності:
  - логіка розрахунку рецепта;
  - формули;
  - клієнтська картка;
  - блоки ризиків;
  - історія фарбування;
  - розділення зон: корінь, довжина, кінці;
  - попередження про передпігментацію;
  - сценарії виходу з чорного;
  - перевірка відсутніх критичних даних.
- Не додавати декоративні зміни, якщо задача стосується логіки, безпеки або перевірки рецепта.
- Кожна зміна має відповідати питанню: "Чи зменшує це ризик помилки майстра?"

## Правило ізоляції діагностичної третьої зони

Третя зона (кінці) наразі працює виключно у режимі diagnostic-only. Майбутнім агентам СУВОРО ЗАБОРОНЕНО випадково або "для покращення" перетворювати її на production-зону.

Жорсткий контракт (захищений тестами):
1. Third-zone / ends readiness залишається виключно diagnostic-only.
2. Флаги `notForMixing`, `previewOnly`, `candidateOnly` не мають ставати production-рецептом.
3. `productionReady` не має ставати `true` через діагностичні або неповні дані кінців.
4. В production `massModel` має залишатися `2-zone` (поки немає окремого затвердженого контракту для третьої зони).
5. Змінні `formula-to-mix` та `grams` НЕ МАЮТЬ генеруватися для діагностичної третьої зони.

Файли, які захищають цей контракт:
- `test_www_mass_model.js`
- `test_www_render_runtime.js`
- `test_www_mapping.js`

## Правило BLACK-EXIT / темної косметичної бази

- темна косметична root/length база рівня 1-4 при переході у світлішу ціль не має давати automatic `APPROVED`;
- manual path має спрацьовувати не тільки по словах чорн/черн/black/темн, а й по косметичній / ненатуральній історії полотна;
- натуральна темна база не має отримувати false-positive `BLACK-EXIT` тільки через рівень;
- root/length dark cosmetic base covered guard/tests;
- ends/third-zone production path не вмикати без окремого контракту, бо третя зона лишається diagnostic-only;
- тести `BLACK-EXIT-1`, `BLACK-EXIT-COSMETIC-DARK-BASE-NO-MARKER`, `BLACK-EXIT-DARK-COSMETIC-LENGTH` і `BLACK-EXIT-NATURAL-DARK-BASE-NO-FALSE-POSITIVE` мають залишатися захистом контракту.

## Правило Special Blond для бази 6

- Special Blond для base/root level 6 не має ставати автоматичним APPROVED-рецептом;
- якщо система формує Special Blond як кандидата для lift >= 2, base 6 має вимагати MANUAL_REQUIRED;
- Special Blond + 9% для бази 6 дозволений тільки після manual review / brand-specific confirmation / рішення майстра;
- майбутнім агентам заборонено прибирати guard specialBlondBase6NeedsConfirmation без окремого затвердженого рішення;
- тест SB-6-83 у test_www_business_scenarios.js має залишатися захистом цього контракту.

## Правило Special Blond при сивині

- якщо `grey_percent > 0`, `Special Blond` не має ставати автоматичним `APPROVED`;
- система має переводити такий сценарій у `MANUAL_REQUIRED`;
- використання `Special Blond` при сивині дозволене тільки після manual review / brand-specific confirmation / рішення майстра;
- guard `specialBlondWithGreyNeedsConfirmation` не можна прибирати без окремого затвердженого рішення;
- тести `GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED` і `GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED` мають залишатися захистом контракту;
- логіка автоматичного додавання `.00` для 10–30% сивини НЕ входить у цей контракт і має вирішуватися окремо.

## Правило 30% сивини при Перманенті

- при `grey_percent = 30` і процесі `Перманент` система НЕ має автоматично додавати `.00` базу;
- для м’якої сивини 30% сценарій може залишатися `APPROVED`, але має містити warning про можливу прозорість / недостатнє покриття і потребу розглянути `.00` базу;
- для скловидної сивини 30% сценарій має переходити у `MANUAL_REQUIRED`;
- warning про мордонсаж має зберігатися для скловидної сивини;
- автоматичне додавання `.00` для 30% сивини заборонено без окремого затвердженого бізнес-рішення;
- логіку `grey >= 50` з автоматичною базою `.00` не змішувати з контрактом 30%;
- тести `GREY-30-PERMANENT-SOFT-WARNING` і `GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED` мають залишатися захистом контракту.

## Правило передпігментації при значному затемненні

- передпігментація / заповнення пігменту має вимагатися при затемненні довжини або кінців на 3+ рівні тільки якщо довжина/кінці мають косметичну, освітлену або іншу ненатуральну історію;
- натуральний `root_level` не має сам по собі активувати prepig-guard;
- натуральна довжина/кінці не мають отримувати false-positive `MANUAL_REQUIRED` тільки через математичну різницю рівнів;
- сценарії типу освітлена довжина 10 → 6 або 8 → 4 мають залишатися `MANUAL_REQUIRED`;
- сценарій натуральна довжина 7 → 4 не має отримувати prepig-warning тільки через різницю рівнів;
- guard `significantDarkeningNeedsPrepig` не можна спрощувати до простої перевірки `(level - target) >= 3` без історії полотна;
- тести `PREPIG-10-6`, `ENDS-10-6-PREPIG`, `PREPIG-8-4` і `ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE` мають залишатися захистом контракту.

## Правило HENNA / METALS

- history з хною / henna / металом / metal / metallic / salts / солями не має давати automatic APPROVED;
- для lift, Special Blond, окисних процесів і тонування мінімум MANUAL_REQUIRED або BLOCKED;
- approved-recipe не має рендеритись без ручного рішення;
- ends/third-zone production path не вмикати без окремого контракту;
- тести HENNA-METALS-ROOT-LIFT-NO-APPROVED, HENNA-METALS-SPECIAL-BLOND-NO-APPROVED, HENNA-METALS-TONING-MANUAL-MINIMUM мають залишатися захистом контракту.

## Правило DAMAGE / POROSITY / ELASTICITY

- high damage / сильне пошкодження / критичне пошкодження не має давати automatic APPROVED для lift, powder, Special Blond або високого оксиду;
- root_condition має реальне UI-поле `#root_condition`;
- length_condition має реальне UI-поле `#length_condition`;
- root damaged + root lift / powder / Special Blond не має давати automatic APPROVED;
- approved-recipe заборонений для root damaged + root lift / powder / Special Blond;
- мінімальна поведінка для root damaged + root lift / powder / Special Blond: MANUAL_REQUIRED;
- BLOCKED не вводиться цим root damaged guard;
- bare `damage` / `root_condition damage label` не має трактуватись як root damage без явного root damage marker;
- healthy / normal / здоровий / нормальний корінь не має давати false-positive;
- length_condition поки не має окремого production guard;
- high porosity / висока пористість тепер має реальне UI-поле `#porosity`;
- Special Blond + high porosity не має давати automatic APPROVED;
- approved-recipe заборонений для Special Blond + high porosity;
- мінімальна поведінка для Special Blond + high porosity: MANUAL_REQUIRED;
- bare `porosity` / `пористість` не має трактуватись як high porosity без явного high-risk маркера;
- `normal` / `good` / `low` / `medium` / `нормальна пористість` / `низька пористість` / `середня пористість` не мають давати false-positive;
- high porosity / пористе полотно має мінімум MANUAL_REQUIRED при хімічному процесі;
- brittle / ламкі кінці або критично пошкоджені кінці мають блокувати або вимагати ручного рішення для освітлення;
- low elasticity / низька еластичність тепер має реальне UI-поле `#elasticity`;
- значення `low` / `weak` / `poor` / `низька` / `слабка` / `погана` / `тягнеться` мають переводити сценарій у MANUAL_REQUIRED;
- `normal` / `good` / `нормальна еластичність` не має давати false-positive;
- automatic APPROVED і approved-recipe заборонені для low elasticity сценаріїв;
- warning-only не достатній для high-risk lift-сценаріїв;
- тести `ROOT-DAMAGED-POWDER-NO-APPROVED`, `ROOT-DAMAGED-SPECIAL-BLOND-NO-APPROVED`, `ROOT-HEALTHY-LENGTH-DAMAGED-NO-ROOT-FALSE-POSITIVE`, `ROOT-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE`, `ROOT-CONDITION-BARE-DAMAGE-LABEL-TEXT-NO-FALSE-POSITIVE`, `ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED` мають залишатися захистом контракту;
- тести `SPECIAL-BLOND-HIGH-POROSITY-NO-APPROVED`, `SPECIAL-BLOND-POROUS-LENGTH-NO-APPROVED`, `SPECIAL-BLOND-NORMAL-POROSITY-NO-FALSE-POSITIVE`, `SPECIAL-BLOND-BARE-POROSITY-NO-FALSE-POSITIVE`, `SPECIAL-BLOND-BARE-UKR-POROSITY-NO-FALSE-POSITIVE`, `NON-SPECIAL-BLOND-HIGH-POROSITY-MANUAL-CONSISTENCY` мають залишатися захистом контракту;
- тести `ELASTICITY-LOW-LIFT-NO-APPROVED`, `ELASTICITY-LOW-SPECIAL-BLOND-NO-APPROVED`, `ELASTICITY-LOW-TONING-MANUAL-MINIMUM`, `ELASTICITY-NORMAL-LIFT-NO-FALSE-POSITIVE` мають залишатися захистом контракту;
- тести ENDS-DAMAGED-LIFT, ENDS-CONDITION-POROUS-LIFT, ENDS-CONDITION-BRITTLE-HIGH-LIFT, ENDS-CONDITION-DAMAGED-CHEMISTRY мають залишатися захистом контракту;
- Примітка: загальний damage matrix ще не повністю покритий, існують gaps.

## Правило виконання малих дозволених задач

Якщо користувач дає конкретну задачу або промпт для малої контрольованої дії, агент має виконувати її одразу без повторного питання "Дозволяю виконати?", якщо виконуються всі умови:

- рівень ризику LOW;
- зміна стосується тільки явно названого файлу або тільки одного документа правил;
- немає видалення файлів;
- немає перейменування файлів;
- немає переміщення файлів;
- немає змін бізнес-логіки розрахунків;
- немає запуску команд із доступом до мережі;
- немає встановлення пакетів;
- немає git add / commit / push;
- немає змін поза коренем репозиторію PERUKAR;
- дія легко перевіряється через git diff.

Для таких LOW-задач агент має:
1. коротко повідомити, що виконує дію;
2. виконати дію;
3. показати git diff для зміненого файлу;
4. показати git status --short;
5. не питати додаткового дозволу перед самою дією.

Обов’язкове окреме підтвердження все ще потрібне для:

- git add;
- commit;
- push;
- видалення файлів;
- перейменування файлів;
- переміщення файлів;
- зміни бізнес-логіки розрахунків;
- зміни формул;
- зміни структури даних;
- встановлення пакетів;
- доступу до мережі;
- змін поза робочою папкою PERUKAR;
- будь-якого HIGH-ризику.

Якщо ризик MEDIUM — агент має коротко пояснити дію і чекати підтвердження.

Якщо ризик HIGH — агент має зупинитися, описати ризики і чекати окремого прямого дозволу.

## Правило явного дозволу на commit

Якщо користувач прямо просить зробити commit, вказує конкретний файл або конкретні файли, і вказує commit message, це вважається прямим дозволом на цей commit. У такому випадку не треба повторно питати "Дозволяю виконати?".

Перед commit агент все одно зобов’язаний:
- перевірити `git diff --cached --name-only`;
- якщо staged порожній — додати тільки явно названі файли;
- якщо staged містить щось крім дозволених файлів — зупинитися і commit не робити;
- не використовувати `git add .`;
- не робити `push`;
- після commit показати `git status --short` і `git log --oneline -1`.

Це правило не дозволяє автоматично робити commit, якщо:
- користувач не назвав конкретні файли;
- користувач не дав commit message;
- staged містить зайві файли;
- зміни стосуються бізнес-логіки, формул або структури даних без окремого підтвердження.

## Режим точного виконання задач від користувача

Якщо користувач дає конкретне завдання з явними файлами, умовами, обмеженнями або commit message, агент має виконувати завдання одразу без додаткових уточнень і без повторного питання "Дозволяю виконати?".

У цьому режимі агент зобов’язаний:

- виконувати тільки те, що прямо написано;
- не додавати власні покращення;
- не розширювати задачу;
- не міняти інші файли;
- не проводити зайву діагностику, якщо користувач просить створити файл або виконати конкретну дію;
- не повторювати вже виконаний аналіз;
- не ставити уточнюючі питання, якщо завдання можна виконати безпечно;
- якщо є незначна неоднозначність, обрати найменшу безпечну дію в межах запиту;
- після виконання дати короткий звіт: що зроблено, які файли змінено, які перевірки пройшли, який git status.

Якщо користувач передає prompt від ChatGPT або інший готовий текст із чіткими інструкціями, це вважається прямою командою до виконання, а не темою для обговорення.

Агент має питати додаткове підтвердження тільки якщо дія включає:

- видалення файлів;
- перезапис існуючого важливого файла;
- перейменування або переміщення файлів;
- push;
- встановлення пакетів;
- доступ до мережі;
- зміну файлів поза коренем репозиторію PERUKAR;
- зміну бізнес-логіки, якщо користувач не дав прямого дозволу саме на зміну бізнес-логіки;
- суперечливі інструкції, які неможливо виконати одночасно.

Для commit:

Якщо користувач прямо просить зробити commit, вказує конкретні файли і commit message, агент має виконати commit без повторного підтвердження, але перед цим обов’язково:

- додати тільки явно названі файли;
- перевірити `git diff --cached --name-only`;
- якщо staged містить зайві файли — зупинитися;
- не використовувати `git add .`;
- після commit показати `git status --short` і `git log --oneline -1`.

Для документації:

Якщо користувач просить створити конкретний docs-файл і дає його зміст або структуру, агент має створити файл одразу, без повторної діагностики.

Заборонено замість створення файла знову проводити аналіз, якщо задача прямо сформульована як "створи файл".

## Режим роботи через користувача-передавача

Користувач часто передає агенту готові задачі, сформовані ChatGPT. У такому режимі користувач не є технічним координатором і не повинен відповідати на проміжні технічні уточнення.

Якщо задача містить:
- конкретну мету;
- дозволені файли;
- заборонені файли;
- перевірки;
- commit message або умови без commit;
- очікуваний формат звіту,

агент має виконувати задачу в межах цих інструкцій без додаткових уточнень до користувача.

Агент не має питати користувача:
- який варіант обрати, якщо безпечний варіант уже описаний у prompt;
- чи можна виконати read-only діагностику в межах репозиторію;
- чи можна змінити явно дозволений файл;
- чи можна зробити commit, якщо користувач прямо вказав файли й commit message;
- чи можна продовжувати, якщо наступна дія прямо описана в prompt.

Якщо під час виконання виникла неоднозначність, агент має діяти так:

1. Якщо є безпечний мінімальний варіант у межах дозволених файлів — виконати його.
2. Якщо потрібна зміна файла, який не був дозволений — не питати користувача в середині процесу, а зупинитись і дати звіт:
   - що хотів змінити;
   - чому це потрібно;
   - який файл виходить за межі дозволу;
   - які є варіанти;
   - що рекомендується.
3. Якщо дія небезпечна — зупинитись і дати звіт, без виконання.
4. Якщо task неможливо виконати через permission error або sandbox — зупинитись і дати точний технічний звіт, без спроб самостійно ремонтувати права.

Агент має питати підтвердження тільки для:
- видалення файлів;
- перезапису існуючих важливих файлів;
- перейменування або переміщення файлів;
- push;
- встановлення пакетів;
- доступу до мережі;
- зміни файлів поза PERUKAR;
- зміни бізнес-логіки, якщо prompt прямо не дозволив зміну бізнес-логіки;
- ситуації, коли потрібно змінити файл, який не входить у список дозволених.

Якщо потрібна дія виходить за межі дозволу, агент не має ставити коротке питання "дозволяєш?". Він має дати повний звіт для передачі назад ChatGPT.

Після виконання задачі агент має повернути:
- що зроблено;
- які файли змінено;
- які перевірки запущено;
- результати перевірок;
- git status --short;
- чи потрібен наступний commit або чи commit уже виконано.

## Autonomous bounded execution

Якщо prompt містить режим `AUTONOMOUS BOUNDED TASK EXECUTION`, агент має право самостійно виконати повний цикл:

preflight → implementation → validation → commit → audit → documentation → final report.

Це дозволено тільки в явно вказаному scope задачі.

Агент не має права:

- змінювати файли поза allowed scope;
- робити `git add .`;
- робити `push`;
- переходити до наступної фічі;
- створювати debug/temp files;
- додавати `console.log` або debug output;
- залишати skipped/failing tests;
- ігнорувати test failure;
- продовжувати після mode violation;
- запускати Update Topic Context;
- питати користувача між підкроками, якщо дія входить у allowed scope.

При будь-якому FAIL, dirty unexpected state, forbidden changes, test failure або mode violation агент зупиняється і дає structured report:

- STATUS;
- changed files;
- failed command;
- risk;
- recommendation.

Preflight для автономного режиму:

1. `git status --short`
2. `git log --oneline -3`
3. Якщо repo не clean — STOP, нічого не змінювати, дати DIRTY report.

Validation для JS/runtime задач:

1. `node --check www/core.js`
2. `node --check test_www_business_scenarios.js`
3. `node test_www_business_scenarios.js`
4. `node --check test_www_mass_model.js`
5. `node test_www_mass_model.js`
6. `node --check test_www_mapping.js`
7. `node test_www_mapping.js`
8. `node --check test_www_render_runtime.js`
9. `node test_www_render_runtime.js`
10. `git diff --check`

Commit policy:

- stage тільки явно allowed files;
- `git add .` заборонено;
- перед commit обов’язково виконати `git diff --cached --name-only`;
- commit дозволений тільки якщо staged files входять у allowed scope.

Audit після commit:

1. `git status --short`
2. `git show --stat --oneline HEAD`
3. `git show --name-only --oneline HEAD`

Після audit:

- якщо audit PASS і docs потрібні — агент може зробити окремий docs commit, якщо docs входять у allowed autonomous scope;
- якщо docs не потрібні — явно написати `docs not required`.

Final report format:

```text
STATUS: PASS / FAIL
changed files:
staged files:
commit hash:
git status:
runtime changed:
tests changed:
docs changed:
tests:
risk:
recommendation:
```
