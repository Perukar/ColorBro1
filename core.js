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
        return HairCondition.HEALTHY; // Fallback
    }
    static mapBaseType(raw) {
        if (raw === 'Натуральна') return BaseType.NATURAL;
        if (raw === 'Косметична') return BaseType.COSMETIC_FRESH;
        if (raw === 'Накопичена косметика' || raw === 'COSMETIC_BUILDUP' || raw === 'Косметична (накопичена)') return BaseType.COSMETIC_BUILDUP;
        if (raw === 'хна / металл' || raw === 'HENNA' || raw === 'Прямий пігмент / Хна') return BaseType.HENNA;
        return BaseType.NATURAL; // Fallback
    }
    static mapElasticity(rawNum) {
        let n = parseInt(rawNum) || 1;
        if (n <= 3) return Elasticity.NORMAL;
        if (n === 4) return Elasticity.STRETCHING;
        if (n >= 5) return Elasticity.TEARING;
        throw new Error(`Unknown elasticity: ${rawNum}`);
    }
    static mapThickness(raw) {
        if (raw === 'тонкие' || raw === 'Тонкі') return Thickness.THIN;
        if (raw === 'средние' || raw === 'нормальные' || raw === 'Середні') return Thickness.NORMAL;
        if (raw === 'толстые' || raw === 'Товсті') return Thickness.THICK;
        return Thickness.NORMAL; // Fallback
    }
    static mapLength(raw) {
        if (raw === 'SHORT' || raw === 'короткие' || raw === 'Короткі') return Length.SHORT;
        if (raw === 'MEDIUM' || raw === 'средние' || raw === 'Середні') return Length.MEDIUM;
        if (raw === 'LONG' || raw === 'длинные' || raw === 'Довгі') return Length.LONG;
        if (raw === 'EXTRA' || raw === 'Дуже довгі') return Length.EXTRA;
        return Length.MEDIUM; // Fallback
    }
    static mapDensity(raw) {
        if (raw === 'редкие' || raw === 'THIN' || raw === 'Рідкі')   return Density.THIN;
        if (raw === 'средние' || raw === 'NORMAL' || raw === 'Середні') return Density.NORMAL;
        if (raw === 'густые' || raw === 'THICK' || raw === 'Густі')  return Density.THICK;
        return Density.NORMAL; // Fallback
    }
    static mapGreyType(raw) {
        if (raw === 'стекловидная' || raw === 'Жорстка/Склоподібна' || raw === 'Жорстка') return GreyType.GLASSY;
        if (raw === "М'яка") return GreyType.NORMAL;
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
            density:         rawData.density,
            length:          rawData.length,
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
            lStep:           targetLevel - lengthLevel
        });
    }
}

// --- CHEMIST AGENT ---
class ChemistAgent {
    validate(snapshot) {
        const { history, condition, baseType, targetLevel, rootLevel, lengthLevel, targetDirection, rStep, lStep, grey, elasticity } = snapshot;
        
        if (elasticity === Elasticity.TEARING) {
            return {
                status: "BLOCKED",
                stages: [{
                    title: "🚨 ФАТАЛЬНО: ПОВНЕ РУЙНУВАННЯ СТРУКТУРИ (Ступінь 5)",
                    text: "Еластичність 5-го ступеня: волосся рветься при мінімальному натягуванні. " +
                          "Будь-яке хімічне нанесення (фарба, пудра, оксид) КАТЕГОРИЧНО ЗАБОРОНЕНО. " +
                          "Необхідно виключно відновлювальне лікування: гліцеринові маски, протеїнові ін'єкції, " +
                          "холодні ламінуючі процедури. Повернутись до фарбування не раніше ніж через 4-6 тижнів."
                }]
            };
        }

        // Змивка (декапірування) косметичної бази тепер дозволена і обробляється MathAgent

        if (targetLevel >= 11) {
            if (rootLevel <= 5 || lengthLevel <= 5) {
                return { status: "BLOCKED", stages: [{ title: "🚨 ХІМІЧНИЙ КОНФЛІКТ: SPECIAL BLOND", text: "Special Blond заборонено використовувати на базі нижче 6-го рівня." }] };
            }
            if (condition === HairCondition.POROUS || condition === HairCondition.DAMAGED) {
                return { status: "BLOCKED", stages: [{ title: "🚨 ХІМІЧНИЙ КОНФЛІКТ: ПОШКОДЖЕННЯ", text: "Special Blond (12% оксид) заборонено на пошкодженому або освітленому волоссі." }] };
            }
        }

        if (targetDirection.includes('6') && grey > 0) {
            return { status: "BLOCKED", stages: [{ title: "🚨 ХІМІЧНИЙ КОНФЛІКТ: INOA RED / СИВИНА", text: "Червоні відтінки даного типу не змішуються з натуральною базою для сивини." }] };
        }

        if ((baseType === BaseType.HENNA || history === History.HENNA_METALS) && (condition === HairCondition.POROUS || condition === HairCondition.DAMAGED)) {
            return { status: "BLOCKED", stages: [{ title: "🚨 ФАТАЛЬНО: ХНА ТА МЕТАЛИ", text: "Хна або металовмісні фарби на пошкодженому волоссі вступають у непередбачувану реакцію з оксидантами. Ризик 'закипання' волосся. Блокування." }] };
        }

        return { status: "APPROVED" };
    }
}

