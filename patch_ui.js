const fs = require('fs');
let html = fs.readFileSync('colorist.html', 'utf8');

if (!html.includes('<script src="core.js"></script>')) {
    html = html.replace('</head>', '<script src="core.js"></script>\n</head>');
}

// Remove duplicated code
const startDuplicate = '// ===== PIGMENT MAP =====';
const endDuplicate = '// ===== UI CONTROLLER =====';

if (html.includes(startDuplicate) && html.includes(endDuplicate)) {
    const before = html.substring(0, html.indexOf(startDuplicate));
    const after = html.substring(html.indexOf(endDuplicate));
    html = before + after;
}

// Replace run() function
const runRegex = /function run\(d\) \{[\s\S]*?\n\}/;
const newRun = `function run(d){
    const input = {
        history: 'здоровые',
        condition: d.porosity === 'Пориста' ? 'пористі' : 'здоровые',
        thickness: 'средние',
        hairDensity: d.hairDensity || 'NORMAL',
        hairLength: d.hairLength || 'MEDIUM',
        grey: d.grey || '0',
        greyType: d.porosity === 'Склоподібна' ? 'стекловидная' : 'мягкая',
        elasticity: d.elasticity || '1',
        rootLevel: d.rLevel,
        rootLength: d.rootLen === '3' ? '3' : (d.rootLen === '2' ? '1.5' : '1'),
        lengthLevel: d.lLevel,
        baseType: d.baseType || 'Натуральна',
        targetLevel: d.tLevel,
        targetDirection: d.tDir
    };
    try {
        const master = new MasterNode();
        const state = master.process(input);
        sumHdr.textContent = \`Зведення: \${d.brand || ''} → \${input.targetLevel}.\${input.targetDirection}\`;
        render(state, input);
    } catch(e) {
        console.error(e);
        out.innerHTML = \`<div class="blocked-full">🚨 ПОМИЛКА: \${e.message}</div>\`;
    }
}`;

html = html.replace(runRegex, newRun);

// Replace render() and below
const renderStart = '// ============================================================';
const beforeRender = html.substring(0, html.indexOf(renderStart));

const newRender = `// ============================================================
// RENDER ENGINE v4 — Progressive Disclosure (Матрьошка)
// ============================================================

window.showReason = function(text) {
    alert(text);
};

function render(s, input) {
    let h = '';

    // Блокування
    if (s.status === 'BLOCKED' || s.status === 'FATAL_ERROR') {
        (s.stages || []).forEach(st => {
            h += \`<div class="blocked-full">
                <div class="blocked-title" style="color:#ff8fab;font-size:1.15em;font-weight:700;margin-bottom:10px">
                    🚨 \${st.title}
                </div>
                <div style="color:#ffb4c0;font-size:.95em;line-height:1.55">\${st.text}</div>
            </div>\`;
        });
        out.innerHTML = h;
        return;
    }

    // Попередження та Діагностика
    if (s.warnings && s.warnings.length) {
        s.warnings.forEach(w => { h += \`<div class="warn-box">⚠️ \${w}</div>\`; });
    }
    if (s.diagnostics && s.diagnostics.length) {
        s.diagnostics.forEach(d => { h += \`<div class="diag-box">🔬 \${d}</div>\`; });
    }

    // Рендер Фаз (Матрьошка)
    if (s.phases && s.phases.length > 0) {
        s.phases.forEach((phase, idx) => {
            const isOpen = idx === 0 ? 'open' : ''; // Перша фаза відкрита за замовчуванням
            h += \`
            <details \${isOpen} class="phase-details" style="background:#1e1e1e; border:1px solid #333; border-radius:10px; margin-bottom:12px; overflow:hidden;">
                <summary style="background:#2a2a2a; padding:16px; font-size:1.2em; font-weight:700; color:#bb86fc; cursor:pointer; user-select:none; outline:none; touch-action:manipulation; border-bottom:1px solid #111; list-style-position: inside;">
                    \${phase.phaseName}
                </summary>
                <div style="padding:12px;">
            \`;
            
            if (phase.steps && phase.steps.length > 0) {
                phase.steps.forEach(step => {
                    h += \`
                    <div class="step-card" style="background:#141414; border-left:4px solid #bb86fc; padding:12px; margin-bottom:10px; border-radius:0 8px 8px 0; position:relative;">
                        <div style="font-weight:700; color:#fff; font-size:1.05em; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                            <span>\${step.stepName}</span>
                            \${step.reason ? \`<span onclick="showReason('\${step.reason}')" style="cursor:pointer; background:#bb86fc; color:#0d0d0d; border-radius:12px; padding:4px 10px; font-size:0.85em; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🧠 Чому?</span>\` : ''}
                        </div>
                        <div style="color:#e0e0e0; font-size:0.95em; margin-bottom:4px; font-weight:600;">\${step.action}</div>
                        \${step.details ? \`<div style="color:#aaa; font-size:0.85em; border-top:1px dashed #333; padding-top:6px; margin-top:6px;">\${step.details}</div>\` : ''}
                    </div>
                    \`;
                });
            } else {
                h += \`<div style="color:#888; font-style:italic;">Немає кроків у цій фазі.</div>\`;
            }
            h += \`</div></details>\`;
        });
    }

    // Час витримки
    if (s.timing) {
        h += \`<div class="timing-box" style="margin-top:16px;">⏱ Загальний час витримки<br>
              <span class="big" style="color:#bb86fc;">\${s.timing} хв</span></div>\`;
    }

    // Логіка під капотом
    if (s.underTheHood && s.underTheHood.length) {
        h += \`<details style="margin-top:16px; background:transparent; border:none;">
            <summary style="color:#666; font-size:0.9em; cursor:pointer;">[i] Логіка алгоритму</summary>
            \${s.underTheHood.map(u => \`<div style="margin:4px 0;color:#888; font-size:0.85em;">• \${u}</div>\`).join('')}
        </details>\`;
    }

    out.innerHTML = h;
}
</script>
</body>
</html>
`;

fs.writeFileSync('colorist.html', beforeRender + newRender);
console.log("colorist.html updated successfully with new phases render and core.js linking.");
