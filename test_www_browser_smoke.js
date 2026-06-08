'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('./www/core.js', 'utf8');
const indexHtml = fs.readFileSync('./www/index.html', 'utf8');

let documentAccessed = false;
const forbiddenDocument = new Proxy({}, {
    get() {
        documentAccessed = true;
        throw new Error('document must not be accessed by core.js at load time');
    }
});

const assertions = `

// ============================================================
// Helpers
// ============================================================

function assertIncludes(html, text, label) {
    assert.ok(html.includes(text), (label || '') + ' Expected HTML to include: ' + text);
}

function assertNotIncludes(html, text, label) {
    assert.ok(!html.includes(text), (label || '') + ' Expected HTML NOT to include: ' + text + '\\nGot:\\n' + html.slice(0, 400));
}

// Default DOM values for a canonical safe approved scenario
// (mirrors test_www_render_runtime.js defaultDomValues)
const defaultDomValues = {
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
    root_level: '8',
    root_length: '1',
    length_level: '8',
    ends_level: '8',
    ends_condition: 'здорові',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    elasticity: 'нормальна еластичність',
    allergy: 'no',
    scalp_sensitivity: 'normal'
};

function runSmoke(overrides, options) {
    overrides = overrides || {};
    options = options || {};
    const values = Object.assign({}, defaultDomValues, overrides);
    const output = { innerHTML: '' };
    const fakeDocument = {
        getElementById: function(id) {
            if (id === 'output') return output;
            if (options.missingIds && options.missingIds.indexOf(id) !== -1) return undefined;
            if (!Object.prototype.hasOwnProperty.call(values, id)) {
                throw new Error('Missing fake DOM value for: ' + id);
            }
            return { value: values[id] };
        }
    };
    const previousDocument = document;
    try {
        document = fakeDocument;
        calculateProtocol();
    } finally {
        document = previousDocument;
    }
    return output.innerHTML;
}

// ============================================================
// SMOKE-HTML-* : Page structure tests
// ============================================================

(function() {
    assert.ok(uiIndexHtml.length > 0, 'SMOKE-HTML-INDEX-EXISTS: index.html must not be empty');
    console.log('SMOKE-HTML-INDEX-EXISTS passed');
})();

(function() {
    // index.html uses <div class="block"> groupings (no <form> element — pure JS onclick pattern)
    assert.ok(uiIndexHtml.includes('class="block"'), 'SMOKE-HTML-INPUT-BLOCKS-EXIST: index.html must contain div.block input groupings');
    console.log('SMOKE-HTML-INPUT-BLOCKS-EXIST passed');
})();

(function() {
    assert.ok(uiIndexHtml.includes('calculateProtocol()'), 'SMOKE-HTML-BUTTON-EXISTS: button must call calculateProtocol()');
    console.log('SMOKE-HTML-BUTTON-EXISTS passed');
})();

(function() {
    assert.ok(uiIndexHtml.includes('id="output"'), 'SMOKE-HTML-OUTPUT-DIV: output div must have id="output"');
    console.log('SMOKE-HTML-OUTPUT-DIV passed');
})();

(function() {
    assert.ok(uiIndexHtml.includes('src="core.js"'), 'SMOKE-HTML-SCRIPT-CORE: index.html must load core.js via src="core.js"');
    console.log('SMOKE-HTML-SCRIPT-CORE passed');
})();

(function() {
    assert.ok(!uiIndexHtml.includes('localStorage'), 'SMOKE-HTML-NO-PERSISTENCE: index.html must not reference localStorage');
    assert.ok(!uiIndexHtml.includes('sessionStorage'), 'SMOKE-HTML-NO-PERSISTENCE: index.html must not reference sessionStorage');
    console.log('SMOKE-HTML-NO-PERSISTENCE passed');
})();

(function() {
    var requiredFields = [
        'allergy', 'scalp_sensitivity', 'target_direction',
        'root_level', 'target_level', 'thickness', 'density',
        'length', 'history', 'base_type'
    ];
    requiredFields.forEach(function(f) {
        assert.ok(uiIndexHtml.includes('id="' + f + '"'),
            'SMOKE-HTML-REQUIRED-FIELDS: index.html must have field id="' + f + '"');
    });
    console.log('SMOKE-HTML-REQUIRED-FIELDS passed');
})();

// ============================================================
// SMOKE-GLOBALS-* : Core.js global wiring tests
// ============================================================

(function() {
    assert.strictEqual(typeof calculateProtocol, 'function',
        'SMOKE-GLOBALS-CALCULATE-PROTOCOL: calculateProtocol must be a function');
    console.log('SMOKE-GLOBALS-CALCULATE-PROTOCOL passed');
})();

(function() {
    assert.strictEqual(typeof buildWwwRenderState, 'function',
        'SMOKE-GLOBALS-BUILD-RENDER-STATE: buildWwwRenderState must be a function');
    console.log('SMOKE-GLOBALS-BUILD-RENDER-STATE passed');
})();

(function() {
    assert.strictEqual(typeof safeParseJson, 'function',
        'SMOKE-GLOBALS-SAFE-PARSE-JSON: safeParseJson must be a function');
    console.log('SMOKE-GLOBALS-SAFE-PARSE-JSON passed');
})();

(function() {
    assert.strictEqual(PERUKAR_STORAGE_VERSION, 1,
        'SMOKE-GLOBALS-STORAGE-VERSION: PERUKAR_STORAGE_VERSION must be 1');
    console.log('SMOKE-GLOBALS-STORAGE-VERSION passed');
})();

(function() {
    assert.strictEqual(PERUKAR_PERSIST_INPUT_KEY, 'perukar_input_v1',
        'SMOKE-GLOBALS-PERSIST-INPUT-KEY: PERUKAR_PERSIST_INPUT_KEY must be perukar_input_v1');
    console.log('SMOKE-GLOBALS-PERSIST-INPUT-KEY passed');
})();

(function() {
    assert.ok(Array.isArray(PERUKAR_LEGACY_RESULT_KEYS),
        'SMOKE-GLOBALS-LEGACY-RESULT-KEYS: PERUKAR_LEGACY_RESULT_KEYS must be an array');
    assert.ok(PERUKAR_LEGACY_RESULT_KEYS.length > 0,
        'SMOKE-GLOBALS-LEGACY-RESULT-KEYS: PERUKAR_LEGACY_RESULT_KEYS must not be empty');
    console.log('SMOKE-GLOBALS-LEGACY-RESULT-KEYS passed');
})();

// ============================================================
// SMOKE-APPROVED-* : Valid safe scenario → APPROVED
// ============================================================

(function() {
    var html = runSmoke();
    assert.ok(html.includes('approved-recipe'),
        'SMOKE-APPROVED-VALID-SCENARIO: default safe values must produce approved-recipe in output');
    console.log('SMOKE-APPROVED-VALID-SCENARIO passed');
})();

(function() {
    var html = runSmoke();
    assert.ok(!html.includes('BLOCKED') || html.includes('approved-recipe'),
        'SMOKE-APPROVED-NOT-BLOCKED: default safe values must not produce BLOCKED output');
    assert.ok(html.includes('APPROVED'),
        'SMOKE-APPROVED-NOT-BLOCKED: default safe values must include APPROVED header');
    console.log('SMOKE-APPROVED-NOT-BLOCKED passed');
})();

(function() {
    var html = runSmoke();
    assert.ok(!html.includes('notForMixing'),
        'SMOKE-APPROVED-NO-NOT-FOR-MIXING: approved output must not contain notForMixing');
    console.log('SMOKE-APPROVED-NO-NOT-FOR-MIXING passed');
})();

// ============================================================
// SMOKE-BLOCKED-* : Safety gate tests
// ============================================================

(function() {
    var html = runSmoke({ allergy: 'yes' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-BLOCKED-ALLERGY-YES:');
    assert.ok(html.length > 0, 'SMOKE-BLOCKED-ALLERGY-YES: output must not be empty');
    console.log('SMOKE-BLOCKED-ALLERGY-YES passed');
})();

(function() {
    var html = runSmoke({ scalp_sensitivity: 'irritated' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-BLOCKED-SCALP-IRRITATED:');
    console.log('SMOKE-BLOCKED-SCALP-IRRITATED passed');
})();

(function() {
    var html = runSmoke({ target_direction: '' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-BLOCKED-MISSING-TARGET-DIRECTION:');
    console.log('SMOKE-BLOCKED-MISSING-TARGET-DIRECTION passed');
})();

(function() {
    var html = runSmoke({ thickness: 'UNKNOWN_ENUM_VALUE_XYZ' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-BLOCKED-UNKNOWN-THICKNESS:');
    console.log('SMOKE-BLOCKED-UNKNOWN-THICKNESS passed');
})();

(function() {
    var html = runSmoke({ length: '' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-BLOCKED-EMPTY-LENGTH:');
    console.log('SMOKE-BLOCKED-EMPTY-LENGTH passed');
})();

(function() {
    var html = runSmoke({ density: '' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-BLOCKED-EMPTY-DENSITY:');
    console.log('SMOKE-BLOCKED-EMPTY-DENSITY passed');
})();

// ============================================================
// SMOKE-MANUAL-* : MANUAL_REQUIRED path tests
// ============================================================

(function() {
    var html = runSmoke({ allergy: 'unknown' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-MANUAL-ALLERGY-UNKNOWN:');
    assert.ok(
        html.includes('MANUAL_REQUIRED') || html.includes('ручне') || html.includes('manual-required'),
        'SMOKE-MANUAL-ALLERGY-UNKNOWN: allergy=unknown must produce MANUAL_REQUIRED output'
    );
    console.log('SMOKE-MANUAL-ALLERGY-UNKNOWN passed');
})();

(function() {
    var html = runSmoke({ allergy: '' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-MANUAL-ALLERGY-EMPTY:');
    console.log('SMOKE-MANUAL-ALLERGY-EMPTY passed');
})();

(function() {
    var html = runSmoke({ scalp_sensitivity: 'sensitive' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-MANUAL-SCALP-SENSITIVE:');
    console.log('SMOKE-MANUAL-SCALP-SENSITIVE passed');
})();

(function() {
    var html = runSmoke({ scalp_sensitivity: 'unknown' });
    assertNotIncludes(html, 'approved-recipe', 'SMOKE-MANUAL-SCALP-UNKNOWN:');
    console.log('SMOKE-MANUAL-SCALP-UNKNOWN passed');
})();

// ============================================================
// SMOKE-PERSIST-* : Persistence infrastructure tests
// (core.js source text is available as the outer-scope coreJsSource)
// ============================================================

(function() {
    assert.ok(!coreJsSource.includes('localStorage.'),
        'SMOKE-PERSIST-NO-STORAGE-IN-CORE: core.js must not call localStorage. methods');
    assert.ok(!coreJsSource.includes('sessionStorage.'),
        'SMOKE-PERSIST-NO-STORAGE-IN-CORE: core.js must not call sessionStorage. methods');
    console.log('SMOKE-PERSIST-NO-STORAGE-IN-CORE passed');
})();

(function() {
    assert.ok(!uiIndexHtml.includes('localStorage'),
        'SMOKE-PERSIST-NO-STORAGE-IN-INDEX: index.html must not reference localStorage');
    console.log('SMOKE-PERSIST-NO-STORAGE-IN-INDEX passed');
})();

(function() {
    assert.strictEqual(safeParseJson('bad json'), null,
        'SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED: bad JSON must return null');
    assert.strictEqual(safeParseJson(''), null,
        'SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED: empty string must return null');
    assert.strictEqual(safeParseJson(null), null,
        'SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED: null must return null');
    assert.strictEqual(safeParseJson(undefined), null,
        'SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED: undefined must return null');
    assert.strictEqual(safeParseJson(42), null,
        'SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED: number must return null');
    console.log('SMOKE-PERSIST-SAFEJSON-NULL-FOR-MALFORMED passed');
})();

(function() {
    var r = safeParseJson('{"a":1}');
    assert.ok(r !== null && r.a === 1,
        'SMOKE-PERSIST-SAFEJSON-VALID: must parse valid object JSON');
    var arr = safeParseJson('[1,2,3]');
    assert.ok(Array.isArray(arr) && arr[0] === 1,
        'SMOKE-PERSIST-SAFEJSON-VALID: must parse valid array JSON');
    console.log('SMOKE-PERSIST-SAFEJSON-VALID passed');
})();

// ============================================================
// SMOKE-SAFETY-* : Critical safety invariants
// ============================================================

(function() {
    // BLOCKED and MANUAL states must never contain approved-recipe
    var scenarios = [
        { allergy: 'yes' },
        { scalp_sensitivity: 'irritated' },
        { target_direction: '' },
        { allergy: 'unknown' },
        { scalp_sensitivity: 'sensitive' }
    ];
    scenarios.forEach(function(override) {
        var html = runSmoke(override);
        assertNotIncludes(html, 'approved-recipe',
            'SMOKE-SAFETY-NO-APPROVED-IN-UNSAFE [' + JSON.stringify(override) + ']:');
    });
    console.log('SMOKE-SAFETY-NO-APPROVED-IN-UNSAFE passed');
})();

(function() {
    // Removing each critical gate field must prevent approved-recipe
    var gateTests = [
        { allergy: 'yes' },
        { scalp_sensitivity: 'irritated' },
        { target_direction: '' },
        { thickness: '' },
        { density: '' },
        { length: '' }
    ];
    gateTests.forEach(function(override) {
        var html = runSmoke(override);
        assertNotIncludes(html, 'approved-recipe',
            'SMOKE-SAFETY-APPROVED-REQUIRES-ALL-GATES [' + JSON.stringify(override) + ']:');
    });
    console.log('SMOKE-SAFETY-APPROVED-REQUIRES-ALL-GATES passed');
})();

console.log('WWW browser smoke test passed');
`;

const sandbox = {
    assert,
    console,
    document: forbiddenDocument,
    uiIndexHtml: indexHtml,
    coreJsSource: code
};

vm.createContext(sandbox);
vm.runInContext(code + '\n' + assertions, sandbox, { filename: 'www/core.js' });

assert.strictEqual(documentAccessed, false,
    'core.js must not access document at load time (forbidden proxy was triggered)');