// --- TECHNOLOGIST AGENT ---
class TechnologistAgent {
    generateRegulation(snapshot, state) {
        const { rootLength, elasticity, grey, greyType, thickness } = snapshot;
        
        let protocolSteps = [];
        let underTheHood = [];
        let warnings = [];
        let diagnostics = [];
        
        const isMidBand = rootLength > 2;
        if (isMidBand) {
            protocolSteps.push({
                stepName: "Аналіз Mid-band",
                action: `Виявлено смугу відростання ${rootLength} см.`,
                details: "Примусове розбиття на 3 зони.",
                reason: "Ризик смуги просідання пігменту через відсутність тепла шкіри на такій довжині."
            });
            underTheHood.push("Mid-band logic: примусова етапність.");
        }

        if (elasticity === Elasticity.STRETCHING) {
            protocolSteps.push({
                stepName: "Холодне відновлення",
                action: "Нанести ліпіди + амінокислоти",
                details: "ПЕРЕД фарбуванням, без тепла.",
                reason: "Еластичність 4: волосся на межі розпаду (Протокол «Остання Надія»)."
            });
            warnings.push("КРИТИЧНО: Волосся на межі розпаду. Використання тепла заборонено.");
            underTheHood.push("Elasticity alert: injection of 'Last Hope' protocol.");
        }

        let timing = state.timing; 

        if (grey >= 15) {
            let dLevel = snapshot.targetLevel > 1 ? snapshot.targetLevel - 1 : 1;
            if (grey >= 15 && grey < 40) diagnostics.push(`Сивина ${grey}%. Пропорція 2:1 (Модний:База). Впроваджено базу ${dLevel}.00.`);
            else if (grey >= 40 && grey < 60) diagnostics.push(`Сивина ${grey}%. Пропорція 1:1 (Модний:База). Впроваджено базу ${dLevel}.00.`);
            else diagnostics.push(`Сивина ${grey}%. Пропорція 1:2 (Модний:База). Впроваджено базу ${dLevel}.00.`);
        }
        if (greyType === GreyType.GLASSY) {
            diagnostics.push("Скловидна сивина. Потрібен мордонсаж.");
            protocolSteps.push({
                stepName: "Мордонсаж",
                action: "Попередня обробка сивини перекисом",
                details: "Використати 3-6% оксид у чистому вигляді, нанести на сивину, висушити",
                reason: "Скловидна сивина має закриту кутикулу, перекис її розпушує."
            });
        }
        
        return { protocolSteps, underTheHood, warnings, diagnostics, timing };
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
            rootRec: null,
            lenRec: null,
            midRec: null,
            timing: 0,
            target: `${snapshot.targetLevel}.${snapshot.targetDirection}`,
            totalMass: 0,
            underTheHood: [],
            reasons: {}
        };
    }

    calculateMass(snapshot) {
        const ROOT_MIN_GRAMS = 15; 
        const baseMass = 60; 
        const densityMult = snapshot.hairDensity === Density.THIN ? 0.8 : (snapshot.hairDensity === Density.THICK ? 1.3 : 1.0);
        let totalMass = Math.round(baseMass * densityMult);
        const isMidBand = snapshot.rootLength > 2 && snapshot.rStep > 0;
        let rootTotal = Math.round(totalMass * 0.30);
        let lengthMass = totalMass - rootTotal;
        let midMass  = 0;
        let rootMass = rootTotal;
        if (isMidBand) {
            midMass  = Math.round(rootTotal * 0.30);
            rootMass = rootTotal - midMass;
        }
        let floorApplied = false;
        if (rootMass < ROOT_MIN_GRAMS) { rootMass = ROOT_MIN_GRAMS; floorApplied = true; }
        if (isMidBand && midMass < ROOT_MIN_GRAMS) { midMass = ROOT_MIN_GRAMS; floorApplied = true; }
        return { total: rootMass + midMass + lengthMass, root: rootMass, mid: midMass, length: lengthMass, floorApplied };
    }

    calculateRoot(snapshot, massDist) {
        const { rStep, rootLevel, grey, targetLevel, targetDirection } = snapshot;
        const rMass = massDist.root;
        const tDye = `${targetLevel}.${targetDirection}`;
        let rootRec = null;

        if (rStep > 0) {
            if ([BaseType.COSMETIC_FRESH, BaseType.COSMETIC_BUILDUP].includes(snapshot.baseType)) {
                let oxChoice = "1.9%"; let ratioChoice = "1:4";
                if (rStep >= 3) { oxChoice = "6%"; ratioChoice = "1:2"; }
                else if (rStep === 2) { oxChoice = "3%"; ratioChoice = "1:3"; }
                rootRec = { process: ProcessType.DECAPITATION, dye: "Пудра", ox: oxChoice, mass: rMass, ratio: ratioChoice };
            }
            else if (rootLevel <= 5) rootRec = { process: ProcessType.POWDER, dye: "Пудра", ox: "4%", mass: rMass, ratio: "1:2" };
            else if (grey >= 50) rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: rStep >= 3 ? "9%" : "6%", mass: rMass, ratio: "1:1" };
            else if (rStep >= 4) rootRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "12%", mass: rMass, ratio: "1:2" };
            else if (rStep >= 2) rootRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "9%", mass: rMass, ratio: "1:2" };
            else rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "6%", mass: rMass, ratio: "1:1" };
        } else if (rStep === 0) {
            if (targetLevel >= 9) rootRec = { process: ProcessType.TONING, dye: `Барвник ${tDye}`, ox: "1.9%", mass: rMass, ratio: "1:2" };
            else rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "3%", mass: rMass, ratio: "1:1" };
        } else {
            rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "3%", mass: rMass, ratio: "1:1" };
        }
        if (rootRec && rootRec.process === ProcessType.POWDER) rootRec.mass = Math.max(Math.round(rMass * 1.6), 40);

        let rOxideValue = rootRec ? parseFloat(String(rootRec.ox).replace(',', '.')) : 0;
        let status = "APPROVED"; let stages = []; let warnings = [];
        if (rootRec && rootRec.process === ProcessType.POWDER && rOxideValue > 6) {
            status = "BLOCKED";
            stages.push({ title: "ФАТАЛЬНО: Ризик хімічного опіку", text: "Використання оксиду вище 6% на шкірі голови з порошком категорично заборонено." });
        }
        return { recipe: rootRec, status, stages, warnings };
    }

    calculateLength(snapshot, massDist) {
        const { lStep, lengthLevel, baseType, targetLevel, targetDirection, grey, condition } = snapshot;
        const lMass = massDist.length;
        const tDye = `${targetLevel}.${targetDirection}`;
        let lenRec = null;

        if (lStep > 0) {
            if ([BaseType.COSMETIC_FRESH, BaseType.COSMETIC_BUILDUP].includes(baseType)) {
                let oxChoice = "1.9%"; let ratioChoice = "1:4";
                if (lStep >= 3) { oxChoice = "6%"; ratioChoice = "1:2"; }
                else if (lStep === 2) { oxChoice = "3%"; ratioChoice = "1:3"; }
                lenRec = { process: ProcessType.DECAPITATION, dye: "Пудра", ox: oxChoice, mass: lMass, ratio: ratioChoice };
            }
            else if (lengthLevel <= 5) lenRec = { process: ProcessType.POWDER, dye: "Пудра", ox: "4%", mass: lMass, ratio: "1:2" };
            else if (grey >= 50) lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: lStep >= 3 ? "9%" : "6%", mass: lMass, ratio: "1:1" };
            else if (lStep >= 4) lenRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "12%", mass: lMass, ratio: "1:2" };
            else if (lStep >= 2) lenRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "9%", mass: lMass, ratio: "1:2" };
            else lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "6%", mass: lMass, ratio: "1:1" };
        } else if (lStep === 0) {
            if (targetLevel >= 9) lenRec = { process: ProcessType.TONING, dye: `Барвник ${tDye}`, ox: "1.9%", mass: lMass, ratio: "1:2" };
            else lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "3%", mass: lMass, ratio: "1:1" };
        } else {
            lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "1.9%", mass: lMass, ratio: "1:2" }; 
        }

        let diagnostics = [];
        if (lenRec && [HairCondition.POROUS, HairCondition.DAMAGED].includes(condition)) {
            let isPowd = lenRec.process === ProcessType.POWDER || lenRec.process === ProcessType.DECAPITATION;
            if (lengthLevel >= 9 && (isPowd || (snapshot.rStep > 0 && snapshot.rootLevel <= 5))) {
                lenRec = { ...lenRec, process: "Емульгація", dye: "Відпрацьована суміш", ox: "-", ratio: "-", mass: 0 };
                diagnostics.push("ПРАВИЛО 2: Пориста довжина 9-10 УГТ — свіжа пудра або агресивна фарба заборонена. Призначено емульгацію.");
            } else if (isPowd) {
                lenRec = { ...lenRec, ox: "1.5%", ratio: "1:4" };
                diagnostics.push("Пошкоджені кінці: примусове зниження оксиду порошку до 1.5% і пропорції 1:4.");
            }
        }
        return { recipe: lenRec, diagnostics };
    }

    applyGreyLogic(recipe, snapshot) {
        if (!recipe) return null;
        let isPowder = recipe.process === ProcessType.POWDER || recipe.process === ProcessType.DECAPITATION;
        
        // ПРАВИЛО 4: Игнорирование седины при пудре
        if (isPowder && snapshot.grey > 0) {
            recipe._greyIgnored = true;
            return { ...recipe };
        }

        if (snapshot.grey >= 15 && recipe.process === ProcessType.PERMANENT) {
            let dLevel = snapshot.targetLevel > 1 ? snapshot.targetLevel - 1 : 1;
            let baseRatio = (snapshot.grey >= 40 && snapshot.grey < 60) ? 0.5 : (snapshot.grey < 40 ? 1/3 : 2/3);
            let bMass = Math.round(recipe.mass * baseRatio);
            return {
                ...recipe,
                dyeDetails: [
                    { name: `База ${dLevel}.00`, grams: bMass },
                    { name: `Модний ${snapshot.targetLevel}.${snapshot.targetDirection}`, grams: recipe.mass - bMass }
                ],
                ox: snapshot.targetLevel >= 8 ? "9%" : "6%"
            };
        }
        return { ...recipe };
    }

    calculateMixtone(recipe, snapshot, zone) {
        if (!recipe) return null;
        const cond = zone === 'root' ? HairCondition.HEALTHY : snapshot.condition;
        let pType = String(recipe.process);
        if (pType === ProcessType.POWDER || pType === ProcessType.DECAPITATION || pType === "Емульгація") return "Не додається (Нейтралізація на етапі тонування)";
        
        let rule11 = 11 - snapshot.targetLevel;
        if (rule11 <= 0) return `Не потрібен (Рівень ${snapshot.targetLevel})`;
        
        let grams = Math.round(((rule11 / 2.0) * (recipe.mass / 30.0)) * 10) / 10;
        const MAX_MIXTONE = 4.0 * (recipe.mass / 60.0); 
        if (grams > MAX_MIXTONE) grams = Math.round(MAX_MIXTONE * 10) / 10;
        if ([HairCondition.POROUS, HairCondition.DAMAGED].includes(cond) && ['1','11','16','2','61','81','89'].includes(snapshot.targetDirection)) {
            grams = Math.round((grams * 0.5) * 10) / 10;
        }
        return `${grams} гр`;
    }

    calculateMidBand(snapshot, rootRec) {
        if (!rootRec || snapshot.rootLength <= 2 || snapshot.rStep <= 0) return null;
        const OX_STEP_UP = { "1.9%": "3%", "3%": "6%", "6%": "9%", "9%": "12%", "12%": "12%" };
        return Object.freeze({ ...rootRec, process: "Mid-band (Холодна зона)", ox: OX_STEP_UP[rootRec.ox] || rootRec.ox });
    }

    process(inputSnapshot) {
        const initState = this._createInitialState(inputSnapshot);
        const massDist = this.calculateMass(inputSnapshot);
        const localWarnings = [...initState.warnings];
        const localDiagnostics = [...initState.diagnostics];

        if (massDist.floorApplied) localDiagnostics.push(`⚠️ FLOOR: Маса кореня скоригована до 15г.`);
        if (inputSnapshot.condition === HairCondition.DAMAGED) localWarnings.push("КРИТИЧНИЙ СТАН: Блондування порошком ЗАБОРОНЕНО. Тільки пастельне тонування.");
        if (inputSnapshot.thickness === Thickness.THIN) localDiagnostics.push("Тонке волосся. Час витримки скорочено.");
        if (inputSnapshot.thickness === Thickness.THICK) localDiagnostics.push("Товсте волосся. Час витримки збільшено.");
        if (inputSnapshot.condition === HairCondition.POROUS) localDiagnostics.push("Пористе волосся. Тонування під жорстким візуальним контролем.");

        const isMidBand = inputSnapshot.rootLength > 2;
        const hotRoot = (inputSnapshot.rootLength >= 2 && inputSnapshot.rStep > 0);

        if (inputSnapshot.lStep > 0 && inputSnapshot.condition === HairCondition.DAMAGED) {
            return Object.freeze({ ...initState, status: "BLOCKED", stages: [{ title: "БЛОКУВАННЯ", text: "ФАТАЛЬНО: Довжина 'сильно пошкоджена'. Будь-яке освітлення або декапірування пудрою категорично заборонено." }] });
        }
        if (inputSnapshot.rStep > 0 && inputSnapshot.condition === HairCondition.DAMAGED) {
            return Object.freeze({ ...initState, status: "BLOCKED", stages: [{ title: "БЛОКУВАННЯ", text: "ФАТАЛЬНО: Корінь 'сильно пошкоджений'. Будь-яке освітлення пудрою заборонено." }] });
        }

        const rootResult = this.calculateRoot(inputSnapshot, massDist);
        if (rootResult.status === "BLOCKED") return Object.freeze({ ...initState, status: "BLOCKED", stages: rootResult.stages });

        const lengthResult = this.calculateLength(inputSnapshot, massDist);
        const midResult = isMidBand ? this.calculateMidBand(inputSnapshot, rootResult.recipe) : null;

        const finalRoot = this.applyGreyLogic(rootResult.recipe, inputSnapshot);
        if (finalRoot) finalRoot.mixtone = this.calculateMixtone(finalRoot, inputSnapshot, 'root');
        
        const finalLength = this.applyGreyLogic(lengthResult.recipe, inputSnapshot);
        if (finalLength) finalLength.mixtone = this.calculateMixtone(finalLength, inputSnapshot, 'length');
        
        const finalMid = midResult ? this.applyGreyLogic(midResult, inputSnapshot) : null;
        if (finalMid) finalMid.mixtone = this.calculateMixtone(finalMid, inputSnapshot, 'root');

        if (finalRoot && finalRoot._greyIgnored) {
            localDiagnostics.push("ПРАВИЛО 4: Сивина ігнорується при роботі з пудрою (меланін знищується повністю).");
        }

        let phases = [];
        let timing = 0;
        let tMod = (inputSnapshot.thickness === Thickness.THIN) ? -10 : (inputSnapshot.thickness === Thickness.THICK ? 10 : 0);
        
        let isLPowder = finalLength && (finalLength.process === ProcessType.POWDER || finalLength.process === ProcessType.DECAPITATION || finalLength.process === "Емульгація");
        let isRPowder = finalRoot && (finalRoot.process === ProcessType.POWDER || finalRoot.process === ProcessType.DECAPITATION);
        const isDecapRoot = finalRoot && finalRoot.process === ProcessType.DECAPITATION;
        const isDecapLength = finalLength && finalLength.process === ProcessType.DECAPITATION;
        const isPowderBase = isLPowder || isRPowder || isDecapRoot || isDecapLength;

        let modifiedLength = finalLength ? { ...finalLength } : null;

        // ВПРОВАДЖЕННЯ ТЕХНОЛОГІЧНИХ КАРТ (ФАЗИ ТА КРОКИ)
        if (isMidBand && isPowderBase) {
            let phase1 = { phaseName: "Фаза 1: Освітлення (MID-BAND ПРОТОКОЛ)", steps: [] };
            
            if (inputSnapshot.condition === HairCondition.POROUS || inputSnapshot.condition === HairCondition.DAMAGED) {
                phase1.steps.push({
                    stepName: "Крок 1: Ізоляція",
                    action: "Нанести засіб для ізоляції пористої довжини",
                    details: "Нанести захисний ліпідний або протеїновий спрей на найслабші зони",
                    reason: "Захист пошкоджених зон від стікання та агресивного впливу персульфатів."
                });
            }
            
            // ПРАВИЛО 1: Оксиды для MID-BAND
            let coldOx = "3%";
            if (finalMid && (finalMid.ox === "1.5%" || finalMid.ox === "1.9%")) coldOx = finalMid.ox;
            else coldOx = "1.9%"; // override if 6% or 9% was passed
            
            let coldMass = finalMid ? finalMid.mass : massDist.mid;
            phase1.steps.push({
                stepName: "Крок 2: Холодна зона (фольга/термопапір)",
                action: `Нанести пудру. Оксид: ${coldOx}. Маса: ${coldMass} г. Пропорція 1:3`,
                details: "Відступ від шкіри 1-1.5 см, наносити тільки на відрослу косметику або натуральну смугу (напівзакритий режим).",
                reason: "Низький відсоток + ізоляція зберігають структуру товстого/густого волосся, даючи чистий фон без пересвіту."
            });
            
            let hotOx = "1.5%";
            let hotMass = massDist.root;
            phase1.steps.push({
                stepName: "Крок 3: Гарячий корінь",
                action: `Через 15-20 хв нанести суміш на корінь. Оксид: ${hotOx}. Маса: ${hotMass} г. Пропорція 1:2`,
                details: "Нанесення впритул до шкіри голови.",
                reason: "Шкіра виділяє тепло, пришвидшуючи реакцію. Застосовано мінімальний оксид для безпеки."
            });

            if (finalLength && finalLength.process === "Емульгація") {
                phase1.steps.push({
                    stepName: "Крок 4: Емульгація довжини",
                    action: "Зволоження довжини водою та емульгація відпрацьованої суміші з коренів",
                    details: "Емульгувати протягом 3-10 хвилин у мийці перед змиванням. Змити ШГО + Маска.",
                    reason: "ПРАВИЛО 2: Для пористої довжини на 9-10 УГТ свіжа пудра заборонена. М'яке очищення фону."
                });
            } else {
                phase1.steps.push({
                    stepName: "Крок 4: Освітлення / Емульгація довжини",
                    action: "Нанести суміш на довжину або земульгувати",
                    details: "Змити ШГО + Маска після досягнення ФО.",
                    reason: "Залежить від стану довжини."
                });
            }
            phases.push(phase1);
            timing = 90 + tMod;

            let phase2 = { phaseName: "Фаза 2: Тонування", steps: [] };
            
            // ПРАВИЛО 3: Колірна лазня
            let isCoolBlonde = inputSnapshot.targetLevel >= 10 && ['1', '11'].includes(inputSnapshot.targetDirection);
            if (isCoolBlonde && inputSnapshot.condition === HairCondition.POROUS) {
                phase2.steps.push({
                    stepName: "Колірна лазня (Color Bath)",
                    action: `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection} + Оксид 1.5% або 1.9% + Шампунь (1:1:1)`,
                    details: "Нанести на вологе волосся. Візуальний контроль.",
                    reason: "ПРАВИЛО 3: Запобігання провалу пігменту на пористих ділянках завдяки розбавленню щільності шампунем."
                });
                localDiagnostics.push("ПРАВИЛО 3: Активовано протокол 'Колірна лазня' для пористого холодного блонда.");
            } else {
                phase2.steps.push({
                    stepName: "Тонування фону",
                    action: `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection} + Оксид 1.9% (1:2)`,
                    details: "Нанести на вологе волосся.",
                    reason: "Нейтралізація ФО та надання цільового кольору."
                });
            }
            phases.push(phase2);

            if (modifiedLength) {
                modifiedLength.ox = "1.9%";
                modifiedLength.process = ProcessType.TONING;
                modifiedLength.dye = `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection}`;
                modifiedLength.ratio = "1:2";
            }
        }
        else if (isDecapRoot || isDecapLength || isLPowder || isRPowder) {
            let phase1 = { phaseName: "Фаза 1: Змивка (Декапірування / Освітлення)", steps: [] };
            if (finalLength && finalLength.process === "Емульгація") {
                phase1.steps.push({ stepName: "Довжина", action: "Емульгація", details: "Зволоження довжини водою та емульгація відпрацьованої суміші з коренів (3-10 хв)", reason: "ПРАВИЛО 2: Пориста довжина 9-10 УГТ" });
            } else if (isLPowder || isDecapLength) {
                phase1.steps.push({ stepName: "Довжина", action: `Пудра + ${finalLength.ox} (Пропорція ${finalLength.ratio})`, details: `Маса пудри: ${massDist.length} гр`, reason: "Освітлення / Видалення косметичного пігменту" });
            }
            
            if ((isRPowder || isDecapRoot) && !hotRoot) {
                phase1.steps.push({ stepName: "Корінь", action: `Пудра + ${finalRoot.ox} (Пропорція ${finalRoot.ratio})`, details: `Маса пудри: ${massDist.root} гр`, reason: "Змивка відрослої зони" });
            } else if ((isRPowder || isDecapRoot) && hotRoot) {
                phase1.steps.push({ stepName: "Гарячий корінь", action: `Через 15 хв пудра + ${finalRoot.ox}`, details: `Маса пудри: ${massDist.root} гр`, reason: "Захист від переосвітлення шкірою" });
            }
            phase1.steps.push({ stepName: "Візуальний контроль", action: "Змити ШГО + маска", details: "Змиття після досягнення ФО", reason: "Зупинка лужної реакції персульфатів" });
            phases.push(phase1);

            let phase2 = { phaseName: "Фаза 2: Тонування", steps: [] };
            let isCoolBlonde = inputSnapshot.targetLevel >= 10 && ['1', '11'].includes(inputSnapshot.targetDirection);
            if (isCoolBlonde && inputSnapshot.condition === HairCondition.POROUS) {
                phase2.steps.push({
                    stepName: "Колірна лазня",
                    action: `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection} + Оксид 1.5/1.9% + Шампунь (1:1:1)`,
                    details: "На вологе волосся",
                    reason: "Запобігання провалу пігменту на пористих ділянках завдяки розбавленню щільності шампунем"
                });
            } else {
                let toningRecipe = `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection} + Оксид 1.9%`;
                phase2.steps.push({ stepName: "Тонування", action: toningRecipe, details: "Пропорція 1:2 на вологе", reason: "Нейтралізація ФО" });
            }
            phases.push(phase2);

            timing = 90 + tMod;
            if (modifiedLength) {
                modifiedLength.process = ProcessType.TONING; modifiedLength.dye = `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection}`; modifiedLength.ox = "1.9%"; modifiedLength.ratio = "1:2";
            }
        }
        else {
            let p1 = { phaseName: "Фаза 1: Основне фарбування", steps: [] };
            p1.steps.push({ stepName: "Корінь", action: `Нанести рецепт на корінь`, details: "Рівномірне нанесення", reason: "Фарбування відростання" });
            p1.steps.push({ stepName: "Довжина", action: "Нанести суміш на довжину", details: "Полотно волосся", reason: "Забарвлення довжини" });
            phases.push(p1);
            timing = 40 + tMod;
        }

        let reasons = {};
        if (finalLength) {
            reasons.ox = `Оксид ${finalLength.ox} обрано з урахуванням вихідної бази, цільового рівня та стану волосся.`;
            reasons.mass = `Маса ${massDist.length}г розрахована: базова маса * густота * довжина.`;
            if (modifiedLength && modifiedLength.process === ProcessType.TONING) reasons.mixtone = "Мікстон розраховано за Правилом 11.";
        }
        if (finalRoot) reasons.rootOx = `Оксид ${finalRoot.ox} обрано з огляду на сивину та кроки освітлення.`;

        return Object.freeze({
            ...initState,
            warnings: [...localWarnings],
            diagnostics: [...localDiagnostics],
            rootRec: finalRoot ? Object.freeze(finalRoot) : null,
            midRec: finalMid ? Object.freeze(finalMid) : null,
            lenRec: modifiedLength ? Object.freeze(modifiedLength) : null,
            phases: phases,
            timing: timing,
            reasons: reasons
        });
    }
}

