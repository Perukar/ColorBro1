const fs = require('fs');
let code = fs.readFileSync('core.js', 'utf8');

const regex = /if \(lenRec && \(lenRec\.process === ProcessType\.POWDER \|\| lenRec\.process === ProcessType\.DECAPITATION\) && \[HairCondition\.POROUS, HairCondition\.DAMAGED\]\.includes\(condition\)\) \{([\s\S]*?)\}/;

const newBlock = `if (lenRec && [HairCondition.POROUS, HairCondition.DAMAGED].includes(condition)) {
            if (lengthLevel >= 9 && (lenRec.process === ProcessType.POWDER || lenRec.process === ProcessType.DECAPITATION || snapshot.rStep > 0 && snapshot.rootLevel <= 5)) {
                lenRec = { ...lenRec, process: "Емульгація", dye: "Відпрацьована суміш", ox: "-", ratio: "-", mass: 0 };
                diagnostics.push("ПРАВИЛО 2: Пориста довжина 9-10 УГТ — свіжа пудра або агресивна фарба заборонена. Призначено емульгацію.");
            } else if (lenRec.process === ProcessType.POWDER || lenRec.process === ProcessType.DECAPITATION) {
                lenRec = { ...lenRec, ox: "1.5%", ratio: "1:4" };
                diagnostics.push("Пошкоджені кінці: примусове зниження оксиду порошку до 1.5% і пропорції 1:4.");
            }
        }`;

code = code.replace(regex, newBlock);
fs.writeFileSync('core.js', code);
console.log("core.js updated with improved Rule 2.");
