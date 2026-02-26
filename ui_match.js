/**
 * ui_match.js
 * Real-time narrative display connecting sim_engine to the DOM.
 */

window.UIMatch = {
    currentSim: null,
    playTimer: null,
    speedMs: 1500, // configurable: 1500, 800, 200

    render(container, params) {
        const gs = window.GameState;
        const playerClub = gs.getClub(gs.playerClubId);

        // Failsafe: clear dynamic activity contexts when viewing pre-match
        this.activePairedContext = null;
        this.activeUndergroundContext = null;

        let targetMatch = gs.schedule.find(m => m.id === params?.matchId);
        if (!targetMatch) {
            container.innerHTML = "<h2>Error: Match not found.</h2>";
            return;
        }

        let oppClub = gs.getClub(targetMatch.away === playerClub.id ? targetMatch.home : targetMatch.away);

        // Pick AI fighter based on fatigue
        let oppFighterId = oppClub.fighter_ids.reduce((a, b) => gs.getFighter(a).dynamic_state?.fatigue < gs.getFighter(b).dynamic_state?.fatigue ? a : b);
        let oppFighter = gs.getFighter(oppFighterId);

        // Pre-Match Fighter Selection Screen
        let rosterHtml = playerClub.fighter_ids.map(fId => {
            let f = gs.getFighter(fId);
            let fatigueColor = f.dynamic_state.fatigue > 50 ? 'red' : 'var(--text-muted)';

            // Get best style affinity to match Roster screen
            let bestStyleStr = window.UIComponents._getBestStyle(f);

            let isInjured = f.dynamic_state.injuries && f.dynamic_state.injuries.length > 0;
            let opacity = isInjured ? "0.5" : "1";
            let clickAction = isInjured ?
                `alert('${f.name} is currently injured and medically uncleared to compete.')` :
                `window.UIMatch.startMatchWithSelections('${fId}', '${oppFighterId}', '${targetMatch.id}')`;

            let relHtml = '';
            if (f.dynamic_state.relationships && f.dynamic_state.relationships[oppFighterId]) {
                let relType = f.dynamic_state.relationships[oppFighterId];
                let bg = relType === 'Lover' ? 'var(--pink-hl)' : (relType === 'Bitter Rival' ? 'var(--danger)' : 'var(--accent)');
                let displayType = relType.type ? relType.type.replace('_', ' ') : relType; // accommodate both formats
                relHtml = `<span style="font-size: 0.75rem; background: ${bg}; color: #fff; padding: 2px 6px; border-radius: 4px; margin-left: 10px; font-weight: bold; align-self: center;">${displayType}</span>`;
            }

            return `
                <div class="glass-panel hoverable" style="padding: 1rem; margin-bottom: 0.5rem; cursor: ${isInjured ? 'not-allowed' : 'pointer'}; opacity: ${opacity};" onclick="${clickAction}">
                    <div style="display:flex; justify-content: space-between;">
                        <div>
                            <div style="display:flex; align-items:center;">
                                <strong style="display:block; margin-bottom:0.2rem;">${f.name} ${isInjured ? '<span style="color:var(--danger); font-size:0.8rem;">(INJ)</span>' : ''}</strong>
                                ${relHtml}
                            </div>
                            <div style="font-size: 0.85rem; color: var(--accent);">Best Style: ${bestStyleStr}</div>
                        </div>
                        <span style="color: ${fatigueColor}">Fatigue: ${f.dynamic_state.fatigue.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }).join('');

        const fallbackSvgOpp = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="24">?</text></svg>`);

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Pre-Match Prep', `Week ${gs.week} vs ${oppClub.name}`)}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div>
                    <h3 class="font-outfit text-gradient" style="margin-bottom: 1rem;">Select Your Fighter</h3>
                    ${rosterHtml}
                </div>
                <div>
                    <h3 class="font-outfit" style="margin-bottom: 1rem; color: #fff; text-shadow: 0 0 5px ${oppClub.color}">Opponent</h3>
                    <div class="glass-panel" style="padding: 1rem; border-left: 4px solid ${oppClub.color}">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <img src="${oppFighter.avatar ? 'assets/portraits/' + oppFighter.avatar : 'assets/portraits/' + oppFighter.name.toLowerCase() + '.png'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid ${oppClub.color};" onerror="this.onerror=null; this.src='${fallbackSvgOpp}';" />
                            <div>
                                <h4>${oppFighter.name}</h4>
                                <p class="text-muted" style="margin-top: 0.5rem;">Archetype: ${oppFighter.personality.archetype}</p>
                                <p class="text-muted">Style: ${targetMatch.style.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    startPairedMatch(f1Id, f2Id, styleId, ruleset) {
        const gs = window.GameState;
        this.activeMatchId = null;
        this.activeUndergroundContext = null;
        this.activePairedContext = { ruleset, f1Id, f2Id, styleId };

        let f1 = gs.getFighter(f1Id);
        let f2 = gs.getFighter(f2Id);

        if (!f1 || !f2) return;

        this.currentSim = new MatchSimulation(f1, f2, styleId, true);
        this.currentSim.startMatch();
        this._crowdFrenzyFired = false;
        this._crowdHotFired = false;

        const container = document.getElementById('main-view') || document.body;

        const f1Color = '#a855f7';
        const f2Color = '#a855f7';

        const img1Src = f1.avatar ? `assets/portraits/${f1.avatar}` : `assets/portraits/${f1.name.toLowerCase()}.png`;
        const img2Src = f2.avatar ? `assets/portraits/${f2.avatar}` : `assets/portraits/${f2.name.toLowerCase()}.png`;
        const fallbackSvg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="24">?</text></svg>`);

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Paired Activity', 'A private clash of dominance and skill.')}
            
            <!-- Match Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 12px; border: 1px solid #a855f7;">
                <div style="display: flex; gap: 1rem; align-items: center; width: 40%;">
                    <img src="${img1Src}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 3px solid ${f1Color}; box-shadow: 0 0 10px ${f1Color};" onerror="this.onerror=null; this.src='${fallbackSvg}';" />
                    <div>
                        <h2 class="font-outfit" style="color:#fff; text-shadow: 0 0 10px ${f1Color}; margin-bottom: 0;">${f1.name}</h2>
                    </div>
                </div>
                
                <div style="text-align: center; width: 20%;">
                    <h1 class="font-outfit" style="font-size: 3rem; margin:0;" id="match-score">0 - 0</h1>
                    <span id="match-round" class="tag" style="background:#a855f7; color:#fff;">Round 1</span>
                </div>
                
                <div style="display: flex; flex-direction: row-reverse; gap: 1rem; align-items: center; text-align: right; width: 40%;">
                    <img src="${img2Src}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 3px solid ${f2Color}; box-shadow: 0 0 10px ${f2Color};" onerror="this.onerror=null; this.src='${fallbackSvg}';" />
                    <div>
                        <h2 class="font-outfit" style="color:#fff; text-shadow: 0 0 10px ${f2Color}; margin-bottom: 0;">${f2.name}</h2>
                    </div>
                </div>
            </div>
            
            <!-- Match Meters -->
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; gap: 2rem;">
                <div style="width: 50%;" class="glass-panel" style="padding: 1rem;">
                    ${this._createMetersHTML('f1', f1)}
                </div>
                <div style="width: 50%;" class="glass-panel" style="padding: 1rem;">
                   ${this._createMetersHTML('f2', f2)}
                </div>
            </div>

            <!-- Match Energy -->
            <div style="margin-top: 1.5rem; text-align: center; padding: 0 1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size: 0.85rem; color:var(--text-muted); text-transform: uppercase;">
                    <span>Cold</span><span id="crowd-energy-label" style="color:#ffeb3b;">Match Energy ⚡</span><span>Electric</span>
                </div>
                <div class="glass-panel" style="height: 14px; padding:0; border-radius: 7px; overflow:hidden; box-shadow: inset 0 0 5px rgba(0,0,0,0.5);">
                    <div id="crowd-intensity-bar" style="height: 100%; width: 40%; background: linear-gradient(90deg, #ffeb3b, #ff3d00); border-radius: 7px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(255, 61, 0, 0.5);"></div>
                </div>
            </div>
            
            <!-- Event Feed -->
            <div class="glass-panel" style="margin-top: 1.5rem; height: 350px; overflow-y: auto; padding: 1.5rem; font-size: 1.1rem; line-height: 1.6; display: flex; flex-direction: column;" id="match-feed">
            </div>
            
            <!-- Controls Base -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px;">
                <div style="display:flex; gap: 0.5rem; align-items:center;">
                   <button class="btn-primary" onclick="window.UIMatch.playNextEvent()" id="btn-step">Step</button>
                   <span style="color:var(--text-muted); margin-left:1rem; font-size:0.9rem;">Auto-Play:</span>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(1500)">Normal</button>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(800)">Fast</button>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(200)">Fastest</button>
                   <button class="btn-primary" onclick="window.UIMatch.pausePlay()" style="background: #e0284f;" id="btn-pause">Pause</button>
                </div>
                <!-- No Tactics for Paired -->
                <div id="corner-options" style="display: flex; gap: 0.5rem;"></div>
                <div>
                    <button id="post-match-btn" class="btn-primary hidden" onclick="window.UIMatch.runPostMatch()">Resolve Activity</button>
                </div>
            </div>
        `;

        this._appendLog(`<em style="color:#a855f7;">${ruleset.replace(/_/g, ' ').toUpperCase()} BEGINS.</em>`);
    },

    startUndergroundMatch(f1Id, f2Id, context) {
        const gs = window.GameState;
        this.activeMatchId = null;
        this.activeUndergroundContext = context;

        let f1 = gs.getFighter(f1Id);
        let f2 = gs.getFighter(f2Id);

        if (!f1) {
            if (context.type === 'tournament') {
                let m = gs.activeUndergroundTournament.matches[context.matchIndex];
                f1 = m.f1.id === f1Id ? m.f1 : m.f2;
            } else if (context.type === 'bloodpit') {
                f1 = context.opponent;
            }
        }

        if (!f2) {
            if (context.type === 'tournament') {
                let m = gs.activeUndergroundTournament.matches[context.matchIndex];
                f2 = m.f1.id === f2Id ? m.f1 : m.f2;
            } else if (context.type === 'bloodpit') {
                f2 = context.opponent;
            }
        }

        // Default to a brutal style for underground
        let style = 'catfight';
        if (f1.style_affinities && f2.style_affinities) {
            style = window.UIComponents._getBestStyle(Math.random() > 0.5 ? f1 : f2);
        }

        this.currentSim = new MatchSimulation(f1, f2, style, true);
        this.currentSim.startMatch();
        this._crowdFrenzyFired = false;
        this._crowdHotFired = false;

        const container = document.getElementById('main-view') || document.body;

        const f1Color = '#ff5252';
        const f2Color = '#ff5252';

        const img1Src = f1.avatar ? `assets/portraits/${f1.avatar}` : `assets/portraits/${f1.name.toLowerCase()}.png`;
        const img2Src = f2.avatar ? `assets/portraits/${f2.avatar}` : `assets/portraits/${f2.name.toLowerCase()}.png`;
        const fallbackSvg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="24">?</text></svg>`);

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('The Underground', 'No referees. No rules. No mercy.')}
            
            <!-- Match Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 12px; border: 1px solid #ff5252;">
                <div style="display: flex; gap: 1rem; align-items: center; width: 40%;">
                    <img src="${img1Src}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 3px solid ${f1Color}; box-shadow: 0 0 10px ${f1Color};" onerror="this.onerror=null; this.src='${fallbackSvg}';" />
                    <div>
                        <h2 class="font-outfit" style="color:#fff; text-shadow: 0 0 10px ${f1Color}; margin-bottom: 0;">${f1.name}</h2>
                    </div>
                </div>
                
                <div style="text-align: center; width: 20%;">
                    <h1 class="font-outfit" style="font-size: 3rem; margin:0;" id="match-score">0 - 0</h1>
                    <span id="match-round" class="tag" style="background:#ff5252; color:#fff;">Round 1</span>
                </div>
                
                <div style="display: flex; flex-direction: row-reverse; gap: 1rem; align-items: center; text-align: right; width: 40%;">
                    <img src="${img2Src}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 3px solid ${f2Color}; box-shadow: 0 0 10px ${f2Color};" onerror="this.onerror=null; this.src='${fallbackSvg}';" />
                    <div>
                        <h2 class="font-outfit" style="color:#fff; text-shadow: 0 0 10px ${f2Color}; margin-bottom: 0;">${f2.name}</h2>
                    </div>
                </div>
            </div>
            
            <!-- Match Meters -->
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; gap: 2rem;">
                <div style="width: 50%;" class="glass-panel" style="padding: 1rem;">
                    ${this._createMetersHTML('f1', f1)}
                </div>
                <div style="width: 50%;" class="glass-panel" style="padding: 1rem;">
                   ${this._createMetersHTML('f2', f2)}
                </div>
            </div>

            <!-- Match Energy -->
            <div style="margin-top: 1.5rem; text-align: center; padding: 0 1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size: 0.85rem; color:var(--text-muted); text-transform: uppercase;">
                    <span>Cold</span><span id="crowd-energy-label" style="color:#ffeb3b;">Match Energy ⚡</span><span>Electric</span>
                </div>
                <div class="glass-panel" style="height: 14px; padding:0; border-radius: 7px; overflow:hidden; box-shadow: inset 0 0 5px rgba(0,0,0,0.5);">
                    <div id="crowd-intensity-bar" style="height: 100%; width: 40%; background: linear-gradient(90deg, #ffeb3b, #ff3d00); border-radius: 7px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(255, 61, 0, 0.5);"></div>
                </div>
            </div>
            
            <!-- Event Feed -->
            <div class="glass-panel" style="margin-top: 1.5rem; height: 350px; overflow-y: auto; padding: 1.5rem; font-size: 1.1rem; line-height: 1.6; display: flex; flex-direction: column;" id="match-feed">
            </div>
            
            <!-- Controls Base -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px;">
                <div style="display:flex; gap: 0.5rem; align-items:center;">
                   <button class="btn-primary" onclick="window.UIMatch.playNextEvent()" id="btn-step">Step</button>
                   <span style="color:var(--text-muted); margin-left:1rem; font-size:0.9rem;">Auto-Play:</span>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(1500)">Normal</button>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(800)">Fast</button>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(200)">Fastest</button>
                   <button class="btn-primary" onclick="window.UIMatch.pausePlay()" style="background: #e0284f;" id="btn-pause">Pause</button>
                </div>
                <!-- No Tactics for Underground -->
                <div id="corner-options" style="display: flex; gap: 0.5rem;"></div>
                <div>
                    <button id="post-match-btn" class="btn-primary hidden" onclick="window.UIMatch.runPostMatch()">Resolve Match</button>
                </div>
            </div>
        `;

        this._appendLog(`<em style="color:#ff5252;">Match begins. Target: Total Subjugation.</em>`);
    },

    startMatchWithSelections(playerFighterId, oppFighterId, matchId) {
        const gs = window.GameState;
        const targetMatch = gs.schedule.find(m => m.id === matchId);

        // Save the currently targeted Match ID to the global UI object so Post-Match can find it easily
        this.activeMatchId = matchId;

        // Clear any residual context from Underground matches or Paired Activities
        this.activeUndergroundContext = null;
        this.activePairedContext = null;

        let isHome = targetMatch.home === gs.playerClubId;
        if (isHome) {
            targetMatch.homeFighter = playerFighterId;
            targetMatch.awayFighter = oppFighterId;
        } else {
            targetMatch.homeFighter = oppFighterId;
            targetMatch.awayFighter = playerFighterId;
        }

        const f1 = gs.getFighter(isHome ? playerFighterId : oppFighterId);
        const f2 = gs.getFighter(isHome ? oppFighterId : playerFighterId);

        this.currentSim = new MatchSimulation(f1, f2, targetMatch.style, true); // true = player involvement
        this.currentSim.startMatch();
        this._crowdFrenzyFired = false;
        this._crowdHotFired = false;

        const playerClub = gs.getClub(f1.club_id);
        const oppClub = gs.getClub(f2.club_id);
        const container = document.getElementById('main-view') || document.body;

        let prepTalk = "";
        let r = f1.dynamic_state.relationships && f1.dynamic_state.relationships[f2.id];
        if (r && (r.type === 'bitter_rivals' || r.type === 'obsession')) {
            let quoteHtml = window.NarrativeGenerator.generateDialogue(f1, true);
            prepTalk = `<div style="background: rgba(255,0,0,0.2); border-left: 4px solid red; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;"><strong>Pre-Match Trash Talk:</strong><br>${quoteHtml}</div>`;
        }

        // Match UI Definitions
        const img1Src = f1.avatar ? `assets/portraits/${f1.avatar}` : `assets/portraits/${f1.name.toLowerCase()}.png`;
        const img2Src = f2.avatar ? `assets/portraits/${f2.avatar}` : `assets/portraits/${f2.name.toLowerCase()}.png`;
        const fallbackSvg = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="24">?</text></svg>`);

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('Match Event', 'Watch the simulation unfold in real-time.')}
            
            ${prepTalk}

            <!-- Match Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-glass);">
                <div style="display: flex; gap: 1rem; align-items: center; width: 40%;">
                    <img src="${img1Src}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 3px solid ${playerClub.color}; box-shadow: 0 0 10px ${playerClub.color};" onerror="this.onerror=null; this.src='${fallbackSvg}';" />
                    <div>
                        <h2 class="font-outfit" style="color:#fff; text-shadow: 0 0 10px ${playerClub.color}; margin-bottom: 0;">${f1.name}</h2>
                        <div style="margin-top: 0.5rem;">${window.UIComponents.createClubBadge(playerClub)}</div>
                    </div>
                </div>
                
                <div style="text-align: center; width: 20%;">
                    <h1 class="font-outfit" style="font-size: 3rem; margin:0;" id="match-score">0 - 0</h1>
                    <span id="match-round" class="tag" style="background:var(--accent); color:#fff;">Round 1</span>
                </div>
                
                <div style="display: flex; flex-direction: row-reverse; gap: 1rem; align-items: center; text-align: right; width: 40%;">
                    <img src="${img2Src}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 3px solid ${oppClub.color}; box-shadow: 0 0 10px ${oppClub.color};" onerror="this.onerror=null; this.src='${fallbackSvg}';" />
                    <div>
                        <h2 class="font-outfit" style="color:#fff; text-shadow: 0 0 10px ${oppClub.color}; margin-bottom: 0;">${f2.name}</h2>
                        <div style="margin-top: 0.5rem;">${window.UIComponents.createClubBadge(oppClub)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Match Meters -->
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; gap: 2rem;">
                <!-- F1 Meters -->
                <div style="width: 50%;" class="glass-panel" style="padding: 1rem;">
                    ${this._createMetersHTML('f1', f1)}
                </div>
                <!-- F2 Meters -->
                <div style="width: 50%;" class="glass-panel" style="padding: 1rem;">
                   ${this._createMetersHTML('f2', f2)}
                </div>
            </div>

            <!-- Match Energy -->
            <div style="margin-top: 1.5rem; text-align: center; padding: 0 1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size: 0.85rem; color:var(--text-muted); text-transform: uppercase;">
                    <span>Cold</span><span id="crowd-energy-label" style="color:#ffeb3b;">Match Energy ⚡</span><span>Electric</span>
                </div>
                <div class="glass-panel" style="height: 14px; padding:0; border-radius: 7px; overflow:hidden; box-shadow: inset 0 0 5px rgba(0,0,0,0.5);">
                    <div id="crowd-intensity-bar" style="height: 100%; width: 40%; background: linear-gradient(90deg, #ffeb3b, #ff3d00); border-radius: 7px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(255, 61, 0, 0.5);"></div>
                </div>
            </div>
            
            <!-- Event Feed -->
            <div class="glass-panel" style="margin-top: 1.5rem; height: 350px; overflow-y: auto; padding: 1.5rem; font-size: 1.1rem; line-height: 1.6; display: flex; flex-direction: column;" id="match-feed">
                <!-- Lines injected dynamically -->
            </div>
            
            <!-- Controls Base -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px;">
                <div style="display:flex; gap: 0.5rem; align-items:center;">
                   <button class="btn-primary" onclick="window.UIMatch.playNextEvent()" id="btn-step">Step</button>
                   <span style="color:var(--text-muted); margin-left:1rem; font-size:0.9rem;">Auto-Play:</span>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(1500)">Normal</button>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(800)">Fast</button>
                   <button class="btn-primary" onclick="window.UIMatch.setSpeed(200)">Fastest</button>
                   <button class="btn-primary" onclick="window.UIMatch.pausePlay()" style="background: #e0284f;" id="btn-pause">Pause</button>
                </div>
                <div id="corner-options" style="display: flex; gap: 0.5rem;">
                    <!-- Tactics injected here -->
                </div>
                <div>
                    <button id="post-match-btn" class="btn-primary hidden" onclick="window.UIMatch.runPostMatch()">Continue to Post-Match</button>
                </div>
            </div>
        `;

        // Initial text
        this._appendLog(`Match begins. Style rules: <strong style="text-transform:uppercase;">${targetMatch.style.replace('_', ' ')}</strong>.`);
        this._updateTacticsUI();
    },

    _updateTacticsUI() {
        const co = document.getElementById('corner-options');
        if (!co) return;

        // Check if round boundary and player is involved
        if (this.currentSim.matchLog.length === 0 && !this.currentSim.winner) {
            let isPlayerF1 = this.currentSim.f1.club_id === window.GameState.playerClubId;
            let isPlayerF2 = this.currentSim.f2.club_id === window.GameState.playerClubId;

            if (isPlayerF1 || isPlayerF2) {
                co.innerHTML = `
                    <span style="color:var(--text-muted); align-self:center; margin-right: 0.5rem;">Tactic: </span>
                    <button class="btn-primary" style="padding: 0.5rem; font-size: 0.8rem; background: #e0284f;" onclick="window.UIMatch.setStance('aggressive')">Aggressive</button>
                    <button class="btn-primary" style="padding: 0.5rem; font-size: 0.8rem; background: #555;" onclick="window.UIMatch.setStance('balanced')">Balanced</button>
                    <button class="btn-primary" style="padding: 0.5rem; font-size: 0.8rem; background: #28a0e0;" onclick="window.UIMatch.setStance('defensive')">Defensive</button>
                    <button class="btn-primary" style="padding: 0.5rem; font-size: 0.8rem; background: #d4af37;" onclick="window.UIMatch.setStance('showboat')">Showboat</button>
                `;
            }
        } else {
            co.innerHTML = ''; // Hide when reading text mid-round
        }
    },

    setStance(stance) {
        let isPlayerF1 = this.currentSim.f1.club_id === window.GameState.playerClubId;
        if (isPlayerF1) this.currentSim.f1.stance = stance;
        else this.currentSim.f2.stance = stance;

        this._appendLog(`<em>Corner calls for a <strong>${stance}</strong> approach this round.</em>`);

        // Auto-resume at the previously selected simulation speed
        this.setSpeed(this.speedMs);
    },

    _createMetersHTML(pfx, fighter) {
        return `
            <div style="padding: 1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Health</span><span id="${pfx}-hp-text">100%</span></div>
                <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 1rem;">
                    <div id="${pfx}-hp-bar" style="height: 100%; width: 100%; background: #00e676; border-radius: 6px; transition: width 0.3s ease;"></div>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Stamina</span><span id="${pfx}-stm-text">100%</span></div>
                <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 1rem;">
                    <div id="${pfx}-stm-bar" style="height: 100%; width: 100%; background: #29b6f6; border-radius: 6px; transition: width 0.3s ease;"></div>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:var(--accent);"><span>Dominance</span></div>
                <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                    <div id="${pfx}-dom-bar" style="height: 100%; width: 0%; background: var(--accent); border-radius: 3px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    },

    setSpeed(ms) {
        this.speedMs = ms;
        if (this.playTimer) clearInterval(this.playTimer);
        this.playTimer = setInterval(() => this.playNextEvent(), this.speedMs);

        let bs = document.getElementById('btn-step');
        if (bs) bs.disabled = true;
    },

    pausePlay() {
        if (this.playTimer) {
            clearInterval(this.playTimer);
            this.playTimer = null;
        }

        let bs = document.getElementById('btn-step');
        if (bs) bs.disabled = false;
    },

    playNextEvent() {
        if (!this.currentSim) return;

        // If sim has unread log entries, print one and apply visual update
        if (this.currentSim.matchLog.length > 0) {
            const entry = this.currentSim.matchLog.shift();
            this._handleLogEntry(entry);
            if (this.currentSim.matchLog.length === 0) this._updateTacticsUI();
            return; // We consumed one visual tick
        }

        // If no unread log, generate next round
        if (this.currentSim.winner) {
            this._appendLog(`<br/><h2 style="color:var(--accent); text-align:center;">Winner: ${this.currentSim.winner.name}</h2>`);
            this.pausePlay();
            document.getElementById('post-match-btn').classList.remove('hidden');
            document.getElementById('corner-options').innerHTML = ''; // Hide tactics
            return;
        }

        // Pause auto-play to ask for tactics if array is empty and player hasn't picked
        // (Handled by manual step clicks mostly, but let's pause auto-play before next round)
        if (this.playTimer && this.currentSim.matchLog.length === 0 && !this.currentSim.winner) {
            let p1 = this.currentSim.f1.club_id === window.GameState.playerClubId;
            let p2 = this.currentSim.f2.club_id === window.GameState.playerClubId;
            if (p1 || p2) {
                // Pause for input
                this.pausePlay();
                this._updateTacticsUI();
                return;
            }
        }

        this.currentSim.playRound();
        // Recurse to immediately display the first log of the new round
        this.playNextEvent();
    },

    _handleLogEntry(e) {
        if (e.type === 'ROUND_START') {
            document.getElementById('match-round').innerText = `Round ${e.round}`;
            this._appendLog(`<br/><strong>${e.text}</strong>`);
        }
        else if (e.type === 'EXCHANGE' || e.type === 'PSYCH_EVENT') {
            this._appendLog(e.text);
            this._updateMeters(); // Sync visual health bars

            if (e.damage !== undefined) {
                let meter = document.getElementById('crowd-intensity-bar');
                if (meter) {
                    let currentEnergy = parseFloat(meter.style.width) || 40;
                    let newEnergy = Math.min(100, Math.max(10, currentEnergy * 0.95 + (e.damage * 0.6)));
                    meter.style.width = newEnergy + '%';

                    // Color shifts as energy climbs
                    if (newEnergy >= 90) {
                        meter.style.background = 'linear-gradient(90deg, #ff3d00, #ff1744)';
                        meter.style.boxShadow = '0 0 20px rgba(255,23,68,0.9)';
                    } else if (newEnergy >= 70) {
                        meter.style.background = 'linear-gradient(90deg, #ffab00, #ff3d00)';
                        meter.style.boxShadow = '0 0 14px rgba(255,61,0,0.7)';
                    } else {
                        meter.style.background = 'linear-gradient(90deg, #ffeb3b, #ff9800)';
                        meter.style.boxShadow = '0 0 8px rgba(255,152,0,0.5)';
                    }

                    // HIGH ENERGY EFFECT: crowd boost for the leader
                    if (newEnergy >= 90 && !this._crowdFrenzyFired) {
                        this._crowdFrenzyFired = true;
                        this._appendLog(`<em style="color:#ffab00;">🔥 <strong>THE CROWD IS ON THEIR FEET!</strong> The electric atmosphere surges through the fighters — the leader draws renewed strength!</em>`);
                        // Give a stamina boost to the fighter currently leading on rounds
                        const s = this.currentSim;
                        if (s) {
                            const leader = s.roundsWon.f1 >= s.roundsWon.f2 ? s.f1 : s.f2;
                            leader.stamina = Math.min(100, leader.stamina + 12);
                            leader.currentStats.composure = Math.min(100, leader.currentStats.composure + 5);
                        }
                    } else if (newEnergy >= 70 && newEnergy < 90 && !this._crowdHotFired) {
                        this._crowdHotFired = true;
                        this._appendLog(`<em style="color:#ffeb3b;">⚡ The crowd erupts — this is turning into a classic!</em>`);
                    }
                }
            }
        }
        else if (e.type === 'ROUND_END') {
            document.getElementById('match-score').innerText = e.scores.replace('-', ' - ');
            this._appendLog(`<em>End of Round ${e.round}. Split: ${e.roundWinner} won the round.</em>`);
        }
    },

    _updateMeters() {
        const s = this.currentSim;
        if (!s) return;

        const applyM = (pfx, obj) => {
            let hp = Math.max(0, Math.min(100, obj.health));
            let hpC = hp > 50 ? '#00e676' : hp > 25 ? '#ffea00' : '#ff3d00';
            let hpBar = document.getElementById(`${pfx}-hp-bar`);
            if (hpBar) { hpBar.style.width = hp + '%'; hpBar.style.background = hpC; document.getElementById(`${pfx}-hp-text`).innerText = Math.round(hp) + '%'; }

            let stm = Math.max(0, Math.min(100, obj.stamina));
            let stmBar = document.getElementById(`${pfx}-stm-bar`);
            if (stmBar) { stmBar.style.width = stm + '%'; document.getElementById(`${pfx}-stm-text`).innerText = Math.round(stm) + '%'; }

            let dom = Math.max(0, Math.min(100, obj.dominanceScore * 2)); // scaling factor
            let domBar = document.getElementById(`${pfx}-dom-bar`);
            if (domBar) { domBar.style.width = dom + '%'; }
        };

        applyM('f1', s.f1); applyM('f2', s.f2);
    },

    _appendLog(text) {
        const feedContainer = document.getElementById('match-feed');
        if (!feedContainer) return;

        let el = document.createElement('div');
        el.className = 'log-entry';
        el.style.marginBottom = '1rem';
        el.style.paddingBottom = '0.5rem';
        el.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        // Slightly darker background for dialogue lines to make them pop
        if (text.includes('class="dialogue"')) {
            el.style.background = 'rgba(0,0,0,0.2)';
            el.style.padding = '0.5rem';
            el.style.borderRadius = '4px';
            el.style.borderLeft = '3px solid var(--accent)';
        }

        // Add a slight red tinge to heavy hits
        if (text.includes('brutal') || text.includes('devastating') || text.includes('blood') || text.includes('savage')) {
            el.style.color = '#ff9999';
        }

        el.innerHTML = text;
        feedContainer.appendChild(el);
        feedContainer.scrollTop = feedContainer.scrollHeight;
    },

    runPostMatch() {
        let winner = this.currentSim.winner;
        let loser = winner === this.currentSim.f1 ? this.currentSim.f2 : this.currentSim.f1;

        if (this.activeUndergroundContext) {
            if (this.activeUndergroundContext.type === 'midseasoncup') {
                if (window.UICup && window.UICup.processPlayerMatchResult) {
                    window.UICup.processPlayerMatchResult(winner, loser, this.activeUndergroundContext);
                }
                return;
            }

            // Reroute entirely to UIUnderground
            if (window.UIUnderground && window.UIUnderground.processMatchResult) {
                window.UIUnderground.processMatchResult(winner, loser, this.activeUndergroundContext);
            }
            return;
        }

        if (this.activePairedContext) {
            // Reroute entirely to UIInteractions
            if (window.UIInteractions && window.UIInteractions.processPairedMatchResult) {
                window.UIInteractions.processPairedMatchResult(winner, loser, this.activePairedContext);
            }
            return;
        }

        let wOrig = window.GameState.getFighter(winner.id);
        let lOrig = window.GameState.getFighter(loser.id);

        let roundDiff = Math.abs(this.currentSim.f1Rounds - this.currentSim.f2Rounds);
        if (window.SimEvents) {
            window.SimEvents.processPostMatch(wOrig.id, lOrig.id, roundDiff, this.currentSim.style);
        }

        if (window.RelationshipEngine) {
            window.RelationshipEngine.hookIntoPostMatchPunishment(wOrig.id, lOrig.id);
        }

        let targetMatch = window.GameState.schedule.find(m => m.id === this.activeMatchId);
        if (targetMatch) {
            targetMatch.winnerId = winner.id;
            targetMatch.rounds = this.currentSim.roundsWon;

            // Trigger per-match / per-win sponsor payout immediately
            if (window.UISponsors) {
                const gs = window.GameState;
                const playerClubId = gs.playerClubId;
                const winnerClubId = gs.getFighter(winner.id)?.club_id;
                window.UISponsors.collectMatchPayout(targetMatch, winnerClubId === playerClubId);
            }
        }

        let pDunger = wOrig.personality.dominance_hunger;
        let pLean = lOrig.personality.submissive_lean;
        let winColor = window.GameState.getClub(wOrig.club_id)?.color || '#fff';
        let isWhitewash = roundDiff >= 4;

        let punishHtml = "<h3>Post-Match Sequence</h3>";
        let relChange = '';

        let wBadge = `<span style="padding: 0 4px; background: ${winColor}; color: #fff; border-radius: 3px; text-shadow:1px 1px 2px #000; font-weight:bold;">${wOrig.name}</span>`;

        // Massive Narrative Overhaul for Punishments
        if (pDunger < 40) {
            punishHtml += `<p>${wBadge} kneels beside the battered ${lOrig.name}, offering a hand to pull her up. A rare display of sportsmanship.</p>`;
            if (isWhitewash) relChange = this._updateRelationship(wOrig, lOrig, 'best_friends');
        } else if (pDunger >= 40 && pDunger <= 70) {
            if (isWhitewash) {
                punishHtml += `<p>${wBadge} stands victorious over the completely broken ${lOrig.name}. She places a foot squarely on ${lOrig.name}'s chest, raising her arms to the screaming crowd as a supreme display of dominance!</p>`;
                relChange = this._updateRelationship(wOrig, lOrig, 'bitter_rivals');
            } else {
                punishHtml += `<p>${wBadge} struts around the ring, soaking in the cheers while ignoring the groaning ${lOrig.name} on the mat.</p>`;
            }
            lOrig.dynamic_state.morale -= 10;
        } else if (pDunger > 70) {
            if (pLean > 50 && !lOrig.personality.boundaries.includes("no_public_degradation")) {
                let eroticText = [
                    `${wBadge} crawls over the exhausted ${lOrig.name}, pinning her down. She leans in close, whispering something filthy into her ear while slowly, humiliatingly trailing her fingers down ${lOrig.name}'s stomach. ${lOrig.name} can only flush bright red in helpless submission.`,
                    `${wBadge} grabs ${lOrig.name} by the hair, yanking her head back exposing her throat, and forcefully presses a deep, dominating kiss to her lips in front of the flashing cameras. ${lOrig.name} gasps, completely overwhelmed and violated.`
                ];
                punishHtml += `<p style="color:var(--text-highlight); font-style:italic;">${eroticText[Math.floor(Math.random() * eroticText.length)]}</p>`;
                if (isWhitewash) relChange = this._updateRelationship(wOrig, lOrig, 'committed');
                lOrig.dynamic_state.morale -= 15;
            } else {
                let violentText = [
                    `${wBadge} refuses to back off! She grabs a handful of ${lOrig.name}'s hair and brutally slams her face back into the canvas long after the bell has rung! The officials literally have to tear her away!`,
                    `${wBadge} sadistically cranks a submission hold even tighter despite the match being over, forcing ${lOrig.name} to scream in agony until security intervenes.`
                ];
                punishHtml += `<p style="color:#ff9999; font-weight:bold;">${violentText[Math.floor(Math.random() * violentText.length)]}</p>`;
                relChange = this._updateRelationship(wOrig, lOrig, 'bitter_rivals');
                lOrig.dynamic_state.morale -= 25;
                lOrig.dynamic_state.stress += 30;
            }
        }

        if (relChange) {
            punishHtml += `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem; background: rgba(255,255,255,0.05); padding: 5px; border-radius:3px;"><strong>System:</strong> ${relChange}</div>`;
        }

        let inj1 = wOrig.dynamic_state.injuries;
        let inj2 = lOrig.dynamic_state.injuries;
        let mdHtml = "";
        if ((inj1 && inj1.length > 0) || (inj2 && inj2.length > 0)) {
            let docStr = "";
            let drNames = ["Dr. Kinsley", "Dr. Vance", "Dr. Thorne"];
            let dr = drNames[Math.floor(Math.random() * drNames.length)];

            if (inj2 && inj2.length > 0) inj2.forEach(inj => { docStr += `${lOrig.name} sustained a <strong>${inj.name}</strong>${inj.severity ? ` (${inj.severity})` : ""} — ${inj.duration} week${inj.duration > 1 ? "s" : ""} recovery required. `; });
            if (inj1 && inj1.length > 0) inj1.forEach(inj => { docStr += `${wOrig.name} also suffered a <strong>${inj.name}</strong> — ${inj.duration} week${inj.duration > 1 ? "s" : ""} out. `; });

            mdHtml = `
            <div class="glass-panel" style="margin-top:2rem; border-left:4px solid var(--danger); padding:1.5rem;">
                <h4 style="color:var(--danger); margin-bottom:0.5rem; display:flex; align-items:center; gap:10px;">
                    <span>🏥</span> Official Medical Report - ${dr}
                </h4>
                <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.5;">"${docStr.trim()}"</p>
            </div>`;
        }

        const feedContainer = document.getElementById('match-feed');
        feedContainer.innerHTML = '';
        this._appendLog(punishHtml + mdHtml);

        let btn = document.getElementById('post-match-btn');
        btn.innerText = "Finish & Advance Week";
        btn.onclick = () => {
            if (window.AIEngine) { window.AIEngine.processWeek(); }
            window.Router.loadRoute('club');
        };
    },

    _updateRelationship(f1, f2, type) {
        const re = window.RelationshipEngine;
        if (!re) return null;

        const r1 = re._getOrInitRelation(f1, f2.id);
        if (r1.type === type) return null; // No change

        // Handle romantic bonding via engine so primary_partner_id is set correctly
        if (type === 'committed' || type === 'obsession') {
            re._formCouple(f1, f2);
        } else if (type === 'best_friends') {
            re._applyBestFriend(f1, f2);
            const r1b = re._getOrInitRelation(f1, f2.id);
            const r2b = re._getOrInitRelation(f2, f1.id);
            r1b.type = 'best_friends'; r2b.type = 'best_friends';
        } else {
            // Set type directly for non-exclusive types (rivalry, bitter_rivals etc.)
            const r2 = re._getOrInitRelation(f2, f1.id);
            r1.type = type; r2.type = type;
            // If breaking romantic bond, clear partner IDs
            if (type === 'bitter_rivals' || type === 'rivalry') {
                if (f1.dynamic_state.primary_partner_id === f2.id) re._breakUpCouple(f1, f2);
            }
        }

        return `${f1.name} and ${f2.name}: ${window.UIRelationships?.getRelLabel(type) || type}.`;
    }
};