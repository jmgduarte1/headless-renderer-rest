export class RestTransportError extends Error {
    kind;
    status;
    cause;
    constructor(message, kind, status, cause) {
        super(message);
        this.kind = kind;
        this.status = status;
        this.cause = cause;
        this.name = 'RestTransportError';
    }
}
export class RestTransport {
    fetcher;
    baseUrl;
    defaultHeaders;
    timeoutMs;
    constructor(options) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
        this.defaultHeaders = options.defaultHeaders ?? { Accept: 'application/json' };
        this.timeoutMs = options.timeoutMs;
    }
    get(path, options) {
        return this.request('GET', path, options);
    }
    post(path, body, options) {
        return this.request('POST', path, { ...options, body });
    }
    async request(method, path, options = {}) {
        const controller = new AbortController();
        const timeout = this.timeoutMs === undefined ? undefined : setTimeout(() => controller.abort(), this.timeoutMs);
        const signal = mergeSignals(options.signal, controller.signal);
        const headers = new Headers(this.defaultHeaders);
        new Headers(options.headers).forEach((value, key) => headers.set(key, value));
        let response;
        try {
            response = await this.fetcher(new URL(path, `${this.baseUrl}/`).toString(), {
                method,
                headers,
                signal,
                body: options.body === undefined ? undefined : JSON.stringify(options.body),
            });
        }
        catch (error) {
            const kind = signal.aborted ? 'aborted' : 'network';
            const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
            throw new RestTransportError(`REST ${method} request failed.${detail}`, kind, undefined, error);
        }
        finally {
            if (timeout !== undefined)
                clearTimeout(timeout);
        }
        if (!response.ok)
            throw new RestTransportError(`REST request returned HTTP ${response.status}.`, 'http', response.status);
        try {
            return await response.json();
        }
        catch (error) {
            throw new RestTransportError('REST response was not valid JSON.', 'invalid-json', response.status, error);
        }
    }
}
function mergeSignals(...signals) {
    const controller = new AbortController();
    for (const signal of signals) {
        if (!signal)
            continue;
        if (signal.aborted)
            controller.abort(signal.reason);
        else
            signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
}
