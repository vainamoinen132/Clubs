/**
 * season_events.js
 * Handles Macro-Story hooks like Retirement Arcs, Championships, and Season Awards.
 */

window.SeasonEvents = {
    processEndOfSeason() {
        this.handleRetirementArcs();
        this.awardFighterOfTheSeason();
    },

    handleRetirementArcs() {
        const gs = window.GameState;

        // Find fighters currently on their retirement tour and actually retire them
        Object.values(gs.fighters).forEach(f => {
            if (f.dynamic_state.retiring_this_season) {
                f.dynamic_state.retired = true;
                f.dynamic_state.retiring_this_season = false;
                gs.addNews('global', `${f.name} has officially retired from professional fighting at the end of Season ${gs.season}.`);

                // If they belonged to a club, remove them
                if (f.club_id) {
                    let c = gs.getClub(f.club_id);
                    if (c) c.fighter_ids = c.fighter_ids.filter(id => id !== f.id);
                    f.club_id = null;
                }
            } else if (!f.dynamic_state.retired && f.age >= 32) {
                // Roll for entering a Retirement Arc
                let chance = (f.age - 31) * 0.15;
                if (Math.random() < chance) {
                    f.dynamic_state.retiring_this_season = true;
                    gs.addNews('drama', `BREAKING: Veteran ${f.name} announces that Season ${gs.season + 1} will be her final retirement tour!`);
                }
            }
        });
    },

    awardFighterOfTheSeason() {
        const gs = window.GameState;
        let bestFighter = null;
        let bestScore = -1;

        Object.values(gs.fighters).forEach(f => {
            if (!f.dynamic_state.retired && f.club_id) {
                let w = f.record ? f.record.w : 0;
                let fp = f.fame || 0;
                let score = (w * 100) + (fp * 0.1);

                if (score > bestScore) {
                    bestScore = score;
                    bestFighter = f;
                }
            }
        });

        if (bestFighter) {
            bestFighter.dynamic_state.morale = 100;
            bestFighter.dynamic_state.ego = 'High';
            if (!bestFighter.tags) bestFighter.tags = [];
            if (!bestFighter.tags.includes('Fighter of the Season')) bestFighter.tags.push('Fighter of the Season');

            gs.addNews('global', `🏆 ${bestFighter.name} has been awarded Fighter of the Season ${gs.season}!`);
        }
    },

    processChampionship(winnerId) {
        const gs = window.GameState;
        let f = gs.getFighter(winnerId);
        if (f) {
            if (!f.tags) f.tags = [];
            if (!f.tags.includes('Champion')) f.tags.push('Champion');
            f.dynamic_state.morale = 100;

            // Big fame bump
            gs.fame += 5000;

            gs.addNews('global', `👑 ${f.name} wins the Season ${gs.season} Championship! She is now the reigning Champion!`);
        }
    }
};
