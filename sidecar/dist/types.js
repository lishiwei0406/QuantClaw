// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
/** Classification of every OpenClaw hook. */
export const HOOK_MODES = {
    before_model_resolve: "modifying",
    before_prompt_build: "modifying",
    before_agent_start: "modifying",
    llm_input: "void",
    llm_output: "void",
    agent_end: "void",
    before_compaction: "void",
    after_compaction: "void",
    before_reset: "void",
    message_received: "void",
    message_sending: "modifying",
    message_sent: "void",
    before_tool_call: "modifying",
    after_tool_call: "void",
    tool_result_persist: "sync",
    before_message_write: "sync",
    session_start: "void",
    session_end: "void",
    subagent_spawning: "modifying",
    subagent_delivery_target: "modifying",
    subagent_spawned: "void",
    subagent_ended: "void",
    gateway_start: "void",
    gateway_stop: "void",
};
//# sourceMappingURL=types.js.map