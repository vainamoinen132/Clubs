/**
 * ui_cup.js
 * Handles the Mid-Season Knockout Tournament.
 */

window.UICup = {
    render(container, params) {
        const gs = window.GameState;

        if (!gs.midSeasonCup) {
            this.generateTournament();
        }

        const cup = gs.midSeasonCup;

        if (cup.isComplete) {
            this._renderComplete(container, cup);
            return;
        }

        let html = `
            <div class="dashboard-header" style="border-bottom-color: #d4af37;">
                <h2 style="color: #d4af37; text-transform: uppercase;">The Mid-Season Cup</h2>
                <div class="header-stats">
                    <div class="stat-badge" style="background: rgba(212,175,55,0.2); border-color: #d4af37; color: #d4af37;">
                        Round: ${['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'][cup.round - 1]}
                    </div>
                </div>
            </div>
            <p style="color: #ccc; margin-bottom: 20px; font-style: italic;">
                The best 2 fighters from every club clash in a 16-roster knockout tournament. 
                Winner takes $30,000.
            </p>
        `;

        html += `<div id="cup-bracket" style="display:flex; flex-wrap:wrap; gap:15px; margin-bottom: 30px;">`;

        let unplayedPlayerMatches = [];

        cup.matches.forEach((m, idx) => {
            let isPlayer = cup.playerFighterIds.includes(m.f1.id) || cup.playerFighterIds.includes(m.f2.id);
            let bgColor = isPlayer ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.4)';
            let borderColor = isPlayer ? '#d4af37' : '#444';

            html += `
                <div style="width:calc(50% - 15px); padding:15px; border:1px solid ${borderColor}; background:${bgColor}; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap: 10px;">
                            ${window.UIComponents.createFighterAvatarHtml(m.f1, 40)}
                            <div style="display:flex; flex-direction:column;">
                                <span style="color:${(isPlayer && cup.playerFighterIds.includes(m.f1.id)) ? '#fff' : '#888'}; font-weight:bold;">${m.f1.name}</span>
                                <span style="font-size:0.75rem; color:#888;">${gs.getClub(m.f1.club_id).name}</span>
                            </div>
                        </div>
                        <span style="color:#d4af37; font-weight:bold; font-size:1.2rem; margin: 0 10px;">VS</span>
                        <div style="display:flex; align-items:center; gap: 10px; flex-direction: row-reverse; text-align: right;">
                            ${window.UIComponents.createFighterAvatarHtml(m.f2, 40)}
                            <div style="display:flex; flex-direction:column;">
                                <span style="color:${(isPlayer && cup.playerFighterIds.includes(m.f2.id)) ? '#fff' : '#888'}; font-weight:bold;">${m.f2.name}</span>
                                <span style="font-size:0.75rem; color:#888;">${gs.getClub(m.f2.club_id).name}</span>
                            </div>
                        </div>
                    </div>
            `;

            if (m.winner) {
                html += `<div style="margin-top:10px; padding:5px; background:rgba(0,0,0,0.5); font-size:0.8rem; color:#ccc;"><strong>${m.winner.name} won.</strong></div>`;
            } else if (isPlayer) {
                unplayedPlayerMatches.push(idx);
                html += `<button class="btn-primary" style="width:100%; margin-top:10px; background:#d4af37; color:#000;" onclick="window.UICup.playMatch(${idx})">FIGHT NOW</button>`;
            } else {
                html += `<div style="text-align:center; color:#666; font-style:italic; margin-top:10px;">Pending Simulation...</div>`;
            }

            html += `</div>`;
        });

        html += `</div>`;

        if (unplayedPlayerMatches.length === 0) {
            html += `
                <div style="text-align: center; margin-top: 2rem;">
                    <button id="btn-cup-continue" class="btn-primary" style="padding:15px 30px; font-size:1.2rem;" onclick="window.UICup.advanceBracket()">RESOLVE ROUND</button>
                </div>
            `;
        } else {
            html += `<div style="text-align: center; margin-top: 2rem; color: #888;">Play your scheduled match(es) to proceed.</div>`;
        }

        container.innerHTML = html;
    },

    _renderComplete(container, cup) {
        let html = `
            <div class="panel" style="text-align:center; border-color:#d4af37; padding:40px;">
                <h1 style="color:#d4af37; font-size:3rem; margin-bottom:10px;">CUP CHAMPION</h1>
                <h2>${cup.champion.name} (${window.GameState.getClub(cup.champion.club_id).name})</h2>
                <p style="color:#ccc; margin-top: 20px;">The mid-season tournament is over. The league resumes.</p>
                <button class="btn-primary" style="margin-top:30px; background:#d4af37; color:#000;" onclick="window.UICup.exitCup()">Resume League (Week 8)</button>
            </div>
            
            <h3 style="margin-top: 30px; color: #d4af37;">Tournament History</h3>
            <div class="panel" style="margin-top: 10px; color: #ccc; font-size: 0.9rem; line-height: 1.6;">
                ${cup.logs.map(l => `<p style="margin-bottom: 15px;">${l}</p>`).join('')}
            </div>
        `;
        container.innerHTML = html;
    },

    generateTournament() {
        const gs = window.GameState;
        let pool = [];
        let playerFighterIds = [];

        // Auto-select the top 2 fighters from ALL 8 clubs based on OVR prioritizing freshness
        Object.keys(gs.clubs).forEach(clubId => {
            let club = gs.clubs[clubId];
            if (club.fighter_ids.length === 0) return;

            // Score logic: (OVR) - (fatigue penalty)
            let sorted = club.fighter_ids.map(id => gs.getFighter(id))
                .filter(f => f && (!f.dynamic_state.injuries || f.dynamic_state.injuries.length === 0))
                .sort((a, b) => {
                    let aOvr = (a.core_stats.power + a.core_stats.technique + a.core_stats.speed) / 3;
                    let bOvr = (b.core_stats.power + b.core_stats.technique + b.core_stats.speed) / 3;
                    let aScore = aOvr - (a.dynamic_state.fatigue || 0) * 0.5;
                    let bScore = bOvr - (b.dynamic_state.fatigue || 0) * 0.5;
                    return bScore - aScore;
                });

            // Take top 2
            let reps = sorted.slice(0, 2);
            pool.push(...reps);

            if (clubId === gs.playerClubId) {
                playerFighterIds.push(...reps.map(r => r.id));
                gs.addNews('global', `Manager selected ${reps.map(r => r.name).join(' and ')} to represent the club in the Mid-Season Cup.`);
            }
        });

        // If for some reason we don't have exactly 16, pad with underground fighters (shouldn't happen with 8 clubs * 2 unless massive injury crisis)
        while (pool.length < 16) {
            pool.push(window.UndergroundEngine.generateFighter(1));
        }

        // Trim if > 16 just in case
        pool = pool.slice(0, 16);

        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        let matches = [];
        for (let i = 0; i < 16; i += 2) {
            matches.push({
                f1: pool[i],
                f2: pool[i + 1],
                winner: null
            });
        }

        gs.midSeasonCup = {
            round: 1, // 1: Ro16, 2: Quarters, 3: Semis, 4: Final
            matches: matches,
            playerFighterIds: playerFighterIds,
            logs: [],
            isComplete: false,
            champion: null,
            semiFinalistsCounted: false
        };
    },

    playMatch(matchIndex) {
        const gs = window.GameState;
        let cup = gs.midSeasonCup;
        let m = cup.matches[matchIndex];

        let pId = cup.playerFighterIds.includes(m.f1.id) ? m.f1.id : m.f2.id;
        let oId = pId === m.f1.id ? m.f2.id : m.f1.id;

        // Pass context to UIMatch
        window.UIMatch.startUndergroundMatch(pId, oId, { type: 'midseasoncup', matchIndex: matchIndex });
    },

    processPlayerMatchResult(winner, loser, context) {
        const gs = window.GameState;
        let cup = gs.midSeasonCup;
        let m = cup.matches[context.matchIndex];

        m.winner = m.f1.id === winner.id ? m.f1 : m.f2;

        // Go back to cup bracket
        this.render(document.getElementById('main-view'));
    },

    advanceBracket() {
        const gs = window.GameState;
        let cup = gs.midSeasonCup;
        let winners = [];
        let rLogs = [];

        cup.matches.forEach(m => {
            if (!m.winner) {
                // AI vs AI simulate
                let style = ['boxing', 'naked_wrestling', 'catfight', 'sexfight'][Math.floor(Math.random() * 4)];
                let sim = new MatchSimulation(m.f1, m.f2, style, false);
                sim.startMatch();
                while (!sim.winner) { sim.playRound(); }

                m.winner = sim.winner;

                // Add some fatigue to both
                m.f1.dynamic_state.fatigue = Math.min(100, (m.f1.dynamic_state.fatigue || 0) + 15);
                m.f2.dynamic_state.fatigue = Math.min(100, (m.f2.dynamic_state.fatigue || 0) + 15);
            }
            winners.push(m.winner);
            let loser = m.winner.id === m.f1.id ? m.f2 : m.f1;
            rLogs.push(`${m.winner.name} beat ${loser.name}`);
        });

        cup.logs.push(`<strong>Round ${cup.round} Results:</strong> ` + rLogs.join(" | "));

        // Pay semi-finalists if round 3 (Semis) just finished
        if (cup.round === 3) {
            cup.matches.forEach(m => {
                let loser = m.winner.id === m.f1.id ? m.f2 : m.f1;
                this._payClub(loser.club_id, 7500);
            });
        }

        if (winners.length === 1) {
            cup.champion = winners[0];
            cup.isComplete = true;

            // Pay winner and runner-up (which just lost in round 4)
            let finalMatch = cup.matches[0];
            let runnerUp = finalMatch.winner.id === finalMatch.f1.id ? finalMatch.f2 : finalMatch.f1;

            this._payClub(cup.champion.club_id, 30000);
            this._payClub(runnerUp.club_id, 15000);

            gs.addNews('global', `🏆 ${cup.champion.name} (${gs.getClub(cup.champion.club_id).name}) won the Mid-Season Cup and walked away with $30,000!`);

        } else {
            let nextMatches = [];
            for (let i = 0; i < winners.length; i += 2) {
                nextMatches.push({
                    f1: winners[i],
                    f2: winners[i + 1],
                    winner: null
                });
            }
            cup.round++;
            cup.matches = nextMatches;
        }

        this.render(document.getElementById('main-view'));
    },

    _payClub(clubId, amount) {
        const gs = window.GameState;
        if (clubId === gs.playerClubId) {
            gs.money += amount;
            if (typeof updateNavUI === 'function') updateNavUI();
        } else {
            let club = gs.getClub(clubId);
            if (club) club.money = (club.money || 0) + amount;
        }
    },

    exitCup() {
        const gs = window.GameState;
        gs.midSeasonCupCompleted = true;
        gs.midSeasonCupActive = false;

        // Remove tracking so we don't carry this heavy object forever
        // gs.midSeasonCup = null; // Un-comment if memory gets tight, but logs are nice to keep.

        // Advance safely back to dashboard
        window.Router.loadRoute('club');
    }
};
