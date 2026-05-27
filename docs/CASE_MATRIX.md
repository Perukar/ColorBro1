# PERUKAR Case Matrix

## 1. Мета документа

Це карта поточного тестового і бізнес-покриття ПЕРУКАР. Вона показує, які ризикові сценарії вже мають автоматичні перевірки, які production guards або helper-контракти їх захищають, які правила зафіксовані в `AGENTS.md`, і де залишаються known gaps.

Це не доказ повної стабільності всього проєкту. Документ описує тільки наявні перевірені контракти та не замінює нові safety-тести, ручний UI smoke або Android/Capacitor smoke.

## 2. Поточний статус перевірок

Останній відомий green smoke за контекстом задачі:

- `node --check www/core.js`
- `node test_www_business_scenarios.js`
- `node test_www_mapping.js`
- `node test_www_render_runtime.js`
- `node test_www_mass_model.js`

Цей документ не означає, що весь проєкт повністю покритий тестами. Він описує тільки наявні перевірені контракти.

У цій docs-only задачі важкі тести не запускалися повторно. Зміна обмежена документацією.

## 3. Таблиця покриття бізнес-сценаріїв

### 3.1 Third-zone / ends diagnostic-only

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Third-zone / ends diagnostic-only | Diagnostic third-zone / ends readiness | Діагностичний кандидат може існувати тільки як preview, не як рецепт | `buildEndsRecCandidatePreview`, `validateProductionEndsRecReadiness`, `validateProductionThirdZoneReadiness`; `productionReady: false`, `endsRecipeReady: false` | `test_www_business_scenarios.js`: `THREE-ZONE-GATE-RUNTIME-ALLOW-DOES-NOT-ACTIVATE-3ZONE`, `READINESS-*`; `test_www_mass_model.js`: production readiness / guarded wiring tests | `AGENTS.md`; `docs/READINESS_VALIDATOR_CONTRACT_2026-05-25.md`; `docs/PRODUCTION_THIRD_ZONE_PLANNING_CONTRACT_2026-05-26.md` | Covered | Production third-zone ще не реалізований; майбутня activation path має бути окремою задачею |
| Third-zone / ends diagnostic-only | `notForMixing` / `previewOnly` / `candidateOnly` | Прапори мають залишатися safety-маркерами і не давати змішування | Candidate flags перевіряються readiness/render/mass contract helpers | `test_www_render_runtime.js`: `DIAGNOSTIC-DISPLAY-RENDER-CONTRACT`; `test_www_mass_model.js`: `READINESS-CANDIDATE-NOT-PRODUCTION`, `WIRING-CONTRACT-DIAGNOSTIC-FLAGS-REQUIRED`, `GUARDED-WIRING-DIAGNOSTIC-FLAGS-REQUIRED` | `AGENTS.md`; diagnostic display docs | Covered | Якщо UI у майбутньому покаже candidate як recipe card, потрібні нові render tests |
| Third-zone / ends diagnostic-only | Production `massModel` залишається `2-zone` | `massModel.mode` не переходить у `3-zone`, `endsMass` лишається `null` | `buildMassModel` повертає `mode: "2-zone"` і `endsMass: null`; preview mass не просувається в production massModel | `test_www_mass_model.js`: `MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC`, `THREE-ZONE-GATE-PRODUCTION-BUILDMASSMODEL-STILL-2-ZONE`, `MASS-CONTRACT-NO-PREVIEW-MASS-PROMOTION`; `test_www_business_scenarios.js`: `ENDSREC-PRODUCTION-CURRENT-MASSMODEL-STAYS-2ZONE` | `AGENTS.md`; `docs/DIAGNOSTIC_DISPLAY_MILESTONE_2026-05-26.md` | Covered | Exact grams для ends intentionally blocked; production 3-zone mass contract не завершений як runtime feature |
| Third-zone / ends diagnostic-only | Helper не має підмішуватися в `calculateProtocol` як production formula | Helper може давати diagnostic output, але не final `endsFormula`, `dyeMass`, `oxidizerMass`, `grams` | Static/runtime assertions проти production fields і direct activation | `test_www_business_scenarios.js`: `THREE-ZONE-GATE-RUNTIME-NO-BUILDTHREEZONE-CALL`, `ENDSREC-PRODUCTION-CURRENT-NO-*`; `test_www_render_runtime.js`: forbidden fields list | `AGENTS.md`; production endsRec helper docs | Covered | У mass model є багато contract-helper тестів, але production activation все ще forbidden |

