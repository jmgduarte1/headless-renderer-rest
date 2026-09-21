# `@jmgduarte/headless-rest`

REST transport and REST-backed implementation of the Core content client. This package adapts HTTP responses to the domain contracts defined by `@jmgduarte/headless-core`.

## Responsibilities and boundaries

- `RestTransport` provides generic HTTP `GET`/`POST`, headers, JSON handling, abort-signal support, optional timeout, and typed transport errors.
- `RestContentClient` maps domain operations (`getPage`, `getNavigation`, `submitForm`) to caller-configured REST endpoints and validates page payloads through Core.
- Core contracts are consumed; this package does not own renderer or framework behavior.

The transport and content API are intentionally separate concepts inside this package: a future GraphQL adapter can implement the same Core `ContentClient` without duplicating the renderer-facing domain contract.

## Usage

```ts
import { RestContentClient, RestTransport } from '@jmgduarte/headless-rest';

const transport = new RestTransport({ baseUrl: 'https://cms.example.com' });
const contentClient = new RestContentClient({
  transport,
  endpoints: {
    pageBySlug: ({ slug, locale }) => `/api/pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale ?? 'en')}`,
    navigationByLocation: ({ location, locale }) => `/api/menus/${encodeURIComponent(location)}?locale=${encodeURIComponent(locale ?? 'en')}`,
    submitForm: ({ formId }) => `/api/forms/${encodeURIComponent(formId)}/submit`,
  },
});

const page = await contentClient.getPage('home', { locale: 'en' });
```

`RestTransport` accepts an injectable `fetcher`, default headers, and an optional timeout, which makes it usable with platform fetch implementations and easy to test. Its errors distinguish HTTP, network, invalid-JSON, and aborted requests.

## Local development

From this directory:

```sh
npm install
npm run typecheck
npm test
npm run build
```

`npm test` builds the package and runs `tests/transport-smoke.mjs`. The package is currently private and consumes Core through the sibling local package path during this workspace's development.
