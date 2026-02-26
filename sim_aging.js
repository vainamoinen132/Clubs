/**
 * sim_aging.js
 * Handles stat modifications based on age at the end of every season.
 */

window.SimAging = {
    ageWorld() {
        // Iterate all fighters in the world
        const gs = window.GameState;
        Object.values(gs.fighters).forEach(fighter => {
            fighter.age++;
            this._applyAgingCurve(fighter);
            this._checkRetirement(fighter);

            // Decrement contracts!
            if (fighter.contract && !fighter.retired) {
                // If they just signed a Bosman this exact tick, don't decrement them to 2 immediately
                if (fighter.contract.new_this_tick) {
                    delete fighter.contract.new_this_tick;
                } else if (fighter.contract.seasons_remaining > 0) {
                    fighter.contract.seasons_remaining--;

                    if (fighter.contract.seasons_remaining <= 0) {
                        // Contract expired!
                        if (fighter.club_id) {
                            let club = gs.getClub(fighter.club_id);
                            if (club) club.fighter_ids = club.fighter_ids.filter(id => id !== fighter.id);
                            gs.addNews('transfer', `${fighter.name}'s contract with ${club ? club.name : 'her club'} expired. She is now a Free Agent.`);
                        }
                        fighter.club_id = null;
                        fighter.contract = null;
                        // Avoid duplicates if she was listed or something weird happened
                        if (!gs.transferPool.find(f => f.id === fighter.id)) {
                            gs.transferPool.push(fighter);
                        }
                    } else {
                        fighter.contract.renewed_this_offseason = false;
                    }
                }
            }
        });

        // Also age the transfer pool
        gs.transferPool.forEach(fighter => {
            fighter.age++;
            this._applyAgingCurve(fighter);
        });

        console.log("World has aged 1 year.");
    },

    _applyAgingCurve(fighter) {
        let age = fighter.age;
        let stats = fighter.core_stats;

        // 27-30: -3 Endurance, -2 Speed. +4 Composure. Ceiling -1
        if (age === 27) {
            stats.endurance -= 3;
            stats.speed -= 2;
            stats.composure += 4;
            fighter.natural_ceiling = Math.max(60, (fighter.natural_ceiling || 80) - 1);
            this._logEvent(fighter, "reached late 20s. Experienced but losing half a step.");
        }

        // 31-33: -6 Endurance, -5 Speed, -3 Power. Ceiling -2
        if (age === 31) {
            stats.endurance -= 3; // incremental from prev
            stats.speed -= 3;
            stats.power -= 3;
            stats.composure += 2;
            fighter.natural_ceiling = Math.max(60, (fighter.natural_ceiling || 80) - 2);
            this._logEvent(fighter, "is entering her veteran years. Athleticism declining.");
        }

        // 34+: Major decline.
        if (age >= 34) {
            stats.endurance -= 2;
            stats.speed -= 2;
            stats.power -= 2;
            fighter.natural_ceiling = Math.max(60, (fighter.natural_ceiling || 80) - 1);
            this._logEvent(fighter, "is suffering steep physical decline due to age.");
        }
    },

    _checkRetirement(fighter) {
        if (fighter.age < 34) return;

        // Base chance = (age - 33) * 12%
        let chance = (fighter.age - 33) * 0.12;

        // Modified by morale... (lower morale = higher chance)
        if (fighter.dynamic_state.morale < 50) chance += 0.15;

        if (Math.random() < chance) {
            fighter.retired = true;
            this._logEvent(fighter, "has announced her retirement from the sport!");
            // In a full implementation, she would be removed from club roster and replaced.
        }
    },

    _logEvent(fighter, text) {
        console.log(`Aging: ${fighter.name} (Age ${fighter.age}) ${text}`);
    }
};
