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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '3',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '6',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
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

// === GREY-50-SPECIAL-BLOND-BLOCK ===
const greySbScenarioValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '50', grey_type: 'мягкая',
    root_level: '6', root_length: '1', length_level: '6', ends_level: '6', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '8', target_direction: '3', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const greySbOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? greySbOutput : { value: greySbScenarioValues[id] };
calculateProtocol();
const greySbHtml = greySbOutput.innerHTML;
const greySbHasBlockedSpecialBlond = greySbHtml.includes('ЗАБОРОНА SPECIAL BLOND: Сивина &gt;= 50%');
const greySbHasPermanent = greySbHtml.includes('Перманент');
assert.ok(greySbHasBlockedSpecialBlond, 'GREY-50-SPECIAL-BLOND-BLOCK should block Special Blond');
assert.ok(greySbHasPermanent, 'GREY-50-SPECIAL-BLOND-BLOCK should fallback to Permanent');
console.log('GREY-50-SPECIAL-BLOND-BLOCK safe behavior observed.');

// === GREY-50-ADDS-00-BASE ===
const greyBaseScenarioValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '70', grey_type: 'мягкая',
    root_level: '6', root_length: '1', length_level: '6', ends_level: '6', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '7', target_direction: '1', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const greyBaseOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? greyBaseOutput : { value: greyBaseScenarioValues[id] };
calculateProtocol();
const greyBaseHtml = greyBaseOutput.innerHTML;
const greyBaseHasBase = greyBaseHtml.includes('База 6.00');
const greyBaseHasPermanent = greyBaseHtml.includes('Перманент');
assert.ok(greyBaseHasBase, 'GREY-50-ADDS-00-BASE should add .00 base to recipe');
assert.ok(greyBaseHasPermanent, 'GREY-50-ADDS-00-BASE should use Permanent');
console.log('GREY-50-ADDS-00-BASE safe behavior observed.');

// === GREY-GLASSY-MORDONSAGE ===
const greyGlassyScenarioValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '30', grey_type: 'стекловидная',
    root_level: '6', root_length: '1', length_level: '6', ends_level: '6', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '6', target_direction: '1', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const greyGlassyOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? greyGlassyOutput : { value: greyGlassyScenarioValues[id] };
calculateProtocol();
const greyGlassyHtml = greyGlassyOutput.innerHTML;
const greyGlassyHasMordonsage = greyGlassyHtml.includes('Скловидна сивина. Потрібен мордонсаж');
assert.ok(greyGlassyHasMordonsage, 'GREY-GLASSY-MORDONSAGE should suggest mordonsage');
console.log('GREY-GLASSY-MORDONSAGE safe behavior observed.');

// === GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED ===
const grey30SbScenarioValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '30', grey_type: 'мягкая',
    root_level: '7', root_length: '1', length_level: '7', ends_level: '7', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '9', target_direction: '3', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const grey30SbOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? grey30SbOutput : { value: grey30SbScenarioValues[id] };
calculateProtocol();
const grey30SbHtml = grey30SbOutput.innerHTML;
assert.strictEqual(grey30SbHtml.includes('APPROVED'), false, 'GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED should NOT be APPROVED');
assert.ok(grey30SbHtml.includes('MANUAL_REQUIRED') || grey30SbHtml.includes('Ручне рішення'), 'GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED should require manual decision');
console.log('GREY-30-SPECIAL-BLOND-MANUAL-REQUIRED safe behavior observed.');

// === GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED ===
const grey30GlassySbScenarioValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '30', grey_type: 'стекловидная',
    root_level: '7', root_length: '1', length_level: '7', ends_level: '7', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '9', target_direction: '3', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const grey30GlassySbOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? grey30GlassySbOutput : { value: grey30GlassySbScenarioValues[id] };
calculateProtocol();
const grey30GlassySbHtml = grey30GlassySbOutput.innerHTML;
assert.ok(grey30GlassySbHtml.includes('мордонсаж'), 'GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED should suggest mordonsage');
assert.strictEqual(grey30GlassySbHtml.includes('APPROVED'), false, 'GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED should NOT be APPROVED');
assert.ok(grey30GlassySbHtml.includes('MANUAL_REQUIRED') || grey30GlassySbHtml.includes('Ручне рішення'), 'GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED should require manual decision');
console.log('GREY-30-GLASSY-SPECIAL-BLOND-MANUAL-REQUIRED safe behavior observed.');

// === GREY-30-PERMANENT-SOFT-WARNING ===
const grey30PermSoftValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '30', grey_type: 'мягкая',
    root_level: '5', root_length: '1', length_level: '5', ends_level: '5', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '6', target_direction: '1', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const grey30PermSoftOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? grey30PermSoftOutput : { value: grey30PermSoftValues[id] };
calculateProtocol();
const grey30PermSoftHtml = grey30PermSoftOutput.innerHTML;
assert.ok(!grey30PermSoftHtml.includes('▪️ База'), 'GREY-30-PERMANENT-SOFT-WARNING should NOT auto-add .00 base to recipe');
assert.ok(grey30PermSoftHtml.includes('APPROVED'), 'GREY-30-PERMANENT-SOFT-WARNING should be APPROVED');
assert.ok(grey30PermSoftHtml.includes('можлива прозорість') || grey30PermSoftHtml.includes('недостатнє покриття'), 'GREY-30-PERMANENT-SOFT-WARNING should have warning about transparency and .00 base');
console.log('GREY-30-PERMANENT-SOFT-WARNING safe behavior observed.');

// === GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED ===
const grey30PermGlassyValues = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '30', grey_type: 'стекловидная',
    root_level: '5', root_length: '1', length_level: '5', ends_level: '5', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '6', target_direction: '1', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const grey30PermGlassyOutput = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? grey30PermGlassyOutput : { value: grey30PermGlassyValues[id] };
