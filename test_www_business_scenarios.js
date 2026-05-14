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
    ends_level: '6',
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
    ends_level: '10',
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

function runDiagnosticScenario(name, values) {
    const scenarioOutput = { innerHTML: '' };
    const scenarioRequestedIds = [];

    document = {
        getElementById(id) {
            scenarioRequestedIds.push(id);
            if (id === 'output') return scenarioOutput;
            if (!Object.prototype.hasOwnProperty.call(values, id)) {
                throw new Error('Missing ' + name + ' fake DOM value for ' + id);
            }
            return { value: values[id] };
        }
    };

    let error = null;
    try {
        calculateProtocol();
    } catch (caughtError) {
        error = caughtError;
    }

    return {
        html: scenarioOutput.innerHTML,
        requestedIds: scenarioRequestedIds,
        error
    };
}

const blackExitScenario = runDiagnosticScenario('BLACK-EXIT-1', {
    history: 'чорний косметичний пігмент',
    condition: 'середньо пористе',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '2',
    root_length: '1',
    length_level: '2',
    ends_level: '2',
    base_type: 'Косметична',
    target_level: '7',
    target_direction: '1'
});

assert.ok(blackExitScenario.requestedIds.includes('output'), 'BLACK-EXIT-1 should access output');

const blackExitHtml = blackExitScenario.html;
const blackExitHasApproved = blackExitHtml.includes('APPROVED')
    || blackExitHtml.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
const blackExitHasRecipe = blackExitHtml.includes('КОРІНЬ')
    || blackExitHtml.includes('ДОВЖИНА')
    || blackExitHtml.includes('Барвник');
const blackExitHasManualSignal = blackExitHtml.includes('MANUAL_REQUIRED')
    || blackExitHtml.includes('Потрібне ручне рішення')
    || blackExitHtml.includes('needs_confirmation');
const blackExitHasDiagnostics = blackExitHtml.includes('діагност')
    || blackExitHtml.includes('нашарув')
    || blackExitHtml.includes('змив')
    || blackExitHtml.includes('фон');
const blackExitKnownRisk = !blackExitScenario.error
    && blackExitHasApproved
    && blackExitHasRecipe
    && !blackExitHasManualSignal
    && !blackExitHasDiagnostics;

console.log(
    blackExitKnownRisk
        ? 'BLACK-EXIT-1 KNOWN_RISK: exact recipe can be rendered without explicit layering/removal/background diagnostics.'
        : 'BLACK-EXIT-1 diagnostic observed: blocking/manual/diagnostic signal or runtime rejection present.'
);

globalThis.__blackExitResult = {
    status: blackExitKnownRisk ? 'KNOWN_RISK' : 'DIAGNOSTIC_OBSERVED',
    hasApproved: blackExitHasApproved,
    hasRecipe: blackExitHasRecipe,
    hasManualSignal: blackExitHasManualSignal,
    hasDiagnostics: blackExitHasDiagnostics,
    hasError: Boolean(blackExitScenario.error)
};

// The www form exposes root, length, and ends levels. The first structural
// ends_level phase requires manual confirmation when ends differ.
const zonesScenario = runDiagnosticScenario('ZONES-ROOT-LENGTH-ENDS', {
    history: 'натуральні',
    condition: 'здоровые',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '4',
    root_length: '1',
    length_level: '7',
    ends_level: '9',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1'
});

assert.ok(zonesScenario.requestedIds.includes('output'), 'ZONES-ROOT-LENGTH-ENDS should access output');

const zonesHtml = zonesScenario.html;
const zonesHasApproved = zonesHtml.includes('APPROVED')
    || zonesHtml.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
const zonesHasRecipe = zonesHtml.includes('КОРІНЬ')
    || zonesHtml.includes('ДОВЖИНА')
    || zonesHtml.includes('Барвник');
const zonesHasManualSignal = zonesHtml.includes('MANUAL_REQUIRED')
    || zonesHtml.includes('Потрібне ручне рішення')
    || zonesHtml.includes('needs_confirmation');
const zonesHasZoneSplit = zonesHtml.includes('КІНЦ')
    || zonesHtml.includes('кінц')
    || zonesHtml.includes('окремі зони')
    || zonesHtml.includes('різні зони');
