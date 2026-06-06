# PROJECT_STATE — Perucar

## 0. Post-RALFBOT checkpoint

- RALFBOT installed and pushed: yes
- Commit: `7b0ad56 Install RALFBOT guard system`
- Remote: `origin/main`
- Post-install smoke: PASS
- First real RALFBOT audit: PASS
- Brand contract: PASS
- Timing contract: PASS
- Mass model contract: PASS
- EndsRec readiness contract: PASS
- Current rule: future work must use bounded task cards
- No current action required for brand, timing, mass, or endsRec

## 1. Поточний HEAD

Поточний HEAD: 84b1e2c Normalize blocked result shape

## 2. Останні важливі коміти

- 84b1e2c Normalize blocked result shape
- 5bdf4c0 Add Codex project instructions
- 7658cd4 Add gitattributes for line endings
- 3a4ab69 Ignore ChatGPT transfer artifacts
- 8646cb7 Add structural result fields to MathAgent initial state
- 57d5265 fix: removed hallucinated baseType condition

## 3. Поточний статус

- Робоче дерево чисте.
- PROJECT_STATE.md ще не був створений до цього патчу.
- Codex config переведено з sandbox_mode = "read-only" на sandbox_mode = "workspace-write".
- approval_policy залишено "untrusted".

## 4. Що вже зроблено

- У MathAgent._createInitialState(snapshot) додані structural fields:
  - manualDecisions
  - blockers
  - mixtoneInfo
  - massModel
  - timingInfo
- BLOCKED result shape нормалізовано через MasterNode._createBlockedState().
- .gitignore ігнорує ChatGPT/Codex transfer artifacts:
  - /chatgpt_upload_ready.zip
  - /chatgpt_upload_ready/
  - /project_snapshot/
- .gitattributes доданий для line endings.
- AGENTS.md доданий як правила Codex approval protocol.

## 5. Що перевірено

- git diff --check для змінених файлів.
- Blocked smoke-test через node -e.
- Smoke-test має результат PASS для Special Blond BLOCKED сценарію:
  - targetLevel: "11"
  - rootLevel: "5"
  - lengthLevel: "6"
  - elasticity: "1"

## 6. Що НЕ робилося

- npm test не запускався.
- npm-команди не запускалися.
- Android build не запускався.
- git add --renormalize не запускався.
- www/core.js не синхронізувався з root core.js.

## 7. Відомі ризики

- package.json має name "color", хоча актуальний проєкт Perucar.
- package.json має Capacitor ^6.0.0, а package-lock.json показує Capacitor 8.2.0.
- Root core.js і www/core.js можуть розходитись.
- Повного test suite немає.
- Мікстони ще не рахуються.
- massModel поки структурний, не заповнений реальною моделлю грамів.
- timingInfo поки структурний, не повний регламент таймінгів.

## 8. Наступний рекомендований крок

- Read-only порівняти root core.js і www/core.js.
- Не синхронізувати автоматично.
- Спочатку зрозуміти, який файл є джерелом правди для Web/Android.
