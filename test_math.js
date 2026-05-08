const { MasterNode } = require('./core.js');

const rawInput = {
    history: 'хна / металл',
    condition: 'здоровые', // First test: healthy condition + Henna = shouldn't be blocked, but let's see. Wait, "Хна на поврежденных" blocks. Let's make it DAMAGED to test the block.
    thickness: 'нормальные',
    density: 'средние',
    length: 'средние',
    grey: '0',
    greyType: 'обычная',
    elasticity: '5', // TEARING
    rootLevel: '6',
    rootLength: '2',
    lengthLevel: '7',
    baseType: 'хна / металл', // Maps to HENNA
    targetLevel: '8',
    targetDirection: '1'
};

const master = new MasterNode();

console.log("=== SCENARIO 1: HENNA + DAMAGED (Should Block) ===");
rawInput.condition = 'сильно поврежденные';
let state = master.process(rawInput);
console.log(JSON.stringify(state, null, 2));

console.log("\n=== SCENARIO 2: HENNA + HEALTHY + ELASTICITY 5 (Should trigger 'Last Hope') ===");
rawInput.condition = 'здоровые';
let state2 = master.process(rawInput);
console.log("Status:", state2.status);
console.log("Protocol:", state2.plan.filter(p => p.includes('ОСТАННЯ НАДІЯ')));
console.log("Warnings:", state2.warnings);

console.log("\n=== SCENARIO 3: INVALID INPUT (Should throw mapping error) ===");
try {
    const invalidInput = { ...rawInput, condition: 'unknown_magic' };
    let state3 = master.process(invalidInput);
} catch (e) {
    console.log("Caught exception:", e.message);
}

console.log("\n=== SCENARIO 4: MID-BAND LOGIC ===");
rawInput.condition = 'здоровые';
rawInput.elasticity = '1'; // Reset elasticity
rawInput.rootLength = '4'; // 4 cm root
rawInput.rStep = '2'; // Lift needed
let state4 = master.process(rawInput);
console.log("Status:", state4.status);
console.log("Root Recipe:", state4.rootRec ? state4.rootRec.ox : "None");
console.log("Mid Recipe:", state4.midRec ? state4.midRec.ox : "None");
console.log("Protocol Snippet:", state4.plan.filter(p => p.includes('MID-BAND') || p.includes('Mid-band')));
