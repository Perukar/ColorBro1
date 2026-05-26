# Diagnostic Display Contract Plan

## 1. Призначення та концепція відображення
Цей документ визначає вимоги безпеки, структуру даних та правила інтерфейсу (UI Display Contract) для майбутнього відображення діагностичного контейнера в інтерфейсі застосунку ПЕРУКАР.

Відображення діагностики призначене виключно як **інформаційно-довідковий блок** для колориста. Воно допомагає майстру побачити технічні рекомендації, оцінку готовності чи причини блокувань, але за жодних умов не є робочим рецептом для змішування або нанесення.

---

## 2. Джерело даних та об'єкт контракту
Основним джерелом даних для відображення є:
`state.endsRecDiagnosticWiringCandidate`

Для забезпечення ізоляції від основних розрахункових гілок, логіка рендерингу зобов'язана спиратися на наступні прапорці безпеки (safety invariants):
* `previewOnly === true`
* `candidateOnly === true`
* `notForMixing === true`
* `productionReady === false`
* `endsRecipeReady === false`

---

## 3. Дозволені до відображення дані
В інтерфейсі дозволено виводити тільки інформаційні та аналітичні деталі:
* **Статус готовності діагностики** (diagnostic status / readiness);
* **Статус потреби ручного втручання** (manual-required status);
* **Вихідні посилання** (`sourceRefs`), які пояснюють логіку рішення;
* **Коди безпеки діагностики** (`safetyReasonCodes`);
* **Коди причин ручного втручання** (`manualRequiredReasonCodes`);
* **Текстові попередження та підказки** для колориста;
* **Причини, чому потрібна ручна перевірка** або чому автоматичний розрахунок заблоковано.

Ці дані мають відображатися як технічні мітки або інформаційні списки попереджень.

---

## 4. Заборонені до відображення дані
Категорично **ЗАБОРОНЕНО** виводити в інтерфейс як частину діагностики:
* Масу барвника (`dyeMass`) чи масу окисника (`oxidizerMass`);
* Точні грами барвників чи окисників для кінців;
* Готові пропорції змішування;
* Фінальну формулу (`endsFormula` чи `finalFormula`) у вигляді, що спонукає колориста до змішування;
* Будь-які інструкції нанесення або змішування («Змішайте...», «Нанесіть на кінці...»);
* Складові елементи робочого рецепту третій зоні (recipe shape).

---

## 5. Обов'язкові інтерфейсні мітки (UI Labels)
Будь-який блок відображення діагностики кінців на екрані повинен супроводжуватися чіткими текстовими мітками попередження:
* **«Діагностика кінців»**
* **«Preview only»** (Тільки для попереднього перегляду)
* **«Не для змішування»**
* **«Потрібна ручна перевірка майстра»**
* **«Не є фінальним рецептом»**
* **«Не наносити за цим блоком»**

---

## 6. Обов'язкова поведінка інтерфейсу (UI Safety Behavior)
* Якщо `notForMixing === true`, UI не повинен рендерити грами або формулу у вигляді робочої картки рецепту;
* Якщо `productionReady === false`, UI не повинен створювати кнопки заклику до дії (CTA) типу «Схвалити рецепт кінців» чи «Використати рецепт»;
* Якщо `endsRecipeReady === false`, третя зона в інтерфейсі не може показуватися як активна чи готова до роботи;
* Блок відображення діагностики має бути візуально відокремлений (наприклад, окремою рамкою попередження, сірим кольором або спеціальною плашкою) від блоків робочих рецептів коренів (`rootRec`) та довжини (`lenRec`);
* Відображення діагностичного блоку не має змінювати наявний 2-зонний вивід рецептів чи впливати на структуру `massModel`.

---

## 7. Explicit Non-Goals (Поза межами проєкту)
Цей контрактний план гарантує, що:
* **Не змінюється runtime-логіка** (no runtime change);
* **Не змінюється існуючий UI/render** (no UI/render change);
* **Не змінюються існуючі тести** (no tests change);
* **Не створюється робочий endsRec** (no production endsRec);
* **Не розраховуються грами для кінців** (no grams);
* **Модель мас залишається 2-зонною** (no massModel 3-zone);
* Прапорець готовності рецепту кінців лишається вимкненим (`endsRecipeReady === false`).

---

## 8. Аналіз ризиків (Risk Notes)
* **Ризик 1: Хибна інтерпретація.** Майстер-колорист може сприйняти preview-кандидата як готовий робочий рецепт і почати змішувати хімічні компоненти за діагностичними даними.
  * *Запобігання:* Обов'язкове велике червоне або помаранчеве маркування «Не для змішування».
* **Ризик 2: Випадкова активація 3-zone.** Агент під час розробки UI може випадково змінити модель мас чи логіку `calculateProtocol`, щоб «полегшити відображення».
  * *Запобігання:* Тести мас-моделі мають жорстко контролювати інваріант `mode: "2-zone"`.