// --- MASTER NODE ---
class MasterNode {
    constructor() {
        this.agents = { chemist: new ChemistAgent(), math: new MathAgent(), technologist: new TechnologistAgent() };
    }

    process(rawInput) {
        try {
            const snapshot = InputMapper.buildSnapshot(rawInput);
            const chemCheck = this.agents.chemist.validate(snapshot);
            if (chemCheck.status === "BLOCKED") return this.terminateWithRedStatus(chemCheck);

            let state = this.agents.math.process(snapshot);
            if (state.status === "FATAL_ERROR" || state.status === "BLOCKED") return this.terminateWithRedStatus(state);
            
            const techData = this.agents.technologist.generateRegulation(snapshot, state);
            
            let techPhase = null;
            if (techData.protocolSteps && techData.protocolSteps.length > 0) {
                techPhase = { phaseName: "Попередня підготовка (Технолог)", steps: techData.protocolSteps };
            }
            let newPhases = techPhase ? [techPhase, ...state.phases] : [...state.phases];

            return Object.freeze({
                ...state,
                phases: newPhases,
                underTheHood: [...state.underTheHood, ...techData.underTheHood],
                warnings: [...state.warnings, ...techData.warnings],
                diagnostics: [...state.diagnostics, ...techData.diagnostics],
                timing: techData.timing
            });

        } catch (e) {
            console.error("Caught exception:", e);
            return this.terminateWithRedStatus({ status: "FATAL_ERROR", stages: [{ title: "КРИТИЧНА ПОМИЛКА", text: e.message }] });
        }
    }

