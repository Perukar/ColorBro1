# PERUKAR RALFBOT — BACKLOG EXAMPLE (queue of bounded tasks)

> Це **черга обмежених задач**. RALFBOT бере одну, виконує через конвеєр, зупиняється. Не автопілот.

---

## PRK-001 — READONLY_AUDIT — Dirty state scope audit
- Mode: READONLY_AUDIT
- Context: `git status` показав модифікації перед новою задачею; походження неясне.
- Goal: описати кожен dirty/staged/untracked файл, чи входить у scope наступної задачі, чи це залишки попереднього агента.
- Non-goals: не редагувати, не стейджити, не комітити, не запускати деструктив.
- Expected repo root: D:/PERUKAR · Expected HEAD: current HEAD accepted after preflight
- Branch policy: read-only
- Allowed files: [] · Forbidden files: усі (запис заборонено)
- LOCKED involved: no (read-only огляд)
- Source-of-truth: AGENTS.md, committed tests, www/core.js
- Required tests: n/a (read-only)
- Commit allowed: no · Approved list: n/a
- Stop conditions: будь-яка спроба правки/стейджингу → STOP
- DoD: виданий STATUS-звіт + рекомендована наступна дія

## PRK-002 — IMPLEMENTATION — Fix one specific test regression
- Mode: IMPLEMENTATION
- Context: `node test_www_mass_model.js` падає на сценарії MM-014 після останньої правки.
- Goal: усунути саме регрес MM-014, не змінюючи іншу логіку.
- Non-goals: не чіпати timing, brand matrix, render/runtime; не рефакторити.
- Expected repo root: D:/PERUKAR · Expected HEAD: current HEAD accepted after preflight
- Branch policy: поточна гілка дозволена (підтверджено); push/main — ніколи
- Allowed files: [ www/core.js ] · Forbidden files: усе поза Allowed
- LOCKED involved: yes — www/core.js. WHY: фікс регресу в production-логіці, що покривається mass-model тестом.
- Source-of-truth: AGENTS.md, test_www_mass_model.js (committed)
- Required tests: ПОВНА матриця + git diff --check (safety-sensitive: mass model)
- Commit allowed: no   ← цього разу лише довести до зеленої матриці
- Approved list: n/a (Commit: no → зупинка на "Ready for commit gate: yes")
- Stop conditions: зміни поза www/core.js; матриця FAIL після ≤2 безпечних спроб
- DoD: матриця PASS; виведено "Ready for commit gate: yes"; нічого не закомічено

## PRK-003 — COMMIT_GATE — Commit already-verified changes
- Mode: COMMIT_GATE
- Context: PRK-002 завершено, матриця зелена, користувач готовий комітити.
- Goal: закомітити саме перевірену зміну в core.js одним commit.
- Non-goals: жодних нових правок коду; push заборонено.
- Expected repo root: D:/PERUKAR · Expected HEAD: <HEAD з PRK-002>
- Branch policy: поточна гілка дозволена; push/main — ніколи
- Allowed files: [ www/core.js ] · Forbidden files: усе поза Allowed
- LOCKED involved: yes — www/core.js (вже змінено й перевірено в PRK-002)
- Source-of-truth: committed tests + AGENTS.md
- Required tests: ПОВНА матриця + git diff --check (повторно, перед commit)
- Commit allowed: yes
- Approved commit file list: [ www/core.js ]   (⊆ Allowed; staged стане == цьому)
- Commit message: "fix: resolve MM-014 mass-model regression"
- Stop conditions: index не порожній до стейджингу; staged != approved; матриця FAIL
- DoD: один commit зроблено; staged == approved; push НЕ робився

## PRK-004 — LOCKED_DOC_UPDATE — Update AGENTS.md / LOGIC_LOCKED contract
- Mode: LOCKED_DOC_UPDATE
- Context: рішення посилити правило Grey + Special Blond → завжди MANUAL_REQUIRED.
- Goal: оновити контракт в AGENTS.md і відповідний інваріант + узгодити тест.
- Non-goals: не чіпати інші бренд-правила; не послаблювати інші ворота.
- Expected repo root: D:/PERUKAR · Expected HEAD: <конкретний HEAD>
- Branch policy: поточна гілка лише з явним дозволом; push/main — ніколи
- Allowed files: [ AGENTS.md, docs/LOGIC_LOCKED/brand_rules.md, www/core.js, test_www_business_scenarios.js ]
- Forbidden files: усе поза Allowed
- LOCKED involved: yes — усі чотири. WHY: контрактна зміна safety-правила Grey+Special Blond.
- Source-of-truth: AGENTS.md / docs/LOGIC_LOCKED (верх пріоритету) + committed tests
- Required tests: ПОВНА матриця + git diff --check (safety-sensitive: grey, Special Blond, MANUAL_REQUIRED)
- Commit allowed: yes (після узгодження контракту + тесту)
- Approved commit file list: [ AGENTS.md, docs/LOGIC_LOCKED/brand_rules.md, www/core.js, test_www_business_scenarios.js ]
- Commit message: "contract: Grey + Special Blond -> MANUAL_REQUIRED"
- Stop conditions: AGENTS.md ↔ committed tests конфлікт → STOP; послаблення без оновлення контракту → STOP
- DoD: контракт+тест узгоджені; матриця PASS; один commit; інваріант не послаблено «тихо»

## PRK-005 — CLEANUP — Archive legacy root core.js ONLY after audit
- Mode: CLEANUP
- Context: у корені залишився застарілий `core.js` (не `www/core.js`); підозра на дубль.
- Goal: **спершу** read-only інвентар, тоді — лише за явним дозволом — архівувати legacy-файл (перемістити в `archive/`), НЕ видаляти.
- Non-goals: НЕ видаляти snapshots/old docs/archives/patch/legacy без окремого inventory + явного дозволу; не чіпати www/core.js.
- Expected repo root: D:/PERUKAR · Expected HEAD: current HEAD accepted after preflight
- Branch policy: поточна гілка лише з явним дозволом; push/main — ніколи
- Allowed files: [ core.js, archive/ ]   (переміщення, не видалення)
- Forbidden files: www/core.js, усі test_www_*.js, docs/LOGIC_LOCKED/**, docs/AGENTS_LOCKED/**
- LOCKED involved: no (root `core.js` ≠ LOCKED `www/core.js`) — але підтвердити, що це справді не www/core.js
- Source-of-truth: AGENTS.md (чи згадується legacy-файл будь-де)
- Required tests: матриця після переміщення (переконатися, що нічого не залежало від legacy-файлу)
- Commit allowed: no (окрема картка COMMIT_GATE після підтвердження)
- Approved list: n/a
- Stop conditions: будь-яке видалення замість архівації → STOP; зачеплено www/core.js → STOP; немає явного дозволу на архівацію → лишитися на inventory
- DoD: read-only inventory виданий; (за дозволом) файл переміщено в archive/; матриця PASS; нічого не видалено
