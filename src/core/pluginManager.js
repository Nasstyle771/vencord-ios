// Vencord iOS - Main Bootstrap & Plugin Manager
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.version = "1.0.0";
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    function initVencord() {
        console.log("[Vencord iOS] Initializing client modification...");

        // Wait for React Native / Metro bundle to populate
        const interval = setInterval(() => {
            if (typeof window.__r === 'function') {
                clearInterval(interval);
                startPlugins();
                if (window.Vencord.UI && window.Vencord.UI.Settings) {
                    window.Vencord.UI.Settings.init();
                }
            }
        }, 100);

        // Safety timeout
        setTimeout(() => clearInterval(interval), 15000);
    }

    function startPlugins() {
        console.log("[Vencord iOS] Starting plugins...");
        const plugins = window.Vencord.Plugins;

        for (const [name, plugin] of Object.entries(plugins)) {
            try {
                if (plugin && typeof plugin.start === 'function') {
                    plugin.start();
                    console.log(`[Vencord iOS] Plugin ${name} started successfully.`);
                }
            } catch (err) {
                console.error(`[Vencord iOS] Error starting plugin ${name}:`, err);
            }
        }
    }

    if (document.readyState === 'complete' || typeof window !== 'undefined') {
        initVencord();
    }
})();
