const HairCondition = { POROUS: 'POROUS', GLASSY: 'GLASSY', HEALTHY: 'HEALTHY', DAMAGED: 'DAMAGED' };
const BaseType = { NATURAL: 'NATURAL', COSMETIC_FRESH: 'COSMETIC_FRESH', COSMETIC_BUILDUP: 'COSMETIC_BUILDUP', DIRECT_PIGMENT: 'DIRECT_PIGMENT', HENNA: 'HENNA' };
const ProcessType = { POWDER: 'POWDER', PERMANENT: 'PERMANENT', SPECIAL_BLOND: 'SPECIAL_BLOND', TONING: 'TONING', DECAPITATION: 'DECAPITATION' };
const Elasticity = { NORMAL: 'NORMAL_1_3', STRETCHING: 'STRETCHING_4', TEARING: 'TEARING_5' };
const Thickness = { THIN: 'THIN', NORMAL: 'NORMAL', THICK: 'THICK' };
const Length   = { SHORT: 'SHORT', MEDIUM: 'MEDIUM', LONG: 'LONG', EXTRA: 'EXTRA' };
const Density  = { THIN: 'THIN', NORMAL: 'NORMAL', THICK: 'THICK' };
const GreyType = { NORMAL: 'NORMAL', GLASSY: 'GLASSY' };
const History  = { CLEAR: 'CLEAR', HENNA_METALS: 'HENNA_METALS' };

// --- MASS TABLES ---
const LENGTH_BASE_GRAMS = { [Length.SHORT]: 30, [Length.MEDIUM]: 60, [Length.LONG]: 90, [Length.EXTRA]: 120 };
const DENSITY_MULTIPLIER = { [Density.THIN]: 0.8, [Density.NORMAL]: 1.0, [Density.THICK]: 1.3 };

// --- INPUT MAPPER ---
class InputMapper {
    static mapCondition(raw) {
        if (raw === 'здоровые' || raw === 'Нормальні') return HairCondition.HEALTHY;
        if (raw === 'пористые' || raw === 'пористі' || raw === 'Пористі') return HairCondition.POROUS;
        if (raw === 'поврежденные' || raw === 'Пошкоджені') return HairCondition.DAMAGED;
        if (raw === 'сильно поврежденные' || raw === 'Склоподібні') return HairCondition.DAMAGED;
        return HairCondition.HEALTHY;
    }
    static mapBaseType(raw) {
        if (typeof raw !== 'string') return BaseType.NATURAL;
        let r = raw.trim().toLowerCase();
        if (r.includes('натур')) return BaseType.NATURAL;
        if (r.includes('свіж') || (r.includes('косметична') && !r.includes('накопич'))) return BaseType.COSMETIC_FRESH;
        if (r.includes('накопич') || r.includes('buildup') || r.includes('build-up')) return BaseType.COSMETIC_BUILDUP;
        if (r.includes('хна') || r.includes('метал') || r.includes('henna') || r.includes('пігмент')) return BaseType.HENNA;
        return BaseType.NATURAL;
    }
    static mapElasticity(rawNum) {
        let n = parseInt(rawNum) || 1;
        if (n <= 3) return Elasticity.NORMAL;
        if (n === 4) return Elasticity.STRETCHING;
        if (n >= 5) return Elasticity.TEARING;
        return Elasticity.NORMAL;
    }
    static mapThickness(raw) {
        if (raw === 'тонкие' || raw === 'Тонкі') return Thickness.THIN;
        if (raw === 'средние' || raw === 'нормальные' || raw === 'Середні') return Thickness.NORMAL;
        if (raw === 'толстые' || raw === 'Товсті') return Thickness.THICK;
        return Thickness.NORMAL;
    }
    static mapLength(raw) {
        if (raw === 'SHORT' || raw === 'короткие' || raw === 'Короткі') return Length.SHORT;
        if (raw === 'MEDIUM' || raw === 'средние' || raw === 'Середні') return Length.MEDIUM;
        if (raw === 'LONG' || raw === 'длинные' || raw === 'Довгі') return Length.LONG;
        if (raw === 'EXTRA' || raw === 'Дуже довгі') return Length.EXTRA;
        return Length.MEDIUM;
    }
    static mapDensity(raw) {
        if (raw === 'редкие' || raw === 'THIN' || raw === 'Рідкі')   return Density.THIN;
        if (raw === 'средние' || raw === 'NORMAL' || raw === 'Середні') return Density.NORMAL;
        if (raw === 'густые' || raw === 'THICK' || raw === 'Густі')  return Density.THICK;
        return Density.NORMAL;
    }
    static mapGreyType(raw) {
        if (raw === 'стекловидная' || raw === 'Жорстка/Склоподібна' || raw === 'Жорстка') return GreyType.GLASSY;
        return GreyType.NORMAL;
    }
    static mapHistory(raw) {
        if (raw === 'хна / металл') return History.HENNA_METALS;
        return History.CLEAR;
    }
    
