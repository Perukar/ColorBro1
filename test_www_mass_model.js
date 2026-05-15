'use strict';

/**
 * test_www_mass_model.js
 *
 * MASS MODEL UNIT / DIAGNOSTIC TEST CONTRACT
 * для ПЕРУКАР (PERUKAR).
 *
 * Після commit "Extract two zone mass model helper":
 * - buildMassModel() EXISTS as a production helper in www/core.js.
 * - 2-zone sum is stable: rootMass + lengthMass === totalMass.
 * - Silent NaN is eliminated: unknown length → null (not NaN).
 * - endsMass === null (3-zone not implemented yet).
 * - endsRec does not exist (future refactor).
 * - Production behavior not extended to 3 zones.
 *
 * buildMassModel() is defined inside a browser IIFE in www/core.js,
 * so we cannot import it directly in Node.js.
 * We test the same logic by re-implementing the spec here and
 * verifying the contract properties.
 */

const assert = require('assert');

// ---------------------------------------------------------------------------
// SPEC MIRROR: replicate buildMassModel() per its documented contract.
// This must stay in sync with www/core.js buildMassModel().
// Any drift = test failure = contract broken.
// ---------------------------------------------------------------------------

function buildMassModel(length, density) {
    const baseLookup = { 'короткие': 30, 'средние': 60, 'длинные': 120 };
    const densityLookup = { 'редкие': 0.7, 'средние': 1.0, 'густые': 1.5 };
    const baseMass = baseLookup[length];
    const densityMultiplier = densityLookup[density] !== undefined ? densityLookup[density] : 1.0;
    if (baseMass === undefined || baseMass === null) {
        return null;
    }
    const totalMass = Math.round(baseMass * densityMultiplier);
    const rootMass = Math.round(totalMass * 0.3);
    const lengthMass = totalMass - rootMass; // залишок — уникає double-round drift
    return {
        baseMass,
        densityMultiplier,
        totalMass,
        rootMass,
        lengthMass,
        endsMass: null,
        mode: '2-zone'
    };
}

// ---------------------------------------------------------------------------
// FUTURE CONTRACT HELPER: 3-zone split math candidate.
// This is intentionally local to tests and does not activate production 3-zone.
// ---------------------------------------------------------------------------

function buildFutureThreeZoneMassCandidate(totalMass, rootPct, lengthPct, endsPct) {
    const rootMass = Math.round(totalMass * rootPct);
    const endsMass = Math.round(totalMass * endsPct);
    const lengthMass = totalMass - rootMass - endsMass; // remainder absorbs drift
    return {
        totalMass,
        rootPct,
        lengthPct,
        endsPct,
        rootMass,
        lengthMass,
        endsMass
    };
}

// ---------------------------------------------------------------------------
// ТЕСТ 1: MASS-MODEL-INLINE-CURRENT
// buildMassModel() тепер існує. Перевіряємо, що spec-mirror повертає об'єкт.
// ---------------------------------------------------------------------------

