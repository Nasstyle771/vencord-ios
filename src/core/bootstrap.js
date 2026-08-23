// Vencord iOS - Core Bootstrap
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.version = "1.0.0";
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    function initVencord() {
        console.log("[Vencord iOS] Initializing client modification with Kettu Plugin Marketplace...");

        const interval = setInterval(() => {
            if (typeof window.__r === 'function') {
                clearInterval(interval);
                startBuiltinPlugins();
                if (window.Vencord.PluginManager) {
                    window.Vencord.PluginManager.loadInstalledPlugins();
                }
                if (window.Vencord.UI && window.Vencord.UI.Settings) {
                    window.Vencord.UI.Settings.init();
                }
            }
        }, 100);

        setTimeout(() => clearInterval(interval), 15000);
    }

    function startBuiltinPlugins() {
        console.log("[Vencord iOS] Starting built-in plugins...");
        const plugins = window.Vencord.Plugins;

        for (const [name, plugin] of Object.entries(plugins)) {
            try {
                if (plugin && typeof plugin.start === 'function') {
                    plugin.start();
                    console.log(`[Vencord iOS] Plugin ${name} active.`);
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
