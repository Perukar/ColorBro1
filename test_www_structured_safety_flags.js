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

function mixtoneBlock(html) { const m = html.match(/<h3>Мікстони<\/h3><pre>([\s\S]*?)<\/pre>/); return m ? m[1] : ''; }
function timingTotal(html) { const m = html.match(/&quot;totalMinutes&quot;:\s*(\d+)/); return m ? Number(m[1]) : null; }

// Capture the internal rootRec/lenRec objects that calculateProtocol passes to
// buildWwwRenderState (a top-level global). VM-only wrap; the repo file is untouched.
function captureRecipes(values) {
    let out = '';
    const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    const sb = { console, localStorage: storage, sessionStorage: storage,
        document: { getElementById(id) {
            if (id === 'output') return { set innerHTML(v) { out = v; }, get innerHTML() { return out; } };
            return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
        } } };
    sb.__cap = [];
    vm.createContext(sb);
    vm.runInContext(CORE, sb);
    vm.runInContext("var __orig = buildWwwRenderState; buildWwwRenderState = function(runtime){ try { __cap.push(runtime); } catch (e) {} return __orig(runtime); };", sb);
    vm.runInContext("calculateProtocol();", sb);
    const last = sb.__cap.length ? sb.__cap[sb.__cap.length - 1] : {};
    return { rootRec: last.rootRec, lenRec: last.lenRec, html: out };
}
const META_CATS = ['permanent', 'special_blond', 'powder', 'toning', 'unknown'];
function assertValidMeta(rec, label) {
    if (rec === undefined || rec === null) return; // recipe not built on this path
    assert.strictEqual(typeof rec, 'object', label + ': recipe must be object');
    const m = rec.meta;
    assert.ok(m && typeof m === 'object', label + ': recipe.meta must exist');
    assert.strictEqual(m.safetyMarkersVersion, 1, label + ': safetyMarkersVersion must be 1');
    assert.ok(META_CATS.indexOf(m.processCategory) !== -1, label + ': bad processCategory ' + m.processCategory);
    for (const b of ['isSpecialBlond', 'isPowder', 'isToning', 'usesDoubleNaturalBase', 'requiresBrandRuleMatrix']) {
        assert.strictEqual(typeof m[b], 'boolean', label + ': ' + b + ' must be boolean');
    }
    assert.ok(m.oxidizerPercent === null || (typeof m.oxidizerPercent === 'number' && isFinite(m.oxidizerPercent)),
        label + ': oxidizerPercent must be null or finite number');
    if (m.processCategory === 'special_blond') assert.strictEqual(m.isSpecialBlond, true, label + ': SB consistency');
    if (m.processCategory === 'powder') assert.strictEqual(m.isPowder, true, label + ': powder consistency');
    if (m.processCategory === 'toning') assert.strictEqual(m.isToning, true, label + ': toning consistency');
    if (m.processCategory === 'permanent') {
        assert.strictEqual(m.isSpecialBlond, false, label + ': permanent !SB');
        assert.strictEqual(m.isPowder, false, label + ': permanent !powder');
        assert.strictEqual(m.isToning, false, label + ': permanent !toning');
    }
}

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
    }],

    ['11. mixtone uses structured process metadata (powder label rename)', function () {
        // calcMixtone returns the powder "not added" mixtone via meta.isPowder even
        // when the display process label is renamed. Use a scenario whose recipe is
        // rendered (APPROVED) so the mixtone block is visible: a clean lift that is
        // NOT brand-sensitive would be permanent; instead assert at MANUAL level the
        // mixtone block is identical regardless of label (powder mixtone is meta-driven).
        const MUT = mutate('process: "Порошок"', 'process: "Lightener"');
        // mixtone diagnostic block is present in MANUAL output (Мікстони) for powder.
        const norm = mixtoneBlock(getOutputHtml(CORE, POWDER));
        const ren = mixtoneBlock(getOutputHtml(MUT, POWDER));
        assert.ok(norm.length > 0, 'powder scenario should render a Мікстони block');
        assert.strictEqual(ren, norm, 'powder mixtone must be identical after label rename (meta.isPowder drives calcMixtone)');
        assert.ok(/Не додається/.test(norm), 'powder mixtone must be "Не додається" (neutralised)');
    }],

    ['12. timing uses structured process metadata (label rename)', function () {
        // Special Blond base-timing (50) must survive an SB label rename via meta.
        const sbNorm = getOutputHtml(CORE, SB);
        const sbMut = getOutputHtml(mutate('process: "Special Blond"', 'process: "Lift System"'), SB);
        assert.strictEqual(timingTotal(sbMut), timingTotal(sbNorm),
            'SB timing total must be unchanged by display-label rename (meta.isSpecialBlond)');
        // Toning base-timing (25) must survive a toning label rename via meta.
        const tnNorm = getOutputHtml(CORE, TONING);
        const tnMut = getOutputHtml(mutate('"Перманент / Тонування"', '"Refresh"'), TONING);
        assert.strictEqual(timingTotal(tnMut), timingTotal(tnNorm),
            'toning timing total must be unchanged by display-label rename (meta.isToning)');
        // Permanent timing (clean 7->7) is driven by meta.processCategory==='permanent'.
        assert.strictEqual(timingTotal(getOutputHtml(CORE, makeFixture())), 40 - 0,
            'clean permanent 7->7 base timing must be 40 (permanent), tMod 0');
    }],

    ['13. legacy fallback is not the primary timing/mixtone path', function () {
        // Rename ALL process display labels at once; meta must still drive timing+mixtone.
        let MUT = CORE;
        MUT = MUT.split('process: "Порошок"').join('process: "X1"');
        MUT = MUT.split('process: "Special Blond"').join('process: "X2"');
        MUT = MUT.split('"Перманент / Тонування"').join('"X3"');
        assert.notStrictEqual(MUT, CORE, 'mutation applied');
        // Special Blond timing still 50-driven (MANUAL, but timing total reflects meta)
        assert.strictEqual(timingTotal(getOutputHtml(MUT, SB)), timingTotal(getOutputHtml(CORE, SB)),
            'SB timing must hold with all process labels renamed (meta is primary)');
        // powder mixtone still neutralised
        assert.ok(/Не додається/.test(mixtoneBlock(getOutputHtml(MUT, POWDER))),
            'powder mixtone must hold with all process labels renamed (meta is primary)');
    }],

    ['14. render still does not leak meta', function () {
        const states = [
            getOutputHtml(CORE, makeFixture()), getOutputHtml(CORE, makeFixture({ allergy: 'yes' })),
            getOutputHtml(CORE, makeFixture({ allergy: '' })), getOutputHtml(CORE, POWDER),
            getOutputHtml(CORE, SB), getOutputHtml(CORE, TONING)
        ];
        for (const h of states) for (const f of META_FIELDS) assertNotIncludes(h, f, 'meta must not leak');
    }],

    ['15. behavior regression control', function () {
        assert.strictEqual(status(getOutputHtml(CORE, makeFixture())).split(' ')[0], 'APPROVED', 'clean 7->7 APPROVED');
        assertManualOrBlocked(getOutputHtml(CORE, POWDER), 'powder MANUAL'); assertNoExactGrams(getOutputHtml(CORE, POWDER), 'powder');
        assertManualOrBlocked(getOutputHtml(CORE, SB), 'SB MANUAL'); assertNoExactGrams(getOutputHtml(CORE, SB), 'SB');
        // Baseline timing total for clean 7->7 stays 40 (permanent, tMod 0) — unchanged by refactor.
        assert.strictEqual(timingTotal(getOutputHtml(CORE, makeFixture())), 40, 'baseline timing unchanged');
    }],

    ['16. grey .00 base-validity uses structured metadata (process label rename)', function () {
        // grey>=50 at 6%: brand-sensitivity fires via meta.usesDoubleNaturalBase, which is
        // set only when the grey base-validity check passes. Renaming the "Перманент"
        // display label must NOT disable it (meta.processCategory drives it).
        const GREY = makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50', grey_type: 'мягкая' });
        assertManualOrBlocked(getOutputHtml(CORE, GREY), 'grey normal');
        assertIncludes(getOutputHtml(CORE, GREY), 'Brand rule matrix', 'grey normal must cite brand gate (.00 base)');
        const MUT = mutate('process: "Перманент"', 'process: "Permanent"');
        const h = getOutputHtml(MUT, GREY);
        assertManualOrBlocked(h, 'grey perm-label renamed');
        assertNoApproved(h, 'grey perm-label renamed');
        assertNoExactGrams(h, 'grey perm-label renamed');
        assertIncludes(h, 'Brand rule matrix', 'grey brand gate must hold via meta.processCategory after label rename');
    }],

    ['17. grey ox classification uses structured oxidizer percent', function () {
        // Decorate the ox display text; meta.oxidizerPercent (6/9) must keep grey validity.
        const GREY = makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50', grey_type: 'мягкая' });
        const MUT = mutate('ox: oxChoice', 'ox: ("OX:" + oxChoice)');
        const h = getOutputHtml(MUT, GREY);
        assertManualOrBlocked(h, 'grey ox-decorated');
        assertNoApproved(h, 'grey ox-decorated');
        assertIncludes(h, 'Brand rule matrix', 'grey brand gate must hold via meta.oxidizerPercent after ox label decoration');
        for (const f of META_FIELDS) assertNotIncludes(h, f, 'grey ox-decorated meta must not leak');
    }],

    ['18. retained fallbacks (FB6/FB7) + guard remain after FB1-FB5 retirement', function () {
        // FB1-FB5 text fallbacks are retired (asserted absent in group 35). The
        // intentionally-retained fallbacks and the fail-closed guard must remain.
        assert.ok(/rootLiftProcessMarkers/.test(CORE) && /lengthLiftProcessMarkers/.test(CORE),
            'FB6 damage-lift markers must be retained');
        assert.ok(/zoneProcessesDiffer/.test(CORE), 'FB7 zoneProcessesDiffer must be retained');
        assert.ok(/function isValidRecipeMeta/.test(CORE), 'fail-closed meta guard must remain');
    }],

    ['19. behavior regression control (grey)', function () {
        const GREY = makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50', grey_type: 'мягкая' });
        const h = getOutputHtml(CORE, GREY);
        assertManualOrBlocked(h, 'grey>=50 still gated');
        assertNoExactGrams(h, 'grey>=50');
        assertIncludes(h, '.00', 'grey>=50 still injects .00 base');
        assert.strictEqual(status(getOutputHtml(CORE, makeFixture())).split(' ')[0], 'APPROVED', 'clean 7->7 APPROVED');
        // production mass model remains 2-zone in a rendered mass block (MANUAL grey shows mode 2-zone)
        assertIncludes(h, '&quot;mode&quot;: &quot;2-zone&quot;', 'mass model remains 2-zone');
    }],

    ['20. no meta leak (grey states)', function () {
        const GREY = makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50', grey_type: 'мягкая' });
        for (const h of [getOutputHtml(CORE, GREY), getOutputHtml(CORE, makeFixture()), getOutputHtml(CORE, makeFixture({ allergy: 'yes' }))]) {
            for (const f of META_FIELDS) assertNotIncludes(h, f, 'meta must not leak (grey)');
        }
    }],

    ['21. every built recipe carries valid, consistent meta (all categories)', function () {
        const cases = [
            ['permanent (clean 7->7)', makeFixture(), 'permanent', 'permanent'],
            ['special_blond (6->10)', makeFixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' }), 'special_blond', 'special_blond'],
            ['powder (5->9)', makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' }), 'powder', 'powder'],
            ['toning length (8->6)', makeFixture({ root_level: '8', length_level: '8', target_level: '6', target_direction: '1' }), null, 'toning'],
            ['grey>=50 (6->7)', makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50' }), 'permanent', 'permanent']
        ];
        for (const [label, fx, rootCat, lenCat] of cases) {
            const c = captureRecipes(fx);
            assertValidMeta(c.rootRec, label + ' root');
            assertValidMeta(c.lenRec, label + ' length');
            if (rootCat && c.rootRec) assert.strictEqual(c.rootRec.meta.processCategory, rootCat, label + ' root category');
            if (lenCat && c.lenRec) assert.strictEqual(c.lenRec.meta.processCategory, lenCat, label + ' length category');
        }
        // grey>=50 permanent recipes carry numeric oxidizerPercent and usesDoubleNaturalBase.
        const grey = captureRecipes(makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50' }));
        assert.strictEqual(grey.rootRec.meta.usesDoubleNaturalBase, true, 'grey root usesDoubleNaturalBase');
        assert.ok(typeof grey.rootRec.meta.oxidizerPercent === 'number', 'grey root numeric oxidizerPercent');
    }],

    ['22. manual/blocked paths: recipes (if present) still carry meta', function () {
        // brand-sensitive MANUAL paths build recipes -> must carry meta.
        for (const [label, fx] of [
            ['powder MANUAL', makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' })],
            ['SB MANUAL', makeFixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' })]
        ]) {
            const c = captureRecipes(fx);
            assert.ok(c.rootRec && c.rootRec.meta, label + ' must still carry rootRec.meta');
            assertValidMeta(c.rootRec, label + ' root');
            assertValidMeta(c.lenRec, label + ' length');
        }
        // early BLOCKED (allergy=yes) may not build recipes; if any present it must still be valid.
        const blocked = captureRecipes(makeFixture({ allergy: 'yes' }));
        assertValidMeta(blocked.rootRec, 'BLOCKED allergy root');
        assertValidMeta(blocked.lenRec, 'BLOCKED allergy length');
    }],

    ['23. user input cannot inject or override trusted meta', function () {
        const injected = makeFixture({ meta: '{"isPowder":true}', isPowder: 'true', processCategory: 'powder', oxidizerPercent: '12' });
        const c = captureRecipes(injected);
        // clean 7->7 => trusted meta is permanent/6, NOT the injected powder/12.
        assert.strictEqual(c.rootRec.meta.processCategory, 'permanent', 'trusted meta must ignore injected processCategory');
        assert.strictEqual(c.rootRec.meta.isPowder, false, 'trusted meta must ignore injected isPowder');
        assert.strictEqual(c.rootRec.meta.oxidizerPercent, 6, 'trusted meta oxidizerPercent must be branch-derived (6), not injected (12)');
        for (const f of META_FIELDS) assertNotIncludes(c.html, f, 'injected meta must not leak to output');
    }],

    ['24. render does not leak meta (APPROVED/BLOCKED/MANUAL)', function () {
        const states = [
            getOutputHtml(CORE, makeFixture()),
            getOutputHtml(CORE, makeFixture({ allergy: 'yes' })),
            getOutputHtml(CORE, makeFixture({ allergy: '' })),
            getOutputHtml(CORE, makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' }))
        ];
        for (const h of states) for (const f of META_FIELDS) assertNotIncludes(h, f, 'meta must not leak');
    }],

    ['25. no behavior change (baseline + safety invariants)', function () {
        assert.strictEqual(status(getOutputHtml(CORE, makeFixture())).split(' ')[0], 'APPROVED', 'clean 7->7 APPROVED');
        const powder = getOutputHtml(CORE, makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' }));
        assertManualOrBlocked(powder, 'powder'); assertNoExactGrams(powder, 'powder');
        const sb = getOutputHtml(CORE, makeFixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' }));
        assertManualOrBlocked(sb, 'SB'); assertNoExactGrams(sb, 'SB');
        const grey = getOutputHtml(CORE, makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50' }));
        assertManualOrBlocked(grey, 'grey'); assertIncludes(grey, '.00', 'grey still injects .00 base');
        // production invariants visible in the mass-model block of a non-approved grey state.
        assertIncludes(grey, '&quot;mode&quot;: &quot;2-zone&quot;', 'mass model 2-zone');
        assertIncludes(grey, '&quot;endsMass&quot;: null', 'endsMass null');
    }],

    ['26. missing meta fails closed (forgotten withMeta -> MANUAL, no grams)', function () {
        // Simulate a future builder branch that forgot withMeta() on the powder recipes:
        // strip the meta wrapper so rootRec/lenRec are bare objects (no meta).
        const noPowderMeta = CORE.replace(/withMeta\('powder', [0-9.]+, (\{[^}]*\})\)/g, '$1');
        assert.notStrictEqual(noPowderMeta, CORE, 'powder meta strip applied');
        const POWDER = makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' });
        const html = getOutputHtml(noPowderMeta, POWDER);
        assertManualOrBlocked(html, 'missing-meta powder');
        assertNoApproved(html, 'missing-meta powder');
        assertNoExactGrams(html, 'missing-meta powder');
    }],

    ['27. missing meta fails closed even with text fallback unable to help (new label)', function () {
        // Strip powder meta AND rename the powder process label so the legacy text
        // fallback CANNOT classify it. Guard must still force MANUAL (fail-closed).
        let MUT = CORE.replace(/withMeta\('powder', [0-9.]+, (\{[^}]*\})\)/g, '$1');
        MUT = MUT.split('process: "Порошок"').join('process: "NewBleachLabel"');
        const POWDER = makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' });
        const html = getOutputHtml(MUT, POWDER);
        assertManualOrBlocked(html, 'missing-meta + new label');
        assertNoApproved(html, 'missing-meta + new label');
        assertNoExactGrams(html, 'missing-meta + new label');
        for (const f of META_FIELDS) assertNotIncludes(html, f, 'guard must not leak meta');
    }],

    ['28. invalid meta fails closed (bad safetyMarkersVersion / processCategory)', function () {
        // Corrupt meta so it is present but invalid: change safetyMarkersVersion value.
        const MUT = CORE.replace(/safetyMarkersVersion: 1/g, 'safetyMarkersVersion: 99');
        assert.notStrictEqual(MUT, CORE, 'meta-version corruption applied');
        const clean = makeFixture(); // would normally be APPROVED
        const html = getOutputHtml(MUT, clean);
        assertManualOrBlocked(html, 'invalid-meta clean baseline');
        assertNoApproved(html, 'invalid-meta clean baseline');
        assertNoExactGrams(html, 'invalid-meta clean baseline');
    }],

    ['29. valid recipes unaffected by the guard', function () {
        // Unmodified core: clean APPROVED still APPROVED with grams; gated paths still MANUAL.
        const cleanHtml = getOutputHtml(CORE, makeFixture());
        assert.strictEqual(status(cleanHtml).split(' ')[0], 'APPROVED', 'clean 7->7 still APPROVED');
        assert.ok(/Маса:<\/b>\s*\d/.test(cleanHtml), 'clean APPROVED still shows grams');
        assertManualOrBlocked(getOutputHtml(CORE, makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' })), 'powder still MANUAL');
        for (const f of META_FIELDS) assertNotIncludes(cleanHtml, f, 'guard adds no meta leak on valid path');
    }],

    ['30. user meta injection cannot satisfy the guard or flip status', function () {
        // User supplies a fake-but-well-formed meta in INPUT. It must be ignored: the guard
        // validates the TRUSTED recipe.meta (built internally), not user input.
        const injected = makeFixture({ meta: 'whatever', safetyMarkersVersion: '1', processCategory: 'permanent', isPowder: 'false' });
        const c = captureRecipes(injected);
        assert.ok(c.rootRec && c.rootRec.meta && c.rootRec.meta.safetyMarkersVersion === 1, 'trusted meta is internal');
        const html = getOutputHtml(CORE, injected);
        assert.strictEqual(status(html).split(' ')[0], 'APPROVED', 'clean baseline still APPROVED via trusted meta (injection ignored)');
        for (const f of META_FIELDS) assertNotIncludes(html, f, 'injected meta must not leak');
    }],

    ['31. powder text fallback retired (meta-only drives gate; guard for missing meta)', function () {
        const POWDER = makeFixture({ root_level: '5', length_level: '5', target_level: '9', target_direction: '1' });
        // Rename powder display label; meta.isPowder still drives the gate (no text fallback now).
        const renamed = getOutputHtml(mutate('process: "Порошок"', 'process: "Lightener"'), POWDER);
        assertManualOrBlocked(renamed, 'powder renamed (meta-only)');
        assertNoApproved(renamed, 'powder renamed'); assertNoExactGrams(renamed, 'powder renamed');
        assertIncludes(renamed, 'Brand rule matrix', 'powder gate must fire from meta.isPowder');
        // Strip meta -> fail-closed guard, regardless of label.
        const noMeta = getOutputHtml(CORE.replace(/withMeta\('powder', [0-9.]+, (\{[^}]*\})\)/g, '$1'), POWDER);
        assertManualOrBlocked(noMeta, 'powder meta-stripped'); assertNoExactGrams(noMeta, 'powder meta-stripped');
    }],

    ['32. Special Blond text fallback retired (meta-only)', function () {
        const SBfx = makeFixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' });
        const renamed = getOutputHtml(mutate('process: "Special Blond"', 'process: "Lift System"'), SBfx);
        assertManualOrBlocked(renamed, 'SB renamed (meta-only)');
        assertNoApproved(renamed, 'SB renamed'); assertNoExactGrams(renamed, 'SB renamed');
        assertIncludes(renamed, 'Brand rule matrix', 'SB gate must fire from meta.isSpecialBlond');
    }],

    ['33. grey validity text/ox fallback retired (meta-only)', function () {
        const GREYfx = makeFixture({ root_level: '6', length_level: '6', target_level: '7', target_direction: '1', grey_percent: '50' });
        // Rename permanent label AND decorate ox; numeric meta still drives grey validity.
        let MUT = mutate('process: "Перманент"', 'process: "Permanent"');
        MUT = MUT.split('ox: oxChoice').join('ox: ("OX:" + oxChoice)');
        const html = getOutputHtml(MUT, GREYfx);
        assertManualOrBlocked(html, 'grey renamed (meta-only)');
        assertNoApproved(html, 'grey renamed'); assertNoExactGrams(html, 'grey renamed');
        assertIncludes(html, 'Brand rule matrix', 'grey .00 gate must fire from meta.usesDoubleNaturalBase');
        assertIncludes(html, '.00', 'grey still injects .00 base via meta-driven validity');
    }],

    ['34. toning text fallback retired (meta-only)', function () {
        const TONfx = makeFixture({ root_level: '8', length_level: '8', target_level: '6', target_direction: '1' });
        const html = getOutputHtml(mutate('"Перманент / Тонування"', '"Refresh"'), TONfx);
        assertManualOrBlocked(html, 'toning renamed (meta-only)');
        assertNoApproved(html, 'toning renamed'); assertNoExactGrams(html, 'toning renamed');
        assertIncludes(html, 'Brand rule matrix', 'toning gate must fire from meta.isToning');
    }],

    ['35. source inventory: FB1-FB5 runtime text fallbacks absent (FB6/FB7 kept)', function () {
        // FB1 powder
        assertNotIncludes(CORE, 'String(rootRec.process).includes("Порошок")', 'FB1 powder root fallback retired');
        assertNotIncludes(CORE, 'String(lenRec.process).includes("Порошок")', 'FB1 powder length fallback retired');
        // FB2 Special Blond
        assertNotIncludes(CORE, 'String(rootRec.process).includes("Special Blond")', 'FB2 SB root fallback retired');
        assertNotIncludes(CORE, 'String(lenRec.process).includes("Special Blond")', 'FB2 SB length fallback retired');
        // FB3 grey process + ox display fallback
        assertNotIncludes(CORE, 'String(rootRec.process).includes("Перманент")', 'FB3 grey process fallback retired');
        assertNotIncludes(CORE, '["6%", "9%", "12%"].includes(rootRec.ox)', 'FB3 grey ox display fallback retired');
        assertNotIncludes(CORE, '["6%", "9%", "12%"].includes(lenRec.ox)', 'FB3 grey ox display fallback retired (len)');
        // FB4 toning text markers
        assertNotIncludes(CORE, "['перманент / тонування', 'тонування', 'toning']", 'FB4 toning text markers retired');
        // FB5 high-ox extractOxPercent fallback for built recipes
        assertNotIncludes(CORE, 'extractOxPercent(rootRec', 'FB5 high-ox root fallback retired');
        assertNotIncludes(CORE, 'extractOxPercent(lenRec', 'FB5 high-ox length fallback retired');
        // FB6 / FB7 intentionally retained
        assert.ok(/rootLiftProcessMarkers/.test(CORE), 'FB6 retained');
        assert.ok(/zoneProcessesDiffer/.test(CORE), 'FB7 retained');
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
