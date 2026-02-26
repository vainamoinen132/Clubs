/**
 * ui_league.js
 * Shows standings and results.
 */

window.UILeague = {
    render(container, params) {
        const gs = window.GameState;

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('League Standings', 'Top 8 Clubs fighting for the Seasonal Crown.')}
            
            <div class="glass-panel" style="padding: 1.5rem;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-glass);">
                            <th style="padding: 0.8rem;">Pos</th>
                            <th style="padding: 0.8rem;">Club</th>
                            <th style="padding: 0.8rem;">Played</th>
                            <th style="padding: 0.8rem;">W</th>
                            <th style="padding: 0.8rem;">L</th>
                            <th style="padding: 0.8rem;">RW</th>
                            <th style="padding: 0.8rem;">RL</th>
                            <th style="padding: 0.8rem;">Diff</th>
                            <th style="padding: 0.8rem;">Pts</th>
                        </tr>
                    </thead>
                    <tbody id="league-table-body">
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 2rem;">
                <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">Recent Results</h3>
                <div id="league-results" style="display:grid; gap:0.5rem;">
                   <p class="text-muted">No matches played yet.</p>
                </div>
            </div>
        `;

        // Ensure standings are calculated if visiting for the first time
        if (window.AIEngine && gs.leagueStandings.length === 0) {
            window.AIEngine._updateStandings();
        }

        const tbody = document.getElementById('league-table-body');
        gs.leagueStandings.forEach((st, idx) => {
            let tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid var(--border-glass)";

            // Highlight player club
            if (st.id === gs.playerClubId) {
                tr.style.background = "rgba(255,255,255,0.05)";
                tr.style.fontWeight = "bold";
            }

            // Dynamic text color for better legibility depending on club background
            // Germany (#000000) was invisible against the dark theme before if set as color.

            tr.innerHTML = `
                <td style="padding: 1rem;">${idx + 1}</td>
                <td style="padding: 1rem;">
                    ${window.UIComponents.createClubBadge(st)}
                </td>
                <td style="padding: 1rem;">${st.played}</td>
                <td style="padding: 1rem;">${st.w}</td>
                <td style="padding: 1rem;">${st.l}</td>
                <td style="padding: 1rem;">${st.rw}</td>
                <td style="padding: 1rem;">${st.rl}</td>
                <td style="padding: 1rem;">${st.rd > 0 ? '+' : ''}${st.rd}</td>
                <td style="padding: 1rem; font-size: 1.1em; color: var(--text-highlight);"><strong>${st.pts}</strong></td>
            `;
            tbody.appendChild(tr);
        });

    }
};
