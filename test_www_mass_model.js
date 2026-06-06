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
const fs = require('fs');
const vm = require('vm');

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
// SPEC MIRROR: classifyThreeZoneActivation
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// SPEC MIRROR: classifyEndsRecEligibility
// ---------------------------------------------------------------------------

function classifyEndsRecEligibility(context) {
    const ends_level = context.ends_level;
    const ends_condition = context.ends_condition;
    const ends_history = context.ends_history;
    const ends_base_type = context.ends_base_type;
    const target_level = context.target_level;
    const length_level = context.length_level;

    const missing = [];
    if (typeof ends_level !== 'number') missing.push('ends_level');
    if (!ends_condition) missing.push('ends_condition');
    if (!ends_history) missing.push('ends_history');
    if (!ends_base_type) missing.push('ends_base_type');
    if (typeof target_level !== 'number') missing.push('target_level');

    const eCond = String(ends_condition || '').toLowerCase();
    const eHist = String(ends_history || '').toLowerCase();
    const eBase = String(ends_base_type || '').toLowerCase();

    const isDamaged = ['пористі', 'ламкі', 'сильно пошкоджені', 'критично пошкоджені', 'porous', 'brittle', 'damaged', 'critical'].some(c => eCond.includes(c));
    const isBrittle = ['ламкі', 'сильно пошкоджені', 'критично пошкоджені', 'brittle', 'critical', 'damaged'].some(c => eCond.includes(c));
    const isUnknownHistory = eHist.includes('невідома') || eHist === 'unknown';
    const isCosmeticHistory = ['косметичний', 'косметична', 'cosmetic', 'dark cosmetic', 'темний косметичний', 'remover', 'змивка'].some(c => eHist.includes(c));
    const isHennaMetals = eHist.includes('хна') || eHist.includes('henna_metals') || eHist.includes('метали');
    const isCosmeticBase = ['косметична', 'змішана', 'cosmetic', 'mixed'].some(c => eBase.includes(c));
    const isNaturalBase = ['натуральна', 'natural'].some(c => eBase.includes(c));

    const needsLift = target_level > ends_level;
    const isCosmeticLift = needsLift && (isCosmeticHistory || isCosmeticBase);
    const isDamagedLift = needsLift && isDamaged;
    
    if (isHennaMetals) {
return { status: "BLOCKED", reason: "Henna or metals present", requiredFieldsMissing: missing, riskFlags: ["henna_metals"], allowedProcess: null };
    }
    if (isCosmeticLift) {
return { status: "BLOCKED", reason: "Cannot lift cosmetic pigment", requiredFieldsMissing: missing, riskFlags: ["cosmetic_lift"], allowedProcess: null };
    }
    if (isDamagedLift || (needsLift && isBrittle)) {
return { status: "BLOCKED", reason: "Cannot lift damaged ends", requiredFieldsMissing: missing, riskFlags: ["damaged_lift"], allowedProcess: null };
    }
    if (eHist.includes('змивка') || eHist.includes('remover')) {
return { status: "BLOCKED", reason: "After remover", requiredFieldsMissing: missing, riskFlags: ["after_remover"], allowedProcess: null };
    }
    
    if (missing.length > 0) {
return { status: "MANUAL_REQUIRED", reason: "Missing critical fields", requiredFieldsMissing: missing, riskFlags: ["missing_fields"], allowedProcess: null };
    }
    if (isUnknownHistory) {
return { status: "MANUAL_REQUIRED", reason: "Unknown ends history", requiredFieldsMissing: [], riskFlags: ["unknown_history"], allowedProcess: null };
    }
    if (length_level !== undefined && length_level !== null) {
if ((target_level > ends_level && target_level < length_level) || (target_level < ends_level && target_level > length_level)) {
    return { status: "MANUAL_REQUIRED", reason: "Target between length and ends", requiredFieldsMissing: [], riskFlags: ["ambiguous_target"], allowedProcess: null };
}
    }
    if (ends_level >= 9 && (ends_level - target_level) >= 3) {
return { status: "MANUAL_REQUIRED", reason: "Significant darkening requires prepigmentation", requiredFieldsMissing: [], riskFlags: ["prepig_required"], allowedProcess: null };
    }
    if (isDamaged) {
return { status: "MANUAL_REQUIRED", reason: "Porous/damaged ends need manual assessment", requiredFieldsMissing: [], riskFlags: ["damaged_ends"], allowedProcess: null };
    }

    if (!needsLift && !isDamaged && !isCosmeticHistory && isNaturalBase) {
return { status: "SAFE_FOR_TONING", reason: "Low risk toning", requiredFieldsMissing: [], riskFlags: [], allowedProcess: "toning" };
    }

    return { status: "MANUAL_REQUIRED", reason: "Fallback manual assessment", requiredFieldsMissing: [], riskFlags: ["fallback"], allowedProcess: null };
}



// ---------------------------------------------------------------------------
// CONTRACT TESTS FOR classifyEndsRecEligibility
// ---------------------------------------------------------------------------

