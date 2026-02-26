/**
 * sim_schedule.js
 * Generates a round-robin schedule for the 8-club league.
 */

window.SimSchedule = {
    generateSeasonSchedule() {
        const gs = window.GameState;
        const clubIds = Object.keys(gs.clubs);

        if (clubIds.length < 2) return;

        // We want a double round-robin (each plays each other twice, home and away)
        // For 8 clubs, that's 14 weeks. 
        let schedule = [];
        let matchIdCounter = 1;

        // standard round robin algorithm
        let teams = [...clubIds];
        if (teams.length % 2 !== 0) {
            teams.push(null); // dummy for bye
        }

        const numRounds = teams.length - 1;
        const halfSize = teams.length / 2;
        const styles = ['boxing', 'naked_wrestling', 'catfight', 'sexfight'];

        // Generate first half (7 weeks)
        for (let round = 0; round < numRounds; round++) {
            let weekMatches = [];
            for (let i = 0; i < halfSize; i++) {
                let home = teams[i];
                let away = teams[teams.length - 1 - i];

                if (home !== null && away !== null) {
                    // Randomly assign a style, or we could let the home club choose based on persona
                    let style = styles[Math.floor(Math.random() * styles.length)];

                    weekMatches.push({
                        id: `s${gs.season}_w${round + 1}_m${matchIdCounter++}`,
                        week: round + 1,
                        home: home,
                        away: away,
                        homeFighter: null, // Assigned just before match
                        awayFighter: null, // Assigned just before match
                        style: style,
                        played: false,
                        winnerId: null,
                        rounds: null
                    });
                }
            }
            schedule.push(...weekMatches);

            // Rotate array (keep first element fixed)
            teams.splice(1, 0, teams.pop());
        }

        let secondHalf = [];
        schedule.forEach(m => {
            secondHalf.push({
                id: `s${gs.season}_w${m.week + 7}_m${matchIdCounter++}`,
                week: m.week + 7,
                home: m.away,
                away: m.home,
                homeFighter: null,
                awayFighter: null,
                style: styles[Math.floor(Math.random() * styles.length)],
                played: false,
                winnerId: null,
                rounds: null
            });
        });

        schedule.push(...secondHalf);
        gs.schedule = schedule;
        console.log(`Generated ${schedule.length} matches for Season ${gs.season}`);
    }
};