    static buildSnapshot(rawData) {
        const rootLevel   = parseInt(rawData.rootLevel);
        const targetLevel = parseInt(rawData.targetLevel);
        const lengthLevel = parseInt(rawData.lengthLevel);
        
        return Object.freeze({
            history:         this.mapHistory(rawData.history),
            condition:       this.mapCondition(rawData.condition),
            thickness:       this.mapThickness(rawData.thickness),
            hairLength:      this.mapLength(rawData.length || 'MEDIUM'),
            hairDensity:     this.mapDensity(rawData.density || 'NORMAL'),
            grey:            parseInt(rawData.grey) || 0,
            greyType:        this.mapGreyType(rawData.greyType),
            elasticity:      this.mapElasticity(rawData.elasticity),
            rootLevel:       rootLevel,
            rootLength:      parseFloat(rawData.rootLength),
            lengthLevel:     lengthLevel,
            baseType:        this.mapBaseType(rawData.baseType),
            targetLevel:     targetLevel,
            targetDirection: String(rawData.targetDirection),
            rStep:           targetLevel - rootLevel,
            lStep:           targetLevel - lengthLevel,
            isMidActive:     rawData.isMidActive === true,
            midLevel:        rawData.midLevel ? parseInt(rawData.midLevel) : null,
            midBaseType:     rawData.midBaseType ? this.mapBaseType(rawData.midBaseType) : null
        });
    }
}

// --- CHEMIST AGENT ---
class ChemistAgent {
    validate(snapshot) {
        const { condition, targetLevel, rootLevel, lengthLevel, elasticity } = snapshot;
        
        if (elasticity === Elasticity.TEARING) {
            return {
                status: "BLOCKED",
                stages: [{
                    title: "🚨 ФАТАЛЬНО: РУЙНУВАННЯ СТРУКТУРИ",
                    text: "Волосся рветься. Будь-яка хімія ЗАБОРОНЕНА. Тільки лікування."
                }]
            };
        }

        if (targetLevel >= 11) {
            if (rootLevel <= 5 || lengthLevel <= 5) {
                return { status: "BLOCKED", stages: [{ title: "🚨 КОНФЛІКТ: SPECIAL BLOND", text: "Special Blond заборонено на базі нижче 6 УГТ." }] };
            }
        }

        return { status: "APPROVED" };
    }
}

// --- TECHNOLOGIST AGENT ---
class TechnologistAgent {
    generateRegulation(snapshot, state) {
        let protocolSteps = [];
        let warnings = [];
        let diagnostics = [];
        
        if (snapshot.rootLength > 2) {
            protocolSteps.push({
                stepName: "Аналіз Mid-band",
                action: `Виявлено смугу ${snapshot.rootLength} см.`,
                details: "Примусове розбиття на 3 зони.",
                reason: "Відсутність тепла шкіри на відстані > 2 см."
            });
        }

        if (snapshot.greyType === GreyType.GLASSY) {
            protocolSteps.push({
                stepName: "Мордонсаж",
                action: "Попередня обробка сивини перекисом",
                details: "3-6% оксид на суху сивину, висушити феном.",
                reason: "Розпушення кутикули скловидної сивини."
            });
        }
        
        return { protocolSteps, warnings, diagnostics, timing: state.timing };
    }
}

// --- MATH AGENT ---
class MathAgent {
    _createInitialState(snapshot) {
        return {
            status: "APPROVED",
            phases: [],
            warnings: [],
            diagnostics: [],
            timing: 0,
            target: `${snapshot.targetLevel}.${snapshot.targetDirection}`,
            reasons: {}
        };
    }

