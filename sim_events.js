/**
 * sim_events.js
 * Analyzes weekly simulation data and injects random dynamic events.
 */

window.SimEvents = {
    generateWeeklyEvents() {
        const gs = window.GameState;
        console.log("Generating Weekly Dynamic Events...");

        // 1. Process Sponsorship Incomes
        this._processEconomy(gs);

        // 2. Roll random dynamic events for player club
        this._rollRandomEvents(gs);
    },

    _processEconomy(gs) {
        let playerClub = gs.clubs[gs.playerClubId];
        if (!playerClub) return;

        let sponsorTier = playerClub.sponsor || 'bronze';
        let income = 0;

        let prLevel = playerClub.facilities?.pr || 1;
        let prMult = 1 + (prLevel * 0.15);

        if (sponsorTier === 'bronze') {
            income = 10000 * prMult;
        } else if (sponsorTier === 'silver') {
            let totalWinStreaks = 0;
            playerClub.fighter_ids.forEach(id => {
                let f = gs.getFighter(id);
                if (f && f.dynamic_state.win_streak > 0) {
                    totalWinStreaks += f.dynamic_state.win_streak;
                }
            });
            income = (5000 + (totalWinStreaks * 2000)) * prMult;
        } else if (sponsorTier === 'gold') {
            income = (gs.fame * 2.5) * prMult;
        }

        income = Math.floor(income);
        gs.money += income;

        if (window.UIClub) {
            console.log(`Club earned $${income.toLocaleString()} this week from sponsorships!`);
        }
    },

    _rollRandomEvents(gs) {
        let playerClub = gs.clubs[gs.playerClubId];
        if (!playerClub) return;

        // 15% chance of a random event each week
        if (Math.random() < 0.15) {
            let fighterId = playerClub.fighter_ids[Math.floor(Math.random() * playerClub.fighter_ids.length)];
            let fighter = gs.getFighter(fighterId);
            if (!fighter) return;

            const events = [
                {
                    title: "Minor Injury in Training",
                    effect: () => { fighter.dynamic_state.fatigue += 30; fighter.dynamic_state.morale -= 10; },
                    desc: `${fighter.name} suffered a minor tweak during sparring. Fatigue increased heavily.`
                },
                {
                    title: "Viral Sensation",
                    effect: () => { gs.fame += 1000; fighter.dynamic_state.morale += 15; },
                    desc: `A clip of ${fighter.name} went viral on social media! Fame +1000.`
                },
                {
                    title: "Locker Room Drama",
                    effect: () => { fighter.dynamic_state.stress += 20; fighter.core_stats.composure -= 2; },
                    desc: `${fighter.name} got into a heated argument with a teammate. Stress +20, Composure drop.`
                },
                {
                    title: "Locker Room Incident",
                    effect: () => {
                        let potentialTargets = playerClub.fighter_ids.filter(id => id !== fighter.id);
                        if (potentialTargets.length > 0) {
                            let tId = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                            let t = gs.getFighter(tId);
                            if (t && window.RelationshipEngine) {
                                window.RelationshipEngine.addTension(fighter.id, t.id, 8, "Locker room incident.");
                                fighter.dynamic_state.morale -= 5;
                                t.dynamic_state.morale -= 5;
                            }
                        }
                    },
                    desc: `Tension bubbles over in the locker room between ${fighter.name} and a teammate.`
                },
                {
                    title: "Cross-Club Drama",
                    effect: () => {
                        let otherClubs = Object.values(gs.clubs).filter(c => c.id !== playerClub.id && c.fighter_ids.length > 0);
                        if (otherClubs.length > 0) {
                            let oc = otherClubs[Math.floor(Math.random() * otherClubs.length)];
                            let targetId = oc.fighter_ids[Math.floor(Math.random() * oc.fighter_ids.length)];
                            let t = gs.getFighter(targetId);
                            if (t && window.RelationshipEngine) {
                                window.RelationshipEngine.addTension(fighter.id, t.id, 15, "Public confrontation on social media.");
                                gs.fame += 250;
                            }
                        }
                    },
                    desc: `${fighter.name} got into a massive, highly public Twitter war with a fighter from another club! Fame +250, Tension spikes.`
                }
            ];

            let ev = events[Math.floor(Math.random() * events.length)];
            ev.effect();

            // Log other events too
            if (ev.title !== "Locker Room Incident") {
                window.GameState.addNews('club', `${fighter.name}: ${ev.title}.`);
            }

            // Just native alert for now so player actually sees it when clicking Advance Week
            if (ev.title !== "Locker Room Incident") {
                setTimeout(() => {
                    if (window.UIComponents && window.UIComponents.showModal) {
                        window.UIComponents.showModal(ev.title, ev.desc, ev.title.includes('Injury') ? 'danger' : 'info');
                    } else {
                        alert(`Dynamic Event: ${ev.title}\n\n${ev.desc}`);
                    }
                }, 500);
            }
        }
    },

    processPostMatch(winnerId, loserId, roundDiff, matchStyle) {
        const gs = window.GameState;
        let w = gs.getFighter(winnerId);
        let l = gs.getFighter(loserId);

        if (window.RelationshipEngine) {
            window.RelationshipEngine.hookIntoMatchResult(winnerId, loserId);
        }

        // roundDiff: 0-1 = close, 2-3 = clear, 4 = dominant, 5 = whitewash
        let diff = roundDiff ?? 0;
        let isBlowout = diff >= 4; // 5-1 or 5-0 scoreline
        let isDominant = diff >= 2; // 5-2 or 5-3

        if (w) {
            w.dynamic_state.wins = (w.dynamic_state.wins || 0) + 1;
            w.dynamic_state.win_streak = (w.dynamic_state.win_streak || 0) + 1;

            // Win Bonus Payout
            if (w.club_id === gs.playerClubId && w.contract) {
                let prize = Math.floor(Math.random() * 3000) + 3000;
                gs.money += prize;
                gs.money -= w.contract.win_bonus;
                gs.addNews('finance', `Earned $${prize.toLocaleString()} prize money, but paid $${w.contract.win_bonus} win bonus to ${w.name}.`);
            }

            // Winner takes moderate fatigue regardless; less in a blowout (didn't have to work as hard)
            w.dynamic_state.fatigue = Math.min(100, (w.dynamic_state.fatigue || 0) + (isBlowout ? 10 : 18));

            // Ego
            if (w.dynamic_state.win_streak >= 3) {
                w.dynamic_state.ego = 'High';
                // Specific Style Growth
                if (matchStyle && w.style_affinities && w.style_affinities[matchStyle] !== undefined) {
                    let ceiling = w.potential || 80;
                    if (w.style_affinities[matchStyle] < ceiling) {
                        w.style_affinities[matchStyle] = Math.min(ceiling, w.style_affinities[matchStyle] + (isBlowout ? 2.0 : 1.0));
                    }
                }
            }
        }

        if (l) {
            l.dynamic_state.losses = (l.dynamic_state.losses || 0) + 1;
            l.dynamic_state.win_streak = 0;
            l.dynamic_state.ego = 'Normal';

            // ── LOSER CONSEQUENCES — SCALED BY MATCH BRUTALITY ──────────────

            // Fatigue: brutal matches exhaust the loser heavily
            let fatigueDamage = isBlowout ? 40 : isDominant ? 25 : 12;
            l.dynamic_state.fatigue = Math.min(100, (l.dynamic_state.fatigue || 0) + fatigueDamage);

            // Morale: proportional to how badly she was beaten
            let moraleDamage = isBlowout ? 35 : isDominant ? 20 : 10;
            l.dynamic_state.morale = Math.max(0, (l.dynamic_state.morale || 50) - moraleDamage);

            // Stress: absorbing punishment is psychologically costly
            let stressDamage = isBlowout ? 30 : isDominant ? 18 : 8;
            l.dynamic_state.stress = Math.min(100, (l.dynamic_state.stress || 0) + stressDamage);

            // Composure chip: getting dominated erodes mental fortitude over time
            if (isBlowout) {
                l.core_stats.composure = Math.max(1, (l.core_stats.composure || 50) - 2);
                l.core_stats.resilience = Math.max(1, (l.core_stats.resilience || 50) - 1);
                gs.addNews('club', `${l.name} was badly beaten — her composure and resilience have taken a lasting hit.`);
            } else if (isDominant) {
                l.core_stats.composure = Math.max(1, (l.core_stats.composure || 50) - 1);
            }

            // Psychological scarring: blowout losses carry a recovery penalty flag
            // (Used by the weekly recovery pass to slow her fatigue/stress healing)
            if (isBlowout) {
                l.dynamic_state.scarred_weeks = 2; // heals 50% slower for 2 weeks
            }

            // Specific Style Growth (Loser learns a bit too)
            if (matchStyle && l.style_affinities && l.style_affinities[matchStyle] !== undefined) {
                let ceiling = l.potential || 80;
                if (l.style_affinities[matchStyle] < ceiling) {
                    l.style_affinities[matchStyle] = Math.min(ceiling, l.style_affinities[matchStyle] + 0.5);
                }
            }
        }
    },

    triggerFinancialCrisis() {
        const gs = window.GameState;
        let playerClub = gs.getClub(gs.playerClubId);

        if (!playerClub.fighter_ids || playerClub.fighter_ids.length === 0) {
            // Can't sell if empty, just reset counter to delay game over
            gs.financial_crisis_weeks = 0;
            return;
        }

        // Find lowest rated fighter
        let lowestFighter = null;
        let lowestOvr = 999;

        playerClub.fighter_ids.forEach(id => {
            let f = gs.getFighter(id);
            if (f) {
                let ovr = Math.round((f.core_stats.power + f.core_stats.technique + f.core_stats.speed) / 3);
                if (ovr < lowestOvr) {
                    lowestOvr = ovr;
                    lowestFighter = f;
                }
            }
        });

        if (lowestFighter) {
            let salePrice = (lowestOvr * 200) + ((lowestFighter.dynamic_state.fame || 0) * 0.3);
            playerClub.fighter_ids = playerClub.fighter_ids.filter(id => id !== lowestFighter.id);
            lowestFighter.club_id = null;
            lowestFighter.contract.happiness = 50; // reset
            gs.transferPool.push(lowestFighter.id);
            gs.money += salePrice;

            gs.financial_crisis_weeks = 0; // Reset after forced sale

            let crisisText = `Your club has been operating in extreme debt for 3 consecutive weeks. The league has stepped in and seized the contract of ${lowestFighter.name}, liquidating it for $${Math.floor(salePrice).toLocaleString()} to cover your outstanding liabilities.`;

            gs.addNews('club', `FINANCIAL CRISIS: Forced sale of ${lowestFighter.name} to cover debts.`);

            if (window.UIComponents && window.UIComponents.showModal) {
                window.UIComponents.showModal("FINANCIAL CRISIS", crisisText, "danger");
            } else {
                alert(`FINANCIAL CRISIS\n\n${crisisText}`);
            }
        }
    }
};

// Hook into AI engine
if (window.AIEngine && window.AIEngine._advanceTime) {
    const originalAdvance = window.AIEngine._advanceTime;
    window.AIEngine._advanceTime = function () {
        // Run events before saving
        if (window.SimEvents) window.SimEvents.generateWeeklyEvents();
        originalAdvance.apply(this);
    };
}