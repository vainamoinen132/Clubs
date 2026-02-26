/**
 * ui_underground.js
 * The high-risk Underground Fight Club screen (V2 - Extreme Danger).
 */

window.UIUnderground = {
    currentTab: 'bloodpit',
    selectedFighterIds: [],

    render(container, params) {
        const gs = window.GameState;

        let html = `
            <div class="dashboard-header" style="border-bottom-color: #ff5252;">
                <h2 style="color: #ff5252; text-transform: uppercase;">The Underground</h2>
                <div class="header-stats">
                    <div class="stat-badge" style="background: rgba(255,82,82,0.2); border-color: #ff5252; color: #ff5252;">
                        Available This Week: ${gs.undergroundAvailableThisWeek ? 'Yes' : 'NO'}
                    </div>
                </div>
            </div>
            <p style="color: #aaa; margin-bottom: 20px; font-style: italic;">
                No referees. No rules. No medical coverage. Enter at your own absolute risk.
            </p>
        `;

        if (gs.activeUndergroundTournament) {
            html += `<div id="ug-content"></div>`;
            container.innerHTML = html;
            this.renderActiveTournament(document.getElementById('ug-content'));
        } else {
            html += `
                <div class="tabs" style="display: flex; gap: 15px; border-bottom: 2px solid #333; margin-bottom: 25px; padding-bottom: 15px;">
                    <button style="padding: 12px 24px; font-size: 1rem; font-weight: bold; background: ${this.currentTab === 'bloodpit' ? '#ff5252' : '#1a1a1a'}; color: #fff; border: 2px solid ${this.currentTab === 'bloodpit' ? '#ff5252' : '#333'}; border-radius: 6px; cursor: pointer; transition: all 0.3s; box-shadow: ${this.currentTab === 'bloodpit' ? '0 0 15px rgba(255, 82, 82, 0.4)' : 'none'};" onclick="window.UIUnderground.switchTab('bloodpit')">🔪 The Blood Pit (1v1)</button>
                    <button style="padding: 12px 24px; font-size: 1rem; font-weight: bold; background: ${this.currentTab === 'gauntlet' ? '#ffeb3b' : '#1a1a1a'}; color: ${this.currentTab === 'gauntlet' ? '#000' : '#fff'}; border: 2px solid ${this.currentTab === 'gauntlet' ? '#ffeb3b' : '#333'}; border-radius: 6px; cursor: pointer; transition: all 0.3s; box-shadow: ${this.currentTab === 'gauntlet' ? '0 0 15px rgba(255, 235, 59, 0.4)' : 'none'};" onclick="window.UIUnderground.switchTab('gauntlet')">⛓️ The Gauntlet (8-Man)</button>
                    <button style="padding: 12px 24px; font-size: 1rem; font-weight: bold; background: ${this.currentTab === 'grinder' ? '#ff3d00' : '#1a1a1a'}; color: #fff; border: 2px solid ${this.currentTab === 'grinder' ? '#ff3d00' : '#333'}; border-radius: 6px; cursor: pointer; transition: all 0.3s; box-shadow: ${this.currentTab === 'grinder' ? '0 0 15px rgba(255, 61, 0, 0.4)' : 'none'};" onclick="window.UIUnderground.switchTab('grinder')">⚙️ Meat Grinder (16-Man)</button>
                    <button style="padding: 12px 24px; font-size: 1rem; font-weight: bold; background: ${this.currentTab === 'history' ? '#29b6f6' : '#1a1a1a'}; color: ${this.currentTab === 'history' ? '#000' : '#fff'}; border: 2px solid ${this.currentTab === 'history' ? '#29b6f6' : '#333'}; border-radius: 6px; cursor: pointer; transition: all 0.3s; box-shadow: ${this.currentTab === 'history' ? '0 0 15px rgba(41, 182, 246, 0.4)' : 'none'};" onclick="window.UIUnderground.switchTab('history')">📜 History</button>
                </div>
                <div id="ug-content"></div>
            `;
            container.innerHTML = html;
            this.renderTabContent(document.getElementById('ug-content'));
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.selectedFighterIds = [];
        this.render(document.getElementById('main-view') || document.body);
    },

    renderTabContent(contentDiv) {
        if (this.currentTab === 'bloodpit') this.renderBloodPit(contentDiv);
        else if (this.currentTab === 'gauntlet') this.renderTournamentSetup(contentDiv, 8, 1, "$150,000");
        else if (this.currentTab === 'grinder') this.renderTournamentSetup(contentDiv, 16, 2, "$400,000");
        else if (this.currentTab === 'history') this.renderHistory(contentDiv);
    },

    renderBloodPit(container) {
        const gs = window.GameState;
        let club = gs.getClub(gs.playerClubId);

        let html = `
            <div style="display: flex; gap: 20px;">
                <div class="panel" style="flex: 1; border-color: #ff5252;">
                    <h3 style="color:#ff5252;">Instant Violence</h3>
                    <p style="color:#ccc; font-size:0.9rem;">Select one fighter from your roster to enter an unsanctioned 1v1 match against a completely random opponent. The payout is fast, but the risk of injury is severe.</p>
        `;

        club.fighter_ids.forEach(id => {
            let f = gs.getFighter(id);
            let inj = (f.dynamic_state.injuries && f.dynamic_state.injuries.length > 0);
            let disabled = (!gs.undergroundAvailableThisWeek || inj) ? 'disabled' : '';
            let isSelected = this.selectedFighterIds.includes(f.id);

            html += `
                <div class="fighter-card ${isSelected ? 'selected' : ''}" style="margin-bottom:10px; padding:10px; border:1px solid ${isSelected ? '#ff5252' : 'rgba(255,82,82,0.2)'}; background: rgba(0,0,0,0.5); cursor:pointer;"
                     onclick="if(!'${disabled}') window.UIUnderground.toggleSelection('${f.id}', 1)">
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${f.avatar ? `<img src="assets/portraits/${f.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--border-glass);" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><rect width=\\'40\\' height=\\'40\\' fill=\\'#333\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'#fff\\' font-family=\\'sans-serif\\' font-size=\\'14\\'>?</text></svg>');">` : ''}
                        <div>
                            <h4 style="margin:0; color:${inj ? '#888' : '#fff'};">${f.name}</h4>
                            <p style="margin:0; font-size:0.8rem; color:${inj ? '#ff5252' : '#888'};">Form: ${Math.floor(f.dynamic_state.form)} | Fatigue: ${Math.floor(f.dynamic_state.fatigue)} ${inj ? '[INJURED]' : ''}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>
            <div class="panel" style="flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        `;

        if (this.selectedFighterIds.length === 1) {
            let f = gs.getFighter(this.selectedFighterIds[0]);
            html += `
                <h2 style="color:#ff5252;">SEND ${f.name.toUpperCase()} TO THE PIT?</h2>
                <p style="text-align:center; color:#ccc;">She will face an unknown opponent. Standard underground payout applies.</p>
                <button class="btn-primary" style="background:#ff5252; font-size:1.2rem; padding:15px 30px;" onclick="window.UIUnderground.startBloodPit('${f.id}')">FIGHT</button>
            `;
        } else {
            html += `<p style="color:#888;">Select a fighter from your roster to proceed.</p>`;
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    renderTournamentSetup(container, size, maxEntries, prize) {
        const gs = window.GameState;
        let club = gs.getClub(gs.playerClubId);

        let html = `
            <div style="display: flex; gap: 20px;">
                <div class="panel" style="flex: 1; border-color: #ff5252;">
                    <h3 style="color:#ff5252;">Select Entrants (Max ${maxEntries})</h3>
                    <p style="color:#ccc; font-size:0.9rem;">An extreme endurance battle. Fighters will not recover stamina fully between rounds.</p>
        `;

        club.fighter_ids.forEach(id => {
            let f = gs.getFighter(id);
            let inj = (f.dynamic_state.injuries && f.dynamic_state.injuries.length > 0);
            let disabled = (!gs.undergroundAvailableThisWeek || inj) ? 'disabled' : '';
            let isSelected = this.selectedFighterIds.includes(f.id);

            html += `
                <div class="fighter-card ${isSelected ? 'selected' : ''}" style="margin-bottom:10px; padding:10px; border:1px solid ${isSelected ? '#ff5252' : 'rgba(255,82,82,0.2)'}; background: rgba(0,0,0,0.5); cursor:pointer;"
                     onclick="if(!'${disabled}') window.UIUnderground.toggleSelection('${f.id}', ${maxEntries})">
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${f.avatar ? `<img src="assets/portraits/${f.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--border-glass);" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><rect width=\\'40\\' height=\\'40\\' fill=\\'#333\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'#fff\\' font-family=\\'sans-serif\\' font-size=\\'14\\'>?</text></svg>');">` : ''}
                        <div>
                            <h4 style="margin:0; color:${inj ? '#888' : '#fff'};">${f.name}</h4>
                            <p style="margin:0; font-size:0.8rem; color:${inj ? '#ff5252' : '#888'};">Form: ${Math.floor(f.dynamic_state.form)} | Fatigue: ${Math.floor(f.dynamic_state.fatigue)} ${inj ? '[INJURED]' : ''}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>
            <div class="panel" style="flex: 1; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        `;

        if (this.selectedFighterIds.length > 0) {
            html += `
                <h2 style="color:#ff5252;">ENTER TOURNAMENT</h2>
                <div style="margin-bottom:20px; text-align:center;">
                    <p><strong>Bracket Size:</strong> ${size} Fighters</p>
                    <p><strong>Grand Prize:</strong> ${prize}</p>
                    <p style="color:#ff5252; font-weight:bold;">Includes extreme risk of career-altering injuries.</p>
                </div>
                <button class="btn-primary" style="background:#ff5252; font-size:1.2rem; padding:15px 30px;" onclick="window.UIUnderground.startTournament(${size})">GENERATE BRACKET</button>
            `;
        } else {
            html += `<p style="color:#888;">Select ${maxEntries} fighter(s) to enter.</p>`;
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    toggleSelection(id, max) {
        if (this.selectedFighterIds.includes(id)) {
            this.selectedFighterIds = this.selectedFighterIds.filter(f => f !== id);
        } else {
            if (this.selectedFighterIds.length < max) {
                this.selectedFighterIds.push(id);
            }
        }
        this.render(document.getElementById('main-view') || document.body);
    },

    startBloodPit(fighterId) {
        // Find a random opponent
        let opponent = window.UndergroundEngine.generateFighter(Math.random() < 0.6 ? 1 : 2);
        // Start match visually
        window.UIMatch.startUndergroundMatch(fighterId, opponent.id, { type: 'bloodpit', opponent: opponent });
        if (typeof updateNavUI === 'function') updateNavUI();
    },

    processMatchResult(winner, loser, context) {
        const gs = window.GameState;

        if (context.type === 'bloodpit') {
            let pFighterId = winner.id === context.opponent.id ? loser.id : winner.id;
            let oFighterId = context.opponent.id;
            let pFighter = gs.getFighter(pFighterId);
            let clubWon = winner.id === pFighterId;
            let payout = clubWon ? (context.opponent.payout_base || 15000) : Math.floor((context.opponent.payout_base || 15000) * 0.1);

            pFighter.dynamic_state.stress = Math.min(100, pFighter.dynamic_state.stress + (clubWon ? 5 : 20));
            gs.money += payout;
            gs.undergroundAvailableThisWeek = false;

            gs.undergroundHistory.push({
                week: gs.week, season: gs.season,
                fighterId: pFighterId, opponentId: oFighterId,
                result: clubWon ? "Won" : "Lost", payout: payout, injuries: []
            });

            this.showPostMatchModal(clubWon, pFighter, context.opponent, payout, true, null);

        } else if (context.type === 'tournament') {
            const tourney = gs.activeUndergroundTournament;
            let m = tourney.matches[context.matchIndex];

            // Critical fix: ui_match passes flattened object clones. We must save the original objects!
            m.winner = m.f1.id === winner.id ? m.f1 : m.f2;
            m.loser = m.f1.id === loser.id ? m.f1 : m.f2;

            let pId = tourney.playerFighterIds.includes(m.f1.id) ? m.f1.id : m.f2.id;
            let oId = pId === m.f1.id ? m.f2.id : m.f1.id;
            let pFighter = gs.getFighter(pId) || m.f1;
            let oFighter = gs.getFighter(oId) || m.f2; // might be AI

            let playerWon = m.winner.id === pId;
            this.showPostMatchModal(playerWon, pFighter, oFighter, 0, false, context.matchIndex);
        }
    },

    showPostMatchModal(playerWon, pFighter, oFighter, payout, isBloodPit, matchIndex) {
        let content = `<div style="text-align:center;">`;
        if (playerWon) {
            content += `
                <h2 style="color:#4caf50; font-family:'Outfit',sans-serif; font-size: 2.5rem; text-transform:uppercase;">VICTORY</h2>
                <p style="font-size: 1.2rem;">${pFighter.name} savagely knocked out ${oFighter.name}. ${payout > 0 ? `You earned <strong style="color:#4caf50;">+$${payout.toLocaleString()}</strong>.` : ''}</p>
                <div style="margin:20px auto; padding:20px; border:2px solid #ff5252; background:rgba(255,0,0,0.1); border-radius:12px; max-width: 400px; box-shadow: 0 0 20px rgba(255,82,82,0.3);">
                    <h3 style="color:#ff5252; margin-top:0;">MERCY PHASE</h3>
                    <p style="font-size:0.95rem; color:#ccc;">Your opponent is broken. Finish it.</p>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button style="padding: 12px; font-weight: bold; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#555'" onmouseout="this.style.background='#333'" onclick="window.UIUnderground.applyMercy(${isBloodPit ? 'null' : matchIndex}, 'gentle', ${isBloodPit})">Walk away. (Honorable)</button>
                        <button style="padding: 12px; font-weight: bold; background: #ff5252; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#ff3333'" onmouseout="this.style.background='#ff5252'" onclick="window.UIUnderground.applyMercy(${isBloodPit ? 'null' : matchIndex}, 'sadistic', ${isBloodPit})">Break her limb. (Sadistic)</button>
                        <button style="padding: 12px; font-weight: bold; background: #a855f7; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#9136e8'" onmouseout="this.style.background='#a855f7'" onclick="window.UIUnderground.applyMercy(${isBloodPit ? 'null' : matchIndex}, 'sexual', ${isBloodPit})">Public degradation. (Traumatizing)</button>
                        <button style="padding: 12px; font-weight: bold; background: #000; color: #ff5252; border: 2px solid #ff5252; border-radius: 6px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#220000'" onmouseout="this.style.background='#000'" onclick="window.UIUnderground.applyMercy(${isBloodPit ? 'null' : matchIndex}, 'combo', ${isBloodPit})">Mutilation + Assault. (Nightmare)</button>
                    </div>
                </div>
            `;
            // Temporarily store winner and loser for the mercy callback if bloodpit
            if (isBloodPit) {
                this._tempMercyData = { winner: pFighter, loser: oFighter };
            }
            window.UIComponents.showModal("POST-MATCH PHASE", content);
        } else {
            let log = window.UndergroundEngine.resolveMercyPhase(oFighter, pFighter, 'AI');
            if (!isBloodPit) {
                const gs = window.GameState;
                gs.activeUndergroundTournament.matches[matchIndex].mercyLog = log;
            }
            content += `
                <h2 style="color:#ff5252; font-family:'Outfit',sans-serif; font-size: 2.5rem; text-transform:uppercase;">DEFEAT</h2>
                <p style="font-size: 1.2rem;"><strong>${oFighter.name}</strong> destroyed ${pFighter.name}.</p>
                <div style="margin:20px 0; padding:15px; border-left:6px solid #ff5252; background:rgba(0,0,0,0.5); text-align:left; border-radius:4px;">
                    <p style="color:#ff5252; font-style:italic; font-size:1.1rem;">${log}</p>
                </div>
                <button class="btn-primary" style="margin-top: 15px; padding: 15px 30px; font-size: 1.2rem;" onclick="window.UIComponents.closeModal(); window.UIUnderground.render(document.getElementById('main-view')||document.body);">Accept Fate</button>
            `;
            window.UIComponents.showModal("POST-MATCH PHASE", content);
        }
    },

    applyMercy(matchIndex, choice, isBloodPit = false) {
        const gs = window.GameState;
        let data = isBloodPit ? this._tempMercyData : gs.activeUndergroundTournament.matches[matchIndex];

        let log = window.UndergroundEngine.resolveMercyPhase(data.winner, data.loser, choice);

        if (isBloodPit) {
            this._tempMercyData = null;
            window.UIComponents.closeModal();
            window.UIComponents.showModal("THE PIT REMEMBERS", `<p style="color:#ff5252; font-style:italic;">${log}</p><br><button class="btn-primary" onclick="window.UIComponents.closeModal(); window.Router.loadRoute('club')">Leave</button>`);
        } else {
            // It's a tournament match
            gs.activeUndergroundTournament.matches[matchIndex].mercyLog = log;
            window.UIComponents.closeModal();
            this.render(document.getElementById('main-view') || document.body);
        }
    },

    startTournament(size) {
        const gs = window.GameState;
        gs.undergroundAvailableThisWeek = false;
        gs.activeUndergroundTournament = window.UndergroundEngine.generateTournamentBracket(size, this.selectedFighterIds);

        if (typeof updateNavUI === 'function') updateNavUI();
        this.render(document.getElementById('main-view') || document.body);
    },

    renderActiveTournament(container) {
        const tourney = window.GameState.activeUndergroundTournament;

        if (tourney.isComplete) {
            let html = `
                <div class="panel" style="text-align:center; border-color:#ffeb3b; padding:40px;">
                    <h1 style="color:#ffeb3b; font-size:3rem; margin-bottom:10px;">TOURNAMENT COMPLETE</h1>
                    <h2>CHAMPION: ${tourney.champion.name}</h2>
                    <p style="color:#ccc;">The underground pit is washed of blood until next time.</p>
                    <button class="btn-primary" style="margin-top:20px;" onclick="window.UIUnderground.clearTournament()">Exit The Underground</button>
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        let html = `
            <div class="panel" style="margin-bottom: 20px;">
                <h2 style="color:#ff5252; margin-top:0;">ROUND ${tourney.round}</h2>
                <p>Simulating the bracket. AI vs AI matches are fully simulated in the background, complete with violence.</p>
            </div>
            
            <div style="display:flex; flex-wrap:wrap; gap:15px;">
        `;

        let unplayedPlayerMatches = [];

        tourney.matches.forEach((m, idx) => {
            let isPlayer = m.isPlayerMatch;
            let bgColor = isPlayer ? 'rgba(255,82,82,0.1)' : 'rgba(0,0,0,0.4)';
            let borderColor = isPlayer ? '#ff5252' : '#444';

            html += `
                <div style="width:calc(50% - 15px); padding:15px; border:1px solid ${borderColor}; background:${bgColor}; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap: 10px;">
                            ${window.UIComponents.createFighterAvatarHtml(m.f1, 40)}
                            <div style="display:flex; flex-direction:column;">
                                <span style="color:${tourney.playerFighterIds.includes(m.f1.id) ? '#fff' : '#888'}; font-weight:bold;">${m.f1.name}</span>
                                <span style="font-size:0.75rem; color:#888;">Fm: ${Math.floor(m.f1.dynamic_state?.form || 100)} | Ft: ${Math.floor(m.f1.dynamic_state?.fatigue || 0)}</span>
                            </div>
                        </div>
                        <span style="color:#ff5252; font-weight:bold; font-size:1.2rem; margin: 0 10px;">VS</span>
                        <div style="display:flex; align-items:center; gap: 10px; flex-direction: row-reverse; text-align: right;">
                            ${window.UIComponents.createFighterAvatarHtml(m.f2, 40)}
                            <div style="display:flex; flex-direction:column;">
                                <span style="color:${tourney.playerFighterIds.includes(m.f2.id) ? '#fff' : '#888'}; font-weight:bold;">${m.f2.name}</span>
                                <span style="font-size:0.75rem; color:#888;">Fm: ${Math.floor(m.f2.dynamic_state?.form || 100)} | Ft: ${Math.floor(m.f2.dynamic_state?.fatigue || 0)}</span>
                            </div>
                        </div>
                    </div>
            `;

            if (m.winner) {
                html += `<div style="margin-top:10px; padding:5px; background:rgba(0,0,0,0.5); font-size:0.8rem; color:#ccc;"><strong>${m.winner.name} won.</strong><br><span style="color:#ff5252; font-style:italic;">${m.mercyLog}</span></div>`;
            } else if (isPlayer) {
                unplayedPlayerMatches.push(idx);
                html += `<button class="btn-primary" style="width:100%; margin-top:10px; background:#ff5252;" onclick="window.UIUnderground.playTournamentPlayerMatch(${idx})">FIGHT NOW</button>`;
            } else {
                html += `<div style="text-align:center; color:#666; font-style:italic; margin-top:10px;">Pending Simulation...</div>`;
            }

            html += `</div>`;
        });

        html += `</div>`;

        if (unplayedPlayerMatches.length === 0) {
            html += `
                <div style="margin-top:20px; text-align:center;">
                    <button class="btn-primary" style="padding:15px 30px; font-size:1.2rem;" onclick="window.UIUnderground.advanceBracket()">ADVANCE TO NEXT ROUND</button>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    playTournamentPlayerMatch(matchIndex) {
        const tourney = window.GameState.activeUndergroundTournament;
        let m = tourney.matches[matchIndex];
        let pId = tourney.playerFighterIds.includes(m.f1.id) ? m.f1.id : m.f2.id;
        let oId = pId === m.f1.id ? m.f2.id : m.f1.id;
        window.UIMatch.startUndergroundMatch(pId, oId, { type: 'tournament', matchIndex: matchIndex });
    },

    advanceBracket() {
        const gs = window.GameState;
        let tourney = gs.activeUndergroundTournament;

        gs.activeUndergroundTournament = window.UndergroundEngine.advanceTournamentRound(tourney);

        // Payout if complete
        if (gs.activeUndergroundTournament.isComplete) {
            let champ = gs.activeUndergroundTournament.champion;
            if (tourney.playerFighterIds.includes(champ.id)) {
                let prize = tourney.size === 16 ? 400000 : 150000;
                gs.money += prize;
                window.UIComponents.showModal("CHAMPION", `Your fighter ${champ.name} survived The ${tourney.size === 16 ? 'Grinder' : 'Gauntlet'} and won $${prize.toLocaleString()}!`, 'success');
                if (typeof updateNavUI === 'function') updateNavUI();
            }
        }

        this.render(document.getElementById('main-view') || document.body);
    },

    clearTournament() {
        window.GameState.activeUndergroundTournament = null;
        this.switchTab('bloodpit');
    },

    renderHistory(container) {
        let hist = window.GameState.undergroundHistory;
        if (!hist || hist.length === 0) {
            container.innerHTML = `<p style="color:#888;">No recorded underground history.</p>`;
            return;
        }

        let html = `
            <div class="panel">
            <table class="data-table" style="width:100%; text-align:left;">
                <thead><tr><th>Week</th><th>Fighter</th><th>Opponent</th><th>Result</th><th>Payout</th></tr></thead>
                <tbody>
        `;

        [...hist].reverse().forEach(h => {
            let f = window.GameState.getFighter(h.fighterId);
            let color = h.result === 'Won' ? '#4caf50' : '#ff5252';
            html += `<tr>
                <td>S${h.season} W${h.week}</td>
                <td style="color:#fff;">${f ? f.name : 'Unknown'}</td>
                <td style="color:#ff5252;">${h.opponentId}</td>
                <td style="color:${color}; font-weight:bold;">${h.result}</td>
                <td>$${(h.payout || 0).toLocaleString()}</td>
             </tr>`;
        });
        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }
};
