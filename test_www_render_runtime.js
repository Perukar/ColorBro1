const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('./www/core.js', 'utf8');

let documentAccessed = false;
const forbiddenDocument = new Proxy({}, {
    get() {
        documentAccessed = true;
        throw new Error('document should not be accessed by render runtime test');
    }
});

const assertions = `
if (typeof PerucarWwwRenderV1 !== 'object') {
    throw new Error('PerucarWwwRenderV1 is not available in www/core.js');
}

if (typeof calculateProtocol !== 'function') {
    throw new Error('calculateProtocol presence check failed');
}

if (typeof stripWwwHtmlText !== 'function') {
    throw new Error('stripWwwHtmlText presence check failed');
}

if (typeof normalizeWwwRecipeForRender !== 'function') {
    throw new Error('normalizeWwwRecipeForRender presence check failed');
}

if (typeof buildWwwRenderState !== 'function') {
    throw new Error('buildWwwRenderState presence check failed');
}

function assertIncludes(html, text) {
    assert.ok(html.includes(text), 'Expected HTML to include: ' + text + '\\nHTML:\\n' + html);
}

function assertNotIncludes(html, text) {
    assert.ok(!html.includes(text), 'Expected HTML not to include: ' + text + '\\nHTML:\\n' + html);
}

function assertBefore(html, first, second) {
    assert.ok(html.indexOf(first) !== -1, 'Missing first text: ' + first);
    assert.ok(html.indexOf(second) !== -1, 'Missing second text: ' + second);
    assert.ok(html.indexOf(first) < html.indexOf(second), 'Expected "' + first + '" before "' + second + '"');
}

function assertArrayIncludesEvery(actual, expected, id) {
    expected.forEach((item) => assert.ok(actual.includes(item), id + ' missing required item: ' + item));
}

function extractFirstDivBlockByHeading(html, heading) {
    const marker = '<h3>' + heading + '</h3>';
    const markerIndex = html.indexOf(marker);
    assert.ok(markerIndex !== -1, 'Missing block heading: ' + heading + '\\nHTML:\\n' + html);
    const start = html.lastIndexOf('<div', markerIndex);
    const next = html.indexOf('<div', markerIndex + marker.length);
    return html.slice(start, next === -1 ? html.length : next);
}

const approvedHtml = PerucarWwwRenderV1.renderStateToHtml({
    status: 'APPROVED',
    target: '8.1',
    warnings: ['Пористе волосся'],
    rootRec: {
        process: 'Перманент',
        dye: 'Барвник 8.1',
        ox: '6%',
        mass: 30,
        ratio: '1:1',
        mixtone: '1 г'
    },
    protocolText: 'Fallback protocol text must not render',
    phases: [
        {
            phaseName: 'Нанесення',
            steps: [
                { stepName: 'Крок 1', action: 'Нанести на корінь', details: '15 хв' }
            ]
        }
    ],
    mixtoneInfo: { root: '1 г' },
    massModel: { totalMass: 60 },
    timingInfo: { totalMinutes: 45 }
});

assertIncludes(approvedHtml, 'APPROVED');
assertIncludes(approvedHtml, '8.1');
assertIncludes(approvedHtml, 'approved-recipe');
assertIncludes(approvedHtml, 'Корінь');
assertIncludes(approvedHtml, 'Барвник 8.1');
assertIncludes(approvedHtml, 'Пористе волосся');
assertIncludes(approvedHtml, 'Нанесення');
assertIncludes(approvedHtml, 'Крок 1');
assertIncludes(approvedHtml, 'Нанести на корінь');
assertIncludes(approvedHtml, '15 хв');
assertNotIncludes(approvedHtml, 'Fallback protocol text must not render');
assertIncludes(approvedHtml, 'Мікстони');
assertIncludes(approvedHtml, 'Маси');
assertIncludes(approvedHtml, 'Таймінги');

const blockedHtml = PerucarWwwRenderV1.renderStateToHtml({
    status: 'BLOCKED',
    blockers: ['ФАТАЛЬНО: Хна/метали'],
    rootRec: {
        process: 'Перманент',
        dye: 'Барвник 8.1',
        ox: '6%',
        mass: 30,
        ratio: '1:1'
    }
});

assertBefore(blockedHtml, 'Блокування', 'BLOCKED');
assertIncludes(blockedHtml, 'ФАТАЛЬНО: Хна/метали');
assertIncludes(blockedHtml, 'BLOCKED');
assertNotIncludes(blockedHtml, 'approved-recipe');
assertNotIncludes(blockedHtml, 'Барвник 8.1');

const manualHtml = PerucarWwwRenderV1.renderStateToHtml({
    status: 'MANUAL_REQUIRED',
    manualDecisions: [
        { title: 'Оцінити тест-пасмо', message: 'Потрібне рішення щодо освітлення' }
    ],
    rootRec: {
        process: 'Special Blond',
        dye: 'S.B. 9.1',
        ox: '12%',
        mass: 30,
        ratio: '1:2'
    }
});

assertIncludes(manualHtml, 'MANUAL_REQUIRED');
assertIncludes(manualHtml, 'Потрібне ручне рішення майстра');
assertIncludes(manualHtml, 'Оцінити тест-пасмо');
assertIncludes(manualHtml, 'Потрібне рішення щодо освітлення');
assertNotIncludes(manualHtml, 'approved-recipe');
assertNotIncludes(manualHtml, 'S.B. 9.1');

const fatalHtml = PerucarWwwRenderV1.renderStateToHtml({
    status: 'FATAL_ERROR',
    error: new Error('Render failed')
});

assertIncludes(fatalHtml, 'Фатальна помилка');
assertIncludes(fatalHtml, 'Render failed');
assertNotIncludes(fatalHtml, 'Error: Render failed');
assertNotIncludes(fatalHtml, ' at ');

const xssHtml = PerucarWwwRenderV1.renderStateToHtml({
    status: 'APPROVED',
    target: '<script>alert(1)</script>',
    warnings: ['<script>alert(1)</script>']
});

assertNotIncludes(xssHtml, '<script>alert(1)</script>');
assertIncludes(xssHtml, '&lt;script&gt;alert(1)&lt;/script&gt;');

const reasonsHtml = PerucarWwwRenderV1.renderStateToHtml({
    status: 'APPROVED',
    diagnostics: ['Діагностика'],
    reasons: {
        grey: 'Сивина впливає на рішення',
        mass: { source: 'density', value: 60 }
    }
});

assertIncludes(reasonsHtml, 'grey');
assertIncludes(reasonsHtml, 'Сивина впливає на рішення');
assertIncludes(reasonsHtml, 'mass');
assertIncludes(reasonsHtml, 'source');
assertIncludes(reasonsHtml, 'density');

// Contract marker for the future diagnostic display. This test must not activate production ends rendering.
const diagnosticDisplayRenderContract = Object.freeze({
    id: 'DIAGNOSTIC-DISPLAY-RENDER-CONTRACT',
    status: 'PENDING_IMPLEMENTATION',
    blockRole: 'informational-warning-only',
    separatedFromProductionRecipes: true,
    existingTwoZoneRenderMustStayStable: true,
    notForMixing: true,
    requiredWarningLabels: [
        'Діагностика кінців',
        'Preview only',
        'Не для змішування',
        'Потрібна ручна перевірка',
        'Не є фінальним рецептом',
        'Не наносити за цим блоком'
    ],
    forbiddenProductionHeadings: [
        '<h3>Кінці</h3>',
        '<h3>Ends</h3>',
        '<h3>endsRec</h3>'
    ],
    forbiddenDisplayFields: [
        'dyeMass',
        'oxidizerMass',
        'grams',
        'exactGrams',
        'finalFormula',
        'endsFormula',
        'productionRecipe',
        'formula-to-mix'
    ],
    forbiddenRecipeTexts: [
        'змішати',
        'пропорції нанесення',
        'готовий рецепт для кінців',
        'готовий рецепт'
    ]
});

assert.strictEqual(diagnosticDisplayRenderContract.blockRole, 'informational-warning-only');
assert.strictEqual(diagnosticDisplayRenderContract.separatedFromProductionRecipes, true);
assert.strictEqual(diagnosticDisplayRenderContract.existingTwoZoneRenderMustStayStable, true);
assert.strictEqual(diagnosticDisplayRenderContract.notForMixing, true);
assertArrayIncludesEvery(diagnosticDisplayRenderContract.requiredWarningLabels, [
    'Діагностика кінців',
    'Preview only',
    'Не для змішування',
    'Потрібна ручна перевірка',
    'Не є фінальним рецептом',
    'Не наносити за цим блоком'
], diagnosticDisplayRenderContract.id);
assertArrayIncludesEvery(diagnosticDisplayRenderContract.forbiddenDisplayFields, [
    'dyeMass',
    'oxidizerMass',
    'grams',
    'exactGrams',
    'finalFormula',
    'endsFormula',
    'productionRecipe',
    'formula-to-mix'
], diagnosticDisplayRenderContract.id);
assertArrayIncludesEvery(diagnosticDisplayRenderContract.forbiddenRecipeTexts, [
    'змішати',
    'пропорції нанесення',
    'готовий рецепт для кінців',
    'готовий рецепт'
], diagnosticDisplayRenderContract.id);

const diagnosticDisplayCandidate = Object.freeze({
    displayType: 'diagnostic-display',
    labels: diagnosticDisplayRenderContract.requiredWarningLabels,
    previewOnly: true,
    candidateOnly: true,
    notForMixing: true,
    productionReady: false,
    endsRecipeReady: false,
    purpose: diagnosticDisplayRenderContract.blockRole
});

assert.strictEqual(diagnosticDisplayCandidate.notForMixing, true, diagnosticDisplayRenderContract.id);
assert.strictEqual(diagnosticDisplayCandidate.productionReady, false, diagnosticDisplayRenderContract.id);
assert.strictEqual(diagnosticDisplayCandidate.endsRecipeReady, false, diagnosticDisplayRenderContract.id);
diagnosticDisplayRenderContract.forbiddenDisplayFields.forEach((field) => {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(diagnosticDisplayCandidate, field), false,
        diagnosticDisplayRenderContract.id + ' candidate must not carry production field: ' + field);
});

const twoZoneContractState = {
    status: 'APPROVED',
    rootRec: {
        process: 'Перманент',
        dye: 'Root 8.1',
        ox: '6%',
        mass: 30,
        ratio: '1:1'
    },
    lenRec: {
        process: 'Перманент',
        dye: 'Length 8.1',
        ox: '6%',
        mass: 45,
        ratio: '1:1'
    }
};

const twoZoneBaselineHtml = PerucarWwwRenderV1.renderStateToHtml(twoZoneContractState);
const diagnosticDisplayHtml = PerucarWwwRenderV1.renderStateToHtml({
    ...twoZoneContractState,
    endsRecDiagnosticDisplayCandidate: diagnosticDisplayCandidate
});

assert.strictEqual(
    extractFirstDivBlockByHeading(diagnosticDisplayHtml, 'Корінь'),
    extractFirstDivBlockByHeading(twoZoneBaselineHtml, 'Корінь'),
    diagnosticDisplayRenderContract.id + ' must not mix diagnostic data into rootRec'
);
assert.strictEqual(
    extractFirstDivBlockByHeading(diagnosticDisplayHtml, 'Довжина'),
    extractFirstDivBlockByHeading(twoZoneBaselineHtml, 'Довжина'),
    diagnosticDisplayRenderContract.id + ' must not mix diagnostic data into lenRec'
);
diagnosticDisplayRenderContract.forbiddenProductionHeadings.forEach((heading) => {
    assertNotIncludes(diagnosticDisplayHtml, heading);
});
diagnosticDisplayRenderContract.forbiddenDisplayFields.forEach((field) => {
    assertNotIncludes(diagnosticDisplayHtml, field);
});
diagnosticDisplayRenderContract.forbiddenRecipeTexts.forEach((text) => {
    assertNotIncludes(diagnosticDisplayHtml, text);
});
assertNotIncludes(diagnosticDisplayHtml, 'third-zone production');
assertNotIncludes(diagnosticDisplayHtml, 'readyForMixing');
assertNotIncludes(diagnosticDisplayHtml, 'mixingReady');

const structuredPhasesHtml = PerucarWwwRenderV1.renderPhases([
    {
        phaseName: 'Тонування',
        steps: [
            { stepName: 'Крок A', action: 'Нанести', details: 'Пасмо 1 см' }
        ]
    }
]);

assertIncludes(structuredPhasesHtml, 'Тонування');
assertIncludes(structuredPhasesHtml, 'stepName');
assertIncludes(structuredPhasesHtml, 'Крок A');
assertIncludes(structuredPhasesHtml, 'action');
assertIncludes(structuredPhasesHtml, 'Нанести');
assertIncludes(structuredPhasesHtml, 'details');
assertIncludes(structuredPhasesHtml, 'Пасмо 1 см');

assert.strictEqual(stripWwwHtmlText('<b>Test</b><br>Line'), 'Test\\nLine');

const normalizedRecipe = normalizeWwwRecipeForRender({
    process: '<b>Перманент</b>',
    dye: '<b>Барвник</b><br><script>alert(1)</script>8.1',
    ox: '<i>6%</i>',
    oxidant: '<b>6%</b>',
    mass: 30,
    ratio: '<b>1:1</b>',
    mixtone: '<u>1 г</u>',
    notes: '<b>Note</b><br>Safe'
});

assert.strictEqual(normalizedRecipe.process, 'Перманент');
assertNotIncludes(normalizedRecipe.dye, '<b>');
assertNotIncludes(normalizedRecipe.dye, '<script>');
assertIncludes(normalizedRecipe.dye, 'Барвник');
assert.strictEqual(normalizedRecipe.notes, 'Note\\nSafe');
assert.strictEqual(normalizedRecipe.ox, '6%');
assert.strictEqual(normalizedRecipe.oxidant, '6%');
assert.strictEqual(normalizedRecipe.mass, '30');
assert.strictEqual(normalizedRecipe.ratio, '1:1');
assert.strictEqual(normalizedRecipe.mixtone, '1 г');

const originalCalculateProtocol = calculateProtocol;
let calculateProtocolCalls = 0;
let adapterState;
try {
    calculateProtocol = function () {
        calculateProtocolCalls += 1;
        throw new Error('buildWwwRenderState must not call calculateProtocol');
    };

    adapterState = buildWwwRenderState({
        status: 'APPROVED',
        target: '<script>alert(1)</script>',
        warnings: ['<b>Warning</b>'],
        rootRec: normalizedRecipe,
        plan: [
            '<b>Крок 1</b><br>Нанести',
            '<script>alert(1)</script>Контроль'
        ],
        protocolText: '<b>Fallback</b><br>Text'
    });
} finally {
    calculateProtocol = originalCalculateProtocol;
}

assert.strictEqual(calculateProtocolCalls, 0);
assert.strictEqual(adapterState.status, 'APPROVED');
assert.strictEqual(adapterState.rootRec.dye.includes('<'), false);
assert.strictEqual(adapterState.phases.length, 2);
assert.strictEqual(adapterState.phases[0].phaseName, 'Етап 1');
assert.strictEqual(adapterState.phases[0].steps[0], 'Крок 1\\nНанести');
assert.strictEqual(adapterState.phases[1].steps[0], 'alert(1)Контроль');

const blockedAdapterState = buildWwwRenderState({
    status: 'BLOCKED',
    blockers: ['ФАТАЛЬНО: stop']
});

assert.strictEqual(blockedAdapterState.status, 'BLOCKED');
assert.deepStrictEqual(blockedAdapterState.blockers, ['ФАТАЛЬНО: stop']);

const adapterHtml = PerucarWwwRenderV1.renderStateToHtml(adapterState);
assertNotIncludes(adapterHtml, '<script>alert(1)</script>');
assertNotIncludes(adapterHtml, '<b>Крок 1</b>');
assertNotIncludes(adapterHtml, '<b>Барвник</b>');
assertNotIncludes(adapterHtml, '<br>Нанести');
assertIncludes(adapterHtml, 'Крок 1');
assertIncludes(adapterHtml, 'Нанести');

const defaultDomValues = {
    history: 'натуральні',
    condition: 'здоровые',
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
    target_direction: '1'
};

function runCalculateProtocolWithValues(overrides = {}, options = {}) {
    const values = { ...defaultDomValues, ...overrides };
    const output = { innerHTML: '' };
    const fakeDocument = {
        getElementById(id) {
            if (id === 'output') return output;
            if (options.missingIds && options.missingIds.includes(id)) return undefined;
            if (!Object.prototype.hasOwnProperty.call(values, id)) {
                throw new Error('Missing fake DOM value for ' + id);
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

const blockedOutputHtml = runCalculateProtocolWithValues({
    history: 'хна / металл',
    condition: 'пористі'
});

assertIncludes(blockedOutputHtml, 'BLOCKED');
assertIncludes(blockedOutputHtml, 'Блокування');
assertIncludes(blockedOutputHtml, 'ФАТАЛЬНО: Хна/метали');
assertNotIncludes(blockedOutputHtml, 'approved-recipe');
assertNotIncludes(blockedOutputHtml, 'ПРОТОКОЛ ЗАТВЕРДЖЕНО');

const approvedOutputHtml = runCalculateProtocolWithValues();

assertIncludes(approvedOutputHtml, 'APPROVED');
assertIncludes(approvedOutputHtml, 'approved-recipe');
assertIncludes(approvedOutputHtml, 'Корінь');
assertIncludes(approvedOutputHtml, 'Довжина');
assertIncludes(approvedOutputHtml, 'Регламент дій');
assertNotIncludes(approvedOutputHtml, 'ПРОТОКОЛ ЗАТВЕРДЖЕНО');

const fatalOutputHtml = runCalculateProtocolWithValues({}, { missingIds: ['history'] });

assertIncludes(fatalOutputHtml, 'Фатальна помилка');
assertNotIncludes(fatalOutputHtml, 'ФАТАЛЬНА ПОМИЛКА СКРИПТА');
assertNotIncludes(fatalOutputHtml, ' at ');

if (typeof PerucarWwwMappingV1 !== 'object') {
    throw new Error('PerucarWwwMappingV1 presence check failed');
}

console.log('WWW render runtime test passed');
`;

const sandbox = {
    assert,
    console,
    document: forbiddenDocument
};

vm.createContext(sandbox);
vm.runInContext(code + '\n' + assertions, sandbox, { filename: 'www/core.js' });

assert.strictEqual(documentAccessed, false);
