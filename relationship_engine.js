/**
 * relationship_engine.js
 * Full relationship lifecycle with exclusivity, cheating, and consequences.
 *
 * Relationship Types (in order of intensity):
 *   neutral → aware → awareness_plus → friction | attraction
 *   → rivalry | mentor | best_friends
 *   → committed (exclusive romantic, one per fighter)
 *   → obsession (committed + tension 95+)
 *   → bitter_rivals (dominant pair, no romance)
 *
 * Key Fields on fighter.dynamic_state:
 *   primary_partner_id  — ID of exclusive romantic partner (null if single)
 *   best_friend_id      — ID of best friend (null if none)
 *   cheated_by          — ID of partner who cheated (cleared after confrontation fires)
 *   cheat_target_id     — ID of the third party the cheater is pursuing
 *   cheat_slow_burn     — weeks of suppressed attraction while cheater is committed
 */

window.RelationshipEngine = {

    // ── MAIN ENTRY POINT ─────────────────────────────────────────────────────
    addTension(fighter1Id, fighter2Id, amount, eventDescription) {
        const gs = window.GameState;
        let f1 = gs.getFighter(fighter1Id);
        let f2 = gs.getFighter(fighter2Id);
        if (!f1 || !f2) return;

        let r1 = this._getOrInitRelation(f1, fighter2Id);
        let r2 = this._getOrInitRelation(f2, fighter1Id);

        r1.tension = Math.min(100, r1.tension + amount);
        r2.tension = Math.min(100, r2.tension + amount);

        let logStr = `Week ${gs.week}, S${gs.currentSeason || 1}: ${eventDescription}`;
        r1.history.push(logStr);
        r2.history.push(logStr);

        r1.last_interaction_week = gs.week;
        r2.last_interaction_week = gs.week;

        // Resolve types — respecting exclusivity
        let newType1 = this.resolveType(f1, f2, r1.tension);
        let newType2 = this.resolveType(f2, f1, r2.tension);

        r1.type = newType1;
        r2.type = newType2;

        // Apply exclusivity side-effects (sets primary_partner_id / best_friend_id)
        this._applyExclusivity(f1, f2, r1);
        this._applyExclusivity(f2, f1, r2);

        // Cheating slow-burn check
        this._checkCheatingTrigger(f1, f2, r1, r2);

        // Milestone system
        let mTarget = null;
        if (r1.tension >= 95) mTarget = 5;
        else if (r1.tension >= 75) mTarget = 4;
        else if (r1.tension >= 55) mTarget = 3;
        else if (r1.tension >= 35) mTarget = 2;
        else if (r1.tension >= 20) mTarget = 1;

        if (mTarget !== null && r1.milestone_reached < mTarget) {
            r1.milestone_reached = mTarget;
            r2.milestone_reached = mTarget;

            if (f1.club_id === gs.playerClubId || f2.club_id === gs.playerClubId) {
                gs.pendingMilestones = gs.pendingMilestones || [];
                gs.pendingMilestones.push({ f1: fighter1Id, f2: fighter2Id, milestone: mTarget });
            }
        }
    },

    // ── TYPE RESOLUTION ────────────────────────────────────────────────────────
    resolveType(fighter, otherFighter, tension) {
        const arch = fighter.personality?.archetype || 'Underdog';
        const dHunger = fighter.personality?.dominance_hunger || 50;
        const sLean = fighter.personality?.submissive_lean || 50;
        const otherArch = otherFighter.personality?.archetype || 'Underdog';
        const otherDHunger = otherFighter.personality?.dominance_hunger || 50;
        const otherSLean = otherFighter.personality?.submissive_lean || 50;

        if (tension < 20) return 'neutral';
        if (tension < 35) return 'aware';

        if (tension < 55) {
            // Friction vs attraction split
            if (arch === 'Alpha' || arch === 'Rebel') return 'friction';
            if (dHunger > 70 && otherDHunger > 70) return 'friction';
            return 'attraction';
        }

        if (tension < 75) {
            // Rivalry, mentor, or best_friends
            if (dHunger > 70 && otherDHunger > 70) return 'rivalry';
            if (arch === 'Ice Queen' && otherArch === 'Alpha') return 'rivalry';
            if (arch === 'Rebel' && otherArch === 'Rebel') return 'rivalry';
            // Mentor bond: Technician/Alpha → Underdog/Showboat
            if ((arch === 'Technician' || arch === 'Alpha') &&
                (otherArch === 'Underdog' || otherArch === 'Showboat') &&
                dHunger < 70) return 'mentor';
            // Best friend: similar archetypes, neither hugely dominant
            if (arch === otherArch && dHunger < 65 && otherDHunger < 65) return 'best_friends';
            // Submissive lean → attraction deepens
            if (sLean > 55 || otherSLean > 55) return 'attraction';
            return 'rivalry';
        }

        // Tension 75+: committed or bitter rivals
        // Both highly dominant → never lovers, always bitter rivals
        if (dHunger > 75 && otherDHunger > 75) return 'bitter_rivals';
        if (arch === 'Rebel' && otherArch === 'Rebel') return 'bitter_rivals';

        // Best-friends can deepen into committed at this point
        // (handled in _applyExclusivity / _checkCheatingTrigger)

        // Exclusivity check — if already committed to SOMEONE ELSE, cap at attraction
        const existingPartner = fighter.dynamic_state?.primary_partner_id;
        if (existingPartner && existingPartner !== otherFighter.id) {
            // Already committed elsewhere — slow burn / cheat zone
            return 'attraction'; // Capped. _checkCheatingTrigger handles the rest.
        }

        // Obsession threshold
        if (tension >= 95 && dHunger > 80 && otherSLean > 60) return 'obsession';

        return 'committed';
    },

    // ── EXCLUSIVITY APPLICATION ────────────────────────────────────────────────
    // Sets primary_partner_id / best_friend_id when type transitions
    _applyExclusivity(fighter, other, rel) {
        const ds = fighter.dynamic_state;
        if (!ds) return;

        if (rel.type === 'committed' || rel.type === 'obsession') {
            // Set primary partner only if not already set to someone else
            if (!ds.primary_partner_id || ds.primary_partner_id === other.id) {
                ds.primary_partner_id = other.id;
            }
        } else if (rel.type === 'best_friends') {
            if (!ds.best_friend_id || ds.best_friend_id === other.id) {
                ds.best_friend_id = other.id;
            }
        }

        // If relationship has broken (moved away from committed), clear the partner link
        // Only clear if the type fell below committed and the partner IS the one stored
        if (rel.type !== 'committed' && rel.type !== 'obsession') {
            if (ds.primary_partner_id === other.id) {
                // Don't auto-clear here — only clear on explicit breakup / cheat resolution
            }
        }
    },

    // ── CHEATING SLOW-BURN SYSTEM ─────────────────────────────────────────────
    _checkCheatingTrigger(f1, f2, r1, r2) {
        const gs = window.GameState;

        // Run for each direction
        this._checkOneSidedCheat(f1, f2, r1, gs);
        this._checkOneSidedCheat(f2, f1, r2, gs);
    },

    _checkOneSidedCheat(cheater, target, rel, gs) {
        const ds = cheater.dynamic_state;
        if (!ds) return;

        const existingPartnerId = ds.primary_partner_id;

        // Only trigger if: cheater has a committed partner AND attraction to someone else
        if (!existingPartnerId || existingPartnerId === target.id) return;
        if (!['attraction', 'committed'].includes(rel.type)) return;
        if (rel.tension < 55) return; // Not pulled hard enough yet

        const existingPartner = gs.getFighter(existingPartnerId);
        if (!existingPartner) return;

        // Slow-burn counter
        if (!ds.cheat_slow_burn) ds.cheat_slow_burn = 0;
        if (ds.cheat_target_id !== target.id) {
            ds.cheat_target_id = target.id;
            ds.cheat_slow_burn = 0;
        }
        ds.cheat_slow_burn++;

        // Phase 1 — subtle news hint (slow-burn week 2)
        if (ds.cheat_slow_burn === 2) {
            gs.addNews('relationships',
                `👀 Word is spreading... something is brewing between ${cheater.name} and ${target.name}, ` +
                `despite ${cheater.name}'s commitment to ${existingPartner.name}.`
            );
        }

        // Phase 2 — discovery + confrontation (slow-burn week 4+)
        if (ds.cheat_slow_burn >= 4 && !ds.cheated_by) {
            this._fireCheatDiscovery(cheater, existingPartner, target, gs);
        }
    },

    _fireCheatDiscovery(cheater, betrayed, newTarget, gs) {
        // Mark the betrayed partner
        if (!betrayed.dynamic_state) betrayed.dynamic_state = {};
        betrayed.dynamic_state.cheated_by = cheater.id;

        // Immediate emotional impact
        betrayed.dynamic_state.morale = Math.max(0, (betrayed.dynamic_state.morale || 50) - 30);
        betrayed.dynamic_state.stress = Math.min(100, (betrayed.dynamic_state.stress || 20) + 25);
        cheater.dynamic_state.stress = Math.min(100, (cheater.dynamic_state.stress || 20) + 20);

        // News
        gs.addNews('relationships',
            `💔 BETRAYAL — ${betrayed.name} has discovered that ${cheater.name} has been pursuing ` +
            `${newTarget.name} behind her back. The locker room is in shock.`
        );

        // Queue confrontation milestone
        gs.pendingMilestones = gs.pendingMilestones || [];
        gs.pendingMilestones.push({
            type: 'BETRAYAL_CONFRONTATION',
            betrayedId: betrayed.id,
            cheaterId: cheater.id,
            newPartnerId: newTarget.id
        });
    },

    // ── CONFRONTATION RESOLUTION ──────────────────────────────────────────────
    // Called when the player resolves a BETRAYAL_CONFRONTATION event.
    // mode: 'fight' | 'part_ways'
    resolveConfrontation(betrayedId, cheaterId, newPartnerId, mode) {
        const gs = window.GameState;
        const betrayed = gs.getFighter(betrayedId);
        const cheater = gs.getFighter(cheaterId);
        const newPartner = gs.getFighter(newPartnerId);
        if (!betrayed || !cheater) return;

        // Clear cheat state
        if (betrayed.dynamic_state) betrayed.dynamic_state.cheated_by = null;
        if (cheater.dynamic_state) {
            cheater.dynamic_state.cheat_slow_burn = 0;
            cheater.dynamic_state.cheat_target_id = null;
        }

        if (mode === 'fight') {
            // Sim match is run by the UI layer. Here we just set up the relationship aftermath.
            // Win/loss is resolved in the post-confrontation-match callback.
            gs.addNews('relationships',
                `⚔️ CONFRONTATION — ${betrayed.name} has demanded satisfaction from ${cheater.name}. ` +
                `A match has been arranged behind closed doors.`
            );
        } else {
            // They split without fighting — each goes their own way
            this._breakUpCouple(cheater, betrayed);
            if (newPartner) this._formCouple(cheater, newPartner);

            betrayed.dynamic_state.morale = Math.max(0, (betrayed.dynamic_state.morale || 50) - 15);
            gs.addNews('relationships',
                `💔 ${betrayed.name} and ${cheater.name} have ended their relationship. ` +
                (newPartner ? `${cheater.name} and ${newPartner.name} are now together.` : '')
            );
        }
    },

    // Called AFTER the confrontation match concludes.
    // winner: fighter object who won the match
    resolveConfrontationMatch(betrayedId, cheaterId, newPartnerId, winnerId) {
        const gs = window.GameState;
        const betrayed = gs.getFighter(betrayedId);
        const cheater = gs.getFighter(cheaterId);
        const newPartner = newPartnerId ? gs.getFighter(newPartnerId) : null;

        if (!betrayed || !cheater) return;

        if (winnerId === betrayedId) {
            // Betrayed fighter wins — cheater is humiliated, comes back
            this._breakUpCheatRelationship(cheater, newPartner);
            this._formCouple(cheater, betrayed); // Reconcile

            cheater.dynamic_state.morale = Math.max(0, (cheater.dynamic_state.morale || 50) - 30);
            betrayed.dynamic_state.morale = Math.min(100, (betrayed.dynamic_state.morale || 50) + 20);

            // Set bitter_rivals between cheater and new target
            if (newPartner) {
                const rc = this._getOrInitRelation(cheater, newPartner.id);
                const rn = this._getOrInitRelation(newPartner, cheater.id);
                rc.type = 'bitter_rivals'; rn.type = 'bitter_rivals';
            }

            gs.addNews('relationships',
                `🏆 ${betrayed.name} defeated ${cheater.name} in their confrontation. ` +
                `${cheater.name} has returned, humiliated and apologetic.`
            );
        } else {
            // Cheater wins — breaks free, stays with new partner
            this._breakUpCouple(cheater, betrayed);
            if (newPartner) this._formCouple(cheater, newPartner);

            const rBetrayedCheater = this._getOrInitRelation(betrayed, cheater.id);
            rBetrayedCheater.type = 'bitter_rivals';
            const rCheaterBetrayed = this._getOrInitRelation(cheater, betrayed.id);
            rCheaterBetrayed.type = 'bitter_rivals';

            betrayed.dynamic_state.morale = Math.max(0, (betrayed.dynamic_state.morale || 50) - 25);
            betrayed.dynamic_state.stress = Math.min(100, (betrayed.dynamic_state.stress || 20) + 20);

            gs.addNews('relationships',
                `💔 ${cheater.name} defeated ${betrayed.name} in their confrontation and has left for ${newPartner?.name || 'someone new'}. ` +
                `${betrayed.name} is left devastated.`
            );
        }
    },

    // ── COUPLE / BREAKUP HELPERS ──────────────────────────────────────────────
    _formCouple(f1, f2) {
        if (!f1.dynamic_state) f1.dynamic_state = {};
        if (!f2.dynamic_state) f2.dynamic_state = {};
        f1.dynamic_state.primary_partner_id = f2.id;
        f2.dynamic_state.primary_partner_id = f1.id;

        const r1 = this._getOrInitRelation(f1, f2.id);
        const r2 = this._getOrInitRelation(f2, f1.id);
        r1.type = 'committed'; r2.type = 'committed';
        r1.tension = Math.max(r1.tension, 76);
        r2.tension = Math.max(r2.tension, 76);
    },

    _breakUpCouple(f1, f2) {
        if (!f2) return;
        if (f1.dynamic_state?.primary_partner_id === f2.id) f1.dynamic_state.primary_partner_id = null;
        if (f2.dynamic_state?.primary_partner_id === f1.id) f2.dynamic_state.primary_partner_id = null;
    },

    _breakUpCheatRelationship(cheater, newTarget) {
        if (!newTarget) return;
        this._breakUpCouple(cheater, newTarget);
        const rc = this._getOrInitRelation(cheater, newTarget.id);
        const rn = this._getOrInitRelation(newTarget, cheater.id);
        rc.type = 'friction'; rn.type = 'friction';
    },

    // ── BEST FRIEND SYSTEM ─────────────────────────────────────────────────────
    _applyBestFriend(f1, f2) {
        if (!f1.dynamic_state) f1.dynamic_state = {};
        if (!f2.dynamic_state) f2.dynamic_state = {};
        if (!f1.dynamic_state.best_friend_id) f1.dynamic_state.best_friend_id = f2.id;
        if (!f2.dynamic_state.best_friend_id) f2.dynamic_state.best_friend_id = f1.id;
    },

    // Weekly passive morale bonus for best friends + partners in same club
    applyWeeklyBonds(clubId) {
        const gs = window.GameState;
        const club = gs.getClub(clubId);
        if (!club || !club.fighter_ids) return;

        club.fighter_ids.forEach(fId => {
            const f = gs.getFighter(fId);
            if (!f || !f.dynamic_state) return;

            // Best friend bonus
            const bfId = f.dynamic_state.best_friend_id;
            if (bfId && club.fighter_ids.includes(bfId)) {
                f.dynamic_state.morale = Math.min(100, (f.dynamic_state.morale || 50) + 5);
            }

            // Partner bonus (committed relationship in same club)
            const ppId = f.dynamic_state.primary_partner_id;
            if (ppId && club.fighter_ids.includes(ppId)) {
                f.dynamic_state.morale = Math.min(100, (f.dynamic_state.morale || 50) + 3);
            }

            // Best friend injured penalty
            if (bfId) {
                const bf = gs.getFighter(bfId);
                if (bf && bf.dynamic_state?.injuries?.length > 0) {
                    f.dynamic_state.stress = Math.min(100, (f.dynamic_state.stress || 20) + 2);
                }
            }
        });
    },

    // ── MATCH HOOKS ───────────────────────────────────────────────────────────
    hookIntoMatchResult(winnerId, loserId) {
        const gs = window.GameState;
        let fW = gs.getFighter(winnerId);
        let fL = gs.getFighter(loserId);
        if (!fW || !fL) return;

        let rW = this._getOrInitRelation(fW, loserId);

        if (rW.type === 'bitter_rivals') {
            fW.dynamic_state.morale = Math.min(100, (fW.dynamic_state.morale || 50) + 15);
            fL.dynamic_state.stress = Math.min(100, (fL.dynamic_state.stress || 20) + 20);
        } else if (rW.type === 'obsession') {
            fW.dynamic_state.morale = Math.min(100, (fW.dynamic_state.morale || 50) + 10);
            fL.dynamic_state.morale = Math.max(0, (fL.dynamic_state.morale || 50) - 10);
        } else if (rW.type === 'committed') {
            // Beating your partner stings — but some enjoy proving dominance
            fW.dynamic_state.morale = Math.min(100, (fW.dynamic_state.morale || 50) + 5);
            fL.dynamic_state.morale = Math.max(0, (fL.dynamic_state.morale || 50) - 8);
        }

        this.addTension(winnerId, loserId, 15, 'Fought each other in a league match.');
    },

    hookIntoSparring(fighter1Id, fighter2Id) {
        const gs = window.GameState;
        let f1 = gs.getFighter(fighter1Id);
        let f2 = gs.getFighter(fighter2Id);
        if (!f1 || !f2) return;

        let r1 = this._getOrInitRelation(f1, fighter2Id);

        if (['mentor', 'attraction', 'committed', 'best_friends'].includes(r1.type)) {
            f1.dynamic_state.morale = Math.min(100, (f1.dynamic_state.morale || 50) + 5);
            f2.dynamic_state.morale = Math.min(100, (f2.dynamic_state.morale || 50) + 5);
        }

        this.addTension(fighter1Id, fighter2Id, 10, 'Sparred together in training.');
    },

    hookIntoPostMatchPunishment(winnerId, loserId) {
        this.addTension(winnerId, loserId, 12, 'Subject to severe post-match punishment.');
    },

    // ── INTERNAL HELPERS ──────────────────────────────────────────────────────
    _getOrInitRelation(fighter, otherId) {
        if (!fighter.dynamic_state) fighter.dynamic_state = {};
        if (!fighter.dynamic_state.relationships) fighter.dynamic_state.relationships = {};
        if (!fighter.dynamic_state.primary_partner_id) fighter.dynamic_state.primary_partner_id = null;
        if (!fighter.dynamic_state.best_friend_id) fighter.dynamic_state.best_friend_id = null;

        let existing = fighter.dynamic_state.relationships[otherId];

        // Migrate plain string/number values into full objects
        if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
            let migratedType = (typeof existing === 'string')
                ? existing.toLowerCase().replace(/ /g, '_')
                : 'neutral';
            // Map old 'lovers' to 'committed' for consistency
            if (migratedType === 'lovers') migratedType = 'committed';
            if (migratedType === 'friend') migratedType = 'best_friends';
            fighter.dynamic_state.relationships[otherId] = {
                tension: (typeof existing === 'number') ? existing : 0,
                type: migratedType,
                milestone_reached: 0,
                history: [],
                last_interaction_week: 0
            };
        }

        let rel = fighter.dynamic_state.relationships[otherId];
        if (!Array.isArray(rel.history)) rel.history = [];
        if (rel.tension === undefined) rel.tension = 0;
        if (rel.type === undefined) rel.type = 'neutral';
        // Migrate legacy 'lovers' type inline
        if (rel.type === 'lovers') rel.type = 'committed';
        if (rel.type === 'friendship') rel.type = 'best_friends';
        if (rel.milestone_reached === undefined) rel.milestone_reached = 0;
        if (rel.last_interaction_week === undefined) rel.last_interaction_week = 0;

        return rel;
    }
};