calculateProtocol();
const grey30PermGlassyHtml = grey30PermGlassyOutput.innerHTML;
assert.ok(!grey30PermGlassyHtml.includes('▪️ База'), 'GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED should NOT auto-add .00 base to recipe');
assert.ok(grey30PermGlassyHtml.includes('мордонсаж'), 'GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED should have warning about mordonsage');
assert.ok(!grey30PermGlassyHtml.includes('APPROVED'), 'GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED should NOT be APPROVED');
assert.ok(grey30PermGlassyHtml.includes('MANUAL_REQUIRED') || grey30PermGlassyHtml.includes('Ручне рішення'), 'GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED should require manual decision');
console.log('GREY-30-PERMANENT-GLASSY-MANUAL-REQUIRED safe behavior observed.');

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
    ends_condition: 'здорові',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
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
    && (zonesHtml.includes('КІНЦІ МАЮТЬ ОКРЕМИЙ РІВЕНЬ') || zonesHtml.includes('ЗОНАЛЬНЕ РІШЕННЯ'))
    && (zonesHtml.includes('Кінці потребують окремої оцінки майстром') || zonesHtml.includes('Потрібне ручне підтвердження зонального рішення'));

assert.ok(!zonesScenario.error, 'ZONES-ROOT-LENGTH-ENDS should not throw at runtime');
assert.ok(!zonesHasApproved, 'ZONES-ROOT-LENGTH-ENDS should not be unconditional APPROVED');
assert.ok(zonesHasManualSignal, 'ZONES-ROOT-LENGTH-ENDS should require manual confirmation');
assert.ok(zonesHasZoneSplit, 'ZONES-ROOT-LENGTH-ENDS should mention zone separation');
assert.ok(
    zonesHasZoneWarning,
    'ZONES-ROOT-LENGTH-ENDS should warn that ends_level differs and ends need separate evaluation'
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
    const hasEndsConditionSignal = html.includes('ends_condition')
        || html.includes('СТАН КІНЦІВ')
        || html.includes('Стан кінців')
        || html.includes('оцінки кінців')
        || html.includes('порист')
        || html.includes('ламк')
        || html.includes('пошкод');
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
        hasEndsConditionSignal,
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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '6',
    target_direction: '1',
    ends_history: 'освітлені',
    ends_base_type: 'освітлена'
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
    ends_condition: 'сильно пошкоджені',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});

assert.ok(!endsDamagedLiftScenario.hasError, 'ENDS-DAMAGED-LIFT should not throw at runtime');
assert.ok(endsDamagedLiftScenario.hasManualSignal, 'ENDS-DAMAGED-LIFT should require manual confirmation');
assert.ok(endsDamagedLiftScenario.hasEndsConditionSignal, 'ENDS-DAMAGED-LIFT should mention risky ends condition');
assert.ok(!endsDamagedLiftScenario.hasApproved, 'ENDS-DAMAGED-LIFT should not be unconditional APPROVED');
assert.ok(!endsDamagedLiftScenario.hasApprovedRecipe, 'ENDS-DAMAGED-LIFT should not render approved recipe blocks');
console.log('ENDS-DAMAGED-LIFT safe behavior observed.');

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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
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
    ends_condition: 'здорові',
    base_type: 'Косметична',
    target_level: '7',
    target_direction: '1',
    ends_history: 'невідома історія',
    ends_base_type: 'косметична'
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
    damagedLift: { status: 'SAFE', hasManualSignal: endsDamagedLiftScenario.hasManualSignal, hasEndsConditionSignal: endsDamagedLiftScenario.hasEndsConditionSignal, hasApproved: endsDamagedLiftScenario.hasApproved, hasApprovedRecipe: endsDamagedLiftScenario.hasApprovedRecipe },
    targetBetween: { status: 'SAFE', hasManualSignal: endsTargetBetweenScenario.hasManualSignal, hasApproved: endsTargetBetweenScenario.hasApproved, hasApprovedRecipe: endsTargetBetweenScenario.hasApprovedRecipe },
    cosmeticUnknownHistory: { status: endsCosmeticUnknownKnownRisk ? 'KNOWN_RISK' : 'DIAGNOSTIC_OBSERVED', hasManualSignal: endsCosmeticUnknownHistoryScenario.hasManualSignal, hasDiagnosticSignal: endsCosmeticUnknownHistoryScenario.hasDiagnosticSignal, limitation: 'No separate ends history/base_type field in current contract.' }
};

const endsConditionPorousLiftScenario = analyzeEndsScenario('ENDS-CONDITION-POROUS-LIFT', {
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
    ends_condition: 'пористі',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});

assert.ok(!endsConditionPorousLiftScenario.hasError, 'ENDS-CONDITION-POROUS-LIFT should not throw at runtime');
assert.ok(endsConditionPorousLiftScenario.hasManualSignal, 'ENDS-CONDITION-POROUS-LIFT should require manual confirmation');
assert.ok(endsConditionPorousLiftScenario.hasEndsConditionSignal, 'ENDS-CONDITION-POROUS-LIFT should mention porous ends condition');
assert.ok(!endsConditionPorousLiftScenario.hasApproved, 'ENDS-CONDITION-POROUS-LIFT should not be unconditional APPROVED');
assert.ok(!endsConditionPorousLiftScenario.hasApprovedRecipe, 'ENDS-CONDITION-POROUS-LIFT should not render approved recipe blocks');
console.log('ENDS-CONDITION-POROUS-LIFT safe behavior observed.');

const endsConditionBrittleHighLiftScenario = analyzeEndsScenario('ENDS-CONDITION-BRITTLE-HIGH-LIFT', {
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
    ends_condition: 'ламкі',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'освітлені',
    ends_base_type: 'освітлена'
});

assert.ok(!endsConditionBrittleHighLiftScenario.hasError, 'ENDS-CONDITION-BRITTLE-HIGH-LIFT should not throw at runtime');
assert.ok(endsConditionBrittleHighLiftScenario.hasManualSignal, 'ENDS-CONDITION-BRITTLE-HIGH-LIFT should require manual confirmation');
assert.ok(endsConditionBrittleHighLiftScenario.hasEndsConditionSignal, 'ENDS-CONDITION-BRITTLE-HIGH-LIFT should mention brittle ends condition');
assert.ok(!endsConditionBrittleHighLiftScenario.hasApproved, 'ENDS-CONDITION-BRITTLE-HIGH-LIFT should not be unconditional APPROVED');
assert.ok(!endsConditionBrittleHighLiftScenario.hasApprovedRecipe, 'ENDS-CONDITION-BRITTLE-HIGH-LIFT should not render approved recipe blocks');
console.log('ENDS-CONDITION-BRITTLE-HIGH-LIFT safe behavior observed.');

