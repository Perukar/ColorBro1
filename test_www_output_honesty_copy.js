'use strict';

/**
 * test_www_output_honesty_copy.js
 *
 * OUTPUT HONESTY COPY CONTRACT v1 — ПЕРУКАР (PERUKAR)
 *
 * Locks the honest-wording fixes so future copy edits cannot silently
 * re-introduce overclaim, and so the APPROVED safety caveat cannot be dropped.
 *
 * Covers (static UI copy + rendered runtime output, real www/core.js):
 *   A. index.html header no longer claims "Auto-Pilot" (autonomous capability).
 *   B. index.html Block 1 title is honest ("Стан і параметри волосся"),
 *      not the misleading "Структура".
 *   C. APPROVED status header carries a localized gloss making clear APPROVED
 *      = calculation allowed, NOT a safety guarantee.
 *   D. Production-ready APPROVED output renders an explicit caveat: not a
 *      chemical/medical safety guarantee, not permission to apply without
 *      strand test, allergy test, and master's decision; follow manufacturer.
 *   E. The caveat appears ONLY on the production-ready APPROVED path — never
 *      in BLOCKED / MANUAL_REQUIRED / unknown-enum states.
 *   F. Regression: the copy fix did not change gating or mass — unsafe states
 *      still show no approved-recipe and no grams; clean APPROVED still 18/42.
 *
 * No runtime logic or formula is asserted to change — these are output/text
 * contracts only.
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('./www/core.js', 'utf8');
const indexHtml = fs.readFileSync('./www/index.html', 'utf8');

function approvedBaseline() {
    return {
        history: 'натуральні', condition: 'здоровые', root_condition: 'здоровий корінь',
        length_condition: 'здорове полотно', porosity: 'нормальна пористість',
        thickness: 'средние', density: 'средние', length: 'средние',
        grey_percent: '0', grey_type: 'мягкая', root_level: '7', root_length: '1',
        length_level: '7', ends_level: '7', ends_condition: 'здорові',
        ends_history: 'натуральні', ends_base_type: 'натуральна', base_type: 'Натуральна',
        target_level: '7', target_direction: '1', elasticity: 'нормальна еластичність',
        allergy: 'no', scalp_sensitivity: 'normal'
    };
}

function runProtocol(values) {
    let out = '';
    const sb = { console, document: { getElementById(id) {
        if (id === 'output') return { set innerHTML(v) { out = v; }, get innerHTML() { return out; } };
        return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : '' };
    } } };
    vm.createContext(sb);
    vm.runInContext(code + '\ncalculateProtocol();', sb);
    return out;
}

function recipeMasses(html) {
    return (html.match(/Маса:<\/b>\s*([^<]*)/g) || []).map(s => s.replace(/Маса:<\/b>\s*/, '').trim());
}

const CAVEAT_MARK = 'approved-caveat';
const CAVEAT_PHRASES = [
    'розрахунок пройшов програмні перевірки',
    'гарантія хімічної або медичної безпеки',
    'дозвіл наносити',
    'тесту-пасма',
    'тесту на алерген',
    'рішення майстра',
    'інструкцій виробника'
];

const GROUPS = [
    ['A. no Auto-Pilot in UI header', function () {
        assert.ok(!/Auto-?Pilot/i.test(indexHtml), 'index.html must not contain "Auto-Pilot"');
        assert.ok(indexHtml.includes('Колорист-калькулятор (помічник майстра)'),
            'index.html header must use honest assistant/calculator wording');
    }],

    ['B. honest Block 1 title', function () {
        assert.ok(!indexHtml.includes('Блок 1: Структура'),
            'index.html must not title Block 1 as the misleading "Структура"');
        assert.ok(indexHtml.includes('Блок 1: Стан і параметри волосся'),
            'index.html Block 1 must use honest "Стан і параметри волосся" title');
    }],

    ['C. APPROVED status gloss', function () {
        const html = runProtocol(approvedBaseline());
        assert.ok(html.includes('APPROVED'), 'status token APPROVED must remain present');
        assert.ok(html.includes('розрахунок дозволено (не гарантія безпеки)'),
            'APPROVED header must carry the honesty gloss');
    }],

    ['D. APPROVED safety caveat present', function () {
        const html = runProtocol(approvedBaseline());
        assert.ok(html.includes(CAVEAT_MARK), 'production-ready APPROVED must render the approved-caveat block');
        for (const p of CAVEAT_PHRASES) {
            assert.ok(html.includes(p), 'APPROVED caveat must contain phrase: "' + p + '"');
        }
        assert.ok(/approved-recipe/.test(html), 'clean APPROVED must still render the executable recipe');
    }],

    ['E. caveat absent in non-approved states', function () {
        const blocked = runProtocol(Object.assign(approvedBaseline(), { allergy: 'yes' }));
        const manual = runProtocol(Object.assign(approvedBaseline(), { allergy: '' }));
        const unknown = runProtocol(Object.assign(approvedBaseline(), { density: 'ОЧЕНЬ_ГУСТЫЕ' }));
        for (const [name, html] of [['BLOCKED', blocked], ['MANUAL', manual], ['unknown-enum', unknown]]) {
            assert.ok(!html.includes(CAVEAT_MARK), name + ' must not render the approved-caveat block');
            assert.ok(!html.includes('розрахунок дозволено (не гарантія безпеки)'),
                name + ' must not show the APPROVED gloss');
            assert.ok(!/approved-recipe/.test(html), name + ' must not render an approved recipe');
        }
    }],

    ['F. gating + mass unchanged (regression)', function () {
        // Unsafe states still expose no exact grams.
        for (const ov of [{ allergy: 'yes' }, { allergy: '' }, { density: 'ОЧЕНЬ_ГУСТЫЕ' }]) {
            const html = runProtocol(Object.assign(approvedBaseline(), ov));
            assert.deepStrictEqual(recipeMasses(html), [],
                'unsafe state ' + JSON.stringify(ov) + ' must not show grams');
        }
        // Clean APPROVED mass unchanged by the copy fix.
        assert.deepStrictEqual(recipeMasses(runProtocol(approvedBaseline())), ['18', '42'],
            'clean APPROVED recipe masses must remain root 18 / length 42');
    }]
];

const results = [];
let failed = 0;
for (const [name, fn] of GROUPS) {
    try { fn(); results.push(name + ' — PASS'); console.log('  ok   ' + name); }
    catch (err) { failed += 1; results.push(name + ' — FAIL: ' + err.message); console.error('  FAIL ' + name + ': ' + err.message); }
}
console.log('\n--- OUTPUT HONESTY COPY GROUPS (' + GROUPS.length + ') ---');
for (const line of results) console.log('  ' + line);
if (failed > 0) { console.error('\nWWW output honesty copy test FAILED (' + failed + '/' + GROUPS.length + ')'); process.exit(1); }
console.log('\nWWW output honesty copy test passed (' + GROUPS.length + '/' + GROUPS.length + ' groups)');
