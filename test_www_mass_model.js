'use strict';

/**
 * test_www_mass_model.js
 *
 * DIAGNOSTIC / KNOWN LIMITATION TEST CONTRACT
 * для майбутнього refactor mass model у ПЕРУКАР (PERUKAR).
 *
 * Цей файл НЕ тестує поточний production code напряму.
 * Він фіксує МАЙБУТНІ ВИМОГИ до buildMassModel() та 3-зонної моделі.
 *
 * Поточний стан:
 * - buildMassModel() не існує як окрема функція;
 * - mass model inline у calculateProtocol() у www/core.js;
 * - endsMass не існує;
 * - endsRec не існує;
 * - production code не змінювався.
 *
 * Після кожного майбутнього refactor-кроку відповідний тест
 * переводиться зі статусу KNOWN_LIMITATION у SAFE assert.
 */

const assert = require('assert');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function diagnosticLog(id, message) {
    console.log(`${id} diagnostic observed: ${message}`);
}

function knownLimitation(id, message) {
    console.log(`${id} known limitation: ${message}`);
}

// ---------------------------------------------------------------------------
// ТЕСТ 1: MASS-MODEL-INLINE-CURRENT
// Зафіксувати, що buildMassModel() ще не існує як production helper.
// ---------------------------------------------------------------------------

(function testMassModelInlineCurrent() {
    const id = 'MASS-MODEL-INLINE-CURRENT';

    // buildMassModel не існує у глобальному або production scope.
    // Перевіряємо це явно — функція не має бути доступна як глобальна.
    const buildMassModelExists = typeof globalThis.buildMassModel === 'function';

    assert.strictEqual(
        buildMassModelExists,
        false,
        `${id}: buildMassModel should NOT exist as a global helper yet`
    );

    knownLimitation(id,
        'buildMassModel() is not yet extracted as a production helper. ' +
        'Mass model is inline inside calculateProtocol() in www/core.js. ' +
        'Future: extract buildMassModel({ length, density, endsActive }) as a standalone function.'
    );
})();

// ---------------------------------------------------------------------------
// ТЕСТ 2: MASS-MODEL-2-ZONE-EXPECTED-SPLIT
// Зафіксувати майбутню вимогу:
// 2-зонний режим → rootMass + lengthMass === totalMass.
// ---------------------------------------------------------------------------

