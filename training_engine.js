/**
 * training_engine.js
 * FM-style passive training system.
 * Called once per week from ai_engine._advanceTime().
 *
 * - Reads gs.trainingIntensity (1–10) for team-wide intensity
 * - Reads fighter.training_focus per fighter
 * - Applies gains capped by fighter.potential (PA)
 * - Logs results to gs.trainingReport for the UI
 */

window.TrainingEngine = {

    // ── INTENSITY TABLE ───────────────────────────────────────────────────────
    // [minGain, maxGain, baseFatigue, injuryChancePct]
    _intensityTable: {
        1: { minG: 0, maxG: 0, fatigue: -20, injPct: 0.0 },  // Rest Week
        2: { minG: 0, maxG: 1, fatigue: 5, injPct: 0.5 },
        3: { minG: 0, maxG: 1, fatigue: 8, injPct: 0.5 },
        4: { minG: 1, maxG: 2, fatigue: 10, injPct: 1.0 },
        5: { minG: 1, maxG: 2, fatigue: 12, injPct: 2.0 },
        6: { minG: 1, maxG: 3, fatigue: 15, injPct: 2.5 },
        7: { minG: 2, maxG: 3, fatigue: 18, injPct: 5.0 },
        8: { minG: 2, maxG: 4, fatigue: 22, injPct: 6.0 },
        9: { minG: 3, maxG: 4, fatigue: 28, injPct: 10.0 },
        10: { minG: 3, maxG: 5, fatigue: 32, injPct: 14.0 }
    },

    // ── FOCUS STAT POOLS ─────────────────────────────────────────────────────
    _focusPools: {
        general: ['power', 'technique', 'speed', 'control', 'endurance', 'resilience', 'composure', 'aggression', 'presence'],
        power: ['power', 'aggression'],
        speed: ['speed', 'endurance'],
        technique: ['technique', 'control', 'composure'],
        resilience: ['resilience', 'endurance'],
        mental: ['composure', 'presence', 'aggression'],
        rest: [] // no gains, fatigue bonus instead
    },

    // ── MAIN WEEKLY TICK ─────────────────────────────────────────────────────
    processWeeklyTraining() {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        const intensity = Math.max(1, Math.min(10, gs.trainingIntensity || 5));
        const tbl = this._intensityTable[intensity];

        // Facility multipliers
        const gymLevel = club.facilities?.gym || 1;
        const gymMult = [1.0, 1.0, 1.2, 1.4, 1.7][Math.min(gymLevel, 4)];
        const recLevel = club.facilities?.recovery || 1;
        const recMult = [1.0, 1.0, 0.85, 0.70, 0.55][Math.min(recLevel, 4)];

        // Staff bonus
        let staffBonus = 0;
        if (club.staff) {
            const hcId = club.staff['head_coach'];
            if (hcId && gs.staff[hcId]?.passive_bonus?.all_training_gain) {
                staffBonus += gs.staff[hcId].passive_bonus.all_training_gain;
            }
        }

        // Reset this week's report for player club fighters
        gs.trainingReport = gs.trainingReport || {};
        club.fighter_ids.forEach(id => { gs.trainingReport[id] = []; });

        club.fighter_ids.forEach(fId => {
            const f = gs.getFighter(fId);
            if (!f) return;

            const focus = f.training_focus || 'general';

            // ── REST FOCUS ──
            if (focus === 'rest') {
                f.dynamic_state.fatigue = Math.max(0, f.dynamic_state.fatigue - 18);
                gs.trainingReport[fId].push({ stat: '😴 Rest', gain: 0, note: '−18 Fatigue (Rest Focus)' });
                return;
            }

            // ── INTENSITY 1 = REST WEEK ──
            if (intensity === 1) {
                f.dynamic_state.fatigue = Math.max(0, f.dynamic_state.fatigue + tbl.fatigue); // tbl.fatigue is -20
                gs.trainingReport[fId].push({ stat: '😴 Rest Week', gain: 0, note: '−20 Fatigue (Team Rest Week)' });
                return;
            }

            // ── FATIGUE EFFECTIVENESS ──
            const fat = f.dynamic_state.fatigue;
            let effMult = fat <= 30 ? 1.0 : fat <= 60 ? 0.65 : fat <= 80 ? 0.30 : 0.05;

            // ── EGO PENALTY ──
            if (f.dynamic_state.ego === 'High') effMult *= 0.5;

            // ── PICK STATS FROM FOCUS POOL ──
            const pool = this._focusPools[focus] || this._focusPools.general;
            const numStats = intensity >= 7 ? 2 : 1;
            const shuffled = pool.slice().sort(() => Math.random() - 0.5);
            const chosen = shuffled.slice(0, numStats);

            const pa = f.potential || f.natural_ceiling || 80;

            chosen.forEach(stat => {
                const current = f.core_stats[stat] || 0;
                const headroom = pa - current;
                if (headroom <= 0) {
                    gs.trainingReport[fId].push({ stat, gain: 0, note: 'At Potential Ceiling' });
                    return;
                }

                // headroom multiplier: drops toward 0.05 as you near the ceiling
                const headMult = Math.max(0.05, Math.min(1.0, headroom / 25));

                const rawMin = tbl.minG;
                const rawMax = tbl.maxG;
                let raw = (rawMin + Math.random() * (rawMax - rawMin)) * 0.25; // Scale down base gains to 25%

                let gain = raw * effMult * gymMult * headMult + (staffBonus * 0.25); // Also scale down staff bonus slightly

                // We want to accumulate fractional gains rather than strictly rounding to avoid 0 
                // However, since stats are integers in the game, we will represent the probability of gaining 1 point.
                let actualGain = 0;
                if (gain >= 1) {
                    actualGain = Math.floor(gain);
                    gain -= actualGain;
                }
                if (Math.random() < gain) actualGain += 1;

                actualGain = Math.max(0, Math.min(actualGain, headroom));

                f.core_stats[stat] = Math.min(pa, current + actualGain);
                if (actualGain > 0) gs.trainingReport[fId].push({ stat, gain: actualGain });
            });

            // ── FATIGUE ──
            const fatigueAdd = Math.round(tbl.fatigue * recMult);
            f.dynamic_state.fatigue = Math.max(0, Math.min(100, f.dynamic_state.fatigue + fatigueAdd));

            // ── INJURY ROLL ──
            if (f.dynamic_state.fatigue > 75) {
                const injRoll = Math.random() * 100;
                if (injRoll < tbl.injPct) {
                    this._inflictTrainingInjury(f, gs);
                }
            }
        });
    },

    _inflictTrainingInjury(f, gs) {
        const injuries = [
            { name: 'Muscle Strain', duration: 1, severity: 'Minor' },
            { name: 'Sprained Wrist', duration: 2, severity: 'Minor' },
            { name: 'Hamstring Pull', duration: 2, severity: 'Moderate' },
            { name: 'Rib Bruising', duration: 3, severity: 'Moderate' }
        ];
        const inj = injuries[Math.floor(Math.random() * injuries.length)];
        if (!f.dynamic_state.injuries) f.dynamic_state.injuries = [];
        f.dynamic_state.injuries.push({ ...inj });
        f.dynamic_state.stress = Math.min(100, (f.dynamic_state.stress || 0) + 20);
        gs.addNews('injury', `⚠️ ${f.name} picked up a ${inj.name} (${inj.severity}) in training — ${inj.duration} week(s) out.`);
        gs.trainingReport[f.id] = gs.trainingReport[f.id] || [];
        gs.trainingReport[f.id].push({ stat: '🩹 Injury', gain: 0, note: `${inj.name} — ${inj.duration}wk` });
    }
};
