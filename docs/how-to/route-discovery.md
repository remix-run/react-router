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

Keep `routeDiscovery.mode: "lazy"` (the default for SSR) and use `unstable_useRouteDiscovery` to choose when to discover destinations or load the complete route manifest.

```tsx
let { state, discoverRoutes, loadAllRoutes } =
  unstable_useRouteDiscovery({
    onManifestMismatch: async (event) => {
      // Handle mismatch, potentially by loading the entire manifest
      await loadAllRoutes();
    },
  });

// state: "partial" | "loading" | "complete"

// Eagerly discover specific paths
let result = await discoverRoutes(paths);
```

## Imperative Route Discovery

You can control route discovery through `discoverRoutes()` without having to render links/forms on the page - this allows you to eagerly discover routes that are not directly linked from the current UI. Note that discovery only loads route metadata - it does not navigate, run loaders/actions, or prefetch route modules/stylesheets. Paths are batched within the manifest request URL limit and previously discovered paths are skipped.

`discoverRoutes(paths, { signal })` accepts application-root paths beginning with `/`. React Router applies the configured `basename` and ignores query strings and hashes. Relative paths and external URLs are not supported.

The result is `{ type: "success" }`, `{ type: "version-mismatch" }`, or `{ type: "aborted" }`. Success means the discovery operation completed successfully; it does not guarantee that a request was sent or that each pathname matches a route. Cached paths need no request, and a concurrent full-manifest load can supersede an incremental request failure. Unrecovered request failures and unrelated handler errors reject. Imperative mismatches do not automatically trigger a reload.

For example, the cart's checkout link automatically discovers the shipping route. Use the hook to discover later checkout steps when the cart mounts, even though those steps aren't linked from the cart:

```tsx
import { useEffect } from "react";
import {
  Link,
  unstable_useRouteDiscovery,
} from "react-router";

function Cart() {
  let { discoverRoutes } = unstable_useRouteDiscovery();

  useEffect(() => {
    let controller = new AbortController();

    discoverRoutes(
      ["/checkout/billing", "/checkout/review"],
      { signal: controller.signal },
    ).catch(console.error);

    return () => controller.abort();
  }, [discoverRoutes]);

  return (
    <>
      {/* Render cart items and totals here. */}
      <Link to="/checkout/shipping">
        Proceed to checkout
      </Link>
    </>
  );
}
```

## Completing discovery

`loadAllRoutes()` loads the running client's versioned manifest asset to complete its route tree, even if that client is stale. This merges all missing routes into the running router and thus prevents further incremental discovery. The exposed `version` remains the version of the running client. With `routeDiscovery.mode: "initial"`, SPA Mode, or development's full manifest, the state is already `complete` and the operations are successful no-ops.

The shared `state` moves from `partial` to `loading` to `complete`. Concurrent calls share a load, and calls after completion resolve immediately. Failures reject and return the state to `partial`; applications can catch the error and choose whether to reload.

Retain the client's versioned manifest **and its referenced assets** for as long as that client is supported. Server routing and loader/action contracts must also remain compatible. Loading build A's manifest does not make an incompatible build B backend safe for build A's client.

## Handling manifest mismatches

You can provide custom handling for manifest version mismatches to avoid hard reloads, giving you a chance to complete the route tree, or cancel the navigation and provide a prompt for the user to reload (see below). A mismatch indicates different versions, not which version is newer.

```tsx
unstable_useRouteDiscovery({
  onManifestMismatch: async (event) => {
    await event.loadAllRoutes();
  },
});
```

After mismatch handlers settle, surviving operations continue only if the tree is complete. Otherwise navigations and fetchers are canceled and their pending state settles. Canceling a navigation also cancels any pending revalidation - both return to idle and the current page and data remain in place without another loader pass. Similarly, interrupted fetcher loads settle with their existing data. If an action already changed server data, the displayed data may remain stale until a later navigation or explicit revalidation.

Router-managed Back/Forward cancellations restore the prior history position. Additional browser Back/Forward presses during restoration can leave the URL and rendered route out of sync or navigate to another entry; preserving the current screen is not guaranteed in that case.

Full-manifest load failures remain catchable and do not render route error boundaries, whether the handler calls `event.loadAllRoutes()` or the function returned by the hook. Uncaught full-load failures are reported through `<HydratedRouter onError>` or `console.error`, and the incomplete operation is canceled. Unrelated handler errors follow normal discovery error handling.

## Temporary overrides

Custom mismatch handlers override built-in recovery. Calling the hook without a handler does not override anything. Removing the last custom mismatch handler restores automatic recovery.

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
