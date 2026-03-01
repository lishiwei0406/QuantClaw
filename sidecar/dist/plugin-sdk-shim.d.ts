export type { PluginApi as OpenClawPluginApi, AgentTool as AnyAgentTool, ToolFactory as OpenClawPluginToolFactory, ToolRegistrationOptions as OpenClawPluginToolOptions, ToolFactoryContext as OpenClawPluginToolContext, HookHandler as InternalHookHandler, HookOptions as OpenClawPluginHookOptions, HttpHandler as OpenClawPluginHttpHandler, HttpHandler as OpenClawPluginHttpRouteHandler, CliRegistrar as OpenClawPluginCliRegistrar, PluginService as OpenClawPluginService, ServiceContext as OpenClawPluginServiceContext, PluginCommand as OpenClawPluginCommandDefinition, ProviderPlugin, ChannelPlugin, PluginLogger, PluginRuntime, PluginDefinition as OpenClawPluginDefinition, GatewayMethodHandler as GatewayRequestHandler, } from "./types.js";
/**
 * Returns an empty config schema that always validates.
 * Many plugins use this when they have no configuration.
 */
export declare function emptyPluginConfigSchema(): {
    safeParse: (value: unknown) => {
        success: true;
        data: Record<string, unknown>;
    };
    jsonSchema: Record<string, unknown>;
};
/**
 * Resolve a user-provided path, expanding ~ to home directory.
 */
export declare function resolveUserPath(input: string): string;
//# sourceMappingURL=plugin-sdk-shim.d.ts.map