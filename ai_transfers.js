/**
 * ai_transfers.js
 * Generates free agents and handles end-of-season shifts.
 */

window.AITransfers = {
    handleSeasonEnd() {
        // 0. Execute pending Bosman moves (pre-signed free transfers take effect)
        if (window.UITransfers && window.UITransfers.executeBosmanMoves) {
            window.UITransfers.executeBosmanMoves();
        }

        // 1. Generate new prospects 
        this._generateProspects();

        // 2. Generate new staff
        this._generateStaff();

        // 3. Clear deadpool (optional cleanup later)
    },

    processAITransfersWeekly() {
        const gs = window.GameState;
        if (!gs.transferInbox) gs.transferInbox = [];
        if (!gs.pendingTransferDemands) gs.pendingTransferDemands = [];

        // FM-Style: generate inbox bids for listed fighters (player reviews them)
        this._generateInboxBids();

        // Process transfer demands from unhappy fighters
        this._processTransferDemands();

        if (gs.transferPool.length === 0 && Object.keys(gs.clubs).every(id => id === gs.playerClubId || gs.clubs[id].fighter_ids.length >= 6)) return;

        // Iterate through AI clubs for their own transfers
        Object.keys(gs.clubs).forEach(clubId => {
            if (clubId === gs.playerClubId) return;
            const club = gs.clubs[clubId];
            if (!club.money) club.money = 100000;

            // AI firing logic: morale <= 10 AND not a high potential star
            for (let i = club.fighter_ids.length - 1; i >= 0; i--) {
                let fId = club.fighter_ids[i];
                let f = gs.getFighter(fId);
                let isHighPotential = (f && f.potential > 70) || (f && (f.core_stats.power + f.core_stats.technique + f.core_stats.speed) > 210);
                if (f && f.dynamic_state.morale <= 10 && club.fighter_ids.length > 4 && !isHighPotential) {
                    club.fighter_ids.splice(i, 1);
                    f.club_id = null;
                    gs.transferPool.push(f);
                    gs.addNews("transfer", `${club.name} has shockingly released ${f.name} into Free Agency!`);
                }
            }

            // AI hiring logic: roster < 6
            if (club.fighter_ids.length < 6 && club.money > 30000 && gs.transferPool.length > 0) {
                // Sort by potential to get the best prospect, add a little randomness so they don't always pick the absolute #1
                let poolCopy = [...gs.transferPool].sort((a, b) => b.potential - a.potential);
                let target = poolCopy[Math.floor(Math.random() * Math.min(3, poolCopy.length))];
                let idx = gs.transferPool.findIndex(f => f.id === target.id);
                if (target) {
                    club.money -= 25000;
                    target.club_id = club.id;
                    target.contract = { salary: 15000, seasons_remaining: 3, win_bonus: 1500, release_clause: 45000, happiness: 80, demand_triggered: false };
                    club.fighter_ids.push(target.id);
                    gs.fighters[target.id] = target;
                    gs.transferPool.splice(idx, 1);
                    gs.addNews("transfer", `${club.name} has signed Free Agent ${target.name} for $25,000.`);
                }
            }

            // AI Bosman Poaching
            if (club.fighter_ids.length < 8 && club.money > 100000 && Math.random() < 0.1) {
                let bosmanTargets = [];
                Object.values(gs.fighters).forEach(f => {
                    if (f.club_id && f.club_id !== club.id && !f.retired && f.contract && f.contract.seasons_remaining === 1 && !f.contract.renewed_this_offseason) {
                        let alreadySigned = gs.pendingBosmanMoves && gs.pendingBosmanMoves.find(m => m.fighterId === f.id);
                        if (!alreadySigned) bosmanTargets.push(f);
                    }
                });
                if (bosmanTargets.length > 0) {
                    bosmanTargets.sort((a, b) => (b.core_stats.power + b.core_stats.technique + b.core_stats.speed) - (a.core_stats.power + a.core_stats.technique + a.core_stats.speed));
                    let target = bosmanTargets[0];
                    let tOvr = target.core_stats.power + target.core_stats.technique + target.core_stats.speed;
                    let highestOvr = Math.max(0, ...club.fighter_ids.map(id => { let f = gs.getFighter(id); return f ? (f.core_stats.power + f.core_stats.technique + f.core_stats.speed) : 0; }));
                    if (tOvr > highestOvr - 20) {
                        let offer = Math.floor((tOvr / 3) * 200 + 15000);
                        if (!gs.pendingBosmanMoves) gs.pendingBosmanMoves = [];
                        gs.pendingBosmanMoves.push({ fighterId: target.id, fromClubId: target.club_id, salary: offer, agreementWeek: gs.week, agreementSeason: gs.season, toClubId: club.id });
                        let oldClub = gs.getClub(target.club_id);
                        gs.addNews("transfer", `BOMBSHELL: ${club.name} has pre-signed ${target.name} from ${oldClub ? oldClub.name : 'another club'} on a Bosman transfer for next season!`);
                        if (target.club_id === gs.playerClubId) {
                            if (window.UIComponents && window.UIComponents.showModal) window.UIComponents.showModal("Fighter Poached!", `${club.name} agreed to terms with ${target.name} because she was in her final contract year. She leaves at the end of the season.`, "danger");
                        }
                    }
                }
            }
        });
    },

    /**
     * For each fighter listed by the player, generate bids from interested AI clubs
     * and push them to gs.transferInbox for the player to review (FM-style).
     */
    _generateInboxBids() {
        const gs = window.GameState;
        if (!gs.listedForTransfer || gs.listedForTransfer.length === 0) return;

        gs.listedForTransfer.forEach(listing => {
            const fighter = gs.getFighter(listing.fighterId);
            if (!fighter) return;

            const cs = fighter.core_stats;
            const ovr = (cs.power + cs.technique + cs.speed) / 3;

            Object.values(gs.clubs).forEach(club => {
                if (club.id === gs.playerClubId) return;
                if (club.fighter_ids.length >= 8) return;
                if ((club.money || 0) < listing.askingFee * 0.5) return;

                // Interest probability scales with OVR
                const interestChance = 0.25 + (ovr / 250);
                if (Math.random() > interestChance) return;

                // Avoid duplicate bids from same club for same fighter this week
                const alreadyBid = gs.transferInbox.find(b => b.fighterId === fighter.id && b.biddingClubId === club.id);
                if (alreadyBid) return;

                // Bid between 75%–120% of asking fee
                const bidVariance = 0.75 + Math.random() * 0.45;
                const bidAmount = Math.floor(listing.askingFee * bidVariance);

                gs.transferInbox.push({
                    id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    fighterId: fighter.id,
                    biddingClubId: club.id,
                    offerAmount: bidAmount,
                    weekReceived: gs.week,
                    askingFee: listing.askingFee
                });
            });
        });
    },

    /**
     * Compute a fighter's willingness to leave (FM-style morale/contract/relationships).
     * Returns { level: 'wants_out'|'restless'|'neutral'|'settled', score: 0-100, reasons: [] }
     */
    _computeFighterWillingness(fighter) {
        if (!fighter) return { level: 'neutral', score: 50, reasons: [] };
        const gs = window.GameState;
        let score = 50;
        const reasons = [];

        const morale = fighter.dynamic_state?.morale ?? 70;
        if (morale < 30) { score += 30; reasons.push('Critically low morale'); }
        else if (morale < 50) { score += 15; reasons.push('Low morale'); }
        else if (morale > 75) { score -= 20; reasons.push('Happy & motivated'); }

        const happiness = fighter.contract?.happiness ?? 50;
        if (happiness < 40) { score += 20; reasons.push('Unhappy with contract'); }
        else if (happiness > 70) { score -= 15; reasons.push('Content with contract'); }

        const seasons = fighter.contract?.seasons_remaining ?? 2;
        if (seasons <= 1) { score += 25; reasons.push('Final contract year'); }

        const stress = fighter.dynamic_state?.stress ?? 0;
        if (stress > 70) { score += 10; reasons.push('Extremely stressed'); }

        // Lovers in same club = strong anchor (works for both player and NPC clubs)
        const club = gs.getClub(fighter.club_id || gs.playerClubId);
        if (club) {
            club.fighter_ids.forEach(id => {
                if (id === fighter.id) return;
                const rel = fighter.dynamic_state?.relationships?.[id];
                if (rel && (rel.type === 'lovers' || rel.type === 'obsession')) {
                    const partnerName = gs.getFighter(id)?.name || '?';
                    score -= 30;
                    reasons.push(`Has lover ${partnerName} here`);
                }
            });
        }

        score = Math.max(0, Math.min(100, score));
        let level = score >= 75 ? 'wants_out' : score >= 55 ? 'restless' : score >= 35 ? 'neutral' : 'settled';
        return { level, score, reasons };
    },

    /**
     * Weekly: fighters with very high willingness may formally demand a transfer.
     */
    _processTransferDemands() {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        club.fighter_ids.forEach(fId => {
            const f = gs.getFighter(fId);
            if (!f || !f.contract || f.contract.demand_triggered) return;
            const w = this._computeFighterWillingness(f);
            if (w.level === 'wants_out' && Math.random() < 0.15) {
                f.contract.demand_triggered = true;
                if (!gs.pendingTransferDemands) gs.pendingTransferDemands = [];
                if (!gs.pendingTransferDemands.find(d => d.fighterId === fId)) {
                    gs.pendingTransferDemands.push({ fighterId: fId, week: gs.week, willingness: w });
                    gs.addNews('transfer', `⚠️ ${f.name} has formally requested a transfer!`);
                }
            }
        });
    },

    _generateProspects() {
        const gs = window.GameState;
        let pId = Date.now();
        let totalGen = 0;

        // 1. Academy Prospects (18-20 yrs old, low base, high ceiling)
        let numAca = Math.floor(Math.random() * 4) + 3; // 3-6
        for (let i = 0; i < numAca; i++) {
            let fName = window.GameNames.generateName();
            let picId = Math.floor(Math.random() * 490) + 1; // Global pool up to 500
            let avatarPath = `generic/${picId}.png`;

            let f = this._buildFighterBase(`prospect_${pId}_a${i}`, fName, 18 + Math.floor(Math.random() * 3));
            f.avatar = avatarPath;
            f.core_stats = { power: 45, technique: 45, control: 45, speed: 55, endurance: 50, resilience: 45, aggression: 50, composure: 40, presence: 40 };
            f.traits = ['academy_product'];
            gs.transferPool.push(f);
            totalGen++;
        }

        // 2. Free Agents (28-34 yrs old, declining)
        let numFA = Math.floor(Math.random() * 4) + 2; // 2-5
        for (let i = 0; i < numFA; i++) {
            let fName = window.GameNames.generateName();
            let picId = Math.floor(Math.random() * 490) + 1;
            let avatarPath = `generic/${picId}.png`;

            let f = this._buildFighterBase(`prospect_${pId}_f${i}`, fName, 28 + Math.floor(Math.random() * 7));
            f.avatar = avatarPath;
            f.core_stats = { power: 65, technique: 75, control: 70, speed: 50, endurance: 55, resilience: 60, aggression: 65, composure: 80, presence: 60 };
            f.personality.archetype = "Strategist";
            gs.transferPool.push(f);
            totalGen++;
        }

        // 3. International Imports (22-28 yrs old, low style affinities)
        let numInt = Math.floor(Math.random() * 3) + 1; // 1-3
        for (let i = 0; i < numInt; i++) {
            let fName = window.GameNames.generateName();
            let picId = Math.floor(Math.random() * 490) + 1;
            let avatarPath = `generic/${picId}.png`;

            let f = this._buildFighterBase(`prospect_${pId}_i${i}`, fName, 22 + Math.floor(Math.random() * 7));
            f.avatar = avatarPath;
            f.core_stats = { power: 75, technique: 75, control: 75, speed: 75, endurance: 75, resilience: 75, aggression: 70, composure: 70, presence: 60 };
            // Note: _buildFighterBase now sets affinities realistically, so we don't need to override it with flat 30s anymore
            // We can leave the base varied affinities as generated.
            gs.transferPool.push(f);
            totalGen++;
        }

        // 4. Viral Star (0-1)
        if (Math.random() < 0.7) {
            let fName = window.GameNames.generateName();
            let picId = Math.floor(Math.random() * 490) + 1;
            let avatarPath = `generic/${picId}.png`;

            let f = this._buildFighterBase(`prospect_${pId}_v`, fName, 20 + Math.floor(Math.random() * 7));
            f.avatar = avatarPath;
            f.core_stats = { power: 55, technique: 50, control: 50, speed: 60, endurance: 55, resilience: 50, aggression: 65, composure: 45, presence: 95 };
            f.personality.archetype = "Showboat";
            f.dynamic_state.stress = 40; // Starts stressed from fame
            gs.transferPool.push(f);
            totalGen++;
        }

        // 5. Redemption Arc (0-1)
        if (Math.random() < 0.5) {
            let fName = window.GameNames.generateName();
            let picId = Math.floor(Math.random() * 490) + 1;
            let avatarPath = `generic/${picId}.png`;

            let f = this._buildFighterBase(`prospect_${pId}_r`, fName, 25 + Math.floor(Math.random() * 8));
            f.avatar = avatarPath;
            f.core_stats = { power: 65, technique: 85, control: 75, speed: 55, endurance: 50, resilience: 50, aggression: 60, composure: 65, presence: 70 };
            f.personality.archetype = "Underdog";
            f.dynamic_state.morale = 20; // Needs redemption
            gs.transferPool.push(f);
            totalGen++;
        }

        console.log(`Generated ${totalGen} mixed free agents for the season.`);
    },

    _generateStaff() {
        const gs = window.GameState;
        const roles = ['head_coach', 'striking_coach', 'grapple_coach', 'conditioning_coach', 'psych_coach'];
        const numNew = Math.floor(Math.random() * 2) + 1; // 1 to 2 new staff per year

        for (let i = 0; i < numNew; i++) {
            let role = roles[Math.floor(Math.random() * roles.length)];
            let id = `staff_gen_${Date.now()}_${i}`;
            let skill = 65 + Math.floor(Math.random() * 20); // 65 to 84 skill

            let s = {
                id: id,
                name: "Coach " + ["Smith", "Watanabe", "Silva", "Johnson", "Ivanov"][Math.floor(Math.random() * 5)],
                role: role,
                skill: skill,
                trait: ["Motivator", "Disciplinarian", "Analyst", "Nurturer"][Math.floor(Math.random() * 4)],
                synergies: [], conflicts: [],
                passive_bonus: {},
                salary: 8000 + (skill * 50)
            };

            // Basic generic bonuses
            if (role === 'head_coach') s.passive_bonus = { all_training_gain: 3, match_composure: 2 };
            if (role === 'striking_coach') s.passive_bonus = { boxing_affinity_growth: 5, technique_in_boxing: 2 };
            if (role === 'grapple_coach') s.passive_bonus = { naked_wrestling_affinity_growth: 5, control_in_grapple: 2 };
            if (role === 'conditioning_coach') s.passive_bonus = { endurance_growth: 4, fatigue_drain_reduction: 0.1 };
            if (role === 'psych_coach') s.passive_bonus = { composure_growth: 4, stress_drain_reduction: 0.1 };

            gs.staff[id] = s;
            gs.staffPool.push(id);
        }
        console.log(`Generated ${numNew} new staff members.`);
    },

    _buildFighterBase(id, name, age) {
        const motivatorPool = ['Winning', 'Respect', 'Money', 'Dominance', 'Fame', 'Revenge', 'Loyalty'];
        const shuffled = motivatorPool.sort(() => 0.5 - Math.random());
        const motivators = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
        const rivalryStyles = ['Aggressive', 'Psychological', 'Technical', 'Intimidation', 'Playful'];
        const archetypes = ['Rebel', 'Strategist', 'Brawler', 'Underdog', 'Showboat', 'Tactician'];
        const selectedArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];

        // Realistic variations in fighting styles
        let generatedAffinities = { naked_wrestling: 10, boxing: 10, catfight: 10, sexfight: 10 };
        const styleBackgrounds = ['Striker', 'Grappler', 'Brawler', 'Erotic', 'Balanced'];
        const bg = styleBackgrounds[Math.floor(Math.random() * styleBackgrounds.length)];

        const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        if (bg === 'Striker') {
            generatedAffinities.boxing = r(65, 85);
            generatedAffinities.naked_wrestling = r(10, 30);
            generatedAffinities.catfight = r(30, 50);
            generatedAffinities.sexfight = r(5, 25);
        } else if (bg === 'Grappler') {
            generatedAffinities.naked_wrestling = r(65, 85);
            generatedAffinities.boxing = r(10, 30);
            generatedAffinities.catfight = r(30, 50);
            generatedAffinities.sexfight = r(20, 40);
        } else if (bg === 'Brawler') {
            generatedAffinities.catfight = r(70, 90);
            generatedAffinities.boxing = r(40, 60);
            generatedAffinities.naked_wrestling = r(30, 50);
            generatedAffinities.sexfight = r(15, 35);
        } else if (bg === 'Erotic') {
            generatedAffinities.sexfight = r(75, 95);
            generatedAffinities.naked_wrestling = r(40, 60);
            generatedAffinities.catfight = r(30, 50);
            generatedAffinities.boxing = r(5, 20);
        } else {
            // Balanced
            generatedAffinities.naked_wrestling = r(40, 55);
            generatedAffinities.boxing = r(40, 55);
            generatedAffinities.catfight = r(40, 55);
            generatedAffinities.sexfight = r(40, 55);
        }

        return {
            id: id,
            name: name,
            age: age,
            core_stats: { power: 50, technique: 50, control: 50, speed: 50, endurance: 50, resilience: 50, aggression: 50, composure: 50, presence: 50 },
            style_affinities: generatedAffinities,
            personality: {
                archetype: selectedArchetype,
                dominance_hunger: 30 + Math.floor(Math.random() * 40),
                submissive_lean: 20 + Math.floor(Math.random() * 40),
                motivators: motivators,
                rivalry_style: rivalryStyles[Math.floor(Math.random() * rivalryStyles.length)],
                boundaries: []
            },
            dynamic_state: {
                form: 50,
                stress: 0,
                fatigue: 0,
                injury: "none",
                morale: 70,
                wins: 0,
                losses: 0,
                win_streak: 0,
                injuries: [],
                relationships: {},
                scarred_weeks: 0,
                ego: 'Normal',
                fame: 0
            },
            record: { w: 0, l: 0 },
            training_focus: 'general',
            potential: window.GameState._generatePotential(age, selectedArchetype || 'Alpha'),
            get natural_ceiling() { return this.potential; },
            tier: 1,
            traits: [],
            contract: null,
            scouted: false
        };
    }
};