    terminateWithRedStatus(errorState) {
        return Object.freeze({ ...errorState, status: errorState.status || "FATAL_ERROR", phases: [], timing: 0 });
    }
}

// Якщо використовується в браузері для зв'язку з UI
function calculateProtocol() {
    try {
        const form = document.getElementById('F');
        if (!form) throw new Error("Form #F not found");
        
        const fd = new FormData(form);
        const d = {};
        for(let [k,v] of fd.entries()) d[k] = v;

        let rawInput = {
            brand: d.brand,
            baseType: d.baseType,
            lengthBaseType: d.lengthBaseType,
            rootLevel: d.rLevel,
            lengthLevel: d.lLevel,
            rootLength: d.rootLen || "1",
            hairLength: d.hairLength || 'MEDIUM',
            hairDensity: d.hairDensity || 'NORMAL',
            elasticity: d.elasticity || "1",
            condition: d.porosity || 'Норма',
            targetLevel: d.tLevel,
            targetDirection: d.tDir,
            grey: d.grey || "0",
            history: d.baseType === 'хна / металл' ? 'хна / металл' : 'чистые',
            thickness: 'средние',
            density: d.hairDensity === 'THICK' ? 'густые' : (d.hairDensity === 'THIN' ? 'редкие' : 'средние'),
            length: d.hairLength === 'SHORT' ? 'короткие' : (d.hairLength === 'LONG' ? 'длинные' : 'средние'),
            greyType: 'обычная'
        };

        const master = new MasterNode();
        let state = master.process(rawInput);
        
        if (typeof render === 'function') {
            render(state, rawInput);
        } else if (typeof renderState === 'function') {
            renderState(state);
        } else {
            console.log("Result State:", state);
        }
    } catch(e) {
        console.error("Calculation Error:", e);
        alert("Помилка розрахунку: " + e.message);
    }
}

// Для тестування у Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MasterNode, InputMapper, HairCondition, BaseType, Elasticity };
}