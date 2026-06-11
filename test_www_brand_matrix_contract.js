'use strict';

/**
 * test_www_brand_matrix_contract.js
 *
 * BRAND MATRIX DATA CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Validates the strict, structured, PURE brand-matrix data contract
 * (validateBrandMatrixEntry / validateBrandRuleMatrix / getBrandMatrixReadiness).
 *
 * IMPORTANT: brand matrix calculation remains DISABLED. These helpers are
 * diagnostic-only and are NOT wired into calculateProtocol. All fixture data
 * below is CLEARLY ARTIFICIAL ("MOCK") and is NOT a real brand formula spec.
 * No fake brand recipe is produced anywhere. Real brand formulas require
 * validated source data ingested later — never hardcoded here.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const CORE = fs.readFileSync('./www/core.js', 'utf8');

// One sandbox with core.js loaded; helpers are top-level globals.
const sb = { console };
vm.createContext(sb);
vm.runInContext(CORE, sb);

function readiness(matrix) {
    sb.__M = matrix;
    vm.runInContext('globalThis.__R = JSON.stringify(getBrandMatrixReadiness(__M));', sb);
    return JSON.parse(sb.__R);
}
function entryReadiness(entry) {
    sb.__E = entry;
    vm.runInContext('globalThis.__RE = JSON.stringify(validateBrandMatrixEntry(__E));', sb);
    return JSON.parse(sb.__RE);
}

// CLEARLY ARTIFICIAL mock entry — NOT a real brand spec.
function mockEntry(over) {
    return Object.assign({
        brandId: 'TEST_BRAND',
        brandDisplayName: 'Test Brand (MOCK — not a real product)',
        lineId: 'TEST_LINE',
        lineDisplayName: 'Test Line (MOCK)',
        processCategory: 'permanent',
        supportedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        oxidizerCompatibility: ['6%', '9%'],
        mixRatio: '1:1',
        timingRange: '30-45',
        greyCoveragePolicy: 'MOCK_POLICY',
        specialBlondPolicy: 'MOCK_POLICY',
        powderPolicy: 'MOCK_POLICY',
        toningPolicy: 'MOCK_POLICY',
        contraindications: ['MOCK_CONTRAINDICATION'],
        manualReviewTriggers: ['MOCK_TRIGGER'],
        sourceReference: 'MOCK-DOC-0000 (artificial fixture, not a real brand specification)',
        validationStatus: 'validated',
        lastReviewedAt: '2026-01-01'
    }, over || {});
}

// calculateProtocol harness (behavior preservation).
function runProtocol(values) {
    let out = '';
    const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    const s2 = { console, localStorage: storage, sessionStorage: storage,
        document: { getElementById(id) {
            if (id === 'output') return { set innerHTML(v) { out = v; }, get innerHTML() { return out; } };
            return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
        } } };
    vm.createContext(s2);
    vm.runInContext(CORE + '\ncalculateProtocol();', s2);
    return out;
}
function fixture(over) {
    return Object.assign({
        history: 'натуральні', condition: 'здоровые', root_condition: 'здоровий корінь',
        length_condition: 'здорове полотно', porosity: 'нормальна пористість',
        thickness: 'средние', density: 'средние', length: 'средние', grey_percent: '0',
        grey_type: 'мягкая', root_level: '7', root_length: '1', length_level: '7',
        ends_level: '', ends_condition: '', ends_history: '', ends_base_type: '',
        base_type: 'Натуральна', target_level: '7', target_direction: '1',
        elasticity: 'нормальна еластичність', allergy: 'no', scalp_sensitivity: 'normal'
    }, over || {});
}
function statusOf(html) { const m = html.match(/status-header"><h2>([^<]*)<\/h2>/); return m ? m[1].trim().split(' ')[0] : ''; }

const GROUPS = [
    ['1. null matrix => not ready', function () {
        const r = readiness(null);
        assert.strictEqual(r.ready, false);
        assert.strictEqual(r.validationStatus, 'absent');
        assert.strictEqual(r.contractType, 'brandMatrixReadiness');
    }],
    ['2. empty matrix => not ready', function () {
        const r = readiness([]);
        assert.strictEqual(r.ready, false);
        assert.strictEqual(r.validationStatus, 'absent');
    }],
    ['3. partial entry => not ready + missing fields listed', function () {
        const partial = { brandId: 'TEST_BRAND', lineId: 'TEST_LINE' };
        const r = readiness([partial]);
        assert.strictEqual(r.ready, false);
        assert.ok(r.missingFields.indexOf('processCategory') !== -1, 'must list missing processCategory');
        assert.ok(r.missingFields.indexOf('sourceReference') !== -1, 'must list missing sourceReference');
        assert.ok(r.missingFields.indexOf('lastReviewedAt') !== -1, 'must list missing lastReviewedAt');
        assert.ok(r.missingFields.indexOf('validationStatus') !== -1, 'must list missing validationStatus');
    }],
    ['4. pending validationStatus => not ready', function () {
        const r = readiness([mockEntry({ validationStatus: 'pending' })]);
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('validationStatus') !== -1);
    }],
    ['5. draft validationStatus => not ready', function () {
        const r = readiness([mockEntry({ validationStatus: 'draft' })]);
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('validationStatus') !== -1);
    }],
    ['6. unknown processCategory => not ready', function () {
        const r = readiness([mockEntry({ processCategory: 'totally_unknown_cat' })]);
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('processCategory') !== -1);
    }],
    ['7. complete validated entry => ready', function () {
        const r = readiness([mockEntry()]);
        assert.strictEqual(r.ready, true, 'complete validated entry must be ready: ' + JSON.stringify(r.reasons));
        assert.strictEqual(r.validationStatus, 'validated');
        assert.deepStrictEqual(r.missingFields, []);
    }],
    ['8. requiredFieldsCount stable (=18)', function () {
        assert.strictEqual(readiness(null).requiredFieldsCount, 18);
        assert.strictEqual(readiness([mockEntry()]).requiredFieldsCount, 18);
        assert.strictEqual(entryReadiness(mockEntry()).requiredFieldsCount, 18);
    }],
    ['9. helpers are pure (no input mutation)', function () {
        const entry = mockEntry({ validationStatus: 'pending' });
        const before = JSON.stringify(entry);
        entryReadiness(entry);
        assert.strictEqual(JSON.stringify(entry), before, 'validateBrandMatrixEntry must not mutate entry');
        const matrix = [mockEntry(), mockEntry({ processCategory: 'unknown_x' })];
        const mbefore = JSON.stringify(matrix);
        readiness(matrix);
        assert.strictEqual(JSON.stringify(matrix), mbefore, 'getBrandMatrixReadiness must not mutate matrix');
    }],
    ['10. calculateProtocol behavior preserved (brand matrix stays disabled)', function () {
        // normal non-brand-sensitive permanent path stays APPROVED
        const clean = runProtocol(fixture());
        assert.strictEqual(statusOf(clean), 'APPROVED', 'clean 7->7 must remain APPROVED');
        assert.ok(!/Brand rule matrix/.test(clean), 'clean path does not trigger brand gate');
        // brand-sensitive paths remain MANUAL_REQUIRED with no exact grams, brand matrix absent
        for (const ov of [
            { root_level: '6', length_level: '6', target_level: '10', target_direction: '1' }, // SB
            { root_level: '5', length_level: '5', target_level: '9', target_direction: '1' }    // powder
        ]) {
            const html = runProtocol(fixture(ov));
            assert.strictEqual(statusOf(html), 'MANUAL_REQUIRED', 'brand-sensitive path must remain MANUAL');
            assert.ok(!/approved-recipe/.test(html), 'no approved recipe in brand-sensitive MANUAL');
            assert.ok(!/Маса:<\/b>\s*\d/.test(html), 'no exact grams in brand-sensitive MANUAL');
            assert.ok(/Brand rule matrix відсутня/.test(html), 'brand matrix must remain absent/disabled');
        }
        // no internal meta leak introduced
        for (const f of ['"meta"', 'processCategory', 'oxidizerPercent', 'safetyMarkersVersion']) {
            assert.ok(!clean.includes(f), 'no meta leak in output: ' + f);
        }
    }],
    ['11. docs state brand matrix disabled but contract exists', function () {
        const idx = fs.readFileSync('./docs/production-readiness-index.md', 'utf8');
        assert.ok(/hasBrandRuleMatrix/.test(idx) || /brand matrix is NOT enabled/.test(idx), 'index must state brand matrix disabled');
        const lim = fs.readFileSync('./docs/known-limitations-contract.md', 'utf8');
        assert.ok(/brand matrix data contract/i.test(lim) || /brand matrix.*contract/i.test(lim), 'known-limitations must mention the brand matrix data contract');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- BRAND MATRIX CONTRACT GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW brand matrix contract test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW brand matrix contract test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
