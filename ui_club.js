/**
 * ui_club.js
 * Renders the Club Dashboard overview.
 */

window.UIClub = {
    render(container, params) {
        const gs = window.GameState;

        // Intercept dashboard to show Poaching Overlays
        if (gs.pendingPoachEvents && gs.pendingPoachEvents.length > 0) {
            this._renderPoachingOverlay(container);
            return;
        }

        // Intercept dashboard to show Relationship Milestone Overlays
        if (gs.pendingMilestones && gs.pendingMilestones.length > 0) {
            this._renderMilestoneOverlay(container);
            return;
        }

        const club = gs.getClub(gs.playerClubId);

        if (!club) {
            container.innerHTML = "<h2>Error: Player Club not set.</h2>";
            return;
        }

        const nextMatch = this._getNextMatch();
        let matchHtml = `<p class="text-muted">No upcoming matches this week.</p>`;

        if (gs.week === 8 && !gs.midSeasonCupCompleted) {
            matchHtml = `
                <div class="glass-panel" style="padding: 1rem; border-left: 4px solid #d4af37; background: rgba(212, 175, 55, 0.05);">
                    <h3 style="margin-bottom: 0.5rem; font-family: var(--font-heading); color:#d4af37;">🏆 Mid-Season Cup</h3>
                    <p style="font-size: 1.2rem;">The 16-Roster Knockout Tournament is live!</p>
                    <button class="btn-primary" style="margin-top: 1rem; background:#d4af37; color:#000;" onclick="window.Router.loadRoute('cup')">Enter Tournament</button>
                </div>
            `;
        }
        else if (nextMatch) {
            const oppId = nextMatch.home === club.id ? nextMatch.away : nextMatch.home;
            const opp = gs.getClub(oppId) || { name: 'Unknown' };
            matchHtml = `
                <div class="glass-panel" style="padding: 1rem; border-left: 4px solid var(--accent);">
                    <h3 style="margin-bottom: 0.5rem; font-family: var(--font-heading);">Week ${gs.week} Fixture</h3>
                    <p style="font-size: 1.2rem;">vs ${window.UIComponents.createClubBadge(opp)}</p>
                    <button class="btn-primary" style="margin-top: 1rem;" onclick="window.Router.loadRoute('match', { matchId: '${nextMatch.id}' })">Go to Match Event</button>
                </div>
            `;
        }

        // Annual financial projections
        let annualSalaries = 0;
        club.fighter_ids.forEach(id => {
            let f = gs.getFighter(id);
            if (f && f.contract) annualSalaries += f.contract.salary; // already annual
        });
        if (club.staff) {
            // Only count actually-hired coaches (non-null slot values), salary is annual
            Object.values(club.staff).forEach(staffId => {
                if (staffId && gs.staff[staffId]) {
                    annualSalaries += gs.staff[staffId].salary; // already annual
                }
            });
        }
        // Upkeep by facility level: L1=free, L2=$10k/yr, L3=$30k/yr, L4=$60k/yr
        const upkeepTable = [0, 0, 10000, 30000, 60000];
        let annualUpkeep = upkeepTable[Math.min(club.facilities?.gym || 1, 4)]
            + upkeepTable[Math.min(club.facilities?.recovery || 1, 4)]
            + upkeepTable[Math.min(club.facilities?.pr || 1, 4)];

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader(club.name + ' Dashboard', 'Overview of your club operations.')}
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <!-- Main col -->
                <div>
                    <div style="margin-bottom: 2rem;">
                        <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">Next Fixture</h3>
                        ${matchHtml}
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <div>
                            <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">Club Identity</h3>
                            <div class="glass-panel" style="padding: 1.5rem; height: 100%;">
                                <p><strong>Persona:</strong> <span style="text-transform: capitalize;">${club.ai_persona.replace('_', ' ')}</span></p>
                                <p style="margin-top: 0.5rem;"><strong>Home Advantage:</strong> ${window.UIClubs ? window.UIClubs._getHomeAdvantageLabel(club.home_advantage) : club.home_advantage.replace(/_/g, ' ')}</p>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">Financial Projections</h3>
                            <div class="glass-panel" style="padding: 1.5rem; height: 100%;">
                                <div class="glass-panel" style="padding: 1.5rem; height: 100%;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom: 0.8rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.8rem;">
                                        <span>Current Funds:</span> <strong style="color:#00e676;">$${gs.money.toLocaleString()}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; color: #ff9999;">
                                        <span>Annual Salaries:</span> <strong>-$${annualSalaries.toLocaleString()}</strong>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; color: #ff9999;">
                                        <span>Annual Upkeep:</span> <strong>-$${annualUpkeep.toLocaleString()}</strong>
                                    </div>
                                    ${gs.financial_crisis_weeks > 0 ? `<div style="text-align:center; color:#ff5252; font-weight:bold; margin-top: 1rem;">📉 FINANCIAL CRISIS</div>` : ''}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar col -->
                <div>
                    <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">Top Fighters</h3>
                    <div id="dashboard-fighters"></div>
                </div>
            </div>
        `;

        // Render a couple top fighters
        const df = document.getElementById('dashboard-fighters');
        club.fighter_ids.slice(0, 2).forEach(id => {
            const f = gs.getFighter(id);
            if (f) {
                df.appendChild(window.UIComponents.createFighterCard(f, () => window.Router.loadRoute('roster')));
            }
        });
    },

    _getNextMatch() {
        const gs = window.GameState;
        return gs.schedule.find(m => m.week === gs.week && (m.home === gs.playerClubId || m.away === gs.playerClubId));
    },

    _renderMilestoneOverlay(container) {
        const gs = window.GameState;
        let milestoneData = gs.pendingMilestones[0];

        // ── BETRAYAL EVENT ───────────────────────────────────────────────────
        if (milestoneData.type === 'BETRAYAL_CONFRONTATION') {
            gs.pendingMilestones.shift(); // consume immediately; resolution buttons do their own routing
            if (window.UIRelationships) {
                window.UIRelationships.renderBetrayalEvent(container, milestoneData);
            }
            return;
        }

        // ── NORMAL RELATIONSHIP MILESTONE ────────────────────────────────────
        let f1 = gs.getFighter(milestoneData.f1);
        let f2 = gs.getFighter(milestoneData.f2);

        let c1 = gs.getClub(f1.club_id)?.color || '#ff5252';
        let c2 = gs.getClub(f2.club_id)?.color || '#4caf50';

        let scene = window.RelationshipScenes ? window.RelationshipScenes.getScene(f1, f2, milestoneData.milestone) : {
            title: `Milestone ${milestoneData.milestone}`,
            text: "A significant relationship event occurred.",
            choices: [{ text: "Continue", effect: (r) => r, result: "" }]
        };

        // Text replacement with text-shadow so dark colors are legible
        let pText = scene.text.replace(/\{F1\}/g, `<span style="color:${c1}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${f1.name}</span>`)
            .replace(/\{F2\}/g, `<span style="color:${c2}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${f2.name}</span>`);

        let html = `
            ${window.UIComponents.createSectionHeader('Relationship Milestone', 'A critical dynamic is forming between your fighters.')}
        <div class="view-content">
            <div class="panel" style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem;">

                <div style="display:flex; justify-content:space-between; width:100%; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem;">
                    <div style="display:flex; align-items:center; gap: 1rem;">
                        ${f1.avatar ? `<img src="assets/portraits/${f1.avatar}" style="width:60px; height:60px; border-radius:50%; border:2px solid ${c1};">` : ''}
                        <h2 class="font-outfit" style="color:${c1}; font-size:2.5rem; margin:0; text-shadow: 0 0 10px ${c1}44;">${f1.name}</h2>
                    </div>
                    <div style="font-size: 1.5rem; color: var(--text-muted); font-weight:bold;">VS</div>
                    <div style="display:flex; align-items:center; gap: 1rem; flex-direction: row-reverse;">
                        ${f2.avatar ? `<img src="assets/portraits/${f2.avatar}" style="width:60px; height:60px; border-radius:50%; border:2px solid ${c2};">` : ''}
                        <h2 class="font-outfit" style="color:${c2}; font-size:2.5rem; margin:0; text-shadow: 0 0 10px ${c2}44;">${f2.name}</h2>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.3); padding: 2rem; border-radius: 8px; border: 1px solid var(--border-glass);">
                    <h3 style="text-align:center; font-style:italic; margin-bottom: 1.5rem; color: #ffeb3b; font-size: 1.8rem;">${scene.title}</h3>
                    <p style="font-size: 1.25rem; line-height:1.7; color: #eaeaea; margin-bottom: 2rem;">${pText}</p>

                    <div id="milestone-result-box" style="margin-top:20px; margin-bottom:20px; color:var(--accent); font-weight:bold; text-align:center; font-size: 1.1rem; min-height: 24px;"></div>

                    <div id="milestone-choices" style="display:flex; flex-direction:column; gap: 1rem;">
                    </div>
                </div>
            </div>
        </div>
        `;

        container.innerHTML = html;
        const cb = document.getElementById('milestone-choices');
        const rb = document.getElementById('milestone-result-box');

        scene.choices.forEach((choice, idx) => {
            let btn = document.createElement('button');
            btn.className = "btn-primary";
            btn.style.padding = "1rem";
            btn.style.fontSize = "1.1rem";

            let cText = choice.text.replace(/\{F1\}/g, f1.name).replace(/\{F2\}/g, f2.name);
            btn.innerText = cText;

            btn.onclick = () => {
                // Apply effects
                let r1 = f1.dynamic_state.relationships[f2.id];
                let newType = choice.effect(r1.type);
                f1.dynamic_state.relationships[f2.id].type = newType;
                f2.dynamic_state.relationships[f1.id].type = newType;

                if (choice.morale) { f1.dynamic_state.morale += choice.morale; f2.dynamic_state.morale += choice.morale; }
                if (choice.stress) { f1.dynamic_state.stress += choice.stress; f2.dynamic_state.stress += choice.stress; }
                if (choice.fame && choice.fame > 0) gs.fame += choice.fame;

                let cResult = choice.result.replace(/\{F1\}/g, `<span style="color:${c1}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${f1.name}</span>`)
                    .replace(/\{F2\}/g, `<span style="color:${c2}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${f2.name}</span>`);

                rb.innerHTML = cResult + "<br><br><em>Relationship Type is now: <strong>" + newType.toUpperCase() + "</strong></em>";
                cb.innerHTML = ''; // wipe buttons

                let bCont = document.createElement('button');
                bCont.className = "btn-secondary mt-4";
                bCont.innerText = "Close Event";
                bCont.onclick = () => {
                    gs.pendingMilestones.shift(); // remove from queue
                    window.Router.loadRoute('club'); // re-render dashboard (might hit another milestone)
                };
                cb.appendChild(bCont);
            };
            cb.appendChild(btn);
        });

    },

    _renderPoachingOverlay(container) {
        const gs = window.GameState;
        let ev = gs.pendingPoachEvents[0];
        let f = gs.getFighter(ev.fighterId);
        let club = gs.getClub(gs.playerClubId);
        let bidder = gs.getClub(ev.bidderId);

        container.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column; padding:2rem;">
                <div class="glass-panel" style="max-width:600px; width:100%; padding:3rem; text-align:center; border: 2px solid #ff5252; box-shadow: 0 0 30px rgba(255, 82, 82, 0.4);">
                    <h2 style="color:#ff5252; margin-bottom:1rem; text-transform:uppercase; font-size:2rem;">Hostile Takeover Bid!</h2>
                    <p style="font-size:1.2rem; margin-bottom:2rem;"><strong style="color:${bidder.color}">${bidder.name}</strong> has activated the buyout clause for your star fighter <strong>${f.name}</strong>!</p>
                    
                    <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:8px; margin-bottom:2rem;">
                        <p style="font-size:1.3rem; margin-top:10px;">Transfer Fee Offered: <strong style="color:#00e676;">+$${ev.transferFee.toLocaleString()}</strong></p>
                    </div>

                    <p style="margin-bottom:2rem;">You can accept this massive cash injection and let her go, or you can invoke your Manager's Right of Refusal to block the transfer by matching the buyout fee yourself to renegotiate her contract.</p>

                    <div style="display:flex; justify-content:center; gap:20px;">
                        <button class="btn-primary" id="btn-sell-player" style="background:#00e676; padding: 1rem 2rem;">Sell Fighter (+$${ev.transferFee.toLocaleString()})</button>
                        <button class="btn-secondary" id="btn-block-transfer" style="border:1px solid #ff5252; padding: 1rem 2rem;">Block Transfer (-$${ev.transferFee.toLocaleString()})</button>
                    </div>
                    <div id="poach-result" style="margin-top: 1.5rem; font-weight: bold;"></div>
                </div>
            </div>
        `;

        document.getElementById('btn-sell-player').onclick = () => {
            gs.money += ev.transferFee;
            club.fighter_ids = club.fighter_ids.filter(id => id !== f.id);
            f.club_id = bidder.id;
            bidder.fighter_ids.push(f.id);
            // AI club generates a new contract for her
            f.contract = { salary: f.contract.salary * 2, seasons_remaining: 3 };

            gs.pendingPoachEvents.shift();
            gs.addNews('transfer', `BLOCKBUSTER: ${bidder.name} bought out ${f.name}'s contract from ${club.name} for $${ev.transferFee.toLocaleString()}!`);
            window.Router.loadRoute('club');
        };

        document.getElementById('btn-block-transfer').onclick = () => {
            let res = document.getElementById('poach-result');
            if (gs.money < ev.transferFee) {
                res.innerHTML = `<span style="color:#ff5252;">You don't have enough liquid cash to block this hostile takeover! You need $${ev.transferFee.toLocaleString()} to match the buyout.</span>`;
            } else {
                gs.money -= ev.transferFee;
                gs.pendingPoachEvents.shift();

                f.dynamic_state.morale = Math.max(0, f.dynamic_state.morale - 25);
                gs.addNews('transfer', `${club.name} blocked a massive hostile takeover bid for ${f.name} from ${bidder.name}.`);

                res.innerHTML = `<span style="color:#00e676;">Transfer Blocked! ${f.name} stays, but she is furious about missing out on the massive payday. Morale -25.</span>`;
                setTimeout(() => { window.Router.loadRoute('club'); }, 3000);
            }
        };
    }
};
