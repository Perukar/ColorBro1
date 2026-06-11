'use strict';

/**
 * test_www_brand_matrix_import_contract.js
 *
 * BRAND MATRIX ADMIN/IMPORT CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Diagnostic-only validation of a FUTURE admin/import package of real, validated
 * brand-matrix data. Proves:
 *   - import readiness is strict (shape + canonical 18-field entry validation),
 *   - IMPORT READY != PRODUCTION ACTIVATION (hasBrandRuleMatrix stays false;
 *     calculateProtocol behavior is unchanged; brand-sensitive paths stay MANUAL),
 *   - helpers are pure (no input mutation),
 *   - fixtures are clearly artificial (TEST_*), no real brand names, no fake formulas.
 *
 * Pure Node.js + vm against the real ./www/core.js. No browser, no framework,
 * no network, no persistence.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const CORE = fs.readFileSync('./www/core.js', 'utf8');
const sb = { console };
vm.createContext(sb);
vm.runInContext(CORE, sb);

function importReadiness(payload) {
    sb.__P = payload;
    vm.runInContext('globalThis.__R = JSON.stringify(getBrandMatrixImportReadiness(__P));', sb);
    return JSON.parse(sb.__R);
}
// CLEARLY ARTIFICIAL brand-line entry — NOT a real brand spec, NO formula.
function mockEntry(over) {
    const e = {};
    ['brandId', 'brandDisplayName', 'lineId', 'lineDisplayName', 'processCategory', 'supportedLevels',
     'oxidizerCompatibility', 'mixRatio', 'timingRange', 'greyCoveragePolicy', 'specialBlondPolicy',
     'powderPolicy', 'toningPolicy', 'contraindications', 'manualReviewTriggers', 'sourceReference',
     'lastReviewedAt'].forEach((k) => { e[k] = 'TEST_VALUE'; });
    e.brandId = 'TEST_BRAND';
    e.lineId = 'TEST_LINE';
    e.processCategory = 'permanent';
    e.validationStatus = 'validated';
    e.sourceReference = 'TEST_SOURCE_REF';
    e.lastReviewedAt = '2026-06-11';
    return Object.assign(e, over || {});
}
// CLEARLY ARTIFICIAL import package.
function mockPackage(over, entries) {
    return Object.assign({
        contractType: 'brandMatrixImport',
        schemaVersion: 1,
        sourceType: 'admin_import',
        sourceName: 'TEST_SOURCE',
        importedAt: '2026-06-11T00:00:00Z',
        reviewedBy: 'TEST_REVIEWER',
        entries: entries || [mockEntry()]
    }, over || {});
}

// calculateProtocol harness (behavior preservation).
function runProtocol(values) {
    let out = '';
    const s2 = { console, document: { getElementById(id) {
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
        length_condition: 'здорове полотно', porosity: 'нормальна пористість', thickness: 'средние',
        density: 'средние', length: 'средние', grey_percent: '0', grey_type: 'мягкая',
        root_level: '7', root_length: '1', length_level: '7', ends_level: '', ends_condition: '',
        ends_history: '', ends_base_type: '', base_type: 'Натуральна', target_level: '7',
        target_direction: '1', elasticity: 'нормальна еластичність', allergy: 'no', scalp_sensitivity: 'normal'
    }, over || {});
}
const statusOf = (html) => { const m = html.match(/status-header"><h2>([^<|]*)/); return m ? m[1].trim().split(' ')[0] : ''; };

const GROUPS = [
    ['1. null payload => not ready', () => {
        const r = importReadiness(null);
        assert.strictEqual(r.ready, false);
        assert.strictEqual(r.contractType, 'brandMatrixImportReadiness');
        assert.strictEqual(r.notForProductionActivation, true);
    }],
    ['2. non-object payload => not ready', () => {
        assert.strictEqual(importReadiness(42).ready, false);
        assert.strictEqual(importReadiness([]).ready, false);
        assert.strictEqual(importReadiness(true).ready, false);
    }],
    ['3. wrong contractType => not ready', () => {
        const r = importReadiness(mockPackage({ contractType: 'something_else' }));
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('contractType') !== -1);
    }],
    ['4. unsupported schemaVersion => not ready', () => {
        const r = importReadiness(mockPackage({ schemaVersion: 2 }));
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('schemaVersion') !== -1);
    }],
    ['5. missing sourceName/importedAt/reviewedBy => not ready + missingFields', () => {
        const r = importReadiness(mockPackage({ sourceName: undefined, importedAt: undefined, reviewedBy: undefined }));
        assert.strictEqual(r.ready, false);
        for (const f of ['sourceName', 'importedAt', 'reviewedBy']) {
            assert.ok(r.missingFields.indexOf(f) !== -1, 'missingFields must include ' + f);
        }
    }],
    ['6. missing entries => not ready', () => {
        const r = importReadiness(mockPackage({ entries: undefined }));
        assert.strictEqual(r.ready, false);
        assert.ok(r.missingFields.indexOf('entries') !== -1);
    }],
    ['7. entries not array => not ready', () => {
        const r = importReadiness(mockPackage({ entries: { not: 'array' } }));
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('entries must be an array') !== -1);
    }],
    ['8. empty entries => not ready', () => {
        const r = importReadiness(mockPackage({}, []));
        assert.strictEqual(r.ready, false);
        assert.ok(r.reasons.join(' ').indexOf('empty') !== -1);
    }],
    ['9. partial invalid entry => not ready + invalidEntries', () => {
        const r = importReadiness(mockPackage({}, [{ brandId: 'TEST_BRAND' }]));
        assert.strictEqual(r.ready, false);
        assert.ok(Array.isArray(r.invalidEntries) && r.invalidEntries.length === 1, 'one invalid entry');
        assert.ok(r.invalidEntries[0].missingFields.length > 0, 'invalid entry lists missing fields');
    }],
    ['10. pending entry => not ready', () => {
        const r = importReadiness(mockPackage({}, [mockEntry({ validationStatus: 'pending' })]));
        assert.strictEqual(r.ready, false);
        assert.ok(r.invalidEntries.length === 1);
    }],
    ['11. complete validated artificial package => import ready', () => {
        const r = importReadiness(mockPackage());
        assert.strictEqual(r.ready, true, 'complete validated package must be import-ready: ' + JSON.stringify(r.reasons));
        assert.strictEqual(r.entryCount, 1);
        assert.strictEqual(r.schemaVersion, 1);
        assert.strictEqual(r.matrixReadiness.ready, true);
        // JSON-string payload accepted too.
        assert.strictEqual(importReadiness(JSON.stringify(mockPackage())).ready, true);
    }],
    ['12. import ready does NOT enable brand matrix / production activation', () => {
        const r = importReadiness(mockPackage());
        assert.strictEqual(r.ready, true);
        assert.strictEqual(r.notForProductionActivation, true, 'import readiness must never imply production activation');
        // brand-sensitive path still MANUAL with brand matrix absent (not activated by import).
        const sbHtml = runProtocol(fixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' }));
        assert.strictEqual(statusOf(sbHtml), 'MANUAL_REQUIRED', 'brand matrix stays disabled despite import-ready package');
        assert.ok(/Brand rule matrix відсутня/.test(sbHtml), 'brand gate still cites matrix absent');
    }],
    ['13. calculateProtocol behavior preserved', () => {
        assert.strictEqual(statusOf(runProtocol(fixture())), 'APPROVED', 'clean 7->7 remains APPROVED');
        for (const ov of [
            { root_level: '6', length_level: '6', target_level: '10', target_direction: '1' }, // SB
            { root_level: '5', length_level: '5', target_level: '9', target_direction: '1' }    // powder
        ]) {
            const html = runProtocol(fixture(ov));
            assert.strictEqual(statusOf(html), 'MANUAL_REQUIRED', 'brand-sensitive stays MANUAL');
            assert.ok(!/approved-recipe/.test(html), 'no approved recipe');
            assert.ok(!/Маса:<\/b>\s*\d/.test(html), 'no exact grams in brand-sensitive MANUAL');
        }
    }],
    ['14. helper purity: input not mutated', () => {
        const pkg = mockPackage();
        const before = JSON.stringify(pkg);
        importReadiness(pkg);
        assert.strictEqual(JSON.stringify(pkg), before, 'getBrandMatrixImportReadiness must not mutate payload');
        const partial = mockPackage({}, [{ brandId: 'TEST_BRAND' }]);
        const pbefore = JSON.stringify(partial);
        importReadiness(partial);
        assert.strictEqual(JSON.stringify(partial), pbefore, 'must not mutate payload with invalid entries');
    }],
    ['15. fixtures artificial; no real brand names / no fake formulas', () => {
        const fixtureJson = JSON.stringify(mockPackage());
        assert.ok(/TEST_BRAND/.test(fixtureJson) && /TEST_SOURCE/.test(fixtureJson) && /TEST_LINE/.test(fixtureJson),
            'fixtures must be clearly artificial (TEST_*)');
        assert.ok(!/wella|l'?or[eé]al|loreal|schwarzkopf|estel|majirel|koleston|igora/i.test(fixtureJson),
            'no real brand names in fixtures');
        // No proprietary brand name in core.js runtime either.
        assert.ok(!/wella|l'?or[eé]al|loreal|schwarzkopf|estel|majirel|koleston|igora/i.test(CORE),
            'no real brand names in core.js');
    }],
    ['16. docs: import contract exists, production activation disabled', () => {
        const lim = fs.readFileSync('./docs/known-limitations-contract.md', 'utf8');
        assert.ok(/import/i.test(lim) && /brand matrix/i.test(lim), 'known-limitations must mention brand matrix import');
        const idx = fs.readFileSync('./docs/production-readiness-index.md', 'utf8');
        assert.ok(/hasBrandRuleMatrix/.test(idx) || /brand matrix is NOT enabled/.test(idx), 'index states brand matrix disabled');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- BRAND MATRIX IMPORT CONTRACT GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW brand matrix import contract test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW brand matrix import contract test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
