/**
 * main.js - Entry point for Queens of the Ring
 */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize Game State (Loads JSONs)
    const success = await window.GameState.init();

    // Hide initial raw loading screen overlay right away
    document.getElementById('loading-screen').classList.remove('active');
    document.getElementById('loading-screen').classList.add('hidden');

    if (success) {
        // Hand off control to the Start Screen orchestrator
        if (window.UIStart) {
            window.UIStart.render();
        } else {
            console.error("UIStart not found!");
        }
    } else {
        document.getElementById('start-screen').innerHTML = "<h1>Error: Game Data Not Found</h1>";
        document.getElementById('start-screen').classList.add('active');
    }

    // Advance week handler
    document.getElementById('btn-advance-week').addEventListener('click', () => {
        if (window.GameState.week === 8 && !window.GameState.midSeasonCupCompleted) {
            alert("The Mid-Season Cup is currently active! You must resolve the tournament before the league can resume.");
            window.Router.loadRoute('cup');
            return;
        }

        let hasMatch = window.UIClub && window.UIClub._getNextMatch && window.UIClub._getNextMatch();
        if (hasMatch) {
            // Check if player's match this week is already played
            if (!hasMatch.winnerId) {
                if (!confirm("You haven't played your scheduled match this week! If you advance, it will be skipped and simulated without you. Are you sure?")) {
                    return;
                } else {
                    // Force simulate player match
                    if (window.AIEngine) window.AIEngine._simulateGhostMatch(hasMatch);
                }
            }
        }

        if (window.AIEngine) {
            window.AIEngine.processWeek();
            window.Router.loadRoute('club');
        }
    });
});

function updateNavUI() {
    document.getElementById('res-money').innerText = "$" + window.GameState.money.toLocaleString();
    document.getElementById('res-fame').innerText = window.GameState.fame.toLocaleString();
    document.getElementById('res-ap').innerText = window.GameState.actionPoints + " / " + window.GameState.maxActionPoints;
    document.getElementById('nav-season-badge').innerText = "Season " + window.GameState.season + " | Week " + window.GameState.week;
}
