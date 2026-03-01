import type { HookMode, HookRegistration, PluginLogger } from "./types.js";
export declare class HookDispatcher {
    private hooks;
    private readonly logger;
    constructor(logger: PluginLogger);
    /** Register a hook handler. */
    register(reg: HookRegistration): void;
    /** Get the execution mode for a hook. Defaults to "void" for unknown hooks. */
    getMode(hookName: string): HookMode;
    /** Return all registered hook names (deduplicated). */
    registeredHooks(): string[];
    /** Count handlers for a specific hook. */
    handlerCount(hookName: string): number;
    /**
     * Fire a hook event and return the merged result.
     * Dispatches to the correct execution mode automatically.
     */
    fire(hookName: string, event: Record<string, unknown>): Promise<Record<string, unknown> | undefined>;
    private fireVoid;
    private fireModifying;
    private fireSync;
}
//# sourceMappingURL=hook-dispatcher.d.ts.map