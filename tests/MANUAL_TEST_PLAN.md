# QuantClaw Manual Test Plan

Version: 0.3.0
Last updated: 2026-03-16

## Prerequisites

1. Build `quantclaw.exe` (Release)
2. Set API key: `set ANTHROPIC_API_KEY=...` or configure OpenAI-compatible provider
3. Ensure port 18800/18801 are free
4. If Windows Smart App Control is on, sign the exe first

---

## 1. First-Run Experience

### 1.1 Clean Install Onboard

| # | Step | Expected |
|---|------|----------|
| 1.1.1 | Delete `~/.quantclaw/` entirely | Directory removed |
| 1.1.2 | `quantclaw onboard` | Interactive wizard starts |
| 1.1.3 | Follow prompts: set model, port, auth token | Config saved to `~/.quantclaw/quantclaw.json` |
| 1.1.4 | Verify workspace: `dir ~/.quantclaw/agents/main/workspace/` | SOUL.md, MEMORY.md exist |
| 1.1.5 | `quantclaw config validate` | "Configuration is valid" |

### 1.2 Re-run Onboard (Idempotent)

| # | Step | Expected |
|---|------|----------|
| 1.2.1 | `quantclaw onboard` again | Should detect existing config |
| 1.2.2 | Verify config not overwritten | Previous settings preserved |

### 1.3 Quick Onboard

| # | Step | Expected |
|---|------|----------|
| 1.3.1 | Delete config, run `quantclaw onboard --quick` | Non-interactive setup with defaults |
| 1.3.2 | `quantclaw config get gateway.port` | Default port 18800 |

---

## 2. Gateway Lifecycle

### 2.1 Startup

| # | Step | Expected |
|---|------|----------|
| 2.1.1 | `quantclaw gateway run` | Starts on default port, logs show "Gateway running" |
| 2.1.2 | `quantclaw gateway run --port 19000` | Starts on port 19000 |
| 2.1.3 | `quantclaw health` | "Gateway: ok" |
| 2.1.4 | `quantclaw status --json` | JSON with running=true, correct port |

### 2.2 Port Conflict

| # | Step | Expected |
|---|------|----------|
| 2.2.1 | Start gateway on 18800 | Running |
| 2.2.2 | Start second gateway on same port 18800 | Error: port in use |

### 2.3 Graceful Shutdown

| # | Step | Expected |
|---|------|----------|
| 2.3.1 | Start gateway, then press Ctrl+C | "Press Ctrl+C to stop" then clean exit, no crash |
| 2.3.2 | `quantclaw health` after stop | "Gateway: unreachable" |

### 2.4 Gateway Status Details

| # | Step | Expected |
|---|------|----------|
| 2.4.1 | `quantclaw gateway status` | Shows running, port, connections, sessions, uptime, version |
| 2.4.2 | `quantclaw gateway status --json` | Valid JSON output |

---

## 3. Agent Conversation

### 3.1 Single-Turn

| # | Step | Expected |
|---|------|----------|
| 3.1.1 | `quantclaw agent -m "What is 2+2?"` | Returns "4" or equivalent |
| 3.1.2 | `quantclaw agent --json -m "Say hello"` | JSON: `{"response":"...","sessionKey":"agent:main:main"}` |
| 3.1.3 | `quantclaw run "What is the capital of France?"` | One-shot answer, no persistent session |

### 3.2 Multi-Turn Context

| # | Step | Expected |
|---|------|----------|
| 3.2.1 | `quantclaw agent -m "My name is Alice"` | Acknowledges |
| 3.2.2 | `quantclaw agent -m "What is my name?"` | "Alice" (recalls from session) |
| 3.2.3 | `quantclaw sessions reset agent:main:main` | Session cleared |
| 3.2.4 | `quantclaw agent -m "What is my name?"` | Should NOT know "Alice" |

### 3.3 Ephemeral Session

| # | Step | Expected |
|---|------|----------|
| 3.3.1 | `quantclaw agent --no-session "What is 1+1?"` | Returns answer |
| 3.3.2 | `quantclaw sessions list` | No new session created |

### 3.4 Custom Session Key

| # | Step | Expected |
|---|------|----------|
| 3.4.1 | `quantclaw agent -m "Hi" -s agent:main:test-session` | Uses custom session |
| 3.4.2 | `quantclaw sessions list` | Shows "agent:main:test-session" |
| 3.4.3 | `quantclaw sessions delete agent:main:test-session` | Deleted |

### 3.5 Streaming Output

| # | Step | Expected |
|---|------|----------|
| 3.5.1 | `quantclaw agent -m "Write a short poem about the sea"` | Text appears incrementally (streaming) |
| 3.5.2 | Observe terminal output | Characters appear progressively, not all at once |

### 3.6 Agent Stop (Mid-Execution)

