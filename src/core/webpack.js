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