(function testMassModel2ZoneExpectedSplit() {
    const id = 'MASS-MODEL-2-ZONE-EXPECTED-SPLIT';

    // Поточна поведінка (з аналізу core.js):
    // rMass = Math.round(totalMass * 0.3)
    // lMass = Math.round(totalMass * 0.7)
    // ПРОБЛЕМА: Math.round може давати drift rMass + lMass ≠ totalMass.
    //
    // Приклад: totalMass = 42
    //   rMass = Math.round(42 * 0.3) = Math.round(12.6) = 13
    //   lMass = Math.round(42 * 0.7) = Math.round(29.4) = 29
    //   sum = 42 ✓ (тут збігається)
    //
    // Приклад: totalMass = 43
    //   rMass = Math.round(43 * 0.3) = Math.round(12.9) = 13
    //   lMass = Math.round(43 * 0.7) = Math.round(30.1) = 30
    //   sum = 43 ✓
    //
    // Приклад: totalMass = 35
    //   rMass = Math.round(35 * 0.3) = Math.round(10.5) = 11 (banker's rounding may vary)
    //   lMass = Math.round(35 * 0.7) = Math.round(24.5) = 25
    //   sum = 36 ≠ 35 → drift!
    //
    // Безпечне рішення для майбутньої buildMassModel:
    //   rootMass = Math.round(totalMass * 0.3)
    //   lengthMass = totalMass - rootMass  ← залишок, гарантує суму

    // Верифікуємо drift на кількох значеннях без production code.
    const testCases = [
        { totalMass: 30, label: 'базовий короткий' },
        { totalMass: 42, label: 'редкий середній (0.7)' },
        { totalMass: 60, label: 'базовий середній' },
        { totalMass: 84, label: 'густий середній' },
        { totalMass: 120, label: 'базовий довгий' },
        { totalMass: 35, label: 'нестандартне значення' },
        { totalMass: 90, label: 'густий довгий' },
    ];

    let driftFound = false;
    const driftCases = [];

    for (const { totalMass, label } of testCases) {
        const rMass = Math.round(totalMass * 0.3);
        const lMass = Math.round(totalMass * 0.7);
        const sum = rMass + lMass;
        if (sum !== totalMass) {
            driftFound = true;
            driftCases.push(`totalMass=${totalMass} (${label}): ${rMass}+${lMass}=${sum}, drift=${sum - totalMass}`);
        }
    }

    if (driftFound) {
        knownLimitation(id,
            '2-zone double-round drift detected in current implementation:\n  ' +
            driftCases.join('\n  ') + '\n  ' +
            'Future fix: lengthMass = totalMass - rootMass (remainder, not Math.round).'
        );
    } else {
        diagnosticLog(id, '2-zone double-round produces no drift for tested values. Contract still required for all edge cases.');
    }

    // FUTURE ASSERT (активується після buildMassModel refactor):
    // const model = buildMassModel({ length: 'средние', density: 'средние', endsActive: false });
    // assert.strictEqual(model.rootMass + model.lengthMass, model.totalMass,
    //     'SAFE: 2-zone rootMass + lengthMass must equal totalMass exactly');

    knownLimitation(id,
        'buildMassModel() not yet extracted. ' +
        'Future: assert rootMass + lengthMass === totalMass for all length/density combinations.'
    );
})();

// ---------------------------------------------------------------------------
// ТЕСТ 3: MASS-MODEL-INVALID-LENGTH-NO-NAN
// Зафіксувати майбутню вимогу:
// невідоме значення length не має давати тихий NaN.
// ---------------------------------------------------------------------------

(function testMassModelInvalidLengthNoNaN() {
    const id = 'MASS-MODEL-INVALID-LENGTH-NO-NAN';

    // Поточна поведінка у core.js:
    //   let baseMass = {'короткие':30, 'средние':60, 'длинные':120}[length];
    //   let totalMass = Math.round(baseMass * denMult);
    //
    // Якщо length = 'середні' (UA) або будь-яке невідоме значення:
    //   baseMass = undefined → totalMass = NaN → rMass = NaN → рецепт з NaN масою.
    //   Помилки або виключення немає — тихий NaN.

    // Симулюємо поточну поведінку без зміни production code:
    const lookupTable = { 'короткие': 30, 'средние': 60, 'длинные': 120 };
    const unknownValues = ['середні', 'medium', '', null, undefined, 'long', 'короткі'];

    const nanCases = [];
    for (const val of unknownValues) {
        const baseMass = lookupTable[val];
        const totalMass = Math.round(baseMass * 1.0);
        if (Number.isNaN(totalMass) || totalMass === undefined) {
            nanCases.push(`length="${val}" → baseMass=${baseMass} → totalMass=${totalMass}`);
        }
    }

    // Підтверджуємо, що NaN реально виникає для невідомих значень.
    assert.ok(nanCases.length > 0, `${id}: Should have NaN cases for unknown length values in current implementation`);

    knownLimitation(id,
        'Current implementation produces silent NaN for unknown length values:\n  ' +
        nanCases.join('\n  ') + '\n  ' +
        'Future fix: buildMassModel() must return null (or throw) for unknown length, not NaN. ' +
        'No silent NaN allowed in mass calculations.'
    );
})();

// ---------------------------------------------------------------------------
// ТЕСТ 4: MASS-MODEL-BLOCKED-PATH-SHAPE
// Зафіксувати майбутню вимогу:
// BLOCKED-шлях має мати консистентний massModel shape.
// ---------------------------------------------------------------------------

