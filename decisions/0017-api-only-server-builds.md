---
title: API-only server builds
unstable: true
---

# API-only server builds

Date: 2026-10-09

Status: accepted

[MODES: framework]

<docs-warning>API-only Mode is experimental. Its configuration and behavior may change in minor or patch releases. This decision records the implementation accepted in [#15601](https://github.com/remix-run/react-router/pull/15601).</docs-warning>

## Context

Framework Mode traditionally couples runtime server data loading with runtime document rendering. With `ssr: true`, the server can render documents and execute loaders and actions. With `ssr: false`, React Router generates static documents and removes the server build after building. Applications can use client loaders and actions, but cannot deploy that build as a live React Router data server.

[Proposal #15451](https://github.com/remix-run/react-router/discussions/15451) requested a static frontend backed by colocated server loaders and actions, optionally hosted on another origin. This is useful for independently hosted static sites and clients embedded in environments such as Electron, webviews, or hosted HTML games. Requiring each route to wrap server access in a `clientLoader` or `clientAction` would duplicate capabilities already provided by Framework Mode.

The static frontend need not be a single root shell. It may include prerendered pages, with client rendering for other paths. The server must support normal data loading, mutations, revalidation, and route discovery in either case, while production HTML comes from the client build.

We also need to preserve existing `ssr: true` and `ssr: false` behavior, the exported boolean `ServerBuild.ssr` contract, and the distinction between React Router configuration and Vite's compilation environments.

## Decision

### Introduce an explicit API-only configuration

Use an experimental value of the existing Framework Mode `ssr` option:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: "unstable_api-only",
  prerender: ["/"], // Optional
  unstable_apiServerOrigin: "https://api.example.com", // Optional
} satisfies Config;
```

API-only is a normal runtime server with production document rendering disabled. It retains loaders, actions, middleware, server bundles, and route discovery. Browser routes can call server loaders and actions directly or delegate to them through `clientLoader` and `clientAction`.

We do not redefine `ssr: false`. Existing static applications keep their build output, server-export restrictions, and data-loading behavior. This feature applies to conventional Framework Mode; RSC Framework Mode rejects API-only configuration until its separate rendering and request model is addressed.

### Keep server capability separate from document rendering

`config.ssr` is best interpreted as "is there a runtime server?", rather than "does the runtime server perform document rendering?" Both `true` and `"unstable_api-only"` retain a runtime server; `false` does not. Runtime document rendering is a more specific capability: `true` enables it, while `"unstable_api-only"` disables it in production. Build-time rendering remains available independently.

The public configuration accepts `boolean | "unstable_api-only"`, but the emitted `ServerBuild.ssr` remains a boolean. API-only builds emit:

```ts
export const ssr = true;
export const unstable_apiOnly = true;
```

The server and browser runtime use `ssr` to select normal server capabilities. The additional API-only flag identifies the document-rendering restriction and the few hydration behaviors that differ.

Emitting `ServerBuild.ssr: false` for API-only initially seemed consistent with disabling runtime HTML rendering. It instead selected static-site behavior in code that governs data requests, revalidation, and lazy discovery. Repairing each of those paths with API-only exceptions made the implementation harder to reason about. Emitting `true` preserves the boolean contract and keeps API-only aligned with the more capable server it actually deploys.

Configuration checks retain truthiness where they mean a server is available. Where they mean runtime document rendering is disabled, use the explicit condition `!ssr || ssr === "unstable_api-only"`. Vite's `options.ssr` is a different field: it identifies server compilation, and remains relevant to removing server-only exports from client modules.

### Allow prerendering independently of runtime server rendering

API-only supports the existing prerender configuration. For example, `prerender: ["/"]` generates a complete index document and its loader data at build time, while other paths initialize from a root fallback shell and use the runtime API server.

| Configuration              | Enabled prerender config | Deployed React Router server | Production documents                      |
| -------------------------- | ------------------------ | ---------------------------- | ----------------------------------------- |
| `ssr: true`                | No                       | Yes                          | Rendered on request                       |
| `ssr: true`                | Yes                      | Yes                          | Prerendered pages and runtime rendering   |
| `ssr: false`               | No                       | No                           | Root fallback shell                       |
| `ssr: false`               | Yes                      | No                           | Prerendered pages and root fallback shell |
| `ssr: "unstable_api-only"` | No                       | Yes, for data and discovery  | Root fallback shell                       |
| `ssr: "unstable_api-only"` | Yes                      | Yes, for data and discovery  | Prerendered pages and root fallback shell |

An enabled prerender configuration means `prerender != null && prerender !== false`, after configuration resolution. It does not mean the resolved path list is nonempty. An empty array or a function returning no paths still enables the prerender build path. That distinction matters when deciding which route exports to retain before build-time rendering.

Ordinary SPA Mode means `ssr: false` without enabled prerendering. API-only without prerendering produces the same kind of initial shell, but retains a live server. API-only with prerendering can produce full pages as well as that shell.

At runtime, `isSpaMode` describes the document being rendered or hydrated: a root-only fallback shell. It does not imply the absence of a server. The server uses the resolved prerender paths to render full pages for selected paths in development and during prerendering, and a shell for other paths. A build-time SPA request explicitly selects shell rendering, even if `/` is also prerendered.

Shell rendering uses the existing server-route construction mechanism: routes are marked lazy, including the root, so rendering stops at the root `HydrateFallback`. Full prerendered documents use normal route construction and can render deeper matches. Keeping that choice at the document level allows both outputs in the same application.

### Retain the route exports needed by each build

Without enabled prerendering, API-only production server route modules retain their server exports and remove non-root client UI exports. The root's UI, `Layout`, and `HydrateFallback` remain available to generate the shell. We cannot stub every non-root route module as ordinary SPA Mode does: their loaders and actions are the purpose of the deployed API server.

With enabled prerendering, route UI exports remain in the server build so selected routes can render at build time. Their presence does not grant permission to render production documents on request. The API server build is retained after prerendering; the ordinary `ssr: false` build is still removed.

Export removal belongs to React Router's production server environments. Additional Vite server environments may import route modules for other purposes and must retain their exports. Likewise, normal client/server export separation should share the existing rules across SSR and API-only rather than introduce a different general re-export policy.

### Restrict production rendering to explicit build requests

The core request handler serves lazy manifest requests before enforcing the API-only document restriction, and allows `.data` requests for runtime loaders and actions. Other production requests return `404`, including direct requests to resource-route URLs. Resource output can still be generated by prerendering and served as a static file.

Build-time HTML generation is an exception. It requires both the existing trusted build environment, `IS_RR_BUILD_REQUEST === "yes"`, and an explicit request header:

- `X-React-Router-SPA-Mode: yes` for shell generation
- `X-React-Router-Prerender: yes` for prerendering

Both headers are read through `getBuildTimeHeader`, which ignores them outside the build environment. A client cannot enable production document rendering by supplying these headers. Conversely, a build environment alone does not authorize an arbitrary document request. `X-React-Router-Prerender-Data` transfers build-time loader data; it is not the marker authorizing prerendering.

Development intentionally renders documents to simulate the deployed site's prerendered pages and fallback behavior. Therefore, the restriction is on production runtime rendering, not all execution of the server renderer. Deployment processes must not set the build-only environment variable.

### Preserve hydration and normal server data semantics

Prerendered documents reuse their build-time hydration data. API-only does not require refetching every loader simply because a live API server exists.

A fallback shell needs the matched routes' server data when the browser initializes. The eager hydration policy therefore runs non-root shell loaders and, in API-only shells, the root loader as well when it has a server loader. For the default server-loading path, refreshing the root avoids treating its build-time shell data as the current runtime value. Existing `clientLoader.hydrate` and `serverLoader()` hydration-data behavior continue to apply. The Single Fetch initial-load shortcut must allow a request when API-only routes need server data; it still avoids requests when no server loaders need to run.

This differs from ordinary `ssr: false`: those applications have no deployed server loaders for non-root routes, embed allowed root data at build time, and run client loaders in the browser. Reusing that static strategy for API-only would prevent required initialization requests.

Routes without `clientAction` can call their server action from an API-only shell. Eager routes and lazily discovered routes must both retain this capability and use normal server revalidation after actions or search changes. Static-prerender revalidation rules would otherwise leave live loader data stale. `shouldRevalidate` opt-outs and Single Fetch `_routes` filtering remain effective, and a client loader delegating to `serverLoader()` must not also cause a duplicate call in the combined request.

Lazy loader imports do not need additional hydration-property assignments because lazy route initialization already schedules their handlers. Hydration flags are needed for eager routes; adding them to these lazy paths would not solve an additional problem.

Lazy discovery remains the default, including API-only applications without prerendering: the API server can answer manifest requests even when the initial document is a shell. An explicit `routeDiscovery.mode: "initial"` remains supported.

### Provide an API origin without changing credential policy

`unstable_apiServerOrigin` directs loader, action, route-discovery, and data-prefetch URLs to another origin. It defaults to the client origin and applies only to API-only configuration. The name is deliberately narrower than `unstable_serverOrigin`, which could imply support across all server-rendering configurations.

The option accepts an absolute URL without a non-root path, query, or hash and normalizes it to an origin. Route paths and basenames remain governed by the existing routing configuration. Client modules and assets continue using their asset URLs; changing the API origin does not relocate the frontend build.

We keep the browser's default `same-origin` fetch credential policy. Choosing a different API origin must not implicitly begin sending cookies there. Applications must configure the server's CORS policy and `allowedActionOrigins` independently when needed for cross-origin access and mutations.

Custom fetch is a complementary extension point for different credentials, headers, or caching. It is not implemented by this decision. It also cannot replace all origin handling: native browser data-prefetch links do not execute through a JavaScript fetch override, so their URLs must point at the API origin too. More permissive credential behavior should be an explicit application choice.

### Make hosting and preview follow the same request split

Deployments serve client assets and prerendered output first, send `.data` and manifest requests to the runtime handler, and use the generated shell for other document paths. Custom adapters receive the normal server build and the API-only flag; the production rendering restriction lives in the core runtime rather than depending on one Node hosting implementation.

`react-router-serve` and Vite preview implement this split. When `/` is prerendered, `index.html` is the full index page and the shell is `__spa-fallback.html`; otherwise, `index.html` is the shell. Returning a prerendered `index.html` for every unknown path would render the wrong initial page and hydration data. The host must choose the fallback file while letting existing prerendered documents win. Express file serving also needs an absolute filesystem root.

Vite uses `appType: "mpa"` for API-only's production serve configuration so its HTML handling can serve existing files without a generic SPA index rewrite. `"custom"` would disable that HTML handling; `"spa"` could consume requests that need the data server. Preview's server-bundle dispatch must choose the deepest matching bundle, including for `/`, so a root-only match does not hide a more specific loader.

Static middleware may serve prerendered `.data` files before a same-origin runtime handler. This is the existing SSR-plus-prerendering behavior, and remains intentional. A live API server does not promise that every navigation retrieves fresh data if the deployment serves static data at that URL.

## Alternatives considered

### Keep the server build for `ssr: false`

This matches the original proposal's configuration, but changes the meaning of existing static builds and their loader/action restrictions. The explicit unstable value supplies the requested capability while preserving those contracts.

### Forbid prerendering in API-only

This would simplify route-export stripping but unnecessarily rule out complete static pages backed by live mutations and data. Build-time rendering and production runtime rendering are separate capabilities, so we retain UI when prerendering is configured and enforce the production restriction in the request handler.

### Replace internal checks with a mode enum

We considered `server | spa | api` and then `server | spa | api | prerender`. The first overlooked the distinction between a pure SPA and an `ssr: false` prerendered application. The second still requires separate per-document shell state and a way to express API-only with prerendering.

We deferred the internal refactor to keep this change focused and preserve public configuration, emitted build fields, and runtime interfaces. Future work can improve the internal model, but must represent server availability, runtime document rendering, prerendering, and the current document's hydration behavior independently.

### Require custom fetch for separate hosting

Custom fetch can redirect programmatic requests and implement application-specific behavior. A first-party API origin provides one consistent destination for data, discovery, and native prefetch URLs without requiring applications to reproduce routing logic. Broader fetch customization remains separate work.

## Consequences

Applications can combine static hosting and prerendering with normal Framework Mode server data APIs. They must deploy both builds and route requests correctly. Prerendered HTML remains available without JavaScript, but fallback routes and client-side data interactions require it. The API server cannot provide runtime document rendering for navigation or form submissions when JavaScript is unavailable.

API-only server bundles can contain UI when prerendering is enabled, so this feature does not guarantee a renderer-free or UI-free server artifact. Root UI is needed even for shell-only builds. Cross-origin hosting introduces CORS and action-origin configuration, while credential policy remains conservative by default.

The implementation retains existing boolean server contracts and avoids broad changes to SSR, static, or RSC behavior. Its important regression boundaries are shell generation with root exports, prerendered hydration versus shell loader initialization, direct server actions, eager and lazy route revalidation, loader opt-outs, production header spoofing, export preservation in additional Vite environments, and matching behavior in `react-router-serve` and Vite preview. The integration and server-runtime tests cover these boundaries without requiring exhaustive combinations of every prerender syntax.

## References

- [Merged implementation #15601](https://github.com/remix-run/react-router/pull/15601), building on [#15467](https://github.com/remix-run/react-router/pull/15467) by @rossipedia
- [Proposal #15451: use the server build with a static frontend](https://github.com/remix-run/react-router/discussions/15451), addressed through explicit API-only configuration
- [#15358: dual-target builds](https://github.com/remix-run/react-router/discussions/15358), related but separate multi-target build and server-export-elision work
- [#15461: custom fetch for HydratedRouter](https://github.com/remix-run/react-router/discussions/15461) and [#15472: custom fetch for manifest and data requests](https://github.com/remix-run/react-router/discussions/15472), related extension points
- [#13313: client versus SSR in Framework Mode](https://github.com/remix-run/react-router/discussions/13313), related rendering goals; per-route runtime SSR remains outside this decision
- [Rendering strategies](../docs/start/framework/rendering.md), [prerendering](../docs/how-to/pre-rendering.md), and [SPA Mode](../docs/how-to/spa.md)
- [Decision 0009: do not rely on tree shaking for correctness](./0009-do-not-rely-on-treeshaking-for-correctness.md) and [Decision 0010: splitting client and server code in Vite](./0010-splitting-up-client-and-server-code-in-vite.md)