    calculateMass(snapshot) {
        const baseMass = 60; 
        const densityMult = snapshot.hairDensity === Density.THIN ? 0.8 : (snapshot.hairDensity === Density.THICK ? 1.3 : 1.0);
        let totalMass = Math.round(baseMass * densityMult);
        let rootTotal = Math.round(totalMass * 0.30);
        let lengthMass = totalMass - rootTotal;
        let midMass  = 0;
        let rootMass = rootTotal;
        if (snapshot.isMidActive) {
            midMass  = Math.round(rootTotal * 0.30);
            rootMass = rootTotal - midMass;
        }
        return { root: Math.max(rootMass, 15), mid: Math.max(midMass, 15), length: lengthMass };
    }

    calculateRoot(snapshot, massDist) {
        const { rStep, targetLevel, targetDirection, baseType } = snapshot;
        const rMass = massDist.root;
        const tDye = `${targetLevel}.${targetDirection}`;
        
        if (rStep > 3 || targetLevel >= 10 || (baseType !== BaseType.NATURAL && rStep > 0)) {
            return { process: ProcessType.POWDER, dye: "Пудра", ox: "3%", mass: Math.round(rMass * 1.5), ratio: "1:2" };
        } else if (rStep > 0) {
            const ox = rStep === 3 ? "9%" : "6%";
            return { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: ox, mass: rMass, ratio: "1:1" };
        } else {
            const ox = rStep === 0 ? "3%" : "1.9%";
            return { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: ox, mass: rMass, ratio: "1:1" };
        }
    }

    calculateLength(snapshot, massDist) {
        const { lStep, lengthLevel, targetLevel, targetDirection, baseType } = snapshot;
        const lMass = massDist.length;
        const tDye = `${targetLevel}.${targetDirection}`;
        const isCool = ['1', '11', '12', '2', '8', '16'].includes(targetDirection);

        if (lStep < 0 && lengthLevel >= 9 && lStep <= -2 && isCool) {
            return { process: "ПРЕПІГМЕНТАЦІЯ", dye: "Warm Base (.3/.4)", ox: "Water", mass: lMass, ratio: "1:2", isPrepig: true };
        } else if (lStep > 0) {
            return { process: ProcessType.POWDER, dye: "Пудра", ox: "3%", mass: lMass, ratio: "1:4" };
        } else {
            return { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "1.9%", mass: lMass, ratio: "1:2" };
        }
    }

    calculateMidBand(snapshot, rootRec) {
        if (!snapshot.isMidActive) return null;
        const mStep = snapshot.targetLevel - snapshot.midLevel;
        if (mStep <= 1 && snapshot.targetLevel < 10) {
            return { process: ProcessType.PERMANENT, dye: `Барвник ${snapshot.targetLevel}.${snapshot.targetDirection}`, ox: "3%", mass: 20, ratio: "1:1", isNeutralization: true };
        }
        return { ...rootRec, process: "Mid-band", ox: "6%", mass: 20 };
    }

    buildProtocolText(snapshot) {
        let phases = [];
        const coldShades = ['1','11','16','2','61','81','89'];
        const isColdShade = coldShades.includes(String(snapshot.targetDirection));

        if (snapshot.targetLevel < snapshot.lengthLevel && isColdShade) {
            phases.push(`<b>Препігментація (тепла підкладка)</b><br>
<b>Склад:</b> Барвник (теплого напрямку) + Натуральний + Вода (1:1:1).<br>
<b>Метод нанесення:</b> Нанести на пористі ділянки перед основним фарбуванням.<br>
<b>ВНИМАНИЕ:</b> Постійний візуальний контроль. Не змивати, надлишки стягнути рушником.`);
        }

        if (snapshot.rStep >= 1 && snapshot.rStep <= 3) {
            phases.push(`<b>Підняття кореня (Перманентне фарбування)</b><br>
<b>Склад:</b> Перманентна фарба + Окисник 6% або 9% (пропорція згідно з інструкцією виробника).<br>
<b>Метод нанесення:</b> Нанесення впритул до шкіри голови. Ширина розділів 0.5-1.5 см.<br>
<b>Час витримки:</b> Згідно з регламентом барвника (зазвичай 35-45 хв).<br>
<b>ВНИМАНИЕ:</b> Наносити ретельно, але швидко. Не заходити на раніше освітлене полотно.`);
        }

        if (snapshot.isMidActive && snapshot.midLevel === snapshot.targetLevel) {
            phases.push(`<b>Нейтралізація зони переходу (Mid-band)</b><br>
<b>Склад:</b> Фарба потрібного напрямку + Окисник 1.5% або 1.9% (1:2).<br>
<b>Метод нанесення:</b> Наносити виключно на зону смуги, не зачіпаючи корінь та пористу довжину.`);
        }

        return phases.join('<br><br>');
    }

