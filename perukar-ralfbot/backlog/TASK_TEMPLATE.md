# PERUKAR RALFBOT — TASK CARD (master template)

<!--
  Скопіюй цей блок у backlog і заповни. Користувачу обов'язкові: Task title, Goal, Mode,
  Allowed files, Commit, (Branch policy якщо не дефолт). Решту RALFBOT виводить із картки + preflight.
  Allowed files = МАКСИМАЛЬНИЙ scope, НЕ автоматично Approved commit file list.
-->

1. Task ID:                 <!-- напр. PRK-001 -->
2. Task title:              <!-- коротко й конкретно -->
3. Mode:                    <!-- READONLY_AUDIT | IMPLEMENTATION | RECOVERY | COMMIT_GATE | DOCUMENTATION | LOCKED_DOC_UPDATE | CLEANUP | UNKNOWN_TO_AUDIT -->
4. Context:                 <!-- чому це робиться; посилання на тест/баг/звіт -->
5. Goal:                    <!-- одна чітка мета. Без "fix everything"/"continue"/"make better" -->
6. Non-goals:               <!-- список того, що НЕ робимо в цій картці -->
7. Expected repo root:      <!-- напр. D:/PERUKAR -->
8. Expected HEAD:           <!-- конкретний HEAD АБО "current HEAD accepted after preflight" -->
9. Branch policy:           <!-- дефолт: працювати лише на поточній гілці якщо явно дозволено; інакше STOP. Push/main — ніколи. Без автоперемикання гілок. -->
10. Allowed files:          <!-- МАКСИМАЛЬНИЙ scope (масив точних шляхів) -->
11. Forbidden files:        <!-- явно заборонені шляхи (опц.) -->
12. LOCKED files involved:  <!-- yes/no; якщо yes — список + ОБОВ'ЯЗКОВЕ "why" і вони мають бути в Allowed files -->
13. Source-of-truth refs:   <!-- AGENTS.md / docs/LOGIC_LOCKED / docs/AGENTS_LOCKED / committed tests / www/core.js -->
14. Required tests:         <!-- повна матриця для impl/safety; для read-only може бути n/a -->
15. Commit allowed:         <!-- yes | no -->
16. Approved commit file list: <!-- ВИКОРИСТОВУЄТЬСЯ лише якщо Commit: yes; ⊆ Allowed files; staged стане == цьому списку -->
17. Commit message:         <!-- лише якщо Commit: yes -->
18. Stop conditions:        <!-- мін. 1; додатково до глобальних Hard STOP конституції -->
19. Final report requirements: <!-- стандартний STATUS-звіт (див. SKILL.md / constitution) -->
20. Definition of Done:     <!-- перевірювані критерії завершення -->

---

## Глобальні правила, що діють для будь-якої картки

- **Dirty repo перед імплементацією** → примусово DIRTY STATE SCOPE AUDIT (read-only), імплементацію не починати.
- **UNKNOWN_TO_AUDIT** → read-only audit, тоді ≤1 точне питання.
- **Allowed files — максимум scope**, не дорівнює Approved commit list.
- **Commit: no** → зупинка на `Ready for commit gate: yes` (без `git add`/commit).
- **Commit: yes** → Approved list ⊆ Allowed; staged == Approved; повна матриця + `git diff --check` PASS; явне `Commit: yes`; один commit; push — ніколи.
- **LOCKED-файли** (AGENTS.md, CLAUDE.md, www/core.js, test_www_*.js, docs/LOGIC_LOCKED/**, docs/AGENTS_LOCKED/**) — лише якщо в Allowed files + вказано "why".
- **Safety-sensitive** (allergy, scalp, productionReady, BLOCKED/MANUAL_REQUIRED/APPROVED, Special Blond, grey, brand matrix, diagnostic-only, third zone/ends, mass/timing) → повна матриця обов'язкова.
- **Source-of-truth priority:** AGENTS.md/LOCKED > committed tests > www/core.js > dirty diff (не правда до audit+gate).