### 3.2 Special Blond

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Special Blond | Base/root level 6 Special Blond | Не має автоматично ставати `APPROVED`; потрібне ручне підтвердження | `specialBlondBase6NeedsConfirmation` додає warning і `manualDecisions` | `test_www_business_scenarios.js`: `SB-6-83` | `AGENTS.md`; `docs/MANUAL_TEST_SB_6_83_2026-05-12.md` | Covered | Brand-specific confirmation лишається людським рішенням |
| Special Blond | Special Blond при `grey_percent > 0` | Не має ставати автоматичним `APPROVED`; потрібен manual review | `specialBlondWithGreyNeedsConfirmation` додає warning і manual decision | `GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED`, `GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED` | `AGENTS.md` | Covered | Немає brand-specific palette matrix для кожного бренду |
| Special Blond | 30% grey + glassy + Special Blond | Має бути `MANUAL_REQUIRED` і містити mordonsage signal | Grey glassy diagnostic + Special Blond grey guard | `GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED` | `AGENTS.md` | Covered | Не перевіряє фізичний результат покриття сивини |
| Special Blond | Brand-specific confirmation | Система має зупинити автоматичне approved-рішення, але не може сама підтвердити технологію бренду | Brand-specific manual gate; не formula-level brand engine | `BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED`; `SB-6-83`; grey Special Blond tests | `AGENTS.md` | Covered by manual gate + tests | Real brand engine / palette rule matrix лишається future gap |

### 3.3 Grey coverage

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Grey coverage | `grey >= 50%` | Special Blond блокується або не використовується як automatic coverage path; Permanent fallback очікуваний | Grey logic у `calculateProtocol`; Special Blond grey guard | `GREY-50-SPECIAL-BLOND-BLOCK` | `AGENTS.md` має Special Blond grey rule; окремого AGENTS contract для всього grey >=50 не знайдено | Covered by tests, partial docs | Потрібен окремий AGENTS contract для загального grey >=50 coverage |
| Grey coverage | `.00` base для 50%+ | Для валідного Permanent >= 6% додається `.00` база | Grey >=50 branch додає базу `${dLevel}.00` | `GREY-50-ADDS-00-BASE` | `AGENTS.md` згадує grey >=50 у контексті "не змішувати з 30%" | Covered | Не покриті всі брендові пропорції бази/модного нюансу |
| Grey coverage | Glassy grey | Має бути warning про мордонсаж | Grey type diagnostic | `GREY-GLASSY-MORDONSAGE`; `GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED` | `AGENTS.md` для 30% Permanent glassy | Partial | Загальний glassy grey поза 30% Permanent не завжди означає `MANUAL_REQUIRED`; це потребує окремого рішення |
| Grey coverage | Special Blond block при сивині | Special Blond при сивині не auto-approved | `specialBlondWithGreyNeedsConfirmation` | `GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED`, `GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED` | `AGENTS.md` | Covered | Не вирішує автоматичне додавання `.00` для 10-30% сивини |

### 3.4 30% grey + Permanent

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| 30% grey + Permanent | 30% soft grey + Permanent | `APPROVED` допускається, але має warning про можливу прозорість / недостатнє покриття | Grey 30-49 warning branch; `.00` не додається автоматично | `GREY-30-PERMANENT-SOFT-WARNING` | `AGENTS.md` | Covered | Це свідомий випадок "warning без MANUAL_REQUIRED" |
| 30% grey + Permanent | 30% glassy grey + Permanent | Має бути `MANUAL_REQUIRED`, warning про мордонсаж зберігається | Grey 30-49 warning + glassy manual decision | `GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED` | `AGENTS.md` | Covered | Не покриває всі відсотки 31-49 для glassy |
| 30% grey + Permanent | Не додавати `.00` автоматично для 30% | Recipe не має містити automatic `.00` base | Explicit negative assertions проти `▪️ База` | `GREY-30-PERMANENT-SOFT-WARNING`, `GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED` | `AGENTS.md` | Covered | Якщо буде змінене бізнес-рішення, потрібні нові тести і AGENTS update |

