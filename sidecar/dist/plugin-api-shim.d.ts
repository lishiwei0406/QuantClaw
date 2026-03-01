import type { ChannelEntry, CliEntry, CommandEntry, GatewayMethodEntry, HttpHandlerEntry, HttpRouteEntry, PluginApi, PluginLogger, PluginRecord, PluginRuntime, ProviderEntry, ServiceEntry } from "./types.js";
import type { HookDispatcher } from "./hook-dispatcher.js";
import type { ToolExecutor } from "./tool-executor.js";
export interface PluginRegistries {
    tools: ToolExecutor;
    hooks: HookDispatcher;
    httpHandlers: HttpHandlerEntry[];
    httpRoutes: HttpRouteEntry[];
    channels: ChannelEntry[];
    services: ServiceEntry[];
    providers: ProviderEntry[];
    commands: CommandEntry[];
    gatewayMethods: GatewayMethodEntry[];
    cliEntries: CliEntry[];
}
export declare function createPluginApi(opts: {
    pluginId: string;
    pluginName: string;
    pluginVersion?: string;
    pluginDescription?: string;
    source: string;
    config: Record<string, unknown>;
    pluginConfig?: Record<string, unknown>;
    runtime: PluginRuntime;
    logger: PluginLogger;
    record: PluginRecord;
    registries: PluginRegistries;
}): PluginApi;
/** Create an empty PluginRecord. */
export declare function createPluginRecord(opts: {
    id: string;
    name: string;
    version?: string;
    description?: string;
    source: string;
}): PluginRecord;
//# sourceMappingURL=plugin-api-shim.d.ts.map