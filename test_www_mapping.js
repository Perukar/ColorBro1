const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('./www/core.js', 'utf8');

const fakeValues = {
    history: 'чиста',
    condition: 'нормальні',
    thickness: 'середні',
    density: 'середні',
    length: 'середні',
    grey_percent: '50',
    grey_type: 'стекловидная',
    root_level: '6',
    root_length: '3',
    length_level: '7',
    ends_level: '8',
    ends_condition: 'пористі',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1'
};

const requestedIds = [];

const sandbox = {
    console,
    document: {
        getElementById(id) {
            requestedIds.push(id);
            return { value: fakeValues[id] ?? '' };
        }
    }
};

vm.createContext(sandbox);

vm.runInContext(code + `
    const wwwValues = PerucarWwwMappingV1.gatherWwwFormData();
    const rawInput = PerucarWwwMappingV1.normalizeWwwToRootRawInput(wwwValues);

    globalThis.__testResult = {
        mappingExists: typeof PerucarWwwMappingV1 === 'object',
        wwwValues,
        rawInput
    };
`, sandbox);

const expectedWwwValues = {
    history: 'чиста',
    condition: 'нормальні',
    thickness: 'середні',
    density: 'середні',
    length: 'середні',
    grey_percent: '50',
    grey_type: 'стекловидная',
    root_level: '6',
    root_length: '3',
    length_level: '7',
    ends_level: '8',
    ends_condition: 'пористі',
    base_type: 'Натуральна',
    target_level: '8',
    target_direction: '1'
};

const expectedRequestedIds = Object.keys(expectedWwwValues);

const expectedRawInput = {
    history: 'чиста',
    condition: 'нормальні',
    thickness: 'середні',
    density: 'середні',
    length: 'середні',
    grey: 50,
    greyType: 'стекловидная',
    rootLevel: 6,
    rootLength: 3,
    lengthLevel: 7,
    endsLevel: 8,
    endsCondition: 'пористі',
    baseType: 'Натуральна',
    targetLevel: 8,
    targetDirection: '1',
    elasticity: '1',
    isMidActive: false,
    midLevel: null,
    midBaseType: null
};

assert.strictEqual(sandbox.__testResult.mappingExists, true);
const actualWwwValues = JSON.parse(JSON.stringify(sandbox.__testResult.wwwValues));
const actualRawInput = JSON.parse(JSON.stringify(sandbox.__testResult.rawInput));

assert.deepStrictEqual(actualWwwValues, expectedWwwValues);
assert.deepStrictEqual(actualRawInput, expectedRawInput);
assert.strictEqual(requestedIds.includes('output'), false);
assert.deepStrictEqual(requestedIds, expectedRequestedIds);

console.log('WWW mapping test passed');
