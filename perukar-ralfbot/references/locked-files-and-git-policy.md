# LOCKED-файли та git-політика PERUKAR

Детальний довідник для режиму RALFBOT. SKILL.md тримає робочий процес; сюди винесено важкі переліки.

## 1. LOCKED / критичні файли

Файли-контракти (логіка й тести):
- `www/core.js`
- `test_www_business_scenarios.js`
- `test_www_mass_model.js`
- `test_www_render_runtime.js`
- `test_www_mapping.js`

Доки-конституції:
- `AGENTS.md`
- `docs/LOGIC_LOCKED/` (вся папка)
- `docs/AGENTS_LOCKED/` (вся папка)

### Що означає LOCKED

LOCKED **не** означає «ніколи не редагувати». Означає, що редагувати дозволено **тільки** за всіх умов одночасно:
- файл явно перелічений у **Allowed files** поточної задачі;
- scope задачі чітко називає, **навіщо** його змінюють;
- обов'язкові тести (повна матриця) + diff audit;
- діє Commit gate (включно з явним схваленням користувача).

Будь-яка правка LOCKED поза цими умовами → **STOP / PROCESS FAIL**.

Чому: ці файли визначають безпеку й контракт продукту. Тиха правка тут = тихий регрес у логіці кольору або у правилах роботи агентів. Зміна LOCKED-файлу майже завжди має супроводжуватися відповідним оновленням тестів і/або LOCKED docs.

Як перевіряти, чи зміна зачіпає LOCKED:
```
git diff --name-only
git diff --cached --name-only
```
Якщо у виводі є LOCKED-шлях, а задача не дозволяє його явно → STOP.

## 2. Git-операції: дозволено / заборонено

### Read-only (без підтвердження)
```
git status
git status --short
git diff
git diff --name-only
git diff --cached --name-only
git log --oneline -15
git grep <pattern>
git rev-parse --show-toplevel
git rev-parse HEAD
```
Плюс read-only перевірки файлів: `Test-Path`, `Get-ChildItem` (Windows), `node --check`, `node test_*.js`.

### Дозволено з умовами
- `git add exact/path` — лише точні шляхи з Allowed files; **ніколи** `.`/`-A`/`--all`.
- `git commit` — лише після повного Commit gate (див. SKILL.md), включно з явним схваленням користувача.

### Заборонено в межах режиму
- `git push` — **ніколи**. Push у `main` заборонений завжди. Окремий явний запит на push = інша задача поза режимом.
- Робота напряму в `main`: дозволена **тільки** з явного дозволу користувача працювати на поточній гілці; інакше STOP із запитом політики гілок.
- Автономне створення/перемикання гілок (`git checkout` / `git switch`) — заборонено без явного дозволу.

### Заборонено без прямого дозволу (деструктивні)
- `git reset`, `git restore`, `git checkout` (зміна стану дерева/гілок), `git switch`, `git clean`, `git stash`, `rm`/`del` важливих файлів.

Чому окремо: ці команди можуть незворотньо знищити незакомічену роботу. Дозвіл має бути **прямим і явним** саме на цю дію.

## 3. Детектування проблемних станів

### Dirty repo
```
git status --short
```
Непорожній вивід перед **новою implementation-задачею** = dirty → **DIRTY STATE SCOPE AUDIT** (read-only). Імплементацію не починати, поки стан не прояснено.

### Root mismatch
```
git rev-parse --show-toplevel
```
Розбіжність з очікуваним root → **STOP / ROOT MISMATCH AUDIT**.

### HEAD mismatch
```
git rev-parse HEAD
git log --oneline -5
```
Розбіжність з очікуваним HEAD → **STOP / HEAD MISMATCH AUDIT**.

### index.lock (узгоджена політика)
Скіл **сам ніколи не видаляє** `.git/index.lock`.
- `index.lock` **є** + є активний git-процес → **STOP** (паралельний/активний процес).
- `index.lock` **є** + активного git-процесу немає → класифікувати як **stale lock candidate**: або попросити **одну** ручну дію користувача, або покластися на **явно схвалений** bootstrap-скрипт зі stale-lock removal logic (блок C).
- У звичайному потоці скіла lock **не видаляти тихо**.

## 4. Recovery / diff audit (перед commit)

1. `git diff --name-only` + `git diff --cached --name-only` — звірити фактичні зміни зі scope.
2. Переконатися: немає файлів поза scope й немає LOCKED-файлів поза умовами LOCKED-політики.
3. Прогнати **повну** матрицю тестів (див. SKILL.md).
4. Інтерпретувати результат у межах пріоритету джерел правди (committed > dirty; LOCKED docs / AGENTS.md — найвищі).
5. Тільки якщо все PASS і staged-список точно збігається з Allowed files — переходити до Commit gate.

Будь-яка розбіжність → не commit, а звіт зі STATUS: BLOCKED / FAIL і переліком розбіжностей.
