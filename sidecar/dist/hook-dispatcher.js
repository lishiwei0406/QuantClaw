// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
import { HOOK_MODES } from "./types.js";
export class HookDispatcher {
    hooks = [];
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /** Register a hook handler. */
    register(reg) {
        this.hooks.push(reg);
        // Keep sorted by priority descending (higher runs first).
        this.hooks.sort((a, b) => b.priority - a.priority);
    }
    /** Get the execution mode for a hook. Defaults to "void" for unknown hooks. */
    getMode(hookName) {
        return HOOK_MODES[hookName] ?? "void";
    }
    /** Return all registered hook names (deduplicated). */
    registeredHooks() {
        return [...new Set(this.hooks.map((h) => h.hookName))];
    }
    /** Count handlers for a specific hook. */
    handlerCount(hookName) {
        return this.hooks.filter((h) => h.hookName === hookName).length;
    }
    /**
     * Fire a hook event and return the merged result.
     * Dispatches to the correct execution mode automatically.
     */
    async fire(hookName, event) {
        const handlers = this.hooks.filter((h) => h.hookName === hookName);
        if (handlers.length === 0)
            return undefined;
        const mode = this.getMode(hookName);
        switch (mode) {
            case "void":
                return this.fireVoid(hookName, handlers, event);
            case "modifying":
                return this.fireModifying(hookName, handlers, event);
            case "sync":
                return this.fireSync(hookName, handlers, event);
        }
    }
    // -----------------------------------------------------------------------
    // Void — parallel, no return value
    // -----------------------------------------------------------------------
    async fireVoid(hookName, handlers, event) {
        this.logger.debug?.(`[hooks] firing ${hookName} (${handlers.length} handlers, void)`);
        const promises = handlers.map(async (h) => {
            try {
                await h.handler(event);
            }
            catch (err) {
                this.logger.error(`[hooks] ${hookName} handler from ${h.pluginId} failed: ${String(err)}`);
            }
        });
        await Promise.all(promises);
        return undefined;
    }
    // -----------------------------------------------------------------------
    // Modifying — sequential, results merged
    // -----------------------------------------------------------------------
    async fireModifying(hookName, handlers, event) {
        this.logger.debug?.(`[hooks] firing ${hookName} (${handlers.length} handlers, modifying)`);
        let result;
        for (const h of handlers) {
            try {
                const out = await h.handler(event);
                if (out !== undefined && out !== null) {
                    if (result !== undefined) {
                        result = { ...result, ...out };
                    }
                    else {
                        result = out;
                    }
                }
            }
            catch (err) {
                this.logger.error(`[hooks] ${hookName} handler from ${h.pluginId} failed: ${String(err)}`);
            }
        }
        return result;
    }
    // -----------------------------------------------------------------------
    // Sync — synchronous only, reject Promises
    // -----------------------------------------------------------------------
    async fireSync(hookName, handlers, event) {
        this.logger.debug?.(`[hooks] firing ${hookName} (${handlers.length} handlers, sync)`);
        let result;
        for (const h of handlers) {
            try {
                const out = h.handler(event);
                // Guard against accidental async handlers.
                if (out && typeof out.then === "function") {
                    this.logger.warn(`[hooks] ${hookName} handler from ${h.pluginId} returned a Promise; ` +
                        `this hook is synchronous and the result was ignored.`);
                    continue;
                }
                const typed = out;
                if (typed !== undefined && typed !== null) {
                    if (result !== undefined) {
                        result = { ...result, ...typed };
                    }
                    else {
                        result = typed;
                    }
                }
            }
            catch (err) {
                this.logger.error(`[hooks] ${hookName} handler from ${h.pluginId} failed: ${String(err)}`);
            }
        }
        return result;
    }
}
//# sourceMappingURL=hook-dispatcher.js.map