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
        if (raw === 'здоровые') return HairCondition.HEALTHY;
        if (raw === 'пористі') return HairCondition.POROUS;
        if (raw === 'сильно поврежденные') return HairCondition.DAMAGED;
        throw new Error(`Unknown condition: ${raw}`);
    }
    static mapBaseType(raw) {
        if (raw === 'Натуральна') return BaseType.NATURAL;
        if (raw === 'Косметична') return BaseType.COSMETIC_FRESH;
        if (raw === 'Накопичена косметика' || raw === 'COSMETIC_BUILDUP') return BaseType.COSMETIC_BUILDUP;
        if (raw === 'хна / металл' || raw === 'HENNA') return BaseType.HENNA;
        throw new Error(`Unknown base type: ${raw}`);
    }
    static mapElasticity(rawNum) {
        let n = parseInt(rawNum) || 1;
        if (n <= 3) return Elasticity.NORMAL;
        if (n === 4) return Elasticity.STRETCHING;
        if (n >= 5) return Elasticity.TEARING;
        throw new Error(`Unknown elasticity: ${rawNum}`);
    }
    static mapThickness(raw) {
        if (raw === 'тонкие') return Thickness.THIN;
        if (raw === 'нормальные') return Thickness.NORMAL;
        if (raw === 'толстые') return Thickness.THICK;
        throw new Error(`Unknown thickness: ${raw}`);
    }
    static mapLength(raw) {
        if (raw === 'SHORT')  return Length.SHORT;
        if (raw === 'MEDIUM') return Length.MEDIUM;
        if (raw === 'LONG')   return Length.LONG;
        if (raw === 'EXTRA')  return Length.EXTRA;
        throw new Error(`Unknown length: ${raw}`);
    }
    static mapDensity(raw) {
        if (raw === 'THIN')   return Density.THIN;
        if (raw === 'NORMAL') return Density.NORMAL;
        if (raw === 'THICK')  return Density.THICK;
        throw new Error(`Unknown density: ${raw}`);
    }
    static mapGreyType(raw) {
        if (raw === 'стекловидная') return GreyType.GLASSY;
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
            hairLength:      this.mapLength(rawData.hairLength || 'MEDIUM'),
            hairDensity:     this.mapDensity(rawData.hairDensity || 'NORMAL'),
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

        // Косметична база + підйом рівня → не блокуємо, а передаємо DecapAgent
        if ([BaseType.COSMETIC_FRESH, BaseType.COSMETIC_BUILDUP].includes(baseType) && (rStep > 0 || lStep > 0)) {
            return { status: "APPROVED", requiresDecap: true };
        }

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

// --- LIGHTENING BACKGROUND TABLE (Фон Освітлення) ---
// Рівень після змивки → залишковий пігмент → необхідний нейтралізатор
const FO_TABLE = [
    { fo: 3, pigment: 'Чорний (залишки)', neutralizer: null },
    { fo: 4, pigment: 'Коричневий', neutralizer: null },
    { fo: 5, pigment: 'Темно-помаранчевий', neutralizer: '1' },   // нейтр. синім
    { fo: 6, pigment: 'Помаранчевий', neutralizer: '11' },         // нейтр. інтенс. синім
    { fo: 7, pigment: 'Жовто-помаранчевий', neutralizer: '1' },   // нейтр. синьо-фіолетовим
    { fo: 8, pigment: 'Жовтий', neutralizer: '16' },               // нейтр. фіолетово-голубим
    { fo: 9, pigment: 'Блідо-жовтий', neutralizer: '81' },         // нейтр. сріблястим
    { fo: 10, pigment: 'Майже білий', neutralizer: '89' }          // нейтр. жемчужним
];

// --- DECAP AGENT --- Протокол Декапірування / Освітлення косметичної бази
class DecapAgent {
    // Оксид залежить від типу бази та кількості тонів підйому
    _selectOxidant(baseType, toneStep) {
        if (baseType === BaseType.COSMETIC_BUILDUP) {
            // Накопичена база — знижений оксид для поступового вимивання
            if (toneStep <= 2) return { ox: '3%', ratio: '1:2', note: 'Мʼякий підйом' };
            if (toneStep <= 4) return { ox: '6%', ratio: '1:2', note: 'Середній підйом' };
            return { ox: '9%', ratio: '1:3', note: 'Агресивний підйом — поетапно' };
        } else {
            // Свіжа косметична база
            if (toneStep <= 2) return { ox: '6%', ratio: '1:2', note: 'Стандартний підйом' };
            if (toneStep <= 4) return { ox: '9%', ratio: '1:2', note: 'Інтенсивний підйом' };
            return { ox: '9%', ratio: '1:3', note: 'Максимальний підйом — можливий повтор' };
        }
    }

    // Прогноз ФО після змивки
    _predictFO(lengthLevel, toneStep) {
        // ФО = приблизно (lengthLevel + toneStep * 0.7), але не вище 10
        const predicted = Math.min(10, Math.round(lengthLevel + toneStep * 0.7));
        return FO_TABLE.find(t => t.fo === predicted) || FO_TABLE[FO_TABLE.length - 1];
    }

    calculate(snapshot, massDist) {
        const { baseType, lengthLevel, targetLevel, targetDirection, lStep, elasticity } = snapshot;
        const lMass = massDist.length;

        // Безпека: якщо еластичність 4 — знижений оксид
        const elasticityPenalty = (elasticity === Elasticity.STRETCHING);

        const toneStep = lStep; // кількість тонів підйому
        let oxData = this._selectOxidant(baseType, toneStep);
        if (elasticityPenalty && oxData.ox === '9%') oxData = { ox: '6%', ratio: '1:2', note: oxData.note + ' [знижено через еластичність 4]' };

        // Маса порошку з коефіцієнтом набухання 1.6
        const powderMass = Math.max(40, Math.round(lMass * 1.6));

        const foData = this._predictFO(lengthLevel, toneStep);

        // Рецепт тонування ПІСЛЯ змивки (нейтралізація ФО)
        const toningDirection = foData.neutralizer || targetDirection;
        const toningDye = `Барвник ${targetLevel}.${toningDirection}`;

        // Immutable — повертаємо новий об'єкт
        return Object.freeze({
            // Фаза 1: Змивка / Декапірування
            decapRec: Object.freeze({
                process: ProcessType.DECAPITATION,
                dye: 'Освітлюючий порошок (без аміаку)',
                ox: oxData.ox,
                ratio: oxData.ratio,
                mass: powderMass,
                note: oxData.note,
                repeats: toneStep > 4 ? '2-3 раунди до досягнення ФО' : '1-2 раунди'
            }),
            // Прогнозований ФО
            fo: Object.freeze({
                level: foData.fo,
                pigment: foData.pigment,
                neutralizer: foData.neutralizer
            }),
            // Фаза 2: Тонування після змивки
            toningRec: Object.freeze({
                process: ProcessType.TONING,
                dye: toningDye,
                ox: targetLevel >= 9 ? '1.9%' : '3%',
                ratio: '1:2',
                mass: lMass,
                note: foData.neutralizer
                    ? `Нейтралізатор ФО ${foData.fo}: напрямок .${foData.neutralizer} нейтралізує ${foData.pigment}`
                    : 'Нейтралізатор не потрібен — ФО відповідає цілі'
            })
        });
    }
}

// --- TECHNOLOGIST AGENT ---
class TechnologistAgent {
    generateRegulation(snapshot, state) {
        const { rootLength, elasticity, grey, greyType, thickness } = snapshot;
        const rootRec = state.rootRec;
        const lenRec = state.lenRec;
        
        let protocol = [];
        let underTheHood = [];
        let warnings = [];
        let diagnostics = [];
        
        const isMidBand = rootLength > 2;
        if (isMidBand) {
            protocol.push(`⚠️ MID-BAND DETECTED: Довжина кореня ${rootLength} см. Нанесення розбивається на 3 зони.`);
            underTheHood.push("Mid-band logic: примусова етапність через ризик смуги просідання пігменту.");
        }

        if (elasticity === Elasticity.STRETCHING) {
            protocol.push("🚨 АКТИВОВАНО ПРОТОКОЛ «ОСТАННЯ НАДІЯ»");
            protocol.push("КРОК 0: Холодне відновлення (ліпіди + амінокислоти) ПЕРЕД фарбуванням.");
            warnings.push("КРИТИЧНО: Еластичність 4. Волосся на межі розпаду. Використання тепла заборонено.");
            underTheHood.push("Elasticity alert: injection of 'Last Hope' protocol due to structural collapse risk.");
        }

        let timing = state.timing; // Initial timing from MathAgent
        let tMod = (thickness === Thickness.THIN) ? -10 : (thickness === Thickness.THICK ? 10 : 0);

        const isSpecialBlond = (rootRec && rootRec.process === ProcessType.SPECIAL_BLOND) || (lenRec && lenRec.process === ProcessType.SPECIAL_BLOND);

        if (grey >= 15) {
            let dLevel = snapshot.targetLevel > 1 ? snapshot.targetLevel - 1 : 1;
            if (grey >= 15 && grey < 40) state.diagnostics.push(`Сивина ${grey}%. Пропорція 2:1 (Модний:База). Впроваджено базу ${dLevel}.00.`);
            else if (grey >= 40 && grey < 60) state.diagnostics.push(`Сивина ${grey}%. Пропорція 1:1 (Модний:База). Впроваджено базу ${dLevel}.00.`);
            else state.diagnostics.push(`Сивина ${grey}%. Пропорція 1:2 (Модний:База). Впроваджено базу ${dLevel}.00.`);
        }
        if (grey >= 50 && isSpecialBlond) {
            warnings.push("ЗАБОРОНА SPECIAL BLOND: Сивина >= 50%. Призначено класичний перманент для щільного покриття.");
        }
        if (greyType === GreyType.GLASSY) {
            diagnostics.push("Скловидна сивина. Потрібен мордонсаж.");
        }
        
        return { protocol, underTheHood, warnings, diagnostics, timing };
    }
}

// --- MATH AGENT ---
class MathAgent {
    _createInitialState(snapshot) {
        return {
            status: "APPROVED",
            stages: [],
            warnings: [],
            diagnostics: [],
            rootRec: null,
            lenRec: null,
            plan: [],
            timing: 0,
            target: `${snapshot.targetLevel}.${snapshot.targetDirection}`,
            totalMass: 0,
            underTheHood: []
        };
    }

    calculateMass(snapshot) {
        const ROOT_MIN_GRAMS = 15; // Салонний ліміт: менше не зважити точно

        // Крок 1: Базова маса з довжини
        const baseMass = LENGTH_BASE_GRAMS[snapshot.hairLength] || LENGTH_BASE_GRAMS[Length.MEDIUM];
        // Крок 2: Множник густоти
        const densityMult = DENSITY_MULTIPLIER[snapshot.hairDensity] || DENSITY_MULTIPLIER[Density.NORMAL];
        let totalMass = Math.round(baseMass * densityMult);

        // Крок 3: Розподіл 30% корінь / 70% довжина
        const isMidBand = snapshot.rootLength > 2 && snapshot.rStep > 0;
        let rootTotal = Math.round(totalMass * 0.30);
        let lengthMass = totalMass - rootTotal;

        // Крок 4: Mid-band — 30% від кореневої маси іде на холодну зону
        let midMass  = 0;
        let rootMass = rootTotal;
        if (isMidBand) {
            midMass  = Math.round(rootTotal * 0.30);
            rootMass = rootTotal - midMass;
        }

        // Крок 5: FLOOR — корінь ніколи не менше ROOT_MIN_GRAMS
        // (менше 15г неможливо точно зважити в салонних умовах)
        let floorApplied = false;
        if (rootMass < ROOT_MIN_GRAMS) {
            rootMass = ROOT_MIN_GRAMS;
            floorApplied = true;
        }
        if (isMidBand && midMass < ROOT_MIN_GRAMS) {
            midMass = ROOT_MIN_GRAMS;
            floorApplied = true;
        }

        // Перерахунок загальної маси після застосування floor
        const actualTotal = rootMass + midMass + lengthMass;

        return {
            total: actualTotal,
            root: rootMass,
            mid: midMass,
            length: lengthMass,
            floorApplied  // прапор для діагностики в TechnologistAgent
        };
    }


    calculateRoot(snapshot, massDist) {
        const { rStep, rootLevel, grey, targetLevel, targetDirection } = snapshot;
        const rMass = massDist.root;
        const tDye = `${targetLevel}.${targetDirection}`;
        let rootRec = null;

        if (rStep > 0) {
            if (rootLevel <= 5) rootRec = { process: ProcessType.POWDER, dye: "Пудра", ox: "4%", mass: rMass, ratio: "1:2" };
            else if (grey >= 50) {
                let oxChoice = rStep >= 3 ? "9%" : "6%";
                rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: oxChoice, mass: rMass, ratio: "1:1" };
            } else if (rStep >= 4) rootRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "12%", mass: rMass, ratio: "1:2" };
            else if (rStep >= 2) rootRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "9%", mass: rMass, ratio: "1:2" };
            else rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "6%", mass: rMass, ratio: "1:1" };
        } else if (rStep === 0) {
            if (targetLevel >= 9) rootRec = { process: ProcessType.TONING, dye: `Барвник ${tDye}`, ox: "1.9%", mass: rMass, ratio: "1:2" };
            else rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "3%", mass: rMass, ratio: "1:1" };
        } else {
            rootRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "3%", mass: rMass, ratio: "1:1" };
        }

        if (rootRec && rootRec.process === ProcessType.POWDER) {
            let newMass = Math.round(rMass * 1.6);
            if (newMass < 40) newMass = 40;
            rootRec = { ...rootRec, mass: newMass };
        }

        let rOxideValue = rootRec ? parseFloat(String(rootRec.ox).replace(',', '.')) : 0;
        let warnings = [];
        let status = "APPROVED";
        let stages = [];

        if (rootRec && rootRec.process === ProcessType.POWDER && rOxideValue > 6) {
            status = "BLOCKED";
            stages.push({
                title: "ФАТАЛЬНО: Ризик хімічного опіку",
                text: "Використання оксиду вище 6% на шкірі голови з порошком категорично заборонено. Знизьте відсоток."
            });
        }

        return { recipe: rootRec, status, stages, warnings };
    }

    calculateLength(snapshot, massDist) {
        const { lStep, lengthLevel, baseType, targetLevel, targetDirection, grey, condition } = snapshot;
        const lMass = massDist.length;
        const tDye = `${targetLevel}.${targetDirection}`;
        let lenRec = null;

        if (lStep > 0) {
            if ([BaseType.COSMETIC_FRESH, BaseType.COSMETIC_BUILDUP].includes(baseType)) lenRec = { process: ProcessType.DECAPITATION, dye: "Пудра", ox: "1.9%", mass: lMass, ratio: "1:3 або 1:4" };
            else if (lengthLevel <= 5) lenRec = { process: ProcessType.POWDER, dye: "Пудра", ox: "4%", mass: lMass, ratio: "1:2" };
            else if (grey >= 50) {
                let oxChoice = lStep >= 3 ? "9%" : "6%";
                lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: oxChoice, mass: lMass, ratio: "1:1" };
            } else if (lStep >= 4) lenRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "12%", mass: lMass, ratio: "1:2" };
            else if (lStep >= 2) lenRec = { process: ProcessType.SPECIAL_BLOND, dye: `S.B. ${tDye}`, ox: "9%", mass: lMass, ratio: "1:2" };
            else lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "6%", mass: lMass, ratio: "1:1" };
        } else if (lStep === 0) {
            if (targetLevel >= 9) lenRec = { process: ProcessType.TONING, dye: `Барвник ${tDye}`, ox: "1.9%", mass: lMass, ratio: "1:2" };
            else lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "3%", mass: lMass, ratio: "1:1" };
        } else {
            lenRec = { process: ProcessType.PERMANENT, dye: `Барвник ${tDye}`, ox: "1.9%", mass: lMass, ratio: "1:2" }; 
        }

        let diagnostics = [];
        if (lenRec && lenRec.process === ProcessType.POWDER && [HairCondition.POROUS, HairCondition.DAMAGED].includes(condition)) {
            lenRec = { ...lenRec, ox: "1.5%", ratio: "1:4" };
            diagnostics.push("Пошкоджені кінці: примусове зниження оксиду порошку до 1.5% і пропорції 1:4.");
        }

        return { recipe: lenRec, diagnostics };
    }

    applyGreyLogic(recipe, snapshot) {
        if (!recipe) return null;
        const { grey, targetLevel, targetDirection } = snapshot;
        const tDye = `${targetLevel}.${targetDirection}`;
        
        if (grey >= 15 && recipe.process === ProcessType.PERMANENT) {
            let dLevel = targetLevel > 1 ? targetLevel - 1 : 1;
            let baseRatio = 0, fashionRatio = 0;
            
            if (grey >= 15 && grey < 40) { baseRatio = 1 / 3; fashionRatio = 2 / 3; }
            else if (grey >= 40 && grey < 60) { baseRatio = 1 / 2; fashionRatio = 1 / 2; }
            else { baseRatio = 2 / 3; fashionRatio = 1 / 3; }
            
            let greyOx = (targetLevel >= 8) ? "9%" : "6%";
            
            let bMass = Math.round(recipe.mass * baseRatio);
            let fMass = recipe.mass - bMass;
            
            return {
                ...recipe,
                dyeDetails: [
                    { name: `База ${dLevel}.00`, grams: bMass },
                    { name: `Модний ${tDye}`, grams: fMass }
                ],
                ox: greyOx
            };
        }
        return { ...recipe };
    }

    calculateMixtone(recipe, snapshot, zone) {
        if (!recipe) return null;
        const { targetLevel, targetDirection } = snapshot;
        const cond = zone === 'root' ? HairCondition.HEALTHY : snapshot.condition;
        
        let pType = String(recipe.process);
        if (pType === ProcessType.POWDER || pType === ProcessType.DECAPITATION) 
            return "Не додається (Нейтралізація на етапі тонування)";
        
        const pigmentMap = {
            '0': 'Натуральний', '1': 'Голубий', '11': 'Інтенсивно-голубий', 
            '2': 'Блідо-фіолетовий', '3': 'Жовтий (золотистий)', '4': 'Оранжевий', 
            '5': 'Червоно-фіолетовий', '6': 'Червоний', '7': 'Фіолетовий', 
            '8': 'Коричневий', '9': 'Синьо-зелений', '16': 'Фіолетово-голубий', 
            '32': 'Жовто-фіолетовий', '81': 'Сріблястий', '89': 'Жемчужно-сандре'
        };
        let color = pigmentMap[targetDirection] || "Коректор";
        
        if (targetLevel == 8 && ['1', '11', '9', '81'].includes(targetDirection)) 
            return "⚠️ ЗАБОРОНА: Пепел/Холод на 8-му рівні дасть ЗЕЛЕНЬ!";
        
        let rule11 = 11 - targetLevel;
        if (rule11 <= 0) return `Не потрібен (Рівень ${targetLevel})`;
        
        let grams = (rule11 / 2.0) * (recipe.mass / 30.0);
        grams = Math.round(grams * 10) / 10;
        
        const MAX_MIXTONE = 4.0 * (recipe.mass / 60.0); 
        if (grams > MAX_MIXTONE) grams = Math.round(MAX_MIXTONE * 10) / 10;

        let resStr = "";
        if ([HairCondition.POROUS, HairCondition.DAMAGED].includes(cond) && ['1', '11', '16', '2', '61', '81', '89'].includes(targetDirection)) {
            grams = Math.round((grams * 0.5) * 10) / 10;
            resStr = `${grams} гр (⚠️ Зменшено вдвічі) | ${color}`;
        } else {
            resStr = `${grams} гр | ${color}`;
        }

        if (pType === ProcessType.TONING || pType === ProcessType.PERMANENT || targetLevel >= 9) {
            if (grams >= MAX_MIXTONE) resStr = `${grams} гр (ЖОРСТКИЙ ЛІМІТ) | ${color}`;
        }
        if (pType === ProcessType.SPECIAL_BLOND) {
            let maxSB = Math.round((1.5 * (recipe.mass / 30.0)) * 10) / 10;
            if (grams > maxSB) {
                grams = maxSB;
                resStr = `${grams} гр (ЛІМІТ S.B.) | ${color}`;
            }
        }
        return resStr;
    }

    calculateMidBand(snapshot, rootRec) {
        if (!rootRec || snapshot.rootLength <= 2 || snapshot.rStep <= 0) return null;

        // Таблиця підвищення оксиду для холодної зони (крок +1)
        // CAP: максимум 12%
        const OX_STEP_UP = {
            "1.9%": "3%",
            "3%":   "6%",
            "6%":   "9%",
            "9%":   "12%",
            "12%":  "12%"  // CAP — не перевищувати
        };

        const currentOx = rootRec.ox;
        const elevatedOx = OX_STEP_UP[currentOx] || currentOx; // якщо невідоме значення — не змінювати

        // Повертаємо новий об'єкт через spread — без мутацій rootRec
        return Object.freeze({
            ...rootRec,
            process: "Mid-band (Холодна зона)",
            ox: elevatedOx
        });
    }

    process(inputSnapshot) {
        // Immutable initial state — collect warnings/diagnostics in local arrays,
        // merge via spread at the end. Zero mutations to state object.
        const initState = this._createInitialState(inputSnapshot);
        const massDist = this.calculateMass(inputSnapshot);

        const localWarnings = [...initState.warnings];
        const localDiagnostics = [...initState.diagnostics];

        // Діагностика Floor
        if (massDist.floorApplied) {
            localDiagnostics.push(`⚠️ FLOOR: Маса кореня скоригована до мінімуму 15г (занадто мало для точного зважування).`);
        }

        if (inputSnapshot.condition === HairCondition.DAMAGED) {
            localWarnings.push("КРИТИЧНИЙ СТАН: Блондування порошком ЗАБОРОНЕНО. Тільки пастельне тонування.");
        }
        if (inputSnapshot.thickness === Thickness.THIN) localDiagnostics.push("Тонке волосся. Час витримки скорочено.");
        if (inputSnapshot.thickness === Thickness.THICK) localDiagnostics.push("Товсте волосся. Час витримки збільшено.");
        if (inputSnapshot.condition === HairCondition.POROUS) localDiagnostics.push("Пористе волосся. Тонування під жорстким візуальним контролем.");

        const isMidBand = inputSnapshot.rootLength > 2;
        const hotRoot = (inputSnapshot.rootLength >= 2 && inputSnapshot.rStep > 0);

        if (isMidBand) {
            localWarnings.push(`MID-BAND: Холодна зона (від ${inputSnapshot.rootLength} см). Згенеровано окремий рецепт для смуги.`);
        } else if (hotRoot) {
            localWarnings.push(`ГАРЯЧИЙ КОРІНЬ: Зона біля шкіри освітлиться швидше.`);
        }

        if (inputSnapshot.lStep > 0 && inputSnapshot.condition === HairCondition.DAMAGED) {
            return Object.freeze({
                ...initState,
                status: "BLOCKED",
                warnings: localWarnings,
                diagnostics: localDiagnostics,
                stages: [{ title: "БЛОКУВАННЯ", text: "ФАТАЛЬНО: Довжина 'сильно пошкоджена'. Будь-яке освітлення заборонено." }]
            });
        }

        const rootResult = this.calculateRoot(inputSnapshot, massDist);
        if (rootResult.status === "BLOCKED") {
            return Object.freeze({
                ...initState,
                status: "BLOCKED",
                warnings: localWarnings,
                diagnostics: localDiagnostics,
                stages: [...initState.stages, ...rootResult.stages]
            });
        }

        const lengthResult = this.calculateLength(inputSnapshot, massDist);
        const midResult = isMidBand ? this.calculateMidBand(inputSnapshot, rootResult.recipe) : null;

        const greyRoot = this.applyGreyLogic(rootResult.recipe, inputSnapshot);
        const greyLength = this.applyGreyLogic(lengthResult.recipe, inputSnapshot);
        const greyMid = midResult ? this.applyGreyLogic(midResult, inputSnapshot) : null;

        const finalRoot = greyRoot ? { ...greyRoot, mixtone: this.calculateMixtone(greyRoot, inputSnapshot, 'root') } : null;
        const finalLength = greyLength ? { ...greyLength, mixtone: this.calculateMixtone(greyLength, inputSnapshot, 'length') } : null;
        const finalMid = greyMid ? { ...greyMid, mixtone: this.calculateMixtone(greyMid, inputSnapshot, 'root') } : null;

        let plan = [];
        let timing = 0;
        let tMod = (inputSnapshot.thickness === Thickness.THIN) ? -10 : (inputSnapshot.thickness === Thickness.THICK ? 10 : 0);
        
        let isLPowder = finalLength && finalLength.process === ProcessType.POWDER;
        let isRPowder = finalRoot && finalRoot.process === ProcessType.POWDER;
        let isCold = ['1','11','16','2','61','81','89'].includes(inputSnapshot.targetDirection);
        let applyRootText = isMidBand ? `Нанести Mid-band рецепт на холодну зону відростання (відступ 1.5 см від шкіри). Через 20 хв нанести кореневий рецепт на гарячу прикореневу зону.` : (hotRoot ? `Нанести рецепт кореня на відрослу довжину (відступ 1.5 см від шкіри). Через 15-20 хв нанести свіжу суміш на прикореневу зону.` : `Нанести рецепт на корінь.`);

        if (isMidBand) plan.push(`⚠️ MID-BAND: Відростання ${inputSnapshot.rootLength} см. Нанесення на корінь розбити на 2 етапи з різними рецептами!`);
        else if (hotRoot) plan.push(`⚠️ ПРАВИЛО ГАРЯЧОГО КОРЕНЯ: Відростання ${inputSnapshot.rootLength} см. Нанесення на корінь розбити на 2 етапи!`);
        
        let modifiedLength = finalLength ? { ...finalLength } : null;

        if (isLPowder && inputSnapshot.lStep >= 4) {
            plan.push("⚠️ ЕКСТРЕМАЛЬНЕ ОСВІТЛЕННЯ: Водою не змивати!");
            plan.push(`КРОК 1: Нанести порошок на довжину (відступ 2 см). Маса: ${massDist.length} гр. 40-50 хв.`);
            plan.push("КРОК 2 (СУХЕ ЗНЯТТЯ): Стягнути відпрацьований порошок сухими серветками.");
            plan.push(`КРОК 3: ${applyRootText} Маса: ${finalRoot.mass} гр.`);
            plan.push("КРОК 4 (МИЙКА): Ретельне змиття. ШГО + Маска.");
            plan.push(`КРОК 5: Тонування підготовленого фону.`);
            timing = 100 + tMod;
            modifiedLength.ox = "1.9%"; modifiedLength.dye = `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection}`; modifiedLength.ratio = "1:2"; modifiedLength.process = ProcessType.TONING;
        } else if (inputSnapshot.lStep <= -2) {
            let pMass = Math.round(massDist.length * 0.5);
            let pLevel = Math.min(inputSnapshot.targetLevel + 1, 10);
            plan.push("⚠️ РІЗКЕ ЗАТЕМНЕННЯ. ОБОВ'ЯЗКОВА ПРЕПІГМЕНТАЦІЯ.");
            plan.push(`КРОК 1: Змішати барвник ${pLevel}.3 або ${pLevel}.4 з теплою водою (БЕЗ ОКСИДУ). ${pMass} гр. Вбити у довжину.`);
            plan.push(`КРОК 2: Не змиваючи, ${applyRootText}`);
            plan.push(`КРОК 3: Нанести рецепт на довжину.`);
            timing = 40 + tMod;
            modifiedLength.ox = "1.9%"; modifiedLength.ratio = "1:2";
        } else if (isRPowder && isLPowder) {
            plan.push(`КРОК 1: Нанести порошкову змивку на довжину. Маса: ${massDist.length} гр.`);
            plan.push("КРОК 2: Видалення відпрацьованої маси з довжини серветкою (без миття).");
            plan.push(`КРОК 3: ${applyRootText}`);
            plan.push("КРОК 4 (МИЙКА): Обов'язково ШГО + Маска для зупинки персульфатів.");
            plan.push(`КРОК 5: Нанести тонування на вологе підготовлене полотно.`);
            timing = 90 + tMod;
            modifiedLength.ox = "1.9%"; modifiedLength.dye = `Барвник ${inputSnapshot.targetLevel}.${inputSnapshot.targetDirection}`; modifiedLength.ratio = "1:2"; modifiedLength.process = ProcessType.TONING;
        } else if (isRPowder && !isLPowder) {
            plan.push(`КРОК 1: ${hotRoot ? applyRootText : "Нанести порошок ТІЛЬКИ на корінь. Крайову НЕ ЧІПАТИ."}`);
            if (!hotRoot) plan.push("КРОК 2: Через 15-20 хвилин нанести порошок на крайову лінію.");
            if (inputSnapshot.baseType === BaseType.COSMETIC) plan.push("КРОК 3 (Підчищення): Змочити довжину. Стягнути порошок з кореня на довжину на 1-5 хв.");
            plan.push("КРОК 4 (МИЙКА): Змиття ШГО + Маска.");
            plan.push(`КРОК 5: Нанести тонування на вологе волосся.`);
            plan.push("⏳ ПРАВИЛО: Прочісувати кожні 5-10 хв. При ознаках затемнення кінців — негайно змивати!");
            timing = 70 + tMod;
            modifiedLength.ox = "1.9%"; modifiedLength.ratio = "1:2";
        } else {
            plan.push(`КРОК 1: ${applyRootText}`);
            plan.push(`КРОК 2: Нанести суміш на довжину.`);
            if (isCold) plan.push("⚠️ ЗАХИСТ КОНТУРУ: На крайову лінію наносити суміш в останню чергу (за 10-15 хв до кінця).");
            plan.push("КРОК 3 (Емульгація): За 5-10 хв до кінця зволожити волосся та земульгувати.");
            timing = finalRoot && finalRoot.process === ProcessType.SPECIAL_BLOND ? 50 : 40 + tMod;
        }

        return Object.freeze({
            ...initState,
            warnings: [...localWarnings, ...rootResult.warnings],
            diagnostics: [...localDiagnostics, ...lengthResult.diagnostics],
            rootRec: finalRoot ? Object.freeze(finalRoot) : null,
            midRec: finalMid ? Object.freeze(finalMid) : null,
            lenRec: modifiedLength ? Object.freeze(modifiedLength) : null,
            plan: plan,
            timing: timing
        });
    }
}

