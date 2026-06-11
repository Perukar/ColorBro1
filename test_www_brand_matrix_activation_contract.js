'use strict';

/**
 * test_www_brand_matrix_activation_contract.js
 *
 * BRAND MATRIX ACTIVATION PRECONDITIONS CHECKLIST CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Diagnostic-only contract for the FUTURE question: "Is the system allowed to
 * activate the brand matrix in production?" For now the answer must remain NO.
 * Proves:
 *   - getBrandMatrixActivationPreconditions() requires a fully import-ready
 *     package (shape + provenance + sanity), recorded human review + source
 *     audit, an explicitly bounded activation scope, production approval with
 *     rollback plan and complete test evidence, and runtime flags proving the
 *     feature is still INACTIVE,
 *   - even a complete artificial request only reaches READY_BUT_NOT_ACTIVATED:
 *     activationAllowedNow is ALWAYS false; notForProductionActivation ALWAYS true,
 *   - hasBrandRuleMatrix stays false; calculateProtocol behavior unchanged,
 *   - helpers are pure; fixtures are artificial (TEST_* prefix only); non-TEST
 *     identifiers, fake-formula markers and formula-like free text are rejected;
 *     core.js stores no real brand names in any form (plain, auditable source).
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

function activation(input) {
    sb.__I = input;
    vm.runInContext('globalThis.__R = JSON.stringify(getBrandMatrixActivationPreconditions(__I));', sb);
    return JSON.parse(sb.__R);
}
// CLEARLY ARTIFICIAL fixtures — TEST_* only, NO real brand, NO formula.
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
function mockRequest(over) {
    return Object.assign({
        contractType: 'brandMatrixActivationRequest',
        schemaVersion: 1,
        requestedBy: 'TEST_REQUESTER',
        requestedAt: '2026-06-11T00:00:00Z',
        reviewedBy: 'TEST_REVIEWER',
        reviewCompletedAt: '2026-06-11T00:00:00Z',
        activationScope: {
            allowedBrandIds: ['TEST_BRAND_ID'],
            allowedLineIds: ['TEST_LINE_ID'],
            allowedProcessCategories: ['permanent']
        },
        approvedForProduction: true,
        rollbackPlan: 'TEST_ROLLBACK_PLAN: disable activation flag and revert all brand-sensitive paths to MANUAL_REQUIRED.',
        testEvidence: {
            brandMatrixContractTests: 'pass',
            importContractTests: 'pass',
            businessScenarios: 'pass',
            renderRuntime: 'pass',
            structuredSafetyFlags: 'pass',
            productionReadinessIndex: 'pass'
        },
        sourceAuditSummary: 'TEST_SOURCE_AUDIT_SUMMARY: manufacturer pdf cross-checked against internal fixture data.'
    }, over || {});
}
function mockFlags(over) {
    return Object.assign({
        hasBrandRuleMatrix: false,
        calculateProtocolWiredToBrandMatrix: false,
        brandFormulaOutputEnabled: false,
        productionThreeZoneEnabled: false,
        endsRecEnabled: false
    }, over || {});
}
function mockInput(over) {
    return Object.assign({
        importPayload: mockPackage(),
        activationRequest: mockRequest(),
        runtimeFlags: mockFlags()
    }, over || {});
}
function notReady(input, needle) {
    const r = activation(input);
    assert.strictEqual(r.ready, false, 'must NOT be ready; blockers: ' + JSON.stringify(r.blockers));
    assert.strictEqual(r.decision, 'NOT_READY');
    assert.strictEqual(r.activationAllowedNow, false, 'activationAllowedNow must stay false');
    assert.strictEqual(r.notForProductionActivation, true, 'notForProductionActivation must stay true');
    if (needle) {
        assert.ok(r.blockers.join(' | ').toLowerCase().indexOf(needle.toLowerCase()) !== -1,
            'blockers must mention "' + needle + '": ' + JSON.stringify(r.blockers));
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
    ['1. null/non-object input => not ready', () => {
        for (const bad of [null, undefined, 42, 'x', [], true]) {
            const r = activation(bad);
            assert.strictEqual(r.ready, false);
            assert.strictEqual(r.decision, 'NOT_READY');
            assert.strictEqual(r.contractType, 'brandMatrixActivationPreconditions');
            assert.strictEqual(r.schemaVersion, 1);
            assert.strictEqual(r.activationAllowedNow, false);
            assert.strictEqual(r.notForProductionActivation, true);
        }
        const r = activation(null);
        for (const f of ['importPayload', 'activationRequest', 'runtimeFlags']) {
            assert.ok(r.missingFields.indexOf(f) !== -1, 'missingFields must include ' + f);
        }
    }],
    ['2. missing importPayload => not ready', () => {
        const r = notReady({ activationRequest: mockRequest(), runtimeFlags: mockFlags() }, 'importPayload is missing');
        assert.ok(r.missingFields.indexOf('importPayload') !== -1);
    }],
    ['3. invalid importPayload (provenance/sanity garbage) => not ready', () => {
        notReady(mockInput({ importPayload: mockPackage({ sourceName: 'todo' }) }), 'not import-ready');
        notReady(mockInput({ importPayload: mockPackage({}, [mockEntry({ mixRatio: '1:1' })]) }), 'not import-ready');
        notReady(mockInput({ importPayload: { contractType: 'wrong' } }), 'not import-ready');
    }],
    ['4. import-ready package but missing activationRequest => not ready', () => {
        const r = notReady({ importPayload: mockPackage(), runtimeFlags: mockFlags() }, 'activationRequest');
        assert.strictEqual(r.importReadiness.ready, true, 'import package itself must be import-ready');
        assert.ok(r.missingFields.indexOf('activationRequest') !== -1);
    }],
    ['5. missing requestedBy/reviewedBy/sourceAuditSummary => not ready', () => {
        notReady(mockInput({ activationRequest: mockRequest({ requestedBy: undefined }) }), 'requestedBy');
        notReady(mockInput({ activationRequest: mockRequest({ reviewedBy: 'todo' }) }), 'reviewedBy');
        notReady(mockInput({ activationRequest: mockRequest({ sourceAuditSummary: '' }) }), 'sourceAuditSummary');
    }],
    ['6. invalid requestedAt/reviewCompletedAt => not ready', () => {
        notReady(mockInput({ activationRequest: mockRequest({ requestedAt: 'not-a-date' }) }), 'requestedAt');
        notReady(mockInput({ activationRequest: mockRequest({ reviewCompletedAt: '11.06.2026' }) }), 'reviewCompletedAt');
    }],
    ['7. missing/invalid activationScope => not ready', () => {
        notReady(mockInput({ activationRequest: mockRequest({ activationScope: undefined }) }), 'activationScope');
        notReady(mockInput({ activationRequest: mockRequest({ activationScope: 'all brands' }) }), 'activationScope must be a structured object');
    }],
    ['8. empty allowedBrandIds/allowedLineIds/allowedProcessCategories => not ready', () => {
        for (const f of ['allowedBrandIds', 'allowedLineIds', 'allowedProcessCategories']) {
            const scope = {
                allowedBrandIds: ['TEST_BRAND_ID'],
                allowedLineIds: ['TEST_LINE_ID'],
                allowedProcessCategories: ['permanent']
            };
            scope[f] = [];
            notReady(mockInput({ activationRequest: mockRequest({ activationScope: scope }) }), f);
        }
        // placeholder values rejected too
        notReady(mockInput({ activationRequest: mockRequest({ activationScope: {
            allowedBrandIds: ['todo'], allowedLineIds: ['TEST_LINE_ID'], allowedProcessCategories: ['permanent']
        } }) }), 'placeholder');
    }],
    ['9. unknown process category in activationScope => not ready', () => {
        notReady(mockInput({ activationRequest: mockRequest({ activationScope: {
            allowedBrandIds: ['TEST_BRAND_ID'], allowedLineIds: ['TEST_LINE_ID'], allowedProcessCategories: ['balayage']
        } }) }), 'unknown process category');
        // all four known categories are accepted
        const r = activation(mockInput({ activationRequest: mockRequest({ activationScope: {
            allowedBrandIds: ['TEST_BRAND_ID'], allowedLineIds: ['TEST_LINE_ID'],
            allowedProcessCategories: ['permanent', 'special_blond', 'powder', 'toning']
        } }) }));
        assert.strictEqual(r.ready, true, JSON.stringify(r.blockers));
    }],
    ['10. approvedForProduction false => not ready', () => {
        notReady(mockInput({ activationRequest: mockRequest({ approvedForProduction: false }) }), 'approvedForProduction');
        notReady(mockInput({ activationRequest: mockRequest({ approvedForProduction: 'yes' }) }), 'approvedForProduction');
    }],
    ['11. missing/short rollbackPlan => not ready', () => {
        notReady(mockInput({ activationRequest: mockRequest({ rollbackPlan: undefined }) }), 'rollbackPlan');
        notReady(mockInput({ activationRequest: mockRequest({ rollbackPlan: 'todo' }) }), 'rollbackPlan');
        notReady(mockInput({ activationRequest: mockRequest({ rollbackPlan: 'short plan' }) }), 'too short');
    }],
    ['12. failing testEvidence item => not ready', () => {
        for (const f of ['brandMatrixContractTests', 'importContractTests', 'businessScenarios',
                         'renderRuntime', 'structuredSafetyFlags', 'productionReadinessIndex']) {
            const te = mockRequest().testEvidence;
            te[f] = 'fail';
            notReady(mockInput({ activationRequest: mockRequest({ testEvidence: te }) }), f);
        }
        notReady(mockInput({ activationRequest: mockRequest({ testEvidence: 'all pass' }) }), 'testEvidence');
    }],
    ['13. runtime flag hasBrandRuleMatrix true => not ready (diagnostic-only)', () => {
        notReady(mockInput({ runtimeFlags: mockFlags({ hasBrandRuleMatrix: true }) }), 'not allowed in the current diagnostic-only contract');
    }],
    ['14. runtime flag calculateProtocolWiredToBrandMatrix true => not ready', () => {
        notReady(mockInput({ runtimeFlags: mockFlags({ calculateProtocolWiredToBrandMatrix: true }) }), 'not allowed in the current diagnostic-only contract');
    }],
    ['15. runtime flag brandFormulaOutputEnabled true => not ready', () => {
        notReady(mockInput({ runtimeFlags: mockFlags({ brandFormulaOutputEnabled: true }) }), 'not allowed in the current diagnostic-only contract');
    }],
    ['16. productionThreeZoneEnabled true => not ready', () => {
        notReady(mockInput({ runtimeFlags: mockFlags({ productionThreeZoneEnabled: true }) }), '3-zone');
    }],
    ['17. endsRecEnabled true => not ready', () => {
        notReady(mockInput({ runtimeFlags: mockFlags({ endsRecEnabled: true }) }), 'endsRec');
    }],
    ['18. complete artificial checklist => READY_BUT_NOT_ACTIVATED, never activated', () => {
        const r = activation(mockInput());
        assert.strictEqual(r.ready, true, JSON.stringify(r.blockers));
        assert.strictEqual(r.decision, 'READY_BUT_NOT_ACTIVATED');
        assert.strictEqual(r.activationAllowedNow, false, 'activationAllowedNow must STILL be false');
        assert.strictEqual(r.notForProductionActivation, true, 'notForProductionActivation must STILL be true');
        assert.strictEqual(r.blockers.length, 0);
        assert.ok(Array.isArray(r.warnings) && r.warnings.join(' ').indexOf('separate') !== -1,
            'warnings must point to a separate guarded activation task');
        assert.ok(Array.isArray(r.checklist) && r.checklist.length >= 6, 'checklist items present');
        for (const c of r.checklist) {
            assert.ok(typeof c.id === 'string' && typeof c.label === 'string' && typeof c.severity === 'string');
            assert.strictEqual(c.ready, true);
            assert.ok(Array.isArray(c.reasons) && c.reasons.length === 0);
        }
        assert.strictEqual(r.importReadiness.ready, true);
        // missing runtime flag field => not ready (flags must be explicit)
        const noFlag = mockFlags(); delete noFlag.endsRecEnabled;
        notReady(mockInput({ runtimeFlags: noFlag }), 'missing runtime flag');
    }],
    ['19. calculateProtocol behavior preserved', () => {
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
        // hasBrandRuleMatrix stays hardcoded false in source
        assert.ok(/const hasBrandRuleMatrix = false;/.test(CORE), 'hasBrandRuleMatrix must stay hardcoded false');
        // calculateProtocol never calls the activation helper
        const proto = CORE.slice(CORE.indexOf('function calculateProtocol'));
        assert.ok(proto.indexOf('getBrandMatrixActivationPreconditions') === -1,
            'calculateProtocol must not call the activation checklist');
    }],
    ['20. helper purity: input not mutated', () => {
        for (const input of [
            mockInput(),
            mockInput({ importPayload: mockPackage({ sourceName: 'todo' }) }),
            mockInput({ runtimeFlags: mockFlags({ hasBrandRuleMatrix: true, productionThreeZoneEnabled: true }) })
        ]) {
            const before = JSON.stringify(input);
            activation(input);
            assert.strictEqual(JSON.stringify(input), before, 'getBrandMatrixActivationPreconditions must not mutate input');
        }
    }],
    ['21. fixtures artificial only; non-TEST identifiers and formula markers rejected', () => {
        const fixtureJson = JSON.stringify(mockInput());
        assert.ok(/TEST_BRAND_ID/.test(fixtureJson) && /TEST_REQUESTER/.test(fixtureJson) && /TEST_REVIEWER/.test(fixtureJson),
            'fixtures must be clearly artificial (TEST_*)');
        // every brand/line identifier in fixtures carries the TEST_ prefix
        const input = mockInput();
        for (const id of [].concat(
            input.activationRequest.activationScope.allowedBrandIds,
            input.activationRequest.activationScope.allowedLineIds,
            input.importPayload.entries.map((e) => e.brandId),
            input.importPayload.entries.map((e) => e.lineId)
        )) {
            assert.ok(id.indexOf('TEST_') === 0, 'fixture identifier must be TEST_-prefixed: ' + id);
        }
        assert.ok(!/fakeFormula|fake_formula|formulaOverride|hardcodedFormula/.test(fixtureJson),
            'no fake formula markers in fixtures');
        // the gate rejects non-TEST identifiers (treated as potential real brand data)
        notReady(mockInput({ activationRequest: mockRequest({ activationScope: {
            allowedBrandIds: ['external_brand_line_01'], allowedLineIds: ['TEST_LINE_ID'], allowedProcessCategories: ['permanent']
        } }) }), 'non-TEST identifier');
        notReady(mockInput({ importPayload: mockPackage({}, [mockEntry({ brandId: 'ExternalBrandId' })]) }), 'non-TEST identifier');
        // the gate rejects fake-formula markers and formula-like free text
        notReady(mockInput({ activationRequest: mockRequest({ sourceAuditSummary: 'TEST_AUDIT with fakeFormula marker inside' }) }), 'fake formula marker');
        notReady(mockInput({ activationRequest: mockRequest({ sourceAuditSummary: 'TEST_AUDIT uses 6% developer at 1:2' }) }), 'formula-like marker');
        notReady(mockInput({ activationRequest: mockRequest({ rollbackPlan: 'TEST_ROLLBACK_PLAN revert recipe output to manual review' }) }), 'formula-like marker');
    }],
    ['22. docs: activation checklist documented, activation remains disabled', () => {
        const lim = fs.readFileSync('./docs/known-limitations-contract.md', 'utf8');
        assert.ok(/activation preconditions/i.test(lim), 'known-limitations must document the activation preconditions checklist');
        assert.ok(/READY_BUT_NOT_ACTIVATED/.test(lim), 'known-limitations must document the READY_BUT_NOT_ACTIVATED decision');
        const idx = fs.readFileSync('./docs/production-readiness-index.md', 'utf8');
        assert.ok(/hasBrandRuleMatrix/.test(idx) || /brand matrix is NOT enabled/.test(idx), 'index states brand matrix disabled');
        assert.ok(/activation preconditions/i.test(idx), 'index must mention the activation preconditions checklist');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- BRAND MATRIX ACTIVATION CONTRACT GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW brand matrix activation contract test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW brand matrix activation contract test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
