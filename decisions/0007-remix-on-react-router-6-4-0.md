# Layering Remix on top of React Router 6.4

Date: 2022-08-16

Status: accepted

## Context

Now that we're almost done [Remixing React Router][remixing-react-router] and will be shipping `react-router@6.4.0` shortly, it's time for us to start thinking about how we can layer Remix on top of the latest React Router. This will allow us to delete a _bunch_ of code from Remix for handling the Data APIs. This document aims to discuss the changes we foresee making and some potential iterative implementation approaches to avoid a big-bang merge.

From an iterative-release viewpoint, there's 4 separate "functional" aspects to consider here:

1. Server data loading
2. Server react component rendering
3. Client hydration
4. Client data loading

(1) can be implemented and deployed in isolation. (2) and (3) need to happen together since the contexts/components need to match. And (4) comes for free since the loaders/actions will be included on the routes we create in (3).

## Decision

The high level approach is as follows

1.  SSR data loading
    1.  Update `handleResourceRequest` to use `createStaticHandler` behind a flag
        1.  Aim to get unit and integration tests asserting both flows if possible
    2.  Update `handleDataRequest` in the same manner
    3.  Update `handleDocumentRequest` in the same manner
        1.  Confirm unit and integration tests are all passing
    4.  Write new `RemixContext` data into `EntryContext` and remove old flow
2.  Deploy `@remix-run/server-runtime` changes once comfortable
3.  Handle `@remix-run/react` in a short-lived feature branch
    1.  server render without hydration (replace `EntryContext` with `RemixContext`)
    2.  client-side hydration
    3.  add backwards compatibility changes
4.  Deploy `@remix-run/react` changes once comfortable

## Details

There are 2 main areas where we have to make changes:

1. Handling server-side requests in `@remix-run/server-runtime` (mainly in the `server.ts` file)
2. Handling client-side hydration + routing in `@remix-run/react` (mainly in the `components.ts`, `server.ts` and `browser.ts` files)

Since these are separated by the network chasm, we can actually implement these independent of one another for smaller merges, iterative development, and easier rollbacks should something go wrong.

### Do the server data-fetching migration first

There's two primary reasons it makes sense to handle the server-side data-fetching logic first:

1. It's a smaller surface area change since there's effectively only 1 new API to work with in `createStaticHandler`
2. It's easier to implement in a feature-flagged manner since we're on the server and bundle size is not a concern

We can do this on the server using the [strangler pattern][strangler-pattern] so that we can confirm the new approach is functionally equivalent to the old approach. Depending on how far we take it, we can assert this through unit tests, integration tests, as well as run-time feature flags if desired.

For example, pseudo code for this might look like the following, where we enable via a flag during local development and potentially unit/integration tests. We can throw exceptions anytime the new static handler results in different SSR data. Once we're confident, we delete the current code and remove the flag conditional.

```tsx
// Runtime-agnostic flag to enable behavior, will always be committed as
// `false` initially, and toggled to true during local dev
const ENABLE_REMIX_ROUTER = false;

async function handleDocumentRequest({ request }) {
  const appState = {
    trackBoundaries: true,
    trackCatchBoundaries: true,
    catchBoundaryRouteId: null,
    renderBoundaryRouteId: null,
    loaderBoundaryRouteId: null,
    error: undefined,
    catch: undefined,
  };

  // ... do all the current stuff

  const serverHandoff = {
    actionData,
    appState: appState,
    matches: entryMatches,
    routeData,
  };

  const entryContext = {
    ...serverHandoff,
    manifest: build.assets,
    routeModules,
    serverHandoffString: createServerHandoffString(serverHandoff),
  };

  // If the flag is enabled, process the request again with the new static
  // handler and confirm we get the same data on the other side
  if (ENABLE_REMIX_ROUTER) {
    const staticHandler = unstable_createStaticHandler(routes);
    const context = await staticHandler.query(request);

    // Note: == only used for brevity ;)
    assert(entryContext.matches === context.matches);
    assert(entryContext.routeData === context.loaderData);
    assert(entryContext.actionData === context.actionData);

    if (catchBoundaryRouteId) {
      assert(appState.catch === context.errors[catchBoundaryRouteId]);
    }

    if (loaderBoundaryRouteId) {
      assert(appState.error === context.errors[loaderBoundaryRouteId]);
    }
  }
}
```

