/**
 * ui_tournament.js
 * Handles the Top 4 Playoffs at the end of the Season.
 */

window.UITournament = {
    render(container, params) {
        const gs = window.GameState;

        // Calculate Top 4 from standings
        let standings = Object.values(gs.clubs).map(c => {
            // Count wins
            let wins = gs.schedule.filter(m => m.winnerId && gs.getFighter(m.winnerId)?.club_id === c.id).length;
            return { club: c, wins: wins };
        });

        standings.sort((a, b) => b.wins - a.wins);
        let top4 = standings.slice(0, 4);

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Season ' + gs.season + ' Championship', 'The Top 4 clubs face off for ultimate glory.')}
            
            <div style="display: flex; justify-content: space-around; align-items: center; margin-top: 3rem; background: rgba(0,0,0,0.3); padding: 3rem; border-radius: 12px; position: relative;">
                
                <!-- Semi-Finals Left -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    ${this._bracketBox(top4[0], 1, top4[3], 4)}
                </div>
                
                <!-- Finals Center -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <h2 class="font-outfit text-gradient" style="margin-bottom: 2rem;">Grand Final</h2>
                    ${this._bracketBox(null, 'W1', null, 'W2', true)}
                </div>
                
                <!-- Semi-Finals Right -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    ${this._bracketBox(top4[1], 2, top4[2], 3)}
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 3rem;">
                <p class="text-muted" style="margin-bottom: 1rem;">The playoffs are simulated automatically along with the weekly advance.</p>
                <button class="btn-primary" onclick="window.Router.loadRoute('club')">Back to Dashboard</button>
            </div>
        `;
    },

    _bracketBox(t1, s1, t2, s2, isFinal = false) {
        let n1 = t1 ? t1.club.name : "TBD";
        let c1 = t1 ? t1.club.color : "#666";
        let n2 = t2 ? t2.club.name : "TBD";
        let c2 = t2 ? t2.club.color : "#666";

        let outline = isFinal ? "border: 2px solid var(--accent); box-shadow: 0 0 15px var(--accent-glow);" : "border: 1px solid var(--border-glass);";

        return `
            <div class="glass-panel" style="padding: 1rem; width: 220px; text-align: center; ${outline}">
                <div style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: ${c1}; font-weight: bold;">
                    <span style="font-size: 0.7rem; color: #888; margin-right: 5px;">${s1}</span> ${n1}
                </div>
                <div style="padding: 0.5rem; color: ${c2}; font-weight: bold;">
                    <span style="font-size: 0.7rem; color: #888; margin-right: 5px;">${s2}</span> ${n2}
                </div>
            </div>
        `;
    }
};
