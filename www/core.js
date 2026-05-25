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
                    ends_level: this.getWwwValue('ends_level'),
                    ends_condition: this.getWwwValue('ends_condition'),
                    ends_history: this.getWwwValue('ends_history'),
                    ends_base_type: this.getWwwValue('ends_base_type'),
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
                    endsLevel: toIntegerOrNull(wwwValues.ends_level),
                    endsCondition: String(wwwValues.ends_condition || '').trim(),
                    endsHistory: String(wwwValues.ends_history || '').trim(),
                    endsBaseType: String(wwwValues.ends_base_type || '').trim(),
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

        function buildMassModel(length, density) {
            const baseLookup = { 'короткие': 30, 'средние': 60, 'длинные': 120 };
            const densityLookup = { 'редкие': 0.7, 'средние': 1.0, 'густые': 1.5 };
            const baseMass = baseLookup[length];
            const densityMultiplier = densityLookup[density] !== undefined ? densityLookup[density] : 1.0;
            if (baseMass === undefined || baseMass === null) {
                // Захист від тихого NaN: якщо length невідомий, повернути null.
                // Виклик-код має обробляти null і додавати diagnostic.
                return null;
            }
            const totalMass = Math.round(baseMass * densityMultiplier);
            const rootMass = Math.round(totalMass * 0.3);
            const lengthMass = totalMass - rootMass; // залишок, уникає double-round drift
            return {
                baseMass,
                densityMultiplier,
                totalMass,
                rootMass,
                lengthMass,
                endsMass: null,
                mode: '2-zone'
            };
        }

        /**
         * buildThreeZoneMassCandidate(length, density, split)
         *
         * INACTIVE HELPER — для майбутньої 3-zone guard-фази.
         * НЕ викликається з calculateProtocol().
         * НЕ активує endsRec, не змінює production behavior.
         * НЕ впливає на buildMassModel() або 2-zone runtime.
         * Використовувати тільки після окремої фази guard-валідації ends.
         *
         * @param {string} length   - 'короткие' | 'средние' | 'длинные'
         * @param {string} density  - 'редкие' | 'средние' | 'густые'
         * @param {{ rootPct: number, lengthPct: number, endsPct: number }} split
         * @returns {{ baseMass, densityMultiplier, totalMass, rootMass, lengthMass, endsMass, mode, split } | null}
         */
        function buildThreeZoneMassCandidate(length, density, split) {
            if (!split || typeof split.rootPct !== 'number' || typeof split.endsPct !== 'number') {
                return null;
            }

            const base = buildMassModel(length, density);
            if (!base) return null;

            const { totalMass } = base;
            const rootMass = Math.round(totalMass * split.rootPct);
            const endsMass = Math.round(totalMass * split.endsPct);
            const lengthMass = totalMass - rootMass - endsMass; // remainder — уникає double-round drift

            if (lengthMass < 0) return null; // sanity guard

            return {
                baseMass: base.baseMass,
                densityMultiplier: base.densityMultiplier,
                totalMass,
                rootMass,
                lengthMass,
                endsMass,
                mode: '3-zone',
                split
            };
        }

        /**
         * classifyThreeZoneActivation(input)
         *
         * PRODUCTION HELPER — Production 3-zone activation gate.
         * Pure function. НЕ викликається з calculateProtocol().
         */
        
        function classifyEndsRecEligibility(context) {
            const ends_level = context.ends_level;
            const ends_condition = context.ends_condition;
            const ends_history = context.ends_history;
            const ends_base_type = context.ends_base_type;
            const target_level = context.target_level;
            const length_level = context.length_level;

            const missing = [];
            if (typeof ends_level !== 'number') missing.push('ends_level');
            if (!ends_condition) missing.push('ends_condition');
            if (!ends_history) missing.push('ends_history');
            if (!ends_base_type) missing.push('ends_base_type');
            if (typeof target_level !== 'number') missing.push('target_level');

            const eCond = String(ends_condition || '').toLowerCase();
            const eHist = String(ends_history || '').toLowerCase();
            const eBase = String(ends_base_type || '').toLowerCase();

            const isDamaged = ['пористі', 'ламкі', 'сильно пошкоджені', 'критично пошкоджені', 'porous', 'brittle', 'damaged', 'critical'].some(c => eCond.includes(c));
            const isBrittle = ['ламкі', 'сильно пошкоджені', 'критично пошкоджені', 'brittle', 'critical', 'damaged'].some(c => eCond.includes(c));
            const isUnknownHistory = eHist.includes('невідома') || eHist === 'unknown';
            const isCosmeticHistory = ['косметичний', 'косметична', 'cosmetic', 'dark cosmetic', 'темний косметичний', 'remover', 'змивка'].some(c => eHist.includes(c));
            const isHennaMetals = eHist.includes('хна') || eHist.includes('henna_metals') || eHist.includes('метали');
            const isCosmeticBase = ['косметична', 'змішана', 'cosmetic', 'mixed'].some(c => eBase.includes(c));
            const isNaturalBase = ['натуральна', 'natural'].some(c => eBase.includes(c));

            const needsLift = target_level > ends_level;
            const isCosmeticLift = needsLift && (isCosmeticHistory || isCosmeticBase);
            const isDamagedLift = needsLift && isDamaged;
            
            if (isHennaMetals) {
                return { status: "BLOCKED", reason: "Henna or metals present", requiredFieldsMissing: missing, riskFlags: ["henna_metals"], allowedProcess: null };
            }
            if (isCosmeticLift) {
                return { status: "BLOCKED", reason: "Cannot lift cosmetic pigment", requiredFieldsMissing: missing, riskFlags: ["cosmetic_lift"], allowedProcess: null };
            }
            if (isDamagedLift || (needsLift && isBrittle)) {
                return { status: "BLOCKED", reason: "Cannot lift damaged ends", requiredFieldsMissing: missing, riskFlags: ["damaged_lift"], allowedProcess: null };
            }
            if (eHist.includes('змивка') || eHist.includes('remover')) {
                return { status: "BLOCKED", reason: "After remover", requiredFieldsMissing: missing, riskFlags: ["after_remover"], allowedProcess: null };
            }
            
            if (missing.length > 0) {
                return { status: "MANUAL_REQUIRED", reason: "Missing critical fields", requiredFieldsMissing: missing, riskFlags: ["missing_fields"], allowedProcess: null };
            }
            if (isUnknownHistory) {
                return { status: "MANUAL_REQUIRED", reason: "Unknown ends history", requiredFieldsMissing: [], riskFlags: ["unknown_history"], allowedProcess: null };
            }
            if (length_level !== undefined && length_level !== null) {
                if ((target_level > ends_level && target_level < length_level) || (target_level < ends_level && target_level > length_level)) {
                    return { status: "MANUAL_REQUIRED", reason: "Target between length and ends", requiredFieldsMissing: [], riskFlags: ["ambiguous_target"], allowedProcess: null };
                }
            }
            if (ends_level >= 9 && (ends_level - target_level) >= 3) {
                return { status: "MANUAL_REQUIRED", reason: "Significant darkening requires prepigmentation", requiredFieldsMissing: [], riskFlags: ["prepig_required"], allowedProcess: null };
            }
            if (isDamaged) {
                return { status: "MANUAL_REQUIRED", reason: "Porous/damaged ends need manual assessment", requiredFieldsMissing: [], riskFlags: ["damaged_ends"], allowedProcess: null };
            }

            if (!needsLift && !isDamaged && !isCosmeticHistory && isNaturalBase) {
                return { status: "SAFE_FOR_TONING", reason: "Low risk toning", requiredFieldsMissing: [], riskFlags: [], allowedProcess: "toning" };
            }

            return { status: "MANUAL_REQUIRED", reason: "Fallback manual assessment", requiredFieldsMissing: [], riskFlags: ["fallback"], allowedProcess: null };
        }

        function buildEndsRecCandidatePreview(context) {
            const normalizedContext = Object.assign({}, context, {
                ends_level: typeof context.ends_level === 'string' && context.ends_level.trim() !== '' ? Number(context.ends_level) : context.ends_level,
                target_level: typeof context.target_level === 'string' && context.target_level.trim() !== '' ? Number(context.target_level) : context.target_level,
                length_level: typeof context.length_level === 'string' && context.length_level.trim() !== '' ? Number(context.length_level) : context.length_level,
                root_level: typeof context.root_level === 'string' && context.root_level.trim() !== '' ? Number(context.root_level) : context.root_level
            });
            const eligibility = classifyEndsRecEligibility(normalizedContext);
            
            let decisionStr = 'UNKNOWN';
            if (typeof context.threeZoneGateDecision === 'string') {
                decisionStr = context.threeZoneGateDecision;
            } else if (context.threeZoneGateDecision && context.threeZoneGateDecision.decision) {
                decisionStr = context.threeZoneGateDecision.decision;
            } else {
                const computed = classifyThreeZoneActivation(normalizedContext);
                decisionStr = computed ? computed.decision : 'UNKNOWN';
            }

            if (eligibility.status !== 'SAFE_FOR_TONING') return null;
            if (decisionStr !== 'ALLOW_3_ZONE') return null;
            if (!context.threeZoneCandidateMassModel) return null;
            if (context.threeZonePreviewOnly !== true) return null;
            if (context.threeZoneEndsRecipeReady !== false) return null;

            return {
                zone: 'ends',
                candidateOnly: true,
                productionReady: false,
                previewOnly: true,
                source: 'endsRecEligibility',
                eligibilityStatus: eligibility.status,
                allowedProcess: eligibility.allowedProcess || null,
                massPreview: {
                    endsMass: typeof context.threeZoneCandidateMassModel.endsMass === 'number' ? context.threeZoneCandidateMassModel.endsMass : null,
                    source: 'threeZoneCandidateMassModel',
                    notForMixing: true
                },
                formulaPreview: {
                    type: 'process_description',
                    description: 'Diagnostic preview only. No ready-to-mix formula is provided.',
                    notForMixing: true
                },
                recommendedOxidizerPercentPreview: 'low-oxidizer-preview-only',
                timingPreview: {
                    description: 'Diagnostic preview only for ends evaluation. Not production-ready.'
                },
                warnings: [
                    '⚠️ ДІАГНОСТИКА: Створено попередній endsRecCandidate для оцінки кінців. Це не production рецепт і не інструкція для змішування. Поточний протокол залишається 2-зонним.'
                ],
                reason: eligibility.reason,
                safetyStatus: 'diagnostic-preview'
            };
        }

        function validateProductionEndsRecReadiness(context) {
            const input = context || {};
            const normalizedContext = Object.assign({}, input, {
                ends_level: typeof input.ends_level === 'string' && input.ends_level.trim() !== '' ? Number(input.ends_level) : input.ends_level,
                target_level: typeof input.target_level === 'string' && input.target_level.trim() !== '' ? Number(input.target_level) : input.target_level,
                length_level: typeof input.length_level === 'string' && input.length_level.trim() !== '' ? Number(input.length_level) : input.length_level,
                root_level: typeof input.root_level === 'string' && input.root_level.trim() !== '' ? Number(input.root_level) : input.root_level
            });
            const gate = classifyThreeZoneActivation(normalizedContext);
            const eligibility = classifyEndsRecEligibility(normalizedContext);
            const candidate = input.endsRecCandidatePreview || null;

            function hasOwn(target, key) {
                return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
            }

            function candidateHasNotForMixingFlag(candidatePreview) {
                return Boolean(candidatePreview && (
                    candidatePreview.notForMixing === true ||
                    (candidatePreview.massPreview && candidatePreview.massPreview.notForMixing === true) ||
                    (candidatePreview.formulaPreview && candidatePreview.formulaPreview.notForMixing === true)
                ));
            }

            function candidateSummary(candidatePreview) {
                if (!candidatePreview) return null;
                return {
                    zone: candidatePreview.zone || null,
                    candidateOnly: candidatePreview.candidateOnly === true,
                    previewOnly: candidatePreview.previewOnly === true,
                    notForMixing: candidateHasNotForMixingFlag(candidatePreview),
                    productionReady: candidatePreview.productionReady === true,
                    eligibilityStatus: candidatePreview.eligibilityStatus || null,
                    hasDyeMass: hasOwn(candidatePreview, 'dyeMass'),
                    hasOxidizerMass: hasOwn(candidatePreview, 'oxidizerMass'),
                    hasEndsFormula: hasOwn(candidatePreview, 'endsFormula')
                };
            }

            function result(status, reasonCode, reasons, candidatePreview) {
                const ready = status === 'READY';
                return {
                    ready,
                    status,
                    reasonCode,
                    reasons: reasons.filter(Boolean),
                    candidateSummary: candidateSummary(candidatePreview),
                    productionAllowed: ready,
                    productionBlocked: !ready
                };
            }

            const gateDecision = gate && gate.decision ? gate.decision : 'UNKNOWN';
            if (gateDecision === 'KEEP_2_ZONE') {
                return result('NOT_READY', 'THREE_ZONE_KEEP_2_ZONE', [gate.reason], candidate);
            }
            if (gateDecision === 'MANUAL_REQUIRED') {
                return result('MANUAL_REQUIRED', 'THREE_ZONE_MANUAL_REQUIRED', [gate.reason], candidate);
            }
            if (gateDecision === 'BLOCKED') {
                return result('BLOCKED', 'THREE_ZONE_BLOCKED', [gate.reason], candidate);
            }
            if (gateDecision !== 'ALLOW_3_ZONE') {
                return result('NOT_READY', 'THREE_ZONE_NOT_ALLOWED', [gate.reason || gateDecision], candidate);
            }

            const eligibilityStatus = eligibility && eligibility.status ? eligibility.status : 'UNKNOWN';
            if (eligibilityStatus === 'BLOCKED') {
                return result('BLOCKED', 'ENDSREC_ELIGIBILITY_BLOCKED', [eligibility.reason], candidate);
            }
            if (eligibilityStatus === 'MANUAL_REQUIRED') {
                return result('MANUAL_REQUIRED', 'ENDSREC_ELIGIBILITY_MANUAL_REQUIRED', [eligibility.reason], candidate);
            }
            if (eligibilityStatus !== 'SAFE_FOR_TONING') {
                return result('NOT_READY', 'ENDSREC_ELIGIBILITY_NOT_SAFE', [eligibility.reason || eligibilityStatus], candidate);
            }

            if (!candidate) {
                return result('NOT_READY', 'NO_ENDSREC_CANDIDATE_PREVIEW', ['endsRecCandidatePreview missing'], candidate);
            }
            if (candidate.productionReady === true) {
                return result('BLOCKED', 'CANDIDATE_PRODUCTION_READY_TRUE', ['candidate productionReady must remain false in readiness phase'], candidate);
            }

            const missingFlags = [];
            if (candidate.candidateOnly !== true) missingFlags.push('candidateOnly');
            if (candidate.previewOnly !== true) missingFlags.push('previewOnly');
            if (!candidateHasNotForMixingFlag(candidate)) missingFlags.push('notForMixing');
            if (candidate.productionReady !== false) missingFlags.push('productionReady_false');
            if (missingFlags.length > 0) {
                return result('NOT_READY', 'CANDIDATE_MISSING_SAFETY_FLAGS', missingFlags, candidate);
            }

            const hasProductionFields = hasOwn(candidate, 'dyeMass') || hasOwn(candidate, 'oxidizerMass') || hasOwn(candidate, 'endsFormula');
            if (hasProductionFields) {
                return result('BLOCKED', 'CANDIDATE_HAS_PRODUCTION_FIELDS', ['candidate must not contain production dyeMass, oxidizerMass, or endsFormula'], candidate);
            }
            if (input.massModel && typeof input.massModel.endsMass === 'number') {
                return result('BLOCKED', 'MASSMODEL_ENDSMASS_ALREADY_SET', ['production massModel.endsMass must not be allocated'], candidate);
            }

            return result('READY', 'READY_LOW_RISK_TONING_CANDIDATE', [gate.reason, eligibility.reason], candidate);
        }

        /**
         * buildProductionEndsRec(context, readiness)
         *
         * INACTIVE HELPER. Builds only a production endsRec skeleton after a
         * separate readiness validator has returned READY. This helper is not
         * called from calculateProtocol() and does not allocate mass or formula.
         */
        function buildProductionEndsRec(context, readiness) {
            const state = readiness || {};
            const candidateSource = state.candidateSummary || state.candidateRef || null;

            function normalizeReasons(reasons, fallback) {
                const list = Array.isArray(reasons) ? reasons.slice() : [];
                if (fallback) list.push(fallback);
                return list.filter(Boolean);
            }

            function blockedResult(status, reasonCode, reasons) {
                return {
                    created: false,
                    status,
                    reasonCode,
                    reasons: normalizeReasons(reasons, reasonCode),
                    endsRec: null
                };
            }

            function hasOwn(target, key) {
                return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
            }

            function sourceCandidateSummary(candidate) {
                if (!candidate) return null;
                return {
                    zone: candidate.zone || null,
                    eligibilityStatus: candidate.eligibilityStatus || null
                };
            }

            if (state.status === 'BLOCKED') {
                return blockedResult('BLOCKED', state.reasonCode || 'READINESS_BLOCKED', state.reasons);
            }
            if (state.status === 'MANUAL_REQUIRED') {
                return blockedResult('MANUAL_REQUIRED', state.reasonCode || 'READINESS_MANUAL_REQUIRED', state.reasons);
            }
            if (!candidateSource) {
                return blockedResult('NO_CANDIDATE', state.reasonCode || 'NO_CANDIDATE_SUMMARY_OR_REF', state.reasons);
            }
            if (state.ready !== true || state.status !== 'READY' || state.productionAllowed !== true) {
                return blockedResult('NOT_READY', state.reasonCode || 'READINESS_NOT_READY', state.reasons);
            }
            if (state.productionBlocked !== false) {
                return blockedResult('BLOCKED', state.reasonCode || 'READINESS_PRODUCTION_BLOCKED', state.reasons);
            }
            if (
                candidateSource.hasDyeMass === true ||
                candidateSource.hasOxidizerMass === true ||
                candidateSource.hasEndsFormula === true ||
                hasOwn(candidateSource, 'dyeMass') ||
                hasOwn(candidateSource, 'oxidizerMass') ||
                hasOwn(candidateSource, 'endsMass') ||
                hasOwn(candidateSource, 'endsFormula')
            ) {
                return blockedResult('BLOCKED', 'CANDIDATE_HAS_PRODUCTION_FIELDS', state.reasons);
            }

            const reasonCode = state.reasonCode || 'READY_LOW_RISK_TONING_CANDIDATE';
            return {
                created: true,
                status: 'CREATED',
                reasonCode,
                reasons: normalizeReasons(state.reasons, reasonCode),
                endsRec: {
                    productionReady: true,
                    endsRecipeReady: false,
                    source: 'endsRecCandidatePreview',
                    sourceCandidateSummary: sourceCandidateSummary(candidateSource),
                    safetyReasonCodes: [reasonCode].filter(Boolean)
                }
            };
        }

        /**
         * classifyProductionEndsRecFormulaContract(context, readiness, builderResult)
         *
         * INACTIVE HELPER. Classifies the future production endsRec formula
         * contract. It does not create formula fields, grams, mass allocation,
         * or runtime output, and it is not called from calculateProtocol().
         */
        function classifyProductionEndsRecFormulaContract(context, readiness, builderResult) {
            const state = readiness || {};
            const build = builderResult || {};
            const endsRec = build.endsRec || null;

            function cloneList(values) {
                return Array.isArray(values) ? values.slice().filter(Boolean) : [];
            }

            function result(formulaStatus, reasonCode, overrides) {
                const options = overrides || {};
                return {
                    formulaStatus,
                    formulaType: options.formulaType || 'NONE',
                    targetAction: options.targetAction || (formulaStatus === 'BLOCKED' ? 'block' : 'manual_review'),
                    allowedProductClass: Array.isArray(options.allowedProductClass) ? options.allowedProductClass.slice() : [],
                    forbiddenProductClass: Array.isArray(options.forbiddenProductClass) ? options.forbiddenProductClass.slice() : [],
                    safetyReasonCodes: cloneList(options.safetyReasonCodes),
                    manualRequiredReasonCodes: cloneList(options.manualRequiredReasonCodes),
                    reasonCode,
                    formulaReady: formulaStatus === 'FORMULA_CONTRACT_READY'
                };
            }

            if (state.status === 'MANUAL_REQUIRED') {
                const reasonCode = state.reasonCode || 'READINESS_MANUAL_REQUIRED';
                return result('MANUAL_REQUIRED', reasonCode, {
                    manualRequiredReasonCodes: [reasonCode]
                });
            }
            if (state.status === 'BLOCKED' || state.productionBlocked === true) {
                return result('BLOCKED', state.reasonCode || 'READINESS_BLOCKED');
            }
            if (state.ready !== true || state.status !== 'READY') {
                return result('NOT_READY', state.reasonCode || 'READINESS_NOT_READY');
            }
            if (build.created !== true || build.status !== 'CREATED') {
                return result('NOT_READY', build.reasonCode || 'BUILDER_NOT_CREATED');
            }
            if (!endsRec || endsRec.productionReady !== true) {
                return result('NOT_READY', 'ENDSREC_NOT_PRODUCTION_READY');
            }
            if (endsRec.endsRecipeReady === true) {
                return result('BLOCKED', 'ENDSRECIPE_READY_TRUE_SUSPICIOUS');
            }

            return result('FORMULA_CONTRACT_READY', 'FORMULA_TONING_ONLY_ALLOWED', {
                formulaType: 'TONING_ONLY',
                targetAction: 'tone_ends',
                allowedProductClass: ['low_oxidizer_toning'],
                forbiddenProductClass: ['lightening_powder', 'high_lift', 'permanent_lift'],
                safetyReasonCodes: cloneList(state.reasons).concat(cloneList(endsRec.safetyReasonCodes))
            });
        }

        /**
         * classifyProductionEndsRecMassAllocationContract(context, readiness, builderResult, formulaContract)
         *
         * INACTIVE HELPER. Classifies the future production endsRec mass allocation
         * contract. It does not allocate mass, dyeMass, oxidizerMass, or exact grams,
         * and it is not called from calculateProtocol().
         */
        function classifyProductionEndsRecMassAllocationContract(context, readiness, builderResult, formulaContract) {
            const state = readiness || {};
            const build = builderResult || {};
            const formula = formulaContract || {};
            const endsRec = build.endsRec || null;

            function cloneList(values) {
                return Array.isArray(values) ? values.slice().filter(Boolean) : [];
            }

            function result(massStatus, reasonCode, overrides = {}) {
                return Object.assign({
                    massReady: massStatus === 'READY',
                    massStatus,
                    allowedMassCalculation: massStatus === 'READY',
                    estimatedEndsShare: null,
                    sourceMassModelRef: "threeZoneCandidateMassModel",
                    safetyReasonCodes: [],
                    manualRequiredReasonCodes: [],
                    reasonCode
                }, overrides);
            }

            if (state.status === 'BLOCKED' || state.productionBlocked === true) {
                return result('BLOCKED', state.reasonCode || 'READINESS_BLOCKED');
            }
            if (state.status === 'MANUAL_REQUIRED') {
                return result('MANUAL_REQUIRED', state.reasonCode || 'READINESS_MANUAL_REQUIRED', {
                    manualRequiredReasonCodes: [state.reasonCode || 'READINESS_MANUAL_REQUIRED']
                });
            }
            if (state.ready !== true || state.status !== 'READY') {
                return result('NOT_READY', state.reasonCode || 'READINESS_NOT_READY');
            }
            if (build.created !== true || build.status !== 'CREATED') {
                return result('NO_BUILDER', build.reasonCode || 'BUILDER_NOT_CREATED');
            }
            if (!endsRec || endsRec.productionReady !== true) {
                return result('NO_ENDSREC', 'ENDSREC_NOT_PRODUCTION_READY');
            }
            if (formula.formulaReady !== true) {
                return result('NO_FORMULA', formula.reasonCode || 'FORMULA_NOT_READY');
            }
            if (endsRec.endsRecipeReady === true) {
                return result('BLOCKED', 'ENDSRECIPE_READY_TRUE_SUSPICIOUS');
            }

            return result('READY', 'MASS_CANDIDATE_ALLOWED_PRODUCTION_GRAMS_PENDING', {
                safetyReasonCodes: cloneList(state.reasons).concat(cloneList(endsRec.safetyReasonCodes)).concat(cloneList(formula.safetyReasonCodes))
            });
        }

        /**
         * assembleProductionEndsRecContract(context, readiness, builderResult, formulaContract, massAllocation)
         *
         * INACTIVE HELPER. Assembles the final production endsRec candidate object
         * from readiness, builder, formula, and mass allocation contracts.
         * It does not activate the recipe (endsRecipeReady remains false) and does
         * not perform any wiring, exact gram calculations, or runtime mutations.
         */
        function assembleProductionEndsRecContract(context, readiness, builderResult, formulaContract, massAllocation) {
            const state = readiness || {};
            const build = builderResult || {};
            const formula = formulaContract || {};
            const mass = massAllocation || {};
            const endsRec = build.endsRec || null;

            function cloneList(values) {
                return Array.isArray(values) ? values.slice().filter(Boolean) : [];
            }

            const isReady = state.ready === true;
            const isBuilderCreated = build.created === true;
            const isFormulaReady = formula.formulaReady === true;
            const isMassReady = mass.massReady === true;
            const hasProductionReadySkeleton = Boolean(endsRec && endsRec.productionReady === true);
            const hasEndsRecipeNotReady = Boolean(endsRec && endsRec.endsRecipeReady === false);

            const isBlocked = state.status === 'BLOCKED' ||
                              build.status === 'BLOCKED' ||
                              formula.formulaStatus === 'BLOCKED' ||
                              mass.massStatus === 'BLOCKED';

            const isManual = state.status === 'MANUAL_REQUIRED' ||
                             build.status === 'MANUAL_REQUIRED' ||
                             formula.formulaStatus === 'MANUAL_REQUIRED' ||
                             mass.massStatus === 'MANUAL_REQUIRED';

            const canAssemble = isReady && isBuilderCreated && isFormulaReady && isMassReady &&
                                hasProductionReadySkeleton && hasEndsRecipeNotReady && !isBlocked && !isManual;

            let assemblyStatus = 'NOT_READY';
            if (isBlocked) {
                assemblyStatus = 'BLOCKED';
            } else if (isManual) {
                assemblyStatus = 'MANUAL_REQUIRED';
            } else if (canAssemble) {
                assemblyStatus = 'READY';
            }

            const safetyReasonCodes = [];
            if (state.reasons) safetyReasonCodes.push(...state.reasons);
            if (endsRec && endsRec.safetyReasonCodes) {
                safetyReasonCodes.push(...endsRec.safetyReasonCodes);
            }
            if (formula.safetyReasonCodes) safetyReasonCodes.push(...formula.safetyReasonCodes);
            if (mass.safetyReasonCodes) safetyReasonCodes.push(...mass.safetyReasonCodes);

            const manualRequiredReasonCodes = [];
            if (state.status === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('READINESS_MANUAL');
            if (build.status === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('BUILDER_MANUAL');
            if (formula.formulaStatus === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('FORMULA_MANUAL');
            if (mass.massStatus === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('MASS_MANUAL');

            let productionEndsRecCandidate = null;
            if (canAssemble) {
                productionEndsRecCandidate = {
                    zone: 'ends',
                    productionReady: true,
                    endsRecipeReady: false, // Must remain false (no grams calculated yet)
                    formulaReady: true,
                    massReady: true,
                    sourceRefs: {
                        readinessReasonCode: state.reasonCode || null,
                        builderStatus: build.status || null,
                        formulaType: formula.formulaType || null,
                        massStatus: mass.massStatus || null
                    },
                    safetyReasonCodes: safetyReasonCodes,
                    manualRequiredReasonCodes: manualRequiredReasonCodes
                };
            }

            return {
                assembled: canAssemble,
                assemblyStatus,
                productionEndsRecCandidate,
                sourceRefs: {
                    readinessReasonCode: state.reasonCode || null,
                    builderStatus: build.status || null,
                    formulaType: formula.formulaType || null,
                    massStatus: mass.massStatus || null
                },
                safetyReasonCodes: safetyReasonCodes,
                manualRequiredReasonCodes: manualRequiredReasonCodes
            };
        }

        function classifyThreeZoneActivation(input) {
            const { ends_level, length_level, root_level, ends_condition, ends_history, ends_base_type, target_level } = input;
            
            if (!ends_level || ends_level === length_level) {
                return {
                    decision: 'KEEP_2_ZONE', reason: 'ENDS_SAME_AS_LENGTH',
                    warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
                };
            }
            
            const missing = [];
            if (!ends_condition) missing.push('ends_condition');
            if (!ends_history) missing.push('ends_history');
            if (!ends_base_type) missing.push('ends_base_type');
            
            if (missing.length > 0) {
                return {
                    decision: 'MANUAL_REQUIRED', reason: 'MISSING_FIELDS',
                    warnings: [], requiredFields: ['ends_condition', 'ends_history', 'ends_base_type'], missingFields: missing, mode: '3-zone-gate-only'
                };
            }

            const blockedHistory = ['unknown', 'cosmetic', 'темний косметичний пігмент', 'dark cosmetic', 'remover', 'змивка', 'henna_metals', 'хна/метали'];
            if (blockedHistory.includes(ends_history)) {
                return {
                    decision: 'BLOCKED', reason: 'BLOCKED_HISTORY',
                    warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
                };
            }

            if ((ends_base_type === 'cosmetic' || ends_base_type === 'mixed' || ends_base_type === 'unknown' || ends_base_type === 'косметична' || ends_base_type === 'змішана/нерівномірна') && target_level > ends_level) {
                return {
                    decision: 'BLOCKED', reason: 'COSMETIC_LIFT_RISK',
                    warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
                };
            }

            const damagedCondition = ['porous', 'brittle', 'damaged', 'critical', 'пористі', 'ламкі', 'сильно пошкоджені', 'критично пошкоджені'];
            if (damagedCondition.includes(ends_condition)) {
                return {
                    decision: 'MANUAL_REQUIRED', reason: 'DAMAGED_CONDITION',
                    warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
                };
            }
            
            if (target_level !== undefined && target_level !== null) {
                if ((target_level > ends_level && target_level < length_level) ||
                    (target_level < ends_level && target_level > length_level)) {
                    return {
                        decision: 'MANUAL_REQUIRED', reason: 'TARGET_BETWEEN_ZONES',
                        warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
                    };
                }
            }

            if ((ends_condition === 'healthy' || ends_condition === 'normal' || ends_condition === 'здорові' || ends_condition === 'нормальні') && 
                (ends_history === 'natural' || ends_history === 'clear' || ends_history === 'none' || ends_history === 'натуральна' || ends_history === 'чиста') && 
                (ends_base_type === 'natural' || ends_base_type === 'натуральна')) {
                return {
                    decision: 'ALLOW_3_ZONE', reason: 'HEALTHY_NATURAL',
                    warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
                };
            }

            return {
                decision: 'MANUAL_REQUIRED', reason: 'FALLBACK',
                warnings: [], requiredFields: [], missingFields: [], mode: '3-zone-gate-only'
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
                const endsLevelElement = document.getElementById('ends_level');
                const endsLevelRaw = endsLevelElement ? String(endsLevelElement.value).trim() : '';
                let eLevel = endsLevelRaw ? parseInt(endsLevelRaw) : null;
                const endsConditionElement = document.getElementById('ends_condition');
                const endsCondition = endsConditionElement ? String(endsConditionElement.value).trim() : '';
                const endsHistoryElement = document.getElementById('ends_history');
                const endsHistory = endsHistoryElement ? String(endsHistoryElement.value).trim() : '';
                const endsBaseTypeElement = document.getElementById('ends_base_type');
                const endsBaseType = endsBaseTypeElement ? String(endsBaseTypeElement.value).trim() : '';
                let bType = document.getElementById('base_type').value;
                
                let tLevel = parseInt(document.getElementById('target_level').value);
                let tDir = document.getElementById('target_direction').value;

                let alerts = [], warnings = [], diagnostics = [], manualDecisions = [];
                const missingCriticalFields = [];
                if (!Number.isFinite(rLevel)) missingCriticalFields.push("поточний рівень кореня");
                if (!Number.isFinite(lLevel)) missingCriticalFields.push("поточний рівень довжини");
                if (!Number.isFinite(tLevel)) missingCriticalFields.push("бажаний рівень");
                if (!String(history || '').trim()) missingCriticalFields.push("історія фарбування");
                if (!String(bType || '').trim()) missingCriticalFields.push("тип бази");
                if (!String(condition || '').trim()) missingCriticalFields.push("стан волосся");

                if (missingCriticalFields.length > 0) {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: Number.isFinite(tLevel) ? `${tLevel}.${tDir}` : 'не визначено',
                        blockers: [
                            `Недостатньо критичних даних для безпечного рецепта: ${missingCriticalFields.join(', ')}.`
                        ],
                        warnings: [
                            "Фінальний рецепт не може бути підтверджений без заповнення критичних полів."
                        ],
                        diagnostics: [
                            "Заповніть поточний рівень, бажаний рівень, історію, тип бази та стан волосся перед розрахунком."
                        ],
                        reasons: {
                            insufficient_data: true,
                            missingCriticalFields
                        }
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }

                if (history === 'хна / металл' && ['пористі', 'сильно поврежденные'].includes(condition)) alerts.push("ФАТАЛЬНО: Хна/метали на пошкодженому волоссі. Оксиданти заборонені.");
                if (condition === 'сильно поврежденные') warnings.push("⚠️ КРИТИЧНИЙ СТАН: Блондування порошком ЗАБОРОНЕНО. Тільки пастельне тонування.");
                
                if (grey > 0) {
                    if (greyType === 'стекловидная') diagnostics.push("Скловидна сивина. Потрібен мордонсаж.");
                }

                let tMod = 0;
                if (thickness === 'тонкие') { diagnostics.push("Тонке волосся. Час витримки скорочено."); tMod = -10; }
                if (thickness === 'толстые') { diagnostics.push("Товсте волосся. Час витримки збільшено."); tMod = 10; }
                if (condition === 'пористі') diagnostics.push("Пористе волосся. Тонування під жорстким візуальним контролем.");

                let massModel = buildMassModel(length, density);
                if (!massModel) {
                    diagnostics.push(`Невідома довжина волосся: "${length}". Масу визначити вручну.`);
                    massModel = { baseMass: null, densityMultiplier: null, totalMass: 60, rootMass: 18, lengthMass: 42, endsMass: null, mode: '2-zone-fallback' };
                }
                let baseMass = massModel.baseMass;
                let denMult = massModel.densityMultiplier;
                let totalMass = massModel.totalMass;

                const historyText = String(history || '').toLowerCase();
                const baseTypeText = String(bType || '').toLowerCase();
                const darkestCurrentLevel = Math.min(rLevel, lLevel);
                const blackOrDarkHistory = historyText.includes('чорн')
                    || historyText.includes('черн')
                    || historyText.includes('black')
                    || historyText.includes('темн');
                const cosmeticBase = baseTypeText.includes('космет');
                const blackExitNeedsDiagnostics = cosmeticBase
                    && blackOrDarkHistory
                    && darkestCurrentLevel <= 4
                    && tLevel > darkestCurrentLevel;

                if (blackExitNeedsDiagnostics) {
                    warnings.push("⚠️ ВИХІД З ЧОРНОГО / ТЕМНОГО КОСМЕТИЧНОГО ПІГМЕНТУ: потрібна додаткова діагностика нашарувань, змивок, фону освітлення, стану полотна та тест-пасмо.");
                    manualDecisions.push({
                        title: "Вихід з чорного / темного косметичного пігменту",
                        message: "Уточнити кількість нашарувань, кислотні або лужні змивки, поточний фон освітлення, стан полотна та результат тест-пасма перед виконанням рецепта."
                    });
                }

                if (alerts.length > 0) {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: `${tLevel}.${tDir}`,
                        blockers: alerts,
                        warnings,
                        diagnostics,
                        massModel: massModel
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }

                let rStep = tLevel - rLevel;
                let lStep = tLevel - lLevel;
                let rMass = massModel.rootMass;
                let lMass = massModel.lengthMass;
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
                    // Синхронізуємо massModel.rootMass після powder surcharge.
                    // massModel.rootMass відображає фактичну масу рецепта (post-surcharge).
                    massModel = Object.assign({}, massModel, { rootMass: rMass });
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

                const zoneLevelDifference = Math.abs(rLevel - lLevel);
                const rootProcess = rootRec ? String(rootRec.process || '') : '';
                const lengthProcess = lenRec ? String(lenRec.process || '') : '';
                const zoneProcessesDiffer = rootProcess !== lengthProcess;
                const endsLevelProvided = Number.isFinite(eLevel);
                const endsDiffersFromRoot = endsLevelProvided && eLevel !== rLevel;
                const endsDiffersFromLength = endsLevelProvided && eLevel !== lLevel;
                const endsLevelNeedsConfirmation = endsDiffersFromRoot || endsDiffersFromLength;
                const endsConditionText = String(endsCondition || '').toLowerCase();
                const endsConditionProvided = Boolean(endsConditionText);
                const riskyEndsCondition = ['пористі', 'ламкі', 'сильно пошкоджені', 'критично пошкоджені'].includes(endsConditionText)
                    || endsConditionText.includes('порист')
                    || endsConditionText.includes('ламк')
                    || endsConditionText.includes('пошкод')
                    || endsConditionText.includes('повреж');
                const endsLighteningNeeded = endsLevelProvided && tLevel > eLevel;
                const endsChemicalInterventionLikely = Boolean(rootRec || lenRec);
                const endsConditionNeedsConfirmation = riskyEndsCondition
                    && (endsLighteningNeeded || endsChemicalInterventionLikely);
                const endsConditionMissingWithDifferentLevel = !endsConditionProvided && endsLevelNeedsConfirmation;
                const zoneDecisionNeedsConfirmation = zoneLevelDifference >= 2 || zoneProcessesDiffer;

                if (zoneDecisionNeedsConfirmation) {
                    warnings.push("⚠️ ЗОНАЛЬНЕ РІШЕННЯ: рівень кореня і довжини суттєво відрізняється або процеси для зон різні. Потрібне ручне підтвердження зонального рішення майстром.");
                    manualDecisions.push({
                        title: "Зональне рішення корінь / довжина",
                        message: `Підтвердити окреме рішення для зон перед виконанням рецепта. root_level: ${rLevel}, length_level: ${lLevel}, процес кореня: ${rootProcess || 'не визначено'}, процес довжини: ${lengthProcess || 'не визначено'}.`
                    });
                }

                if (endsLevelNeedsConfirmation) {
                    warnings.push("⚠️ КІНЦІ МАЮТЬ ОКРЕМИЙ РІВЕНЬ: ends_level відрізняється від кореня або довжини. Кінці потребують окремої оцінки майстром; на цьому етапі окремий рецепт кінців ще не рахується.");
                    manualDecisions.push({
                        title: "Окрема оцінка кінців",
                        message: `Підтвердити рішення для кінців перед виконанням рецепта. root_level: ${rLevel}, length_level: ${lLevel}, ends_level: ${eLevel}. Окремий рецепт кінців на цьому етапі не рахується.`
                    });
                }

                if (endsConditionNeedsConfirmation) {
                    warnings.push("⚠️ РИЗИКОВИЙ СТАН КІНЦІВ: ends_condition вказує на пористі, ламкі або пошкоджені кінці. Потрібна окрема оцінка майстром перед освітленням або хімічним втручанням; окремий рецепт кінців на цьому етапі не рахується.");
                    manualDecisions.push({
                        title: "Стан кінців",
                        message: `Підтвердити рішення для кінців перед виконанням рецепта. ends_condition: ${endsCondition}, ends_level: ${endsLevelProvided ? eLevel : 'не вказано'}. Не застосовувати універсальний рецепт до кінців без ручної оцінки.`
                    });
                }

                if (endsConditionMissingWithDifferentLevel) {
                    warnings.push("⚠️ НЕДОСТАТНЬО ОЦІНКИ КІНЦІВ: ends_level відрізняється від кореня або довжини, але ends_condition не вказано. Стан кінців треба оцінити окремо перед виконанням рецепта.");
                    manualDecisions.push({
                        title: "Не вказано стан кінців",
                        message: `Заповнити або вручну оцінити стан кінців перед виконанням рецепта. root_level: ${rLevel}, length_level: ${lLevel}, ends_level: ${eLevel}.`
                     });
                }

                const endsHistoryText = String(endsHistory || '').toLowerCase();
                const endsBaseTypeText = String(endsBaseType || '').toLowerCase();
                const endsHistoryProvided = Boolean(endsHistoryText);
                const endsBaseTypeProvided = Boolean(endsBaseTypeText);
                const riskyEndsHistory = [
                    'косметичний пігмент', 'темний косметичний пігмент', 
                    'після змивки', 'хна / метали', 'невідома історія'
                ].includes(endsHistoryText) || endsHistoryText.includes('невідома');
                const riskyEndsBaseType = [
                    'косметична', 'змішана / нерівномірна', 'невідома'
                ].includes(endsBaseTypeText);

                const endsHistoryNeedsConfirmation = endsLevelProvided && !endsHistoryProvided && endsLevelNeedsConfirmation;
                const endsBaseTypeNeedsConfirmation = endsLevelProvided && !endsBaseTypeProvided && endsLevelNeedsConfirmation;

                if (endsHistoryNeedsConfirmation) {
                    warnings.push("⚠️ НЕДОСТАТНЬО ІСТОРІЇ КІНЦІВ: ends_level відрізняється, але ends_history не вказано. Потрібно уточнити історію кінців.");
                    manualDecisions.push({
                        title: "Не вказано історію кінців",
                        message: `Уточніть історію кінців для безпечного рішення. root_level: ${rLevel}, length_level: ${lLevel}, ends_level: ${eLevel}.`
                    });
                }

                if (endsBaseTypeNeedsConfirmation) {
                    warnings.push("⚠️ НЕДОСТАТНЬО ТИПУ БАЗИ КІНЦІВ: ends_level відрізняється, але ends_base_type не вказано. Потрібно уточнити тип бази кінців.");
                    manualDecisions.push({
                        title: "Не вказано тип бази кінців",
                        message: `Уточніть тип бази кінців для безпечного рішення. root_level: ${rLevel}, length_level: ${lLevel}, ends_level: ${eLevel}.`
                    });
                }

                if (riskyEndsHistory) {
                    warnings.push(`⚠️ РИЗИКОВА ІСТОРІЯ КІНЦІВ: ${endsHistory}. Потрібна окрема діагностика та тест-пасмо перед хімічним втручанням.`);
                    manualDecisions.push({
                        title: "Ризикова історія кінців",
                        message: `Історія кінців "${endsHistory}" потребує ручного контролю та оцінки тест-пасма. Окремий рецепт на цьому етапі не рахується.`
                    });
                }

                if (riskyEndsBaseType && endsLighteningNeeded) {
                    warnings.push(`⚠️ РИЗИКОВИЙ ТИП БАЗИ КІНЦІВ ПРИ ОСВІТЛЕННІ: ${endsBaseType}. Освітлення косметичної або нерівномірної бази на кінцях потребує ручного контролю.`);
                    manualDecisions.push({
                        title: "Ризикова база кінців",
                        message: `Тип бази "${endsBaseType}" при цільовому рівні ${tLevel} потребує ручного рішення майстра.`
                    });
                }

                let threeZonePreviewEligible = false;
                let threeZoneGateDecision = null;
                let threeZoneCandidateMassModel = null;
                let threeZonePreviewOnly = undefined;
                let threeZoneEndsRecipeReady = undefined;
                let endsRecCandidatePreview = null;

                // Three Zone Activation Gate: diagnostic/manual gate for ends evaluation
                if (Number.isFinite(eLevel) && eLevel !== lLevel) {
                    const gateDecision = classifyThreeZoneActivation({
                        ends_level: eLevel,
                        length_level: lLevel,
                        root_level: rLevel,
                        ends_condition: endsCondition,
                        ends_history: endsHistory,
                        ends_base_type: endsBaseType,
                        target_level: tLevel
                    });
                    
                    threeZoneGateDecision = gateDecision.decision;

                    if (gateDecision.decision === 'KEEP_2_ZONE') {
                        // No additional action; production remains 2-zone
                    } else if (gateDecision.decision === 'ALLOW_3_ZONE') {
                        // Diagnostic signal: ALLOW_3_ZONE indicates safe conditions for ends
                        // But do NOT activate 3-zone runtime; this is for future planning
                        threeZonePreviewEligible = true;
                        threeZonePreviewOnly = true;
                        threeZoneEndsRecipeReady = false;
                        threeZoneCandidateMassModel = buildThreeZoneMassCandidate(length, density, { rootPct: 0.3, lengthPct: 0.5, endsPct: 0.2 });
                        warnings.push('⚠️ ДІАГНОСТИКА: Створено попередній endsRecCandidate для оцінки кінців. Це не production рецепт і не інструкція для змішування. Поточний протокол залишається 2-зонним.');
                        diagnostics.push('(діагностична: ends_condition сумісна з майбутньою 3-zone логікою)');
                        endsRecCandidatePreview = buildEndsRecCandidatePreview({
                            ends_level: eLevel,
                            length_level: lLevel,
                            root_level: rLevel,
                            ends_condition: endsCondition,
                            ends_history: endsHistory,
                            ends_base_type: endsBaseType,
                            target_level: tLevel,
                            threeZoneGateDecision: gateDecision.decision,
                            threeZoneCandidateMassModel,
                            threeZonePreviewOnly,
                            threeZoneEndsRecipeReady
                        });
                    } else if (gateDecision.decision === 'MANUAL_REQUIRED') {
                        // Convert to manual decision; add warning
                        if (!manualDecisions.some(md => md.title.includes('Кінці') || md.title.includes('ends'))) {
                            warnings.push(`⚠️ GATE: Кінці потребують ручного рішення. Причина: ${gateDecision.reason}`);
                            manualDecisions.push({
                                title: "Three Zone Activation Gate",
                                message: `Activation gate для кінців повернув MANUAL_REQUIRED (${gateDecision.reason}). Перевірте стан кінців перед рецептом.`
                            });
                        }
                    } else if (gateDecision.decision === 'BLOCKED') {
                        // Convert BLOCKED to MANUAL_REQUIRED; add strict warning
                        warnings.push(`⚠️ GATE: Кінці ЗАБЛОКОВАНІ. Причина: ${gateDecision.reason}`);
                        manualDecisions.push({
                            title: "Three Zone Activation Gate — BLOCKED",
                            message: `Activation gate для кінців повернув BLOCKED (${gateDecision.reason}). Блокування: автоматичне рішення по кінцях заборонено. Потрібне ручне рішення майстра.`
                        });
                    }
                }

                const reasons = { rootStep: rStep, lengthStep: lStep, endsLevel: eLevel, endsCondition, endsHistory, endsBaseType, hotRoot, grey, specialBlondBase6NeedsConfirmation, significantDarkeningNeedsPrepig, zoneLevelDifference, zoneProcessesDiffer, zoneDecisionNeedsConfirmation, endsLevelProvided, endsDiffersFromRoot, endsDiffersFromLength, endsLevelNeedsConfirmation, endsConditionProvided, riskyEndsCondition, endsLighteningNeeded, endsChemicalInterventionLikely, endsConditionNeedsConfirmation, endsConditionMissingWithDifferentLevel, endsHistoryProvided, endsBaseTypeProvided, riskyEndsHistory, riskyEndsBaseType, endsHistoryNeedsConfirmation, endsBaseTypeNeedsConfirmation, threeZonePreviewEligible, threeZoneGateDecision, threeZoneCandidateMassModel, threeZonePreviewOnly, threeZoneEndsRecipeReady };
                if (endsRecCandidatePreview) {
                    reasons.endsRecCandidatePreview = endsRecCandidatePreview;
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
                    massModel: Object.assign({}, massModel, { rootMass: rMass, lengthMass: lMass }),
                    timingInfo: { totalMinutes: timing, modifierMinutes: tMod },
                    reasons
                });
                document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
            } catch (e) {
                document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml({
                    status: 'FATAL_ERROR',
                    error: e
                });
            }
        }
