---
title: Rendering Strategies
order: 4
---

# Rendering Strategies

[MODES: framework]

## Introduction

There are three rendering strategies in React Router:

- Client Side Rendering
- Server Side Rendering
- Static Pre-rendering

## Client Side Rendering

Routes are always client side rendered as the user navigates around the app. If you're looking to build a Single Page App, disable server rendering:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
} satisfies Config;
```

## Server Side Rendering

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
```

Server side rendering requires a deployment that supports it. Though it's a global setting, individual routes can still be statically pre-rendered. Routes can also use client data loading with `clientLoader` to avoid server rendering/fetching for their portion of the UI.

## Static Pre-rendering

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  // return a list of URLs to prerender at build time
  async prerender() {
    return ["/", "/about", "/contact"];
  },
} satisfies Config;
```

Pre-rendering is a build-time operation that generates static HTML and client navigation data payloads for a list of URLs. This is useful for SEO and performance, especially for deployments without server rendering. When pre-rendering, route module loaders are used to fetch data at build time.

## API-only Mode (unstable)

<docs-warning>API-only Mode is experimental and may change in minor or patch releases. It is not supported in RSC Framework Mode.</docs-warning>

Set `ssr: "unstable_api-only"` to keep a runtime server for loaders, actions, and route discovery while disabling production server-side document rendering:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: "unstable_api-only",
} satisfies Config;
```

Without prerendering, the build generates a root-only `index.html` shell using the root `HydrateFallback`, like [SPA Mode](../../how-to/spa). The browser fetches server loader data as it initializes the page. Routes can use server `loader` and `action` exports without requiring `clientLoader` or `clientAction` wrappers. Lazy route discovery remains enabled by default.

You can also [combine API-only Mode with prerendering](../../how-to/pre-rendering#pre-rendering-with-api-only-mode-unstable) to serve complete HTML for selected paths and a SPA fallback for other paths.

Deploy both `build/client` and the runtime server build. Serve assets, prerendered documents, and the SPA fallback from the client build; send `.data` and route discovery requests (`/__manifest` by default) to the React Router request handler. The production API-only handler returns `404` for document requests. `react-router-serve` handles this routing automatically.

### Using a separate API origin

By default, data and route discovery requests use the same origin as the client application. Set `unstable_apiServerOrigin` to use a separate API server:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: "unstable_api-only",
  unstable_apiServerOrigin: "https://api.example.com",
} satisfies Config;
```

This option applies to loader, action, and route discovery requests only in API-only Mode. Use an origin without a path, query, or hash. Configure CORS on the API server and allow the client origin via [`allowedActionOrigins`](../../api/framework-conventions/react-router.config.ts#allowedactionorigins) for cross-origin action submissions. Requests use the browser's default `same-origin` credential policy; this option does not enable sending cookies to a different origin.

To customize JavaScript-issued requests with authentication headers or cross-origin credentials, see [Custom Fetch](../../how-to/custom-fetch). Native data prefetches bypass custom fetch.

---

Next: [Data Loading](./data-loading)