We can also split this into iterative approaches on the server too, and do `handleResourceRequest`, `handleDataRequest`, and `handleDocumentRequest` independently (either just implementation or implementation + release). Doing them in that order would also likely go from least to most complex.

#### Notes

- This can't use `process.env` since the code we're changing is runtime agnostic. We'll go with a local hardcoded variable in `server.ts` for now to avoid runtime-specific ENV variable concerns.
  - Unit and integration tests may need to have their own copies of this variable as well to remain passing. For example, we have unit tests that assert that a loader is called once for a given route - but when this flag is enabled, that loader will be called twice so we can set up a conditional assertion based on the flag.
- The `remixContext` sent through `entry.server.ts` will be altered in shape. We consider this an opaque API so not a breaking change.

#### Implementation approach

1. Use `createHierarchicalRoutes` to build RR `DataRouteObject` instances
   1. See `createStaticHandlerDataRoutes` in the `brophdawg11/rrr` branch
2. Create a static handler per-request using `unstable_createStaticHandler`
3. `handleResourceRequest`
   1. This one should be _really_ simple since it should just send back the raw `Response` from `queryRoute`
4. `handleDataRequest`
   1. This is only slightly more complicated than resource routes, as it needs to handle serializing errors and processing redirects into 204 Responses for the client
5. `handleDocumentRequest`
   1. This is the big one. It simplifies down pretty far, but has the biggest surface area where some things don't quite match up
   2. We need to map query "errors" to Remix's definition of error/catch and bubble them upwards accordingly.
      1. For example, in a URL like `/a/b/c`, if C exports a `CatchBoundary` but not an `ErrorBoundary`, then it'll be represented in the `DataRouteObject` with `hasErrorBoundary=true` since the `@remix-run/router` doesn't distinguish
      2. If C's loader throws an error, the router will "catch" that at C's `errorElement`, but we then need to re-bubble that upwards to the nearest `ErrorBoundary`
      3. See `differentiateCatchVersusErrorBoundaries` in the `brophdawg11/rrr` branch
   3. New `RemixContext`
      1. `manifest`, `routeModules`, `staticHandlerContext`, `serverHandoffString`
      2. Create this alongside `EntryContext` assert the values match
   4. If we catch an error during render, we'll have tracked the boundaries on `staticHandlerContext` and can use `getStaticContextFromError` to get a new context for the second pass (note the need to re-call `differentiateCatchVersusErrorBoundaries`)

### Do the UI rendering layer second

The rendering layer in `@remix-run/react` is a bit more of a whole-sale replacement and comes with backwards-compatibility concerns, so it makes sense to do second. However, we can still do this iteratively, we just can't deploy iteratively since the SSR and client HTML need to stay synced (and associated hooks need to read from the same contexts). First, we can focus on getting the SSR document rendered properly without `<Scripts/>`. Then second we'll add in client-side hydration.

The main changes here include:

- Removal of `RemixEntry` and it's context in favor of a new `RemixContext.Provider` wrapping `DataStaticRouter`/`DataBrowserRouter`
  - All this context needs is the remix-specific aspects (`manifest`, `routeModules`)
  - Everything else from the old RemixEntryContext is now in the router contexts (and `staticHandlerContext` during SSR)
- Some aspects of `@remix-run/react`'s `components.tsx` file are now fully redundant and can be removed completely in favor of re-exporting from `react-router-dom`:
  - `Form`, `useFormAction`, `useSubmit`, `useMatches`, `useFetchers`
- Other aspects are largely redundant but need some Remix-specific things, so these will require some adjustments:
  - `Link`, `useLoaderData`, `useActionData`, `useTransition`, `useFetcher`

#### Backwards Compatibility Notes

- `useLoaderData`/`useActionData` need to retain their generics, and are not currently generic in `react-router`
- `useTransition` needs `submission` and `type` added
  - `<Form method="get">` no longer goes into a "submitting" state in `react-router-dom`
- `useFetcher` needs `type` added
- `unstable_shouldReload` replaced by `shouldRevalidate`
  - Can we use it if it's there but prefer `shouldRevalidate`?
- Distinction between error and catch boundaries
- `Request.signal` - continue to send separate `signal` param

[remixing-react-router]: https://remix.run/blog/remixing-react-router
[strangler-pattern]: https://martinfowler.com/bliki/StranglerFigApplication.html