### 3.5 Prepigmentation / significant darkening

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Prepigmentation | Освітлена/косметична довжина 10 -> 6 | `MANUAL_REQUIRED`, згадка передпігментації / заповнення пігменту | `significantDarkeningNeedsPrepig` | `PREPIG-10-6` | `AGENTS.md`; `docs/MANUAL_TEST_PREPIG_10_6_2026-05-12.md` | Covered | Не задає точну формулу prepig |
| Prepigmentation | Освітлена/косметична довжина 8 -> 4 | `MANUAL_REQUIRED`, warning про значне затемнення | `significantDarkeningNeedsPrepig` | `PREPIG-8-4` | `AGENTS.md` | Covered | Не покриває всі проміжні історії полотна |
| Prepigmentation | Натуральна довжина 7 -> 4 | Не має false-positive prepig-warning тільки через різницю рівнів | Guard враховує історію полотна, а не лише `(level - target) >= 3` | `ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE` | `AGENTS.md` | Covered | Натуральний root не є доказом натуральної довжини або кінців |
| Prepigmentation | `root_level` сам по собі не активує prepig guard | Натуральний root не має створювати manual prepig без історії довжини/кінців | `lengthNeedsPrepigHistory`, `endsNeedsPrepigHistory` | `ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE` | `AGENTS.md` | Covered | Потрібна уважність при майбутньому рефакторингу input history |
| Prepigmentation | `significantDarkeningNeedsPrepig` не можна спрощувати | Спрощення до `(level - target) >= 3` заборонене без історії полотна | Explicit history-aware expression | `PREPIG-10-6`, `ENDS-10-6-PREPIG`, `PREPIG-8-4`, `ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE` | `AGENTS.md` | Covered | Немає тестів для довгої історії 3-5 років з кількома нашаруваннями |

### 3.6 Mapping

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Mapping | `PerucarWwwMappingV1.gatherWwwFormData()` | Збирає всі очікувані DOM values, включно з ends fields, без звернення до `output` | Mapping adapter читає конкретні form ids | `test_www_mapping.js` | `docs/TEST_STRATEGY_2026-05-12.md`; changelog/docs згадують mapping | Covered | Один позитивний mapping case; немає широкої matrix по порожніх/дивних DOM значеннях |
| Mapping | `normalizeWwwToRootRawInput()` | Перетворює числові поля у числа, зберігає text fields і legacy fields | Adapter normalization | `test_www_mapping.js` | Mapping згадується в docs/changelog | Covered | Не покриті всі locale/value aliases, крім тих, що додані render runtime для ends history |
| Mapping | Output isolation | Mapping test не має писати в UI output | Assertion `requestedIds.includes('output') === false` | `test_www_mapping.js` | Не знайдено окремого AGENTS contract | Covered | Немає AGENTS.md business contract для mapping adapter |

### 3.7 Render/runtime

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Render/runtime | Render helpers availability | `PerucarWwwRenderV1`, `stripWwwHtmlText`, `normalizeWwwRecipeForRender`, `buildWwwRenderState` існують | Runtime helper contract in `www/core.js` | `test_www_render_runtime.js` | Diagnostic display docs | Covered | Не замінює browser visual QA |
| Render/runtime | Approved / blocked / manual render | `APPROVED` показує recipe; `BLOCKED` і `MANUAL_REQUIRED` не показують approved recipe blocks | `renderStateToHtml` status branching | `test_www_render_runtime.js` | `docs/DIAGNOSTIC_DISPLAY_CONTRACT_PLAN_2026-05-26.md` | Covered | Не перевіряє CSS/layout у реальному браузері |
| Render/runtime | XSS / HTML stripping | Plain text escaping і stripping для recipe/protocol fields | `escapeHtml`, `stripWwwHtmlText`, `normalizeWwwRecipeForRender` | `test_www_render_runtime.js` | Render docs | Covered | Не є повним security audit |
| Render/runtime | Diagnostic display informational-only | Diagnostic block має показувати warning labels, але не production fields | Forbidden headings/fields/texts у render contract | `DIAGNOSTIC-DISPLAY-RENDER-CONTRACT`; matrix cases | Diagnostic display milestone/plan | Covered | UI/browser smoke у цій задачі не запускався |
| Render/runtime | Diagnostic visibility matrix | 2 positive і 4 negative matrix cases; candidate hidden/visible за очікуванням | `assertSafeRuntimeDiagnosticDisplay`, `assertNoProductionEndsSignals`, `assertApprovedTwoZoneOutputStable` | `MATRIX-POSITIVE-*`, `MATRIX-NEGATIVE-*` | Diagnostic display docs | Covered | Не покриває всі варіанти select values |
| Render/runtime | Pure render runtime | Тест не має звертатися до real `document` | Forbidden document proxy, `documentAccessed === false` | `test_www_render_runtime.js` | Не знайдено окремого AGENTS contract | Covered | Browser/Capacitor runtime все одно потребує окремого smoke |

