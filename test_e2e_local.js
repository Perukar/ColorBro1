const { MasterNode } = require('./core.js');

let input = {
    history: 'здоровые',
    condition: 'пористі', 
    thickness: 'толстые', 
    hairDensity: 'THICK',
    hairLength: 'MEDIUM',
    grey: '50', 
    greyType: 'мягкая',
    elasticity: '1',
    rootLevel: '4', 
    rootLength: '4', // Смуга 4 см (MID-BAND)
    lengthLevel: '9', 
    baseType: 'Натуральна', 
    targetLevel: '10', 
    targetDirection: '1' // 10.1
};

const master = new MasterNode();
const state = master.process(input);
console.log(JSON.stringify(state.phases, null, 2));
