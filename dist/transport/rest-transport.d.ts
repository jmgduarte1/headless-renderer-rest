export interface RestTransportOptions {
    baseUrl: string;
    fetcher?: typeof fetch;
    defaultHeaders?: HeadersInit;
    timeoutMs?: number;
}
export declare class RestTransportError extends Error {
    readonly kind: 'http' | 'network' | 'invalid-json' | 'aborted';
    readonly status?: number | undefined;
    readonly cause?: unknown | undefined;
    constructor(message: string, kind: 'http' | 'network' | 'invalid-json' | 'aborted', status?: number | undefined, cause?: unknown | undefined);
}
export declare class RestTransport {
    private readonly fetcher;
    private readonly baseUrl;
    private readonly defaultHeaders;
    private readonly timeoutMs?;
    constructor(options: RestTransportOptions);
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
    private request;
}
export interface RequestOptions {
    headers?: HeadersInit;
    signal?: AbortSignal;
    body?: unknown;
}
