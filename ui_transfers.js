/**
 * ui_transfers.js  — Football Manager-style Transfer Module
 *
 * Tab 1: 📥 Transfer Inbox  — review incoming bids, accept/reject/counter
 * Tab 2: 👊 My Roster       — willingness badges, list/release, demands
 * Tab 3: 🆓 Free Agents     — scout & bid on uncontracted fighters
 * Tab 4: 🌍 Scouting        — Bosman targets + contracted buyouts
 */

window.UITransfers = {

    // ─── MAIN RENDER ───────────────────────────────────────────────────────────

    render(container, params) {
        const gs = window.GameState;
        if (!gs.transferInbox) gs.transferInbox = [];
        if (!gs.pendingTransferDemands) gs.pendingTransferDemands = [];

        const inboxCount = gs.transferInbox.length;
        const demandCount = (gs.pendingTransferDemands || []).length;

        const activeTab = (params && params.tab) || (inboxCount > 0 ? 'inbox' : 'roster');

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Transfers', 'Football Manager-style transfer centre. Review offers, manage your roster.')}

            <div class="glass-panel" style="padding: 1rem; margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:center;">
                <span>Budget: <strong style="color:#00e676;">$${gs.money.toLocaleString()}</strong></span>
                <span>Action Points: <strong style="color:var(--accent);">${gs.actionPoints} / ${gs.maxActionPoints}</strong></span>
                <span style="font-size:0.85rem; color:var(--text-muted);">Week ${gs.week}</span>
            </div>

            <!-- TABS -->
            <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap;">
                ${this._tab('inbox', `📥 Inbox${inboxCount > 0 ? ` <span style="background:#ff5252;color:#fff;border-radius:50%;padding:1px 6px;font-size:0.75rem;">${inboxCount}</span>` : ''}`, activeTab)}
                ${this._tab('roster', `👊 My Roster${demandCount > 0 ? ` <span style="background:#ff9800;color:#000;border-radius:50%;padding:1px 6px;font-size:0.75rem;">!</span>` : ''}`, activeTab)}
                ${this._tab('free', '🆓 Free Agents', activeTab)}
                ${this._tab('scout', '🌍 Scouting', activeTab)}
            </div>

            <div id="transfers-content"></div>
        `;

        container.querySelectorAll('.xfer-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                window.Router.loadRoute('transfers', { tab: btn.dataset.tab });
            });
        });

        const content = document.getElementById('transfers-content');
        if (activeTab === 'inbox') this._renderInbox(content);
        if (activeTab === 'roster') this._renderRoster(content);
        if (activeTab === 'free') this._renderFreeAgents(content);
        if (activeTab === 'scout') this._renderScouting(content);
    },

    _tab(id, label, active) {
        const isActive = id === active;
        return `<button class="xfer-tab btn-primary" data-tab="${id}" style="padding:0.6rem 1.2rem; font-size:0.9rem; ${isActive ? 'background:var(--accent);' : 'background:rgba(255,255,255,0.1);'}">${label}</button>`;
    },

    // ─── TAB 1: TRANSFER INBOX ─────────────────────────────────────────────────

    _renderInbox(container) {
        const gs = window.GameState;
        let inbox = gs.transferInbox || [];

        // Filter to only show bids for fighters currently owned by the player
        inbox = inbox.filter(bid => {
            let f = gs.getFighter(bid.fighterId);
            return f && f.club_id === gs.playerClubId;
        });

        // Also show pending demands
        const demands = gs.pendingTransferDemands || [];

        if (inbox.length === 0 && demands.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="padding:2rem; text-align:center; color:var(--text-muted);">
                    <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
                    <h3>No Incoming Offers</h3>
                    <p style="margin-top:0.5rem;">List fighters for transfer in the <strong>My Roster</strong> tab — AI clubs will bid within a week.</p>
                </div>`;
            return;
        }

        let html = '';

        // Demand notifications first
        demands.forEach(demand => {
            const f = gs.getFighter(demand.fighterId);
            if (!f) return;
            const imgSrc = f.avatar ? `assets/portraits/${f.avatar}` : `assets/portraits/${f.name.toLowerCase()}.png`;
            const fallback = window.UIComponents._makeInitialsAvatar(f.name, '#ff5252');
            html += `
                <div class="glass-panel" style="padding:1.5rem; margin-bottom:1rem; border-left:4px solid #ff9800; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                    <img src="${imgSrc}" onerror="this.src='${fallback}'" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:2px solid #ff9800;" />
                    <div style="flex:1; min-width:220px;">
                        <div style="color:#ff9800; font-weight:bold; font-size:0.85rem; text-transform:uppercase; margin-bottom:0.3rem;">⚠️ Transfer Request</div>
                        <h3 style="margin:0 0 0.3rem;">${f.name}</h3>
                        <p style="font-size:0.85rem; color:var(--text-muted);">She is desperate to leave. ${demand.willingness.reasons.join(' · ')}</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <button class="btn-primary" style="background:#e0a020; padding:0.5rem 1rem;" onclick="window.UITransfers.listFromDemand('${f.id}')">List for Transfer</button>
                        <button class="btn-primary" style="background:#555; padding:0.5rem 1rem;" onclick="window.UITransfers.rejectDemand('${f.id}')">Reject Demand (−15 Morale)</button>
                    </div>
                </div>`;
        });

        // Bid cards
        if (inbox.length > 0) {
            html += `<h3 style="margin-bottom:1rem; font-family:var(--font-heading); color:var(--accent);">Incoming Transfer Bids</h3>`;
        }
        inbox.forEach(bid => {
            const f = gs.getFighter(bid.fighterId);
            const club = gs.getClub(bid.biddingClubId);
            if (!f || !club) return;

            const w = window.AITransfers._computeFighterWillingness(f);
            const wBadge = this._willingnessBadge(w.level);
            const imgSrc = f.avatar ? `assets/portraits/${f.avatar}` : `assets/portraits/${f.name.toLowerCase()}.png`;
            const fallback = window.UIComponents._makeInitialsAvatar(f.name, '#888');

            // Detect lovers in squad
            const playerClub = gs.getClub(gs.playerClubId);
            let loverNote = '';
            if (playerClub) {
                playerClub.fighter_ids.forEach(id => {
                    if (id === f.id) return;
                    const rel = f.dynamic_state?.relationships?.[id];
                    if (rel && (rel.type === 'lovers' || rel.type === 'obsession')) {
                        const partner = gs.getFighter(id);
                        if (partner) loverNote = `💔 Selling her will devastate her lover <strong>${partner.name}</strong> (−30 Morale, −30 Stress)`;
                    }
                });
            }

            // Fighter reaction text
            let reaction = '';
            if (w.level === 'wants_out') reaction = `<em>"I need to move on. This is the right opportunity."</em>`;
            else if (w.level === 'restless') reaction = `<em>"I'm open to listening… but I'm not sure I want to leave."</em>`;
            else if (w.level === 'neutral') reaction = `<em>"I have no strong feelings either way."</em>`;
            else reaction = `<em>"I don't want to go. This club is my home."</em>`;

            const overBid = bid.offerAmount >= bid.askingFee;
            const bidColor = overBid ? '#00e676' : '#ffca28';

            html += `
                <div class="glass-panel" style="padding:1.5rem; margin-bottom:1rem; border-left:4px solid ${club.color};">
                    <div style="display:flex; gap:1.2rem; align-items:flex-start; flex-wrap:wrap;">
                        <img src="${imgSrc}" onerror="this.src='${fallback}'" style="width:70px;height:70px;border-radius:10px;object-fit:cover;border:2px solid ${club.color};" />
                        <div style="flex:1; min-width:200px;">
                            <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.3rem;">
                                <h3 style="margin:0;">${f.name}</h3>
                                ${wBadge}
                            </div>
                            <div style="font-size:0.85rem; color:${club.color}; margin-bottom:0.4rem; font-weight:bold;">${club.name} — Week ${bid.weekReceived}</div>
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">${reaction}</div>
                            ${loverNote ? `<div style="font-size:0.8rem; color:#ff9800; margin-bottom:0.5rem;">${loverNote}</div>` : ''}
                            <div style="font-size:0.85rem; color:var(--text-muted);">Fighter reasons: ${w.reasons.join(' · ') || 'None'}</div>
                        </div>
                        <div style="text-align:right; min-width:150px;">
                            <div style="font-size:1.8rem; font-weight:bold; color:${bidColor};">$${bid.offerAmount.toLocaleString()}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">Asking: $${bid.askingFee.toLocaleString()}</div>
                            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                                <button class="btn-primary" style="background:#00e676;color:#000;padding:0.5rem 1rem;" onclick="window.UITransfers.acceptBid('${bid.id}')">✅ Accept</button>
                                <button class="btn-primary" style="background:#333;padding:0.5rem 1rem;" onclick="window.UITransfers.counterBid('${bid.id}')">💬 Counter</button>
                                <button class="btn-primary" style="background:#e0284f;padding:0.5rem 1rem;" onclick="window.UITransfers.rejectBid('${bid.id}')">❌ Reject</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
    },

    // ─── TAB 2: MY ROSTER ──────────────────────────────────────────────────────

    _renderRoster(container) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) { container.innerHTML = '<p>No club data.</p>'; return; }

        let html = `
            <p class="text-muted" style="font-size:0.85rem; margin-bottom:1rem;">
                <strong>List for Transfer:</strong> AI clubs bid next week — offers appear in your Inbox.<br>
                <strong>Release:</strong> Pay severance to immediately release her to free agency.
            </p>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:1px solid var(--border-glass);">
                        <th style="padding:0.8rem;">Fighter</th>
                        <th style="padding:0.8rem;">OVR</th>
                        <th style="padding:0.8rem;">Contract</th>
                        <th style="padding:0.8rem;">Willingness</th>
                        <th style="padding:0.8rem;">Status</th>
                        <th style="padding:0.8rem;">Action</th>
                    </tr>
                </thead>
                <tbody>`;

        club.fighter_ids.forEach(fId => {
            const f = gs.getFighter(fId);
            if (!f) return;

            const cs = f.core_stats;
            const ovr = Math.round((cs.power + cs.technique + cs.speed) / 3);
            const seasons = f.contract ? f.contract.seasons_remaining : '?';
            const salary = f.contract ? `$${f.contract.salary.toLocaleString()}/yr` : 'N/A';

            const w = window.AITransfers._computeFighterWillingness(f);
            const wBadge = this._willingnessBadge(w.level, w.reasons);

            const isListed = gs.listedForTransfer && gs.listedForTransfer.find(l => l.fighterId === fId);
            const isDemanding = f.contract && f.contract.demand_triggered;
            let statusHtml = isListed
                ? `<span style="color:#d4af37; font-size:0.8rem;">📋 Listed</span>`
                : isDemanding
                    ? `<span style="color:#ff9800; font-size:0.8rem;">⚠️ Demanding Transfer</span>`
                    : `<span style="color:var(--text-muted); font-size:0.8rem;">—</span>`;

            let actionHtml = '';
            if (club.fighter_ids.length <= 1) {
                actionHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">Last fighter</span>`;
            } else if (isListed) {
                actionHtml = `<button class="btn-primary" style="padding:0.35rem 0.7rem;font-size:0.8rem;background:#555;" onclick="window.UITransfers.cancelListing('${f.id}')">Cancel</button>`;
            } else {
                const sev = f.contract ? (f.contract.salary * (f.contract.seasons_remaining || 1)) : 0;
                actionHtml = `
                    <button class="btn-primary" style="padding:0.35rem 0.7rem;font-size:0.8rem;background:#e0a020;margin-right:4px;" onclick="window.UITransfers.listForTransfer('${f.id}')">List</button>
                    <button class="btn-primary" style="padding:0.35rem 0.7rem;font-size:0.8rem;background:#e0284f;" onclick="window.UITransfers.releaseAsFreeAgent('${f.id}')">Release ($${sev.toLocaleString()})</button>`;
            }

            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:0.9rem;"><strong>${f.name}</strong></td>
                    <td style="padding:0.9rem;"><strong style="color:var(--accent);">${ovr}</strong></td>
                    <td style="padding:0.9rem; font-size:0.85rem;">${salary} · ${seasons} season(s)</td>
                    <td style="padding:0.9rem;">${wBadge}</td>
                    <td style="padding:0.9rem;">${statusHtml}</td>
                    <td style="padding:0.9rem;">${actionHtml}</td>
                </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    // ─── TAB 3: FREE AGENTS ────────────────────────────────────────────────────

    _renderFreeAgents(container) {
        const gs = window.GameState;
        if (gs.transferPool.length === 0) {
            container.innerHTML = `<div class="glass-panel" style="padding:2rem;text-align:center;color:var(--text-muted);">No free agents available. Check back next season.</div>`;
            return;
        }

        let html = `
            <p class="text-muted" style="font-size:0.85rem; margin-bottom:1rem;">Scout first to reveal true stats, then make a salary bid.</p>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:1px solid var(--border-glass);">
                        <th style="padding:0.8rem;">Name</th>
                        <th style="padding:0.8rem;">Age</th>
                        <th style="padding:0.8rem;">OVR Est.</th>
                        <th style="padding:0.8rem;">Archetype</th>
                        <th style="padding:0.8rem;">Action</th>
                    </tr>
                </thead>
                <tbody>`;

        gs.transferPool.forEach((f, idx) => {
            const cs = f.core_stats;
            const rawOvr = Math.floor((cs.power + cs.technique + cs.speed) / 3);
            const statDisplay = f.scouted
                ? `<strong style="color:var(--accent);">${rawOvr}</strong>`
                : `<span class="text-muted">~${rawOvr + Math.floor(Math.random() * 8) - 4}</span>`;

            const btnAction = f.scouted
                ? `<button class="btn-primary" style="padding:0.35rem 0.8rem;font-size:0.8rem;background:var(--accent);" onclick="window.UITransfers.initiateBid(${idx})">Make Bid</button>`
                : `<button class="btn-primary" style="padding:0.35rem 0.8rem;font-size:0.8rem;background:#555;" onclick="window.UITransfers.scoutFighter(null,${idx})">Scout (1 AP)</button>`;

            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:0.9rem;"><strong>${f.name}</strong></td>
                    <td style="padding:0.9rem;">${f.age || '?'}</td>
                    <td style="padding:0.9rem;">${statDisplay}</td>
                    <td style="padding:0.9rem; font-size:0.85rem; color:var(--text-muted);">${f.personality?.archetype || '?'}</td>
                    <td style="padding:0.9rem;">${btnAction}</td>
                </tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    // ─── TAB 4: SCOUTING ───────────────────────────────────────────────────────

    _renderScouting(container) {
        const gs = window.GameState;
        if (!gs._globalTargetsCache) this._rebuildGlobalTargetsCache();

        const bosman = this._getBosmanTargets();
        const contracted = gs._globalTargetsCache.filter(f => f.contract && f.contract.seasons_remaining !== 1);

        let html = `
            <h3 style="margin-bottom:0.5rem; color:#ff80ab;">🔓 Bosman Targets — Final Contract Year (Free Next Season)</h3>
            <p class="text-muted" style="font-size:0.85rem; margin-bottom:1rem;">No transfer fee — agree salary now, she joins at season start.</p>`;

        if (bosman.length === 0) {
            html += `<p class="text-muted" style="margin-bottom:2rem;">None available right now.</p>`;
        } else {
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:2rem;"><thead><tr style="text-align:left; border-bottom:1px solid var(--border-glass);">
                <th style="padding:0.8rem;">Name (Club)</th><th style="padding:0.8rem;">OVR</th><th style="padding:0.8rem;">Min Salary</th><th style="padding:0.8rem;">Action</th>
            </tr></thead><tbody>`;
            bosman.forEach(f => {
                const ovr = Math.round((f.core_stats.power + f.core_stats.technique + f.core_stats.speed) / 3);
                const ownerClub = gs.getClub(f.club_id);
                const minSalary = Math.floor(ovr * 180 + 10000);
                const pending = gs.pendingBosmanMoves && gs.pendingBosmanMoves.find(b => b.fighterId === f.id);
                const statD = f.scouted ? `<strong style="color:var(--accent);">${ovr}</strong>` : `<span class="text-muted">~${ovr + Math.floor(Math.random() * 8) - 4}</span>`;
                const actionHtml = pending
                    ? `<span style="color:#00e676; font-size:0.85rem;">✅ Agreed @ $${pending.salary.toLocaleString()}/yr</span>`
                    : f.scouted
                        ? `<button class="btn-primary" style="padding:0.35rem 0.8rem;font-size:0.8rem;background:#28a0e0;" onclick="window.UITransfers.initiateBosman('${f.id}')">Pre-Sign</button>`
                        : `<button class="btn-primary" style="padding:0.35rem 0.8rem;font-size:0.8rem;background:#555;" onclick="window.UITransfers.scoutFighter('${f.id}',null)">Scout (1 AP)</button>`;
                html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:0.9rem;"><strong>${f.name}</strong><br><span style="font-size:0.8rem;color:${ownerClub?.color || '#aaa'};">${ownerClub?.name || 'Unknown'}</span></td>
                    <td style="padding:0.9rem;">${statD}</td>
                    <td style="padding:0.9rem;">$${minSalary.toLocaleString()}/yr</td>
                    <td style="padding:0.9rem;">${actionHtml}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        html += `<h3 style="margin-bottom:0.5rem; color:var(--accent);">🌍 Contracted Targets (Buyout Required)</h3>`;
        if (contracted.length === 0) {
            html += `<p class="text-muted">No contracted fighters available for buyout.</p>`;
        } else {
            html += `<table style="width:100%; border-collapse:collapse;"><thead><tr style="text-align:left; border-bottom:1px solid var(--border-glass);">
                <th style="padding:0.8rem;">Name (Club)</th><th style="padding:0.8rem;">OVR</th><th style="padding:0.8rem;">Est. Buyout</th><th style="padding:0.8rem;">Action</th>
            </tr></thead><tbody>`;
            contracted.forEach(f => {
                const ovr = Math.round((f.core_stats.power + f.core_stats.technique + f.core_stats.speed) / 3);
                const ownerClub = gs.getClub(f.club_id);
                const buyout = Math.floor(ovr * 1200);
                const statD = f.scouted ? `<strong style="color:var(--accent);">${ovr}</strong>` : `<span class="text-muted">~${ovr + Math.floor(Math.random() * 8) - 4}</span>`;
                const actionHtml = f.scouted
                    ? `<button class="btn-primary" style="padding:0.35rem 0.8rem;font-size:0.8rem;background:#e0284f;" onclick="window.UITransfers.initiatePoach('${f.id}')">Negotiate Buyout</button>`
                    : `<button class="btn-primary" style="padding:0.35rem 0.8rem;font-size:0.8rem;background:#555;" onclick="window.UITransfers.scoutFighter('${f.id}',null)">Scout (1 AP)</button>`;
                html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:0.9rem;"><strong>${f.name}</strong><br><span style="font-size:0.8rem;color:${ownerClub?.color || '#aaa'};">${ownerClub?.name || 'Unknown'}</span></td>
                    <td style="padding:0.9rem;">${statD}</td>
                    <td style="padding:0.9rem;">~$${buyout.toLocaleString()}</td>
                    <td style="padding:0.9rem;">${actionHtml}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        container.innerHTML = html;
    },

    // ─── WILLINGNESS BADGE ─────────────────────────────────────────────────────

    _willingnessBadge(level, reasons) {
        const map = {
            'wants_out': { emoji: '🔴', label: 'Wants Out', color: '#ff5252' },
            'restless': { emoji: '🟠', label: 'Restless', color: '#ff9800' },
            'neutral': { emoji: '🟡', label: 'Neutral', color: '#ffea00' },
            'settled': { emoji: '🟢', label: 'Settled', color: '#00e676' }
        };
        const d = map[level] || map['neutral'];
        const tip = reasons && reasons.length ? reasons.join(', ') : '';
        return `<span title="${tip}" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:${d.color}22;border:1px solid ${d.color};font-size:0.78rem;color:${d.color};font-weight:bold;cursor:help;">${d.emoji} ${d.label}</span>`;
    },

    // ─── BID ACTIONS ───────────────────────────────────────────────────────────

    acceptBid(bidId) {
        const gs = window.GameState;
        const bid = gs.transferInbox.find(b => b.id === bidId);
        if (!bid) return;

        const fighter = gs.getFighter(bid.fighterId);
        const buyingClub = gs.getClub(bid.biddingClubId);
        const playerClub = gs.getClub(gs.playerClubId);
        if (!fighter || !buyingClub || !playerClub) return;

        const w = window.AITransfers._computeFighterWillingness(fighter);

        // ── Check for lovers ──
        let loverConsequences = [];
        playerClub.fighter_ids.forEach(id => {
            if (id === fighter.id) return;
            const rel = fighter.dynamic_state?.relationships?.[id];
            if (rel && (rel.type === 'lovers' || rel.type === 'obsession')) {
                const partner = gs.getFighter(id);
                if (partner) {
                    partner.dynamic_state.morale = Math.max(0, (partner.dynamic_state.morale || 50) - 30);
                    partner.dynamic_state.stress = Math.min(100, (partner.dynamic_state.stress || 0) + 30);
                    // Update relationship to 'longing'
                    if (partner.dynamic_state.relationships)
                        partner.dynamic_state.relationships[fighter.id] = { type: 'longing', tension: 10, history: [`${fighter.name} was sold — they are separated.`] };
                    if (fighter.dynamic_state.relationships)
                        fighter.dynamic_state.relationships[id] = { type: 'longing', tension: 10, history: [`Forced apart by a transfer.`] };
                    loverConsequences.push(`💔 ${partner.name} is devastated (−30 Morale, +30 Stress)`);
                    gs.addNews('transfer', `💔 ${partner.name} is heartbroken after her lover ${fighter.name} was sold to ${buyingClub.name}.`);
                }
            }
        });

        // ── Squad morale impact ──
        let squadNote = '';
        if (w.level === 'settled') {
            playerClub.fighter_ids.filter(id => id !== fighter.id).forEach(id => {
                const m = gs.getFighter(id);
                if (m) m.dynamic_state.morale = Math.max(0, (m.dynamic_state.morale || 50) - 10);
            });
            squadNote = 'Squad morale −10 (settled player sold against her wishes).';
        } else if (w.level === 'wants_out') {
            playerClub.fighter_ids.filter(id => id !== fighter.id).forEach(id => {
                const m = gs.getFighter(id);
                if (m) m.dynamic_state.morale = Math.min(100, (m.dynamic_state.morale || 50) + 5);
            });
            squadNote = 'Squad morale +5 (disruptive player gone).';
        }

        // ── Execute sale ──
        gs.money += bid.offerAmount;
        playerClub.fighter_ids = playerClub.fighter_ids.filter(id => id !== fighter.id);
        fighter.club_id = buyingClub.id;
        fighter.transfer_listed = false;

        const ovr = Math.round((fighter.core_stats.power + fighter.core_stats.technique + fighter.core_stats.speed) / 3);
        const newSalary = Math.floor(ovr * 150 + 10000);
        fighter.contract = { salary: newSalary, seasons_remaining: 3, win_bonus: Math.floor(newSalary * 0.1), release_clause: newSalary * 4, happiness: w.level === 'wants_out' ? 90 : 55, demand_triggered: false };
        buyingClub.fighter_ids.push(fighter.id);
        buyingClub.money = (buyingClub.money || 100000) - bid.offerAmount;

        // Clear all bids for this fighter and from transfer list
        gs.transferInbox = gs.transferInbox.filter(b => b.fighterId !== fighter.id);
        if (gs.listedForTransfer) gs.listedForTransfer = gs.listedForTransfer.filter(l => l.fighterId !== fighter.id);

        gs.addNews('transfer', `TRANSFER: ${buyingClub.name} signed ${fighter.name} from ${playerClub.name} for $${bid.offerAmount.toLocaleString()}!`);

        // ── Show consequence summary ──
        let resultMsg = `✅ <strong>${fighter.name}</strong> sold to ${buyingClub.name} for <strong style="color:#00e676;">$${bid.offerAmount.toLocaleString()}</strong>.<br><br>`;
        if (loverConsequences.length) resultMsg += loverConsequences.join('<br>') + '<br><br>';
        if (squadNote) resultMsg += `<em>${squadNote}</em>`;

        if (window.UIComponents && window.UIComponents.showModal) window.UIComponents.showModal('Transfer Complete', resultMsg, 'success');
        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('transfers', { tab: 'inbox' });
    },

    rejectBid(bidId) {
        const gs = window.GameState;
        const bid = gs.transferInbox.find(b => b.id === bidId);
        if (!bid) return;
        const f = gs.getFighter(bid.fighterId);
        const club = gs.getClub(bid.biddingClubId);
        const w = f ? window.AITransfers._computeFighterWillingness(f) : null;

        // If fighter wanted out, she gets upset at rejection
        if (f && w && w.level === 'wants_out') {
            f.dynamic_state.morale = Math.max(0, (f.dynamic_state.morale || 50) - 15);
            f.dynamic_state.stress = Math.min(100, (f.dynamic_state.stress || 0) + 10);
            gs.addNews('transfer', `${f?.name} is furious after ${club?.name}'s bid was rejected.`);
        }

        gs.transferInbox = gs.transferInbox.filter(b => b.id !== bidId);
        if (f && club) gs.addNews('transfer', `${club.name}'s bid for ${f.name} was declined.`);
        window.Router.loadRoute('transfers', { tab: 'inbox' });
    },

    counterBid(bidId) {
        const gs = window.GameState;
        const bid = gs.transferInbox.find(b => b.id === bidId);
        if (!bid) return;
        const f = gs.getFighter(bid.fighterId);
        const club = gs.getClub(bid.biddingClubId);
        if (!f || !club) return;

        const counterStr = prompt(`Counter-offer to ${club.name} for ${f.name}.\n\nTheir bid: $${bid.offerAmount.toLocaleString()}\nYour asking: $${bid.askingFee.toLocaleString()}\n\nEnter your counter-offer:`, bid.askingFee.toString());
        if (!counterStr) return;
        const counter = parseInt(counterStr.replace(/,/g, ''));
        if (isNaN(counter) || counter <= 0) { alert('Invalid amount.'); return; }

        // AI accepts if counter is within 15% of their original bid; else they walk
        const aiMax = Math.floor(bid.offerAmount * 1.15);
        if (counter <= aiMax) {
            bid.offerAmount = counter;
            bid.askingFee = counter;
            gs.addNews('transfer', `${club.name} accepted the counter-offer of $${counter.toLocaleString()} for ${f.name}.`);
            alert(`${club.name} accepted your counter-offer of $${counter.toLocaleString()}! Review and Accept in the Inbox.`);
        } else {
            gs.transferInbox = gs.transferInbox.filter(b => b.id !== bidId);
            gs.addNews('transfer', `${club.name} withdrew their bid for ${f.name} after the counter-offer was too high.`);
            alert(`${club.name} walked away from negotiations.`);
        }
        window.Router.loadRoute('transfers', { tab: 'inbox' });
    },

    // ─── DEMAND ACTIONS ────────────────────────────────────────────────────────

    listFromDemand(fighterId) {
        const gs = window.GameState;
        gs.pendingTransferDemands = (gs.pendingTransferDemands || []).filter(d => d.fighterId !== fighterId);
        this.listForTransfer(fighterId);
    },

    rejectDemand(fighterId) {
        const gs = window.GameState;
        const f = gs.getFighter(fighterId);
        if (!f) return;
        f.dynamic_state.morale = Math.max(0, (f.dynamic_state.morale || 50) - 15);
        f.dynamic_state.stress = Math.min(100, (f.dynamic_state.stress || 0) + 10);
        gs.pendingTransferDemands = (gs.pendingTransferDemands || []).filter(d => d.fighterId !== fighterId);
        gs.addNews('transfer', `${f.name}'s transfer request was rejected. She'll be sulking.`);
        window.Router.loadRoute('transfers', { tab: 'inbox' });
    },

    // ─── LIST / RELEASE ────────────────────────────────────────────────────────

    listForTransfer(fighterId) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        const fighter = gs.getFighter(fighterId);
        if (!fighter || !fighter.contract) { alert('Invalid fighter data.'); return; }
        if (club.fighter_ids.length <= 1) { alert('Cannot list your last fighter!'); return; }

        const ovr = Math.round((fighter.core_stats.power + fighter.core_stats.technique + fighter.core_stats.speed) / 3);
        const estFee = Math.floor(ovr * 800 * (fighter.tier || 1));

        const w = window.AITransfers._computeFighterWillingness(fighter);
        let warnMsg = '';
        if (w.level === 'settled') warnMsg = `\n⚠️ WARNING: ${fighter.name} is settled here (${w.reasons.join(', ')}). Listing her will upset her and may cause team drama.`;

        if (!confirm(`List ${fighter.name} for transfer?\nEst. asking fee: ~$${estFee.toLocaleString()}${warnMsg}\n\nAI clubs will review and bid. Offers arrive in your Transfer Inbox.`)) return;

        if (gs.listedForTransfer && gs.listedForTransfer.find(l => l.fighterId === fighterId)) {
            alert(`${fighter.name} is already listed.`); return;
        }

        if (!gs.listedForTransfer) gs.listedForTransfer = [];
        gs.listedForTransfer.push({ fighterId, listedOnWeek: gs.week, askingFee: estFee });
        fighter.transfer_listed = true;

        // If settled, morale hit
        if (w.level === 'settled') {
            fighter.dynamic_state.morale = Math.max(0, (fighter.dynamic_state.morale || 50) - 15);
            fighter.dynamic_state.stress = Math.min(100, (fighter.dynamic_state.stress || 0) + 10);
        }

        gs.addNews('transfer', `${club.name} listed ${fighter.name} on the transfer market. Asking fee: ~$${estFee.toLocaleString()}.`);
        window.Router.loadRoute('transfers', { tab: 'roster' });
    },

    cancelListing(fighterId) {
        const gs = window.GameState;
        const fighter = gs.getFighter(fighterId);
        if (!fighter) return;
        gs.listedForTransfer = (gs.listedForTransfer || []).filter(l => l.fighterId !== fighterId);
        gs.transferInbox = (gs.transferInbox || []).filter(b => b.fighterId !== fighterId);
        fighter.transfer_listed = false;
        gs.addNews('transfer', `${fighter.name} has been taken off the transfer list.`);
        window.Router.loadRoute('transfers', { tab: 'roster' });
    },

    releaseAsFreeAgent(fighterId) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        const fighter = gs.getFighter(fighterId);
        if (!fighter || club.fighter_ids.length <= 1) { alert('Cannot release your last fighter!'); return; }

        const remainingSeasons = fighter.contract ? (fighter.contract.seasons_remaining || 1) : 1;
        const yearlyWage = fighter.contract ? fighter.contract.salary : 0;
        const severance = yearlyWage * remainingSeasons;

        if (!confirm(`Release ${fighter.name} as Free Agent?\nSeverance: $${severance.toLocaleString()} (${remainingSeasons} season(s) remaining)\n\nShe will enter free agency — AI clubs will compete for her.`)) return;
        if (gs.money < severance) { alert(`Insufficient funds. Need $${severance.toLocaleString()}.`); return; }

        gs.money -= severance;
        club.fighter_ids = club.fighter_ids.filter(id => id !== fighterId);
        fighter.club_id = null;
        fighter.transfer_listed = false;
        gs.listedForTransfer = (gs.listedForTransfer || []).filter(l => l.fighterId !== fighterId);
        gs.transferInbox = (gs.transferInbox || []).filter(b => b.fighterId !== fighterId);

        if (fighter.contract) {
            fighter.contract.seasons_remaining = 3;
            fighter.contract.happiness = 60;
            fighter.contract.demand_triggered = false;
            fighter.contract.salary = 0;
        }
        fighter.releasedByPlayerClub = true;
        gs.transferPool.push(fighter);
        gs.addNews('transfer', `${club.name} released ${fighter.name}. Severance: $${severance.toLocaleString()}.`);
        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('transfers', { tab: 'roster' });
    },

    // ─── BOSMAN ────────────────────────────────────────────────────────────────

    initiateBosman(targetId) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (club.fighter_ids.length >= 8) { alert('Roster full — release someone first.'); return; }

        const fighter = gs.getFighter(targetId);
        if (!fighter) return;
        const ovr = Math.round((fighter.core_stats.power + fighter.core_stats.technique + fighter.core_stats.speed) / 3);
        const ownerClub = gs.getClub(fighter.club_id);
        let minSalary = Math.floor(ovr * 180 + 10000);

        let leverageMod = 1.0;
        if (gs.activeTransferLeverage && gs.activeTransferLeverage.targetFighter === fighter.id) {
            leverageMod = 0.8;
        }
        minSalary = Math.floor(minSalary * leverageMod);

        const offerStr = prompt(`BOSMAN SIGNING: ${fighter.name} from ${ownerClub?.name || 'Unknown'}\nNo transfer fee — salary only.\nMinimum: ~$${minSalary.toLocaleString()}/yr\n\nEnter your yearly salary offer:`, minSalary.toString());
        if (!offerStr) return;
        const offer = parseInt(offerStr.replace(/,/g, ''));
        if (isNaN(offer) || offer <= 0) { alert('Invalid offer.'); return; }
        if (offer < minSalary) { alert(`${fighter.name} rejected. She needs at least $${minSalary.toLocaleString()}/yr.`); return; }

        const aiOffer = minSalary + Math.floor(Math.random() * 8000);
        if (offer < aiOffer && Math.random() < 0.5) {
            alert(`${fighter.name} chose a better offer elsewhere.`);
            gs.addNews('transfer', `${fighter.name} rejected a Bosman offer from ${club.name}.`);
            return;
        }

        if (!gs.pendingBosmanMoves) gs.pendingBosmanMoves = [];
        gs.pendingBosmanMoves.push({ fighterId: fighter.id, fromClubId: fighter.club_id, salary: offer, agreementWeek: gs.week, agreementSeason: gs.season });
        if (gs.activeTransferLeverage?.targetFighter === fighter.id) gs.activeTransferLeverage = null;

        alert(`Pre-contract signed! ${fighter.name} joins ${club.name} next season for $${offer.toLocaleString()}/yr.`);
        gs.addNews('transfer', `${club.name} pre-signed ${fighter.name} (Bosman) for $${offer.toLocaleString()}/yr.`);
        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('transfers', { tab: 'scout' });
    },

    executeBosmanMoves() {
        const gs = window.GameState;
        if (!gs.pendingBosmanMoves || gs.pendingBosmanMoves.length === 0) return;
        let executed = [];
        gs.pendingBosmanMoves.forEach(move => {
            const fighter = gs.getFighter(move.fighterId);
            const toClubId = move.toClubId || gs.playerClubId;
            const destClub = gs.getClub(toClubId);
            if (!fighter || !destClub) { executed.push(move); return; }
            const oldClub = gs.getClub(move.fromClubId);
            if (oldClub && oldClub.fighter_ids) oldClub.fighter_ids = oldClub.fighter_ids.filter(id => id !== move.fighterId);
            fighter.club_id = toClubId;
            fighter.contract = { salary: move.salary, seasons_remaining: 3, new_this_tick: true, win_bonus: Math.floor(move.salary * 0.1), release_clause: move.salary * 4, happiness: 90, demand_triggered: false };
            fighter.releasedByPlayerClub = false;
            if (!destClub.fighter_ids.includes(fighter.id)) destClub.fighter_ids.push(fighter.id);
            gs.addNews('transfer', `${fighter.name} officially joins ${destClub.name} (Bosman) for $${move.salary.toLocaleString()}/yr.`);
            executed.push(move);
        });
        gs.pendingBosmanMoves = gs.pendingBosmanMoves.filter(m => !executed.includes(m));
    },

    // ─── POACH / BUYOUT ────────────────────────────────────────────────────────

    initiatePoach(targetId) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (club.fighter_ids.length >= 8) { alert('Roster is full!'); return; }
        const fighter = gs.getFighter(targetId);
        if (!fighter) return;
        const ownerClub = gs.getClub(fighter.club_id);
        const ovr = (fighter.core_stats.power + fighter.core_stats.technique + fighter.core_stats.speed) / 3;
        let baseFee = Math.floor(ovr * 1200);

        let leverageMod = 1.0, usedLeverage = false;
        if (gs.activeTransferLeverage && gs.activeTransferLeverage.targetFighter === fighter.id) {
            leverageMod = 0.6; usedLeverage = true;
        }

        const highestOvr = Math.max(0, ...(ownerClub?.fighter_ids || []).map(id => { const f = gs.getFighter(id); return f ? (f.core_stats.power + f.core_stats.technique + f.core_stats.speed) / 3 : 0; }));
        if (!usedLeverage && ovr >= highestOvr && Math.random() > 0.5) {
            baseFee *= 2.5;
        }

        const finalFee = Math.floor(baseFee * leverageMod);
        if (!confirm(`${ownerClub?.name || 'Club'} demands $${finalFee.toLocaleString()} to release ${fighter.name}.\nProceed to salary negotiation?`)) {
            if (usedLeverage) { const ins = gs.getFighter(gs.activeTransferLeverage?.sourceFighter); if (ins) ins.dynamic_state.morale = Math.max(0, ins.dynamic_state.morale - 30); gs.activeTransferLeverage = null; }
            return;
        }
        if (gs.money < finalFee) { alert(`Insufficient funds. Need $${finalFee.toLocaleString()}.`); return; }

        gs.money -= finalFee;
        if (ownerClub) { ownerClub.money = (ownerClub.money || 100000) + finalFee; ownerClub.fighter_ids = ownerClub.fighter_ids.filter(id => id !== fighter.id); }
        if (usedLeverage) gs.activeTransferLeverage = null;

        const salMin = Math.floor(15000 + ovr * 70);
        const offerStr = prompt(`Transfer fee paid! ${fighter.name} is ready to sign.\nMinimum salary: ~$${salMin.toLocaleString()}/yr\nEnter yearly salary:`, salMin.toString());
        const offer = parseInt((offerStr || '0').replace(/,/g, ''));

        if (offer >= salMin) {
            fighter.contract = { salary: offer, seasons_remaining: 3, win_bonus: Math.floor(offer * 0.1), release_clause: offer * 4, happiness: 85, demand_triggered: false };
            fighter.club_id = club.id;
            club.fighter_ids.push(fighter.id);
            gs.addNews('transfer', `BLOCKBUSTER: ${club.name} activated the $${finalFee.toLocaleString()} buyout for ${fighter.name}!`);
        } else {
            fighter.club_id = null; fighter.contract = null;
            gs.transferPool.push(fighter);
            gs.addNews('transfer', `${club.name} bought out ${fighter.name} but salary talks collapsed. She's a Free Agent.`);
        }

        this._rebuildGlobalTargetsCache();
        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('transfers', { tab: 'scout' });
    },

    // ─── FREE AGENT BID ────────────────────────────────────────────────────────

    initiateBid(idx) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (club.fighter_ids.length >= 8) { alert('Roster is full! Release someone first.'); return; }

        const fighter = gs.transferPool[idx];
        if (!fighter) return;

        const cs = fighter.core_stats;
        const ovr = (cs.power + cs.technique + cs.speed) / 3;
        let baseReq = 12000 + (cs.power + cs.technique) * 50;
        if (fighter.releasedByPlayerClub) baseReq = Math.max(baseReq, Math.floor(ovr * 200 + 15000));
        if (fighter.personality?.archetype === 'Showboat') baseReq += 5000;
        if (fighter.traits?.includes('academy_product')) baseReq -= 3000;

        const offerStr = prompt(`Making Offer to ${fighter.name}.\nEst. market rate: ~$${baseReq.toLocaleString()}/yr\nEnter yearly salary:`, baseReq.toString());
        if (!offerStr) return;
        const offer = parseInt(offerStr.replace(/,/g, ''));
        if (isNaN(offer) || offer <= 0) { alert('Invalid offer.'); return; }

        const aiCounter = baseReq + (Math.floor(Math.random() * 8000) - 2000) + (fighter.releasedByPlayerClub ? Math.floor(Math.random() * 6000) : 0);

        if (offer >= aiCounter) {
            gs.money -= offer;
            fighter.contract = { salary: offer, seasons_remaining: 3, win_bonus: Math.floor(offer * 0.1), release_clause: offer * 3, happiness: 80, demand_triggered: false };
            fighter.club_id = club.id;
            fighter.releasedByPlayerClub = false;
            gs.fighters[fighter.id] = fighter;
            club.fighter_ids.push(fighter.id);
            gs.transferPool.splice(idx, 1);
            gs.addNews('transfer', `${club.name} signed ${fighter.name} for $${offer.toLocaleString()}/yr!`);
            alert(`Bid Accepted! ${fighter.name} joins ${club.name} for $${offer.toLocaleString()}/yr!`);
        } else {
            gs.transferPool.splice(idx, 1);
            gs.addNews('transfer', `${fighter.name} snubbed ${club.name} to sign elsewhere.`);
            alert(`Bid Rejected! ${fighter.name} accepted a competing offer of $${aiCounter.toLocaleString()}/yr.`);
        }

        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('transfers', { tab: 'free' });
    },

    // ─── SCOUTING ──────────────────────────────────────────────────────────────

    scoutFighter(targetId, poolIdx) {
        const gs = window.GameState;
        if (gs.actionPoints < 1) { alert('Not enough Action Points.'); return; }
        gs.actionPoints--;
        if (targetId) { const f = gs.getFighter(targetId); if (f) f.scouted = true; }
        else if (poolIdx !== null && poolIdx !== undefined) { if (gs.transferPool[poolIdx]) gs.transferPool[poolIdx].scouted = true; }
        gs._globalTargetsCache = null;
        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('transfers', { tab: targetId ? 'scout' : 'free' });
    },

    // ─── HELPERS ───────────────────────────────────────────────────────────────

    _getBosmanTargets() {
        const gs = window.GameState;
        return Object.values(gs.fighters).filter(f =>
            f.club_id && f.club_id !== gs.playerClubId && !f.retired &&
            f.contract && f.contract.seasons_remaining === 1 && !f.contract.renewed_this_offseason
        ).sort((a, b) => (b.core_stats.power + b.core_stats.technique + b.core_stats.speed) - (a.core_stats.power + a.core_stats.technique + a.core_stats.speed));
    },

    _rebuildGlobalTargetsCache() {
        const gs = window.GameState;
        gs._globalTargetsCache = Object.values(gs.fighters).filter(f => f.club_id && f.club_id !== gs.playerClubId && !f.retired);
        gs._globalTargetsCache.sort((a, b) => (b.core_stats.power + b.core_stats.technique + b.core_stats.speed) - (a.core_stats.power + a.core_stats.technique + a.core_stats.speed));
    },

    // Legacy shim — called by old code paths
    processListedTransfers() {
        // Bids are now generated by AITransfers._generateInboxBids() each week.
        // This shim exists so any old references don't crash.
        this._rebuildGlobalTargetsCache();
    }
};