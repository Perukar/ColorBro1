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
