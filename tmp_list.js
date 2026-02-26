const fs = require('fs');

const clubsData = JSON.parse(fs.readFileSync('./data_clubs.json', 'utf8'));
const fightersData = JSON.parse(fs.readFileSync('./data_fighters.json', 'utf8'));

let output = '# Starting Clubs and Their Fighters\n\n';

for (const club of clubsData) {
    output += `## ${club.name} (Advantage: ${club.home_advantage}, Style: ${club.ai_persona})\n`;
    for (const fighterId of club.fighter_ids) {
        const fighter = fightersData.find(f => f.id === fighterId);
        if (fighter) {
            output += `- **${fighter.name}** (Age: ${fighter.age}, Archetype: ${fighter.personality.archetype})\n`;
        }
    }
    output += '\n';
}

console.log(output);