* **Ризик 3: Незрозумілі коди.** Показ технічних кодів помилок (наприклад, `ENDS_LIFT_BLOCKED`) без текстового розшифрування може заплутати користувача.
  * *Запобігання:* Логіка рендерингу повинна транслювати коди у зрозумілі людською мовою підказки.

---

## 9. Майбутня фаза реалізації UI/Render
Реалізація відображення діагностики має відбуватися як окрема ізольована фаза:
1. **Окремий запит (prompt):** Тільки після затвердження цього плану.
2. **Окремий набір тестів:** Для перевірки, що рендерер не виводить заборонених полів для змішування, і що 2-зонні рецепти не зазнали змін.
3. **Обмежений перелік дозволених файлів:** Дозвіл буде надано тільки на файли рендерера/інтерфейсу (наприклад, `www/core.js` у частині `PerucarWwwRenderV1`, `www/index.html` тощо).

---

## 10. Diagnostic UI Input Normalization
Після реалізації діагностичного display-блоку було підтверджено окремий ризик доступності: сам блок проходив direct render-state smoke, але реальна UI-форма не могла створити `state.endsRecDiagnosticWiringCandidate`.

Причина була не у production-розрахунку і не у render-блоці, а у mismatch між значенням реального select у формі та значенням, яке використовував diagnostic/test path:
* real UI value: `натуральні`;
* diagnostic/test value: `натуральна`.

Додаткова перевірка показала, що встановлення `натуральна` у реальний select давало empty value, а доступні UI combinations не створювали `.ends-diagnostic`. Отже, функція була технічно реалізована, але недосяжна через форму.

Fix виконано через normalization alias:
* `натуральні` -> `натуральна`;
* option value у `www/index.html` не змінювався;
* legacy/test value `натуральна` лишається підтриманим.

Цей alias призначений тільки для diagnostic path / input alignment. Він **НЕ**:
* активує production `endsRec`;
* створює third-zone recipe;
* додає grams;
* додає `dyeMass` чи `oxidizerMass`;
* додає final formula;
* переводить `endsRecipeReady` у `true`;
* переводить `massModel.mode` у `"3-zone"`;
* змінює `calcMixtone`;
* змінює oxidizer logic.

QA result для цієї normalization:
* real form candidate path verified with `ends_history = "натуральні"`;
* diagnostic block visible via real form;
* diagnostic block hidden when candidate absent;
* no grams / `dyeMass` / `oxidizerMass` / `finalFormula` / `productionRecipe` / `formula-to-mix`;
* no mixing instruction;
* no third-zone production impression;
* existing root/length output stable;
* browser console errors: none;
* layout readable;
* buttons/forms not broken.

Future rule:
* Якщо додаються нові UI option values, вони мають або прямо відповідати diagnostic/runtime contract, або мати explicit normalization alias.
* Заборонено "виправляти" це простим перейменуванням тестів без перевірки real UI form.
* Заборонено змінювати option values без UI smoke test.
* Заборонено робити diagnostic block залежним від значення, якого немає в реальній формі.

Acceptance criteria для майбутніх змін:
* test path і real UI path мають використовувати сумісні значення;
* real UI smoke має підтвердити reachability;
* tests мають підтвердити compatibility;
* production recipe safety invariants мають залишатися PASS.

---

## 11. Diagnostic Display Implementation Status
Статус після реалізації: diagnostic display block реалізований, перевірений через real UI smoke і закріплений regression tests. Ця секція фіксує фактичну поведінку після наступних commits:
* `b8a830e` - Implement diagnostic display block;
* `73fad44` - Align diagnostic display UI input values;
* `9781af7` - Add diagnostic UI value reachability tests.

Реалізовано display-only блок для джерела:
`state.endsRecDiagnosticWiringCandidate`

Поточна поведінка:
* блок відокремлений від `rootRec` / `lenRec` production output;
* блок показує warning/info status;
* блок не є production recipe;
* блок не виглядає як готова третя production-зона;
* existing root/length recipe output залишається стабільним.

Rendered labels, які мають залишатися присутніми:
* `Діагностика кінців`;
* `Preview only` або `Попередній перегляд`;
* `Не для змішування`;
* `Потрібна ручна перевірка`;
* `Не є фінальним рецептом`;
* `Не наносити за цим блоком`.

Заборонені rendered fields і recipe-signals:
* `grams`;
* `dyeMass`;
* `oxidizerMass`;
* `exactGrams`;
* `finalFormula`;
* `productionRecipe`;
* `formula-to-mix`;
* mixing instruction;
* готовий рецепт для кінців;
* CTA типу `готовий рецепт`.

UI reachability fix:
* initial smoke показав, що direct render-state відображає блок, але real form не може його створити;
* mismatch був між real UI value `натуральні` та diagnostic/test value `натуральна`;
* fix виконано через normalization alias `натуральні` -> `натуральна`;
* option value у `www/index.html` не змінювався;
* legacy value `натуральна` лишається підтриманим.

