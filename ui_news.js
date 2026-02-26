/**
 * ui_news.js
 * Shows incoming headlines and lore generation.
 */

window.UINews = {
    currentFilter: 'all',

    render(container, params) {
        const gs = window.GameState;

        // Mock headline if totally empty
        if (gs.news.length === 0) {
            gs.addNews("global", "Welcome to Season 1 of Club Dynasty. The stakes have never been higher as 8 clubs vie for the ultimate prize.");
        }

        let filteredNews = gs.news;
        if (this.currentFilter !== 'all') {
            filteredNews = gs.news.filter(n => n.type === this.currentFilter);
        }

        let newsHtml = filteredNews.map(n => {
            let color = 'var(--accent)';
            if (n.type === 'match') color = '#e0284f';
            if (n.type === 'transfer') color = '#28a0e0';
            if (n.type === 'drama') color = '#d4af37';

            return `
            <div class="glass-panel" style="padding: 1.2rem; margin-bottom: 1rem; border-left: 4px solid ${color};">
                <span class="season-badge" style="margin-bottom: 0.5rem; display:inline-block; background: ${color}20; color: ${color};">${n.type.toUpperCase()} - Week ${n.week}</span>
                <p style="font-size: 1.1rem; line-height: 1.5;">${n.text}</p>
            </div>
            `;
        }).join('');

        if (filteredNews.length === 0) {
            newsHtml = `<p class="text-muted">No news in this category.</p>`;
        }

        let btnStyle = (type) => `padding: 0.5rem 1rem; font-size: 0.9rem; background: ${this.currentFilter === type ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; border: none; color: #fff; cursor: pointer; border-radius: 4px; margin-right: 0.5rem;`;

        container.innerHTML = `
            ${window.UIComponents.createSectionHeader('News Feed', 'Headlines from across the league.')}
            
            <div style="margin-bottom: 1.5rem; display:flex; gap:0.5rem;">
                <button style="${btnStyle('all')}" onclick="window.UINews.setFilter('all')">All News</button>
                <button style="${btnStyle('match')}" onclick="window.UINews.setFilter('match')">Matches</button>
                <button style="${btnStyle('transfer')}" onclick="window.UINews.setFilter('transfer')">Transfers</button>
                <button style="${btnStyle('drama')}" onclick="window.UINews.setFilter('drama')">Drama / Social</button>
                <button style="${btnStyle('global')}" onclick="window.UINews.setFilter('global')">Global & Awards</button>
            </div>

            <div style="max-width: 800px;">
                ${newsHtml}
            </div>
        `;
    },

    setFilter(type) {
        this.currentFilter = type;
        this.render(document.getElementById('screen-news'));
    }
};
