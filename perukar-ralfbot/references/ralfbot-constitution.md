# RALFBOT Constitution (детальний reference)

Важкий довідник режиму RALFBOT для PERUKAR. CLAUDE.md і AGENTS top-block — короткі; повні протоколи й приклади тут. Усе узгоджено зі скілом `perukar-ralfbot/SKILL.md`.

## Зміст
1. Режими (A–F)
2. Політика переривання користувача
3. Протоколи станів (dirty / root / HEAD / index.lock / conflict / LOCKED / test failure)
4. Commit gate protocol
5. Повна матриця тестів
6. Branch policy
7. Hard STOP список
8. Приклади звітів

---

## 1. Режими

**A. read-only audit** — перевірити стан/diff/історію/тести. Жодних змін файлів. Без підтвердження. Дефолт при будь-якому сумніві.

**B. implementation** — зміни коду **лише** в межах Allowed files. Перед стартом — clean repo, ясний scope. Кожна правка має бути пояснена в scope. Без переривання користувача на кожну правку (зміни оборотні до commit).

**C. recovery** — розбір наслідків збою попереднього агента/процесу. Спершу повний read-only audit, реконструкція що сталося, лише потім план відновлення. Нічого деструктивного без дозволу.

**D. commit** — застейджити й закомітити **готові, перевірені** зміни. Тільки після Commit gate (вкл. явне `Commit: yes`).

**E. documentation** — зміни docs. **Не** чіпати LOCKED-доки (`AGENTS.md`, `docs/LOGIC_LOCKED/`, `docs/AGENTS_LOCKED/`) без явного Allowed-дозволу.

**F. unknown mode** — задача неясна. **Не питати одразу.** Послідовність: (1) read-only preflight/audit; (2) класифікувати, що вже відомо; (3) поставити **щонайбільше одне** точне питання — лише якщо лишилось реальне рішення, яке без користувача не закрити.

---

## 2. Політика переривання користувача

Read-only перевірки виконуй **без підтвердження**. Переривай користувача **тільки** для:
1. схвалення commit;
2. конфлікту бізнес-логіки;
3. зміни LOCKED-файлу, якої немає в Allowed files;
4. ручного видалення **stale** `index.lock` або рішення щодо схваленого bootstrap-скрипта;
5. деструктивної git-дії;
6. повторного провалу тестів після **максимум 2** безпечних спроб у межах scope.

Усе інше — мовчазно й по конвеєру.

---

## 3. Протоколи станів

### Dirty repo
Тригер: `git status --short` непорожній перед **новою implementation-задачею**.
Дія: **STOP**, режим A — DIRTY STATE SCOPE AUDIT. Описати: що змінено, чи входить у поточний scope, чиє це (твоє/попереднього агента). Нову імплементацію **не починати**, поки стан не прояснено.

### Root mismatch
Тригер: очікуваний root задачі ≠ `git rev-parse --show-toplevel`.
Дія: **STOP / ROOT MISMATCH AUDIT**. Не дій у «не тому» репо. Запит: підтвердити правильний root.

### HEAD mismatch
Тригер: очікуваний HEAD ≠ `git rev-parse HEAD` (звірити з `git log --oneline -5`).
Дія: **STOP / HEAD MISMATCH AUDIT**. Запит: підтвердити очікуваний HEAD/гілку.

### index.lock
- `.git/index.lock` є **+ активний git-процес** → **STOP** (паралельний/активний процес).
- `.git/index.lock` є **+ активного процесу немає** → **stale lock candidate**. Скіл/агент **сам lock не видаляє**. Варіанти: (а) попросити **одну** ручну дію користувача, або (б) покластися на **явно схвалений** bootstrap-скрипт зі stale-lock removal logic (блок C).
- У звичайному потоці lock **не видаляти тихо**.

### AGENTS.md / LOCKED conflict
- vs **брудні** (uncommitted) тести → **AGENTS.md / LOCKED виграють**; брудні тести трактувати як підозрілі до явного схвалення.
- vs **закомічені** тести → **STOP / PROCESS FAIL** (контракт проти контракту — рішення лише з людиною).
Приклад класу: `BRAND-MISSING-* NO-APPROVED` не має тихо ставати `BRAND-GENERIC-* ADVISORY-APPROVED`.

### LOCKED file change
Дозволено лише якщо одночасно: файл у **Allowed files**; scope називає навіщо; повна матриця тестів; diff audit; commit gate. Інакше → **STOP**. Перелік LOCKED — `references/locked-files-and-git-policy.md`.

