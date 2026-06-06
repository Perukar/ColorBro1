# PERUKAR RALFBOT — TASK CARD (READONLY_AUDIT)

<!-- Read-only. Жодних правок файлів, жодного стейджингу, жодного commit. Підтвердження не потрібне. -->

1. Task ID:                 PRK-RO-XXX
2. Task title:              <!-- напр. "Dirty state scope audit" -->
3. Mode:                    READONLY_AUDIT
4. Context:                 <!-- чому аудит: dirty repo / незрозумілий стан / pre-implementation -->
5. Goal:                    <!-- що саме з'ясувати; напр. "описати, чиї зміни в working tree і чи входять у scope" -->
6. Non-goals:               Не редагувати. Не стейджити. Не комітити. Не запускати деструктив.
7. Expected repo root:      D:/PERUKAR
8. Expected HEAD:           current HEAD accepted after preflight
9. Branch policy:           read-only — гілку не змінювати
10. Allowed files:          [] (read-only)
11. Forbidden files:        усі (запис заборонено)
12. LOCKED files involved:  no (read-only огляд дозволено навіть для LOCKED — без правок)
13. Source-of-truth refs:   AGENTS.md, committed tests, www/core.js
14. Required tests:         n/a або лише read-only прогін матриці для діагностики (без правок)
15. Commit allowed:         no
16. Approved commit file list: n/a
17. Commit message:         n/a
18. Stop conditions:        будь-яка спроба правки/стейджингу/деструктиву → STOP
19. Final report requirements: стандартний STATUS-звіт + перелік знайденого (dirty файли, чиї, у scope/поза scope)
20. Definition of Done:     виданий read-only звіт; чітко вказано рекомендовану наступну дію
