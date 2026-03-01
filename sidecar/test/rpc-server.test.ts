// Copyright 2024 QuantClaw Contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, afterEach } from "vitest";
import * as net from "node:net";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { RpcServer } from "../src/rpc-server.js";

// Utility to create a temporary socket path.
function tmpSocketPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qc-rpc-test-"));
  return path.join(dir, "test.sock");
}

// Create a simple TCP/Unix server that the RpcServer can connect to.
function createMockParent(socketPath: string): {
  server: net.Server;
  getClient: () => Promise<net.Socket>;
  close: () => void;
} {
  let resolveClient: ((s: net.Socket) => void) | null = null;
  const clientPromise = new Promise<net.Socket>((resolve) => {
    resolveClient = resolve;
  });

  const server = net.createServer((socket) => {
    resolveClient?.(socket);
  });

  server.listen(socketPath);

  return {
    server,
    getClient: () => clientPromise,
    close: () => {
      server.close();
      try { fs.unlinkSync(socketPath); } catch {}
    },
  };
}

// Read a line from a socket.
function readLine(socket: net.Socket, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("readLine timeout")), timeoutMs);

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const idx = buffer.indexOf("\n");
      if (idx !== -1) {
        clearTimeout(timer);
        socket.off("data", onData);
        resolve(buffer.slice(0, idx));
      }
    };
    socket.on("data", onData);
  });
}

describe("RpcServer", () => {
  const sockets: string[] = [];
  const servers: Array<{ close: () => void }> = [];

  afterEach(() => {
    for (const s of servers) {
      try { s.close(); } catch {}
    }
    servers.length = 0;
    for (const p of sockets) {
      try { fs.unlinkSync(p); } catch {}
      try { fs.rmdirSync(path.dirname(p)); } catch {}
    }
    sockets.length = 0;
  });

  it("should connect and respond to ping", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: { ping: () => ({}) },
    });

    await rpc.connect();
    const client = await parent.getClient();

    // Send ping request.
    client.write('{"jsonrpc":"2.0","method":"ping","params":{},"id":1}\n');

    const response = await readLine(client);
    const parsed = JSON.parse(response);
    expect(parsed.jsonrpc).toBe("2.0");
    expect(parsed.id).toBe(1);
    expect(parsed.result).toEqual({});

    rpc.disconnect();
  });

  it("should handle method not found", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: { ping: () => ({}) },
    });

    await rpc.connect();
    const client = await parent.getClient();

    client.write('{"jsonrpc":"2.0","method":"nonexistent","params":{},"id":2}\n');

    const response = await readLine(client);
    const parsed = JSON.parse(response);
    expect(parsed.error).toBeDefined();
    expect(parsed.error.code).toBe(-32601);

    rpc.disconnect();
  });

  it("should handle parse error", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: { ping: () => ({}) },
    });

    await rpc.connect();
    const client = await parent.getClient();

    client.write("not valid json\n");

    const response = await readLine(client);
    const parsed = JSON.parse(response);
    expect(parsed.error).toBeDefined();
    expect(parsed.error.code).toBe(-32700);

    rpc.disconnect();
  });

  it("should handle async method handlers", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: {
        "plugin.tools": async () => [
          { name: "weather", description: "Get weather" },
        ],
      },
    });

    await rpc.connect();
    const client = await parent.getClient();

    client.write('{"jsonrpc":"2.0","method":"plugin.tools","params":{},"id":3}\n');

    const response = await readLine(client);
    const parsed = JSON.parse(response);
    expect(parsed.result).toEqual([
      { name: "weather", description: "Get weather" },
    ]);

    rpc.disconnect();
  });

  it("should handle method handler errors", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: {
        failing: () => { throw new Error("intentional error"); },
      },
    });

    await rpc.connect();
    const client = await parent.getClient();

    client.write('{"jsonrpc":"2.0","method":"failing","params":{},"id":4}\n');

    const response = await readLine(client);
    const parsed = JSON.parse(response);
    expect(parsed.error).toBeDefined();
    expect(parsed.error.message).toContain("intentional error");

    rpc.disconnect();
  });

  it("should handle multiple sequential requests", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    let callCount = 0;
    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: {
        counter: () => ({ count: ++callCount }),
      },
    });

    await rpc.connect();
    const client = await parent.getClient();

    for (let i = 1; i <= 3; i++) {
      client.write(`{"jsonrpc":"2.0","method":"counter","params":{},"id":${i}}\n`);
      const response = await readLine(client);
      const parsed = JSON.parse(response);
      expect(parsed.result.count).toBe(i);
    }

    rpc.disconnect();
  });

  it("should report connected state", async () => {
    const sockPath = tmpSocketPath();
    sockets.push(sockPath);

    const parent = createMockParent(sockPath);
    servers.push(parent);

    const rpc = new RpcServer({
      socketPath: sockPath,
      methods: { ping: () => ({}) },
    });

    expect(rpc.isConnected()).toBe(false);
    await rpc.connect();
    expect(rpc.isConnected()).toBe(true);
    rpc.disconnect();
    expect(rpc.isConnected()).toBe(false);
  });
});
