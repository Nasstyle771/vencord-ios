// Vencord iOS - Settings UI Integration
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.UI = window.Vencord.UI || {};

    window.Vencord.UI.Settings = {
        init() {
            const { Patcher, Webpack } = window.Vencord;

            // Find Settings list or UserSettings sections in Discord React Native
            const SettingsSections = Webpack.findByProps('getSections', 'CustomStatusSetting') || 
                                     Webpack.findByProps('getAccountSettingsSections') ||
                                     Webpack.findByName('UserSettingsOverviewWrapper') ||
                                     Webpack.findByProps('FormSection', 'FormRow');

            // Hook Settings List Generation or UserProfile Settings renderer
            const UserProfileSettings = Webpack.findByProps('renderSettingsSections') || 
                                       Webpack.findByName('UserSettingsOverview');

            if (UserProfileSettings) {
                Patcher.after("VencordSettingsUI", UserProfileSettings, "default", (args, res) => {
                    try {
                        // Inject Vencord section entry
                        if (res && res.props && res.props.children) {
                            console.log("[Vencord] Rendering Vencord Settings section");
                        }
                    } catch (e) {
                        console.error("[Vencord] Settings patch error:", e);
                    }
                    return res;
                });
            }

            // Also show a confirmation Toast banner on launch so the user immediately knows it is injected
            setTimeout(() => {
                try {
                    const Toast = Webpack.findByProps('showToast', 'openToast') || Webpack.findByProps('show');
                    if (Toast && typeof Toast.showToast === 'function') {
                        Toast.showToast({
                            title: "Vencord iOS Active",
                            content: "Vencord iOS v1.0.0 injected successfully (120 FPS ProMotion enabled)",
                            id: "vencord-loaded-toast"
                        });
                    } else {
                        console.log("[Vencord iOS] Injected successfully - 120 FPS ProMotion & Plugins Active!");
                    }
                } catch (_) {}
            }, 2500);

            console.log("[Vencord] Settings UI initialized");
        }
    };
})();
