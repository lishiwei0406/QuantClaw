// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
// ---------------------------------------------------------------------------
// Plugin loader — discovers and loads OpenClaw-compatible TypeScript plugins
// using jiti for dynamic TypeScript import.
// ---------------------------------------------------------------------------
import * as fs from "node:fs";
import * as path from "node:path";
import { createJiti } from "jiti";
import { createPluginApi, createPluginRecord, } from "./plugin-api-shim.js";
// ---------------------------------------------------------------------------
// Jiti loader singleton — configured with openclaw/plugin-sdk alias.
// ---------------------------------------------------------------------------
let jitiLoader = null;
function getJiti(sdkShimPath) {
    if (!jitiLoader) {
        jitiLoader = createJiti(import.meta.url, {
            interopDefault: true,
            extensions: [
                ".ts", ".tsx", ".mts", ".cts",
                ".js", ".mjs", ".cjs", ".json",
            ],
            alias: {
                "openclaw/plugin-sdk": sdkShimPath,
                // Some plugins import the account-id sub-path.
                "openclaw/plugin-sdk/account-id": sdkShimPath,
            },
        });
    }
    return jitiLoader;
}
function loadManifest(pluginDir) {
    // Try OpenClaw manifest first, then QuantClaw.
    for (const filename of ["openclaw.plugin.json", "quantclaw.plugin.json"]) {
        const manifestPath = path.join(pluginDir, filename);
        if (fs.existsSync(manifestPath)) {
            try {
                const raw = fs.readFileSync(manifestPath, "utf-8");
                return JSON.parse(raw);
            }
            catch {
                continue;
            }
        }
    }
    return null;
}
// ---------------------------------------------------------------------------
// Entry point resolution
// ---------------------------------------------------------------------------
function resolveEntryPoint(pluginDir) {
    const candidates = [
        "index.ts",
        "index.js",
        "src/index.ts",
        "src/index.js",
        "dist/index.js",
    ];
    for (const c of candidates) {
        const full = path.join(pluginDir, c);
        if (fs.existsSync(full))
            return full;
    }
    // Check package.json main field.
    const pkgPath = path.join(pluginDir, "package.json");
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
            if (typeof pkg.main === "string") {
                const mainPath = path.join(pluginDir, pkg.main);
                if (fs.existsSync(mainPath))
                    return mainPath;
            }
        }
        catch {
            // ignore
        }
    }
    return null;
}
// ---------------------------------------------------------------------------
// Load a single plugin
// ---------------------------------------------------------------------------
async function loadPlugin(opts) {
    const { pluginDir, pluginId, config, pluginConfig, runtime, logger, registries, sdkShimPath } = opts;
    // Load manifest (optional — some plugins only have index.ts).
    const manifest = loadManifest(pluginDir);
    const id = manifest?.id ?? pluginId;
    const name = manifest?.name ?? pluginId;
    // Resolve entry point.
    const entryPoint = resolveEntryPoint(pluginDir);
    if (!entryPoint) {
        logger.warn(`[loader] no entry point found for plugin: ${pluginId} at ${pluginDir}`);
        return null;
    }
    // Create plugin record.
    const record = createPluginRecord({
        id,
        name,
        version: manifest?.version,
        description: manifest?.description,
        source: entryPoint,
    });
    // Create API shim.
    const api = createPluginApi({
        pluginId: id,
        pluginName: name,
        pluginVersion: manifest?.version,
        pluginDescription: manifest?.description,
        source: entryPoint,
        config,
        pluginConfig,
        runtime,
        logger,
        record,
        registries,
    });
    // Load plugin module via jiti.
    try {
        const jiti = getJiti(sdkShimPath);
        const mod = await jiti.import(entryPoint, { default: true });
        if (typeof mod === "function") {
            // Plugin exported a register function directly.
            await mod(api);
        }
        else if (mod && typeof mod === "object") {
            const def = mod;
            // Override record metadata from module export if provided.
            if (def.id)
                record.id = def.id;
            if (def.name)
                record.name = def.name;
            if (def.version)
                record.version = def.version;
            if (def.description)
                record.description = def.description;
            // Call register().
            if (typeof def.register === "function") {
                await def.register(api);
            }
            // Call activate() if present.
            if (typeof def.activate === "function") {
                await def.activate(api);
            }
        }
        else {
            logger.warn(`[loader] plugin ${id} exported neither function nor object`);
            return null;
        }
        logger.info(`[loader] loaded plugin: ${id} (${record.toolNames.length} tools, ` +
            `${record.hookCount} hooks, ${record.serviceIds.length} services)`);
        return record;
    }
    catch (err) {
        logger.error(`[loader] failed to load plugin ${id}: ${String(err)}`);
        return null;
    }
}
/**
 * Load all enabled plugins from the startup configuration.
 *
 * The startup config is parsed from the QUANTCLAW_PLUGIN_CONFIG env var and
 * contains the list of enabled plugin IDs, their configs, and the workspace
 * directory.
 */
export async function loadPlugins(opts) {
    const { startupConfig, runtime, logger, registries, sdkShimPath } = opts;
    const records = [];
    const config = {
        workspace_dir: startupConfig.workspace_dir,
        plugins: startupConfig.plugins,
    };
    // Discover plugin directories.
    const pluginDirs = discoverPluginDirs(startupConfig, logger);
    for (const { id, dir } of pluginDirs) {
        if (!startupConfig.enabled_plugins.includes(id)) {
            logger.debug?.(`[loader] skipping disabled plugin: ${id}`);
            continue;
        }
        const pluginConfig = startupConfig.plugins?.[id];
        const record = await loadPlugin({
            pluginDir: dir,
            pluginId: id,
            config,
            pluginConfig,
            runtime,
            logger,
            registries,
            sdkShimPath,
        });
        if (record) {
            records.push(record);
        }
    }
    logger.info(`[loader] loaded ${records.length} plugins total`);
    return { records, registries };
}
function discoverPluginDirs(config, logger) {
    const entries = [];
    const seen = new Set();
    const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "/tmp";
    const quantclawDir = path.join(homeDir, ".quantclaw");
    // Search paths in priority order.
    const searchDirs = [
        // Workspace plugins.
        config.workspace_dir
            ? path.join(config.workspace_dir, ".openclaw", "plugins")
            : null,
        config.workspace_dir
            ? path.join(config.workspace_dir, ".quantclaw", "plugins")
            : null,
        // Global plugins.
        path.join(quantclawDir, "plugins"),
        path.join(quantclawDir, "extensions"),
        // Bundled plugins.
        path.join(quantclawDir, "bundled-plugins"),
    ].filter(Boolean);
    for (const searchDir of searchDirs) {
        if (!fs.existsSync(searchDir))
            continue;
        let dirEntries;
        try {
            dirEntries = fs.readdirSync(searchDir, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of dirEntries) {
            if (!entry.isDirectory())
                continue;
            const pluginDir = path.join(searchDir, entry.name);
            // Derive plugin ID from manifest or directory name.
            const manifest = loadManifest(pluginDir);
            const id = manifest?.id ?? entry.name;
            if (seen.has(id))
                continue;
            seen.add(id);
            entries.push({ id, dir: pluginDir });
        }
    }
    logger.debug?.(`[loader] discovered ${entries.length} plugin directories`);
    return entries;
}
//# sourceMappingURL=plugin-loader.js.map