// --- MASTER NODE ---
class MasterNode {
    constructor() {
        this.agents = {
            chemist: new ChemistAgent(),
            math: new MathAgent(),
            technologist: new TechnologistAgent()
        };
    }

    process(rawInput) {
        try {
            // Маппінг сирих даних у заморожений Snapshot (атомарний — без залипань)
            const snapshot = InputMapper.buildSnapshot(rawInput);
            
            // 1. Перевірка Агентом-Хіміком
            const chemCheck = this.agents.chemist.validate(snapshot);
            if (chemCheck.status === "BLOCKED") return this.terminateWithRedStatus(chemCheck);

            // 2а. ДЕКАПІРУВАННЯ — якщо косметична база + підйом рівня
            if (chemCheck.requiresDecap) {
                const massDist = this.agents.math.calculateMass(snapshot);
                const decapResult = new DecapAgent().calculate(snapshot, massDist);
                return Object.freeze({
                    status: "DECAP_PROTOCOL",
                    requiresDecap: true,
                    decapRec:  decapResult.decapRec,
                    fo:        decapResult.fo,
                    toningRec: decapResult.toningRec,
                    // Стандартні поля для сумісності з render()
                    rootRec:   null,
                    lenRec:    null,
                    midRec:    null,
                    plan: [
                        "КРОК 1: Нанести освітлюючий порошок на довжину згідно рецепту. Уникати шкіри голови!",
                        `КРОК 2: Витримати ${decapResult.decapRec.repeats}. Контроль щоразу.`,
                        "КРОК 3 (МИЙКА): Змити з ШГО. Кислотна стабілізація (3% оксид, 5 хв).",
                        `КРОК 4: Нанести тонування на вологе полотно. ${decapResult.toningRec.note}`
                    ],
                    warnings: snapshot.elasticity === Elasticity.STRETCHING
                        ? ["⚠️ Еластичність 4: оксид знижено. Контроль кожні 5 хв!"]
                        : [],
                    diagnostics: [
                        `Прогнозований ФО після змивки: Рівень ${decapResult.fo.level} — ${decapResult.fo.pigment}`
                    ],
                    timing: decapResult.decapRec.repeats.includes('2-3') ? 90 : 60,
                    totalMass: massDist.total,
                    underTheHood: [
                        `DecapAgent: baseType=${snapshot.baseType}, lStep=${snapshot.lStep}`,
                        `Оксид підібраний: ${decapResult.decapRec.ox} (${decapResult.decapRec.note})`,
                        `ФО=${decapResult.fo.level}, нейтралізатор: ${decapResult.fo.neutralizer || 'не потрібен'}`
                    ],
                    stages: []
                });
            }

            // 2б. Стандартний шлях через MathAgent
            let state = this.agents.math.process(snapshot);
            if (state.status === "FATAL_ERROR" || state.status === "BLOCKED") {
                return this.terminateWithRedStatus(state);
            }
            
            // 3. Формування регламенту Технологом (через імутабельність створюємо новий об'єкт)
            const techData = this.agents.technologist.generateRegulation(snapshot, state);
            
            return Object.freeze({
                ...state,
                plan: [...techData.protocol, ...state.plan],
                underTheHood: [...state.underTheHood, ...techData.underTheHood],
                warnings: [...state.warnings, ...techData.warnings],
                diagnostics: [...state.diagnostics, ...techData.diagnostics],
                timing: techData.timing
            });

        } catch (e) {
            console.error("Caught exception:", e);
            return this.terminateWithRedStatus({
                status: "FATAL_ERROR",
                stages: [{ title: "КРИТИЧНА ПОМИЛКА АГЕНТА", text: e.message }]
            });
        }
    }

