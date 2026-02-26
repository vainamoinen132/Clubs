/**
 * ui_training.js
 * FM-style passive training interface.
 * No AP clicking. Set intensity + individual focus, training runs automatically each week.
 */

window.UITraining = {

    _intensityLabels: {
        1: { label: 'Rest Week', color: '#42a5f5', desc: 'No gains. Full squad recovers −20 fatigue.' },
        2: { label: 'Very Light', color: '#66bb6a', desc: '0–1 stat gain/fighter. Minimal fatigue.' },
        3: { label: 'Light', color: '#66bb6a', desc: '0–1 stat gain/fighter. Low fatigue.' },
        4: { label: 'Standard', color: '#ffca28', desc: '1–2 stat gains/fighter. Moderate fatigue.' },
        5: { label: 'Standard', color: '#ffca28', desc: '1–2 stat gains/fighter. Balanced approach.' },
        6: { label: 'Intensive', color: '#ffa726', desc: '1–3 stat gains/fighter. Higher fatigue.' },
        7: { label: 'Intensive', color: '#ff7043', desc: '2–3 stat gains/fighter. Significant fatigue.' },
        8: { label: 'High Demand', color: '#ef5350', desc: '2–4 stat gains/fighter. High fatigue & injury risk.' },
        9: { label: 'Hell Camp', color: '#e53935', desc: '3–4 gains/fighter. Very high injury risk!' },
        10: { label: 'Maximum Grind', color: '#b71c1c', desc: '3–5 gains/fighter. Extreme exhaustion. Use sparingly!' }
    },

    _focusOptions: [
        { value: 'general', label: '📊 General', tip: 'All stats eligible' },
        { value: 'power', label: '💪 Power', tip: 'Power & Aggression' },
        { value: 'speed', label: '⚡ Speed', tip: 'Speed & Endurance' },
        { value: 'technique', label: '🧠 Technique', tip: 'Technique, Control & Composure' },
        { value: 'resilience', label: '🛡 Resilience', tip: 'Resilience & Endurance' },
        { value: 'mental', label: '🔥 Mental', tip: 'Composure, Presence & Aggression' },
        { value: 'rest', label: '😴 Rest', tip: 'No gains — extra fatigue recovery' },
    ],

    render(container) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        const intensity = gs.trainingIntensity || 5;
        const tInfo = this._intensityLabels[intensity];
        const gymLevel = club.facilities?.gym || 1;
        const recLevel = club.facilities?.recovery || 1;
        const gymMult = [1.0, 1.0, 1.2, 1.4, 1.7][Math.min(gymLevel, 4)];
        const recMult = [1.0, 1.0, 0.85, 0.70, 0.55][Math.min(recLevel, 4)];

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Training Grounds', 'Set team intensity and individual focuses — training runs automatically each week.')}

            <!-- Team Intensity Panel -->
            <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid ${tInfo.color};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.2rem;">
                    <div>
                        <h3 class="font-outfit" style="margin:0; color:${tInfo.color};">Team Training Intensity</h3>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">${tInfo.desc}</div>
                    </div>
                    <div style="display:flex; gap:1.5rem; font-size:0.82rem; color:var(--text-muted);">
                        <div>🏋️ Gym <strong style="color:#a855f7;">Lv ${gymLevel}</strong> <span style="color:#a855f7;">(×${gymMult.toFixed(1)} gains)</span></div>
                        <div>💤 Recovery <strong style="color:#42a5f5;">Lv ${recLevel}</strong> <span style="color:#42a5f5;">(−${Math.round((1 - recMult) * 100)}% fatigue)</span></div>
                    </div>
                </div>

                <!-- Intensity Slider -->
                <div style="display:flex; align-items:center; gap:1.5rem; margin-bottom:0.7rem;">
                    <span style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">Rest</span>
                    <input type="range" id="intensity-slider" min="1" max="10" value="${intensity}"
                        style="flex:1; accent-color:${tInfo.color}; cursor:pointer;"
                        oninput="window.UITraining._onIntensityChange(this.value)">
                    <span style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">Max</span>
                    <div id="intensity-badge" style="min-width:130px; text-align:center;">
                        ${this._renderIntensityBadge(intensity)}
                    </div>
                </div>

                <!-- Pip row -->
                <div style="display:flex; gap:0; margin-left:2px;">
                    ${Array.from({ length: 10 }, (_, i) => `
                        <div style="flex:1; height:3px; border-radius:2px; margin:0 1px;
                            background:${i + 1 <= intensity ? tInfo.color : 'rgba(255,255,255,0.1)'};">
                        </div>`).join('')}
                </div>
            </div>

            <!-- Fighter Focus Table -->
            <h3 class="font-outfit text-gradient" style="margin-bottom:1rem;">Individual Focus</h3>
            <div class="glass-panel" style="padding:0; overflow:hidden; margin-bottom:2rem;">
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                    <thead>
                        <tr style="background:rgba(0,0,0,0.4); border-bottom:2px solid var(--border-glass);">
                            <th style="padding:0.8rem 1rem; text-align:left; color:var(--text-muted); font-size:0.78rem; text-transform:uppercase;">Fighter</th>
                            <th style="padding:0.8rem 1rem; text-align:center; color:var(--text-muted); font-size:0.78rem; text-transform:uppercase;">Potential</th>
                            <th style="padding:0.8rem; text-align:center; color:var(--text-muted); font-size:0.78rem; text-transform:uppercase;">Fatigue</th>
                            <th style="padding:0.8rem 1rem; text-align:left; color:var(--text-muted); font-size:0.78rem; text-transform:uppercase;">Training Focus</th>
                            <th style="padding:0.8rem 1rem; text-align:left; color:var(--text-muted); font-size:0.78rem; text-transform:uppercase;">Last Week</th>
                        </tr>
                    </thead>
                    <tbody id="training-tbody"></tbody>
                </table>
            </div>

            <!-- Info Footer -->
            <div class="glass-panel" style="padding:1rem 1.5rem; font-size:0.82rem; color:var(--text-muted); border-left:3px solid var(--accent);">
                💡 Training runs automatically each week when you advance time. Stats are capped by each fighter's <strong style="color:var(--accent);">Potential Ceiling</strong>.
                High fatigue reduces gains. Overworked fighters (Fatigue >75%) risk soft injuries.
                Set a fighter to <strong>😴 Rest</strong> focus before big matches to recover faster.
            </div>
        `;

        this._buildFighterRows(club, gs);
    },

    _renderIntensityBadge(intensity) {
        const tInfo = this._intensityLabels[intensity] || this._intensityLabels[5];
        return `<div style="background:${tInfo.color}22; border:1px solid ${tInfo.color}66; border-radius:6px; padding:0.4rem 0.7rem;">
            <span style="font-weight:800; font-size:1rem; color:${tInfo.color};">${intensity}</span>
            <span style="font-size:0.75rem; color:${tInfo.color}; margin-left:0.3rem;">${tInfo.label}</span>
        </div>`;
    },

    _buildFighterRows(club, gs) {
        const tbody = document.getElementById('training-tbody');
        if (!tbody) return;

        club.fighter_ids.forEach((fId, idx) => {
            const f = gs.getFighter(fId);
            if (!f) return;

            const fat = f.dynamic_state.fatigue || 0;
            const fatColor = fat > 80 ? '#ff3d00' : fat > 60 ? '#ff9100' : fat > 35 ? '#ffea00' : '#4caf50';

            const pa = f.potential || f.natural_ceiling || 80;
            const potStr = f.scouted ? this._potentialStars(pa) : '<span style="color:var(--text-muted); letter-spacing:2px;">? ? ? ? ?</span>';

            // Last week gains
            const report = gs.trainingReport?.[fId] || [];
            const gainStr = report.length === 0
                ? '<span style="color:var(--text-muted);">No data yet</span>'
                : report.map(r => {
                    if (r.gain === 0) return `<span style="color:var(--text-muted);">${r.stat}${r.note ? ' (' + r.note + ')' : ''}</span>`;
                    return `<span style="color:#00e676;">+${r.gain} ${r.stat}</span>`;
                }).join(', ');

            const isInjured = f.dynamic_state.injuries?.length > 0;
            const rowBg = idx % 2 === 0 ? '' : 'background:rgba(255,255,255,0.02);';

            const tr = document.createElement('tr');
            tr.style.cssText = `border-bottom:1px solid var(--border-glass); ${rowBg}`;
            tr.innerHTML = `
                <td style="padding:0.8rem 1rem;">
                    <strong style="color:#fff;">${f.name}</strong>
                    ${isInjured ? '<span style="font-size:0.72rem; color:#ff5252; margin-left:6px;">🩹 INJ</span>' : ''}
                    <div style="font-size:0.72rem; color:var(--text-muted);">Age ${f.age || '?'} · ${f.personality?.archetype || '?'}</div>
                </td>
                <td style="padding:0.8rem; text-align:center; font-size:0.82rem;">${potStr}</td>
                <td style="padding:0.8rem; text-align:center;">
                    <div style="font-weight:700; color:${fatColor}; font-size:0.9rem;">${fat.toFixed(0)}%</div>
                    <div style="height:4px; width:60px; background:rgba(255,255,255,0.1); border-radius:2px; margin:2px auto 0;">
                        <div style="height:100%; width:${fat}%; background:${fatColor}; border-radius:2px;"></div>
                    </div>
                </td>
                <td style="padding:0.8rem 1rem;">
                    <select data-fighter-id="${fId}" style="background:#1a1a2e; color:#fff; border:1px solid var(--border-glass); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.85rem; width:100%; max-width:200px; cursor:pointer;">
                        ${this._focusOptions.map(opt =>
                `<option value="${opt.value}" ${f.training_focus === opt.value ? 'selected' : ''}
                                title="${opt.tip}">${opt.label}</option>`
            ).join('')}
                    </select>
                </td>
                <td style="padding:0.8rem 1rem; font-size:0.82rem;">${gainStr}</td>
            `;

            // Live focus change
            tr.querySelector('select').addEventListener('change', (e) => {
                f.training_focus = e.target.value;
            });

            tbody.appendChild(tr);
        });
    },

    _potentialStars(pa) {
        let stars;
        if (pa >= 90) stars = 5;
        else if (pa >= 80) stars = 4;
        else if (pa >= 70) stars = 3;
        else if (pa >= 60) stars = 2;
        else stars = 1;

        const filled = '<span style="color:#d4af37; font-size:1rem;">★</span>';
        const unfilled = '<span style="color:rgba(255,255,255,0.2); font-size:1rem;">★</span>';
        return filled.repeat(stars) + unfilled.repeat(5 - stars);
    },

    _onIntensityChange(val) {
        const v = parseInt(val);
        window.GameState.trainingIntensity = v;
        const badge = document.getElementById('intensity-badge');
        if (badge) badge.innerHTML = window.UITraining._renderIntensityBadge(v);

        // Update pip bar colors
        const tInfo = window.UITraining._intensityLabels[v];
        const pips = document.querySelectorAll('[data-pip]');
        if (pips.length > 0) {
            pips.forEach((p, i) => { p.style.background = i < v ? tInfo.color : 'rgba(255,255,255,0.1)'; });
        }
        // Re-render slider accent
        const slider = document.getElementById('intensity-slider');
        if (slider) slider.style.accentColor = tInfo.color;

        // Update panel border color live
        const panel = slider?.closest('.glass-panel');
        if (panel) panel.style.borderLeftColor = tInfo.color;
    }
};