    applyGreyLogic(recipe, snapshot) {
        if (!recipe || recipe.process !== ProcessType.PERMANENT || snapshot.grey < 15) return recipe;
        const bRatio = snapshot.grey >= 50 ? 0.5 : (snapshot.grey >= 30 ? 0.33 : 0.2);
        const bMass = Math.round(recipe.mass * bRatio);
        const fMass = recipe.mass - bMass;
        return {
            ...recipe, ox: "6%",
            dyeDetails: [{ name: `База ${snapshot.targetLevel}.0`, grams: bMass }, { name: recipe.dye, grams: fMass }]
        };
    }

    process(inputSnapshot) {
        const initState = this._createInitialState(inputSnapshot);
        const massDist = this.calculateMass(inputSnapshot);
        const localDiagnostics = [];

        const rootBase = this.calculateRoot(inputSnapshot, massDist);
        const lenBase = this.calculateLength(inputSnapshot, massDist);
        const midBase = this.calculateMidBand(inputSnapshot, rootBase);

        const finalRoot = this.applyGreyLogic(rootBase, inputSnapshot);
        const finalLen = this.applyGreyLogic(lenBase, inputSnapshot);
        const finalMid = this.applyGreyLogic(midBase, inputSnapshot);

        const protocolText = this.buildProtocolText(inputSnapshot);
        const protocolPhases = [];
        if (protocolText) {
            protocolText.split('<br><br>').forEach((line, index) => {
                let pName = line.includes(':') ? line.split(':')[0] : `Етап ${index + 1}`;
                let action = line.includes(':') ? line.substring(line.indexOf(':') + 1).trim() : line;
                protocolPhases.push({
                    phaseName: pName,
                    steps: [{ stepName: '', action: action, details: "", reason: "" }]
                });
            });
        }

        return Object.freeze({
            ...initState,
            diagnostics: localDiagnostics,
            phases: protocolPhases,
            timing: 0,
            rootRec: finalRoot,
            midRec: finalMid,
            lenRec: finalLen,
            protocolText
        });
    }
}

// --- MASTER NODE ---
class MasterNode {
    constructor() {
        this.agents = { chemist: new ChemistAgent(), math: new MathAgent(), technologist: new TechnologistAgent() };
    }
    process(rawInput) {
        const snapshot = InputMapper.buildSnapshot(rawInput);
        const chem = this.agents.chemist.validate(snapshot);
        if (chem.status === "BLOCKED") return { ...chem, phases: [], timing: 0 };
        
        let state = this.agents.math.process(snapshot);
        const tech = this.agents.technologist.generateRegulation(snapshot, state);
        
        if (tech.protocolSteps.length > 0) {
            state.phases.unshift({ phaseName: "Підготовка", steps: tech.protocolSteps });
        }
        
        return Object.freeze({ ...state, warnings: tech.warnings, diagnostics: [...state.diagnostics, ...tech.diagnostics] });
    }
}

function gatherFormData() {
    const midBandBlock = document.getElementById('midBandBlock');
    const isMidActive = midBandBlock && midBandBlock.style.display === 'block';
    const getV = (id) => {
        const radio = document.querySelector(`input[name="${id}"]:checked`);
        if (radio) return radio.value;
        const el = document.getElementById(id);
        return el ? el.value : null;
    };
    return {
        history: getV('history'), condition: getV('condition'), thickness: getV('thickness'),
        density: getV('density'), length: getV('length'), grey: getV('grey'), greyType: getV('greyType'),
        rootLevel: getV('rootLevel'), rootLength: getV('rootLength'), lengthLevel: getV('lengthLevel'),
        baseType: getV('baseType'), targetLevel: getV('targetLevel'), targetDirection: getV('targetDirection'),
        elasticity: "1", midLevel: isMidActive ? getV('midLevel') : null, midBaseType: isMidActive ? getV('midBaseType') : null, isMidActive: isMidActive
    };
}

function calculateProtocol() {
    try {
        const rawInput = gatherFormData();
        const master = new MasterNode();
        const state = master.process(rawInput);
        if (typeof render === 'function') render(state, rawInput);
        const container = document.getElementById('resultContainer');
        if (container) container.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        console.error(e);
        alert("Помилка: " + e.message);
    }
}