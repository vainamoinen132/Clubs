/**
 * sim_psychology.js
 * Handles match-level psychological events (breakpoints, tilt, momentum).
 */

window.SimPsychology = {
    runPostRoundChecks(f1, f2, roundWinner, matchLog) {
        this.checkMomentum(f1, f2, roundWinner, matchLog);
        this.checkIntimidation(f1, f2, matchLog);
        this.checkTiltRecovery(f1, f2, roundWinner, matchLog);
        this.checkBreakpoints(f1, f2, matchLog);
    },

    checkMomentum(f1, f2, roundWinner, matchLog) {
        // Not strictly tracking rounds-won-in-a-row in fighter state directly here,
        // but let's simulate a basic check: if a fighter has immense form or just won heavily
        // We can apply minor buffs.
        // In actual integration, we'd read `match.streak[f1]` from sim_engine.
        // We will stub this to randomly happen on wins for now.
        if (Math.random() > 0.85) {
            roundWinner.currentStats.aggression += 10;
            roundWinner.currentStats.speed += 5;
            matchLog.push({ type: 'PSYCH_EVENT', text: `*[MOMENTUM SURGE] ${roundWinner.name} is feeling it! (+10 Agg, +5 Spd)*` });
        }
    },

    checkIntimidation(f1, f2, matchLog) {
        // Crowd intimidation: Opponent Presence > own by 20+ = Composure -8
        this._applyIntimidation(f1, f2, matchLog);
        this._applyIntimidation(f2, f1, matchLog);
    },

    _applyIntimidation(target, opponent, matchLog) {
        if (opponent.currentStats.presence - target.currentStats.presence >= 20) {
            target.currentStats.composure = Math.max(0, target.currentStats.composure - 8);
            if (Math.random() > 0.7) {
                // Throttle log spam
                matchLog.push({ type: 'PSYCH_EVENT', text: `*[INTIMIDATION] ${opponent.name}'s aura is overwhelming ${target.name}. (-8 Comp)*` });
            }
        }
    },

    checkTiltRecovery(f1, f2, roundWinner, matchLog) {
        // High-Composure fighter after losing 2 rounds (stubbed randomly for loser if comp > 80)
        let loser = f1 === roundWinner ? f2 : f1;
        if (loser.originalStats.composure >= 80 && Math.random() > 0.7) {
            loser.currentStats.composure += 5;
            loser.currentStats.technique += 5;
            matchLog.push({ type: 'PSYCH_EVENT', text: `*[TILT RECOVERY] ${loser.name} takes a deep breath and centers herself. (+Stats)*` });
        }
    },

    checkBreakpoints(f1, f2, matchLog) {
        // Breakpoint activation: Condition met + Stress > 60 -> Composure -15 for 2 rounds
        this._applyBreakpoint(f1, matchLog);
        this._applyBreakpoint(f2, matchLog);
    },

    _applyBreakpoint(fighter, matchLog) {
        if (fighter.dynamic.stress > 60 && Math.random() > 0.75) {
            fighter.currentStats.composure -= 15;
            matchLog.push({ type: 'PSYCH_EVENT', text: `*[BREAKPOINT] ${fighter.name} is cracking under the pressure! (-15 Comp)*` });
            // Lower stress slightly so they don't instabreak every round
            fighter.dynamic.stress -= 10;
        }
    }
};
