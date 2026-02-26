/**
 * save_system.js
 * Serializes and hydrates GameState to window.localStorage
 */

window.SaveSystem = {
    saveKey: 'club_dynasty_autosave',

    saveGame() {
        try {
            const data = JSON.stringify(window.GameState);
            localStorage.setItem(this.saveKey, data);
            console.log("Game Saved Successfully.");
            return true;
        } catch (e) {
            console.error("Failed to save game data", e);
            return false;
        }
    },

    loadGame() {
        try {
            const data = localStorage.getItem(this.saveKey);
            if (!data) return false;

            const parsed = JSON.parse(data);

            // Hydrate state
            Object.assign(window.GameState, parsed);

            // Backward compatibility for new expansion variables that might be missing in older saves
            if (!window.GameState.pendingMilestones) window.GameState.pendingMilestones = [];
            if (!window.GameState.undergroundHistory) window.GameState.undergroundHistory = [];
            if (typeof window.GameState.undergroundAvailableThisWeek === 'undefined') window.GameState.undergroundAvailableThisWeek = true;

            console.log("Game Loaded Successfully.");

            // Re-render nav
            if (typeof updateNavUI === 'function') updateNavUI();

            return true;
        } catch (e) {
            console.error("Failed to load game data", e);
            return false;
        }
    },

    clearSave() {
        localStorage.removeItem(this.saveKey);
        console.log("Save cleared.");
    }
};

// Hook autosave into Advance Week
const originalAdvance = window.AIEngine._advanceTime;
window.AIEngine._advanceTime = function () {
    originalAdvance.apply(this);
    window.SaveSystem.saveGame();
};
