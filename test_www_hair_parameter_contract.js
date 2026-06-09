'use strict';

/**
 * test_www_hair_parameter_contract.js
 *
 * HAIR PARAMETER CONTRACT TEST v1 — density / thickness / length
 * для ПЕРУКАР (PERUKAR).
 *
 * PURPOSE
 * -------
 * Integration-level contract tests that pin the CURRENT, COMMITTED behavior of
 * the three hair-quantity parameters as they flow through the real production
 * surfaces in www/core.js:
 *
 *   1. PerucarWwwMappingV1.gatherWwwFormData()        (DOM -> wwwValues)
 *   2. PerucarWwwMappingV1.normalizeWwwToRootRawInput (wwwValues -> rawInput)
 *   3. calculateProtocol()                            (DOM -> rendered HTML)
 *
 * Tested against the same vm + fake-document harness used by the other
 * committed test_www_*.js suites, loading the real ./www/core.js. No production
 * logic is added or changed by this file. structure/curl are NOT implemented.
 *
 * LOCKED CURRENT-CONTRACT FACTS (verified against www/core.js @ HEAD):
 *
 *   density:    REQUIRED. Enum {редкие, средние, густые}. MASS-BEARING.
 *               densityMultiplier 0.7 / 1.0 / 1.5 in buildMassModel().
 *               Does NOT affect timing.
 *   length:     REQUIRED. Enum {короткие, средние, длинные}. MASS-BEARING.
 *               baseMass 30 / 60 / 120 in buildMassModel().
 *               Does NOT affect timing.
 *   thickness:  REQUIRED. Enum {тонкие, средние, толстые}. NOT mass-bearing.
 *               Affects the timing diagnostic only (тонкие -> скорочено,
 *               толстые -> збільшено).
 *
 *   Empty value (present-but-blank) for any of the three  -> status BLOCKED
 *     (missing critical field), naming the field in Ukrainian.
 *   Present-but-out-of-enum value for any of the three     -> status BLOCKED
 *     (unrecognized critical input), naming the field and the bad value.
 *
 * ABSENT-FROM-CONTRACT (locked as absent, NOT implemented):
 *
 *   structure / curl  — these parameters DO NOT exist in the current contract.
 *     Not gathered, not normalized, not read by calculateProtocol, not gated,
 *     not rendered. This file LOCKS that absence so any future introduction of
 *     structure/curl is a deliberate, test-visible contract change rather than
 *     a silent drift. See docs/known-limitations-contract.md §17.
 *
 * CONTRACT GROUPS (10) reported individually at the end of this run:
 *    1. density mass
 *    2. length mass
 *    3. density×length matrix
 *    4. thickness timing
 *    5. thickness not mass
 *    6. density/length not timing
 *    7. unknown gates (empty + out-of-enum)
 *    8. structure/curl absence
 *    9. UI/core alignment
 *   10. clean control
 *
 * Any failing assertion means the density/thickness/length contract — or the
 * structure/curl absence guarantee — has changed and must be reviewed against
 * AGENTS.md and the committed mass-model / mapping tests before proceeding.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const CORE_PATH = './www/core.js';
const code = fs.readFileSync(CORE_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Shared fake-document harness (mirrors test_www_mapping.js / mass_model).
// ---------------------------------------------------------------------------

// A fully-valid APPROVED baseline scenario. Verified to reach status APPROVED
// with a rendered executable recipe (root + length), so recipe masses are
// observable in the output HTML. Base 6 -> target 6.3 avoids Special Blond /
// powder / brand-rule MANUAL gates and keeps grey at 0, so recipe mass equals
// raw rootMass / lengthMass (no powder surcharge).
function approvedBaseline() {
    return {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'здоровий корінь',
        length_condition: 'здорове полотно',
        porosity: 'нормальна пористість',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '6',
        root_length: '1',
        length_level: '6',
        ends_level: '6',
        ends_condition: 'здорові',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '3',
        elasticity: 'нормальна еластичність',
        allergy: 'no',
        scalp_sensitivity: 'normal'
    };
}

// Run calculateProtocol() against a fake document built from `values`.
// Returns { html, requestedIds }.
function runProtocol(values) {
    const requestedIds = [];
    let outHtml = '';
    const sandbox = {
        console,
        document: {
            getElementById(id) {
                requestedIds.push(id);
                if (id === 'output') {
                    return {
                        set innerHTML(v) { outHtml = v; },
                        get innerHTML() { return outHtml; }
                    };
                }
                return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(code + '\ncalculateProtocol();', sandbox);
    return { html: outHtml, requestedIds };
}

// Run the mapping layer (gather + normalize) against a fake document.
// Returns { wwwValues, rawInput, requestedIds }.
function runMapping(values) {
    const requestedIds = [];
    const sandbox = {
        console,
        document: {
            getElementById(id) {
                requestedIds.push(id);
                return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(code + `
        const wwwValues = PerucarWwwMappingV1.gatherWwwFormData();
        const rawInput = PerucarWwwMappingV1.normalizeWwwToRootRawInput(wwwValues);
        globalThis.__mapResult = { wwwValues, rawInput };
    `, sandbox);
    const r = JSON.parse(JSON.stringify(sandbox.__mapResult));
    return { wwwValues: r.wwwValues, rawInput: r.rawInput, requestedIds };
}

// Extract the rendered recipe masses (the ['Маса', value] rows) in order.
function recipeMasses(html) {
    const matches = html.match(/Маса:<\/b>\s*([^<]*)/g) || [];
    return matches.map((s) => s.replace(/Маса:<\/b>\s*/, '').trim());
}

