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
