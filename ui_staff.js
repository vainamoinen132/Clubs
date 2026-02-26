/**
 * ui_staff.js
 * Handles staff management: viewing current staff, firing them, and hiring new ones.
 * Staff now have Elite / Budget tiers, a base salary, and per-win bonuses.
 */

window.UIStaff = {
    poolFilter: 'all',

    setFilter(val) {
        this.poolFilter = val;
        window.Router.loadRoute('staff');
    },

    render(container, params) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        let staffHtml = this._buildCurrentStaffHtml(club, gs);
        let poolHtml = this._buildStaffPoolHtml(gs);

        let filterHtml = `
            <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <label style="color:var(--text-muted); font-size:0.9rem;">Filter By Role:</label>
                <select id="staff-filter-select" style="background:#222; color:#fff; padding:0.4rem; border:1px solid #444; border-radius:4px; outline:none;" onchange="window.UIStaff.setFilter(this.value)">
                    <option value="all" ${this.poolFilter === 'all' ? 'selected' : ''}>All Roles</option>
                    <option value="head_coach" ${this.poolFilter === 'head_coach' ? 'selected' : ''}>Head Coach</option>
                    <option value="striking_coach" ${this.poolFilter === 'striking_coach' ? 'selected' : ''}>Striking Coach</option>
                    <option value="grapple_coach" ${this.poolFilter === 'grapple_coach' ? 'selected' : ''}>Grappling Coach</option>
                    <option value="conditioning_coach" ${this.poolFilter === 'conditioning_coach' ? 'selected' : ''}>Conditioning Coach</option>
                    <option value="psych_coach" ${this.poolFilter === 'psych_coach' ? 'selected' : ''}>Psychology Coach</option>
                </select>
            </div>
        `;

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Staff Management', 'Hire specialized coaches to improve training yields and fatigue recovery. Elite staff cost more but reward winning.')}

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem;">
                <div>
                    <h3 class="font-outfit" style="margin-bottom: 1rem; color: var(--accent);">Current Staff</h3>
                    ${staffHtml}
                </div>
                <div>
                    <h3 class="font-outfit" style="margin-bottom: 1rem; color: var(--accent);">Hiring Pool</h3>
                    ${filterHtml}
                    <div style="max-height: 600px; overflow-y: auto; padding-right: 10px;">
                        ${poolHtml}
                    </div>
                </div>
            </div>
            `;
    },

    // ── TIER BADGE HELPER ────────────────────────────────────────────────────
    _tierBadge(tier) {
        if (tier === 'elite') {
            return `<span style="background:rgba(212,175,55,0.18); color:#d4af37; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:700;">⭐ Elite</span>`;
        }
        return `<span style="background:rgba(255,255,255,0.07); color:#aaa; padding:2px 8px; border-radius:4px; font-size:0.72rem;">Budget</span>`;
    },

    _buildCurrentStaffHtml(club, gs) {
        const roles = [
            { id: 'head_coach', label: 'Head Coach' },
            { id: 'striking_coach', label: 'Striking Coach' },
            { id: 'grapple_coach', label: 'Grappling Coach' },
            { id: 'conditioning_coach', label: 'Conditioning Coach' },
            { id: 'psych_coach', label: 'Psychology Coach' }
        ];

        let html = '';
        roles.forEach(roleDef => {
            const staffId = club.staff[roleDef.id];

            html += `<div class="glass-panel" style="padding: 1rem; margin-bottom: 1rem;">`;
            html += `<h4 style="color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem; margin-bottom: 0.5rem;">${roleDef.label}</h4>`;

            if (staffId) {
                const s = gs.staff[staffId];
                const winBonusStr = s.win_bonus ? `$${s.win_bonus.toLocaleString()} per win` : 'No bonus';
                const capStr = s.bonus_cap ? `(cap $${s.bonus_cap.toLocaleString()}/yr)` : '';
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                                <strong style="font-size: 1.1rem;">${s.name}</strong>
                                ${this._tierBadge(s.tier || 'budget')}
                            </div>
                            <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">Skill: ${s.skill}</span>
                            <div style="font-size: 0.9rem; color: #aaa; margin-top: 0.3rem;">Trait: ${s.trait}</div>
                            <div style="font-size:0.8rem; color: #00e676; margin-top: 5px;">Salary: $${s.salary.toLocaleString()}/yr</div>
                            <div style="font-size:0.8rem; color: #d4af37; margin-top: 2px;">Win bonus: ${winBonusStr} ${capStr}</div>
                        </div>
                        <button class="btn-danger" onclick="window.UIStaff.fireStaff('${roleDef.id}')">Fire</button>
                    </div>
                `;
            } else {
                html += `<div style="color: #666; font-style: italic;">Vacant</div>`;
            }
            html += `</div>`;
        });

        return html;
    },

    _buildStaffPoolHtml(gs) {
        let pool = gs.staffPool;
        if (this.poolFilter && this.poolFilter !== 'all') {
            pool = pool.filter(id => gs.staff[id].role === this.poolFilter);
        }

        if (pool.length === 0) {
            return `<div class="glass-panel" style="padding: 1rem; text-align: center; color: var(--text-muted);">No staff available for this filter right now.</div>`;
        }

        let html = '';
        pool.forEach(id => {
            const s = gs.staff[id];
            const empClub = s.employed_by ? gs.getClub(s.employed_by) : null;

            let bonusText = Object.entries(s.passive_bonus).map(([k, v]) => `${k.replace(/_/g, ' ')}: +${v} `).join(', ');
            let empStr = s.employed_by ? window.UIComponents.createClubBadge(empClub) : `<span class="tag">Free Agent</span>`;

            const winBonusStr = s.win_bonus ? `$${s.win_bonus.toLocaleString()}/win` : '—';
            const capStr = s.bonus_cap ? ` (cap $${s.bonus_cap.toLocaleString()}/yr)` : '';
            // Estimated weekly cost shown on Hire button (base + approx 3 wins/wk)
            const estAnnual = s.salary + Math.min(s.win_bonus * 7, s.bonus_cap || 0);

            html += `
            <div class="glass-panel" style="padding: 1rem; margin-bottom: 1rem; border-left: 3px solid var(--accent);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                            <strong style="font-size: 1.1rem;">${s.name}</strong>
                            ${this._tierBadge(s.tier || 'budget')}
                        </div>
                        <div class="season-badge" style="margin-bottom:4px;">${s.role.replace(/_/g, ' ')}</div>
                        <div style="font-size: 0.9rem; color: #aaa; margin-top: 0.3rem;">Skill: ${s.skill} | Trait: ${s.trait}</div>
                        <div style="font-size: 0.85rem; color: var(--accent); margin-top: 0.4rem; line-height: 1.5;">${bonusText}</div>
                        <div style="margin-top: 0.5rem;">${empStr}</div>
                    </div>
                    <div style="text-align: right; min-width: 120px;">
                        <div style="color: #00e676; font-size:0.85rem; margin-bottom: 2px;">Salary: $${s.salary.toLocaleString()}/yr</div>
                        <div style="color: #d4af37; font-size:0.8rem; margin-bottom: 6px;">Bonus: ${winBonusStr}${capStr}</div>
                        <button class="btn-primary" onclick="window.UIStaff.hireStaff('${s.id}', '${s.role}', ${s.salary})">
                            Hire (~$${estAnnual.toLocaleString()}/yr est.)
                        </button>
                    </div>
                </div>
            </div>
            `;
        });

        return html;
    },

    hireStaff(id, role, cost) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);

        if (gs.money < cost) {
            alert("Not enough money to cover the first week's salary!");
            return;
        }

        if (club.staff[role]) {
            alert(`You already have a ${role.replace(/_/g, ' ')}. Fire them first.`);
            return;
        }

        gs.money -= cost;
        club.staff[role] = id;

        // Remove from pool
        gs.staffPool = gs.staffPool.filter(sId => sId !== id);

        gs.addNews('transfer', `${club.name} hired ${gs.staff[id].name} as their new ${role.replace(/_/g, ' ')}.`);

        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('staff');
    },

    fireStaff(role) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);

        const id = club.staff[role];
        if (!id) return;

        if (confirm(`Are you sure you want to fire ${gs.staff[id].name}?`)) {
            club.staff[role] = null;
            gs.staffPool.push(id);

            gs.addNews('transfer', `${club.name} has fired their ${role.replace(/_/g, ' ')}.`);
            window.Router.loadRoute('staff');
        }
    }
};
