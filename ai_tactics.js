/**
 * ai_tactics.js
 * Decisions made by AI clubs during matches regarding stances and targeting.
 */

window.AITactics = {
    getInitialStance(club, opponentClub, fighter, opponent) {
        // e.g., Tactician chooses stance to counter opponent's assumed archetype
        if (club.ai_persona === 'tactician') {
            if (opponent.personality.archetype === 'Showboat') return 'defensive';
            return 'balanced';
        }

        if (club.ai_persona === 'saboteur') {
            return 'aggressive'; // try to break composure fast
        }

        return 'balanced';
    },

    getMidMatchStanceAdjustment(club, fighter, currentStance, roundState) {
        // If getting dominated, maybe switch to balanced or defensive.
        if (fighter.stamina < 30) return 'defensive';

        if (roundState.behindBy >= 2 && club.ai_persona === 'balanced') {
            return 'aggressive'; // desperate gamble
        }

        return currentStance; // No change
    }
};
