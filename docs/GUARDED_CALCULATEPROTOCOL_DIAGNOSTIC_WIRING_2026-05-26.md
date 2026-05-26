# Guarded calculateProtocol Diagnostic Wiring

## 1. Огляд та мета
Цей документ описує інтеграцію та безпечне підключення ланцюжка хелперів (helper chain) для оцінки формули та маси кінців (`endsRec`) всередині основної функції розрахунку рецептів `calculateProtocol` у файлі [core.js](file:///C:/Users/User/Favorites/Робочий%20стіл/PAREIKM/PERUKAR/www/core.js).

Це підключення є **guarded diagnostic-only** (виключно діагностичним/оціночним) рівнем. Воно слугує контейнером для тестування кандидатів у рецепти кінців, але повністю ізольоване від робочого середовища колориста.

---

## 2. Ізоляція від Production-середовища
Створений діагностичний об'єкт знаходиться за адресою:
`state.endsRecDiagnosticWiringCandidate`

Цей контейнер має чіткі ознаки ізоляції:
* **previewOnly**: `true`
* **candidateOnly**: `true`
* **notForMixing**: `true`
* **productionReady**: `false`
* **endsRecipeReady**: `false`

Категорично **ЗАБОРОНЕНО** та **НЕ ВИКОНУЄТЬСЯ** наступне:
* Створення реального/робочого `endsRec`;
* Визначення мас барвника (`dyeMass`) чи окисника (`oxidizerMass`) для кінців у реальному рецепті;
* Розрахунок точних грамів для кінців;
* Додавання маси кінців у модель мас (`massModel.endsMass` залишається `null`);
* Перехід у трьохзонний режим роботи (`massModel.mode` залишається `"2-zone"`);
* Формування фінальної формули для кінців (`endsFormula`);
* Переведення прапорця готовності рецепту кінців у готовність (`endsRecipeReady: true`);
* Відображення результату розрахунку для кінців в інтерфейсі користувача (UI/render).

---

## 3. Діагностичний ланцюжок хелперів (Helper Chain)
Діагностичні розрахунки виконуються в ізольованому блоці `try-catch`, що запобігає будь-якому збою основного 2-зонного розрахунку:

```javascript
// всередині calculateProtocol у www/core.js
let endsRecDiagnosticWiringCandidate = null;
try {
    const diagnosticContext = Object.assign({}, context);
    const dReadiness = validateProductionEndsRecReadiness(diagnosticContext);
    const dBuilder = buildProductionEndsRec(diagnosticContext, dReadiness);
    const dFormula = classifyProductionEndsRecFormulaContract(diagnosticContext, dReadiness, dBuilder);
    const dMass = classifyProductionEndsRecMassAllocationContract(diagnosticContext, dReadiness, dBuilder, dFormula);
    const dAssembly = assembleProductionEndsRecContract(diagnosticContext, dReadiness, dBuilder, dFormula, dMass);
    const dWiring = buildControlledEndsRecDiagnosticWiringContract(diagnosticContext, dReadiness, dBuilder, dFormula, dMass, dAssembly);

    if (dWiring && dWiring.diagnosticReady && dWiring.diagnosticCandidate) {
        endsRecDiagnosticWiringCandidate = {
            zone: 'ends',
            candidateOnly: true,
            previewOnly: true,
            notForMixing: true,
            productionReady: false,
            endsRecipeReady: false,
            sourceRefs: Object.assign({}, dWiring.diagnosticCandidate.sourceRefs),
            safetyReasonCodes: Array.isArray(dWiring.diagnosticCandidate.safetyReasonCodes) ? dWiring.diagnosticCandidate.safetyReasonCodes.slice() : [],
            manualRequiredReasonCodes: Array.isArray(dWiring.diagnosticCandidate.manualRequiredReasonCodes) ? dWiring.diagnosticCandidate.manualRequiredReasonCodes.slice() : []
        };
    }
} catch (err) {
    // Fail-safe: будь-які помилки розрахунку не переривають основну логіку 2-zone
}
```

---

## 4. Історія та Ретроспектива розробки
1. **Помилковий комміт `286a573`**: Був відкочений (через комміт `889f79f`), оскільки він змінив лише файли тестів, перевернувши перевірки з `NOT-WIRED-YET` на `IS-WIRED` без фактичного підключення логіки в `www/core.js` (tests-only fake wiring).
2. **Валідний комміт `3efcb07`**: Успішно реалізував логіку підключення у `www/core.js` з відповідними оновленнями в `test_www_mass_model.js`. Всі тести проходять у повному обсязі (full suite PASS).

---

## 5. Поточні інваріанти виконання (Runtime Invariants)
Наступна поведінка є незмінною та стабільною:
* `massModel.mode === "2-zone"` (трьохзонний режим вимкнений);
* `massModel.endsMass === null` (маса для кінців відсутня);
* Поведінка `rootRec` (корені) та `lenRec` (довжина) залишається незмінною;
* Рендеринг інтерфейсу (`renderStateToHtml`) повністю ігнорує діагностичний контейнер.

---

## 6. Напрямки подальшого розвитку
* Створення додаткових валідаційних тестів для діагностичного режиму;
* Проєктування та розробка відокремленого відображення діагностичної інформації в інтерфейсі (тільки як окрема фаза розробки);
* Будь-яка production-активація трьохзонної моделі або розрахунку грамів на кінці потребуватиме створення окремого контракту безпеки.
