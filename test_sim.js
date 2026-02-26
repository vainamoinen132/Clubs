const fs = require('fs');
eval(fs.readFileSync('./state.js', 'utf8'));
eval(fs.readFileSync('./sim_rounds.js', 'utf8'));
eval(fs.readFileSync('./sim_engine.js', 'utf8'));

let f1 = {
    id: 'test1', name: 'Player',
    core_stats: { power: 50, technique: 50, speed: 50, aggression: 50, composure: 50 },
    style_affinities: { catfight: 50 },
    personality: { archetype: 'Alpha' },
    dynamic_state: { form: 50, fatigue: 0, age: 20 }
};

let f2 = {
    id: 'test2', name: 'Opponent',
    core_stats: { power: 50, technique: 50, speed: 50, aggression: 50, composure: 50 },
    style_affinities: { catfight: 50 },
    personality: { archetype: 'Rebel' },
    dynamic_state: { form: 50, fatigue: 0, age: 20 }
};

let sim = new MatchSimulation(f1, f2, 'catfight', true);
sim.startMatch();

for (let i = 0; i < 20; i++) {
    sim.playRound();
    console.log(`Round ${sim.currentRoundNumber - 1}, winner: ${sim.winner ? sim.winner.name : 'None'}, health: ${sim.f1.health} / ${sim.f2.health}`);
    if (sim.winner) break;
}
