// ui_match.js: Replace runPostMatch
const fs = require('fs');
let content = fs.readFileSync('ui_match.js', 'utf8');

const newPostMatch = `
    runPostMatch() {
        let winner = this.currentSim.winner;
        let loser = winner === this.currentSim.f1 ? this.currentSim.f2 : this.currentSim.f1;

        let wOrig = window.GameState.getFighter(winner.id);
        let lOrig = window.GameState.getFighter(loser.id);

        if (window.SimEvents) {
            window.SimEvents.processPostMatch(wOrig.id, lOrig.id);
        }

        let targetMatch = window.GameState.schedule.find(m => m.id === this.activeMatchId);
        if (targetMatch) {
            targetMatch.winnerId = winner.id;
            targetMatch.rounds = this.currentSim.roundsWon; 
        }

        let pDunger = wOrig.personality.dominance_hunger;
        let pLean = lOrig.personality.submissive_lean;
        let roundDiff = Math.abs(this.currentSim.f1Rounds - this.currentSim.f2Rounds);
        let winColor = window.GameState.getClub(wOrig.club_id)?.color || '#fff';
        let isWhitewash = roundDiff === 5;

        let punishHtml = "<h3>Post-Match Sequence</h3>";
        
        // Massive Narrative Overhaul for Punishments
        if (pDunger < 40) {
            punishHtml += \`<p><span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> kneels beside the battered \${lOrig.name}, offering a hand to pull her up. A rare display of sportsmanship.</p>\`;
            this._updateRelationship(wOrig, lOrig, 'Friend');
        } else if (pDunger >= 40 && pDunger <= 70) {
            if (isWhitewash) {
                punishHtml += \`<p><span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> stands victorious over the completely broken \${lOrig.name}. She places a foot squarely on \${lOrig.name}'s chest, raising her arms to the screaming crowd as a supreme display of dominance!</p>\`;
            } else {
                punishHtml += \`<p><span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> struts around the ring, soaking in the cheers while ignoring the groaning \${lOrig.name} on the mat.</p>\`;
            }
            lOrig.dynamic_state.morale -= 10;
        } else if (pDunger > 70) {
            // High Dominance
            let relChange = '';
            if (pLean > 50 && !lOrig.personality.boundaries.includes("no_public_degradation")) {
                let eroticText = [
                    \`<span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> crawls over the exhausted \${lOrig.name}, pinning her down. She leans in close, whispering something filthy into her ear while slowly, humiliatingly trailing her fingers down \${lOrig.name}'s stomach. \${lOrig.name} can only flush bright red in helpless submission.\`,
                    \`<span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> grabs \${lOrig.name} by the hair, yanking her head back exposing her throat, and forcefully presses a deep, dominating kiss to her lips in front of the flashing cameras. \${lOrig.name} gasps, completely overwhelmed and violated.\`
                ];
                punishHtml += \`<p style="color:var(--text-highlight); font-style:italic;">\${eroticText[Math.floor(Math.random()*eroticText.length)]}</p>\`;
                relChange = this._updateRelationship(wOrig, lOrig, 'Lovers (Forced)');
                lOrig.dynamic_state.morale -= 15;
            } else {
                let violentText = [
                    \`<span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> refuses to back off! She grabs a handful of \${lOrig.name}'s hair and brutally slams her face back into the canvas long after the bell has rung! The officials literally have to tear her away!\`,
                    \`<span style="color:\${winColor}; font-weight:bold;">\${wOrig.name}</span> sadistically cranks a submission hold even tighter despite the match being over, forcing \${lOrig.name} to scream in agony until security intervenes.\`
                ];
                punishHtml += \`<p style="color:#ff9999; font-weight:bold;">\${violentText[Math.floor(Math.random()*violentText.length)]}</p>\`;
                relChange = this._updateRelationship(wOrig, lOrig, 'Bitter Rival');
                lOrig.dynamic_state.morale -= 25;
                lOrig.dynamic_state.stress += 30;
            }
            if (relChange) punishHtml += \`<div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem;">[Relationship Update: \${relChange}]</div>\`;
        }

        const feedContainer = document.getElementById('match-feed');
        feedContainer.innerHTML = '';
        this._appendLog(punishHtml);

        let btn = document.getElementById('post-match-btn');
        btn.innerText = "Finish & Advance Week";
        btn.onclick = () => {
            if (window.AIEngine) { window.AIEngine.processWeek(); }
            window.Router.loadRoute('club');
        };
    },
    
    _updateRelationship(f1, f2, type) {
        if (!f1.dynamic_state.relationships) f1.dynamic_state.relationships = {};
        if (!f2.dynamic_state.relationships) f2.dynamic_state.relationships = {};
        
        let oldRel = f1.dynamic_state.relationships[f2.id];
        if (oldRel === type) return null; // No change
        
        f1.dynamic_state.relationships[f2.id] = type;
        f2.dynamic_state.relationships[f1.id] = type;
        return \`\${f1.name} and \${f2.name} are now \${type}s.\`;
    }
};`;

const regex = /runPostMatch\(\) \{[\s\S]*?\}\n\s*\};/g;
content = content.replace(regex, newPostMatch);
fs.writeFileSync('ui_match.js', content);
