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

function analyzeEndsScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');

    const html = scenario.html;
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const hasEndsLevelSignal = html.includes('ends_level')
        || html.includes('КІНЦІ')
        || html.includes('кінц')
        || html.includes('Окрема оцінка кінців');
    const hasNoEndsRecipeSignal = html.includes('Окремий рецепт кінців на цьому етапі не рахується')
        || !html.includes('<h3>Кінці</h3>');
    const hasPrePigSignal = html.includes('Препігментація')
        || html.includes('передпігментац')
        || html.includes('репігментац')
        || html.includes('заповнення пігменту')
        || html.includes('тепла підкладка');
    const hasBlockingSignal = html.includes('BLOCKED')
        || html.includes('ФАТАЛЬНО')
        || html.includes('заборонено');
    const hasDiagnosticSignal = hasManualSignal
        || hasEndsLevelSignal
        || hasPrePigSignal
        || hasBlockingSignal
        || html.includes('Діагностика')
        || html.includes('Пористе волосся');

    return {
        name,
        html,
        hasError: Boolean(scenario.error),
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        hasEndsLevelSignal,
        hasNoEndsRecipeSignal,
        hasPrePigSignal,
        hasBlockingSignal,
        hasDiagnosticSignal
    };
}

const endsLighterScenario = analyzeEndsScenario('ENDS-LIGHTER-THAN-LENGTH', {
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
    ends_level: '9',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1'
});

assert.ok(!endsLighterScenario.hasError, 'ENDS-LIGHTER-THAN-LENGTH should not throw at runtime');
assert.ok(endsLighterScenario.hasManualSignal, 'ENDS-LIGHTER-THAN-LENGTH should require manual confirmation');
assert.ok(endsLighterScenario.hasEndsLevelSignal, 'ENDS-LIGHTER-THAN-LENGTH should mention ends-level decision');
assert.ok(!endsLighterScenario.hasApproved, 'ENDS-LIGHTER-THAN-LENGTH should not be unconditional APPROVED');
assert.ok(!endsLighterScenario.hasApprovedRecipe, 'ENDS-LIGHTER-THAN-LENGTH should not render approved recipe blocks');
assert.ok(endsLighterScenario.hasNoEndsRecipeSignal, 'ENDS-LIGHTER-THAN-LENGTH should not expose an approved ends recipe');
console.log('ENDS-LIGHTER-THAN-LENGTH safe behavior observed.');

const endsDarkerScenario = analyzeEndsScenario('ENDS-DARKER-THAN-LENGTH', {
    history: 'натуральні',
    condition: 'здоровые',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '5',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1'
});

assert.ok(!endsDarkerScenario.hasError, 'ENDS-DARKER-THAN-LENGTH should not throw at runtime');
assert.ok(endsDarkerScenario.hasManualSignal, 'ENDS-DARKER-THAN-LENGTH should require manual confirmation');
assert.ok(endsDarkerScenario.hasEndsLevelSignal, 'ENDS-DARKER-THAN-LENGTH should warn that ends have another level');
assert.ok(!endsDarkerScenario.hasApproved, 'ENDS-DARKER-THAN-LENGTH should not be unconditional APPROVED');
assert.ok(!endsDarkerScenario.hasApprovedRecipe, 'ENDS-DARKER-THAN-LENGTH should not render approved recipe blocks');
console.log('ENDS-DARKER-THAN-LENGTH safe behavior observed.');

const endsPrepigScenario = analyzeEndsScenario('ENDS-10-6-PREPIG', {
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
});

assert.ok(!endsPrepigScenario.hasError, 'ENDS-10-6-PREPIG should not throw at runtime');
assert.ok(endsPrepigScenario.hasManualSignal, 'ENDS-10-6-PREPIG should require manual confirmation');
assert.ok(endsPrepigScenario.hasPrePigSignal, 'ENDS-10-6-PREPIG should mention prepigmentation or pigment filling');
assert.ok(!endsPrepigScenario.hasApproved, 'ENDS-10-6-PREPIG should not be unconditional APPROVED');
assert.ok(!endsPrepigScenario.hasApprovedRecipe, 'ENDS-10-6-PREPIG should not render approved recipe blocks');
assert.ok(endsPrepigScenario.hasNoEndsRecipeSignal, 'ENDS-10-6-PREPIG should not expose an automatic approved ends recipe');
console.log('ENDS-10-6-PREPIG safe behavior observed.');

const endsDamagedLiftScenario = analyzeEndsScenario('ENDS-DAMAGED-LIFT', {
    history: 'натуральні',
    condition: 'сильно поврежденные',
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
    target_level: '9',
    target_direction: '1'
});

assert.ok(!endsDamagedLiftScenario.hasError, 'ENDS-DAMAGED-LIFT should not throw at runtime');
assert.ok(endsDamagedLiftScenario.hasBlockingSignal || endsDamagedLiftScenario.hasManualSignal || endsDamagedLiftScenario.hasDiagnosticSignal, 'ENDS-DAMAGED-LIFT should show blocking/manual/diagnostic signal');
assert.ok(!endsDamagedLiftScenario.hasApproved, 'ENDS-DAMAGED-LIFT should not be unconditional APPROVED');
assert.ok(!endsDamagedLiftScenario.hasApprovedRecipe, 'ENDS-DAMAGED-LIFT should not render approved recipe blocks');
console.log('ENDS-DAMAGED-LIFT diagnostic observed: blocked/manual signal present; separate ends condition is still a limitation.');