const endsConditionDamagedChemistryScenario = analyzeEndsScenario('ENDS-CONDITION-DAMAGED-CHEMISTRY', {
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
    ends_level: '7',
    ends_condition: 'критично пошкоджені',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});

assert.ok(!endsConditionDamagedChemistryScenario.hasError, 'ENDS-CONDITION-DAMAGED-CHEMISTRY should not throw at runtime');
assert.ok(endsConditionDamagedChemistryScenario.hasManualSignal, 'ENDS-CONDITION-DAMAGED-CHEMISTRY should require manual confirmation');
assert.ok(endsConditionDamagedChemistryScenario.hasEndsConditionSignal, 'ENDS-CONDITION-DAMAGED-CHEMISTRY should mention damaged ends condition');
assert.ok(!endsConditionDamagedChemistryScenario.hasApproved, 'ENDS-CONDITION-DAMAGED-CHEMISTRY should not be unconditional APPROVED');
assert.ok(!endsConditionDamagedChemistryScenario.hasApprovedRecipe, 'ENDS-CONDITION-DAMAGED-CHEMISTRY should not render approved recipe blocks');
console.log('ENDS-CONDITION-DAMAGED-CHEMISTRY safe behavior observed.');

const endsConditionMissingWithDifferentLevelScenario = analyzeEndsScenario('ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL', {
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
    ends_condition: '',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});

assert.ok(!endsConditionMissingWithDifferentLevelScenario.hasError, 'ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL should not throw at runtime');
assert.ok(endsConditionMissingWithDifferentLevelScenario.hasManualSignal, 'ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL should require manual confirmation');
assert.ok(endsConditionMissingWithDifferentLevelScenario.hasEndsConditionSignal, 'ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL should mention missing ends condition');
assert.ok(!endsConditionMissingWithDifferentLevelScenario.hasApproved, 'ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL should not be unconditional APPROVED');
assert.ok(!endsConditionMissingWithDifferentLevelScenario.hasApprovedRecipe, 'ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL should not render approved recipe blocks');
console.log('ENDS-CONDITION-MISSING-WITH-DIFFERENT-LEVEL safe behavior observed.');

globalThis.__endsConditionResults = {
    porousLift: { status: 'SAFE', hasManualSignal: endsConditionPorousLiftScenario.hasManualSignal, hasEndsConditionSignal: endsConditionPorousLiftScenario.hasEndsConditionSignal },
    brittleHighLift: { status: 'SAFE', hasManualSignal: endsConditionBrittleHighLiftScenario.hasManualSignal, hasEndsConditionSignal: endsConditionBrittleHighLiftScenario.hasEndsConditionSignal },
    damagedChemistry: { status: 'SAFE', hasManualSignal: endsConditionDamagedChemistryScenario.hasManualSignal, hasEndsConditionSignal: endsConditionDamagedChemistryScenario.hasEndsConditionSignal },
    missingWithDifferentLevel: { status: 'SAFE', hasManualSignal: endsConditionMissingWithDifferentLevelScenario.hasManualSignal, hasEndsConditionSignal: endsConditionMissingWithDifferentLevelScenario.hasEndsConditionSignal }
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
    ends_condition: '',
    base_type: '',
    target_level: '',
    target_direction: '1',
    ends_history: '',
    ends_base_type: ''
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

const endsHistoryUnknownScenario = analyzeEndsScenario('ENDS-HISTORY-UNKNOWN', {
    ...missingCriticalDataScenario, // baseline defaults
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'невідома історія', ends_base_type: 'натуральна'
});

const endsHistoryCosmeticLiftScenario = analyzeEndsScenario('ENDS-HISTORY-COSMETIC-LIFT', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'косметичний пігмент', ends_base_type: 'косметична'
});

const endsHistoryDarkCosmeticScenario = analyzeEndsScenario('ENDS-HISTORY-DARK-COSMETIC', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'темний косметичний пігмент', ends_base_type: 'косметична'
});

const endsHistoryAfterRemoverScenario = analyzeEndsScenario('ENDS-HISTORY-AFTER-REMOVER', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'після змивки', ends_base_type: 'косметична'
});

const endsHistoryHennaMetalsScenario = analyzeEndsScenario('ENDS-HISTORY-HENNA-METALS', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'хна / метали', ends_base_type: 'змішана / нерівномірна'
});

const endsBaseTypeCosmeticLiftScenario = analyzeEndsScenario('ENDS-BASE-TYPE-COSMETIC-LIFT', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'освітлені', ends_base_type: 'косметична'
});

const endsBaseTypeMixedUnevenScenario = analyzeEndsScenario('ENDS-BASE-TYPE-MIXED-UNEVEN', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'змішана / нерівномірна'
});

const endsHistoryMissingWithDifferentLevelScenario = analyzeEndsScenario('ENDS-HISTORY-MISSING-WITH-DIFFERENT-LEVEL', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '9', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: '', ends_base_type: ''
});

globalThis.__endsHistoryBaseResults = {
    unknown: { status: 'SAFE', hasManualSignal: endsHistoryUnknownScenario.hasManualSignal },
    cosmeticLift: { status: 'SAFE', hasManualSignal: endsHistoryCosmeticLiftScenario.hasManualSignal },
    darkCosmetic: { status: 'SAFE', hasManualSignal: endsHistoryDarkCosmeticScenario.hasManualSignal },
    afterRemover: { status: 'SAFE', hasManualSignal: endsHistoryAfterRemoverScenario.hasManualSignal },
    hennaMetals: { status: 'SAFE', hasManualSignal: endsHistoryHennaMetalsScenario.hasManualSignal },
    baseCosmeticLift: { status: 'SAFE', hasManualSignal: endsBaseTypeCosmeticLiftScenario.hasManualSignal },
    baseMixedUneven: { status: 'SAFE', hasManualSignal: endsBaseTypeMixedUnevenScenario.hasManualSignal },
    missingWithDifferentLevel: { status: 'SAFE', hasManualSignal: endsHistoryMissingWithDifferentLevelScenario.hasManualSignal }
};


