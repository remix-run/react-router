---
title: Custom Fetch
unstable: true
---

# Custom Fetch

[MODES: framework]

<docs-warning>This feature is experimental and may change in minor or patch releases. It is not supported in RSC Framework Mode.</docs-warning>

The `unstable_fetch` prop on [`HydratedRouter`](../api/framework-routers/HydratedRouter) lets you customize the JavaScript-issued requests React Router makes for server loader/action data and lazy route discovery. Use it to add headers, customize fetch options, or apply a request policy based on the operation that initiated the request.

This is a Framework Mode API. In Data Mode, you control fetching in your loaders/actions or through a [`dataStrategy`](./data-strategy#request-metadata-unstable).

## Setup

If you don't have an [`app/entry.client.tsx`](../api/framework-conventions/entry.client.tsx), reveal the default entry:

```shellscript nonumber
npx react-router reveal entry.client
```

Pass a custom implementation to `HydratedRouter`:

```tsx filename=app/entry.client.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  HydratedRouter,
  type unstable_RouterFetch,
} from "react-router/dom";

const customFetch: unstable_RouterFetch = (
  request,
  context,
) => {
  console.log(context.type, request.method, request.url);
  return fetch(request);
};

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter unstable_fetch={customFetch} />
    </StrictMode>,
  );
});
```

The callback receives a constructed `Request`, including its URL, headers, body, and abort signal, and must return a `Promise<Response>`. Pass that request to the browser's `fetch` to preserve those settings, including cancellation.

`HydratedRouter` creates a singleton router and reads `unstable_fetch` only during initialization. Changing the prop later has no effect. If your implementation needs changing values such as authentication tokens, read current application state inside the callback instead of capturing values from a component render.

## Request Context

The [`unstable_RouterFetchContext`](https://api.reactrouter.com/v8/types/react-router.dom.unstable_RouterFetchContext.html) type is exported from `react-router/dom` and has the following shape:

```ts
import type { NavigationType } from "react-router";

type unstable_RouterFetchContext =
  | { type: "manifest" }
  | {
      type: "navigation";
      fetcherKey: string | null;
      navigationType: NavigationType;
    }
  | {
      type: "initialization" | "fetcher" | "revalidation";
      fetcherKey: string | null;
      navigationType: null;
    };
```

`type` identifies the operation that initiated the request:

- `"manifest"`: Lazy route discovery requests. These have no `fetcherKey` or `navigationType`.
- `"initialization"`: Data loading during router initialization, such as initial loader requests in API-only Mode.
- `"navigation"`: Data requests initiated by a navigation, including action submissions and the subsequent loader revalidation.
- `"fetcher"`: Requests initiated by a fetcher, including the loader revalidation after a fetcher action.
- `"revalidation"`: Requests initiated by an explicit revalidation, such as `useRevalidator().revalidate()`.

`fetcherKey` identifies the fetcher targeted by a data request, or is `null` for route loader/action requests. A fetcher reloaded as part of a navigation or explicit revalidation retains that initiating `type` and also includes its fetcher key. Fetchers reloaded after an initialization redirect likewise retain the `"initialization"` type and include their fetcher key.

`navigationType` is `"PUSH"`, `"REPLACE"`, or `"POP"` for navigation-initiated data requests, including fetchers reloaded by that navigation. It is `null` for initialization, standalone fetcher operations, and explicit revalidation. This is the history action for the in-flight navigation, not the previously committed location.

## Examples

Each example below can be passed to `HydratedRouter` as its `unstable_fetch` prop.

### Authentication and Custom Headers

Read the current token at request time so token changes don't require replacing the callback:

```ts
import type { unstable_RouterFetch } from "react-router/dom";
import { authStore } from "./auth";

const customFetch: unstable_RouterFetch = (request) => {
  let headers = new Headers(request.headers);
  let token = authStore.getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("X-App-Version", "1.0");
  return fetch(request, { headers });
};
```

Here, `authStore` is your application's authentication store. Only send credentials to trusted origins. Adding custom headers to cross-origin requests may require a CORS preflight and corresponding server configuration.

### Cross-Origin Credentials

In [API-only Mode](../start/framework/rendering#using-a-separate-api-origin), use `unstable_apiServerOrigin` to configure a separate API origin. React Router applies that origin before calling your custom fetch, and also uses it for native data prefetches.

The origin setting does not enable cross-origin cookies. If you need them, customize the credential policy for the trusted API origin:

```ts
import type { unstable_RouterFetch } from "react-router/dom";

const customFetch: unstable_RouterFetch = (request) => {
  let isApiRequest =
    new URL(request.url).origin ===
    "https://api.example.com";

  return fetch(request, {
    credentials: isApiRequest
      ? "include"
      : request.credentials,
  });
};
```

The API server must allow credentialed CORS requests from your client origin. Browser cookie policies still apply. Native data prefetches do not use this callback, so don't rely on it to configure their credentials.

### Back/Forward Traversal Cache

Use `navigationType` to prefer the browser's HTTP cache when navigating back or forward, while retaining the normal cache policy for other requests:

```ts
import type { unstable_RouterFetch } from "react-router/dom";

const customFetch: unstable_RouterFetch = (
  request,
  context,
) => {
  let isTraversal =
    import.meta.env.PROD &&
    request.method === "GET" &&
    context.type === "navigation" &&
    context.navigationType === "POP";

  return fetch(request, {
    cache: isTraversal ? "force-cache" : "default",
  });
};
```

This example enables the policy in production only. It includes GET requests for fetchers reloaded by a back/forward navigation, but not standalone fetcher loads or explicit revalidations.

The [`force-cache` policy](https://fetch.spec.whatwg.org/#concept-request-cache-mode) uses a matching HTTP cache entry even if it is stale, falling back to the network when no entry exists. Your server's responses must be cacheable; `Cache-Control: no-store` responses aren't stored.

This is not a router-managed data cache. React Router still performs its request and response decoding, and this policy adds no mutation or authentication invalidation guarantees. Only use it when serving potentially stale data is appropriate for your application.

### Retrying Safe Requests

You can retry a safe GET after a network failure without retrying action submissions or canceled requests:

```ts
import type { unstable_RouterFetch } from "react-router/dom";

const customFetch: unstable_RouterFetch = async (
  request,
) => {
  if (request.method !== "GET") {
    return fetch(request);
  }

  try {
    return await fetch(request.clone());
  } catch (error) {
    if (
      request.signal.aborted ||
      (error instanceof Error &&
        error.name === "AbortError")
    ) {
      throw error;
    }

    // Retry once, retaining the original abort signal.
    return fetch(request);
  }
};
```

This assumes your GET endpoints are safe to repeat. It retries a rejected fetch, not HTTP error responses such as `500`. Don't automatically retry mutations: the server may have processed an action even when the client didn't receive its response.

## Limitations

### Requests Outside Custom Fetch

Custom fetch does not intercept the initial document request, server-side loader execution, static assets, or fetches you write in your own application code, including in `clientLoader`/`clientAction`. Calls to their `serverLoader`/`serverAction` helpers do use custom fetch when they issue server data requests.

Data prefetches from `<Link prefetch>`, `<NavLink prefetch>`, and [`PrefetchPageLinks`](../api/components/PrefetchPageLinks) use native `<link rel="prefetch">` elements and bypass custom fetch. If a request requires custom headers or other transformations, use `prefetch="none"` on links and avoid rendering `PrefetchPageLinks` for those routes.

### Inspecting Request Bodies

If you need a form field such as `intent` to choose request headers, read it from `await request.clone().formData()` for form-encoded submissions, then send the original request. Reading `request.formData()` directly consumes the body so it can't subsequently be sent unchanged.

Only parse bodies with a compatible encoding. Cloning and reading a body can buffer data, so avoid doing this unnecessarily, especially for large file uploads. Adding headers or changing fetch options does not require reading the body.

### Response Compatibility

Return the response from `fetch` unchanged. You can inspect its status and headers, but you should not consume its body or try to decode, modify, or re-encode it. React Router handles response decoding and expects its manifest/data protocol, including Turbo Stream-encoded loader/action data.
