---
title: Application-Controlled Route Discovery
unstable: true
---

# Application-Controlled Route Discovery

[MODES: framework]

<docs-warning>This API is unstable and may change without a major release. It supports conventional Framework Mode; RSC modes are not supported.</docs-warning>

Enable the future flag in `react-router.config.ts`:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  future: { unstable_customRouteDiscovery: true },
} satisfies Config;
```

Without this flag, React Router keeps its existing discovery implementation and the hook is unavailable. The flag supports conventional Framework Mode only.

Keep `routeDiscovery.mode: "lazy"` (the default for SSR) and use `unstable_useRouteDiscovery` to choose when to discover destinations or load the complete route manifest:

```tsx
import { unstable_useRouteDiscovery } from "react-router";

function Checkout() {
  let { state, discoverRoutes, loadAllRoutes } =
    unstable_useRouteDiscovery();

  async function prepareCheckout() {
    let result = await discoverRoutes([
      "/checkout/shipping",
      "/checkout/billing",
    ]);
    if (result.type === "version-mismatch") {
      // Offer to save drafts and refresh the document.
    }
  }

  return (
    <>
      <button onClick={prepareCheckout}>
        Prepare checkout
      </button>
      <button
        disabled={state === "loading"}
        onClick={() => loadAllRoutes().catch(console.error)}
      >
        Load all route metadata
      </button>
    </>
  );
}
```

Discovery only loads route metadata. It does not navigate, run loaders/actions, or prefetch route modules and stylesheets.

Incremental discovery uses the initialized [`HydratedRouter unstable_fetch`](./custom-fetch) implementation with `{ type: "manifest" }` context, including eager, navigation, fetcher, and imperative requests. In API-only Mode, it also honors `unstable_apiServerOrigin`; discovered routes retain their server loaders/actions. `loadAllRoutes()` imports a versioned static asset, so that download does not pass through custom fetch.

## Completing discovery

`loadAllRoutes()` loads the running client's versioned manifest asset. The shared `state` moves from `partial` to `loading` to `complete`. Concurrent calls share a load, and calls after completion resolve immediately. Failures reject and return the state to `partial`; applications can catch the error and choose whether to reload.

Completion merges missing routes into the running router and stops further incremental discovery. The exposed `version` remains the version of the running client. With `routeDiscovery.mode: "initial"`, SPA Mode, or development's full manifest, the state is already `complete` and the operations are successful no-ops.

Retain the client's versioned manifest **and its referenced assets** for as long as that client is supported. Server routing and loader/action contracts must also remain compatible. Loading build A's manifest does not make an incompatible build B backend safe for build A's client.

## Selective discovery

`discoverRoutes(paths, { signal })` accepts application-root paths beginning with `/`. React Router applies the configured `basename` and ignores query strings and hashes. Relative paths and external URLs are not supported.

Paths are batched within the manifest request URL limit and previously discovered paths are skipped. An individually oversized path produces a warning and is omitted without being cached; other paths are still discovered. Selective discovery leaves the shared state `partial`.

The result is `{ type: "success" }`, `{ type: "version-mismatch" }`, or `{ type: "aborted" }`. Success does not guarantee that each pathname matches a route. Actual request and handler failures reject. An imperative mismatch does not automatically reload the document. Aborting a caller does not abort a full-manifest load or mismatch recovery shared with other operations.

## Handling discovery and manifest mismatches

```tsx
unstable_useRouteDiscovery({
  onBeforeDiscovery: async ({ source, loadAllRoutes }) => {
    if (source === "navigation" || source === "fetcher") {
      await loadAllRoutes();
    }
  },
  onManifestMismatch: async ({ loadAllRoutes }) => {
    await loadAllRoutes();
  },
});
```

`onBeforeDiscovery` runs when an incremental request would otherwise occur, after cache and request-size checks. The `source` is `eager`, `navigation`, `fetcher`, or `imperative`. Completing the tree skips that request. A full-manifest failure falls back to incremental discovery and reports through `<HydratedRouter onError>` when provided, without rendering an error boundary. The load promise remains catchable by the handler.

`onManifestMismatch` additionally receives `defaultBehavior()` and `reloadUrl`: the navigation destination, the current document URL for a fetcher, or `null` for eager/imperative discovery. A mismatch indicates different versions, not which version is newer.

After mismatch handlers settle, surviving operations continue only if the tree is complete. Otherwise navigations and fetchers are canceled and their pending state settles. Router-managed Back/Forward cancellations restore the prior history position. Later completion does not replay a canceled navigation or submission. Full-manifest load failures do not render error boundaries; unrelated handler exceptions use normal discovery error handling.

Canceling a navigation also cancels its pending revalidation. Both return to idle, the revalidation promise resolves, and the current page and data remain in place without another loader pass. Interrupted fetcher loads settle with their existing data; independent requests continue. If an action already changed server data, the displayed data may remain stale until a later navigation or explicit revalidation.

Back/Forward restoration supports a single pending traversal, using the same approach as navigation blockers. If additional browser Back/Forward presses overlap the restoration, the URL and displayed route may get out of sync, or a queued traversal may navigate to another route. Preserving the current screen and its unsaved state is not guaranteed in that case.

Concurrent mismatches share one pending custom handler chain. Its `source` and `reloadUrl` describe the initiating request, while each participant retains its own destination and cancellation signal. Handlers may await a user decision. A later mismatch can start another chain after the previous one settles.

## Temporary overrides

Custom callbacks override the corresponding built-in callback. Registering only `onBeforeDiscovery` does not suppress default mismatch recovery, and calling the hook without handlers does not override anything. Removing the last custom mismatch handler restores automatic recovery.

Call `event.defaultBehavior()` to explicitly run built-in recovery: eager mismatches warn, navigation mismatches reload the destination, fetcher mismatches reload the current document, and imperative mismatches return without reloading. Repeated calls for one shared mismatch event reuse the same promise. It does not invoke other custom handlers or stop their propagation.

```tsx
unstable_useRouteDiscovery({
  async onManifestMismatch(event) {
    if (hasUnsavedChanges) {
      event.stopPropagation();
      setShowReloadDialog(true);
      return;
    }
    await event.defaultBehavior();
  },
});
```

Custom handlers run in reverse registration order, with each awaited before the next. `stopPropagation()` prevents earlier handlers from running; it does not complete discovery or allow an operation to continue against an incomplete tree.

```tsx
unstable_useRouteDiscovery({
  onManifestMismatch(event) {
    if (hasUnsavedChanges) {
      event.stopPropagation();
      setShowReloadDialog(true);
    }
  },
});
```

An editor mounted after a root recovery handler can use this to preserve a draft. Unmounting removes its registration and reveals earlier handlers. Callback updates preserve registration priority. This is registration order, not a guarantee that the deepest component runs first.

Eager discovery waits for the initialized route tree to commit so a root handler can intercept the first request. It does not wait for every suspended descendant or guarantee an idle main thread. Discovery needed before handlers can mount retains normal lazy behavior.

Without mismatch handlers, existing automatic recovery for eager/navigation/fetcher discovery remains unchanged. Deployment polling and staleness policy remain application-owned.
