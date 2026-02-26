/**
 * ui_clubs.js
 * Renders an overview of all clubs in the game, their active rosters, and stats.
 */

window.UIClubs = {
    render(container, params) {
        const gs = window.GameState;

        let content = `
            ${window.UIComponents.createSectionHeader('Global Clubs', 'Review rival organizations, their facilities, and their contracted rosters.')}
            <div id="clubs-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
        `;

        container.innerHTML = content;

        setTimeout(() => {
            const listContainer = document.getElementById('clubs-list');
            if (listContainer) {
                listContainer.innerHTML = this._renderClubsList();
            }
        }, 0);
    },

    _getClubRecord(club) {
        // Calculate record from the schedule if not pre-computed
        const gs = window.GameState;
        let w = 0, l = 0;
        if (club.record) {
            w = club.record.w || 0;
            l = club.record.l || 0;
        } else {
            gs.schedule.forEach(match => {
                if (!match.played || !match.winnerId) return;
                if (match.home === club.id || match.away === club.id) {
                    if (match.winnerId === club.id) w++;
                    else l++;
                }
            });
        }
        return { w, l };
    },

    _getClubFacilities(club) {
        // Return facilities with safe defaults
        if (club.facilities) return club.facilities;
        return { gym: 1, recovery: 1, pr: 1 };
    },

    _getAiPersonaLabel(persona) {
        const labels = {
            'talent_developer': '🌱 Talent Developer',
            'brand_first': '💅 Brand First',
            'tactician': '🧠 Tactician',
            'big_spender': '💰 Big Spender',
            'saboteur': '🗡️ Saboteur',
            'balanced': '⚖️ Balanced',
        };
        return labels[persona] || persona || 'Unknown';
    },

    _getHomeAdvantageLabel(adv) {
        const labels = {
            'economy_rich': '💰 Deep Pockets (Starting Cash)',
            'style_catfight': '💅 Excels in Catfights',
            'style_boxing': '🥊 Excels in Boxing',
            'style_wrestling': '🤼 Excels in Wrestling',
            'style_submission': '🦴 Excels in Submissions',
            'style_kickboxing': '🦶 Excels in Kickboxing',
            'style_sexfight': '💋 Excels in Sexfights',
            'facility_boost': '🏗️ Established Facility',
            'staff_boost': '📋 Established Coach',
        };
        return labels[adv] || adv || 'None';
    },

    _renderClubsList() {
        const gs = window.GameState;
        let html = '';

        const clubs = Object.values(gs.clubs);

        if (clubs.length === 0) {
            return `<div class="glass-panel" style="padding:2rem; text-align:center; color:var(--text-muted);">No clubs loaded yet.</div>`;
        }

        // Sort: player club first so they can compare, then rest alphabetically
        clubs.sort((a, b) => {
            if (a.id === gs.playerClubId) return -1;
            if (b.id === gs.playerClubId) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });

        clubs.forEach(club => {
            const isPlayer = club.id === gs.playerClubId;
            const record = this._getClubRecord(club);
            const facilities = this._getClubFacilities(club);
            const money = club.money !== undefined ? club.money : (isPlayer ? gs.money : null);
            const location = club.location || '';

            let topFighterHtml = '<span class="text-muted">No notable fighters</span>';
            if (club.fighter_ids && club.fighter_ids.length > 0) {
                let best = club.fighter_ids
                    .map(id => gs.getFighter(id))
                    .filter(Boolean)
                    .reduce((a, b) => {
                        let aOvr = a ? (a.core_stats.power + a.core_stats.technique + a.core_stats.speed) : 0;
                        let bOvr = b ? (b.core_stats.power + b.core_stats.technique + b.core_stats.speed) : 0;
                        return aOvr >= bOvr ? a : b;
                    }, null);

                if (best) {
                    let ovr = Math.floor((best.core_stats.power + best.core_stats.technique + best.core_stats.speed) / 3);
                    topFighterHtml = `<strong style="color:var(--accent);">${best.name}</strong> <span style="font-size:0.8rem; color:#aaa;">(OVR ~${ovr})</span>`;
                }
            }

            // Roster Table
            let rosterRows = '';
            if (!club.fighter_ids || club.fighter_ids.length === 0) {
                rosterRows = `<tr><td colspan="5" style="padding: 1rem; text-align:center; color: var(--text-muted);">Empty Roster</td></tr>`;
            } else {
                club.fighter_ids.forEach(id => {
                    let f = gs.getFighter(id);
                    if (!f) return;
                    let p = f.core_stats.power; let t = f.core_stats.technique; let s = f.core_stats.speed;
                    let est = Math.floor((p + t + s) / 3);

                    let statDisplay = (f.scouted || isPlayer)
                        ? `<strong style="color:var(--accent);">${est}</strong>`
                        : `<span class="text-muted" style="font-size:0.9rem;">~${est + Math.floor(Math.random() * 10) - 5}</span>`;

                    let salary = f.contract ? `$${f.contract.salary.toLocaleString()}/yr` : 'N/A';
                    let archetype = f.personality ? f.personality.archetype : 'Unknown';
                    let age = f.age || '?';

                    rosterRows += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 0.8rem;">
                                <strong>${f.name}</strong>
                                <br><span style="font-size:0.75rem; color:#aaa;">${archetype}</span>
                            </td>
                            <td style="padding: 0.8rem;">${age}</td>
                            <td style="padding: 0.8rem;">${statDisplay}</td>
                            <td style="padding: 0.8rem; font-size:0.85rem;">${salary}</td>
                            <td style="padding: 0.8rem;">
                                ${!isPlayer ? `<button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background:#555;" onclick="window.Router.loadRoute('transfers')">Scout / Bid</button>` : '<span style="color:#00e676; font-size:0.8rem;">YOUR FIGHTER</span>'}
                            </td>
                        </tr>
                    `;
                });
            }

            // Facilities display
            let facHtml = `
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${this._facBar('🏋️ Gym', facilities.gym)}
                    ${this._facBar('💆 Recovery', facilities.recovery)}
                    ${this._facBar('📣 PR Dept', facilities.pr)}
                </div>
            `;

            let moneyHtml = money !== null
                ? `<div>Bank: <strong style="color:#00e676;">$${money.toLocaleString()}</strong></div>`
                : `<div style="color:#aaa; font-size:0.85rem;">Financials: Classified</div>`;

            let playerBadge = isPlayer
                ? `<span style="background: var(--accent); color:#000; padding: 2px 10px; border-radius: 12px; font-size:0.75rem; font-weight:bold; margin-left:10px;">YOUR CLUB</span>`
                : '';

            let aiBadge = !isPlayer
                ? `<div style="font-size:0.8rem; color:#aaa; margin-top:4px;">AI Persona: <strong style="color:#ddd;">${this._getAiPersonaLabel(club.ai_persona)}</strong></div>`
                : '';

            html += `
                <div class="glass-panel" style="padding: 1.5rem; border-left: 5px solid ${club.color || '#555'}; ${isPlayer ? 'box-shadow: 0 0 20px ' + (club.color || '#555') + '44;' : ''}">
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <h2 style="margin:0; font-family:'Outfit',sans-serif; font-size:1.6rem; text-transform:uppercase; color:${club.color || '#fff'}; text-shadow: 0 0 12px ${club.color || '#fff'}66;">${club.name}${playerBadge}</h2>
                            ${location ? `<p style="margin-top:4px; color:#aaa; font-size:0.9rem;">📍 ${location}</p>` : ''}
                            ${aiBadge}
                        </div>
                        <div style="text-align: right; font-size: 0.9rem; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                            <div>Record: <strong style="color:#fff; font-size:1.1rem;">${record.w}W – ${record.l}L</strong></div>
                            ${moneyHtml}
                            <div style="font-size:0.8rem; color:#aaa;">Home Edge: <strong style="color:#ddd;">${this._getHomeAdvantageLabel(club.home_advantage)}</strong></div>
                            <div>Star: ${topFighterHtml}</div>
                        </div>
                    </div>

                    <!-- Content: Facilities + Roster -->
                    <div style="display:grid; grid-template-columns: minmax(160px, 1fr) 3fr; gap: 2rem;">
                        <!-- Facilities -->
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px;">
                            <h4 style="margin-bottom: 0.8rem; color:var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">Facilities</h4>
                            ${facHtml}
                        </div>

                        <!-- Roster Table -->
                        <div>
                            <h4 style="margin-bottom: 0.8rem; color:var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">Active Roster (${(club.fighter_ids || []).length}/8)</h4>
                            <div style="background:rgba(0,0,0,0.2); max-height:220px; overflow-y:auto; border-radius:6px;">
                                <table style="width:100%; border-collapse:collapse;">
                                    <thead style="position:sticky; top:0; background:#111;">
                                        <tr style="text-align:left; border-bottom: 1px solid var(--border-glass);">
                                            <th style="padding: 0.8rem;">Fighter</th>
                                            <th style="padding: 0.8rem;">Age</th>
                                            <th style="padding: 0.8rem;">OVR</th>
                                            <th style="padding: 0.8rem;">Wage</th>
                                            <th style="padding: 0.8rem;">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rosterRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    },

    _facBar(label, level) {
        const max = 4;
        const lv = level || 1;
        let pips = '';
        for (let i = 1; i <= max; i++) {
            pips += `<div style="width:14px; height:14px; border-radius:3px; background:${i <= lv ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; display:inline-block; margin-right:2px;"></div>`;
        }
        return `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.82rem; color:#ccc;">${label}</span>
                <div style="display:flex; align-items:center; gap:2px;">${pips} <span style="font-size:0.75rem; color:#aaa; margin-left:4px;">Lvl ${lv}</span></div>
            </div>
        `;
    }
};