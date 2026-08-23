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
