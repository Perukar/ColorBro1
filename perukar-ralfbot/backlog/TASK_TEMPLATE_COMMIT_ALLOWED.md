# PERUKAR RALFBOT — TASK CARD (IMPLEMENTATION + COMMIT: yes)

<!--
  Картка з дозволеним commit. Allowed files = максимум scope. Approved commit file list — точні файли саме цього commit (⊆ Allowed).
  git add НЕ виконується до явного "Commit: yes". До того максимальний вихід — "Ready for commit gate: yes".
-->

1. Task ID:                 PRK-XXX
2. Task title:              <!-- напр. "Fix mass-model regression in core.js" -->
3. Mode:                    IMPLEMENTATION
4. Context:                 <!-- посилання на тест, що падає / звіт -->
5. Goal:                    <!-- одна чітка зміна -->
6. Non-goals:               <!-- що не чіпаємо -->
7. Expected repo root:      D:/PERUKAR
8. Expected HEAD:           current HEAD accepted after preflight
9. Branch policy:           працювати на поточній гілці ДОЗВОЛЕНО (підтверджено користувачем); push/main — ніколи; без автоперемикання гілок
10. Allowed files:          [ www/core.js ]            <!-- максимум scope -->
11. Forbidden files:        усе поза Allowed
12. LOCKED files involved:  yes — www/core.js. WHY: <!-- причина зміни LOCKED-файлу -->
13. Source-of-truth refs:   AGENTS.md, test_www_mass_model.js (committed)
14. Required tests:         ПОВНА матриця (safety-sensitive за потреби) + git diff --check
15. Commit allowed:         yes
16. Approved commit file list: [ www/core.js ]         <!-- ⊆ Allowed; staged стане == цьому -->
17. Commit message:         "fix: <короткий опис>"
18. Stop conditions:        зміни поза scope; матриця FAIL після ≤2 безпечних спроб; staged != approved; dirty до старту
19. Final report requirements: STATUS-звіт; перед commit — "Ready for commit gate: yes", чекати "Commit: yes"
20. Definition of Done:     матриця PASS; staged == approved; один commit зроблено; push НЕ робився
