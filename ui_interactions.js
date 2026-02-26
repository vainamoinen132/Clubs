/**
 * ui_interactions.js
 * Three categories: Individual, Paired, Group.
 */

window.UIInteractions = {

    // ── NARRATIVE POOLS ───────────────────────────────────────────────────────────
    _narratives: {
        punishment_exhaust: [
            (f) => `You drove ${f.name} through two brutal hours of endless circuits with no water, no rest, no sympathy. By the end she was on all fours, fingers clawing the mat. She didn't break — but you could see the exact moment she wanted to. When you finally let her stop, she stayed there for a long time, not looking at you. The silence said everything.`,
            (f) => `The drills started reasonable and turned savage inside twenty minutes. ${f.name} kept pace longer than you expected — jaw set, eyes burning. But the fifth hour finally cracked her. She slid down the ropes and sat there, chest heaving, staring at nothing. She didn't ask to stop. That, at least, you respected.`,
            (f) => `${f.name} fought the exhaustion like a personal enemy — spitting curses under her breath, refusing to slow, refusing to acknowledge you watching. But the body doesn't negotiate. She buckled at the knees somewhere around the ninety-minute mark and didn't get back up cleanly. She trained harder leaving than she arrived. So did the lesson.`,
            (f) => `You pushed ${f.name} until sweat pooled on the canvas beneath her. She held her form through the first hour, crumbled in the second. When it was over, she sat against the wall, legs shaking, eyes down. She didn't thank you. Neither of you pretended she would.`
        ],
        punishment_beatdown: [
            (f) => `You paired ${f.name} with your most ruthless sparring partner and told them — quietly, clearly — to show no mercy. For twelve straight minutes ${f.name} absorbed punishment that would have hospitalised someone else. She tapped three times. Each time she got back up. When it finally ended, something in her posture had shifted. Not broken. Repositioned.`,
            (f) => `The beating was efficient and educational. ${f.name} found herself overmatched in every exchange — her strikes absorbed, her takedowns reversed, her space taken inch by inch. By the end she was simply surviving, instinct and grit carrying her where skill had failed. She left without speaking. She'll be back sharper.`,
            (f) => `${f.name} walked in overconfident and walked out silent. The sparring partner dismantled her systematically — nothing flashy, nothing theatrical, just cold dominance. The rest of the team pretended not to watch. They all watched. The hierarchy has been quietly recalibrated.`,
            (f) => `It was not a sparring session. It was a lesson delivered physically. ${f.name} absorbed it completely — every correction, every reversal, every submission. By the third tap she had stopped fighting the outcome and started absorbing the education. She'll understand later why you did it. She understood just enough tonight.`
        ],
        endurance_pass: [
            (f) => `${f.name} launched into the course like she had something to prove — and proved it. Carries, sprints, holds, all completed without complaint, several done faster than required. At the finish line she stood with her hands on her hips, chest heaving, staring back at the route as if daring it to have been harder. The team saw it. So did you.`,
            (f) => `It was ugly and it was real. ${f.name} nearly buckled on the final carry, legs gone, lungs screaming — but she refused to put it down. She crossed the finish line with her jaw clamped shut and her eyes red. No celebration. She simply turned and walked to the water station. It was the most impressive thing in the room.`
        ],
        endurance_fail: [
            (f) => `${f.name} hit the wall early and the wall won. She went down on the final sprint — not dramatically, just quietly, sitting down in the middle of the lane and staring at the ceiling. Nobody laughed. The silence was far worse. She didn't look at anyone on the way out.`,
            (f) => `The course broke ${f.name} at the halfway point. She slowed, then stopped, then lowered herself to the ground like the effort of standing had become optional. She muttered something that wasn't quite an apology and wasn't quite an excuse. The team gave her space. The space said everything.`
        ]
    },

    // ── RENDER ────────────────────────────────────────────────────────────────────
    render(container) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club) return;

        container.innerHTML = `
        ${window.UIComponents.createSectionHeader('Interactions', 'Shape your fighters through action, pressure, and desire.')}
        <div style="background:rgba(255,51,102,0.1);padding:1rem;border-radius:8px;margin-bottom:2rem;border-left:3px solid var(--accent);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:1.2rem;">Action Points: <strong>${gs.actionPoints}</strong></span>
            <span style="font-size:1.2rem;">Bank: <strong style="color:#00e676;">$${gs.money.toLocaleString()}</strong></span>
        </div>



        <h3 style="margin-bottom:0.5rem;font-family:var(--font-heading);color:#a855f7;">Paired Activities</h3>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;">Send two fighters somewhere together. Either from your squad — or challenge a fighter from a rival club.</p>
        <div id="paired-panel" style="margin-bottom:3rem;"></div>

        <h3 style="margin-bottom:0.5rem;font-family:var(--font-heading);color:#f59e0b;">Team Activities</h3>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;">Group events that shape the whole roster.</p>
        <div id="group-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;margin-bottom:2rem;"></div>

        <div id="interaction-modal" class="hidden flex-center" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.88);z-index:1000;padding:2rem;"></div>
    `;



        // Paired panel
        this._renderPairedPanel(document.getElementById('paired-panel'), club, gs);

        // Group cards
        this._renderGroupCards(document.getElementById('group-grid'), gs, club);
    },

    // ── INDIVIDUAL CARDS ──────────────────────────────────────────────────────────
    _createIndividualCard(fighter) {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '1.5rem';

        const actions = [
            { label: 'Counsel', icon: '🗣️', cost: 1, type: 'talk', color: '#4fc3f7' },
            { label: 'Punishment Sparring', icon: '👊', cost: 2, type: 'punishment', color: '#ff3d00' },
            { label: 'Endurance Break', icon: '🔥', cost: 2, type: 'endurance', color: '#f59e0b' }
        ];

        card.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.8rem;">
            <img src="assets/${fighter.avatar || 'generic/1.png'}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--border-glass);" onerror="this.style.display='none'">
            <div>
                <div style="font-family:var(--font-heading);font-weight:700;">${fighter.name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">Morale <span style="color:${fighter.dynamic_state.morale < 50 ? '#ff3d00' : '#00e676'}">${fighter.dynamic_state.morale}</span> · Stress ${fighter.dynamic_state.stress} · DOM ${fighter.personality.dominance_hunger}</div>
            </div>
        </div>
        ${actions.map(a => `
            <button data-type="${a.type}" data-cost="${a.cost}" style="width:100%;margin-bottom:0.4rem;padding:0.55rem 0.8rem;border-radius:6px;background:rgba(0,0,0,0.4);color:#fff;border:1px solid ${a.color}33;cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;">
                <span>${a.icon} ${a.label}</span><span style="color:${a.color};font-size:0.8rem;">${a.cost} AP</span>
            </button>`).join('')}
    `;

        card.querySelectorAll('button[data-type]').forEach(btn => {
            btn.addEventListener('click', () => this._openIndividualModal(fighter, btn.dataset.type, +btn.dataset.cost));
        });
        return card;
    },

    // ── INDIVIDUAL MODAL ──────────────────────────────────────────────────────────
    _openIndividualModal(fighter, type, cost) {
        if (window.GameState.actionPoints < cost) { alert('Not enough Action Points!'); return; }
        const modal = document.getElementById('interaction-modal');
        let html = '';
        switch (type) {
            case 'talk': html = this._buildTalk(fighter, cost); break;
            case 'punishment': html = this._buildPunishment(fighter, cost); break;
            case 'endurance': html = this._buildEndurance(fighter, cost); break;
        }
        modal.innerHTML = `<div class="glass-panel" style="max-width:600px;width:100%;padding:2rem;position:relative;border-top:4px solid var(--accent);">${html}</div>`;
        modal.classList.remove('hidden');
    },

    _closeModal() {
        document.getElementById('interaction-modal').classList.add('hidden');
        if (typeof updateNavUI === 'function') updateNavUI();
    },

    _applyEffect(fighter, cost, text, effects) {
        window.GameState.actionPoints -= cost;
        const ds = fighter.dynamic_state;
        const cs = fighter.core_stats;
        if (effects.morale) ds.morale = Math.max(0, Math.min(100, ds.morale + effects.morale));
        if (effects.stress) ds.stress = Math.max(0, Math.min(100, ds.stress + effects.stress));
        if (effects.fatigue) ds.fatigue = Math.max(0, Math.min(100, ds.fatigue + effects.fatigue));
        if (effects.composure) cs.composure = Math.max(0, Math.min(100, cs.composure + effects.composure));
        if (effects.control) cs.control = Math.max(0, Math.min(100, cs.control + effects.control));
        if (effects.aggression) cs.aggression = Math.max(0, Math.min(100, cs.aggression + effects.aggression));
        if (effects.resilience) cs.resilience = Math.max(0, Math.min(100, cs.resilience + effects.resilience));
        if (effects.presence) cs.presence = Math.max(0, Math.min(100, cs.presence + effects.presence));
        if (effects.dom) fighter.personality.dominance_hunger = Math.max(0, Math.min(100, fighter.personality.dominance_hunger + effects.dom));
        if (effects.sub) fighter.personality.submissive_lean = Math.max(0, Math.min(100, fighter.personality.submissive_lean + effects.sub));
        if (effects.ego) ds.ego = effects.ego;
        if (effects.fame) window.GameState.fame += effects.fame;

        const modal = document.getElementById('interaction-modal');
        modal.innerHTML = `
        <div class="glass-panel" style="max-width:600px;width:100%;padding:2rem;text-align:center;">
            <p style="font-size:1rem;line-height:1.7;margin-bottom:2rem;text-align:left;">${text}</p>
            <div style="color:var(--accent);margin-bottom:1.5rem;font-family:monospace;font-size:0.85rem;">[ −${cost} AP | Stats Updated ]</div>
            <button class="btn-primary" onclick="window.UIInteractions._closeModal()">Return</button>
        </div>`;
    },

    // ── TALK / COUNSEL ────────────────────────────────────────────────────────────
    _buildTalk(f, cost) {
        const toneEffects = {
            reassure: { morale: 15, stress: -10, text: `You kept it simple — steady voice, no pressure, no agenda. ${f.name} didn't say much, but her shoulders dropped about two inches over the course of it. Sometimes that's the whole point. <strong>Morale +15 · Stress −10</strong>` },
            challenge: { morale: -5, stress: 10, composure: 4, text: `You held up a mirror and didn't soften what you saw. ${f.name}'s jaw tightened. She pushed back, which is exactly what you wanted. The session ended with more tension than it started — but the productive kind. <strong>Composure +4 · Morale −5 · Stress +10</strong>` },
            listen: { morale: 10, stress: -15, text: `You said almost nothing. ${f.name} filled the silence slowly, haltingly, then all at once — words she'd probably been carrying for weeks. By the end she looked lighter. <strong>Morale +10 · Stress −15</strong>` }
        };
        window._talkChoice = (tone) => {
            const e = toneEffects[tone];
            this._applyEffect(f, cost, e.text, e);
        };
        return `
        <h2 style="color:#4fc3f7;margin-bottom:1rem;">Counsel: ${f.name}</h2>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;">
            Morale <strong>${f.dynamic_state.morale}</strong> · Stress <strong>${f.dynamic_state.stress}</strong> · Archetype <strong>${f.personality.archetype}</strong>
        </p>
        <div style="display:flex;flex-direction:column;gap:0.8rem;">
            <button class="btn-primary" style="background:#1a3a4a;border:1px solid #4fc3f7;text-align:left;padding:0.8rem 1rem;" onclick="window._talkChoice('reassure')">🕊️ <strong>Reassure</strong> — Calm her down. Build stability.</button>
            <button class="btn-primary" style="background:#3a1a1a;border:1px solid #ff3d00;text-align:left;padding:0.8rem 1rem;" onclick="window._talkChoice('challenge')">⚡ <strong>Challenge</strong> — Push back. Force self-reflection.</button>
            <button class="btn-primary" style="background:#1a1a3a;border:1px solid #a855f7;text-align:left;padding:0.8rem 1rem;" onclick="window._talkChoice('listen')">👂 <strong>Listen</strong> — Say nothing. Let her speak.</button>
            <button class="btn-primary" style="background:transparent;border:1px solid #444;" onclick="window.UIInteractions._closeModal()">Cancel</button>
        </div>`;
    },

    // ── PUNISHMENT SPARRING ───────────────────────────────────────────────────────
    _buildPunishment(f, cost) {
        window._punishChoice = (branch) => {
            const pool = branch === 'exhaust'
                ? this._narratives.punishment_exhaust
                : this._narratives.punishment_beatdown;
            const story = pool[Math.floor(Math.random() * pool.length)](f);
            if (branch === 'exhaust') {
                this._applyEffect(f, cost, story + '<br><br><strong style="color:#ff9800;">Morale −20 · Fatigue +25 · Composure +5</strong>', { morale: -20, fatigue: 25, composure: 5, ego: 'Normal' });
            } else {
                this._applyEffect(f, cost, story + '<br><br><strong style="color:#ff3d00;">Morale −35 · Stress +20 · Control +5</strong>', { morale: -35, stress: 20, control: 5, ego: 'Normal' });
                f.personality.submissive_lean = Math.min(100, f.personality.submissive_lean + 10);
                f.personality.dominance_hunger = Math.max(0, f.personality.dominance_hunger - 5);
            }
            window.GameState.addNews('club', `${f.name} was put through a punishment session by management.`);
        };
        return `
        <h2 style="color:#ff3d00;margin-bottom:1rem;">Punishment Sparring: ${f.name}</h2>
        <p style="color:var(--text-muted);margin-bottom:2rem;line-height:1.5;">Lock the gym. No witnesses. It's time to break her down and rebuild her properly.</p>
        <div style="display:flex;flex-direction:column;gap:1rem;">
            <button class="btn-primary" style="background:#2a2a2a;border:1px solid #ff9800;text-align:left;padding:0.9rem 1.2rem;" onclick="window._punishChoice('exhaust')">
                💀 <strong>Exhaustion Drills</strong><br><small style="color:var(--text-muted);">Endless circuits until she breaks. Morale −20 · Fatigue +25 · Composure +5</small>
            </button>
            <button class="btn-primary" style="background:#2a0a0a;border:1px solid #e0284f;text-align:left;padding:0.9rem 1.2rem;" onclick="window._punishChoice('beatdown')">
                🩸 <strong>Feed Her to the Heavy Hitter</strong><br><small style="color:var(--text-muted);">No protective gear. No mercy. Morale −35 · Stress +20 · Control +5 · SUB↑</small>
            </button>
            <button class="btn-primary" style="background:transparent;border:1px solid #444;" onclick="window.UIInteractions._closeModal()">Cancel</button>
        </div>`;
    },

    // ── ENDURANCE BREAK ───────────────────────────────────────────────────────────
    _buildEndurance(f, cost) {
        window._runEndurance = () => {
            const dom = f.personality.dominance_hunger;
            const fatigue = f.dynamic_state.fatigue;
            // Chance to complete: higher DOM and lower fatigue = better
            const successChance = 0.35 + (dom / 200) - (fatigue / 300);
            const passed = Math.random() < successChance;
            const pool = passed ? this._narratives.endurance_pass : this._narratives.endurance_fail;
            const story = pool[Math.floor(Math.random() * pool.length)](f);
            if (passed) {
                this._applyEffect(f, cost, story + '<br><br><strong style="color:#00e676;">Morale +15 · Fatigue +20 · Resilience +3 · DOM +5</strong>',
                    { morale: 15, fatigue: 20, resilience: 3, dom: 5 });
            } else {
                this._applyEffect(f, cost, story + '<br><br><strong style="color:#ff3d00;">Morale −20 · Fatigue +15 · SUB +10</strong>',
                    { morale: -20, fatigue: 15, sub: 10 });
            }
            window.GameState.addNews('club', `${f.name} faced an endurance test in training today.`);
        };
        return `
        <h2 style="color:#f59e0b;margin-bottom:1rem;">Endurance Break: ${f.name}</h2>
        <p style="color:var(--text-muted);margin-bottom:0.5rem;line-height:1.5;">A gruelling solo athletic test watched by the entire team. She either finishes — or she doesn't.</p>
        <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:0.85rem;color:var(--text-muted);">
            Current Fatigue: <strong style="color:${f.dynamic_state.fatigue > 60 ? '#ff3d00' : '#aaa'}">${f.dynamic_state.fatigue}</strong> · 
            DOM: <strong>${f.personality.dominance_hunger}</strong>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.8rem;">
            <button class="btn-primary" style="background:#2a1a00;border:1px solid #f59e0b;" onclick="window._runEndurance()">🔥 Start the Test (2 AP)</button>
            <button class="btn-primary" style="background:transparent;border:1px solid #444;" onclick="window.UIInteractions._closeModal()">Cancel</button>
        </div>`;
    },

    // ── PAIRED PANEL ──────────────────────────────────────────────────────────────
    _renderPairedPanel(container, club, gs) {
        const activities = [
            { id: 'sparring_pit', label: 'Private Sparring Pit', icon: '⚔️', color: '#ff3d00', desc: 'Locked gym. No referee. No rules. Pure DOM duel.' },
            { id: 'erotic_grapple', label: 'Erotic Grappling Session', icon: '🔥', color: '#e91e63', desc: 'Private mats. Sport melts into desire. DOM/SUB defines everything.' },
            { id: 'overnight', label: 'Overnight Luxury Suite', icon: '🏨', color: '#a855f7', desc: 'Penthouse, no cameras, no curfew. (+$3,000)', money: 3000 },
            { id: 'underground', label: 'Underground Secret Match', icon: '🥊', color: '#f59e0b', desc: 'Illegal warehouse. Brutal. No mercy. (+$2,000)', money: 2000 },
            { id: 'sexfight', label: 'Sexfight', icon: '💋', color: '#e0284f', desc: 'Pure dominance contest. Erotic combat format.' },
            { id: 'bed_wrestling', label: 'Bed Wrestling', icon: '🌙', color: '#7c3aed', desc: 'Intimate. Low-stakes. Privately charged.' }
        ];

        // Build fighter option lists
        const myFighters = club.fighter_ids.map(id => gs.getFighter(id)).filter(Boolean);
        const myOpts = myFighters.map(f => `<option value="${f.id}">${f.name} (DOM ${f.personality.dominance_hunger} | SUB ${f.personality.submissive_lean})</option>`).join('');

        // Other clubs + their fighters
        const otherClubs = Object.values(gs.clubs).filter(c => c.id !== gs.playerClubId);
        const crossOpts = otherClubs.map(c => {
            const fighters = c.fighter_ids.map(id => gs.getFighter(id)).filter(Boolean);
            return fighters.map(f => `<option value="${f.id}" data-club="${c.id}">[${c.name}] ${f.name} (DOM ${f.personality.dominance_hunger})</option>`).join('');
        }).join('');

        const actCards = activities.map(a => `
        <button data-activity="${a.id}" style="padding:0.8rem 1rem;border-radius:8px;background:rgba(0,0,0,0.4);border:1px solid ${a.color}44;color:#fff;cursor:pointer;text-align:left;width:100%;margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:flex-start;">
            <span>${a.icon} <strong>${a.label}</strong>${a.money ? `<span style="color:#aaa;font-size:0.75rem;margin-left:4px;">$${a.money.toLocaleString()}</span>` : ''}</span>
            <span style="font-size:0.75rem;color:${a.color};white-space:nowrap;margin-left:1rem;">2 AP</span>
        </button>
        <p style="font-size:0.78rem;color:var(--text-muted);margin:-0.3rem 0 0.5rem 1.5rem;">${a.desc}</p>
    `).join('');

        container.innerHTML = `
        <div class="glass-panel" style="padding:1.5rem;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                <div>
                    <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.4rem;">Fighter A (your roster)</label>
                    <select id="paired-f1" style="width:100%;padding:0.6rem;border-radius:6px;background:#111;color:#fff;border:1px solid var(--border-glass);">
                        <option value="">— Select —</option>${myOpts}
                    </select>
                </div>
                <div>
                    <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.4rem;">Fighter B</label>
                    <select id="paired-source" style="width:100%;padding:0.6rem;border-radius:6px;background:#111;color:#fff;border:1px solid var(--border-glass);margin-bottom:0.4rem;" onchange="window.UIInteractions._onPairedSourceChange()">
                        <option value="own">Own Roster</option>
                        <option value="rival">Rival Club Fighter</option>
                    </select>
                    <select id="paired-f2-own" style="width:100%;padding:0.6rem;border-radius:6px;background:#111;color:#fff;border:1px solid var(--border-glass);">
                        <option value="">— Select —</option>${myOpts}
                    </select>
                    <select id="paired-f2-cross" style="width:100%;padding:0.6rem;border-radius:6px;background:#111;color:#fff;border:1px solid var(--border-glass);display:none;">
                        <option value="">— Select —</option>${crossOpts}
                    </select>
                </div>
            </div>
            <div style="border-top:1px solid var(--border-glass);padding-top:1rem;">${actCards}</div>
        </div>`;

        container.querySelectorAll('button[data-activity]').forEach(btn => {
            btn.addEventListener('click', () => this._startPairedActivity(btn.dataset.activity));
        });
    },

    _onPairedSourceChange() {
        const src = document.getElementById('paired-source').value;
        document.getElementById('paired-f2-own').style.display = src === 'own' ? '' : 'none';
        document.getElementById('paired-f2-cross').style.display = src === 'rival' ? '' : 'none';
    },

    _startPairedActivity(actId) {
        const gs = window.GameState;
        if (gs.actionPoints < 2) { alert('Not enough Action Points!'); return; }

        const f1Id = document.getElementById('paired-f1').value;
        const src = document.getElementById('paired-source').value;
        const f2Id = src === 'own'
            ? document.getElementById('paired-f2-own').value
            : document.getElementById('paired-f2-cross').value;

        if (!f1Id || !f2Id) { alert('Select both fighters first.'); return; }
        if (f1Id === f2Id) { alert('Cannot select the same fighter twice.'); return; }

        const moneyCosts = { overnight: 3000, underground: 2000 };
        const money = moneyCosts[actId] || 0;
        if (money > 0 && gs.money < money) { alert(`You need $${money.toLocaleString()} for this activity.`); return; }

        const f1 = gs.getFighter(f1Id);
        const f2 = gs.getFighter(f2Id);
        if (!f1 || !f2) { alert('Fighter not found.'); return; }

        // Refusal check
        const refusal = this._computeRefusal(f1, f2, actId, src === 'rival');
        if (refusal.refused) {
            window.UIComponents.showModal('Proposal Refused', `<strong>${f2.name}</strong> declined. "${refusal.reason}"`, 'danger');
            window.GameState.addNews('transfer', `${f2.name} refused a paired activity proposal from ${gs.getClub(gs.playerClubId).name}.`);
            return;
        }

        // Deduct costs
        gs.actionPoints -= 2;
        if (money > 0) gs.money -= money;

        this._executePairedActivity(f1, f2, actId);
    },

    _computeRefusal(f1, f2, actId, isCrossClub) {
        // Base refusal chance
        let refuseChance = isCrossClub ? 0.30 : 0.08;

        // Existing relationship modifiers
        const rel = f1.dynamic_state.relationships?.[f2.id];
        const relType = rel?.type;
        if (relType === 'rivalry') refuseChance += 0.25; // rivals resist intimate activities
        if (relType === 'obsession') refuseChance -= 0.20; // obsession = eager
        if (relType === 'lovers') refuseChance -= 0.25; // lovers = very willing
        if (relType === 'attraction') refuseChance -= 0.10;

        // Low morale fighters refuse more
        if (f2.dynamic_state.morale < 30) refuseChance += 0.30;
        if (f2.dynamic_state.morale > 70) refuseChance -= 0.10;

        // Sexual activities: high SUB = more willing, high DOM + rival = likely refuse
        const intimateActs = ['erotic_grapple', 'sexfight', 'bed_wrestling', 'overnight'];
        if (intimateActs.includes(actId)) {
            if (f2.personality.submissive_lean > 60) refuseChance -= 0.15;
            if (f2.personality.dominance_hunger > 70 && relType === 'rivalry') refuseChance += 0.20;
        }

        refuseChance = Math.max(0.02, Math.min(0.90, refuseChance));
        if (Math.random() > refuseChance) return { refused: false };

        // Pick a refusal reason
        const reasons = relType === 'rivalry'
            ? [`"Not a chance. Not with her."`, `"You're asking me to what? With ${f1.name}? No."`, `"I don't share anything with that woman. Especially not this."`]
            : isCrossClub
                ? [`"We're not interested in whatever you're selling."`, `"My club handles its own business."`, `"Tell them no. Actually, tell them never."`]
                : [`"I'm not in the headspace for this right now."`, `"Ask me again when I've slept."`, `"Pass."`];
        return { refused: true, reason: reasons[Math.floor(Math.random() * reasons.length)] };
    },

    _executePairedActivity(f1, f2, actId) {
        const gs = window.GameState;

        // Define which activities are full simulations vs text events
        const isMatchActivity = ['sparring_pit', 'erotic_grapple', 'sexfight', 'underground'].includes(actId);

        if (isMatchActivity) {
            // Determine style
            let styleId = 'wrestling'; // Default
            if (actId === 'sparring_pit') styleId = 'boxing'; // Simplification to make it brutal standup
            if (actId === 'erotic_grapple') styleId = 'wrestling';
            if (actId === 'sexfight') styleId = 'sexfight';
            if (actId === 'underground') styleId = 'catfight';

            window.Router.loadRoute('match');
            setTimeout(() => {
                window.UIMatch.startPairedMatch(f1.id, f2.id, styleId, actId);
            }, 100);
            return; // Halt execution here, let Match Engine handle it
        }

        // --- text-only non-match activities continue below ---

        const domWins = (f1.personality.dominance_hunger + Math.random() * 30) > (f2.personality.dominance_hunger + Math.random() * 30);
        const winner = domWins ? f1 : f2;
        const loser = domWins ? f2 : f1;
        const domGap = Math.abs(f1.personality.dominance_hunger - f2.personality.dominance_hunger);
        const rel = f1.dynamic_state.relationships?.[f2.id];

        const setRel = (type) => {
            if (!f1.dynamic_state.relationships) f1.dynamic_state.relationships = {};
            if (!f2.dynamic_state.relationships) f2.dynamic_state.relationships = {};
            const note = `${actId.replace(/_/g, ' ')} forged a ${type} bond.`;
            f1.dynamic_state.relationships[f2.id] = { type, tension: 30, history: [note] };
            f2.dynamic_state.relationships[f1.id] = { type, tension: 30, history: [note] };
        };

        let title = '', text = '';

        if (actId === 'overnight') {
            f1.dynamic_state.stress = Math.max(0, (f1.dynamic_state.stress || 0) - 30);
            f2.dynamic_state.stress = Math.max(0, (f2.dynamic_state.stress || 0) - 30);
            f1.dynamic_state.fatigue = Math.max(0, (f1.dynamic_state.fatigue || 0) - 15);
            f2.dynamic_state.fatigue = Math.max(0, (f2.dynamic_state.fatigue || 0) - 15);
            const roll = Math.random();
            const newRel = roll > 0.5 ? 'lovers' : roll > 0.2 ? 'rivalry' : 'obsession';
            setRel(newRel);
            const stories = {
                lovers: [
                    `The suite was booked under a false name. What happened between check-in and checkout is known only to the two of them — and neither has mentioned it. But something has changed in how they occupy the same room. The silence between them now has warmth in it.`,
                    `Twelve hours, a penthouse, no agenda. They arrived with barely-concealed tension. They returned looking like women who'd made some kind of mutual, unspoken agreement. Whatever it was, it seems to be holding.`
                ],
                rivalry: [
                    `The suite was nice. The company was not. Accounts differ on exactly when it went wrong, but by morning room service delivered to a room where nobody was speaking. They checked out separately, fifteen minutes apart.`,
                    `Nobody expected them to get along. They didn't. The penthouse simply gave them more space to be hostile in. They return to training with an edge that wasn't there before — sharper and less pretending.`
                ],
                obsession: [
                    `Something happened in that suite that neither of them will discuss with anyone. They returned to the facility changed — not closer, not further, but differently entangled. The way ${f1.name} watches ${f2.name} cross a room is not subtle.`,
                    `Twelve hours behind a closed door. The intensity they generate in the same space was always obvious. Now it's something else — unresolved, permanently charged, and very difficult to look away from.`
                ]
            };
            const pool = stories[newRel];
            title = 'Overnight Luxury Suite';
            text = pool[Math.floor(Math.random() * pool.length)];

        } else if (actId === 'bed_wrestling') {
            f1.dynamic_state.stress = Math.max(0, (f1.dynamic_state.stress || 0) - 20);
            f2.dynamic_state.stress = Math.max(0, (f2.dynamic_state.stress || 0) - 20);
            f1.dynamic_state.fatigue = Math.max(0, (f1.dynamic_state.fatigue || 0) - 10);
            f2.dynamic_state.fatigue = Math.max(0, (f2.dynamic_state.fatigue || 0) - 10);
            if (Math.random() < 0.4) setRel('attraction');
            else setRel(rel?.type || 'attraction');
            const stories = [
                `It was quiet, in comparison to everything else. The private suite, the soft lighting, the complete absence of rules. ${f1.name} and ${f2.name} moved slowly and spoke less — a kind of fighting that was also a kind of conversation, unfolding in private, answering questions that neither had asked aloud. They parted without ceremony. Something between them settled.`,
                `Low stakes doesn't mean low intensity. The session between them was unhurried, exploratory — positions shifted, held, released, tested again. Nothing dramatic happened. Which is perhaps why it felt so significant. The ordinary intimacy of it left the room changed in a way that the more spectacular things don't always manage.`,
                `Hours passed. Neither was in a hurry. This was not about winning — and in the absence of that pressure, they found something else. ${f1.name} left first, straightening her hair, saying nothing. ${f2.name} stayed seated for a long time after, looking at nothing particular, wearing an expression that nobody outside the room would understand.`
            ];
            title = 'Bed Wrestling';
            text = stories[Math.floor(Math.random() * stories.length)];
        }

        if (title) {
            gs.addNews('club', `${f1.name} and ${f2.name} participated in a private ${title.toLowerCase()} session.`);
            window.UIComponents.showModal(title, `<p style="line-height:1.75;font-size:0.95rem;">${text}</p>`, 'info');
            if (typeof updateNavUI === 'function') updateNavUI();
        }
    },

    // ── GROUP INTERACTIONS ────────────────────────────────────────────────────────
    _renderGroupCards(container, gs, club) {
        const groups = [
            { id: 'spa', icon: '🛁', color: '#ff80ab', label: 'Team Spa Day', cost: '$5,000 · 2 AP', desc: 'Private luxury spa. −20 Fatigue · −15 Stress · +10 Morale all.' },
            { id: 'camp', icon: '🥊', color: '#ff3d00', label: 'Aggression Camp', cost: '$2,500 · 2 AP', desc: 'Closed-door war. +2 Aggression all · +10 Stress · +15 Fatigue.' },
            { id: 'massage', icon: '💆', color: '#a855f7', label: 'Group Massage Session', cost: '$3,500 · 1 AP', desc: 'Fighters pair off. −25 Fatigue · −10 Stress. Chemistry may ignite.' },
            { id: 'retreat', icon: '🏕️', color: '#f59e0b', label: 'Wilderness Retreat', cost: '$4,000 · 2 AP', desc: 'Isolated 2 nights. −20 Stress · +15 Morale. Relationships shift.' },
            { id: 'party', icon: '🍾', color: '#e0284f', label: 'Victory Celebration Night', cost: '$6,000 · 1 AP', desc: 'No rules. +25 Morale · −15 Stress · +20 Fatigue. Bonds form.' },
            { id: 'bonding', icon: '⚙️', color: '#10b981', label: 'Combat Bonding Camp', cost: '$3,000 · 2 AP', desc: '3 days, brutal + vulnerable. +2 AGG · +2 PSY all. Relationships shift.' }
        ];
        groups.forEach(g => {
            const card = document.createElement('div');
            card.className = 'glass-panel';
            card.style.cssText = `padding:1.5rem;text-align:center;border-top:3px solid ${g.color};`;
            card.innerHTML = `
            <div style="font-size:2rem;margin-bottom:0.5rem;">${g.icon}</div>
            <h4 style="margin-bottom:0.5rem;color:${g.color};">${g.label}</h4>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;min-height:44px;">${g.desc}</p>
            <button class="btn-primary" style="background:${g.color};color:#000;width:100%;"><strong>${g.cost}</strong></button>`;
            card.querySelector('button').addEventListener('click', () => this._handleGroupInteraction(g.id));
            container.appendChild(card);
        });
    },

    _handleGroupInteraction(type) {
        const gs = window.GameState;
        const club = gs.getClub(gs.playerClubId);
        if (!club || club.fighter_ids.length === 0) return;
        const fighters = club.fighter_ids.map(id => gs.getFighter(id)).filter(Boolean);

        const cfg = {
            spa: { ap: 2, money: 5000 },
            camp: { ap: 2, money: 2500 },
            massage: { ap: 1, money: 3500 },
            retreat: { ap: 2, money: 4000 },
            party: { ap: 1, money: 6000 },
            bonding: { ap: 2, money: 3000 }
        }[type];
        if (!cfg) return;
        if (gs.actionPoints < cfg.ap) { alert('Not enough Action Points!'); return; }
        if (gs.money < cfg.money) { alert(`Need $${cfg.money.toLocaleString()}.`); return; }
        gs.actionPoints -= cfg.ap;
        gs.money -= cfg.money;

        let title = '', text = '', bonds = [];

        if (type === 'spa') {
            fighters.forEach(f => { f.dynamic_state.fatigue = Math.max(0, f.dynamic_state.fatigue - 20); f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 15); f.dynamic_state.morale = Math.min(100, f.dynamic_state.morale + 10); });
            title = 'Team Spa Day';
            text = 'You rented a private luxury spa wing for the whole roster. Hours of steam rooms, deep towels, and enforced silence dissolved weeks of fight-camp tension. The locker room feels different the next morning — lighter, looser, more human. They still compete. They\'ve just remembered they like each other, a little. <strong style="color:#00e676;">All: −20 Fatigue · −15 Stress · +10 Morale</strong>';
            gs.addNews('club', `${club.name} spent a recovery day at a private luxury spa.`);

        } else if (type === 'camp') {
            fighters.forEach(f => { f.core_stats.aggression = Math.min(100, (f.core_stats.aggression || 50) + 2); f.dynamic_state.stress = Math.min(100, f.dynamic_state.stress + 10); f.dynamic_state.fatigue = Math.min(100, f.dynamic_state.fatigue + 15); });
            title = 'Aggression Camp';
            text = 'You locked the gym and turned the team loose on each other — no pads, no timekeeping, just violence scaled to tolerance. Things were said. Things were done. The floor looked like an argument by the end. Everyone left angrier, sharper, and slightly less able to look at each other directly. This is, presumably, the point. <strong style="color:#ff3d00;">All: +2 Aggression · +10 Stress · +15 Fatigue</strong>';
            gs.addNews('club', `Locals report constant shouting from ${club.name}'s sealed training facility.`);

        } else if (type === 'massage') {
            const ids = [...club.fighter_ids];
            while (ids.length >= 2) {
                const i1 = ids.splice(Math.floor(Math.random() * ids.length), 1)[0];
                const i2 = ids.splice(Math.floor(Math.random() * ids.length), 1)[0];
                const a = gs.getFighter(i1), b = gs.getFighter(i2);
                if (a && b) {
                    [a, b].forEach(f => { f.dynamic_state.fatigue = Math.max(0, f.dynamic_state.fatigue - 25); f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 10); });
                    if (Math.random() < 0.3) {
                        if (window.RelationshipEngine) {
                            window.RelationshipEngine.addTension(a.id, b.id, 20, 'An intimate massage recovery session created unexpected chemistry.');
                        }
                        bonds.push(`${a.name} & ${b.name}`);
                    }
                }
            }
            if (ids.length === 1) { const f = gs.getFighter(ids[0]); if (f) { f.dynamic_state.fatigue = Math.max(0, f.dynamic_state.fatigue - 15); f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 5); } }
            title = 'Group Massage Session';
            text = `Elite therapists, private rooms, fighter pairs rotating through. Fingers working knots that have been building since the season started. The team moves more freely the next day. Nobody talks about what was said between sessions.<br><strong style="color:#a855f7;">All: −25 Fatigue · −10 Stress</strong>${bonds.length ? `<br><strong style="color:#ff80ab;">💕 Chemistry sparked: ${bonds.join(', ')}</strong>` : ''}`;
            gs.addNews('club', `${club.name} held a private recovery evening at a wellness centre.`);

        } else if (type === 'retreat') {
            fighters.forEach(f => { f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 20); f.dynamic_state.morale = Math.min(100, f.dynamic_state.morale + 15); });
            let shifts = 0;
            for (let i = 0; i < fighters.length && shifts < 2; i++) {
                for (let j = i + 1; j < fighters.length && shifts < 2; j++) {
                    if (Math.random() < 0.45) {
                        const a = fighters[i], b = fighters[j];
                        if (!a.dynamic_state.relationships) a.dynamic_state.relationships = {};
                        if (!b.dynamic_state.relationships) b.dynamic_state.relationships = {};
                        const roll = Math.random();
                        const rt = roll > 0.7 ? 'lovers' : roll > 0.4 ? 'friendship' : 'rivalry';
                        const note = rt === 'lovers' ? 'Two nights in the mountains changed everything.' : rt === 'friendship' ? 'Isolation forged a genuine bond.' : 'Old grievances resurfaced in close quarters.';
                        a.dynamic_state.relationships[b.id] = { type: rt, tension: 25, history: [note] };
                        b.dynamic_state.relationships[a.id] = { type: rt, tension: 25, history: [note] };
                        bonds.push(`<span style="color:${rt === 'lovers' ? '#e91e63' : rt === 'friendship' ? '#4caf50' : '#f44336'}">${a.name} & ${b.name} → ${rt.toUpperCase()}</span>`);
                        shifts++;
                    }
                }
            }
            title = 'Wilderness Retreat';
            text = `Two nights in an isolated cabin with no phones, no press, and no way out. Whatever happened out there, they returned changed. Some bonded under the same shared discomfort. Others settled things they'd been circling for months.<br><strong style="color:#f59e0b;">All: −20 Stress · +15 Morale</strong>${bonds.length ? `<br>${bonds.join('<br>')}` : ''}`;
            gs.addNews('club', `${club.name} returned from an undisclosed mountain retreat. No official comment.`);

        } else if (type === 'party') {
            fighters.forEach(f => { f.dynamic_state.morale = Math.min(100, f.dynamic_state.morale + 25); f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 15); f.dynamic_state.fatigue = Math.min(100, f.dynamic_state.fatigue + 20); });
            if (fighters.length >= 2 && Math.random() < 0.4) {
                const a = fighters[Math.floor(Math.random() * fighters.length)];
                let b; do { b = fighters[Math.floor(Math.random() * fighters.length)]; } while (b === a);
                [a, b].forEach(f => { if (!f.dynamic_state.relationships) f.dynamic_state.relationships = {}; });
                const rt = Math.random() > 0.5 ? 'attraction' : 'lovers';
                a.dynamic_state.relationships[b.id] = { type: rt, tension: 20, history: ['Something ignited under the neon lights.'] };
                b.dynamic_state.relationships[a.id] = { type: rt, tension: 20, history: ['Something ignited under the neon lights.'] };
                bonds.push(`${a.name} & ${b.name}`);
            }
            title = 'Victory Celebration Night';
            text = `Open bar, private venue, no curfew, no managers. The team went properly off the leash for one night and came back looking slightly destroyed and significantly more alive. The morale spike is real. So is the fatigue. Worth it.<br><strong style="color:#e0284f;">All: +25 Morale · −15 Stress · +20 Fatigue</strong>${bonds.length ? `<br><strong style="color:#ff80ab;">💕 Something happened: ${bonds.join(', ')}</strong>` : ''}`;
            gs.addNews('club', `${club.name} threw a private party. Sources say it lasted until dawn.`);

        } else if (type === 'bonding') {
            fighters.forEach(f => { f.core_stats.aggression = Math.min(100, (f.core_stats.aggression || 50) + 2); f.core_stats.resilience = Math.min(100, (f.core_stats.resilience || 50) + 2); f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 10); });
            let bType = '';
            if (fighters.length >= 2 && Math.random() < 0.6) {
                const a = fighters[Math.floor(Math.random() * fighters.length)];
                let b; do { b = fighters[Math.floor(Math.random() * fighters.length)]; } while (b === a);
                [a, b].forEach(f => { if (!f.dynamic_state.relationships) f.dynamic_state.relationships = {}; });
                const rt = Math.random() < 0.66 ? 'friendship' : 'rivalry';
                a.dynamic_state.relationships[b.id] = { type: rt, tension: 20, history: ['Three days of shared pain and forced proximity revealed something real.'] };
                b.dynamic_state.relationships[a.id] = { type: rt, tension: 20, history: ['Three days of shared pain and forced proximity revealed something real.'] };
                bonds.push(`${a.name} & ${b.name} → ${rt.toUpperCase()}`);
                bType = rt;
            }
            title = 'Combat Bonding Camp';
            text = `Three days in a closed facility — brutal sparring at dawn, nothing to do at night but talk. Shared physical suffering has a way of stripping pretense. The team came back harder and slightly more honest with each other. Not comfortable. Real.<br><strong style="color:#10b981;">All: +2 Aggression · +2 Resilience · −10 Stress</strong>${bonds.length ? `<br><strong style="color:${bType === 'friendship' ? '#4caf50' : '#f44336'}">${bonds.join(', ')}</strong>` : ''}`;
            gs.addNews('club', `${club.name} completed a closed 3-day combat bonding retreat.`);
        }

        if (title) {
            window.UIComponents.showModal(title, text, 'info');
            if (typeof updateNavUI === 'function') updateNavUI();
            window.Router.loadRoute('interactions');
        }
    },

    processPairedMatchResult(simWinner, simLoser, context) {
        const gs = window.GameState;
        const actId = context.ruleset;

        // The Match Simulation passes back clones - we need to fetch the real roster fighters to apply lasting changes
        const winner = gs.getFighter(simWinner.id);
        const loser = gs.getFighter(simLoser.id);

        if (!winner || !loser) {
            window.Router.loadRoute('club');
            return;
        }

        const domGap = Math.abs(winner.personality.dominance_hunger - loser.personality.dominance_hunger);
        const rel = winner.dynamic_state.relationships?.[loser.id];

        const setRel = (type) => {
            if (!winner.dynamic_state.relationships) winner.dynamic_state.relationships = {};
            if (!loser.dynamic_state.relationships) loser.dynamic_state.relationships = {};
            const note = `${actId.replace(/_/g, ' ')} forged a ${type} bond.`;
            winner.dynamic_state.relationships[loser.id] = { type, tension: 30, history: [note] };
            loser.dynamic_state.relationships[winner.id] = { type, tension: 30, history: [note] };
        };

        let title = '', text = '';

        if (actId === 'sparring_pit') {
            winner.dynamic_state.morale = Math.min(100, (winner.dynamic_state.morale || 50) + 15);
            winner.core_stats.aggression = Math.min(100, (winner.core_stats.aggression || 50) + 2);
            winner.personality.dominance_hunger = Math.min(100, winner.personality.dominance_hunger + 8);
            loser.dynamic_state.morale = Math.max(0, (loser.dynamic_state.morale || 50) - 15);
            loser.personality.submissive_lean = Math.min(100, loser.personality.submissive_lean + 10);
            winner.dynamic_state.fatigue = Math.min(100, (winner.dynamic_state.fatigue || 0) + 20);
            loser.dynamic_state.fatigue = Math.min(100, (loser.dynamic_state.fatigue || 0) + 20);
            if (!rel || rel.type === 'neutral') setRel('rivalry');
            else if (rel.type === 'rivalry') { rel.tension = Math.min(100, (rel.tension || 30) + 20); }
            const stories = [
                `The gym doors hadn't been closed a minute before the first clinch. No instructions needed — both of them knew exactly what this was. ${winner.name} worked her way through ${loser.name}'s guard methodically, denying every escape, every reset. By the final bell ${loser.name} was breathing through her mouth, eyes down, accepting what had happened. ${winner.name} didn't say a word. She didn't need to.`,
                `It started as sparring and became something else entirely inside the first three minutes. ${loser.name} fought back with everything — no technique, just fury — and it still wasn't enough. ${winner.name} absorbed every shot and paid it back with interest. When it was over they stood across from each other in absolute silence. The hierarchy had been settled the only honest way.`,
                `${winner.name} controlled the pace from the opening exchange. She was everywhere — cutting angles, disrupting rhythm, forcing ${loser.name} into reactive mode where she was weakest. The ending wasn't spectacular. It was worse than that. It was inevitable.`
            ];
            title = 'Private Sparring Pit Result';
            text = stories[Math.floor(Math.random() * stories.length)];

        } else if (actId === 'erotic_grapple') {
            const isClean = domGap >= 20;
            winner.dynamic_state.stress = Math.max(0, (winner.dynamic_state.stress || 0) - 40);
            loser.dynamic_state.stress = Math.max(0, (loser.dynamic_state.stress || 0) - 40);
            if (isClean) {
                winner.dynamic_state.morale = Math.min(100, (winner.dynamic_state.morale || 50) + 15);
                loser.personality.submissive_lean = Math.min(100, loser.personality.submissive_lean + 15);
                winner.dynamic_state.fatigue = Math.min(100, (winner.dynamic_state.fatigue || 0) + 10);
                loser.dynamic_state.fatigue = Math.min(100, (loser.dynamic_state.fatigue || 0) + 10);
            } else {
                winner.dynamic_state.fatigue = Math.min(100, (winner.dynamic_state.fatigue || 0) + 25);
                loser.dynamic_state.fatigue = Math.min(100, (loser.dynamic_state.fatigue || 0) + 25);
            }
            const newRel = Math.random() > 0.3 ? 'lovers' : 'obsession';
            setRel(newRel);
            const stories = isClean ? [
                `The session began with a lock-up and became something harder to name within minutes. ${winner.name} didn't impose herself — she simply moved through every resistance as if it were invitation. By the end ${loser.name} wasn't fighting the outcome. She was leaning into it. They stayed on the canvas for a long time afterward, not speaking, the gym utterly silent.`,
                `${winner.name} held complete control from the first contact. Her weight, her angles, her timing — all of it calculated and unhurried. ${loser.name} tried three times to reverse the pressure and three times found herself exactly where she started. After the fourth, she stopped trying. Something in the room restructured itself permanently.`
            ] : [
                `Neither of them yielded anything easily. The mat session ground forward in surges — momentum trading hands, positions shifting, boundaries blurring in ways neither could quite articulate later. It burned itself out the only way it could: mutual, complete, and entirely private. They left the room without explanation. None was required.`,
                `Two dominant women in a closed room is either a war or a negotiation. This was both, simultaneously, for the better part of an hour. When it finally concluded neither had technically won — but both were changed by it. They dressed in silence and went separate ways, carrying whatever had happened like something too large to name out loud.`
            ];
            title = 'Erotic Grappling Session Result';
            text = stories[Math.floor(Math.random() * stories.length)];

        } else if (actId === 'underground') {
            winner.dynamic_state.morale = Math.min(100, (winner.dynamic_state.morale || 50) + 30);
            winner.personality.dominance_hunger = Math.min(100, winner.personality.dominance_hunger + 15);
            winner.core_stats.aggression = Math.min(100, (winner.core_stats.aggression || 50) + 3);
            loser.dynamic_state.morale = Math.max(0, (loser.dynamic_state.morale || 50) - 25);
            loser.dynamic_state.stress = Math.min(100, (loser.dynamic_state.stress || 0) + 30);
            loser.personality.submissive_lean = Math.min(100, loser.personality.submissive_lean + 15);

            // 30% injury chance for loser
            if (Math.random() < 0.30) {
                const injs = [{ name: 'Bruised Ribs', duration: 1, severity: 'Minor' }, { name: 'Concussion (mild)', duration: 2, severity: 'Moderate' }, { name: 'Knee Twist', duration: 3, severity: 'Moderate' }];
                const inj = injs[Math.floor(Math.random() * injs.length)];
                if (!loser.dynamic_state.injuries) loser.dynamic_state.injuries = [];
                loser.dynamic_state.injuries.push({ ...inj });
                loser.dynamic_state.stress = Math.min(100, loser.dynamic_state.stress + 20);
                gs.addNews('injury', `⚠️ ${loser.name} suffered a ${inj.name} in an underground match — ${inj.duration} week(s) out.`);
            }
            // 15% leak chance
            if (Math.random() < 0.15) { gs.fame = Math.max(0, gs.fame - 100); gs.addNews('global', `Underground match involving ${winner.name} and ${loser.name} leaked online. Club reputation takes a hit.`); }

            setRel('rivalry');
            winner.dynamic_state.fatigue = Math.min(100, (winner.dynamic_state.fatigue || 0) + 30);
            loser.dynamic_state.fatigue = Math.min(100, (loser.dynamic_state.fatigue || 0) + 30);
            title = 'Underground Secret Match Result';
            text = `The warehouse was dark, the crowd small and quiet — the kind of quiet that comes from people who know they're watching something they'll deny later. ${winner.name} won decisively. ${loser.name} fought until the very end, which made the loss more impressive and more complete at once. They left in separate cars. Neither spoke in the van. The result speaks without them.`;

        } else if (actId === 'sexfight') {
            winner.dynamic_state.stress = Math.max(0, (winner.dynamic_state.stress || 0) - 35);
            loser.dynamic_state.stress = Math.max(0, (loser.dynamic_state.stress || 0) - 35);
            if (domGap >= 20) {
                winner.dynamic_state.morale = Math.min(100, (winner.dynamic_state.morale || 50) + 20);
                loser.personality.submissive_lean = Math.min(100, loser.personality.submissive_lean + 20);
                loser.dynamic_state.fatigue = Math.min(100, (loser.dynamic_state.fatigue || 0) + 10);
            } else {
                winner.dynamic_state.fatigue = Math.min(100, (winner.dynamic_state.fatigue || 0) + 25);
                loser.dynamic_state.fatigue = Math.min(100, (loser.dynamic_state.fatigue || 0) + 25);
            }
            const relRoll = Math.random();
            setRel(rel?.type === 'rivalry' ? 'obsession' : relRoll > 0.5 ? 'lovers' : 'obsession');
            const stories = domGap >= 20 ? [
                `The contest had a foregone conclusion — it just needed to be confirmed in the only honest language available. ${winner.name} established her supremacy methodically, completely, without cruelty. ${loser.name} yielded to all of it with a grace that suggested she'd made peace with the outcome somewhere before it started. The private room offered no commentary. Neither did either of them, after.`,
                `${winner.name} doesn't lose these. Not with that gap. What happened was less a contest than an extended demonstration — of control, of patience, of who was going to structure reality for the next hour. ${loser.name} absorbed the entire lesson and left looking somehow lighter for it.`
            ] : [
                `Matched dominance produces extraordinary friction. The session between them lasted nearly two hours — neither willing to concede, neither able to fully impose, both burning at the same temperature. The draw, when it came, was as mutual as everything preceding it. They left the room breathing hard and not looking at each other, which meant they were looking at each other constantly.`,
                `Two women who refuse to yield to anything. The session became a sustained, exhausting, private war that resolved itself not through victory but through depletion — each giving the other exactly as much as they'd been given. The room held no verdict. Both of them carried one anyway.`
            ];
            title = 'Sexfight Result';
            text = stories[Math.floor(Math.random() * stories.length)];
        }

        if (title) {
            gs.addNews('club', `${winner.name} and ${loser.name} participated in a private ${title.toLowerCase().replace(' result', '')} session.`);

            // Instead of jumping back to interactions, present the breakdown modal on top of the Match UI, 
            // and force the user to click "Return to Dashboard" to close both
            const container = document.getElementById('main-view') || document.body;
            container.innerHTML = `
                ${window.UIComponents.createSectionHeader('Activity Concluded', 'The hierarchy has been established.')}
                <div class="glass-panel" style="max-width:800px; margin: 2rem auto; padding: 2rem; border-left: 4px solid var(--accent); text-align:center;">
                    <h2 class="font-outfit text-gradient" style="font-size: 2rem; margin-bottom: 1rem;">${title}</h2>
                    <p style="font-size: 1.1rem; line-height: 1.7; color: #ddd; margin-bottom: 2rem; text-align:left;">${text}</p>
                    <div style="display:flex; justify-content:space-around; background: rgba(0,0,0,0.4); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                        <div>
                            <img src="${winner.avatar ? 'assets/portraits/' + winner.avatar : 'assets/portraits/' + winner.name.toLowerCase() + '.png'}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #00e676; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\'%3E%3Crect width=\\'80\\' height=\\'80\\' fill=\\'%23333\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23fff\\' font-family=\\'sans-serif\\' font-size=\\'24\\'%3E?%3C/text%3E%3C/svg%3E';" />
                            <h3 style="color:#00e676;">${winner.name} (DOMINANT)</h3>
                            <p style="font-size:0.85rem; color:var(--text-muted);">DOM: ${winner.personality.dominance_hunger} | Morale: ${winner.dynamic_state.morale}%</p>
                        </div>
                        <div style="align-self:center; font-size:2rem; color:var(--text-muted);">VS</div>
                        <div>
                            <img src="${loser.avatar ? 'assets/portraits/' + loser.avatar : 'assets/portraits/' + loser.name.toLowerCase() + '.png'}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #ff5252; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\'%3E%3Crect width=\\'80\\' height=\\'80\\' fill=\\'%23333\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23fff\\' font-family=\\'sans-serif\\' font-size=\\'24\\'%3E?%3C/text%3E%3C/svg%3E';" />
                            <h3 style="color:#ff5252;">${loser.name} (SUBMITTED)</h3>
                            <p style="font-size:0.85rem; color:var(--text-muted);">SUB: ${loser.personality.submissive_lean} | Morale: ${loser.dynamic_state.morale}%</p>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="window.Router.loadRoute('club')" style="padding: 1rem 3rem; font-size: 1.1rem;">Return to Club</button>
                </div>
            `;
        }
    }
};