| # | Step | Expected |
|---|------|----------|
| 3.6.1 | Start long request: `quantclaw agent -m "Write a 500-word essay"` | Starts streaming |
| 3.6.2 | In another terminal: `quantclaw agent stop` | First terminal stops output |

---

## 4. Session Management

### 4.1 CRUD Operations

| # | Step | Expected |
|---|------|----------|
| 4.1.1 | `quantclaw sessions list` | Shows all sessions (or "No sessions found") |
| 4.1.2 | `quantclaw sessions list --json` | Valid JSON array |
| 4.1.3 | `quantclaw sessions list --limit 1` | At most 1 result |
| 4.1.4 | `quantclaw sessions history <key>` | Shows messages with role, timestamp, content |
| 4.1.5 | `quantclaw sessions history <key> --json` | Full JSON with ContentBlocks |
| 4.1.6 | `quantclaw sessions history <key> --limit 2` | At most 2 messages |
| 4.1.7 | `quantclaw sessions reset <key>` | "Session reset: <key>" |
| 4.1.8 | `quantclaw sessions delete <key>` | "Session deleted: <key>" |

### 4.2 Error Handling

| # | Step | Expected |
|---|------|----------|
| 4.2.1 | `quantclaw sessions history` (no key) | Error: "session key required" |
| 4.2.2 | `quantclaw sessions delete nonexistent:key` | Error: "session not found" |
| 4.2.3 | `quantclaw sessions history nonexistent:key` | Empty result (no error) |

---

## 5. Configuration Management

### 5.1 Read/Write

| # | Step | Expected |
|---|------|----------|
| 5.1.1 | `quantclaw config get` | Full config JSON |
| 5.1.2 | `quantclaw config get gateway.port` | Port number |
| 5.1.3 | `quantclaw config get agent.model` | Current model name |
| 5.1.4 | `quantclaw config set agent.temperature 0.3` | "agent.temperature = 0.3" |
| 5.1.5 | `quantclaw config get agent.temperature` | "0.3" |
| 5.1.6 | `quantclaw config set agent.temperature 0.7` | Restore default |

### 5.2 Validation & Schema

| # | Step | Expected |
|---|------|----------|
| 5.2.1 | `quantclaw config validate` | "Configuration is valid" |
| 5.2.2 | `quantclaw config schema` | Shows expected schema |
| 5.2.3 | Manually corrupt `quantclaw.json`, then `config validate` | Error reported |

### 5.3 Hot Reload

| # | Step | Expected |
|---|------|----------|
| 5.3.1 | Start gateway |  |
| 5.3.2 | `quantclaw config set agent.temperature 0.1` | Set via CLI |
| 5.3.3 | `quantclaw config reload` | "Configuration reloaded" |
| 5.3.4 | `quantclaw config get agent.temperature` | "0.1" confirmed |
| 5.3.5 | Edit `quantclaw.json` directly with text editor | File watcher detects change |
| 5.3.6 | Wait 2-3 seconds, `config get` again | New value reflected |

### 5.4 Environment Variable Substitution

| # | Step | Expected |
|---|------|----------|
| 5.4.1 | Set `ANTHROPIC_API_KEY=test123` in env | |
| 5.4.2 | Config has `"apiKey": "${ANTHROPIC_API_KEY}"` | |
| 5.4.3 | Provider should use "test123" at runtime | Verify via agent request or logs |

---

## 6. Tool Execution

### 6.1 File Operations

| # | Step | Expected |
|---|------|----------|
| 6.1.1 | `quantclaw agent -m "Read the file C:\Windows\System32\drivers\etc\hosts and show the first 3 lines"` | Agent uses read_file tool, shows content |
| 6.1.2 | `quantclaw agent -m "Create a file called /tmp/qc_test.txt with content 'hello world'"` | Agent uses write_file tool |
| 6.1.3 | Verify file exists with correct content | Content matches |

### 6.2 Shell Execution

| # | Step | Expected |
|---|------|----------|
| 6.2.1 | `quantclaw agent -m "Run 'echo hello' in the shell and show the output"` | Agent uses exec tool, shows "hello" |
| 6.2.2 | `quantclaw agent -m "What is the current directory? Use the shell to check."` | Shows working directory |

### 6.3 Web Tools

| # | Step | Expected |
|---|------|----------|
| 6.3.1 | `quantclaw agent -m "Search the web for 'QuantClaw GitHub'"` | Agent uses web_search (if configured) |
| 6.3.2 | `quantclaw agent -m "Fetch the content of https://example.com"` | Agent uses web_fetch |

### 6.4 Tool Chain

| # | Step | Expected |
|---|------|----------|
| 6.4.1 | `quantclaw gateway call chain.execute '{"steps":[{"tool":"exec","params":{"command":"echo chain-test"}}]}'` | Returns "chain-test" |