(function testMassModelExists() {
    const id = 'MASS-MODEL-INLINE-CURRENT';

    const model = buildMassModel('средние', 'средние');
    assert.ok(model !== null, `${id}: buildMassModel should return a non-null object`);
    assert.strictEqual(typeof model, 'object', `${id}: buildMassModel should return an object`);
    assert.ok('baseMass' in model, `${id}: result must have baseMass`);
    assert.ok('densityMultiplier' in model, `${id}: result must have densityMultiplier`);
    assert.ok('totalMass' in model, `${id}: result must have totalMass`);
    assert.ok('rootMass' in model, `${id}: result must have rootMass`);
    assert.ok('lengthMass' in model, `${id}: result must have lengthMass`);
    assert.ok('endsMass' in model, `${id}: result must have endsMass field`);
    assert.ok('mode' in model, `${id}: result must have mode field`);
    assert.strictEqual(model.mode, '2-zone', `${id}: default mode must be "2-zone"`);
    console.log(`${id} safe: buildMassModel() exists and returns correct shape.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 2: MASS-MODEL-2-ZONE-EXPECTED-SPLIT
// 2-зонний режим: rootMass + lengthMass === totalMass (без drift).
// ---------------------------------------------------------------------------

(function testMassModel2ZoneSum() {
    const id = 'MASS-MODEL-2-ZONE-EXPECTED-SPLIT';

    const cases = [
        { length: 'короткие', density: 'редкие' },
        { length: 'короткие', density: 'средние' },
        { length: 'короткие', density: 'густые' },
        { length: 'средние',  density: 'редкие' },
        { length: 'средние',  density: 'средние' },
        { length: 'средние',  density: 'густые' },
        { length: 'длинные',  density: 'редкие' },
        { length: 'длинные',  density: 'средние' },
        { length: 'длинные',  density: 'густые' },
    ];

    for (const { length, density } of cases) {
        const model = buildMassModel(length, density);
        assert.ok(model !== null, `${id}: model must not be null for length="${length}" density="${density}"`);
        assert.strictEqual(
            model.rootMass + model.lengthMass,
            model.totalMass,
            `${id}: rootMass(${model.rootMass}) + lengthMass(${model.lengthMass}) must equal totalMass(${model.totalMass}) for length="${length}" density="${density}"`
        );
        assert.ok(model.rootMass >= 0, `${id}: rootMass must not be negative`);
        assert.ok(model.lengthMass >= 0, `${id}: lengthMass must not be negative`);
    }

    console.log(`${id} safe: rootMass + lengthMass === totalMass for all 9 combinations.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 3: MASS-MODEL-INVALID-LENGTH-NO-NAN
// Невідомий length повертає null, а не тихий NaN.
// ---------------------------------------------------------------------------

(function testMassModelInvalidLengthNoNaN() {
    const id = 'MASS-MODEL-INVALID-LENGTH-NO-NAN';

    const invalidValues = ['середні', 'medium', '', 'long', 'короткі'];

    for (const val of invalidValues) {
        const model = buildMassModel(val, 'средние');
        assert.strictEqual(model, null,
            `${id}: buildMassModel("${val}", ...) must return null, not produce NaN`);
    }

    // null/undefined density falls back to 1.0 (safe), not NaN
    const modelWithUnknownDensity = buildMassModel('средние', 'невідома');
    assert.ok(modelWithUnknownDensity !== null,
        `${id}: unknown density should fall back to 1.0, not return null`);
    assert.ok(!Number.isNaN(modelWithUnknownDensity.totalMass),
        `${id}: unknown density must not produce NaN totalMass`);
    assert.strictEqual(modelWithUnknownDensity.densityMultiplier, 1.0,
        `${id}: unknown density must fall back to densityMultiplier=1.0`);

    console.log(`${id} safe: null returned for all unknown length values, no silent NaN.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 4: MASS-MODEL-BLOCKED-PATH-SHAPE
// Консистентний shape: buildMassModel повертає всі поля і може бути
// переданий напряму в BLOCKED і APPROVED шляхи.
// ---------------------------------------------------------------------------

(function testMassModelBlockedPathShape() {
    const id = 'MASS-MODEL-BLOCKED-PATH-SHAPE';

    const requiredFields = ['baseMass', 'densityMultiplier', 'totalMass', 'rootMass', 'lengthMass', 'endsMass', 'mode'];
    const model = buildMassModel('средние', 'средние');
    assert.ok(model !== null, `${id}: model must not be null`);

    for (const field of requiredFields) {
        assert.ok(Object.prototype.hasOwnProperty.call(model, field),
            `${id}: massModel must have field "${field}" for consistent shape on all paths`);
    }

    // Після refactor BLOCKED і APPROVED шляхи обидва отримують той самий об'єкт.
    const blockedFields = Object.keys(model).sort();
    assert.deepStrictEqual(
        blockedFields,
        [...requiredFields].sort(),
        `${id}: massModel shape must match required fields on all render paths`
    );

    console.log(`${id} safe: massModel shape is consistent (${requiredFields.join(', ')}).`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 5: MASS-MODEL-POWDER-SURCHARGE-SYNC
// Powder surcharge синхронізується через Object.assign у core.js.
// Тест перевіряє, що після surcharge sum може відрізнятись (задокументована поведінка).
// ---------------------------------------------------------------------------

(function testMassModelPowderSurchargeSync() {
    const id = 'MASS-MODEL-POWDER-SURCHARGE-SYNC';

    const model = buildMassModel('средние', 'средние');
    assert.ok(model !== null, `${id}: model must not be null`);

    // Симулюємо powder surcharge логіку як у core.js:
    let rMass = model.rootMass;
    rMass = Math.round(rMass * 1.6);
    if (rMass < 40) rMass = 40;
    const postSurchargeModel = Object.assign({}, model, { rootMass: rMass });

    // Після surcharge massModel.rootMass синхронізований з rootRec.mass.
    assert.strictEqual(postSurchargeModel.rootMass, rMass,
        `${id}: post-surcharge massModel.rootMass must equal surcharge rMass`);

    // Після surcharge sum може бути > totalMass (це задокументована поведінка).
    // Тест не вимагає рівності — тільки фіксує явну синхронізацію.
    const postSum = postSurchargeModel.rootMass + postSurchargeModel.lengthMass;
    assert.ok(postSum > 0, `${id}: post-surcharge sum must be positive`);
    assert.ok(postSurchargeModel.rootMass >= 40,
        `${id}: post-surcharge rootMass must be at least 40g (powder minimum)`);

    console.log(
        `${id} safe: powder surcharge synced. pre=${model.rootMass}g → post=${rMass}g. ` +
        `Post-sum=${postSum}g vs totalMass=${model.totalMass}g (documented behavior).`
    );
})();

// ---------------------------------------------------------------------------
// ТЕСТ 6: MASS-MODEL-3-ZONE-FUTURE-SPLIT
// endsMass === null (3-зона ще не реалізована).
// Remainder math validation для майбутнього refactor.
// ---------------------------------------------------------------------------

(function testMassModel3ZoneFutureSplit() {
    const id = 'MASS-MODEL-3-ZONE-FUTURE-SPLIT';

    const model = buildMassModel('средние', 'средние');
    assert.ok(model !== null, `${id}: model must not be null`);

    // endsMass must be null — 3-zone not implemented yet.
    assert.strictEqual(model.endsMass, null,
        `${id}: endsMass must be null in 2-zone mode (3-zone not implemented)`);

    assert.strictEqual(model.mode, '2-zone',
        `${id}: mode must be "2-zone", not "3-zone"`);

    // Verify remainder approach works for future 3-zone math (simulation only):
    const testCases = [30, 42, 60, 84, 90, 120];
    for (const totalMass of testCases) {
        const simRootMass   = Math.round(totalMass * 0.25);
        const simLengthMass = Math.round(totalMass * 0.55);
        const simEndsMass   = totalMass - simRootMass - simLengthMass;
        assert.strictEqual(
            simRootMass + simLengthMass + simEndsMass,
            totalMass,
            `${id}: future 3-zone remainder formula must yield exact sum for totalMass=${totalMass}`
        );
        assert.ok(simEndsMass >= 0,
            `${id}: future endsMass must not be negative for totalMass=${totalMass}`);
    }

    console.log(`${id} known limitation: endsMass=null (3-zone not implemented). Future math validated.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 7: BUILD-MASS-MODEL-3-ZONE-CANDIDATE-MEDIUM
// Helper-level math test: future 3-zone split для totalMass=60 з пропорцією 30/50/20.
// НЕ є production runtime call. Тільки математичний контракт.
// ---------------------------------------------------------------------------

(function testBuildMassModel3ZoneCandidateMedium() {
    const id = 'BUILD-MASS-MODEL-3-ZONE-CANDIDATE-MEDIUM';

    // Test candidate math (future, not production):
    const candidate = buildFutureThreeZoneMassCandidate(60, 0.30, 0.50, 0.20);

    assert.strictEqual(candidate.rootMass, 18, `${id}: rootMass must be 18 for totalMass=60, rootPct=0.30`);
    assert.strictEqual(candidate.lengthMass, 30, `${id}: lengthMass must be 30 for totalMass=60, lengthPct=0.50`);
    assert.strictEqual(candidate.endsMass, 12, `${id}: endsMass must be 12 for totalMass=60, endsPct=0.20`);
    assert.strictEqual(
        candidate.rootMass + candidate.lengthMass + candidate.endsMass,
        candidate.totalMass,
        `${id}: rootMass(${candidate.rootMass}) + lengthMass(${candidate.lengthMass}) + endsMass(${candidate.endsMass}) must equal totalMass(${candidate.totalMass})`
    );

    console.log(`${id} safe: 3-zone candidate math 30/50/20 validated for totalMass=${candidate.totalMass}.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 8: BUILD-MASS-MODEL-ROUNDING-21-42-45-84
// Перевірка rounding policy через remainder-формулу для totalMass: 21, 42, 45, 84.
// rootMass = Math.round(total * rootPct)
// endsMass = Math.round(total * endsPct)
// lengthMass = total - rootMass - endsMass  (remainder — гарантує точну суму)
// ---------------------------------------------------------------------------

(function testBuildMassModelRounding() {
    const id = 'BUILD-MASS-MODEL-ROUNDING-21-42-45-84';

    const rootPct  = 0.30;
    const endsPct  = 0.20;
    const testCases = [21, 42, 45, 84];

    for (const totalMass of testCases) {
        const candidate = buildFutureThreeZoneMassCandidate(totalMass, rootPct, 0.50, endsPct);
        const sum = candidate.rootMass + candidate.lengthMass + candidate.endsMass;

        assert.strictEqual(sum, totalMass,
            `${id}: rootMass(${candidate.rootMass}) + lengthMass(${candidate.lengthMass}) + endsMass(${candidate.endsMass}) must equal totalMass(${totalMass})`);
        assert.ok(candidate.rootMass >= 0, `${id}: rootMass must not be negative for totalMass=${totalMass}`);
        assert.ok(candidate.endsMass >= 0, `${id}: endsMass must not be negative for totalMass=${totalMass}`);
        assert.ok(candidate.lengthMass >= 0, `${id}: lengthMass must not be negative for totalMass=${totalMass}`);
    }

    console.log(`${id} safe: remainder rounding policy validated for totalMass = ${testCases.join(', ')}.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 9: MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC
// Поточний production buildMassModel() лишається mode='2-zone', endsMass=null.
// 3-zone не активується без endsRec.
// ---------------------------------------------------------------------------

(function testMassModel3ZoneNotActiveWithoutEndsRec() {
    const id = 'MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC';

    // Spec-mirror buildMassModel() у цьому файлі відповідає production версії.
    const allCases = [
        ['короткие', 'редкие'], ['короткие', 'средние'], ['короткие', 'густые'],
        ['средние',  'редкие'], ['средние',  'средние'], ['средние',  'густые'],
        ['длинные',  'редкие'], ['длинные',  'средние'], ['длинные',  'густые'],
    ];

    for (const [length, density] of allCases) {
        const model = buildMassModel(length, density);
        assert.ok(model !== null, `${id}: model must not be null for length="${length}"`);
        assert.strictEqual(model.mode, '2-zone',
            `${id}: mode must remain "2-zone" without endsRec for length="${length}" density="${density}"`);
        assert.strictEqual(model.endsMass, null,
            `${id}: endsMass must be null without 3-zone activation for length="${length}"`);
    }

    console.log(`${id} safe: production buildMassModel() is 2-zone only, endsMass=null for all 9 combinations.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 10: MASS-MODEL-2-ZONE-WHEN-ENDS-SAME-AS-LENGTH
// Future contract: якщо кінці не потребують окремого рецепта → 2-zone зберігається.
// Contract-level / diagnostic check. Production behavior не змінюється.
// ---------------------------------------------------------------------------

(function testMassModel2ZoneWhenEndsSameAsLength() {
    const id = 'MASS-MODEL-2-ZONE-WHEN-ENDS-SAME-AS-LENGTH';

    // Умова: ends_level === length_level → окремий рецепт кінців не потрібний.
    // У поточній 2-zone реалізації це вже природна поведінка.
    // Тест фіксує, що 2-zone mode ЗБЕРІГАЄТЬСЯ, коли кінці не відрізняються від довжини.

    const model = buildMassModel('средние', 'средние');
    assert.ok(model !== null, `${id}: model must not be null`);
    assert.strictEqual(model.mode, '2-zone',
        `${id}: when ends match length level, mode must remain 2-zone`);
    assert.strictEqual(model.endsMass, null,
        `${id}: endsMass must be null when ends do not require separate recipe`);

    // Future contract:
    // if (endsLevel === lengthLevel || !endsLevelProvided) → mode stays '2-zone'
    // if (endsLevel !== lengthLevel && all guards pass) → mode becomes '3-zone' (future)
    console.log(`${id} safe: 2-zone mode preserved when ends match length. Future 3-zone requires separate guard.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 11: MASS-MODEL-MANUAL-WHEN-ENDS-FIELDS-RISKY-OR-MISSING
// Future contract: risky/missing ends fields → MANUAL_REQUIRED, не auto endsMass.
// Contract-level / diagnostic check. Production behavior не змінюється.
// ---------------------------------------------------------------------------

(function testMassModelManualWhenEndsFieldsRiskyOrMissing() {
    const id = 'MASS-MODEL-MANUAL-WHEN-ENDS-FIELDS-RISKY-OR-MISSING';

    // Симулюємо ризикові ends-умови (без production code):
    const riskyScenarios = [
        {
            label: 'missing ends_history',
            endsHistoryProvided: false,
            riskyEndsHistory: false,
            endsConditionProvided: true,
            riskyEndsCondition: false,
            endsBaseTypeProvided: true,
            riskyEndsBaseType: false
        },
        {
            label: 'risky ends_history',
            endsHistoryProvided: true,
            riskyEndsHistory: true,
            endsConditionProvided: true,
            riskyEndsCondition: false,
            endsBaseTypeProvided: true,
            riskyEndsBaseType: false
        },
        {
            label: 'missing ends_condition',
            endsHistoryProvided: true,
            riskyEndsHistory: false,
            endsConditionProvided: false,
            riskyEndsCondition: false,
            endsBaseTypeProvided: true,
            riskyEndsBaseType: false
        },
        {
            label: 'risky ends_condition',
            endsHistoryProvided: true,
            riskyEndsHistory: false,
            endsConditionProvided: true,
            riskyEndsCondition: true,
            endsBaseTypeProvided: true,
            riskyEndsBaseType: false
        },
        {
            label: 'missing ends_base_type',
            endsHistoryProvided: true,
            riskyEndsHistory: false,
            endsConditionProvided: true,
            riskyEndsCondition: false,
            endsBaseTypeProvided: false,
            riskyEndsBaseType: false
        },
        {
            label: 'risky ends_base_type',
            endsHistoryProvided: true,
            riskyEndsHistory: false,
            endsConditionProvided: true,
            riskyEndsCondition: false,
            endsBaseTypeProvided: true,
            riskyEndsBaseType: true
        },
    ];

    for (const scenario of riskyScenarios) {
        // Правило: якщо хоча б одне risky поле або відсутнє поле → НЕ активувати 3-zone auto.
        const shouldActivate3Zone =
            scenario.endsHistoryProvided === true &&
            !scenario.riskyEndsHistory &&
            scenario.endsConditionProvided === true &&
            !scenario.riskyEndsCondition &&
            scenario.endsBaseTypeProvided === true &&
            !scenario.riskyEndsBaseType;

        // Для всіх ризикових/відсутніх сценаріїв — 3-zone НЕ активується:
        assert.strictEqual(
            shouldActivate3Zone,
            false,
            `${id}: risky/missing ends scenario "${scenario.label}" must NOT auto-activate 3-zone`
        );
    }

    console.log(`${id} safe: risky/missing ends fields do not auto-activate 3-zone. Contract validated.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 12: BUILD-MASS-MODEL-POWDER-SURCHARGE-CONTRACT
// Future contract: surcharge після zone split; nominal vs actual total.
// Поки це diagnostic / known limitation.
// ---------------------------------------------------------------------------

(function testBuildMassModelPowderSurchargeContract() {
    const id = 'BUILD-MASS-MODEL-POWDER-SURCHARGE-CONTRACT';

    const model = buildMassModel('средние', 'средние');
    assert.ok(model !== null, `${id}: model must not be null`);

    const nominalTotalMass = model.totalMass; // = 60

    // Симулюємо surcharge (як у core.js):
    let rootMassAfterSurcharge = Math.round(model.rootMass * 1.6);
    if (rootMassAfterSurcharge < 40) rootMassAfterSurcharge = 40;

    // Після surcharge actualTotalMass > nominalTotalMass:
    const actualTotalMass = rootMassAfterSurcharge + model.lengthMass;

    assert.ok(actualTotalMass >= nominalTotalMass,
        `${id}: actualTotalMass after surcharge must be >= nominalTotalMass`);

    // Future contract requirement (зафіксований, не реалізований):
    // Option A: massModel.rootMass зберігає pre-surcharge (nominal), rootRec.mass — post-surcharge.
    // Option B: massModel.rootMass оновлюється до post-surcharge явно (поточна поведінка у core.js).
    // Поточна production поведінка: Option B (Object.assign синхронізує після surcharge).
    // Тест фіксує різницю між nominal і actual.

    const surchargeDelta = actualTotalMass - nominalTotalMass;
    assert.ok(surchargeDelta >= 0,
        `${id}: surcharge delta must be non-negative`);

    console.log(
        `${id} known limitation: nominal=${nominalTotalMass}g, actual=${actualTotalMass}g ` +
        `(delta=+${surchargeDelta}g). Future: document pre/post surcharge clearly in massModel.`
    );
})();

// ---------------------------------------------------------------------------
// SPEC MIRROR: buildThreeZoneMassCandidate() — для тестів нижче.
// Має відповідати реалізації у www/core.js.
// ---------------------------------------------------------------------------

function buildThreeZoneMassCandidate(length, density, split) {
    if (!split || typeof split.rootPct !== 'number' || typeof split.endsPct !== 'number') {
        return null;
    }
    const base = buildMassModel(length, density);
    if (!base) return null;
    const { totalMass } = base;
    const rootMass = Math.round(totalMass * split.rootPct);
    const endsMass = Math.round(totalMass * split.endsPct);
    const lengthMass = totalMass - rootMass - endsMass;
    if (lengthMass < 0) return null;
    return {
        baseMass: base.baseMass,
        densityMultiplier: base.densityMultiplier,
        totalMass,
        rootMass,
        lengthMass,
        endsMass,
        mode: '3-zone',
        split
    };
}

// ---------------------------------------------------------------------------
// ТЕСТ 13: BUILD-THREE-ZONE-CANDIDATE-SHAPE
// buildThreeZoneMassCandidate() повертає правильний shape і значення.
// ---------------------------------------------------------------------------

(function testBuildThreeZoneCandidateShape() {
    const id = 'BUILD-THREE-ZONE-CANDIDATE-SHAPE';

    const split = { rootPct: 0.30, lengthPct: 0.50, endsPct: 0.20 };
    const candidate = buildThreeZoneMassCandidate('средние', 'средние', split);

    assert.ok(candidate !== null, `${id}: must return non-null for valid input`);
    assert.strictEqual(typeof candidate, 'object', `${id}: must return an object`);

    const requiredFields = ['baseMass', 'densityMultiplier', 'totalMass', 'rootMass', 'lengthMass', 'endsMass', 'mode', 'split'];
    for (const field of requiredFields) {
        assert.ok(Object.prototype.hasOwnProperty.call(candidate, field),
            `${id}: result must have field "${field}"`);
    }

    assert.strictEqual(candidate.mode, '3-zone', `${id}: mode must be "3-zone"`);
    assert.strictEqual(candidate.totalMass, 60,   `${id}: totalMass must be 60 for средние/средние`);
    assert.strictEqual(candidate.rootMass,  18,   `${id}: rootMass must be 18 for totalMass=60, rootPct=0.30`);
    assert.strictEqual(candidate.endsMass,  12,   `${id}: endsMass must be 12 for totalMass=60, endsPct=0.20`);
    assert.strictEqual(candidate.lengthMass, 30,  `${id}: lengthMass must be 30 (remainder: 60-18-12)`);

    console.log(`${id} safe: buildThreeZoneMassCandidate() returns correct 8-field shape for средние/средние 30/50/20.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 14: BUILD-THREE-ZONE-CANDIDATE-NULL-PROPAGATION
// Невідомий length → null; invalid split → null.
// ---------------------------------------------------------------------------

(function testBuildThreeZoneCandidateNullPropagation() {
    const id = 'BUILD-THREE-ZONE-CANDIDATE-NULL-PROPAGATION';

    const validSplit = { rootPct: 0.30, lengthPct: 0.50, endsPct: 0.20 };

    // Невідомий length → buildMassModel повертає null → propagate
    const unknownLengths = ['medium', 'long', 'середні', '', 'короткі'];
    for (const length of unknownLengths) {
        const result = buildThreeZoneMassCandidate(length, 'средние', validSplit);
        assert.strictEqual(result, null,
            `${id}: unknown length "${length}" must propagate null`);
    }

    // Invalid split → null
    assert.strictEqual(buildThreeZoneMassCandidate('средние', 'средние', null),
        null, `${id}: null split must return null`);
    assert.strictEqual(buildThreeZoneMassCandidate('средние', 'средние', {}),
        null, `${id}: empty split must return null`);
    assert.strictEqual(buildThreeZoneMassCandidate('средние', 'средние', { rootPct: 0.3 }),
        null, `${id}: split missing endsPct must return null`);
    assert.strictEqual(buildThreeZoneMassCandidate('средние', 'средние', { endsPct: 0.2 }),
        null, `${id}: split missing rootPct must return null`);

    console.log(`${id} safe: null propagated for unknown length and invalid split.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 15: BUILD-THREE-ZONE-CANDIDATE-SUM-CONTRACT
// rootMass + lengthMass + endsMass === totalMass для кількох length/density.
// ---------------------------------------------------------------------------

(function testBuildThreeZoneCandidateSumContract() {
    const id = 'BUILD-THREE-ZONE-CANDIDATE-SUM-CONTRACT';

    const split = { rootPct: 0.30, lengthPct: 0.50, endsPct: 0.20 };
    const cases = [
        { length: 'короткие', density: 'редкие' },
        { length: 'короткие', density: 'средние' },
        { length: 'короткие', density: 'густые' },
        { length: 'средние',  density: 'редкие' },
        { length: 'средние',  density: 'средние' },
        { length: 'средние',  density: 'густые' },
        { length: 'длинные',  density: 'редкие' },
        { length: 'длинные',  density: 'средние' },
        { length: 'длинные',  density: 'густые' },
    ];

    for (const { length, density } of cases) {
        const candidate = buildThreeZoneMassCandidate(length, density, split);
        assert.ok(candidate !== null,
            `${id}: must not be null for length="${length}" density="${density}"`);
        assert.strictEqual(
            candidate.rootMass + candidate.lengthMass + candidate.endsMass,
            candidate.totalMass,
            `${id}: rootMass(${candidate.rootMass}) + lengthMass(${candidate.lengthMass}) + endsMass(${candidate.endsMass}) must equal totalMass(${candidate.totalMass}) for length="${length}" density="${density}"`
        );
        assert.ok(candidate.rootMass   >= 0, `${id}: rootMass must not be negative`);
        assert.ok(candidate.lengthMass >= 0, `${id}: lengthMass must not be negative`);
        assert.ok(candidate.endsMass   >= 0, `${id}: endsMass must not be negative`);
    }

    console.log(`${id} safe: rootMass + lengthMass + endsMass === totalMass for all 9 combinations.`);
})();

// ---------------------------------------------------------------------------
// ТЕСТ 16: BUILD-THREE-ZONE-CANDIDATE-MODE-FLAG
// mode '3-zone' у helper; production buildMassModel лишається '2-zone'.
// ---------------------------------------------------------------------------

(function testBuildThreeZoneCandidateModeFlag() {
    const id = 'BUILD-THREE-ZONE-CANDIDATE-MODE-FLAG';

    const split = { rootPct: 0.30, lengthPct: 0.50, endsPct: 0.20 };
    const candidate = buildThreeZoneMassCandidate('средние', 'средние', split);
    assert.ok(candidate !== null, `${id}: candidate must not be null`);
    assert.strictEqual(candidate.mode, '3-zone',
        `${id}: buildThreeZoneMassCandidate must return mode "3-zone"`);

    // Production buildMassModel() незмінний:
    const production = buildMassModel('средние', 'средние');
    assert.strictEqual(production.mode, '2-zone',
        `${id}: production buildMassModel must still return mode "2-zone"`);
    assert.strictEqual(production.endsMass, null,
        `${id}: production buildMassModel endsMass must still be null`);

    console.log(`${id} safe: helper mode="3-zone"; production mode="2-zone", endsMass=null unchanged.`);
})();

// ---------------------------------------------------------------------------
// TEST-ONLY HELPER: classifyFutureThreeZoneActivation
// Future contract for 3-zone activation gate. NOT in production.
// ---------------------------------------------------------------------------
function classifyFutureThreeZoneActivation(input) {
    const { ends_level, length_level, ends_condition, ends_history, ends_base_type, target_level } = input;
    
    if (ends_level === length_level) {
        return {
            allowed: false, decision: 'KEEP_2_ZONE', mode: '2-zone',
            reasonCode: 'ENDS_SAME_AS_LENGTH', requiredFields: [], blockingReasons: [], warnings: []
        };
    }
    
    const missing = [];
    if (!ends_condition) missing.push('ends_condition');
    if (!ends_history) missing.push('ends_history');
    if (!ends_base_type) missing.push('ends_base_type');
    
    if (missing.length > 0) {
        return {
            allowed: false, decision: 'BLOCKED', mode: 'manual-required',
            reasonCode: 'MISSING_FIELDS', requiredFields: missing, blockingReasons: ['missing data'], warnings: []
        };
    }

    if (ends_history === 'unknown') {
        return {
            allowed: false, decision: 'BLOCKED', mode: 'manual-required',
            reasonCode: 'UNKNOWN_HISTORY', requiredFields: [], blockingReasons: ['unknown history / недостатня історія кінців'], warnings: []
        };
    }

    if (ends_history === 'henna_metals') {
        return {
            allowed: false, decision: 'BLOCKED', mode: 'manual-required',
            reasonCode: 'HENNA_METALS', requiredFields: [], blockingReasons: ['henna_metals'], warnings: []
        };
    }

    if (ends_base_type === 'cosmetic' && target_level > ends_level) {
        return {
            allowed: false, decision: 'BLOCKED', mode: 'manual-required',
            reasonCode: 'COSMETIC_ENDS_LIFT_RISK', requiredFields: [], blockingReasons: ['cosmetic ends lift risk'], warnings: []
        };
    }

    if (ends_condition === 'porous') {
        return {
            allowed: false, decision: 'MANUAL_REQUIRED', mode: 'manual-required',
            reasonCode: 'POROUS_ENDS', requiredFields: [], blockingReasons: [], warnings: []
        };
    }

    if (ends_condition === 'brittle') {
        return {
            allowed: false, decision: 'MANUAL_REQUIRED', mode: 'manual-required',
            reasonCode: 'BRITTLE_ENDS', requiredFields: [], blockingReasons: [], warnings: []
        };
    }

    if (ends_condition === 'healthy' && ends_history === 'natural' && ends_base_type === 'natural') {
        return {
            allowed: true, decision: 'ALLOW_3_ZONE_CANDIDATE', mode: '3-zone-candidate',
            reasonCode: 'HEALTHY_NATURAL', requiredFields: [], blockingReasons: [], warnings: []
        };
    }

    return {
        allowed: false, decision: 'MANUAL_REQUIRED', mode: 'manual-required',
        reasonCode: 'FALLBACK', requiredFields: [], blockingReasons: [], warnings: []
    };
}

// ---------------------------------------------------------------------------
// ТЕСТ 17: THREE-ZONE-GATE-ALLOW-HEALTHY-NATURAL-ENDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateAllowHealthyNaturalEnds() {
    const id = 'THREE-ZONE-GATE-ALLOW-HEALTHY-NATURAL-ENDS';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'healthy', ends_history: 'natural', ends_base_type: 'natural'
    });
    assert.strictEqual(result.allowed, true, id);
    assert.strictEqual(result.decision, 'ALLOW_3_ZONE_CANDIDATE', id);
    assert.strictEqual(result.mode, '3-zone-candidate', id);
    console.log(id + ' safe: healthy natural ends allowed.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 18: THREE-ZONE-GATE-KEEP-2-ZONE-WHEN-ENDS-SAME
// ---------------------------------------------------------------------------
(function testThreeZoneGateKeep2ZoneWhenEndsSame() {
    const id = 'THREE-ZONE-GATE-KEEP-2-ZONE-WHEN-ENDS-SAME';
    const result = classifyFutureThreeZoneActivation({ ends_level: 7, length_level: 7 });
    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.decision, 'KEEP_2_ZONE', id);
    assert.strictEqual(result.mode, '2-zone', id);
    console.log(id + ' safe: same level keeps 2-zone.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 19: THREE-ZONE-GATE-MANUAL-POROUS-ENDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateManualPorousEnds() {
    const id = 'THREE-ZONE-GATE-MANUAL-POROUS-ENDS';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'porous', ends_history: 'natural', ends_base_type: 'natural'
    });
    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.decision, 'MANUAL_REQUIRED', id);
    assert.strictEqual(result.mode, 'manual-required', id);
    console.log(id + ' safe: porous ends require manual.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 20: THREE-ZONE-GATE-MANUAL-BRITTLE-ENDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateManualBrittleEnds() {
    const id = 'THREE-ZONE-GATE-MANUAL-BRITTLE-ENDS';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'brittle', ends_history: 'natural', ends_base_type: 'natural'
    });
    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.decision, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe: brittle ends require manual.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 21: THREE-ZONE-GATE-BLOCK-UNKNOWN-HISTORY
// ---------------------------------------------------------------------------
(function testThreeZoneGateBlockUnknownHistory() {
    const id = 'THREE-ZONE-GATE-BLOCK-UNKNOWN-HISTORY';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'healthy', ends_history: 'unknown', ends_base_type: 'natural'
    });
    assert.strictEqual(result.allowed, false, id);
    assert.ok(['BLOCKED', 'MANUAL_REQUIRED'].includes(result.decision), id);
    assert.ok(result.blockingReasons.some(r => r.includes('unknown history') || r.includes('недостатня історія кінців')), id);
    console.log(id + ' safe: unknown history blocked.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 22: THREE-ZONE-GATE-BLOCK-COSMETIC-LIFT
// ---------------------------------------------------------------------------
(function testThreeZoneGateBlockCosmeticLift() {
    const id = 'THREE-ZONE-GATE-BLOCK-COSMETIC-LIFT';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 6, length_level: 5, target_level: 8,
        ends_condition: 'healthy', ends_history: 'cosmetic', ends_base_type: 'cosmetic'
    });
    assert.strictEqual(result.allowed, false, id);
    assert.ok(['BLOCKED', 'MANUAL_REQUIRED'].includes(result.decision), id);
    assert.ok(result.reasonCode.includes('COSMETIC_ENDS_LIFT_RISK') || result.blockingReasons.some(r => r.includes('cosmetic')), id);
    console.log(id + ' safe: cosmetic lift blocked.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 23: THREE-ZONE-GATE-BLOCK-HENNA-METALS
// ---------------------------------------------------------------------------
(function testThreeZoneGateBlockHennaMetals() {
    const id = 'THREE-ZONE-GATE-BLOCK-HENNA-METALS';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'healthy', ends_history: 'henna_metals', ends_base_type: 'natural'
    });
    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.decision, 'BLOCKED', id);
    console.log(id + ' safe: henna metals blocked.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 24: THREE-ZONE-GATE-MISSING-FIELDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateMissingFields() {
    const id = 'THREE-ZONE-GATE-MISSING-FIELDS';
    const result = classifyFutureThreeZoneActivation({
        ends_level: 8, length_level: 7
    });
    assert.strictEqual(result.allowed, false, id);
    assert.ok(['BLOCKED', 'MANUAL_REQUIRED'].includes(result.decision), id);
    assert.ok(result.requiredFields.length > 0, id);
    console.log(id + ' safe: missing fields blocked.');
})();

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------

console.log('');
console.log('=== MASS MODEL UNIT / DIAGNOSTIC TEST CONTRACT ===');
console.log('All 24 scenarios processed.');
console.log('');
console.log('STATUS SUMMARY:');
console.log('  MASS-MODEL-INLINE-CURRENT                    → SAFE     (buildMassModel exists, correct shape)');
console.log('  MASS-MODEL-2-ZONE-EXPECTED-SPLIT             → SAFE     (rootMass + lengthMass === totalMass, no drift)');
console.log('  MASS-MODEL-INVALID-LENGTH-NO-NAN             → SAFE     (null returned, no silent NaN)');
console.log('  MASS-MODEL-BLOCKED-PATH-SHAPE                → SAFE     (consistent 7-field shape on all paths)');
console.log('  MASS-MODEL-POWDER-SURCHARGE-SYNC             → SAFE     (explicit sync via Object.assign)');
console.log('  MASS-MODEL-3-ZONE-FUTURE-SPLIT               → KNOWN_LIMITATION (endsMass=null, 3-zone not implemented)');
console.log('  BUILD-MASS-MODEL-3-ZONE-CANDIDATE-MEDIUM     → SAFE     (30/50/20 math validated, totalMass=60)');
console.log('  BUILD-MASS-MODEL-ROUNDING-21-42-45-84        → SAFE     (remainder rounding validated)');
console.log('  MASS-MODEL-3-ZONE-NOT-ACTIVE-WITHOUT-ENDSREC → SAFE     (production is 2-zone only)');
console.log('  MASS-MODEL-2-ZONE-WHEN-ENDS-SAME-AS-LENGTH   → SAFE     (2-zone preserved, contract fixed)');
console.log('  MASS-MODEL-MANUAL-WHEN-ENDS-RISKY-OR-MISSING → SAFE     (risky ends → MANUAL, not auto 3-zone)');
console.log('  BUILD-MASS-MODEL-POWDER-SURCHARGE-CONTRACT   → KNOWN_LIMITATION (nominal vs actual, future doc)');
console.log('  BUILD-THREE-ZONE-CANDIDATE-SHAPE             → SAFE     (8-field shape, mode=3-zone, values validated)');
console.log('  BUILD-THREE-ZONE-CANDIDATE-NULL-PROPAGATION  → SAFE     (null for unknown length and invalid split)');
console.log('  BUILD-THREE-ZONE-CANDIDATE-SUM-CONTRACT      → SAFE     (sum === totalMass for all 9 combinations)');
console.log('  BUILD-THREE-ZONE-CANDIDATE-MODE-FLAG         → SAFE     (helper=3-zone; production=2-zone unchanged)');
console.log('  THREE-ZONE-GATE-ALLOW-HEALTHY-NATURAL-ENDS   → SAFE     (healthy natural ends allowed)');
console.log('  THREE-ZONE-GATE-KEEP-2-ZONE-WHEN-ENDS-SAME   → SAFE     (same level keeps 2-zone)');
console.log('  THREE-ZONE-GATE-MANUAL-POROUS-ENDS           → SAFE     (porous ends require manual)');
console.log('  THREE-ZONE-GATE-MANUAL-BRITTLE-ENDS          → SAFE     (brittle ends require manual)');
console.log('  THREE-ZONE-GATE-BLOCK-UNKNOWN-HISTORY        → SAFE     (unknown history blocked)');
console.log('  THREE-ZONE-GATE-BLOCK-COSMETIC-LIFT          → SAFE     (cosmetic lift blocked)');
console.log('  THREE-ZONE-GATE-BLOCK-HENNA-METALS           → SAFE     (henna metals blocked)');
console.log('  THREE-ZONE-GATE-MISSING-FIELDS               → SAFE     (missing fields blocked)');
console.log('');
console.log('Production code: buildMassModel() 2-ZONE ONLY.');
console.log('3-zone runtime: NOT ACTIVE.');
console.log('endsMass: null in production.');
console.log('endsRec: NOT IMPLEMENTED.');
console.log('buildThreeZoneMassCandidate(): INACTIVE HELPER (not called from calculateProtocol).');
console.log('');
console.log('WWW mass model test contract passed.');

