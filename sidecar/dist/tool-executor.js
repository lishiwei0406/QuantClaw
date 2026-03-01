// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
export class ToolExecutor {
    tools = new Map();
    /** Register a tool from a plugin. */
    register(pluginId, tool) {
        this.tools.set(tool.name, { pluginId, tool });
    }
    /** Check if a tool exists. */
    has(name) {
        return this.tools.has(name);
    }
    /** List all tool names. */
    toolNames() {
        return [...this.tools.keys()];
    }
    /** Get tools owned by a specific plugin. */
    toolsForPlugin(pluginId) {
        const result = [];
        for (const [name, entry] of this.tools) {
            if (entry.pluginId === pluginId)
                result.push(name);
        }
        return result;
    }
    /** Return JSON schemas for all registered tools. */
    getSchemas() {
        const schemas = [];
        for (const entry of this.tools.values()) {
            const t = entry.tool;
            schemas.push({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema ?? t.parameters,
            });
        }
        return schemas;
    }
    /** Execute a tool by name. */
    async execute(toolName, args) {
        const entry = this.tools.get(toolName);
        if (!entry) {
            throw new Error(`Tool not found: ${toolName}`);
        }
        return entry.tool.run(args);
    }
}
//# sourceMappingURL=tool-executor.js.map