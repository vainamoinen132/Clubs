/**
 * sim_engine.js
 * Master orchestrator for a single Match between two fighters.
 */

class MatchSimulation {
    constructor(fighter1, fighter2, matchStyle = 'boxing', f1Home = false) {
        this.f1 = this._cloneFighterInitialState(fighter1);
        this.f2 = this._cloneFighterInitialState(fighter2);

        this.style = matchStyle;
        this.f1Home = f1Home; // Does f1 have home advantage?

        // Match state
        this.roundsWon = { f1: 0, f2: 0 };
        this.currentRoundNumber = 1;
        this.matchLog = [];
        this.winner = null;

        // Track momentum (rounds won in a row)
        this.streak = { f1: 0, f2: 0 };

        // Apply Club Style Advantages
        const applyStyleAdvantage = (f) => {
            const club = window.GameState.getClub(f.originalStats.club_id || (f.id ? window.GameState.getFighter(f.id)?.club_id : null));
            if (club && club.home_advantage === `style_${this.style}`) {
                f.currentStats.technique = Math.floor(f.currentStats.technique * 1.05);
                f.currentStats.power = Math.floor(f.currentStats.power * 1.05);
                f.currentStats.speed = Math.floor(f.currentStats.speed * 1.05);
                this.log({ type: 'EVENT', text: `<strong>${f.name}</strong> gains a Massive Club Advantage (5% Performance Boost) fighting in ${this.style.toUpperCase()}!` });
            }
        };

        applyStyleAdvantage(this.f1);
        applyStyleAdvantage(this.f2);
    }

    _cloneFighterInitialState(fighter) {
        // Deep copy of stats so we can modify them dynamically during match
        // Baseline health is usually not exactly specified in GDD but inferred (assume 100 base)
        return {
            id: fighter.id,
            name: fighter.name,
            originalStats: JSON.parse(JSON.stringify(fighter.core_stats)),
            currentStats: JSON.parse(JSON.stringify(fighter.core_stats)),
            affinities: JSON.parse(JSON.stringify(fighter.style_affinities)),
            personality: JSON.parse(JSON.stringify(fighter.personality)),
            dynamic: JSON.parse(JSON.stringify(fighter.dynamic_state)),

            // Match specific pools
            health: 100, // Typically reduced by damage 
            stamina: 100, // Starts full, degrades, recovers +8 per round
            dominanceScore: 0, // important for Sexfight style

            // Tactics
            stance: 'balanced', // aggressive, balanced, defensive
            predictabilityCounter: {} // tracks repeated tactics
        };
    }

    startMatch() {
        this.log({ type: 'MATCH_START', text: `Match started: ${this.f1.name} vs ${this.f2.name} in ${this.style.toUpperCase()}` });
        return this;
    }