### 3.8 Mass model

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Mass model | Загальне покриття | У `test_www_mass_model.js` знайдено 180 `const id` contract checks | Unit/spec mirror + runtime helper checks | `test_www_mass_model.js` | Mass/endsRec docs | Covered by contract tests | Великий файл змішує unit/spec/runtime contracts; потрібна дисципліна при зміні |
| Mass model | 2-zone shape and sums | `rootMass + lengthMass === totalMass`, `endsMass: null`, `mode: "2-zone"` | `buildMassModel` | `MASS-MODEL-INLINE-CURRENT`, `MASS-MODEL-2-ZONE-EXPECTED-SPLIT`, `MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC` | `AGENTS.md`; readiness/mass docs | Covered | Powder surcharge після sync може змінювати nominal sum; це задокументована поведінка |
| Mass model | Unknown length / NaN guard | Unknown length повертає `null`, не silent NaN | `buildMassModel` null guard | `MASS-MODEL-INVALID-LENGTH-NO-NAN` | Changelog/docs | Covered | UI handling invalid length окремо не є повним browser test |
| Mass model | Future 3-zone math candidate | Remainder rounding для майбутньої 3-zone math перевірений, але не production | Test-only future candidate helpers | `BUILD-MASS-MODEL-3-ZONE-CANDIDATE-*`, `BUILD-MASS-MODEL-ROUNDING-21-42-45-84` | Production third-zone planning docs | Covered as future contract | Production `massModel.mode = "3-zone"` все ще forbidden |
| Mass model | EndsRec readiness / builder / formula / mass / assembly / wiring | Helpers мають бути pure, no production grams, no final formula, no massModel mutation unless explicit future contract | Readiness/builder/formula/mass/assembly/wiring contract helpers | `READINESS-*`, `BUILDER-CONTRACT-*`, `FORMULA-CONTRACT-*`, `MASS-CONTRACT-*`, `ASSEMBLY-CONTRACT-*`, `WIRING-CONTRACT-*`, `GUARDED-WIRING-*` | Multiple production endsRec helper docs | Covered as contract helpers | Це не означає, що production third-zone recipe готовий |
| Mass model | Third-zone diagnostic isolation | Diagnostic candidate не стає production source | Explicit forbidden activation checks | `DIAGNOSTIC-CANDIDATE-NOT-PRODUCTION-SOURCE-ISOLATION`, `PRODUCTION-THIRD-ZONE-ACTIVATION-FORBIDDEN`, `PRODUCTION-THIRD-ZONE-READINESS-DIAGNOSTIC-ISOLATION` | `AGENTS.md`; third-zone docs | Covered | Будь-яке future activation потребує окремого AGENTS contract update |

### 3.9 Brand-specific constraints

