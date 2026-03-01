import type { PluginLogger, PluginRecord, PluginRuntime, SidecarStartupConfig } from "./types.js";
import { type PluginRegistries } from "./plugin-api-shim.js";
export interface LoadPluginsResult {
    records: PluginRecord[];
    registries: PluginRegistries;
}
/**
 * Load all enabled plugins from the startup configuration.
 *
 * The startup config is parsed from the QUANTCLAW_PLUGIN_CONFIG env var and
 * contains the list of enabled plugin IDs, their configs, and the workspace
 * directory.
 */
export declare function loadPlugins(opts: {
    startupConfig: SidecarStartupConfig;
    runtime: PluginRuntime;
    logger: PluginLogger;
    registries: PluginRegistries;
    sdkShimPath: string;
}): Promise<LoadPluginsResult>;
//# sourceMappingURL=plugin-loader.d.ts.map