    // Simulate one round
    playRound() {
        if (this.winner) return this;

        // Apply Age Modifiers to currentStats
        // Apply stamina threshold penalties
        SimRounds.applyPreRoundModifiers(this.f1, this.f1.originalStats, this.f1.dynamic.age);
        SimRounds.applyPreRoundModifiers(this.f2, this.f2.originalStats, this.f2.dynamic.age);

        // ** 1C. Submission / Early Finish Check **
        let f1Wins = this.roundsWon.f1;
        let f2Wins = this.roundsWon.f2;

        const checkFinishAttempt = (f, opp, fW, oppW) => {
            // Require a 5-round lead AND opponent near collapse (health < 20) to trigger early finish.
            // Gap of 4 was ending matches at 4 rounds before the standard first-to-5 win condition.
            if (fW - oppW >= 5 && opp.health < 20) {
                this.log({ type: 'EVENT', text: `<strong>${f.name}</strong> senses the end is near and swarms <strong>${opp.name}</strong>, looking for the finish!` });
                let finishDelta = (f.currentStats.power * 0.5 + f.currentStats.aggression * 0.5) - (opp.currentStats.resilience * 0.5 + opp.currentStats.composure * 0.5) + (Math.floor(Math.random() * 20) - 10);

                if (finishDelta > 5) {
                    this.winner = f;
                    this.isFinish = true; // New flag for post-match screens
                    this.log({ type: 'FINISH', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateFinish(f, opp, this.style, this.currentRoundNumber) : `${f.name} finishes the match!` });
                    return true;
                } else {
                    this.log({ type: 'EVENT', text: `<strong>${opp.name}</strong> miraculously survives the onslaught and escapes the finishing attempt!` });
                    f.stamina -= 15; // Penalty for blowing gas tank trying to finish
                }
            }
            return false;
        };

        if (checkFinishAttempt(this.f1, this.f2, f1Wins, f2Wins)) return this;
        else if (checkFinishAttempt(this.f2, this.f1, f2Wins, f1Wins)) return this;

        // ** 1D. Momentum System Buffs **
        let streak1 = this.streak.f1;
        let streak2 = this.streak.f2;

        if (streak1 >= 2) {
            this.f1.currentStats.speed += (streak1 === 2 ? 5 : 10);
            this.f1.currentStats.power += (streak1 === 2 ? 5 : 10);
            this.log({ type: 'EVENT', text: `<strong>${this.f1.name}</strong> is riding a wave of momentum!` });
        } else if (streak2 >= 2) {
            this.f2.currentStats.speed += (streak2 === 2 ? 5 : 10);
            this.f2.currentStats.power += (streak2 === 2 ? 5 : 10);
            this.log({ type: 'EVENT', text: `<strong>${this.f2.name}</strong> is riding a wave of momentum!` });
        }

        // Step 1: Initiative
        let initF1 = this._calculateInitiative(this.f1);
        let initF2 = this._calculateInitiative(this.f2);

        let attacker = initF1 >= initF2 ? this.f1 : this.f2;
        let defender = initF1 >= initF2 ? this.f2 : this.f1;

        // Personality Bleed: Underdog and Volatile
        const checkPreRoundBleed = (f, opp) => {
            let fWins = this.roundsWon[f.id === this.f1.id ? 'f1' : 'f2'];
            let oppWins = this.roundsWon[opp.id === this.f1.id ? 'f1' : 'f2'];

            if (f.personality.archetype === 'Underdog' && oppWins >= 3 && fWins <= 1) {
                if (Math.random() < 0.40) {
                    f.currentStats.speed += 8;
                    f.currentStats.power += 8;
                    f.currentStats.composure += 8;
                    this.log({ type: 'EVENT', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateArchetypeEvent(f, 'RALLY') : `${f.name} finds a second wind!` });
                }
            }
            if (f.personality.archetype === 'Rebel' && oppWins - fWins >= 2) {
                if (Math.random() < 0.35) {
                    if (Math.random() < 0.5) {
                        f.currentStats.composure -= 10;
                        this.log({ type: 'EVENT', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateArchetypeEvent(f, 'TILT') : `${f.name} tilts!` });
                    } else {
                        f.currentStats.aggression += 15;
                        this.log({ type: 'EVENT', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateArchetypeEvent(f, 'SURGE') : `${f.name} surges with rage!` });
                    }
                }
            }
        };
        checkPreRoundBleed(this.f1, this.f2);
        checkPreRoundBleed(this.f2, this.f1);

        // Step 2: Exchanges
        let numExchanges = SimRounds.getExchangesPerRound(this.style);

        this.log({ type: 'ROUND_START', round: this.currentRoundNumber, text: `--- Round ${this.currentRoundNumber} --- (${attacker.name} takes initiative)` });

        let roundScore = { f1: 0, f2: 0 }; // internal points
        let consecutiveWins = { f1: 0, f2: 0 };

        for (let i = 0; i < numExchanges; i++) {
            if (this.f1.health <= 0 || this.f2.health <= 0) break; // KO/Sub logic
            let exchangeResult = SimRounds.resolveExchange(attacker, defender, this.style);

            let winnerId = exchangeResult.winner === this.f1 ? 'f1' : 'f2';
            let loserId = winnerId === 'f1' ? 'f2' : 'f1';
            let winnerObj = exchangeResult.winner;
            let loserObj = winnerObj === this.f1 ? this.f2 : this.f1;

            roundScore[winnerId]++;
            consecutiveWins[winnerId]++;
            consecutiveWins[loserId] = 0;

            if (exchangeResult.winner !== attacker) {
                [attacker, defender] = [defender, attacker];
            }

            this.log({ type: 'EXCHANGE', text: exchangeResult.text, damage: exchangeResult.damage });

            // Personality Bleed: Mid-Exchange Triggers
            if (winnerObj.personality.archetype === 'Showgirl' && roundScore[winnerId] > roundScore[loserId] && Math.random() < 0.20) {
                winnerObj.dominanceScore += 5;
                winnerObj.stamina -= 3;
                this.log({ type: 'EVENT', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateArchetypeEvent(winnerObj, 'SHOWBOAT') : `${winnerObj.name} showboats to the crowd!` });
            }
            if (winnerObj.personality.rivalry_style === 'Dominate' && consecutiveWins[winnerId] === 2) {
                loserObj.currentStats.composure -= 5;
                this.log({ type: 'EVENT', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateArchetypeEvent(winnerObj, 'SUSTAINED_PRESSURE', loserObj.name) : `${winnerObj.name} applies sustained pressure!` });
            }
            if (loserObj.personality.rivalry_style === 'Sabotage' && Math.random() < 0.10) {
                winnerObj.health -= 5;
                this.log({ type: 'EVENT', text: window.NarrativeGenerator ? window.NarrativeGenerator.generateArchetypeEvent(loserObj, 'DIRTY_MOVE', winnerObj.name) : `${loserObj.name} uses a dirty move!` });
            }
        }

        // Post exchange psych checks (Breakpoints, Tilt, etc.)
        if (window.SimPsychology) {
            window.SimPsychology.runPostRoundChecks(this.f1, this.f2, roundScore.f1 > roundScore.f2 ? this.f1 : this.f2, this.matchLog);
        }

        // Round Winner Determination
        let roundWinnerObj = roundScore.f1 > roundScore.f2 ? this.f1 : this.f2;
        if (roundScore.f1 === roundScore.f2) {
            roundWinnerObj = (this.f1.health > this.f2.health) ? this.f1 : this.f2; // edge case tie break
        }

        let rwId = roundWinnerObj === this.f1 ? 'f1' : 'f2';
        let loserId = rwId === 'f1' ? 'f2' : 'f1';

        // ** 1D. Momentum System Break **
        if (this.streak[loserId] >= 2) {
            this.log({ type: 'EVENT', text: `<strong>${roundWinnerObj.name}</strong> halts the momentum and gains a stamina boost!` });
            roundWinnerObj.stamina = Math.min(100, roundWinnerObj.stamina + 15);
        }

        this.roundsWon[rwId]++;
        this.streak[rwId]++;
        this.streak[loserId] = 0;

        this.log({ type: 'ROUND_END', round: this.currentRoundNumber, roundWinner: roundWinnerObj.name, scores: `${this.roundsWon.f1} - ${this.roundsWon.f2}` });

        // Stamina Recovery
        this.f1.stamina = Math.min(100, this.f1.stamina + 4);
        this.f2.stamina = Math.min(100, this.f2.stamina + 4);

        // Match win condition: First to 5
        if (this.roundsWon.f1 >= 5) { this.winner = this.f1; }
        else if (this.roundsWon.f2 >= 5) { this.winner = this.f2; }

        this.currentRoundNumber++;
        return this;
    }

    _calculateInitiative(f) {
        // (Speed x 0.4) + (Composure x 0.3) + (Aggression x 0.2) + (Form x 0.1) - Fatigue penalty
        return (f.currentStats.speed * 0.4) +
            (f.currentStats.composure * 0.3) +
            (f.currentStats.aggression * 0.2) +
            (f.dynamic.form * 0.1) -
            (f.dynamic.fatigue * 0.2); // simplified penalty
    }

    log(entry) {
        this.matchLog.push(entry);
    }
}

window.MatchSimulation = MatchSimulation;