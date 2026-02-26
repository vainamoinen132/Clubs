/**
 * ui_relationships.js
 * Visualizes the interpersonal dynamics between club fighters using an HTML5 Canvas network graph.
 */

window.UIRelationships = {
    selectedPair: null, // [id1, id2]

    render(container, params) {
        const gs = window.GameState;

        // Reset state
        this.selectedPair = null;

        let html = `
            ${window.UIComponents.createSectionHeader('The Relationship Web', 'Monitor and manage the social dynamics within your team.')}
            
            <div style="display: flex; gap: 2rem; align-items: flex-start;">
                <!-- Left: Canvas Network -->
                <div class="glass-panel" style="flex: 2; padding: 2rem; text-align:center; position:relative;">
                    <canvas id="rel-network-canvas" width="600" height="500" style="max-width: 100%; border-radius: 8px; background: rgba(0,0,0,0.3);"></canvas>
                    <p class="text-muted mt-2" style="font-size:0.85rem;">Click a connection line to view exact relationship details.</p>
                </div>

                <!-- Right: Pair Detail Panel -->
                <div class="glass-panel" id="rel-detail-panel" style="flex: 1; padding: 1.5rem; min-height: 500px;">
                    <h3 class="text-muted" style="text-align:center; margin-top:200px;">Select a connection to view details</h3>
                </div>
            </div>
            
            <!-- 2A. Locker Room Tag Viewer -->
            <div class="glass-panel mt-4" style="padding:1.5rem;">
                <h3>Active Locker Room Dynamics</h3>
                <div id="locker-room-tags" class="mt-2 text-muted" style="display: flex; gap: 1rem; flex-wrap: wrap;">Scanning dynamics...</div>
            </div>
            
            <div class="glass-panel mt-4" style="padding:1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Cross-Club Tension</h3>
                    <select id="cross-club-filter-select" onchange="window.UIRelationships.renderCrossClub(this.value)" style="padding: 0.5rem; background: rgba(0,0,0,0.5); border: 1px solid var(--border-glass); color: #fff; border-radius: 4px;">
                        <option value="all">All Fighters</option>
                    </select>
                </div>
                <div id="cross-club-list" class="mt-2 text-muted">Scanning global networks...</div>
            </div>
        `;

        container.innerHTML = html;

        setTimeout(() => {
            this.drawNetwork();
            this.renderCrossClub();
            this.renderLockerRoomTags();
        }, 50);
    },

    getRelColors(type) {
        switch (type) {
            case 'rivalry': return '#ff9800';
            case 'bitter_rivals': return '#f44336';
            case 'attraction': return '#e91e63';
            case 'committed': return '#c2185b'; // replaces 'lovers'
            case 'obsession': return '#9c27b0';
            case 'best_friends': return '#4caf50'; // replaces 'friendship'
            case 'mentor': return '#03a9f4';
            case 'friction': return '#ffeb3b';
            case 'aware': return '#9e9e9e';
            // Legacy aliases (for old save data)
            case 'lovers': return '#c2185b';
            case 'friendship': return '#4caf50';
            default: return '#555';
        }
    },

    getRelLabel(type) {
        const labels = {
            'committed': '💕 Partners',
            'obsession': '🔥 Obsession',
            'best_friends': '💛 Best Friends',
            'mentor': '🎓 Mentor',
            'bitter_rivals': '⚔️ Bitter Rivals',
            'rivalry': '🥊 Rivalry',
            'attraction': '✨ Attraction',
            'friction': '⚡ Friction',
            'aware': '👁️ Aware',
            'neutral': '— Neutral',
            // Legacy
            'lovers': '💕 Lovers',
            'friendship': '💛 Friends',
        };
        return labels[type] || type.replace('_', ' ').toUpperCase();
    },

    drawNetwork() {
        const canvas = document.getElementById('rel-network-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const gs = window.GameState;

        let club = gs.getClub(gs.playerClubId);
        if (!club || !club.fighter_ids || club.fighter_ids.length === 0) return;

        let fighters = club.fighter_ids.map(id => gs.getFighter(id)).filter(f => f != null);

        // Setup nodes in a diamond/square formation
        let w = canvas.width;
        let h = canvas.height;
        let cx = w / 2;
        let cy = h / 2;
        let radius = 180;

        let nodes = [];
        for (let i = 0; i < fighters.length; i++) {
            let angle = (Math.PI * 2 * i) / Math.max(1, fighters.length) - (Math.PI / 2);
            nodes.push({
                f: fighters[i],
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                r: 40
            });
        }

        // Draw connections first (behind nodes)
        // Keep track of lines for clicking
        this.lines = [];

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let n1 = nodes[i];
                let n2 = nodes[j];

                let relData = (n1.f.dynamic_state.relationships && n1.f.dynamic_state.relationships[n2.f.id]) || { tension: 0, type: 'neutral' };
                let tension = relData.tension || 0;

                let color = tension > 0 ? this.getRelColors(relData.type) : 'rgba(255,255,255,0.1)';
                let lineWidth = tension > 0 ? Math.max(1, (tension / 100) * 12) : 1;

                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;

                if (tension > 0) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = color;
                }
                ctx.stroke();
                ctx.shadowBlur = 0; // reset

                // Save line path for interaction
                this.lines.push({ n1, n2, tension, color, type: relData.type });
            }
        }

        // Draw nodes
        nodes.forEach(n => {
            const ds = n.f.dynamic_state || {};
            // Ring colour: gold if has partner, cyan if has best friend, else default blue
            let ringColor = '#3b82f6';
            let badge = '';
            if (ds.primary_partner_id) { ringColor = '#c2185b'; badge = '👑'; }
            else if (ds.best_friend_id) { ringColor = '#4caf50'; badge = '💛'; }

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = ringColor;
            ctx.shadowBlur = badge ? 12 : 0;
            ctx.shadowColor = ringColor;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Name
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let names = n.f.name.split(' ');
            if (names.length > 1) {
                ctx.fillText(names[0], n.x, n.y - 9);
                ctx.fillText(names[1], n.x, n.y + 7);
            } else {
                ctx.fillText(n.f.name, n.x, n.y);
            }
            // Badge
            if (badge) {
                ctx.font = '14px serif';
                ctx.fillText(badge, n.x + n.r - 4, n.y - n.r + 4);
            }
        });

        // Add click listener
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Simple distance check to line segment
            let clickedLine = null;
            let minDist = 15; // px threshold

            this.lines.forEach(l => {
                let A = l.n1;
                let B = l.n2;
                // Distance point to line segment math
                let l2 = Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2);
                let t = Math.max(0, Math.min(1, ((x - A.x) * (B.x - A.x) + (y - A.y) * (B.y - A.y)) / l2));
                let projX = A.x + t * (B.x - A.x);
                let projY = A.y + t * (B.y - A.y);
                let dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));

                if (dist < minDist) {
                    minDist = dist;
                    clickedLine = l;
                }
            });

            if (clickedLine) {
                this.selectedPair = [clickedLine.n1.f.id, clickedLine.n2.f.id];
                this.renderDetail();
            }
        };

        // Add cursor hover effect wrapper
        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            let hovering = false;
            this.lines.forEach(l => {
                let l2 = Math.pow(l.n1.x - l.n2.x, 2) + Math.pow(l.n1.y - l.n2.y, 2);
                let t = Math.max(0, Math.min(1, ((x - l.n1.x) * (l.n2.x - l.n1.x) + (y - l.n1.y) * (l.n2.y - l.n1.y)) / l2));
                let projX = l.n1.x + t * (l.n2.x - l.n1.x);
                let projY = l.n1.y + t * (l.n2.y - l.n1.y);
                if (Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2)) < 15) hovering = true;
            });
            canvas.style.cursor = hovering ? 'pointer' : 'default';
        }
    },

    renderDetail() {
        if (!this.selectedPair) return;
        const gs = window.GameState;
        let f1 = gs.getFighter(this.selectedPair[0]);
        let f2 = gs.getFighter(this.selectedPair[1]);

        let rel = f1.dynamic_state.relationships[f2.id];
        let color = this.getRelColors(rel.type);

        let dp = document.getElementById('rel-detail-panel');

        let nextMilestone = rel.tension < 20 ? 20 : rel.tension < 35 ? 35 : rel.tension < 55 ? 55 : rel.tension < 75 ? 75 : rel.tension < 95 ? 95 : "MAX";
        let progressToNext = nextMilestone === "MAX" ? 100 : Math.round((rel.tension / nextMilestone) * 100);

        let histHtml = rel.history.length === 0 ? "<p class='text-muted'>No significant events recorded.</p>" : rel.history.slice(-5).reverse().map(h => `<div style="font-size:0.85em; margin-bottom:5px; padding-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.05);">${h}</div>`).join('');

        // Extra context badges
        const f1ds = f1.dynamic_state || {};
        const f2ds = f2.dynamic_state || {};
        let partnerNote = '';
        if (f1ds.primary_partner_id === f2.id) {
            partnerNote = `<div style="text-align:center; margin-bottom:0.5rem; color:#c2185b; font-size:0.85em;">👑 Exclusive Partners</div>`;
        } else if (f1ds.best_friend_id === f2.id) {
            partnerNote = `<div style="text-align:center; margin-bottom:0.5rem; color:#4caf50; font-size:0.85em;">💛 Best Friends</div>`;
        } else if (f1ds.primary_partner_id && f1ds.primary_partner_id !== f2.id && (rel.type === 'attraction' || rel.type === 'committed')) {
            partnerNote = `<div style="text-align:center; margin-bottom:0.5rem; color:#ff9800; font-size:0.85em;">⚠️ ${f1.name} is already committed elsewhere — dangerous territory</div>`;
        }

        dp.innerHTML = `
            <h3 style="margin-bottom: 0.5rem; text-align:center;">${f1.name} <br><span style="color:#666; font-size:0.8em;">&</span><br> ${f2.name}</h3>
            ${partnerNote}
            <div style="text-align:center; margin: 1rem 0;">
                <span style="background:${color}; padding: 4px 12px; border-radius: 12px; font-weight:bold; font-size:0.9em; box-shadow: 0 0 10px ${color}88;">
                    ${this.getRelLabel(rel.type)}
                </span>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.85em; margin-bottom:5px;">
                    <span>Tension: ${rel.tension}</span>
                    <span style="color:var(--text-muted)">Next: ${nextMilestone}</span>
                </div>
                <div style="height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; position:relative;">
                    <div style="position:absolute; top:0; left:0; height:100%; width:${rel.tension}%; background: ${color}; border-radius:3px;"></div>
                </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 6px;">
                <h4 style="margin-bottom: 10px; font-size:0.9em; color:var(--text-muted); text-transform:uppercase;">Recent Events</h4>
                ${histHtml}
            </div>
        `;
    },

    renderCrossClub(filterId = 'all') {
        const gs = window.GameState;
        let crossRels = [];
        let filterSet = new Set();
        let allFightersInRels = new Map(); // Store distinct fighters for the dropdown

        // Scan ALL clubs for relationships, or just player club? The user says "a lot of info"
        // so let's scan all clubs
        Object.values(gs.clubs).forEach(club => {
            if (!club.fighter_ids) return;
            club.fighter_ids.forEach(id => {
                let f = gs.getFighter(id);
                if (f && f.dynamic_state && f.dynamic_state.relationships) {
                    Object.keys(f.dynamic_state.relationships).forEach(otherId => {
                        let relData = f.dynamic_state.relationships[otherId];
                        if (!relData || typeof relData.type !== 'string') return;

                        let otherF = gs.getFighter(otherId);
                        // Is cross club?
                        if (otherF && otherF.club_id !== club.id) {
                            // Prevent duplicates (A->B and B->A)
                            let pairKey = [f.id, otherF.id].sort().join('-');
                            if (!filterSet.has(pairKey)) {
                                filterSet.add(pairKey);
                                crossRels.push({ f1: f, f2: otherF, data: relData });
                                allFightersInRels.set(f.id, f.name);
                                allFightersInRels.set(otherF.id, otherF.name);
                            }
                        }
                    });
                }
            });
        });

        const cc = document.getElementById('cross-club-list');
        const select = document.getElementById('cross-club-filter-select');

        // Populate select if it only has 'all'
        if (select && select.options.length <= 1) {
            let sortedFighters = Array.from(allFightersInRels.entries()).sort((a, b) => a[1].localeCompare(b[1]));
            let optsHtml = '<option value="all">All Fighters</option>';
            sortedFighters.forEach(([id, name]) => {
                optsHtml += `<option value="${id}">${name}</option>`;
            });
            select.innerHTML = optsHtml;
            select.value = filterId;
        }

        if (crossRels.length === 0) {
            if (cc) cc.innerHTML = "No confirmed inter-club relationships detected on the public feeds.";
            return;
        }

        // Apply filter
        let filteredRels = crossRels;
        if (filterId !== 'all') {
            filteredRels = crossRels.filter(r => r.f1.id === filterId || r.f2.id === filterId);
        }

        if (filteredRels.length === 0) {
            if (cc) cc.innerHTML = `<p class="text-muted">No cross-club tension found for this fighter.</p>`;
            return;
        }

        let html = filteredRels.sort((a, b) => b.data.tension - a.data.tension).map(r => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px; border-bottom: 1px solid var(--border-glass);">
                <span>
                    <strong>${r.f1.name}</strong> (${gs.getClub(r.f1.club_id)?.name || 'FA'}) 
                    <span style="color:#aaa; font-size:0.8em; margin: 0 10px;">vs</span> 
                    <strong>${r.f2.name}</strong> (${gs.getClub(r.f2.club_id)?.name || 'FA'})
                </span>
                <span class="tag" style="background: ${this.getRelColors(r.data.type)}; color: #fff; text-shadow:none;">${String(r.data.type).toUpperCase()} (Tension: ${r.data.tension})</span>
            </div>
        `).join('');

        if (cc) cc.innerHTML = html;
    },

    renderLockerRoomTags() {
        const gs = window.GameState;
        let pclub = gs.getClub(gs.playerClubId);
        let tagsHTML = '';

        if (pclub && pclub.fighter_ids) {
            let processedPairs = new Set();
            pclub.fighter_ids.forEach(id => {
                let f = gs.getFighter(id);
                if (f && f.dynamic_state && f.dynamic_state.relationships) {
                    Object.keys(f.dynamic_state.relationships).forEach(otherId => {
                        if (pclub.fighter_ids.includes(otherId)) {
                            let pairKey = [id, otherId].sort().join('-');
                            if (!processedPairs.has(pairKey)) {
                                processedPairs.add(pairKey);
                                let relData = f.dynamic_state.relationships[otherId];
                                let otherF = gs.getFighter(otherId);

                                if (relData && typeof relData.type === 'string' && ['rivalry', 'bitter_rivals', 'obsession', 'mentor', 'committed', 'best_friends', 'lovers', 'attraction'].includes(relData.type)) {
                                    let color = this.getRelColors(relData.type);
                                    tagsHTML += `
                                        <div style="background: rgba(0,0,0,0.4); border-left: 4px solid ${color}; padding: 8px 12px; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                                            <span style="color: ${color}; font-weight: bold; font-size: 0.8em; letter-spacing: 1px;">${window.UIRelationships.getRelLabel(relData.type)}</span>
                                            <span style="color: #fff; font-size: 0.9em;"><strong>${f.name}</strong> & <strong>${otherF.name}</strong></span>
                                        </div>
                                    `;
                                }
                            }
                        }
                    });
                }
            });
        }

        const lrtContainer = document.getElementById('locker-room-tags');
        if (lrtContainer) {
            if (tagsHTML === '') {
                lrtContainer.innerHTML = '<em>No significant internal relationships discovered yet.</em>';
            } else {
                lrtContainer.innerHTML = tagsHTML;
            }
        }
    },

    // ── BETRAYAL EVENT CARD ──────────────────────────────────────────────────
    renderBetrayalEvent(container, event) {
        const gs = window.GameState;
        const betrayed = gs.getFighter(event.betrayedId);
        const cheater = gs.getFighter(event.cheaterId);
        const newPartner = gs.getFighter(event.newPartnerId);
        if (!betrayed || !cheater) return;

        container.innerHTML = `
            <div class="glass-panel" style="padding:2rem; border-left: 5px solid #f44336; max-width:600px; margin:auto;">
                <h2 style="color:#f44336; margin-bottom:1rem;">💔 BETRAYAL DISCOVERED</h2>
                <p style="margin-bottom:1.5rem;">
                    <strong>${betrayed.name}</strong> has found out that <strong>${cheater.name}</strong>
                    has been pursuing <strong>${newPartner?.name || '???'}</strong> behind her back.
                    The locker room atmosphere is combustible.
                </p>
                <p style="color:var(--text-muted); font-size:0.9em; margin-bottom:2rem;">
                    ${betrayed.name} is devastated. Morale −30, Stress +25.
                    What happens next depends on how this is resolved.
                </p>
                <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                    <button class="btn-primary" style="background:#f44336;"
                        onclick="window.RelationshipEngine.resolveConfrontation('${event.betrayedId}','${event.cheaterId}','${event.newPartnerId}','fight'); window.Router.loadRoute('relationships');">
                        ⚔️ Let Them Fight — Schedule Confrontation Match
                    </button>
                    <button class="btn-primary" style="background:#555;"
                        onclick="window.RelationshipEngine.resolveConfrontation('${event.betrayedId}','${event.cheaterId}','${event.newPartnerId}','part_ways'); window.Router.loadRoute('relationships');">
                        💨 Let It Go — They Part Ways
                    </button>
                </div>
            </div>
        `;
    }
};