    terminateWithRedStatus(errorState) {
        console.error("MasterNode: Process terminated with error status.");
        return Object.freeze({
            ...errorState,
            status: errorState.status || "FATAL_ERROR",
            plan: ["ЗУПИНЕНО: Перевірте діагностику помилок."],
            timing: 0
        });
    }
}

// Якщо використовується в браузері для зв'язку з UI
function calculateProtocol() {
    try {
        let rawInput = {
            history: document.getElementById('history').value,
            condition: document.getElementById('condition').value,
            thickness: document.getElementById('thickness').value,
            density: document.getElementById('density').value,
            length: document.getElementById('length').value,
            grey: document.getElementById('grey_percent').value,
            greyType: document.getElementById('grey_type').value,
            elasticity: document.getElementById('elasticity')?.value || "1",
            rootLevel: document.getElementById('root_level').value,
            rootLength: document.getElementById('root_length').value,
            lengthLevel: document.getElementById('length_level').value,
            baseType: document.getElementById('base_type').value,
            targetLevel: document.getElementById('target_level').value,
            targetDirection: document.getElementById('target_direction').value
        };

        const master = new MasterNode();
        let state = master.process(rawInput);
        
        if (typeof renderState === 'function') {
            renderState(state);
        } else {
            console.log(state);
        }
    } catch(e) {
        console.error(e);
        if (typeof renderState === 'function') {
            renderState({status: "FATAL_ERROR", stages: [{title: "Помилка Вводу", text: e.message}]});
        }
    }
}

// Для тестування у Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MasterNode, InputMapper, HairCondition, BaseType, Elasticity };
}