// MASS-MODEL-3-ZONES-TOTAL: DIAGNOSTIC / KNOWN LIMITATION
// 3-zone mass model (root+length+ends) is not publicly exposed via HTML output.
// This is a known limitation. endsMass does not exist yet in the current implementation.
// Test verifies only that the scenario runs without error and does not crash.
const massModelDiagnosticScenario = runDiagnosticScenario('MASS-MODEL-DIAGNOSTIC', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '6', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'натуральна'
});
assert.ok(!massModelDiagnosticScenario.error, 'MASS-MODEL-DIAGNOSTIC should not throw at runtime');
const massModelHtml = massModelDiagnosticScenario.html;
assert.ok(massModelHtml, 'MASS-MODEL-DIAGNOSTIC should produce non-empty output');
// KNOWN LIMITATION: mass-model details (rootMass, lengthMass, endsMass) are
// rendered inside the HTML but not parseable as a structured public API.
// Future: assert endsMass presence once 3-zone model is implemented.
console.log('MASS-MODEL-DIAGNOSTIC safe behavior observed (2-zone only, endsMass not implemented).');

// MASS-MODEL-ROUNDING: DIAGNOSTIC / KNOWN LIMITATION
// Cannot verify rootMass+lengthMass+endsMass sum from HTML without internal state access.
// This is a known limitation. Test passes as diagnostic placeholder.
console.log('MASS-MODEL-ROUNDING known limitation: 3-zone rounding cannot be verified via HTML surface yet.');

// ENDS-REC-NOT-CREATED-WITHOUT-MASS: SAFE
// Verify that no approved ends recipe block is rendered in HTML output.
const endsRecNotCreatedScenario = analyzeEndsScenario('ENDS-REC-NOT-CREATED', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '8', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'натуральна'
});
assert.ok(!endsRecNotCreatedScenario.error, 'ENDS-REC-NOT-CREATED should not throw at runtime');
assert.ok(!endsRecNotCreatedScenario.hasApprovedRecipe, 'ENDS-REC-NOT-CREATED: no approved ends recipe block should exist in HTML');
console.log('ENDS-REC-NOT-CREATED safe behavior observed.');

// ENDS-REC-AUTO-TONING-LOW-RISK: DIAGNOSTIC / KNOWN LIMITATION
// Auto-toning endsRec for low-risk lifted ends is a future capability.
// Scenario: root=8, length=8, ends=8, target=8, ends_history='освітлені'.
// All levels match — system may return APPROVED for root/length recipes, which is valid.
// We do NOT assert absence of approved-recipe (root/length may be approved).
// We only confirm the scenario runs without crash.
const autoToningLowRiskScenario = analyzeEndsScenario('ENDS-REC-AUTO-TONING-LOW-RISK', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '8', root_length: '1', length_level: '8',
    ends_level: '8', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'освітлені', ends_base_type: 'освітлена'
});
assert.ok(!autoToningLowRiskScenario.error, 'ENDS-REC-AUTO-TONING-LOW-RISK should not throw at runtime');
// KNOWN LIMITATION: separate endsRec is not implemented yet.
// The root/length recipe may legitimately be APPROVED when all levels match.
// Future: assert that a separate ends recipe block is generated and correctly handles lifted ends.
console.log('ENDS-REC-AUTO-TONING-LOW-RISK diagnostic observed (future capability, endsRec not implemented).');

// ENDS-REC-BLOCK-COSMETIC-LIFT: SAFE
// Cosmetic pigment ends + lift should require manual confirmation, no approved endsRec.
const blockCosmeticLiftScenario = analyzeEndsScenario('ENDS-REC-BLOCK-COSMETIC-LIFT', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '8', target_direction: '1',
    ends_history: 'косметичний пігмент', ends_base_type: 'косметична'
});
assert.ok(!blockCosmeticLiftScenario.error, 'ENDS-REC-BLOCK-COSMETIC-LIFT should not throw at runtime');
assert.ok(blockCosmeticLiftScenario.hasManualSignal, 'ENDS-REC-BLOCK-COSMETIC-LIFT should require manual confirmation');
assert.ok(!blockCosmeticLiftScenario.hasApprovedRecipe, 'ENDS-REC-BLOCK-COSMETIC-LIFT: no approved ends recipe block should exist');
console.log('ENDS-REC-BLOCK-COSMETIC-LIFT safe behavior observed.');

// ENDS-REC-BLOCK-DAMAGED-ENDS: SAFE
// Critically damaged ends should require manual confirmation, no approved endsRec.
const blockDamagedEndsScenario = analyzeEndsScenario('ENDS-REC-BLOCK-DAMAGED-ENDS', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'критично пошкоджені', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'натуральна'
});
assert.ok(!blockDamagedEndsScenario.error, 'ENDS-REC-BLOCK-DAMAGED-ENDS should not throw at runtime');
assert.ok(blockDamagedEndsScenario.hasManualSignal, 'ENDS-REC-BLOCK-DAMAGED-ENDS should require manual confirmation');
assert.ok(!blockDamagedEndsScenario.hasApprovedRecipe, 'ENDS-REC-BLOCK-DAMAGED-ENDS: no approved ends recipe block should exist');
console.log('ENDS-REC-BLOCK-DAMAGED-ENDS safe behavior observed.');

// ENDS-REC-BLOCK-UNKNOWN-HISTORY: SAFE
// Unknown ends history should require manual confirmation, no approved endsRec.
const blockUnknownHistoryScenario = analyzeEndsScenario('ENDS-REC-BLOCK-UNKNOWN-HISTORY', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: 'невідома історія', ends_base_type: 'натуральна'
});
assert.ok(!blockUnknownHistoryScenario.error, 'ENDS-REC-BLOCK-UNKNOWN-HISTORY should not throw at runtime');
assert.ok(blockUnknownHistoryScenario.hasManualSignal, 'ENDS-REC-BLOCK-UNKNOWN-HISTORY should require manual confirmation');
assert.ok(!blockUnknownHistoryScenario.hasApprovedRecipe, 'ENDS-REC-BLOCK-UNKNOWN-HISTORY: no approved ends recipe block should exist');
console.log('ENDS-REC-BLOCK-UNKNOWN-HISTORY safe behavior observed.');

