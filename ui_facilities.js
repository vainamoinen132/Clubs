/**
 * ui_facilities.js
 * Handle club upgrades affecting passive stat growth.
 */

window.UIFacilities = {
    render(container, params) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        // Initialize facility levels if not present
        if (!club.facilities) {
            club.facilities = { gym: 1, recovery: 1, pr: 1 };
        }

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Facilities & Economy', 'Upgrade your club infrastructure to gain permanent advantages.')}
            
            <div class="glass-panel" style="padding: 1rem; margin-bottom: 2rem; border-left: 3px solid var(--accent);">
                <span style="font-size: 1.2rem;">Club Funds: <strong style="color:#00e676;">$${gs.money.toLocaleString()}</strong></span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                ${this._createFacilityCard('Gymnasium', 'gym', 'Raises Natural Ceilings and Training effectiveness.', club.facilities.gym, [0, 10000, 30000, 80000, "MAX"])}
                ${this._createFacilityCard('Recovery Center', 'recovery', 'Increases weekly fatigue recovery.', club.facilities.recovery, [0, 12000, 36000, 100000, "MAX"])}
                ${this._createFacilityCard('PR Department', 'pr', 'Multiplies Fame and Sponsorships.', club.facilities.pr, [0, 8000, 24000, 60000, "MAX"])}
            </div>
        `;

        setTimeout(() => {
            container.querySelectorAll('.btn-upgrade').forEach(b => {
                b.addEventListener('click', (e) => {
                    this._upgradeFacility(e.currentTarget.getAttribute('data-fac'), club);
                });
            });
        }, 0);
    },

    _createFacilityCard(name, key, desc, level, costs) {
        let cost = costs[level];
        let costStr = typeof cost === 'number' ? `$${cost.toLocaleString()}` : cost;
        let btnDisabled = (typeof cost !== 'number' || window.GameState.money < cost) ? "disabled" : "";
        let btnStyle = btnDisabled ? "background: #444; color: #888; cursor: not-allowed;" : "";

        // Annual upkeep: Level 1 = free, then scales meaningfully
        const upkeepTable = [0, 0, 10000, 30000, 60000];
        let maintCost = upkeepTable[Math.min(level, 4)];

        return `
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <h3 style="margin-bottom: 0.5rem; font-family: var(--font-heading);">${name}</h3>
                <div style="font-size: 1.5rem; color: var(--accent); margin-bottom: 0.5rem;">Level ${level}</div>
                <div style="font-size: 0.85rem; color: #ff5252; margin-bottom: 1rem; font-weight:bold;">Upkeep: ${maintCost > 0 ? `-$${maintCost.toLocaleString()}/yr` : '<span style="color:#00e676;">No Upkeep</span>'}</div>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; height: 40px;">${desc}</p>
                <button class="btn-primary btn-upgrade" data-fac="${key}" ${btnDisabled} style="width: 100%; ${btnStyle}">
                    Upgrade (${costStr})
                </button>
            </div>
        `;
    },

    _upgradeFacility(key, club) {
        const costs = {
            gym: [0, 10000, 30000, 80000, "MAX"],
            recovery: [0, 12000, 36000, 100000, "MAX"],
            pr: [0, 8000, 24000, 60000, "MAX"]
        };

        let currentLevel = club.facilities[key];
        let cost = costs[key][currentLevel];

        if (typeof cost === 'number' && window.GameState.money >= cost) {
            window.GameState.money -= cost;
            club.facilities[key]++;
            console.log(`Upgraded ${key} to Level ${club.facilities[key]}`);

            if (typeof updateNavUI === 'function') updateNavUI();
            window.Router.loadRoute('facilities'); // redraw
        }
    },

};
