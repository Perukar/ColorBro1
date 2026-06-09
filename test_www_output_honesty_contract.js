'use strict';

/**
 * test_www_output_honesty_contract.js
 *
 * OUTPUT HONESTY CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Extends honesty locks BEYOND the clean APPROVED path (which is covered by
 * test_www_output_honesty_copy.js) to every user-facing output state:
 * BLOCKED, MANUAL_REQUIRED, unknown-enum, brand-matrix-missing,
 * 3-zone/ends diagnostic, stale/persisted output, and structure/curl injection.
 *
 * Core safety contract enforced here:
 *   - Exact recipe grams (`Маса:` rows) appear ONLY on the production-ready
 *     APPROVED executable path — never in BLOCKED / MANUAL / diagnostic states.
 *   - No output in any state grants permission to apply without master checks
 *     (no "safe to apply" / "можна наносити" / "без перевірки" wording).
 *   - No brand-specific formula readiness claim while the brand matrix is off.
 *   - No production 3-zone / endsRec recipe; diagnostic ends output is clearly
 *     non-production.
 *   - No stale/persisted output is rendered as authoritative on load.
 *   - structure/curl are not evaluated and not claimed to be.
 *
 * Pure Node.js + vm. No browser, no external framework. Read-only against the
 * real ./www/core.js. This test asserts wording/behavior; it does not change
 * runtime logic.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// --- required helpers -------------------------------------------------------

function loadCore() {
    return fs.readFileSync('./www/core.js', 'utf8');
}
const CORE = loadCore();

function makeFixture(overrides) {
    return Object.assign({
        history: 'натуральні', condition: 'здоровые', root_condition: 'здоровий корінь',
        length_condition: 'здорове полотно', porosity: 'нормальна пористість',
        thickness: 'средние', density: 'средние', length: 'средние',
        grey_percent: '0', grey_type: 'мягкая', root_level: '7', root_length: '1',
        length_level: '7', ends_level: '7', ends_condition: 'здорові',
        ends_history: 'натуральні', ends_base_type: 'натуральна', base_type: 'Натуральна',
        target_level: '7', target_direction: '1', elasticity: 'нормальна еластичність',
        allergy: 'no', scalp_sensitivity: 'normal'
    }, overrides || {});
}

// Run calculateProtocol() with a fake DOM (+ inert localStorage stub) and a
// pre-seeded "stale" output. Returns { html, requested, preCallHtml }.
function runProtocol(values, opts) {
    opts = opts || {};
    let out = opts.seedOutput || '';
    const preCall = { html: null };
    const requested = [];
    const storage = Object.assign({ getItem: () => opts.staleStorage || null, setItem: () => {}, removeItem: () => {} }, {});
    const sb = {
        console,
        localStorage: storage,
        sessionStorage: storage,
        document: {
            getElementById(id) {
                requested.push(id);
                if (id === 'output') return { set innerHTML(v) { out = v; }, get innerHTML() { return out; } };
                return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
            }
        }
    };
    vm.createContext(sb);
    // Load core WITHOUT invoking calculateProtocol first (load-time behavior).
    vm.runInContext(CORE, sb);
    preCall.html = out;
    if (!opts.noCall) vm.runInContext('calculateProtocol();', sb);
    return { html: out, requested, preCallHtml: preCall.html };
}

function getOutputHtml(values, opts) { return runProtocol(values, opts).html; }

function assertIncludes(html, sub, msg) {
    assert.ok(html.includes(sub), (msg || 'expected substring') + ': "' + sub + '"');
}
function assertNotIncludes(html, sub, msg) {
    assert.ok(!html.includes(sub), (msg || 'forbidden substring present') + ': "' + sub + '"');
}

// No executable recipe grams: the `Маса:` recipe row carrying a number.
function assertNoExactGrams(html, ctx) {
    assert.ok(!/Маса:<\/b>\s*\d/.test(html), (ctx || '') + ' must not expose exact recipe grams (Маса: N)');
    assertNotIncludes(html, 'dyeMass', (ctx || '') + ' must not leak dyeMass');
    assertNotIncludes(html, 'oxidizerMass', (ctx || '') + ' must not leak oxidizerMass');
    assertNotIncludes(html, 'Фінальна формула', (ctx || '') + ' must not show final executable formula');
}

const FORBIDDEN_APPLY = [
    'можна наносити', 'готово до нанесення', 'безпечно наносити', 'гарантовано безпечно',
    'safe to apply', 'ready to apply', 'apply without', 'без перевірки',
    'без тест-пасма', 'без рішення майстра'
];
function assertNoApplyPermission(html, ctx) {
    for (const p of FORBIDDEN_APPLY) {
        assert.ok(!html.includes(p), (ctx || '') + ' must not contain apply-permission wording: "' + p + '"');
    }
}

function assertNoUnsafeApproval(html, ctx) {
    assertNotIncludes(html, 'approved-recipe', (ctx || '') + ' must not render an executable approved recipe');
    assertNotIncludes(html, 'розрахунок дозволено (не гарантія безпеки)', (ctx || '') + ' must not show the APPROVED gloss');
}

function statusHeader(html) {
    const m = html.match(/status-header"><h2>([^<]*)<\/h2>/);
    return m ? m[1] : '';
}
function assertStatus(html, token, ctx) {
    assert.ok(statusHeader(html).includes(token), (ctx || '') + ' status header must contain "' + token + '" (got: "' + statusHeader(html) + '")');
}

function assertNoProduction3ZoneRecipe(html, ctx) {
    assertNotIncludes(html, '&quot;mode&quot;: &quot;3-zone&quot;', (ctx || '') + ' must not render production 3-zone mass mode');
    assert.ok(!/&quot;endsMass&quot;:\s*\d/.test(html), (ctx || '') + ' must not render a numeric endsMass');
    assertNotIncludes(html, 'endsRecipeReady&quot;: true', (ctx || '') + ' must not mark endsRec ready');
}

const REAL_BRANDS = ["wella", "l'oreal", "l'oréal", "loreal", "schwarzkopf", "estel"];
function assertNoBrandFormulaClaim(html, ctx) {
    // Proprietary brand names must not appear as formula claims while the matrix is off.
    const low = html.toLowerCase();
    for (const b of REAL_BRANDS) {
        assert.ok(!low.includes(b), (ctx || '') + ' must not name a specific brand formula ("' + b + '") while brand matrix is off');
    }
    // The "Matrix" brand is a capitalized proper noun; the runtime's honest
    // generic wording "Brand rule matrix" uses the lowercase common noun. Flag
    // only a capitalized standalone "Matrix" brand token, not the generic term.
    assert.ok(!/\bMatrix\b/.test(html), (ctx || '') + ' must not name the Matrix brand while brand matrix is off');
}

// --- groups -----------------------------------------------------------------

const GROUPS = [
    ['1. APPROVED honesty still locked', function () {
        const html = getOutputHtml(makeFixture());
        assertStatus(html, 'APPROVED', 'APPROVED');
        assertIncludes(html, 'approved-recipe', 'clean APPROVED must render recipe');
        assert.ok(/Маса:<\/b>\s*\d/.test(html), 'APPROVED executable path may show exact grams');
        assertIncludes(html, 'approved-caveat', 'APPROVED must render the honesty caveat');
        assertIncludes(html, 'не гарантія', 'caveat must say APPROVED is not a safety guarantee');
        assertIncludes(html, 'рішення майстра', 'caveat must reference master decision');
        assertIncludes(html, 'інструкцій виробника', 'caveat must reference manufacturer instructions');
        assertIncludes(html, 'тесту-пасма', 'caveat must reference strand test');
        assertIncludes(html, 'тесту на алерген', 'caveat must reference allergy test');
        assertNoApplyPermission(html, 'APPROVED');
    }],

    ['2. BLOCKED allergy honesty', function () {
        const html = getOutputHtml(makeFixture({ allergy: 'yes' }));
        assertStatus(html, 'BLOCKED', 'BLOCKED-allergy');
        assertNoUnsafeApproval(html, 'BLOCKED-allergy');
        assertNoExactGrams(html, 'BLOCKED-allergy');
        assertIncludes(html, 'алергі', 'BLOCKED-allergy must cite an allergy reason');
        assertNoApplyPermission(html, 'BLOCKED-allergy');
    }],

    ['3. BLOCKED scalp irritation honesty', function () {
        const html = getOutputHtml(makeFixture({ scalp_sensitivity: 'irritated' }));
        assertStatus(html, 'BLOCKED', 'BLOCKED-scalp');
        assertNoUnsafeApproval(html, 'BLOCKED-scalp');
        assertNoExactGrams(html, 'BLOCKED-scalp');
        assertIncludes(html, 'шкір', 'BLOCKED-scalp must cite a scalp reason');
        assertNoApplyPermission(html, 'BLOCKED-scalp');
    }],

    ['4. MANUAL_REQUIRED allergy unknown honesty', function () {
        const html = getOutputHtml(makeFixture({ allergy: '' }));
        assertStatus(html, 'MANUAL_REQUIRED', 'MANUAL-allergy');
        assertNoUnsafeApproval(html, 'MANUAL-allergy');
        assertNoExactGrams(html, 'MANUAL-allergy');
        assertIncludes(html, 'ручне рішення майстра', 'MANUAL-allergy must show manual-review language');
        assertNoApplyPermission(html, 'MANUAL-allergy');
    }],

    ['5. MANUAL_REQUIRED scalp sensitive honesty', function () {
        const html = getOutputHtml(makeFixture({ scalp_sensitivity: 'sensitive' }));
        assertStatus(html, 'MANUAL_REQUIRED', 'MANUAL-scalp');
        assertNoUnsafeApproval(html, 'MANUAL-scalp');
        assertNoExactGrams(html, 'MANUAL-scalp');
        assertIncludes(html, 'майстра', 'MANUAL-scalp must reference master decision');
        assertIncludes(html, 'шкір', 'MANUAL-scalp must reference scalp');
        assertNoApplyPermission(html, 'MANUAL-scalp');
    }],

    ['6. unknown enum honesty', function () {
        const cases = [
            { field: 'density', bad: 'ОЧЕНЬ_ГУСТЫЕ', token: 'густота' },
            { field: 'thickness', bad: 'ультратонкие', token: 'товщина' },
            { field: 'length', bad: 'макси-длина', token: 'довжина' },
            { field: 'target_direction', bad: 'invalid_xyz', token: 'відтінок' }
        ];
        for (const c of cases) {
            const html = getOutputHtml(makeFixture({ [c.field]: c.bad }));
            assertStatus(html, 'BLOCKED', 'unknown-' + c.field);
            assertNoUnsafeApproval(html, 'unknown-' + c.field);
            assertNoExactGrams(html, 'unknown-' + c.field);
            assert.ok(html.includes(c.token) || html.includes(c.bad),
                'unknown-' + c.field + ' must surface the offending field/value');
            assertNoApplyPermission(html, 'unknown-' + c.field);
        }
    }],

    ['7. brand-matrix missing honesty', function () {
        // Special Blond from base 6 -> target 10 triggers the brand gate (matrix off).
        const html = getOutputHtml(makeFixture({ root_level: '6', length_level: '6', target_level: '10', target_direction: '1' }));
        assert.ok(statusHeader(html).includes('MANUAL_REQUIRED') || statusHeader(html).includes('BLOCKED'),
            'brand-sensitive must be MANUAL_REQUIRED or BLOCKED (got: "' + statusHeader(html) + '")');
        assertNoUnsafeApproval(html, 'brand-missing');
        assertNoExactGrams(html, 'brand-missing');
        assertIncludes(html, 'Brand rule matrix', 'brand-missing must cite the missing brand rule matrix');
        assert.ok(/відсутн|не підтверджен|заборонен/.test(html), 'brand-missing must say matrix absent / not confirmed');
        assertNoBrandFormulaClaim(html, 'brand-missing');
        assertNoApplyPermission(html, 'brand-missing');
    }],

    ['8. 3-zone / ends diagnostic honesty', function () {
        const html = getOutputHtml(makeFixture({
            root_level: '6', length_level: '7', target_level: '8', target_direction: '1',
            ends_level: '9', ends_condition: 'сильно пошкоджені', ends_history: 'освітлені'
        }));
        assertNoUnsafeApproval(html, 'ends-diagnostic');
        assertNoExactGrams(html, 'ends-diagnostic');
        assertNoProduction3ZoneRecipe(html, 'ends-diagnostic');
        // Ends are explicitly non-production / require manual decision.
        assert.ok(/не активується|не рахується|ручн|рішення майстра|тест-пасмо/.test(html),
            'ends diagnostic must be framed as non-production / manual');
        assertNoApplyPermission(html, 'ends-diagnostic');
    }],

    ['9. stale / persisted output honesty', function () {
        // Seed a fake "stale approved" payload in storage AND in the output element,
        // then load core.js WITHOUT calling calculateProtocol.
        const stale = '<div class="status-header"><h2>APPROVED</h2></div><div class="recipe approved-recipe"><ul><li><b>Маса:</b> 99</li></ul></div>';
        const r = runProtocol(makeFixture(), { noCall: true, staleStorage: stale });
        // On load, runtime must NOT auto-render anything from storage.
        assert.strictEqual(r.preCallHtml, '', 'load-time output must be empty (no auto-render before calculateProtocol)');
        // Static guarantee: no load-time / storage-driven render hook exists.
        assert.ok(!/addEventListener\(\s*['"](?:DOMContentLoaded|load)['"]/.test(CORE),
            'core.js must not auto-render output on a load event');
        assert.ok(!/getElementById\(\s*['"]output['"]\s*\)\.innerHTML\s*=\s*[^;]*(localStorage|sessionStorage|getItem)/.test(CORE),
            'core.js must not write storage content into #output');
    }],

    ['10. structure / curl honesty', function () {
        const clean = getOutputHtml(makeFixture());
        const injected = runProtocol(makeFixture({ structure: 'wavy', curl: 'curly' }));
        assert.strictEqual(injected.html, clean, 'injected structure/curl must not change output');
        assert.ok(!injected.requested.includes('structure'), 'structure must not be read from DOM');
        assert.ok(!injected.requested.includes('curl'), 'curl must not be read from DOM');
        assertNotIncludes(injected.html, 'всі характеристики', 'must not claim all characteristics evaluated');
        assertNotIncludes(injected.html.toLowerCase(), 'all hair characteristics', 'must not claim all hair characteristics evaluated');
        assertNoApplyPermission(injected.html, 'structure-curl');
    }],

    ['11. global forbidden wording scan', function () {
        const states = {
            APPROVED: getOutputHtml(makeFixture()),
            BLOCKED_allergy: getOutputHtml(makeFixture({ allergy: 'yes' })),
            BLOCKED_scalp: getOutputHtml(makeFixture({ scalp_sensitivity: 'irritated' })),
            MANUAL_allergy: getOutputHtml(makeFixture({ allergy: '' })),
            MANUAL_scalp: getOutputHtml(makeFixture({ scalp_sensitivity: 'sensitive' })),
            unknown_enum: getOutputHtml(makeFixture({ density: 'ОЧЕНЬ_ГУСТЫЕ' })),
            brand_missing: getOutputHtml(makeFixture({ root_level: '6', length_level: '6', target_level: '10' })),
            ends_diag: getOutputHtml(makeFixture({ root_level: '6', length_level: '7', target_level: '8', ends_level: '9', ends_condition: 'сильно пошкоджені', ends_history: 'освітлені' }))
        };
        for (const [name, html] of Object.entries(states)) {
            assertNoApplyPermission(html, 'global-' + name);
        }
    }],

    ['12. no exact grams outside approved executable path', function () {
        const unsafe = [
            ['BLOCKED_allergy', makeFixture({ allergy: 'yes' })],
            ['BLOCKED_scalp', makeFixture({ scalp_sensitivity: 'irritated' })],
            ['MANUAL_allergy', makeFixture({ allergy: '' })],
            ['MANUAL_scalp', makeFixture({ scalp_sensitivity: 'sensitive' })],
            ['unknown_enum', makeFixture({ density: 'ОЧЕНЬ_ГУСТЫЕ' })],
            ['brand_missing', makeFixture({ root_level: '6', length_level: '6', target_level: '10' })],
            ['ends_diag', makeFixture({ root_level: '6', length_level: '7', target_level: '8', ends_level: '9', ends_condition: 'сильно пошкоджені', ends_history: 'освітлені' })]
        ];
        for (const [name, fx] of unsafe) {
            const html = getOutputHtml(fx);
            assertNoUnsafeApproval(html, name);
            assertNoExactGrams(html, name);
        }
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- OUTPUT HONESTY CONTRACT GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW output honesty contract test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW output honesty contract test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
