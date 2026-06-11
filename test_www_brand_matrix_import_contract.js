'use strict';

/**
 * test_www_brand_matrix_import_contract.js
 *
 * BRAND MATRIX ADMIN/IMPORT CONTRACT v1 + PROVENANCE/SANITY CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Diagnostic-only validation of a FUTURE admin/import package of real, validated
 * brand-matrix data. Proves:
 *   - import readiness is strict (shape + canonical 18-field entry validation),
 *   - PROVENANCE is required: valid sourceType, non-placeholder sourceName/reviewedBy,
 *     parseable importedAt; placeholder markers are rejected,
 *   - SANITY is conservative: supportedLevels 1–12, allowed oxidizer set, structured
 *     mixRatio (no free text, no extreme ratios), timingRange 1–90 minutes,
 *     structured policy objects, real contraindications/manualReviewTriggers,
 *     source-pointer-like sourceReference, parseable lastReviewedAt,
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
// Structured values exist only to satisfy the conservative sanity contract.
function mockEntry(over) {
    return Object.assign({
        brandId: 'TEST_BRAND_ID',
        brandDisplayName: 'TEST_BRAND_DISPLAY',
        lineId: 'TEST_LINE_ID',
        lineDisplayName: 'TEST_LINE_DISPLAY',
        processCategory: 'permanent',
        supportedLevels: [6, 7, 8],
        oxidizerCompatibility: [3, 6],
        mixRatio: { dye: 1, oxidizer: 1.5 },
        timingRange: { min: 30, max: 45, unit: 'minutes' },
        greyCoveragePolicy: { status: 'TEST_POLICY_STATUS' },
        specialBlondPolicy: { status: 'TEST_POLICY_STATUS' },
        powderPolicy: { status: 'TEST_POLICY_STATUS' },
        toningPolicy: { status: 'TEST_POLICY_STATUS' },
        contraindications: ['TEST_CONTRAINDICATION_NOTE'],
        manualReviewTriggers: ['TEST_MANUAL_REVIEW_TRIGGER'],
        sourceReference: 'TEST_SOURCE_REFERENCE',
        validationStatus: 'validated',
        lastReviewedAt: '2026-06-11'
    }, over || {});
}
// CLEARLY ARTIFICIAL import package with valid provenance shape.
function mockPackage(over, entries) {
    return Object.assign({
        contractType: 'brandMatrixImport',
        schemaVersion: 1,
        sourceType: 'internal_test_fixture',
        sourceName: 'TEST_SOURCE_NAME',
        importedAt: '2026-06-11T00:00:00Z',
        reviewedBy: 'TEST_REVIEWER',
        entries: entries || [mockEntry()]
    }, over || {});
}
function notReady(pkg, needle) {
    const r = importReadiness(pkg);
    assert.strictEqual(r.ready, false, 'must NOT be ready; reasons: ' + JSON.stringify(r.reasons));
    assert.strictEqual(r.notForProductionActivation, true, 'notForProductionActivation must stay true');
    if (needle) {
        assert.ok(r.reasons.join(' | ').toLowerCase().indexOf(needle.toLowerCase()) !== -1,
            'reasons must mention "' + needle + '": ' + JSON.stringify(r.reasons));
    }
    return r;
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
        notReady(mockPackage({ contractType: 'something_else' }), 'contractType');
    }],
    ['4. unsupported schemaVersion => not ready', () => {
        notReady(mockPackage({ schemaVersion: 2 }), 'schemaVersion');
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
        notReady(mockPackage({ entries: { not: 'array' } }), 'entries must be an array');
    }],
    ['8. empty entries => not ready', () => {
        notReady(mockPackage({}, []), 'empty');
    }],
    ['9. partial invalid entry => not ready + invalidEntries', () => {
        const r = importReadiness(mockPackage({}, [{ brandId: 'TEST_BRAND_ID' }]));
        assert.strictEqual(r.ready, false);
        assert.ok(Array.isArray(r.invalidEntries) && r.invalidEntries.length === 1, 'one invalid entry');
        assert.ok(r.invalidEntries[0].missingFields.length > 0, 'invalid entry lists missing fields');
    }],
    ['10. pending validationStatus => still not ready', () => {
        const r = notReady(mockPackage({}, [mockEntry({ validationStatus: 'pending' })]), 'validationStatus');
        assert.ok(r.invalidEntries.length === 1);
    }],
    ['11. complete validated artificial package => import ready', () => {
        const r = importReadiness(mockPackage());
        assert.strictEqual(r.ready, true, 'complete validated package must be import-ready: ' + JSON.stringify(r.reasons));
        assert.strictEqual(r.entryCount, 1);
        assert.strictEqual(r.schemaVersion, 1);
        assert.strictEqual(r.matrixReadiness.ready, true);
        assert.strictEqual(r.provenanceReadiness.ready, true, 'provenance must be ready');
        assert.strictEqual(r.sanityReadiness.ready, true, 'sanity must be ready');
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
        for (const pkg of [
            mockPackage(),
            mockPackage({}, [{ brandId: 'TEST_BRAND_ID' }]),
            mockPackage({ sourceName: 'todo' }, [mockEntry({ mixRatio: '1:1', supportedLevels: [0, 13] })])
        ]) {
            const before = JSON.stringify(pkg);
            importReadiness(pkg);
            assert.strictEqual(JSON.stringify(pkg), before, 'getBrandMatrixImportReadiness must not mutate payload');
        }
    }],
    ['15. fixtures artificial; no real brand names / no fake formulas', () => {
        const fixtureJson = JSON.stringify(mockPackage());
        assert.ok(/TEST_BRAND_ID/.test(fixtureJson) && /TEST_SOURCE_NAME/.test(fixtureJson) && /TEST_LINE_ID/.test(fixtureJson),
            'fixtures must be clearly artificial (TEST_*)');
        assert.ok(!/wella|l'?or[eé]al|loreal|schwarzkopf|estel|majirel|koleston|igora/i.test(fixtureJson),
            'no real brand names in fixtures');
        // No proprietary brand name in core.js runtime either.
        assert.ok(!/wella|l'?or[eé]al|loreal|schwarzkopf|estel|majirel|koleston|igora/i.test(CORE),
            'no real brand names in core.js');
    }],
    ['16. provenance: wrong sourceType => not ready', () => {
        notReady(mockPackage({ sourceType: 'admin_import' }), 'sourceType');
        notReady(mockPackage({ sourceType: 'random_blog' }), 'sourceType');
        notReady(mockPackage({ sourceType: 42 }), 'sourceType');
        // every allowed sourceType is accepted
        for (const st of ['manufacturer_pdf', 'official_education', 'technologist_notes', 'salon_validated', 'internal_test_fixture']) {
            assert.strictEqual(importReadiness(mockPackage({ sourceType: st })).ready, true, st + ' must be allowed');
        }
    }],
    ['17. provenance: placeholder sourceName / reviewedBy => not ready', () => {
        for (const ph of ['', 'todo', 'tbd', 'unknown', 'n/a', 'none', 'test', 'placeholder', 'sample', 'xxx', '-', '???', '  TODO  ']) {
            notReady(mockPackage({ sourceName: ph }), 'sourceName');
            notReady(mockPackage({ reviewedBy: ph }), 'reviewedBy');
        }
    }],
    ['18. provenance: invalid importedAt => not ready', () => {
        for (const bad of ['not-a-date', '2026-99-99T00:00:00Z', 'todo', 12345, '11.06.2026']) {
            notReady(mockPackage({ importedAt: bad }), 'importedAt');
        }
        assert.strictEqual(importReadiness(mockPackage({ importedAt: '2026-06-11' })).ready, true, 'plain ISO date allowed');
    }],
    ['19. sanity: invalid lastReviewedAt => not ready', () => {
        for (const bad of ['todo', 'not-a-date', '2026-99-99', 20260611]) {
            notReady(mockPackage({}, [mockEntry({ lastReviewedAt: bad })]), 'lastReviewedAt');
        }
    }],
    ['20. sanity: placeholder / short / non-pointer sourceReference => not ready', () => {
        for (const bad of ['unknown', 'todo', 'test', 'placeholder', 'short', 'NO_KEYWORD_HERE_AT_ALL']) {
            notReady(mockPackage({}, [mockEntry({ sourceReference: bad })]), 'sourceReference');
        }
        for (const ok of ['TEST_SOURCE_REFERENCE', 'manufacturer pdf p.12', 'internal fixture v1', 'education manual 2026']) {
            assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ sourceReference: ok })])).ready, true, ok + ' must be accepted');
        }
    }],
    ['21. sanity: supportedLevels out of range => not ready', () => {
        for (const bad of [[], [0], [13], [-1, 7], ['7'], [NaN], [7, 99]]) {
            notReady(mockPackage({}, [mockEntry({ supportedLevels: bad })]), 'supportedLevels');
        }
        assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ supportedLevels: [1, 12] })])).ready, true);
    }],
    ['22. sanity: oxidizerCompatibility unsupported value => not ready', () => {
        for (const bad of [[], [2.5], [13], [20], ['3'], [0], [-3]]) {
            notReady(mockPackage({}, [mockEntry({ oxidizerCompatibility: bad })]), 'oxidizerCompatibility');
        }
        assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ oxidizerCompatibility: [1.5, 1.9, 3, 4, 6, 9, 12] })])).ready, true);
    }],
    ['23. sanity: mixRatio string / extreme / zero-negative / missing side => not ready', () => {
        for (const bad of ['1:1', { dye: 1 }, { oxidizer: 2 }, { dye: 0, oxidizer: 2 }, { dye: -1, oxidizer: 2 },
                           { dye: 1, oxidizer: 0 }, { dye: 1, oxidizer: -2 }, { dye: 1, oxidizer: 3.5 },
                           { dye: 1, powder: 1, oxidizer: 2 }, []]) {
            notReady(mockPackage({}, [mockEntry({ mixRatio: bad })]), 'mixRatio');
        }
        for (const ok of [{ dye: 1, oxidizer: 1 }, { dye: 1, oxidizer: 1.5 }, { dye: 1, oxidizer: 2 },
                          { powder: 1, oxidizer: 2 }, { powder: 1, oxidizer: 3 }]) {
            assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ mixRatio: ok })])).ready, true,
                JSON.stringify(ok) + ' must be accepted');
        }
    }],
    ['24. sanity: timingRange invalid / max>90 / min>max / wrong unit => not ready', () => {
        for (const bad of ['30-45', { min: -5, max: 30, unit: 'minutes' }, { min: 0, max: 30, unit: 'minutes' },
                           { min: 10, max: 120, unit: 'minutes' }, { min: 45, max: 30, unit: 'minutes' },
                           { min: 10, max: 30, unit: 'hours' }, { min: 10, max: 30 }, { min: '10', max: 30, unit: 'minutes' }]) {
            notReady(mockPackage({}, [mockEntry({ timingRange: bad })]), 'timingRange');
        }
        assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ timingRange: { min: 1, max: 90, unit: 'minutes' } })])).ready, true);
    }],
    ['25. sanity: policy fields must be structured objects => not ready otherwise', () => {
        for (const f of ['greyCoveragePolicy', 'specialBlondPolicy', 'powderPolicy', 'toningPolicy']) {
            notReady(mockPackage({}, [mockEntry({ [f]: 'free text policy' })]), f);
            notReady(mockPackage({}, [mockEntry({ [f]: ['array'] })]), f);
            notReady(mockPackage({}, [mockEntry({ [f]: { status: 'todo' } })]), f);
        }
        assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ greyCoveragePolicy: {} })])).ready, true,
            'plain object policy without status is acceptable');
    }],
    ['26. sanity: contraindications / manualReviewTriggers invalid arrays => not ready', () => {
        for (const f of ['contraindications', 'manualReviewTriggers']) {
            notReady(mockPackage({}, [mockEntry({ [f]: 'not an array' })]), f);
            notReady(mockPackage({}, [mockEntry({ [f]: [''] })]), f);
            notReady(mockPackage({}, [mockEntry({ [f]: ['todo'] })]), f);
            notReady(mockPackage({}, [mockEntry({ [f]: [42] })]), f);
        }
        assert.strictEqual(importReadiness(mockPackage({}, [mockEntry({ contraindications: [] })])).ready, true,
            'empty contraindications array is acceptable');
    }],
    ['27. invalidEntries identify entry index and reasons (sanity merge)', () => {
        const r = importReadiness(mockPackage({}, [mockEntry(), mockEntry({ supportedLevels: [99], mixRatio: '1:1' })]));
        assert.strictEqual(r.ready, false);
        assert.strictEqual(r.invalidEntries.length, 1, 'exactly one invalid entry');
        assert.strictEqual(r.invalidEntries[0].index, 1, 'invalid entry index must be 1');
        const joined = r.invalidEntries[0].reasons.join(' | ');
        assert.ok(joined.indexOf('supportedLevels') !== -1 && joined.indexOf('mixRatio') !== -1,
            'entry reasons must name failing fields: ' + joined);
        assert.ok(r.reasons.join(' | ').indexOf('entry[1]') !== -1, 'top-level reasons must reference entry index');
    }],
    ['28. return shape: provenanceReadiness + sanityReadiness always present', () => {
        for (const pkg of [null, mockPackage(), mockPackage({ sourceName: 'todo' })]) {
            const r = importReadiness(pkg);
            assert.strictEqual(r.contractType, 'brandMatrixImportReadiness');
            assert.ok(r.provenanceReadiness && typeof r.provenanceReadiness === 'object', 'provenanceReadiness object');
            assert.ok(r.sanityReadiness && typeof r.sanityReadiness === 'object', 'sanityReadiness object');
            assert.ok(Array.isArray(r.reasons) && Array.isArray(r.missingFields) && Array.isArray(r.invalidEntries));
            assert.strictEqual(r.notForProductionActivation, true);
        }
        const bad = importReadiness(mockPackage({ sourceName: 'todo' }));
        assert.strictEqual(bad.provenanceReadiness.ready, false);
        assert.ok(bad.provenanceReadiness.reasons.length > 0);
    }],
    ['29. docs: provenance/sanity contract documented, activation stays disabled', () => {
        const lim = fs.readFileSync('./docs/known-limitations-contract.md', 'utf8');
        assert.ok(/import/i.test(lim) && /brand matrix/i.test(lim), 'known-limitations must mention brand matrix import');
        assert.ok(/provenance/i.test(lim) && /sanity/i.test(lim), 'known-limitations must document provenance + sanity checks');
        const idx = fs.readFileSync('./docs/production-readiness-index.md', 'utf8');
        assert.ok(/hasBrandRuleMatrix/.test(idx) || /brand matrix is NOT enabled/.test(idx), 'index states brand matrix disabled');
        assert.ok(/provenance/i.test(idx) && /sanity/i.test(idx), 'index must mention provenance/sanity import checks');
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