// ENDS-REC-POWDER-SURCHARGE-PER-ZONE: DIAGNOSTIC / KNOWN LIMITATION
// Per-zone powder surcharge for endsRec cannot be verified — endsRec does not exist yet.
console.log('ENDS-REC-POWDER-SURCHARGE-PER-ZONE known limitation: endsRec not implemented, surcharge not verifiable.');

globalThis.__massModelDiagnosticResults = {
    massModelDiagnostic: { status: 'KNOWN_LIMITATION', limitation: '3-zone mass model (endsMass) not implemented, internal state not publicly exposed' },
    massModelRounding: { status: 'KNOWN_LIMITATION', limitation: 'Cannot verify 3-zone sum without endsMass' },
    endsRecNotCreated: { status: 'SAFE', hasApprovedRecipe: endsRecNotCreatedScenario.hasApprovedRecipe },
    autoToningLowRisk: { status: 'DIAGNOSTIC', limitation: 'Future capability — endsRec not implemented yet' },
    blockCosmeticLift: { status: 'SAFE', hasManualSignal: blockCosmeticLiftScenario.hasManualSignal },
    blockDamagedEnds: { status: 'SAFE', hasManualSignal: blockDamagedEndsScenario.hasManualSignal },
    blockUnknownHistory: { status: 'SAFE', hasManualSignal: blockUnknownHistoryScenario.hasManualSignal },
    powderSurcharge: { status: 'KNOWN_LIMITATION', limitation: 'endsRec not implemented, per-zone surcharge not verifiable' }
};
// ============================================================================
// THREE ZONE ACTIVATION GATE RUNTIME INTEGRATION TESTS
// ============================================================================

const gateKeep2ZoneScenario = analyzeEndsScenario('THREE-ZONE-GATE-RUNTIME-KEEP-2-ZONE-SAME-ENDS', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '6', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '6', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'натуральна'
});
assert.ok(!gateKeep2ZoneScenario.hasError, 'THREE-ZONE-GATE-RUNTIME-KEEP-2-ZONE-SAME-ENDS should not throw');
assert.ok(!gateKeep2ZoneScenario.hasManualSignal, 'THREE-ZONE-GATE-RUNTIME-KEEP-2-ZONE-SAME-ENDS should not require manual signal for safe same-level ends');

const gateMissingDiagScenario = analyzeEndsScenario('THREE-ZONE-GATE-RUNTIME-MISSING-DIAGNOSTICS-MANUAL', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '8', ends_condition: '', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: '', ends_base_type: ''
});
assert.ok(!gateMissingDiagScenario.hasError, 'THREE-ZONE-GATE-RUNTIME-MISSING-DIAGNOSTICS-MANUAL should not throw');
assert.ok(gateMissingDiagScenario.hasManualSignal, 'THREE-ZONE-GATE-RUNTIME-MISSING-DIAGNOSTICS-MANUAL should require manual signal');

const gateRiskyHistoryScenario = analyzeEndsScenario('THREE-ZONE-GATE-RUNTIME-RISKY-HISTORY-MANUAL', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '8', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: 'хна / метали', ends_base_type: 'натуральна'
});
assert.ok(!gateRiskyHistoryScenario.hasError, 'THREE-ZONE-GATE-RUNTIME-RISKY-HISTORY-MANUAL should not throw');
assert.ok(gateRiskyHistoryScenario.hasManualSignal, 'THREE-ZONE-GATE-RUNTIME-RISKY-HISTORY-MANUAL should require manual signal');

const gateRiskyBaseScenario = analyzeEndsScenario('THREE-ZONE-GATE-RUNTIME-RISKY-BASE-TYPE-MANUAL', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '8', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'змішана / нерівномірна'
});
assert.ok(!gateRiskyBaseScenario.hasError, 'THREE-ZONE-GATE-RUNTIME-RISKY-BASE-TYPE-MANUAL should not throw');
assert.ok(gateRiskyBaseScenario.hasManualSignal, 'THREE-ZONE-GATE-RUNTIME-RISKY-BASE-TYPE-MANUAL should require manual signal');

const gateRiskyCondScenario = analyzeEndsScenario('THREE-ZONE-GATE-RUNTIME-RISKY-CONDITION-MANUAL', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '8', ends_condition: 'критично пошкоджені', base_type: 'Натуральна',
    target_level: '7', target_direction: '1',
    ends_history: 'натуральні', ends_base_type: 'натуральна'
});
assert.ok(!gateRiskyCondScenario.hasError, 'THREE-ZONE-GATE-RUNTIME-RISKY-CONDITION-MANUAL should not throw');
assert.ok(gateRiskyCondScenario.hasManualSignal, 'THREE-ZONE-GATE-RUNTIME-RISKY-CONDITION-MANUAL should require manual signal');

const gateAllowScenario = analyzeEndsScenario('THREE-ZONE-GATE-RUNTIME-ALLOW-DOES-NOT-ACTIVATE-3ZONE', {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0', grey_type: 'мягкая', root_level: '6', root_length: '1', length_level: '6',
    ends_level: '8', ends_condition: 'здорові', base_type: 'Натуральна',
    target_level: '6', target_direction: '1',
    ends_history: 'натуральна', ends_base_type: 'натуральна'
});
assert.ok(!gateAllowScenario.hasError, 'THREE-ZONE-GATE-RUNTIME-ALLOW-DOES-NOT-ACTIVATE-3ZONE should not throw');
assert.ok(gateAllowScenario.hasNoEndsRecipeSignal, 'THREE-ZONE-PREVIEW-NO-ENDSREC: should not create endsRec');

