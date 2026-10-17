#### View Transition Deprecations

React Router's view transition APIs are now marked deprecated in favor of React's [`<ViewTransition>`](https://react.dev/reference/react/ViewTransition) component, available in React 19.3+. The existing APIs will continue to work for the duration of React Router v8 and will be removed in v9.

To use `<ViewTransition>`, wrap it around an `<Outlet>` in a persistent layout:

```tsx
import { ViewTransition } from "react";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <ViewTransition>
      <Outlet />
    </ViewTransition>
  );
}
```

When migrating, remove the `viewTransition` props/options and replace `useViewTransitionState`, `NavLink`'s `isTransitioning`, and `.transitioning` styles with React's View Transition classes. Note using `<ViewTransition>` requires React transitions be enabled, so do not set `useTransitions={false}` on your router component. See the [migration guide](https://reactrouter.com/how-to/view-transitions) for examples and compatibility considerations.

#### API-only Mode (unstable)

Framework Mode can now serve static HTML while retaining a runtime server for loaders, actions, revalidation, and lazy route discovery. This allows you to deploy your static HTML files to a CDN on one origin while having them hit server loader/actions on a runtime server potentially on another origin.

Enable API-only Mode in `react-router.config.ts`:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: "unstable_api-only",
  // Optionally serve complete HTML for selected paths:
  prerender: ["/", "/about"],
} satisfies Config;
```

If you are running your API server on a separate origin, set `unstable_apiServerOrigin` in your config to route API calls to the proper origin (and ensure you configure CORS and `allowedActionOrigins` appropriately). See [Rendering Strategies](https://reactrouter.com/start/framework/rendering#api-only-mode-unstable) for deployment details.

#### Custom Fetch and Request Metadata (unstable)

In Framework Mode, pass `unstable_fetch` to `<HydratedRouter>` in `app/entry.client.tsx` to customize JavaScript-issued server data and route discovery requests:

```tsx
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter, type unstable_RouterFetch } from "react-router/dom";

const customFetch: unstable_RouterFetch = (request, context) => {
  let headers = new Headers(request.headers);
  headers.set("X-App-Request-Type", context.type);
  return fetch(request, { headers });
};

hydrateRoot(document, <HydratedRouter unstable_fetch={customFetch} />);
```

The callback receives a constructed `Request` and context identifying initialization, navigation, fetcher, revalidation, or manifest requests. Navigation-initiated data requests also include `navigationType` (`"PUSH"`, `"REPLACE"`, or `"POP"`). Data Mode data strategies receive equivalent metadata through `unstable_initiator` and `unstable_navigationType`. See [Custom Fetch](https://reactrouter.com/how-to/custom-fetch) and [Data Strategy](https://reactrouter.com/how-to/data-strategy#request-metadata-unstable) for more information.

#### Application-Controlled Route Discovery (unstable)

In Framework Mode, enable `future.unstable_customRouteDiscovery` to discover selected destinations or complete the running client's route manifest:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  future: { unstable_customRouteDiscovery: true },
} satisfies Config;
```

```tsx
import { Outlet, unstable_useRouteDiscovery } from "react-router";

function Layout() {
  unstable_useRouteDiscovery({
    async onManifestMismatch(event) {
      await event.loadAllRoutes();
    },
  });
  return <Outlet />;
}
```

The hook exposes `discoverRoutes(paths)`, `loadAllRoutes()`, and a shared `state` (`"partial"`, `"loading"`, or `"complete"`). Discovery loads route metadata without navigating, running loaders/actions, or prefetching route modules. With lazy discovery, custom mismatch handlers can load the running client's full manifest or let the pending operation cancel while preserving the current screen and data. See [Application-Controlled Route Discovery](https://reactrouter.com/how-to/route-discovery) for cancellation and recovery details.
