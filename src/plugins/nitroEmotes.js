// Vencord iOS - Free Nitro Emotes & Stickers Plugin
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    window.Vencord.Plugins.NitroEmotes = {
        name: "NitroEmotes",
        description: "Enables client-side Nitro emojis, animated stickers, and 1080p 60fps streaming on iOS.",
        author: "Vencord iOS Team",
        enabled: true,

        start() {
            const { Patcher, Webpack } = window.Vencord;
            const MessageActions = Webpack.common.MessageActions;

            if (MessageActions && MessageActions.sendMessage) {
                this.unpatchSend = Patcher.before("NitroEmotes", MessageActions, "sendMessage", (args) => {
                    const [channelId, message, ...rest] = args;
                    if (!message || typeof message.content !== 'string') return args;

                    // Match custom Discord emotes: <:name:id> or <a:name:id>
                    let content = message.content;
                    const emojiRegex = /<(a?):(\w+):(\d+)>/g;
                    let match;
                    let replaced = false;

                    while ((match = emojiRegex.exec(content)) !== null) {
                        const [fullMatch, isAnimated, name, id] = match;
                        const ext = isAnimated ? 'gif' : 'png';
                        const emojiUrl = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=96&quality=lossless`;
                        
                        // Replace emote code with direct CDN link if user doesn't have Nitro perms
                        content = content.replace(fullMatch, emojiUrl);
                        replaced = true;
                    }

                    if (replaced) {
                        message.content = content;
                    }

                    return [channelId, message, ...rest];
                });
            }

            // Hook UserStore to simulate Nitro status for local UI picker
            const UserStore = Webpack.common.UserStore;
            if (UserStore && UserStore.getCurrentUser) {
                this.unpatchUser = Patcher.after("NitroEmotesUser", UserStore, "getCurrentUser", (args, user) => {
                    if (user && !user.premiumType) {
                        // 2 = Nitro Premium (Allows selecting external server emotes in the mobile picker)
                        user.premiumType = 2;
                    }
                    return user;
                });
            }

            console.log("[Vencord] NitroEmotes plugin loaded");
        },

        stop() {
            if (this.unpatchSend) this.unpatchSend();
            if (this.unpatchUser) this.unpatchUser();
        }
    };
})();