| Блок | Сценарій | Очікувана поведінка | Production guard / логіка | Тест | Документація | Статус | Ризик / gap |
|---|---|---|---|---|---|---|---|
| Brand-specific constraints | Brand-sensitive recipe без brand rule matrix | `Special Blond`, `.00` / `/00`, high oxidizer `>= 9%`, powder або toning не мають давати automatic `APPROVED` без brand rule matrix | `hasBrandRuleMatrix = false`; detection з `rootRec` / `lenRec`; warning + `manualDecisions`; не brand engine | `BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED`, `BRAND-MISSING-GREY-00-NO-APPROVED`, `BRAND-MISSING-HIGH-OXIDIZER-NO-APPROVED`, `BRAND-MISSING-POWDER-NO-APPROVED`, `BRAND-MISSING-TONING-LINE-NO-APPROVED` | `AGENTS.md` | Covered by manual gate + tests | Це НЕ full brand engine, НЕ brand database і НЕ palette mapping |
| Brand-specific constraints | Ordinary Permanent 6% без brand-sensitive factors | Не має ловити brand gate тільки через відсутність brand rule matrix | False-positive guard: brand gate вмикається тільки через brand-sensitive factors | `BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE` | `AGENTS.md` | Covered | Не підтверджує brand-specific правила Permanent; тільки не дає total manual |
| Brand-specific constraints | Normal same-level без brand-sensitive factors | Не має ловити brand warning/manual text | False-positive guard для same-level neutral scenario | `BRAND-NORMAL-SAME-LEVEL-NO-FALSE-POSITIVE` | `AGENTS.md` | Covered | Не замінює майбутній brand/system input або palette matrix |

## 4. Контракти, зафіксовані в AGENTS.md

Знайдені documented contracts:

- Third-zone diagnostic-only: знайдено. `AGENTS.md` фіксує diagnostic-only режим, `notForMixing` / `previewOnly` / `candidateOnly`, `productionReady !== true`, production `massModel` як `2-zone`, заборону `formula-to-mix` і `grams` для діагностичної третьої зони.
- Special Blond base 6 manual review: знайдено. `specialBlondBase6NeedsConfirmation` не можна прибирати без окремого затвердженого рішення; `SB-6-83` має лишатися тестом контракту.
- Special Blond grey hair manual review: знайдено. `grey_percent > 0` + Special Blond має переходити в `MANUAL_REQUIRED`; `specialBlondWithGreyNeedsConfirmation` не можна прибирати без окремого рішення.
- Grey 30 permanent safety: знайдено. 30% soft grey + Permanent може бути `APPROVED` з warning; 30% glassy grey + Permanent має бути `MANUAL_REQUIRED`; automatic `.00` для 30% заборонено без окремого бізнес-рішення.
- Prepigmentation safety contract: знайдено. Передпігментація при 3+ рівнях затемнення залежить від косметичної/освітленої/ненатуральної історії довжини або кінців; натуральний root не має сам активувати guard.
- BLACK-EXIT / темна косметична база: знайдено. Темна косметична root/length база рівня 1-4 при переході у світлішу ціль не має давати automatic `APPROVED`; natural dark base має negative-test проти false-positive.
- Правило HENNA / METALS: знайдено. history з хною / металом / солями не має давати automatic APPROVED; approved-recipe не має рендеритись без ручного рішення; ends/third-zone production path diagnostic-only.
- Правило DAMAGE / POROSITY / ELASTICITY: знайдено. high damage/porosity не має давати automatic APPROVED; root damaged + root lift/powder/Special Blond covered by UI field + guard + tests; length damaged / brittle + length lift/powder/Special Blond covered by guard + tests; Special Blond + high porosity covered by UI field + guard + tests; damaged/risky hair + high oxidizer covered by guard + tests; brittle блокує освітлення; warning-only не достатній для high-risk lift.
- Правило BRAND-SPECIFIC CONSTRAINTS: знайдено. ПЕРУКАР не має full brand rule matrix; brand-sensitive recipes без brand rule matrix covered by manual gate + tests; `hasBrandRuleMatrix = false` не є brand engine; UI-поля brand/system немає.
- Grey >=50 загальний coverage contract в AGENTS.md: окремим контрактом не знайдено; згадується тільки як логіка, яку не можна змішувати з контрактом 30%.
- Mapping adapter contract в AGENTS.md: не знайдено.
- Render/runtime state-shape contract в AGENTS.md: не знайдено як окремий business contract; third-zone diagnostic display частково покритий third-zone rule.

## 5. Known gaps

BLACK-EXIT coverage status:

- Root/length dark cosmetic base: covered by guard/tests. `BLACK-EXIT-1`, `BLACK-EXIT-COSMETIC-DARK-BASE-NO-MARKER`, `BLACK-EXIT-DARK-COSMETIC-LENGTH` мають вимагати manual path, а `BLACK-EXIT-NATURAL-DARK-BASE-NO-FALSE-POSITIVE` захищає натуральну темну базу від false-positive.
- Ends/third-zone production dark cosmetic base: still known gap / diagnostic-only. Production ends-level guard не вмикати без окремого контракту третьої зони.