---

## 7. Authentication

### 7.1 Token Auth

| # | Step | Expected |
|---|------|----------|
| 7.1.1 | Start gateway with token auth (default) | Auth mode = token |
| 7.1.2 | `quantclaw health` (uses configured token) | Success |
| 7.1.3 | Set wrong token in env: `QUANTCLAW_AUTH_TOKEN=wrong` | |
| 7.1.4 | `quantclaw health` with wrong token | Connection fails or auth rejected |

### 7.2 No Auth Mode

| # | Step | Expected |
|---|------|----------|
| 7.2.1 | `quantclaw config set gateway.auth.mode none` | Auth disabled |
| 7.2.2 | Restart gateway | |
| 7.2.3 | Connect without token | Should succeed |
| 7.2.4 | Restore: `config set gateway.auth.mode token` | |

### 7.3 WebSocket Direct Auth

| # | Step | Expected |
|---|------|----------|
| 7.3.1 | Use wscat or websocat to connect to ws://127.0.0.1:18800 | Receives `connect.challenge` event |
| 7.3.2 | Send hello with correct token | Authenticated, receives success response |
| 7.3.3 | Send hello with wrong token | Auth failure response |

---

## 8. Model Management

### 8.1 Model Listing

| # | Step | Expected |
|---|------|----------|
| 8.1.1 | `quantclaw models list` | Shows current model and available models |
| 8.1.2 | Active model marked with `[active]` | Correct |

### 8.2 Model Switching

| # | Step | Expected |
|---|------|----------|
| 8.2.1 | `quantclaw models set <other-model>` | Model switched |
| 8.2.2 | `quantclaw models list` | New model marked active |
| 8.2.3 | `quantclaw agent -m "Which model are you?"` | Response from new model |
| 8.2.4 | Restore original model | |

---

## 9. Cron Scheduler

### 9.1 CRUD

| # | Step | Expected |
|---|------|----------|
| 9.1.1 | `quantclaw cron list` | "No cron jobs" or list |
| 9.1.2 | `quantclaw cron add "*/5 * * * *" "health check" --name healthcheck` | Job created, ID returned |
| 9.1.3 | `quantclaw cron list` | Shows the new job |
| 9.1.4 | `quantclaw cron remove <id>` | Job removed |
| 9.1.5 | `quantclaw cron list` | Empty again |

---

## 10. Memory & Knowledge

### 10.1 Memory Search

| # | Step | Expected |
|---|------|----------|
| 10.1.1 | Edit `~/.quantclaw/agents/main/workspace/MEMORY.md` to contain "The project deadline is March 2026" | |
| 10.1.2 | `quantclaw memory search "deadline"` | Returns relevant result |
| 10.1.3 | `quantclaw agent -m "When is the project deadline?"` | Agent should find from memory |

### 10.2 Workspace File Updates

| # | Step | Expected |
|---|------|----------|
| 10.2.1 | Edit SOUL.md while gateway is running | |
| 10.2.2 | Wait 2-3 seconds for file watcher | Logs show "workspace file changed" |
| 10.2.3 | Next agent request uses updated SOUL.md | Agent behavior reflects changes |

---

## 11. Channels

### 11.1 Channel Status

| # | Step | Expected |
|---|------|----------|
| 11.1.1 | `quantclaw channels list` | Shows cli (ON), discord (OFF/ON), telegram (OFF/ON), etc. |
| 11.1.2 | `quantclaw channels list --json` | Valid JSON |

---

## 12. Plugins

### 12.1 Plugin Listing

| # | Step | Expected |
|---|------|----------|
| 12.1.1 | `quantclaw plugins list` | "No plugins loaded" or plugin list |
| 12.1.2 | `quantclaw plugins list --json` | Valid JSON |

---

## 13. Logs & Diagnostics

### 13.1 Doctor

| # | Step | Expected |
|---|------|----------|
| 13.1.1 | `quantclaw doctor` (gateway stopped) | Shows config [OK], workspace status, gateway [!!] not running |
| 13.1.2 | `quantclaw doctor` (gateway running) | All checks pass |

### 13.2 Logs

| # | Step | Expected |
|---|------|----------|
| 13.2.1 | `quantclaw logs` (no log file) | "No log file found" with helpful message |
| 13.2.2 | Start gateway (creates log file), then `quantclaw logs` | Shows recent log lines |
| 13.2.3 | `quantclaw logs -n 10` | Shows last 10 lines |

---

## 14. HTTP API

### 14.1 Health & Status Endpoints

| # | Step | Expected |
|---|------|----------|
| 14.1.1 | `curl http://127.0.0.1:18801/api/health` | `{"status":"ok",...}` |
| 14.1.2 | `curl http://127.0.0.1:18801/api/status` | Full status JSON |
| 14.1.3 | `curl http://127.0.0.1:18801/api/config` | Config JSON |
| 14.1.4 | `curl http://127.0.0.1:18801/api/sessions` | Sessions list |

