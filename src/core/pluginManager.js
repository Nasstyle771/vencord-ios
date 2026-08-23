// Vencord iOS - Plugin Management System & Kettu Marketplace Store
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    const PLUGIN_STORE_URL = "https://raw.githubusercontent.com/Purple-EyeZ/Plugins-List/refs/heads/main/src/plugins-data.json";
    const THEME_STORE_URL = "https://raw.githubusercontent.com/kmmiio99o/theme-marketplace/refs/heads/main/themes.json";

    const storage = {
        get(key, fallback = null) {
            try {
                const item = localStorage.getItem(`vencord_${key}`);
                return item ? JSON.parse(item) : fallback;
            } catch (_) {
                return fallback;
            }
        },
        set(key, val) {
            try {
                localStorage.setItem(`vencord_${key}`, JSON.stringify(val));
            } catch (_) {}
        }
    };

    const installedExternalPlugins = storage.get("installed_plugins", {});

    window.Vencord.PluginManager = {
        plugins: window.Vencord.Plugins,
        installedExternal: installedExternalPlugins,

        async fetchStorePlugins() {
            try {
                const res = await fetch(PLUGIN_STORE_URL, { cache: "no-store" });
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            } catch (err) {
                console.error("[Vencord] Failed to fetch plugin store:", err);
                return [];
            }
        },

        async fetchStoreThemes() {
            try {
                const res = await fetch(THEME_STORE_URL, { cache: "no-store" });
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            } catch (err) {
                console.error("[Vencord] Failed to fetch theme store:", err);
                return [];
            }
        },

        async installPlugin(installUrl, autoStart = true) {
            try {
                const normUrl = installUrl.endsWith("/") ? installUrl : installUrl + "/";
                const manifestUrl = normUrl + "manifest.json";
                const mainJsUrl = normUrl + "index.js";

                console.log(`[Vencord] Installing plugin from ${normUrl}...`);
                const manifestRes = await fetch(manifestUrl);
                const manifest = await manifestRes.json();

                const jsRes = await fetch(mainJsUrl);
                const jsCode = await jsRes.text();

                // Evaluate plugin in isolated scope
                const pluginFactory = new Function("Vencord", "module", "exports", `${jsCode}; return module.exports || exports.default || exports;`);
                const moduleObj = { exports: {} };
                const pluginInstance = pluginFactory(window.Vencord, moduleObj, moduleObj.exports);

                const pluginId = manifest.id || manifest.name || normUrl;
                installedExternalPlugins[pluginId] = {
                    manifest,
                    url: normUrl,
                    enabled: autoStart,
                    installedAt: Date.now()
                };
                storage.set("installed_plugins", installedExternalPlugins);

                if (pluginInstance) {
                    window.Vencord.Plugins[pluginId] = pluginInstance;
                    if (autoStart && typeof pluginInstance.start === "function") {
                        pluginInstance.start();
                    }
                }

                console.log(`[Vencord] Successfully installed ${manifest.name || pluginId}`);
                return true;
            } catch (err) {
                console.error("[Vencord] Error installing plugin:", err);
                throw err;
            }
        },

        uninstallPlugin(pluginId) {
            const plugin = window.Vencord.Plugins[pluginId];
            if (plugin && typeof plugin.stop === "function") {
                try { plugin.stop(); } catch (_) {}
            }
            delete window.Vencord.Plugins[pluginId];
            delete installedExternalPlugins[pluginId];
            storage.set("installed_plugins", installedExternalPlugins);
            console.log(`[Vencord] Uninstalled plugin ${pluginId}`);
        },

        togglePlugin(pluginId, enable) {
            const plugin = window.Vencord.Plugins[pluginId];
            if (!plugin) return;

            if (enable) {
                if (typeof plugin.start === "function") plugin.start();
                if (installedExternalPlugins[pluginId]) {
                    installedExternalPlugins[pluginId].enabled = true;
                    storage.set("installed_plugins", installedExternalPlugins);
                }
            } else {
                if (typeof plugin.stop === "function") plugin.stop();
                if (installedExternalPlugins[pluginId]) {
                    installedExternalPlugins[pluginId].enabled = false;
                    storage.set("installed_plugins", installedExternalPlugins);
                }
            }
        },

        loadInstalledPlugins() {
            for (const [id, info] of Object.entries(installedExternalPlugins)) {
                if (info && info.url && info.enabled) {
                    this.installPlugin(info.url, true).catch(e => {
                        console.warn(`[Vencord] Could not auto-load plugin ${id}:`, e);
                    });
                }
            }
        }
    };
})();
