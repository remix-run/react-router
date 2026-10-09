Add `ssr: "unstable_api-only"` to generate a static client build backed by server loaders and actions

- API-only builds continue to support client-side navigation and server data requests while not handling document requests in production.
- Default API-only builds to lazy route discovery.
- Without configured prerender routes, this produces a "SPA mode" `index.html`
- With prerendering enabled you can prerender a set of routes for faster initial document loads while still hitting an API server for navigations
- Preserve server-only route exports in additional Vite server environments in both API-only and SSR modes.
- Serve the generated SPA fallback for non-prerendered document requests in API-only Vite previews while retaining live data requests and route discovery.
