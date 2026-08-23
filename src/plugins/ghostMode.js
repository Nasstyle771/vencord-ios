// Vencord iOS - Ghost Mode (Silent Typing & Invisible Read Receipts)
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    window.Vencord.Plugins.GhostMode = {
        name: "GhostMode",
        description: "Blocks typing indicators and read receipts to keep you completely invisible.",
        author: "Vencord iOS Team",
        enabled: true,

        start() {
            const { Webpack, Patcher } = window.Vencord;

            // Block Typing Indicators
            const TypingModule = Webpack.findByProps('startTyping', 'stopTyping');
            if (TypingModule) {
                this.unpatchTyping = Patcher.instead("GhostModeTyping", TypingModule, "startTyping", () => {
                    // Drop outgoing typing indicator
                    return Promise.resolve();
                });
            }

            // Block Read Receipts (Acks)
            const AckModule = Webpack.findByProps('ack', 'bulkAck') || Webpack.findByProps('ackMessage');
            if (AckModule) {
                this.unpatchAck = Patcher.instead("GhostModeAck", AckModule, "ack", (args, orig) => {
                    // Suppress automatic read status update
                    return Promise.resolve();
                });
            }

            console.log("[Vencord] GhostMode plugin loaded");
        },

        stop() {
            if (this.unpatchTyping) this.unpatchTyping();
            if (this.unpatchAck) this.unpatchAck();
        }
    };
})();
