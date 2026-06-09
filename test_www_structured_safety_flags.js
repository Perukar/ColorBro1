'use strict';

/**
 * test_www_structured_safety_flags.js
 *
 * STRUCTURED SAFETY FLAGS CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Locks the refactor that moved powder / Special Blond / toning / grey-.00 /
 * high-oxidizer safety gates OFF fragile display-text markers and ONTO trusted
 * internal recipe metadata (recipe.meta, set by buildRecipeMeta/withMeta at the
 * formula-assembly branch).
 *
 * Method: load the REAL ./www/core.js, and for the robustness groups create an
 * IN-MEMORY mutated copy of the source where a display label (recipe.process /
 * recipe.dye / recipe.ox) is renamed. The repo file is NEVER modified. If a gate
 * still fires after the display label is renamed, the gate is driven by the
 * structured flag, not the text — which is the property under test.
 *
 * Pre-refactor regression this guards against (proven by audit): renaming the
 * powder process label flipped a clean 5->9 bleach from MANUAL_REQUIRED to
 * APPROVED with exact grams.
 *
 * No browser, no framework. Read-only against core.js.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function loadCore() { return fs.readFileSync('./www/core.js', 'utf8'); }
const CORE = loadCore();

function makeFixture(overrides) {
    return Object.assign({
        history: 'натуральні', condition: 'здоровые', root_condition: 'здоровий корінь',
        length_condition: 'здорове полотно', porosity: 'нормальна пористість',
        thickness: 'средние', density: 'средние', length: 'средние',
        grey_percent: '0', grey_type: 'мягкая', root_level: '7', root_length: '1',
        length_level: '7', ends_level: '', ends_condition: '', ends_history: '',
        ends_base_type: '', base_type: 'Натуральна', target_level: '7',
        target_direction: '1', elasticity: 'нормальна еластичність',
        allergy: 'no', scalp_sensitivity: 'normal'
    }, overrides || {});
}

function runProtocol(code, values) {
    const requested = [];
    let out = '';
    const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    const sb = {
        console, localStorage: storage, sessionStorage: storage,
        document: { getElementById(id) {
            requested.push(id);
            if (id === 'output') return { set innerHTML(v) { out = v; }, get innerHTML() { return out; } };
            return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
        } }
    };
    vm.createContext(sb);
    vm.runInContext(code + '\ncalculateProtocol();', sb);
    return out;
}
const getOutputHtml = (code, values) => runProtocol(code, values);
const status = (html) => { const m = html.match(/status-header"><h2>([^<]*)<\/h2>/); return m ? m[1].trim() : ''; };
const assertIncludes = (h, s, m) => assert.ok(h.includes(s), (m || 'missing') + ': ' + s);
const assertNotIncludes = (h, s, m) => assert.ok(!h.includes(s), (m || 'forbidden') + ': ' + s);
function assertNoExactGrams(h, ctx) {
    assert.ok(!/Маса:<\/b>\s*\d/.test(h), (ctx || '') + ' must not expose exact grams');
    assertNotIncludes(h, 'dyeMass', ctx); assertNotIncludes(h, 'oxidizerMass', ctx);
}
function assertNoApproved(h, ctx) {
    assertNotIncludes(h, 'approved-recipe', (ctx || '') + ' must not render approved recipe');
}
function assertManualOrBlocked(h, ctx) {
    const st = status(h);
    assert.ok(/MANUAL_REQUIRED|BLOCKED/.test(st), (ctx || '') + ' must be MANUAL/BLOCKED, got: ' + st);
}
const mutate = (from, to) => { const m = CORE.split(from).join(to); assert.notStrictEqual(m, CORE, 'mutation no-op: ' + from); return m; };

// scenarios
const POWDER = makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' });
const TONING = makeFixture({ root_level: '8', length_level: '8', target_level: '6', target_direction: '1' });
const SB = makeFixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' });
const GREY = makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50', grey_type: 'мягкая' });
const META_FIELDS = ['"meta"', 'isPowder', 'isToning', 'isSpecialBlond', 'usesDoubleNaturalBase', 'requiresBrandRuleMatrix', 'oxidizerPercent', 'processCategory', 'safetyMarkersVersion'];

const GROUPS = [
    ['1. meta exists on approved clean path (no leak, behavior preserved)', function () {
        const h = getOutputHtml(CORE, makeFixture());
        assert.strictEqual(status(h).split(' ')[0], 'APPROVED', 'clean 7->7 must be APPROVED');
        assertIncludes(h, 'approved-recipe', 'clean approved must render recipe');
        assert.ok(/Маса:<\/b>\s*\d/.test(h), 'approved path may show grams');
        for (const f of META_FIELDS) assertNotIncludes(h, f, 'meta must not leak (clean)');
    }],

    ['2. powder gate structured (rename label, gate holds)', function () {
        assertManualOrBlocked(getOutputHtml(CORE, POWDER), 'powder normal');
        assertNoApproved(getOutputHtml(CORE, POWDER), 'powder normal');
        const MUT = mutate('process: "Порошок"', 'process: "Lightener"');
        const h = getOutputHtml(MUT, POWDER);
        assertManualOrBlocked(h, 'powder renamed');
        assertNoApproved(h, 'powder renamed');
        assertNoExactGrams(h, 'powder renamed');
        assertIncludes(h, 'Brand rule matrix', 'powder renamed must still cite brand gate via meta.isPowder');
    }],

    ['3. powder surcharge structured (safety outcome holds on label rename)', function () {
        // The powder mass surcharge condition and the powder brand gate both key on
        // the SAME structured flag (meta.isPowder). Renaming the display label must
        // not let a powder/bleach scenario reach an executable approved recipe or
        // expose exact recipe grams. (calcMixtone/timing keep a separate text-marker
        // dependence, but those are diagnostic/advisory and never emit approved grams.)
        const MUT = mutate('process: "Порошок"', 'process: "Lightener"');
        const h = getOutputHtml(MUT, POWDER);
        assertManualOrBlocked(h, 'powder renamed (surcharge sibling)');
        assertNoApproved(h, 'powder renamed (surcharge sibling)');
        assertNoExactGrams(h, 'powder renamed (surcharge sibling)');
        assertIncludes(h, 'Brand rule matrix', 'powder renamed must still gate via meta.isPowder');
    }],

    ['4. grey double-natural structured (.00 dye rename, gate holds)', function () {
        assertManualOrBlocked(getOutputHtml(CORE, GREY), 'grey normal');
        assertNoApproved(getOutputHtml(CORE, GREY), 'grey normal');
        // Rename the injected ".00" base dye text so the text fallback cannot match.
        const MUT = mutate('${dLevel}.00</b>', '${dLevel}.zz</b>');
        const h = getOutputHtml(MUT, GREY);
        assertManualOrBlocked(h, 'grey renamed');
        assertNoApproved(h, 'grey renamed');
        assertNoExactGrams(h, 'grey renamed');
        assertIncludes(h, 'Brand rule matrix', 'grey renamed must still cite brand gate via meta.usesDoubleNaturalBase');
    }],

    ['5. toning structured (rename label, gate holds)', function () {
        assertManualOrBlocked(getOutputHtml(CORE, TONING), 'toning normal');
        const MUT = mutate('"Перманент / Тонування"', '"Refresh"');
        const h = getOutputHtml(MUT, TONING);
        assertManualOrBlocked(h, 'toning renamed');
        assertNoApproved(h, 'toning renamed');
        assertNoExactGrams(h, 'toning renamed');
        assertIncludes(h, 'Brand rule matrix', 'toning renamed must still cite brand gate via meta.isToning');
    }],

    ['6. special blond structured (rename label, gate holds; numeric net remains)', function () {
        assertManualOrBlocked(getOutputHtml(CORE, SB), 'SB normal');
        const MUT = mutate('process: "Special Blond"', 'process: "Lift System"');
        const h = getOutputHtml(MUT, SB);
        assertManualOrBlocked(h, 'SB renamed');
        assertNoApproved(h, 'SB renamed');
        assertNoExactGrams(h, 'SB renamed');
        assertIncludes(h, 'Brand rule matrix', 'SB renamed must still cite brand gate');
    }],

    ['7. high oxidizer structured (ox display rename, meta holds; no false positive)', function () {
        // Rename the "12%" display string; meta.oxidizerPercent stays 12 → gate holds.
        const MUT = mutate('ox: "12%"', 'ox: "vol40"');
        const h = getOutputHtml(MUT, SB);
        assertManualOrBlocked(h, 'high-ox renamed');
        assertNoApproved(h, 'high-ox renamed');
        // Negative: a clean 6% permanent (oxidizerPercent < 9) must not be high-ox blocked.
        const clean = getOutputHtml(CORE, makeFixture());
        assert.strictEqual(status(clean).split(' ')[0], 'APPROVED', 'low-ox clean path must stay APPROVED (no high-ox false positive)');
    }],

    ['8. user-injected meta/brand ignored', function () {
        const injected = makeFixture({ meta: 'x', isPowder: 'true', isToning: 'true', isSpecialBlond: 'true', brand: 'Matrix', productLine: "L'Oréal Majirel", brandRuleMatrix: '{"ready":true}' });
        const h = getOutputHtml(CORE, injected);
        // Same as clean 7->7: injection ignored, still APPROVED via generic rules, no brand claim.
        assert.strictEqual(status(h).split(' ')[0], 'APPROVED', 'injected meta must not flip status');
        assertNotIncludes(h, 'Brand rule matrix', 'injected brand must not trigger brand gate');
        for (const f of META_FIELDS) assertNotIncludes(h, f, 'injected meta must not leak');
        // injected field ids must not even be read by calculateProtocol
        const req = [];
        const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        const sb = { console, localStorage: storage, sessionStorage: storage, document: { getElementById(id) { req.push(id); if (id === 'output') return { set innerHTML(v) {}, get innerHTML() { return ''; } }; return { value: injected[id] ?? '' }; } } };
        vm.createContext(sb); vm.runInContext(CORE + '\ncalculateProtocol();', sb);
        for (const f of ['meta', 'isPowder', 'isToning', 'isSpecialBlond', 'brand', 'productLine', 'brandRuleMatrix']) {
            assert.ok(!req.includes(f), 'calculateProtocol must not read injected field: ' + f);
        }
    }],

    ['9. render does not leak meta (APPROVED/BLOCKED/MANUAL)', function () {
        const states = [
            getOutputHtml(CORE, makeFixture()),                                   // APPROVED
            getOutputHtml(CORE, makeFixture({ allergy: 'yes' })),                  // BLOCKED
            getOutputHtml(CORE, makeFixture({ allergy: '' })),                     // MANUAL
            getOutputHtml(CORE, POWDER), getOutputHtml(CORE, SB), getOutputHtml(CORE, TONING)
        ];
        for (const h of states) for (const f of META_FIELDS) assertNotIncludes(h, f, 'meta must not leak');
    }],

    ['10. fallback is not the primary protection (meta drives current builder)', function () {
        // For powder/toning/SB the current builder attaches meta; renaming the display
        // label removes the text-marker match yet the gate still fires (groups 2/5/6).
        // Assert explicitly that with BOTH the powder text marker gone, protection holds —
        // i.e. the legacy text fallback is not what is protecting the current path.
        const MUT = mutate('process: "Порошок"', 'process: "Lightener"');
        const h = getOutputHtml(MUT, POWDER);
        assert.ok(!/powder|порошок|порош/i.test((h.match(/recipe[\s\S]*?<\/div>/) || [''])[0]),
            'sanity: renamed scenario has no powder text marker in any rendered recipe');
        assertManualOrBlocked(h, 'powder protected without text marker');
        assertNoExactGrams(h, 'powder protected without text marker');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- STRUCTURED SAFETY FLAGS GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW structured safety flags test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW structured safety flags test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
