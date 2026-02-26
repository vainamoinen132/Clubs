/**
 * ui_dialogue.js
 * Advanced, multi-turn dialogue engine for deep character interaction.
 */

window.UIDialogue = {
    currentFighterId: null,
    costPaid: false,

    render(fighterId) {
        this.currentFighterId = fighterId;
        this.costPaid = false;
        this._showDialogueModal();
    },

    _showDialogueModal() {
        const modal = document.getElementById('interaction-modal');
        if (!modal) return;

        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);

        // On first open, charge the 1 AP entry fee
        if (!this.costPaid) {
            if (gs.actionPoints < 1) {
                alert("Not enough Action Points to initiate a deep conversation.");
                return;
            }
            gs.actionPoints -= 1;
            this.costPaid = true;
        }

        modal.innerHTML = `
            <div class="glass-panel" style="max-width: 700px; width: 100%; padding: 2rem; position: relative; border-top: 4px solid var(--accent); background: #111;">
                <h2 class="font-outfit text-gradient" style="margin-bottom: 0.5rem;">Private Conversation: ${f.name}</h2>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem; display: flex; justify-content: space-between;">
                    <span>Morale: <strong style="${f.dynamic_state.morale < 50 ? 'color:#ff3d00' : 'color:#00e676'}">${f.dynamic_state.morale.toFixed(0)}%</strong></span>
                    <span>Stress: <strong style="${f.dynamic_state.stress > 60 ? 'color:#ff3d00' : 'color:#00e676'}">${f.dynamic_state.stress.toFixed(0)}%</strong></span>
                    <span>Ego: <strong>${f.dynamic_state.ego}</strong></span>
                </div>
                
                <div id="dialogue-box" style="background: rgba(0,0,0,0.5); padding: 1.5rem; border-radius: 8px; border: 1px solid #333; margin-bottom: 1.5rem; min-height: 120px; font-family: serif; font-size: 1.1rem; line-height: 1.5;">
                    You pull ${f.name} into your office and close the blinds. "We need to talk," you say. She takes a seat, watching you expectantly.
                </div>
                
                <h4 style="margin-bottom: 1rem; color: var(--text-muted);">Available Topics</h4>
                <div id="dialogue-options" style="display: flex; flex-direction: column; gap: 0.8rem;">
                    ${this._generateTopics(f)}
                </div>
                
                <div style="margin-top: 2rem; text-align: right;">
                    <button class="btn-primary" style="background: transparent; border: 1px solid #555; padding: 0.5rem 2rem;" onclick="window.UIDialogue._close()">End Conversation</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    _generateTopics(f) {
        let html = "";

        // 1. General Well-being
        html += `<button class="btn-primary" style="background:#222; text-align:left; border-left: 3px solid var(--accent);" onclick="window.UIDialogue._topicWellbeing()">Discuss her current form and mindset</button>`;

        // 2. Contract Status (if expiring soon)
        if (f.contract && f.contract.seasons_remaining <= 1) {
            html += `<button class="btn-primary" style="background:#222; text-align:left; border-left: 3px solid #ff9800;" onclick="window.UIDialogue._topicContract()">Discuss her expiring contract</button>`;
        }

        // 3. Relationships
        if (f.dynamic_state.relationships && Object.keys(f.dynamic_state.relationships).length > 0) {
            Object.keys(f.dynamic_state.relationships).forEach(targetId => {
                let target = window.GameState.getFighter(targetId);
                let relTypeVal = f.dynamic_state.relationships[targetId];
                let relType = relTypeVal.type ? relTypeVal.type : relTypeVal;

                let isExternal = target.club_id && target.club_id !== window.GameState.playerClubId;
                let clubStr = isExternal ? `[${window.GameState.getClub(target.club_id).name}]` : `[Teammate]`;

                html += `<button class="btn-primary" style="background:#222; text-align:left; border-left: 3px solid #e91e63;" onclick="window.UIDialogue._topicRelationship('${targetId}', '${relType}', ${isExternal})">Ask about ${target.name} ${clubStr} (${relType.replace('_', ' ')})</button>`;
            });
        }

        return html;
    },

    _updateDialogue(text, optionsHtml) {
        document.getElementById('dialogue-box').innerHTML = text;
        document.getElementById('dialogue-options').innerHTML = optionsHtml;
    },

    // --- Topic Handlers --- //

    _topicWellbeing() {
        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);

        let reply = "";
        if (f.dynamic_state.morale < 40) reply = `"Honestly? I'm struggling. Everything feels too heavy right now."`;
        else if (f.dynamic_state.stress > 70) reply = `"I'm severely burned out. The pressure is getting to me. I need a break or a very easy win."`;
        else if (f.dynamic_state.ego === 'High') reply = `"I feel untouchable. Just keep putting bodies in front of me and I'll keep breaking them."`;
        else reply = `"I'm feeling good. Camp is going well, weight is on track. I'm ready for whatever you throw at me."`;

        let opts = `
            <button class="btn-primary" style="background:#333;" onclick="window.UIDialogue._applyWellbeingEffect('supportive')">Offer supportive counseling (Restores Morale)</button>
            <button class="btn-primary" style="background:#333;" onclick="window.UIDialogue._applyWellbeingEffect('harsh')">Demand tougher mentality (Drops Stress, but hurts Morale)</button>
            <button class="btn-primary" style="background:transparent; border:1px solid #555;" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>
        `;

        this._updateDialogue(`${f.name} sighs. ${reply}`, opts);
    },

    _applyWellbeingEffect(approach) {
        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);

        if (approach === 'supportive') {
            f.dynamic_state.morale = Math.min(100, f.dynamic_state.morale + 15);
            this._updateDialogue(`You spend time building her up. She leaves feeling much better about her position in the club. <strong>[Morale +15]</strong>`, `<button class="btn-primary" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`);
        } else {
            f.dynamic_state.stress = Math.max(0, f.dynamic_state.stress - 20);
            f.dynamic_state.morale = Math.max(0, f.dynamic_state.morale - 10);
            this._updateDialogue(`You brutally deconstruct her complaints, telling her to harden up. The anxiety vanishes, replaced by cold obedience. <strong>[Stress -20, Morale -10]</strong>`, `<button class="btn-primary" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`);
        }
    },

    _topicContract() {
        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);

        let text = `"My contract is up soon," ${f.name} says, leaning forward. "I expect a significant pay bump if you want me bleeding for this club any longer."`;
        let opts = `
            <button class="btn-primary" style="background:#333;" onclick="window.Router.loadRoute('roster'); window.UIInteractions._closeModal();">Open Contract Renegotiator</button>
            <button class="btn-primary" style="background:transparent; border:1px solid #555;" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>
        `;

        this._updateDialogue(text, opts);
    },

    _topicRelationship(targetId, relType, isExternal) {
        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);
        const target = gs.getFighter(targetId);

        let text = "";
        let opts = "";

        if (relType === 'Lover' || relType === 'Obsession') {
            if (isExternal) {
                let cName = gs.getClub(target.club_id).name;
                text = `${f.name} blushes furiously, looking away. "It's complicated... I know she fights for ${cName}, but we try to keep that separate from us. It's hard."`;
                opts = `
                    <button class="btn-primary" style="background:#333;" onclick="window.UIDialogue._leverageLoverTransfer('${targetId}')">Tell her to convince ${target.name} to transfer to your club.</button>
                    <button class="btn-primary" style="background:#e0284f;" onclick="window.UIDialogue._breakOffRelationship('${targetId}')">Order her to break it off. It's a distraction.</button>
                    <button class="btn-primary" style="background:transparent; border:1px solid #555;" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>
                `;
            } else {
                text = `${f.name} smiles softly. "Having ${target.name} around the gym... it makes the training camps bearable. We push each other."`;
                opts = `<button class="btn-primary" style="background:transparent; border:1px solid #555;" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`;
            }
        } else if (relType === 'Bitter Rival') {
            text = `${f.name}'s jaw clenches. "Don't even say her name. I want to break ${target.name} in half. Just book the match."`;
            opts = `<button class="btn-primary" style="background:transparent; border:1px solid #555;" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`;
        } else {
            text = `She nods respectfully. "We have a good dynamic. It's strictly professional."`;
            opts = `<button class="btn-primary" style="background:transparent; border:1px solid #555;" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`;
        }

        this._updateDialogue(text, opts);
    },

    _leverageLoverTransfer(targetId) {
        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);
        const target = gs.getFighter(targetId);
        const targetClub = gs.getClub(target.club_id);

        // This sets a temporary global flag that ui_transfers.js can read when generating the Transfer Fee
        gs.activeTransferLeverage = {
            sourceFighter: f.id,
            targetFighter: target.id,
            type: 'Lover'
        };

        let text = `Her eyes light up at the suggestion. "You'd really pay ${targetClub.name}'s transfer fee to bring her here? I'll text her right now. It won't get you out of paying her contract buyout, but I promise you, she will demand the trade." <br><br> <strong style="color:var(--accent);">[Transfer Leverage Generated. Go to the Transfers screen to initiate the bid.]</strong>`;

        this._updateDialogue(text, `<button class="btn-primary" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`);
    },

    _breakOffRelationship(targetId) {
        const gs = window.GameState;
        const f = gs.getFighter(this.currentFighterId);

        delete f.dynamic_state.relationships[targetId];
        f.dynamic_state.morale = Math.max(0, f.dynamic_state.morale - 40);
        f.dynamic_state.stress = Math.min(100, f.dynamic_state.stress + 30);

        let text = `She stares at you in complete shock, tears welling up before anger replaces them. "You don't own my life outside the cage," she spits. But she nods stiffly. "Fine. It's done."<br><br><strong>[Relationship Broken. Morale collapsed. Stress sky-rocketed.]</strong>`;

        this._updateDialogue(text, `<button class="btn-primary" onclick="window.UIDialogue._showDialogueModal()">Back to Topics</button>`);
    },

    _close() {
        document.getElementById('interaction-modal').classList.add('hidden');
        if (typeof updateNavUI === 'function') updateNavUI();
        window.Router.loadRoute('interactions');
    }
};