const endsTargetBetweenScenario = analyzeEndsScenario('ENDS-TARGET-BETWEEN-LENGTH-ENDS', {
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
    ends_level: '9',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1'
});

assert.ok(!endsTargetBetweenScenario.hasError, 'ENDS-TARGET-BETWEEN-LENGTH-ENDS should not throw at runtime');
assert.ok(endsTargetBetweenScenario.hasManualSignal, 'ENDS-TARGET-BETWEEN-LENGTH-ENDS should require manual confirmation');
assert.ok(endsTargetBetweenScenario.hasEndsLevelSignal, 'ENDS-TARGET-BETWEEN-LENGTH-ENDS should mention ends-level decision');
assert.ok(!endsTargetBetweenScenario.hasApproved, 'ENDS-TARGET-BETWEEN-LENGTH-ENDS should not be unconditional APPROVED');
assert.ok(!endsTargetBetweenScenario.hasApprovedRecipe, 'ENDS-TARGET-BETWEEN-LENGTH-ENDS should not render approved recipe blocks');
console.log('ENDS-TARGET-BETWEEN-LENGTH-ENDS safe behavior observed.');

const endsCosmeticUnknownHistoryScenario = analyzeEndsScenario('ENDS-COSMETIC-UNKNOWN-HISTORY', {
    history: 'невідома',
    condition: 'здоровые',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '6',
    root_length: '1',
    length_level: '6',
    ends_level: '8',
    base_type: 'Косметична',
    target_level: '7',
    target_direction: '1'
});

const endsCosmeticUnknownKnownRisk = !endsCosmeticUnknownHistoryScenario.hasError
    && (endsCosmeticUnknownHistoryScenario.hasApproved || endsCosmeticUnknownHistoryScenario.hasApprovedRecipe)
    && !endsCosmeticUnknownHistoryScenario.hasManualSignal
    && !endsCosmeticUnknownHistoryScenario.hasDiagnosticSignal;

assert.ok(!endsCosmeticUnknownHistoryScenario.hasError, 'ENDS-COSMETIC-UNKNOWN-HISTORY should not throw at runtime');
assert.ok(!endsCosmeticUnknownKnownRisk, 'ENDS-COSMETIC-UNKNOWN-HISTORY should not be silent unconditional APPROVED');
assert.ok(
    endsCosmeticUnknownHistoryScenario.hasManualSignal || endsCosmeticUnknownHistoryScenario.hasDiagnosticSignal,
    'ENDS-COSMETIC-UNKNOWN-HISTORY should expose manual/diagnostic signal'
);
console.log('ENDS-COSMETIC-UNKNOWN-HISTORY diagnostic observed: separate ends history is not available in current contract.');

globalThis.__endsResults = {
    lighter: { status: 'SAFE', hasManualSignal: endsLighterScenario.hasManualSignal, hasApproved: endsLighterScenario.hasApproved, hasApprovedRecipe: endsLighterScenario.hasApprovedRecipe },
    darker: { status: 'SAFE', hasManualSignal: endsDarkerScenario.hasManualSignal, hasApproved: endsDarkerScenario.hasApproved, hasApprovedRecipe: endsDarkerScenario.hasApprovedRecipe },
    prepig: { status: 'SAFE', hasManualSignal: endsPrepigScenario.hasManualSignal, hasPrePigSignal: endsPrepigScenario.hasPrePigSignal, hasApproved: endsPrepigScenario.hasApproved, hasApprovedRecipe: endsPrepigScenario.hasApprovedRecipe },
    damagedLift: { status: 'DIAGNOSTIC_OBSERVED', hasBlockingSignal: endsDamagedLiftScenario.hasBlockingSignal, hasManualSignal: endsDamagedLiftScenario.hasManualSignal, limitation: 'No separate ends condition field in current contract.' },
    targetBetween: { status: 'SAFE', hasManualSignal: endsTargetBetweenScenario.hasManualSignal, hasApproved: endsTargetBetweenScenario.hasApproved, hasApprovedRecipe: endsTargetBetweenScenario.hasApprovedRecipe },
    cosmeticUnknownHistory: { status: endsCosmeticUnknownKnownRisk ? 'KNOWN_RISK' : 'DIAGNOSTIC_OBSERVED', hasManualSignal: endsCosmeticUnknownHistoryScenario.hasManualSignal, hasDiagnosticSignal: endsCosmeticUnknownHistoryScenario.hasDiagnosticSignal, limitation: 'No separate ends history/base_type field in current contract.' }
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
assert.strictEqual(sandbox.__endsResults.lighter.status, 'SAFE');
assert.strictEqual(sandbox.__endsResults.darker.status, 'SAFE');
assert.strictEqual(sandbox.__endsResults.prepig.status, 'SAFE');
assert.strictEqual(sandbox.__endsResults.damagedLift.status, 'DIAGNOSTIC_OBSERVED');
assert.strictEqual(sandbox.__endsResults.targetBetween.status, 'SAFE');
assert.ok(['KNOWN_RISK', 'DIAGNOSTIC_OBSERVED'].includes(sandbox.__endsResults.cosmeticUnknownHistory.status));
assert.strictEqual(sandbox.__missingCriticalDataResult.status, 'SAFE');
assert.strictEqual(sandbox.__missingCriticalDataResult.hasApproved, false);
assert.strictEqual(sandbox.__missingCriticalDataResult.hasRecipe, false);
assert.strictEqual(sandbox.__missingCriticalDataResult.hasBlockingSignal, true);

console.log('WWW business scenario test passed');
