'use strict';

/**
 * test_www_brand_matrix_activation_dry_run_contract.js
 *
 * BRAND MATRIX ACTIVATION DRY-RUN AUDIT LOG CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Diagnostic-only contract for the question: "What would happen if Brand
 * Matrix activation was evaluated now?" The answer must remain: activation is
 * NOT allowed; production activation is DISABLED. Proves:
 *   - getBrandMatrixActivationDryRunAudit() requires a valid dry-run context
 *     (contractType, schemaVersion, dryRunId, requestedBy, requestedAt,
 *     environment, reason) and reuses getBrandMatrixActivationPreconditions(),
 *   - environment "production" is ALWAYS rejected; only test/local/staging/
 *     review are allowed,
 *   - the best possible decision is DRY_RUN_REVIEW_ONLY — never an activation;
 *     activationAllowedNow ALWAYS false; notForProductionActivation ALWAYS
 *     true; dryRunOnly ALWAYS true,
 *   - the audit log carries all 10 required event categories and NO recipe
 *     content, NO exact masses, NO mixing proportions, NO timing instructions,
 *   - hasBrandRuleMatrix stays false; calculateProtocol behavior unchanged,
 *   - helper is pure (input never mutated); no persistence/network in the
 *     dry-run helper area; fixtures are artificial (TEST_* prefix only).
 *
 * Pure Node.js + vm against the real ./www/core.js. No browser, no framework,
 * no network, no persistence.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const CORE = fs.readFileSync('./www/core.js', 'utf8');
const SELF = fs.readFileSync(__filename, 'utf8');
const sb = { console };
vm.createContext(sb);
vm.runInContext(CORE, sb);

function dryRun(input) {
    sb.__I = input;
    vm.runInContext('globalThis.__R = JSON.stringify(getBrandMatrixActivationDryRunAudit(__I));', sb);
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
function mockContext(over) {
    return Object.assign({
        contractType: 'brandMatrixActivationDryRun',
        schemaVersion: 1,
        dryRunId: 'TEST_DRY_RUN_ID',
        requestedBy: 'TEST_REQUESTER',
        requestedAt: '2026-06-11T00:00:00Z',
        environment: 'test',
        reason: 'TEST_DRY_RUN_REASON: diagnostic audit of activation readiness state.'
    }, over || {});
}
function mockInput(over) {
    return Object.assign({
        importPayload: mockPackage(),
        activationRequest: mockRequest(),
        runtimeFlags: mockFlags(),
        dryRunContext: mockContext()
    }, over || {});
}
function invariants(r) {
    assert.strictEqual(r.contractType, 'brandMatrixActivationDryRunAudit');
    assert.strictEqual(r.schemaVersion, 1);
    assert.strictEqual(r.activationAllowedNow, false, 'activationAllowedNow must stay false');
    assert.strictEqual(r.notForProductionActivation, true, 'notForProductionActivation must stay true');
    assert.strictEqual(r.dryRunOnly, true, 'dryRunOnly must stay true');
    assert.strictEqual(r.summary.activationAllowedNow, false, 'summary.activationAllowedNow must stay false');
    assert.ok(['DRY_RUN_BLOCKED', 'DRY_RUN_REVIEW_ONLY'].indexOf(r.decision) !== -1,
        'decision must be a dry-run decision: ' + String(r.decision));
    const json = JSON.stringify(r);
    assert.ok(json.indexOf('READY_FOR_PRODUCTION') === -1, 'must never return READY_FOR_PRODUCTION');
    assert.ok(json.indexOf('ACTIVATED"') === -1 || json.indexOf('READY_BUT_NOT_ACTIVATED') !== -1,
        'no standalone ACTIVATED decision');
    assert.ok(r.decision !== 'ACTIVATED', 'must never return ACTIVATED');
    return r;
}
function blocked(input, needle) {
    const r = dryRun(input);
    invariants(r);
    assert.strictEqual(r.decision, 'DRY_RUN_BLOCKED', 'must be DRY_RUN_BLOCKED; blockers: ' + JSON.stringify(r.blockers));
    assert.strictEqual(r.ready, false, 'ready must be false when blocked');
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

const REQUIRED_EVENT_IDS = [
    'dry_run_import_readiness_evaluated',
    'dry_run_provenance_sanity_acknowledged',
    'dry_run_activation_preconditions_evaluated',
    'dry_run_human_review_evaluated',
    'dry_run_activation_scope_evaluated',
    'dry_run_test_evidence_evaluated',
    'dry_run_runtime_flags_evaluated',
    'dry_run_production_blockers_evaluated',
    'dry_run_calculate_protocol_isolation_verified',
    'dry_run_final_decision_recorded'
];

const GROUPS = [
    ['1. null/non-object input => dry-run blocked', () => {
        for (const bad of [null, undefined, 42, 'x', [], true]) {
            const r = blocked(bad, 'dryRunContext');
            assert.ok(r.missingFields.indexOf('dryRunContext') !== -1, 'missingFields must include dryRunContext');
            assert.strictEqual(r.dryRunId, null);
            assert.strictEqual(r.environment, null);
        }
    }],
    ['2. missing dryRunContext => dry-run blocked', () => {
        const input = mockInput();
        delete input.dryRunContext;
        const r = blocked(input, 'dryRunContext');
        assert.ok(r.missingFields.indexOf('dryRunContext') !== -1);
        blocked(mockInput({ dryRunContext: 'audit please' }), 'not an object');
        blocked(mockInput({ dryRunContext: ['TEST_DRY_RUN_ID'] }), 'not an object');
    }],
    ['3. invalid dryRunContext contractType => dry-run blocked', () => {
        blocked(mockInput({ dryRunContext: mockContext({ contractType: 'brandMatrixActivationRequest' }) }),
            'contractType must be "brandMatrixActivationDryRun"');
        blocked(mockInput({ dryRunContext: mockContext({ contractType: 'wrong' }) }), 'contractType');
    }],
    ['4. invalid schemaVersion => dry-run blocked', () => {
        blocked(mockInput({ dryRunContext: mockContext({ schemaVersion: 2 }) }), 'unsupported schemaVersion');
        blocked(mockInput({ dryRunContext: mockContext({ schemaVersion: '1' }) }), 'unsupported schemaVersion');
    }],
    ['5. missing dryRunId/requestedBy/reason => dry-run blocked', () => {
        for (const f of ['dryRunId', 'requestedBy', 'reason']) {
            const ctx = mockContext();
            delete ctx[f];
            const r = blocked(mockInput({ dryRunContext: ctx }), f);
            assert.ok(r.missingFields.indexOf('dryRunContext.' + f) !== -1,
                'missingFields must include dryRunContext.' + f);
        }
        // placeholder values rejected too
        blocked(mockInput({ dryRunContext: mockContext({ dryRunId: 'todo' }) }), 'placeholder');
        blocked(mockInput({ dryRunContext: mockContext({ requestedBy: '' }) }), 'requestedBy');
        blocked(mockInput({ dryRunContext: mockContext({ reason: 'tbd' }) }), 'placeholder');
    }],
    ['6. invalid requestedAt => dry-run blocked', () => {
        blocked(mockInput({ dryRunContext: mockContext({ requestedAt: 'not-a-date' }) }), 'requestedAt');
        blocked(mockInput({ dryRunContext: mockContext({ requestedAt: '11.06.2026' }) }), 'requestedAt');
    }],
    ['7. production environment => dry-run blocked; unknown environment blocked too', () => {
        const r = blocked(mockInput({ dryRunContext: mockContext({ environment: 'production' }) }), 'production');
        assert.strictEqual(r.environment, 'production', 'environment is echoed for the audit trail');
        assert.strictEqual(r.ready, false);
        blocked(mockInput({ dryRunContext: mockContext({ environment: 'prod' }) }), 'must be one of');
        blocked(mockInput({ dryRunContext: mockContext({ environment: 'PRODUCTION' }) }), 'must be one of');
        // all allowed environments accepted (with full valid package => review only)
        for (const env of ['test', 'local', 'staging', 'review']) {
            const ok = dryRun(mockInput({ dryRunContext: mockContext({ environment: env }) }));
            assert.strictEqual(ok.decision, 'DRY_RUN_REVIEW_ONLY', env + ' must be allowed: ' + JSON.stringify(ok.blockers));
            assert.strictEqual(ok.environment, env);
        }
    }],
    ['8. invalid importPayload => dry-run blocked', () => {
        blocked(mockInput({ importPayload: { contractType: 'wrong' } }), 'import_readiness');
        blocked(mockInput({ importPayload: mockPackage({ sourceName: 'todo' }) }), 'import_readiness');
        blocked(mockInput({ importPayload: null }), 'import_readiness');
    }],
    ['9. valid import but missing activationRequest => dry-run blocked', () => {
        const input = mockInput();
        delete input.activationRequest;
        const r = blocked(input, 'activation_request_shape');
        assert.strictEqual(r.summary.importReady, true, 'import package itself must be import-ready');
        assert.ok(r.missingFields.indexOf('activationRequest') !== -1);
    }],
    ['10. complete artificial TEST package => DRY_RUN_REVIEW_ONLY, not activated', () => {
        const r = invariants(dryRun(mockInput()));
        assert.strictEqual(r.decision, 'DRY_RUN_REVIEW_ONLY', JSON.stringify(r.blockers));
        assert.strictEqual(r.ready, true, 'ready means "dry-run report generated", NOT production-ready');
        assert.strictEqual(r.blockers.length, 0);
        assert.strictEqual(r.dryRunId, 'TEST_DRY_RUN_ID');
        assert.strictEqual(r.environment, 'test');
        assert.strictEqual(r.preconditions.decision, 'READY_BUT_NOT_ACTIVATED',
            'preconditions stay READY_BUT_NOT_ACTIVATED — dry-run never upgrades them');
        assert.strictEqual(r.summary.importReady, true);
        assert.strictEqual(r.summary.activationPreconditionsReady, true);
        assert.strictEqual(r.summary.hasBrandRuleMatrix, false);
        assert.strictEqual(r.summary.calculateProtocolWiredToBrandMatrix, false);
        assert.strictEqual(r.summary.brandFormulaOutputEnabled, false);
        assert.ok(r.warnings.join(' ').indexOf('separate') !== -1,
            'warnings must point to a separate guarded activation task');
        const final = r.auditEvents[r.auditEvents.length - 1];
        assert.strictEqual(final.id, 'dry_run_final_decision_recorded');
        assert.strictEqual(final.type, 'decision');
        assert.strictEqual(final.status, 'review_only');
    }],
    ['11. activationAllowedNow remains false even when checklist is complete', () => {
        const r = dryRun(mockInput());
        assert.strictEqual(r.decision, 'DRY_RUN_REVIEW_ONLY');
        assert.strictEqual(r.activationAllowedNow, false);
        assert.strictEqual(r.summary.activationAllowedNow, false);
        assert.strictEqual(r.preconditions.activationAllowedNow, false);
    }],
    ['12. notForProductionActivation remains true always', () => {
        for (const input of [null, mockInput(), mockInput({ dryRunContext: mockContext({ environment: 'production' }) })]) {
            const r = dryRun(input);
            assert.strictEqual(r.notForProductionActivation, true);
            assert.strictEqual(r.preconditions.notForProductionActivation, true);
        }
    }],
    ['13. dryRunOnly remains true always', () => {
        for (const input of [null, mockInput(), mockInput({ runtimeFlags: mockFlags({ hasBrandRuleMatrix: true }) })]) {
            assert.strictEqual(dryRun(input).dryRunOnly, true);
        }
    }],
    ['14. hasBrandRuleMatrix true in runtimeFlags => blocked', () => {
        const r = blocked(mockInput({ runtimeFlags: mockFlags({ hasBrandRuleMatrix: true }) }), 'runtime_flags');
        assert.strictEqual(r.summary.hasBrandRuleMatrix, true, 'summary reports the observed flag');
        const iso = r.auditEvents.find((e) => e.id === 'dry_run_calculate_protocol_isolation_verified');
        assert.strictEqual(iso.status, 'fail', 'isolation event must fail when a brand flag claims active');
    }],
    ['15. calculateProtocolWiredToBrandMatrix true => blocked', () => {
        const r = blocked(mockInput({ runtimeFlags: mockFlags({ calculateProtocolWiredToBrandMatrix: true }) }), 'runtime_flags');
        assert.strictEqual(r.summary.calculateProtocolWiredToBrandMatrix, true);
        assert.strictEqual(r.auditEvents.find((e) => e.id === 'dry_run_calculate_protocol_isolation_verified').status, 'fail');
    }],
    ['16. brandFormulaOutputEnabled true => blocked', () => {
        const r = blocked(mockInput({ runtimeFlags: mockFlags({ brandFormulaOutputEnabled: true }) }), 'runtime_flags');
        assert.strictEqual(r.summary.brandFormulaOutputEnabled, true);
        assert.strictEqual(r.auditEvents.find((e) => e.id === 'dry_run_calculate_protocol_isolation_verified').status, 'fail');
    }],
    ['17. auditEvents include all 10 required event categories', () => {
        for (const input of [null, mockInput(), mockInput({ importPayload: null })]) {
            const r = dryRun(input);
            assert.strictEqual(r.auditEvents.length, 10, 'exactly 10 audit events');
            const ids = r.auditEvents.map((e) => e.id);
            for (const id of REQUIRED_EVENT_IDS) {
                assert.ok(ids.indexOf(id) !== -1, 'audit log must include event: ' + id);
            }
            for (const e of r.auditEvents) {
                assert.ok(['check', 'blocker', 'warning', 'decision'].indexOf(e.type) !== -1, 'valid type: ' + e.type);
                assert.ok(['info', 'warning', 'critical'].indexOf(e.severity) !== -1, 'valid severity: ' + e.severity);
                assert.ok(['pass', 'fail', 'blocked', 'review_only'].indexOf(e.status) !== -1, 'valid status: ' + e.status);
                assert.ok(typeof e.message === 'string' && e.message.length > 0, 'message present');
                assert.ok(['import_readiness', 'activation_preconditions', 'runtime_flags', 'dry_run_contract'].indexOf(e.source) !== -1,
                    'stable source label: ' + e.source);
            }
        }
    }],
    ['18. auditEvents contain no formula markers', () => {
        const WORD_MARKERS = ['grams', 'gram', 'ml', 'developer', 'oxidizer'];
        const SUBSTRING_MARKERS = ['mix ratio', '1:1', '1:2', '1:3', '%'];
        for (const input of [null, mockInput(), mockInput({ importPayload: mockPackage({}, [mockEntry({ mixRatio: 'bad' })]) }),
                             mockInput({ runtimeFlags: mockFlags({ hasBrandRuleMatrix: true, productionThreeZoneEnabled: true }) })]) {
            const r = dryRun(input);
            const text = JSON.stringify(r.auditEvents).toLowerCase();
            for (const m of SUBSTRING_MARKERS) {
                assert.ok(text.indexOf(m) === -1, 'audit events must not contain "' + m + '": ' + text);
            }
            const tokens = text.split(/[^a-z0-9]+/);
            for (const m of WORD_MARKERS) {
                assert.ok(tokens.indexOf(m) === -1, 'audit events must not contain the word "' + m + '"');
            }
            // top-level dry-run blockers/warnings are audit-safe summaries too
            const meta = JSON.stringify(r.warnings).toLowerCase();
            for (const m of SUBSTRING_MARKERS) {
                assert.ok(meta.indexOf(m) === -1, 'warnings must not contain "' + m + '"');
            }
        }
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
        // calculateProtocol never calls the dry-run helper or the checklist
        const proto = CORE.slice(CORE.indexOf('function calculateProtocol'));
        assert.ok(proto.indexOf('getBrandMatrixActivationDryRunAudit') === -1,
            'calculateProtocol must not call the dry-run audit helper');
        assert.ok(proto.indexOf('getBrandMatrixActivationPreconditions') === -1,
            'calculateProtocol must not call the activation checklist');
        // the dry-run helper never calls calculateProtocol
        const helperArea = CORE.slice(
            CORE.indexOf('BRAND MATRIX ACTIVATION DRY-RUN AUDIT LOG CONTRACT v1'),
            CORE.indexOf('END BRAND MATRIX DRY-RUN AUDIT'));
        assert.ok(helperArea.length > 0, 'dry-run helper area must exist in core.js');
        assert.ok(helperArea.indexOf('calculateProtocol(') === -1,
            'dry-run helper must never CALL calculateProtocol');
    }],
    ['20. helper purity: input not mutated', () => {
        for (const input of [
            mockInput(),
            mockInput({ dryRunContext: mockContext({ environment: 'production' }) }),
            mockInput({ importPayload: mockPackage({ sourceName: 'todo' }) }),
            mockInput({ runtimeFlags: mockFlags({ hasBrandRuleMatrix: true, productionThreeZoneEnabled: true }) })
        ]) {
            const before = JSON.stringify(input);
            dryRun(input);
            assert.strictEqual(JSON.stringify(input), before, 'getBrandMatrixActivationDryRunAudit must not mutate input');
        }
    }],
    ['21. no persistence/network in the dry-run helper area', () => {
        const helperArea = CORE.slice(
            CORE.indexOf('BRAND MATRIX ACTIVATION DRY-RUN AUDIT LOG CONTRACT v1'),
            CORE.indexOf('END BRAND MATRIX DRY-RUN AUDIT'));
        assert.ok(helperArea.length > 0, 'dry-run helper area must exist');
        for (const banned of ['localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', 'writeFile', 'indexedDB', 'WebSocket']) {
            assert.ok(helperArea.indexOf(banned) === -1,
                'dry-run helper area must not contain "' + banned + '"');
        }
    }],
    ['22. no encoding-trick markers in core or dry-run test file', () => {
        // Patterns assembled from fragments so this scan does not flag itself.
        const MARKERS = [
            'from' + 'Char' + 'Code',
            'from' + 'Code' + 'Point',
            'char' + 'Code',
            'obfu' + 'sc',
            'code' + 'Point'
        ].map((m) => m.toLowerCase());
        for (const [label, src] of [['www/core.js', CORE], ['dry-run test file', SELF]]) {
            const lowered = src.toLowerCase();
            for (const m of MARKERS) {
                assert.ok(lowered.indexOf(m) === -1, label + ' must not contain marker "' + m + '"');
            }
        }
    }],
    ['23. fixtures artificial only; no real brand identifiers; no formula-like recipes', () => {
        const fixtureJson = JSON.stringify(mockInput());
        assert.ok(/TEST_BRAND_ID/.test(fixtureJson) && /TEST_REQUESTER/.test(fixtureJson)
            && /TEST_REVIEWER/.test(fixtureJson) && /TEST_DRY_RUN_ID/.test(fixtureJson),
            'fixtures must be clearly artificial (TEST_*)');
        const input = mockInput();
        for (const id of [].concat(
            input.activationRequest.activationScope.allowedBrandIds,
            input.activationRequest.activationScope.allowedLineIds,
            input.importPayload.entries.map((e) => e.brandId),
            input.importPayload.entries.map((e) => e.lineId),
            [input.dryRunContext.dryRunId]
        )) {
            assert.ok(id.indexOf('TEST_') === 0, 'fixture identifier must be TEST_-prefixed: ' + id);
        }
        assert.ok(!/fakeFormula|fake_formula|formulaOverride|hardcodedFormula/.test(fixtureJson),
            'no fake formula markers in fixtures');
        // non-TEST identifiers are still rejected end-to-end through the dry-run
        blocked(mockInput({ activationRequest: mockRequest({ activationScope: {
            allowedBrandIds: ['external_brand_line_01'], allowedLineIds: ['TEST_LINE_ID'], allowedProcessCategories: ['permanent']
        } }) }), 'production_blockers');
        blocked(mockInput({ importPayload: mockPackage({}, [mockEntry({ brandId: 'ExternalBrandId' })]) }), 'production_blockers');
    }],
    ['24. docs consistency: dry-run audit documented as diagnostic-only', () => {
        const lim = fs.readFileSync('./docs/known-limitations-contract.md', 'utf8');
        assert.ok(/dry-run audit/i.test(lim), 'known-limitations must document the dry-run audit log');
        assert.ok(/DRY_RUN_REVIEW_ONLY/.test(lim), 'known-limitations must document the DRY_RUN_REVIEW_ONLY decision');
        assert.ok(/DRY_RUN_BLOCKED/.test(lim), 'known-limitations must document the DRY_RUN_BLOCKED decision');
        assert.ok(/diagnostic[- ]only/i.test(lim), 'known-limitations must state diagnostic-only');
        const idx = fs.readFileSync('./docs/production-readiness-index.md', 'utf8');
        assert.ok(/dry-run audit/i.test(idx), 'index must mention the dry-run audit log');
        assert.ok(/hasBrandRuleMatrix/.test(idx) || /brand matrix is NOT enabled/.test(idx), 'index states brand matrix disabled');
        const state = fs.readFileSync('./PROJECT_STATE.md', 'utf8');
        assert.ok(/dry-run audit/i.test(state), 'PROJECT_STATE must mention the dry-run audit log');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- BRAND MATRIX ACTIVATION DRY-RUN CONTRACT GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW brand matrix activation dry-run contract test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW brand matrix activation dry-run contract test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