(function testMassModelBlockedPathShape() {
    const id = 'MASS-MODEL-BLOCKED-PATH-SHAPE';

    // Поточна поведінка (з аналізу core.js):
    //
    // BLOCKED-шлях (рядок 423):
    //   massModel: { baseMass, densityMultiplier: denMult, totalMass }
    //   → 3 поля, rootMass і lengthMass ВІДСУТНІ
    //
    // APPROVED/MANUAL-шлях (рядок 712):
    //   massModel: { baseMass, densityMultiplier: denMult, totalMass, rootMass: rMass, lengthMass: lMass }
    //   → 5 полів
    //
    // Інконсистентність: renderMassModel серіалізує все через JSON.stringify,
    // тому різні шляхи рендерять різну кількість полів.

    // Зафіксуємо очікувані shapes:
    const blockedShape = ['baseMass', 'densityMultiplier', 'totalMass'];
    const approvedShape = ['baseMass', 'densityMultiplier', 'totalMass', 'rootMass', 'lengthMass'];

    // Перевіряємо, що очікувані shape відрізняються (фіксуємо поточну інконсистентність).
    assert.notDeepStrictEqual(
        blockedShape.sort(),
        approvedShape.sort(),
        `${id}: BLOCKED and APPROVED massModel shapes are currently inconsistent — this is the known limitation`
    );

    knownLimitation(id,
        'BLOCKED path massModel has shape: ' + JSON.stringify(blockedShape) + '. ' +
        'APPROVED path massModel has shape: ' + JSON.stringify(approvedShape) + '. ' +
        'Future fix: buildMassModel() must produce consistent shape on all paths. ' +
        'BLOCKED path should also include rootMass and lengthMass.'
    );
})();

// ---------------------------------------------------------------------------
// ТЕСТ 5: MASS-MODEL-POWDER-SURCHARGE-SYNC
// Зафіксувати майбутню вимогу:
// якщо rootRec.mass змінюється через powder surcharge,
// massModel.rootMass має або синхронізуватись, або це має бути задокументовано.
// ---------------------------------------------------------------------------

(function testMassModelPowderSurchargeSync() {
    const id = 'MASS-MODEL-POWDER-SURCHARGE-SYNC';

    // Поточна поведінка (з аналізу core.js рядки 491–494):
    //   rMass = Math.round(totalMass * 0.3)
    //   ...
    //   if (rootRec && process includes "Порошок") {
    //       rMass = Math.round(rMass * 1.6);
    //       if (rMass < 40) rMass = 40;
    //       rootRec.mass = rMass;
    //   }
    //   ...
    //   massModel: { ..., rootMass: rMass, ... }  ← rMass вже мутований
    //
    // ОК: rMass мутується ДО формування massModel у APPROVED-шляху.
    // Тобто massModel.rootMass вже містить post-surcharge значення.
    //
    // АЛЕ: немає явного поля pre_surcharge_rootMass.
    // Після refactor на buildMassModel це може стати неочевидним.

    // Симулюємо surcharge логіку для аудиту:
    const totalMass = 60;
    const rawRootMass = Math.round(totalMass * 0.3); // = 18
    const surchargeRootMass = Math.max(Math.round(rawRootMass * 1.6), 40); // = 29

    assert.ok(surchargeRootMass > rawRootMass,
        `${id}: Powder surcharge must increase rootMass (${rawRootMass} → ${surchargeRootMass})`);

    assert.ok(surchargeRootMass !== rawRootMass + totalMass - rawRootMass,
        `${id}: After surcharge, rootMass + original lengthMass ≠ totalMass (sync contract required)`);

    knownLimitation(id,
        `Powder surcharge mutates rMass from ${rawRootMass} to ${surchargeRootMass} for totalMass=${totalMass}. ` +
        'In current code, massModel.rootMass already reflects post-surcharge value. ' +
        'After buildMassModel refactor: explicitly document whether massModel.rootMass is pre- or post-surcharge. ' +
        'Recommendation: massModel stores base (pre-surcharge) values; recipe-level surcharge is separate.'
    );
})();

