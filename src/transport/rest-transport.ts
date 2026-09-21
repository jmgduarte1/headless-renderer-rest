export interface RestTransportOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  defaultHeaders?: HeadersInit;
  timeoutMs?: number;
}

export class RestTransportError extends Error {
  constructor(
    message: string,
    public readonly kind: 'http' | 'network' | 'invalid-json' | 'aborted',
    public readonly status?: number,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RestTransportError';
  }
}

export class RestTransport {
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit;
  private readonly timeoutMs?: number;

  constructor(options: RestTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    this.defaultHeaders = options.defaultHeaders ?? { Accept: 'application/json' };
    this.timeoutMs = options.timeoutMs;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  private async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = this.timeoutMs === undefined ? undefined : setTimeout(() => controller.abort(), this.timeoutMs);
    const signal = mergeSignals(options.signal, controller.signal);
    const headers = new Headers(this.defaultHeaders);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    let response: Response;
    try {
      response = await this.fetcher(new URL(path, `${this.baseUrl}/`).toString(), {
        method,
        headers,
        signal,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (error) {
      const kind = signal.aborted ? 'aborted' : 'network';
      const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
      throw new RestTransportError(`REST ${method} request failed.${detail}`, kind, undefined, error);
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
    }
    if (!response.ok) throw new RestTransportError(`REST request returned HTTP ${response.status}.`, 'http', response.status);
    try {
      return await response.json() as T;
    } catch (error) {
      throw new RestTransportError('REST response was not valid JSON.', 'invalid-json', response.status, error);
    }
  }
}

export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  body?: unknown;
}

function mergeSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
