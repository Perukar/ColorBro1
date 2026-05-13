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