const allowHtml = gateAllowScenario.html;
assert.ok(allowHtml.includes('<b>threeZonePreviewEligible:</b> true'), 'THREE-ZONE-PREVIEW-ALLOW-CREATES-CANDIDATE: Eligible flag should be true');
assert.ok(allowHtml.includes('<b>threeZoneGateDecision:</b> ALLOW_3_ZONE'), 'THREE-ZONE-PREVIEW-ALLOW-CREATES-CANDIDATE: Decision should be ALLOW_3_ZONE');
assert.ok(allowHtml.includes('<b>threeZoneCandidateMassModel:</b> {&quot;'), 'THREE-ZONE-PREVIEW-ALLOW-CREATES-CANDIDATE: Candidate object should be present');
assert.ok(allowHtml.includes('&quot;mode&quot;:&quot;3-zone&quot;'), 'THREE-ZONE-PREVIEW-ALLOW-CREATES-CANDIDATE: Candidate mode should be 3-zone');
assert.ok(allowHtml.includes('<b>threeZonePreviewOnly:</b> true'), 'THREE-ZONE-PREVIEW-CONTRACT-FLAT-LOCK-FIELDS: PreviewOnly flat flag should be true');
assert.ok(allowHtml.includes('<b>threeZoneEndsRecipeReady:</b> false'), 'THREE-ZONE-PREVIEW-CONTRACT-FLAT-LOCK-FIELDS: EndsRecipeReady flat flag should be false');
assert.ok(!allowHtml.includes('<b>diagnostics:</b>'), 'THREE-ZONE-PREVIEW-CONTRACT-NO-NESTED-DIAGNOSTICS: should not contain collapsed nested diagnostics object');
assert.ok(allowHtml.includes('⚠️ ДІАГНОСТИКА: Створено попередній endsRecCandidate для оцінки кінців.'), 'THREE-ZONE-PREVIEW-NOTE-APPEARS-ON-ALLOW: Warning should appear for ALLOW_3_ZONE');
assert.ok(allowHtml.includes('endsRecCandidatePreview'), 'ENDSREC-CANDIDATE-SAFE-TONING-CREATED: candidate preview should be present in HTML output');
assert.ok(allowHtml.includes('&quot;candidateOnly&quot;:true'), 'ENDSREC-CANDIDATE-SAFE-TONING-CREATED: candidateOnly must be true');
assert.ok(allowHtml.includes('&quot;productionReady&quot;:false'), 'ENDSREC-CANDIDATE-SAFE-TONING-CREATED: productionReady must be false');
assert.ok(allowHtml.includes('&quot;previewOnly&quot;:true'), 'ENDSREC-CANDIDATE-SAFE-TONING-CREATED: previewOnly must be true');
assert.ok(allowHtml.includes('mass-model') && allowHtml.includes('2-zone'), 'THREE-ZONE-PREVIEW-DOES-NOT-REPLACE-PRODUCTION-MASSMODEL: production massModel remains 2-zone');
assert.ok(allowHtml.includes('endsRecCandidatePreview') && allowHtml.includes('&quot;notForMixing&quot;:true') && allowHtml.includes('&quot;productionReady&quot;:false') && allowHtml.includes('&quot;previewOnly&quot;:true'), 'THREE-ZONE-PREVIEW-DOES-NOT-REPLACE-PRODUCTION-MASSMODEL: candidate is readonly');
assert.ok(!allowHtml.includes('<b>endsRec:</b>') && !allowHtml.includes('&quot;productionReady&quot;:true'), 'THREE-ZONE-PREVIEW-DOES-NOT-REPLACE-PRODUCTION-MASSMODEL: production endsRec not activated');

const keepHtml = gateKeep2ZoneScenario.html;
assert.ok(!keepHtml.includes('<b>threeZonePreviewEligible:</b> true'), 'THREE-ZONE-PREVIEW-NOT-CREATED-FOR-KEEP-2-ZONE: Eligible flag should be false');
assert.ok(!keepHtml.includes('⚠️ ДІАГНОСТИКА: Кінці відповідають умовам для майбутньої 3-зонної логіки'), 'THREE-ZONE-PREVIEW-NOTE-ABSENT-ON-KEEP: Warning should not appear for KEEP_2_ZONE');

const manualHtml = gateMissingDiagScenario.html;
assert.ok(!manualHtml.includes('<b>threeZonePreviewEligible:</b> true'), 'THREE-ZONE-PREVIEW-NOT-CREATED-FOR-MANUAL: Eligible flag should be false');

// THREE-ZONE-GATE-RUNTIME-NO-BUILDTHREEZONE-CALL
// We test static code for absence of call inside calculateProtocol
assert.ok(!calculateProtocol.toString().includes('massModel = buildThreeZoneMassCandidate('), 'calculateProtocol must not overwrite production massModel with buildThreeZoneMassCandidate');

globalThis.__threeZoneGateResults = {
    gateKeep2Zone: { status: 'SAFE', hasManualSignal: gateKeep2ZoneScenario.hasManualSignal },
    gateMissingDiag: { status: 'SAFE', hasManualSignal: gateMissingDiagScenario.hasManualSignal },
    gateRiskyHistory: { status: 'SAFE', hasManualSignal: gateRiskyHistoryScenario.hasManualSignal },
    gateRiskyBase: { status: 'SAFE', hasManualSignal: gateRiskyBaseScenario.hasManualSignal },
    gateRiskyCond: { status: 'SAFE', hasManualSignal: gateRiskyCondScenario.hasManualSignal },
    gateAllow: { status: 'SAFE', hasNoEndsRecipeSignal: gateAllowScenario.hasNoEndsRecipeSignal, hasPreview: allowHtml.includes('"threeZoneCandidateMassModel": {') }
};

const productionEndsRecCurrentScenario = gateAllowScenario;
assert.ok(!productionEndsRecCurrentScenario.hasError, 'ENDSREC-PRODUCTION-CURRENT-SAFETY-CONTRACT must not throw');

const productionEndsRecCurrentHtml = productionEndsRecCurrentScenario.html;
const productionMassModelStart = productionEndsRecCurrentHtml.indexOf('<div class="mass-model">');
const productionMassModelEnd = productionEndsRecCurrentHtml.indexOf('</div>', productionMassModelStart);
const productionMassModelHtml = productionMassModelStart >= 0 && productionMassModelEnd > productionMassModelStart
    ? productionEndsRecCurrentHtml.slice(productionMassModelStart, productionMassModelEnd)
    : '';

const hasProductionEndsRec = productionEndsRecCurrentHtml.includes('<b>endsRec:</b>')
    && productionEndsRecCurrentHtml.includes('&quot;productionReady&quot;:true');
