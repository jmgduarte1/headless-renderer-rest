import assert from 'node:assert/strict';
import { RestTransport, RestTransportError } from '../dist/transport/rest-transport.js';

const requests = [];
const transport = new RestTransport({
  baseUrl: 'https://api.example.test/',
  fetcher: async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  },
});
assert.deepEqual(await transport.get('/content/pages/home'), { ok: true });
assert.equal(requests[0].url, 'https://api.example.test/content/pages/home');
assert.equal(requests[0].init.method, 'GET');
await assert.rejects(() => new RestTransport({ baseUrl: 'https://api.example.test', fetcher: async () => new Response('no', { status: 500 }) }).get('/failure'), (error) => error instanceof RestTransportError && error.kind === 'http');
console.log('module-rest transport smoke tests passed');
