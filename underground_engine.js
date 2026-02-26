/**
 * underground_engine.js
 * Core logic for the advanced Underground V2 system: procedural generation, 
 * tournament AI simulation, and the brutal Mercy Phase.
 */

window.UndergroundEngine = {

    // Fetches a fighter from the 50-character fixed underground pool
    generateFighter(tier) {
        let pool = window.UndergroundRoster.filter(f => f.tier === tier);

        // Fallback in case tier pool is somehow empty (shouldn't happen)
        if (!pool || pool.length === 0) pool = window.UndergroundRoster;

        // Pick random template from the massive pool of 50
        let template = pool[Math.floor(Math.random() * pool.length)];

        let f = {
            id: 'ug_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: template.name,
            avatar: `underground/${template.name.replace(/ /g, '_')}.png`,
            age: 20 + Math.floor(Math.random() * 18),
            tier: template.tier,
            is_underground: true,
            core_stats: {
                power: template.core_stats?.power || template.power || 50,
                technique: template.core_stats?.technique || template.technique || 50,
                control: Math.max(50, (template.core_stats?.technique || template.technique || 60) - 10),
                speed: template.core_stats?.speed || template.speed || 50,
                endurance: Math.max(60, (template.core_stats?.power || template.power || 70) - 10),
                resilience: Math.max(60, (template.core_stats?.power || template.power || 65) - 5),
                aggression: template.core_stats?.aggression || 80 + Math.random() * 20,
                composure: template.core_stats?.composure || template.composure || 50,
                presence: template.core_stats?.presence || template.presence || 50
            },
            style_affinities: {
                naked_wrestling: template.style_affinities?.naked_wrestling || 60 + Math.random() * 40,
                boxing: template.style_affinities?.boxing || 60 + Math.random() * 40,
                catfight: template.style_affinities?.catfight || 70 + Math.random() * 30,
                sexfight: template.style_affinities?.sexfight || 50 + Math.random() * 50
            },
            personality: {
                dominance_hunger: template.personality?.dominance || template.dominance || 50,
                submissive_lean: template.personality?.submissive_lean || Math.random() * 30,
                archetype: template.personality?.archetype || template.archetype || 'Brawler',
                temperament: (template.personality?.archetype || template.archetype) === 'Sadistic' ? 'Sadistic' : 'Volatile'
            },
            dynamic_state: {
                form: 100, fatigue: 0, stress: 0, injuries: [], morale: 80
            }
        };

        // Payout and injury mods calculation
        f.payout_base = (tier === 1 ? 8000 : (tier === 2 ? 18000 : 45000)) + Math.floor(Math.random() * 5000);
        f.injury_modifier = tier === 1 ? 1.4 : (tier === 2 ? 1.8 : 2.5);

        return f;
    },

    // Calculates the cruelty/sadism level of ANY fighter (roster or underground)
    calculateCruelty(fighter) {
        let agg = fighter.core_stats?.aggression || 50;
        let dom = fighter.personality?.dominance_hunger || 50;
        let sub = fighter.personality?.submissive_lean || 0;

        let cruelty = ((agg + dom) / 2) - (sub * 0.5);
        if (fighter.personality?.temperament === 'Sadistic') cruelty += 20;
        if (fighter.personality?.temperament === 'Honorable') cruelty -= 30;

        return Math.max(0, Math.min(100, cruelty));
    },

    // Simulates an instant match between two AI fighters for the tournament bracket
    simAITournamentMatch(f1, f2) {
        let h1 = 100; let st1 = 100;
        let h2 = 100; let st2 = 100;

        for (let r = 1; r <= 3; r++) {
            let s1 = (f1.core_stats.power + f1.core_stats.technique + f1.core_stats.speed) * (0.8 + Math.random() * 0.4);
            let s2 = (f2.core_stats.power + f2.core_stats.technique + f2.core_stats.speed) * (0.8 + Math.random() * 0.4);

            s1 *= Math.max(0.5, st1 / 100);
            s2 *= Math.max(0.5, st2 / 100);

            let diff = s1 - s2;
            if (diff > 0) {
                h2 -= Math.min(45, diff * 0.5);
            } else {
                h1 -= Math.min(45, -diff * 0.5);
            }
            st1 -= 15; st2 -= 15;

            if (h1 <= 0 || h2 <= 0) break;
        }

        let won = h1 > h2 ? f1 : f2;
        let lost = h1 > h2 ? f2 : f1;

        // Update condition for next round
        f1.dynamic_state.fatigue += 30;
        f2.dynamic_state.fatigue += 30;

        // Apply AI vs AI Mercy Phase
        let mercyLog = this.resolveMercyPhase(won, lost, 'AI');

        return { winner: won, loser: lost, mercyLog: mercyLog };
    },

    // Handles the horrific post-match underground consequences
    resolveMercyPhase(winner, loser, playerChoiceChoice = null) {
        let action = '';
        let narrative = '';

        if (playerChoiceChoice !== 'AI' && playerChoiceChoice !== null) {
            action = playerChoiceChoice; // 'gentle', 'sadistic', 'sexual', 'combo'
        } else {
            // AI determination based on cruelty
            let cruelty = this.calculateCruelty(winner);
            let roll = Math.random() * 100;

            if (cruelty < 40) action = 'gentle'; // 0-39 chance for most
            else if (cruelty < 75) {
                if (roll < 70) action = 'sadistic';
                else action = 'sexual';
            } else {
                if (roll < 40) action = 'sadistic';
                else if (roll < 80) action = 'sexual';
                else action = 'combo';
            }
        }

        let injuries = [];
        let stressDmg = 0;
        let moraleDmg = 0;

        switch (action) {
            case 'gentle':
                narrative = `${winner.name} steps back as the crowd boos her sudden display of mercy. She spits on the mat and walks away, leaving ${loser.name} breathing but unbroken.`;
                stressDmg = 10;
                moraleDmg = 10;
                break;
            case 'sadistic':
                narrative = `The bell doesn't exist here. ${winner.name} mounts the unconscious ${loser.name}, methodically hyper-extending her joints until something snaps. The sickening crack echoes through the basement.`;
                let physInjs = ["Shattered Orbital", "Torn ACL", "Broken Arm", "Dislocated Shoulder", "Severe Concussion"];
                injuries.push({ name: physInjs[Math.floor(Math.random() * physInjs.length)], duration: Math.floor(Math.random() * 10) + 1 });
                stressDmg = 35;
                moraleDmg = 35;
                break;
            case 'sexual':
                narrative = `With the crowd screaming for humiliation, ${winner.name} rips away what's left of ${loser.name}'s gear. She asserts total physical dominance, degrading and sexually assaulting her defeated opponent in the center of the pit. ${loser.name}'s mind breaks before the ordeal is over.`;
                stressDmg = 60; // Max out stress
                moraleDmg = 100; // Zero out morale
                // No physical injury duration, but massive mental damage
                break;
            case 'combo':
                narrative = `Pure nightmare. ${winner.name} traps one of ${loser.name}'s limbs, breaking it with a violent twist to ensure she can't resist, before forcing her into an agonizing, bloody sexual submission. Total physical and mental annihilation.`;
                let comboInjs = ["Shattered Knee", "Crushed Trachea", "Multiple Rib Fractures"];
                injuries.push({ name: comboInjs[Math.floor(Math.random() * comboInjs.length)], duration: Math.floor(Math.random() * 10) + 1 });
                stressDmg = 100;
                moraleDmg = 100;
                break;
        }

        // Apply to Loser (only if rostered fighter, underground randoms don't matter)
        if (!loser.is_underground && loser.dynamic_state) {
            loser.dynamic_state.stress = Math.min(100, (loser.dynamic_state.stress || 0) + stressDmg);
            loser.dynamic_state.morale = Math.max(0, (loser.dynamic_state.morale || 50) - moraleDmg);
            injuries.forEach(inj => {
                if (!loser.dynamic_state.injuries) loser.dynamic_state.injuries = [];
                loser.dynamic_state.injuries.push(inj);
            });

            // Check for trauma personality shift
            if ((action === 'sexual' || action === 'combo') && Math.random() < 0.5) {
                loser.personality.submissive_lean = Math.min(100, (loser.personality.submissive_lean || 0) + 20);
                narrative += ` <span style="color:#a855f7;">[TRAUMA: Submissive Lean permanently increased]</span>`;
            }

            // Log news if it was a career fighter (AI or player)
            if (injuries.length > 0 || action === 'combo') {
                window.GameState.addNews('underground', `RUMOR: ${loser.name} was brutally dismembered in an unsanctioned fight last night.`);
            }
        }

        // Apply to Winner (if rostered)
        if (!winner.is_underground && winner.core_stats && winner.personality) {
            if (action !== 'gentle') {
                winner.core_stats.aggression = Math.min(100, winner.core_stats.aggression + 2);
                winner.personality.dominance_hunger = Math.min(100, winner.personality.dominance_hunger + 2);
            }
        }

        return narrative;
    },

    // ==========================================================
    // TOURNAMENT LOGIC
    // ==========================================================

    generateTournamentBracket(size, playerFighterIds) {
        const gs = window.GameState;
        let pool = [];

        // 1. Add player fighters
        playerFighterIds.forEach(id => {
            let f = gs.getFighter(id);
            if (f) pool.push(f);
        });

        // 2. Draft AI Club Fighters (25% chance per AI club to send someone)
        Object.values(gs.clubs).forEach(club => {
            if (club.id === gs.playerClubId) return;
            if (pool.length >= size) return;

            if (Math.random() < 0.25 && club.fighter_ids.length > 0) {
                // Pick a random fighter who is fit enough
                let validAI = club.fighter_ids.map(id => gs.getFighter(id))
                    .filter(f => f && (f.dynamic_state.form >= 60 || f.dynamic_state.health > 80) && !f.dynamic_state.injuries?.length);

                if (validAI.length > 0) {
                    let chosen = validAI[Math.floor(Math.random() * validAI.length)];
                    if (!pool.find(p => p.id === chosen.id)) {
                        pool.push(chosen);
                    }
                }
            }
        });

        // 3. Fill the rest with procedural underground fighters
        while (pool.length < size) {
            // Mix of tier 1, 2, and maybe a rare tier 3
            let r = Math.random();
            let t = r < 0.6 ? 1 : (r < 0.9 ? 2 : 3);
            pool.push(this.generateFighter(t));
        }

        // Shuffle the pool for bracket seeding
        pool = this._shuffleArray(pool);

        // Build the round 1 matches
        let matches = [];
        for (let i = 0; i < pool.length; i += 2) {
            matches.push({
                f1: pool[i],
                f2: pool[i + 1],
                winner: null,
                mercyLog: null,
                isPlayerMatch: playerFighterIds.includes(pool[i].id) || playerFighterIds.includes(pool[i + 1].id)
            });
        }

        return {
            size: size,
            round: 1,
            matches: matches,
            playerFighterIds: playerFighterIds,
            logs: []
        };
    },

    advanceTournamentRound(tourneyData) {
        let nextRoundMatches = [];
        let winners = [];
        let rLogs = [];

        // In the current round, any match that ISN'T a player match gets instant simmed
        tourneyData.matches.forEach(m => {
            if (!m.winner) {
                // It's an AI vs AI match
                let res = this.simAITournamentMatch(m.f1, m.f2);
                m.winner = res.winner;
                m.mercyLog = res.mercyLog;
            }
            winners.push(m.winner);

            // Generate summary log
            let loser = m.winner.id === m.f1.id ? m.f2 : m.f1;
            rLogs.push(`${m.winner.name} defeated ${loser.name}. ${m.mercyLog}`);
        });

        tourneyData.logs.push(`ROUND ${tourneyData.round} SUMMARY: ` + rLogs.join(" | "));

        // Check for overall winner
        if (winners.length === 1) {
            tourneyData.champion = winners[0];
            tourneyData.isComplete = true;
            return tourneyData;
        }

        // Otherwise, build the next round
        for (let i = 0; i < winners.length; i += 2) {
            nextRoundMatches.push({
                f1: winners[i],
                f2: winners[i + 1],
                winner: null,
                mercyLog: null,
                isPlayerMatch: tourneyData.playerFighterIds.includes(winners[i].id) || tourneyData.playerFighterIds.includes(winners[i + 1].id)
            });
        }

        tourneyData.round++;
        tourneyData.matches = nextRoundMatches;
        return tourneyData;
    },

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // ==========================================================
    // THE BLOOD PIT (1v1 Instant Sim)
    // ==========================================================

    runBloodPitMatch(clubFighterId, opponentId, isAIOpponent) {
        const gs = window.GameState;
        let cFighter = gs.getFighter(clubFighterId);

        let ugFighter;
        if (isAIOpponent) ugFighter = gs.getFighter(opponentId);
        else ugFighter = this.generateFighter(Math.random() < 0.6 ? 1 : 2); // default fallback if no ID stored logic

        // Replace random generate with actual object if passed
        if (typeof opponentId === 'object') ugFighter = opponentId;

        // Use the AI Tournament Sim for the actual fight maths
        let res = this.simAITournamentMatch(cFighter, ugFighter);

        let clubWon = res.winner.id === cFighter.id;
        let payout = clubWon ? (ugFighter.payout_base || 15000) : Math.floor((ugFighter.payout_base || 15000) * 0.1);

        cFighter.dynamic_state.stress = Math.min(100, cFighter.dynamic_state.stress + (clubWon ? 5 : 20));

        gs.money += payout;
        gs.undergroundAvailableThisWeek = false;

        let result = clubWon ? "Won" : "Lost";

        gs.undergroundHistory.push({
            week: gs.week, season: gs.season,
            fighterId: clubFighterId, opponentId: ugFighter.id || 'ug_random',
            result: result, payout: payout, injuries: [] // Handled in mercy phase now
        });

        // The mercy logic happens outside this function based on player UI choice if they win
        // If they lose, the opponent applies it automatically
        let autoMercy = null;
        if (!clubWon) {
            autoMercy = this.resolveMercyPhase(ugFighter, cFighter, 'AI');
        }

        return {
            winner: clubWon ? 'club' : 'underground',
            payout: payout,
            autoMercyLog: autoMercy,
            loser: res.loser,
            simWinner: res.winner
        };
    }
};
