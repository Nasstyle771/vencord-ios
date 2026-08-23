// Vencord iOS - OLED Pure Black Theme Plugin
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    window.Vencord.Plugins.OLEDTheme = {
        name: "OLEDTheme",
        description: "Applies pure #000000 black to chat views, server lists, and settings.",
        author: "Vencord iOS Team",
        enabled: true,

        start() {
            const { Webpack, Patcher } = window.Vencord;
            const ThemeStore = Webpack.findByStoreName('ThemeStore') || Webpack.findByProps('theme');

            if (ThemeStore && ThemeStore.theme) {
                // Ensure dark mode is active
                ThemeStore.theme = "dark";
            }

            // Hook color token resolver in Discord's React Native Theme definitions
            const ColorTokens = Webpack.findByProps('raw', 'colors') || Webpack.findByProps('SemanticColors');
            if (ColorTokens && ColorTokens.colors) {
                this.originalColors = { ...ColorTokens.colors };
                ColorTokens.colors.BACKGROUND_PRIMARY = "#000000";
                ColorTokens.colors.BACKGROUND_SECONDARY = "#050505";
                ColorTokens.colors.BACKGROUND_SECONDARY_ALT = "#0a0a0a";
                ColorTokens.colors.BACKGROUND_TERTIARY = "#000000";
                ColorTokens.colors.BACKGROUND_ACCENT = "#111111";
                ColorTokens.colors.BACKGROUND_FLOATING = "#000000";
            }

            console.log("[Vencord] OLEDTheme plugin loaded");
        },

        stop() {
            const { Webpack } = window.Vencord;
            const ColorTokens = Webpack?.findByProps('raw', 'colors');
            if (ColorTokens && this.originalColors) {
                Object.assign(ColorTokens.colors, this.originalColors);
            }
        }
    };
})();