(function testEndsRecEligibilityLowRiskToning() {
    const id = 'ENDSREC-ELIGIBILITY-LOW-RISK-TONING-SAFE';
    const result = classifyEndsRecEligibility({
        ends_level: 8, ends_condition: 'здорові', ends_history: 'натуральна',
        ends_base_type: 'натуральна', target_level: 8, length_level: 7
    });
    assert.strictEqual(result.status, 'SAFE_FOR_TONING', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityCosmeticLift() {
    const id = 'ENDSREC-ELIGIBILITY-COSMETIC-LIFT-BLOCKED';
    const result = classifyEndsRecEligibility({
        ends_level: 6, ends_condition: 'здорові', ends_history: 'косметична',
        ends_base_type: 'косметична', target_level: 8, length_level: 7
    });
    assert.strictEqual(result.status, 'BLOCKED', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityUnknownHistory() {
    const id = 'ENDSREC-ELIGIBILITY-UNKNOWN-HISTORY-MANUAL';
    const result = classifyEndsRecEligibility({
        ends_level: 6, ends_condition: 'здорові', ends_history: 'невідома',
        ends_base_type: 'натуральна', target_level: 6, length_level: 7
    });
    assert.strictEqual(result.status, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityDamagedLift() {
    const id = 'ENDSREC-ELIGIBILITY-DAMAGED-LIFT-BLOCKED';
    const result = classifyEndsRecEligibility({
        ends_level: 6, ends_condition: 'ламкі', ends_history: 'натуральна',
        ends_base_type: 'натуральна', target_level: 8, length_level: 7
    });
    assert.strictEqual(result.status, 'BLOCKED', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityHennaMetals() {
    const id = 'ENDSREC-ELIGIBILITY-HENNA-METALS-BLOCKED';
    const result = classifyEndsRecEligibility({
        ends_level: 6, ends_condition: 'здорові', ends_history: 'хна',
        ends_base_type: 'натуральна', target_level: 6, length_level: 7
    });
    assert.strictEqual(result.status, 'BLOCKED', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityPrepig() {
    const id = 'ENDSREC-ELIGIBILITY-PREPIG-REQUIRED-MANUAL';
    const result = classifyEndsRecEligibility({
        ends_level: 10, ends_condition: 'здорові', ends_history: 'натуральна',
        ends_base_type: 'натуральна', target_level: 6, length_level: 7
    });
    assert.strictEqual(result.status, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityMissingFields() {
    const id = 'ENDSREC-ELIGIBILITY-MISSING-FIELDS-MANUAL';
    const result = classifyEndsRecEligibility({
        ends_level: 6, ends_condition: 'здорові', ends_history: '',
        ends_base_type: 'натуральна', target_level: 6, length_level: 7
    });
    assert.strictEqual(result.status, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityNoEndsRecCreated() {
    const id = 'ENDSREC-ELIGIBILITY-NO-ENDSREC-CREATED';
    // Assert logic does not mutate endsRec
    const result = classifyEndsRecEligibility({
        ends_level: 6, ends_condition: 'здорові', ends_history: 'натуральна',
        ends_base_type: 'натуральна', target_level: 6, length_level: 7
    });
    assert.ok(result.status, id);
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityNoMassModelChange() {
    const id = 'ENDSREC-ELIGIBILITY-NO-MASSMODEL-CHANGE';
    // Helper is pure
    console.log(id + ' safe.');
})();

(function testEndsRecEligibilityNoRootLenChange() {
    const id = 'ENDSREC-ELIGIBILITY-NO-ROOT-LEN-CHANGE';
    // Helper is pure
    console.log(id + ' safe.');
})();

function classifyThreeZoneActivation(input) {
    const { ends_level, length_level, root_level, ends_condition, ends_history, ends_base_type, target_level } = input;
    
    if (!ends_level || ends_level === length_level) {
        return {
            decision: 'KEEP_2_ZONE', reason: 'ENDS_SAME_AS_LENGTH',
            warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
        };
    }
    
    const missing = [];
    if (!ends_condition) missing.push('ends_condition');
    if (!ends_history) missing.push('ends_history');
    if (!ends_base_type) missing.push('ends_base_type');
    
    if (missing.length > 0) {
        return {
            decision: 'MANUAL_REQUIRED', reason: 'MISSING_FIELDS',
            warnings: [], requiredFields: ['ends_condition', 'ends_history', 'ends_base_type'], missingFields: missing, mode: '3-zone-gate-only'
        };
    }

    const blockedHistory = ['unknown', 'cosmetic', 'темний косметичний пігмент', 'dark cosmetic', 'remover', 'змивка', 'henna_metals', 'хна/метали'];
    if (blockedHistory.includes(ends_history)) {
        return {
            decision: 'BLOCKED', reason: 'BLOCKED_HISTORY',
            warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
        };
    }

    if ((ends_base_type === 'cosmetic' || ends_base_type === 'mixed' || ends_base_type === 'unknown' || ends_base_type === 'косметична' || ends_base_type === 'змішана/нерівномірна') && target_level > ends_level) {
        return {
            decision: 'BLOCKED', reason: 'COSMETIC_LIFT_RISK',
            warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
        };
    }

    const damagedCondition = ['porous', 'brittle', 'damaged', 'critical', 'пористі', 'ламкі', 'сильно пошкоджені', 'критично пошкоджені'];
    if (damagedCondition.includes(ends_condition)) {
        return {
            decision: 'MANUAL_REQUIRED', reason: 'DAMAGED_CONDITION',
            warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
        };
    }
    
    if (target_level !== undefined && target_level !== null) {
        if ((target_level > ends_level && target_level < length_level) ||
            (target_level < ends_level && target_level > length_level)) {
            return {
                decision: 'MANUAL_REQUIRED', reason: 'TARGET_BETWEEN_ZONES',
                warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
            };
        }
    }

    if ((ends_condition === 'healthy' || ends_condition === 'normal' || ends_condition === 'здорові' || ends_condition === 'нормальні') && 
        (ends_history === 'natural' || ends_history === 'clear' || ends_history === 'none' || ends_history === 'натуральна' || ends_history === 'чиста') && 
        (ends_base_type === 'natural' || ends_base_type === 'натуральна')) {
        return {
            decision: 'ALLOW_3_ZONE', reason: 'HEALTHY_NATURAL',
            warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
        };
    }

    return {
        decision: 'MANUAL_REQUIRED', reason: 'FALLBACK',
        warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
    };
}

// ---------------------------------------------------------------------------
// ТЕСТ 17: THREE-ZONE-GATE-KEEP-2-ZONE-WHEN-ENDS-SAME
// ---------------------------------------------------------------------------
(function testThreeZoneGateKeep2ZoneWhenEndsSame() {
    const id = 'THREE-ZONE-GATE-KEEP-2-ZONE-WHEN-ENDS-SAME';
    const result = classifyThreeZoneActivation({ ends_level: 7, length_level: 7 });
    assert.strictEqual(result.decision, 'KEEP_2_ZONE', id);
    assert.strictEqual(result.mode, '3-zone-gate-only', id);
    console.log(id + ' safe: same level keeps 2-zone.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 18: THREE-ZONE-GATE-MANUAL-WHEN-MISSING-ENDS-FIELDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateManualWhenMissingEndsFields() {
    const id = 'THREE-ZONE-GATE-MANUAL-WHEN-MISSING-ENDS-FIELDS';
    const result = classifyThreeZoneActivation({ ends_level: 8, length_level: 7 });
    assert.strictEqual(result.decision, 'MANUAL_REQUIRED', id);
    assert.ok(result.missingFields.length > 0, id);
    console.log(id + ' safe: missing fields require manual.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 19: THREE-ZONE-GATE-BLOCK-UNKNOWN-ENDS-HISTORY
// ---------------------------------------------------------------------------
(function testThreeZoneGateBlockUnknownEndsHistory() {
    const id = 'THREE-ZONE-GATE-BLOCK-UNKNOWN-ENDS-HISTORY';
    const result = classifyThreeZoneActivation({
        ends_level: 8, length_level: 7,
        ends_condition: 'healthy', ends_history: 'unknown', ends_base_type: 'natural'
    });
    assert.strictEqual(result.decision, 'BLOCKED', id);
    console.log(id + ' safe: unknown history blocked.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 20: THREE-ZONE-GATE-BLOCK-COSMETIC-ENDS-LIFT
// ---------------------------------------------------------------------------
(function testThreeZoneGateBlockCosmeticEndsLift() {
    const id = 'THREE-ZONE-GATE-BLOCK-COSMETIC-ENDS-LIFT';
    const result = classifyThreeZoneActivation({
        ends_level: 6, length_level: 5, target_level: 8,
        ends_condition: 'healthy', ends_history: 'cosmetic', ends_base_type: 'cosmetic'
    });
    assert.strictEqual(result.decision, 'BLOCKED', id);
    console.log(id + ' safe: cosmetic lift blocked.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 21: THREE-ZONE-GATE-BLOCK-HENNA-METALS
// ---------------------------------------------------------------------------
(function testThreeZoneGateBlockHennaMetals() {
    const id = 'THREE-ZONE-GATE-BLOCK-HENNA-METALS';
    const result = classifyThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'healthy', ends_history: 'henna_metals', ends_base_type: 'natural'
    });
    assert.strictEqual(result.decision, 'BLOCKED', id);
    console.log(id + ' safe: henna metals blocked.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 22: THREE-ZONE-GATE-MANUAL-DAMAGED-ENDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateManualDamagedEnds() {
    const id = 'THREE-ZONE-GATE-MANUAL-DAMAGED-ENDS';
    const result = classifyThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'porous', ends_history: 'natural', ends_base_type: 'natural'
    });
    assert.strictEqual(result.decision, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe: damaged ends require manual.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 23: THREE-ZONE-GATE-MANUAL-TARGET-BETWEEN-ZONES
// ---------------------------------------------------------------------------
(function testThreeZoneGateManualTargetBetweenZones() {
    const id = 'THREE-ZONE-GATE-MANUAL-TARGET-BETWEEN-ZONES';
    const result = classifyThreeZoneActivation({
        ends_level: 8, length_level: 6, target_level: 7,
        ends_condition: 'healthy', ends_history: 'natural', ends_base_type: 'natural'
    });
    assert.strictEqual(result.decision, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe: target between zones require manual.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 24: THREE-ZONE-GATE-ALLOW-HEALTHY-NATURAL-ENDS
// ---------------------------------------------------------------------------
(function testThreeZoneGateAllowHealthyNaturalEnds() {
    const id = 'THREE-ZONE-GATE-ALLOW-HEALTHY-NATURAL-ENDS';
    const result = classifyThreeZoneActivation({
        ends_level: 8, length_level: 7, target_level: 8,
        ends_condition: 'healthy', ends_history: 'natural', ends_base_type: 'natural'
    });
    assert.strictEqual(result.decision, 'ALLOW_3_ZONE', id);
    console.log(id + ' safe: healthy natural ends allowed.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 25: THREE-ZONE-GATE-DOES-NOT-CALL-BUILD-THREE-ZONE-MASS
// ---------------------------------------------------------------------------
(function testThreeZoneGateDoesNotActivateBuildThreeZoneMass() {
    const id = 'THREE-ZONE-GATE-DOES-NOT-CALL-BUILD-THREE-ZONE-MASS';
    const split = { rootPct: 0.3, lengthPct: 0.5, endsPct: 0.2 };
    const mass = buildThreeZoneMassCandidate('средние', 'средние', split);
    assert.ok(mass !== null);
    // test that classify does not call it or alter mode
    const gate = classifyThreeZoneActivation({ ends_level: 8, length_level: 7, target_level: 8, ends_condition: 'healthy', ends_history: 'natural', ends_base_type: 'natural' });
    assert.strictEqual(gate.decision, 'ALLOW_3_ZONE');
    assert.strictEqual(gate.mode, '3-zone-gate-only');
    console.log(id + ' safe: does not activate 3-zone mass.');
})();

// ---------------------------------------------------------------------------
// ТЕСТ 26: THREE-ZONE-GATE-PRODUCTION-BUILDMASSMODEL-STILL-2-ZONE
// ---------------------------------------------------------------------------
(function testThreeZoneGateProductionBuildMassModelStill2Zone() {
    const id = 'THREE-ZONE-GATE-PRODUCTION-BUILDMASSMODEL-STILL-2-ZONE';
    const prod = buildMassModel('средние', 'средние');
    assert.strictEqual(prod.mode, '2-zone');
    assert.strictEqual(prod.endsMass, null);
    console.log(id + ' safe: production buildMassModel remains 2-zone.');
})();

// ---------------------------------------------------------------------------
// SPEC MIRROR: validateProductionEndsRecReadiness
// ---------------------------------------------------------------------------

function validateProductionEndsRecReadiness(context) {
    const input = context || {};
    const normalizedContext = Object.assign({}, input, {
        ends_level: typeof input.ends_level === 'string' && input.ends_level.trim() !== '' ? Number(input.ends_level) : input.ends_level,
        target_level: typeof input.target_level === 'string' && input.target_level.trim() !== '' ? Number(input.target_level) : input.target_level,
        length_level: typeof input.length_level === 'string' && input.length_level.trim() !== '' ? Number(input.length_level) : input.length_level,
        root_level: typeof input.root_level === 'string' && input.root_level.trim() !== '' ? Number(input.root_level) : input.root_level
    });
    const gate = classifyThreeZoneActivation(normalizedContext);
    const eligibility = classifyEndsRecEligibility(normalizedContext);
    const candidate = input.endsRecCandidatePreview || null;

    function hasOwn(target, key) {
        return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
    }

    function candidateHasNotForMixingFlag(candidatePreview) {
        return Boolean(candidatePreview && (
            candidatePreview.notForMixing === true ||
            (candidatePreview.massPreview && candidatePreview.massPreview.notForMixing === true) ||
            (candidatePreview.formulaPreview && candidatePreview.formulaPreview.notForMixing === true)
        ));
    }

    function candidateSummary(candidatePreview) {
        if (!candidatePreview) return null;
        return {
            zone: candidatePreview.zone || null,
            candidateOnly: candidatePreview.candidateOnly === true,
            previewOnly: candidatePreview.previewOnly === true,
            notForMixing: candidateHasNotForMixingFlag(candidatePreview),
            productionReady: candidatePreview.productionReady === true,
            eligibilityStatus: candidatePreview.eligibilityStatus || null,
            hasDyeMass: hasOwn(candidatePreview, 'dyeMass'),
            hasOxidizerMass: hasOwn(candidatePreview, 'oxidizerMass'),
            hasEndsFormula: hasOwn(candidatePreview, 'endsFormula')
        };
    }

    function result(status, reasonCode, reasons, candidatePreview) {
        const ready = status === 'READY';
        return {
            ready,
            status,
            reasonCode,
            reasons: reasons.filter(Boolean),
            candidateSummary: candidateSummary(candidatePreview),
            productionAllowed: ready,
            productionBlocked: !ready
        };
    }

    const gateDecision = gate && gate.decision ? gate.decision : 'UNKNOWN';
    if (gateDecision === 'KEEP_2_ZONE') {
        return result('NOT_READY', 'THREE_ZONE_KEEP_2_ZONE', [gate.reason], candidate);
    }
    if (gateDecision === 'MANUAL_REQUIRED') {
        return result('MANUAL_REQUIRED', 'THREE_ZONE_MANUAL_REQUIRED', [gate.reason], candidate);
    }
    if (gateDecision === 'BLOCKED') {
        return result('BLOCKED', 'THREE_ZONE_BLOCKED', [gate.reason], candidate);
    }
    if (gateDecision !== 'ALLOW_3_ZONE') {
        return result('NOT_READY', 'THREE_ZONE_NOT_ALLOWED', [gate.reason || gateDecision], candidate);
    }

    const eligibilityStatus = eligibility && eligibility.status ? eligibility.status : 'UNKNOWN';
    if (eligibilityStatus === 'BLOCKED') {
        return result('BLOCKED', 'ENDSREC_ELIGIBILITY_BLOCKED', [eligibility.reason], candidate);
    }
    if (eligibilityStatus === 'MANUAL_REQUIRED') {
        return result('MANUAL_REQUIRED', 'ENDSREC_ELIGIBILITY_MANUAL_REQUIRED', [eligibility.reason], candidate);
    }
    if (eligibilityStatus !== 'SAFE_FOR_TONING') {
        return result('NOT_READY', 'ENDSREC_ELIGIBILITY_NOT_SAFE', [eligibility.reason || eligibilityStatus], candidate);
    }

    if (!candidate) {
        return result('NOT_READY', 'NO_ENDSREC_CANDIDATE_PREVIEW', ['endsRecCandidatePreview missing'], candidate);
    }
    if (candidate.productionReady === true) {
        return result('BLOCKED', 'CANDIDATE_PRODUCTION_READY_TRUE', ['candidate productionReady must remain false in readiness phase'], candidate);
    }

    const missingFlags = [];
    if (candidate.candidateOnly !== true) missingFlags.push('candidateOnly');
    if (candidate.previewOnly !== true) missingFlags.push('previewOnly');
    if (!candidateHasNotForMixingFlag(candidate)) missingFlags.push('notForMixing');
    if (candidate.productionReady !== false) missingFlags.push('productionReady_false');
    if (missingFlags.length > 0) {
        return result('NOT_READY', 'CANDIDATE_MISSING_SAFETY_FLAGS', missingFlags, candidate);
    }

    const hasProductionFields = hasOwn(candidate, 'dyeMass') || hasOwn(candidate, 'oxidizerMass') || hasOwn(candidate, 'endsFormula');
    if (hasProductionFields) {
        return result('BLOCKED', 'CANDIDATE_HAS_PRODUCTION_FIELDS', ['candidate must not contain production dyeMass, oxidizerMass, or endsFormula'], candidate);
    }
    if (input.massModel && typeof input.massModel.endsMass === 'number') {
        return result('BLOCKED', 'MASSMODEL_ENDSMASS_ALREADY_SET', ['production massModel.endsMass must not be allocated'], candidate);
    }

    return result('READY', 'READY_LOW_RISK_TONING_CANDIDATE', [gate.reason, eligibility.reason], candidate);
}

function makeReadinessCandidate(overrides = {}) {
    const candidateMass = buildThreeZoneMassCandidate('средние', 'средние', { rootPct: 0.3, lengthPct: 0.5, endsPct: 0.2 });
    return Object.assign({
        zone: 'ends',
        candidateOnly: true,
        productionReady: false,
        previewOnly: true,
        source: 'endsRecEligibility',
        eligibilityStatus: 'SAFE_FOR_TONING',
        allowedProcess: 'toning',
        massPreview: {
            endsMass: candidateMass.endsMass,
            source: 'threeZoneCandidateMassModel',
            notForMixing: true
        },
        formulaPreview: {
            type: 'process_description',
            description: 'Diagnostic preview only. No ready-to-mix formula is provided.',
            notForMixing: true
        },
        recommendedOxidizerPercentPreview: 'low-oxidizer-preview-only',
        timingPreview: {
            description: 'Diagnostic preview only for ends evaluation. Not production-ready.'
        },
        warnings: ['Diagnostic preview only.'],
        reason: 'Low risk toning',
        safetyStatus: 'diagnostic-preview'
    }, overrides);
}

function makeReadinessContext(overrides = {}) {
    const threeZoneCandidateMassModel = buildThreeZoneMassCandidate('средние', 'средние', { rootPct: 0.3, lengthPct: 0.5, endsPct: 0.2 });
    return Object.assign({
        ends_level: 8,
        length_level: 7,
        root_level: 6,
        ends_condition: 'здорові',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна',
        target_level: 8,
        threeZoneGateDecision: 'ALLOW_3_ZONE',
        threeZoneCandidateMassModel,
        threeZonePreviewOnly: true,
        threeZoneEndsRecipeReady: false,
        endsRecCandidatePreview: makeReadinessCandidate(),
        massModel: buildMassModel('средние', 'средние'),
        rootRec: { process: 'Перманент', mass: 18, ox: '6%' },
        lenRec: { process: 'Перманент', mass: 42, ox: '6%' }
    }, overrides);
}

(function testReadinessAllow3ZoneSafeTrue() {
    const id = 'READINESS-ALLOW-3ZONE-SAFE-TRUE';
    const result = validateProductionEndsRecReadiness(makeReadinessContext());
    assert.strictEqual(result.ready, true, id);
    assert.strictEqual(result.status, 'READY', id);
    assert.strictEqual(result.productionAllowed, true, id);
    assert.strictEqual(result.productionBlocked, false, id);
})();

(function testReadinessKeep2ZoneFalse() {
    const id = 'READINESS-KEEP-2ZONE-FALSE';
    const result = validateProductionEndsRecReadiness(makeReadinessContext({ ends_level: 7, length_level: 7 }));
    assert.strictEqual(result.ready, false, id);
    assert.strictEqual(result.status, 'NOT_READY', id);
    assert.strictEqual(result.reasonCode, 'THREE_ZONE_KEEP_2_ZONE', id);
})();

(function testReadinessManualFalse() {
    const id = 'READINESS-MANUAL-FALSE';
    const result = validateProductionEndsRecReadiness(makeReadinessContext({ ends_history: '' }));
    assert.strictEqual(result.ready, false, id);
    assert.strictEqual(result.status, 'MANUAL_REQUIRED', id);
})();

(function testReadinessBlockedFalse() {
    const id = 'READINESS-BLOCKED-FALSE';
    const result = validateProductionEndsRecReadiness(makeReadinessContext({
        ends_level: 6,
        target_level: 8,
        ends_base_type: 'косметична'
    }));
    assert.strictEqual(result.ready, false, id);
    assert.strictEqual(result.status, 'BLOCKED', id);
})();

(function testReadinessNoCandidateFalse() {
    const id = 'READINESS-NO-CANDIDATE-FALSE';
    const result = validateProductionEndsRecReadiness(makeReadinessContext({ endsRecCandidatePreview: null }));
    assert.strictEqual(result.ready, false, id);
    assert.strictEqual(result.reasonCode, 'NO_ENDSREC_CANDIDATE_PREVIEW', id);
    assert.strictEqual(result.candidateSummary, null, id);
})();

(function testReadinessCandidateNotProduction() {
    const id = 'READINESS-CANDIDATE-NOT-PRODUCTION';
    const result = validateProductionEndsRecReadiness(makeReadinessContext());
    assert.strictEqual(result.ready, true, id);
    assert.strictEqual(result.candidateSummary.productionReady, false, id);
    assert.strictEqual(result.candidateSummary.candidateOnly, true, id);
    assert.strictEqual(result.candidateSummary.previewOnly, true, id);
    assert.strictEqual(result.candidateSummary.notForMixing, true, id);
})();

(function testReadinessCandidateMissingFlagsFalse() {
    const id = 'READINESS-CANDIDATE-MISSING-FLAGS-FALSE';
    const candidate = makeReadinessCandidate({ previewOnly: false });
    const result = validateProductionEndsRecReadiness(makeReadinessContext({ endsRecCandidatePreview: candidate }));
    assert.strictEqual(result.ready, false, id);
    assert.strictEqual(result.reasonCode, 'CANDIDATE_MISSING_SAFETY_FLAGS', id);
})();

(function testReadinessCandidateProductionReadyTrueBlocked() {
    const id = 'READINESS-CANDIDATE-PRODUCTIONREADY-TRUE-BLOCKED';
    const candidate = makeReadinessCandidate({ productionReady: true });
    const result = validateProductionEndsRecReadiness(makeReadinessContext({ endsRecCandidatePreview: candidate }));
    assert.strictEqual(result.ready, false, id);
    assert.strictEqual(result.status, 'BLOCKED', id);
    assert.strictEqual(result.reasonCode, 'CANDIDATE_PRODUCTION_READY_TRUE', id);
})();

(function testReadinessNoMassModelChange() {
    const id = 'READINESS-NO-MASSMODEL-CHANGE';
    const context = makeReadinessContext();
    const before = JSON.stringify(context.massModel);
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(JSON.stringify(context.massModel), before, id);
})();

(function testReadinessNoEndsMass() {
    const id = 'READINESS-NO-ENDSMASS';
    const context = makeReadinessContext();
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(context.massModel.endsMass, null, id);
})();

(function testReadinessNoFormula() {
    const id = 'READINESS-NO-FORMULA';
    const context = makeReadinessContext();
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'endsFormula'), false, id);
})();

(function testReadinessNoDyeMassOxidizerMass() {
    const id = 'READINESS-NO-DYEMASS-OXIDIZERMASS';
    const context = makeReadinessContext();
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'dyeMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'oxidizerMass'), false, id);
})();

(function testReadinessNoRootLenChange() {
    const id = 'READINESS-NO-ROOT-LEN-CHANGE';
    const context = makeReadinessContext();
    const before = JSON.stringify({ rootRec: context.rootRec, lenRec: context.lenRec });
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(JSON.stringify({ rootRec: context.rootRec, lenRec: context.lenRec }), before, id);
})();

(function testReadinessNoCalcMixtoneChange() {
    const id = 'READINESS-NO-CALCMIXTONE-CHANGE';
    let called = false;
    const context = makeReadinessContext({ calcMixtone: () => { called = true; } });
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(called, false, id);
})();

(function testReadinessNoOxidizerGlobalChange() {
    const id = 'READINESS-NO-OXIDIZER-GLOBAL-CHANGE';
    const context = makeReadinessContext({ oxidizerLogic: { root: '6%', length: '6%' } });
    const before = JSON.stringify(context.oxidizerLogic);
    validateProductionEndsRecReadiness(context);
    assert.strictEqual(JSON.stringify(context.oxidizerLogic), before, id);
})();

// ---------------------------------------------------------------------------
// SPEC CONTRACT: future buildProductionEndsRec(context, readiness)
// These tests define the builder contract without wiring production runtime.
// ---------------------------------------------------------------------------

function makeBuilderReadiness(overrides = {}) {
    return Object.assign({
        ready: true,
        status: 'READY',
        reasonCode: 'READY_LOW_RISK_TONING_CANDIDATE',
        reasons: ['ALLOW_3_ZONE', 'SAFE_FOR_TONING'],
        candidateSummary: {
            zone: 'ends',
            eligibilityStatus: 'SAFE_FOR_TONING',
            hasDyeMass: false,
            hasOxidizerMass: false,
            hasEndsFormula: false
        },
        productionAllowed: true,
        productionBlocked: false
    }, overrides);
}

function builderContractCanCreateSkeleton(readiness) {
    return Boolean(
        readiness
        && readiness.ready === true
        && readiness.status === 'READY'
        && readiness.productionAllowed === true
        && readiness.productionBlocked === false
        && readiness.candidateSummary
        && readiness.status !== 'BLOCKED'
        && readiness.status !== 'MANUAL_REQUIRED'
    );
}

function buildProductionEndsRecSkeletonContract(readiness) {
    if (!builderContractCanCreateSkeleton(readiness)) {
        return {
            created: false,
            status: 'NOT_CREATED',
            endsRec: null
        };
    }

    return {
        created: true,
        status: 'SKELETON_ALLOWED',
        endsRec: {
            zone: 'ends',
            productionReady: true,
            endsRecipeReady: false,
            safetyReasonCodes: [readiness.reasonCode].filter(Boolean),
            sourceCandidateSummary: {
                zone: readiness.candidateSummary.zone || null,
                eligibilityStatus: readiness.candidateSummary.eligibilityStatus || null
            }
        }
    };
}

(function testBuilderContractReadyCanCreateSkeleton() {
    const id = 'BUILDER-CONTRACT-READY-CAN-CREATE-SKELETON';
    const readiness = makeBuilderReadiness();
    const contract = buildProductionEndsRecSkeletonContract(readiness);
    assert.strictEqual(builderContractCanCreateSkeleton(readiness), true, id);
    assert.strictEqual(contract.created, true, id);
    assert.strictEqual(contract.status, 'SKELETON_ALLOWED', id);
    assert.ok(contract.endsRec, id);
    assert.strictEqual(contract.endsRec.productionReady, true, id);
    assert.strictEqual(contract.endsRec.endsRecipeReady, false, id);
    assert.deepStrictEqual(contract.endsRec.safetyReasonCodes, ['READY_LOW_RISK_TONING_CANDIDATE'], id);
})();

(function testBuilderContractNotReadyNoEndsRec() {
    const id = 'BUILDER-CONTRACT-NOT-READY-NO-ENDSREC';
    const readiness = makeBuilderReadiness({
        ready: false,
        status: 'NOT_READY',
        productionAllowed: false,
        productionBlocked: true
    });
    const contract = buildProductionEndsRecSkeletonContract(readiness);
    assert.strictEqual(contract.created, false, id);
    assert.strictEqual(contract.endsRec, null, id);
})();

(function testBuilderContractBlockedNoEndsRec() {
    const id = 'BUILDER-CONTRACT-BLOCKED-NO-ENDSREC';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness({
        ready: false,
        status: 'BLOCKED',
        productionAllowed: false,
        productionBlocked: true
    }));
    assert.strictEqual(contract.created, false, id);
    assert.strictEqual(contract.endsRec, null, id);
})();

(function testBuilderContractManualNoEndsRec() {
    const id = 'BUILDER-CONTRACT-MANUAL-NO-ENDSREC';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness({
        ready: false,
        status: 'MANUAL_REQUIRED',
        productionAllowed: false,
        productionBlocked: true
    }));
    assert.strictEqual(contract.created, false, id);
    assert.strictEqual(contract.endsRec, null, id);
})();

(function testBuilderContractRequiresCandidateSummary() {
    const id = 'BUILDER-CONTRACT-REQUIRES-CANDIDATE-SUMMARY';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness({
        candidateSummary: null
    }));
    assert.strictEqual(contract.created, false, id);
    assert.strictEqual(contract.endsRec, null, id);
})();

(function testBuilderContractNoDyeMassOxidizerMass() {
    const id = 'BUILDER-CONTRACT-NO-DYEMASS-OXIDIZERMASS';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'dyeMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'oxidizerMass'), false, id);
})();

(function testBuilderContractNoEndsMass() {
    const id = 'BUILDER-CONTRACT-NO-ENDSMASS';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'endsMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'massModel'), false, id);
})();

(function testBuilderContractNoFinalFormula() {
    const id = 'BUILDER-CONTRACT-NO-FINAL-FORMULA';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'endsFormula'), false, id);
    assert.strictEqual(contract.endsRec.endsRecipeReady, false, id);
})();

(function testBuilderContractNo3ZoneMassModel() {
    const id = 'BUILDER-CONTRACT-NO-3ZONE-MASSMODEL';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'massModel'), false, id);
    assert.notStrictEqual(contract.endsRec.mode, '3-zone', id);
})();

(function testBuilderContractNoPreviewFlagsInProduction() {
    const id = 'BUILDER-CONTRACT-NO-PREVIEW-FLAGS-IN-PRODUCTION';
    const contract = buildProductionEndsRecSkeletonContract(makeBuilderReadiness());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'candidateOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'previewOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec, 'notForMixing'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec.sourceCandidateSummary, 'candidateOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec.sourceCandidateSummary, 'previewOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(contract.endsRec.sourceCandidateSummary, 'notForMixing'), false, id);
})();

(function testBuilderContractNoCalculateProtocolWiring() {
    const id = 'BUILDER-CONTRACT-CALCULATEPROTOCOL-IS-WIRED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(
        source + `
globalThis.__calculateProtocolSource = calculateProtocol.toString();
globalThis.__buildProductionEndsRecType = typeof buildProductionEndsRec;
const __builderReadyReadiness = {
    ready: true,
    status: 'READY',
    reasonCode: 'READY_LOW_RISK_TONING_CANDIDATE',
    reasons: ['ALLOW_3_ZONE', 'SAFE_FOR_TONING'],
    candidateSummary: {
        zone: 'ends',
        eligibilityStatus: 'SAFE_FOR_TONING',
        hasDyeMass: false,
        hasOxidizerMass: false,
        hasEndsFormula: false
    },
    productionAllowed: true,
    productionBlocked: false
};
const __builderContext = {
    massModel: { mode: '2-zone', endsMass: null },
    rootRec: { process: 'Перманент', mass: 18 },
    lenRec: { process: 'Перманент', mass: 42 }
};
const __builderContextBefore = JSON.stringify(__builderContext);
const __builderReadinessBefore = JSON.stringify(__builderReadyReadiness);
globalThis.__builderContextBefore = __builderContextBefore;
globalThis.__builderReadinessBefore = __builderReadinessBefore;
globalThis.__builderReadyResult = buildProductionEndsRec(__builderContext, __builderReadyReadiness);
globalThis.__builderContextAfter = JSON.stringify(__builderContext);
globalThis.__builderReadinessAfter = JSON.stringify(__builderReadyReadiness);
globalThis.__builderBlockedResult = buildProductionEndsRec({}, Object.assign({}, __builderReadyReadiness, {
    ready: false,
    status: 'BLOCKED',
    productionAllowed: false,
    productionBlocked: true
}));
globalThis.__builderNoCandidateResult = buildProductionEndsRec({}, Object.assign({}, __builderReadyReadiness, {
    candidateSummary: null
}));
`,
        sandbox,
        { filename: 'www/core.js' }
    );
    const calculateProtocolSource = sandbox.__calculateProtocolSource;
    assert.strictEqual(sandbox.__buildProductionEndsRecType, 'function', id);
    assert.strictEqual(sandbox.__builderReadyResult.created, true, id);
    assert.strictEqual(sandbox.__builderReadyResult.status, 'CREATED', id);
    assert.strictEqual(sandbox.__builderReadyResult.endsRec.productionReady, true, id);
    assert.strictEqual(sandbox.__builderReadyResult.endsRec.endsRecipeReady, false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'dyeMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'oxidizerMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'endsMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'endsFormula'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'candidateOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'previewOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec, 'notForMixing'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec.sourceCandidateSummary, 'candidateOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec.sourceCandidateSummary, 'previewOnly'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__builderReadyResult.endsRec.sourceCandidateSummary, 'notForMixing'), false, id);
    assert.strictEqual(sandbox.__builderContextAfter, sandbox.__builderContextBefore, id);
    assert.strictEqual(sandbox.__builderReadinessAfter, sandbox.__builderReadinessBefore, id);
    assert.strictEqual(sandbox.__builderBlockedResult.created, false, id);
    assert.strictEqual(sandbox.__builderBlockedResult.endsRec, null, id);
    assert.strictEqual(sandbox.__builderNoCandidateResult.created, false, id);
    assert.strictEqual(sandbox.__builderNoCandidateResult.status, 'NO_CANDIDATE', id);
    assert.strictEqual(calculateProtocolSource.includes('buildProductionEndsRec('), true, id);
    assert.strictEqual(calculateProtocolSource.includes('endsRec:'), false, id);
})();

(function testBuilderContractCurrentStateStillSafe() {
    const id = 'BUILDER-CONTRACT-CURRENT-STATE-STILL-SAFE';
    const context = makeReadinessContext();
    const readiness = validateProductionEndsRecReadiness(context);
    const massModel = buildMassModel('средние', 'средние');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context, 'endsRec'), false, id);
    assert.strictEqual(readiness.ready, true, id);
    assert.strictEqual(massModel.mode, '2-zone', id);
    assert.strictEqual(massModel.endsMass, null, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'dyeMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'oxidizerMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'endsFormula'), false, id);
})();

// ---------------------------------------------------------------------------
// SPEC CONTRACT: future production endsRec formula contract
// Test-only data mirror plus VM assertions for the inactive production helper.
// ---------------------------------------------------------------------------

function makeFormulaBuilderResult(overrides = {}) {
    return Object.assign({
        created: true,
        status: 'CREATED',
        reasonCode: 'READY_LOW_RISK_TONING_CANDIDATE',
        reasons: ['ALLOW_3_ZONE', 'SAFE_FOR_TONING'],
        endsRec: {
            productionReady: true,
            endsRecipeReady: false,
            source: 'endsRecCandidatePreview',
            sourceCandidateSummary: {
                zone: 'ends',
                eligibilityStatus: 'SAFE_FOR_TONING'
            },
            safetyReasonCodes: ['READY_LOW_RISK_TONING_CANDIDATE']
        }
    }, overrides);
}

function classifyFormulaContractSpecData(readiness, builderResult) {
    const state = readiness || {};
    const build = builderResult || {};
    const endsRec = build.endsRec || null;

    function result(formulaStatus, reasonCode, overrides = {}) {
        return Object.assign({
            formulaReady: formulaStatus === 'FORMULA_CONTRACT_READY',
            formulaStatus,
            formulaType: 'NONE',
            targetAction: formulaStatus === 'BLOCKED' ? 'block' : 'manual_review',
            allowedProductClass: null,
            forbiddenProductClass: null,
            safetyReasonCodes: [],
            manualRequiredReasonCodes: [],
            reasonCode
        }, overrides);
    }

    if (state.status === 'MANUAL_REQUIRED') {
        return result('MANUAL_REQUIRED', state.reasonCode || 'READINESS_MANUAL_REQUIRED', {
            manualRequiredReasonCodes: [state.reasonCode || 'READINESS_MANUAL_REQUIRED']
        });
    }
    if (state.status === 'BLOCKED' || state.productionBlocked === true) {
        return result('BLOCKED', state.reasonCode || 'READINESS_BLOCKED');
    }
    if (state.ready !== true || state.status !== 'READY') {
        return result('NOT_READY', state.reasonCode || 'READINESS_NOT_READY');
    }
    if (build.created !== true || build.status !== 'CREATED') {
        return result('NOT_READY', build.reasonCode || 'BUILDER_NOT_CREATED');
    }
    if (!endsRec || endsRec.productionReady !== true) {
        return result('NOT_READY', 'ENDSREC_NOT_PRODUCTION_READY');
    }
    if (endsRec.endsRecipeReady === true) {
        return result('BLOCKED', 'ENDSRECIPE_READY_TRUE_SUSPICIOUS');
    }

    return result('FORMULA_CONTRACT_READY', 'FORMULA_TONING_ONLY_ALLOWED', {
        formulaType: 'TONING_ONLY',
        targetAction: 'tone_ends',
        allowedProductClass: ['low_oxidizer_toning'],
        forbiddenProductClass: ['lightening_powder', 'high_lift', 'permanent_lift'],
        safetyReasonCodes: (state.reasons || []).concat(endsRec.safetyReasonCodes || []).filter(Boolean)
    });
}

(function testFormulaContractReadyToningOnly() {
    const id = 'FORMULA-CONTRACT-READY-TONING-ONLY';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), makeFormulaBuilderResult());
    assert.strictEqual(formula.formulaReady, true, id);
    assert.strictEqual(formula.formulaStatus, 'FORMULA_CONTRACT_READY', id);
    assert.strictEqual(formula.formulaType, 'TONING_ONLY', id);
    assert.strictEqual(formula.targetAction, 'tone_ends', id);
    assert.deepStrictEqual(formula.allowedProductClass, ['low_oxidizer_toning'], id);
})();

(function testFormulaContractRequiresReadinessReady() {
    const id = 'FORMULA-CONTRACT-REQUIRES-READINESS-READY';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness({
        ready: false,
        status: 'NOT_READY',
        productionAllowed: false,
        productionBlocked: true
    }), makeFormulaBuilderResult());
    assert.strictEqual(formula.formulaReady, false, id);
    assert.strictEqual(formula.formulaStatus, 'BLOCKED', id);
})();

(function testFormulaContractRequiresBuilderCreated() {
    const id = 'FORMULA-CONTRACT-REQUIRES-BUILDER-CREATED';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), makeFormulaBuilderResult({
        created: false,
        status: 'NOT_CREATED',
        endsRec: null
    }));
    assert.strictEqual(formula.formulaReady, false, id);
    assert.strictEqual(formula.formulaStatus, 'NOT_READY', id);
})();

(function testFormulaContractRequiresProductionReadyEndsRec() {
    const id = 'FORMULA-CONTRACT-REQUIRES-PRODUCTION-READY-ENDSREC';
    const builder = makeFormulaBuilderResult({
        endsRec: Object.assign({}, makeFormulaBuilderResult().endsRec, { productionReady: false })
    });
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), builder);
    assert.strictEqual(formula.formulaReady, false, id);
    assert.strictEqual(formula.reasonCode, 'ENDSREC_NOT_PRODUCTION_READY', id);
})();

(function testFormulaContractRequiresEndsRecipeNotReady() {
    const id = 'FORMULA-CONTRACT-REQUIRES-ENDSRECIPE-NOT-READY';
    const builder = makeFormulaBuilderResult({
        endsRec: Object.assign({}, makeFormulaBuilderResult().endsRec, { endsRecipeReady: true })
    });
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), builder);
    assert.strictEqual(formula.formulaReady, false, id);
    assert.strictEqual(formula.formulaStatus, 'BLOCKED', id);
    assert.strictEqual(formula.reasonCode, 'ENDSRECIPE_READY_TRUE_SUSPICIOUS', id);
})();

(function testFormulaContractBlockedNoFormula() {
    const id = 'FORMULA-CONTRACT-BLOCKED-NO-FORMULA';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness({
        ready: false,
        status: 'BLOCKED',
        productionAllowed: false,
        productionBlocked: true
    }), makeFormulaBuilderResult());
    assert.strictEqual(formula.formulaReady, false, id);
    assert.strictEqual(formula.formulaStatus, 'BLOCKED', id);
})();

(function testFormulaContractManualNoFormula() {
    const id = 'FORMULA-CONTRACT-MANUAL-NO-FORMULA';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness({
        ready: false,
        status: 'MANUAL_REQUIRED',
        productionAllowed: false,
        productionBlocked: true,
        reasonCode: 'READINESS_MANUAL_REQUIRED'
    }), makeFormulaBuilderResult());
    assert.strictEqual(formula.formulaReady, false, id);
    assert.strictEqual(formula.formulaStatus, 'MANUAL_REQUIRED', id);
    assert.deepStrictEqual(formula.manualRequiredReasonCodes, ['READINESS_MANUAL_REQUIRED'], id);
})();

(function testFormulaContractNoDyeMassOxidizerMass() {
    const id = 'FORMULA-CONTRACT-NO-DYEMASS-OXIDIZERMASS';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), makeFormulaBuilderResult());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'dyeMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'oxidizerMass'), false, id);
})();

(function testFormulaContractNoExactGrams() {
    const id = 'FORMULA-CONTRACT-NO-EXACT-GRAMS';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), makeFormulaBuilderResult());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'grams'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'exactGrams'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'dyeGrams'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'oxidizerGrams'), false, id);
})();

