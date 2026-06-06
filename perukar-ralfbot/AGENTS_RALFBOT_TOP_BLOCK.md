<!--
  RALFBOT TOP BLOCK — встав цей блок НА ПОЧАТОК існуючого AGENTS.md.
  Це не заміна AGENTS.md. Це короткий guard-блок поверх нього.
  (Вставку робити окремою дозволеною задачею; зараз файл — лише шаблон.)
-->

# ⛔ RALFBOT — обов'язковий режим для задач PERUKAR

Будь-яка задача в PERUKAR виконується в режимі **RALFBOT** (див. скіл `perukar-ralfbot` / `CLAUDE.md`). Конвеєр: **preflight → audit → scoped implementation → tests → diff audit → commit gate**.

**Дозволи / заборони:**
- Read-only перевірки (`git status/diff/log/grep`, `node --check`, `node test_*.js`, `Test-Path`, `Get-ChildItem`) — **без підтвердження**.
- Dirty repo перед новою імплементацією → **STOP + DIRTY STATE SCOPE AUDIT**.
- **Ніякого** `git add .` / `-A` / `--all` — тільки `git add exact/path`.
- **Ніякого** `push`.
- Деструктив (`reset`/`restore`/`checkout`/`switch`/`clean`/`stash`) — **тільки з прямим дозволом**.
- LOCKED-файли — лише якщо явно в **Allowed files** задачі.
- Commit — **лише** після PASS diff audit, `git diff --check` PASS і явного `Commit: yes`. Approved commit file list ⊆ Allowed files; застейджене точно = Approved list. Не `git add` до `Commit: yes` (макс. вихід до того — `Ready for commit gate: yes`).

**Пріоритет джерел правди:**
1. AGENTS.md / docs/LOGIC_LOCKED / docs/AGENTS_LOCKED
2. закомічені тести
3. `www/core.js`
4. брудний diff — не джерело правди до audit + commit gate

**Конфлікти:**
- AGENTS.md ↔ **брудні** тести → **AGENTS.md виграє** (брудні тести підозрілі).
- AGENTS.md ↔ **закомічені** тести → **STOP / PROCESS FAIL**.

**Матриця тестів** (окремо, без `&&`/`;`): `node --check` на `www/core.js` + усіх 4 тест-файлах, далі прогін `business_scenarios`, `mass_model`, `mapping`, `render_runtime`. Повний список — у `CLAUDE.md` / `references/ralfbot-constitution.md`.
