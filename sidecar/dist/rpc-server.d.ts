export type RpcMethodHandler = (params: Record<string, unknown>) => Promise<unknown> | unknown;
export interface RpcServerOptions {
    socketPath: string;
    methods: Record<string, RpcMethodHandler>;
    onError?: (err: Error) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
}
/**
 * A JSON-RPC 2.0 client that connects to the C++ parent's Unix socket and
 * responds to incoming requests.
 */
export declare class RpcServer {
    private socket;
    private buffer;
    private connected;
    private readonly methods;
    private readonly socketPath;
    private readonly onError;
    private readonly onConnected;
    private readonly onDisconnected;
    constructor(opts: RpcServerOptions);
    /** Connect to the C++ parent's IPC socket. */
    connect(): Promise<void>;
    /** Disconnect from the socket. */
    disconnect(): void;
    isConnected(): boolean;
    /** Process accumulated buffer for complete JSON lines. */
    private processBuffer;
    /** Parse and dispatch a single JSON-RPC line. */
    private handleLine;
    private executeHandler;
    private sendResponse;
}
//# sourceMappingURL=rpc-server.d.ts.map