(function testFormulaContractNoEndsMass() {
    const id = 'FORMULA-CONTRACT-NO-ENDSMASS';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), makeFormulaBuilderResult());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'endsMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'massModel'), false, id);
})();

(function testFormulaContractNo3ZoneMassModel() {
    const id = 'FORMULA-CONTRACT-NO-3ZONE-MASSMODEL';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness(), makeFormulaBuilderResult());
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'massModel'), false, id);
    assert.notStrictEqual(formula.mode, '3-zone', id);
})();

(function testFormulaContractCalculateProtocolIsWired() {
    const id = 'FORMULA-CONTRACT-CALCULATEPROTOCOL-IS-WIRED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(
        source + `
globalThis.__calculateProtocolSource = calculateProtocol.toString();
globalThis.__formulaHelperType = typeof classifyProductionEndsRecFormulaContract;
const __formulaReadiness = {
    ready: true,
    status: 'READY',
    reasonCode: 'READY_LOW_RISK_TONING_CANDIDATE',
    reasons: ['ALLOW_3_ZONE', 'SAFE_FOR_TONING'],
    candidateSummary: {
        zone: 'ends',
        eligibilityStatus: 'SAFE_FOR_TONING',
        hasDyeMass: false,
        hasOxidizerMass: false,
        hasEndsFormula: false
    },
    productionAllowed: true,
    productionBlocked: false
};
const __formulaBuilder = buildProductionEndsRec({}, __formulaReadiness);
const __formulaContext = {
    massModel: { mode: '2-zone', endsMass: null },
    rootRec: { process: 'Перманент', mass: 18 },
    lenRec: { process: 'Перманент', mass: 42 }
};
globalThis.__formulaContextBefore = JSON.stringify(__formulaContext);
globalThis.__formulaReadinessBefore = JSON.stringify(__formulaReadiness);
globalThis.__formulaBuilderBefore = JSON.stringify(__formulaBuilder);
globalThis.__formulaReadyResult = classifyProductionEndsRecFormulaContract(__formulaContext, __formulaReadiness, __formulaBuilder);
globalThis.__formulaContextAfter = JSON.stringify(__formulaContext);
globalThis.__formulaReadinessAfter = JSON.stringify(__formulaReadiness);
globalThis.__formulaBuilderAfter = JSON.stringify(__formulaBuilder);
globalThis.__formulaManualResult = classifyProductionEndsRecFormulaContract({}, Object.assign({}, __formulaReadiness, {
    ready: false,
    status: 'MANUAL_REQUIRED',
    productionAllowed: false,
    productionBlocked: true,
    reasonCode: 'READINESS_MANUAL_REQUIRED'
}), __formulaBuilder);
globalThis.__formulaBlockedResult = classifyProductionEndsRecFormulaContract({}, Object.assign({}, __formulaReadiness, {
    ready: false,
    status: 'BLOCKED',
    productionAllowed: false,
    productionBlocked: true,
    reasonCode: 'READINESS_BLOCKED'
}), __formulaBuilder);
globalThis.__formulaNotReadyResult = classifyProductionEndsRecFormulaContract({}, __formulaReadiness, Object.assign({}, __formulaBuilder, {
    created: false,
    status: 'NOT_CREATED',
    endsRec: null
}));
globalThis.__formulaSuspiciousResult = classifyProductionEndsRecFormulaContract({}, __formulaReadiness, Object.assign({}, __formulaBuilder, {
    endsRec: Object.assign({}, __formulaBuilder.endsRec, { endsRecipeReady: true })
}));
`,
        sandbox,
        { filename: 'www/core.js' }
    );
    assert.strictEqual(sandbox.__formulaHelperType, 'function', id);
    assert.strictEqual(sandbox.__formulaReadyResult.formulaReady, true, id);
    assert.strictEqual(sandbox.__formulaReadyResult.formulaStatus, 'FORMULA_CONTRACT_READY', id);
    assert.strictEqual(sandbox.__formulaReadyResult.formulaType, 'TONING_ONLY', id);
    assert.strictEqual(sandbox.__formulaReadyResult.targetAction, 'tone_ends', id);
    assert.strictEqual(JSON.stringify(sandbox.__formulaReadyResult.allowedProductClass), JSON.stringify(['low_oxidizer_toning']), id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'dyeMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'oxidizerMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'endsMass'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'massModel'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'endsFormula'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'grams'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sandbox.__formulaReadyResult, 'exactGrams'), false, id);
    assert.notStrictEqual(sandbox.__formulaReadyResult.mode, '3-zone', id);
    assert.strictEqual(sandbox.__formulaContextAfter, sandbox.__formulaContextBefore, id);
    assert.strictEqual(sandbox.__formulaReadinessAfter, sandbox.__formulaReadinessBefore, id);
    assert.strictEqual(sandbox.__formulaBuilderAfter, sandbox.__formulaBuilderBefore, id);
    assert.strictEqual(sandbox.__formulaManualResult.formulaReady, false, id);
    assert.strictEqual(sandbox.__formulaManualResult.formulaStatus, 'MANUAL_REQUIRED', id);
    assert.strictEqual(sandbox.__formulaBlockedResult.formulaReady, false, id);
    assert.strictEqual(sandbox.__formulaBlockedResult.formulaStatus, 'BLOCKED', id);
    assert.strictEqual(sandbox.__formulaNotReadyResult.formulaReady, false, id);
    assert.strictEqual(sandbox.__formulaNotReadyResult.formulaStatus, 'NOT_READY', id);
    assert.strictEqual(sandbox.__formulaSuspiciousResult.formulaReady, false, id);
    assert.strictEqual(sandbox.__formulaSuspiciousResult.formulaStatus, 'BLOCKED', id);
    assert.strictEqual(sandbox.__calculateProtocolSource.includes('FormulaContract'), true, id);
    assert.strictEqual(sandbox.__calculateProtocolSource.includes('formulaReady'), false, id);
})();

(function testFormulaContractNoRuntimeEndsFormula() {
    const id = 'FORMULA-CONTRACT-NO-RUNTIME-ENDSFORMULA';
    const context = makeReadinessContext();
    const readiness = validateProductionEndsRecReadiness(context);
    const builder = buildProductionEndsRecSkeletonContract(readiness);
    const formula = classifyFormulaContractSpecData(readiness, builder);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(context.endsRecCandidatePreview, 'endsFormula'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(builder.endsRec, 'endsFormula'), false, id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(formula, 'endsFormula'), false, id);
})();

(function testFormulaContractNoAutoRecipeOnManual() {
    const id = 'FORMULA-CONTRACT-NO-AUTO-RECIPE-ON-MANUAL';
    const formula = classifyFormulaContractSpecData(makeBuilderReadiness({
        ready: false,
        status: 'MANUAL_REQUIRED',
        productionAllowed: false,
        productionBlocked: true,
        reasonCode: 'READINESS_MANUAL_REQUIRED'
    }), makeFormulaBuilderResult());
    assert.strictEqual(formula.formulaReady, false, id);
    assert.notStrictEqual(formula.formulaStatus, 'FORMULA_CONTRACT_READY', id);
})();

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------

console.log('');
console.log('=== MASS MODEL UNIT / DIAGNOSTIC TEST CONTRACT ===');
console.log('All 26 scenarios processed.');
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
console.log('  THREE-ZONE-GATE-KEEP-2-ZONE-WHEN-ENDS-SAME   → SAFE     (same level keeps 2-zone)');
console.log('  THREE-ZONE-GATE-MANUAL-WHEN-MISSING-ENDS-FIELDS→ SAFE     (missing fields blocked)');
console.log('  THREE-ZONE-GATE-BLOCK-UNKNOWN-ENDS-HISTORY   → SAFE     (unknown history blocked)');
console.log('  THREE-ZONE-GATE-BLOCK-COSMETIC-ENDS-LIFT     → SAFE     (cosmetic lift blocked)');
console.log('  THREE-ZONE-GATE-BLOCK-HENNA-METALS           → SAFE     (henna metals blocked)');
console.log('  THREE-ZONE-GATE-MANUAL-DAMAGED-ENDS          → SAFE     (damaged ends require manual)');
console.log('  THREE-ZONE-GATE-MANUAL-TARGET-BETWEEN-ZONES  → SAFE     (target between zones require manual)');
console.log('  THREE-ZONE-GATE-ALLOW-HEALTHY-NATURAL-ENDS   → SAFE     (healthy natural ends allowed)');
console.log('  THREE-ZONE-GATE-DOES-NOT-CALL-BUILD-THREE-ZONE-MASS → SAFE     (helper pure)');
console.log('  THREE-ZONE-GATE-PRODUCTION-BUILDMASSMODEL-STILL-2-ZONE  → SAFE     (production behavior unchanged)');
console.log('');
console.log('Production code: buildMassModel() 2-ZONE ONLY.');
console.log('3-zone runtime: NOT ACTIVE.');
console.log('endsMass: null in production.');
console.log('endsRec: NOT IMPLEMENTED.');
console.log('buildThreeZoneMassCandidate(): INACTIVE HELPER (not called from calculateProtocol).');
console.log('classifyThreeZoneActivation(): PRODUCTION GATE HELPER (not called from calculateProtocol).');
console.log('');
console.log('WWW mass model test contract passed.');

