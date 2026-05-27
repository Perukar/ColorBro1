const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('./www/core.js', 'utf8');

const assertions = `
if (typeof calculateProtocol !== 'function') {
    throw new Error('calculateProtocol presence check failed');
}

const neutralElasticityValue = 'нормальна еластичність';
const neutralPorosityValue = 'нормальна пористість';
const neutralRootConditionValue = 'здоровий корінь';
const neutralLengthConditionValue = 'здорове полотно';

function withDefaultScenarioValues(values) {
    return Object.assign({
        elasticity: neutralElasticityValue,
        porosity: neutralPorosityValue,
        root_condition: neutralRootConditionValue,
        length_condition: neutralLengthConditionValue
    }, values);
}

const scenarioValues = withDefaultScenarioValues({
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
});

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

const prepigScenarioValues = withDefaultScenarioValues({
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
});

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
const greyBaseHasBase = greyBaseHtml.includes('База 6.00')
    || greyBaseHtml.includes('.00 / grey coverage')
    || greyBaseHtml.includes('.00 grey coverage');
const greyBaseHasPermanent = greyBaseHtml.includes('Перманент')
    || greyBaseHtml.includes('Brand-specific rules required');
assert.ok(greyBaseHasBase, 'GREY-50-ADDS-00-BASE should expose .00 base / grey coverage signal');
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
    root_level: '6', root_length: '1', length_level: '6', ends_level: '6', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '6', target_direction: '0', ends_history: 'натуральні', ends_base_type: 'натуральна'
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
    root_level: '6', root_length: '1', length_level: '6', ends_level: '6', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '6', target_direction: '0', ends_history: 'натуральні', ends_base_type: 'натуральна'
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

// === PREPIG-8-4 ===
const prepig84Values = {
    history: 'освітлені', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0',
    root_level: '4', root_length: '1', length_level: '8', ends_level: '8', ends_condition: 'здорові',
    base_type: 'Косметична', target_level: '4', target_direction: '1', ends_history: 'освітлені', ends_base_type: 'косметична'
};
const prepig84Output = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? prepig84Output : { value: prepig84Values[id] };
calculateProtocol();
const prepig84Html = prepig84Output.innerHTML;
assert.ok(!prepig84Html.includes('APPROVED'), 'PREPIG-8-4 should NOT be unconditional APPROVED');
assert.ok(prepig84Html.includes('MANUAL_REQUIRED') || prepig84Html.includes('Ручне рішення'), 'PREPIG-8-4 should require manual decision');
assert.ok(prepig84Html.includes('ЗАТЕМНЕННЯ') || prepig84Html.includes('затемненні'), 'PREPIG-8-4 should have warning about darkening');
assert.ok(prepig84Html.includes('передпігментац') || prepig84Html.includes('репігментац') || prepig84Html.includes('заповнення пігменту'), 'PREPIG-8-4 should mention prepigmentation or pigment filling');
console.log('PREPIG-8-4 safe behavior observed.');

// === ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE ===
const root74Values = {
    history: 'натуральні', condition: 'здоровые', thickness: 'средние', density: 'средние', length: 'средние',
    grey_percent: '0',
    root_level: '7', root_length: '1', length_level: '7', ends_level: '7', ends_condition: 'здорові',
    base_type: 'Натуральна', target_level: '4', target_direction: '1', ends_history: 'натуральні', ends_base_type: 'натуральна'
};
const root74Output = { innerHTML: '' };
document.getElementById = (id) => id === 'output' ? root74Output : { value: root74Values[id] };
calculateProtocol();
const root74Html = root74Output.innerHTML;
assert.ok(!root74Html.includes('ЗНАЧНЕ ЗАТЕМНЕННЯ ЗІ СВІТЛОЇ БАЗИ'), 'ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE should NOT have darkening warning from root');
assert.ok(!root74Html.includes('Передпігментація / заповнення пігменту:'), 'ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE should NOT require prepig decision');
console.log('ROOT-7-4-NATURAL-NO-PREPIG-FALSE-POSITIVE safe behavior observed.');

globalThis.__prepigResult = {
    status: prepigUnsafeUnconditionalApproved ? 'UNSAFE' : 'SAFE',
    hasApproved: prepigHasApproved,
    hasRecipe: prepigHasRecipe,
    hasManualSignal: prepigHasManualSignal,
    hasPrePigSignal: prepigHasPrePigSignal
};

function runDiagnosticScenario(name, values) {
    const scenarioValues = withDefaultScenarioValues(values);
    const scenarioOutput = { innerHTML: '' };
    const scenarioRequestedIds = [];

    document = {
        getElementById(id) {
            scenarioRequestedIds.push(id);
            if (id === 'output') return scenarioOutput;
            if (!Object.prototype.hasOwnProperty.call(scenarioValues, id)) {
                throw new Error('Missing ' + name + ' fake DOM value for ' + id);
            }
            return { value: scenarioValues[id] };
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

function analyzeBlackExitContractScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');

    const html = scenario.html;
    const htmlText = html.toLowerCase();
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const hasBlackExitDiagnosticText = (
        htmlText.includes('вихід з чорного')
        || htmlText.includes('темної косметичної')
        || htmlText.includes('темного косметичного')
        || htmlText.includes('косметичних нашарув')
    ) && (
        htmlText.includes('діагност')
        || htmlText.includes('тест-пасм')
        || htmlText.includes('фон освітлення')
    );

    assert.ok(!scenario.error, name + ' should not throw');
    assert.ok(hasManualSignal, name + ' should require manual decision');
    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasBlackExitDiagnosticText, name + ' should warn about dark cosmetic base diagnostics and test strand');

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        hasBlackExitDiagnosticText,
        hasError: Boolean(scenario.error)
    };
}

function analyzeBlackExitNegativeScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');
    assert.ok(!scenario.error, name + ' should not throw');

    const htmlText = scenario.html.toLowerCase();
    const forbiddenBlackExitSignals = [
        'вихід з чорного',
        'темної косметичної',
        'темного косметичного',
        'косметичних нашарув',
        'змивок',
        'тест-пасмо'
    ];
    const presentForbiddenSignals = forbiddenBlackExitSignals.filter(signal => htmlText.includes(signal));

    assert.deepStrictEqual(
        presentForbiddenSignals,
        [],
        name + ' should not render BLACK-EXIT text for natural dark base lift'
    );

    return {
        status: 'SAFE',
        presentForbiddenSignals,
        hasError: Boolean(scenario.error)
    };
}

function analyzeHennaMetalsSafetyContractScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');

    const html = scenario.html;
    const htmlText = html.toLowerCase();
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualOrBlockSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('BLOCKED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('Блокування')
        || htmlText.includes('ручн')
        || htmlText.includes('заборонено');
    const hasHennaMetalsText = (
        htmlText.includes('хна')
        || htmlText.includes('henna')
        || htmlText.includes('метал')
        || htmlText.includes('metal')
        || htmlText.includes('salts')
        || htmlText.includes('солі')
        || htmlText.includes('соли')
    ) && (
        htmlText.includes('непередбачуван')
        || htmlText.includes('реакц')
        || htmlText.includes('тест-пасм')
        || htmlText.includes('діагност')
        || htmlText.includes('diagnostic')
        || htmlText.includes('test strand')
    );

    assert.ok(!scenario.error, name + ' should not throw');
    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualOrBlockSignal, name + ' should require manual/block signal');
    assert.ok(hasHennaMetalsText, name + ' should explain henna/metals diagnostic risk');

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualOrBlockSignal,
        hasHennaMetalsText,
        hasError: Boolean(scenario.error)
    };
}

const blackExitScenario = analyzeBlackExitContractScenario('BLACK-EXIT-1', {
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

const blackExitCosmeticDarkBaseNoMarkerScenario = analyzeBlackExitContractScenario('BLACK-EXIT-COSMETIC-DARK-BASE-NO-MARKER', {
    history: 'косметичний пігмент',
    condition: 'середньо пористе',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '3',
    root_length: '1',
    length_level: '3',
    ends_level: '3',
    ends_condition: 'здорові',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    base_type: 'Косметична',
    target_level: '7',
    target_direction: '1'
});

const blackExitDarkCosmeticLengthScenario = analyzeBlackExitContractScenario('BLACK-EXIT-DARK-COSMETIC-LENGTH', {
    history: 'косметична довжина з нашаруванням барвника',
    condition: 'середньо пористе',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '6',
    root_length: '1',
    length_level: '4',
    ends_level: '4',
    ends_condition: 'здорові',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    base_type: 'Косметична',
    target_level: '7',
    target_direction: '1'
});

const blackExitNaturalDarkBaseNoFalsePositiveScenario = analyzeBlackExitNegativeScenario('BLACK-EXIT-NATURAL-DARK-BASE-NO-FALSE-POSITIVE', {
    history: 'натуральні',
    condition: 'середньо пористе',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '4',
    root_length: '1',
    length_level: '4',
    ends_level: '4',
    ends_condition: 'здорові',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1'
});

const hennaMetalsRootLiftScenario = analyzeHennaMetalsSafetyContractScenario('HENNA-METALS-ROOT-LIFT-NO-APPROVED', {
    history: 'хна / металл',
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
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1'
});

const hennaMetalsSpecialBlondScenario = analyzeHennaMetalsSafetyContractScenario('HENNA-METALS-SPECIAL-BLOND-NO-APPROVED', {
    history: 'хна / металл',
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
    ends_condition: 'здорові',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1'
});

const hennaMetalsToningScenario = analyzeHennaMetalsSafetyContractScenario('HENNA-METALS-TONING-MANUAL-MINIMUM', {
    history: 'хна / металл',
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
    target_level: '8',
    target_direction: '1'
});

console.log('HENNA/METALS safety contract observed.');

globalThis.__hennaMetalsResult = {
    status: 'SAFE',
    rootLift: hennaMetalsRootLiftScenario,
    specialBlond: hennaMetalsSpecialBlondScenario,
    toning: hennaMetalsToningScenario
};

console.log('BLACK-EXIT safety contract observed.');

globalThis.__blackExitResult = {
    status: 'SAFE',
    explicitMarker: blackExitScenario,
    cosmeticDarkBaseNoMarker: blackExitCosmeticDarkBaseNoMarkerScenario,
    darkCosmeticLength: blackExitDarkCosmeticLengthScenario,
    naturalDarkBaseNoFalsePositive: blackExitNaturalDarkBaseNoFalsePositiveScenario
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

function multiZoneGuardSignals(html) {
    const htmlText = String(html || '').toLowerCase();
    const signals = [
        'multi-zone',
        'ends conflict',
        'різнозон',
        'кінці мають окремий',
        'ends_condition',
        'ends_history',
        'ends_base_type',
        'diagnostic-only',
        'не production',
        'тест-пасм',
        'multi-zone ends conflict'
    ];
    return signals.filter(signal => htmlText.includes(signal.toLowerCase()));
}

function hasProductionEndsRecSignal(html) {
    return html.includes('<h3>Кінці</h3>')
        || html.includes('<h3>Ends</h3>')
        || html.includes('endsRec:')
        || html.includes('endsRecipeReady: true')
        || html.includes('productionRecipe')
        || html.includes('formula-to-mix')
        || html.includes('finalFormula')
        || html.includes('dyeMass')
        || html.includes('oxidizerMass')
        || html.includes('exactGrams')
        || html.includes('&quot;mode&quot;: &quot;3-zone&quot;');
}

function analyzeMultiZoneConflictScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');

    const html = scenario.html;
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const presentMultiZoneSignals = multiZoneGuardSignals(html);
    const productionEndsRecSignal = hasProductionEndsRecSignal(html);

    assert.ok(!scenario.error, name + ' should not throw at runtime');
    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved-recipe');
    assert.ok(hasManualSignal, name + ' should require manual confirmation');
    assert.ok(presentMultiZoneSignals.length > 0, name + ' should render multi-zone / ends conflict text');
    assert.ok(!productionEndsRecSignal, name + ' should not render production endsRec');

    return {
        name,
        html,
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        presentMultiZoneSignals,
        productionEndsRecSignal
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

const multiZoneEndsBrittleLiftResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-ENDS-BRITTLE-LIFT-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'ламкі кінці',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
assert.ok(multiZoneEndsBrittleLiftResult.html.includes('ламкі кінці'), 'MULTI-ZONE-ENDS-BRITTLE-LIFT-NO-APPROVED should mention brittle ends');
console.log('MULTI-ZONE-ENDS-BRITTLE-LIFT-NO-APPROVED safe behavior observed.');

const multiZoneEndsDamagedLengthLiftResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-ENDS-DAMAGED-LENGTH-LIFT-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'пошкоджені кінці',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
assert.ok(multiZoneEndsDamagedLengthLiftResult.html.includes('пошкоджені кінці'), 'MULTI-ZONE-ENDS-DAMAGED-LENGTH-LIFT-NO-APPROVED should mention damaged ends');
console.log('MULTI-ZONE-ENDS-DAMAGED-LENGTH-LIFT-NO-APPROVED safe behavior observed.');

const multiZoneEndsLightenedSameLevelResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-ENDS-LIGHTENED-SAME-LEVEL-NO-UNIFIED-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'освітлені',
    ends_base_type: 'освітлена'
});
assert.ok(multiZoneEndsLightenedSameLevelResult.html.includes('освітлені') || multiZoneEndsLightenedSameLevelResult.html.includes('освітлена'), 'MULTI-ZONE-ENDS-LIGHTENED-SAME-LEVEL-NO-UNIFIED-APPROVED should mention lightened ends');
console.log('MULTI-ZONE-ENDS-LIGHTENED-SAME-LEVEL-NO-UNIFIED-APPROVED safe behavior observed.');

const multiZoneEndsMixedBaseSameLevelResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-ENDS-MIXED-BASE-SAME-LEVEL-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'змішана / нерівномірна'
});
assert.ok(multiZoneEndsMixedBaseSameLevelResult.html.includes('змішана / нерівномірна'), 'MULTI-ZONE-ENDS-MIXED-BASE-SAME-LEVEL-NO-APPROVED should mention mixed ends base');
console.log('MULTI-ZONE-ENDS-MIXED-BASE-SAME-LEVEL-NO-APPROVED safe behavior observed.');

const multiZoneEndsHennaMetalsResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-ENDS-HENNA-METALS-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'хна / металеві солі',
    ends_base_type: 'натуральна'
});
assert.ok(multiZoneEndsHennaMetalsResult.html.includes('хна') || multiZoneEndsHennaMetalsResult.html.includes('метал'), 'MULTI-ZONE-ENDS-HENNA-METALS-NO-APPROVED should mention henna/metals');
console.log('MULTI-ZONE-ENDS-HENNA-METALS-NO-APPROVED safe behavior observed.');

const multiZoneEndsDarkCosmeticResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-ENDS-DARK-COSMETIC-CONFLICT-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'темна косметична база',
    ends_base_type: 'темна косметична'
});
assert.ok(multiZoneEndsDarkCosmeticResult.html.includes('темна косметична'), 'MULTI-ZONE-ENDS-DARK-COSMETIC-CONFLICT-NO-APPROVED should mention dark cosmetic ends');
console.log('MULTI-ZONE-ENDS-DARK-COSMETIC-CONFLICT-NO-APPROVED safe behavior observed.');

const multiZoneLengthHealthyEndsDamagedResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-LENGTH-HEALTHY-ENDS-DAMAGED-NO-PRODUCTION-ENDSREC', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'пошкоджені кінці',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('MULTI-ZONE-LENGTH-HEALTHY-ENDS-DAMAGED-NO-PRODUCTION-ENDSREC safe behavior observed.');

const multiZoneNormalEndsScenario = runDiagnosticScenario('MULTI-ZONE-NORMAL-ENDS-NO-FALSE-POSITIVE', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
assert.ok(!multiZoneNormalEndsScenario.error, 'MULTI-ZONE-NORMAL-ENDS-NO-FALSE-POSITIVE should not throw');
const multiZoneNormalSignals = multiZoneGuardSignals(multiZoneNormalEndsScenario.html);
assert.deepStrictEqual(multiZoneNormalSignals, [], 'MULTI-ZONE-NORMAL-ENDS-NO-FALSE-POSITIVE should not render multi-zone guard text');
console.log('MULTI-ZONE-NORMAL-ENDS-NO-FALSE-POSITIVE safe behavior observed.');

const multiZoneDiagnosticNotProductionResult = analyzeMultiZoneConflictScenario('MULTI-ZONE-DIAGNOSTIC-NOT-PRODUCTION-SOURCE', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'освітлені',
    ends_base_type: 'освітлена'
});
assert.ok(!multiZoneDiagnosticNotProductionResult.productionEndsRecSignal, 'MULTI-ZONE-DIAGNOSTIC-NOT-PRODUCTION-SOURCE should keep ends diagnostic/non-production only');
console.log('MULTI-ZONE-DIAGNOSTIC-NOT-PRODUCTION-SOURCE safe behavior observed.');

globalThis.__multiZoneConflictResults = {
    brittleLift: multiZoneEndsBrittleLiftResult,
    damagedLengthLift: multiZoneEndsDamagedLengthLiftResult,
    lightenedSameLevel: multiZoneEndsLightenedSameLevelResult,
    mixedBaseSameLevel: multiZoneEndsMixedBaseSameLevelResult,
    hennaMetals: multiZoneEndsHennaMetalsResult,
    darkCosmetic: multiZoneEndsDarkCosmeticResult,
    lengthHealthyEndsDamaged: multiZoneLengthHealthyEndsDamagedResult,
    normalEndsFalsePositive: { status: 'SAFE', presentMultiZoneSignals: multiZoneNormalSignals },
    diagnosticNotProduction: multiZoneDiagnosticNotProductionResult
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

// === LOW ELASTICITY SAFETY CONTRACT ===
function analyzeLowElasticitySafetyContractScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');

    const html = scenario.html;
    const htmlText = html.toLowerCase();
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const hasElasticityText = (
        htmlText.includes('еластичн')
        || htmlText.includes('elasticit')
        || htmlText.includes('розтяг')
        || htmlText.includes('тест-пасм')
        || htmlText.includes('слабк')
        || htmlText.includes('ламк')
        || htmlText.includes('низька еластичн')
        || htmlText.includes('ризик розтягування')
    );

    assert.ok(!scenario.error, name + ' should not throw');
    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualSignal, name + ' should require manual/block signal');
    assert.ok(hasElasticityText, name + ' should mention elasticity risk or test strand');

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        hasElasticityText,
        hasError: Boolean(scenario.error)
    };
}

const elasticityLowLiftResult = analyzeLowElasticitySafetyContractScenario('ELASTICITY-LOW-LIFT-NO-APPROVED', {
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
    ends_base_type: 'натуральна',
    elasticity: 'низька еластичність'
});
console.log('ELASTICITY-LOW-LIFT-NO-APPROVED safe behavior observed.');

const elasticityLowSbResult = analyzeLowElasticitySafetyContractScenario('ELASTICITY-LOW-SPECIAL-BLOND-NO-APPROVED', {
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
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    elasticity: 'low elasticity'
});
console.log('ELASTICITY-LOW-SPECIAL-BLOND-NO-APPROVED safe behavior observed.');

const elasticityLowToningResult = analyzeLowElasticitySafetyContractScenario('ELASTICITY-LOW-TONING-MANUAL-MINIMUM', {
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
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна',
    elasticity: 'слабка еластичність'
});
console.log('ELASTICITY-LOW-TONING-MANUAL-MINIMUM safe behavior observed.');

// === ELASTICITY-NORMAL-LIFT-NO-FALSE-POSITIVE ===
(function() {
    const scenario = runDiagnosticScenario('ELASTICITY-NORMAL-LIFT-NO-FALSE-POSITIVE', {
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
        ends_base_type: 'натуральна',
        elasticity: 'нормальна еластичність'
    });
    assert.ok(!scenario.error, 'ELASTICITY-NORMAL-LIFT-NO-FALSE-POSITIVE should not throw');
    const htmlText = scenario.html.toLowerCase();
    const forbiddenFalsePositives = [
        'низька еластичн',
        'слабка еластичн',
        'ризик розтягування',
        'ламке або слабке'
    ];
    const presentFalsePositives = forbiddenFalsePositives.filter(s => htmlText.includes(s));
    assert.deepStrictEqual(
        presentFalsePositives,
        [],
        'ELASTICITY-NORMAL-LIFT-NO-FALSE-POSITIVE should not render low-elasticity warning for normal elasticity'
    );
    globalThis.__elasticityNormalFalsePositiveResult = { status: 'SAFE', presentFalsePositives };
    console.log('ELASTICITY-NORMAL-LIFT-NO-FALSE-POSITIVE safe behavior observed.');
})();

globalThis.__elasticityResults = {
    lowLift: elasticityLowLiftResult,
    lowSb: elasticityLowSbResult,
    lowToning: elasticityLowToningResult
};

// === SPECIAL BLOND + HIGH POROSITY SAFETY CONTRACT ===
function analyzeSpecialBlondHighPorosityScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');

    const html = scenario.html;
    const htmlText = html.toLowerCase();
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const hasPorosityText = htmlText.includes('порист')
        || htmlText.includes('porosity')
        || htmlText.includes('porous')
        || htmlText.includes('нерівномір')
        || htmlText.includes('плямист')
        || htmlText.includes('тест-пасм');

    assert.ok(!scenario.error, name + ' should not throw');
    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualSignal, name + ' should require manual decision');
    assert.ok(hasPorosityText, name + ' should mention porosity or test strand risk');

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        hasPorosityText
    };
}

const specialBlondHighPorosityResult = analyzeSpecialBlondHighPorosityScenario('SPECIAL-BLOND-HIGH-POROSITY-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    porosity: 'висока пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('SPECIAL-BLOND-HIGH-POROSITY-NO-APPROVED safe behavior observed.');

const specialBlondPorousLengthResult = analyzeSpecialBlondHighPorosityScenario('SPECIAL-BLOND-POROUS-LENGTH-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    porosity: 'пористе полотно',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '8',
    ends_level: '',
    ends_condition: '',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('SPECIAL-BLOND-POROUS-LENGTH-NO-APPROVED safe behavior observed.');

(function() {
    const scenario = runDiagnosticScenario('SPECIAL-BLOND-NORMAL-POROSITY-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        porosity: 'нормальна пористість',
        elasticity: 'нормальна еластичність',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '10',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'SPECIAL-BLOND-NORMAL-POROSITY-NO-FALSE-POSITIVE should not throw');
    const htmlText = scenario.html.toLowerCase();
    const forbiddenHighPorositySignals = [
        'special blond + висока пористість',
        'висока пористість полотна',
        'дуже пористе полотно',
        'ризик нерівномірного освітлення',
        'перевантаження пігментом'
    ];
    const presentForbiddenSignals = forbiddenHighPorositySignals.filter(s => htmlText.includes(s));
    assert.deepStrictEqual(
        presentForbiddenSignals,
        [],
        'SPECIAL-BLOND-NORMAL-POROSITY-NO-FALSE-POSITIVE should not render high-porosity warning for normal porosity'
    );
    globalThis.__specialBlondNormalPorosityResult = { status: 'SAFE', presentForbiddenSignals };
    console.log('SPECIAL-BLOND-NORMAL-POROSITY-NO-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('SPECIAL-BLOND-BARE-POROSITY-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        porosity: 'porosity',
        elasticity: 'нормальна еластичність',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '10',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'SPECIAL-BLOND-BARE-POROSITY-NO-FALSE-POSITIVE should not throw');
    const htmlText = scenario.html.toLowerCase();
    const forbiddenHighPorositySignals = [
        'висока пористість',
        'high porosity',
        'special blond + висока пористість'
    ];
    const presentForbiddenSignals = forbiddenHighPorositySignals.filter(s => htmlText.includes(s));
    assert.deepStrictEqual(
        presentForbiddenSignals,
        [],
        'SPECIAL-BLOND-BARE-POROSITY-NO-FALSE-POSITIVE should not render high-porosity warning for bare porosity label'
    );
    globalThis.__specialBlondBarePorosityResult = { status: 'SAFE', presentForbiddenSignals };
    console.log('SPECIAL-BLOND-BARE-POROSITY-NO-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('SPECIAL-BLOND-BARE-UKR-POROSITY-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        porosity: 'пористість',
        elasticity: 'нормальна еластичність',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '10',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'SPECIAL-BLOND-BARE-UKR-POROSITY-NO-FALSE-POSITIVE should not throw');
    const htmlText = scenario.html.toLowerCase();
    const forbiddenHighPorositySignals = [
        'висока пористість',
        'special blond + висока пористість'
    ];
    const presentForbiddenSignals = forbiddenHighPorositySignals.filter(s => htmlText.includes(s));
    assert.deepStrictEqual(
        presentForbiddenSignals,
        [],
        'SPECIAL-BLOND-BARE-UKR-POROSITY-NO-FALSE-POSITIVE should not render high-porosity warning for bare porosity label'
    );
    globalThis.__specialBlondBareUkrPorosityResult = { status: 'SAFE', presentForbiddenSignals };
    console.log('SPECIAL-BLOND-BARE-UKR-POROSITY-NO-FALSE-POSITIVE safe behavior observed.');
})();

const nonSpecialBlondHighPorosityResult = analyzeSpecialBlondHighPorosityScenario('NON-SPECIAL-BLOND-HIGH-POROSITY-MANUAL-CONSISTENCY', {
    history: 'натуральні',
    condition: 'здоровые',
    porosity: 'висока пористість',
    elasticity: 'нормальна еластичність',
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
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('NON-SPECIAL-BLOND-HIGH-POROSITY-MANUAL-CONSISTENCY safe behavior observed.');

globalThis.__specialBlondPorosityResults = {
    highPorosity: specialBlondHighPorosityResult,
    porousLength: specialBlondPorousLengthResult,
    nonSpecialBlond: nonSpecialBlondHighPorosityResult
};

// === ROOT DAMAGED POWDER / LIFT SAFETY CONTRACT ===
function rootDamageGuardSignals(html) {
    const htmlText = String(html || '').toLowerCase();
    const signals = [
        'пошкоджений корінь + освітлення',
        'пошкоджений корінь / root damage',
        'root_condition вказує',
        'root lift',
        'процес кореня'
    ];
    return signals.filter(signal => htmlText.includes(signal));
}

function analyzeRootDamagedLiftScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');
    assert.ok(!scenario.error, name + ' should not throw');

    const html = scenario.html;
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const hasRootDamageText = rootDamageGuardSignals(html).length > 0
        || html.toLowerCase().includes('тест-пасм');

    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualSignal, name + ' should require manual decision');
    assert.ok(hasRootDamageText, name + ' should mention root damage or test strand risk');

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        hasRootDamageText
    };
}

const rootDamagedPowderResult = analyzeRootDamagedLiftScenario('ROOT-DAMAGED-POWDER-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'пошкоджений корінь',
    length_condition: 'здорове полотно',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '5',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('ROOT-DAMAGED-POWDER-NO-APPROVED safe behavior observed.');

const rootDamagedSpecialBlondResult = analyzeRootDamagedLiftScenario('ROOT-DAMAGED-SPECIAL-BLOND-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'сильно пошкоджений корінь',
    length_condition: 'здорове полотно',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('ROOT-DAMAGED-SPECIAL-BLOND-NO-APPROVED safe behavior observed.');

(function() {
    const scenario = runDiagnosticScenario('ROOT-HEALTHY-LENGTH-DAMAGED-NO-ROOT-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'здоровий корінь',
        length_condition: 'пошкоджене полотно',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '10',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'ROOT-HEALTHY-LENGTH-DAMAGED-NO-ROOT-FALSE-POSITIVE should not throw');
    const presentRootDamageSignals = rootDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentRootDamageSignals,
        [],
        'ROOT-HEALTHY-LENGTH-DAMAGED-NO-ROOT-FALSE-POSITIVE should not render root damage guard text'
    );
    globalThis.__rootHealthyLengthDamagedNoFalsePositiveResult = { status: 'SAFE', presentRootDamageSignals };
    console.log('ROOT-HEALTHY-LENGTH-DAMAGED-NO-ROOT-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('ROOT-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'damage',
        length_condition: 'здорове полотно',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '8',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'ROOT-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE should not throw');
    const presentRootDamageSignals = rootDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentRootDamageSignals,
        [],
        'ROOT-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE should not render root damage guard text for a bare label'
    );
    globalThis.__rootBareLabelNoFalsePositiveResult = { status: 'SAFE', presentRootDamageSignals };
    console.log('ROOT-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('ROOT-CONDITION-BARE-DAMAGE-LABEL-TEXT-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'root_condition damage label',
        length_condition: 'здорове полотно',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '8',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'ROOT-CONDITION-BARE-DAMAGE-LABEL-TEXT-NO-FALSE-POSITIVE should not throw');
    const presentRootDamageSignals = rootDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentRootDamageSignals,
        [],
        'ROOT-CONDITION-BARE-DAMAGE-LABEL-TEXT-NO-FALSE-POSITIVE should not render root damage guard text for a bare label text'
    );
    globalThis.__rootBareLabelTextNoFalsePositiveResult = { status: 'SAFE', presentRootDamageSignals };
    console.log('ROOT-CONDITION-BARE-DAMAGE-LABEL-TEXT-NO-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'пошкоджений корінь',
        length_condition: 'здорове полотно',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '7',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED should not throw');
    assert.ok(!scenario.html.includes('BLOCKED'), 'ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED should not be BLOCKED');
    const presentRootDamageSignals = rootDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentRootDamageSignals,
        [],
        'ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED should not render root damage lift guard text without root lift'
    );
    globalThis.__rootDamagedNoRootLiftResult = { status: 'SAFE', presentRootDamageSignals };
    console.log('ROOT-DAMAGED-NO-ROOT-LIFT-NO-BLOCKED safe behavior observed.');
})();

globalThis.__rootDamageGuardResults = {
    powder: rootDamagedPowderResult,
    specialBlond: rootDamagedSpecialBlondResult
};

// === LENGTH DAMAGED / BRITTLE LIFT SAFETY CONTRACT ===
function lengthDamageGuardSignals(html) {
    const htmlText = String(html || '').toLowerCase();
    const signals = [
        'пошкоджена / ламка довжина + освітлення',
        'пошкоджена довжина / length damage',
        'length_condition вказує',
        'length lift',
        'процес довжини'
    ];
    return signals.filter(signal => htmlText.includes(signal));
}

function analyzeLengthDamagedLiftScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');
    assert.ok(!scenario.error, name + ' should not throw');

    const html = scenario.html;
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation');
    const hasLengthDamageText = lengthDamageGuardSignals(html).length > 0
        || html.toLowerCase().includes('тест-пасм');

    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualSignal, name + ' should require manual decision');
    assert.ok(hasLengthDamageText, name + ' should mention length damage or test strand risk');

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        hasLengthDamageText
    };
}

const lengthDamagedLiftResult = analyzeLengthDamagedLiftScenario('LENGTH-DAMAGED-LIFT-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'пошкоджене полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('LENGTH-DAMAGED-LIFT-NO-APPROVED safe behavior observed.');

const lengthBrittleLiftResult = analyzeLengthDamagedLiftScenario('LENGTH-BRITTLE-LIFT-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'ламке полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('LENGTH-BRITTLE-LIFT-NO-APPROVED safe behavior observed.');

const lengthDamagedSpecialBlondResult = analyzeLengthDamagedLiftScenario('LENGTH-DAMAGED-SPECIAL-BLOND-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'сильно пошкоджене полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('LENGTH-DAMAGED-SPECIAL-BLOND-NO-APPROVED safe behavior observed.');

(function() {
    const scenario = runDiagnosticScenario('LENGTH-HEALTHY-ROOT-DAMAGED-NO-LENGTH-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'пошкоджений корінь',
        length_condition: 'здорове полотно',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '8',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'LENGTH-HEALTHY-ROOT-DAMAGED-NO-LENGTH-FALSE-POSITIVE should not throw');
    const presentLengthDamageSignals = lengthDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentLengthDamageSignals,
        [],
        'LENGTH-HEALTHY-ROOT-DAMAGED-NO-LENGTH-FALSE-POSITIVE should not render length damage guard text'
    );
    globalThis.__lengthHealthyRootDamagedNoFalsePositiveResult = { status: 'SAFE', presentLengthDamageSignals };
    console.log('LENGTH-HEALTHY-ROOT-DAMAGED-NO-LENGTH-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('LENGTH-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'здоровий корінь',
        length_condition: 'damage',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '8',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'LENGTH-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE should not throw');
    const presentLengthDamageSignals = lengthDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentLengthDamageSignals,
        [],
        'LENGTH-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE should not render length damage guard text for a bare label'
    );
    globalThis.__lengthBareLabelNoFalsePositiveResult = { status: 'SAFE', presentLengthDamageSignals };
    console.log('LENGTH-CONDITION-BARE-DAMAGE-LABEL-NO-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    const scenario = runDiagnosticScenario('LENGTH-DAMAGED-NO-LENGTH-LIFT-NO-BLOCKED', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'здоровий корінь',
        length_condition: 'пошкоджене полотно',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '7',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'LENGTH-DAMAGED-NO-LENGTH-LIFT-NO-BLOCKED should not throw');
    assert.ok(!scenario.html.includes('BLOCKED'), 'LENGTH-DAMAGED-NO-LENGTH-LIFT-NO-BLOCKED should not be BLOCKED');
    const presentLengthDamageSignals = lengthDamageGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentLengthDamageSignals,
        [],
        'LENGTH-DAMAGED-NO-LENGTH-LIFT-NO-BLOCKED should not render length damage lift guard text without length lift'
    );
    globalThis.__lengthDamagedNoLengthLiftResult = { status: 'SAFE', presentLengthDamageSignals };
    console.log('LENGTH-DAMAGED-NO-LENGTH-LIFT-NO-BLOCKED safe behavior observed.');
})();

globalThis.__lengthDamageGuardResults = {
    lift: lengthDamagedLiftResult,
    brittleLift: lengthBrittleLiftResult,
    specialBlond: lengthDamagedSpecialBlondResult
};

// === HIGH OXIDIZER + DAMAGED / RISKY HAIR SAFETY CONTRACT ===
function highOxidizerGuardSignals(html) {
    const htmlText = String(html || '').toLowerCase();
    const signals = [
        'високий оксид на ризиковому',
        'високий оксид на ризиковій',
        'ризиковому / пошкодженому корені',
        'ризиковій / пошкодженій довжині',
        'високого оксиду',
        'використання 9%',
        'використання 12%'
    ];
    return signals.filter(signal => htmlText.includes(signal));
}

function analyzeHighOxidizerDamagedHairScenario(name, values, options) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');
    assert.ok(!scenario.error, name + ' should not throw');

    const html = scenario.html;
    const htmlText = html.toLowerCase();
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualOrBlockSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation')
        || html.includes('BLOCKED')
        || html.includes('ФАТАЛЬНО');
    const hasHighOxOutput = html.includes('9%') || html.includes('12%');
    const presentHighOxidizerSignals = highOxidizerGuardSignals(html);
    const hasRiskText = presentHighOxidizerSignals.length > 0
        || htmlText.includes('пошкод')
        || htmlText.includes('повреж')
        || htmlText.includes('порист')
        || htmlText.includes('еластич')
        || htmlText.includes('тест-пасм');

    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualOrBlockSignal, name + ' should require manual/block signal');
    assert.ok(hasRiskText, name + ' should mention high oxidizer or damaged/risky hair');
    if (!options || options.requireHighOxOutput !== false) {
        assert.ok(hasHighOxOutput, name + ' should expose 9% or 12% oxidizer in output');
    }
    if (!options || options.requireHighOxidizerSignal !== false) {
        assert.ok(presentHighOxidizerSignals.length > 0, name + ' should render high oxidizer guard text');
    }

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualOrBlockSignal,
        hasHighOxOutput,
        presentHighOxidizerSignals
    };
}

const highOxRootDamagedResult = analyzeHighOxidizerDamagedHairScenario('HIGH-OXIDIZER-ROOT-DAMAGED-9-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'пошкоджений корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('HIGH-OXIDIZER-ROOT-DAMAGED-9-NO-APPROVED safe behavior observed.');

const highOxLengthDamagedResult = analyzeHighOxidizerDamagedHairScenario('HIGH-OXIDIZER-LENGTH-DAMAGED-9-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'пошкоджене полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('HIGH-OXIDIZER-LENGTH-DAMAGED-9-NO-APPROVED safe behavior observed.');

const highOxLegacyStronglyDamagedResult = analyzeHighOxidizerDamagedHairScenario('HIGH-OXIDIZER-LEGACY-STRONGLY-DAMAGED-NO-APPROVED', {
    history: 'натуральні',
    condition: 'сильно поврежденные',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
}, { requireHighOxOutput: false, requireHighOxidizerSignal: false });
console.log('HIGH-OXIDIZER-LEGACY-STRONGLY-DAMAGED-NO-APPROVED safe behavior observed.');

const highOxHighPorosityResult = analyzeHighOxidizerDamagedHairScenario('HIGH-OXIDIZER-HIGH-POROSITY-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'висока пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('HIGH-OXIDIZER-HIGH-POROSITY-NO-APPROVED safe behavior observed.');

const highOxLowElasticityResult = analyzeHighOxidizerDamagedHairScenario('HIGH-OXIDIZER-LOW-ELASTICITY-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'низька еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('HIGH-OXIDIZER-LOW-ELASTICITY-NO-APPROVED safe behavior observed.');

(function() {
    const scenario = runDiagnosticScenario('HIGH-OXIDIZER-NORMAL-HAIR-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'здоровий корінь',
        length_condition: 'здорове полотно',
        porosity: 'нормальна пористість',
        elasticity: 'нормальна еластичність',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '9',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'HIGH-OXIDIZER-NORMAL-HAIR-NO-FALSE-POSITIVE should not throw');
    assert.ok(scenario.html.includes('9%'), 'HIGH-OXIDIZER-NORMAL-HAIR-NO-FALSE-POSITIVE should still expose high oxidizer recipe output');
    const presentHighOxidizerSignals = highOxidizerGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentHighOxidizerSignals,
        [],
        'HIGH-OXIDIZER-NORMAL-HAIR-NO-FALSE-POSITIVE should not render damaged-hair high oxidizer warning for normal hair'
    );
    globalThis.__highOxNormalHairFalsePositiveResult = { status: 'SAFE', presentHighOxidizerSignals };
    console.log('HIGH-OXIDIZER-NORMAL-HAIR-NO-FALSE-POSITIVE safe behavior observed.');
})();

(function() {
    // Production extractOxPercent is local to calculateProtocol; this runtime case verifies 1.9% is not treated as >= 9.
    const scenario = runDiagnosticScenario('HIGH-OXIDIZER-PARSE-DECIMAL-NO-FALSE-POSITIVE', {
        history: 'натуральні',
        condition: 'здоровые',
        root_condition: 'пошкоджений корінь',
        length_condition: 'пошкоджене полотно',
        porosity: 'нормальна пористість',
        elasticity: 'нормальна еластичність',
        thickness: 'средние',
        density: 'средние',
        length: 'средние',
        grey_percent: '0',
        grey_type: 'мягкая',
        root_level: '7',
        root_length: '1',
        length_level: '7',
        ends_level: '7',
        ends_condition: 'здорові',
        base_type: 'Натуральна',
        target_level: '6',
        target_direction: '1',
        ends_history: 'натуральні',
        ends_base_type: 'натуральна'
    });
    assert.ok(!scenario.error, 'HIGH-OXIDIZER-PARSE-DECIMAL-NO-FALSE-POSITIVE should not throw');
    const presentHighOxidizerSignals = highOxidizerGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentHighOxidizerSignals,
        [],
        'HIGH-OXIDIZER-PARSE-DECIMAL-NO-FALSE-POSITIVE should not treat 1.9% as high oxidizer'
    );
    globalThis.__highOxParseDecimalFalsePositiveResult = { status: 'SAFE', presentHighOxidizerSignals };
    console.log('HIGH-OXIDIZER-PARSE-DECIMAL-NO-FALSE-POSITIVE safe behavior observed.');
})();

// === BRAND-SPECIFIC CONSTRAINTS: MISSING BRAND RULE MATRIX MANUAL GATE ===
function brandSpecificGuardSignals(html) {
    const htmlText = String(html || '').toLowerCase();
    const signals = [
        'brand / system rules не підтверджені',
        'brand-specific rules required',
        'brand rule matrix',
        'brand/system rules',
        'бренд-залежний процес',
        'підтвердження бренду',
        'бренду, системи, лінійки',
        'лінійки, сумісності окисника',
        'інструкції виробника',
        'special blond',
        '.00 / grey coverage',
        'high oxidizer',
        'powder / порошок',
        'toning / тонування'
    ];
    return signals.filter(signal => htmlText.includes(signal));
}

function analyzeBrandMissingRuleMatrixScenario(name, values, expectedTextSignals) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');
    assert.ok(!scenario.error, name + ' should not throw');

    const html = scenario.html;
    const htmlText = html.toLowerCase();
    const hasApproved = html.includes('APPROVED')
        || html.includes('ПРОТОКОЛ ЗАТВЕРДЖЕНО');
    const hasApprovedRecipe = html.includes('approved-recipe');
    const hasManualSignal = html.includes('MANUAL_REQUIRED')
        || html.includes('Потрібне ручне рішення')
        || html.includes('needs_confirmation')
        || html.includes('Brand-specific rules required');
    const presentBrandSignals = brandSpecificGuardSignals(html);

    assert.ok(!hasApproved, name + ' should not be automatic APPROVED');
    assert.ok(!hasApprovedRecipe, name + ' should not render approved recipe blocks');
    assert.ok(hasManualSignal, name + ' should require manual signal');
    assert.ok(presentBrandSignals.length > 0, name + ' should render brand/system guard text');
    expectedTextSignals.forEach(signal => {
        assert.ok(htmlText.includes(signal), name + ' should mention ' + signal);
    });

    return {
        status: 'SAFE',
        hasApproved,
        hasApprovedRecipe,
        hasManualSignal,
        presentBrandSignals
    };
}

function analyzeBrandSpecificFalsePositiveScenario(name, values) {
    const scenario = runDiagnosticScenario(name, values);
    assert.ok(scenario.requestedIds.includes('output'), name + ' should access output');
    assert.ok(!scenario.error, name + ' should not throw');

    const presentBrandSignals = brandSpecificGuardSignals(scenario.html);
    assert.deepStrictEqual(
        presentBrandSignals,
        [],
        name + ' should not render missing brand rule matrix warning'
    );

    return {
        status: 'SAFE',
        presentBrandSignals
    };
}

const brandMissingSpecialBlondResult = analyzeBrandMissingRuleMatrixScenario('BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '10',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
}, ['brand/system rules', 'special blond', '9%']);
console.log('BRAND-MISSING-SPECIAL-BLOND-NO-APPROVED safe behavior observed.');

const brandMissingGrey00Result = analyzeBrandMissingRuleMatrixScenario('BRAND-MISSING-GREY-00-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '70',
    grey_type: 'мягкая',
    root_level: '6',
    root_length: '1',
    length_level: '6',
    ends_level: '6',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
}, ['brand/system rules', '.00', 'grey coverage']);
console.log('BRAND-MISSING-GREY-00-NO-APPROVED safe behavior observed.');

const brandMissingHighOxidizerResult = analyzeBrandMissingRuleMatrixScenario('BRAND-MISSING-HIGH-OXIDIZER-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
}, ['brand/system rules', 'high oxidizer', '9%']);
console.log('BRAND-MISSING-HIGH-OXIDIZER-NO-APPROVED safe behavior observed.');

const brandMissingPowderResult = analyzeBrandMissingRuleMatrixScenario('BRAND-MISSING-POWDER-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '5',
    root_length: '1',
    length_level: '5',
    ends_level: '5',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '9',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
}, ['brand/system rules', 'powder', 'порошок']);
console.log('BRAND-MISSING-POWDER-NO-APPROVED safe behavior observed.');

const brandMissingToningResult = analyzeBrandMissingRuleMatrixScenario('BRAND-MISSING-TONING-LINE-NO-APPROVED', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '9',
    root_length: '1',
    length_level: '9',
    ends_level: '9',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
}, ['brand/system rules', 'toning', 'тонування']);
console.log('BRAND-MISSING-TONING-LINE-NO-APPROVED safe behavior observed.');

const brandNormalSameLevelResult = analyzeBrandSpecificFalsePositiveScenario('BRAND-NORMAL-SAME-LEVEL-NO-FALSE-POSITIVE', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '7',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('BRAND-NORMAL-SAME-LEVEL-NO-FALSE-POSITIVE safe behavior observed.');

const brandGenericPermanent6Result = analyzeBrandSpecificFalsePositiveScenario('BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE', {
    history: 'натуральні',
    condition: 'здоровые',
    root_condition: 'здоровий корінь',
    length_condition: 'здорове полотно',
    porosity: 'нормальна пористість',
    elasticity: 'нормальна еластичність',
    thickness: 'средние',
    density: 'средние',
    length: 'средние',
    grey_percent: '0',
    grey_type: 'мягкая',
    root_level: '7',
    root_length: '1',
    length_level: '7',
    ends_level: '7',
    ends_condition: 'здорові',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1',
    ends_history: 'натуральні',
    ends_base_type: 'натуральна'
});
console.log('BRAND-GENERIC-PERMANENT-6-NO-BRAND-GATE-IF-NOT-SENSITIVE safe behavior observed.');

globalThis.__highOxidizerDamagedHairResults = {
    rootDamaged: highOxRootDamagedResult,
    lengthDamaged: highOxLengthDamagedResult,
    legacyStronglyDamaged: highOxLegacyStronglyDamagedResult,
    highPorosity: highOxHighPorosityResult,
    lowElasticity: highOxLowElasticityResult
};

globalThis.__brandSpecificGuardResults = {
    specialBlond: brandMissingSpecialBlondResult,
    grey00: brandMissingGrey00Result,
    highOxidizer: brandMissingHighOxidizerResult,
    powder: brandMissingPowderResult,
    toning: brandMissingToningResult
};

globalThis.__brandSpecificFalsePositiveResults = {
    normalSameLevel: brandNormalSameLevelResult,
    genericPermanent6: brandGenericPermanent6Result
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
assert.strictEqual(sandbox.__blackExitResult.status, 'SAFE');
assert.strictEqual(sandbox.__blackExitResult.explicitMarker.hasManualSignal, true);
assert.strictEqual(sandbox.__blackExitResult.explicitMarker.hasApproved, false);
assert.strictEqual(sandbox.__blackExitResult.explicitMarker.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__blackExitResult.cosmeticDarkBaseNoMarker.hasManualSignal, true);
assert.strictEqual(sandbox.__blackExitResult.cosmeticDarkBaseNoMarker.hasApproved, false);
assert.strictEqual(sandbox.__blackExitResult.cosmeticDarkBaseNoMarker.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__blackExitResult.darkCosmeticLength.hasManualSignal, true);
assert.strictEqual(sandbox.__blackExitResult.darkCosmeticLength.hasApproved, false);
assert.strictEqual(sandbox.__blackExitResult.darkCosmeticLength.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__blackExitResult.naturalDarkBaseNoFalsePositive.status, 'SAFE');
assert.strictEqual(sandbox.__blackExitResult.naturalDarkBaseNoFalsePositive.presentForbiddenSignals.length, 0);
assert.strictEqual(sandbox.__hennaMetalsResult.status, 'SAFE');
assert.strictEqual(sandbox.__hennaMetalsResult.rootLift.hasApproved, false);
assert.strictEqual(sandbox.__hennaMetalsResult.rootLift.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__hennaMetalsResult.rootLift.hasManualOrBlockSignal, true);
assert.strictEqual(sandbox.__hennaMetalsResult.rootLift.hasHennaMetalsText, true);
assert.strictEqual(sandbox.__hennaMetalsResult.specialBlond.hasApproved, false);
assert.strictEqual(sandbox.__hennaMetalsResult.specialBlond.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__hennaMetalsResult.specialBlond.hasManualOrBlockSignal, true);
assert.strictEqual(sandbox.__hennaMetalsResult.specialBlond.hasHennaMetalsText, true);
assert.strictEqual(sandbox.__hennaMetalsResult.toning.hasApproved, false);
assert.strictEqual(sandbox.__hennaMetalsResult.toning.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__hennaMetalsResult.toning.hasManualOrBlockSignal, true);
assert.strictEqual(sandbox.__hennaMetalsResult.toning.hasHennaMetalsText, true);
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

assert.strictEqual(sandbox.__elasticityResults.lowLift.status, 'SAFE');
assert.strictEqual(sandbox.__elasticityResults.lowLift.hasApproved, false);
assert.strictEqual(sandbox.__elasticityResults.lowLift.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__elasticityResults.lowLift.hasManualSignal, true);
assert.strictEqual(sandbox.__elasticityResults.lowLift.hasElasticityText, true);
assert.strictEqual(sandbox.__elasticityResults.lowSb.status, 'SAFE');
assert.strictEqual(sandbox.__elasticityResults.lowSb.hasApproved, false);
assert.strictEqual(sandbox.__elasticityResults.lowSb.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__elasticityResults.lowSb.hasManualSignal, true);
assert.strictEqual(sandbox.__elasticityResults.lowSb.hasElasticityText, true);
assert.strictEqual(sandbox.__elasticityResults.lowToning.status, 'SAFE');
assert.strictEqual(sandbox.__elasticityResults.lowToning.hasApproved, false);
assert.strictEqual(sandbox.__elasticityResults.lowToning.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__elasticityResults.lowToning.hasManualSignal, true);
assert.strictEqual(sandbox.__elasticityResults.lowToning.hasElasticityText, true);
assert.deepStrictEqual(Array.from(sandbox.__elasticityNormalFalsePositiveResult.presentFalsePositives), []);
assert.strictEqual(sandbox.__elasticityNormalFalsePositiveResult.status, 'SAFE');
assert.strictEqual(sandbox.__specialBlondPorosityResults.highPorosity.status, 'SAFE');
assert.strictEqual(sandbox.__specialBlondPorosityResults.highPorosity.hasApproved, false);
assert.strictEqual(sandbox.__specialBlondPorosityResults.highPorosity.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__specialBlondPorosityResults.highPorosity.hasManualSignal, true);
assert.strictEqual(sandbox.__specialBlondPorosityResults.highPorosity.hasPorosityText, true);
assert.strictEqual(sandbox.__specialBlondPorosityResults.porousLength.status, 'SAFE');
assert.strictEqual(sandbox.__specialBlondPorosityResults.porousLength.hasApproved, false);
assert.strictEqual(sandbox.__specialBlondPorosityResults.porousLength.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__specialBlondPorosityResults.porousLength.hasManualSignal, true);
assert.strictEqual(sandbox.__specialBlondPorosityResults.porousLength.hasPorosityText, true);
assert.deepStrictEqual(Array.from(sandbox.__specialBlondNormalPorosityResult.presentForbiddenSignals), []);
assert.strictEqual(sandbox.__specialBlondNormalPorosityResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__specialBlondBarePorosityResult.presentForbiddenSignals), []);
assert.strictEqual(sandbox.__specialBlondBarePorosityResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__specialBlondBareUkrPorosityResult.presentForbiddenSignals), []);
assert.strictEqual(sandbox.__specialBlondBareUkrPorosityResult.status, 'SAFE');
assert.strictEqual(sandbox.__specialBlondPorosityResults.nonSpecialBlond.status, 'SAFE');
assert.strictEqual(sandbox.__specialBlondPorosityResults.nonSpecialBlond.hasManualSignal, true);
assert.strictEqual(sandbox.__specialBlondPorosityResults.nonSpecialBlond.hasPorosityText, true);
assert.strictEqual(sandbox.__rootDamageGuardResults.powder.status, 'SAFE');
assert.strictEqual(sandbox.__rootDamageGuardResults.powder.hasApproved, false);
assert.strictEqual(sandbox.__rootDamageGuardResults.powder.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__rootDamageGuardResults.powder.hasManualSignal, true);
assert.strictEqual(sandbox.__rootDamageGuardResults.powder.hasRootDamageText, true);
assert.strictEqual(sandbox.__rootDamageGuardResults.specialBlond.status, 'SAFE');
assert.strictEqual(sandbox.__rootDamageGuardResults.specialBlond.hasApproved, false);
assert.strictEqual(sandbox.__rootDamageGuardResults.specialBlond.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__rootDamageGuardResults.specialBlond.hasManualSignal, true);
assert.strictEqual(sandbox.__rootDamageGuardResults.specialBlond.hasRootDamageText, true);
assert.deepStrictEqual(Array.from(sandbox.__rootHealthyLengthDamagedNoFalsePositiveResult.presentRootDamageSignals), []);
assert.strictEqual(sandbox.__rootHealthyLengthDamagedNoFalsePositiveResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__rootBareLabelNoFalsePositiveResult.presentRootDamageSignals), []);
assert.strictEqual(sandbox.__rootBareLabelNoFalsePositiveResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__rootBareLabelTextNoFalsePositiveResult.presentRootDamageSignals), []);
assert.strictEqual(sandbox.__rootBareLabelTextNoFalsePositiveResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__rootDamagedNoRootLiftResult.presentRootDamageSignals), []);
assert.strictEqual(sandbox.__rootDamagedNoRootLiftResult.status, 'SAFE');
assert.strictEqual(sandbox.__lengthDamageGuardResults.lift.status, 'SAFE');
assert.strictEqual(sandbox.__lengthDamageGuardResults.lift.hasApproved, false);
assert.strictEqual(sandbox.__lengthDamageGuardResults.lift.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__lengthDamageGuardResults.lift.hasManualSignal, true);
assert.strictEqual(sandbox.__lengthDamageGuardResults.lift.hasLengthDamageText, true);
assert.strictEqual(sandbox.__lengthDamageGuardResults.brittleLift.status, 'SAFE');
assert.strictEqual(sandbox.__lengthDamageGuardResults.brittleLift.hasApproved, false);
assert.strictEqual(sandbox.__lengthDamageGuardResults.brittleLift.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__lengthDamageGuardResults.brittleLift.hasManualSignal, true);
assert.strictEqual(sandbox.__lengthDamageGuardResults.brittleLift.hasLengthDamageText, true);
assert.strictEqual(sandbox.__lengthDamageGuardResults.specialBlond.status, 'SAFE');
assert.strictEqual(sandbox.__lengthDamageGuardResults.specialBlond.hasApproved, false);
assert.strictEqual(sandbox.__lengthDamageGuardResults.specialBlond.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__lengthDamageGuardResults.specialBlond.hasManualSignal, true);
assert.strictEqual(sandbox.__lengthDamageGuardResults.specialBlond.hasLengthDamageText, true);
assert.deepStrictEqual(Array.from(sandbox.__lengthHealthyRootDamagedNoFalsePositiveResult.presentLengthDamageSignals), []);
assert.strictEqual(sandbox.__lengthHealthyRootDamagedNoFalsePositiveResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__lengthBareLabelNoFalsePositiveResult.presentLengthDamageSignals), []);
assert.strictEqual(sandbox.__lengthBareLabelNoFalsePositiveResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__lengthDamagedNoLengthLiftResult.presentLengthDamageSignals), []);
assert.strictEqual(sandbox.__lengthDamagedNoLengthLiftResult.status, 'SAFE');
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.rootDamaged.status, 'SAFE');
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.rootDamaged.hasApproved, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.rootDamaged.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.rootDamaged.hasManualOrBlockSignal, true);
assert.ok(sandbox.__highOxidizerDamagedHairResults.rootDamaged.presentHighOxidizerSignals.length > 0);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lengthDamaged.status, 'SAFE');
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lengthDamaged.hasApproved, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lengthDamaged.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lengthDamaged.hasManualOrBlockSignal, true);
assert.ok(sandbox.__highOxidizerDamagedHairResults.lengthDamaged.presentHighOxidizerSignals.length > 0);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.legacyStronglyDamaged.status, 'SAFE');
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.legacyStronglyDamaged.hasApproved, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.legacyStronglyDamaged.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.legacyStronglyDamaged.hasManualOrBlockSignal, true);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.highPorosity.status, 'SAFE');
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.highPorosity.hasApproved, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.highPorosity.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.highPorosity.hasManualOrBlockSignal, true);
assert.ok(sandbox.__highOxidizerDamagedHairResults.highPorosity.presentHighOxidizerSignals.length > 0);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lowElasticity.status, 'SAFE');
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lowElasticity.hasApproved, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lowElasticity.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__highOxidizerDamagedHairResults.lowElasticity.hasManualOrBlockSignal, true);
assert.ok(sandbox.__highOxidizerDamagedHairResults.lowElasticity.presentHighOxidizerSignals.length > 0);
assert.deepStrictEqual(Array.from(sandbox.__highOxNormalHairFalsePositiveResult.presentHighOxidizerSignals), []);
assert.strictEqual(sandbox.__highOxNormalHairFalsePositiveResult.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__highOxParseDecimalFalsePositiveResult.presentHighOxidizerSignals), []);
assert.strictEqual(sandbox.__highOxParseDecimalFalsePositiveResult.status, 'SAFE');
assert.strictEqual(sandbox.__brandSpecificGuardResults.specialBlond.status, 'SAFE');
assert.strictEqual(sandbox.__brandSpecificGuardResults.specialBlond.hasApproved, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.specialBlond.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.specialBlond.hasManualSignal, true);
assert.ok(Array.from(sandbox.__brandSpecificGuardResults.specialBlond.presentBrandSignals).length > 0);
assert.strictEqual(sandbox.__brandSpecificGuardResults.grey00.status, 'SAFE');
assert.strictEqual(sandbox.__brandSpecificGuardResults.grey00.hasApproved, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.grey00.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.grey00.hasManualSignal, true);
assert.ok(Array.from(sandbox.__brandSpecificGuardResults.grey00.presentBrandSignals).length > 0);
assert.strictEqual(sandbox.__brandSpecificGuardResults.highOxidizer.status, 'SAFE');
assert.strictEqual(sandbox.__brandSpecificGuardResults.highOxidizer.hasApproved, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.highOxidizer.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.highOxidizer.hasManualSignal, true);
assert.ok(Array.from(sandbox.__brandSpecificGuardResults.highOxidizer.presentBrandSignals).length > 0);
assert.strictEqual(sandbox.__brandSpecificGuardResults.powder.status, 'SAFE');
assert.strictEqual(sandbox.__brandSpecificGuardResults.powder.hasApproved, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.powder.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.powder.hasManualSignal, true);
assert.ok(Array.from(sandbox.__brandSpecificGuardResults.powder.presentBrandSignals).length > 0);
assert.strictEqual(sandbox.__brandSpecificGuardResults.toning.status, 'SAFE');
assert.strictEqual(sandbox.__brandSpecificGuardResults.toning.hasApproved, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.toning.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__brandSpecificGuardResults.toning.hasManualSignal, true);
assert.ok(Array.from(sandbox.__brandSpecificGuardResults.toning.presentBrandSignals).length > 0);
assert.deepStrictEqual(Array.from(sandbox.__brandSpecificFalsePositiveResults.normalSameLevel.presentBrandSignals), []);
assert.strictEqual(sandbox.__brandSpecificFalsePositiveResults.normalSameLevel.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__brandSpecificFalsePositiveResults.genericPermanent6.presentBrandSignals), []);
assert.strictEqual(sandbox.__brandSpecificFalsePositiveResults.genericPermanent6.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.brittleLift.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.brittleLift.hasApproved, false);
assert.strictEqual(sandbox.__multiZoneConflictResults.brittleLift.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__multiZoneConflictResults.brittleLift.productionEndsRecSignal, false);
assert.strictEqual(sandbox.__multiZoneConflictResults.damagedLengthLift.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.damagedLengthLift.hasApproved, false);
assert.strictEqual(sandbox.__multiZoneConflictResults.damagedLengthLift.hasApprovedRecipe, false);
assert.strictEqual(sandbox.__multiZoneConflictResults.lightenedSameLevel.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.lightenedSameLevel.hasManualSignal, true);
assert.strictEqual(sandbox.__multiZoneConflictResults.mixedBaseSameLevel.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.hennaMetals.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.darkCosmetic.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.lengthHealthyEndsDamaged.status, 'SAFE');
assert.deepStrictEqual(Array.from(sandbox.__multiZoneConflictResults.normalEndsFalsePositive.presentMultiZoneSignals), []);
assert.strictEqual(sandbox.__multiZoneConflictResults.normalEndsFalsePositive.status, 'SAFE');
assert.strictEqual(sandbox.__multiZoneConflictResults.diagnosticNotProduction.productionEndsRecSignal, false);
assert.strictEqual(sandbox.__multiZoneConflictResults.diagnosticNotProduction.status, 'SAFE');

console.log('WWW business scenario test passed');
