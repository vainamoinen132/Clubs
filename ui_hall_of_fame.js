/**
 * ui_hall_of_fame.js
 * Hall of Fame — all-time fighter records across seasons.
 * Shows active and retired fighters with career stats, titles, and accolades.
 */

window.UIHallOfFame = {
    // Filter state
    _showActiveOnly: false,
    _sortKey: 'score',
    _sortDir: 'desc',

    render(container) {
        const gs = window.GameState;

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Hall of Fame', 'The all-time record of every fighter. Click any name to view details or make a transfer offer.')}

            <!-- Controls Bar -->
            <div class="glass-panel" style="padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap;">
                    <!-- Active only toggle -->
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; color: var(--text-muted); user-select: none;">
                        <input type="checkbox" id="hof-active-only" ${this._showActiveOnly ? 'checked' : ''}
                            style="width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer;"
                            onchange="window.UIHallOfFame._toggleActiveFilter(this.checked)">
                        <span>Active fighters only</span>
                    </label>

                    <!-- Sort selector -->
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                        <span>Sort by:</span>
                        <select id="hof-sort" onchange="window.UIHallOfFame._changeSort(this.value)"
                            style="background: rgba(255,255,255,0.07); border: 1px solid var(--border-glass); color: var(--text-main); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;">
                            <option value="score"      ${this._sortKey === 'score' ? 'selected' : ''}>🏅 HoF Score (Composite)</option>
                            <option value="wins"       ${this._sortKey === 'wins' ? 'selected' : ''}>Wins</option>
                            <option value="winrate"    ${this._sortKey === 'winrate' ? 'selected' : ''}>Win Rate</option>
                            <option value="ovr"        ${this._sortKey === 'ovr' ? 'selected' : ''}>Overall Rating</option>
                            <option value="titles"     ${this._sortKey === 'titles' ? 'selected' : ''}>Titles</option>
                            <option value="streak"     ${this._sortKey === 'streak' ? 'selected' : ''}>Best Streak</option>
                            <option value="age"        ${this._sortKey === 'age' ? 'selected' : ''}>Age</option>
                            <option value="name"       ${this._sortKey === 'name' ? 'selected' : ''}>Name</option>
                        </select>
                    </div>
                </div>

                <!-- Legend -->
                <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap;">
                    <span>🏆 Season Champion</span>
                    <span>⚡ Active</span>
                    <span>🕊 Retired</span>
                    <span style="color: rgba(255,255,255,0.35);">· Click any row to view &amp; bid</span>
                </div>
            </div>

            <!-- Podium — Top 3 All-Time -->
            <div id="hof-podium" style="margin-bottom: 2rem;"></div>

            <!-- Full Table -->
            <div class="glass-panel" style="padding: 0; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;" id="hof-table">
                    <thead>
                        <tr style="background: rgba(0,0,0,0.4); border-bottom: 2px solid var(--border-glass);">
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Rank</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Fighter</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">Score</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">OVR</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">W</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">L</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">Win%</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">Streak</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; text-align:center;">Titles</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Best Style</th>
                            <th style="padding: 0.9rem 1rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Status</th>
                        </tr>
                    </thead>
                    <tbody id="hof-tbody"></tbody>
                </table>
            </div>

            <!-- Career Summary Stats at bottom -->
            <div id="hof-summary" style="margin-top: 2rem;"></div>
        `;

        this._buildContent();
    },

    _toggleActiveFilter(checked) {
        this._showActiveOnly = checked;
        this._buildContent();
    },

    _changeSort(key) {
        if (this._sortKey === key) {
            this._sortDir = this._sortDir === 'desc' ? 'asc' : 'desc';
        } else {
            this._sortKey = key;
            this._sortDir = key === 'name' ? 'asc' : 'desc';
        }
        this._buildContent();
    },

    _getAllFighters() {
        const gs = window.GameState;
        let all = Object.values(gs.fighters);

        if (this._showActiveOnly) {
            all = all.filter(f => !f.retired);
        }

        return all;
    },

    _getFighterStats(f) {
        const cs = f.core_stats;
        const ds = f.dynamic_state || {};
        const wins = ds.wins || 0;
        const losses = ds.losses || 0;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        const ovr = Math.round((cs.power + cs.technique + cs.speed) / 3);
        const streak = ds.win_streak || 0;
        const titles = ds.season_titles || 0;

        // Best style by affinity
        const affinities = f.style_affinities || {};
        const bestStyle = Object.entries(affinities).reduce((a, b) => b[1] > a[1] ? b : a, ['boxing', 0]);
        const styleLabel = {
            boxing: '🥊 Boxing',
            naked_wrestling: '🤼 Wrestling',
            catfight: '🐈 Catfight',
            sexfight: '💋 Sexfight'
        }[bestStyle[0]] || bestStyle[0];

        // Bayesian-adjusted win rate: shrinks toward 50% when few matches played.
        // k=5 prior weight — converges to real win rate after ~10+ matches.
        const K = 5;
        const adjWinRate = total > 0 ? ((wins + K * 0.5) / (total + K)) * 100 : 50;

        // Composite HoF score — fair across career lengths:
        //   Titles worth most (25 pts), wins 1.5 pts, adjusted win rate,
        //   small OVR bonus, streak bonus.
        const score = Math.round(
            adjWinRate * 0.30 +
            wins * 1.50 +
            titles * 25 +
            ovr * 0.20 +
            streak * 3
        );

        return { wins, losses, total, winRate, adjWinRate, ovr, streak, titles, score, styleLabel };
    },

    _sortFighters(fighters) {
        const dir = this._sortDir === 'desc' ? -1 : 1;
        return fighters.slice().sort((a, b) => {
            const sa = this._getFighterStats(a);
            const sb = this._getFighterStats(b);
            let va, vb;
            switch (this._sortKey) {
                case 'score': va = sa.score; vb = sb.score; break;
                case 'wins': va = sa.wins; vb = sb.wins; break;
                case 'winrate': va = sa.adjWinRate; vb = sb.adjWinRate; break;
                case 'ovr': va = sa.ovr; vb = sb.ovr; break;
                case 'titles': va = sa.titles; vb = sb.titles; break;
                case 'streak': va = sa.streak; vb = sb.streak; break;
                case 'age': va = a.age || a.dynamic_state?.age || 25;
                    vb = b.age || b.dynamic_state?.age || 25; break;
                case 'name': return dir * a.name.localeCompare(b.name);
                default: va = sa.score; vb = sb.score; break;
            }
            return dir * (va - vb);
        });
    },

    _buildContent() {
        const gs = window.GameState;
        const fighters = this._sortFighters(this._getAllFighters());

        // ── PODIUM ────────────────────────────────────────────────────────────
        const podiumEl = document.getElementById('hof-podium');
        // Podium always shows top 3 by composite score, regardless of current sort
        const byScore = this._getAllFighters().slice().sort(
            (a, b) => this._getFighterStats(b).score - this._getFighterStats(a).score
        );
        const top3 = byScore.slice(0, 3);

        if (top3.length === 0) {
            podiumEl.innerHTML = '';
        } else {
            const podiumOrder = top3.length >= 3
                ? [top3[1], top3[0], top3[2]]  // 2nd, 1st, 3rd for visual podium layout
                : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];

            const heights = top3.length >= 3 ? [110, 140, 90] : top3.length === 2 ? [110, 140] : [140];
            const medals = top3.length >= 3 ? ['🥈', '🥇', '🥉'] : top3.length === 2 ? ['🥈', '🥇'] : ['🥇'];
            const rankNums = top3.length >= 3 ? [2, 1, 3] : top3.length === 2 ? [2, 1] : [1];

            let podiumHtml = `
                <div style="display: flex; justify-content: center; align-items: flex-end; gap: 1rem; margin-bottom: 0.5rem;">
            `;

            podiumOrder.forEach((f, i) => {
                if (!f) return;
                const st = this._getFighterStats(f);
                const club = f.club_id ? gs.getClub(f.club_id) : null;
                const clubColor = club ? club.color : '#666';
                const isChamp = st.titles > 0;
                const isRetired = f.retired;

                podiumHtml += `
                    <div style="text-align: center; flex: 0 0 auto; width: 160px; cursor: pointer;"
                         onclick="window.UIHallOfFame.openFighterDetail('${f.id}')">
                        <!-- Fighter card -->
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid ${clubColor}44; border-radius: 12px; padding: 1rem 0.8rem; margin-bottom: 0; position: relative; transition: border-color 0.15s;"
                             onmouseover="this.style.borderColor='${clubColor}bb'" onmouseout="this.style.borderColor='${clubColor}44'">
                            ${isChamp ? `<div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); font-size: 1.2rem;">🏆</div>` : ''}
                            <div style="font-size: 2rem; margin-bottom: 0.3rem;">${medals[i]}</div>
                            <div style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 0.2rem;">${f.name}</div>
                            <div style="font-size: 0.75rem; color: ${clubColor}; margin-bottom: 0.5rem;">${club ? club.name : (isRetired ? 'Retired' : 'Free Agent')}</div>
                            <div style="display: flex; justify-content: center; gap: 0.8rem; font-size: 0.8rem;">
                                <div>
                                    <div style="color: var(--text-muted); font-size: 0.7rem;">Score</div>
                                    <div style="color: #d4af37; font-weight: 700;">${st.score}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 0.7rem;">W-L</div>
                                    <div style="color: #fff; font-weight: 700;">${st.wins}-${st.losses}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-muted); font-size: 0.7rem;">OVR</div>
                                    <div style="color: var(--accent); font-weight: 700;">${st.ovr}</div>
                                </div>
                            </div>
                            ${st.titles > 0 ? `<div style="margin-top: 0.5rem; font-size: 0.75rem; color: #d4af37;">🏆 ${st.titles} Title${st.titles > 1 ? 's' : ''}</div>` : ''}
                        </div>
                        <!-- Podium block -->
                        <div style="
                            height: ${heights[i]}px;
                            background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
                            border: 1px solid var(--border-glass);
                            border-top: 3px solid ${medals[i] === '🥇' ? '#d4af37' : medals[i] === '🥈' ? '#aaa' : '#cd7f32'};
                            border-radius: 0 0 8px 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.4rem;
                            font-weight: 800;
                            color: ${medals[i] === '🥇' ? '#d4af37' : medals[i] === '🥈' ? '#aaa' : '#cd7f32'};
                        ">#${rankNums[i]}</div>
                    </div>
                `;
            });

            podiumHtml += `</div>`;
            podiumEl.innerHTML = podiumHtml;
        }

        // ── TABLE ─────────────────────────────────────────────────────────────
        const tbody = document.getElementById('hof-tbody');
        if (!tbody) return;

        if (fighters.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="10" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    No fighters found.
                </td></tr>`;
            return;
        }

        let html = '';
        fighters.forEach((f, idx) => {
            const st = this._getFighterStats(f);
            const club = f.club_id ? gs.getClub(f.club_id) : null;
            const clubColor = club ? club.color : '#555';
            const isRetired = f.retired;
            const isPlayer = f.club_id === gs.playerClubId;
            const rowBg = isPlayer
                ? 'background: rgba(255,51,102,0.06);'
                : idx % 2 === 0 ? '' : 'background: rgba(255,255,255,0.02);';

            const statusBadge = isRetired
                ? `<span style="background: rgba(255,255,255,0.1); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">🕊 Retired</span>`
                : f.club_id
                    ? `<span style="background: rgba(0,230,118,0.15); color: #00e676; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">⚡ Active</span>`
                    : `<span style="background: rgba(255,255,255,0.08); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Free Agent</span>`;

            const rankBadge = idx === 0
                ? `<span style="color: #d4af37; font-weight: 800;">🥇 1</span>`
                : idx === 1
                    ? `<span style="color: #aaa; font-weight: 800;">🥈 2</span>`
                    : idx === 2
                        ? `<span style="color: #cd7f32; font-weight: 800;">🥉 3</span>`
                        : `<span style="color: var(--text-muted);">${idx + 1}</span>`;

            const winRateColor = st.winRate >= 70 ? '#00e676' : st.winRate >= 50 ? '#fff' : '#ff5252';
            const titleStr = st.titles > 0
                ? `<span style="color: #d4af37;">🏆 ${st.titles}</span>`
                : `<span style="color: var(--text-muted);">—</span>`;

            const age = f.age || f.dynamic_state?.age || '?';
            const archetype = f.personality?.archetype || '?';

            // Show (few) warning when win rate is based on less than 3 matches
            const wrDisplay = st.total < 3
                ? `<span style="color:var(--text-muted);">${st.winRate}% <span style="font-size:0.72rem;">(few)</span></span>`
                : `<span style="color:${winRateColor}; font-weight:700;">${st.winRate}%</span>`;

            html += `
                <tr style="border-bottom: 1px solid var(--border-glass); ${rowBg} transition: background 0.15s; cursor: pointer;"
                    onmouseover="this.style.background='rgba(255,255,255,0.06)'"
                    onmouseout="this.style.background='${isPlayer ? 'rgba(255,51,102,0.06)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}'"
                    onclick="window.UIHallOfFame.openFighterDetail('${f.id}')">
                    <td style="padding: 0.9rem 1rem;">${rankBadge}</td>
                    <td style="padding: 0.9rem 1rem;">
                        <div style="font-weight: 600; color: #fff;">${f.name}</div>
                        <div style="font-size: 0.75rem; color: ${clubColor}; margin-top: 1px;">
                            ${club ? club.name : (isRetired ? 'Retired' : 'Free Agent')} · ${archetype} · Age ${age}
                        </div>
                    </td>
                    <td style="padding: 0.9rem 1rem; text-align: center; color: #d4af37; font-weight: 700;">${st.score}</td>
                    <td style="padding: 0.9rem 1rem; text-align: center;">
                        <strong style="color: var(--accent);">${st.ovr}</strong>
                    </td>
                    <td style="padding: 0.9rem 1rem; text-align: center; color: #00e676; font-weight: 700;">${st.wins}</td>
                    <td style="padding: 0.9rem 1rem; text-align: center; color: #ff5252;">${st.losses}</td>
                    <td style="padding: 0.9rem 1rem; text-align: center;">${wrDisplay}</td>
                    <td style="padding: 0.9rem 1rem; text-align: center; color: var(--text-muted);">${st.streak > 0 ? `<span style="color:#d4af37;">🔥${st.streak}</span>` : '—'}</td>
                    <td style="padding: 0.9rem 1rem; text-align: center;">${titleStr}</td>
                    <td style="padding: 0.9rem 1rem; font-size: 0.85rem; color: var(--text-muted);">${st.styleLabel}</td>
                    <td style="padding: 0.9rem 1rem;">${statusBadge}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // ── SUMMARY CARDS ─────────────────────────────────────────────────────
        this._buildSummary(fighters);
    },

    // ── FIGHTER DETAIL MODAL ──────────────────────────────────────────────────

    openFighterDetail(fighterId) {
        const gs = window.GameState;
        const f = gs.getFighter(fighterId);
        if (!f) return;

        const st = this._getFighterStats(f);
        const club = f.club_id ? gs.getClub(f.club_id) : null;
        const isRetired = !!f.retired;
        const isOwn = f.club_id === gs.playerClubId;
        const isFA = !f.club_id && !isRetired;
        const cc = club ? club.color : '#666';
        const scouted = !!f.scouted;

        // Stat row — values hidden until scouted
        const statRow = (label, val, col) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.32rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:0.82rem;color:var(--text-muted);">${label}</span>
                <span style="font-weight:700;color:${scouted ? col : 'var(--text-muted)'};">${scouted ? val : '???'}</span>
            </div>`;

        // Style affinity bars — hidden until scouted
        const styleNames = { boxing: '🥊 Boxing', naked_wrestling: '🤼 Wrestling', catfight: '🐈 Catfight', sexfight: '💋 Sexfight' };
        let affinityHtml = '';
        if (scouted && f.style_affinities) {
            affinityHtml = Object.entries(f.style_affinities).map(([k, v]) => `
                <div style="margin-bottom:0.5rem;">
                    <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-muted);margin-bottom:2px;">
                        <span>${styleNames[k] || k}</span><span>${v}</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:5px;">
                        <div style="width:${v}%;height:100%;background:var(--accent);border-radius:4px;"></div>
                    </div>
                </div>`).join('');
        } else {
            affinityHtml = `<div style="color:var(--text-muted);font-size:0.82rem;font-style:italic;">Scout this fighter to reveal style affinities.</div>`;
        }

        // Contract badge
        let contractHtml = '';
        if (!isOwn && !isRetired && f.contract) {
            const sl = f.contract.seasons_remaining;
            const bosm = sl === 1;
            contractHtml = `
                <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.5rem 0.8rem;font-size:0.82rem;color:var(--text-muted);margin-bottom:0.8rem;">
                    Contract: <strong style="color:#fff;">${sl} season${sl !== 1 ? 's' : ''} remaining</strong>
                    ${bosm ? `<span style="color:#28a0e0;margin-left:0.5rem;">🔓 Bosman eligible</span>` : ''}
                </div>`;
        }

        // Action button — gated behind scout
        let actionHtml = '';
        if (isOwn) {
            actionHtml = `<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;">This fighter is already on your roster.</div>`;
        } else if (isRetired) {
            actionHtml = `<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;">This fighter has retired from competition.</div>`;
        } else if (!scouted) {
            actionHtml = `
                <button onclick="window.UIHallOfFame.scoutFromHof('${f.id}')"
                    style="width:100%;padding:0.75rem;background:#444;border:1px solid #666;border-radius:8px;color:#fff;font-weight:700;font-size:0.9rem;cursor:pointer;">
                    🔍 Scout (1 AP) — Reveal Stats &amp; Enable Bidding
                </button>
                <div style="color:var(--text-muted);font-size:0.74rem;text-align:center;margin-top:0.4rem;">Scouting required before making any offer.</div>`;
        } else if (isFA) {
            actionHtml = `
                <button onclick="window.UIHallOfFame.bidFromHof('${f.id}', 'free')"
                    style="width:100%;padding:0.75rem;background:var(--accent);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:0.9rem;cursor:pointer;">
                    📝 Make Contract Offer — Free Agent
                </button>`;
        } else if (f.contract && f.contract.seasons_remaining === 1) {
            actionHtml = `
                <div style="background:rgba(40,160,224,0.1);border:1px solid #28a0e044;border-radius:8px;padding:0.5rem 0.8rem;margin-bottom:0.6rem;font-size:0.8rem;color:#28a0e0;">
                    🔓 Final year of contract — no transfer fee required (Bosman Rule).
                </div>
                <button onclick="window.UIHallOfFame.bidFromHof('${f.id}', 'bosman')"
                    style="width:100%;padding:0.75rem;background:#28a0e0;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:0.9rem;cursor:pointer;">
                    Pre-Sign for Next Season (Bosman)
                </button>`;
        } else {
            const estFee = Math.floor(st.ovr * 1200);
            actionHtml = `
                <div style="text-align:center;font-size:0.82rem;color:var(--text-muted);margin-bottom:0.6rem;">
                    Est. buyout fee: <strong style="color:#fff;">~$${estFee.toLocaleString()}</strong>
                </div>
                <button onclick="window.UIHallOfFame.bidFromHof('${f.id}', 'buyout')"
                    style="width:100%;padding:0.75rem;background:#e0284f;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:0.9rem;cursor:pointer;">
                    💰 Negotiate Contract Buyout
                </button>`;
        }

        // Remove any existing overlay
        const prev = document.getElementById('hof-detail-overlay');
        if (prev) prev.remove();

        const overlay = document.createElement('div');
        overlay.id = 'hof-detail-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.88);z-index:9999;display:flex;justify-content:center;align-items:center;padding:1rem;box-sizing:border-box;';
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

        overlay.innerHTML = `
            <div style="background:rgba(16,16,22,0.98);border:1px solid rgba(255,255,255,0.1);border-top:4px solid ${cc};border-radius:14px;width:100%;max-width:500px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.9);">

                <div style="padding:1.4rem 1.4rem 1rem;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <h2 style="margin:0;font-family:'Outfit',sans-serif;color:#fff;font-size:1.5rem;">${f.name}</h2>
                        <div style="font-size:0.82rem;color:${cc};margin-top:0.3rem;">
                            ${club ? club.name : (isRetired ? 'Retired' : 'Free Agent')} &nbsp;·&nbsp; ${f.personality?.archetype || '?'} &nbsp;·&nbsp; Age ${f.age || f.dynamic_state?.age || '?'} &nbsp;·&nbsp; ${st.styleLabel}
                        </div>
                    </div>
                    <button onclick="document.getElementById('hof-detail-overlay').remove()"
                        style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;width:30px;height:30px;border-radius:50%;font-size:1rem;cursor:pointer;flex-shrink:0;line-height:1;">✕</button>
                </div>

                <!-- Career stats — always visible -->
                <div style="padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.8rem;">Career Record</div>
                    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.4rem;text-align:center;">
                        <div style="background:rgba(255,255,255,0.04);border-radius:7px;padding:0.6rem 0.2rem;">
                            <div style="font-size:1.1rem;font-weight:800;color:#d4af37;">${st.score}</div>
                            <div style="font-size:0.64rem;color:var(--text-muted);">Score</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.04);border-radius:7px;padding:0.6rem 0.2rem;">
                            <div style="font-size:1.1rem;font-weight:800;color:#00e676;">${st.wins}</div>
                            <div style="font-size:0.64rem;color:var(--text-muted);">Wins</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.04);border-radius:7px;padding:0.6rem 0.2rem;">
                            <div style="font-size:1.1rem;font-weight:800;color:#ff5252;">${st.losses}</div>
                            <div style="font-size:0.64rem;color:var(--text-muted);">Losses</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.04);border-radius:7px;padding:0.6rem 0.2rem;">
                            <div style="font-size:1.1rem;font-weight:800;color:#fff;">${st.winRate}%</div>
                            <div style="font-size:0.64rem;color:var(--text-muted);">Win%</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.04);border-radius:7px;padding:0.6rem 0.2rem;">
                            <div style="font-size:1.1rem;font-weight:800;color:#d4af37;">${st.titles > 0 ? '🏆' + st.titles : '—'}</div>
                            <div style="font-size:0.64rem;color:var(--text-muted);">Titles</div>
                        </div>
                    </div>
                </div>

                <!-- Combat stats — hidden until scouted -->
                <div style="padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.7rem;">
                        Combat Stats
                        ${!scouted
                ? '<span style="color:#ffab00;font-size:0.65rem;margin-left:0.4rem;">(Scout to reveal)</span>'
                : `<span style="color:var(--accent);font-size:0.65rem;margin-left:0.4rem;">OVR ${st.ovr}</span>`}
                        <span style="float:right; font-size:0.65rem; color:var(--text-muted);">Potential:
                            ${scouted
                ? this._renderPotentialStars(f.potential || f.natural_ceiling || 80)
                : '<span style="color:var(--text-muted); letter-spacing:2px;">?????</span>'
            }
                        </span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem;">
                        ${statRow('Power', f.core_stats.power, '#e0284f')}
                        ${statRow('Technique', f.core_stats.technique, '#28a0e0')}
                        ${statRow('Speed', f.core_stats.speed, '#00e676')}
                        ${statRow('Control', f.core_stats.control, '#ab47bc')}
                        ${statRow('Endurance', f.core_stats.endurance, '#ffa726')}
                        ${statRow('Resilience', f.core_stats.resilience, '#ef5350')}
                        ${statRow('Composure', f.core_stats.composure, '#42a5f5')}
                        ${statRow('Aggression', f.core_stats.aggression, '#ff7043')}
                    </div>
                </div>

                <!-- Style affinities -->
                <div style="padding:1.1rem 1.4rem;border-bottom:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.7rem;">Style Affinities</div>
                    ${affinityHtml}
                </div>

                <!-- Action -->
                <div style="padding:1.1rem 1.4rem;">
                    ${contractHtml}
                    ${actionHtml}
                </div>
            </div>`;

        document.body.appendChild(overlay);
    },

    scoutFromHof(fighterId) {
        const gs = window.GameState;
        if (gs.actionPoints < 1) { alert("Not enough Action Points to scout."); return; }
        const f = gs.getFighter(fighterId);
        if (!f) return;
        gs.actionPoints--;
        f.scouted = true;
        gs._globalTargetsCache = null; // keep transfer market in sync
        if (typeof updateNavUI === 'function') updateNavUI();
        // Re-open modal to show revealed stats
        const prev = document.getElementById('hof-detail-overlay');
        if (prev) prev.remove();
        this.openFighterDetail(fighterId);
    },

    bidFromHof(fighterId, bidType) {
        // Close overlay then delegate to UITransfers — all bid logic lives there
        const prev = document.getElementById('hof-detail-overlay');
        if (prev) prev.remove();
        const gs = window.GameState;
        if (bidType === 'free') {
            const idx = gs.transferPool.findIndex(f => f.id === fighterId);
            if (idx === -1) { alert("This fighter is no longer in the free agent pool."); return; }
            if (window.UITransfers) window.UITransfers.initiateBid(idx);
        } else if (bidType === 'buyout') {
            if (window.UITransfers) window.UITransfers.initiatePoach(fighterId);
        } else if (bidType === 'bosman') {
            if (window.UITransfers) window.UITransfers.initiateBosman(fighterId);
        }
    },

    _renderPotentialStars(pa) {
        let stars;
        if (pa >= 90) stars = 5;
        else if (pa >= 80) stars = 4;
        else if (pa >= 70) stars = 3;
        else if (pa >= 60) stars = 2;
        else stars = 1;
        const f = '<span style="color:#d4af37;">★</span>';
        const e = '<span style="color:rgba(255,255,255,0.2);">★</span>';
        return f.repeat(stars) + e.repeat(5 - stars);
    },

    _buildSummary(fighters) {
        const summaryEl = document.getElementById('hof-summary');
        if (!summaryEl) return;

        const allFighters = this._getAllFighters(); // unfiltered for global stats
        const totalFighters = allFighters.length;
        const activeFighters = allFighters.filter(f => !f.retired && f.club_id).length;
        const retiredFighters = allFighters.filter(f => f.retired).length;
        const totalWins = allFighters.reduce((s, f) => s + (f.dynamic_state?.wins || 0), 0);
        const totalMatches = allFighters.reduce((s, f) => s + (f.dynamic_state?.wins || 0) + (f.dynamic_state?.losses || 0), 0);

        // Most decorated
        const mostTitles = allFighters.reduce((best, f) => {
            const t = f.dynamic_state?.season_titles || 0;
            return t > (best?.dynamic_state?.season_titles || 0) ? f : best;
        }, null);

        // Longest win streak
        const bestStreak = allFighters.reduce((best, f) => {
            const s = f.dynamic_state?.win_streak || 0;
            return s > (best?.dynamic_state?.win_streak || 0) ? f : best;
        }, null);

        // Most wins
        const mostWins = allFighters.reduce((best, f) => {
            const w = f.dynamic_state?.wins || 0;
            return w > (best?.dynamic_state?.wins || 0) ? f : best;
        }, null);

        summaryEl.innerHTML = `
            <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">League Records</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">

                <div class="glass-panel" style="padding: 1.2rem; text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent);">${totalFighters}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Total Fighters</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">⚡ ${activeFighters} active · 🕊 ${retiredFighters} retired</div>
                </div>

                <div class="glass-panel" style="padding: 1.2rem; text-align: center;">
                    <div style="font-size: 1.8rem; font-weight: 800; color: #00e676;">${totalMatches.toLocaleString()}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Total Matches Fought</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">across all seasons</div>
                </div>

                ${mostWins ? `
                <div class="glass-panel" style="padding: 1.2rem; text-align: center; cursor: pointer;" onclick="window.UIHallOfFame.openFighterDetail('${mostWins.id}')">
                    <div style="font-size: 1.2rem; font-weight: 800; color: #fff;">${mostWins.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">All-Time Win Leader</div>
                    <div style="font-size: 0.9rem; color: #00e676; font-weight: 700; margin-top: 0.2rem;">${mostWins.dynamic_state?.wins || 0} wins</div>
                </div>` : ''}

                ${bestStreak && (bestStreak.dynamic_state?.win_streak || 0) > 0 ? `
                <div class="glass-panel" style="padding: 1.2rem; text-align: center; cursor: pointer;" onclick="window.UIHallOfFame.openFighterDetail('${bestStreak.id}')">
                    <div style="font-size: 1.2rem; font-weight: 800; color: #fff;">${bestStreak.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Longest Active Streak</div>
                    <div style="font-size: 0.9rem; color: #d4af37; font-weight: 700; margin-top: 0.2rem;">🔥 ${bestStreak.dynamic_state?.win_streak} in a row</div>
                </div>` : ''}

                ${mostTitles && (mostTitles.dynamic_state?.season_titles || 0) > 0 ? `
                <div class="glass-panel" style="padding: 1.2rem; text-align: center; cursor: pointer;" onclick="window.UIHallOfFame.openFighterDetail('${mostTitles.id}')">
                    <div style="font-size: 1.2rem; font-weight: 800; color: #fff;">${mostTitles.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Most Season Titles</div>
                    <div style="font-size: 0.9rem; color: #d4af37; font-weight: 700; margin-top: 0.2rem;">🏆 ${mostTitles.dynamic_state?.season_titles} title${mostTitles.dynamic_state?.season_titles > 1 ? 's' : ''}</div>
                </div>` : ''}

            </div>
        `;
    }
};