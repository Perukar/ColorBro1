const pigmentMap = {
            '0': 'Натуральний', '1': 'Голубий', '11': 'Інтенсивно-голубий', 
            '2': 'Блідо-фіолетовий', '3': 'Жовтий (золотистий)', '4': 'Оранжевий', 
            '5': 'Червоно-фіолетовий', '6': 'Червоний', '7': 'Фіолетовий', 
            '8': 'Коричневий', '9': 'Синьо-зелений', '16': 'Фіолетово-голубий', 
            '32': 'Жовто-фіолетовий', '81': 'Сріблястий', '89': 'Жемчужно-сандре'
        };

        function calcMixtone(tLevel, tDir, processType, mass, condition) {
            let pType = String(processType).toLowerCase();
            if (pType.includes('порошок') || pType.includes('powder')) 
                return "Не додається (Нейтралізація на етапі тонування)";
            
            let color = pigmentMap[tDir] || "Коректор";
            if (tLevel == 8 && ['1', '11', '9', '81'].includes(tDir)) 
                return "⚠️ ЗАБОРОНА: Пепел/Холод на 8-му рівні дасть ЗЕЛЕНЬ!";
            
            let rule11 = 11 - tLevel;
            if (rule11 <= 0) return `Не потрібен (Рівень ${tLevel})`;
            
            let grams = (rule11 / 2.0) * (mass / 30.0);
            grams = Math.round(grams * 10) / 10;
            let resStr = "";

            if (['пористі', 'сильно поврежденные'].includes(condition) && ['1', '11', '16', '2', '61', '81', '89'].includes(tDir)) {
                grams = Math.round((grams * 0.5) * 10) / 10;
                resStr = `${grams} гр (⚠️ Зменшено вдвічі) | ${color}`;
            } else {
                resStr = `${grams} гр | ${color}`;
            }

            if (pType.includes('тонування') || pType.includes('перманент')) {
                let maxPastel = Math.round((4.0 * (mass / 60.0)) * 10) / 10;
                if (grams > maxPastel) return `${maxPastel} гр (ЛІМІТ ПАСТЕЛЬ) | ${color}`;
            }
            if (pType.includes('special blond')) {
                let maxSB = Math.round((1.5 * (mass / 30.0)) * 10) / 10;
                if (grams > maxSB) return `${maxSB} гр (ЛІМІТ S.B.) | ${color}`;
            }
            return resStr;
        }

        const PerucarWwwMappingV1 = Object.freeze({
            getWwwValue(id) {
                const element = document.getElementById(id);
                return element ? String(element.value).trim() : '';
            },

            gatherWwwFormData() {
                return {
                    history: this.getWwwValue('history'),
                    condition: this.getWwwValue('condition'),
                    thickness: this.getWwwValue('thickness'),
                    density: this.getWwwValue('density'),
                    length: this.getWwwValue('length'),
                    grey_percent: this.getWwwValue('grey_percent'),
                    grey_type: this.getWwwValue('grey_type'),
                    root_level: this.getWwwValue('root_level'),
                    root_length: this.getWwwValue('root_length'),
                    length_level: this.getWwwValue('length_level'),
                    base_type: this.getWwwValue('base_type'),
                    target_level: this.getWwwValue('target_level'),
                    target_direction: this.getWwwValue('target_direction')
                };
            },

            normalizeWwwToRootRawInput(wwwValues) {
                const toIntegerOrNull = (value) => {
                    const parsed = parseInt(value, 10);
                    return Number.isNaN(parsed) ? null : parsed;
                };

                const toGrey = (value) => {
                    const parsed = parseInt(value, 10);
                    return Number.isNaN(parsed) ? 0 : parsed;
                };

                return {
                    history: String(wwwValues.history || '').trim(),
                    condition: String(wwwValues.condition || '').trim(),
                    thickness: String(wwwValues.thickness || '').trim(),
                    density: String(wwwValues.density || '').trim(),
                    length: String(wwwValues.length || '').trim(),
                    grey: toGrey(wwwValues.grey_percent),
                    greyType: String(wwwValues.grey_type || '').trim(),
                    rootLevel: toIntegerOrNull(wwwValues.root_level),
                    rootLength: toIntegerOrNull(wwwValues.root_length),
                    lengthLevel: toIntegerOrNull(wwwValues.length_level),
                    baseType: String(wwwValues.base_type || '').trim(),
                    targetLevel: toIntegerOrNull(wwwValues.target_level),
                    targetDirection: String(wwwValues.target_direction || '').trim(),
                    elasticity: '1',
                    isMidActive: false,
                    midLevel: null,
                    midBaseType: null
                };
            }
        });

        const PerucarWwwRenderV1 = Object.freeze({
            escapeHtml(value) {
                return String(value ?? '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            },

            renderMessageItem(item) {
                if (item == null) return '';
                if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                    return `<li>${this.escapeHtml(item)}</li>`;
                }
                const title = item.title || item.code || item.type || '';
                const message = item.message || item.text || item.reason || JSON.stringify(item);
                return title
                    ? `<li><b>${this.escapeHtml(title)}:</b> ${this.escapeHtml(message)}</li>`
                    : `<li>${this.escapeHtml(message)}</li>`;
            },

            renderList(title, items, className) {
                if (!Array.isArray(items) || items.length === 0) return '';
                return `<div class="${this.escapeHtml(className || 'info')}"><h3>${this.escapeHtml(title)}</h3><ul>${items.map((item) => this.renderMessageItem(item)).join('')}</ul></div>`;
            },

            renderBlockers(blockers) {
                return this.renderList('Блокування', blockers, 'alert');
            },

            renderManualDecisions(manualDecisions) {
                return this.renderList('Потрібне ручне рішення майстра', manualDecisions, 'manual-required');
            },

            renderWarnings(warnings) {
                return this.renderList('Попередження', warnings, 'warning');
            },

            normalizeReasonsToItems(reasons) {
                if (!reasons) return [];
                if (Array.isArray(reasons)) return reasons;
                if (typeof reasons === 'object') {
                    return Object.entries(reasons).map(([key, value]) => ({
                        title: key,
                        message: typeof value === 'string' ? value : JSON.stringify(value)
                    }));
                }
                return [reasons];
            },

            renderDiagnostics(diagnostics, reasons) {
                const items = [];
                if (Array.isArray(diagnostics)) items.push(...diagnostics);
                else if (diagnostics) items.push(diagnostics);
                items.push(...this.normalizeReasonsToItems(reasons));
                return this.renderList('Діагностика та причини', items, 'diagnostics');
            },

            renderRecipe(title, recipe, options = {}) {
                if (!recipe) return '';
                const className = options.approved === true ? 'recipe approved-recipe' : 'recipe non-final-recipe';
                const rows = [
                    ['Процес', recipe.process],
                    ['Барвник', recipe.dye],
                    ['Оксид', recipe.ox || recipe.oxidant],
                    ['Маса', recipe.mass],
                    ['Пропорція', recipe.ratio],
                    ['Мікстон', recipe.mixtone],
                    ['Нотатки', recipe.notes]
                ].filter(([, value]) => value !== undefined && value !== null && value !== '');
                const htmlRows = rows.map(([label, value]) => `<li><b>${this.escapeHtml(label)}:</b> ${this.escapeHtml(value)}</li>`).join('');
                return `<div class="${className}"><h3>${this.escapeHtml(title)}</h3><ul>${htmlRows}</ul></div>`;
            },

            renderRecipes(state) {
                if (!state || state.status !== 'APPROVED') return '';
                return [
                    this.renderRecipe('Корінь', state.rootRec, { approved: true }),
                    this.renderRecipe('Mid-band', state.midRec, { approved: true }),
                    this.renderRecipe('Довжина', state.lenRec, { approved: true })
                ].join('');
            },

            renderPhaseSteps(steps) {
                if (!Array.isArray(steps) || steps.length === 0) return '';
                return `<ul>${steps.map((step) => this.renderMessageItem(step)).join('')}</ul>`;
            },

            renderPhase(phase) {
                if (phase == null) return '';
                if (typeof phase === 'string') return `<div class="phase"><p>${this.escapeHtml(phase)}</p></div>`;
                const phaseName = phase.phaseName || phase.title || phase.name || 'Етап';
                const stepsHtml = this.renderPhaseSteps(phase.steps);
                const notesHtml = phase.notes ? `<p>${this.escapeHtml(phase.notes)}</p>` : '';
                if (stepsHtml || notesHtml) return `<div class="phase"><h4>${this.escapeHtml(phaseName)}</h4>${stepsHtml}${notesHtml}</div>`;
                return `<div class="phase"><h4>${this.escapeHtml(phaseName)}</h4><pre>${this.escapeHtml(JSON.stringify(phase, null, 2))}</pre></div>`;
            },

            renderPhases(phases) {
                if (!Array.isArray(phases) || phases.length === 0) return '';
                return `<div class="phases"><h3>Регламент дій</h3>${phases.map((phase) => this.renderPhase(phase)).join('')}</div>`;
            },

            renderProtocolText(protocolText) {
                if (!protocolText) return '';
                const escapedText = this.escapeHtml(protocolText).replace(/\n/g, '<br>');
                return `<div class="protocol-text"><h3>Регламент дій</h3><p>${escapedText}</p></div>`;
            },

            renderMixtoneInfo(mixtoneInfo) {
                if (!mixtoneInfo) return '';
                return `<div class="mixtone-info"><h3>Мікстони</h3><pre>${this.escapeHtml(JSON.stringify(mixtoneInfo, null, 2))}</pre></div>`;
            },

            renderMassModel(massModel) {
                if (!massModel) return '';
                return `<div class="mass-model"><h3>Маси</h3><pre>${this.escapeHtml(JSON.stringify(massModel, null, 2))}</pre></div>`;
            },

            renderTimingInfo(timingInfo) {
                if (!timingInfo) return '';
                return `<div class="timing-info"><h3>Таймінги</h3><pre>${this.escapeHtml(JSON.stringify(timingInfo, null, 2))}</pre></div>`;
            },

            renderStatusHeader(state) {
                if (!state) return '';
                const status = state.status || 'UNKNOWN';
                const target = state.target ? ` | Ціль: ${this.escapeHtml(typeof state.target === 'string' ? state.target : JSON.stringify(state.target))}` : '';
                return `<div class="status-header"><h2>${this.escapeHtml(status)}${target}</h2></div>`;
            },

            renderStateToHtml(state) {
                if (!state) return this.renderFatalError(new Error('State is empty'));
                if (state.status === 'FATAL_ERROR') return this.renderFatalError(state.error || state.message || 'Fatal error');
                const hasPhases = Array.isArray(state.phases) && state.phases.length > 0;
                return [
                    this.renderBlockers(state.blockers),
                    this.renderManualDecisions(state.manualDecisions),
                    this.renderWarnings(state.warnings),
                    this.renderStatusHeader(state),
                    this.renderRecipes(state),
                    hasPhases ? this.renderPhases(state.phases) : this.renderProtocolText(state.protocolText),
                    this.renderMixtoneInfo(state.mixtoneInfo),
                    this.renderMassModel(state.massModel),
                    this.renderTimingInfo(state.timingInfo),
                    this.renderDiagnostics(state.diagnostics, state.reasons)
                ].join('');
            },

            renderFatalError(error) {
                const message = error && error.message ? error.message : error;
                return `<div class="alert"><h2>Фатальна помилка</h2><p>${this.escapeHtml(message || 'Неможливо показати результат.')}</p></div>`;
            }
        });

        function stripWwwHtmlText(value) {
            if (value === undefined || value === null) return '';
            return String(value)
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/&lt;br\s*\/?&gt;/gi, '\n')
                .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, '\n')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&lt;\/?[^&]*&gt;/gi, '')
                .replace(/<[^>]*>/g, '')
                .replace(/&amp;/gi, '&')
                .replace(/&quot;/gi, '"')
                .replace(/&#39;/gi, "'")
                .split('\n')
                .map((line) => line.replace(/\s+/g, ' ').trim())
                .filter(Boolean)
                .join('\n');
        }

        function normalizeWwwRecipeForRender(recipe) {
            if (!recipe) return null;
            const normalized = { ...recipe };
            ['process', 'dye', 'ox', 'oxidant', 'mass', 'ratio', 'mixtone', 'notes'].forEach((field) => {
                if (Object.prototype.hasOwnProperty.call(normalized, field)) {
                    normalized[field] = stripWwwHtmlText(normalized[field]);
                }
            });
            return normalized;
        }

        function buildWwwRenderState(runtime = {}) {
            const plan = Array.isArray(runtime.plan) ? runtime.plan : [];
            const phases = Array.isArray(runtime.phases) && runtime.phases.length > 0
                ? runtime.phases
                : plan.map((item, index) => ({
                    phaseName: `Етап ${index + 1}`,
                    steps: [stripWwwHtmlText(item)]
                })).filter((phase) => phase.steps[0] !== '');

            return {
                status: runtime.status || 'APPROVED',
                target: runtime.target,
                blockers: Array.isArray(runtime.blockers) ? runtime.blockers : [],
                manualDecisions: Array.isArray(runtime.manualDecisions) ? runtime.manualDecisions : [],
                warnings: Array.isArray(runtime.warnings) ? runtime.warnings : [],
                rootRec: normalizeWwwRecipeForRender(runtime.rootRec),
                midRec: normalizeWwwRecipeForRender(runtime.midRec),
                lenRec: normalizeWwwRecipeForRender(runtime.lenRec),
                phases,
                protocolText: stripWwwHtmlText(runtime.protocolText),
                mixtoneInfo: runtime.mixtoneInfo || null,
                massModel: runtime.massModel || null,
                timingInfo: runtime.timingInfo || null,
                diagnostics: Array.isArray(runtime.diagnostics) ? runtime.diagnostics : [],
                reasons: runtime.reasons || []
            };
        }

        function calculateProtocol() {
            try {
                let history = document.getElementById('history').value;
                let condition = document.getElementById('condition').value;
                let thickness = document.getElementById('thickness').value;
                let density = document.getElementById('density').value;
                let length = document.getElementById('length').value;
                let grey = parseInt(document.getElementById('grey_percent').value);
                let greyType = document.getElementById('grey_type').value;
                
                let rLevel = parseInt(document.getElementById('root_level').value);
                let rootLength = parseInt(document.getElementById('root_length').value);
                let lLevel = parseInt(document.getElementById('length_level').value);
                let bType = document.getElementById('base_type').value;
                
                let tLevel = parseInt(document.getElementById('target_level').value);
                let tDir = document.getElementById('target_direction').value;

                let alerts = [], warnings = [], diagnostics = [], manualDecisions = [];
                if (history === 'хна / металл' && ['пористі', 'сильно поврежденные'].includes(condition)) alerts.push("ФАТАЛЬНО: Хна/метали на пошкодженому волоссі. Оксиданти заборонені.");
                if (condition === 'сильно поврежденные') warnings.push("⚠️ КРИТИЧНИЙ СТАН: Блондування порошком ЗАБОРОНЕНО. Тільки пастельне тонування.");
                
                if (grey > 0) {
                    if (greyType === 'стекловидная') diagnostics.push("Скловидна сивина. Потрібен мордонсаж.");
                }

                let tMod = 0;
                if (thickness === 'тонкие') { diagnostics.push("Тонке волосся. Час витримки скорочено."); tMod = -10; }
                if (thickness === 'толстые') { diagnostics.push("Товсте волосся. Час витримки збільшено."); tMod = 10; }
                if (condition === 'пористі') diagnostics.push("Пористе волосся. Тонування під жорстким візуальним контролем.");

                let baseMass = {'короткие':30, 'средние':60, 'длинные':120}[length];
                let denMult = {'редкие':0.7, 'средние':1.0, 'густые':1.5}[density];
                let totalMass = Math.round(baseMass * denMult);

                if (alerts.length > 0) {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: `${tLevel}.${tDir}`,
                        blockers: alerts,
                        warnings,
                        diagnostics,
                        massModel: { baseMass, densityMultiplier: denMult, totalMass }
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }

                let rStep = tLevel - rLevel;
                let lStep = tLevel - lLevel;
                let rMass = Math.round(totalMass * 0.3);
                let lMass = Math.round(totalMass * 0.7);
                let tDye = `${tLevel}.${tDir}`;
                
                let rootRec = null, lenRec = null, plan = [], timing = 0;

                let hotRoot = (rootLength >= 3 && rStep > 0);
                if (hotRoot) {
                    warnings.push(`⚠️ ГАРЯЧИЙ КОРІНЬ: Відростання ${rootLength} см. Зона біля шкіри (1.5-2 см) освітлиться швидше. Обов'язкове нанесення у 2 етапи.`);
                }

                if (lStep > 0 && condition === 'сильно поврежденные') {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: `${tLevel}.${tDir}`,
                        blockers: ["ФАТАЛЬНО: Довжина 'сильно пошкоджена'. Будь-яке освітлення заборонено."],
                        warnings,
                        diagnostics,
                        massModel: { baseMass, densityMultiplier: denMult, totalMass }
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }

                // Логіка Довжини
                if (lStep > 0) {
                    if (bType === 'Косметична') lenRec = {process: "Порошок (Змивка)", dye: "Пудра", ox: "1.9%", mass: lMass, ratio: "1:3 або 1:4"};
                    else if (lLevel <= 5) lenRec = {process: "Порошок", dye: "Пудра", ox: "4%", mass: lMass, ratio: "1:2"};
                    else if (grey >= 50) {
                        warnings.push("⚠️ ЗАБОРОНА SPECIAL BLOND: Сивина >= 50%. Призначено класичний перманент по довжині для щільного покриття.");
                        let oxChoice = lStep >= 3 ? "9%" : "6%";
                        lenRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: oxChoice, mass: lMass, ratio: "1:1"};
                    }
                    else if (lStep >= 4) lenRec = {process: "Special Blond", dye: `S.B. ${tDye}`, ox: "12%", mass: lMass, ratio: "1:2"};
                    else if (lStep >= 2) lenRec = {process: "Special Blond", dye: `S.B. ${tDye}`, ox: "9%", mass: lMass, ratio: "1:2"};
                    else lenRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: "6%", mass: lMass, ratio: "1:1"};
                } else if (lStep < 0) { lenRec = {process: "Перманент / Тонування", dye: `Барвник ${tDye}`, ox: "1.9%", mass: lMass, ratio: "1:2"}; }
                else { lenRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: "6%", mass: lMass, ratio: "1:1"}; }

                // ПАТЧ: Оновлена Логіка Кореня (Жорстке блокування S.B. при сивині)
                if (rStep > 0) {
                    if (rLevel <= 5) {
                        rootRec = {process: "Порошок", dye: "Пудра", ox: "4%", mass: rMass, ratio: "1:2"};
                    } else if (grey >= 50) {
                        warnings.push("⚠️ ЗАБОРОНА SPECIAL BLOND: Сивина >= 50%. Призначено класичний перманент для щільного покриття.");
                        let oxChoice = rStep >= 3 ? "9%" : "6%"; 
                        rootRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: oxChoice, mass: rMass, ratio: "1:1"};
                    } else if (rStep >= 4) {
                        rootRec = {process: "Special Blond", dye: `S.B. ${tDye}`, ox: "12%", mass: rMass, ratio: "1:2"};
                    } else if (rStep >= 2) {
                        rootRec = {process: "Special Blond", dye: `S.B. ${tDye}`, ox: "9%", mass: rMass, ratio: "1:2"};
                    } else {
                        rootRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: "6%", mass: rMass, ratio: "1:1"};
                    }
                } else if (rStep < 0) { 
                    rootRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: "3%", mass: rMass, ratio: "1:1"}; 
                } else { 
                    rootRec = {process: "Перманент", dye: `Барвник ${tDye}`, ox: "6%", mass: rMass, ratio: "1:1"}; 
                }

                if (rootRec && String(rootRec.process).includes("Порошок")) {
                    rMass = Math.round(rMass * 1.6);
                    if (rMass < 40) rMass = 40;
                    rootRec.mass = rMass;
                }

                // ПАТЧ: Фізична зміна рецептури при сивині >= 50% (Захист від низьких оксидів)
                if (grey >= 50) {
                    let dLevel = tLevel > 1 ? tLevel - 1 : 1;
                    
                    // Перевіряємо, чи це справжній перманент здатний розпушити сивину (6%, 9% або 12%)
                    // Якщо це тонування на 1.9%, 3% або 4% — додавання бази .00 заборонено (сивина або знебарвлена, або не візьметься)
                    let isValidRootGrey = rootRec && String(rootRec.process).includes("Перманент") && ["6%", "9%", "12%"].includes(rootRec.ox);
                    let isValidLenGrey = lenRec && String(lenRec.process).includes("Перманент") && ["6%", "9%", "12%"].includes(lenRec.ox);

                    if (isValidRootGrey || isValidLenGrey) {
                        diagnostics.push(`Сивина >=50%. Впроваджено базу ${dLevel}.00 (Тільки для Перманенту >= 6%).`);
                    }

                    if (isValidRootGrey) {
                        let hMass = Math.round(rootRec.mass / 2);
                        let rM = rootRec.mass - hMass;
                        rootRec.dye = `<br>&nbsp;&nbsp;&nbsp;▪️ База <b>${dLevel}.00</b> (${hMass} гр)<br>&nbsp;&nbsp;&nbsp;▪️ Модний <b>${tDye}</b> (${rM} гр)`;
                    }
                    if (isValidLenGrey) {
                        let hMass = Math.round(lenRec.mass / 2);
                        let rM = lenRec.mass - hMass;
                        lenRec.dye = `<br>&nbsp;&nbsp;&nbsp;▪️ База <b>${dLevel}.00</b> (${hMass} гр)<br>&nbsp;&nbsp;&nbsp;▪️ Модний <b>${tDye}</b> (${rM} гр)`;
                    }
                }

                let isRPowder = rootRec && String(rootRec.process).includes("Порошок");
                let isLPowder = lenRec && String(lenRec.process).includes("Порошок");
                if (hotRoot) {
                    plan.push(`⚠️ ПРАВИЛО ГАРЯЧОГО КОРЕНЯ: Відростання ${rootLength} см. Нанесення на корінь розбити на 2 етапи!`);
                }
                let applyRootText = hotRoot ? `Нанести рецепт кореня на відрослу довжину (відступ 1.5-2 см від шкіри). Через 15-20 хв нанести свіжу суміш на прикореневу зону.` : `Нанести рецепт на корінь.`;

                function buildFinalProtocolText({ targetLevel, lengthLevel, targetDirection, baseType, rootStep, midActive, midLevel }) {
                    let phases = [];
                    const coldShades = ['1','11','16','2','61','81','89'];
                    const isCold = coldShades.includes(String(targetDirection));

                    if (targetLevel < lengthLevel && isCold) {
                        phases.push(`<b>Препігментація (тепла підкладка)</b><br>
<b>Склад:</b> Барвник (теплого напрямку) + Натуральний + Вода (1:1:1).<br>
<b>Метод нанесення:</b> Нанести на пористі ділянки перед основним фарбуванням.<br>
<b>ВНИМАНИЕ:</b> Постійний візуальний контроль. Не змивати, надлишки стягнути рушником.`);
                    }

                    if (rootStep >= 1 && rootStep <= 3) {
                        phases.push(`<b>Підняття кореня (Перманентне фарбування)</b><br>
<b>Склад:</b> Перманентна фарба + Окисник 6% або 9% (пропорція згідно з інструкцією виробника).<br>
<b>Метод нанесення:</b> Нанесення впритул до шкіри голови. Ширина розділів 0.5-1.5 см.<br>
<b>Час витримки:</b> Згідно з регламентом барвника (зазвичай 35-45 хв).<br>
<b>ВНИМАНИЕ:</b> Наносити ретельно, але швидко. Не заходити на раніше освітлене полотно.`);
                    }

                    if (midActive && midLevel === targetLevel) {
                        phases.push(`<b>Нейтралізація зони переходу (Mid-band)</b><br>
<b>Склад:</b> Фарба потрібного напрямку + Окисник 1.5% або 1.9% (1:2).<br>
<b>Метод нанесення:</b> Наносити виключно на зону смуги, не зачіпаючи корінь та пористу довжину.`);
                    }

                    return phases.join('<br><br>');
                }

                let protocolText = buildFinalProtocolText({
                    targetLevel: tLevel,
                    lengthLevel: lLevel,
                    targetDirection: tDir,
                    baseType: bType,
                    rootStep: rStep,
                    midActive: false,
                    midLevel: null
                });

                if (protocolText) {
                    plan = protocolText.split('<br><br>');
                }

                rootRec.mixtone = calcMixtone(tLevel, tDir, rootRec.process, rootRec.mass, "здоровые");
                lenRec.mixtone = calcMixtone(tLevel, tDir, lenRec.process, lenRec.mass, condition);

                let specialBlondBase6NeedsConfirmation =
                    (rLevel === 6 && rootRec && String(rootRec.process).includes("Special Blond")) ||
                    (lLevel === 6 && lenRec && String(lenRec.process).includes("Special Blond"));

                if (specialBlondBase6NeedsConfirmation) {
                    warnings.push("⚠️ SPECIAL BLOND З БАЗИ 6: Потрібне підтвердження технології бренду або рішення майстра. Не вважати безумовно безпечним approved-рецептом.");
                    manualDecisions.push({
                        title: "Special Blond з бази 6",
                        message: "Підтвердити технологію бренду або рішення майстра перед виконанням рецепта."
                    });
                }

                let significantDarkeningNeedsPrepig =
                    (rLevel >= 9 && (rLevel - tLevel) >= 3) ||
                    (lLevel >= 9 && (lLevel - tLevel) >= 3);

                if (significantDarkeningNeedsPrepig) {
                    warnings.push("⚠️ ЗНАЧНЕ ЗАТЕМНЕННЯ ЗІ СВІТЛОЇ БАЗИ: Потрібне ручне рішення щодо передпігментації або заповнення пігменту перед виконанням рецепта.");
                    manualDecisions.push({
                        title: "Передпігментація / заповнення пігменту",
                        message: "Підтвердити, як буде заповнений відсутній пігмент при затемненні на 3+ рівні зі світлої бази."
                    });
                }

                const state = buildWwwRenderState({
                    status: manualDecisions.length > 0 ? 'MANUAL_REQUIRED' : 'APPROVED',
                    target: `${tLevel}.${tDir}`,
                    manualDecisions,
                    warnings,
                    diagnostics,
                    rootRec,
                    midRec: null,
                    lenRec,
                    plan,
                    protocolText,
                    mixtoneInfo: { root: rootRec.mixtone, length: lenRec.mixtone },
                    massModel: { baseMass, densityMultiplier: denMult, totalMass, rootMass: rMass, lengthMass: lMass },
                    timingInfo: { totalMinutes: timing, modifierMinutes: tMod },
                    reasons: { rootStep: rStep, lengthStep: lStep, hotRoot, grey, specialBlondBase6NeedsConfirmation, significantDarkeningNeedsPrepig }
                });
                document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
            } catch (e) {
                document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml({
                    status: 'FATAL_ERROR',
                    error: e
                });
            }
        }
