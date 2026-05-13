const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('./www/core.js', 'utf8');

const assertions = `
if (typeof calculateProtocol !== 'function') {
    throw new Error('calculateProtocol presence check failed');
}

const scenarioValues = {
    history: 'натуральні',
    condition: 'здоровые',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '6',
    root_length: '1',
    length_level: '6',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '3'
};

const output = { innerHTML: '' };
const requestedIds = [];

document = {
    getElementById(id) {
        requestedIds.push(id);
        if (id === 'output') return output;
        if (!Object.prototype.hasOwnProperty.call(scenarioValues, id)) {
            throw new Error('Missing fake DOM value for ' + id);
        }
        return { value: scenarioValues[id] };
    }
};

calculateProtocol();

const html = output.innerHTML;
assert.ok(html, 'SB-6-83 should render a non-empty result');
assert.ok(requestedIds.includes('output'), 'SB-6-83 should write to output');

const hasApproved = html.includes('APPROVED');
const hasApprovedRecipe = html.includes('approved-recipe');
const hasSpecialBlond = html.includes('Special Blond');
const hasSbDye = html.includes('S.B. 8.3');
const hasNinePercent = html.includes('9%');
const hasManualSignal = html.includes('MANUAL_REQUIRED')
    || html.includes('needs_confirmation')
    || html.includes('risk warning')
    || html.includes('Потрібне ручне рішення');
const hasBaseSixWarning = html.includes('Special Blond з бази 6')
    && html.includes('технологію бренду');

const unsafeApprovedSpecialBlond = hasApproved
    && hasApprovedRecipe
    && (hasSpecialBlond || hasSbDye)
    && hasNinePercent
    && !hasManualSignal;

assert.ok(
    hasSpecialBlond || hasSbDye || hasNinePercent || hasManualSignal,
    'SB-6-83 diagnostic should expose current decision details'
);

if (unsafeApprovedSpecialBlond) {
    throw new Error('SB-6-83 must not render APPROVED Special Blond + 9% without manual confirmation.');
} else {
    assert.ok(hasManualSignal || !hasApproved || !hasApprovedRecipe, 'SB-6-83 should not be unconditional APPROVED Special Blond');
    assert.ok(hasManualSignal, 'SB-6-83 should require manual confirmation');
    assert.ok(hasBaseSixWarning, 'SB-6-83 should warn about Special Blond from base 6');
    assert.ok(!hasApprovedRecipe, 'SB-6-83 should not render approved recipe blocks');
    console.log('SB-6-83 safe behavior observed.');
}

globalThis.__testResult = {
    status: unsafeApprovedSpecialBlond ? 'UNSAFE' : 'SAFE',
    hasApproved,
    hasApprovedRecipe,
    hasSpecialBlond,
    hasSbDye,
    hasNinePercent,
    hasManualSignal,
    hasBaseSixWarning
};

const prepigScenarioValues = {
    history: 'натуральні',
    condition: 'здоровые',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '10',
    root_length: '1',
    length_level: '10',
    base_type: 'Натуральна',
    target_level: '6',
    target_direction: '1'
};

const prepigOutput = { innerHTML: '' };
const prepigRequestedIds = [];

document = {
    getElementById(id) {
        prepigRequestedIds.push(id);
        if (id === 'output') return prepigOutput;
        if (!Object.prototype.hasOwnProperty.call(prepigScenarioValues, id)) {
            throw new Error('Missing PREPIG-10-6 fake DOM value for ' + id);
        }
        return { value: prepigScenarioValues[id] };
    }
};

calculateProtocol();

const prepigHtml = prepigOutput.innerHTML;
assert.ok(prepigHtml, 'PREPIG-10-6 should render a non-empty result');
assert.ok(prepigRequestedIds.includes('output'), 'PREPIG-10-6 should write to output');

const prepigHasApproved = prepigHtml.includes('APPROVED')
    || prepigHtml.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
const prepigHasRecipe = prepigHtml.includes('КОРІНЬ')
    || prepigHtml.includes('ДОВЖИНА')
    || prepigHtml.includes('Барвник 6.1');
const prepigHasManualSignal = prepigHtml.includes('MANUAL_REQUIRED')
    || prepigHtml.includes('needs_confirmation')
    || prepigHtml.includes('risk warning')
    || prepigHtml.includes('Потрібне ручне рішення');
const prepigHasPrePigSignal = prepigHtml.includes('Препігментація')
    || prepigHtml.includes('передпігментац')
    || prepigHtml.includes('репігментац')
    || prepigHtml.includes('заповнення пігменту')
    || prepigHtml.includes('тепла підкладка');

const prepigUnsafeUnconditionalApproved = prepigHasApproved
    && prepigHasRecipe
    && !prepigHasManualSignal
    && !prepigHasPrePigSignal;

assert.ok(
    prepigHasApproved || prepigHasRecipe || prepigHasManualSignal || prepigHasPrePigSignal,
    'PREPIG-10-6 diagnostic should expose current decision details'
);

if (prepigUnsafeUnconditionalApproved) {
    throw new Error('PREPIG-10-6 must not render unconditional approved darkening without prepigmentation/manual signal.');
} else {
    assert.ok(prepigHasManualSignal, 'PREPIG-10-6 should require manual decision');
    assert.ok(prepigHasPrePigSignal, 'PREPIG-10-6 should mention prepigmentation or pigment filling');
    assert.ok(!prepigHasApproved, 'PREPIG-10-6 should not remain APPROVED after repair');
    console.log('PREPIG-10-6 safe behavior observed.');
}

globalThis.__prepigResult = {
    status: prepigUnsafeUnconditionalApproved ? 'UNSAFE' : 'SAFE',
    hasApproved: prepigHasApproved,
    hasRecipe: prepigHasRecipe,
    hasManualSignal: prepigHasManualSignal,
    hasPrePigSignal: prepigHasPrePigSignal
};
`;

const sandbox = {
    assert,
    console,
    document: {}
};

vm.createContext(sandbox);
vm.runInContext(code + '\n' + assertions, sandbox, { filename: 'www/core.js' });

assert.strictEqual(sandbox.__testResult.status, 'SAFE');
assert.strictEqual(sandbox.__testResult.hasApproved, false);
assert.strictEqual(sandbox.__testResult.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__testResult.hasManualSignal, true);
assert.strictEqual(sandbox.__testResult.hasBaseSixWarning, true);
assert.strictEqual(sandbox.__prepigResult.status, 'SAFE');
assert.strictEqual(sandbox.__prepigResult.hasApproved, false);
assert.strictEqual(sandbox.__prepigResult.hasManualSignal, true);
assert.strictEqual(sandbox.__prepigResult.hasPrePigSignal, true);

console.log('WWW business scenario test passed');