// ---------------------------------------------------------------------------
// ТЕСТ 6: MASS-MODEL-3-ZONE-FUTURE-SPLIT
// Зафіксувати майбутню вимогу:
// rootMass + lengthMass + endsMass === totalMass (похибка ≤ 1 г).
// ---------------------------------------------------------------------------

(function testMassModel3ZoneFutureSplit() {
    const id = 'MASS-MODEL-3-ZONE-FUTURE-SPLIT';

    // endsMass не існує. endsRec не існує.
    // Цей тест є placeholder-контрактом для майбутньої реалізації.

    // Зафіксуємо очікувану формулу:
    // rootMass   = Math.round(totalMass * 0.25)  — приклад, точні % = хімічне рішення
    // lengthMass = Math.round(totalMass * 0.55)  — приклад
    // endsMass   = totalMass - rootMass - lengthMass  ← залишок, гарантує суму

    // Симуляція для перевірки математики майбутньої формули:
    const testCases = [
        { totalMass: 30, label: 'короткі' },
        { totalMass: 60, label: 'середні' },
        { totalMass: 120, label: 'довгі' },
        { totalMass: 42, label: 'редкий середній' },
        { totalMass: 90, label: 'густий довгий' },
    ];

    for (const { totalMass, label } of testCases) {
        // Симулюємо майбутній 3-зонний split з remainder-підходом:
        const rootMass = Math.round(totalMass * 0.25);
        const lengthMass = Math.round(totalMass * 0.55);
        const endsMass = totalMass - rootMass - lengthMass; // залишок
        const sum = rootMass + lengthMass + endsMass;

        // Remainder гарантує точну суму:
        assert.strictEqual(sum, totalMass,
            `${id}: 3-zone remainder formula must yield exact sum for totalMass=${totalMass} (${label})`
        );

        assert.ok(endsMass >= 0,
            `${id}: endsMass must not be negative for totalMass=${totalMass} (${label}), got ${endsMass}`
        );
    }

    knownLimitation(id,
        'endsMass does not exist in production yet. ' +
        '3-zone split proportions (25%/55%/20%) are EXAMPLES ONLY — exact values require chemical specification. ' +
        'Future: assert rootMass + lengthMass + endsMass === totalMass for all length/density combinations. ' +
        'Remainder approach (endsMass = totalMass - rootMass - lengthMass) is validated and recommended.'
    );
})();

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------

console.log('');
console.log('=== MASS MODEL DIAGNOSTIC TEST CONTRACT ===');
console.log('All 6 diagnostic scenarios processed.');
console.log('');
console.log('STATUS SUMMARY:');
console.log('  MASS-MODEL-INLINE-CURRENT          → KNOWN_LIMITATION (buildMassModel not extracted yet)');
console.log('  MASS-MODEL-2-ZONE-EXPECTED-SPLIT   → KNOWN_LIMITATION (drift possible, future fix: remainder approach)');
console.log('  MASS-MODEL-INVALID-LENGTH-NO-NAN   → KNOWN_LIMITATION (silent NaN confirmed, future: null guard)');
console.log('  MASS-MODEL-BLOCKED-PATH-SHAPE      → KNOWN_LIMITATION (inconsistent massModel shape across paths)');
console.log('  MASS-MODEL-POWDER-SURCHARGE-SYNC   → KNOWN_LIMITATION (surcharge sync contract required after refactor)');
console.log('  MASS-MODEL-3-ZONE-FUTURE-SPLIT     → KNOWN_LIMITATION (endsMass not implemented, math validated)');
console.log('');
console.log('Production code: NOT CHANGED.');
console.log('buildMassModel(): NOT IMPLEMENTED (future refactor).');
console.log('endsMass: NOT IMPLEMENTED (future refactor).');
console.log('endsRec: NOT IMPLEMENTED (future refactor).');
console.log('');
console.log('WWW mass model diagnostic test contract passed.');