Verified QA:
* local app opened at `http://127.0.0.1:8080` in Microsoft Edge;
* real form candidate path verified;
* diagnostic block visible via real form;
* diagnostic block hidden when candidate absent;
* no grams / `dyeMass` / `oxidizerMass` / `finalFormula` / `productionRecipe` / `formula-to-mix`;
* no mixing instruction;
* no third-zone production impression;
* existing root output stable;
* existing length output stable;
* browser console errors: none;
* layout readable;
* buttons/forms not broken.

Regression coverage:
* UI value `натуральні` tested;
* legacy value `натуральна` tested;
* empty/unknown mismatch regression tested;
* diagnostic display reachable via UI-compatible value;
* no grams / `dyeMass` / `oxidizerMass` / `finalFormula` / `productionRecipe` / `formula-to-mix` tested;
* no 3-zone activation tested;
* no `massModel.endsMass` number tested;
* no `endsRecipeReady === true` tested;
* existing 2-zone output stable.

Production safety boundary:
* no production `endsRec`;
* no `massModel.mode = "3-zone"`;
* no `massModel.endsMass` number;
* no `dyeMass` / `oxidizerMass` runtime;
* no exact grams runtime;
* no final `endsFormula`;
* no `endsRecipeReady === true`;
* no preview mass promotion;
* no `calcMixtone` change;
* no oxidizer logic change.

Future rules:
* будь-яке нове UI option value, яке впливає на diagnostic path, має мати test coverage;
* не можна додавати UI option без reachability test;
* не можна змінювати diagnostic labels без render/runtime tests;
* не можна перетворювати diagnostic block у recipe card;
* production activation має бути окремою фазою з окремим contract і safety tests.

Explicit non-goals:
* diagnostic display не є рецептом;
* diagnostic display не дозволяє змішування;
* diagnostic display не є third-zone production;
* diagnostic display не рахує grams;
* diagnostic display не змінює root/length recipe.

---

## 12. Diagnostic Reason Labels
Статус після commit `11b73f8` - Implement diagnostic reason labels: diagnostic display block отримав display-only mapping для читабельності reason codes. Мета цієї фази - зробити блок зрозумілим для майстра, а не змінити розрахунок.

Призначення:
* показувати людські українські пояснення замість сирих technical reason codes;
* пояснювати `sourceRefs`, `safetyReasonCodes` і `manualRequiredReasonCodes` як diagnostic context;
* не змінювати calculation logic;
* не активувати production recipe.

Що реалізовано:
* display-only mapping function/object для reason codes;
* `safetyReasonCodes` мають human-readable labels;
* `manualRequiredReasonCodes` мають human-readable labels;
* `sourceRefs` показуються безпечно як diagnostic context;
* unknown reason code має safe fallback;
* existing warning labels збережені.

Важлива межа: reason labels - це тільки UI/display layer. Вони **НЕ**:
* змінюють candidate creation;
* змінюють readiness;
* змінюють recipe calculation;
* створюють production `endsRec`;
* створюють grams;
* створюють `formula-to-mix`;
* переводять `endsRecipeReady` у `true`.

Unknown code fallback:
* невідомий code не має ламати render;
* fallback має бути безпечним і зрозумілим;
* fallback не має виглядати як рецепт;
* fallback не має пропонувати змішування або нанесення.

Existing warning labels мають залишатися присутніми:
* `Діагностика кінців`;
* `Не для змішування`;
* `Потрібна ручна перевірка`;
* `Не є фінальним рецептом`;
* `Не наносити за цим блоком`.

Заборонені display поля лишаються забороненими:
* `grams`;
* `dyeMass`;
* `oxidizerMass`;
* `exactGrams`;
* `finalFormula`;
* `productionRecipe`;
* `formula-to-mix`;
* mixing instruction;
* готовий рецепт для кінців;
* CTA типу `готовий рецепт`.

Production safety boundary:
* no `massModel.mode = "3-zone"`;
* no `massModel.endsMass` number;
* no production `endsRec`;
* no `dyeMass` / `oxidizerMass` runtime;
* no exact grams runtime;
* no final `endsFormula`;
* no `endsRecipeReady === true`;
* no preview mass promotion;
* no `calcMixtone` change;
* no oxidizer logic change.

Test coverage:
* reason labels rendered;
* `safetyReasonCodes` human-readable;
* `manualRequiredReasonCodes` human-readable;
* `sourceRefs` display safe;
* unknown code fallback safe;
* existing warning labels preserved;
* no grams rendered;
* no `formula-to-mix` rendered;
* UI reachability preserved;
* existing 2-zone output stable.

Future rules:
* якщо додається новий reason code, треба додати або label, або явно перевірений fallback;
* не можна використовувати reason labels як production decision logic;
* не можна через labels активувати third-zone recipe;
* не можна показувати reason label як інструкцію до нанесення;
* не можна прибирати warning labels при додаванні нових labels.