### Test failure
Тест FAIL → щонайбільше **2 безпечні спроби** виправлення **в межах scope** (без розширення scope, без правки LOCKED, без деструктиву). Якщо після 2 спроб усе ще FAIL → **STOP** і звіт користувачу з причиною.

---

## 4. Commit gate protocol

Усе одночасно:
1. recovery/diff audit = PASS;
2. повна матриця тестів = PASS;
3. `git diff --check` = PASS (окрема команда; whitespace/conflict-маркери);
4. усі змінені файли — в scope;
5. `git diff --cached --name-only` порожній **перед** стейджингом;
6. **Approved commit file list** = точний перелік файлів саме для цього commit; ⊆ Allowed files;
7. після стейджингу застейджене **точно = Approved commit file list** (не обов'язково весь Allowed list);
8. користувач явно дав `Commit: yes`.
**Не запускати `git add` до `Commit: yes`.** До `Commit: yes` максимальний вихід — `Ready for commit gate: yes` (без стейджингу/коміту). Стейдж лише точні шляхи з Approved list. One task = one commit. Push — ніколи.

---

## 5. Повна матриця тестів (окремо, без `&&` / `;`)

```
node --check www/core.js
node --check test_www_business_scenarios.js
node --check test_www_mass_model.js
node --check test_www_mapping.js
node --check test_www_render_runtime.js
node test_www_business_scenarios.js
node test_www_mass_model.js
node test_www_mapping.js
node test_www_render_runtime.js
```

---

## 6. Branch policy

- Push у main — заборонений **завжди**.
- Автономне перемикання гілок — **заборонено**.
- Поточна гілка = `main` і задача impl/commit → продовжуй **тільки** з явним дозволом працювати на поточній гілці; інакше **STOP** з одним запитом: `Confirm working on current branch or provide branch policy.`
- **Ніколи** не створюй/не перемикай гілки через `git checkout` / `git switch` без явного дозволу.

---

## 7. Hard STOP список

root mismatch · HEAD mismatch · `index.lock` з активним процесом · stale `index.lock` без схваленої bootstrap-поведінки · staged files перед задачею · dirty repo перед новою імплементацією · файл поза scope · AGENTS.md/LOCKED конфлікт із **закоміченими** тестами · правка LOCKED без Allowed files · `git add .` · `git add -A` · `git add --all` · `push` · `reset`/`restore`/`checkout`/`switch`/`clean`/`stash` без дозволу · тести FAIL після ≤2 безпечних спроб.

---

## 8. Приклади звітів

### Приклад D — STOP (dirty repo)
```
STATUS: BLOCKED

Repo root: D:/PERUKAR
HEAD: a1b2c3d (feat: timing-zone)
Git status: dirty (3 modified, 0 staged)
Changed files: www/core.js, test_www_mass_model.js, notes.txt
Staged files: (none)
Task scope: "додати GenericBrandRules"
Allowed files: www/core.js
Files outside scope: test_www_mass_model.js, notes.txt
Tests run: (none — STOP до аудиту)
Tests PASS/FAIL: n/a
Process violations: dirty repo перед новою імплементацією; зміни поза scope; зачеплено LOCKED-тест
Recommended next action: DIRTY STATE SCOPE AUDIT — підтвердити, чиї зміни в test_www_mass_model.js і notes.txt, перш ніж починати
Risks: брудний LOCKED-тест може приховувати послаблення контракту
```

### Приклад B — IMPLEMENTATION PLAN (clean)
```
STATUS: PASS

Repo root: D:/PERUKAR
HEAD: a1b2c3d
Git status: clean
Changed files: (none yet)
Staged files: (none)
Task scope: "додати GenericBrandRules у core"
Allowed files: www/core.js
Files outside scope: (none)
Tests run: повна матриця заплановано після правки
Tests PASS/FAIL: pending
Process violations: (none)
Recommended next action: реалізувати лише в www/core.js → прогнати матрицю → diff audit
Risks: зачіпає color-logic → перевірити third-zone leak / productionReady інваріанти
```

### Приклад C — COMMIT PLAN
```
STATUS: PASS

Repo root: D:/PERUKAR
HEAD: a1b2c3d
Git status: 1 modified (www/core.js)
Changed files: www/core.js
Staged files: (none — index порожній перед стейджингом)
Task scope: "додати GenericBrandRules у core"
Allowed files: www/core.js
Files outside scope: (none)
Tests run: повна матриця (9 команд, окремо)
Tests PASS/FAIL: PASS
Process violations: (none)
Recommended next action: Ready for commit gate: yes — чекати "Commit: yes", тоді git add www/core.js → один commit
Risks: (none) — git add НЕ виконується до явного схвалення
```
