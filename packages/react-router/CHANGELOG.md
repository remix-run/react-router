# `react-router`

## 7.4.0

### Patch Changes

- Fix root loader data on initial load redirects in SPA mode ([#13222](https://github.com/remix-run/react-router/pull/13222))
- Load ancestor pathless/index routes in lazy route discovery for upwards non-eager-discoery routing ([#13203](https://github.com/remix-run/react-router/pull/13203))
- Fix `shouldRevalidate` behavior for `clientLoader`-only routes in `ssr:true` apps ([#13221](https://github.com/remix-run/react-router/pull/13221))
- UNSTABLE: Fix `RequestHandler` `loadContext` parameter type when middleware is enabled ([#13204](https://github.com/remix-run/react-router/pull/13204))
- UNSTABLE: Update `Route.unstable_MiddlewareFunction` to have a return value of `Response | undefined` instead of `Response | void` becaue you should not return anything if you aren't returning the `Response` ([#13199](https://github.com/remix-run/react-router/pull/13199))
- UNSTABLE(BREAKING): If a middleware throws an error, ensure we only bubble the error itself via `next()` and are no longer leaking the `MiddlewareError` implementation detail ([#13180](https://github.com/remix-run/react-router/pull/13180))

## 7.3.0

### Minor Changes

- Add `fetcherKey` as a parameter to `patchRoutesOnNavigation` ([#13061](https://github.com/remix-run/react-router/pull/13061))

  - In framework mode, Lazy Route Discovery will now detect manifest version mismatches after a new deploy
  - On navigations to undiscovered routes, this mismatch will trigger a document reload of the destination path
  - On `fetcher` calls to undiscovered routes, this mismatch will trigger a document reload of the current path

### Patch Changes

- Skip resource route flow in dev server in SPA mode ([#13113](https://github.com/remix-run/react-router/pull/13113))

- Support middleware on routes (unstable) ([#12941](https://github.com/remix-run/react-router/pull/12941))

  Middleware is implemented behind a `future.unstable_middleware` flag. To enable, you must enable the flag and the types in your `react-router-config.ts` file:

  ```ts
  import type { Config } from "@react-router/dev/config";
  import type { Future } from "react-router";

  declare module "react-router" {
    interface Future {
      unstable_middleware: true; // 👈 Enable middleware types
    }
  }

  export default {
    future: {
      unstable_middleware: true, // 👈 Enable middleware
    },
  } satisfies Config;
  ```

  ⚠️ Middleware is unstable and should not be adopted in production. There is at least one known de-optimization in route module loading for `clientMiddleware` that we will be addressing this before a stable release.

  ⚠️ Enabling middleware contains a breaking change to the `context` parameter passed to your `loader`/`action` functions - see below for more information.

  Once enabled, routes can define an array of middleware functions that will run sequentially before route handlers run. These functions accept the same parameters as `loader`/`action` plus an additional `next` parameter to run the remaining data pipeline. This allows middlewares to perform logic before and after handlers execute.

  ```tsx
  // Framework mode
  export const unstable_middleware = [serverLogger, serverAuth]; // server
  export const unstable_clientMiddleware = [clientLogger]; // client

  // Library mode
  const routes = [
    {
      path: "/",
      // Middlewares are client-side for library mode SPA's
      unstable_middleware: [clientLogger, clientAuth],
      loader: rootLoader,
      Component: Root,
    },
  ];
  ```

  Here's a simple example of a client-side logging middleware that can be placed on the root route:

  ```tsx
  const clientLogger: Route.unstable_ClientMiddlewareFunction = async (
    { request },
    next
  ) => {
    let start = performance.now();

    // Run the remaining middlewares and all route loaders
    await next();

    let duration = performance.now() - start;
    console.log(`Navigated to ${request.url} (${duration}ms)`);
  };
  ```

  Note that in the above example, the `next`/`middleware` functions don't return anything. This is by design as on the client there is no "response" to send over the network like there would be for middlewares running on the server. The data is all handled behind the scenes by the stateful `router`.

  For a server-side middleware, the `next` function will return the HTTP `Response` that React Router will be sending across the wire, thus giving you a chance to make changes as needed. You may throw a new response to short circuit and respond immediately, or you may return a new or altered response to override the default returned by `next()`.

  ```tsx
  const serverLogger: Route.unstable_MiddlewareFunction = async (
    { request, params, context },
    next
  ) => {
    let start = performance.now();

    // 👇 Grab the response here
    let res = await next();

    let duration = performance.now() - start;
    console.log(`Navigated to ${request.url} (${duration}ms)`);

    // 👇 And return it here (optional if you don't modify the response)
    return res;
  };
  ```

  You can throw a `redirect` from a middleware to short circuit any remaining processing:

  ```tsx
  import { sessionContext } from "../context";
  const serverAuth: Route.unstable_MiddlewareFunction = (
    { request, params, context },
    next
  ) => {
    let session = context.get(sessionContext);
    let user = session.get("user");
    if (!user) {
      session.set("returnTo", request.url);
      throw redirect("/login", 302);
    }
  };
  ```

  _Note that in cases like this where you don't need to do any post-processing you don't need to call the `next` function or return a `Response`._

  Here's another example of using a server middleware to detect 404s and check the CMS for a redirect:

  ```tsx
  const redirects: Route.unstable_MiddlewareFunction = async ({
    request,
    next,
  }) => {
    // attempt to handle the request
    let res = await next();

    // if it's a 404, check the CMS for a redirect, do it last
    // because it's expensive
    if (res.status === 404) {
      let cmsRedirect = await checkCMSRedirects(request.url);
      if (cmsRedirect) {
        throw redirect(cmsRedirect, 302);
      }
    }

    return res;
  };
  ```

  **`context` parameter**

  When middleware is enabled, your application will use a different type of `context` parameter in your loaders and actions to provide better type safety. Instead of `AppLoadContext`, `context` will now be an instance of `ContextProvider` that you can use with type-safe contexts (similar to `React.createContext`):

  ```ts
  import { unstable_createContext } from "react-router";
  import { Route } from "./+types/root";
  import type { Session } from "./sessions.server";
  import { getSession } from "./sessions.server";

  let sessionContext = unstable_createContext<Session>();

  const sessionMiddleware: Route.unstable_MiddlewareFunction = ({
    context,
    request,
  }) => {
    let session = await getSession(request);
    context.set(sessionContext, session);
    //                          ^ must be of type Session
  };

  // ... then in some downstream middleware
  const loggerMiddleware: Route.unstable_MiddlewareFunction = ({
    context,
    request,
  }) => {
    let session = context.get(sessionContext);
    //  ^ typeof Session
    console.log(session.get("userId"), request.method, request.url);
  };

  // ... or some downstream loader
  export function loader({ context }: Route.LoaderArgs) {
    let session = context.get(sessionContext);
    let profile = await getProfile(session.get("userId"));
    return { profile };
  }
  ```

  If you are using a custom server with a `getLoadContext` function, the return value for initial context values passed from the server adapter layer is no longer an object and should now return an `unstable_InitialContext` (`Map<RouterContext, unknown>`):

  ```ts
  let adapterContext = unstable_createContext<MyAdapterContext>();

  function getLoadContext(req, res): unstable_InitialContext {
    let map = new Map();
    map.set(adapterContext, getAdapterContext(req));
    return map;
  }
  ```

- Fix types for loaderData and actionData that contained `Record`s ([#13139](https://github.com/remix-run/react-router/pull/13139))

  UNSTABLE(BREAKING):

  `unstable_SerializesTo` added a way to register custom serialization types in Single Fetch for other library and framework authors like Apollo.
  It was implemented with branded type whose branded property that was made optional so that casting arbitrary values was easy:

  ```ts
  // without the brand being marked as optional
  let x1 = 42 as unknown as unstable_SerializesTo<number>;
  //          ^^^^^^^^^^

  // with the brand being marked as optional
  let x2 = 42 as unstable_SerializesTo<number>;
  ```

  However, this broke type inference in `loaderData` and `actionData` for any `Record` types as those would now (incorrectly) match `unstable_SerializesTo`.
  This affected all users, not just those that depended on `unstable_SerializesTo`.
  To fix this, the branded property of `unstable_SerializesTo` is marked as required instead of optional.

  For library and framework authors using `unstable_SerializesTo`, you may need to add `as unknown` casts before casting to `unstable_SerializesTo`.

- \[REMOVE] Remove middleware depth logic and always call middlware for all matches ([#13172](https://github.com/remix-run/react-router/pull/13172))

- Fix single fetch `_root.data` requests when a `basename` is used ([#12898](https://github.com/remix-run/react-router/pull/12898))

- Add `context` support to client side data routers (unstable) ([#12941](https://github.com/remix-run/react-router/pull/12941))

  Your application `loader` and `action` functions on the client will now receive a `context` parameter. This is an instance of `unstable_RouterContextProvider` that you use with type-safe contexts (similar to `React.createContext`) and is most useful with the corresponding `middleware`/`clientMiddleware` API's:

  ```ts
  import { unstable_createContext } from "react-router";

  type User = {
    /*...*/
  };

  let userContext = unstable_createContext<User>();

  function sessionMiddleware({ context }) {
    let user = await getUser();
    context.set(userContext, user);
  }

  // ... then in some downstream loader
  function loader({ context }) {
    let user = context.get(userContext);
    let profile = await getProfile(user.id);
    return { profile };
  }
  ```

  Similar to server-side requests, a fresh `context` will be created per navigation (or `fetcher` call). If you have initial data you'd like to populate in the context for every request, you can provide an `unstable_getContext` function at the root of your app:

  - Library mode - `createBrowserRouter(routes, { unstable_getContext })`
  - Framework mode - `<HydratedRouter unstable_getContext>`

  This function should return an value of type `unstable_InitialContext` which is a `Map<unstable_RouterContext, unknown>` of context's and initial values:

  ```ts
  const loggerContext = unstable_createContext<(...args: unknown[]) => void>();

  function logger(...args: unknown[]) {
    console.log(new Date.toISOString(), ...args);
  }

  function unstable_getContext() {
    let map = new Map();
    map.set(loggerContext, logger);
    return map;
  }
  ```

## 7.2.0

### Minor Changes

- New type-safe `href` utility that guarantees links point to actual paths in your app ([#13012](https://github.com/remix-run/react-router/pull/13012))

  ```tsx
  import { href } from "react-router";

  export default function Component() {
    const link = href("/blog/:slug", { slug: "my-first-post" });
    return (
      <main>
        <Link to={href("/products/:id", { id: "asdf" })} />
        <NavLink to={href("/:lang?/about", { lang: "en" })} />
      </main>
    );
  }
  ```

### Patch Changes

- Fix typegen for repeated params ([#13012](https://github.com/remix-run/react-router/pull/13012))

  In React Router, path parameters are keyed by their name.
  So for a path pattern like `/a/:id/b/:id?/c/:id`, the last `:id` will set the value for `id` in `useParams` and the `params` prop.
  For example, `/a/1/b/2/c/3` will result in the value `{ id: 3 }` at runtime.

  Previously, generated types for params incorrectly modeled repeated params with an array.
  So `/a/1/b/2/c/3` generated a type like `{ id: [1,2,3] }`.

  To be consistent with runtime behavior, the generated types now correctly model the "last one wins" semantics of path parameters.
  So `/a/1/b/2/c/3` now generates a type like `{ id: 3 }`.

- Don't apply Single Fetch revalidation de-optimization when in SPA mode since there is no server HTTP request ([#12948](https://github.com/remix-run/react-router/pull/12948))

- Properly handle revalidations to across a prerender/SPA boundary ([#13021](https://github.com/remix-run/react-router/pull/13021))

  - In "hybrid" applications where some routes are pre-rendered and some are served from a SPA fallback, we need to avoid making `.data` requests if the path wasn't pre-rendered because the request will 404
  - We don't know all the pre-rendered paths client-side, however:
    - All `loader` data in `ssr:false` mode is static because it's generated at build time
    - A route must use a `clientLoader` to do anything dynamic
    - Therefore, if a route only has a `loader` and not a `clientLoader`, we disable revalidation by default because there is no new data to retrieve
    - We short circuit and skip single fetch `.data` request logic if there are no server loaders with `shouldLoad=true` in our single fetch `dataStrategy`
    - This ensures that the route doesn't cause a `.data` request that would 404 after a submission

- Error at build time in `ssr:false` + `prerender` apps for the edge case scenario of: ([#13021](https://github.com/remix-run/react-router/pull/13021))

  - A parent route has only a `loader` (does not have a `clientLoader`)
  - The parent route is pre-rendered
  - The parent route has children routes which are not prerendered
  - This means that when the child paths are loaded via the SPA fallback, the parent won't have any `loaderData` because there is no server on which to run the `loader`
  - This can be resolved by either adding a parent `clientLoader` or pre-rendering the child paths
  - If you add a `clientLoader`, calling the `serverLoader()` on non-prerendered paths will throw a 404

- Add unstable support for splitting route modules in framework mode via `future.unstable_splitRouteModules` ([#11871](https://github.com/remix-run/react-router/pull/11871))

- Add `unstable_SerializesTo` brand type for library authors to register types serializable by React Router's streaming format (`turbo-stream`) ([`ab5b05b02`](https://github.com/remix-run/react-router/commit/ab5b05b02f99f062edb3c536c392197c88eb6c77))

- Align dev server behavior with static file server behavior when `ssr:false` is set ([#12948](https://github.com/remix-run/react-router/pull/12948))

  - When no `prerender` config exists, only SSR down to the root `HydrateFallback` (SPA Mode)
  - When a `prerender` config exists but the current path is not prerendered, only SSR down to the root `HydrateFallback` (SPA Fallback)
  - Return a 404 on `.data` requests to non-pre-rendered paths

- Improve prefetch performance of CSS side effects in framework mode ([#12889](https://github.com/remix-run/react-router/pull/12889))

- Disable Lazy Route Discovery for all `ssr:false` apps and not just "SPA Mode" because there is no runtime server to serve the search-param-configured `__manifest` requests ([#12894](https://github.com/remix-run/react-router/pull/12894))

  - We previously only disabled this for "SPA Mode" which is `ssr:false` and no `prerender` config but we realized it should apply to all `ssr:false` apps, including those prerendering multiple pages
  - In those `prerender` scenarios we would prerender the `/__manifest` file assuming the static file server would serve it but that makes some unneccesary assumptions about the static file server behaviors

- Properly handle interrupted manifest requests in lazy route discovery ([#12915](https://github.com/remix-run/react-router/pull/12915))

## 7.1.5

### Patch Changes

- Fix regression introduced in `7.1.4` via [#12800](https://github.com/remix-run/react-router/pull/12800) that caused issues navigating to hash routes inside splat routes for applications using Lazy Route Discovery (`patchRoutesOnNavigation`) ([#12927](https://github.com/remix-run/react-router/pull/12927))

## 7.1.4

### Patch Changes

- Internal reorg to clean up some duplicated route module types ([#12799](https://github.com/remix-run/react-router/pull/12799))
- Properly handle status codes that cannot have a body in single fetch responses (204, etc.) ([#12760](https://github.com/remix-run/react-router/pull/12760))
- Stop erroring on resource routes that return raw strings/objects and instead serialize them as `text/plain` or `application/json` responses ([#12848](https://github.com/remix-run/react-router/pull/12848))
  - This only applies when accessed as a resource route without the `.data` extension
  - When accessed from a Single Fetch `.data` request, they will still be encoded via `turbo-stream`
- Optimize Lazy Route Discovery path discovery to favor a single `querySelectorAll` call at the `body` level instead of many calls at the sub-tree level ([#12731](https://github.com/remix-run/react-router/pull/12731))
- Properly bubble headers as `errorHeaders` when throwing a `data()` result ([#12846](https://github.com/remix-run/react-router/pull/12846))
  - Avoid duplication of `Set-Cookie` headers could be duplicated if also returned from `headers`
- Optimize route matching by skipping redundant `matchRoutes` calls when possible ([#12800](https://github.com/remix-run/react-router/pull/12800))

## 7.1.3

_No changes_

## 7.1.2

### Patch Changes

- Fix issue with fetcher data cleanup in the data layer on fetcher unmount ([#12681](https://github.com/remix-run/react-router/pull/12681))
- Do not rely on `symbol` for filtering out `redirect` responses from loader data ([#12694](https://github.com/remix-run/react-router/pull/12694))

  Previously, some projects were getting type checking errors like:

  ```ts
  error TS4058: Return type of exported function has or is using name 'redirectSymbol' from external module "node_modules/..." but cannot be named.
  ```

  Now that `symbol`s are not used for the `redirect` response type, these errors should no longer be present.

## 7.1.1

_No changes_

## 7.1.0

### Patch Changes

- Throw unwrapped single fetch redirect to align with pre-single fetch behavior ([#12506](https://github.com/remix-run/react-router/pull/12506))
- Ignore redirects when inferring loader data types ([#12527](https://github.com/remix-run/react-router/pull/12527))
- Remove `<Link prefetch>` warning which suffers from false positives in a lazy route discovery world ([#12485](https://github.com/remix-run/react-router/pull/12485))

## 7.0.2

### Patch Changes

- temporarily only use one build in export map so packages can have a peer dependency on react router ([#12437](https://github.com/remix-run/react-router/pull/12437))
- Generate wide `matches` and `params` types for current route and child routes ([#12397](https://github.com/remix-run/react-router/pull/12397))

  At runtime, `matches` includes child route matches and `params` include child route path parameters.
  But previously, we only generated types for parent routes in `matches`; for `params`, we only considered the parent routes and the current route.
  To align our generated types more closely to the runtime behavior, we now generate more permissive, wider types when accessing child route information.

## 7.0.1

_No changes_

## 7.0.0

### Major Changes

- Remove the original `defer` implementation in favor of using raw promises via single fetch and `turbo-stream`. This removes these exports from React Router: ([#11744](https://github.com/remix-run/react-router/pull/11744))

  - `defer`
  - `AbortedDeferredError`
  - `type TypedDeferredData`
  - `UNSAFE_DeferredData`
  - `UNSAFE_DEFERRED_SYMBOL`,

- - Collapse `@remix-run/router` into `react-router` ([#11505](https://github.com/remix-run/react-router/pull/11505))
  - Collapse `react-router-dom` into `react-router`
  - Collapse `@remix-run/server-runtime` into `react-router`
  - Collapse `@remix-run/testing` into `react-router`

- Remove single_fetch future flag. ([#11522](https://github.com/remix-run/react-router/pull/11522))

- Drop support for Node 16, React Router SSR now requires Node 18 or higher ([#11391](https://github.com/remix-run/react-router/pull/11391))

- Remove `future.v7_startTransition` flag ([#11696](https://github.com/remix-run/react-router/pull/11696))

- - Expose the underlying router promises from the following APIs for compsition in React 19 APIs: ([#11521](https://github.com/remix-run/react-router/pull/11521))
    - `useNavigate()`
    - `useSubmit`
    - `useFetcher().load`
    - `useFetcher().submit`
    - `useRevalidator.revalidate`

- Remove `future.v7_normalizeFormMethod` future flag ([#11697](https://github.com/remix-run/react-router/pull/11697))

- For Remix consumers migrating to React Router, the `crypto` global from the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is now required when using cookie and session APIs. This means that the following APIs are provided from `react-router` rather than platform-specific packages: ([#11837](https://github.com/remix-run/react-router/pull/11837))

  - `createCookie`
  - `createCookieSessionStorage`
  - `createMemorySessionStorage`
  - `createSessionStorage`

  For consumers running older versions of Node, the `installGlobals` function from `@remix-run/node` has been updated to define `globalThis.crypto`, using [Node's `require('node:crypto').webcrypto` implementation.](https://nodejs.org/api/webcrypto.html)

  Since platform-specific packages no longer need to implement this API, the following low-level APIs have been removed:

  - `createCookieFactory`
  - `createSessionStorageFactory`
  - `createCookieSessionStorageFactory`
  - `createMemorySessionStorageFactory`

- Imports/Exports cleanup ([#11840](https://github.com/remix-run/react-router/pull/11840))

  - Removed the following exports that were previously public API from `@remix-run/router`
    - types
      - `AgnosticDataIndexRouteObject`
      - `AgnosticDataNonIndexRouteObject`
      - `AgnosticDataRouteMatch`
      - `AgnosticDataRouteObject`
      - `AgnosticIndexRouteObject`
      - `AgnosticNonIndexRouteObject`
      - `AgnosticRouteMatch`
      - `AgnosticRouteObject`
      - `TrackedPromise`
      - `unstable_AgnosticPatchRoutesOnMissFunction`
      - `Action` -> exported as `NavigationType` via `react-router`
      - `Router` exported as `DataRouter` to differentiate from RR's `<Router>`
    - API
      - `getToPathname` (`@private`)
      - `joinPaths` (`@private`)
      - `normalizePathname` (`@private`)
      - `resolveTo` (`@private`)
      - `stripBasename` (`@private`)
      - `createBrowserHistory` -> in favor of `createBrowserRouter`
      - `createHashHistory` -> in favor of `createHashRouter`
      - `createMemoryHistory` -> in favor of `createMemoryRouter`
      - `createRouter`
      - `createStaticHandler` -> in favor of wrapper `createStaticHandler` in RR Dom
      - `getStaticContextFromError`
  - Removed the following exports that were previously public API from `react-router`
    - `Hash`
    - `Pathname`
    - `Search`

- update minimum node version to 18 ([#11690](https://github.com/remix-run/react-router/pull/11690))

- Remove `future.v7_prependBasename` from the ionternalized `@remix-run/router` package ([#11726](https://github.com/remix-run/react-router/pull/11726))

- Migrate Remix type generics to React Router ([#12180](https://github.com/remix-run/react-router/pull/12180))

  - These generics are provided for Remix v2 migration purposes
  - These generics and the APIs they exist on should be considered informally deprecated in favor of the new `Route.*` types
  - Anyone migrating from React Router v6 should probably not leverage these new generics and should migrate straight to the `Route.*` types
  - For React Router v6 users, these generics are new and should not impact your app, with one exception
    - `useFetcher` previously had an optional generic (used primarily by Remix v2) that expected the data type
    - This has been updated in v7 to expect the type of the function that generates the data (i.e., `typeof loader`/`typeof action`)
    - Therefore, you should update your usages:
      - ❌ `useFetcher<LoaderData>()`
      - ✅ `useFetcher<typeof loader>()`

- Remove `future.v7_throwAbortReason` from internalized `@remix-run/router` package ([#11728](https://github.com/remix-run/react-router/pull/11728))

- Add `exports` field to all packages ([#11675](https://github.com/remix-run/react-router/pull/11675))

- node package no longer re-exports from react-router ([#11702](https://github.com/remix-run/react-router/pull/11702))

- renamed RemixContext to FrameworkContext ([#11705](https://github.com/remix-run/react-router/pull/11705))

- updates the minimum React version to 18 ([#11689](https://github.com/remix-run/react-router/pull/11689))

- PrefetchPageDescriptor replaced by PageLinkDescriptor ([#11960](https://github.com/remix-run/react-router/pull/11960))

- - Consolidate types previously duplicated across `@remix-run/router`, `@remix-run/server-runtime`, and `@remix-run/react` now that they all live in `react-router` ([#12177](https://github.com/remix-run/react-router/pull/12177))
    - Examples: `LoaderFunction`, `LoaderFunctionArgs`, `ActionFunction`, `ActionFunctionArgs`, `DataFunctionArgs`, `RouteManifest`, `LinksFunction`, `Route`, `EntryRoute`
    - The `RouteManifest` type used by the "remix" code is now slightly stricter because it is using the former `@remix-run/router` `RouteManifest`
      - `Record<string, Route> -> Record<string, Route | undefined>`
    - Removed `AppData` type in favor of inlining `unknown` in the few locations it was used
    - Removed `ServerRuntimeMeta*` types in favor of the `Meta*` types they were duplicated from

- - Remove the `future.v7_partialHydration` flag ([#11725](https://github.com/remix-run/react-router/pull/11725))
    - This also removes the `<RouterProvider fallbackElement>` prop
      - To migrate, move the `fallbackElement` to a `hydrateFallbackElement`/`HydrateFallback` on your root route
    - Also worth nothing there is a related breaking changer with this future flag:
      - Without `future.v7_partialHydration` (when using `fallbackElement`), `state.navigation` was populated during the initial load
      - With `future.v7_partialHydration`, `state.navigation` remains in an `"idle"` state during the initial load

- Remove `v7_relativeSplatPath` future flag ([#11695](https://github.com/remix-run/react-router/pull/11695))

- Drop support for Node 18, update minimum Node vestion to 20 ([#12171](https://github.com/remix-run/react-router/pull/12171))

  - Remove `installGlobals()` as this should no longer be necessary

- Remove remaining future flags ([#11820](https://github.com/remix-run/react-router/pull/11820))

  - React Router `v7_skipActionErrorRevalidation`
  - Remix `v3_fetcherPersist`, `v3_relativeSplatPath`, `v3_throwAbortReason`

- rename createRemixStub to createRoutesStub ([#11692](https://github.com/remix-run/react-router/pull/11692))

- Remove `@remix-run/router` deprecated `detectErrorBoundary` option in favor of `mapRouteProperties` ([#11751](https://github.com/remix-run/react-router/pull/11751))

- Add `react-router/dom` subpath export to properly enable `react-dom` as an optional `peerDependency` ([#11851](https://github.com/remix-run/react-router/pull/11851))

  - This ensures that we don't blindly `import ReactDOM from "react-dom"` in `<RouterProvider>` in order to access `ReactDOM.flushSync()`, since that would break `createMemoryRouter` use cases in non-DOM environments
  - DOM environments should import from `react-router/dom` to get the proper component that makes `ReactDOM.flushSync()` available:
    - If you are using the Vite plugin, use this in your `entry.client.tsx`:
      - `import { HydratedRouter } from 'react-router/dom'`
    - If you are not using the Vite plugin and are manually calling `createBrowserRouter`/`createHashRouter`:
      - `import { RouterProvider } from "react-router/dom"`

- Remove `future.v7_fetcherPersist` flag ([#11731](https://github.com/remix-run/react-router/pull/11731))

- Update `cookie` dependency to `^1.0.1` - please see the [release notes](https://github.com/jshttp/cookie/releases) for any breaking changes ([#12172](https://github.com/remix-run/react-router/pull/12172))

### Minor Changes

- - Add support for `prerender` config in the React Router vite plugin, to support existing SSG use-cases ([#11539](https://github.com/remix-run/react-router/pull/11539))
    - You can use the `prerender` config to pre-render your `.html` and `.data` files at build time and then serve them statically at runtime (either from a running server or a CDN)
    - `prerender` can either be an array of string paths, or a function (sync or async) that returns an array of strings so that you can dynamically generate the paths by talking to your CMS, etc.

  ```ts
  // react-router.config.ts
  import type { Config } from "@react-router/dev/config";

  export default {
    async prerender() {
      let slugs = await fakeGetSlugsFromCms();
      // Prerender these paths into `.html` files at build time, and `.data`
      // files if they have loaders
      return ["/", "/about", ...slugs.map((slug) => `/product/${slug}`)];
    },
  } satisfies Config;

  async function fakeGetSlugsFromCms() {
    await new Promise((r) => setTimeout(r, 1000));
    return ["shirt", "hat"];
  }
  ```

- Params, loader data, and action data as props for route component exports ([#11961](https://github.com/remix-run/react-router/pull/11961))

  ```tsx
  export default function Component({ params, loaderData, actionData }) {}

  export function HydrateFallback({ params }) {}
  export function ErrorBoundary({ params, loaderData, actionData }) {}
  ```

- Remove duplicate `RouterProvider` impliementations ([#11679](https://github.com/remix-run/react-router/pull/11679))

- ### Typesafety improvements ([#12019](https://github.com/remix-run/react-router/pull/12019))

  React Router now generates types for each of your route modules.
  You can access those types by importing them from `./+types.<route filename without extension>`.
  For example:

  ```ts
  // app/routes/product.tsx
  import type * as Route from "./+types.product";

  export function loader({ params }: Route.LoaderArgs) {}

  export default function Component({ loaderData }: Route.ComponentProps) {}
  ```

  This initial implementation targets type inference for:

  - `Params` : Path parameters from your routing config in `routes.ts` including file-based routing
  - `LoaderData` : Loader data from `loader` and/or `clientLoader` within your route module
  - `ActionData` : Action data from `action` and/or `clientAction` within your route module

  In the future, we plan to add types for the rest of the route module exports: `meta`, `links`, `headers`, `shouldRevalidate`, etc.
  We also plan to generate types for typesafe `Link`s:

  ```tsx
  <Link to="/products/:id" params={{ id: 1 }} />
  //        ^^^^^^^^^^^^^          ^^^^^^^^^
  // typesafe `to` and `params` based on the available routes in your app
  ```

  Check out our docs for more:

  - [_Explanations > Type Safety_](https://reactrouter.com/dev/guides/explanation/type-safety)
  - [_How-To > Setting up type safety_](https://reactrouter.com/dev/guides/how-to/setting-up-type-safety)

- Stabilize `unstable_dataStrategy` ([#11969](https://github.com/remix-run/react-router/pull/11969))

- Stabilize `unstable_patchRoutesOnNavigation` ([#11970](https://github.com/remix-run/react-router/pull/11970))

### Patch Changes

- No changes ([`506329c4e`](https://github.com/remix-run/react-router/commit/506329c4e2e7aba9837cbfa44df6103b49423745))

- chore: re-enable development warnings through a `development` exports condition. ([#12269](https://github.com/remix-run/react-router/pull/12269))

- Remove unstable upload handler. ([#12015](https://github.com/remix-run/react-router/pull/12015))

- Remove unneeded dependency on @web3-storage/multipart-parser ([#12274](https://github.com/remix-run/react-router/pull/12274))

- Fix redirects returned from loaders/actions using `data()` ([#12021](https://github.com/remix-run/react-router/pull/12021))

- fix(react-router): (v7) fix static prerender of non-ascii characters ([#12161](https://github.com/remix-run/react-router/pull/12161))

- Replace `substr` with `substring` ([#12080](https://github.com/remix-run/react-router/pull/12080))

- Remove the deprecated `json` utility ([#12146](https://github.com/remix-run/react-router/pull/12146))

  - You can use [`Response.json`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json_static) if you still need to construct JSON responses in your app

- Remove unneeded dependency on source-map ([#12275](https://github.com/remix-run/react-router/pull/12275))

## 6.28.0

### Minor Changes

- - Log deprecation warnings for v7 flags ([#11750](https://github.com/remix-run/react-router/pull/11750))
  - Add deprecation warnings to `json`/`defer` in favor of returning raw objects
    - These methods will be removed in React Router v7

### Patch Changes

- Update JSDoc URLs for new website structure (add /v6/ segment) ([#12141](https://github.com/remix-run/react-router/pull/12141))
- Updated dependencies:
  - `@remix-run/router@1.21.0`

## 6.27.0

### Minor Changes

- Stabilize `unstable_patchRoutesOnNavigation` ([#11973](https://github.com/remix-run/react-router/pull/11973))
  - Add new `PatchRoutesOnNavigationFunctionArgs` type for convenience ([#11967](https://github.com/remix-run/react-router/pull/11967))
- Stabilize `unstable_dataStrategy` ([#11974](https://github.com/remix-run/react-router/pull/11974))
- Stabilize the `unstable_flushSync` option for navigations and fetchers ([#11989](https://github.com/remix-run/react-router/pull/11989))
- Stabilize the `unstable_viewTransition` option for navigations and the corresponding `unstable_useViewTransitionState` hook ([#11989](https://github.com/remix-run/react-router/pull/11989))

### Patch Changes

- Fix bug when submitting to the current contextual route (parent route with an index child) when an `?index` param already exists from a prior submission ([#12003](https://github.com/remix-run/react-router/pull/12003))

- Fix `useFormAction` bug - when removing `?index` param it would not keep other non-Remix `index` params ([#12003](https://github.com/remix-run/react-router/pull/12003))

- Fix types for `RouteObject` within `PatchRoutesOnNavigationFunction`'s `patch` method so it doesn't expect agnostic route objects passed to `patch` ([#11967](https://github.com/remix-run/react-router/pull/11967))

- Updated dependencies:
  - `@remix-run/router@1.20.0`

## 6.26.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.19.2`

## 6.26.1

### Patch Changes

- Rename `unstable_patchRoutesOnMiss` to `unstable_patchRoutesOnNavigation` to match new behavior ([#11888](https://github.com/remix-run/react-router/pull/11888))
- Updated dependencies:
  - `@remix-run/router@1.19.1`

## 6.26.0

### Minor Changes

- Add a new `replace(url, init?)` alternative to `redirect(url, init?)` that performs a `history.replaceState` instead of a `history.pushState` on client-side navigation redirects ([#11811](https://github.com/remix-run/react-router/pull/11811))

### Patch Changes

- Fix initial hydration behavior when using `future.v7_partialHydration` along with `unstable_patchRoutesOnMiss` ([#11838](https://github.com/remix-run/react-router/pull/11838))
  - During initial hydration, `router.state.matches` will now include any partial matches so that we can render ancestor `HydrateFallback` components
- Updated dependencies:
  - `@remix-run/router@1.19.0`

## 6.25.1

No significant changes to this package were made in this release. [See the repo `CHANGELOG.md`](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md) for an overview of all changes in v6.25.1.

## 6.25.0

### Minor Changes

- Stabilize `future.unstable_skipActionErrorRevalidation` as `future.v7_skipActionErrorRevalidation` ([#11769](https://github.com/remix-run/react-router/pull/11769))
  - When this flag is enabled, actions will not automatically trigger a revalidation if they return/throw a `Response` with a `4xx`/`5xx` status code
  - You may still opt-into revalidation via `shouldRevalidate`
  - This also changes `shouldRevalidate`'s `unstable_actionStatus` parameter to `actionStatus`

### Patch Changes

- Fix regression and properly decode paths inside `useMatch` so matches/params reflect decoded params ([#11789](https://github.com/remix-run/react-router/pull/11789))
- Updated dependencies:
  - `@remix-run/router@1.18.0`

## 6.24.1

### Patch Changes

- When using `future.v7_relativeSplatPath`, properly resolve relative paths in splat routes that are children of pathless routes ([#11633](https://github.com/remix-run/react-router/pull/11633))
- Updated dependencies:
  - `@remix-run/router@1.17.1`

## 6.24.0

### Minor Changes

- Add support for Lazy Route Discovery (a.k.a. Fog of War) ([#11626](https://github.com/remix-run/react-router/pull/11626))
  - RFC: <https://github.com/remix-run/react-router/discussions/11113>
  - `unstable_patchRoutesOnMiss` docs: <https://reactrouter.com/v6/routers/create-browser-router>

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.17.0`

## 6.23.1

### Patch Changes

- allow undefined to be resolved with `<Await>` ([#11513](https://github.com/remix-run/react-router/pull/11513))
- Updated dependencies:
  - `@remix-run/router@1.16.1`

## 6.23.0

### Minor Changes

- Add a new `unstable_dataStrategy` configuration option ([#11098](https://github.com/remix-run/react-router/pull/11098))
  - This option allows Data Router applications to take control over the approach for executing route loaders and actions
  - The default implementation is today's behavior, to fetch all loaders in parallel, but this option allows users to implement more advanced data flows including Remix single-fetch, middleware/context APIs, automatic loader caching, and more

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.16.0`

## 6.22.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.15.3`

## 6.22.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.15.2`

## 6.22.1

### Patch Changes

- Fix encoding/decoding issues with pre-encoded dynamic parameter values ([#11199](https://github.com/remix-run/react-router/pull/11199))
- Updated dependencies:
  - `@remix-run/router@1.15.1`

## 6.22.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.15.0`

## 6.21.3

### Patch Changes

- Remove leftover `unstable_` prefix from `Blocker`/`BlockerFunction` types ([#11187](https://github.com/remix-run/react-router/pull/11187))

## 6.21.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.14.2`

## 6.21.1

### Patch Changes

- Fix bug with `route.lazy` not working correctly on initial SPA load when `v7_partialHydration` is specified ([#11121](https://github.com/remix-run/react-router/pull/11121))
- Updated dependencies:
  - `@remix-run/router@1.14.1`

## 6.21.0

### Minor Changes

- Add a new `future.v7_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. ([#11087](https://github.com/remix-run/react-router/pull/11087))

  This fix was originally added in [#10983](https://github.com/remix-run/react-router/issues/10983) and was later reverted in [#11078](https://github.com/remix-run/react-router/pull/11078) because it was determined that a large number of existing applications were relying on the buggy behavior (see [#11052](https://github.com/remix-run/react-router/issues/11052))

  **The Bug**
  The buggy behavior is that without this flag, the default behavior when resolving relative paths is to _ignore_ any splat (`*`) portion of the current route path.

  **The Background**
  This decision was originally made thinking that it would make the concept of nested different sections of your apps in `<Routes>` easier if relative routing would _replace_ the current splat:

  ```jsx
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard/*" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
  ```

  Any paths like `/dashboard`, `/dashboard/team`, `/dashboard/projects` will match the `Dashboard` route. The dashboard component itself can then render nested `<Routes>`:

  ```jsx
  function Dashboard() {
    return (
      <div>
        <h2>Dashboard</h2>
        <nav>
          <Link to="/">Dashboard Home</Link>
          <Link to="team">Team</Link>
          <Link to="projects">Projects</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="team" element={<DashboardTeam />} />
          <Route path="projects" element={<DashboardProjects />} />
        </Routes>
      </div>
    );
  }
  ```

  Now, all links and route paths are relative to the router above them. This makes code splitting and compartmentalizing your app really easy. You could render the `Dashboard` as its own independent app, or embed it into your large app without making any changes to it.

  **The Problem**

  The problem is that this concept of ignoring part of a path breaks a lot of other assumptions in React Router - namely that `"."` always means the current location pathname for that route. When we ignore the splat portion, we start getting invalid paths when using `"."`:

  ```jsx
  // If we are on URL /dashboard/team, and we want to link to /dashboard/team:
  function DashboardTeam() {
    // ❌ This is broken and results in <a href="/dashboard">
    return <Link to=".">A broken link to the Current URL</Link>;

    // ✅ This is fixed but super unintuitive since we're already at /dashboard/team!
    return <Link to="./team">A broken link to the Current URL</Link>;
  }
  ```

  We've also introduced an issue that we can no longer move our `DashboardTeam` component around our route hierarchy easily - since it behaves differently if we're underneath a non-splat route, such as `/dashboard/:widget`. Now, our `"."` links will, properly point to ourself _inclusive of the dynamic param value_ so behavior will break from it's corresponding usage in a `/dashboard/*` route.

  Even worse, consider a nested splat route configuration:

  ```jsx
  <BrowserRouter>
    <Routes>
      <Route path="dashboard">
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  </BrowserRouter>
  ```

  Now, a `<Link to=".">` and a `<Link to="..">` inside the `Dashboard` component go to the same place! That is definitely not correct!

  Another common issue arose in Data Routers (and Remix) where any `<Form>` should post to it's own route `action` if you the user doesn't specify a form action:

  ```jsx
  let router = createBrowserRouter({
    path: "/dashboard",
    children: [
      {
        path: "*",
        action: dashboardAction,
        Component() {
          // ❌ This form is broken!  It throws a 405 error when it submits because
          // it tries to submit to /dashboard (without the splat value) and the parent
          // `/dashboard` route doesn't have an action
          return <Form method="post">...</Form>;
        },
      },
    ],
  });
  ```

  This is just a compounded issue from the above because the default location for a `Form` to submit to is itself (`"."`) - and if we ignore the splat portion, that now resolves to the parent route.

  **The Solution**
  If you are leveraging this behavior, it's recommended to enable the future flag, move your splat to it's own route, and leverage `../` for any links to "sibling" pages:

  ```jsx
  <BrowserRouter>
    <Routes>
      <Route path="dashboard">
        <Route index path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  </BrowserRouter>

  function Dashboard() {
    return (
      <div>
        <h2>Dashboard</h2>
        <nav>
          <Link to="..">Dashboard Home</Link>
          <Link to="../team">Team</Link>
          <Link to="../projects">Projects</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="team" element={<DashboardTeam />} />
          <Route path="projects" element={<DashboardProjects />} />
        </Router>
      </div>
    );
  }
  ```

  This way, `.` means "the full current pathname for my route" in all cases (including static, dynamic, and splat routes) and `..` always means "my parents pathname".

### Patch Changes

- Properly handle falsy error values in ErrorBoundary's ([#11071](https://github.com/remix-run/react-router/pull/11071))
- Updated dependencies:
  - `@remix-run/router@1.14.0`

## 6.20.1

### Patch Changes

- Revert the `useResolvedPath` fix for splat routes due to a large number of applications that were relying on the buggy behavior (see <https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329>). We plan to re-introduce this fix behind a future flag in the next minor version. ([#11078](https://github.com/remix-run/react-router/pull/11078))
- Updated dependencies:
  - `@remix-run/router@1.13.1`

## 6.20.0

### Minor Changes

- Export the `PathParam` type from the public API ([#10719](https://github.com/remix-run/react-router/pull/10719))

### Patch Changes

- Fix bug with `resolveTo` in splat routes ([#11045](https://github.com/remix-run/react-router/pull/11045))
  - This is a follow up to [#10983](https://github.com/remix-run/react-router/pull/10983) to handle the few other code paths using `getPathContributingMatches`
  - This removes the `UNSAFE_getPathContributingMatches` export from `@remix-run/router` since we no longer need this in the `react-router`/`react-router-dom` layers
- Updated dependencies:
  - `@remix-run/router@1.13.0`

## 6.19.0

### Minor Changes

- Add `unstable_flushSync` option to `useNavigate`/`useSumbit`/`fetcher.load`/`fetcher.submit` to opt-out of `React.startTransition` and into `ReactDOM.flushSync` for state updates ([#11005](https://github.com/remix-run/react-router/pull/11005))
- Remove the `unstable_` prefix from the [`useBlocker`](https://reactrouter.com/v6/hooks/use-blocker) hook as it's been in use for enough time that we are confident in the API. We do not plan to remove the prefix from `unstable_usePrompt` due to differences in how browsers handle `window.confirm` that prevent React Router from guaranteeing consistent/correct behavior. ([#10991](https://github.com/remix-run/react-router/pull/10991))

### Patch Changes

- Fix `useActionData` so it returns proper contextual action data and not _any_ action data in the tree ([#11023](https://github.com/remix-run/react-router/pull/11023))

- Fix bug in `useResolvedPath` that would cause `useResolvedPath(".")` in a splat route to lose the splat portion of the URL path. ([#10983](https://github.com/remix-run/react-router/pull/10983))

  - ⚠️ This fixes a quite long-standing bug specifically for `"."` paths inside a splat route which incorrectly dropped the splat portion of the URL. If you are relative routing via `"."` inside a splat route in your application you should double check that your logic is not relying on this buggy behavior and update accordingly.

- Updated dependencies:
  - `@remix-run/router@1.12.0`

## 6.18.0

### Patch Changes

- Fix the `future` prop on `BrowserRouter`, `HashRouter` and `MemoryRouter` so that it accepts a `Partial<FutureConfig>` instead of requiring all flags to be included. ([#10962](https://github.com/remix-run/react-router/pull/10962))
- Updated dependencies:
  - `@remix-run/router@1.11.0`

## 6.17.0

### Patch Changes

- Fix `RouterProvider` `future` prop type to be a `Partial<FutureConfig>` so that not all flags must be specified ([#10900](https://github.com/remix-run/react-router/pull/10900))
- Updated dependencies:
  - `@remix-run/router@1.10.0`

## 6.16.0

### Minor Changes

- In order to move towards stricter TypeScript support in the future, we're aiming to replace current usages of `any` with `unknown` on exposed typings for user-provided data. To do this in Remix v2 without introducing breaking changes in React Router v6, we have added generics to a number of shared types. These continue to default to `any` in React Router and are overridden with `unknown` in Remix. In React Router v7 we plan to move these to `unknown` as a breaking change. ([#10843](https://github.com/remix-run/react-router/pull/10843))
  - `Location` now accepts a generic for the `location.state` value
  - `ActionFunctionArgs`/`ActionFunction`/`LoaderFunctionArgs`/`LoaderFunction` now accept a generic for the `context` parameter (only used in SSR usages via `createStaticHandler`)
  - The return type of `useMatches` (now exported as `UIMatch`) accepts generics for `match.data` and `match.handle` - both of which were already set to `unknown`
- Move the `@private` class export `ErrorResponse` to an `UNSAFE_ErrorResponseImpl` export since it is an implementation detail and there should be no construction of `ErrorResponse` instances in userland. This frees us up to export a `type ErrorResponse` which correlates to an instance of the class via `InstanceType`. Userland code should only ever be using `ErrorResponse` as a type and should be type-narrowing via `isRouteErrorResponse`. ([#10811](https://github.com/remix-run/react-router/pull/10811))
- Export `ShouldRevalidateFunctionArgs` interface ([#10797](https://github.com/remix-run/react-router/pull/10797))
- Removed private/internal APIs only required for the Remix v1 backwards compatibility layer and no longer needed in Remix v2 (`_isFetchActionRedirect`, `_hasFetcherDoneAnything`) ([#10715](https://github.com/remix-run/react-router/pull/10715))

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.9.0`

## 6.15.0

### Minor Changes

- Add's a new `redirectDocument()` function which allows users to specify that a redirect from a `loader`/`action` should trigger a document reload (via `window.location`) instead of attempting to navigate to the redirected location via React Router ([#10705](https://github.com/remix-run/react-router/pull/10705))

### Patch Changes

- Ensure `useRevalidator` is referentially stable across re-renders if revalidations are not actively occurring ([#10707](https://github.com/remix-run/react-router/pull/10707))
- Updated dependencies:
  - `@remix-run/router@1.8.0`

## 6.14.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.7.2`

## 6.14.1

### Patch Changes

- Fix loop in `unstable_useBlocker` when used with an unstable blocker function ([#10652](https://github.com/remix-run/react-router/pull/10652))
- Fix issues with reused blockers on subsequent navigations ([#10656](https://github.com/remix-run/react-router/pull/10656))
- Updated dependencies:
  - `@remix-run/router@1.7.1`

## 6.14.0

### Patch Changes

- Strip `basename` from locations provided to `unstable_useBlocker` functions to match `useLocation` ([#10573](https://github.com/remix-run/react-router/pull/10573))
- Fix `generatePath` when passed a numeric `0` value parameter ([#10612](https://github.com/remix-run/react-router/pull/10612))
- Fix `unstable_useBlocker` key issues in `StrictMode` ([#10573](https://github.com/remix-run/react-router/pull/10573))
- Fix `tsc --skipLibCheck:false` issues on React 17 ([#10622](https://github.com/remix-run/react-router/pull/10622))
- Upgrade `typescript` to 5.1 ([#10581](https://github.com/remix-run/react-router/pull/10581))
- Updated dependencies:
  - `@remix-run/router@1.7.0`

## 6.13.0

### Minor Changes

- Move [`React.startTransition`](https://react.dev/reference/react/startTransition) usage behind a [future flag](https://reactrouter.com/v6/guides/api-development-strategy) to avoid issues with existing incompatible `Suspense` usages. We recommend folks adopting this flag to be better compatible with React concurrent mode, but if you run into issues you can continue without the use of `startTransition` until v7. Issues usually boils down to creating net-new promises during the render cycle, so if you run into issues you should either lift your promise creation out of the render cycle or put it behind a `useMemo`. ([#10596](https://github.com/remix-run/react-router/pull/10596))

  Existing behavior will no longer include `React.startTransition`:

  ```jsx
  <BrowserRouter>
    <Routes>{/*...*/}</Routes>
  </BrowserRouter>

  <RouterProvider router={router} />
  ```

  If you wish to enable `React.startTransition`, pass the future flag to your component:

  ```jsx
  <BrowserRouter future={{ v7_startTransition: true }}>
    <Routes>{/*...*/}</Routes>
  </BrowserRouter>

  <RouterProvider router={router} future={{ v7_startTransition: true }}/>
  ```

### Patch Changes

- Work around webpack/terser `React.startTransition` minification bug in production mode ([#10588](https://github.com/remix-run/react-router/pull/10588))

## 6.12.1

> \[!WARNING]
> Please use version `6.13.0` or later instead of `6.12.1`. This version suffers from a `webpack`/`terser` minification issue resulting in invalid minified code in your resulting production bundles which can cause issues in your application. See [#10579](https://github.com/remix-run/react-router/issues/10579) for more details.

### Patch Changes

- Adjust feature detection of `React.startTransition` to fix webpack + react 17 compilation error ([#10569](https://github.com/remix-run/react-router/pull/10569))

## 6.12.0

### Minor Changes

- Wrap internal router state updates with `React.startTransition` if it exists ([#10438](https://github.com/remix-run/react-router/pull/10438))

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.6.3`

## 6.11.2

### Patch Changes

- Fix `basename` duplication in descendant `<Routes>` inside a `<RouterProvider>` ([#10492](https://github.com/remix-run/react-router/pull/10492))
- Updated dependencies:
  - `@remix-run/router@1.6.2`

## 6.11.1

### Patch Changes

- Fix usage of `Component` API within descendant `<Routes>` ([#10434](https://github.com/remix-run/react-router/pull/10434))
- Fix bug when calling `useNavigate` from `<Routes>` inside a `<RouterProvider>` ([#10432](https://github.com/remix-run/react-router/pull/10432))
- Fix usage of `<Navigate>` in strict mode when using a data router ([#10435](https://github.com/remix-run/react-router/pull/10435))
- Updated dependencies:
  - `@remix-run/router@1.6.1`

## 6.11.0

### Patch Changes

- Log loader/action errors to the console in dev for easier stack trace evaluation ([#10286](https://github.com/remix-run/react-router/pull/10286))
- Fix bug preventing rendering of descendant `<Routes>` when `RouterProvider` errors existed ([#10374](https://github.com/remix-run/react-router/pull/10374))
- Fix inadvertent re-renders when using `Component` instead of `element` on a route definition ([#10287](https://github.com/remix-run/react-router/pull/10287))
- Fix detection of `useNavigate` in the render cycle by setting the `activeRef` in a layout effect, allowing the `navigate` function to be passed to child components and called in a `useEffect` there. ([#10394](https://github.com/remix-run/react-router/pull/10394))
- Switched from `useSyncExternalStore` to `useState` for internal `@remix-run/router` router state syncing in `<RouterProvider>`. We found some [subtle bugs](https://codesandbox.io/s/use-sync-external-store-loop-9g7b81) where router state updates got propagated _before_ other normal `useState` updates, which could lead to footguns in `useEffect` calls. ([#10377](https://github.com/remix-run/react-router/pull/10377), [#10409](https://github.com/remix-run/react-router/pull/10409))
- Allow `useRevalidator()` to resolve a loader-driven error boundary scenario ([#10369](https://github.com/remix-run/react-router/pull/10369))
- Avoid unnecessary unsubscribe/resubscribes on router state changes ([#10409](https://github.com/remix-run/react-router/pull/10409))
- When using a `RouterProvider`, `useNavigate`/`useSubmit`/`fetcher.submit` are now stable across location changes, since we can handle relative routing via the `@remix-run/router` instance and get rid of our dependence on `useLocation()`. When using `BrowserRouter`, these hooks remain unstable across location changes because they still rely on `useLocation()`. ([#10336](https://github.com/remix-run/react-router/pull/10336))
- Updated dependencies:
  - `@remix-run/router@1.6.0`

## 6.10.0

### Minor Changes

- Added support for [**Future Flags**](https://reactrouter.com/v6/guides/api-development-strategy) in React Router. The first flag being introduced is `future.v7_normalizeFormMethod` which will normalize the exposed `useNavigation()/useFetcher()` `formMethod` fields as uppercase HTTP methods to align with the `fetch()` behavior. ([#10207](https://github.com/remix-run/react-router/pull/10207))

  - When `future.v7_normalizeFormMethod === false` (default v6 behavior),
    - `useNavigation().formMethod` is lowercase
    - `useFetcher().formMethod` is lowercase
  - When `future.v7_normalizeFormMethod === true`:
    - `useNavigation().formMethod` is uppercase
    - `useFetcher().formMethod` is uppercase

### Patch Changes

- Fix route ID generation when using Fragments in `createRoutesFromElements` ([#10193](https://github.com/remix-run/react-router/pull/10193))
- Updated dependencies:
  - `@remix-run/router@1.5.0`

## 6.9.0

### Minor Changes

- React Router now supports an alternative way to define your route `element` and `errorElement` fields as React Components instead of React Elements. You can instead pass a React Component to the new `Component` and `ErrorBoundary` fields if you choose. There is no functional difference between the two, so use whichever approach you prefer 😀. You shouldn't be defining both, but if you do `Component`/`ErrorBoundary` will "win". ([#10045](https://github.com/remix-run/react-router/pull/10045))

  **Example JSON Syntax**

  ```jsx
  // Both of these work the same:
  const elementRoutes = [{
    path: '/',
    element: <Home />,
    errorElement: <HomeError />,
  }]

  const componentRoutes = [{
    path: '/',
    Component: Home,
    ErrorBoundary: HomeError,
  }]

  function Home() { ... }
  function HomeError() { ... }
  ```

  **Example JSX Syntax**

  ```jsx
  // Both of these work the same:
  const elementRoutes = createRoutesFromElements(
    <Route path='/' element={<Home />} errorElement={<HomeError /> } />
  );

  const componentRoutes = createRoutesFromElements(
    <Route path='/' Component={Home} ErrorBoundary={HomeError} />
  );

  function Home() { ... }
  function HomeError() { ... }
  ```

- **Introducing Lazy Route Modules!** ([#10045](https://github.com/remix-run/react-router/pull/10045))

  In order to keep your application bundles small and support code-splitting of your routes, we've introduced a new `lazy()` route property. This is an async function that resolves the non-route-matching portions of your route definition (`loader`, `action`, `element`/`Component`, `errorElement`/`ErrorBoundary`, `shouldRevalidate`, `handle`).

  Lazy routes are resolved on initial load and during the `loading` or `submitting` phase of a navigation or fetcher call. You cannot lazily define route-matching properties (`path`, `index`, `children`) since we only execute your lazy route functions after we've matched known routes.

  Your `lazy` functions will typically return the result of a dynamic import.

  ```jsx
  // In this example, we assume most folks land on the homepage so we include that
  // in our critical-path bundle, but then we lazily load modules for /a and /b so
  // they don't load until the user navigates to those routes
  let routes = createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="a" lazy={() => import("./a")} />
      <Route path="b" lazy={() => import("./b")} />
    </Route>
  );
  ```

  Then in your lazy route modules, export the properties you want defined for the route:

  ```jsx
  export async function loader({ request }) {
    let data = await fetchData(request);
    return json(data);
  }

  // Export a `Component` directly instead of needing to create a React Element from it
  export function Component() {
    let data = useLoaderData();

    return (
      <>
        <h1>You made it!</h1>
        <p>{data}</p>
      </>
    );
  }

  // Export an `ErrorBoundary` directly instead of needing to create a React Element from it
  export function ErrorBoundary() {
    let error = useRouteError();
    return isRouteErrorResponse(error) ? (
      <h1>
        {error.status} {error.statusText}
      </h1>
    ) : (
      <h1>{error.message || error}</h1>
    );
  }
  ```

  An example of this in action can be found in the [`examples/lazy-loading-router-provider`](https://github.com/remix-run/react-router/tree/main/examples/lazy-loading-router-provider) directory of the repository.

  🙌 Huge thanks to @rossipedia for the [Initial Proposal](https://github.com/remix-run/react-router/discussions/9826) and [POC Implementation](https://github.com/remix-run/react-router/pull/9830).

- Updated dependencies:
  - `@remix-run/router@1.4.0`

### Patch Changes

- Fix `generatePath` incorrectly applying parameters in some cases ([#10078](https://github.com/remix-run/react-router/pull/10078))
- Improve memoization for context providers to avoid unnecessary re-renders ([#9983](https://github.com/remix-run/react-router/pull/9983))

## 6.8.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.3.3`

## 6.8.1

### Patch Changes

- Remove inaccurate console warning for POP navigations and update active blocker logic ([#10030](https://github.com/remix-run/react-router/pull/10030))
- Updated dependencies:
  - `@remix-run/router@1.3.2`

## 6.8.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.3.1`

## 6.7.0

### Minor Changes

- Add `unstable_useBlocker` hook for blocking navigations within the app's location origin ([#9709](https://github.com/remix-run/react-router/pull/9709))

### Patch Changes

- Fix `generatePath` when optional params are present ([#9764](https://github.com/remix-run/react-router/pull/9764))
- Update `<Await>` to accept `ReactNode` as children function return result ([#9896](https://github.com/remix-run/react-router/pull/9896))
- Updated dependencies:
  - `@remix-run/router@1.3.0`

## 6.6.2

### Patch Changes

- Ensure `useId` consistency during SSR ([#9805](https://github.com/remix-run/react-router/pull/9805))

## 6.6.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.2.1`

## 6.6.0

### Patch Changes

- Prevent `useLoaderData` usage in `errorElement` ([#9735](https://github.com/remix-run/react-router/pull/9735))
- Updated dependencies:
  - `@remix-run/router@1.2.0`

## 6.5.0

This release introduces support for [Optional Route Segments](https://github.com/remix-run/react-router/issues/9546). Now, adding a `?` to the end of any path segment will make that entire segment optional. This works for both static segments and dynamic parameters.

**Optional Params Examples**

- `<Route path=":lang?/about>` will match:
  - `/:lang/about`
  - `/about`
- `<Route path="/multistep/:widget1?/widget2?/widget3?">` will match:
  - `/multistep`
  - `/multistep/:widget1`
  - `/multistep/:widget1/:widget2`
  - `/multistep/:widget1/:widget2/:widget3`

**Optional Static Segment Example**

- `<Route path="/home?">` will match:
  - `/`
  - `/home`
- `<Route path="/fr?/about">` will match:
  - `/about`
  - `/fr/about`

### Minor Changes

- Allows optional routes and optional static segments ([#9650](https://github.com/remix-run/react-router/pull/9650))

### Patch Changes

- Stop incorrectly matching on partial named parameters, i.e. `<Route path="prefix-:param">`, to align with how splat parameters work. If you were previously relying on this behavior then it's recommended to extract the static portion of the path at the `useParams` call site: ([#9506](https://github.com/remix-run/react-router/pull/9506))

```jsx
// Old behavior at URL /prefix-123
<Route path="prefix-:id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: '123' }
  let id = params.id; // "123"
  ...
}

// New behavior at URL /prefix-123
<Route path=":id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: 'prefix-123' }
  let id = params.id.replace(/^prefix-/, ''); // "123"
  ...
}
```

- Updated dependencies:
  - `@remix-run/router@1.1.0`

## 6.4.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.0.5`

## 6.4.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.0.4`

## 6.4.3

### Patch Changes

- `useRoutes` should be able to return `null` when passing `locationArg` ([#9485](https://github.com/remix-run/react-router/pull/9485))
- fix `initialEntries` type in `createMemoryRouter` ([#9498](https://github.com/remix-run/react-router/pull/9498))
- Updated dependencies:
  - `@remix-run/router@1.0.3`

## 6.4.2

### Patch Changes

- Fix `IndexRouteObject` and `NonIndexRouteObject` types to make `hasErrorElement` optional ([#9394](https://github.com/remix-run/react-router/pull/9394))
- Enhance console error messages for invalid usage of data router hooks ([#9311](https://github.com/remix-run/react-router/pull/9311))
- If an index route has children, it will result in a runtime error. We have strengthened our `RouteObject`/`RouteProps` types to surface the error in TypeScript. ([#9366](https://github.com/remix-run/react-router/pull/9366))
- Updated dependencies:
  - `@remix-run/router@1.0.2`

## 6.4.1

### Patch Changes

- Preserve state from `initialEntries` ([#9288](https://github.com/remix-run/react-router/pull/9288))
- Updated dependencies:
  - `@remix-run/router@1.0.1`

## 6.4.0

Whoa this is a big one! `6.4.0` brings all the data loading and mutation APIs over from Remix. Here's a quick high level overview, but it's recommended you go check out the [docs](https://reactrouter.com), especially the [feature overview](https://reactrouter.com/en/6.4.0/start/overview) and the [tutorial](https://reactrouter.com/en/6.4.0/start/tutorial).

**New APIs**

- Create your router with `createMemoryRouter`
- Render your router with `<RouterProvider>`
- Load data with a Route `loader` and mutate with a Route `action`
- Handle errors with Route `errorElement`
- Defer non-critical data with `defer` and `Await`

**Bug Fixes**

- Path resolution is now trailing slash agnostic (#8861)
- `useLocation` returns the scoped location inside a `<Routes location>` component (#9094)

**Updated Dependencies**

- `@remix-run/router@1.0.0`
