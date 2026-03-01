// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
// ---------------------------------------------------------------------------
// Helpers used by plugins
// ---------------------------------------------------------------------------
/**
 * Returns an empty config schema that always validates.
 * Many plugins use this when they have no configuration.
 */
export function emptyPluginConfigSchema() {
    return {
        safeParse: (_value) => ({
            success: true,
            data: {},
        }),
        jsonSchema: {
            type: "object",
            additionalProperties: false,
            properties: {},
        },
    };
}
/**
 * Resolve a user-provided path, expanding ~ to home directory.
 */
export function resolveUserPath(input) {
    if (input.startsWith("~")) {
        const home = process.env.HOME ?? process.env.USERPROFILE ?? "/tmp";
        return input.replace(/^~/, home);
    }
    return input;
}
//# sourceMappingURL=plugin-sdk-shim.js.map