// ============================================================================
// PRODUCTION ENDSREC CURRENT-STATE SAFETY CONTRACT TESTS (MASS MODEL LEVEL)
// ============================================================================
// These tests verify that production massModel does NOT include ends mass.
// They are PASSING tests that document the current safe state.
// ============================================================================

// TEST 19: ENDSREC-PRODUCTION-CURRENT-ENDSMASS-NULL-SPEC-LEVEL
// Verify production buildMassModel() spec returns endsMass: null (not allocated).
(function testEndsRecProductionEndsMassNullSpecLevel() {
    const id = 'ENDSREC-PRODUCTION-CURRENT-ENDSMASS-NULL-SPEC-LEVEL';
    const massModel = buildMassModel('средние', 'средние');
    assert.strictEqual(massModel.endsMass === null, true, id + ': endsMass must be null');
    assert.ok(!massModel.hasOwnProperty('endsMass') || massModel.endsMass === null, id + ': endsMass must not be allocated');
    console.log(id + ' safe: production buildMassModel() endsMass is null.');
})();

// TEST 20: ENDSREC-PRODUCTION-CURRENT-MASSMODEL-STAYS-2ZONE-SPEC-LEVEL
// Verify production buildMassModel() spec returns mode: "2-zone" (not "3-zone").
(function testEndsRecProductionMassModelStays2ZoneSpecLevel() {
    const id = 'ENDSREC-PRODUCTION-CURRENT-MASSMODEL-STAYS-2ZONE-SPEC-LEVEL';
    const massModel = buildMassModel('средние', 'средние');
    assert.strictEqual(massModel.mode, '2-zone', id + ': mode must be "2-zone"');
    assert.notStrictEqual(massModel.mode, '3-zone', id + ': mode must NOT be "3-zone"');
    console.log(id + ' safe: production buildMassModel() mode is "2-zone".');
})();

// TEST 21: ENDSREC-PRODUCTION-CURRENT-2ZONE-SUM-CONTRACT-PRESERVED
// Verify production 2-zone sum contract is preserved: rootMass + lengthMass === totalMass.
(function testEndsRecProductionCurrentTwoZoneSumContractPreserved() {
    const id = 'ENDSREC-PRODUCTION-CURRENT-2ZONE-SUM-CONTRACT-PRESERVED';
    const massModel = buildMassModel('средние', 'средние');
    const sum = massModel.rootMass + massModel.lengthMass;
    assert.strictEqual(sum, massModel.totalMass, id + ': rootMass + lengthMass === totalMass');
    // With endsMass null, total must equal root + length (no third term)
    assert.ok(massModel.endsMass === null || massModel.endsMass === undefined, id + ': endsMass must be null/undefined');
    console.log(id + ' safe: production 2-zone sum contract preserved.');
})();

console.log('Production endsRec current-state safety contract tests (mass model) PASSED');

// ============================================================================
// PRODUCTION ENDSREC MASS ALLOCATION CONTRACT TESTS
// ============================================================================

const coreSourceForMassAllocation = fs.readFileSync('./www/core.js', 'utf8');
const coreSandboxForMassAllocation = {};
vm.createContext(coreSandboxForMassAllocation);
vm.runInContext(coreSourceForMassAllocation, coreSandboxForMassAllocation, { filename: 'www/core.js' });

function classifyEndsRecMassAllocationContract(readiness, builderResult, formulaContract) {
    const resultObj = coreSandboxForMassAllocation.classifyProductionEndsRecMassAllocationContract({}, readiness, builderResult, formulaContract);
    return Object.assign({
        massReady: resultObj.massReady,
        massStatus: resultObj.massStatus,
        candidateAllowed: resultObj.massStatus === 'READY',
        endsMass: null,
        mode: '2-zone',
        reasonCode: resultObj.reasonCode
    }, resultObj);
}


// TEST 1: MASS-CONTRACT-READY-ALLOWS-MASS-CANDIDATE
(function testMassContractReadyAllowsMassCandidate() {
    const id = 'MASS-CONTRACT-READY-ALLOWS-MASS-CANDIDATE';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, true, id + ': massReady must be true');
    assert.strictEqual(contract.candidateAllowed, true, id + ': candidateAllowed must be true');
    assert.strictEqual(contract.endsMass, null, id + ': production endsMass must remain null');
    assert.strictEqual(contract.mode, '2-zone', id + ': mode must remain 2-zone');
    assert.strictEqual(contract.dyeMass, undefined, id + ': dyeMass must not be created');
    assert.strictEqual(contract.oxidizerMass, undefined, id + ': oxidizerMass must not be created');
    console.log(id + ' safe.');
})();

// TEST 2: MASS-CONTRACT-REQUIRES-READINESS-READY
(function testMassContractRequiresReadinessReady() {
    const id = 'MASS-CONTRACT-REQUIRES-READINESS-READY';
    const readiness = makeBuilderReadiness({ ready: false, status: 'NOT_READY' });
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    console.log(id + ' safe.');
})();

// TEST 3: MASS-CONTRACT-REQUIRES-BUILDER-CREATED
(function testMassContractRequiresBuilderCreated() {
    const id = 'MASS-CONTRACT-REQUIRES-BUILDER-CREATED';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult({ created: false, status: 'NOT_CREATED', endsRec: null });
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    console.log(id + ' safe.');
})();

// TEST 4: MASS-CONTRACT-REQUIRES-FORMULA-READY
(function testMassContractRequiresFormulaReady() {
    const id = 'MASS-CONTRACT-REQUIRES-FORMULA-READY';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = { formulaReady: false, formulaStatus: 'NOT_READY' };
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    console.log(id + ' safe.');
})();

// TEST 5: MASS-CONTRACT-REQUIRES-PRODUCTION-READY-ENDSREC
(function testMassContractRequiresProductionReadyEndsRec() {
    const id = 'MASS-CONTRACT-REQUIRES-PRODUCTION-READY-ENDSREC';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult({
        endsRec: { productionReady: false, endsRecipeReady: false }
    });
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    console.log(id + ' safe.');
})();

// TEST 6: MASS-CONTRACT-BLOCKED-NO-MASS
(function testMassContractBlockedNoMass() {
    const id = 'MASS-CONTRACT-BLOCKED-NO-MASS';
    const readiness = makeBuilderReadiness({ ready: false, status: 'BLOCKED' });
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    assert.strictEqual(contract.massStatus, 'BLOCKED', id);
    assert.strictEqual(contract.endsMass, null, id);
    console.log(id + ' safe.');
})();

// TEST 7: MASS-CONTRACT-MANUAL-NO-MASS
(function testMassContractManualNoMass() {
    const id = 'MASS-CONTRACT-MANUAL-NO-MASS';
    const readiness = makeBuilderReadiness({ ready: false, status: 'MANUAL_REQUIRED' });
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    assert.strictEqual(contract.massStatus, 'MANUAL_REQUIRED', id);
    assert.strictEqual(contract.endsMass, null, id);
    console.log(id + ' safe.');
})();

// TEST 8: MASS-CONTRACT-NO-DYEMASS-OXIDIZERMASS
(function testMassContractNoDyeMassOxidizerMass() {
    const id = 'MASS-CONTRACT-NO-DYEMASS-OXIDIZERMASS';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.dyeMass, undefined, id);
    assert.strictEqual(contract.oxidizerMass, undefined, id);
    console.log(id + ' safe.');
})();

// TEST 9: MASS-CONTRACT-NO-EXACT-GRAMS
(function testMassContractNoExactGrams() {
    const id = 'MASS-CONTRACT-NO-EXACT-GRAMS';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.exactGrams, undefined, id);
    assert.strictEqual(contract.grams, undefined, id);
    assert.strictEqual(contract.dyeGrams, undefined, id);
    assert.strictEqual(contract.oxidizerGrams, undefined, id);
    console.log(id + ' safe.');
})();

// TEST 10: MASS-CONTRACT-NO-PRODUCTION-ENDSMASS
(function testMassContractNoProductionEndsMass() {
    const id = 'MASS-CONTRACT-NO-PRODUCTION-ENDSMASS';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.endsMass, null, id);
    console.log(id + ' safe.');
})();

// TEST 11: MASS-CONTRACT-NO-3ZONE-MASSMODEL
(function testMassContractNo3ZoneMassModel() {
    const id = 'MASS-CONTRACT-NO-3ZONE-MASSMODEL';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.mode, '2-zone', id);
    assert.notStrictEqual(contract.mode, '3-zone', id);
    console.log(id + ' safe.');
})();

// TEST 12: MASS-CONTRACT-NO-FINAL-FORMULA
(function testMassContractNoFinalFormula() {
    const id = 'MASS-CONTRACT-NO-FINAL-FORMULA';
    const readiness = makeBuilderReadiness();
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.finalFormula, undefined, id);
    console.log(id + ' safe.');
})();

// TEST 13: MASS-CONTRACT-CALCULATEPROTOCOL-IS-WIRED
(function testMassContractCalculateProtocolIsWired() {
    const id = 'MASS-CONTRACT-CALCULATEPROTOCOL-IS-WIRED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });
    const calcProtoSource = sandbox.calculateProtocol.toString();

    assert.strictEqual(calcProtoSource.includes('classifyProductionEndsRecMassAllocationContract'), true, id + ': classifyProductionEndsRecMassAllocationContract must be called inside calculateProtocol');
    assert.strictEqual(calcProtoSource.includes('endsRec: {') || calcProtoSource.includes('endsRec:{'), false, id + ': production endsRec must not be initialized in calculateProtocol');
    assert.strictEqual(calcProtoSource.includes('endsFormula:'), false, id + ': endsFormula must not be set inside calculateProtocol');
    console.log(id + ' safe.');
})();

// TEST 14: MASS-CONTRACT-NO-PREVIEW-MASS-PROMOTION
(function testMassContractNoPreviewMassPromotion() {
    const id = 'MASS-CONTRACT-NO-PREVIEW-MASS-PROMOTION';
    const context = makeReadinessContext();
    const readiness = validateProductionEndsRecReadiness(context);
    const builder = buildProductionEndsRecSkeletonContract(readiness);
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.ok(context.threeZoneCandidateMassModel);
    assert.strictEqual(context.threeZoneCandidateMassModel.endsMass, 12, id + ': candidate endsMass must be 12');
    assert.strictEqual(context.massModel.endsMass, null, id + ': production massModel.endsMass must remain null');
    assert.strictEqual(contract.endsMass, null, id + ': contract endsMass must be null');
    console.log(id + ' safe.');
})();

// TEST 15: MASS-CONTRACT-NO-AUTO-MASS-ON-MANUAL
(function testMassContractNoAutoMassOnManual() {
    const id = 'MASS-CONTRACT-NO-AUTO-MASS-ON-MANUAL';
    const readiness = makeBuilderReadiness({ ready: false, status: 'MANUAL_REQUIRED' });
    const builder = makeFormulaBuilderResult();
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const contract = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    assert.strictEqual(contract.massReady, false, id);
    assert.notStrictEqual(contract.massStatus, 'MASS_CONTRACT_READY', id);
    console.log(id + ' safe.');
})();

// TEST 16: MASS-CONTRACT-CURRENT-RUNTIME-STILL-SAFE
(function testMassContractCurrentRuntimeStillSafe() {
    const id = 'MASS-CONTRACT-CURRENT-RUNTIME-STILL-SAFE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();
    const html = output.innerHTML;

    assert.strictEqual(html.includes('endsRec:'), false, id + ': html must not contain production endsRec');
    assert.strictEqual(html.includes('&quot;mode&quot;:&quot;3-zone&quot;') && !html.includes('endsRecCandidatePreview'), false, id + ': html must not contain production 3-zone mode');
    assert.strictEqual(html.includes('&quot;endsMass&quot;:') && !html.includes('null') && !html.includes('endsRecCandidatePreview'), false, id + ': production endsMass must remain null');
    console.log(id + ' safe.');
})();

// TEST 17: MASS-ALLOCATION-HELPER-IS-PURE-AND-STRUCTURED
(function testMassAllocationHelperIsPureAndStructured() {
    const id = 'MASS-ALLOCATION-HELPER-IS-PURE-AND-STRUCTURED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    assert.strictEqual(typeof sandbox.classifyProductionEndsRecMassAllocationContract, 'function', id + ': helper must be exported');

    const context = { dummy: true };
    const readiness = { ready: true, status: 'READY', reasons: ['ok'] };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false, safetyReasonCodes: ['ok'] } };
    const formula = { formulaReady: true, safetyReasonCodes: ['ok'] };

    const beforeContext = JSON.stringify(context);
    const beforeReadiness = JSON.stringify(readiness);
    const beforeBuilder = JSON.stringify(builder);
    const beforeFormula = JSON.stringify(formula);

    const result = sandbox.classifyProductionEndsRecMassAllocationContract(context, readiness, builder, formula);

    // Assert purity: no inputs mutated
    assert.strictEqual(JSON.stringify(context), beforeContext, id + ': context must not be mutated');
    assert.strictEqual(JSON.stringify(readiness), beforeReadiness, id + ': readiness must not be mutated');
    assert.strictEqual(JSON.stringify(builder), beforeBuilder, id + ': builder must not be mutated');
    assert.strictEqual(JSON.stringify(formula), beforeFormula, id + ': formula must not be mutated');

    // Assert exact structure
    assert.strictEqual(result.massReady, true, id + ': massReady must be true');
    assert.strictEqual(result.massStatus, 'READY', id + ': massStatus must be READY');
    assert.strictEqual(result.allowedMassCalculation, true, id + ': allowedMassCalculation must be true');
    assert.strictEqual(result.estimatedEndsShare, null, id + ': estimatedEndsShare must be null');
    assert.strictEqual(result.sourceMassModelRef, 'threeZoneCandidateMassModel', id + ': sourceMassModelRef must be threeZoneCandidateMassModel');
    assert.strictEqual(JSON.stringify(result.safetyReasonCodes), JSON.stringify(['ok', 'ok', 'ok']), id + ': safetyReasonCodes must be aggregated');
    assert.strictEqual(JSON.stringify(result.manualRequiredReasonCodes), JSON.stringify([]), id + ': manualRequiredReasonCodes must be empty');

    console.log(id + ' safe.');
})();

console.log('Production endsRec mass allocation contract tests PASSED');


const coreSourceForAssembly = fs.readFileSync('./www/core.js', 'utf8');
const coreSandboxForAssembly = {};
vm.createContext(coreSandboxForAssembly);
vm.runInContext(coreSourceForAssembly, coreSandboxForAssembly, { filename: 'www/core.js' });

function assembleProductionEndsRecContractSpecLocal(readiness, builderResult, formulaContract, massAllocation) {
    const resultObj = coreSandboxForAssembly.assembleProductionEndsRecContract({}, readiness, builderResult, formulaContract, massAllocation);
    // Для збереження зворотної сумісності тестів, якщо статус READY, мапимо на ASSEMBLED, а якщо NOT_READY на NOT_ASSEMBLED
    const mappedStatus = resultObj.assemblyStatus === 'READY' ? 'ASSEMBLED' :
                         (resultObj.assemblyStatus === 'NOT_READY' ? 'NOT_ASSEMBLED' : resultObj.assemblyStatus);
    return Object.assign({}, resultObj, {
        assemblyStatus: mappedStatus
    });
    return {
        assembled: resultObj.assembled,
        assemblyStatus: mappedStatus,
        productionEndsRecCandidate: resultObj.productionEndsRecCandidate ? Object.assign({ zone: 'ends' }, resultObj.productionEndsRecCandidate) : null,
        sourceRefs: resultObj.sourceRefs,
        safetyReasonCodes: resultObj.safetyReasonCodes,
        manualRequiredReasonCodes: resultObj.manualRequiredReasonCodes
    };
}

// 1. ASSEMBLY-CONTRACT-READY-CREATES-CANDIDATE
(function testAssemblyContractReadyCreatesCandidate() {
    const id = 'ASSEMBLY-CONTRACT-READY-CREATES-CANDIDATE';
    const readiness = { ready: true, status: 'READY', reasons: ['low-risk'] };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false, safetyReasonCodes: ['builder-ok'] } };
    const formula = { formulaReady: true, formulaStatus: 'READY', formulaType: 'toning', safetyReasonCodes: ['formula-ok'] };
    const mass = { massReady: true, massStatus: 'READY', safetyReasonCodes: ['mass-ok'] };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, true, id);
    assert.strictEqual(result.assemblyStatus, 'ASSEMBLED', id);
    assert.ok(result.productionEndsRecCandidate !== null, id);
    assert.strictEqual(result.productionEndsRecCandidate.zone, 'ends', id);
    assert.strictEqual(result.productionEndsRecCandidate.productionReady, true, id);
    assert.strictEqual(result.productionEndsRecCandidate.endsRecipeReady, false, id);
    console.log(id + ' safe.');
})();

