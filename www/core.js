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
                    root_condition: this.getWwwValue('root_condition'),
                    length_condition: this.getWwwValue('length_condition'),
                    porosity: this.getWwwValue('porosity'),
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
                    target_direction: this.getWwwValue('target_direction'),
                    elasticity: this.getWwwValue('elasticity')
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
                    rootCondition: String(wwwValues.root_condition || '').trim(),
                    lengthCondition: String(wwwValues.length_condition || '').trim(),
                    porosity: String(wwwValues.porosity || '').trim(),
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
                    elasticity: String(wwwValues.elasticity || '').trim(),
                    isMidActive: false,
                    midLevel: null,
                    midBaseType: null
                };
            }
        });

        const PerucarWwwRenderV1 = Object.freeze({
            DIAGNOSTIC_REASON_LABELS: Object.freeze({
                READY_LOW_RISK_TONING_CANDIDATE: 'Кінці визначені як низькоризиковий кандидат для діагностичного тонування.',
                HEALTHY_NATURAL: 'Кінці позначені як здорові та натуральні.',
                'Low risk toning': 'Оцінка ризику низька; потрібна ручна перевірка перед будь-якою дією.',
                FORMULA_TONING_ONLY_ALLOWED: 'Дозволена лише diagnostic оцінка тонування; фінальна формула не сформована.',
                MASS_CANDIDATE_ALLOWED_PRODUCTION_GRAMS_PENDING: 'Масовий етап лишається preview-only; робочі кількості не виводяться.',
                READINESS_MANUAL: 'Потрібна ручна перевірка перед продовженням diagnostic path.',
                BUILDER_MANUAL: 'Потрібна ручна перевірка candidate builder.',
                FORMULA_MANUAL: 'Потрібна ручна перевірка формульної оцінки.',
                MASS_MANUAL: 'Потрібна ручна перевірка mass safety check.',
                READINESS_MANUAL_REQUIRED: 'Readiness check вимагає ручної перевірки.',
                THREE_ZONE_MANUAL_REQUIRED: 'Розділення зон потребує ручної перевірки.',
                ENDSREC_ELIGIBILITY_MANUAL_REQUIRED: 'Придатність кінців потребує ручної перевірки.',
                CREATED: 'Diagnostic candidate builder створив preview-кандидата.',
                'preview-only': 'Дані показані тільки як попередній перегляд.',
                TONING_ONLY: 'Тип оцінки: тільки тонування у preview mode.',
                READY: 'Статус перевірки: готово для diagnostic preview.'
            }),

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

            formatDiagnosticReasonCode(code) {
                const normalized = String(code ?? '').trim();
                if (!normalized) return 'Діагностична причина не вказана.';
                return this.DIAGNOSTIC_REASON_LABELS[normalized] ||
                    `Невідома діагностична причина: ${normalized}`;
            },

            renderDiagnosticCodeItems(title, codes) {
                if (!Array.isArray(codes) || codes.length === 0) return [];
                return codes
                    .filter((code) => code !== undefined && code !== null && String(code).trim() !== '')
                    .map((code) => ({ title, message: this.formatDiagnosticReasonCode(code) }));
            },

            renderDiagnosticSourceRefItems(sourceRefs) {
                if (!sourceRefs || typeof sourceRefs !== 'object') return [];
                return Object.entries(sourceRefs)
                    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
                    .map(([key, value]) => ({
                        title: `sourceRefs.${key}`,
                        message: this.formatDiagnosticReasonCode(value)
                    }));
            },

            renderDiagnostics(diagnostics, reasons) {
                const items = [];
                if (Array.isArray(diagnostics)) items.push(...diagnostics);
                else if (diagnostics) items.push(diagnostics);
                items.push(...this.normalizeReasonsToItems(reasons));
                return this.renderList('Діагностика та причини', items, 'diagnostics');
            },

            renderEndsDiagnosticDisplay(candidate) {
                if (!candidate) return '';
                const forbiddenFields = new Set([
                    'dyeMass',
                    'oxidizerMass',
                    'grams',
                    'exactGrams',
                    'finalFormula',
                    'endsFormula',
                    'productionRecipe',
                    'formula-to-mix'
                ]);
                const hasForbiddenField = Object.keys(candidate).some((key) => forbiddenFields.has(key));
                const safeSourceRefs = {};
                if (candidate.sourceRefs && typeof candidate.sourceRefs === 'object') {
                    Object.entries(candidate.sourceRefs).forEach(([key, value]) => {
                        if (!forbiddenFields.has(key) && key !== 'productionReady') safeSourceRefs[key] = value;
                    });
                }
                const items = [
                    { title: 'Статус', message: 'Попередній перегляд' },
                    { title: 'previewOnly / Preview only', message: candidate.previewOnly === true ? 'true' : 'false' },
                    { title: 'candidateOnly', message: candidate.candidateOnly === true ? 'true' : 'false' },
                    { title: 'notForMixing', message: candidate.notForMixing === true ? 'true — Не для змішування' : 'false' },
                    { title: 'productionReady', message: 'false' },
                    { title: 'endsRecipeReady', message: candidate.endsRecipeReady === true ? 'true' : 'false' },
                    'Потрібна ручна перевірка',
                    'Не є фінальним рецептом',
                    'Не наносити за цим блоком'
                ];
                if (Object.keys(safeSourceRefs).length > 0) {
                    items.push(...this.renderDiagnosticSourceRefItems(safeSourceRefs));
                }
                items.push(...this.renderDiagnosticCodeItems('safetyReasonCodes', candidate.safetyReasonCodes));
                items.push(...this.renderDiagnosticCodeItems('manualRequiredReasonCodes', candidate.manualRequiredReasonCodes));
                if (hasForbiddenField) {
                    items.push('Небезпечні технічні поля приховано');
                }
                return this.renderList('Діагностика кінців', items, 'ends-diagnostic warning');
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
                    ['Фінальна формула', options.approved === true ? recipe.finalFormula : null],
                    ['Нотатки', recipe.notes]
                ].filter(([, value]) => value !== undefined && value !== null && value !== '');
                const htmlRows = rows.map(([label, value]) => `<li><b>${this.escapeHtml(label)}:</b> ${this.escapeHtml(value)}</li>`).join('');
                return `<div class="${className}"><h3>${this.escapeHtml(title)}</h3><ul>${htmlRows}</ul></div>`;
            },

            // Central gate for the final/executable salon recipe (approved-recipe).
            // Missing productionReady is unsafe by default; buildWwwRenderState must
            // explicitly mark real production-approved runtime states as ready.
            isProductionReadyState(state) {
                return Boolean(state)
                    && state.status === 'APPROVED'
                    && state.productionReady === true
                    && Boolean(state.rootRec || state.midRec || state.lenRec)
                    && (!Array.isArray(state.blockers) || state.blockers.length === 0)
                    && (!Array.isArray(state.manualDecisions) || state.manualDecisions.length === 0)
                    && !this.isDiagnosticOnlyTimingState(state);
            },

            canRenderExecutableRecipe(state) {
                return this.isProductionReadyState(state);
            },

            renderProductionNotReadyNotice() {
                const items = [
                    { title: 'Статус', message: 'APPROVED без productionReady=true' },
                    'Готовий рецепт приховано: готовність до виробництва не підтверджено.',
                    'Не для змішування. Потрібне рішення майстра.'
                ];
                return this.renderList('Рецепт недоступний', items, 'recipe non-final-recipe production-not-ready');
            },

            renderRecipes(state) {
                if (!state || state.status !== 'APPROVED') return '';
                if (!state.rootRec && !state.midRec && !state.lenRec) return '';
                if (!this.canRenderExecutableRecipe(state)) {
                    return this.renderProductionNotReadyNotice();
                }
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

            sanitizeMassModelForRender(massModel, state) {
                // For production-ready approved states, guard critical mass fields against NaN/Infinity.
                // NaN/Infinity in totalMass/rootMass/lengthMass must not render as grams in the approved recipe.
                if (!massModel) return massModel;
                if (this.canRenderExecutableRecipe(state)) {
                    const criticalFields = ['totalMass', 'rootMass', 'lengthMass'];
                    for (const field of criticalFields) {
                        if (Object.prototype.hasOwnProperty.call(massModel, field) && !isFiniteNumber(massModel[field])) {
                            // Mass model has non-finite value in a critical field — fail closed: treat as no mass model.
                            return null;
                        }
                    }
                    return massModel;
                }
                const safeModel = {};
                if (Object.prototype.hasOwnProperty.call(massModel, 'mode')) {
                    safeModel.mode = massModel.mode;
                }
                if (Object.prototype.hasOwnProperty.call(massModel, 'endsMass')) {
                    safeModel.endsMass = massModel.endsMass == null ? null : 'hidden';
                }
                safeModel.mixingMassesHidden = true;
                return safeModel;
            },

            renderMassModel(massModel, state) {
                if (!massModel) return '';
                const safeMassModel = this.sanitizeMassModelForRender(massModel, state);
                return `<div class="mass-model"><h3>Маси</h3><pre>${this.escapeHtml(JSON.stringify(safeMassModel, null, 2))}</pre></div>`;
            },

            isDiagnosticOnlyTimingState(state) {
                const candidate = state && state.endsRecDiagnosticWiringCandidate;
                return Boolean(candidate);
            },

            sanitizeTimingInfoForRender(timingInfo, state) {
                if (!timingInfo) return timingInfo;
                const status = state && state.status;
                const isDiagnosticOnly = this.isDiagnosticOnlyTimingState(state);
                if (this.canRenderExecutableRecipe(state)) return timingInfo;
                if (status === 'BLOCKED') {
                    return {
                        timingStatus: 'blocked',
                        productionTimingHidden: true,
                        message: 'Production timing is hidden because output is blocked.'
                    };
                }
                if (isDiagnosticOnly) {
                    return {
                        timingStatus: 'diagnostic-only',
                        notForMixing: true,
                        requiresManualConfirmation: true,
                        productionTimingHidden: true,
                        message: 'Timing info is diagnostic only and not a ready-to-execute instruction.'
                    };
                }
                if (status === 'APPROVED') {
                    return {
                        timingStatus: 'production-not-ready',
                        productionTimingHidden: true,
                        message: 'Production timing is hidden until productionReady=true.'
                    };
                }
                return Object.assign({}, timingInfo, {
                    timingStatus: 'advisory-only',
                    requiresManualConfirmation: true,
                    notReadyToExecute: true,
                    message: 'Timing info is advisory only and not a ready-to-execute instruction.'
                });
            },

            renderTimingInfo(timingInfo, state) {
                if (!timingInfo) return '';
                const safeTimingInfo = this.sanitizeTimingInfoForRender(timingInfo, state);
                return `<div class="timing-info"><h3>Таймінги</h3><pre>${this.escapeHtml(JSON.stringify(safeTimingInfo, null, 2))}</pre></div>`;
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
                    this.renderEndsDiagnosticDisplay(state.endsRecDiagnosticWiringCandidate),
                    hasPhases ? this.renderPhases(state.phases) : this.renderProtocolText(state.protocolText),
                    this.renderMixtoneInfo(state.mixtoneInfo),
                    this.renderMassModel(state.massModel, state),
                    this.renderTimingInfo(state.timingInfo, state),
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

        function normalizeWwwProductionReady(runtime, status, blockers, manualDecisions) {
            const hasDiagnosticCandidate = Boolean(runtime.endsRecDiagnosticWiringCandidate);
            const hasProductionRecipe = Boolean(runtime.rootRec || runtime.midRec || runtime.lenRec);
            const explicitlyDenied = runtime.productionReady === false;
            return status === 'APPROVED'
                && blockers.length === 0
                && manualDecisions.length === 0
                && !hasDiagnosticCandidate
                && hasProductionRecipe
                && !explicitlyDenied;
        }

        function buildWwwRenderState(runtime = {}) {
            const plan = Array.isArray(runtime.plan) ? runtime.plan : [];
            const phases = Array.isArray(runtime.phases) && runtime.phases.length > 0
                ? runtime.phases
                : plan.map((item, index) => ({
                    phaseName: `Етап ${index + 1}`,
                    steps: [stripWwwHtmlText(item)]
                })).filter((phase) => phase.steps[0] !== '');
            // Fail-closed default: if status is missing/falsy, treat as BLOCKED — never default to APPROVED.
            // All callers in calculateProtocol() provide an explicit status; this default is a defense-in-depth guard.
            const status = runtime.status || 'BLOCKED';
            const blockers = Array.isArray(runtime.blockers) ? runtime.blockers : [];
            const manualDecisions = Array.isArray(runtime.manualDecisions) ? runtime.manualDecisions : [];
            const productionReady = normalizeWwwProductionReady(runtime, status, blockers, manualDecisions);

            return {
                status,
                target: runtime.target,
                productionReady,
                blockers,
                manualDecisions,
                warnings: Array.isArray(runtime.warnings) ? runtime.warnings : [],
                rootRec: normalizeWwwRecipeForRender(runtime.rootRec),
                midRec: normalizeWwwRecipeForRender(runtime.midRec),
                lenRec: normalizeWwwRecipeForRender(runtime.lenRec),
                phases,
                protocolText: stripWwwHtmlText(runtime.protocolText),
                mixtoneInfo: runtime.mixtoneInfo || null,
                massModel: runtime.massModel || null,
                timingInfo: runtime.timingInfo || null,
                timing: typeof runtime.timing === 'number' ? runtime.timing : 0,
                diagnostics: Array.isArray(runtime.diagnostics) ? runtime.diagnostics : [],
                // Narrow reasons sanitization:
                // - Arrays (reason-code lists from gate results) pass through unchanged.
                // - Non-array objects pass through only when they explicitly indicate
                //   a 3-zone preview diagnostic case (threeZoneGateDecision === 'ALLOW_3_ZONE').
                //   In that case normalizeReasonsToItems intentionally renders the 3-zone fields.
                // - All other non-array reasons objects (normal approved path etc.) are
                //   suppressed: normalizeReasonsToItems must not dump internal flags
                //   (rootOxPercent, rootHighOxidizer, etc.) into user-visible HTML.
                reasons: Array.isArray(runtime.reasons)
                    ? runtime.reasons
                    : (runtime.reasons && runtime.reasons.threeZoneGateDecision === 'ALLOW_3_ZONE'
                        ? runtime.reasons
                        : []),
                endsRecDiagnosticWiringCandidate: runtime.endsRecDiagnosticWiringCandidate || null
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
            // typeof NaN === 'number', so Number.isFinite is required — typeof alone does not catch NaN pcts.
            if (!split || !Number.isFinite(split.rootPct) || !Number.isFinite(split.endsPct)) {
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
            if (!(candidate.productionReady === false)) missingFlags.push('productionReady_false');
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
                    // INACTIVE/FUTURE-ONLY skeleton flag. This productionReady:true is a
                    // contract placeholder for a not-yet-built production feature. It must
                    // NEVER be wired directly into a render state: the diagnostic wiring
                    // contract rebuilds the candidate with productionReady:false, the runtime
                    // hardcodes false, normalizeWwwProductionReady forces false whenever a
                    // diagnostic candidate is present, and isProductionReadyState blocks the
                    // executable recipe regardless. Do not activate without a separate, fully
                    // tested production feature.
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
                    // INACTIVE/FUTURE-ONLY skeleton flag. Same isolation contract as
                    // buildProductionEndsRec: this productionReady:true must never reach
                    // renderStateToHtml. It is firewalled by the diagnostic wiring contract
                    // (rebuilds productionReady:false), runtime hardcoding, normalizeWwwProductionReady,
                    // and isProductionReadyState. Not wired to runtime rendering.
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

        /**
         * buildControlledEndsRecDiagnosticWiringContract(context, readiness, builderResult, formulaContract, massAllocation, assemblyResult)
         *
         * INACTIVE HELPER. Assembles the diagnostic/preview candidate representation
         * to be safe for inclusion in calculateProtocol logs/reasons.
         * It does not mutate any inputs, does not change the production recipe status,
         * and does not wired itself into calculateProtocol logic directly.
         */
        function buildControlledEndsRecDiagnosticWiringContract(context, readiness, builderResult, formulaContract, massAllocation, assemblyResult) {
            const ctx = context || {};
            const state = readiness || {};
            const build = builderResult || {};
            const formula = formulaContract || {};
            const mass = massAllocation || {};
            const assembly = assemblyResult || {};
            const candidate = assembly.productionEndsRecCandidate || null;

            const isReady = state.ready === true;
            const isBuilderCreated = build.created === true;
            const isFormulaReady = formula.formulaReady === true;
            const isMassReady = mass.massReady === true;
            const isAssembled = assembly.assembled === true;
            const productionBlocked = ctx.productionBlocked === true;

            const isBlocked = state.status === 'BLOCKED' ||
                              build.status === 'BLOCKED' ||
                              formula.formulaStatus === 'BLOCKED' ||
                              mass.massStatus === 'BLOCKED' ||
                              assembly.assemblyStatus === 'BLOCKED';

            const isManual = state.status === 'MANUAL_REQUIRED' ||
                             build.status === 'MANUAL_REQUIRED' ||
                             formula.formulaStatus === 'MANUAL_REQUIRED' ||
                             mass.massStatus === 'MANUAL_REQUIRED' ||
                             assembly.assemblyStatus === 'MANUAL_REQUIRED';

            const canWire = isReady && isBuilderCreated && isFormulaReady && isMassReady &&
                            isAssembled && candidate && !productionBlocked && !isBlocked && !isManual;

            if (!canWire) {
                let wiringStatus = 'NOT_READY';
                if (isBlocked) {
                    wiringStatus = 'BLOCKED';
                } else if (isManual) {
                    wiringStatus = 'MANUAL_REQUIRED';
                } else if (!isBuilderCreated) {
                    wiringStatus = 'NO_BUILDER';
                } else if (!isFormulaReady) {
                    wiringStatus = 'NO_FORMULA';
                } else if (!isMassReady) {
                    wiringStatus = 'NO_MASS';
                } else if (!isAssembled) {
                    wiringStatus = 'NO_ASSEMBLY';
                } else if (!candidate) {
                    wiringStatus = 'NO_CANDIDATE';
                }

                return {
                    diagnosticReady: false,
                    wiringStatus,
                    diagnosticCandidate: null,
                    sourceRefs: {},
                    safetyReasonCodes: [],
                    manualRequiredReasonCodes: []
                };
            }

            if (candidate.endsRecipeReady === true) {
                return {
                    diagnosticReady: false,
                    wiringStatus: 'SUSPICIOUS_RECIPE_READY',
                    diagnosticCandidate: null,
                    sourceRefs: {},
                    safetyReasonCodes: [],
                    manualRequiredReasonCodes: []
                };
            }

            const safetyReasonCodes = [];
            if (state.reasons) safetyReasonCodes.push(...state.reasons);
            if (build.endsRec && build.endsRec.safetyReasonCodes) safetyReasonCodes.push(...build.endsRec.safetyReasonCodes);
            if (formula.safetyReasonCodes) safetyReasonCodes.push(...formula.safetyReasonCodes);
            if (mass.safetyReasonCodes) safetyReasonCodes.push(...mass.safetyReasonCodes);

            const manualRequiredReasonCodes = [];
            if (state.status === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('READINESS_MANUAL');
            if (build.status === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('BUILDER_MANUAL');
            if (formula.formulaStatus === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('FORMULA_MANUAL');
            if (mass.massStatus === 'MANUAL_REQUIRED') manualRequiredReasonCodes.push('MASS_MANUAL');

            const diagnosticCandidate = {
                zone: 'ends',
                previewOnly: true,
                candidateOnly: true,
                notForMixing: true,
                productionReady: false, // strictly false for preview
                endsRecipeReady: false, // strictly false
                sourceRefs: {
                    readinessReasonCode: state.reasonCode || null,
                    builderStatus: build.status || null,
                    formulaType: formula.formulaType || null,
                    massStatus: mass.massStatus || null
                },
                safetyReasonCodes: safetyReasonCodes,
                manualRequiredReasonCodes: manualRequiredReasonCodes
            };

            return {
                diagnosticReady: true,
                wiringStatus: 'READY',
                diagnosticCandidate,
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

        function normalizeEndsHistoryForDiagnostic(value) {
            const normalized = String(value || '').trim().toLowerCase();
            if (normalized === 'натуральні') return 'натуральна';
            return normalized;
        }

        function classifyThreeZoneActivation(input) {
            const { ends_level, length_level, root_level, ends_condition, ends_history, ends_base_type, target_level } = input;
            const normalizedEndsHistory = normalizeEndsHistoryForDiagnostic(ends_history);
            
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
            if (blockedHistory.includes(normalizedEndsHistory)) {
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
                (normalizedEndsHistory === 'natural' || normalizedEndsHistory === 'clear' || normalizedEndsHistory === 'none' || normalizedEndsHistory === 'натуральна' || normalizedEndsHistory === 'чиста') &&
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

        /**
         * validateProductionThirdZoneReadiness(input)
         *
         * INACTIVE HELPER — production third-zone readiness skeleton.
         * Pure function. Not called from calculateProtocol().
         * Not wired to UI/render.
         * Does NOT activate production third-zone.
         *
         * @param {object} input - context/state-like object with critical fields.
         * @returns {object} readiness contract (see below).
         */
        function validateProductionThirdZoneReadiness(input) {
            const ctx = input || {};

            const criticalInputs = [
                { key: 'root_level', label: 'root level' },
                { key: 'length_level', label: 'length level' },
                { key: 'ends_level', label: 'ends level' },
                { key: 'target_level', label: 'target level' },
                { key: 'target_direction', label: 'target direction' },
                { key: 'ends_history', label: 'ends history' },
                { key: 'porosity', label: 'porosity' },
                { key: 'damage', label: 'damage/sensitivity' },
                { key: 'previous_chemical_history', label: 'previous chemical history' },
                { key: 'brand_or_system', label: 'brand/system constraints' },
                { key: 'oxidizer_constraints', label: 'oxidizer constraints' },
                { key: 'application_zone_logic', label: 'application-zone logic' },
                { key: 'manual_verification_flags', label: 'manual verification flags' }
            ];
            const missingCriticalInputs = [];
            for (const ci of criticalInputs) {
                const val = ctx[ci.key];
                if (val === undefined || val === null || val === '' || (typeof val === 'number' && !Number.isFinite(val))) {
                    missingCriticalInputs.push(ci.label);
                }
            }

            const endsHistory = String(ctx.ends_history || '').toLowerCase();
            const damage = String(ctx.damage || ctx.damage_sensitivity || '').toLowerCase();
            const porosity = String(ctx.porosity || '').toLowerCase();
            const prevChem = String(ctx.previous_chemical_history || '').toLowerCase();
            const hasDiagnosticOnly = Boolean(ctx.endsRecDiagnosticWiringCandidate) && !ctx.root_level && !ctx.length_level;

            const safetyReasonCodes = [];
            const manualRequiredReasonCodes = [];
            let blocked = false;
            let manualRequired = false;

            const isHighDamage = damage.includes('high') || damage.includes('critical') || damage.includes('сильно') || damage.includes('критично');
            const isUnknownChem = prevChem === '' || prevChem === 'unknown' || prevChem === 'невідома';
            const isUncertainEndsHist = endsHistory === '' || endsHistory === 'unknown' || endsHistory === 'невідома';
            const isIncompatibleEndsHist = endsHistory.includes('henna') || endsHistory.includes('хна') || endsHistory.includes('metal') || endsHistory.includes('метал');
            const isPorousEnds = porosity.includes('high') || porosity.includes('porous') || porosity.includes('висока') || porosity.includes('порист');

            if (hasDiagnosticOnly) {
                blocked = true;
                safetyReasonCodes.push('DIAGNOSTIC_CANDIDATE_ONLY');
            }
            if (isHighDamage) {
                manualRequired = true;
                manualRequiredReasonCodes.push('HIGH_DAMAGE_SENSITIVITY');
                safetyReasonCodes.push('HIGH_DAMAGE_SENSITIVITY');
            }
            if (isUnknownChem) {
                manualRequired = true;
                manualRequiredReasonCodes.push('UNKNOWN_CHEMICAL_HISTORY');
                safetyReasonCodes.push('UNKNOWN_CHEMICAL_HISTORY');
            }
            if (isUncertainEndsHist) {
                manualRequired = true;
                manualRequiredReasonCodes.push('UNCERTAIN_ENDS_HISTORY');
                safetyReasonCodes.push('UNCERTAIN_ENDS_HISTORY');
            }
            if (isIncompatibleEndsHist) {
                blocked = true;
                safetyReasonCodes.push('INCOMPATIBLE_ENDS_HISTORY');
            }
            if (isPorousEnds) {
                manualRequired = true;
                manualRequiredReasonCodes.push('POROUS_ENDS');
                safetyReasonCodes.push('POROUS_ENDS');
            }

            const hasMissing = missingCriticalInputs.length > 0;
            const hasManual = manualRequiredReasonCodes.length > 0;
            const hasBlockers = safetyReasonCodes.length > 0;
            const ready = !hasMissing && !hasBlockers && !hasManual && !blocked && !manualRequired;

            const contract = {
                contractType: "productionThirdZoneReadiness",
                previewOnly: true,
                candidateOnly: true,
                notForMixing: true,
                productionReady: false,
                endsRecipeReady: false,
                ready: ready,
                blocked: hasMissing || blocked || hasBlockers,
                manualRequired: hasManual || manualRequired,
                missingCriticalInputs: missingCriticalInputs,
                manualRequiredReasonCodes: manualRequiredReasonCodes,
                safetyReasonCodes: safetyReasonCodes,
                sourceRefs: {
                    endsLevel: ctx.ends_level || null,
                    targetLevel: ctx.target_level || null,
                    endsHistory: ctx.ends_history || null,
                    damage: ctx.damage || ctx.damage_sensitivity || null,
                    porosity: ctx.porosity || null
                }
            };

            return contract;
        }

        /**
         * getBaseProcessTiming(processText)
         * Pure helper. Returns base process timing in minutes for a given process.
         * Does NOT include tMod (thickness modifier). Caller adds tMod separately.
         * Returns 0 for unrecognised processes (no timing signal).
         *
         * @param {string} processText - process description string from rootRec/lenRec
         * @returns {number} base minutes (integer)
         */
        function getBaseProcessTiming(processText) {
            const p = String(processText || '').toLowerCase();
            if (p.includes('special blond')) return 50;
            if (p.includes('порошок') || p.includes('powder')) return 50;
            if (p.includes('перманент / тонування')) return 25;
            if (p.includes('тонування') || p.includes('toning')) return 25;
            if (p.includes('перманент')) return 40;
            return 0;
        }

        // =============================================================================
        // BRAND MATRIX READINESS HELPERS — docs/brand-data-schema.md
        // Pure functions — no side effects — do not affect calculateProtocol behavior.
        // hasBrandRuleMatrix (inside calculateProtocol) remains false regardless.
        // These helpers exist for future use only: when real validated brand data
        // is introduced they can be used to validate entries before enabling the gate.
        // =============================================================================

        /**
         * Required fields for a brand matrix entry. All 18 must be present and non-null
         * for an entry to be considered shape-valid. Missing any field → MANUAL_REQUIRED.
         * See: docs/brand-data-schema.md §3
         */
        const REQUIRED_BRAND_MATRIX_FIELDS = [
            'brandId', 'brandDisplayName', 'lineId', 'lineDisplayName',
            'processCategory', 'supportedLevels', 'oxidizerCompatibility',
            'mixRatio', 'timingRange', 'greyCoveragePolicy', 'specialBlondPolicy',
            'powderPolicy', 'toningPolicy', 'contraindications',
            'manualReviewTriggers', 'sourceReference', 'validationStatus',
            'lastReviewedAt'
        ];

        /**
         * Returns true only if matrix is a non-empty array.
         * null, undefined, non-array, or empty array → not available.
         * @param {*} matrix
         * @returns {boolean}
         */
        function isBrandRuleMatrixAvailable(matrix) {
            return Array.isArray(matrix) && matrix.length > 0;
        }

        /**
         * Returns array of field names missing from a single brand entry.
         * A field is missing if undefined or null.
         * Empty return means all required fields present (not that entry is valid overall).
         * @param {object|null|undefined} entry
         * @returns {string[]}
         */
        function getMissingBrandMatrixFields(entry) {
            if (entry === null || entry === undefined || typeof entry !== 'object') {
                return REQUIRED_BRAND_MATRIX_FIELDS.slice();
            }
            return REQUIRED_BRAND_MATRIX_FIELDS.filter(function(field) {
                return entry[field] === undefined || entry[field] === null;
            });
        }

        /**
         * Validates shape of a brand rule matrix (array of entries).
         * Returns { ready: false, reason } unless matrix is non-empty and every entry
         * has all 18 required fields with validationStatus === 'validated'.
         * A placeholder/null/empty matrix always returns ready: false.
         * @param {*} matrix
         * @returns {{ ready: boolean, reason: string, missingFields?: string[] }}
         */
        function validateBrandRuleMatrixShape(matrix) {
            if (!isBrandRuleMatrixAvailable(matrix)) {
                return { ready: false, reason: 'matrix is null, undefined, or empty' };
            }
            for (var i = 0; i < matrix.length; i++) {
                var entry = matrix[i];
                var missing = getMissingBrandMatrixFields(entry);
                if (missing.length > 0) {
                    return { ready: false, reason: 'entry missing required fields', missingFields: missing };
                }
                if (entry.validationStatus !== 'validated') {
                    return { ready: false, reason: 'entry validationStatus not validated: ' + entry.validationStatus };
                }
            }
            return { ready: true, reason: 'all entries present and validated' };
        }

        /**
         * Returns readiness status string for a brand rule matrix.
         * 'NOT_READY' unless matrix fully validates per validateBrandRuleMatrixShape.
         * Diagnostic only — does not affect calculateProtocol behavior.
         * @param {*} matrix
         * @returns {'NOT_READY'|'READY'}
         */
        function getBrandMatrixReadinessStatus(matrix) {
            return validateBrandRuleMatrixShape(matrix).ready ? 'READY' : 'NOT_READY';
        }

        // =============================================================================
        // NUMERIC SAFETY HELPERS — docs/runtime-failsafe-contract.md
        // Pure functions — no side effects.
        // =============================================================================

        /**
         * Returns true only if value is a finite number (not NaN, not Infinity, not non-number).
         * Use wherever numeric fields must be validated before use in mass/timing/render operations.
         * @param {*} value
         * @returns {boolean}
         */
        function isFiniteNumber(value) {
            return typeof value === 'number' && Number.isFinite(value);
        }

        // =============================================================================
        // STATE PERSISTENCE SAFETY — docs/state-persistence-safety-contract.md
        // Defensive infrastructure for any future localStorage/sessionStorage use.
        // Current runtime (HEAD a187cee): no persistence exists in www/index.html
        // or www/core.js. These helpers and constants are forward-looking safety
        // infrastructure. All storage reads MUST use safeParseJson.
        // =============================================================================

        // Storage schema version. Increment when persisted input schema changes.
        // On version mismatch, discard the entire persisted payload.
        const PERUKAR_STORAGE_VERSION = 1;

        // Key for persisted raw input fields (inputs only — never results).
        const PERUKAR_PERSIST_INPUT_KEY = 'perukar_input_v1';

        // Legacy result keys — listed for deletion/cleanup ONLY.
        // These keys must be deleted on load, never read as authoritative data.
        // Persisted recipe output, approved result objects, and rendered HTML
        // are forbidden as authoritative sources.
        const PERUKAR_LEGACY_RESULT_KEYS = [
            'perukar_result',
            'perukar_output',
            'perukar_approved',
            'perukar_html'
        ];

        /**
         * Safe JSON parse — the ONLY entry point for reading values from
         * localStorage, sessionStorage, or any other browser storage.
         *
         * Returns null for:
         *   - non-string values (null, undefined, number, object)
         *   - empty or whitespace-only strings
         *   - any string that JSON.parse rejects (malformed JSON)
         *
         * Never throws. Malformed input → null → caller uses form defaults.
         *
         * @param {*} value — raw value from storage (typically a string)
         * @returns {*} parsed value, or null on any error
         */
        function safeParseJson(value) {
            if (typeof value !== 'string' || value.trim() === '') return null;
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        }

        // =============================================================================
        // INPUT NORMALIZATION HELPERS — docs/input-model-contract.md
        // Pure functions — no side effects — do not affect formula selection.
        // Used by calculateProtocol for consistent input normalization.
        // =============================================================================

        /**
         * Normalizes a raw input string: trims whitespace, converts null/undefined to ''.
         * Does NOT lowercase — callers that need case-insensitive comparison apply .toLowerCase() separately.
         * @param {*} value
         * @returns {string}
         */
        function normalizeTextInput(value) {
            return String(value === null || value === undefined ? '' : value).trim();
        }

        /**
         * Classifies whether a normalized input is present or missing.
         * 'missing' = null/undefined/empty-after-trim.
         * 'present' = non-empty after trim.
         * @param {*} value
         * @returns {'missing'|'present'}
         */
        function classifyMissingInput(value) {
            return normalizeTextInput(value) === '' ? 'missing' : 'present';
        }

        /**
         * Classifies a normalized string value against an allowed Set.
         * Returns { inAllowed: boolean, normalized: string }.
         * NEVER treats unknown values as safe — caller must BLOCK on inAllowed === false.
         * @param {*} value
         * @param {Set<string>} allowedSet
         * @returns {{ inAllowed: boolean, normalized: string }}
         */
        function normalizeEnumInput(value, allowedSet) {
            const normalized = normalizeTextInput(value);
            return { normalized, inAllowed: normalized !== '' && allowedSet.has(normalized) };
        }

        function calculateProtocol() {
            try {
                let history = document.getElementById('history').value;
                let condition = normalizeTextInput(document.getElementById('condition').value);
                const rootConditionElement = document.getElementById('root_condition');
                const rootCondition = rootConditionElement ? String(rootConditionElement.value || '').trim() : '';
                const lengthConditionElement = document.getElementById('length_condition');
                const lengthCondition = lengthConditionElement ? String(lengthConditionElement.value || '').trim() : '';
                const porosityElement = document.getElementById('porosity');
                const porosity = porosityElement ? String(porosityElement.value || '').trim() : '';
                const thicknessElement = document.getElementById('thickness');
                let thickness = thicknessElement ? thicknessElement.value : '';
                const densityElement = document.getElementById('density');
                let density = densityElement ? densityElement.value : '';
                const lengthElement = document.getElementById('length');
                let length = lengthElement ? lengthElement.value : '';
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
                const tDirElement = document.getElementById('target_direction');
                let tDir = tDirElement ? tDirElement.value : '';
                let allergy = document.getElementById('allergy').value;
                const scalpElement = document.getElementById('scalp_sensitivity');
                let scalp = scalpElement ? scalpElement.value : '';

                let alerts = [], warnings = [], diagnostics = [], manualDecisions = [];
                const missingCriticalFields = [];
                if (!Number.isFinite(rLevel)) missingCriticalFields.push("поточний рівень кореня");
                if (!Number.isFinite(lLevel)) missingCriticalFields.push("поточний рівень довжини");
                if (!Number.isFinite(tLevel)) missingCriticalFields.push("бажаний рівень");
                if (!String(history || '').trim()) missingCriticalFields.push("історія фарбування");
                if (!String(bType || '').trim()) missingCriticalFields.push("тип бази");
                if (!String(condition || '').trim()) missingCriticalFields.push("стан волосся");
                if (!String(scalp || '').trim()) missingCriticalFields.push("чутливість шкіри голови");
                if (!String(tDir || '').trim()) missingCriticalFields.push("бажаний відтінок");
                if (!String(length || '').trim()) missingCriticalFields.push("довжина волосся");
                if (!String(density || '').trim()) missingCriticalFields.push("густота волосся");
                if (!String(thickness || '').trim()) missingCriticalFields.push("товщина волосся");

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

                // LENGTH / DENSITY / THICKNESS / TARGET_DIRECTION UNRECOGNIZED-VALUE GATE
                // Policy: present-but-unrecognized values for these fields MUST produce BLOCKED,
                // never MANUAL_REQUIRED and never a silent default. These are required production fields;
                // an out-of-enum value is treated as invalid critical production input, not as a safe default.
                // target_direction is now guarded here: unknown non-empty tDir must not silently produce
                // an APPROVED recipe with a nonsensical color code.
                const allowedLengthValues = new Set(['короткие', 'средние', 'длинные']);
                const allowedDensityValues = new Set(['редкие', 'средние', 'густые']);
                const allowedThicknessValues = new Set(['тонкие', 'средние', 'толстые']);
                const allowedTargetDirectionValues = new Set(['0', '1', '11', '16', '2', '3', '32', '4', '5', '6', '7', '81', '89']);
                const lengthTrimmed = String(length || '').trim();
                const densityTrimmed = String(density || '').trim();
                const thicknessTrimmed = String(thickness || '').trim();
                const tDirTrimmed = String(tDir || '').trim();
                const unrecognizedCriticalFields = [];
                if (lengthTrimmed && !allowedLengthValues.has(lengthTrimmed)) {
                    unrecognizedCriticalFields.push('довжина волосся: "' + lengthTrimmed + '"');
                }
                if (densityTrimmed && !allowedDensityValues.has(densityTrimmed)) {
                    unrecognizedCriticalFields.push('густота волосся: "' + densityTrimmed + '"');
                }
                if (thicknessTrimmed && !allowedThicknessValues.has(thicknessTrimmed)) {
                    unrecognizedCriticalFields.push('товщина волосся: "' + thicknessTrimmed + '"');
                }
                if (tDirTrimmed && !allowedTargetDirectionValues.has(tDirTrimmed)) {
                    unrecognizedCriticalFields.push('бажаний відтінок: "' + tDirTrimmed + '"');
                }
                if (unrecognizedCriticalFields.length > 0) {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: Number.isFinite(tLevel) ? (tLevel + '.' + tDir) : 'не визначено',
                        blockers: [
                            'Нерозпізнані критичні значення (поза дозволеним переліком): ' + unrecognizedCriticalFields.join(', ') + '.'
                        ],
                        warnings: [
                            'Фінальний рецепт не може бути підтверджений з нерозпізнаними значеннями довжини, густоти, товщини або бажаного відтінку.'
                        ],
                        diagnostics: [
                            'Оберіть лише дозволені варіанти. Значення поза переліком не приймається як безпечне за замовчуванням.'
                        ],
                        reasons: {
                            unrecognized_critical_inputs: true,
                            unrecognizedCriticalFields
                        }
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }

                // ALLERGY PRODUCTION GATE (one gate = one commit)
                // Safety passport: confirmed allergy => BLOCKED; unknown/undisclosed => MANUAL_REQUIRED.
                // A negative (no) allergy answer is required before any oxidative recipe can auto-approve.
                const allergyRaw = String(allergy || '').trim().toLowerCase();
                const allergyPositiveSet = new Set(['yes', 'y', 'так', 'да', 'true', '1', 'positive', 'позитивно', 'present']);
                const allergyNegativeSet = new Set(['no', 'n', 'ні', 'нет', 'false', '0', 'none', 'negative', 'немає', 'відсутня', 'не виявлено']);
                const allergyKnownPositive = allergyPositiveSet.has(allergyRaw);
                const allergyKnownNegative = allergyNegativeSet.has(allergyRaw);
                const allergyUnknown = !allergyKnownPositive && !allergyKnownNegative;
                if (allergyKnownPositive) {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: `${tLevel}.${tDir}`,
                        blockers: ['ФАТАЛЬНО: Підтверджена алергія. Оксидаційне фарбування заборонено до медичного допуску та негативного тесту на алерген.'],
                        warnings,
                        diagnostics
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }
                if (allergyUnknown) {
                    manualDecisions.push({
                        title: 'Алергічний статус не підтверджено',
                        message: 'Потрібен тест на алерген (PPD / парафенілендіамін) і рішення майстра перед оксидаційним фарбуванням. Рецепт не може бути автоматично затверджений.'
                    });
                }

                // SCALP SENSITIVITY PRODUCTION GATE (one gate = one commit)
                // Safety passport: irritated/inflamed scalp => BLOCKED; sensitive or unknown => MANUAL_REQUIRED;
                // normal => no gate. Absent/empty is already handled as a missing critical field (BLOCKED) above.
                const scalpRaw = String(scalp || '').trim().toLowerCase();
                const scalpIrritatedSet = new Set(['irritated', 'damaged', 'inflamed', 'подразнена', 'подразнення', 'запалена', 'пошкоджена']);
                const scalpNormalSet = new Set(['normal', 'норма', 'нормальна', 'healthy', 'здорова']);
                const scalpIrritated = scalpIrritatedSet.has(scalpRaw);
                const scalpNormal = scalpNormalSet.has(scalpRaw);
                if (scalpIrritated) {
                    const state = buildWwwRenderState({
                        status: 'BLOCKED',
                        target: `${tLevel}.${tDir}`,
                        blockers: ['ФАТАЛЬНО: Подразнена / запалена шкіра голови. Оксидаційне фарбування заборонено до відновлення шкіри.'],
                        warnings,
                        diagnostics
                    });
                    document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
                    return;
                }
                if (!scalpNormal) {
                    manualDecisions.push({
                        title: 'Стан шкіри голови потребує оцінки',
                        message: 'Чутлива або непідтверджена шкіра голови потребує ручної професійної оцінки перед оксидаційним фарбуванням. Рецепт не може бути автоматично затверджений.'
                    });
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
                const blackExitEndsHistoryText = String(endsHistory || '').toLowerCase();
                const baseTypeText = String(bType || '').toLowerCase();
                const hennaMetalsHistoryMarkers = ['хна', 'henna', 'металл', 'метал', 'metal', 'metallic', 'salts', 'солі', 'соли'];
                const hasHennaMetalsHistory = hennaMetalsHistoryMarkers.some(marker => historyText.includes(marker));
                const blackOrDarkHistory = historyText.includes('чорн')
                    || historyText.includes('черн')
                    || historyText.includes('black')
                    || historyText.includes('темн');
                const cosmeticBase = baseTypeText.includes('космет');
                const naturalHistoryMarkers = ['натурал', 'natural'];
                const cosmeticHistoryMarkers = ['космет', 'фарб', 'окраш', 'пігмент', 'пигмент', 'color', 'colour', 'dye', 'remover', 'змив'];
                const hasNaturalHistory = naturalHistoryMarkers.some(marker => historyText.includes(marker));
                const hasNaturalEndsHistory = naturalHistoryMarkers.some(marker => blackExitEndsHistoryText.includes(marker));
                const hasCosmeticHistory = cosmeticHistoryMarkers.some(marker => historyText.includes(marker));
                const hasCosmeticEndsHistory = cosmeticHistoryMarkers.some(marker => blackExitEndsHistoryText.includes(marker));
                const hasNonNaturalHistory = Boolean(historyText) && !hasNaturalHistory;
                const hasNonNaturalEndsHistory = Boolean(blackExitEndsHistoryText) && !hasNaturalEndsHistory;
                const darkLiftOnRootOrLength =
                    (rLevel <= 4 && tLevel > rLevel) ||
                    (lLevel <= 4 && tLevel > lLevel);
                const blackExitRiskyCanvas = cosmeticBase
                    || hasCosmeticHistory
                    || hasCosmeticEndsHistory
                    || hasNonNaturalHistory
                    || hasNonNaturalEndsHistory;
                const blackExitNeedsDiagnostics = darkLiftOnRootOrLength && (
                    blackExitRiskyCanvas
                    || (blackOrDarkHistory && !hasNaturalHistory)
                );

                if (blackExitNeedsDiagnostics) {
                    warnings.push("⚠️ ВИХІД З ЧОРНОГО / ТЕМНОЇ КОСМЕТИЧНОЇ БАЗИ АБО ДОВЖИНИ: потрібна додаткова діагностика косметичних нашарувань, змивок, фону освітлення, стану полотна та тест-пасмо.");
                    manualDecisions.push({
                        title: "Вихід з чорного / темної косметичної бази або довжини",
                        message: "Уточнити кількість косметичних нашарувань, кислотні або лужні змивки, поточний фон освітлення, стан полотна та результат тест-пасма перед виконанням рецепта."
                    });
                }

                if (hasHennaMetalsHistory) {
                    warnings.push("⚠️ ХНА / МЕТАЛЕВІ СОЛІ: можливі непередбачувані реакції з окисниками або освітленням. Потрібна діагностика історії полотна та тест-пасмо перед будь-яким хімічним процесом.");
                    manualDecisions.push({
                        title: "Хна / металеві солі",
                        message: "Не вважати рецепт автоматично затвердженим. Потрібне ручне рішення майстра після уточнення складу попереднього фарбування, металевих солей і результату тест-пасма."
                    });
                }

                // LOW ELASTICITY SAFETY GUARD
                // Reads ctx.elasticity / ctx.hair_elasticity / ctx.wet_stretch from fake DOM or test input.
                // The field is optional — absent means no signal.
                const elasticityElement = document.getElementById('elasticity');
                const elasticityRaw = elasticityElement ? String(elasticityElement.value || '').toLowerCase() : '';

                const lowElasticityNegativeMarkers = ['low', 'poor', 'weak', 'bad', 'низьк', 'низк', 'слаб', 'поган', 'плох', 'тягн', 'тян'];
                const normalElasticityMarkers = ['normal', 'good', 'норм', 'хорош', 'добра'];
                const isNormalElasticity = normalElasticityMarkers.some(m => elasticityRaw.includes(m));
                const hasLowElasticitySignal = !isNormalElasticity && lowElasticityNegativeMarkers.some(m => elasticityRaw.includes(m));

                if (hasLowElasticitySignal) {
                    warnings.push("⚠️ НИЗЬКА ЕЛАСТИЧНІСТЬ: Волосся може розтягуватися, ламатися або нерівномірно поглинати фарбник. Необхідна попередня діагностика та тест-пасмо. Рецепт не може бути автоматично затверджений.");
                    manualDecisions.push({
                        title: "Низька еластичність / ризик розтягування",
                        message: "Підтвердити стан еластичності полотна та виконати тест-пасмо або оцінку вологого розтягування перед хімічним процесом. Ламке або слабке волосся не має отримувати автоматично затверджений рецепт освітлення."
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
                    // KNOWN LIMITATION — docs/known-limitations-contract.md §5:
                    // massModel.rootMass оновлюється до фактичної post-surcharge маси.
                    // massModel.totalMass залишається номінальним (pre-surcharge базовий розрахунок).
                    // Після сюрчарджу: rootMass + lengthMass ≠ totalMass — це очікувана поведінка.
                    // Порошок завжди тригерить brand gate → MANUAL_REQUIRED, тому divergence
                    // не потрапляє в approved recipe. Тест: LIMITATION-POWDER-SURCHARGE-MANUAL-NO-EXACT-GRAMS.
                    massModel = Object.assign({}, massModel, { rootMass: rMass });
                }

                // ПАТЧ: Попередження для 30% сивини
                if (grey >= 30 && grey < 50) {
                    let isValidRootGrey = rootRec && String(rootRec.process).includes("Перманент") && ["6%", "9%", "12%"].includes(rootRec.ox);
                    let isValidLenGrey = lenRec && String(lenRec.process).includes("Перманент") && ["6%", "9%", "12%"].includes(lenRec.ox);

                    if (isValidRootGrey || isValidLenGrey) {
                        warnings.push("⚠️ СИВИНА 30-49%: Система не додає базу .00 автоматично. Можлива прозорість або недостатнє покриття. За потреби, додайте базу самостійно (напр. 1/4 маси).");
                        if (greyType === 'стекловидная') {
                            manualDecisions.push({
                                title: "Скловидна сивина 30%",
                                message: "Скловидна сивина важко піддається фарбуванню. Окрім мордонсажу, розгляньте додавання бази .00 для щільності."
                            });
                        }
                    }
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

                // Calculate production timing from process types.
                // timing = max(root, length) base minutes + tMod (thickness modifier).
                // If no process matches, timing stays 0 (not rendered as empty).
                const rootBaseTiming = getBaseProcessTiming(rootRec ? rootRec.process : '');
                const lenBaseTiming = getBaseProcessTiming(lenRec ? lenRec.process : '');
                const baseTiming = Math.max(rootBaseTiming, lenBaseTiming);
                timing = baseTiming > 0 ? Math.max(0, baseTiming + tMod) : 0;

                function extractOxPercent(value) {
                    const match = String(value || '').match(/(\d+(?:[.,]\d+)?)\s*%/);
                    if (!match) return null;
                    const parsed = Number(match[1].replace(',', '.'));
                    return Number.isFinite(parsed) ? parsed : null;
                }

                const rootOxPercent = extractOxPercent(rootRec && rootRec.ox);
                const lengthOxPercent = extractOxPercent(lenRec && lenRec.ox);
                const rootHighOxidizer = rootOxPercent !== null && rootOxPercent >= 9;
                const lengthHighOxidizer = lengthOxPercent !== null && lengthOxPercent >= 9;

                const rootConditionText = String(rootCondition || '').toLowerCase();
                const rootDamageNeutralMarkers = ['healthy', 'normal', 'здоров', 'норм'];
                const rootDamageMarkers = ['strongly damaged', 'root damage', 'сильно пошкод', 'сильно повреж', 'damaged', 'пошкод', 'повреж', 'brittle', 'ламк'];
                const isRootDamageNeutral = rootDamageNeutralMarkers.some(marker => rootConditionText.includes(marker));
                const rootDamagedDetected = Boolean(rootConditionText)
                    && !isRootDamageNeutral
                    && rootDamageMarkers.some(marker => rootConditionText.includes(marker));
                const rootProcessText = rootRec ? String(rootRec.process || '').toLowerCase() : '';
                const rootLiftProcessMarkers = ['lift', 'lightening', 'powder', 'special blond', 'порош', 'освіт', 'освет'];
                const rootLiftOrHighRiskProcess = Boolean(rootRec)
                    && (rStep > 0 || rootLiftProcessMarkers.some(marker => rootProcessText.includes(marker)));
                const rootDamagedLiftNeedsConfirmation = rootDamagedDetected && rootLiftOrHighRiskProcess;

                if (rootDamagedLiftNeedsConfirmation) {
                    warnings.push("⚠️ ПОШКОДЖЕНИЙ КОРІНЬ + ОСВІТЛЕННЯ: root_condition вказує на пошкоджений або ламкий корінь. Підняття рівня, порошок або Special Blond потребують ручного рішення та тест-пасма.");
                    manualDecisions.push({
                        title: "Пошкоджений корінь / root damage",
                        message: `Підтвердити стан кореня перед root lift. root_condition: ${rootCondition}. Процес кореня: ${rootRec ? rootRec.process : 'не визначено'}. Automatic approved recipe заборонений без ручного рішення.`
                    });
                }

                const lengthConditionText = String(lengthCondition || '').toLowerCase();
                const lengthDamageNeutralMarkers = ['healthy', 'normal', 'здоров', 'норм'];
                const lengthDamageMarkers = ['strongly damaged', 'length damage', 'brittle', 'damaged', 'сильно пошкод', 'сильно повреж', 'пошкод', 'повреж', 'ламк'];
                const isLengthDamageNeutral = lengthDamageNeutralMarkers.some(marker => lengthConditionText.includes(marker));
                const lengthDamagedDetected = Boolean(lengthConditionText)
                    && !isLengthDamageNeutral
                    && lengthDamageMarkers.some(marker => lengthConditionText.includes(marker));
                const lengthProcessText = lenRec ? String(lenRec.process || '').toLowerCase() : '';
                const lengthLiftProcessMarkers = ['lift', 'lightening', 'powder', 'special blond', 'порош', 'освіт', 'освет'];
                const lengthLiftOrHighRiskProcess = Boolean(lenRec)
                    && (lStep > 0 || lengthLiftProcessMarkers.some(marker => lengthProcessText.includes(marker)));
                const lengthDamagedLiftNeedsConfirmation = lengthDamagedDetected && lengthLiftOrHighRiskProcess;

                if (lengthDamagedLiftNeedsConfirmation) {
                    warnings.push("⚠️ ПОШКОДЖЕНА / ЛАМКА ДОВЖИНА + ОСВІТЛЕННЯ: length_condition вказує на пошкоджену або ламку довжину. Підняття рівня, порошок або Special Blond потребують ручного рішення та тест-пасма.");
                    manualDecisions.push({
                        title: "Пошкоджена довжина / length damage",
                        message: `Підтвердити стан довжини перед length lift. length_condition: ${lengthCondition}. Процес довжини: ${lenRec ? lenRec.process : 'не визначено'}. Automatic approved recipe заборонений без ручного рішення.`
                    });
                }

                const porosityText = String(porosity || '').toLowerCase();
                const neutralPorosityMarkers = ['normal', 'good', 'low', 'medium', 'норм', 'добра', 'добрий', 'низьк', 'низк', 'середн'];
                const highPorosityMarkers = ['high porosity', 'porous hair', 'porous canvas', 'висока пористість', 'високопорист', 'дуже пористе', 'сильна пористість', 'пористе полотно'];
                const isNeutralPorosity = neutralPorosityMarkers.some(marker => porosityText.includes(marker));
                const hasHighPorositySignal = Boolean(porosityText)
                    && !isNeutralPorosity
                    && highPorosityMarkers.some(marker => porosityText.includes(marker));
                const hasSpecialBlondProcess =
                    (rootRec && String(rootRec.process).includes("Special Blond")) ||
                    (lenRec && String(lenRec.process).includes("Special Blond"));
                const specialBlondHighPorosityNeedsConfirmation = hasSpecialBlondProcess && hasHighPorositySignal;

                const legacyConditionText = String(condition || '').toLowerCase();
                const legacyHighOxidizerRisk = String(condition || '').trim() === 'сильно поврежденные'
                    || ['strongly damaged', 'сильно пошкод', 'сильно повреж', 'damaged', 'пошкод', 'повреж'].some(marker => legacyConditionText.includes(marker));
                const rootHighOxidizerRisk = rootDamagedDetected || legacyHighOxidizerRisk || hasHighPorositySignal || hasLowElasticitySignal;
                const lengthHighOxidizerRisk = lengthDamagedDetected || legacyHighOxidizerRisk || hasHighPorositySignal || hasLowElasticitySignal;
                const rootHighOxidizerNeedsConfirmation = rootHighOxidizer && rootHighOxidizerRisk;
                const lengthHighOxidizerNeedsConfirmation = lengthHighOxidizer && lengthHighOxidizerRisk;

                if (rootHighOxidizerNeedsConfirmation) {
                    warnings.push(`⚠️ ВИСОКИЙ ОКСИД НА РИЗИКОВОМУ / ПОШКОДЖЕНОМУ КОРЕНІ: рецепт кореня містить ${rootRec.ox}. За наявності пошкодження, високої пористості, низької еластичності або іншого ризикового стану потрібне ручне рішення та тест-пасмо.`);
                    manualDecisions.push({
                        title: "Високий оксид на ризиковому корені",
                        message: `Підтвердити використання ${rootRec.ox} на корені перед виконанням рецепта. Automatic approved recipe заборонений без ручного рішення майстра.`
                    });
                }

                if (lengthHighOxidizerNeedsConfirmation) {
                    warnings.push(`⚠️ ВИСОКИЙ ОКСИД НА РИЗИКОВІЙ / ПОШКОДЖЕНІЙ ДОВЖИНІ: рецепт довжини містить ${lenRec.ox}. За наявності пошкодження, високої пористості, низької еластичності або іншого ризикового стану потрібне ручне рішення та тест-пасмо.`);
                    manualDecisions.push({
                        title: "Високий оксид на ризиковій довжині",
                        message: `Підтвердити використання ${lenRec.ox} на довжині перед виконанням рецепта. Automatic approved recipe заборонений без ручного рішення майстра.`
                    });
                }

                // BRAND READINESS INVARIANT — docs/brand-data-layer-contract.md
                // hasBrandRuleMatrix = false is intentional. It is NOT a placeholder.
                // While false, every sensitive formula type (Special Blond, grey .00,
                // high oxidizer >=9%, powder/lightening, toning) produces MANUAL_REQUIRED.
                // This also covers the G1 gap: condition='пористі' + Special Blond + empty
                // porosity field has no dedicated guard; brand gate is its current safety net.
                //
                // DO NOT set to true unless:
                //   1. A validated brand entry (all required fields) exists in data.
                //   2. Dedicated tests confirm APPROVED is reachable only with full data.
                //   3. G1 gap is covered by a separate condition-field porous guard.
                //   4. Full test matrix passes (test_www_business_scenarios.js et al.).
                // See: docs/brand-data-layer-contract.md §4 for complete enabling checklist.
                const hasBrandRuleMatrix = false; // BRAND_MATRIX_NOT_READY
                function collectBrandSensitiveRecipeText(recipe) {
                    if (!recipe) return '';
                    return [
                        recipe.process,
                        recipe.formula,
                        recipe.dye,
                        recipe.ox,
                        recipe.ratio,
                        recipe.text,
                        recipe.notes
                    ].filter(Boolean).map(value => String(value)).join(' ');
                }

                const brandSensitiveRecipeText = [
                    collectBrandSensitiveRecipeText(rootRec),
                    collectBrandSensitiveRecipeText(lenRec)
                ].join(' ').toLowerCase();
                const brandSensitiveReasons = [];
                const brandSensitiveSpecialBlond = ['special blond', 'special blonde', 'спецблонд', 'спец блонд']
                    .some(marker => brandSensitiveRecipeText.includes(marker));
                const brandSensitiveGreyBase = ['.00', '/00', 'double natural', 'intense natural']
                    .some(marker => brandSensitiveRecipeText.includes(marker));
                const brandSensitiveHighOxidizer = rootHighOxidizer || lengthHighOxidizer;
                const brandSensitivePowder = ['powder', 'порошок', 'порош']
                    .some(marker => brandSensitiveRecipeText.includes(marker));
                const brandSensitiveToning = ['перманент / тонування', 'тонування', 'toning']
                    .some(marker => brandSensitiveRecipeText.includes(marker));

                if (brandSensitiveSpecialBlond) brandSensitiveReasons.push('Special Blond');
                if (brandSensitiveGreyBase) brandSensitiveReasons.push('.00 / grey coverage');
                if (brandSensitiveHighOxidizer) brandSensitiveReasons.push('high oxidizer >= 9%');
                if (brandSensitivePowder) brandSensitiveReasons.push('powder / порошок');
                if (brandSensitiveToning) brandSensitiveReasons.push('toning / Тонування');

                const brandSensitiveRecipe = brandSensitiveReasons.length > 0;
                if (brandSensitiveRecipe && !hasBrandRuleMatrix) {
                    const brandSensitiveReasonText = brandSensitiveReasons.join(', ');
                    warnings.push(`⚠️ BRAND / SYSTEM RULES НЕ ПІДТВЕРДЖЕНІ: рецепт містить бренд-залежний процес (${brandSensitiveReasonText}). Потрібне підтвердження бренду, системи, лінійки, окисника, пропорції та інструкції виробника.`);
                    manualDecisions.push({
                        title: "Brand-specific rules required",
                        message: `Brand rule matrix відсутня. Виявлено: ${brandSensitiveReasonText}. Special Blond, .00 grey coverage, high oxidizer, powder і toning залежать від бренду, лінійки, сумісності окисника, пропорції змішування та інструкції виробника. Automatic approved recipe заборонений без підтвердження brand/system rules.`
                    });
                }

                if (hasHighPorositySignal) {
                    warnings.push(specialBlondHighPorosityNeedsConfirmation
                        ? "⚠️ SPECIAL BLOND + ВИСОКА ПОРИСТІСТЬ: Пористе полотно при Special Blond може дати плямистість, провал тону або нестабільний результат. Потрібне ручне рішення та тест-пасмо."
                        : "⚠️ ВИСОКА ПОРИСТІСТЬ ПОЛОТНА: Хімічний процес потребує ручного контролю, оцінки поглинання та тест-пасма.");
                    manualDecisions.push({
                        title: specialBlondHighPorosityNeedsConfirmation ? "Special Blond + висока пористість" : "Висока пористість полотна",
                        message: specialBlondHighPorosityNeedsConfirmation
                            ? "Підтвердити доцільність Special Blond на високопористому полотні, оцінити ризик нерівномірного освітлення, перевантаження пігментом і виконати тест-пасмо."
                            : "Підтвердити стан пористості полотна перед хімічним процесом і виконати тест-пасмо або ручну корекцію рецепта."
                    });
                }

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

                let specialBlondWithGreyNeedsConfirmation =
                    grey > 0 && hasSpecialBlondProcess;

                if (specialBlondWithGreyNeedsConfirmation) {
                    warnings.push("⚠️ SPECIAL BLOND НА СИВИНУ: Special Blond не гарантує щільного покриття сивини. Потрібне рішення майстра.");
                    manualDecisions.push({
                        title: "Special Blond на сивину",
                        message: "Підтвердити використання Special Blond при наявності сивини (можливе прозоре або недостатнє покриття)."
                    });
                }

                const endsLevelProvidedForPrepig = Number.isFinite(eLevel);
                const lengthNeedsPrepigHistory = historyText !== 'натуральні';
                const endsHistoryTextForPrepig = String(endsHistory || '').toLowerCase();
                const endsNeedsPrepigHistory = endsHistoryTextForPrepig !== '' && endsHistoryTextForPrepig !== 'натуральні';

                let significantDarkeningNeedsPrepig =
                    (lengthNeedsPrepigHistory && (lLevel - tLevel) >= 3) ||
                    (endsLevelProvidedForPrepig && endsNeedsPrepigHistory && (eLevel - tLevel) >= 3);

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
                const endsHistoryText = String(endsHistory || '').toLowerCase();
                const endsBaseTypeText = String(endsBaseType || '').toLowerCase();
                function includesAnyMarker(text, markers) {
                    return markers.some(marker => text.includes(marker));
                }
                const endsConditionProvided = Boolean(endsConditionText);
                const endsConditionRiskMarkers = ['damaged', 'brittle', 'porous', 'пошкод', 'повреж', 'ламк', 'порист', 'критич', 'сух', 'пересуш', 'розшар', 'січ', 'облам'];
                const riskyEndsCondition = Boolean(endsConditionText)
                    && includesAnyMarker(endsConditionText, endsConditionRiskMarkers);
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

                const endsHistoryProvided = Boolean(endsHistoryText);
                const endsBaseTypeProvided = Boolean(endsBaseTypeText);
                const endsHistoryRiskMarkers = ['освітлен', 'осветл', 'lightened', 'bleached', 'bleach', 'decolor', 'космет', 'фарб', 'окраш', 'colored', 'dyed', 'хна', 'henna', 'метал', 'salts', 'dark cosmetic', 'темна космет', 'black', 'чорн', 'накопич', 'unknown', 'невідом'];
                const endsBaseTypeRiskMarkers = ['освітлен', 'осветл', 'lightened', 'космет', 'фарб', 'окраш', 'colored', 'dyed', 'змішан', 'смешан', 'mixed', 'uneven', 'нерівном', 'пятн', 'плям', 'темна космет', 'dark cosmetic', 'black', 'чорн'];
                const riskyEndsHistory = Boolean(endsHistoryText)
                    && includesAnyMarker(endsHistoryText, endsHistoryRiskMarkers);
                const riskyEndsBaseType = Boolean(endsBaseTypeText)
                    && includesAnyMarker(endsBaseTypeText, endsBaseTypeRiskMarkers);

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

                const endsLevelDiffers = endsLevelProvided && Number.isFinite(lLevel) && eLevel !== lLevel;
                const sameLevelButEndsRisky = endsLevelProvided
                    && Number.isFinite(lLevel)
                    && eLevel === lLevel
                    && (riskyEndsCondition || riskyEndsHistory || riskyEndsBaseType);
                const endsConflictDetected = endsLevelDiffers
                    || riskyEndsCondition
                    || riskyEndsHistory
                    || riskyEndsBaseType;

                if (endsConflictDetected) {
                    warnings.push("⚠️ MULTI-ZONE / ENDS CONFLICT: кінці мають окремий стан/історію/базу. Unified root/length approved recipe заборонений без ручної перевірки.");
                    manualDecisions.push({
                        title: "Multi-zone ends conflict",
                        message: `ends_condition: ${endsCondition || 'не вказано'}, ends_history: ${endsHistory || 'не вказано'}, ends_base_type: ${endsBaseType || 'не вказано'}, ends_level: ${endsLevelProvided ? eLevel : 'не вказано'}. Ці дані показують ризик або конфлікт кінців. Production endsRec не активується; потрібна ручна оцінка, тест-пасмо і окреме рішення майстра перед використанням root/length рецепта.`
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

                               let endsRecDiagnosticWiringCandidate = null;
                try {
                    const diagnosticContext = {
                        ends_level: eLevel,
                        length_level: lLevel,
                        root_level: rLevel,
                        ends_condition: endsCondition,
                        ends_history: endsHistory,
                        ends_base_type: endsBaseType,
                        target_level: tLevel,
                        length: length,
                        density: density,
                        threeZoneGateDecision,
                        threeZoneCandidateMassModel,
                        threeZonePreviewOnly,
                        threeZoneEndsRecipeReady,
                        endsRecCandidatePreview,
                        massModel,
                        rootRec,
                        lenRec
                    };

                    const dReadiness = validateProductionEndsRecReadiness(diagnosticContext);
                    const dBuilder = buildProductionEndsRec(diagnosticContext, dReadiness);
                    const dFormula = classifyProductionEndsRecFormulaContract(diagnosticContext, dReadiness, dBuilder);
                    const dMass = classifyProductionEndsRecMassAllocationContract(diagnosticContext, dReadiness, dBuilder, dFormula);
                    const dAssembly = assembleProductionEndsRecContract(diagnosticContext, dReadiness, dBuilder, dFormula, dMass);
                    const dWiring = buildControlledEndsRecDiagnosticWiringContract(diagnosticContext, dReadiness, dBuilder, dFormula, dMass, dAssembly);

                    if (dWiring && dWiring.diagnosticReady && dWiring.diagnosticCandidate) {
                        endsRecDiagnosticWiringCandidate = {
                            zone: 'ends',
                            candidateOnly: true,
                            previewOnly: true,
                            notForMixing: true,
                            productionReady: false,
                            endsRecipeReady: false,
                            sourceRefs: Object.assign({}, dWiring.diagnosticCandidate.sourceRefs),
                            safetyReasonCodes: Array.isArray(dWiring.diagnosticCandidate.safetyReasonCodes) ? dWiring.diagnosticCandidate.safetyReasonCodes.slice() : [],
                            manualRequiredReasonCodes: Array.isArray(dWiring.diagnosticCandidate.manualRequiredReasonCodes) ? dWiring.diagnosticCandidate.manualRequiredReasonCodes.slice() : []
                        };
                    }
                } catch (err) {
                    // Fail-safe: do not disrupt primary 2-zone calculation paths
                }

                const reasons = { rootStep: rStep, lengthStep: lStep, rootConditionProvided: Boolean(rootCondition), lengthConditionProvided: Boolean(lengthCondition), rootDamagedDetected, rootDamagedLiftNeedsConfirmation, lengthDamagedDetected, lengthDamagedLiftNeedsConfirmation, rootOxPercent, lengthOxPercent, rootHighOxidizer, lengthHighOxidizer, legacyHighOxidizerRisk, rootHighOxidizerRisk, lengthHighOxidizerRisk, rootHighOxidizerNeedsConfirmation, lengthHighOxidizerNeedsConfirmation, endsLevel: eLevel, endsCondition, endsHistory, endsBaseType, hotRoot, grey, porosity, hasHighPorositySignal, specialBlondHighPorosityNeedsConfirmation, specialBlondBase6NeedsConfirmation, significantDarkeningNeedsPrepig, zoneLevelDifference, zoneProcessesDiffer, zoneDecisionNeedsConfirmation, endsLevelProvided, endsDiffersFromRoot, endsDiffersFromLength, endsLevelNeedsConfirmation, endsConditionProvided, riskyEndsCondition, endsLighteningNeeded, endsChemicalInterventionLikely, endsConditionNeedsConfirmation, endsConditionMissingWithDifferentLevel, endsHistoryProvided, endsBaseTypeProvided, riskyEndsHistory, riskyEndsBaseType, endsHistoryNeedsConfirmation, endsBaseTypeNeedsConfirmation, endsLevelDiffers, sameLevelButEndsRisky, endsConflictDetected, threeZonePreviewEligible, threeZoneGateDecision, threeZoneCandidateMassModel, threeZonePreviewOnly, threeZoneEndsRecipeReady };
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
                    timing,
                    reasons,
                    endsRecDiagnosticWiringCandidate
                });
                document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml(state);
            } catch (e) {
                document.getElementById('output').innerHTML = PerucarWwwRenderV1.renderStateToHtml({
                    status: 'FATAL_ERROR',
                    error: e
                });
            }
        }
