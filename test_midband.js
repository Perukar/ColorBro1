const { MasterNode } = require('./core.js');

let rawInput = {
    history: 'косметический пигмент',
    condition: 'пористые',
    thickness: 'средние',
    density: 'средние',
    length: 'длинные',
    grey: '0',
    greyType: 'мягкая',
    elasticity: '1',
    rootLevel: '5',
    rootLength: '3', // > 2cm MID-BAND
    lengthLevel: '5',
    baseType: 'Косметична',
    targetLevel: '9',
    targetDirection: '1'
};

const master = new MasterNode();
let state = master.process(rawInput);
console.log(JSON.stringify(state.phases, null, 2));