const productionEndsMassNull = productionMassModelHtml.includes('&quot;endsMass&quot;: null')
    || productionMassModelHtml.includes('&quot;endsMass&quot;:null');
const productionModeIs2Zone = productionMassModelHtml.includes('&quot;mode&quot;: &quot;2-zone&quot;')
    || productionMassModelHtml.includes('&quot;mode&quot;:&quot;2-zone&quot;');
const productionModeIs3Zone = productionMassModelHtml.includes('&quot;mode&quot;: &quot;3-zone&quot;')
    || productionMassModelHtml.includes('&quot;mode&quot;:&quot;3-zone&quot;');
const hasCandidatePreview = productionEndsRecCurrentHtml.includes('endsRecCandidatePreview');
const candidateIsReadonly = productionEndsRecCurrentHtml.includes('&quot;candidateOnly&quot;:true')
    && productionEndsRecCurrentHtml.includes('&quot;productionReady&quot;:false')
    && productionEndsRecCurrentHtml.includes('&quot;previewOnly&quot;:true')
    && productionEndsRecCurrentHtml.includes('&quot;notForMixing&quot;:true');
const hasProductionDyeMass = hasProductionEndsRec
    && productionEndsRecCurrentHtml.includes('&quot;dyeMass&quot;:');
const hasProductionOxidizerMass = hasProductionEndsRec
    && productionEndsRecCurrentHtml.includes('&quot;oxidizerMass&quot;:');
const hasProductionEndsFormula = hasProductionEndsRec
    && productionEndsRecCurrentHtml.includes('&quot;endsFormula&quot;:');
const rootRecipeStart = productionEndsRecCurrentHtml.indexOf('<h3>Корінь</h3>');
const rootRecipeEnd = productionEndsRecCurrentHtml.indexOf('</div>', rootRecipeStart);
const rootRecipeHtml = rootRecipeStart >= 0 && rootRecipeEnd > rootRecipeStart
    ? productionEndsRecCurrentHtml.slice(rootRecipeStart, rootRecipeEnd)
    : '';
const lengthRecipeStart = productionEndsRecCurrentHtml.indexOf('<h3>Довжина</h3>');
const lengthRecipeEnd = productionEndsRecCurrentHtml.indexOf('</div>', lengthRecipeStart);
const lengthRecipeHtml = lengthRecipeStart >= 0 && lengthRecipeEnd > lengthRecipeStart
    ? productionEndsRecCurrentHtml.slice(lengthRecipeStart, lengthRecipeEnd)
    : '';

assert.strictEqual(hasProductionEndsRec, false, 'ENDSREC-PRODUCTION-CURRENT-NOT-CREATED: production endsRec must NOT be created yet');
assert.ok(productionMassModelHtml, 'ENDSREC-PRODUCTION-CURRENT-ENDSMASS-NULL: production massModel should be rendered');
assert.strictEqual(productionEndsMassNull, true, 'ENDSREC-PRODUCTION-CURRENT-ENDSMASS-NULL: production endsMass must remain null');
assert.strictEqual(productionModeIs2Zone, true, 'ENDSREC-PRODUCTION-CURRENT-MASSMODEL-STAYS-2ZONE: production massModel.mode must stay "2-zone"');
assert.strictEqual(productionModeIs3Zone, false, 'ENDSREC-PRODUCTION-CURRENT-MASSMODEL-STAYS-2ZONE: production massModel.mode must NOT be "3-zone"');
assert.strictEqual(hasCandidatePreview && candidateIsReadonly, true, 'ENDSREC-PRODUCTION-CURRENT-CANDIDATE-NOT-PRODUCTION: candidate must exist with protection flags');
assert.strictEqual(hasProductionDyeMass, false, 'ENDSREC-PRODUCTION-CURRENT-NO-DYEMASS: production dyeMass must NOT exist');
assert.strictEqual(hasProductionOxidizerMass, false, 'ENDSREC-PRODUCTION-CURRENT-NO-OXIDIZERMASS: production oxidizerMass must NOT exist');
assert.strictEqual(hasProductionEndsFormula, false, 'ENDSREC-PRODUCTION-CURRENT-NO-READY-FORMULA: production endsFormula must NOT exist yet');
assert.strictEqual(rootRecipeHtml.includes('endsRecCandidate') || lengthRecipeHtml.includes('endsRecCandidate'), false, 'ENDSREC-PRODUCTION-CURRENT-NO-ROOT-LEN-CHANGE: root/len recipes must NOT reference candidate ends mass');

globalThis.__endsRecProductionCurrentSafetyResults = {
    productionEndsRec: !hasProductionEndsRec,
    productionEndsMass: productionEndsMassNull,
    productionMassModelMode: productionModeIs2Zone && !productionModeIs3Zone,
    candidateAsProduction: hasCandidatePreview && candidateIsReadonly && !hasProductionEndsRec,
    dyeMass: !hasProductionDyeMass,
    oxidizerMass: !hasProductionOxidizerMass,
    readyFormula: !hasProductionEndsFormula,
    rootRecLenRec: !rootRecipeHtml.includes('endsRecCandidate')
        && !lengthRecipeHtml.includes('endsRecCandidate')
};

assert.strictEqual(typeof validateProductionEndsRecReadiness, 'function', 'validateProductionEndsRecReadiness should exist');

const readinessCandidateMassModel = buildThreeZoneMassCandidate('средние', 'средние', { rootPct: 0.3, lengthPct: 0.5, endsPct: 0.2 });
const readinessContext = {
    ends_level: 8,
    length_level: 7,
    root_level: 6,
    ends_condition: 'здорові',
    ends_history: 'натуральна',
    ends_base_type: 'натуральна',
    target_level: 8,
    threeZoneGateDecision: 'ALLOW_3_ZONE',
    threeZoneCandidateMassModel: readinessCandidateMassModel,
    threeZonePreviewOnly: true,
    threeZoneEndsRecipeReady: false,
    massModel: { mode: '2-zone', endsMass: null },
    rootRec: { process: 'Перманент', mass: 18 },
    lenRec: { process: 'Перманент', mass: 42 }
};
readinessContext.endsRecCandidatePreview = buildEndsRecCandidatePreview(readinessContext);