### 14.2 Dashboard UI

| # | Step | Expected |
|---|------|----------|
| 14.2.1 | Open `http://127.0.0.1:18801` in browser | Dashboard loads (if UI built) |
| 14.2.2 | `quantclaw dashboard` | Opens browser to dashboard URL |

### 14.3 OpenAI-Compatible Endpoint

| # | Step | Expected |
|---|------|----------|
| 14.3.1 | `curl -X POST http://127.0.0.1:18801/v1/chat/completions -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hi"}]}'` | Chat completion response |

---

## 15. RPC Direct Calls

### 15.1 Gateway Methods

| # | Step | Expected |
|---|------|----------|
| 15.1.1 | `quantclaw gateway call gateway.health` | `{"status":"ok",...}` |
| 15.1.2 | `quantclaw gateway call gateway.status` | Full status with uptime, connections |
| 15.1.3 | `quantclaw gateway call sessions.list` | Sessions array |
| 15.1.4 | `quantclaw gateway call queue.status` | Queue config and counts |
| 15.1.5 | `quantclaw gateway call skills.status` | Skills info |
| 15.1.6 | `quantclaw gateway call memory.status` | Memory manager status |

---

## 16. Error Scenarios & Edge Cases

### 16.1 Gateway Not Running

| # | Step | Expected |
|---|------|----------|
| 16.1.1 | `quantclaw health` | "Gateway: unreachable", exit code 1 |
| 16.1.2 | `quantclaw agent -m "test"` | Error: cannot connect |
| 16.1.3 | `quantclaw sessions list` | Error: cannot connect |
| 16.1.4 | `quantclaw config get` (local) | Still works (reads file directly) |

### 16.2 Invalid Input

| # | Step | Expected |
|---|------|----------|
| 16.2.1 | `quantclaw agent` (no message) | Usage help |
| 16.2.2 | `quantclaw sessions history` (no key) | "session key required" |
| 16.2.3 | `quantclaw config set` (no args) | Usage help or error |
| 16.2.4 | `quantclaw unknown-command` | "Unknown command" with help |

### 16.3 Network Resilience

| # | Step | Expected |
|---|------|----------|
| 16.3.1 | Start agent request, kill gateway mid-stream | Client gets error, no crash |
| 16.3.2 | Agent request with unreachable API endpoint | Timeout error, clean exit |

### 16.4 Concurrent Operations

| # | Step | Expected |
|---|------|----------|
| 16.4.1 | Send 3 agent requests simultaneously from 3 terminals | All complete (queue handles serialization) |
| 16.4.2 | `quantclaw status` while agent is processing | Status shows active connections |

---

## 17. Platform-Specific (Windows)

### 17.1 Path Handling

| # | Step | Expected |
|---|------|----------|
| 17.1.1 | Config paths use `%USERPROFILE%` correctly | `~/.quantclaw/` resolves to `C:\Users\<user>\.quantclaw\` |
| 17.1.2 | Workspace paths with backslashes | No path errors |
| 17.1.3 | Tool exec with Windows commands (`cmd /c dir`) | Works correctly |

### 17.2 Service Management

| # | Step | Expected |
|---|------|----------|
| 17.2.1 | `quantclaw gateway install` | Installs as Windows service |
| 17.2.2 | `quantclaw gateway start` | Service starts |
| 17.2.3 | `quantclaw gateway status` | Shows running via service |
| 17.2.4 | `quantclaw gateway stop` | Service stops |
| 17.2.5 | `quantclaw gateway uninstall` | Service removed |

---

## 18. Regression Checks (Previously Fixed Bugs)

### 18.1 PR #49 Fixes

| # | Step | Expected |
|---|------|----------|
| 18.1.1 | Connect with bad auth token | Gateway returns auth failure promptly (not 3s timeout) |
| 18.1.2 | `sessions history` with multi-turn data | Shows content correctly (no type error) |
| 18.1.3 | `logs` when `~/.quantclaw/logs/` missing | Helpful error message, no crash |
| 18.1.4 | `sessions delete nonexistent:key` | "session not found" error |

---

## Quick Smoke Test (5 minutes)

For rapid validation after a build, run these in order:

```bash
quantclaw --version
quantclaw doctor
quantclaw gateway run &          # background
sleep 2
quantclaw health
quantclaw status --json
quantclaw agent -m "Say hello"
quantclaw sessions list
quantclaw sessions history agent:main:main
quantclaw config get gateway.port
quantclaw models list
quantclaw logs
quantclaw sessions delete agent:main:main
# Ctrl+C to stop gateway
quantclaw health                 # should fail
```

All commands should exit cleanly with appropriate output.
