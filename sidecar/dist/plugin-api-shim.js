// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
// ---------------------------------------------------------------------------
// Plugin API shim — implements the OpenClawPluginApi interface.
//
// Each loaded plugin receives its own PluginApi instance.  The shim captures
// all registration calls (registerTool, registerHook, …) into the shared
// registries (ToolExecutor, HookDispatcher, etc.) and tracks what each
// plugin registered for reporting via `plugin.list`.
// ---------------------------------------------------------------------------
import * as path from "node:path";
import * as os from "node:os";
// ---------------------------------------------------------------------------
// Create a PluginApi for a specific plugin.
// ---------------------------------------------------------------------------
export function createPluginApi(opts) {
    const { pluginId, pluginName, source, config, pluginConfig, runtime, logger, record, registries, } = opts;
    const toolFactoryCtx = {
        config,
        workspaceDir: config.workspace_dir,
    };
    const api = {
        id: pluginId,
        name: pluginName,
        version: opts.pluginVersion,
        description: opts.pluginDescription,
        source,
        config,
        pluginConfig,
        runtime,
        logger,
        // -------------------------------------------------------------------
        // Tool registration
        // -------------------------------------------------------------------
        registerTool(tool, toolOpts) {
            if (typeof tool === "function") {
                // Tool factory — invoke to get actual tools.
                try {
                    const result = tool(toolFactoryCtx);
                    if (!result) {
                        if (!toolOpts?.optional) {
                            logger.warn(`[plugin:${pluginId}] tool factory returned nothing`);
                        }
                        return;
                    }
                    const tools = Array.isArray(result) ? result : [result];
                    for (const t of tools) {
                        registries.tools.register(pluginId, t);
                        record.toolNames.push(t.name);
                    }
                }
                catch (err) {
                    if (!toolOpts?.optional) {
                        logger.error(`[plugin:${pluginId}] tool factory error: ${String(err)}`);
                    }
                }
            }
            else {
                const t = tool;
                const name = toolOpts?.name ?? t.name;
                registries.tools.register(pluginId, { ...t, name });
                record.toolNames.push(name);
            }
        },
        // -------------------------------------------------------------------
        // Hook registration
        // -------------------------------------------------------------------
        registerHook(events, handler, hookOpts) {
            const names = Array.isArray(events) ? events : [events];
            for (const hookName of names) {
                registries.hooks.register({
                    pluginId,
                    hookName,
                    handler,
                    priority: hookOpts?.priority ?? 0,
                });
                if (!record.hookNames.includes(hookName)) {
                    record.hookNames.push(hookName);
                }
                record.hookCount++;
            }
        },
        on(hookName, handler, hookOpts) {
            api.registerHook(hookName, handler, hookOpts);
        },
        // -------------------------------------------------------------------
        // HTTP
        // -------------------------------------------------------------------
        registerHttpHandler(handler) {
            registries.httpHandlers.push({ pluginId, handler });
            record.httpHandlerCount++;
        },
        registerHttpRoute(params) {
            // Normalize path to /plugins/{id}/...
            const normalizedPath = params.path.startsWith("/")
                ? `/plugins/${pluginId}${params.path}`
                : `/plugins/${pluginId}/${params.path}`;
            registries.httpRoutes.push({
                pluginId,
                path: normalizedPath,
                handler: params.handler,
            });
            record.httpHandlerCount++;
        },
        // -------------------------------------------------------------------
        // Channel
        // -------------------------------------------------------------------
        registerChannel(registration) {
            const channel = "plugin" in registration ? registration.plugin : registration;
            registries.channels.push({ pluginId, channel });
            if (!record.channelIds.includes(channel.id)) {
                record.channelIds.push(channel.id);
            }
        },
        // -------------------------------------------------------------------
        // Gateway
        // -------------------------------------------------------------------
        registerGatewayMethod(method, handler) {
            registries.gatewayMethods.push({ pluginId, method, handler });
            if (!record.gatewayMethods.includes(method)) {
                record.gatewayMethods.push(method);
            }
        },
        // -------------------------------------------------------------------
        // CLI
        // -------------------------------------------------------------------
        registerCli(registrar, cliOpts) {
            registries.cliEntries.push({
                pluginId,
                registrar,
                commands: cliOpts?.commands,
            });
            if (cliOpts?.commands) {
                record.cliCommands.push(...cliOpts.commands);
            }
        },
        // -------------------------------------------------------------------
        // Service
        // -------------------------------------------------------------------
        registerService(service) {
            registries.services.push({ pluginId, service });
            if (!record.serviceIds.includes(service.id)) {
                record.serviceIds.push(service.id);
            }
        },
        // -------------------------------------------------------------------
        // Provider
        // -------------------------------------------------------------------
        registerProvider(provider) {
            registries.providers.push({ pluginId, provider });
            if (!record.providerIds.includes(provider.id)) {
                record.providerIds.push(provider.id);
            }
        },
        // -------------------------------------------------------------------
        // Command
        // -------------------------------------------------------------------
        registerCommand(command) {
            registries.commands.push({ pluginId, command });
            if (!record.commandNames.includes(command.name)) {
                record.commandNames.push(command.name);
            }
        },
        // -------------------------------------------------------------------
        // Utilities
        // -------------------------------------------------------------------
        resolvePath(input) {
            if (input.startsWith("~")) {
                return path.join(os.homedir(), input.slice(1));
            }
            return path.resolve(input);
        },
    };
    return api;
}
/** Create an empty PluginRecord. */
export function createPluginRecord(opts) {
    return {
        id: opts.id,
        name: opts.name,
        version: opts.version,
        description: opts.description,
        source: opts.source,
        toolNames: [],
        hookNames: [],
        serviceIds: [],
        providerIds: [],
        channelIds: [],
        commandNames: [],
        gatewayMethods: [],
        cliCommands: [],
        httpHandlerCount: 0,
        hookCount: 0,
    };
}
//# sourceMappingURL=plugin-api-shim.js.map