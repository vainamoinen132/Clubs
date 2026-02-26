/**
 * ui_components.js
 * Reusable UI widgets and HTML generators.
 */

window.UIComponents = {

    createClubBadge(club) {
        if (!club) return `<span style="display:inline-block; padding: 0.2rem 0.6rem; background: #333; color: #fff; border-radius: 4px; font-weight: bold;">Unknown</span>`;
        return `<span style="display:inline-block; padding: 0.2rem 0.6rem; background: ${club.color || '#333'}; color: #ffffff; border-radius: 4px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${club.name}</span>`;
    },

    /**
     * Generates an SVG data URI for a fighter's initials portrait.
     * Uses the fighter's club color or a hashed color as the background.
     */
    _makeInitialsAvatar(name, color) {
        // Pick initials (first letter of first + last name, or just first two chars)
        const parts = (name || '?').trim().split(/\s+/);
        const initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (parts[0].substring(0, 2)).toUpperCase();

        // Generate a deterministic hue from name if no color provided
        if (!color || color === '#888') {
            let hash = 0;
            for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
            const h = Math.abs(hash) % 360;
            color = `hsl(${h}, 60%, 35%)`;
        }

        // Darken the color slightly for text contrast ring
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#111;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="70" height="70" rx="8" fill="url(#g)"/>
  <rect width="70" height="70" rx="8" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#fff" 
        font-family="'Outfit','Inter',sans-serif" font-size="26" font-weight="700"
        letter-spacing="1">${initials}</text>
</svg>`;
        return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    },

    createFighterCard(fighter, onClick = null) {
        const club = window.GameState.getClub(fighter.club_id) || { color: '#888' };

        const card = document.createElement('div');
        card.className = 'fighter-card glass-panel';
        card.style.borderTop = `4px solid ${club.color}`;

        // Stats abbreviated summary
        const avgCore = Math.round((fighter.core_stats.power + fighter.core_stats.technique + fighter.core_stats.speed) / 3);
        const bestStyle = this._getBestStyle(fighter);

        // Build avatar: try fighter.avatar, then name-based path, then initials SVG as last resort
        const fallbackInitials = this._makeInitialsAvatar(fighter.name, club.color);
        const imgSrc = fighter.avatar
            ? `assets/portraits/${fighter.avatar}`
            : `assets/portraits/${fighter.name.toLowerCase()}.png`;
        const avatarHtml = `<img src="${imgSrc}" class="fighter-portrait-sm" onerror="this.onerror=null; this.src='${fallbackInitials}';" alt="${fighter.name}" />`;

        card.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 0.8rem;">
                ${avatarHtml}
                <div style="flex-grow: 1;">
                    <div class="fighter-header" style="margin-bottom: 0.2rem;">
                        <h3>${fighter.name}</h3>
                        <span class="age">Age: ${fighter.age}</span>
                    </div>
                    <div class="fighter-tags" style="margin-bottom: 0;">
                        <span class="tag archetype">${fighter.personality.archetype}</span>
                        <span class="tag form">Form: ${fighter.dynamic_state.form}</span>
                    </div>
                </div>
            </div>
            <div class="fighter-metrics">
                <div class="metric"><span>OVR</span><strong>${avgCore}</strong></div>
                <div class="metric"><span>Wins</span><strong>${fighter.dynamic_state.wins || 0}</strong></div>
                <div class="metric"><span>Best</span><strong style="text-transform:capitalize;">${bestStyle}</strong></div>
                <div class="metric"><span>Morale</span><strong>${fighter.dynamic_state.morale}%</strong></div>
            </div>
            <div class="fighter-bars" style="margin-top: 10px;">
                <div style="font-size: 0.8rem; margin-bottom: 2px;">Fatigue</div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                    <div style="width: ${fighter.dynamic_state.fatigue}%; height: 100%; background: #FF3366; border-radius: 3px;"></div>
                </div>
            </div>
        `;

        if (typeof onClick === 'function') {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => onClick(fighter));
            card.classList.add('hoverable');
        }

        return card;
    },

    /**
     * Renders a small inline avatar (img tag string) for a fighter — used inside table rows etc.
     */
    createFighterAvatarHtml(fighter, size = 40) {
        const club = window.GameState.getClub(fighter.club_id) || { color: '#888' };
        const fallbackInitials = this._makeInitialsAvatar(fighter.name, club.color);
        const imgSrc = fighter.avatar
            ? `assets/portraits/${fighter.avatar}`
            : `assets/portraits/${fighter.name.toLowerCase()}.png`;
        return `<img src="${imgSrc}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);" onerror="this.onerror=null;this.src='${fallbackInitials}';" alt="${fighter.name}"/>`;
    },

    _getBestStyle(fighter) {
        let best = "";
        let max = -1;
        for (let [style, val] of Object.entries(fighter.style_affinities)) {
            if (val > max) { max = val; best = style; }
        }
        return best.replace('_', ' ');
    },

    createSectionHeader(title, subtitle = "") {
        let html = `<div class="section-header" style="margin-bottom: 1.5rem;">
            <h2 class="font-outfit text-gradient" style="font-size: 2rem;">${title}</h2>`;
        if (subtitle) html += `<p style="color: var(--text-muted);">${subtitle}</p>`;
        html += `</div>`;
        return html;
    },

    closeModal() {
        const modal = document.getElementById('global-modal-overlay');
        if (modal) modal.remove();
    },

    /**
     * Replaces standard alert() with a stylized HTML modal overlay
     */
    showModal(title, text, type = 'info') {
        this.closeModal(); // Ensure no duplicates

        const overlay = document.createElement('div');
        overlay.id = 'global-modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        let borderColor = type === 'danger' ? '#ff5252' : type === 'success' ? '#4caf50' : 'var(--accent, #3b82f6)';

        overlay.innerHTML = `
            <div style="background: rgba(20, 20, 25, 0.95); border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid ${borderColor}; padding: 2rem; border-radius: 12px; max-width: 550px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 20px ${borderColor}22; text-align: center; font-family: 'Inter', sans-serif;">
                <h2 style="font-family: 'Outfit', sans-serif; color: #fff; margin-top: 0; margin-bottom: 1rem; font-size: 1.8rem;">${title}</h2>
                <p style="color: #ccc; line-height: 1.7; font-size: 1rem; margin-bottom: 2rem;">${text}</p>
                <button id="global-modal-close" style="background: ${borderColor}; color: #fff; border: none; padding: 10px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: opacity 0.2s;" onclick="window.UIComponents.closeModal()">Acknowledge</button>
            </div>
        `;

        document.body.appendChild(overlay);
    }
};

// Accompanying tiny CSS for dynamic components:
const dynamicCSS = document.createElement('style');
dynamicCSS.textContent = `
    .fighter-card {
        padding: 1.2rem;
        border-radius: 12px;
        background: var(--bg-panel);
        transition: transform 0.2s, background 0.2s;
        margin-bottom: 1rem;
    }
    .fighter-card.hoverable:hover {
        transform: translateY(-4px);
        background: var(--bg-panel-hover);
    }
    .fighter-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.8rem; }
    .fighter-header h3 { font-family: var(--font-heading); color: #fff; font-size: 1.2rem; }
    .fighter-header .age { font-size: 0.85rem; color: var(--text-muted); }
    .fighter-tags { margin-bottom: 1rem; }
    .tag { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; background: rgba(255,255,255,0.1); color: #ddd; }
    .fighter-metrics { display: flex; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 0.8rem; border-radius: 8px; }
    .metric { display: flex; flex-direction: column; align-items: center; }
    .metric span { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.2rem;}
    .metric strong { color: #fff; font-family: var(--font-heading); }
    .fighter-portrait-sm {
        width: 70px;
        height: 70px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid rgba(255,255,255,0.15);
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        flex-shrink: 0;
    }
`;
document.head.appendChild(dynamicCSS);