/**
 * ui_screens.js
 * Orchestrator mapping route IDs to rendering functions.
 */

window.UIScreens = {
    // These will call out to specific modules like UIClub.render(container)

    cup: (container, params) => {
        if (window.UICup) {
            window.UICup.render(container, params);
        } else {
            container.innerHTML = "<h1>Mid-Season Cup (Loading...)</h1>";
        }
    },

    club: (container, params) => {
        if (window.UIClub) {
            window.UIClub.render(container, params);
        } else {
            container.innerHTML = "<h1>Club Dashboard (Module Loading...)</h1>";
        }
    },

    roster: (container, params) => {
        if (window.UIRoster) {
            window.UIRoster.render(container, params);
        } else {
            container.innerHTML = "<h1>Roster (Module Loading...)</h1>";
        }
    },

    staff: (container, params) => {
        if (window.UIStaff) {
            window.UIStaff.render(container, params);
        } else {
            container.innerHTML = "<h1>Staff Directory (Loading...)</h1>";
        }
    },

    training: (container, params) => {
        if (window.UITraining) {
            window.UITraining.render(container, params);
        } else {
            container.innerHTML = "<h1>Training (Coming Soon)</h1><p>Spend AP to improve fighters here.</p>";
        }
    },

    interactions: (container, params) => {
        if (window.UIInteractions) {
            window.UIInteractions.render(container, params);
        } else {
            container.innerHTML = "<h1>Interactions (Loading...)</h1>";
        }
    },

    underground: (container, params) => {
        if (window.UIUnderground) {
            window.UIUnderground.render(container, params);
        } else {
            container.innerHTML = "<h1>Underground (Loading...)</h1>";
        }
    },

    relationships: (container, params) => {
        if (window.UIRelationships) {
            window.UIRelationships.render(container, params);
        } else {
            container.innerHTML = "<h1>Relationships (Loading...)</h1>";
        }
    },

    facilities: (container, params) => {
        if (window.UIFacilities) {
            window.UIFacilities.render(container, params);
        } else {
            container.innerHTML = "<h1>Facilities (Loading...)</h1>";
        }
    },

    transfers: (container, params) => {
        if (window.UITransfers) {
            window.UITransfers.render(container, params);
        } else {
            container.innerHTML = "<h1>Scouting (Loading...)</h1>";
        }
    },

    league: (container, params) => {
        if (window.UILeague) {
            window.UILeague.render(container, params);
        } else {
            container.innerHTML = "<h1>League Standings (Loading...)</h1>";
        }
    },

    news: (container, params) => {
        if (window.UINews) {
            window.UINews.render(container, params);
        } else {
            container.innerHTML = "<h1>News Feed (Loading...)</h1>";
        }
    },

    halloffame: (container, params) => {
        if (window.UIHallOfFame) {
            window.UIHallOfFame.render(container, params);
        } else {
            container.innerHTML = "<h1>Hall of Fame (Loading...)</h1>";
        }
    },

    clubs: (container, params) => {
        if (window.UIClubs) {
            window.UIClubs.render(container, params);
        } else {
            container.innerHTML = "<h1>Clubs Overview (Loading...)</h1>";
        }
    },

    match: (container, params) => {
        if (window.UIMatch) {
            window.UIMatch.render(container, params);
        } else {
            container.innerHTML = "<h1>Match Viewer (Coming Soon)</h1>";
        }
    },

    sponsors: (container, params) => {
        if (window.UISponsors) {
            window.UISponsors.render(container, params);
        } else {
            container.innerHTML = "<h1>Sponsors (Loading...)</h1>";
        }
    }
};