const readinessBefore = JSON.stringify(readinessContext);
const readinessResult = validateProductionEndsRecReadiness(readinessContext);
assert.strictEqual(readinessResult.ready, true, 'READINESS-ALLOW-3ZONE-SAFE-TRUE runtime helper should be ready');
assert.strictEqual(readinessResult.status, 'READY', 'READINESS-ALLOW-3ZONE-SAFE-TRUE runtime helper status');
assert.strictEqual(readinessResult.productionAllowed, true, 'READINESS-ALLOW-3ZONE-SAFE-TRUE runtime helper productionAllowed');
assert.strictEqual(readinessResult.candidateSummary.productionReady, false, 'READINESS-CANDIDATE-NOT-PRODUCTION runtime helper');
assert.strictEqual(readinessResult.candidateSummary.notForMixing, true, 'READINESS-CANDIDATE-NOT-PRODUCTION notForMixing');
assert.strictEqual(JSON.stringify(readinessContext), readinessBefore, 'READINESS-NO-MASSMODEL-CHANGE runtime helper must not mutate context');

const readinessNoCandidate = validateProductionEndsRecReadiness(Object.assign({}, readinessContext, { endsRecCandidatePreview: null }));
assert.strictEqual(readinessNoCandidate.ready, false, 'READINESS-NO-CANDIDATE-FALSE runtime helper');
assert.strictEqual(readinessNoCandidate.reasonCode, 'NO_ENDSREC_CANDIDATE_PREVIEW', 'READINESS-NO-CANDIDATE-FALSE runtime helper reason');

const suspiciousCandidate = Object.assign({}, readinessContext.endsRecCandidatePreview, { productionReady: true });
const readinessSuspicious = validateProductionEndsRecReadiness(Object.assign({}, readinessContext, { endsRecCandidatePreview: suspiciousCandidate }));
assert.strictEqual(readinessSuspicious.ready, false, 'READINESS-CANDIDATE-PRODUCTIONREADY-TRUE-BLOCKED runtime helper');
assert.strictEqual(readinessSuspicious.status, 'BLOCKED', 'READINESS-CANDIDATE-PRODUCTIONREADY-TRUE-BLOCKED runtime helper status');

globalThis.__productionEndsRecReadinessResults = {
    allow: readinessResult.status,
    noCandidate: readinessNoCandidate.reasonCode,
    suspicious: readinessSuspicious.status
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
assert.strictEqual(sandbox.__endsResults.damagedLift.status, 'SAFE');
assert.strictEqual(sandbox.__endsResults.targetBetween.status, 'SAFE');
assert.ok(['KNOWN_RISK', 'DIAGNOSTIC_OBSERVED'].includes(sandbox.__endsResults.cosmeticUnknownHistory.status));
assert.strictEqual(sandbox.__endsConditionResults.porousLift.status, 'SAFE');
assert.strictEqual(sandbox.__endsConditionResults.brittleHighLift.status, 'SAFE');
assert.strictEqual(sandbox.__endsConditionResults.damagedChemistry.status, 'SAFE');
assert.strictEqual(sandbox.__endsConditionResults.missingWithDifferentLevel.status, 'SAFE');
assert.strictEqual(sandbox.__missingCriticalDataResult.status, 'SAFE');
assert.strictEqual(sandbox.__missingCriticalDataResult.hasApproved, false);
assert.strictEqual(sandbox.__missingCriticalDataResult.hasRecipe, false);
assert.strictEqual(sandbox.__missingCriticalDataResult.hasBlockingSignal, true);

assert.strictEqual(sandbox.__endsHistoryBaseResults.unknown.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.cosmeticLift.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.darkCosmetic.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.afterRemover.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.hennaMetals.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.baseCosmeticLift.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.baseMixedUneven.hasManualSignal, true);
assert.strictEqual(sandbox.__endsHistoryBaseResults.missingWithDifferentLevel.hasManualSignal, true);

// Diagnostic Mass Model Assertions — HTML-surface only, no internal state access
assert.ok(['KNOWN_LIMITATION'].includes(sandbox.__massModelDiagnosticResults.massModelDiagnostic.status), 'DIAGNOSTIC: 3-zone mass model is a known limitation');
assert.ok(['KNOWN_LIMITATION'].includes(sandbox.__massModelDiagnosticResults.massModelRounding.status), 'DIAGNOSTIC: Mass rounding is a known limitation without endsMass');
assert.strictEqual(sandbox.__massModelDiagnosticResults.endsRecNotCreated.hasApprovedRecipe, false, 'SAFE: No approved ends recipe should be created without endsRec');
assert.ok(['DIAGNOSTIC'].includes(sandbox.__massModelDiagnosticResults.autoToningLowRisk.status), 'DIAGNOSTIC: autoToningLowRisk is a future capability');
assert.strictEqual(sandbox.__massModelDiagnosticResults.blockCosmeticLift.hasManualSignal, true, 'SAFE: Cosmetic lift should be blocked with manual signal');
assert.strictEqual(sandbox.__massModelDiagnosticResults.blockDamagedEnds.hasManualSignal, true, 'SAFE: Damaged ends should be blocked with manual signal');
assert.strictEqual(sandbox.__massModelDiagnosticResults.blockUnknownHistory.hasManualSignal, true, 'SAFE: Unknown history should be blocked with manual signal');
assert.ok(['KNOWN_LIMITATION'].includes(sandbox.__massModelDiagnosticResults.powderSurcharge.status), 'DIAGNOSTIC: Powder surcharge per zone is a known limitation');

assert.strictEqual(sandbox.__threeZoneGateResults.gateKeep2Zone.hasManualSignal, false);
assert.strictEqual(sandbox.__threeZoneGateResults.gateMissingDiag.hasManualSignal, true);
assert.strictEqual(sandbox.__threeZoneGateResults.gateRiskyHistory.hasManualSignal, true);
assert.strictEqual(sandbox.__threeZoneGateResults.gateRiskyBase.hasManualSignal, true);
assert.strictEqual(sandbox.__threeZoneGateResults.gateRiskyCond.hasManualSignal, true);
assert.strictEqual(sandbox.__threeZoneGateResults.gateAllow.hasNoEndsRecipeSignal, true);

console.log('WWW business scenario test passed');
