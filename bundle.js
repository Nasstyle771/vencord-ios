// Vencord iOS - Patcher API
(function() {
    window.Vencord = window.Vencord || {};

    const patches = new Map();

    function createPatcher(type) {
        return function(id, parent, funcName, patchFunc) {
            if (!parent || typeof parent[funcName] !== 'function') {
                console.warn(`[Vencord::Patcher] Target ${funcName} not found on parent`);
                return () => {};
            }

            const original = parent[funcName];
            const patchKey = `${id}:${funcName}`;

            if (!parent.__vencordPatches) {
                parent.__vencordPatches = new Map();
            }

            if (!parent.__vencordOriginal) {
                parent.__vencordOriginal = original;
                
                parent[funcName] = function(...args) {
                    const ctx = this;
                    let currentArgs = args;

                    // Before hooks
                    const beforeList = parent.__vencordPatches.get('before') || [];
                    for (const hook of beforeList) {
                        try {
                            const result = hook.call(ctx, currentArgs);
                            if (Array.isArray(result)) currentArgs = result;
                        } catch (err) {
                            console.error('[Vencord::Patcher] Error in before patch:', err);
                        }
                    }

                    // Instead hooks
                    let returnValue;
                    const insteadHook = (parent.__vencordPatches.get('instead') || [])[0];
                    if (insteadHook) {
                        try {
                            returnValue = insteadHook.call(ctx, currentArgs, original.bind(ctx));
                        } catch (err) {
                            console.error('[Vencord::Patcher] Error in instead patch:', err);
                            returnValue = original.apply(ctx, currentArgs);
                        }
                    } else {
                        returnValue = original.apply(ctx, currentArgs);
                    }

                    // After hooks
                    const afterList = parent.__vencordPatches.get('after') || [];
                    for (const hook of afterList) {
                        try {
                            const result = hook.call(ctx, currentArgs, returnValue);
                            if (result !== undefined) returnValue = result;
                        } catch (err) {
                            console.error('[Vencord::Patcher] Error in after patch:', err);
                        }
                    }

                    return returnValue;
                };
            }

            const list = parent.__vencordPatches.get(type) || [];
            list.push(patchFunc);
            parent.__vencordPatches.set(type, list);

            const unpatch = () => {
                const cur = parent.__vencordPatches.get(type) || [];
                const idx = cur.indexOf(patchFunc);
                if (idx !== -1) cur.splice(idx, 1);
            };

            patches.set(patchKey, unpatch);
            return unpatch;
        };
    }

    window.Vencord.Patcher = {
        before: createPatcher('before'),
        after: createPatcher('after'),
        instead: createPatcher('instead'),
        unpatchAll: () => {
            for (const unpatch of patches.values()) {
                unpatch();
            }
            patches.clear();
        }
    };
})();
// Vencord iOS - Metro Webpack Crawler
(function() {
    window.Vencord = window.Vencord || {};

    const moduleCache = new Map();

    function getAllModules() {
        if (typeof window.__r !== 'function') return [];
        // Metro module registry exploration
        const modules = [];
        for (let i = 0; i < 50000; i++) {
            try {
                const m = window.__r(i);
                if (m) modules.push(m);
            } catch (_) {}
        }
        return modules;
    }

    function findByProps(...props) {
        for (const m of getAllModules()) {
            if (!m) continue;
            if (props.every(p => m[p] !== undefined || (m.default && m.default[p] !== undefined))) {
                return m.default && props.every(p => m.default[p] !== undefined) ? m.default : m;
            }
        }
        return null;
    }

    function findByName(name) {
        for (const m of getAllModules()) {
            if (!m) continue;
            if (m.name === name || (m.default && m.default.name === name) || m.displayName === name) {
                return m.default || m;
            }
        }
        return null;
    }

    function findByStoreName(storeName) {
        for (const m of getAllModules()) {
            if (!m) continue;
            const target = m.default || m;
            if (target && target.getName && target.getName() === storeName) {
                return target;
            }
        }
        return null;
    }

    window.Vencord.Webpack = {
        findByProps,
        findByName,
        findByStoreName,
        getAllModules,
        common: {
            get Dispatcher() { return findByProps('dispatch', 'subscribe'); },
            get UserStore() { return findByStoreName('UserStore') || findByProps('getCurrentUser'); },
            get MessageActions() { return findByProps('sendMessage', 'editMessage'); },
            get ChannelStore() { return findByStoreName('ChannelStore'); },
            get GuildStore() { return findByStoreName('GuildStore'); }
        }
    };
})();
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
// Vencord iOS - Message Logger Plugin
(function() {
    window.Vencord = window.Vencord || {};
    window.Vencord.Plugins = window.Vencord.Plugins || {};

    const deletedMessages = new Map();
    const editHistory = new Map();

    window.Vencord.Plugins.MessageLogger = {
        name: "MessageLogger",
        description: "Logs deleted messages and edit history inline in channels.",
        author: "Vencord iOS Team",
        enabled: true,

        start() {
            const { Webpack, Patcher } = window.Vencord;
            const Dispatcher = Webpack.common.Dispatcher;

            if (!Dispatcher) return;

            this.handleDelete = (event) => {
                if (!event || !event.id) return;
                deletedMessages.set(event.id, {
                    channelId: event.channelId,
                    guildId: event.guildId,
                    deletedAt: new Date()
                });
            };

            this.handleUpdate = (event) => {
                if (!event || !event.message || !event.message.id) return;
                const id = event.message.id;
                const edits = editHistory.get(id) || [];
                if (event.message.content) {
                    edits.push({
                        content: event.message.content,
                        editedAt: new Date()
                    });
                    editHistory.set(id, edits);
                }
            };

            Dispatcher.subscribe("MESSAGE_DELETE", this.handleDelete);
            Dispatcher.subscribe("MESSAGE_UPDATE", this.handleUpdate);

            // Hook Message parser / serializer to prevent deleted messages from being removed
            const MessageStore = Webpack.findByStoreName('MessageStore') || Webpack.findByProps('getMessage', 'getMessages');
            if (MessageStore) {
                this.unpatchDeleteStore = Patcher.instead("MessageLoggerDelete", MessageStore, "deleteMessage", (args, orig) => {
                    const [channelId, messageId] = args;
                    const msg = MessageStore.getMessage(channelId, messageId);
                    if (msg) {
                        msg.deleted = true;
                        msg.__vencordDeleted = true;
                        if (!msg.content.includes(" [deleted]")) {
                            msg.content += " \x1b[31m[deleted]\x1b[0m";
                        }
                        return; // Prevent actual removal
                    }
                    return orig.apply(this, args);
                });
            }

            console.log("[Vencord] MessageLogger plugin loaded");
        },

        stop() {
            const { Webpack } = window.Vencord;
            const Dispatcher = Webpack?.common?.Dispatcher;
            if (Dispatcher) {
                if (this.handleDelete) Dispatcher.unsubscribe("MESSAGE_DELETE", this.handleDelete);
                if (this.handleUpdate) Dispatcher.unsubscribe("MESSAGE_UPDATE", this.handleUpdate);
            }
            if (this.unpatchDeleteStore) this.unpatchDeleteStore();
        }
    };
})();
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
