// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0
// ---------------------------------------------------------------------------
// JSON-RPC 2.0 server over Unix domain socket / named pipe.
//
// Protocol: line-delimited JSON — each message is one JSON object followed
// by a single '\n'.  The C++ parent process (SidecarManager) acts as the
// IPC *server* and the sidecar connects as a *client*.
// ---------------------------------------------------------------------------
import * as net from "node:net";
/**
 * A JSON-RPC 2.0 client that connects to the C++ parent's Unix socket and
 * responds to incoming requests.
 */
export class RpcServer {
    socket = null;
    buffer = "";
    connected = false;
    methods;
    socketPath;
    onError;
    onConnected;
    onDisconnected;
    constructor(opts) {
        this.socketPath = opts.socketPath;
        this.methods = opts.methods;
        this.onError = opts.onError ?? ((err) => console.error("[rpc]", err.message));
        this.onConnected = opts.onConnected ?? (() => { });
        this.onDisconnected = opts.onDisconnected ?? (() => { });
    }
    /** Connect to the C++ parent's IPC socket. */
    connect() {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection(this.socketPath, () => {
                this.connected = true;
                this.onConnected();
                resolve();
            });
            socket.setEncoding("utf-8");
            socket.on("data", (chunk) => {
                this.buffer += chunk;
                this.processBuffer();
            });
            socket.on("error", (err) => {
                if (!this.connected) {
                    reject(err);
                }
                else {
                    this.onError(err);
                }
            });
            socket.on("close", () => {
                this.connected = false;
                this.onDisconnected();
            });
            this.socket = socket;
        });
    }
    /** Disconnect from the socket. */
    disconnect() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
            this.connected = false;
        }
    }
    isConnected() {
        return this.connected;
    }
    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------
    /** Process accumulated buffer for complete JSON lines. */
    processBuffer() {
        let newlineIdx;
        while ((newlineIdx = this.buffer.indexOf("\n")) !== -1) {
            const line = this.buffer.slice(0, newlineIdx).trim();
            this.buffer = this.buffer.slice(newlineIdx + 1);
            if (line.length > 0) {
                this.handleLine(line);
            }
        }
    }
    /** Parse and dispatch a single JSON-RPC line. */
    handleLine(line) {
        let request;
        try {
            request = JSON.parse(line);
        }
        catch {
            this.sendResponse({
                jsonrpc: "2.0",
                error: { code: -32700, message: "Parse error" },
                id: null,
            });
            return;
        }
        if (!request.method || request.id === undefined) {
            this.sendResponse({
                jsonrpc: "2.0",
                error: { code: -32600, message: "Invalid Request" },
                id: request.id ?? null,
            });
            return;
        }
        const handler = this.methods[request.method];
        if (!handler) {
            this.sendResponse({
                jsonrpc: "2.0",
                error: { code: -32601, message: `Method not found: ${request.method}` },
                id: request.id,
            });
            return;
        }
        // Execute — may be sync or async.
        void this.executeHandler(handler, request);
    }
    async executeHandler(handler, request) {
        try {
            const result = await handler(request.params ?? {});
            this.sendResponse({
                jsonrpc: "2.0",
                result: result ?? {},
                id: request.id,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.sendResponse({
                jsonrpc: "2.0",
                error: { code: -32000, message },
                id: request.id,
            });
        }
    }
    sendResponse(response) {
        if (!this.socket || !this.connected)
            return;
        const line = JSON.stringify(response) + "\n";
        this.socket.write(line);
    }
}
//# sourceMappingURL=rpc-server.js.map