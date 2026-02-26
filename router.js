/**
 * router.js
 * Basic hash-based or data-attribute based view manager.
 */

window.Router = {
    currentRoute: null,

    init() {
        console.log("Initializing Router...");
        // Hide loading screen
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('main-nav').classList.remove('hidden');

        // Bind navigation clicks
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.getAttribute('data-route');
                this.loadRoute(route);
            });
        });

        // Load default route
        this.loadRoute('club');
    },

    loadRoute(routeId, params = {}) {
        if (!routeId) return;
        this.currentRoute = routeId;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-route') === routeId);
        });

        // Clear main view
        const main = document.getElementById('main-view');
        main.innerHTML = '';

        // Create container for route
        const container = document.createElement('div');
        container.className = 'view-screen active';
        container.id = `screen-${routeId}`;
        main.appendChild(container);

        // Delegate to UIScreens orchestrator
        if (window.UIScreens && typeof window.UIScreens[routeId] === 'function') {
            window.UIScreens[routeId](container, params);
        } else {
            container.innerHTML = `<h1>404</h1><p>Screen '${routeId}' not found.</p>`;
        }
    }
};
