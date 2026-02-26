/**
 * ui_roster.js
 * Displays player fighters and detailed stat views.
 */

window.UIRoster = {
    render(container, params) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);

        if (!club) return;

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Roster', 'Manage your fighters, monitor fatigue, and review stats.')}
            
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <div id="roster-list" class="fighter-list-col"></div>
                <div id="roster-detail" class="fighter-detail-col glass-panel" style="padding: 2rem; min-height: 400px; display: none;"></div>
            </div>
        `;

        const listDiv = document.getElementById('roster-list');
        club.fighter_ids.forEach(id => {
            const f = gs.getFighter(id);
            if (f) {
                const card = window.UIComponents.createFighterCard(f, (fighterObj) => this.showDetail(fighterObj));
                listDiv.appendChild(card);
            }
        });

        // Auto-select first if exists
        if (club.fighter_ids.length > 0) {
            this.showDetail(gs.getFighter(club.fighter_ids[0]));
        }
    },

    showDetail(fighter) {
        const detailDiv = document.getElementById('roster-detail');
        if (!detailDiv) return;

        detailDiv.style.display = 'block';
        detailDiv.style.borderTop = `5px solid #FF3366`; // Generic accent

        // Build table of stats
        let coreParams = Object.keys(fighter.core_stats).map(k => {
            return `<tr><td style="text-transform:capitalize; padding:4px;">${k}</td><td style="font-weight:bold;">${fighter.core_stats[k]}</td></tr>`;
        }).join('');

        let affParams = Object.keys(fighter.style_affinities).map(k => {
            return `<tr><td style="text-transform:capitalize; padding:4px;">${k.replace('_', ' ')}</td><td style="font-weight:bold; color:var(--accent);">${fighter.style_affinities[k]}</td></tr>`;
        }).join('');

        const imgSrc = fighter.avatar ? `assets/portraits/${fighter.avatar}` : `assets/portraits/${fighter.name.toLowerCase()}.png`;
        const fallbackSvg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="30">?</text></svg>`);

        const motivators = (fighter.personality?.motivators || []).join(', ') || 'Unknown';
        const rivalryStyle = fighter.personality?.rivalry_style || 'Unknown';
        const ego = fighter.dynamic_state?.ego || 'Normal';


        detailDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 2rem;">
                <div style="display: flex; gap: 1.5rem; align-items: center;">
                    <img src="${imgSrc}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 12px; border: 3px solid var(--accent); box-shadow: 0 4px 15px rgba(0,0,0,0.6);" onerror="this.onerror=null; this.src='${fallbackSvg}';" alt="${fighter.name} Portrait" />
                    <div>
                        <h2 class="font-outfit text-gradient" style="font-size: 2.2rem; margin-bottom: 0;">${fighter.name}</h2>
                        <div style="margin-top: 5px; margin-bottom: 5px;">${window.UIComponents.createClubBadge(window.GameState.getClub(fighter.club_id))}</div>
                        <p class="text-muted" style="font-size: 1.1rem;">Age ${fighter.age} | ${fighter.personality.archetype}</p>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
                            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Potential:</span>
                            <span>${this._renderPotentialStars(fighter)}</span>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span class="tag" style="background: rgba(255,255,255,0.2); font-size: 1.1rem;">Form: ${fighter.dynamic_state.form}</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 4px;">Core Stats</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                        ${coreParams}
                    </table>
                </div>
                <div>
                    <h3 style="margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 4px;">Style Affinities</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                        ${affParams}
                    </table>
                    
                    <h3 style="margin-top: 1.5rem; margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 4px;">State</h3>
                    <p>Morale: <strong style="color:#00e676;">${fighter.dynamic_state.morale}%</strong></p>
                    <p>Fatigue: <strong style="color:#ff3d00;">${fighter.dynamic_state.fatigue}%</strong></p>
                    <p>Stress: <strong style="color:#ffea00;">${fighter.dynamic_state.stress}%</strong></p>
                    ${this._renderInjuries(fighter)}
                </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid var(--border-glass); margin-bottom: 1.5rem;" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3 style="margin-bottom: 0.8rem;">Current Contract</h3>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-glass);">
                        ${fighter.contract ? `
                            <p><strong>Salary:</strong> $${fighter.contract.salary.toLocaleString()} /yr</p>
                            <p><strong>Remaining:</strong> ${fighter.contract.seasons_remaining !== undefined ? fighter.contract.seasons_remaining : '?'} Seasons</p>
                            <p><strong>Win Bonus:</strong> $${(fighter.contract.win_bonus || 0).toLocaleString()}</p>
                            <p><strong>Happiness:</strong> <span style="color: ${(fighter.contract.happiness || 50) > 70 ? '#00e676' : (fighter.contract.happiness || 50) > 40 ? '#ffea00' : '#ff5252'}; font-weight:bold;">${fighter.contract.happiness !== undefined ? fighter.contract.happiness : 50}%</span></p>
                            ${fighter.contract.demand_triggered ? '<div style="margin-top:0.5rem; color:#ff5252; font-weight:bold; font-size: 0.85rem;">[ DEMANDING NEW CONTRACT ]</div>' : ''}
                        ` : `<p class="text-muted">No professional contract on file.</p>`}
                    </div>
                </div>
                <div>
                    <h3 style="margin-bottom: 0.8rem;">Psychology & Personality</h3>
                    <p><strong>Driven By:</strong> ${motivators}</p>
                    <p><strong>Rivalry Style:</strong> ${rivalryStyle}</p>
                    <div style="display:flex; gap: 2rem; margin-top: 1rem;">
                        <div>Dominance Hunger: <strong style="color:var(--accent);">${fighter.personality.dominance_hunger}</strong></div>
                        <div>Submissive Lean: <strong style="color:var(--text-muted);">${fighter.personality.submissive_lean}</strong></div>
                        <div>Ego: <strong style="color:#ffea00;">${ego}</strong></div>
                    </div>
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap: 1rem; margin-top: 2rem;">
                <button class="btn-primary" style="background:#ffca28; font-size: 0.9rem; padding: 0.6rem 1rem; color: #000;" onclick="window.UIRoster.offerToMarket('${fighter.id}')">List for Transfer</button>
                ${fighter.contract ? `<button class="btn-primary" style="background:#555; font-size: 0.9rem; padding: 0.6rem 1rem;" onclick="window.UIRoster.renegotiate('${fighter.id}')">Renegotiate Contract</button>` : ''}
                <button class="btn-primary" style="background:var(--accent); font-size: 0.9rem; padding: 0.6rem 1rem;" onclick="window.UIRoster.releaseFighter('${fighter.id}')">Release Clause: $${(fighter.contract?.release_clause || 0).toLocaleString()}</button>
            </div>
        `;
    },

    _renderInjuries(fighter) {
        if (!fighter.dynamic_state.injuries || fighter.dynamic_state.injuries.length === 0) return '';
        let injHtml = fighter.dynamic_state.injuries.map(i => `<div style="background: rgba(255,0,0,0.2); border: 1px solid red; padding: 4px 8px; margin-top: 5px; border-radius: 4px; display:inline-block;">⚠️ ${i.name} (${i.duration} Wk)</div>`).join(' ');
        return `<div style="margin-top: 1rem;">${injHtml}</div>`;
    },

    _renderRelationships(fighter) {
        if (!fighter.dynamic_state.relationships || Object.keys(fighter.dynamic_state.relationships).length === 0) {
            return `<p class="text-muted">No notable relationships formed yet.</p>`;
        }

        const gs = window.GameState;
        let relStr = Object.keys(fighter.dynamic_state.relationships).map(tId => {
            let type = fighter.dynamic_state.relationships[tId];
            let targetName = gs.fighters[tId] ? gs.fighters[tId].name : "Unknown";
            let color = type === 'Lovers' ? '#e91e63' : (type === 'Rival' ? '#ff3d00' : '#00e676');
            return `<div style="margin-bottom: 5px;"><strong>${targetName}</strong> - <span style="color:${color}; font-weight:bold;">${type}</span></div>`;
        }).join('');

        return relStr;
    },

    releaseFighter(fighterId) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        const fighter = gs.getFighter(fighterId);

        if (club.fighter_ids.length <= 1) {
            if (window.UIComponents) window.UIComponents.showModal("Cannot Release", "You cannot release your last fighter!", "danger");
            else alert("You cannot release your last fighter!");
            return;
        }

        let cost = fighter.contract ? fighter.contract.release_clause : 0;
        if (gs.money < cost) {
            if (window.UIComponents) window.UIComponents.showModal("Insufficient Funds", `You need $${cost.toLocaleString()} to trigger ${fighter.name}'s release clause.`, "danger");
            else alert("Cannot afford release clause.");
            return;
        }

        if (confirm(`Are you sure you want to release ${fighter.name}? Triggering her release clause will cost $${cost.toLocaleString()}.`)) {
            if (window.ContractEngine && fighter.contract) {
                window.ContractEngine.releaseWithClause(fighterId);
            } else {
                club.fighter_ids = club.fighter_ids.filter(id => id !== fighterId);
                fighter.club_id = null;
                gs.transferPool.push(fighter);
            }

            if (typeof updateNavUI === 'function') updateNavUI();
            window.Router.loadRoute('roster');
        }
    },

    offerToMarket(fighterId) {
        if (window.UITransfers) {
            window.UITransfers.listForTransfer(fighterId);
        } else {
            alert('Transfer system is currently disabled.');
        }
    },

    renegotiate(fighterId) {
        const gs = window.GameState;
        const f = gs.getFighter(fighterId);
        if (!f || !f.contract) return;

        if (!window.ContractEngine || !window.ContractEngine.startNegotiation) {
            alert("Contract engine not fully loaded.");
            return;
        }

        let negData = window.ContractEngine.startNegotiation(f);
        if (!negData) {
            if (window.UIComponents) window.UIComponents.showModal("Error", "Could not start negotiation.", "danger");
            return;
        }

        if (!negData.active) {
            if (window.UIComponents) window.UIComponents.showModal("Discussions Broken Down", `${f.name} refuses to negotiate right now.<br><br><span style="color:var(--text-muted); font-size: 0.9em;">${negData.walkReason}</span>`, "danger");
            return;
        }

        this.showNegotiationModal(f, negData);
    },

    showNegotiationModal(fighter, neg) {
        if (window.UIComponents) window.UIComponents.closeModal();

        const overlay = document.createElement('div');
        overlay.id = 'global-modal-overlay'; // hijacked the same ID for cleanup
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        const club = window.GameState.getClub(fighter.club_id) || { color: '#888' };

        let initialReasons = neg.reasons.length > 0 ? neg.reasons.join(" ") : "She expects a fair contract based on her skills.";

        overlay.innerHTML = `
            <div style="background: rgba(20, 20, 25, 0.95); border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid ${club.color}; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.8); font-family: 'Inter', sans-serif;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
                    <div>
                        <h2 style="font-family: 'Outfit', sans-serif; color: #fff; margin: 0; font-size: 1.8rem;">Negotiating with ${fighter.name}</h2>
                        <div style="color:var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem;">Age: ${fighter.age} | Current Salary: $${fighter.contract.salary.toLocaleString()}/yr</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.8rem; text-transform:uppercase; color:var(--text-muted);">Patience</span>
                        <div id="neg-patience" style="color: #00e676; font-weight: bold; font-size: 1.2rem;">${'█'.repeat(neg.patience)}${'▒'.repeat(3 - neg.patience)}</div>
                    </div>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; min-height: 80px;" id="neg-feedback-box">
                    <p style="color: #ccc; margin: 0; line-height: 1.5;"><strong>Agent:</strong> "${initialReasons} To sign today, she requires an annual salary of <strong>$${neg.targetSalary.toLocaleString()}</strong> on a <strong>${neg.targetDuration}-year</strong> contract."</p>
                </div>

                <div id="neg-inputs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <label style="display:block; font-size: 0.8rem; color:var(--text-muted); margin-bottom: 0.5rem; text-transform:uppercase;">Annual Salary ($)</label>
                        <input type="number" id="neg-offer-salary" value="${neg.targetSalary}" style="width:100%; padding: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 4px; font-size: 1.1rem; outline: none;">
                    </div>
                    <div>
                        <label style="display:block; font-size: 0.8rem; color:var(--text-muted); margin-bottom: 0.5rem; text-transform:uppercase;">Duration (Years)</label>
                        <select id="neg-offer-duration" style="width:100%; padding: 0.8rem; background: #222; border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 4px; font-size: 1.1rem; outline: none; appearance: auto;">
                            <option value="1" ${neg.targetDuration === 1 ? 'selected' : ''}>1 Year</option>
                            <option value="2" ${neg.targetDuration === 2 ? 'selected' : ''}>2 Years</option>
                            <option value="3" ${neg.targetDuration === 3 ? 'selected' : ''}>3 Years</option>
                            <option value="4" ${neg.targetDuration === 4 ? 'selected' : ''}>4 Years</option>
                            <option value="5" ${neg.targetDuration === 5 ? 'selected' : ''}>5 Years</option>
                        </select>
                    </div>
                </div>

                <div id="neg-actions" style="display: flex; justify-content: flex-end; gap: 1rem;">
                    <button id="neg-btn-walk" style="background: transparent; color: #ff5252; border: 1px solid #ff5252; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Walk Away</button>
                    <button id="neg-btn-submit" style="background: var(--accent); color: #fff; border: none; padding: 10px 30px; border-radius: 4px; font-weight: bold; cursor: pointer;">Submit Offer</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Bind events
        document.getElementById('neg-btn-walk').addEventListener('click', () => {
            if (fighter.contract.negotiation) {
                fighter.contract.negotiation.active = false; // Just stop negotiating
            }
            overlay.remove();
        });

        document.getElementById('neg-btn-submit').addEventListener('click', () => {
            let sInput = parseInt(document.getElementById('neg-offer-salary').value);
            let dInput = parseInt(document.getElementById('neg-offer-duration').value);

            if (isNaN(sInput) || sInput <= 0) return;

            let result = window.ContractEngine.evaluateOffer(fighter.id, sInput, dInput);

            const feedbackBox = document.getElementById('neg-feedback-box');
            const patBox = document.getElementById('neg-patience');
            const actionBox = document.getElementById('neg-actions');
            const inputsBox = document.getElementById('neg-inputs');

            if (result.state === 'accepted') {
                feedbackBox.innerHTML = `<p style="color: #00e676; margin: 0; line-height: 1.5; font-size: 1.1rem;"><strong>Success:</strong> ${result.message}</p>`;
                patBox.innerHTML = '🤝';
                inputsBox.style.opacity = '0.3';
                inputsBox.style.pointerEvents = 'none';
                actionBox.innerHTML = `<button onclick="document.getElementById('global-modal-overlay').remove(); window.Router.loadRoute('roster');" style="background: #00e676; color: #000; border: none; padding: 10px 30px; border-radius: 4px; font-weight: bold; cursor: pointer;">Close & Confirm</button>`;
            }
            else if (result.state === 'walked') {
                feedbackBox.innerHTML = `<p style="color: #ff5252; margin: 0; line-height: 1.5; font-size: 1.1rem;"><strong>Discussions Broken Down:</strong> ${result.message}</p>`;
                patBox.innerHTML = '<span style="color:#ff5252;">0</span>';
                inputsBox.style.opacity = '0.3';
                inputsBox.style.pointerEvents = 'none';
                actionBox.innerHTML = `<button onclick="document.getElementById('global-modal-overlay').remove(); window.Router.loadRoute('roster');" style="background: #333; color: #fff; border: none; padding: 10px 30px; border-radius: 4px; font-weight: bold; cursor: pointer;">Close</button>`;
            }
            else if (result.state === 'counter' || result.state === 'rejected') {
                let color = result.state === 'rejected' ? '#ff9800' : '#cfd8dc';
                let txt = `<p style="color: ${color}; margin: 0; line-height: 1.5;"><strong>Agent:</strong> "${result.message}`;
                if (result.counterSalary) {
                    txt += ` She is now demanding <strong>$${result.counterSalary.toLocaleString()}</strong> over <strong>${result.counterDuration} years</strong>."`;
                } else {
                    txt += `"`;
                }
                txt += `</p>`;
                feedbackBox.innerHTML = txt;

                let p = result.patience || 0;
                let patColor = p === 3 ? '#00e676' : p === 2 ? '#ffea00' : '#ff5252';
                patBox.innerHTML = `<span style="color:${patColor};">${'█'.repeat(p)}${'▒'.repeat(3 - p)}</span>`;

                if (result.counterSalary) document.getElementById('neg-offer-salary').value = result.counterSalary;
                if (result.counterDuration) document.getElementById('neg-offer-duration').value = result.counterDuration;
            }
        });
    },

    // Render potential stars for a fighter (always revealed for your own roster)
    _renderPotentialStars(fighter) {
        const pa = fighter.potential || fighter.natural_ceiling || 80;
        let stars;
        if (pa >= 90) stars = 5;
        else if (pa >= 80) stars = 4;
        else if (pa >= 70) stars = 3;
        else if (pa >= 60) stars = 2;
        else stars = 1;
        const filled = '<span style="color:#d4af37; font-size:1.1rem;">★</span>';
        const unfilled = '<span style="color:rgba(255,255,255,0.2); font-size:1.1rem;">★</span>';
        return filled.repeat(stars) + unfilled.repeat(5 - stars);
    }
};