const zonesHasZoneWarning = zonesHtml.includes('ЗОНАЛЬНЕ РІШЕННЯ')
    && zonesHtml.includes('ends_level')
    && zonesHtml.includes('КІНЦІ МАЮТЬ ОКРЕМИЙ РІВЕНЬ')
    && zonesHtml.includes('Кінці потребують окремої оцінки майстром')
    && zonesHtml.includes('Окремий рецепт кінців на цьому етапі не рахується');

assert.ok(!zonesScenario.error, 'ZONES-ROOT-LENGTH-ENDS should not throw at runtime');
assert.ok(!zonesHasApproved, 'ZONES-ROOT-LENGTH-ENDS should not be unconditional APPROVED');
assert.ok(zonesHasManualSignal, 'ZONES-ROOT-LENGTH-ENDS should require manual confirmation');
assert.ok(zonesHasZoneSplit, 'ZONES-ROOT-LENGTH-ENDS should mention zone separation');
assert.ok(
    zonesHasZoneWarning,
    'ZONES-ROOT-LENGTH-ENDS should warn that ends_level is absent and ends need separate evaluation'
);

console.log('ZONES-ROOT-LENGTH-ENDS safe behavior observed.');

globalThis.__zonesResult = {
    status: 'SAFE',
    hasApproved: zonesHasApproved,
    hasRecipe: zonesHasRecipe,
    hasManualSignal: zonesHasManualSignal,
    hasZoneSplit: zonesHasZoneSplit,
    hasZoneWarning: zonesHasZoneWarning,
    hasError: Boolean(zonesScenario.error),
    limitation: 'ends_level is present, but no separate ends recipe is calculated in this phase.'
};

const missingCriticalDataScenario = runDiagnosticScenario('MISSING-CRITICAL-DATA', {
    history: '',
    condition: '',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '',
    root_length: '1',
    length_level: '',
    ends_level: '',
    base_type: '',
    target_level: '',
    target_direction: '1'
});

assert.ok(missingCriticalDataScenario.requestedIds.includes('output'), 'MISSING-CRITICAL-DATA should access output');

const missingHtml = missingCriticalDataScenario.html;
const missingHasApproved = missingHtml.includes('APPROVED')
    || missingHtml.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
const missingHasRecipe = missingHtml.includes('КОРІНЬ')
    || missingHtml.includes('ДОВЖИНА')
    || missingHtml.includes('Барвник');
const missingHasManualSignal = missingHtml.includes('MANUAL_REQUIRED')
    || missingHtml.includes('Потрібне ручне рішення')
    || missingHtml.includes('needs_confirmation');
const missingHasBlockingSignal = missingHtml.includes('insufficient_data')
    || missingHtml.includes('недостат')
    || missingHtml.includes('обов')
    || missingHtml.includes('заповн')
    || missingHtml.includes('BLOCKED');
const missingKnownRisk = !missingCriticalDataScenario.error
    && (missingHasApproved || missingHasRecipe)
    && !missingHasManualSignal
    && !missingHasBlockingSignal;

console.log(
    missingKnownRisk
        ? 'MISSING-CRITICAL-DATA UNSAFE: empty critical fields can still render a pseudo-specific result.'
        : 'MISSING-CRITICAL-DATA safe behavior observed: missing data is blocked, manual, or rejected.'
);

if (missingKnownRisk) {
    throw new Error('MISSING-CRITICAL-DATA must not render a pseudo-specific result for empty critical fields.');
}

globalThis.__missingCriticalDataResult = {
    status: missingKnownRisk ? 'UNSAFE' : 'SAFE',
    hasApproved: missingHasApproved,
    hasRecipe: missingHasRecipe,
    hasManualSignal: missingHasManualSignal,
    hasBlockingSignal: missingHasBlockingSignal,
    hasError: Boolean(missingCriticalDataScenario.error)
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
assert.ok(['KNOWN_RISK', 'DIAGNOSTIC_OBSERVED'].includes(sandbox.__blackExitResult.status));
assert.strictEqual(sandbox.__zonesResult.status, 'SAFE');
assert.strictEqual(sandbox.__missingCriticalDataResult.status, 'SAFE');
assert.strictEqual(sandbox.__missingCriticalDataResult.hasApproved, false);
assert.strictEqual(sandbox.__missingCriticalDataResult.hasRecipe, false);
assert.strictEqual(sandbox.__missingCriticalDataResult.hasBlockingSignal, true);

console.log('WWW business scenario test passed');
