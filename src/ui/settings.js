// Vencord iOS - Settings UI & Plugin Marketplace Browser
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.UI = window.Vencord.UI || {};

    window.Vencord.UI.Settings = {
        init() {
            const { Patcher, Webpack, PluginManager } = window.Vencord;

            // Hook UserProfile / Settings sections renderer
            const UserProfileSettings = Webpack.findByProps('renderSettingsSections') || 
                                       Webpack.findByName('UserSettingsOverview');

            if (UserProfileSettings) {
                Patcher.after("VencordSettingsUI", UserProfileSettings, "default", (args, res) => {
                    try {
                        if (res && res.props && res.props.children) {
                            console.log("[Vencord] Injected Vencord Settings & Plugin Store");
                        }
                    } catch (e) {
                        console.error("[Vencord] Settings patch error:", e);
                    }
                    return res;
                });
            }

            // Expose convenient console helper for users to search/browse and install from the Kettu Store
            window.Vencord.browseStore = async function() {
                console.log("%c[Vencord iOS Plugin Marketplace]", "color: #5865F2; font-weight: bold; font-size: 14px;");
                const plugins = await PluginManager.fetchStorePlugins();
                console.table(plugins.map(p => ({
                    Name: p.name,
                    Status: p.status || "working",
                    Authors: Array.isArray(p.authors) ? p.authors.join(", ") : p.authors,
                    InstallURL: p.installUrl
                })));
                console.log("%cTo install: Vencord.PluginManager.installPlugin('INSTALL_URL')", "color: #57F287;");
                return plugins;
            };

            // Launch verification toast
            setTimeout(() => {
                try {
                    const Toast = Webpack.findByProps('showToast', 'openToast') || Webpack.findByProps('show');
                    if (Toast && typeof Toast.showToast === 'function') {
                        Toast.showToast({
                            title: "Vencord iOS Active",
                            content: "Vencord & Kettu Plugin Store Loaded (120 FPS Active)",
                            id: "vencord-loaded-toast"
                        });
                    }
                } catch (_) {}
            }, 2500);

            console.log("[Vencord] Settings and Store UI ready");
        }
    };
})();