- Хна / металеві солі: HENNA/METALS root/length general history covered by guard/tests. Ends/third-zone production path diagnostic-only / known gap.
- Пошкоджене волосся / еластичність / пористість: DAMAGE / POROSITY / ELASTICITY is partially covered by existing guards/tests. Root damaged + root lift/powder/Special Blond covered by UI field + guard + tests. Length damaged / brittle + length lift/powder/Special Blond covered by guard + tests. Low elasticity covered by UI field + guard + tests. Special Blond + high porosity covered by UI field + guard + tests. High oxidizer + damaged/risky hair covered by guard + tests. Gap: немає повної матриці по root/length/ends, powder для інших damage-сценаріїв, toning/darkening повних окремих алгоритмів, multi-zone damage conflict.
- Brand-specific constraints: covered by manual gate + tests для Special Blond, `.00` / `/00`, high oxidizer `>= 9%`, powder і toning без brand rule matrix. Це не full brand engine.
- Real brand engine / palette rule matrix: все ще gap. Немає brand database, palette mapping, oxidizer compatibility matrix, brand-specific mixing ratio matrix або правил Wella / Matrix / Londa / Loreal / Igora чи інших брендів.
- Ручний browser/UI smoke: у `docs/` є попередні browser QA документи, але в цій задачі browser не використовувався і актуальний ручний UI smoke не запускався.
- Android/Capacitor build: поточна задача не запускала Android/Capacitor build smoke; окремого green build evidence у цій matrix немає.
- Довге волосся з історією 3-5 років: окремого сценарію не знайдено.
- Різні зони полотна з різною пористістю: частково є ends condition/history checks, але немає повної multi-zone porosity matrix.
- Точні gram/mass edge cases: 2-zone sums і майбутня rounding math покриті, але exact grams для production ends заборонені до окремого contract; powder surcharge per zone лишається known limitation.
- Випадки, де warning є, але немає `MANUAL_REQUIRED`: `GREY-30-PERMANENT-SOFT-WARNING` є intentional approved-with-warning; `GREY-GLASSY-MORDONSAGE` перевіряє warning, але не сам по собі повний manual contract для всіх glassy cases.
- Випадки, де є тест, але немає AGENTS.md contract: missing critical data, mapping adapter, render XSS/state-shape, ends history/base type scenarios, частина production endsRec helper contracts.

## 6. Рекомендований порядок наступних safety-блоків

| Порядок | Блок | Чому це ризик | Мінімальний тест | Production guard потрібен | AGENTS.md contract потрібен |
|---|---|---|---|---|---|
| 1 | multi-zone damage conflict / різнозонне полотно | Різні зони можуть мати різну косметичну історію, пористість і реакцію | Multi-zone history 3-5 years + different porosity -> no automatic approved unified recipe | Так | Так |
| 2 | UI/browser smoke | Node tests не бачать реального layout, кликів, select values і visual regressions | Manual/browser smoke для current form values, diagnostic block, warning/manual blocks | Не завжди | Так, як QA contract |
| 3 | Android/Capacitor build smoke | Android wrapper може мати окремі runtime/build проблеми навіть при green Node tests | Build/sync smoke для Capacitor webDir і Android asset path | Не завжди | Так, як release/readiness contract |
| 4 | real brand engine / palette rule matrix | Manual gate не знає реальних правил брендів, лінійок, пропорцій і сумісності окисників | Brand/system input + palette/line/ration compatibility matrix | Так | Так |
| 5 | toning/darkening full algorithms | Toning/darkening зараз не мають повної окремої алгоритмічної матриці | Dedicated toning/darkening scenarios with product line and hair history | Так | Так |

## 7. Правила підтримки CASE_MATRIX.md

- Кожен новий safety-блок має оновлювати `docs/CASE_MATRIX.md`.
- Кожен production guard має мати тест.
- Кожен критичний тест має бути прив'язаний до бізнес-сценарію.
- Документація не замінює production guard.
- Green tests не означають повне покриття проєкту.
- Якщо сценарій є warning-only, це має бути явно позначено як intentional або gap.
- Якщо тест існує без `AGENTS.md` contract, потрібно або додати contract окремою дозволеною задачею, або позначити gap.
