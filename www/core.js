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

                let alerts = [], warnings = [], diagnostics = [];
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
                    document.getElementById('output').innerHTML = `<div class='alert'><h2>❌ БЛОКУВАННЯ</h2><ul>${alerts.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
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
                    document.getElementById('output').innerHTML = `<div class='alert'><h2>❌ БЛОКУВАННЯ</h2><ul><li>ФАТАЛЬНО: Довжина 'сильно пошкоджена'. Будь-яке освітлення заборонено.</li></ul></div>`;
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
                        phases.push('Фаза 0: Препігментація (тепла підкладка 1:1:1 + вода)');
                    }

                    if (baseType === 'Натуральна' && rootStep >= 1 && rootStep <= 3) {
                        phases.push('Підняття кореня: Перманентна фарба на 6% або 9%');
                    }

                    if (midActive && midLevel === targetLevel) {
                        phases.push('Нейтралізація зони переходу (Фарба на 1.5% або 3%)');
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

                let html = `<div class='success'><h2 style="color:green; margin-top:0;">✅ ПРОТОКОЛ ЗАТВЕРДЖЕНО</h2>`;
                html += `<b>🎯 Ціль:</b> <span style="color:blue;">${tLevel}.${tDir}</span> | <b>⚖️ Загальна маса фарби:</b> <span style="color:blue;">${totalMass} гр</span><hr>`;
                
                if (warnings.length || diagnostics.length) {
                    html += `<b>🔹 АНАЛІЗ ТА ПОПЕРЕДЖЕННЯ:</b><ul>`;
                    warnings.forEach(w => html += `<li><span class="warning">⚠️ ${w}</span></li>`);
                    diagnostics.forEach(d => html += `<li>🔬 ${d}</li>`);
                    html += `</ul><hr>`;
                }

                html += `<b>🧪 КОРІНЬ:</b><ul><li><b>Інструмент:</b> ${rootRec.dye} + ${rootRec.ox}</li><li><b>Загальна маса суміші:</b> ${rootRec.mass} гр (${rootRec.ratio})</li><li><b>Мікстони:</b> ${rootRec.mixtone}</li></ul>`;
                html += `<b>🧪 ДОВЖИНА:</b><ul><li><b>Інструмент:</b> ${lenRec.dye} + ${lenRec.ox}</li><li><b>Загальна маса суміші:</b> ${lenRec.mass} гр (${lenRec.ratio})</li><li><b>Мікстони:</b> ${lenRec.mixtone}</li></ul><hr>`;
                
                html += `<b>📋 РЕГЛАМЕНТ ДІЙ:</b><ul>`;
                plan.forEach(p => html += `<li>▫️ ${p}</li>`);
                html += `</ul><b>⏳ Розрахунковий час:</b> ${timing} хв.</div>`;

                document.getElementById('output').innerHTML = html;
            } catch (e) {
                document.getElementById('output').innerHTML = `<div class='alert'><h2>❌ ФАТАЛЬНА ПОМИЛКА СКРИПТА</h2><p><b>Опис:</b> ${e.message}</p></div>`;
            }
        }
