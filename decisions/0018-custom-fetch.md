# Custom Fetch and Router Request Metadata

Date: 2026-10-09

Status: accepted (implemented as unstable APIs in [PR #15586](https://github.com/remix-run/react-router/pull/15586))

[MODES: framework, data]

## Context

Framework Mode owns the browser requests used to load server loader/action data and discover routes. Applications need a supported way to customize these requests without replacing the framework's data strategy or monkey-patching `window.fetch`.

The [original proposal](https://github.com/remix-run/react-router/discussions/15461) and [implementation](https://github.com/remix-run/react-router/pull/15465) introduced a custom fetch implementation on `HydratedRouter`. The subsequent design discussion expanded the use cases beyond URL rewriting:

- Authentication, application-specific headers, and region-routing hints
- Cross-origin credentials and other Fetch options
- Safe network retries and response-header inspection
- Different HTTP cache policies for back/forward navigation
- Communicating the operation that caused a request to an application server

A request's URL and method cannot reliably identify why the router issued it. The same loader URL can be requested by navigation, a fetcher, explicit revalidation, or initialization. A navigation can also reload existing fetchers, and an action can cause subsequent loader requests. Applications need the initiating operation and the request's target described independently.

The work was initially explored alongside API-only Mode. That mode now has a dedicated `unstable_apiServerOrigin` configuration, so deploying a separate API origin does not itself require custom fetch. The remaining need is a runtime transport-policy hook, not another rendering or deployment mode.

## Decision

### Expose a narrow, unstable Framework Mode transport hook

Add `HydratedRouter.unstable_fetch`, with these public types exported from `react-router/dom`:

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

type unstable_RouterFetch = (
  request: Request,
  context: unstable_RouterFetchContext,
) => Promise<Response>;
```

The default implementation forwards the request to `window.fetch`. Applications may ignore the second argument if they only need a global request policy.

This hook applies to Framework Mode's JavaScript-issued manifest and server data requests. It is not a new option on `RouterProvider` or the Data Mode router constructors. RSC Data and RSC Framework transport contracts are outside the scope of this decision.

All newly exposed APIs use the `unstable_` prefix, and the feature has an unstable change file and documentation warnings. The contract remains experimental rather than committing to a stable API before application feedback.

### Pass a constructed `Request`, not the full native fetch overload

React Router supplies a normalized request with the intended URL, method, headers, body, and abort signal. The callback returns a standard `Response` for React Router to decode.

Accepting `(RequestInfo | URL, RequestInit?)` would require every implementation to normalize multiple input forms. React Router already knows the complete intended request, so making each consumer repeat that work adds no useful flexibility.

Consumers can pass through the request unchanged or override Fetch options without parsing its body:

```ts
const customFetch: unstable_RouterFetch = (request) => {
  let headers = new Headers(request.headers);
  headers.set("X-App-Version", "1.0");

  return fetch(request, { headers });
};
```

The hook is designed around the Fetch API, not an axios-like client abstraction. An alternative client must still preserve cancellation and return responses compatible with React Router's protocol. Converting a Turbo Stream response into JSON and wrapping it in a new `Response` is not an equivalent implementation.

Custom fetch is also not a replacement for [instrumentation](0015-observability.md). Instrumentation observes router and route-handler execution; custom fetch governs actual transport requests and may alter their network behavior. Use the appropriate level for an operation trace versus request headers or Fetch options.

Passing a `Request` does not itself require parsing its body. There is no guarantee that the complete router submission pipeline is streaming or zero-copy, however: the existing `createRequestInit()` reads action bodies before constructing the outgoing Single Fetch request. Removing that materialization is a separate optimization, not a prerequisite or a change made by this feature.

The implementation does not automatically clone every request. This follows the reasoning in [Do not clone request](0002-do-not-clone-request.md): multiple consumers of a body have costs and should be an explicit application choice.

### Describe the initiator independently of the target

`context.type` describes the operation that caused the data request, not whether the HTTP request currently invokes a loader or action:

| Type             | Meaning                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `manifest`       | JavaScript-issued lazy route discovery, including eager discovery         |
| `initialization` | Initial client router data loading and its redirect continuations         |
| `navigation`     | Navigation, including action submissions and their loader/fetcher reloads |
| `fetcher`        | A fetcher operation, including reloads caused by a fetcher action         |
| `revalidation`   | Explicit revalidation, such as `useRevalidator().revalidate()`            |

`fetcherKey` identifies the fetcher targeted by this particular data request. It is `null` for route loader/action requests. It is not an identifier for the entire initiating operation or a guarantee that `type` is `fetcher`.

For example, a navigation action and its route-loader reload have `type: "navigation"` and `fetcherKey: null`. An existing fetcher reloaded by that same navigation has `type: "navigation"` and its own key. Similarly, route loaders reloaded after a fetcher action retain `type: "fetcher"` but have `fetcherKey: null`.

We do not distinguish a `Link` click from `useNavigate`, or identify individual DOM forms. The metadata describes router operations rather than the UI event or component that produced them.

Manifest requests have only `{ type: "manifest" }`. Their purpose is route discovery even when discovery happens during a navigation or fetcher operation. They do not receive a fetcher key or history action. The manifest version is already available in the request URL's `version` query parameter; no separate context field is introduced for it.

### Include the in-flight navigation's history action

Navigation-initiated data requests receive `navigationType: "PUSH" | "REPLACE" | "POP"`, including fetchers reloaded by that navigation. Other data requests receive `null`; manifest requests omit the field.

This is the history action of the in-flight navigation, not the action attached to the previously committed router location. In particular, an initialization request is not a traversal request merely because the router's initial history action is `POP`.

The context is a discriminated union so checking `type === "navigation"` guarantees a non-null `navigationType`. Initialization, fetcher, and revalidation do not have meaningful navigation types even when their continuation changes the browser location.

This lets applications implement a traversal-cache policy without adding a dedicated cache option to the router:

```ts
const customFetch: unstable_RouterFetch = (request, context) => {
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

This is an application policy over the browser's HTTP cache, not a router-owned loader-data cache. It provides no mutation invalidation, authentication invalidation, or freshness guarantee. The server must return cacheable responses, and the application must accept potentially stale data.

### Preserve the initiator through redirects

Internal redirects retain the initiating operation. We do not add a `redirect` type or separate navigation-driven and fetcher-driven redirect variants. Changing the type to `redirect` would discard the information the application originally needed, and exposing redirect lineage would enlarge the contract beyond the current use cases.

Preserving the initiator does not freeze every other field. A navigation redirect uses the history action of its current redirect continuation. A fetcher redirect can cause route-loader requests with `type: "fetcher"` and `fetcherKey: null`.

Initialization must also allow `fetcherKey: string | null`. Ordinary initial hydration excludes fetcher revalidation, but that restriction does not hold for all redirect continuations. A fetcher started while initialization is pending can be reloaded after an initialization redirect. Such a request has:

```ts
let context: unstable_RouterFetchContext = {
  type: "initialization",
  fetcherKey: "tracked",
  navigationType: null,
};
```

An earlier narrowing of initialization to `fetcherKey: null` introduced an invariant that threw for this valid sequence. The final implementation removes that restriction rather than changing existing router redirect or fetcher-revalidation behavior. The navigation type invariant remains: a navigation-initiated data request must have a history action.

### Expose equivalent metadata to data strategies

Data Mode applications already own their network requests in loaders/actions or a custom `dataStrategy`. They do not need the Framework Mode transport callback, but they need the same information to implement equivalent policies.

Extend `DataStrategyFunctionArgs` with:

```ts
unstable_initiator: unstable_DataStrategyInitiator;
unstable_navigationType: NavigationType | null;
```

The existing `fetcherKey: string | null` continues to identify the targeted fetcher. `unstable_DataStrategyInitiator` is exported from `react-router` and includes `initialization`, `navigation`, `fetcher`, `revalidation`, and `static`.

Static handler executions use `static` and `unstable_navigationType: null`. A server-side data strategy does not infer the original client operation from an incoming request. Applications can communicate client metadata through their own headers when they need it; such headers are untrusted client input, not authorization evidence.

The custom-fetch context is derived from data-strategy arguments, keeping the semantics consistent. It does not include `static` because the browser transport hook is not invoked by static handlers, or `manifest` in the data-strategy initiator because route discovery does not execute a data strategy.

This extends the existing [Data Strategy decision](0003-data-strategy.md) without replacing handler execution or result decoding.

### Propagate metadata explicitly through the router

Pass the initiator and history action through the navigation, action, loader, fetcher-reload, and redirect call paths into `callDataStrategyImpl`. Carry them alongside the relevant operation and request instead of looking them up from request identity.

The initial approach used a module-level `WeakMap<Request, DataStrategyInitiator>`. Although a WeakMap avoids retaining requests indefinitely, it creates an implicit contract: every replacement request must be registered or inherit its metadata correctly. The dependency is invisible in function signatures and becomes harder to audit through redirect and revalidation paths.

Explicit propagation makes those dependencies visible, survives request replacement without a side table, and exposes the metadata naturally to Data Mode. It also avoids adding non-standard properties to platform `Request` objects or mixing router-owned metadata into application `getContext` values.

The tradeoff is additional internal parameters and the obligation to forward them at each continuation. Focused tests cover those continuations; no new global metadata registry is required.

### Treat custom fetch as router initialization configuration

`HydratedRouter` creates a singleton router. Read `unstable_fetch` when that router is created and ignore subsequent prop changes, consistent with router-creation options such as `getContext` and `instrumentations`.

Applications needing changing tokens or routing hints should read current application state inside a stable callback, not capture a changing component-render value:

```ts
const customFetch: unstable_RouterFetch = (request) => {
  let headers = new Headers(request.headers);
  let token = authStore.getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(request, { headers });
};
```

We considered a stable delegate pointing at the latest callback, with updates published during React's commit phase. This introduced ordering concerns when descendant layout effects issue requests, as well as the risk of exposing callbacks from renders that never commit if updates happen during render. Using `useInsertionEffect` would move the update earlier, but [React documents that hook for CSS-in-JS library authors](https://react.dev/reference/react/useInsertionEffect). Reactive callback replacement is not worth making the transport depend on this lifecycle machinery.

Initialization-only does not mean every render attempt may publish a callback. Router creation can suspend while the hydration state stream is decoding, before the singleton is assigned. Pass the attempted callback into creation, but assign the shared `fetchImplementation` only after creation succeeds. An abandoned suspended attempt must not change the implementation used by later discovery.

Use a default wrapper, `(request) => window.fetch(request)`, so the module does not access `window` at import time.

This decision is specific to router initialization options. It does not make every `HydratedRouter` prop non-reactive: `onError`, for example, is also passed to the rendered `RouterProvider` and is not interchangeable with a captured transport implementation.

### Keep browser-managed prefetch outside the hook

JavaScript-issued route discovery and server data loading use custom fetch. Browser-managed data prefetches from `Link`, `NavLink`, and `PrefetchPageLinks` use native `<link rel="prefetch">` elements and do not invoke a JavaScript fetch function.

Replacing those prefetches with JavaScript requests would be a separate change to prefetch scheduling and browser behavior. This feature does not make that change or claim to intercept all network traffic.

If requests require custom headers, credentials, or other transformations, applications must use `prefetch="none"` on links and avoid `PrefetchPageLinks` for those routes. An origin-only policy can use API-only Mode's `unstable_apiServerOrigin`, which also applies to native data prefetch URLs.

The hook also does not intercept initial document requests, static assets, server-side loader execution, or arbitrary application calls to `fetch`. Fetches written directly in `clientLoader`/`clientAction` remain application-owned. Their `serverLoader`/`serverAction` helpers use the hook when they issue server data requests.

### Keep rendering and server-origin configuration separate

API-only Mode determines whether the runtime server renders documents or serves data/discovery requests. `unstable_apiServerOrigin` determines where those requests go. Custom fetch determines how JavaScript-issued requests are performed. These are different responsibilities.

For API-only Mode, origin configuration is applied before custom fetch runs. It does not enable cross-origin cookies or bypass CORS and action-origin checks. A callback can opt into credentials for a trusted API origin, but the server and browser must permit the request.

The callback can rewrite URLs for more specialized routing, but applications should not need it just to select the API origin. When rewriting or overriding a request, preserve the router's abort signal and applicable request settings, and do not read the body merely to alter headers or options.

Our rendering-mode discussion distinguished runtime SSR, a pure SPA shell, statically prerendered output, and API-only deployments. Retaining an `ssr: false` server build alone would not define API-only behavior: SPA route stubbing, loader restrictions, initialization, and prerendering also matter. A discriminated `build.mode` configuration was explored, but is not adopted by this decision. API-only prerendering, production server routing, and `react-router-serve` behavior remain separate design concerns.

### Support per-form policies without a new submission-options API

Global policies can inspect the request URL/method and operation metadata. A named fetcher, such as `useFetcher({ key: "checkout" })`, provides a discriminator for requests targeting that fetcher.

There is no DOM form identity or original `Submission.formData` in the custom-fetch context. A navigation form needs an application discriminator such as its action URL or an `intent` field. For compatible form encodings, an application can inspect `await request.clone().formData()` and then send the original request.

Reading the original request body would consume it. [Cloning and reading a body can buffer data](https://developer.mozilla.org/en-US/docs/Web/API/Request/clone), so this is an explicit tradeoff, particularly for uploads. We do not expose the router's original form data solely to avoid that tradeoff or add `headers`/`credentials` options to every submission API.

### Leave route data and error semantics to the router

The callback returns a `Response`, so it can inspect status and headers and implement a network policy before returning it. The supported application pattern is to return the response unchanged, without consuming, decoding, modifying, or re-encoding its body.

React Router expects its manifest/data protocol, including Turbo Stream-encoded loader/action results. Returning arbitrary JSON or synthetic route data is not equivalent to returning the server response. An internal encoder could produce protocol-compatible bytes, but exposing or relying on that encoder is not part of this API.

Generated loader/action types derive from route handler return values, not a transport callback's return values. Injecting a new data shape through custom fetch could make those types incorrect without any corresponding route change. Use a typed `clientLoader`/`clientAction` or another route-level API when intentionally changing the data contract.

Custom fetch can observe rejected network requests and retry safe operations, but it does not add `fetcher.error`, prevent an error boundary, preserve route UI after errors, or change revalidation semantics. A rejected callback still flows through existing router error handling. Retry policies must respect abort signals and avoid replaying mutations unless the application can establish that doing so is safe.

## Alternatives Considered

- **Only configure a server origin:** Appropriate for a fixed API origin and native-prefetch URL routing, but insufficient for runtime headers, credentials, retries, and history-aware cache policies.
- **Monkey-patch `window.fetch`:** Affects unrelated application/library traffic and provides no router-operation metadata.
- **Replace the Framework Mode data strategy:** Requires taking over handler execution and Single Fetch behavior when the desired change is only transport policy.
- **Use native fetch's overloaded arguments:** Makes consumers normalize input forms that React Router can normalize once.
- **Add headers, credentials, retry, and cache options to each router API:** Spreads transport policy across navigation and submission APIs and does not cover manifest discovery. The callback lets applications compose policies in one place.
- **Export a fetch function from `entry.client`:** Would make initialization-only semantics explicit, but introduces another entry-module convention. Passing an initialization option on `HydratedRouter` follows the existing `getContext`/`instrumentations` setup without a new export mechanism.
- **Reactively replace the callback:** Adds render/commit ordering and suspension concerns to a singleton router option. Mutable application state can instead be read at request time.
- **Use a request-keyed WeakMap or attach metadata to `Request`:** Hides propagation behind object identity or extends platform objects. Explicit parameters are easier to follow and reusable by data strategies.
- **Classify every loader reload as revalidation:** Describes a consequence instead of the initiating operation and loses the distinction between a navigation, a fetcher action, and explicit revalidation.
- **Add a redirect subtype or origin chain:** Deferred; retaining the initiator solves current policy needs without another dimension of metadata.
- **Add original form data to the context:** Deferred; URL, named-fetcher, and explicit cloned-body inspection cover current cases without exposing the internal submission representation.
- **Return decoded data or provide a public Turbo Stream encoder:** Would cross the transport/route-data boundary and complicate generated types and protocol compatibility.
- **Intercept native prefetch with JavaScript:** Would require a separate prefetch design; the hook deliberately covers JavaScript-issued requests only.

## Consequences

Applications get a single runtime policy hook while React Router retains control of matching, handler selection, Single Fetch encoding/decoding, cancellation, redirects, and result application. Data Mode can use equivalent metadata without depending on the Framework Mode transport.

The additional metadata is a behavioral contract. Tests must cover its propagation, not just prove that a GET uses a custom callback. Coverage includes initialization, navigation actions and reloads, fetcher actions and reloads, explicit revalidation, redirects, static handlers, lazy/eager discovery, API-only server-origin composition, and `PUSH`/`REPLACE`/`POP`. Type tests verify the discriminated union. A browser regression specifically covers a keyed fetcher reloaded after an initialization redirect.

The limitations are intentional and must stay visible in documentation: callback replacement is ignored, native prefetch bypasses the callback, body inspection has costs, and transport customization must not invent route data. The [Custom Fetch guide](../docs/how-to/custom-fetch.md) contains application examples; the [Data Strategy guide](../docs/how-to/data-strategy.md#request-metadata-unstable) documents the lower-level metadata.

No new rendering configuration, router-managed cache, built-in retry policy, form-specific transport options, or error-state API is introduced.

## Related Proposals

These proposals motivate capabilities available through an application policy, not adoption of their exact suggested API:

- [#15472: Custom fetch for manifest and data requests](https://github.com/remix-run/react-router/discussions/15472): runtime transport policies and region-routing hints
- [#10002: Custom submit headers](https://github.com/remix-run/react-router/discussions/10002) and [Remix #4397: Custom form headers](https://github.com/remix-run/remix/discussions/4397): header policies, with the per-form discrimination limits described above
- [#12023: Fetcher credentials](https://github.com/remix-run/react-router/discussions/12023): application-defined credential policy
- [#12892: Built-in retry mechanism](https://github.com/remix-run/react-router/discussions/12892): applications can implement safe network retries, without adding per-call retry options
- [#15021: Server-visible request intent](https://github.com/remix-run/react-router/discussions/15021): applications can send their own intent header using context; no framework-owned header or identical classification of current-route forms is introduced
- [PR #15288: Traversal cache](https://github.com/remix-run/react-router/pull/15288): the Framework Mode `.data` HTTP-cache policy can be implemented using `navigationType`; this decision does not reproduce that PR's RSC behavior

[Discussion #12804: Better action/fetcher/revalidation errors](https://github.com/remix-run/react-router/discussions/12804) is related but not resolved by this contract. Centralized transport observation/retry does not supply its proposed non-destructive error state or error-boundary opt-out semantics.

The canonical proposal is [#15461](https://github.com/remix-run/react-router/discussions/15461). [PR #15586](https://github.com/remix-run/react-router/pull/15586) supersedes the original [PR #15465](https://github.com/remix-run/react-router/pull/15465).
