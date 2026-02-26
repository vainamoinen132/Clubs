/**
 * ui_sponsors.js
 * Dedicated Sponsors page — dynamic sponsorship deals whose quality scales with
 * club fame, PR level, and season performance.
 *
 * Payment types:
 *   lump_sum    — One flat annual payment at season end
 *   per_match   — Paid per match played (win OR loss), safe floor deal
 *   win_bonus   — Paid per win only, no base — high ceiling, risky
 *   lump_bonus  — Flat annual + per-win bonus
 *   match_bonus — Per-match base + per-win bonus
 *
 * Contract duration (durationYears) is stored in club.sponsorContract:
 *   { id, signedSeason, durationYears }
 * Expiry is checked at season-end via collectSponsorPayout().
 */

window.UISponsors = {

    // ── SPONSOR CATALOGUE ─────────────────────────────────────────────────────
    _catalogue: [
        // ── BRONZE ──
        {
            id: 'local_dojo',
            name: 'Local Dojo Network',
            tier: 'bronze',
            color: '#cd7f32',
            emoji: '🥋',
            type: 'lump_sum',
            baseAmount: 36000,
            durationYears: 1,
            fameRequired: 0,
            prRequired: 1,
            desc: 'A local chain of dojos. Not glamorous, but reliable. Flat annual lump-sum — guaranteed money, no conditions.',
            tagline: 'Community roots'
        },
        {
            id: 'profight_supplements',
            name: 'ProFight Supplements',
            tier: 'bronze',
            color: '#cd7f32',
            emoji: '💊',
            type: 'per_match',
            baseAmount: 5400,
            durationYears: 1,
            fameRequired: 0,
            prRequired: 1,
            desc: 'They pay you just for fighting — win or lose. Great floor income if your club fights frequently.',
            tagline: 'Participation pays'
        },
        {
            id: 'city_sports_bar',
            name: 'City Sports Bar',
            tier: 'bronze',
            color: '#cd7f32',
            emoji: '🍺',
            type: 'win_bonus',
            baseAmount: 7500,
            durationYears: 1,
            fameRequired: 0,
            prRequired: 1,
            desc: 'Zero guaranteed money. But every win brings a solid cheque. High ceiling for hungry winning clubs.',
            tagline: 'Winners only'
        },
        {
            id: 'iron_jaw_gear',
            name: 'Iron Jaw Gear',
            tier: 'bronze',
            color: '#cd7f32',
            emoji: '🦾',
            type: 'per_match',
            baseAmount: 6300,
            durationYears: 1,
            fameRequired: 0,
            prRequired: 1,
            desc: 'A rugged low-tier protective gear brand. Reliable per-match income.',
            tagline: 'Built tough'
        },
        {
            id: 'street_king_energy',
            name: 'Street King Energy',
            tier: 'bronze',
            color: '#cd7f32',
            emoji: '⚡',
            type: 'lump_sum',
            baseAmount: 42000,
            durationYears: 1,
            fameRequired: 50,
            prRequired: 1,
            desc: 'Aggressive energy drink for up-and-coming fighters. Solid flat cash hit.',
            tagline: 'Fuel the streets'
        },
        // ── SILVER ──
        {
            id: 'underground_media',
            name: 'Underground Media Hub',
            tier: 'silver',
            color: '#aaa',
            emoji: '📹',
            type: 'lump_sum',
            baseAmount: 105000,
            durationYears: 1,
            fameRequired: 150,
            prRequired: 2,
            desc: 'A cult media outlet covering extreme sports. Solid flat annual deal — they want your name on their brand.',
            tagline: 'Cult fame'
        },
        {
            id: 'ironfist_apparel',
            name: 'IronFist Apparel',
            tier: 'silver',
            color: '#aaa',
            emoji: '👊',
            type: 'match_bonus',
            baseAmount: 6600,
            perWin: 4500,
            durationYears: 1,
            fameRequired: 200,
            prRequired: 2,
            desc: 'A combat sports clothing brand. They pay per match — plus a bonus for every win. Balanced hybrid deal.',
            tagline: 'Fight for every dollar'
        },
        {
            id: 'obsidian_luxury',
            name: 'Obsidian Luxury Brands',
            tier: 'silver',
            color: '#aaa',
            emoji: '💎',
            type: 'lump_bonus',
            baseAmount: 75000,
            perWin: 10500,
            durationYears: 2,
            fameRequired: 400,
            prRequired: 2,
            desc: 'A premium fashion house. Strong annual retainer plus serious win bonuses. 2-year deal — they want stability.',
            tagline: 'Prestige brand'
        },
        {
            id: 'combat_logistics',
            name: 'Combat Logistics',
            tier: 'silver',
            color: '#aaa',
            emoji: '🚛',
            type: 'win_bonus',
            baseAmount: 12000,
            durationYears: 1,
            fameRequired: 250,
            prRequired: 2,
            desc: 'International shipping giant wanting a tougher image. High bonuses for club victories.',
            tagline: 'Delivering pain'
        },
        {
            id: 'neon_nights_club',
            name: 'Neon Nights Club',
            tier: 'silver',
            color: '#aaa',
            emoji: '🍸',
            type: 'lump_bonus',
            baseAmount: 84000,
            perWin: 6000,
            durationYears: 2,
            fameRequired: 300,
            prRequired: 2,
            desc: 'High-end nightlife venue. Good retainer and a tidy win bonus for successful teams.',
            tagline: 'Exclusivity'
        },
        // ── GOLD ──
        {
            id: 'apex_media',
            name: 'APEX Combat Media',
            tier: 'gold',
            color: '#d4af37',
            emoji: '🌐',
            type: 'lump_sum',
            baseAmount: 300000,
            durationYears: 2,
            fameRequired: 700,
            prRequired: 3,
            desc: 'A dominant combat sports broadcaster. Massive flat payout locked for 2 years — stability at the top.',
            tagline: 'Big league'
        },
        {
            id: 'global_network',
            name: 'Global Combat Network',
            tier: 'gold',
            color: '#d4af37',
            emoji: '📡',
            type: 'per_match',
            baseAmount: 21000,
            durationYears: 2,
            fameRequired: 900,
            prRequired: 3,
            desc: 'Global broadcast deal that pays per fight card. High match-day income for active clubs.',
            tagline: 'Every fight profitable'
        },
        {
            id: 'pinnacle_nutrition',
            name: 'Pinnacle Nutrition',
            tier: 'gold',
            color: '#d4af37',
            emoji: '🏋️',
            type: 'match_bonus',
            baseAmount: 15000,
            perWin: 12000,
            durationYears: 2,
            fameRequired: 1100,
            prRequired: 4,
            desc: 'Elite sports nutrition conglomerate. Per-match baseline plus a heavy win bonus — the complete package.',
            tagline: 'Fuel to the top'
        },
        {
            id: 'vect0r_tech',
            name: 'VECT0R Tech',
            tier: 'gold',
            color: '#d4af37',
            emoji: '🤖',
            type: 'lump_bonus',
            baseAmount: 450000,
            perWin: 18000,
            durationYears: 2,
            fameRequired: 1400,
            prRequired: 4,
            desc: 'Cutting-edge tech firm riding the esports and combat sports wave. Massive annual flat fee plus a huge win bonus. The crown jewel.',
            tagline: 'High-tech, max reward'
        },
        {
            id: 'olympus_biotech',
            name: 'Olympus Biotech',
            tier: 'gold',
            color: '#d4af37',
            emoji: '🧬',
            type: 'lump_sum',
            baseAmount: 375000,
            durationYears: 2,
            fameRequired: 1000,
            prRequired: 3,
            desc: 'Pioneering health research firm. Enormous guaranteed funding for prestigious clubs.',
            tagline: 'Future strength'
        },
        {
            id: 'zenith_athletics',
            name: 'Zenith Athletics',
            tier: 'gold',
            color: '#d4af37',
            emoji: '👟',
            type: 'match_bonus',
            baseAmount: 18000,
            perWin: 15000,
            durationYears: 2,
            fameRequired: 1200,
            prRequired: 4,
            desc: 'World-renowned athletic brand. Massive payouts on every match and every win.',
            tagline: 'Peak performance'
        }
    ],

    render(container) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        const fame = gs.fame || 0;
        const prLevel = club.facilities?.pr || 1;
        const contract = club.sponsorContract || null;
        const activeSponsorId = contract ? contract.id : (club.sponsor || null);
        const wonThisSeason = this._getSeasonWins(club, gs);
        const matchesPlayed = this._getSeasonMatches(club, gs);

        // Build active-sponsor bar extra info
        let contractBadge = '';
        if (contract && activeSponsorId) {
            const sp = this._getSponsorById(activeSponsorId);
            if (sp) {
                const expiresAfter = contract.signedSeason + contract.durationYears - 1;
                const seasonsleft = expiresAfter - (gs.currentSeason || 1) + 1;
                contractBadge = `<div style="margin-left:auto; background:rgba(0,230,118,0.1); border:1px solid #00e67655; border-radius:8px; padding:0.5rem 1rem; font-size:0.9rem;">
                    ✅ Active: <strong style="color:#00e676;">${sp.name}</strong>
                    <span style="display:block; font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                        ${contract.durationYears === 2 ? '2-Year Deal' : '1-Year Deal'} · ${seasonsleft > 0 ? `${seasonsleft} season(s) remaining` : 'Expires this season'}
                    </span>
                </div>`;
            }
        } else if (!activeSponsorId) {
            contractBadge = `<div style="margin-left:auto; color:#ff9800; font-size:0.9rem;">⚠️ No active sponsor — you're leaving money on the table!</div>`;
        }

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Sponsors', 'Secure commercial deals to fund your operation. Better performance unlocks better partners.')}

            <!-- Club stats bar -->
            <div class="glass-panel" style="padding: 1rem 1.5rem; margin-bottom: 2rem; display:flex; gap: 2.5rem; align-items:center; flex-wrap:wrap;">
                <div><span style="color:var(--text-muted); font-size:0.85rem;">Club Funds</span><br><strong style="color:#00e676; font-size:1.2rem;">$${gs.money.toLocaleString()}</strong></div>
                <div><span style="color:var(--text-muted); font-size:0.85rem;">Club Fame</span><br><strong style="color:#d4af37; font-size:1.2rem;">⭐ ${fame.toLocaleString()}</strong></div>
                <div><span style="color:var(--text-muted); font-size:0.85rem;">PR Level</span><br><strong style="color:#a855f7; font-size:1.2rem;">Lvl ${prLevel}</strong></div>
                <div><span style="color:var(--text-muted); font-size:0.85rem;">Wins This Season</span><br><strong style="color:#00e676; font-size:1.2rem;">${wonThisSeason} 🏆</strong></div>
                <div><span style="color:var(--text-muted); font-size:0.85rem;">Matches Played</span><br><strong style="color:#aaa; font-size:1.2rem;">${matchesPlayed} ⚔️</strong></div>
                ${contractBadge}
            </div>

            <!-- Sponsor cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:1.5rem;" id="sponsor-grid">
            </div>

            ${activeSponsorId
                ? `<div class="glass-panel" style="margin-top:2rem; padding:1.2rem 1.5rem; border-left:3px solid #00e676; font-size:0.9rem; color:var(--text-muted);">
                    💡 <strong style="color:#fff;">Lump-sum sponsors</strong> pay at season end. <strong style="color:#fff;">Per-match &amp; win-bonus sponsors</strong> pay out immediately after each completed match.
                   </div>`
                : ''
            }
        `;

        const grid = document.getElementById('sponsor-grid');
        this._catalogue.forEach(sp => {
            grid.appendChild(this._buildCard(sp, club, gs, prLevel, fame, wonThisSeason, matchesPlayed, activeSponsorId));
        });
    },

    _buildCard(sp, club, gs, prLevel, fame, wonThisSeason, matchesPlayed, activeSponsorId) {
        const isActive = activeSponsorId === sp.id;
        const isLocked = fame < sp.fameRequired || prLevel < sp.prRequired;

        const payout = this._estimatePayout(sp, fame, prLevel, wonThisSeason, matchesPlayed);

        const tierBadge = {
            bronze: `<span style="background:#cd7f323a; color:#cd7f32; padding:2px 8px; border-radius:4px; font-size:0.75rem;">🥉 Bronze</span>`,
            silver: `<span style="background:#aaa3; color:#aaa; padding:2px 8px; border-radius:4px; font-size:0.75rem;">🥈 Silver</span>`,
            gold: `<span style="background:#d4af3733; color:#d4af37; padding:2px 8px; border-radius:4px; font-size:0.75rem;">🥇 Gold</span>`
        }[sp.tier];

        const durationBadge = sp.durationYears === 2
            ? `<span style="background:rgba(168,85,247,0.15); color:#a855f7; padding:2px 8px; border-radius:4px; font-size:0.75rem;">📅 2-Year Deal</span>`
            : `<span style="background:rgba(0,150,255,0.12); color:#4fc3f7; padding:2px 8px; border-radius:4px; font-size:0.75rem;">📅 1-Year Deal</span>`;

        const typeLabel = {
            lump_sum: '📦 Lump Sum (annual)',
            per_match: '⚔️ Per Match Played',
            win_bonus: '🏆 Per Win Only',
            lump_bonus: '📦+🏆 Lump + Win Bonus',
            match_bonus: '⚔️+🏆 Per Match + Win Bonus'
        }[sp.type];

        // Payout breakdown hint
        let breakdown = '';
        if (sp.type === 'lump_bonus') breakdown = `<span style="font-size:0.72rem; color:var(--text-muted);">$${sp.baseAmount.toLocaleString()} flat + $${sp.perWin.toLocaleString()}/win</span>`;
        if (sp.type === 'match_bonus') breakdown = `<span style="font-size:0.72rem; color:var(--text-muted);">$${sp.baseAmount.toLocaleString()}/match + $${sp.perWin.toLocaleString()}/win</span>`;
        if (sp.type === 'per_match') breakdown = `<span style="font-size:0.72rem; color:var(--text-muted);">$${sp.baseAmount.toLocaleString()} per match</span>`;
        if (sp.type === 'win_bonus') breakdown = `<span style="font-size:0.72rem; color:var(--text-muted);">$${sp.baseAmount.toLocaleString()} per win</span>`;
        if (sp.type === 'lump_sum') breakdown = `<span style="font-size:0.72rem; color:var(--text-muted);">$${sp.baseAmount.toLocaleString()} guaranteed</span>`;

        let lockReason = '';
        if (fame < sp.fameRequired) lockReason += `⭐ Requires ${sp.fameRequired.toLocaleString()} Fame (you: ${fame.toLocaleString()}). `;
        if (prLevel < sp.prRequired) lockReason += `📣 Requires PR Level ${sp.prRequired} (you: ${prLevel}).`;

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.cssText = `padding:1.5rem; border-top:3px solid ${isActive ? '#00e676' : isLocked ? '#444' : sp.color}; opacity:${isLocked ? '0.6' : '1'};`;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.8rem;">
                <div>
                    <div style="font-size:1.5rem; margin-bottom:0.3rem;">${sp.emoji}</div>
                    <h4 style="margin:0; font-family:var(--font-heading); color:${isLocked ? '#777' : '#fff'};">${sp.name}</h4>
                    <div style="font-size:0.75rem; color:${sp.color}; margin-top:0.2rem;">${sp.tagline}</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                    ${tierBadge}
                    ${durationBadge}
                </div>
            </div>

            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem; min-height:44px;">${sp.desc}</p>

            <div style="background:rgba(0,0,0,0.3); border-radius:6px; padding:0.7rem 1rem; margin-bottom:1rem;">
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.2rem;">${typeLabel}</div>
                ${breakdown ? `<div style="margin-bottom:0.3rem;">${breakdown}</div>` : ''}
                ${this._payoutDisplay(sp, prLevel, isLocked)}
            </div>

            ${isLocked
                ? `<div style="font-size:0.78rem; color:#ff9800; margin-bottom:0.8rem;">${lockReason}</div>`
                : ''
            }

            <button class="btn-primary" data-sponsor-id="${sp.id}"
                style="width:100%; ${isActive ? 'background:#00e676; color:#000; cursor:default;' : isLocked ? 'background:#333; color:#666; cursor:not-allowed;' : ''}"
                ${isActive || isLocked ? 'disabled' : ''}>
                ${isActive ? '✅ Active Sponsor' : isLocked ? '🔒 Locked' : '📝 Sign Contract'}
            </button>
        `;

        if (!isActive && !isLocked) {
            card.querySelector('button').addEventListener('click', () => this._signSponsor(sp.id, club, gs));
        }

        return card;
    },

    _signSponsor(sponsorId, club, gs) {
        const sp = this._getSponsorById(sponsorId);
        if (!sp) return;

        // Block if an active contract is still running
        const existing = club.sponsorContract;
        if (existing && existing.id) {
            const expiresAfterSeason = (existing.signedSeason || 1) + (existing.durationYears || 1) - 1;
            const currentSeason = gs.currentSeason || 1;
            if (currentSeason <= expiresAfterSeason) {
                const existingSponsor = this._getSponsorById(existing.id);
                const expiresIn = expiresAfterSeason - currentSeason + 1;
                window.UIComponents.showModal(
                    '⛔ Contract Still Active',
                    `You are already contracted with <strong>${existingSponsor?.name || existing.id}</strong>.<br><br>` +
                    `Your deal expires at the end of Season ${expiresAfterSeason} ` +
                    `(${expiresIn} season${expiresIn !== 1 ? 's' : ''} remaining).<br><br>` +
                    `You cannot sign a new sponsor until your current contract expires.`,
                    'danger'
                );
                return;
            }
        }

        club.sponsor = sponsorId;
        club.sponsorContract = {
            id: sponsorId,
            signedSeason: gs.currentSeason || 1,
            durationYears: sp.durationYears
        };
        gs.addNews('club', `${club.name} signed a ${sp.durationYears}-year sponsorship deal with ${sp.name}!`);
        window.Router.loadRoute('sponsors');
    },

    // ── SEASON-END: collect LUMP portions only & check expiry ────────────────
    collectSponsorPayout() {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club || !club.sponsor) return;

        const sp = this._getSponsorById(club.sponsor);
        if (!sp) return;

        const prBonus = 1 + ((club.facilities?.pr || 1) - 1) * 0.25;

        // Only pay the FLAT/LUMP portion at season end.
        // Per-match and per-win portions are already paid in real-time via collectMatchPayout().
        let payout = 0;
        let desc = '';
        if (sp.type === 'lump_sum') {
            payout = Math.round(sp.baseAmount * prBonus);
            desc = `annual flat`;
        } else if (sp.type === 'lump_bonus') {
            payout = Math.round(sp.baseAmount * prBonus);
            desc = `annual retainer`;
        }
        // per_match, win_bonus, match_bonus — no lump component, nothing to pay here

        if (payout > 0) {
            gs.money += payout;
            gs.addNews('financial', `📦 ${sp.name} ${desc} payout received: $${payout.toLocaleString()}`);
        }

        // Check contract expiry
        const contract = club.sponsorContract;
        if (contract) {
            const currentSeason = gs.currentSeason || 1;
            const expiresAfter = contract.signedSeason + contract.durationYears - 1;
            if (currentSeason >= expiresAfter) {
                club.sponsor = null;
                club.sponsorContract = null;
                gs.addNews('club', `⚠️ Your sponsorship deal with ${sp.name} has expired. Head to Sponsors to sign a new contract.`);
            }
        }
    },

    // ── PER-MATCH: called immediately after every completed match ─────────────
    // matchObj  — the schedule entry (must have .home / .away / .winnerId set)
    // playerWon — bool, true if player's club won this match
    collectMatchPayout(matchObj, playerWon) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club || !club.sponsor) return;

        // Only applies when the player's club was in this match
        if (matchObj.home !== club.id && matchObj.away !== club.id) return;

        const sp = this._getSponsorById(club.sponsor);
        if (!sp) return;

        const prBonus = 1 + ((club.facilities?.pr || 1) - 1) * 0.25;
        let payout = 0;
        let desc = '';

        switch (sp.type) {
            case 'per_match':
                payout = Math.round(sp.baseAmount * prBonus);
                desc = `match fee`;
                break;
            case 'win_bonus':
                if (playerWon) {
                    payout = Math.round(sp.baseAmount * prBonus);
                    desc = `win bonus`;
                }
                break;
            case 'match_bonus':
                // Per-match base always; win portion only if won
                payout = Math.round(sp.baseAmount * prBonus);
                desc = `match fee`;
                if (playerWon) {
                    const winPart = Math.round(sp.perWin * prBonus);
                    payout += winPart;
                    desc = `match fee + win bonus`;
                }
                break;
            case 'lump_bonus':
                // Only the win-bonus portion fires per match
                if (playerWon) {
                    payout = Math.round(sp.perWin * prBonus);
                    desc = `win bonus`;
                }
                break;
            // lump_sum: nothing fires per match
        }

        if (payout > 0) {
            gs.money += payout;
            gs.addNews('financial', `💰 ${sp.name}: $${payout.toLocaleString()} ${desc} received.`);
        }
    },

    // ── CARD PAYOUT DISPLAY ───────────────────────────────────────────────────
    // Shows the right metric for each deal type so it's never confusing.
    _payoutDisplay(sp, prLevel, isLocked) {
        if (isLocked) return `<div style="font-size:1.2rem; font-weight:800; color:#555;">???</div>`;
        const prBonus = 1 + (prLevel - 1) * 0.25;
        const fmt = (n) => `$${Math.round(n * prBonus).toLocaleString()}`;
        const green = (v, label) => `<div style="font-size:1.2rem; font-weight:800; color:#00e676;">${v} <span style="font-size:0.75rem; color:var(--text-muted);">${label}</span></div>`;
        const gold = (v, label) => `<div style="font-size:1rem; font-weight:700; color:#d4af37;">${v} <span style="font-size:0.72rem; color:var(--text-muted);">${label}</span></div>`;

        switch (sp.type) {
            case 'lump_sum':
                return green(fmt(sp.baseAmount), '/ season — paid at season end');
            case 'per_match':
                return green(fmt(sp.baseAmount), '/ match — paid right after each fight');
            case 'win_bonus':
                return green(fmt(sp.baseAmount), '/ win — paid right after each victory');
            case 'lump_bonus':
                return green(fmt(sp.baseAmount), '/ season — lump at season end') + gold(fmt(sp.perWin), '/ win — paid after each victory');
            case 'match_bonus':
                return green(fmt(sp.baseAmount), '/ match — paid after each fight') + gold(fmt(sp.perWin), '/ win — paid after each victory');
            default:
                return green(fmt(sp.baseAmount), '');
        }
    },

    // ── PAYOUT ESTIMATOR ──────────────────────────────────────────────────────
    _estimatePayout(sp, fame, prLevel, wonThisSeason, matchesPlayed) {
        const prBonus = 1 + (prLevel - 1) * 0.25; // +25% per PR level above 1
        switch (sp.type) {
            case 'lump_sum':
                return Math.round(sp.baseAmount * prBonus);
            case 'per_match':
                return Math.round(sp.baseAmount * matchesPlayed * prBonus);
            case 'win_bonus':
                return Math.round(sp.baseAmount * wonThisSeason * prBonus);
            case 'lump_bonus':
                return Math.round((sp.baseAmount + sp.perWin * wonThisSeason) * prBonus);
            case 'match_bonus':
                return Math.round((sp.baseAmount * matchesPlayed + sp.perWin * wonThisSeason) * prBonus);
            default:
                return sp.baseAmount;
        }
    },

    // ── HELPERS ───────────────────────────────────────────────────────────────
    _getSeasonWins(club, gs) {
        let wins = 0;
        gs.schedule.forEach(m => {
            if (m.winnerId && (m.home === club.id || m.away === club.id)) {
                const winnerFighter = gs.getFighter(m.winnerId);
                if (winnerFighter && winnerFighter.club_id === club.id) wins++;
            }
        });
        return wins;
    },

    _getSeasonMatches(club, gs) {
        let count = 0;
        gs.schedule.forEach(m => {
            // A match is "played" when a winnerId has been recorded
            if (m.winnerId && (m.home === club.id || m.away === club.id)) count++;
        });
        return count;
    },

    _getSponsorById(id) {
        return this._catalogue.find(s => s.id === id) || null;
    }
};
