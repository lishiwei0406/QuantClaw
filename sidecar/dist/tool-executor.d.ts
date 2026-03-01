import type { AgentTool, ToolSchema } from "./types.js";
export declare class ToolExecutor {
    private tools;
    /** Register a tool from a plugin. */
    register(pluginId: string, tool: AgentTool): void;
    /** Check if a tool exists. */
    has(name: string): boolean;
    /** List all tool names. */
    toolNames(): string[];
    /** Get tools owned by a specific plugin. */
    toolsForPlugin(pluginId: string): string[];
    /** Return JSON schemas for all registered tools. */
    getSchemas(): ToolSchema[];
    /** Execute a tool by name. */
    execute(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}
//# sourceMappingURL=tool-executor.d.ts.map