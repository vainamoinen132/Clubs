/**
 * sim_rounds.js
 * Handlers for exchange resolution maths.
 */

window.SimRounds = {
    // Stat profiles based on style
    styleConstants: {
        'naked_wrestling': { primary: 'control', secondary: 'power', counter: 'power', healthMult: 0.6, staminaMult: 1.2, minExchanges: 2, maxExchanges: 3 },
        'boxing': { primary: 'technique', secondary: 'speed', counter: 'speed', healthMult: 1.0, staminaMult: 0.9, minExchanges: 4, maxExchanges: 6 },
        'catfight': { primary: 'aggression', secondary: 'power', counter: 'power', healthMult: 1.3, staminaMult: 1.1, minExchanges: 3, maxExchanges: 5 },
        'sexfight': { primary: 'composure', secondary: 'presence', counter: 'presence', healthMult: 0.3, staminaMult: 0.7, minExchanges: 2, maxExchanges: 4 }
    },

    getExchangesPerRound(style) {
        const c = this.styleConstants[style] || this.styleConstants['boxing'];
        return Math.floor(Math.random() * (c.maxExchanges - c.minExchanges + 1)) + c.minExchanges;
    },

    applyPreRoundModifiers(f, baseline, age) {
        // Reset to baseline + ongoing buffs/debuffs
        f.currentStats = JSON.parse(JSON.stringify(baseline));

        // Age Logic (Simulated here if not baked into originalStats for the match)
        // Stamina thresholds (<40 = -10 Speed/-8 Power. <20 = -20 Speed/-15 Power/-10 Composure)
        if (f.stamina < 40 && f.stamina >= 20) {
            f.currentStats.speed -= 10;
            f.currentStats.power -= 8;
        } else if (f.stamina < 20 && f.stamina > 0) {
            f.currentStats.speed -= 20;
            f.currentStats.power -= 15;
            f.currentStats.composure -= 10;
        } else if (f.stamina <= 0) {
            // Can't attack, stats heavily nerfed
            f.currentStats.speed -= 30;
            f.currentStats.power -= 30;
        }
    },

    resolveExchange(attacker, defender, style) {
        const constants = this.styleConstants[style] || this.styleConstants['boxing'];
        const p1Stats = attacker.currentStats;
        const p2Stats = defender.currentStats;

        const affinity = attacker.affinities[style] || 50;

        // Attacker score = (primary stat x 0.5) + (secondary stat x 0.3) + (Style Affinity x 0.2)
        let attackScore = (p1Stats[constants.primary] * 0.5) + (p1Stats[constants.secondary] * 0.3) + (affinity * 0.2);

        // Defender score = (Resilience x 0.4) + (Composure x 0.3) + (counter stat x 0.3)
        let defendScore = (p2Stats.resilience * 0.4) + (p2Stats.composure * 0.3) + (p2Stats[constants.counter] * 0.3);

        // Apply Stance Multipliers
        const applyStance = (score, isAtk, stance) => {
            let mult = 1.0;
            if (stance === 'aggressive') mult = isAtk ? 1.2 : 0.8;
            else if (stance === 'defensive') mult = isAtk ? 0.8 : 1.2;
            else if (stance === 'showboat') mult = 0.9;
            return score * mult;
        };

        attackScore = applyStance(attackScore, true, attacker.stance || 'balanced');
        defendScore = applyStance(defendScore, false, defender.stance || 'balanced');

        // Variance (-8 to +8)
        let delta = attackScore - defendScore + (Math.floor(Math.random() * 17) - 8);

        let result = { winner: null, damage: 0, healthLoss: 0, staminaLossAtt: 0, staminaLossDef: 0, text: "" };

        if (delta > 0) {
            // Attacker lands
            result.winner = attacker;
            let dmg = delta * constants.healthMult;
            let staDrain = 14 * constants.staminaMult; // base attack cost

            defender.health -= dmg;
            attacker.stamina -= staDrain;

            // Dominance scale and Showboat bonus
            let domGain = delta;
            if (attacker.stance === 'showboat') {
                domGain *= 1.15; // +15% dominance gain

                // Extra fame note (Fame is gained at the end of the match, but we can signal this via events)
                if (Math.random() < 0.2 && window.GameState.getClub(attacker.club_id)) {
                    window.GameState.fame += 5; // tiny micro-fame bump
                }
            }
            if (style === 'sexfight') domGain *= 1.5; // Sexfight builds dominance even faster

            attacker.dominanceScore = (attacker.dominanceScore || 0) + domGain;

            result.healthLoss = dmg;
            result.text = NarrativeGenerator ? NarrativeGenerator.generateHit(attacker, defender, style, delta) : `${attacker.name} lands a solid strike!`;

            // ── INJURY ROLL ───────────────────────────────────────────────────────
            // Scaled by how brutal the hit was. delta 16-22 = moderate chance,
            // delta 23-29 = high chance, delta 30+ = near-certain injury.
            let injuryThreshold = delta > 15;
            if (injuryThreshold) {
                // Probability scales with delta severity
                let injChance = delta > 29 ? 0.75 : delta > 22 ? 0.50 : 0.30;

                if (Math.random() < injChance) {
                    // Weighted injury table — heavier hits more likely to cause serious injuries
                    let injuryTable;
                    if (delta > 29) {
                        // Devastating — serious injuries dominate
                        injuryTable = [
                            { name: 'Concussion', duration: 3, severity: 'serious' },
                            { name: 'Rib Fracture', duration: 4, severity: 'serious' },
                            { name: 'Torn Quad', duration: 5, severity: 'serious' },
                            { name: 'Dislocated Shoulder', duration: 4, severity: 'serious' },
                            { name: 'Facial Fracture', duration: 3, severity: 'serious' },
                            { name: 'Broken Nose', duration: 2, severity: 'moderate' },
                            { name: 'Sprained Wrist', duration: 1, severity: 'minor' }
                        ];
                    } else if (delta > 22) {
                        injuryTable = [
                            { name: 'Broken Nose', duration: 2, severity: 'moderate' },
                            { name: 'Concussion', duration: 3, severity: 'serious' },
                            { name: 'Rib Fracture', duration: 4, severity: 'serious' },
                            { name: 'Sprained Wrist', duration: 1, severity: 'minor' },
                            { name: 'Bruised Ribs', duration: 2, severity: 'moderate' },
                            { name: 'Torn Quad', duration: 5, severity: 'serious' }
                        ];
                    } else {
                        injuryTable = [
                            { name: 'Sprained Wrist', duration: 1, severity: 'minor' },
                            { name: 'Sprained Ankle', duration: 1, severity: 'minor' },
                            { name: 'Broken Nose', duration: 2, severity: 'moderate' },
                            { name: 'Bruised Ribs', duration: 2, severity: 'moderate' },
                            { name: 'Concussion', duration: 3, severity: 'serious' }
                        ];
                    }

                    let inj = injuryTable[Math.floor(Math.random() * injuryTable.length)];
                    let realDefender = window.GameState.getFighter(defender.id);

                    if (realDefender) {
                        if (!realDefender.dynamic_state.injuries) realDefender.dynamic_state.injuries = [];

                        // Don't stack the same injury — but DO stack different ones on a brutal match
                        if (!realDefender.dynamic_state.injuries.find(i => i.name === inj.name)) {
                            realDefender.dynamic_state.injuries.push(inj);

                            // Serious injuries also permanently nick resilience/composure slightly
                            if (inj.severity === 'serious') {
                                realDefender.core_stats.resilience = Math.max(1, (realDefender.core_stats.resilience || 50) - 1);
                                realDefender.dynamic_state.stress = Math.min(100, (realDefender.dynamic_state.stress || 0) + 15);
                            } else if (inj.severity === 'moderate') {
                                realDefender.dynamic_state.stress = Math.min(100, (realDefender.dynamic_state.stress || 0) + 8);
                            }

                            let injColor = inj.severity === 'serious' ? '#ff1744' : inj.severity === 'moderate' ? '#ff6d00' : '#ffab00';
                            result.text += `<br/><span style="color:${injColor}; font-weight:bold;">💀 [INJURY] ${defender.name} suffers a ${inj.name}! (Out ${inj.duration} week${inj.duration > 1 ? 's' : ''})</span>`;
                        }
                    }
                }
            }
        } else {
            // Defender neutralizes
            result.winner = defender;
            let staDrain = 9 * constants.staminaMult; // reduced cost for getting blocked
            attacker.stamina -= staDrain;

            result.text = NarrativeGenerator ? NarrativeGenerator.generateBlock(attacker, defender, style) : `${defender.name} completely neutralizes the attack.`;
        }

        return result;
    }
};