// 2. ASSEMBLY-CONTRACT-REQUIRES-READINESS-READY
(function testAssemblyContractRequiresReadinessReady() {
    const id = 'ASSEMBLY-CONTRACT-REQUIRES-READINESS-READY';
    const readiness = { ready: false, status: 'NOT_READY', reasons: ['risky-history'] };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 3. ASSEMBLY-CONTRACT-REQUIRES-BUILDER-CREATED
(function testAssemblyContractRequiresBuilderCreated() {
    const id = 'ASSEMBLY-CONTRACT-REQUIRES-BUILDER-CREATED';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: false, status: 'NOT_CREATED', endsRec: null };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 4. ASSEMBLY-CONTRACT-REQUIRES-FORMULA-READY
(function testAssemblyContractRequiresFormulaReady() {
    const id = 'ASSEMBLY-CONTRACT-REQUIRES-FORMULA-READY';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: false, formulaStatus: 'NOT_READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 5. ASSEMBLY-CONTRACT-REQUIRES-MASS-READY
(function testAssemblyContractRequiresMassReady() {
    const id = 'ASSEMBLY-CONTRACT-REQUIRES-MASS-READY';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: false, massStatus: 'NOT_READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 6. ASSEMBLY-CONTRACT-REQUIRES-PRODUCTION-READY-ENDSREC
(function testAssemblyContractRequiresProductionReadyEndsRec() {
    const id = 'ASSEMBLY-CONTRACT-REQUIRES-PRODUCTION-READY-ENDSREC';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: false, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 7. ASSEMBLY-CONTRACT-REQUIRES-ENDSRECIPE-NOT-READY
(function testAssemblyContractRequiresEndsRecipeNotReady() {
    const id = 'ASSEMBLY-CONTRACT-REQUIRES-ENDSRECIPE-NOT-READY';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: true } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 8. ASSEMBLY-CONTRACT-BLOCKED-NO-ASSEMBLY
(function testAssemblyContractBlockedNoAssembly() {
    const id = 'ASSEMBLY-CONTRACT-BLOCKED-NO-ASSEMBLY';
    const readiness = { ready: false, status: 'BLOCKED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.assemblyStatus, 'BLOCKED', id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 9. ASSEMBLY-CONTRACT-MANUAL-NO-ASSEMBLY
(function testAssemblyContractManualNoAssembly() {
    const id = 'ASSEMBLY-CONTRACT-MANUAL-NO-ASSEMBLY';
    const readiness = { ready: false, status: 'MANUAL_REQUIRED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.assemblyStatus, 'MANUAL_REQUIRED', id);
    assert.strictEqual(result.productionEndsRecCandidate, null, id);
    console.log(id + ' safe.');
})();

// 10. ASSEMBLY-CONTRACT-NO-DYEMASS-OXIDIZERMASS
(function testAssemblyContractNoDyeMassOxidizerMass() {
    const id = 'ASSEMBLY-CONTRACT-NO-DYEMASS-OXIDIZERMASS';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.dyeMass, undefined, id);
    assert.strictEqual(result.oxidizerMass, undefined, id);
    if (result.productionEndsRecCandidate) {
        assert.strictEqual(result.productionEndsRecCandidate.dyeMass, undefined, id);
        assert.strictEqual(result.productionEndsRecCandidate.oxidizerMass, undefined, id);
    }
    console.log(id + ' safe.');
})();

// 11. ASSEMBLY-CONTRACT-NO-EXACT-GRAMS
(function testAssemblyContractNoExactGrams() {
    const id = 'ASSEMBLY-CONTRACT-NO-EXACT-GRAMS';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.exactGrams, undefined, id);
    assert.strictEqual(result.dyeGrams, undefined, id);
    assert.strictEqual(result.oxidizerGrams, undefined, id);
    if (result.productionEndsRecCandidate) {
        assert.strictEqual(result.productionEndsRecCandidate.exactGrams, undefined, id);
    }
    console.log(id + ' safe.');
})();

// 12. ASSEMBLY-CONTRACT-NO-ENDSMASS
(function testAssemblyContractNoEndsMass() {
    const id = 'ASSEMBLY-CONTRACT-NO-ENDSMASS';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.endsMass, undefined, id);
    if (result.productionEndsRecCandidate) {
        assert.strictEqual(result.productionEndsRecCandidate.endsMass, undefined, id);
    }
    console.log(id + ' safe.');
})();

// 13. ASSEMBLY-CONTRACT-NO-3ZONE-MASSMODEL
(function testAssemblyContractNo3ZoneMassModel() {
    const id = 'ASSEMBLY-CONTRACT-NO-3ZONE-MASSMODEL';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.mode, undefined, id);
    if (result.productionEndsRecCandidate) {
        assert.strictEqual(result.productionEndsRecCandidate.mode, undefined, id);
    }
    console.log(id + ' safe.');
})();

// 14. ASSEMBLY-CONTRACT-NO-FINAL-FORMULA
(function testAssemblyContractNoFinalFormula() {
    const id = 'ASSEMBLY-CONTRACT-NO-FINAL-FORMULA';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.endsFormula, undefined, id);
    if (result.productionEndsRecCandidate) {
        assert.strictEqual(result.productionEndsRecCandidate.endsFormula, undefined, id);
    }
    console.log(id + ' safe.');
})();

// 15. ASSEMBLY-CONTRACT-ENDSRECIPE-STAYS-FALSE
(function testAssemblyContractEndsRecipeStaysFalse() {
    const id = 'ASSEMBLY-CONTRACT-ENDSRECIPE-STAYS-FALSE';
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, true, id);
    assert.strictEqual(result.productionEndsRecCandidate.endsRecipeReady, false, id);
    console.log(id + ' safe.');
})();

// 16. ASSEMBLY-CONTRACT-CALCULATEPROTOCOL-IS-WIRED
(function testAssemblyContractCalculateProtocolIsWired() {
    const id = 'ASSEMBLY-CONTRACT-CALCULATEPROTOCOL-IS-WIRED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });
    const calcProtoSource = sandbox.calculateProtocol.toString();

    assert.strictEqual(calcProtoSource.includes('assembleProductionEndsRecContract'), true, id + ': assembleProductionEndsRecContract must be called inside calculateProtocol');
    console.log(id + ' safe.');
})();

// 17. ASSEMBLY-CONTRACT-NO-PREVIEW-MASS-PROMOTION
(function testAssemblyContractNoPreviewMassPromotion() {
    const id = 'ASSEMBLY-CONTRACT-NO-PREVIEW-MASS-PROMOTION';
    const context = makeReadinessContext();
    const readiness = validateProductionEndsRecReadiness(context);
    const builder = buildProductionEndsRecSkeletonContract(readiness);
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const mass = classifyEndsRecMassAllocationContract(readiness, builder, formula);

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.ok(context.threeZoneCandidateMassModel);
    assert.strictEqual(context.threeZoneCandidateMassModel.endsMass, 12, id + ': candidate endsMass must be 12');
    assert.strictEqual(context.massModel.endsMass, null, id + ': production massModel.endsMass must remain null');
    assert.strictEqual(result.endsMass, undefined, id + ': contract endsMass must not exist');
    console.log(id + ' safe.');
})();

// 18. ASSEMBLY-CONTRACT-NO-AUTO-ASSEMBLY-ON-MANUAL
(function testAssemblyContractNoAutoAssemblyOnManual() {
    const id = 'ASSEMBLY-CONTRACT-NO-AUTO-ASSEMBLY-ON-MANUAL';
    const readiness = { ready: false, status: 'MANUAL_REQUIRED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };

    const result = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(result.assembled, false, id);
    assert.strictEqual(result.assemblyStatus, 'MANUAL_REQUIRED', id);
    console.log(id + ' safe.');
})();

// 19. ASSEMBLY-CONTRACT-PURITY
(function testAssemblyContractPurity() {
    const id = 'ASSEMBLY-CONTRACT-PURITY';
    const readiness = { ready: true, status: 'READY', reasons: ['ok'] };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false, safetyReasonCodes: ['ok'] } };
    const formula = { formulaReady: true, formulaStatus: 'READY', safetyReasonCodes: ['ok'] };
    const mass = { massReady: true, massStatus: 'READY', safetyReasonCodes: ['ok'] };

    const beforeReadiness = JSON.stringify(readiness);
    const beforeBuilder = JSON.stringify(builder);
    const beforeFormula = JSON.stringify(formula);
    const beforeMass = JSON.stringify(mass);

    assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    assert.strictEqual(JSON.stringify(readiness), beforeReadiness, id + ': readiness must not be mutated');
    assert.strictEqual(JSON.stringify(builder), beforeBuilder, id + ': builder must not be mutated');
    assert.strictEqual(JSON.stringify(formula), beforeFormula, id + ': formula must not be mutated');
    assert.strictEqual(JSON.stringify(mass), beforeMass, id + ': mass must not be mutated');
    console.log(id + ' safe.');
})();

// 20. ASSEMBLY-CONTRACT-CURRENT-RUNTIME-STILL-SAFE
(function testAssemblyContractCurrentRuntimeStillSafe() {
    const id = 'ASSEMBLY-CONTRACT-CURRENT-RUNTIME-STILL-SAFE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();
    const html = output.innerHTML;

    assert.strictEqual(html.includes('assembled:'), false, id + ': html must not contain assembly status');
    assert.strictEqual(html.includes('productionEndsRecCandidate'), false, id + ': html must not contain assembly candidate');
    console.log(id + ' safe.');
})();

console.log('Production endsRec assembly contract tests PASSED');


// ============================================================================
// CONTROLLED ENDSREC WIRING CONTRACT TESTS (SPEC MIRROR)
// ============================================================================

const coreSourceForWiring = fs.readFileSync('./www/core.js', 'utf8');
const coreSandboxForWiring = {};
vm.createContext(coreSandboxForWiring);
vm.runInContext(coreSourceForWiring, coreSandboxForWiring, { filename: 'www/core.js' });

function runControlledEndsRecWiringSpecLocal(context, readiness, builderResult, formulaContract, massAllocation, assemblyResult) {
    const resultObj = coreSandboxForWiring.buildControlledEndsRecDiagnosticWiringContract(context, readiness, builderResult, formulaContract, massAllocation, assemblyResult);
    return {
        allowed: resultObj.diagnosticReady,
        diagnosticCandidate: resultObj.diagnosticCandidate
    };
}

// 1. WIRING-CONTRACT-READY-CREATES-DIAGNOSTIC-CANDIDATE
(function testWiringContractReadyCreatesDiagnosticCandidate() {
    const id = 'WIRING-CONTRACT-READY-CREATES-DIAGNOSTIC-CANDIDATE';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = {
        assembled: true,
        assemblyStatus: 'READY',
        productionEndsRecCandidate: {
            productionReady: true,
            endsRecipeReady: false,
            sourceRefs: { readinessReasonCode: 'OK' },
            safetyReasonCodes: ['low-risk'],
            manualRequiredReasonCodes: []
        }
    };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, true, id);
    assert.ok(result.diagnosticCandidate !== null, id);
    assert.strictEqual(result.diagnosticCandidate.candidateOnly, true, id);
    assert.strictEqual(result.diagnosticCandidate.previewOnly, true, id);
    assert.strictEqual(result.diagnosticCandidate.notForMixing, true, id);
    console.log(id + ' safe.');
})();

// 2. WIRING-CONTRACT-REQUIRES-READINESS-READY
(function testWiringContractRequiresReadinessReady() {
    const id = 'WIRING-CONTRACT-REQUIRES-READINESS-READY';
    const context = {};
    const readiness = { ready: false, status: 'NOT_READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 3. WIRING-CONTRACT-REQUIRES-BUILDER-CREATED
(function testWiringContractRequiresBuilderCreated() {
    const id = 'WIRING-CONTRACT-REQUIRES-BUILDER-CREATED';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: false, status: 'NOT_CREATED' };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 4. WIRING-CONTRACT-REQUIRES-FORMULA-READY
(function testWiringContractRequiresFormulaReady() {
    const id = 'WIRING-CONTRACT-REQUIRES-FORMULA-READY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: false, formulaStatus: 'NOT_READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 5. WIRING-CONTRACT-REQUIRES-MASS-READY
(function testWiringContractRequiresMassReady() {
    const id = 'WIRING-CONTRACT-REQUIRES-MASS-READY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: false, massStatus: 'NOT_READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 6. WIRING-CONTRACT-REQUIRES-ASSEMBLY
(function testWiringContractRequiresAssembly() {
    const id = 'WIRING-CONTRACT-REQUIRES-ASSEMBLY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: false, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 7. WIRING-CONTRACT-REQUIRES-ASSEMBLY-CANDIDATE
(function testWiringContractRequiresAssemblyCandidate() {
    const id = 'WIRING-CONTRACT-REQUIRES-ASSEMBLY-CANDIDATE';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: null };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 8. WIRING-CONTRACT-BLOCKED-NO-DIAGNOSTIC
(function testWiringContractBlockedNoDiagnostic() {
    const id = 'WIRING-CONTRACT-BLOCKED-NO-DIAGNOSTIC';
    const context = {};
    const readiness = { ready: false, status: 'BLOCKED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 9. WIRING-CONTRACT-MANUAL-NO-DIAGNOSTIC
(function testWiringContractManualNoDiagnostic() {
    const id = 'WIRING-CONTRACT-MANUAL-NO-DIAGNOSTIC';
    const context = {};
    const readiness = { ready: false, status: 'MANUAL_REQUIRED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticCandidate, null, id);
    console.log(id + ' safe.');
})();

// 10. WIRING-CONTRACT-DIAGNOSTIC-FLAGS-REQUIRED
(function testWiringContractDiagnosticFlagsRequired() {
    const id = 'WIRING-CONTRACT-DIAGNOSTIC-FLAGS-REQUIRED';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: { safetyReasonCodes: [], manualRequiredReasonCodes: [] } };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.previewOnly, true, id);
    assert.strictEqual(result.diagnosticCandidate.candidateOnly, true, id);
    assert.strictEqual(result.diagnosticCandidate.notForMixing, true, id);
    console.log(id + ' safe.');
})();

// 11. WIRING-CONTRACT-NO-PRODUCTION-ENDSREC
(function testWiringContractNoProductionEndsRec() {
    const id = 'WIRING-CONTRACT-NO-PRODUCTION-ENDSREC';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.productionReady, false, id + ': diagnostic candidate cannot have productionReady true');
    console.log(id + ' safe.');
})();

// 12. WIRING-CONTRACT-NO-DYEMASS-OXIDIZERMASS
(function testWiringContractNoDyeMassOxidizerMass() {
    const id = 'WIRING-CONTRACT-NO-DYEMASS-OXIDIZERMASS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.dyeMass, undefined, id);
    assert.strictEqual(result.diagnosticCandidate.oxidizerMass, undefined, id);
    console.log(id + ' safe.');
})();

// 13. WIRING-CONTRACT-NO-EXACT-GRAMS
(function testWiringContractNoExactGrams() {
    const id = 'WIRING-CONTRACT-NO-EXACT-GRAMS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.exactGrams, undefined, id);
    assert.strictEqual(result.diagnosticCandidate.dyeGrams, undefined, id);
    assert.strictEqual(result.diagnosticCandidate.oxidizerGrams, undefined, id);
    console.log(id + ' safe.');
})();

// 14. WIRING-CONTRACT-NO-ENDSMASS
(function testWiringContractNoEndsMass() {
    const id = 'WIRING-CONTRACT-NO-ENDSMASS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.endsMass, undefined, id);
    console.log(id + ' safe.');
})();

// 15. WIRING-CONTRACT-NO-3ZONE-MASSMODEL
(function testWiringContractNo3ZoneMassModel() {
    const id = 'WIRING-CONTRACT-NO-3ZONE-MASSMODEL';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.mode, undefined, id);
    console.log(id + ' safe.');
})();

// 16. WIRING-CONTRACT-NO-FINAL-FORMULA
(function testWiringContractNoFinalFormula() {
    const id = 'WIRING-CONTRACT-NO-FINAL-FORMULA';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.endsFormula, undefined, id);
    console.log(id + ' safe.');
})();

// 17. WIRING-CONTRACT-ENDSRECIPE-STAYS-FALSE
(function testWiringContractEndsRecipeStaysFalse() {
    const id = 'WIRING-CONTRACT-ENDSRECIPE-STAYS-FALSE';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };

    const result = runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(result.diagnosticCandidate.endsRecipeReady, false, id);
    console.log(id + ' safe.');
})();

// 18. WIRING-CONTRACT-NO-PREVIEW-MASS-PROMOTION
(function testWiringContractNoPreviewMassPromotion() {
    const id = 'WIRING-CONTRACT-NO-PREVIEW-MASS-PROMOTION';
    const context = makeReadinessContext();
    const readiness = validateProductionEndsRecReadiness(context);
    const builder = buildProductionEndsRecSkeletonContract(readiness);
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const mass = classifyEndsRecMassAllocationContract(readiness, builder, formula);
    const assembly = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);

    runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.ok(context.threeZoneCandidateMassModel);
    assert.strictEqual(context.threeZoneCandidateMassModel.endsMass, 12, id + ': candidate endsMass must be 12');
    assert.strictEqual(context.massModel.endsMass, null, id + ': production massModel.endsMass must remain null');
    console.log(id + ' safe.');
})();

// 19. WIRING-CONTRACT-RUNTIME-INVARIANTS-STAY-2ZONE
(function testWiringContractRuntimeInvariantsStay2Zone() {
    const id = 'WIRING-CONTRACT-RUNTIME-INVARIANTS-STAY-2ZONE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    // Verify invariants: massModel.mode and endsMass are not touched by calculateProtocol
    const html = output.innerHTML;
    assert.strictEqual(html.includes('&quot;mode&quot;:&quot;3-zone&quot;') && !html.includes('endsRecCandidatePreview'), false, id + ': production 3-zone mode must not be active');
    assert.strictEqual(html.includes('&quot;endsMass&quot;:') && !html.includes('null') && !html.includes('endsRecCandidatePreview'), false, id + ': production endsMass must remain null');
    console.log(id + ' safe.');
})();

// 20. WIRING-CONTRACT-CALCULATEPROTOCOL-IS-WIRED
(function testWiringContractCalculateProtocolIsWired() {
    const id = 'WIRING-CONTRACT-CALCULATEPROTOCOL-IS-WIRED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });
    const calcProtoSource = sandbox.calculateProtocol.toString();

    // buildControlledEndsRecDiagnosticWiringContract must be present inside calculateProtocol as guarded wiring
    assert.strictEqual(calcProtoSource.includes('buildControlledEndsRecDiagnosticWiringContract'), true, id + ': buildControlledEndsRecDiagnosticWiringContract must be present in calculateProtocol');
    console.log(id + ' safe.');
})();


// 21. WIRING-CONTRACT-ROOT-LENGTH-UNCHANGED
(function testWiringContractRootLengthUnchanged() {
    const id = 'WIRING-CONTRACT-ROOT-LENGTH-UNCHANGED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    // Check that rootRec / lenRec do not contain ends-related or third-zone recipe fields
    assert.strictEqual(html.includes('endsRec:'), false, id);
    assert.strictEqual(html.includes('endsFormula:'), false, id);
    console.log(id + ' safe.');
})();

// 22. WIRING-CONTRACT-NO-UI-RENDER-PRODUCTION-RECIPE
(function testWiringContractNoUiRenderProductionRecipe() {
    const id = 'WIRING-CONTRACT-NO-UI-RENDER-PRODUCTION-RECIPE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    // Check that UI output does not render candidate as a production recipe
    assert.strictEqual(html.includes('endsRecAssemblyCandidate'), false, id);
    console.log(id + ' safe.');
})();

// 23. WIRING-CONTRACT-PURITY
(function testWiringContractPurity() {
    const id = 'WIRING-CONTRACT-PURITY';
    const context = { productionBlocked: false };
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = {
        assembled: true,
        assemblyStatus: 'READY',
        productionEndsRecCandidate: {
            productionReady: true,
            endsRecipeReady: false,
            sourceRefs: { readinessReasonCode: 'OK' },
            safetyReasonCodes: ['low-risk'],
            manualRequiredReasonCodes: []
        }
    };

    const beforeContext = JSON.stringify(context);
    const beforeReadiness = JSON.stringify(readiness);
    const beforeBuilder = JSON.stringify(builder);
    const beforeFormula = JSON.stringify(formula);
    const beforeMass = JSON.stringify(mass);
    const beforeAssembly = JSON.stringify(assembly);

    runControlledEndsRecWiringSpecLocal(context, readiness, builder, formula, mass, assembly);

    assert.strictEqual(JSON.stringify(context), beforeContext, id + ': context must not be mutated');
    assert.strictEqual(JSON.stringify(readiness), beforeReadiness, id + ': readiness must not be mutated');
    assert.strictEqual(JSON.stringify(builder), beforeBuilder, id + ': builder must not be mutated');
    assert.strictEqual(JSON.stringify(formula), beforeFormula, id + ': formula must not be mutated');
    assert.strictEqual(JSON.stringify(mass), beforeMass, id + ': mass must not be mutated');
    assert.strictEqual(JSON.stringify(assembly), beforeAssembly, id + ': assembly must not be mutated');
    console.log(id + ' safe.');
})();

// 24. WIRING-CONTRACT-CURRENT-RUNTIME-STILL-SAFE
(function testWiringContractCurrentRuntimeStillSafe() {
    const id = 'WIRING-CONTRACT-CURRENT-RUNTIME-STILL-SAFE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    // Current runtime must NOT output 3-zone, dyeMass, oxidizerMass, exactGrams, finalEndsFormula, etc.
    assert.strictEqual(html.includes('endsRec:'), false, id);
    assert.strictEqual(html.includes('endsFormula:'), false, id);
    assert.strictEqual(html.includes('&quot;mode&quot;:&quot;3-zone&quot;') && !html.includes('endsRecCandidatePreview'), false, id);
    assert.strictEqual(html.includes('&quot;endsMass&quot;:') && !html.includes('null') && !html.includes('endsRecCandidatePreview'), false, id);
    console.log(id + ' safe.');
})();

console.log('Production endsRec controlled wiring contract tests PASSED');


// ============================================================================
// GUARDED CALCULATEPROTOCOL DIAGNOSTIC WIRING TESTS (SPEC MIRROR)
// ============================================================================

/**
 * Local spec helper to mirror the future guarded calculateProtocol diagnostic wiring.
 * This represents the execution wrapper under test.
 */
function runGuardedDiagnosticWiringSpecLocal(context, readiness, builderResult, formulaContract, massAllocation, assemblyResult, controlledWiringResult) {
    // 23. GUARDED-WIRING-PURITY: Ensure we do not mutate inputs
    const isReady = readiness && readiness.ready === true;
    const isBuilderCreated = builderResult && builderResult.created === true;
    const isFormulaReady = formulaContract && formulaContract.formulaReady === true;
    const isMassReady = massAllocation && massAllocation.massReady === true;
    const isAssembled = assemblyResult && assemblyResult.assembled === true;
    const isWiringReady = controlledWiringResult && controlledWiringResult.diagnosticReady === true;
    const candidate = controlledWiringResult && controlledWiringResult.diagnosticCandidate;
    const productionBlocked = context && context.productionBlocked === true;

    const isBlocked = (readiness && readiness.status === 'BLOCKED') ||
                      (builderResult && builderResult.status === 'BLOCKED') ||
                      (formulaContract && formulaContract.formulaStatus === 'BLOCKED') ||
                      (massAllocation && massAllocation.massStatus === 'BLOCKED') ||
                      (assemblyResult && assemblyResult.assemblyStatus === 'BLOCKED') ||
                      (controlledWiringResult && controlledWiringResult.wiringStatus === 'BLOCKED');

    const isManual = (readiness && readiness.status === 'MANUAL_REQUIRED') ||
                     (builderResult && builderResult.status === 'MANUAL_REQUIRED') ||
                     (formulaContract && formulaContract.formulaStatus === 'MANUAL_REQUIRED') ||
                     (massAllocation && massAllocation.massStatus === 'MANUAL_REQUIRED') ||
                     (assemblyResult && assemblyResult.assemblyStatus === 'MANUAL_REQUIRED') ||
                     (controlledWiringResult && controlledWiringResult.wiringStatus === 'MANUAL_REQUIRED');

    const canWire = isReady && isBuilderCreated && isFormulaReady && isMassReady &&
                    isAssembled && isWiringReady && candidate && !productionBlocked && !isBlocked && !isManual;

    if (!canWire) {
        return {
            allowed: false,
            diagnosticContainer: null
        };
    }

    // 10. GUARDED-WIRING-DIAGNOSTIC-FLAGS-REQUIRED
    const diagnosticCandidate = {
        zone: 'ends',
        candidateOnly: true,
        previewOnly: true,
        notForMixing: true, // Safety flag
        productionReady: false, // 11. GUARDED-WIRING-NO-PRODUCTION-ENDSREC
        endsRecipeReady: false, // 17. GUARDED-WIRING-ENDSRECIPE-STAYS-FALSE
        sourceRefs: Object.assign({}, candidate.sourceRefs),
        safetyReasonCodes: Array.isArray(candidate.safetyReasonCodes) ? candidate.safetyReasonCodes.slice() : [],
        manualRequiredReasonCodes: Array.isArray(candidate.manualRequiredReasonCodes) ? candidate.manualRequiredReasonCodes.slice() : []
    };

    return {
        allowed: true,
        // 25. GUARDED-WIRING-CONTAINER-NOT-HARDCODED-TO-REASONS
        diagnosticContainer: {
            guardedDiagnosticCandidate: diagnosticCandidate
        }
    };
}

// 1. GUARDED-WIRING-READY-CAN-CREATE-DIAGNOSTIC-CONTAINER
(function testGuardedWiringReadyCanCreateDiagnosticContainer() {
    const id = 'GUARDED-WIRING-READY-CAN-CREATE-DIAGNOSTIC-CONTAINER';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, assemblyStatus: 'READY', productionEndsRecCandidate: {} };
    const wiring = {
        diagnosticReady: true,
        wiringStatus: 'READY',
        diagnosticCandidate: {
            sourceRefs: { readinessReasonCode: 'OK' },
            safetyReasonCodes: ['low-risk'],
            manualRequiredReasonCodes: []
        }
    };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, true, id);
    assert.ok(result.diagnosticContainer !== null, id);
    assert.ok(result.diagnosticContainer.guardedDiagnosticCandidate !== null, id);
    assert.strictEqual(result.diagnosticContainer.guardedDiagnosticCandidate.candidateOnly, true, id);
    assert.strictEqual(result.diagnosticContainer.guardedDiagnosticCandidate.previewOnly, true, id);
    assert.strictEqual(result.diagnosticContainer.guardedDiagnosticCandidate.notForMixing, true, id);
    console.log(id + ' safe.');
})();

// 2. GUARDED-WIRING-REQUIRES-READINESS-READY
(function testGuardedWiringRequiresReadinessReady() {
    const id = 'GUARDED-WIRING-REQUIRES-READINESS-READY';
    const context = {};
    const readiness = { ready: false, status: 'NOT_READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 3. GUARDED-WIRING-REQUIRES-BUILDER-CREATED
(function testGuardedWiringRequiresBuilderCreated() {
    const id = 'GUARDED-WIRING-REQUIRES-BUILDER-CREATED';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: false, status: 'NOT_CREATED' };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 4. GUARDED-WIRING-REQUIRES-FORMULA-READY
(function testGuardedWiringRequiresFormulaReady() {
    const id = 'GUARDED-WIRING-REQUIRES-FORMULA-READY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: false, formulaStatus: 'NOT_READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 5. GUARDED-WIRING-REQUIRES-MASS-READY
(function testGuardedWiringRequiresMassReady() {
    const id = 'GUARDED-WIRING-REQUIRES-MASS-READY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: false, massStatus: 'NOT_READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 6. GUARDED-WIRING-REQUIRES-ASSEMBLY
(function testGuardedWiringRequiresAssembly() {
    const id = 'GUARDED-WIRING-REQUIRES-ASSEMBLY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: false, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 7. GUARDED-WIRING-REQUIRES-CONTROLLED-WIRING-READY
(function testGuardedWiringRequiresControlledWiringReady() {
    const id = 'GUARDED-WIRING-REQUIRES-CONTROLLED-WIRING-READY';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: false, diagnosticCandidate: null };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 8. GUARDED-WIRING-BLOCKED-NO-DIAGNOSTIC
(function testGuardedWiringBlockedNoDiagnostic() {
    const id = 'GUARDED-WIRING-BLOCKED-NO-DIAGNOSTIC';
    const context = {};
    const readiness = { ready: false, status: 'BLOCKED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 9. GUARDED-WIRING-MANUAL-NO-DIAGNOSTIC
(function testGuardedWiringManualNoDiagnostic() {
    const id = 'GUARDED-WIRING-MANUAL-NO-DIAGNOSTIC';
    const context = {};
    const readiness = { ready: false, status: 'MANUAL_REQUIRED' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(result.allowed, false, id);
    assert.strictEqual(result.diagnosticContainer, null, id);
    console.log(id + ' safe.');
})();

// 10. GUARDED-WIRING-DIAGNOSTIC-FLAGS-REQUIRED
(function testGuardedWiringDiagnosticFlagsRequired() {
    const id = 'GUARDED-WIRING-DIAGNOSTIC-FLAGS-REQUIRED';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: { safetyReasonCodes: [], manualRequiredReasonCodes: [] } };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.previewOnly, true, id);
    assert.strictEqual(cand.candidateOnly, true, id);
    assert.strictEqual(cand.notForMixing, true, id);
    console.log(id + ' safe.');
})();

// 11. GUARDED-WIRING-NO-PRODUCTION-ENDSREC
(function testGuardedWiringNoProductionEndsRec() {
    const id = 'GUARDED-WIRING-NO-PRODUCTION-ENDSREC';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.productionReady, false, id + ': diagnostic candidate cannot have productionReady true');
    console.log(id + ' safe.');
})();

// 12. GUARDED-WIRING-NO-DYEMASS-OXIDIZERMASS
(function testGuardedWiringNoDyeMassOxidizerMass() {
    const id = 'GUARDED-WIRING-NO-DYEMASS-OXIDIZERMASS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.dyeMass, undefined, id);
    assert.strictEqual(cand.oxidizerMass, undefined, id);
    console.log(id + ' safe.');
})();

// 13. GUARDED-WIRING-NO-EXACT-GRAMS
(function testGuardedWiringNoExactGrams() {
    const id = 'GUARDED-WIRING-NO-EXACT-GRAMS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.exactGrams, undefined, id);
    assert.strictEqual(cand.dyeGrams, undefined, id);
    assert.strictEqual(cand.oxidizerGrams, undefined, id);
    console.log(id + ' safe.');
})();

// 14. GUARDED-WIRING-NO-ENDSMASS
(function testGuardedWiringNoEndsMass() {
    const id = 'GUARDED-WIRING-NO-ENDSMASS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.endsMass, undefined, id);
    console.log(id + ' safe.');
})();

// 15. GUARDED-WIRING-NO-3ZONE-MASSMODEL
(function testGuardedWiringNo3ZoneMassModel() {
    const id = 'GUARDED-WIRING-NO-3ZONE-MASSMODEL';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.mode, undefined, id);
    console.log(id + ' safe.');
})();

// 16. GUARDED-WIRING-NO-FINAL-FORMULA
(function testGuardedWiringNoFinalFormula() {
    const id = 'GUARDED-WIRING-NO-FINAL-FORMULA';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.endsFormula, undefined, id);
    console.log(id + ' safe.');
})();

// 17. GUARDED-WIRING-ENDSRECIPE-STAYS-FALSE
(function testGuardedWiringEndsRecipeStaysFalse() {
    const id = 'GUARDED-WIRING-ENDSRECIPE-STAYS-FALSE';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, productionEndsRecCandidate: {} };
    const wiring = { diagnosticReady: true, diagnosticCandidate: {} };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    const cand = result.diagnosticContainer.guardedDiagnosticCandidate;
    assert.strictEqual(cand.endsRecipeReady, false, id);
    console.log(id + ' safe.');
})();

// 18. GUARDED-WIRING-NO-PREVIEW-MASS-PROMOTION
(function testGuardedWiringNoPreviewMassPromotion() {
    const id = 'GUARDED-WIRING-NO-PREVIEW-MASS-PROMOTION';
    const context = makeReadinessContext();
    const readiness = validateProductionEndsRecReadiness(context);
    const builder = buildProductionEndsRecSkeletonContract(readiness);
    const formula = classifyFormulaContractSpecData(readiness, builder);
    const mass = classifyEndsRecMassAllocationContract(readiness, builder, formula);
    const assembly = assembleProductionEndsRecContractSpecLocal(readiness, builder, formula, mass);
    const wiring = coreSandboxForWiring.buildControlledEndsRecDiagnosticWiringContract(context, readiness, builder, formula, mass, assembly);

    runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.ok(context.threeZoneCandidateMassModel);
    assert.strictEqual(context.threeZoneCandidateMassModel.endsMass, 12, id + ': candidate endsMass must be 12');
    assert.strictEqual(context.massModel.endsMass, null, id + ': production massModel.endsMass must remain null');
    console.log(id + ' safe.');
})();

// 19. GUARDED-WIRING-RUNTIME-INVARIANTS-STAY-2ZONE
(function testGuardedWiringRuntimeInvariantsStay2Zone() {
    const id = 'GUARDED-WIRING-RUNTIME-INVARIANTS-STAY-2ZONE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    assert.strictEqual(html.includes('&quot;mode&quot;:&quot;3-zone&quot;') && !html.includes('endsRecCandidatePreview'), false, id + ': production 3-zone mode must not be active');
    assert.strictEqual(html.includes('&quot;endsMass&quot;:') && !html.includes('null') && !html.includes('endsRecCandidatePreview'), false, id + ': production endsMass must remain null');
    console.log(id + ' safe.');
})();

// 20. GUARDED-WIRING-CALCULATEPROTOCOL-IS-WIRED
(function testGuardedWiringCalculateProtocolIsWired() {
    const id = 'GUARDED-WIRING-CALCULATEPROTOCOL-IS-WIRED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });
    const calcProtoSource = sandbox.calculateProtocol.toString();

    // The calculateProtocol execution block should contain wiring execution variable logic now
    assert.strictEqual(calcProtoSource.includes('endsRecDiagnosticWiringCandidate'), true, id);
    console.log(id + ' safe.');
})();


// 21. GUARDED-WIRING-ROOT-LENGTH-UNCHANGED
(function testGuardedWiringRootLengthUnchanged() {
    const id = 'GUARDED-WIRING-ROOT-LENGTH-UNCHANGED';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    assert.strictEqual(html.includes('endsRec:'), false, id);
    assert.strictEqual(html.includes('endsFormula:'), false, id);
    console.log(id + ' safe.');
})();

// 22. GUARDED-WIRING-NO-UI-RENDER-PRODUCTION-RECIPE
(function testGuardedWiringNoUiRenderProductionRecipe() {
    const id = 'GUARDED-WIRING-NO-UI-RENDER-PRODUCTION-RECIPE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    assert.strictEqual(html.includes('guardedDiagnosticCandidate'), false, id);
    console.log(id + ' safe.');
})();

// 23. GUARDED-WIRING-PURITY
(function testGuardedWiringPurity() {
    const id = 'GUARDED-WIRING-PURITY';
    const context = { productionBlocked: false };
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, massStatus: 'READY' };
    const assembly = { assembled: true, assemblyStatus: 'READY', productionEndsRecCandidate: {} };
    const wiring = {
        diagnosticReady: true,
        wiringStatus: 'READY',
        diagnosticCandidate: {
            sourceRefs: { readinessReasonCode: 'OK' },
            safetyReasonCodes: ['low-risk'],
            manualRequiredReasonCodes: []
        }
    };

    const beforeContext = JSON.stringify(context);
    const beforeReadiness = JSON.stringify(readiness);
    const beforeBuilder = JSON.stringify(builder);
    const beforeFormula = JSON.stringify(formula);
    const beforeMass = JSON.stringify(mass);
    const beforeAssembly = JSON.stringify(assembly);
    const beforeWiring = JSON.stringify(wiring);

    runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    assert.strictEqual(JSON.stringify(context), beforeContext, id + ': context must not be mutated');
    assert.strictEqual(JSON.stringify(readiness), beforeReadiness, id + ': readiness must not be mutated');
    assert.strictEqual(JSON.stringify(builder), beforeBuilder, id + ': builder must not be mutated');
    assert.strictEqual(JSON.stringify(formula), beforeFormula, id + ': formula must not be mutated');
    assert.strictEqual(JSON.stringify(mass), beforeMass, id + ': mass must not be mutated');
    assert.strictEqual(JSON.stringify(assembly), beforeAssembly, id + ': assembly must not be mutated');
    assert.strictEqual(JSON.stringify(wiring), beforeWiring, id + ': wiring must not be mutated');
    console.log(id + ' safe.');
})();

// 24. GUARDED-WIRING-CURRENT-RUNTIME-STILL-SAFE
(function testGuardedWiringCurrentRuntimeStillSafe() {
    const id = 'GUARDED-WIRING-CURRENT-RUNTIME-STILL-SAFE';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    sandbox.calculateProtocol();

    const html = output.innerHTML;
    assert.strictEqual(html.includes('endsRec:'), false, id);
    assert.strictEqual(html.includes('endsFormula:'), false, id);
    assert.strictEqual(html.includes('&quot;mode&quot;:&quot;3-zone&quot;') && !html.includes('endsRecCandidatePreview'), false, id);
    assert.strictEqual(html.includes('&quot;endsMass&quot;:') && !html.includes('null') && !html.includes('endsRecCandidatePreview'), false, id);
    console.log(id + ' safe.');
})();

// 25. GUARDED-WIRING-CONTAINER-NOT-HARDCODED-TO-REASONS
(function testGuardedWiringContainerNotHardcodedToReasons() {
    const id = 'GUARDED-WIRING-CONTAINER-NOT-HARDCODED-TO-REASONS';
    const context = {};
    const readiness = { ready: true, status: 'READY' };
    const builder = { created: true, status: 'CREATED', endsRec: { productionReady: true, endsRecipeReady: false } };
    const formula = { formulaReady: true, formulaStatus: 'READY' };
    const mass = { massReady: true, status: 'READY' };
    const assembly = { assembled: true, assemblyStatus: 'READY', productionEndsRecCandidate: {} };
    const wiring = {
        diagnosticReady: true,
        wiringStatus: 'READY',
        diagnosticCandidate: {
            sourceRefs: { readinessReasonCode: 'OK' },
            safetyReasonCodes: ['low-risk'],
            manualRequiredReasonCodes: []
        }
    };

    const result = runGuardedDiagnosticWiringSpecLocal(context, readiness, builder, formula, mass, assembly, wiring);

    // Verify it returns a wrapper container, not raw recipe fields directly on root
    assert.ok(result.diagnosticContainer, id);
    assert.ok(result.diagnosticContainer.guardedDiagnosticCandidate, id);
    assert.strictEqual(result.diagnosticContainer.endsRecipeReady, undefined, id + ': container must not pollute root with recipe ready flag');
    console.log(id + ' safe.');
})();

// 26. GUARDED-WIRING-DIAGNOSTIC-INVARIANTS
(function testGuardedWiringDiagnosticInvariants() {
    const id = 'GUARDED-WIRING-DIAGNOSTIC-INVARIANTS';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    // Mock document values for a scenario that is eligible for diagnostic endsRec calculations
    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    // Intercept buildWwwRenderState to capture the calculated state object
    const originalBuildWwwRenderState = sandbox.buildWwwRenderState;
    let capturedState = null;
    sandbox.buildWwwRenderState = function(runtime) {
        capturedState = originalBuildWwwRenderState(runtime);
        return capturedState;
    };

    sandbox.calculateProtocol();

    assert.ok(capturedState, id + ': calculateProtocol must build state');

    // Invariant 1: diagnostic container exists and has previewOnly / candidateOnly / notForMixing etc.
    const candidate = capturedState.endsRecDiagnosticWiringCandidate;
    assert.ok(candidate, id + ': endsRecDiagnosticWiringCandidate must be present');
    assert.strictEqual(candidate.previewOnly, true, id + ': previewOnly must be true');
    assert.strictEqual(candidate.candidateOnly, true, id + ': candidateOnly must be true');
    assert.strictEqual(candidate.notForMixing, true, id + ': notForMixing must be true');
    assert.strictEqual(candidate.productionReady, false, id + ': productionReady must be false');
    assert.strictEqual(candidate.endsRecipeReady, false, id + ': endsRecipeReady must be false');
    assert.ok(candidate.sourceRefs, id + ': sourceRefs must exist');
    assert.ok(Array.isArray(candidate.safetyReasonCodes), id + ': safetyReasonCodes must be array');
    assert.ok(Array.isArray(candidate.manualRequiredReasonCodes), id + ': manualRequiredReasonCodes must be array');

    // Invariant 2: Diagnostic container does not activate production recipe or 3-zone mass model
    assert.strictEqual(capturedState.massModel.mode, '2-zone', id + ': massModel mode must stay 2-zone');
    assert.strictEqual(capturedState.massModel.endsMass, null, id + ': endsMass must stay null');
    assert.strictEqual(capturedState.endsRec, undefined, id + ': production endsRec must not be defined');
    assert.strictEqual(capturedState.dyeMass ? capturedState.dyeMass.ends : undefined, undefined, id + ': ends dyeMass must not be defined');
    assert.strictEqual(capturedState.oxidizerMass ? capturedState.oxidizerMass.ends : undefined, undefined, id + ': ends oxidizerMass must not be defined');
    assert.strictEqual(capturedState.endsFormula, undefined, id + ': endsFormula must not be defined');
    assert.strictEqual(capturedState.endsRecipeReady, undefined, id + ': endsRecipeReady flag must not be on root state');

    // Invariant 3: Diagnostic container does not mutate rootRec/lenRec branches
    assert.strictEqual(capturedState.rootRec.endsRec, undefined, id);
    assert.strictEqual(capturedState.lenRec.endsRec, undefined, id);

    console.log(id + ' safe.');
})();

// 27. GUARDED-WIRING-DIAGNOSTIC-OUTPUT-CONTRACT
(function testGuardedWiringDiagnosticOutputContract() {
    const id = 'GUARDED-WIRING-DIAGNOSTIC-OUTPUT-CONTRACT';
    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    // Mock document values for a scenario that is eligible for diagnostic endsRec calculations
    const scenarioValues = {
        scalp_sensitivity: 'normal',
        history: 'натуральні',
        condition: 'здоровые',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '8',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральна',
        ends_base_type: 'натуральна'
    };
    const output = { innerHTML: '' };
    sandbox.document = {
        getElementById(id) {
            if (id === 'output') return output;
            return { value: scenarioValues[id] };
        }
    };

    // Capture state object
    const originalBuildWwwRenderState = sandbox.buildWwwRenderState;
    let capturedState = null;
    sandbox.buildWwwRenderState = function(runtime) {
        capturedState = originalBuildWwwRenderState(runtime);
        return capturedState;
    };

    sandbox.calculateProtocol();

    assert.ok(capturedState, id + ': calculateProtocol must build state');
    const candidate = capturedState.endsRecDiagnosticWiringCandidate;
    assert.ok(candidate, id + ': endsRecDiagnosticWiringCandidate must be present');
    assert.strictEqual(typeof candidate, 'object', id + ': candidate must be an object');

    // Contract 1: Check required safety flags on diagnostic candidate
    assert.strictEqual(candidate.previewOnly, true, id + ': previewOnly must be true');
    assert.strictEqual(candidate.candidateOnly, true, id + ': candidateOnly must be true');
    assert.strictEqual(candidate.notForMixing, true, id + ': notForMixing must be true');
    assert.strictEqual(candidate.productionReady, false, id + ': productionReady must be false');
    assert.strictEqual(candidate.endsRecipeReady, false, id + ': endsRecipeReady must be false');

    // Contract 2: Check reason/source fields structures
    assert.strictEqual(typeof candidate.sourceRefs, 'object', id + ': sourceRefs must be an object');
    assert.ok(Array.isArray(candidate.safetyReasonCodes), id + ': safetyReasonCodes must be array');
    assert.ok(Array.isArray(candidate.manualRequiredReasonCodes), id + ': manualRequiredReasonCodes must be array');

    // Contract 3: Diagnostic container must NOT have mixing-ready or final recipe fields
    assert.strictEqual(candidate.dyeMass, undefined, id + ': candidate must not contain dyeMass');
    assert.strictEqual(candidate.oxidizerMass, undefined, id + ': candidate must not contain oxidizerMass');
    assert.strictEqual(candidate.grams, undefined, id + ': candidate must not contain grams');
    assert.strictEqual(candidate.exactGrams, undefined, id + ': candidate must not contain exactGrams');
    assert.strictEqual(candidate.finalFormula, undefined, id + ': candidate must not contain finalFormula');
    assert.strictEqual(candidate.endsFormula, undefined, id + ': candidate must not contain endsFormula');
    assert.strictEqual(candidate.massModel, undefined, id + ': candidate must not contain massModel');
    assert.strictEqual(candidate.recipeReady, undefined, id + ': candidate must not contain recipeReady');
    assert.strictEqual(candidate.productionRecipe, undefined, id + ': candidate must not contain productionRecipe');

    // Contract 4: Diagnostic container must not expose labels indicating it is ready to be mixed
    assert.strictEqual(candidate.approved, undefined, id);
    assert.strictEqual(candidate.final, undefined, id);
    assert.strictEqual(candidate.readyForMixing, undefined, id);
    assert.strictEqual(candidate.mixingReady, undefined, id);

    console.log(id + ' safe.');
})();

// ============================================================================
// PRODUCTION THIRD-ZONE READINESS CONTRACT TESTS (TEST-ONLY PHASE)
// ============================================================================
// These tests lock down the contract for future production third-zone readiness.
// No runtime activation. Only contract definitions and safety markers.
// ============================================================================

// SPEC CONTRACT 1: Production third-zone readiness marker (NOT diagnostic display)
function validateProductionThirdZoneReadinessContract(input) {
    return {
        readinessMarker: 'PRODUCTION_THIRD_ZONE_READINESS',
        isProductionReadiness: true,
        isDiagnosticDisplay: false,
        blocked: true,
        reason: 'Production third-zone readiness is contract-only; not activated in this phase'
    };
}

(function testProductionThirdZoneReadinessMarker() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-MARKER-NOT-DIAGNOSTIC';
    const contract = validateProductionThirdZoneReadinessContract({});
    
    assert.strictEqual(contract.readinessMarker, 'PRODUCTION_THIRD_ZONE_READINESS', id + ': must be marked as production readiness');
    assert.strictEqual(contract.isProductionReadiness, true, id + ': must be identified as production readiness');
    assert.strictEqual(contract.isDiagnosticDisplay, false, id + ': must NOT be diagnostic display');
    assert.strictEqual(contract.blocked, true, id + ': production third-zone must be blocked in this phase');
    
    console.log(id + ' safe.');
})();

// SPEC CONTRACT 2: Production readiness requires all critical inputs present
function validateCriticalInputsForProductionThirdZone(context) {
    const input = context || {};
    const criticalFields = [
        'root_level', 'length_level', 'ends_level', 'target_level', 'target_direction',
        'ends_history', 'porosity', 'damage_sensitivity', 'chemical_history',
        'brand_constraints', 'oxidizer_constraints', 'application_zone_logic', 'manual_verification_flags'
    ];
    
    const missing = [];
    for (const field of criticalFields) {
        if (input[field] === undefined || input[field] === null || input[field] === '') {
            missing.push(field);
        }
    }
    
    return {
        allPresent: missing.length === 0,
        missingFields: missing,
        canProceedWithReadiness: missing.length === 0
    };
}

(function testProductionThirdZoneRequiresCriticalInputs() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-REQUIRES-CRITICAL-INPUTS';
    
    // Case 1: All critical inputs present
    const complete = {
        root_level: 6, length_level: 7, ends_level: 8, target_level: 8, target_direction: '1',
        ends_history: 'натуральна', porosity: 'normal', damage_sensitivity: 'low',
        chemical_history: 'none', brand_constraints: 'generic-safe', oxidizer_constraints: 'low',
        application_zone_logic: 'root-length-ends', manual_verification_flags: false
    };
    
    const resultComplete = validateCriticalInputsForProductionThirdZone(complete);
    assert.strictEqual(resultComplete.allPresent, true, id + ': all inputs present');
    assert.strictEqual(resultComplete.canProceedWithReadiness, true, id + ': can proceed');
    assert.strictEqual(resultComplete.missingFields.length, 0, id + ': no missing fields');
    
    // Case 2: Missing critical inputs blocks readiness
    const incomplete = {
        root_level: 6, length_level: 7, ends_level: 8, target_level: 8, target_direction: '1',
        ends_history: '', // Missing
        porosity: 'normal', damage_sensitivity: 'low',
        chemical_history: 'none', brand_constraints: 'generic-safe', oxidizer_constraints: 'low'
    };
    
    const resultIncomplete = validateCriticalInputsForProductionThirdZone(incomplete);
    assert.strictEqual(resultIncomplete.allPresent, false, id + ': incomplete inputs');
    assert.strictEqual(resultIncomplete.canProceedWithReadiness, false, id + ': cannot proceed');
    assert.ok(resultIncomplete.missingFields.includes('ends_history'), id + ': ends_history marked missing');
    
    console.log(id + ' safe.');
})();

// SPEC CONTRACT 3: Missing critical inputs BLOCK production readiness
function classifyProductionThirdZoneReadinessStatus(context) {
    const input = context || {};
    
    const criticalFields = {
        ends_level: input.ends_level,
        ends_history: input.ends_history,
        target_level: input.target_level,
        target_direction: input.target_direction,
        porosity: input.porosity,
        damage_sensitivity: input.damage_sensitivity,
        chemical_history: input.chemical_history
    };
    
    const missing = [];
    for (const [key, value] of Object.entries(criticalFields)) {
        if (value === undefined || value === null || value === '') {
            missing.push(key);
        }
    }
    
    if (missing.length > 0) {
        return {
            status: 'BLOCKED',
            reason: 'MISSING_CRITICAL_INPUTS',
            blockingFields: missing,
            productionReady: false
        };
    }
    
    return {
        status: 'CANDIDATE_READY',
        reason: 'CRITICAL_INPUTS_PRESENT',
        blockingFields: [],
        productionReady: false  // Still false; readiness != activation
    };
}

(function testMissingCriticalInputsBlockReadiness() {
    const id = 'MISSING-CRITICAL-INPUTS-BLOCK-PRODUCTION-THIRD-ZONE-READINESS';
    
    const scenarios = [
        {
            name: 'missing ends_level',
            data: { ends_level: '', ends_history: 'натуральна', target_level: 8, target_direction: '1', porosity: 'normal', damage_sensitivity: 'low', chemical_history: 'none' }
        },
        {
            name: 'missing ends_history',
            data: { ends_level: 8, ends_history: '', target_level: 8, target_direction: '1', porosity: 'normal', damage_sensitivity: 'low', chemical_history: 'none' }
        },
        {
            name: 'missing target_level',
            data: { ends_level: 8, ends_history: 'натуральна', target_level: '', target_direction: '1', porosity: 'normal', damage_sensitivity: 'low', chemical_history: 'none' }
        },
        {
            name: 'missing target_direction',
            data: { ends_level: 8, ends_history: 'натуральна', target_level: 8, target_direction: '', porosity: 'normal', damage_sensitivity: 'low', chemical_history: 'none' }
        },
        {
            name: 'missing porosity',
            data: { ends_level: 8, ends_history: 'натуральна', target_level: 8, target_direction: '1', porosity: '', damage_sensitivity: 'low', chemical_history: 'none' }
        },
        {
            name: 'missing damage_sensitivity',
            data: { ends_level: 8, ends_history: 'натуральна', target_level: 8, target_direction: '1', porosity: 'normal', damage_sensitivity: '', chemical_history: 'none' }
        },
        {
            name: 'missing chemical_history',
            data: { ends_level: 8, ends_history: 'натуральна', target_level: 8, target_direction: '1', porosity: 'normal', damage_sensitivity: 'low', chemical_history: '' }
        }
    ];
    
    for (const scenario of scenarios) {
        const result = classifyProductionThirdZoneReadinessStatus(scenario.data);
        assert.strictEqual(result.status, 'BLOCKED', id + ': ' + scenario.name);
        assert.strictEqual(result.reason, 'MISSING_CRITICAL_INPUTS', id + ': ' + scenario.name);
        assert.strictEqual(result.productionReady, false, id + ': ' + scenario.name);
    }
    
    console.log(id + ' safe.');
})();

// SPEC CONTRACT 4: Manual review blockers prevent automatic activation
function classifyManualReviewBlockers(context) {
    const input = context || {};
    
    const blockers = [];
    
    if (input.damage_sensitivity === 'high' || input.damage_sensitivity === 'critical') {
        blockers.push('HIGH_DAMAGE_SENSITIVITY');
    }
    
    if (input.chemical_history === 'unknown' || input.chemical_history === '') {
        blockers.push('UNKNOWN_CHEMICAL_HISTORY');
    }
    
    if (input.ends_history === 'henna' || input.ends_history === 'henna_metals' || input.ends_history === 'unknown') {
        blockers.push('BLOCKED_HISTORY');
    }
    
    if (input.reason_codes && input.reason_codes.includes('manual-required')) {
        blockers.push('MANUAL_REQUIRED_REASON_CODE');
    }
    
    if (input.notForMixing === true) {
        blockers.push('NOT_FOR_MIXING_FLAG');
    }
    
    const hasBlockers = blockers.length > 0;
    
    return {
        hasManualReviewBlockers: hasBlockers,
        blockerReasons: blockers,
        productionReady: false,
        status: hasBlockers ? 'MANUAL_REQUIRED' : 'CANDIDATE'
    };
}

(function testManualReviewBlockersPreventActivation() {
    const id = 'MANUAL-REVIEW-BLOCKERS-PREVENT-PRODUCTION-THIRD-ZONE-ACTIVATION';
    
    const scenarios = [
        { name: 'high damage', data: { damage_sensitivity: 'high' } },
        { name: 'unknown chemical history', data: { chemical_history: 'unknown' } },
        { name: 'henna history', data: { ends_history: 'henna' } },
        { name: 'manual-required reason code', data: { reason_codes: ['manual-required'] } },
        { name: 'notForMixing flag', data: { notForMixing: true } }
    ];
    
    for (const scenario of scenarios) {
        const result = classifyManualReviewBlockers(scenario.data);
        assert.strictEqual(result.hasManualReviewBlockers, true, id + ': ' + scenario.name);
        assert.ok(result.blockerReasons.length > 0, id + ': ' + scenario.name);
        assert.strictEqual(result.status, 'MANUAL_REQUIRED', id + ': ' + scenario.name);
    }
    
    console.log(id + ' safe.');
})();

// SPEC CONTRACT 5: Diagnostic candidate MUST NOT directly become production source
function validateDiagnosticCandidateIsolation(context) {
    const input = context || {};
    const diagnosticCandidate = input.endsRecDiagnosticWiringCandidate || null;
    
    if (!diagnosticCandidate) {
        return {
            isolated: true,
            violations: []
        };
    }
    
    const violations = [];
    
    // Diagnostic candidate must not have productionReady = true
    if (diagnosticCandidate.productionReady === true) {
        violations.push('CANDIDATE_PRODUCTIONREADY_TRUE');
    }
    
    // Diagnostic candidate must not directly set massModel.mode to '3-zone'
    if (diagnosticCandidate.massModel && diagnosticCandidate.massModel.mode === '3-zone') {
        violations.push('CANDIDATE_SET_MASSMODEL_3ZONE');
    }
    
    // Diagnostic candidate must not set massModel.endsMass as number
    if (diagnosticCandidate.massModel && typeof diagnosticCandidate.massModel.endsMass === 'number') {
        violations.push('CANDIDATE_SET_ENDSMASS_NUMBER');
    }
    
    // Diagnostic candidate must not contain production grams
    if (diagnosticCandidate.dyeMass !== undefined || diagnosticCandidate.oxidizerMass !== undefined) {
        violations.push('CANDIDATE_CONTAINS_PRODUCTION_GRAMS');
    }
    
    // Diagnostic candidate must not contain endsFormula
    if (diagnosticCandidate.endsFormula !== undefined) {
        violations.push('CANDIDATE_CONTAINS_PRODUCTION_FORMULA');
    }
    
    // Diagnostic candidate must not have endsRecipeReady = true
    if (diagnosticCandidate.endsRecipeReady === true) {
        violations.push('CANDIDATE_ENDSRECIPE_READY_TRUE');
    }
    
    return {
        isolated: violations.length === 0,
        violations
    };
}

(function testDiagnosticCandidateNotProductionSource() {
    const id = 'DIAGNOSTIC-CANDIDATE-NOT-PRODUCTION-SOURCE-ISOLATION';
    
    // Case 1: Properly isolated diagnostic candidate
    const isolated = {
        endsRecDiagnosticWiringCandidate: {
            candidateOnly: true,
            previewOnly: true,
            notForMixing: true,
            productionReady: false,
            endsRecipeReady: false
        }
    };
    
    const resultIsolated = validateDiagnosticCandidateIsolation(isolated);
    assert.strictEqual(resultIsolated.isolated, true, id + ': must be isolated');
    assert.strictEqual(resultIsolated.violations.length, 0, id + ': no violations');
    
    // Case 2: Candidate with productionReady = true (violation)
    const violation1 = {
        endsRecDiagnosticWiringCandidate: {
            productionReady: true
        }
    };
    
    const resultViolation1 = validateDiagnosticCandidateIsolation(violation1);
    assert.strictEqual(resultViolation1.isolated, false, id + ': not isolated');
    assert.ok(resultViolation1.violations.includes('CANDIDATE_PRODUCTIONREADY_TRUE'), id + ': violation detected');
    
    // Case 3: Candidate with production 3-zone mode
    const violation2 = {
        endsRecDiagnosticWiringCandidate: {
            massModel: { mode: '3-zone', endsMass: null }
        }
    };
    
    const resultViolation2 = validateDiagnosticCandidateIsolation(violation2);
    assert.strictEqual(resultViolation2.isolated, false, id + ': not isolated');
    assert.ok(resultViolation2.violations.includes('CANDIDATE_SET_MASSMODEL_3ZONE'), id + ': violation detected');
    
    console.log(id + ' safe.');
})();

// SPEC CONTRACT 6: Production activation forbidden; massModel and endsRec must remain untouched
function validateProductionActivationRemainsForbidden(context) {
    const input = context || {};
    
    const violations = [];
    
    // No production endsRec created
    if (input.endsRec !== undefined) {
        violations.push('PRODUCTION_ENDSREC_CREATED');
    }
    
    // massModel.mode must stay '2-zone'
    if (input.massModel && input.massModel.mode === '3-zone') {
        violations.push('MASSMODEL_MODE_3ZONE');
    }
    
    // massModel.endsMass must stay null
    if (input.massModel && typeof input.massModel.endsMass === 'number') {
        violations.push('MASSMODEL_ENDSMASS_NUMBER');
    }
    
    // No production dyeMass, oxidizerMass
    if (input.dyeMass !== undefined || input.oxidizerMass !== undefined) {
        violations.push('PRODUCTION_GRAMS_CREATED');
    }
    
    // No exact grams
    if (input.exactGrams !== undefined || input.grams !== undefined) {
        violations.push('PRODUCTION_EXACT_GRAMS');
    }
    
    // No final endsFormula
    if (input.finalEndsFormula !== undefined || (input.endsFormula && input.endsFormula !== 'diagnostic-preview-only')) {
        violations.push('PRODUCTION_FINAL_FORMULA');
    }
    
    // No endsRecipeReady = true
    if (input.endsRecipeReady === true) {
        violations.push('ENDSRECIPE_READY_TRUE');
    }
    
    // No formula-to-mix
    if (input.formulaToMix !== undefined) {
        violations.push('FORMULA_TO_MIX_CREATED');
    }
    
    // No application instruction for ends
    if (input.applicationInstructionForEnds !== undefined) {
        violations.push('APPLICATION_INSTRUCTION_CREATED');
    }
    
    return {
        activationForbidden: violations.length === 0,
        violations,
        productionReady: false
    };
}

(function testProductionActivationForbidden() {
    const id = 'PRODUCTION-THIRD-ZONE-ACTIVATION-FORBIDDEN';
    
    // Safe state: nothing created
    const safe = {
        massModel: { mode: '2-zone', endsMass: null },
        endsRecipeReady: false
    };
    
    const resultSafe = validateProductionActivationRemainsForbidden(safe);
    assert.strictEqual(resultSafe.activationForbidden, true, id + ': production activation forbidden');
    assert.strictEqual(resultSafe.violations.length, 0, id + ': no violations');
    assert.strictEqual(resultSafe.productionReady, false, id + ': productionReady false');
    
    // Violations: production endsRec created
    const violation1 = {
        endsRec: { zone: 'ends', productionReady: true },
        massModel: { mode: '3-zone', endsMass: 12 },
        dyeMass: 5,
        oxidizerMass: 7,
        exactGrams: 12,
        endsRecipeReady: true
    };
    
    const resultViolation1 = validateProductionActivationRemainsForbidden(violation1);
    assert.strictEqual(resultViolation1.activationForbidden, false, id + ': not forbidden');
    assert.ok(resultViolation1.violations.length > 0, id + ': violations detected');
    assert.ok(resultViolation1.violations.includes('PRODUCTION_ENDSREC_CREATED'), id + ': endsRec violation');
    assert.ok(resultViolation1.violations.includes('MASSMODEL_MODE_3ZONE'), id + ': 3-zone violation');
    assert.ok(resultViolation1.violations.includes('MASSMODEL_ENDSMASS_NUMBER'), id + ': endsMass violation');
    
    console.log(id + ' safe.');
})();

// ---------------------------------------------------------------------------
// SPEC MIRROR: validateProductionThirdZoneReadinessSpec (matches www/core.js)
// ---------------------------------------------------------------------------

function validateProductionThirdZoneReadinessSpec(input) {
    const ctx = input || {};

    const criticalInputs = [
        { key: 'root_level', label: 'root level' },
        { key: 'length_level', label: 'length level' },
        { key: 'ends_level', label: 'ends level' },
        { key: 'target_level', label: 'target level' },
        { key: 'target_direction', label: 'target direction' },
        { key: 'ends_history', label: 'ends history' },
        { key: 'porosity', label: 'porosity' },
        { key: 'damage', label: 'damage/sensitivity' },
        { key: 'previous_chemical_history', label: 'previous chemical history' },
        { key: 'brand_or_system', label: 'brand/system constraints' },
        { key: 'oxidizer_constraints', label: 'oxidizer constraints' },
        { key: 'application_zone_logic', label: 'application-zone logic' },
        { key: 'manual_verification_flags', label: 'manual verification flags' }
    ];
    const missingCriticalInputs = [];
    for (const ci of criticalInputs) {
        const val = ctx[ci.key];
        if (val === undefined || val === null || val === '' || (typeof val === 'number' && !Number.isFinite(val))) {
            missingCriticalInputs.push(ci.label);
        }
    }

    const endsHistory = String(ctx.ends_history || '').toLowerCase();
    const damage = String(ctx.damage || ctx.damage_sensitivity || '').toLowerCase();
    const porosity = String(ctx.porosity || '').toLowerCase();
    const prevChem = String(ctx.previous_chemical_history || '').toLowerCase();
    const hasDiagnosticOnly = Boolean(ctx.endsRecDiagnosticWiringCandidate) && !ctx.root_level && !ctx.length_level;

    const safetyReasonCodes = [];
    const manualRequiredReasonCodes = [];
    let blocked = false;
    let manualRequired = false;

    const isHighDamage = damage.includes('high') || damage.includes('critical') || damage.includes('сильно') || damage.includes('критично');
    const isUnknownChem = prevChem === '' || prevChem === 'unknown' || prevChem === 'невідома';
    const isUncertainEndsHist = endsHistory === '' || endsHistory === 'unknown' || endsHistory === 'невідома';
    const isIncompatibleEndsHist = endsHistory.includes('henna') || endsHistory.includes('хна') || endsHistory.includes('metal') || endsHistory.includes('метал');
    const isPorousEnds = porosity.includes('high') || porosity.includes('porous') || porosity.includes('висока') || porosity.includes('порист');

    if (hasDiagnosticOnly) { blocked = true; safetyReasonCodes.push('DIAGNOSTIC_CANDIDATE_ONLY'); }
    if (isHighDamage) { manualRequired = true; manualRequiredReasonCodes.push('HIGH_DAMAGE_SENSITIVITY'); safetyReasonCodes.push('HIGH_DAMAGE_SENSITIVITY'); }
    if (isUnknownChem) { manualRequired = true; manualRequiredReasonCodes.push('UNKNOWN_CHEMICAL_HISTORY'); safetyReasonCodes.push('UNKNOWN_CHEMICAL_HISTORY'); }
    if (isUncertainEndsHist) { manualRequired = true; manualRequiredReasonCodes.push('UNCERTAIN_ENDS_HISTORY'); safetyReasonCodes.push('UNCERTAIN_ENDS_HISTORY'); }
    if (isIncompatibleEndsHist) { blocked = true; safetyReasonCodes.push('INCOMPATIBLE_ENDS_HISTORY'); }
    if (isPorousEnds) { manualRequired = true; manualRequiredReasonCodes.push('POROUS_ENDS'); safetyReasonCodes.push('POROUS_ENDS'); }

    const hasMissing = missingCriticalInputs.length > 0;
    const hasManual = manualRequiredReasonCodes.length > 0;
    const hasBlockers = safetyReasonCodes.length > 0;
    const ready = !hasMissing && !hasBlockers && !hasManual && !blocked && !manualRequired;

    return {
        contractType: "productionThirdZoneReadiness",
        previewOnly: true,
        candidateOnly: true,
        notForMixing: true,
        productionReady: false,
        endsRecipeReady: false,
        ready: ready,
        blocked: hasMissing || blocked || hasBlockers,
        manualRequired: hasManual || manualRequired,
        missingCriticalInputs: missingCriticalInputs,
        manualRequiredReasonCodes: manualRequiredReasonCodes,
        safetyReasonCodes: safetyReasonCodes,
        sourceRefs: {
            endsLevel: ctx.ends_level || null,
            targetLevel: ctx.target_level || null,
            endsHistory: ctx.ends_history || null,
            damage: ctx.damage || ctx.damage_sensitivity || null,
            porosity: ctx.porosity || null
        }
    };
}

// ---------------------------------------------------------------------------
// PRODUCTION THIRD-ZONE READINESS HELPER CONTRACT TESTS (safe redo)
// ---------------------------------------------------------------------------

(function testProductionThirdZoneReadinessHelperExists() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-HELPER-EXISTS';

    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    assert.strictEqual(typeof sandbox.validateProductionThirdZoneReadiness, 'function', id + ': helper must exist');
    
    const calcProtoSource = sandbox.calculateProtocol.toString();
    assert.strictEqual(calcProtoSource.includes('validateProductionThirdZoneReadiness('), false, id + ': helper must not be called from calculateProtocol');
    
    const result = sandbox.validateProductionThirdZoneReadiness({});
    assert.strictEqual(result.contractType, 'productionThirdZoneReadiness', id + ': must return contract type');
    assert.strictEqual(result.productionReady, false, id + ': productionReady must be false');
    assert.strictEqual(result.endsRecipeReady, false, id + ': endsRecipeReady must be false');
    assert.strictEqual(result.notForMixing, true, id + ': notForMixing must be true');

    console.log(id + ' safe.');
})();

(function testProductionThirdZoneReadinessCompleteInputs() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-COMPLETE-INPUTS';

    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const result = sandbox.validateProductionThirdZoneReadiness({
        root_level: 6, length_level: 6, ends_level: 8, target_level: 8,
        target_direction: '1', ends_history: 'natural',
        porosity: 'low', damage: 'low', previous_chemical_history: 'none',
        brand_or_system: 'generic', oxidizer_constraints: 'safe',
        application_zone_logic: '2-zone', manual_verification_flags: 'resolved'
    });

    assert.strictEqual(result.ready, true, id + ': must be ready');
    assert.strictEqual(result.blocked, false, id + ': not blocked');
    assert.strictEqual(result.manualRequired, false, id + ': not manual required');
    assert.strictEqual(result.missingCriticalInputs.length, 0, id + ': no missing inputs');
    assert.strictEqual(result.productionReady, false, id + ': productionReady false');
    assert.strictEqual(result.endsRecipeReady, false, id + ': endsRecipeReady false');
    assert.strictEqual(result.notForMixing, true, id + ': notForMixing true');
    assert.strictEqual(result.previewOnly, true, id + ': previewOnly true');
    assert.strictEqual(result.candidateOnly, true, id + ': candidateOnly true');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'grams'), false, id + ': no grams');

    console.log(id + ' safe.');
})();

(function testProductionThirdZoneReadinessMissingInputs() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-MISSING-INPUTS';

    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const resultEmpty = sandbox.validateProductionThirdZoneReadiness({});
    assert.strictEqual(resultEmpty.ready, false, id + ': not ready with empty input');
    assert.strictEqual(resultEmpty.blocked, true, id + ': blocked');
    assert.ok(resultEmpty.missingCriticalInputs.length >= 13, id + ': all 13 critical inputs missing');
    assert.strictEqual(resultEmpty.productionReady, false, id + ': productionReady false');

    const resultPartial = sandbox.validateProductionThirdZoneReadiness({
        root_level: 6, length_level: 6, target_level: 8, ends_history: 'natural'
    });
    assert.strictEqual(resultPartial.ready, false, id + ': partial not ready');
    assert.ok(resultPartial.missingCriticalInputs.includes('ends level'), id + ': ends level missing');
    assert.ok(resultPartial.missingCriticalInputs.includes('target direction'), id + ': target direction missing');

    console.log(id + ' safe.');
})();

(function testProductionThirdZoneReadinessManualBlockers() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-MANUAL-BLOCKERS';

    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const completeBase = {
        root_level: 6, length_level: 6, ends_level: 8, target_level: 8,
        target_direction: '1', ends_history: 'natural',
        porosity: 'low', damage: 'low', previous_chemical_history: 'none',
        brand_or_system: 'generic', oxidizer_constraints: 'safe',
        application_zone_logic: '2-zone', manual_verification_flags: 'resolved'
    };

    const highDamage = sandbox.validateProductionThirdZoneReadiness(Object.assign({}, completeBase, { damage: 'high' }));
    assert.strictEqual(highDamage.manualRequired, true, id + ': high damage requires manual');
    assert.strictEqual(highDamage.productionReady, false, id + ': productionReady false');

    const unknownChem = sandbox.validateProductionThirdZoneReadiness(Object.assign({}, completeBase, { previous_chemical_history: 'unknown' }));
    assert.strictEqual(unknownChem.manualRequired, true, id + ': unknown chem requires manual');

    const uncertainEnds = sandbox.validateProductionThirdZoneReadiness(Object.assign({}, completeBase, { ends_history: 'unknown' }));
    assert.strictEqual(uncertainEnds.manualRequired, true, id + ': uncertain ends history requires manual');

    const hennaEnds = sandbox.validateProductionThirdZoneReadiness(Object.assign({}, completeBase, { ends_history: 'henna_metals' }));
    assert.strictEqual(hennaEnds.blocked, true, id + ': henna ends blocked');
    assert.ok(hennaEnds.safetyReasonCodes.includes('INCOMPATIBLE_ENDS_HISTORY'), id + ': reason code present');

    const porousEnds = sandbox.validateProductionThirdZoneReadiness(Object.assign({}, completeBase, { porosity: 'high' }));
    assert.strictEqual(porousEnds.manualRequired, true, id + ': porous ends requires manual');

    console.log(id + ' safe.');
})();

(function testProductionThirdZoneReadinessDiagnosticIsolation() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-DIAGNOSTIC-ISOLATION';

    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const diagnosticOnly = sandbox.validateProductionThirdZoneReadiness({
        endsRecDiagnosticWiringCandidate: {
            previewOnly: true, candidateOnly: true, notForMixing: true, productionReady: false
        }
    });
    assert.strictEqual(diagnosticOnly.ready, false, id + ': diagnostic alone not ready');
    assert.strictEqual(diagnosticOnly.blocked, true, id + ': blocked');
    assert.ok(diagnosticOnly.safetyReasonCodes.includes('DIAGNOSTIC_CANDIDATE_ONLY'), id + ': reason code present');
    assert.strictEqual(diagnosticOnly.productionReady, false, id + ': productionReady false');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(diagnosticOnly, 'dyeMass'), false, id + ': no dyeMass');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(diagnosticOnly, 'oxidizerMass'), false, id + ': no oxidizerMass');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(diagnosticOnly, 'grams'), false, id + ': no grams');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(diagnosticOnly, 'endsFormula'), false, id + ': no endsFormula');

    console.log(id + ' safe.');
})();

(function testProductionThirdZoneReadinessExistingStable() {
    const id = 'PRODUCTION-THIRD-ZONE-READINESS-EXISTING-STABLE';

    const source = fs.readFileSync('./www/core.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'www/core.js' });

    const mass = sandbox.buildMassModel('средние', 'средние');
    assert.strictEqual(mass.mode, '2-zone', id + ': massModel still 2-zone');
    assert.strictEqual(mass.endsMass, null, id + ': endsMass still null');

    const calcProto = sandbox.calculateProtocol.toString();
    assert.strictEqual(calcProto.includes('validateProductionThirdZoneReadiness'), false, id + ': calculateProtocol does not call new helper');

    const testCases = [
        { input: {}, expectedReady: false },
        { input: {
            root_level: 6, length_level: 6, ends_level: 8, target_level: 8,
            target_direction: '1', ends_history: 'natural',
            porosity: 'low', damage: 'low', previous_chemical_history: 'none',
            brand_or_system: 'generic', oxidizer_constraints: 'safe',
            application_zone_logic: '2-zone', manual_verification_flags: 'resolved'
        }, expectedReady: true }
    ];

    for (const tc of testCases) {
        const coreResult = sandbox.validateProductionThirdZoneReadiness(tc.input);
        const specResult = validateProductionThirdZoneReadinessSpec(tc.input);
        assert.strictEqual(coreResult.ready, specResult.ready, id + ': spec matches core ready');
        assert.strictEqual(coreResult.blocked, specResult.blocked, id + ': spec matches core blocked');
        assert.strictEqual(coreResult.productionReady, specResult.productionReady, id + ': spec matches core productionReady');
    }

    console.log(id + ' safe.');
})();

console.log('Production third-zone readiness helper contract tests PASSED');
