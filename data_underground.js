/**
 * data_underground.js
 * Fixed pool of exactly 50 Underground characters for V3 Overhaul.
 * Used by underground_engine.js for tournaments and 1v1 fights.
 */

window.UndergroundRoster = [
    // === TIER 3 (ELITE BOSSES) ===
    { name: "Svetlana Dragunov", tier: 3, archetype: "Sadistic", power: 98, technique: 90, speed: 75, composure: 95, presence: 100, dominance: 98 },
    { name: "Kaelen Mortis", tier: 3, archetype: "Volatile", power: 95, technique: 95, speed: 90, composure: 80, presence: 90, dominance: 95 },
    { name: "Valeria Voss", tier: 3, archetype: "Strategist", power: 85, technique: 99, speed: 85, composure: 100, presence: 90, dominance: 90 },
    { name: "Zoya Volkov", tier: 3, archetype: "Ice Queen", power: 94, technique: 88, speed: 80, composure: 98, presence: 92, dominance: 85 },
    { name: "Xenia Rostova", tier: 3, archetype: "Sadistic", power: 88, technique: 92, speed: 95, composure: 90, presence: 95, dominance: 99 },
    { name: "Lilith Graves", tier: 3, archetype: "Showboat", power: 90, technique: 85, speed: 92, composure: 75, presence: 98, dominance: 88 },
    { name: "Morgana Rex", tier: 3, archetype: "Alpha", power: 100, technique: 80, speed: 70, composure: 85, presence: 100, dominance: 95 },
    { name: "Sloane Steele", tier: 3, archetype: "Veteran", power: 92, technique: 96, speed: 75, composure: 95, presence: 88, dominance: 80 },

    // === TIER 2 (VETERANS & CONTENDERS) ===
    { name: "Daria Voronova", tier: 2, archetype: "Sadistic", power: 88, technique: 82, speed: 80, composure: 80, presence: 85, dominance: 90 },
    { name: "Roxy Thorne", tier: 2, archetype: "Volatile", power: 85, technique: 75, speed: 90, composure: 65, presence: 80, dominance: 85 },
    { name: "Nova Kane", tier: 2, archetype: "Showboat", power: 80, technique: 85, speed: 88, composure: 70, presence: 92, dominance: 75 },
    { name: "Raven Croft", tier: 2, archetype: "Underdog", power: 78, technique: 82, speed: 92, composure: 85, presence: 80, dominance: 70 },
    { name: "Cleo Stark", tier: 2, archetype: "Alpha", power: 90, technique: 80, speed: 80, composure: 80, presence: 85, dominance: 88 },
    { name: "Anya Petrov", tier: 2, archetype: "Technician", power: 75, technique: 92, speed: 85, composure: 90, presence: 78, dominance: 75 },
    { name: "Sasha Kravitz", tier: 2, archetype: "Sadistic", power: 85, technique: 85, speed: 80, composure: 80, presence: 82, dominance: 92 },
    { name: "Nadia Romanov", tier: 2, archetype: "Ice Queen", power: 82, technique: 88, speed: 82, composure: 95, presence: 85, dominance: 80 },
    { name: "Ingrid Frost", tier: 2, archetype: "Veteran", power: 88, technique: 85, speed: 70, composure: 90, presence: 82, dominance: 78 },
    { name: "Olga Ivanov", tier: 2, archetype: "Volatile", power: 92, technique: 70, speed: 75, composure: 60, presence: 80, dominance: 85 },
    { name: "Petra Kage", tier: 2, archetype: "Alpha", power: 88, technique: 80, speed: 75, composure: 85, presence: 85, dominance: 90 },
    { name: "Vera Rex", tier: 2, archetype: "Sadistic", power: 85, technique: 82, speed: 80, composure: 75, presence: 80, dominance: 88 },
    { name: "Zara Blaze", tier: 2, archetype: "Showboat", power: 80, technique: 80, speed: 88, composure: 75, presence: 88, dominance: 75 },
    { name: "Kara Knox", tier: 2, archetype: "Sadistic", power: 88, technique: 75, speed: 80, composure: 70, presence: 85, dominance: 92 },
    { name: "Maya Frost", tier: 2, archetype: "Technician", power: 78, technique: 90, speed: 82, composure: 88, presence: 78, dominance: 72 },
    { name: "Gisele Morana", tier: 2, archetype: "Ice Queen", power: 80, technique: 85, speed: 85, composure: 92, presence: 82, dominance: 85 },
    { name: "Katarina Bane", tier: 2, archetype: "Volatile", power: 90, technique: 78, speed: 78, composure: 65, presence: 85, dominance: 88 },
    { name: "Freya Storm", tier: 2, archetype: "Alpha", power: 85, technique: 82, speed: 82, composure: 80, presence: 82, dominance: 85 },
    { name: "Isla Black", tier: 2, archetype: "Sadistic", power: 82, technique: 85, speed: 80, composure: 75, presence: 80, dominance: 90 },

    // === TIER 1 (GRUNTS & NEWCOMERS) ===
    { name: "Nina Kael", tier: 1, archetype: "Underdog", power: 70, technique: 75, speed: 80, composure: 70, presence: 65, dominance: 50 },
    { name: "Elena Silva", tier: 1, archetype: "Technician", power: 65, technique: 80, speed: 75, composure: 75, presence: 60, dominance: 55 },
    { name: "Tara Grimm", tier: 1, archetype: "Volatile", power: 78, technique: 65, speed: 70, composure: 50, presence: 70, dominance: 75 },
    { name: "Mila Thorne", tier: 1, archetype: "Sadistic", power: 75, technique: 70, speed: 72, composure: 60, presence: 68, dominance: 85 },
    { name: "Rosa Diaz", tier: 1, archetype: "Alpha", power: 76, technique: 68, speed: 70, composure: 65, presence: 72, dominance: 70 },
    { name: "Carmen Reyes", tier: 1, archetype: "Showboat", power: 68, technique: 72, speed: 78, composure: 60, presence: 80, dominance: 60 },
    { name: "Tia Raze", tier: 1, archetype: "Volatile", power: 75, technique: 65, speed: 80, composure: 55, presence: 70, dominance: 70 },
    { name: "Zelda Vance", tier: 1, archetype: "Ice Queen", power: 68, technique: 78, speed: 70, composure: 85, presence: 65, dominance: 65 },
    { name: "Rhea Thorne", tier: 1, archetype: "Sadistic", power: 72, technique: 70, speed: 75, composure: 60, presence: 65, dominance: 82 },
    { name: "Luna Vega", tier: 1, archetype: "Technician", power: 65, technique: 75, speed: 82, composure: 70, presence: 60, dominance: 55 },
    { name: "Gia Rossi", tier: 1, archetype: "Showboat", power: 66, technique: 70, speed: 76, composure: 65, presence: 75, dominance: 58 },
    { name: "Lexi Venom", tier: 1, archetype: "Volatile", power: 74, technique: 65, speed: 78, composure: 55, presence: 70, dominance: 78 },
    { name: "Bianca Bane", tier: 1, archetype: "Sadistic", power: 76, technique: 68, speed: 72, composure: 58, presence: 65, dominance: 86 },
    { name: "Harper Blood", tier: 1, archetype: "Alpha", power: 75, technique: 70, speed: 70, composure: 65, presence: 72, dominance: 75 },
    { name: "Nyx Vance", tier: 1, archetype: "Ice Queen", power: 68, technique: 75, speed: 72, composure: 80, presence: 68, dominance: 62 },
    { name: "Talon Cross", tier: 1, archetype: "Technician", power: 70, technique: 76, speed: 75, composure: 72, presence: 62, dominance: 60 },
    { name: "Ivy Cross", tier: 1, archetype: "Underdog", power: 65, technique: 72, speed: 85, composure: 70, presence: 60, dominance: 50 },
    { name: "Serena Vane", tier: 1, archetype: "Showboat", power: 68, technique: 70, speed: 75, composure: 62, presence: 78, dominance: 55 },
    { name: "Fiona Graves", tier: 1, archetype: "Sadistic", power: 74, technique: 68, speed: 74, composure: 60, presence: 65, dominance: 85 },
    { name: "Hera Blood", tier: 1, archetype: "Volatile", power: 78, technique: 62, speed: 68, composure: 50, presence: 70, dominance: 78 },
    { name: "Athena Stark", tier: 1, archetype: "Alpha", power: 75, technique: 72, speed: 70, composure: 65, presence: 75, dominance: 72 },
    { name: "Yulia Korshak", tier: 1, archetype: "Sadistic", power: 76, technique: 68, speed: 72, composure: 60, presence: 68, dominance: 88 },
    { name: "Diana Varga", tier: 1, archetype: "Technician", power: 68, technique: 78, speed: 74, composure: 75, presence: 65, dominance: 58 },
    { name: "Lyra Frost", tier: 1, archetype: "Ice Queen", power: 70, technique: 75, speed: 75, composure: 82, presence: 68, dominance: 65 }
];
