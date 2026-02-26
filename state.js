/**
 * state.js - Global Game State Manager
 * Holds all session data, currencies, and references to entities.
 */

window.GameState = {
    // Current campaign markers
    season: 1,
    week: 1, // 1 to roughly 20 (14 league matches + exhibitions/tournaments)
    maxSeasons: 100,

    // Player Context
    playerClubId: null, // Set during new game creation

    // Currencies for player
    money: 100000,
    fame: 0,
    actionPoints: 10,
    maxActionPoints: 10,

    // Entity Repositories
    clubs: {},
    fighters: {},
    staff: {}, // All staff objects by ID
    transferPool: [],
    staffPool: [], // IDs of staff available to hire
    transferInbox: [],           // Incoming bids from AI clubs for player-listed fighters (FM-style)
    pendingTransferDemands: [],  // Fighters formally demanding a transfer

    // Expansion 9: Club Dynasty Repositories
    undergroundFighters: {},
    undergroundHistory: [],
    undergroundAvailableThisWeek: true,
    activeUndergroundTournament: null, // Persists bracket state
    pendingMilestones: [], // Queue of { f1, f2, milestone } waiting to display

    // Mid-Season Cup Tracking
    midSeasonCupActive: false,
    midSeasonCupCompleted: false,
    midSeasonCup: null,

    // League Tracking
    leagueStandings: [],
    schedule: [],
    news: [],

    // Training settings (persisted across weeks)
    trainingIntensity: 5,     // Team intensity 1-10
    trainingReport: {},       // { fighterId: [{stat, gain, week}] }

    // Core game methods
    addNews(type, text) {
        this.news.unshift({ week: this.week, type: type, text: text });
        // Keep list manageable
        if (this.news.length > 50) this.news.pop();
    },

    // Initialization Method
    async init() {
        try {
            // Load JSON Data
            const [clubsRes, fightersRes, staffRes, undergroundRes] = await Promise.all([
                fetch('data_clubs.json'),
                fetch('data_fighters.json'),
                fetch('data_staff.json'),
                fetch('data_underground.json')
            ]);

            const clubsData = await clubsRes.json();
            const fightersData = await fightersRes.json();
            const staffData = await staffRes.json();
            const undergroundData = await undergroundRes.json();

            // Map into dictionaries by ID for easy access
            clubsData.forEach(c => {
                c.staff = c.staff || {}; // Ensure staff object exists
                this.clubs[c.id] = c;
            });
            fightersData.forEach(f => {
                // Ensure relationships is an object map for the Tension system
                if (Array.isArray(f.dynamic_state.relationships) || !f.dynamic_state.relationships) {
                    f.dynamic_state.relationships = {};
                }
                // Assign potential (PA) if not already set — replaces natural_ceiling
                if (!f.potential) {
                    f.potential = this._generatePotential(f.age || 25, f.personality?.archetype);
                }
                f.natural_ceiling = f.potential; // keep legacy reference in sync
                // Assign training focus if not set
                if (!f.training_focus) f.training_focus = 'general';
                this.fighters[f.id] = f;
            });

            undergroundData.forEach(ug => this.undergroundFighters[ug.id] = ug);

            staffData.forEach(s => {
                this.staff[s.id] = s;
                this.staffPool.push(s.id); // By default, all staff start in the pool
            });

            // Seed Some Initial Relationships
            if (window.RelationshipEngine) {
                Object.values(this.clubs).forEach(club => {
                    for (let i = 0; i < club.fighter_ids.length; i++) {
                        for (let j = i + 1; j < club.fighter_ids.length; j++) {
                            if (Math.random() < 0.6) { // 60% chance of an initial bond
                                let tension = Math.floor(Math.random() * 60) + 10;
                                window.RelationshipEngine.addTension(club.fighter_ids[i], club.fighter_ids[j], tension, "Past history at the club.");
                            }
                        }
                    }
                });

                // A few global rivalries
                let allFighterIds = Object.keys(this.fighters);
                for (let i = 0; i < 15; i++) {
                    let id1 = allFighterIds[Math.floor(Math.random() * allFighterIds.length)];
                    let id2 = allFighterIds[Math.floor(Math.random() * allFighterIds.length)];
                    let f1 = this.getFighter(id1);
                    let f2 = this.getFighter(id2);
                    if (f1 && f2 && f1.club_id !== f2.club_id) {
                        window.RelationshipEngine.addTension(id1, id2, Math.floor(Math.random() * 70) + 20, "Historical rivalry on the circuit.");
                    }
                }
            }

            console.log("State initialized successfully.", this);
            return true;
        } catch (error) {
            console.error("Failed to initialize game state:", error);
            return false;
        }
    },

    // Generates a fighter's Potential Ability (PA) score 55–100
    // based on age and archetype, mirroring Football Manager CA/PA logic.
    _generatePotential(age, archetype) {
        // Base range by age
        let min, max;
        if (age <= 19) { min = 70; max = 100; }
        else if (age <= 22) { min = 67; max = 98; }
        else if (age <= 25) { min = 65; max = 95; }
        else if (age <= 28) { min = 62; max = 90; }
        else if (age <= 31) { min = 58; max = 82; }
        else if (age <= 34) { min = 55; max = 75; }
        else { min = 55; max = 68; }

        // Archetype modifiers
        const mods = {
            'Underdog': { minD: 5, maxD: 8 },   // Hidden diamonds
            'Rookie': { minD: 3, maxD: 6 },
            'Technician': { minD: 2, maxD: 4 },
            'Strategist': { minD: 1, maxD: 3 },
            'Alpha': { minD: 0, maxD: 0 },
            'Showboat': { minD: -2, maxD: 2 },
            'Rebel': { minD: -3, maxD: 5 },   // Volatile — wild range
            'Veteran': { minD: -8, maxD: -3 },  // Peaked
            'Ice Queen': { minD: 0, maxD: 4 },
        };
        const mod = mods[archetype] || { minD: 0, maxD: 0 };
        min = Math.max(55, Math.min(95, min + mod.minD));
        max = Math.max(min + 5, Math.min(100, max + mod.maxD));

        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    getClubMatches(clubId) {
        // Returns schedule for specific club
        return this.schedule.filter(m => m.home === clubId || m.away === clubId);
    },

    getFighter(id) {
        return this.fighters[id];
    },

    getClub(id) {
        return this.clubs[id];
    }
};