// True iff a thickness-driven timing-adjustment diagnostic is present.
function hasTimingAdjustment(html) {
    return /Час витримки скорочено|Час витримки збільшено/.test(html);
}

// Recipe masses for the baseline with the given field overridden.
function massesWith(field, value) {
    const v = approvedBaseline();
    v[field] = value;
    return recipeMasses(runProtocol(v).html);
}

// ---------------------------------------------------------------------------
// Group runner: each of the 10 contract groups is a function that throws on
// failure. We record PASS/FAIL per group and fail the process if any fail.
// ---------------------------------------------------------------------------

const GROUPS = [
    ['1. density mass', function densityMass() {
        // density drives total mass via multiplier 0.7 / 1.0 / 1.5 (base len 60).
        assert.deepStrictEqual(massesWith('density', 'редкие'), ['13', '29'],
            'density=редкие -> root 13 / length 29 (total 42)');
        assert.deepStrictEqual(massesWith('density', 'средние'), ['18', '42'],
            'density=средние -> root 18 / length 42 (total 60)');
        assert.deepStrictEqual(massesWith('density', 'густые'), ['27', '63'],
            'density=густые -> root 27 / length 63 (total 90)');
    }],

    ['2. length mass', function lengthMass() {
        // length drives base mass 30 / 60 / 120 (density средние = ×1.0).
        assert.deepStrictEqual(massesWith('length', 'короткие'), ['9', '21'],
            'length=короткие -> root 9 / length 21 (total 30)');
        assert.deepStrictEqual(massesWith('length', 'средние'), ['18', '42'],
            'length=средние -> root 18 / length 42 (total 60)');
        assert.deepStrictEqual(massesWith('length', 'длинные'), ['36', '84'],
            'length=длинные -> root 36 / length 84 (total 120)');
    }],

    ['3. density×length matrix', function densityLengthMatrix() {
        // Full 3×3 product. Values verified against rendered output @ HEAD.
        const expected = {
            'короткие|редкие': ['6', '15'],
            'короткие|средние': ['9', '21'],
            'короткие|густые': ['14', '31'],
            'средние|редкие': ['13', '29'],
            'средние|средние': ['18', '42'],
            'средние|густые': ['27', '63'],
            'длинные|редкие': ['25', '59'],
            'длинные|средние': ['36', '84'],
            'длинные|густые': ['54', '126']
        };
        for (const len of ['короткие', 'средние', 'длинные']) {
            for (const den of ['редкие', 'средние', 'густые']) {
                const v = approvedBaseline();
                v.length = len;
                v.density = den;
                const got = recipeMasses(runProtocol(v).html);
                assert.deepStrictEqual(got, expected[len + '|' + den],
                    'matrix length=' + len + ' density=' + den);
            }
        }
    }],

    ['4. thickness timing', function thicknessTiming() {
        const thin = runProtocol(Object.assign(approvedBaseline(), { thickness: 'тонкие' })).html;
        const thick = runProtocol(Object.assign(approvedBaseline(), { thickness: 'толстые' })).html;
        const mid = runProtocol(Object.assign(approvedBaseline(), { thickness: 'средние' })).html;
        assert.ok(/Час витримки скорочено/.test(thin),
            'thickness=тонкие must shorten the timing diagnostic');
        assert.ok(/Час витримки збільшено/.test(thick),
            'thickness=толстые must increase the timing diagnostic');
        assert.ok(!hasTimingAdjustment(mid),
            'thickness=средние must not add a timing-adjustment diagnostic');
    }],

    ['5. thickness not mass', function thicknessNotMass() {
        // All thickness enum values keep mass identical to the baseline.
        assert.deepStrictEqual(massesWith('thickness', 'тонкие'), ['18', '42'],
            'thickness=тонкие must not change mass');
        assert.deepStrictEqual(massesWith('thickness', 'средние'), ['18', '42'],
            'thickness=средние must not change mass');
        assert.deepStrictEqual(massesWith('thickness', 'толстые'), ['18', '42'],
            'thickness=толстые must not change mass');
    }],

    ['6. density/length not timing', function densityLengthNotTiming() {
        // Varying density or length (thickness fixed = средние) must NOT add a
        // timing-adjustment diagnostic — timing belongs to thickness only.
        for (const den of ['редкие', 'средние', 'густые']) {
            const html = runProtocol(Object.assign(approvedBaseline(), { density: den })).html;
            assert.ok(!hasTimingAdjustment(html),
                'density=' + den + ' must not change timing');
        }
        for (const len of ['короткие', 'средние', 'длинные']) {
            const html = runProtocol(Object.assign(approvedBaseline(), { length: len })).html;
            assert.ok(!hasTimingAdjustment(html),
                'length=' + len + ' must not change timing');
        }
    }],

    ['7. unknown gates', function unknownGates() {
        // 7a. Empty (present-but-blank) -> BLOCKED missing-critical-data, named.
        const emptyCases = [
            { field: 'density', label: 'густота волосся' },
            { field: 'thickness', label: 'товщина волосся' },
            { field: 'length', label: 'довжина волосся' }
        ];
        for (const c of emptyCases) {
            const values = approvedBaseline();
            values[c.field] = '';
            const { html } = runProtocol(values);
            assert.ok(/Недостатньо критичних даних/.test(html),
                'empty ' + c.field + ' must produce a missing-critical-data block');
            assert.ok(html.includes(c.label),
                'empty ' + c.field + ' block must name "' + c.label + '"');
            assert.ok(!/approved-recipe/.test(html),
                'empty ' + c.field + ' must not render an approved recipe');
        }
        // 7b. Out-of-enum -> BLOCKED unrecognized-critical, named + echoed.
        const badCases = [
            { field: 'density', bad: 'ОЧЕНЬ_ГУСТЫЕ', label: 'густота волосся' },
            { field: 'thickness', bad: 'ультратонкие', label: 'товщина волосся' },
            { field: 'length', bad: 'макси-длина', label: 'довжина волосся' }
        ];
        for (const c of badCases) {
            const values = approvedBaseline();
            values[c.field] = c.bad;
            const { html } = runProtocol(values);
            assert.ok(/Нерозпізнані критичні значення/.test(html),
                'unrecognized ' + c.field + ' must produce an unrecognized-critical block');
            assert.ok(html.includes(c.label),
                'unrecognized ' + c.field + ' block must name "' + c.label + '"');
            assert.ok(html.includes(c.bad),
                'unrecognized ' + c.field + ' block must echo the rejected value');
            assert.ok(!/approved-recipe/.test(html),
                'unrecognized ' + c.field + ' must not render an approved recipe');
        }
    }],

    ['8. structure/curl absence', function structureCurlAbsence() {
        const values = approvedBaseline();

        // 8a. Mapping output never carries structure/curl/texture/wave keys.
        const { wwwValues, rawInput, requestedIds: mapIds } = runMapping(values);
        for (const key of ['structure', 'curl', 'texture', 'wave']) {
            assert.ok(!Object.prototype.hasOwnProperty.call(wwwValues, key),
                'wwwValues must not contain "' + key + '" key');
            assert.ok(!Object.prototype.hasOwnProperty.call(rawInput, key),
                'rawInput must not contain "' + key + '" key');
        }

        // 8b. Mapping layer never reads a structure/curl element from the DOM.
        assert.ok(!mapIds.includes('structure'), 'gather must not read structure element');
        assert.ok(!mapIds.includes('curl'), 'gather must not read curl element');

        // 8c. calculateProtocol() never reads a structure/curl element.
        const { requestedIds: protoIds } = runProtocol(values);
        assert.ok(!protoIds.includes('structure'), 'calculateProtocol must not read structure element');
        assert.ok(!protoIds.includes('curl'), 'calculateProtocol must not read curl element');

        // 8d. Source-level lock: www/core.js does not wire structure/curl as
        //     form fields (no getWwwValue / getElementById for them).
        assert.ok(!/getWwwValue\(\s*['"]structure['"]\s*\)/.test(code),
            'core.js must not gather a structure form field');
        assert.ok(!/getWwwValue\(\s*['"]curl['"]\s*\)/.test(code),
            'core.js must not gather a curl form field');
        assert.ok(!/getElementById\(\s*['"]structure['"]\s*\)/.test(code),
            'core.js must not read a structure element');
        assert.ok(!/getElementById\(\s*['"]curl['"]\s*\)/.test(code),
            'core.js must not read a curl element');
    }],

    ['9. UI/core alignment', function uiCoreAlignment() {
        // The UI form ids align with core consumption across both surfaces.
        // 9a. gather reads the three ids and normalize preserves + trims them.
        const { wwwValues, rawInput, requestedIds } = runMapping(approvedBaseline());
        for (const id of ['density', 'thickness', 'length']) {
            assert.ok(requestedIds.includes(id), 'gather must read "' + id + '" element');
        }
        assert.strictEqual(wwwValues.density, 'средние', 'gather preserves density');
        assert.strictEqual(wwwValues.thickness, 'средние', 'gather preserves thickness');
        assert.strictEqual(wwwValues.length, 'средние', 'gather preserves length');
        assert.strictEqual(rawInput.density, 'средние', 'normalize preserves density');
        assert.strictEqual(rawInput.thickness, 'средние', 'normalize preserves thickness');
        assert.strictEqual(rawInput.length, 'средние', 'normalize preserves length');

        const trimmed = runMapping(Object.assign(approvedBaseline(), {
            density: '  густые  ', thickness: '  тонкие  ', length: '  длинные  '
        }));
        assert.strictEqual(trimmed.rawInput.density, 'густые', 'normalize trims density');
        assert.strictEqual(trimmed.rawInput.thickness, 'тонкие', 'normalize trims thickness');
        assert.strictEqual(trimmed.rawInput.length, 'длинные', 'normalize trims length');

        // 9b. calculateProtocol reads the SAME three ids (UI<->runtime parity).
        const { requestedIds: protoIds } = runProtocol(approvedBaseline());
        for (const id of ['density', 'thickness', 'length']) {
            assert.ok(protoIds.includes(id), 'calculateProtocol must read "' + id + '" element');
        }
    }],

    ['10. clean control', function cleanControl() {
        // Clean valid baseline reaches APPROVED with a mass-bearing recipe and
        // no input-gate blocks. This is the control that proves the gates above
        // are not firing spuriously on good input.
        const { html } = runProtocol(approvedBaseline());
        assert.ok(/approved-recipe/.test(html),
            'valid baseline must render an executable approved recipe');
        assert.ok(!/Недостатньо критичних даних/.test(html),
            'valid baseline must not block on missing critical data');
        assert.ok(!/Нерозпізнані критичні значення/.test(html),
            'valid baseline must not block on unrecognized critical values');
        assert.deepStrictEqual(recipeMasses(html), ['18', '42'],
            'baseline (средние/средние/средние) recipe masses must be root 18 / length 42');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try {
        fn();
        results.push(name + ' — PASS');
        console.log('  ok   ' + name);
    } catch (err) {
        failed += 1;
        results.push(name + ' — FAIL: ' + err.message);
        console.error('  FAIL ' + name + ': ' + err.message);
    }
}

console.log('\n--- HAIR PARAMETER CONTRACT GROUPS (10) ---');
for (const line of results) console.log('  ' + line);

if (failed > 0) {
    console.error('\nWWW hair parameter contract test FAILED (' + failed + '/' + GROUPS.length + ' groups failed)');
    process.exit(1);
}
console.log('\nWWW hair parameter contract test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
